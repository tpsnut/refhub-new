// 🤖 RefHub — AI Mentor จริง (Vercel serverless function)
// ไฟล์นี้วางไว้ที่ /api/chat.js ที่ root ของโปรเจกต์ (ข้างๆ src/) — Vercel จะจับเป็น endpoint /api/chat ให้อัตโนมัติ
// ต้องตั้งค่า Environment Variable ชื่อ ANTHROPIC_API_KEY บน Vercel ก่อน (Project Settings > Environment Variables)
// ห้ามใส่ VITE_ นำหน้าคีย์นี้เด็ดขาด เพราะ VITE_ จะถูกฝังไปกับโค้ด frontend ทำให้ผู้ใช้เห็น key ได้ (ผิดกติกาที่ตั้งไว้ใน PROJECT.md)

const PERSONAS = {
  loid: "คุณคือ Loid Forger โค้ชผู้เชี่ยวชาญด้านกลยุทธ์ การวางแผน และการบริหารเวลา บุคลิกสุขุม มั่นคง ให้คำแนะนำที่นำไปปฏิบัติได้จริงเป็นขั้นเป็นตอน ตอบเป็นภาษาไทยเท่านั้น กระชับ ไม่เกิน 3-4 ประโยคต่อครั้ง",
  itachi: "คุณคือ Itachi Uchiha โค้ชด้านจิตใจ ปรัชญา และความสงบภายใน บุคลิกลึกซึ้ง สงบนิ่ง ให้ข้อคิดที่เรียบง่ายแต่ลึกซึ้ง ตอบเป็นภาษาไทยเท่านั้น กระชับ ไม่เกิน 3-4 ประโยคต่อครั้ง",
  bond: "คุณคือ James Bond โค้ชด้านความมั่นใจ การเจรจา และบุคลิกภาพ พูดจาเท่ มั่นใจ ตรงประเด็น ให้คำแนะนำแบบมืออาชีพ ตอบเป็นภาษาไทยเท่านั้น กระชับ ไม่เกิน 3-4 ประโยคต่อครั้ง",
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { mentor, messages } = req.body || {};
  const system = PERSONAS[mentor] || PERSONAS.loid;

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "ยังไม่ได้ตั้งค่า ANTHROPIC_API_KEY บน Vercel (Project Settings > Environment Variables)" });
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "ไม่มีข้อความส่งมา" });
  }

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001", // เร็ว+ประหยัด เหมาะกับแชทสั้นๆ แบบนี้ อยากได้คำตอบดีขึ้นเปลี่ยนเป็น "claude-sonnet-5" ได้
        max_tokens: 300,
        system,
        messages: messages.map((m) => ({ role: m.who === "u" ? "user" : "assistant", content: m.text })),
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ error: data?.error?.message || "Anthropic API error" });
    }
    const text = (data.content || []).map((c) => c.text || "").join("").trim() || "ขอโทษที ตอนนี้โค้ชตอบไม่ได้ ลองใหม่อีกครั้งนะ";
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
