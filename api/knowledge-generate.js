// 📚 RefHub — สร้างบทความความรู้รายวันด้วย Gemini ตามความสนใจของผู้ใช้ + 🔊 อ่านออกเสียงบทความด้วย Azure Neural TTS
// ไฟล์นี้วางไว้ที่ /api/knowledge-generate.js ที่ root ของโปรเจกต์ (ข้างๆ src/)
// ใช้ GEMINI_API_KEY ตัวเดียวกับ /api/chat.js ไม่ต้องเพิ่ม env var ใหม่
// 🔊 TTS ใช้ AZURE_SPEECH_KEY + AZURE_SPEECH_REGION (ฟรี 500,000 ตัวอักษร/เดือน ตลอดไป บน tier F0)
// รวม action "tts" ไว้ในไฟล์นี้แทนที่จะแยกไฟล์ใหม่ เพราะ Vercel Hobby plan เต็มโควตา 12 functions แล้ว
//
// หมายเหตุการออกแบบ: ฟังก์ชันนี้ "ไม่" insert ข้อมูลลง Supabase เอง (ต่างจาก admin-create-user.js/chat-start-direct.js)
// เพราะการ insert บทความใช้ user_id ของเจ้าของบัญชีเองอยู่แล้ว (RLS อนุญาตให้ insert แถวของตัวเองผ่านปกติ)
// ให้ frontend เป็นคน insert เองด้วย client ที่ authenticated อยู่แล้วง่ายกว่า ปลอดภัยกว่า ไม่ต้องพึ่ง service role

import { createClient } from "@supabase/supabase-js";

