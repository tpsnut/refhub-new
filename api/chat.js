// 🤖 RefHub — AI Mentor จริง
// ลำดับ: Gemini ฟรี → Groq ฟรี → [เฉพาะคนมีสิทธิ์พรีเมียม] Gemini จ่ายเงิน → DeepSeek (จ่ายเงิน)
// ไฟล์นี้วางไว้ที่ /api/chat.js
//
// Environment Variables:
//   GEMINI_API_KEY       — key ฟรีเดิม (aistudio.google.com) ห้ามเปิดบิลลิ่งบนโปรเจกต์นี้เด็ดขาด
//   GROQ_API_KEY         — ฟรีจาก console.groq.com ไม่ต้องผูกบัตร
//   GEMINI_API_KEY_PAID  — (ไม่บังคับ) key จากโปรเจกต์ Google Cloud แยกต่างหากที่เปิดบิลลิ่งไว้แล้ว
//   DEEPSEEK_API_KEY     — (ไม่บังคับ) จาก platform.deepseek.com
//   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY — ใช้ยืนยันตัวตนผู้เรียก (เช็คสิทธิ์พรีเมียม)

import { createClient } from "@supabase/supabase-js";

const PERSONAS = {
  loid: "คุณคือ Loid Forger โค้ชผู้เชี่ยวชาญด้านกลยุทธ์ การวางแผน และการบริหารเวลา บุคลิกสุขุม มั่นคง ตอบเป็นภาษาไทยเท่านั้น ให้คำแนะนำแบบเจาะลึก ละเอียด เป็นขั้นเป็นตอน อธิบายเหตุผลเบื้องหลังคำแนะนำด้วย ไม่ต้องกลัวยาว ตอบให้ครบถ้วนเต็มที่เหมือนโค้ชมืออาชีพที่ทุ่มเทให้ลูกศิษย์จริงๆ",
  itachi: "คุณคือ Itachi Uchiha โค้ชด้านจิตใจ ปรัชญา และความสงบภายใน บุคลิกลึกซึ้ง สงบนิ่ง ตอบเป็นภาษาไทยเท่านั้น ให้ข้อคิดที่ลึกซึ้งและละเอียด อธิบายมุมมองอย่างครบถ้วน ยกตัวอย่างประกอบได้ ไม่ต้องกลัวยาว ตอบให้ครบถ้วนเต็มที่เหมือนโค้ชมืออาชีพที่ทุ่มเทให้ลูกศิษย์จริงๆ",
  bond: "คุณคือ James Bond โค้ชด้านความมั่นใจ การเจรจา และบุคลิกภาพ พูดจาเท่ มั่นใจ ตรงประเด็น ตอบเป็นภาษาไทยเท่านั้น ให้คำแนะนำแบบมืออาชีพอย่างละเอียด อธิบายทุกขั้นตอนและเหตุผล ไม่ต้องกลัวยาว ตอบให้ครบถ้วนเต็มที่เหมือนโค้ชมืออาชีพที่ทุ่มเทให้ลูกศิษย์จริงๆ",
  none: "คุณคือผู้ช่วย AI ทั่วไปที่เป็นมิตรและช่วยเหลือได้รอบด้าน ไม่ต้องสวมบทบาทเป็นตัวละครหรือคาแรกเตอร์ใดๆ ทั้งสิ้น พูดในน้ำเสียงเป็นกลาง เป็นมิตร ตรงไปตรงมา ตอบเป็นภาษาไทยเท่านั้น ให้คำแนะนำอย่างละเอียดและเป็นประโยชน์ที่สุดเท่าที่ทำได้",
};

