// 🤖 RefHub — AI Mentor จริง ผ่าน Google Gemini API (มี free tier ไม่ต้องผูกบัตรเครดิต)
// ไฟล์นี้วางไว้ที่ /api/chat.js ที่ root ของโปรเจกต์ (ข้างๆ src/) — Vercel จะจับเป็น endpoint /api/chat ให้อัตโนมัติ
// ต้องตั้งค่า Environment Variable ชื่อ GEMINI_API_KEY บน Vercel ก่อน (สร้างฟรีที่ aistudio.google.com)
// ห้ามใส่ VITE_ นำหน้าคีย์นี้เด็ดขาด เพราะ VITE_ จะถูกฝังไปกับโค้ด frontend ทำให้ผู้ใช้เห็น key ได้

const PERSONAS = {
  loid: "คุณคือ Loid Forger โค้ชผู้เชี่ยวชาญด้านกลยุทธ์ การวางแผน และการบริหารเวลา บุคลิกสุขุม มั่นคง ตอบเป็นภาษาไทยเท่านั้น ให้คำแนะนำแบบเจาะลึก ละเอียด เป็นขั้นเป็นตอน อธิบายเหตุผลเบื้องหลังคำแนะนำด้วย ไม่ต้องกลัวยาว ตอบให้ครบถ้วนเต็มที่เหมือนโค้ชมืออาชีพที่ทุ่มเทให้ลูกศิษย์จริงๆ",
  itachi: "คุณคือ Itachi Uchiha โค้ชด้านจิตใจ ปรัชญา และความสงบภายใน บุคลิกลึกซึ้ง สงบนิ่ง ตอบเป็นภาษาไทยเท่านั้น ให้ข้อคิดที่ลึกซึ้งและละเอียด อธิบายมุมมองอย่างครบถ้วน ยกตัวอย่างประกอบได้ ไม่ต้องกลัวยาว ตอบให้ครบถ้วนเต็มที่เหมือนโค้ชมืออาชีพที่ทุ่มเทให้ลูกศิษย์จริงๆ",
  bond: "คุณคือ James Bond โค้ชด้านความมั่นใจ การเจรจา และบุคลิกภาพ พูดจาเท่ มั่นใจ ตรงประเด็น ตอบเป็นภาษาไทยเท่านั้น ให้คำแนะนำแบบมืออาชีพอย่างละเอียด อธิบายทุกขั้นตอนและเหตุผล ไม่ต้องกลัวยาว ตอบให้ครบถ้วนเต็มที่เหมือนโค้ชมืออาชีพที่ทุ่มเทให้ลูกศิษย์จริงๆ",
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { mentor, messages } = req.body || {};
  const system = PERSONAS[mentor] || PERSONAS.loid;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "ยังไม่ได้ตั้งค่า GEMINI_API_KEY บน Vercel (Project Settings > Environment Variables) — สร้างฟรีที่ aistudio.google.com" });
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "ไม่มีข้อความส่งมา" });
  }

  try {
    const r = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: messages.map((m) => {
            const parts = [];
            if (m.image) {
              // m.image เป็น dataURL แบบ "data:image/jpeg;base64,xxxxx" -> ต้องแยก mime กับ base64 ออกจากกัน
              const match = /^data:(.+?);base64,(.+)$/.exec(m.image);
              if (match) parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
            }
            if (m.text) parts.push({ text: m.text });
            return { role: m.who === "u" ? "user" : "model", parts }; // Gemini ใช้คำว่า "model" แทน "assistant"
          }),
          generationConfig: { maxOutputTokens: 1500 },
        }),
      }
    );

    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ error: data?.error?.message || "Gemini API error" });
    }
    const text =
      (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("").trim() ||
      "ขอโทษที ตอนนี้โค้ชตอบไม่ได้ ลองใหม่อีกครั้งนะ";
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

