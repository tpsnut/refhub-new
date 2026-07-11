// 🛡️ RefHub — ตรวจสอบ CAPTCHA token กับ Cloudflare Turnstile (ใช้ตอนพิมพ์รหัสผิดครบ 5 ครั้ง)
// ไฟล์นี้วางไว้ที่ /api/verify-captcha.js ที่ root ของโปรเจกต์ (ข้างๆ src/)
//
// ขั้นตอนตั้งค่า (ทำครั้งเดียว):
// 1) ไปที่ dash.cloudflare.com > Turnstile > Add Site (ฟรี)
// 2) ใส่โดเมนที่ใช้งานจริง จะได้ Site Key + Secret Key
// 3) ตั้ง Environment Variables บน Vercel:
//    VITE_TURNSTILE_SITE_KEY (ใช้ฝั่งหน้าเว็บ), TURNSTILE_SECRET_KEY (ใช้ฝั่งนี้เท่านั้น ห้ามเปิดเผย)

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { token } = req.body || {};
  if (!token) return res.status(400).json({ error: "ไม่พบ CAPTCHA token" });
  if (!process.env.TURNSTILE_SECRET_KEY) return res.status(500).json({ error: "ยังไม่ได้ตั้งค่า TURNSTILE_SECRET_KEY บน Vercel" });

  try {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY, response: token }),
    });
    const data = await r.json();
    if (!data.success) return res.status(400).json({ error: "ยืนยันตัวตนไม่สำเร็จ ลองใหม่อีกครั้ง" });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