async function callGemini(apiKey, system, messages) {
  const r = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
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

async function callGroq(system, messages) {
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: system },
        ...messages.map((m) => ({ role: m.who === "u" ? "user" : "assistant", content: m.text || "(ส่งรูปภาพมา แต่โหมดนี้มองไม่เห็นรูป ตอบตามข้อความที่มีได้เลย)" })),
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

async function callDeepSeek(system, messages) {
  const r = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: system },
        ...messages.map((m) => ({ role: m.who === "u" ? "user" : "assistant", content: m.text || "(ส่งรูปภาพมา แต่โหมดนี้มองไม่เห็นรูป ตอบตามข้อความที่มีได้เลย)" })),
      ],
      max_tokens: 1500,
    }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || "DeepSeek API error");
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("DeepSeek ไม่ตอบกลับเนื้อหา");
  return text;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { mentor, messages, userId, callerToken, mentorName, mentorDescription } = req.body || {};
  const system = PERSONAS[mentor] || (
    mentorName
      ? `คุณคือ ${mentorName} โค้ช/ผู้ช่วยส่วนตัวของผู้ใช้คนนี้${mentorDescription ? ` โดยมีความเชี่ยวชาญ/บุคลิกดังนี้: ${mentorDescription}` : ""} ตอบเป็นภาษาไทยเท่านั้น ให้คำแนะนำแบบเจาะลึก ละเอียด เป็นขั้นเป็นตอน ไม่ต้องกลัวยาว ตอบให้ครบถ้วนเต็มที่เหมือนโค้ชมืออาชีพที่ทุ่มเทให้ลูกศิษย์จริงๆ สวมบทบาทตามที่กำหนดไว้ข้างต้นอย่างสม่ำเสมอตลอดบทสนทนา`
      : PERSONAS.none
  );
  if (!Array.isArray(messages) || messages.length === 0) return res.status(400).json({ error: "ไม่มีข้อความส่งมา" });

  // เช็คสิทธิ์พรีเมียม (ถ้ามี userId+token ส่งมา — ถ้าไม่มีถือว่าไม่มีสิทธิ์พรีเมียม ไม่ error เพราะฟีเจอร์ฟรียังใช้ได้ปกติ)
  let isPremium = false;
  if (userId && callerToken) {
    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
      const authClient = createClient(supabaseUrl, anonKey);
      const { data: userData } = await authClient.auth.getUser(callerToken);
      if (userData?.user?.id === userId) {
        const admin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);
        const { data: prof } = await admin.from("profiles").select("premium_ai").eq("id", userId).maybeSingle();
        isPremium = !!prof?.premium_ai;
      }
    } catch (e) { console.error("เช็คสิทธิ์พรีเมียมไม่สำเร็จ (ถือว่าไม่มีสิทธิ์):", e.message); }
  }

  const errors = [];

  if (process.env.GEMINI_API_KEY) {
    try { return res.status(200).json({ text: await callGemini(process.env.GEMINI_API_KEY, system, messages), source: "gemini" }); }
    catch (e) { errors.push(`Gemini: ${e.message}`); console.error("Gemini พัง สลับตัวถัดไป:", e.message); }
  } else errors.push("Gemini: ยังไม่ได้ตั้งค่า GEMINI_API_KEY");

  if (process.env.GROQ_API_KEY) {
    try { return res.status(200).json({ text: await callGroq(system, messages), source: "groq" }); }
    catch (e) { errors.push(`Groq: ${e.message}`); console.error("Groq พัง สลับตัวถัดไป:", e.message); }
  } else errors.push("Groq: ยังไม่ได้ตั้งค่า GROQ_API_KEY");

  if (isPremium) {
    if (process.env.DEEPSEEK_API_KEY) {
      try { return res.status(200).json({ text: await callDeepSeek(system, messages), source: "deepseek" }); }
      catch (e) { errors.push(`DeepSeek: ${e.message}`); console.error("DeepSeek พัง สลับตัวถัดไป:", e.message); }
    }
    if (process.env.GEMINI_API_KEY_PAID) {
      try { return res.status(200).json({ text: await callGemini(process.env.GEMINI_API_KEY_PAID, system, messages), source: "gemini_paid" }); }
      catch (e) { errors.push(`Gemini (จ่ายเงิน): ${e.message}`); console.error("Gemini จ่ายเงิน พัง:", e.message); }
    }
  }

  return res.status(500).json({ error: errors.join(" | ") });
}
