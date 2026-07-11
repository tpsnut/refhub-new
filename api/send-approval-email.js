// 📧 RefHub — ส่งอีเมลแจ้งผู้ใช้ตอนแอดมินกดอนุมัติ (ใช้ Resend — ฟรี 3,000 อีเมล/เดือน ไม่ต้องผูกบัตร)
// ไฟล์นี้วางไว้ที่ /api/send-approval-email.js ที่ root ของโปรเจกต์ (ข้างๆ src/)
//
// ขั้นตอนตั้งค่า (ทำครั้งเดียว):
// 1) สมัครฟรีที่ https://resend.com (ไม่ต้องผูกบัตรเครดิต)
// 2) เมนู API Keys > Create API Key > copy มาตั้งเป็น Environment Variable ชื่อ RESEND_API_KEY บน Vercel
// 3) ⚠️ ต้องมีโดเมนของตัวเองยืนยันกับ Resend ก่อนถึงจะส่งอีเมลได้ (Resend ไม่มีตัวส่งทดสอบแบบไม่ต้องยืนยันโดเมนแล้ว)
//    ไปที่ Dashboard > Domains > Add Domain ใส่ DNS records ตามที่ Resend บอก แล้วตั้ง Environment Variable ชื่อ RESEND_FROM_EMAIL
//    เป็นอีเมลจากโดเมนที่ยืนยันแล้ว เช่น "RefHub <noreply@mail.yourdomain.com>"

import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { toEmail, toName, callerToken } = req.body || {};
  if (!toEmail) return res.status(400).json({ error: "ไม่มีอีเมลผู้รับ" });
  if (!callerToken) return res.status(401).json({ error: "ไม่พบข้อมูลยืนยันตัวตน" });
  if (!process.env.RESEND_API_KEY) return res.status(500).json({ error: "ยังไม่ได้ตั้งค่า RESEND_API_KEY บน Vercel" });
  if (!process.env.RESEND_FROM_EMAIL) return res.status(500).json({ error: "ยังไม่ได้ตั้งค่า RESEND_FROM_EMAIL บน Vercel (ต้องเป็นอีเมลจากโดเมนที่ยืนยันกับ Resend แล้วเท่านั้น)" });

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

  try {
    // เช็คว่าคนเรียก endpoint นี้เป็นแอดมินจริง กันคนอื่นยิงส่งอีเมลมั่ว
    const authClient = createClient(supabaseUrl, anonKey);
    const { data: userData, error: userErr } = await authClient.auth.getUser(callerToken);
    if (userErr || !userData?.user) return res.status(401).json({ error: "ยืนยันตัวตนไม่สำเร็จ" });
    const admin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data: callerProfile } = await admin.from("profiles").select("role").eq("id", userData.user.id).single();
    if (callerProfile?.role !== "admin") return res.status(403).json({ error: "เฉพาะแอดมินเท่านั้นที่ส่งอีเมลนี้ได้" });

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL,
        to: [toEmail],
        subject: "บัญชี RefHub ของคุณได้รับการอนุมัติแล้ว 🎉",
        html: `<div style="font-family:sans-serif;padding:24px;background:#F6F1E8;">
          <h2 style="color:#2B2013;">ยินดีต้อนรับ${toName ? ` คุณ${toName}` : ""}! 🎉</h2>
          <p style="color:#5A5142;font-size:15px;line-height:1.6;">บัญชีของคุณได้รับการอนุมัติให้ใช้งาน RefHub แล้ว เข้าแอปแล้วเริ่มใช้งานได้เลยตอนนี้ครับ</p>
        </div>`,
      }),
    });
    const data = await r.json();
    if (!r.ok) return res.status(500).json({ error: data?.message || "ส่งอีเมลไม่สำเร็จ" });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
