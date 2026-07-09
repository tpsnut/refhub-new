// 📚 RefHub — สร้างบทความความรู้รายวันด้วย Gemini ตามความสนใจของผู้ใช้
// ไฟล์นี้วางไว้ที่ /api/knowledge-generate.js ที่ root ของโปรเจกต์ (ข้างๆ src/)
// ใช้ GEMINI_API_KEY ตัวเดียวกับ /api/chat.js ไม่ต้องเพิ่ม env var ใหม่
//
// หมายเหตุการออกแบบ: ฟังก์ชันนี้ "ไม่" insert ข้อมูลลง Supabase เอง (ต่างจาก admin-create-user.js/chat-start-direct.js)
// เพราะการ insert บทความใช้ user_id ของเจ้าของบัญชีเองอยู่แล้ว (RLS อนุญาตให้ insert แถวของตัวเองผ่านปกติ)
// ให้ frontend เป็นคน insert เองด้วย client ที่ authenticated อยู่แล้วง่ายกว่า ปลอดภัยกว่า ไม่ต้องพึ่ง service role

import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { interests, count, callerToken } = req.body || {};
  if (!Array.isArray(interests) || interests.length === 0) return res.status(400).json({ error: "ยังไม่ได้เลือกความสนใจ" });
  if (!callerToken) return res.status(401).json({ error: "ไม่พบข้อมูลยืนยันตัวตน ลองล็อกอินใหม่" });

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) return res.status(500).json({ error: "ยังไม่ได้ตั้งค่า GEMINI_API_KEY บน Vercel" });

  try {
    // เช็คแค่ว่าล็อกอินอยู่จริง (กันคนแปลกหน้ายิง API ตรงๆ มากินโควตา Gemini เล่นๆ)
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
    const authClient = createClient(supabaseUrl, anonKey);
    const { data: userData, error: userErr } = await authClient.auth.getUser(callerToken);
    if (userErr || !userData?.user) return res.status(401).json({ error: "ยืนยันตัวตนไม่สำเร็จ ลองล็อกอินใหม่" });

    const n = Math.min(Math.max(parseInt(count) || 3, 1), 10);
    const prompt = `สร้างบทความความรู้สั้นๆ ภาษาไทยจำนวน ${n} บทความ โดยกระจายหัวข้อจากความสนใจต่อไปนี้: ${interests.join(", ")}
แต่ละบทความต้องมี:
- "topic": หมวดความสนใจที่ใช้ (ต้องเป็นหนึ่งในลิสต์ที่ให้มา)
- "title": หัวข้อบทความ กระชับ น่าสนใจ ไม่เกิน 15 คำ
- "bullets": array ของ string 4-6 ข้อ แต่ละข้อเป็นประเด็นสั้นๆ ที่ได้ความรู้จริง (ไม่ใช่พารากราฟยาว) ข้อละไม่เกิน 2 ประโยค

ตอบกลับเป็น JSON ล้วนๆ เท่านั้น ไม่มีข้อความอื่นนำหน้า/ตามหลัง ไม่มี markdown code fence รูปแบบนี้เป๊ะ:
{"articles":[{"topic":"...","title":"...","bullets":["...","..."]}]}`;

    const r = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 2000 },
        }),
      }
    );
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data?.error?.message || "Gemini API error" });

    const raw = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("").trim();
    if (!raw) {
      const reason = data.candidates?.[0]?.finishReason || data.promptFeedback?.blockReason;
      return res.status(500).json({ error: reason ? `AI ไม่ตอบกลับเนื้อหา (สาเหตุ: ${reason})` : "AI ไม่ตอบกลับเนื้อหาใดๆ ลองใหม่อีกครั้ง" });
    }
    const cleaned = raw.replace(/^```json\s*|```\s*$/g, "").trim();
    let parsed;
    try { parsed = JSON.parse(cleaned); } catch (e) { return res.status(500).json({ error: "แปลงผลลัพธ์จาก AI ไม่สำเร็จ ลองใหม่อีกครั้ง" }); }

    const articles = (parsed.articles || []).slice(0, n).map((a) => ({
      topic: a.topic || interests[0],
      title: a.title || "บทความความรู้",
      bullets: Array.isArray(a.bullets) ? a.bullets.slice(0, 8) : [],
    }));

    return res.status(200).json({ articles });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
