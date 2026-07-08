// 🔗 RefHub — Sync โน้ตขึ้น Notion จริง (Vercel serverless function)
// ไฟล์นี้วางไว้ที่ /api/notion-sync.js ที่ root ของโปรเจกต์ (ข้างๆ src/) — Vercel จะจับเป็น endpoint /api/notion-sync ให้อัตโนมัติ
//
// ก่อนใช้งานต้องทำ 3 ขั้นตอนนี้ก่อน:
// 1) ไปที่ https://www.notion.so/my-integrations สร้าง Integration ใหม่ (New integration) จะได้ "Internal Integration Secret"
//    เอาค่านั้นมาตั้งเป็น Environment Variable ชื่อ NOTION_TOKEN บน Vercel
// 2) สร้าง Database ใน Notion สำหรับเก็บโน้ต ต้องมีคอลัมน์อย่างน้อยตามนี้ (ชื่อคอลัมน์ต้องตรงเป๊ะ):
//    - "Name"   -> type: Title (คอลัมน์หลักที่ทุก database มีอยู่แล้ว เปลี่ยนชื่อเป็น Name ได้เลย)
//    - "Tags"   -> type: Multi-select
//    - "Pinned" -> type: Checkbox
//    - "Date"   -> type: Date
// 3) เปิดหน้า database นั้น กด "..." มุมขวาบน > Connections > เชื่อม Integration ที่สร้างไว้ในข้อ 1
//    แล้ว copy Database ID จาก URL (ส่วนตัวเลข/ตัวอักษรยาวๆ ก่อนเครื่องหมาย ? ใน URL ของหน้า database)
//    เอามาตั้งเป็น Environment Variable ชื่อ NOTION_DATABASE_ID บน Vercel
//
// ⚠️ ข้อจำกัดของเวอร์ชันนี้ (MVP): sync ได้ทางเดียว (แอป -> Notion) และ sync เฉพาะโน้ตที่ยังไม่เคยส่งไปเท่านั้น
// (เช็คจาก field notionId ที่ frontend เก็บไว้ในตัวโน้ตหลัง sync สำเร็จ) ถ้าแก้ไขโน้ตหลัง sync แล้ว เนื้อหาใน Notion จะไม่อัปเดตตาม
// ต้องการฟีเจอร์ update เนื้อหาเดิมใน Notion ด้วย บอกได้ ทำเพิ่มให้ทีหลังได้
// Notion จำกัดสูงสุด 100 blocks ต่อการสร้างหน้าหนึ่งครั้ง และ 2000 ตัวอักษรต่อ rich_text หนึ่งก้อน — โค้ดด้านล่างตัดให้พอดี

const richText = (text) => [{ type: "text", text: { content: String(text || "").slice(0, 1900) } }];

// แปลง block ของ editor (BlockNote) ให้เป็น block ของ Notion API
function blockToNotion(b) {
  const text = Array.isArray(b.content) ? b.content.map((c) => c.text || "").join("") : (typeof b.content === "string" ? b.content : "");
  if (b.type === "heading") {
    const lvl = Math.min(Math.max(b.props?.level || 2, 1), 3);
    return { object: "block", type: `heading_${lvl}`, [`heading_${lvl}`]: { rich_text: richText(text) } };
  }
  if (b.type === "bulletListItem") return { object: "block", type: "bulleted_list_item", bulleted_list_item: { rich_text: richText(text) } };
  if (b.type === "numberedListItem") return { object: "block", type: "numbered_list_item", numbered_list_item: { rich_text: richText(text) } };
  if (b.type === "checkListItem") return { object: "block", type: "to_do", to_do: { rich_text: richText(text), checked: !!b.props?.checked } };
  if (b.type === "toggleListItem") return { object: "block", type: "toggle", toggle: { rich_text: richText(text) } };
  if (b.type === "image" && b.props?.url) return { object: "block", type: "image", image: { type: "external", external: { url: b.props.url } } };
  if (b.type === "file" && b.props?.url) return { object: "block", type: "file", file: { type: "external", external: { url: b.props.url }, caption: richText(b.props?.name || "") } };
  return { object: "block", type: "paragraph", paragraph: { rich_text: richText(text) } };
}
const migrateBody = (body) => {
  if (Array.isArray(body) && body.length) return body;
  if (typeof body === "string" && body) return [{ type: "paragraph", content: body }];
  return [];
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { notes } = req.body || {};
  const token = process.env.NOTION_TOKEN;
  const dbId = process.env.NOTION_DATABASE_ID;

  if (!token || !dbId) {
    return res.status(500).json({ error: "ยังไม่ได้ตั้งค่า NOTION_TOKEN หรือ NOTION_DATABASE_ID บน Vercel (ดูขั้นตอนที่คอมเมนต์ด้านบนไฟล์นี้)" });
  }
  if (!Array.isArray(notes) || notes.length === 0) {
    return res.status(400).json({ error: "ไม่มีโน้ตส่งมา" });
  }

  const results = [];
  for (const n of notes) {
    try {
      const children = migrateBody(n.body).map(blockToNotion).slice(0, 100); // Notion จำกัด 100 blocks/ครั้ง
      const r = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parent: { database_id: dbId },
          properties: {
            Name: { title: [{ text: { content: n.title || "(ไม่มีหัวข้อ)" } }] },
            Tags: { multi_select: (n.tags || []).map((tag) => ({ name: String(tag).slice(0, 100) })) },
            Pinned: { checkbox: !!n.pinned },
            Date: { date: { start: n.date } },
          },
          children,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        results.push({ id: n.id, ok: false, error: data?.message || "Notion API error" });
        continue;
      }
      results.push({ id: n.id, ok: true, notionId: data.id });
    } catch (e) {
      results.push({ id: n.id, ok: false, error: e.message });
    }
  }

  return res.status(200).json({ results });
}
