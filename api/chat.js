// 🤖 RefHub — AI Mentor จริง ลอง Google Gemini ก่อน ถ้าพัง/โควตาหมด สลับไปใช้ Groq (ฟรี โควตาสูงกว่ามาก) อัตโนมัติ
// ไฟล์นี้วางไว้ที่ /api/chat.js ที่ root ของโปรเจกต์ (ข้างๆ src/) — Vercel จะจับเป็น endpoint /api/chat ให้อัตโนมัติ
//
// ต้องตั้งค่า Environment Variable บน Vercel:
//   GEMINI_API_KEY  — สร้างฟรีที่ aistudio.google.com (ตัวหลัก รองรับรูปภาพด้วย)
//   GROQ_API_KEY    — สร้างฟรีที่ console.groq.com (ตัวสำรอง ไม่ต้องผูกบัตร โควตาสูงกว่ามาก แต่ไม่รองรับรูปภาพ)
// ห้ามใส่ VITE_ นำหน้าคีย์พวกนี้เด็ดขาด เพราะ VITE_ จะถูกฝังไปกับโค้ด frontend ทำให้ผู้ใช้เห็น key ได้

const PERSONAS = {
  loid: "คุณคือ Loid Forger โค้ชผู้เชี่ยวชาญด้านกลยุทธ์ การวางแผน และการบริหารเวลา บุคลิกสุขุม มั่นคง ตอบเป็นภาษาไทยเท่านั้น ให้คำแนะนำแบบเจาะลึก ละเอียด เป็นขั้นเป็นตอน อธิบายเหตุผลเบื้องหลังคำแนะนำด้วย ไม่ต้องกลัวยาว ตอบให้ครบถ้วนเต็มที่เหมือนโค้ชมืออาชีพที่ทุ่มเทให้ลูกศิษย์จริงๆ",
  itachi: "คุณคือ Itachi Uchiha โค้ชด้านจิตใจ ปรัชญา และความสงบภายใน บุคลิกลึกซึ้ง สงบนิ่ง ตอบเป็นภาษาไทยเท่านั้น ให้ข้อคิดที่ลึกซึ้งและละเอียด อธิบายมุมมองอย่างครบถ้วน ยกตัวอย่างประกอบได้ ไม่ต้องกลัวยาว ตอบให้ครบถ้วนเต็มที่เหมือนโค้ชมืออาชีพที่ทุ่มเทให้ลูกศิษย์จริงๆ",
  bond: "คุณคือ James Bond โค้ชด้านความมั่นใจ การเจรจา และบุคลิกภาพ พูดจาเท่ มั่นใจ ตรงประเด็น ตอบเป็นภาษาไทยเท่านั้น ให้คำแนะนำแบบมืออาชีพอย่างละเอียด อธิบายทุกขั้นตอนและเหตุผล ไม่ต้องกลัวยาว ตอบให้ครบถ้วนเต็มที่เหมือนโค้ชมืออาชีพที่ทุ่มเทให้ลูกศิษย์จริงๆ",
  none: "คุณคือผู้ช่วย AI ทั่วไปที่เป็นมิตรและช่วยเหลือได้รอบด้าน ไม่ต้องสวมบทบาทเป็นตัวละครหรือคาแรกเตอร์ใดๆ ทั้งสิ้น พูดในน้ำเสียงเป็นกลาง เป็นมิตร ตรงไปตรงมา ตอบเป็นภาษาไทยเท่านั้น ให้คำแนะนำอย่างละเอียดและเป็นประโยชน์ที่สุดเท่าที่ทำได้",
};

// ลอง Gemini ก่อน (รองรับรูปภาพด้วย)
async function tryGemini(system, messages) {
  const r = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.map((m) => {
          const parts = [];
          if (m.image) {
            const match = /^data:(.+?);base64,(.+)$/.exec(m.image);
            if (match) parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
          }
          if (m.text) parts.push({ text: m.text });
          return { role: m.who === "u" ? "user" : "model", parts };
        }),
        generationConfig: { maxOutputTokens: 1500 },
      }),
    }
  );
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || "Gemini API error");
  const text = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("").trim();
  if (!text) throw new Error("Gemini ไม่ตอบกลับเนื้อหา");
  return text;
}

// ตัวสำรอง: Groq (ฟรี ไม่ต้องผูกบัตร โควตาสูงกว่า Gemini มาก แต่เป็น text ล้วน ไม่เห็นรูปภาพ)
async function tryGroq(system, messages) {
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: system },
        ...messages.map((m) => ({ role: m.who === "u" ? "user" : "assistant", content: m.text || "(ส่งรูปภาพมา แต่โหมดสำรองนี้มองไม่เห็นรูป ตอบตามข้อความที่มีได้เลย)" })),
      ],
      max_tokens: 1500,
    }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || "Groq API error");
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Groq ไม่ตอบกลับเนื้อหา");
  return text;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { mentor, messages } = req.body || {};
  const system = PERSONAS[mentor] || PERSONAS.loid;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "ไม่มีข้อความส่งมา" });
  }

  let geminiErr = null;
  if (process.env.GEMINI_API_KEY) {
    try {
      const text = await tryGemini(system, messages);
      return res.status(200).json({ text, source: "gemini" });
    } catch (e) {
      geminiErr = e.message;
      console.error("Gemini พัง สลับไป Groq:", geminiErr);
    }
  } else {
    geminiErr = "ยังไม่ได้ตั้งค่า GEMINI_API_KEY";
  }

  if (process.env.GROQ_API_KEY) {
    try {
      const text = await tryGroq(system, messages);
      return res.status(200).json({ text, source: "groq" });
    } catch (e) {
      console.error("Groq (สำรอง) ก็พังด้วย:", e.message);
      return res.status(500).json({ error: `Gemini: ${geminiErr} | Groq (สำรอง): ${e.message}` });
    }
  }

  return res.status(500).json({ error: `Gemini พัง (${geminiErr}) และยังไม่ได้ตั้งค่า GROQ_API_KEY สำรอง` });
}
