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

// 📊 บันทึกการเรียกใช้ AI แต่ละครั้งลง ai_usage_log (สำหรับแดชบอร์ดใช้งาน/ลิมิตในหน้า Admin)
// ใช้ service role key ยิงตรง ไม่ผ่าน RLS — พังไม่ให้กระทบการตอบแชทเด็ดขาด (แค่ log เฉยๆ)
async function logAiUsage(provider, userId) {
  try {
    const admin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    await admin.from("ai_usage_log").insert({ provider, module: "mentor_chat", user_id: userId || null });
  } catch (e) { console.error("บันทึก ai_usage_log ไม่สำเร็จ (ไม่กระทบการตอบกลับ):", e.message); }
}

const CONCISE_RULE = "ตอบให้กระชับ ตรงประเด็น ได้ใจความและเป็นประโยชน์สูงสุด ความยาวพอเหมาะเหมือนคนเก่งเรื่องนั้นตอบเพื่อนที่มาถาม ไม่ใช่เขียนบทความยาวเยิ่นเย้อ ไม่ต้องอธิบายทุกแง่มุมในคำตอบเดียว ถ้าเรื่องที่ถามลึกหรือมีรายละเอียดเยอะจริงๆ ให้เลือกตอบส่วนที่สำคัญ/เป็นประโยชน์ที่สุดก่อน แล้วปิดท้ายด้วยคำถามสั้นๆ ถามว่าอยากให้ขยายความส่วนไหนเพิ่มไหม (ผู้ใช้พิมพ์ต่อได้เองถ้าอยากรู้มากกว่านี้) แทนที่จะอัดทุกอย่างมาในคำตอบเดียว";

