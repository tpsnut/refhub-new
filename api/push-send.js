// 🔔 RefHub — ส่ง Push Notification จริงไปยังเครื่องของผู้รับ (แม้ปิดแอปอยู่)
// ไฟล์นี้วางไว้ที่ /api/push-send.js ที่ root ของโปรเจกต์ (ข้างๆ src/)
//
// ต้องตั้งค่า Environment Variable ใหม่บน Vercel:
//   VAPID_PUBLIC_KEY  = BFy33ifhVn7LbyBEss6YmzFys3ycPicm2QVblaxb7BOBTkpQoWDuihkoz0l7ZSeQvZpdUl5JfWgvvCzt24IFm4Y
//   VAPID_PRIVATE_KEY = EMd5LnKbR2MkMSAVWrFJ4U5OjSsAO1MSJmALXJTGAqQ
// (สร้างไว้ให้แล้ว คู่นี้ใช้ได้เลย ไม่ต้องสร้างใหม่ — แต่ห้ามเอา PRIVATE_KEY ไปโชว์ที่ไหนอีก)
// ⚠️ PRIVATE_KEY ต้องอยู่ฝั่งเซิร์ฟเวอร์เท่านั้น ห้ามใส่ VITE_ นำหน้าเด็ดขาด

import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { recipientIds, title, body, callerToken } = req.body || {};
  if (!Array.isArray(recipientIds) || recipientIds.length === 0) return res.status(400).json({ error: "ไม่มีผู้รับ" });
  if (!callerToken) return res.status(401).json({ error: "ไม่พบข้อมูลยืนยันตัวตน" });

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const vapidPublic = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  if (!vapidPublic || !vapidPrivate) return res.status(500).json({ error: "ยังไม่ได้ตั้งค่า VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY บน Vercel" });

  try {
    // เช็คแค่ว่าล็อกอินอยู่จริง (กันคนแปลกหน้ายิง API มาป่วนคนอื่น)
    const authClient = createClient(supabaseUrl, anonKey);
    const { data: userData, error: userErr } = await authClient.auth.getUser(callerToken);
    if (userErr || !userData?.user) return res.status(401).json({ error: "ยืนยันตัวตนไม่สำเร็จ" });

    webpush.setVapidDetails("mailto:noreply@refhub.local", vapidPublic, vapidPrivate);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: subs } = await admin.from("push_subscriptions").select("*").in("user_id", recipientIds);

    const payload = JSON.stringify({ title: title || "RefHub", body: body || "มีข้อความใหม่" });
    const results = await Promise.allSettled(
      (subs || []).map((s) =>
        webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, payload).catch(async (err) => {
          // ถ้า subscription หมดอายุ/ถูกยกเลิกจากฝั่งเบราว์เซอร์ (410/404) ให้ลบทิ้งกันขยะสะสม
          if (err.statusCode === 410 || err.statusCode === 404) {
            await admin.from("push_subscriptions").delete().eq("id", s.id);
          }
          throw err;
        })
      )
    );

    return res.status(200).json({ ok: true, sent: results.filter((r) => r.status === "fulfilled").length, failed: results.filter((r) => r.status === "rejected").length });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
