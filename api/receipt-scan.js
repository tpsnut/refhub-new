// 🧾 RefHub — อ่านสลิปโอนเงิน/ใบเสร็จด้วย AI แล้วแยกข้อมูลให้อัตโนมัติ
// ไฟล์นี้วางไว้ที่ /api/receipt-scan.js
//
// ลำดับการเรียก: Groq (ฟรี, ตามนโยบายไม่เก็บ/ไม่ใช้ข้อมูลไปเทรนโมเดล — เหมาะกับข้อมูลการเงินที่อ่อนไหว)
//              → Gemini จ่ายเงิน (ถ้ามีตั้งไว้) → Gemini ฟรี (ทางเลือกสุดท้ายเท่านั้น เพราะ free tier Google อาจนำไปใช้พัฒนาโมเดล)

import { createClient } from "@supabase/supabase-js";

const PROMPT = (categoryOptions) => `คุณคือระบบอ่านสลิปโอนเงิน/ใบเสร็จร้านค้าภาษาไทย วิเคราะห์รูปที่ได้รับแล้วตอบกลับเป็น JSON เท่านั้น ห้ามมีข้อความอื่นนอก JSON ห้ามใส่ markdown code fence

กติกา:
- ถ้าเป็นสลิปโอนเงิน/หลักฐานการจ่ายเงินผ่านแอปธนาคาร (มักมีแค่ยอดรวม วันเวลา ชื่อผู้รับ) ให้ doc_type = "slip" และ items = null (สลิปโอนเงินไม่มีรายการสินค้าให้แยก)
- ถ้าเป็นใบเสร็จ/บิลร้านค้าที่มีรายการสินค้าแยกทีละบรรทัดพร้อมราคา ให้ doc_type = "receipt" และแยก items ออกมาให้ครบทุกชิ้น
- amount ต้องเป็นยอดรวมสุดท้ายที่จ่ายจริง (ตัวเลขล้วน ไม่มีคอมมา/บาท)
- date เป็นรูปแบบ YYYY-MM-DD ถ้าอ่านไม่ออกให้เป็น null
- merchant คือชื่อร้าน/ผู้รับเงิน ถ้าอ่านไม่ออกให้เป็น null
- suggested_category ให้เลือก id จากลิสต์นี้เท่านั้น (เลือกที่ใกล้เคียงที่สุด): ${JSON.stringify(categoryOptions)} — ถ้าไม่มั่นใจให้เลือก id ที่ label เป็น "อื่นๆ"
- ถ้ารูปไม่ใช่สลิปหรือใบเสร็จเลย ให้ตอบ {"error": "ไม่พบข้อมูลสลิปหรือใบเสร็จในรูปนี้"}

ตอบกลับตาม schema นี้เป๊ะๆ:
{"doc_type":"slip"|"receipt","amount":number,"date":"YYYY-MM-DD"|null,"merchant":string|null,"suggested_category":string|null,"items":[{"name":string,"price":number}]|null}`;

function parseJsonReply(text) {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
  try { return JSON.parse(cleaned); } catch { throw new Error("อ่านผลลัพธ์จาก AI ไม่สำเร็จ"); }
}

async function callGroqVision(imageDataUrl, categoryOptions) {
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify({
      model: "qwen/qwen3.6-27b",
      response_format: { type: "json_object" },
      messages: [{
        role: "user",
        content: [
          { type: "image_url", image_url: { url: imageDataUrl } },
          { type: "text", text: PROMPT(categoryOptions) },
        ],
      }],
      max_tokens: 1000,
    }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || "Groq API error");
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Groq ไม่ตอบกลับเนื้อหา");
  return parseJsonReply(text);
}

async function callGeminiVision(apiKey, imageDataUrl, categoryOptions) {
  const match = /^data:(.+?);base64,(.+)$/.exec(imageDataUrl || "");
  if (!match) throw new Error("รูปภาพไม่ถูกต้อง");
  const r = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [
            { inlineData: { mimeType: match[1], data: match[2] } },
            { text: PROMPT(categoryOptions) },
          ],
        }],
        generationConfig: { maxOutputTokens: 1000, responseMimeType: "application/json" },
      }),
    }
  );
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || "Gemini API error");
  const text = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("").trim();
  if (!text) throw new Error("Gemini ไม่ตอบกลับเนื้อหา");
  return parseJsonReply(text);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { image, userId, callerToken, categoryOptions } = req.body || {};
  if (!image) return res.status(400).json({ error: "ไม่มีรูปภาพส่งมา" });
  if (!userId || !callerToken) return res.status(401).json({ error: "กรุณาเข้าสู่ระบบก่อนใช้ฟีเจอร์นี้" });

  // ยืนยันตัวตนผู้เรียกก่อนเสมอ (ฟีเจอร์นี้แตะข้อมูลการเงิน ไม่เปิดให้เรียกแบบไม่ล็อกอิน)
  // ระหว่างนี้เช็ค premium_ai (ตัวเดียวกับที่ใช้เปิดสิทธิ์โค้ช AI จ่ายเงินในหน้า Admin อยู่แล้ว)
  let isPremium = false;
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
    const authClient = createClient(supabaseUrl, anonKey);
    const { data: userData, error: authErr } = await authClient.auth.getUser(callerToken);
    if (authErr || userData?.user?.id !== userId) return res.status(401).json({ error: "ยืนยันตัวตนไม่สำเร็จ" });
    const admin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data: prof } = await admin.from("profiles").select("premium_ai").eq("id", userId).maybeSingle();
    isPremium = !!prof?.premium_ai;
  } catch (e) {
    return res.status(401).json({ error: "ยืนยันตัวตนไม่สำเร็จ: " + e.message });
  }

  const cats = Array.isArray(categoryOptions) ? categoryOptions : [];
  const errors = [];

  // คนที่พี่เปิด premium_ai ให้ในหน้า Admin จะได้ลอง Gemini จ่ายเงินก่อน (ถ้าตั้ง key ไว้) เป็นสิทธิ์พิเศษ
  if (isPremium && process.env.GEMINI_API_KEY_PAID) {
    try {
      const result = await callGeminiVision(process.env.GEMINI_API_KEY_PAID, image, cats);
      return res.status(200).json({ ...result, source: "gemini_paid" });
    } catch (e) { errors.push(`Gemini (จ่ายเงิน): ${e.message}`); console.error("Gemini จ่ายเงิน พัง สลับตัวถัดไป:", e.message); }
  }

  // ค่าเริ่มต้นของทุกคน — ฟรีทั้งคู่ ไม่ต้องตั้ง key เพิ่มเลย
  if (process.env.GROQ_API_KEY) {
    try {
      const result = await callGroqVision(image, cats);
      return res.status(200).json({ ...result, source: "groq" });
    } catch (e) { errors.push(`Groq: ${e.message}`); console.error("Groq vision พัง สลับตัวถัดไป:", e.message); }
  } else errors.push("Groq: ยังไม่ได้ตั้งค่า GROQ_API_KEY");

  if (process.env.GEMINI_API_KEY) {
    try {
      const result = await callGeminiVision(process.env.GEMINI_API_KEY, image, cats);
      return res.status(200).json({ ...result, source: "gemini" });
    } catch (e) { errors.push(`Gemini: ${e.message}`); console.error("Gemini พัง:", e.message); }
  } else errors.push("Gemini: ยังไม่ได้ตั้งค่า GEMINI_API_KEY");

  return res.status(500).json({ error: errors.join(" | ") || "อ่านสลิป/ใบเสร็จไม่สำเร็จ" });
}
