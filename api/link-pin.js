// 🔑 RefHub — จัดการ PIN ทั้ง 2 อย่างในไฟล์เดียว (รวมกันเพื่อไม่ให้เกินโควตา 12 Serverless Functions ของ Vercel Hobby plan)
// ไฟล์นี้วางไว้ที่ /api/link-pin.js ที่ root ของโปรเจกต์ (ข้างๆ src/) — แทนที่ทั้ง link-pin.js เดิม และ pin-lookup.js
// ⚠️ ลบไฟล์ api/pin-lookup.js ออกจาก repo ด้วย ไม่งั้นจะยังเกิน 12 ไฟล์เหมือนเดิม
//
// action: "link"   -> บัญชีอีเมลที่ล็อกอินอยู่ ตั้งชื่อผู้ใช้ + PIN ใหม่ (ต้องมี callerToken)
// action: "lookup" -> ตอน login ด้วย PIN ส่ง username มา ขอ email กลับไปเพื่อเอาไป signInWithPassword ต่อ (ไม่ต้อง login มาก่อน)

import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { action } = req.body || {};
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return res.status(500).json({ error: "ยังไม่ได้ตั้งค่า SUPABASE_SERVICE_ROLE_KEY บน Vercel" });

  // ---------- lookup: ใช้ตอนหน้า login ด้วย PIN (ยังไม่มี session) ----------
  if (action === "lookup") {
    const { username } = req.body || {};
    if (!username?.trim()) return res.status(400).json({ error: "กรอกชื่อผู้ใช้ก่อน" });
    try {
      const admin = createClient(supabaseUrl, serviceKey);
      const { data: row, error } = await admin
        .from("profiles")
        .select("email, quick_pin_enabled")
        .eq("username", username.toLowerCase().trim())
        .maybeSingle();
      if (error) throw error;
      if (!row || !row.email) {
        return res.status(404).json({ error: "ไม่พบชื่อผู้ใช้นี้" });
      }
      return res.status(200).json({ email: row.email });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ---------- link (ค่าเริ่มต้น): ให้บัญชีอีเมลที่ login อยู่ ตั้งชื่อผู้ใช้ + PIN เพิ่ม ----------
  const { username, pin, callerToken } = req.body || {};
  if (!username?.trim() || !pin) return res.status(400).json({ error: "กรอกข้อมูลไม่ครบ" });
  if (!/^[0-9]{4,6}$/.test(pin)) return res.status(400).json({ error: "PIN ต้องเป็นตัวเลข 4-6 หลักเท่านั้น" });
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return res.status(400).json({ error: "ชื่อผู้ใช้ต้องเป็นตัวอักษร/ตัวเลขภาษาอังกฤษ 3-20 ตัว" });
  if (!callerToken) return res.status(401).json({ error: "ไม่พบข้อมูลยืนยันตัวตน" });

  try {
    const callerClient = createClient(supabaseUrl, anonKey);
    const { data: userData, error: userErr } = await callerClient.auth.getUser(callerToken);
    if (userErr || !userData?.user) return res.status(401).json({ error: "ยืนยันตัวตนไม่สำเร็จ ลองล็อกอินใหม่" });
    const callerId = userData.user.id;

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: existing } = await admin.from("profiles").select("id").eq("username", username.toLowerCase().trim()).neq("id", callerId).maybeSingle();
    if (existing) return res.status(400).json({ error: "ชื่อผู้ใช้นี้มีคนใช้แล้ว ลองชื่ออื่น" });

    const { error: pwErr } = await admin.auth.admin.updateUserById(callerId, { password: pin });
    if (pwErr) throw pwErr;

    const { error: profileErr } = await admin.from("profiles").update({ username: username.toLowerCase().trim(), quick_pin_enabled: true }).eq("id", callerId);
    if (profileErr) throw profileErr;

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
