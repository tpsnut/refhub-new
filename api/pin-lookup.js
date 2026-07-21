// 🔑 RefHub — ค้นหาอีเมลจริงเบื้องหลังจาก "ชื่อผู้ใช้" (username) เพื่อใช้ล็อกอินด้วย PIN
// ไฟล์นี้วางไว้ที่ /api/pin-lookup.js ที่ root ของโปรเจกต์ (ข้างๆ src/) — ต้องอยู่คู่กับ api/link-pin.js
//
// ทำไมต้องมีไฟล์นี้: หน้า login (loginWith === "pin") จะยิง POST มาที่ /api/pin-lookup
// ส่ง { username } มา แล้วต้องการ { email } กลับไป เพื่อเอาไปยิง
// supabase.auth.signInWithPassword({ email, password: pin }) ต่อ (PIN ถูกเก็บเป็น "รหัสผ่านจริง" ของบัญชีนั้นๆ
// ตอนที่ทำ /api/link-pin.js ไปแล้ว) — ถ้าไฟล์นี้หายไป/deploy ไม่ผ่าน หน้า login ด้วย PIN จะพังทันที เพราะ fetch ได้ 404

import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { username } = req.body || {};
  if (!username?.trim()) return res.status(400).json({ error: "กรอกชื่อผู้ใช้ก่อน" });

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return res.status(500).json({ error: "ยังไม่ได้ตั้งค่า SUPABASE_SERVICE_ROLE_KEY บน Vercel" });

  try {
    // ใช้ service role เพราะตอนนี้ยังไม่มี session (ยังไม่ได้ล็อกอิน) — RLS ปกติจะบล็อกการอ่านของ anon
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: row, error } = await admin
      .from("profiles")
      .select("email, quick_pin_enabled")
      .eq("username", username.toLowerCase().trim())
      .maybeSingle();

    if (error) throw error;
    // ไม่บอกรายละเอียดเกินจำเป็นว่า "เจอชื่อแต่ยังไม่เปิด PIN" กับ "ไม่เจอชื่อเลย" ต่างกัน (กันเดาสุ่มชื่อผู้ใช้)
    if (!row || !row.email || row.quick_pin_enabled === false) {
      return res.status(404).json({ error: "ไม่พบชื่อผู้ใช้นี้ หรือยังไม่ได้ตั้งค่า PIN" });
    }

    return res.status(200).json({ email: row.email });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