// 🔊 แปลงข้อความเป็นเสียงด้วย Azure Neural TTS — โยน error ออกไปถ้าพลาด (โควตาเกิน/ยังไม่ตั้งค่า key ฯลฯ)
// ฝั่ง frontend จะ catch แล้ว fallback ไปเสียงเครื่อง (speechSynthesis) เองแบบเงียบๆ ไม่ต้องมาพังตรงนี้
async function synthesizeAzureTTS(text, voice) {
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region) throw new Error("AZURE_NOT_CONFIGURED"); // ยังไม่ได้ตั้งค่าบน Vercel — ให้ frontend fallback ไปเสียงเครื่องแทน

  // 1) แลก subscription key เป็น access token ชั่วคราว (อายุ 10 นาที ต่อครั้งไม่แคชไว้ก็ได้ เพราะปริมาณการใช้งานน้อย)
  const tokenRes = await fetch(`https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, {
    method: "POST",
    headers: { "Ocp-Apim-Subscription-Key": key, "Content-Length": "0" },
  });
  if (!tokenRes.ok) {
    if (tokenRes.status === 401 || tokenRes.status === 403) throw new Error("AZURE_KEY_INVALID");
    throw new Error(`AZURE_TOKEN_ERROR_${tokenRes.status}`);
  }
  const accessToken = await tokenRes.text();

  // 2) เรียก synthesize จริงด้วย SSML
  const escaped = String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const ssml = `<speak version="1.0" xml:lang="th-TH"><voice name="${voice}">${escaped}</voice></speak>`;
  const ttsRes = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": "audio-16khz-64kbitrate-mono-mp3",
      "User-Agent": "refhub-tts",
    },
    body: ssml,
  });
  if (!ttsRes.ok) {
    // 429 = โควตาฟรีเดือนนี้เกินแล้ว — frontend เช็ค status นี้เพื่อ fallback ไปเสียงเครื่อง
    throw new Error(`AZURE_TTS_ERROR_${ttsRes.status}`);
  }
  const arrayBuf = await ttsRes.arrayBuffer();
  return Buffer.from(arrayBuf);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const body = req.body || {};

  // 🔊 กิ่งใหม่: อ่านออกเสียงบทความ (ใช้ endpoint เดียวกับสร้างบทความ กัน Vercel function เกิน 12 อัน)
  if (body.action === "tts") {
    const { text, voice, callerToken } = body;
    if (!text || typeof text !== "string") return res.status(400).json({ error: "ไม่มีข้อความให้อ่าน" });
    if (!callerToken) return res.status(401).json({ error: "ไม่พบข้อมูลยืนยันตัวตน ลองล็อกอินใหม่" });

    try {
      // เช็คแค่ว่าล็อกอินอยู่จริง กันคนแปลกหน้ายิง API ตรงๆ มากินโควตาฟรีเล่นๆ
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
      const authClient = createClient(supabaseUrl, anonKey);
      const { data: userData, error: userErr } = await authClient.auth.getUser(callerToken);
      if (userErr || !userData?.user) return res.status(401).json({ error: "ยืนยันตัวตนไม่สำเร็จ ลองล็อกอินใหม่" });

      const audioBuffer = await synthesizeAzureTTS(text.slice(0, 4000), voice || "th-TH-PremwadeeNeural");
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).send(audioBuffer);
    } catch (e) {
      const msg = e.message || "";
      const isQuota = msg.includes("AZURE_TTS_ERROR_429");
      // ส่ง 503 กลับไปเสมอสำหรับ error ฝั่ง Azure (ไม่ใช่ 500) ให้ frontend แยกง่ายๆ ว่า "ควร fallback" ไม่ใช่ "บั๊กจริงจัง"
      return res.status(503).json({ error: msg, quotaExceeded: isQuota });
    }
  }

  // 🎯 กิ่งใหม่: AI ช่วยคิดเป้าหมาย + ประเมินคะแนนเป้าหมาย (ใช้ endpoint เดียวกัน กัน Vercel function เกิน 12 อัน)
  // mode "suggest" = แนะนำเป้าหมายใหม่ 4 ข้อ (จากประวัติ หรือจากหัวข้อที่พิมพ์)
  // mode "assess"  = ประเมินคะแนนให้เป้าหมายที่ผู้ใช้พิมพ์เอง (แทนระบบเลือกระดับความหินเดิมที่เลือกเองแล้วไม่แฟร์)
  if (body.action === "goal_ai") {
    const { mode, source, topic, historyTexts, text, callerToken } = body;
    if (!callerToken) return res.status(401).json({ error: "ไม่พบข้อมูลยืนยันตัวตน ลองล็อกอินใหม่" });
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) return res.status(500).json({ error: "ยังไม่ได้ตั้งค่า GEMINI_API_KEY บน Vercel" });

    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
      const authClient = createClient(supabaseUrl, anonKey);
      const { data: userData, error: userErr } = await authClient.auth.getUser(callerToken);
      if (userErr || !userData?.user) return res.status(401).json({ error: "ยืนยันตัวตนไม่สำเร็จ ลองล็อกอินใหม่" });

      // เกณฑ์คะแนนกลาง ใช้ร่วมกันทั้ง 2 mode ให้ประเมินสม่ำเสมอ ไม่ลอยๆ คนละมาตรฐาน
      const scoringRule = `เกณฑ์ให้คะแนน "points" เป็นตัวเลข 1-10 ประเมินจากความยาก/ความสำคัญของเป้าหมายนั้นเทียบกับเป้าหมายพัฒนาตัวเองรายวันทั่วไป (1=ง่ายมาก ทำแป๊บเดียว, 10=ท้าทายมาก ต้องวินัยสูง) อ้างอิงมาตรฐานสุขภาพ/พัฒนาตัวเองที่มีงานวิจัยรองรับเมื่อเกี่ยวข้อง เช่น:
- การเดิน/ออกกำลังกาย: WHO แนะนำ 150-300 นาที/สัปดาห์ระดับปานกลาง เทียบเท่าเดินประมาณ 7,000-8,000 ก้าว/วัน
- สมาธิ: ผู้เริ่มต้นควรเริ่มที่ 10-20 นาที/วัน
- หน้าจอเพื่อความบันเทิง (ผู้ใหญ่): ผู้เชี่ยวชาญแนะนำจำกัดไม่เกิน 2 ชม./วัน
- เรื่องอื่น (การเงิน/ภาษา/อ่านหนังสือ) ให้ประเมินตามความเหมาะสมทั่วไปอย่างสมเหตุสมผล
ใช้เกณฑ์เดียวกันนี้เสมอเพื่อให้คะแนนเทียบกันได้แฟร์ระหว่างผู้ใช้แต่ละคน`;

      let prompt;
      if (mode === "assess") {
        if (!text || typeof text !== "string") return res.status(400).json({ error: "ไม่มีข้อความเป้าหมายให้ประเมิน" });
        prompt = `ประเมินคะแนนสำหรับเป้าหมายพัฒนาตัวเองนี้: "${text.slice(0, 200)}"
${scoringRule}
เพิ่ม "reason": เหตุผลสั้นๆ ภาษาไทย ไม่เกิน 20 คำ อ้างอิงมาตรฐานที่ใช้ (ถ้ามี)
ตอบกลับเป็น JSON ล้วนๆ เท่านั้น ไม่มีข้อความอื่น ไม่มี markdown code fence รูปแบบนี้เป๊ะ:
{"points":5,"reason":"..."}`;
      } else {
        const ctx = source === "topic"
          ? `โดยเน้นหัวข้อที่ผู้ใช้สนใจ: "${(topic || "").slice(0, 200)}"`
          : `โดยดูจากเป้าหมายที่ผู้ใช้เคยตั้งไว้ก่อนหน้านี้: ${Array.isArray(historyTexts) && historyTexts.length ? historyTexts.slice(0, 20).join(", ") : "(ยังไม่มีประวัติ ให้แนะนำเป้าหมายพัฒนาตัวเองทั่วไปที่เหมาะกับผู้ใหญ่วัยทำงาน)"} — แนะนำเป้าหมายใหม่ที่ต่อยอด/เสริมจากพฤติกรรมเดิม ไม่ซ้ำของเดิมเป๊ะๆ`;
        prompt = `สร้างข้อเสนอแนะเป้าหมายพัฒนาตัวเองรายวัน ภาษาไทย จำนวน 4 ข้อ ${ctx}
${scoringRule}
แต่ละข้อต้องมี:
- "text": ข้อความเป้าหมาย กระชับ ปฏิบัติได้จริงภายในวันเดียว ไม่เกิน 12 คำ
- "points": ตามเกณฑ์ข้างต้น
- "reason": เหตุผลสั้นๆ ไม่เกิน 20 คำ อ้างอิงมาตรฐานที่ใช้ (ถ้ามี)

ตอบกลับเป็น JSON ล้วนๆ เท่านั้น ไม่มีข้อความอื่นนำหน้า/ตามหลัง ไม่มี markdown code fence รูปแบบนี้เป๊ะ:
{"goals":[{"text":"...","points":5,"reason":"..."}]}`;
      }

      // 🔒 บังคับให้ Gemini ตอบเป็น JSON ตาม schema ที่กำหนดตรงๆ (Structured Output) แทนการหวังพึ่งคำสั่งในพรอมต์เฉยๆ
      // แก้บั๊กเดิม: บางครั้ง AI ตอบ JSON ที่มีรูปแบบเพี้ยนเล็กน้อย (เช่น ขึ้นบรรทัดใหม่ในค่า string) ทำให้ JSON.parse พังกลางทาง
      const responseSchema = mode === "assess"
        ? { type: "OBJECT", properties: { points: { type: "INTEGER" }, reason: { type: "STRING" } }, required: ["points", "reason"] }
        : { type: "OBJECT", properties: { goals: { type: "ARRAY", items: { type: "OBJECT", properties: { text: { type: "STRING" }, points: { type: "INTEGER" }, reason: { type: "STRING" } }, required: ["text", "points", "reason"] } } }, required: ["goals"] };

      const r = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 2000, responseMimeType: "application/json", responseSchema },
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
      try {
        parsed = JSON.parse(cleaned);
      } catch (e) {
        const start = cleaned.indexOf("{");
        const end = cleaned.lastIndexOf("}");
        if (start !== -1 && end > start) { try { parsed = JSON.parse(cleaned.slice(start, end + 1)); } catch (e2) {} }
        if (!parsed) return res.status(500).json({ error: `แปลงผลลัพธ์จาก AI ไม่สำเร็จ ตัวอย่างที่ได้รับ: "${cleaned.slice(0, 400)}"` });
      }

      const clampPoints = (p) => Math.min(10, Math.max(1, Math.round(Number(p) || 5)));
      if (mode === "assess") {
        return res.status(200).json({ points: clampPoints(parsed.points), reason: parsed.reason || "" });
      }
      const goals = (Array.isArray(parsed.goals) ? parsed.goals : []).slice(0, 4).map((g) => ({
        text: (g.text || "").toString().slice(0, 80),
        points: clampPoints(g.points),
        reason: (g.reason || "").toString().slice(0, 120),
      })).filter((g) => g.text);
      return res.status(200).json({ goals });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ---- โค้ดเดิม: สร้างบทความความรู้รายวันด้วย Gemini ----
  const { interests, count, callerToken } = body;
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
          generationConfig: { maxOutputTokens: 10000 },
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
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      // ลองอีกที: ตัดเอาเฉพาะช่วง { ... } เผื่อ AI แถมข้อความอื่นมาด้วยทั้งที่สั่งห้ามแล้ว
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      if (start !== -1 && end > start) {
        try { parsed = JSON.parse(cleaned.slice(start, end + 1)); } catch (e2) {}
      }
      if (!parsed) {
        return res.status(500).json({ error: `แปลงผลลัพธ์จาก AI ไม่สำเร็จ (อาจตอบยาวเกินจนถูกตัดตอน) ตัวอย่างที่ได้รับ: "${cleaned.slice(0, 150)}"` });
      }
    }

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
