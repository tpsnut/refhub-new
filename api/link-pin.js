// 🔑 RefHub — ให้บัญชีที่ล็อกอินด้วยอีเมล ตั้ง "ชื่อผู้ใช้ + PIN" ไว้เข้าเร็วๆ ได้เพิ่ม (ไม่ทิ้งอีเมลเดิม)
// ไฟล์นี้วางไว้ที่ /api/link-pin.js ที่ root ของโปรเจกต์ (ข้างๆ src/)

import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { username, pin, callerToken } = req.body || {};
  if (!username?.trim() || !pin) return res.status(400).json({ error: "กรอกข้อมูลไม่ครบ" });
  if (!/^[0-9]{4,6}$/.test(pin)) return res.status(400).json({ error: "PIN ต้องเป็นตัวเลข 4-6 หลักเท่านั้น" });
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return res.status(400).json({ error: "ชื่อผู้ใช้ต้องเป็นตัวอักษร/ตัวเลขภาษาอังกฤษ 3-20 ตัว" });
  if (!callerToken) return res.status(401).json({ error: "ไม่พบข้อมูลยืนยันตัวตน" });

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return res.status(500).json({ error: "ยังไม่ได้ตั้งค่า SUPABASE_SERVICE_ROLE_KEY บน Vercel" });

  try {
    const callerClient = createClient(supabaseUrl, anonKey);
    const { data: userData, error: userErr } = await callerClient.auth.getUser(callerToken);
    if (userErr || !userData?.user) return res.status(401).json({ error: "ยืนยันตัวตนไม่สำเร็จ ลองล็อกอินใหม่" });
    const callerId = userData.user.id;

    const admin = createClient(supabaseUrl, serviceKey);

    // เช็คว่าชื่อผู้ใช้นี้มีคนอื่นใช้ไปแล้วหรือยัง (ไม่นับตัวเอง)
    const { data: existing } = await admin.from("profiles").select("id").eq("username", username.toLowerCase().trim()).neq("id", callerId).maybeSingle();
    if (existing) return res.status(400).json({ error: "ชื่อผู้ใช้นี้มีคนใช้แล้ว ลองชื่ออื่น" });

    // ตั้ง PIN เป็นรหัสผ่านจริงของบัญชี (คนละช่องทางกับอีเมลเดิม ใช้เข้าได้ทั้งคู่)
    const { error: pwErr } = await admin.auth.admin.updateUserById(callerId, { password: pin });
    if (pwErr) throw pwErr;

    const { error: profileErr } = await admin.from("profiles").update({ username: username.toLowerCase().trim(), quick_pin_enabled: true }).eq("id", callerId);
    if (profileErr) throw profileErr;

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