const PERSONAS = {
  loid: `คุณคือ Loid Forger โค้ชผู้เชี่ยวชาญด้านกลยุทธ์ การวางแผน และการบริหารเวลา บุคลิกสุขุม มั่นคง ตอบเป็นภาษาไทยเท่านั้น ${CONCISE_RULE}`,
  itachi: `คุณคือ Itachi Uchiha โค้ชด้านจิตใจ ปรัชญา และความสงบภายใน บุคลิกลึกซึ้ง สงบนิ่ง ตอบเป็นภาษาไทยเท่านั้น ${CONCISE_RULE}`,
  bond: `คุณคือ James Bond โค้ชด้านความมั่นใจ การเจรจา และบุคลิกภาพ พูดจาเท่ มั่นใจ ตรงประเด็น ตอบเป็นภาษาไทยเท่านั้น ${CONCISE_RULE}`,
  none: `คุณคือผู้ช่วย AI ทั่วไปที่เป็นมิตรและช่วยเหลือได้รอบด้าน ไม่ต้องสวมบทบาทเป็นตัวละครหรือคาแรกเตอร์ใดๆ ทั้งสิ้น พูดในน้ำเสียงเป็นกลาง เป็นมิตร ตรงไปตรงมา ตอบเป็นภาษาไทยเท่านั้น ${CONCISE_RULE}`,
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

  const { mentor, messages, userId, callerToken, mentorName, mentorDescription, goalsContext } = req.body || {};
  const system = (PERSONAS[mentor] || (
    mentorName
      ? `คุณคือ ${mentorName} โค้ช/ผู้ช่วยส่วนตัวของผู้ใช้คนนี้${mentorDescription ? ` โดยมีความเชี่ยวชาญ/บุคลิกดังนี้: ${mentorDescription}` : ""} ตอบเป็นภาษาไทยเท่านั้น ${CONCISE_RULE} สวมบทบาทตามที่กำหนดไว้ข้างต้นอย่างสม่ำเสมอตลอดบทสนทนา`
      : PERSONAS.none
  )) + (goalsContext ? `\n\n[ข้อมูลเป้าหมายจริงของผู้ใช้ ณ ตอนนี้ — ใช้ประกอบการให้คำแนะนำแบบธรรมชาติ ไม่ต้องพูดถึงทุกครั้งหรือฟังดูเหมือนอ่านสคริปต์ แค่หยิบมาใช้เวลาที่เกี่ยวข้องกับสิ่งที่คุยกันจริงๆ เช่น ถ้าผู้ใช้ถามเรื่องแรงจูงใจ/ผัดวันประกันพรุ่ง ให้ลองอ้างอิงเป้าหมายจริงของเขาได้เลย]\n${goalsContext}` : "");
  if (!Array.isArray(messages) || messages.length === 0) return res.status(400).json({ error: "ไม่มีข้อความส่งมา" });

  // เช็คสิทธิ์พรีเมียม + โควตา AI รายวัน (ถ้ามี userId+token ส่งมา — ถ้าไม่มีถือว่าไม่มีสิทธิ์พรีเมียม ไม่ error เพราะฟีเจอร์ฟรียังใช้ได้ปกติ)
  let isPremium = false;
  let verifiedUserId = null;
  if (userId && callerToken) {
    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
      const authClient = createClient(supabaseUrl, anonKey);
      const { data: userData } = await authClient.auth.getUser(callerToken);
      if (userData?.user?.id === userId) {
        verifiedUserId = userId;
        const admin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);
        const { data: prof } = await admin.from("profiles").select("premium_ai, daily_ai_limit").eq("id", userId).maybeSingle();
        isPremium = !!prof?.premium_ai;

        // 🚦 โควตา AI รายวันจริง (นับตามวันเวลาไทย Asia/Bangkok ไม่ใช่ UTC เที่ยงคืน) — บล็อกจริงถ้าเกิน ไม่ใช่แค่โชว์เฉยๆ
        const dailyLimit = prof?.daily_ai_limit ?? 200;
        const bkkOffsetMs = 7 * 60 * 60 * 1000;
        const bkkNow = new Date(Date.now() + bkkOffsetMs);
        const bkkMidnightUtc = new Date(Date.UTC(bkkNow.getUTCFullYear(), bkkNow.getUTCMonth(), bkkNow.getUTCDate()) - bkkOffsetMs);
        const { count } = await admin.from("ai_usage_log").select("id", { count: "exact", head: true })
          .eq("user_id", userId).eq("module", "mentor_chat").gte("created_at", bkkMidnightUtc.toISOString());
        if ((count || 0) >= dailyLimit) {
          return res.status(429).json({
            error: `ใช้ครบโควตา AI วันนี้แล้ว (${count}/${dailyLimit} ครั้ง) พรุ่งนี้โควตาจะรีเซ็ตใหม่ ถ้าต้องการเพิ่มโควตา ติดต่อแอดมิน`,
            quotaExceeded: true,
          });
        }
      }
    } catch (e) { console.error("เช็คสิทธิ์พรีเมียม/โควตาไม่สำเร็จ (ถือว่าไม่มีสิทธิ์/ปล่อยผ่าน):", e.message); }
  }

  const errors = [];

  if (process.env.GEMINI_API_KEY) {
    try {
      const text = await callGemini(process.env.GEMINI_API_KEY, system, messages);
      await logAiUsage("gemini", verifiedUserId);
      return res.status(200).json({ text, source: "gemini" });
    }
    catch (e) { errors.push(`Gemini: ${e.message}`); console.error("Gemini พัง สลับตัวถัดไป:", e.message); }
  } else errors.push("Gemini: ยังไม่ได้ตั้งค่า GEMINI_API_KEY");

  if (process.env.GROQ_API_KEY) {
    try {
      const text = await callGroq(system, messages);
      await logAiUsage("groq", verifiedUserId);
      return res.status(200).json({ text, source: "groq" });
    }
    catch (e) { errors.push(`Groq: ${e.message}`); console.error("Groq พัง สลับตัวถัดไป:", e.message); }
  } else errors.push("Groq: ยังไม่ได้ตั้งค่า GROQ_API_KEY");

  if (isPremium) {
    if (process.env.DEEPSEEK_API_KEY) {
      try {
        const text = await callDeepSeek(system, messages);
        await logAiUsage("deepseek", verifiedUserId);
        return res.status(200).json({ text, source: "deepseek" });
      }
      catch (e) { errors.push(`DeepSeek: ${e.message}`); console.error("DeepSeek พัง สลับตัวถัดไป:", e.message); }
    }
    if (process.env.GEMINI_API_KEY_PAID) {
      try {
        const text = await callGemini(process.env.GEMINI_API_KEY_PAID, system, messages);
        await logAiUsage("gemini_paid", verifiedUserId);
        return res.status(200).json({ text, source: "gemini_paid" });
      }
      catch (e) { errors.push(`Gemini (จ่ายเงิน): ${e.message}`); console.error("Gemini จ่ายเงิน พัง:", e.message); }
    }
  }

  return res.status(500).json({ error: errors.join(" | ") });
}
