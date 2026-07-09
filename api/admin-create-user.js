// 👑 RefHub — แอดมินสร้างบัญชี "ชื่อ + PIN" ให้คนอื่นโดยตรง (ไม่ต้องมีอีเมล)
// ไฟล์นี้วางไว้ที่ /api/admin-create-user.js ที่ root ของโปรเจกต์ (ข้างๆ src/)
//
// ต้องตั้งค่า Environment Variable ใหม่บน Vercel: SUPABASE_SERVICE_ROLE_KEY
// หาได้จาก Supabase Dashboard > Project Settings > API > "service_role" (secret key)
// ⚠️ ห้ามใส่ VITE_ นำหน้าเด็ดขาด และห้ามเอาไปใส่ในโค้ด frontend เองเป็นอันขาด
// เพราะคีย์นี้มีสิทธิ์เต็มข้ามระบบ RLS ทั้งหมด รั่วไหลแล้วอันตรายมาก

import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { name, username, pin, callerToken } = req.body || {};
  if (!name?.trim() || !username?.trim() || !pin) return res.status(400).json({ error: "กรอกข้อมูลไม่ครบ" });
  if (!/^[0-9]{4,6}$/.test(pin)) return res.status(400).json({ error: "PIN ต้องเป็นตัวเลข 4-6 หลักเท่านั้น" });
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return res.status(400).json({ error: "ชื่อผู้ใช้ต้องเป็นตัวอักษร/ตัวเลขภาษาอังกฤษ 3-20 ตัว" });

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return res.status(500).json({ error: "ยังไม่ได้ตั้งค่า SUPABASE_SERVICE_ROLE_KEY บน Vercel" });
  if (!callerToken) return res.status(401).json({ error: "ไม่พบข้อมูลยืนยันตัวตนของผู้เรียก" });

  try {
    // 1) ยืนยันว่าคนเรียก API นี้ล็อกอินอยู่จริง และเป็น "แอดมิน" เท่านั้น (กันคนอื่นยิง API ตรงๆ มาสร้างบัญชีเอง)
    const callerClient = createClient(supabaseUrl, anonKey);
    const { data: userData, error: userErr } = await callerClient.auth.getUser(callerToken);
    if (userErr || !userData?.user) return res.status(401).json({ error: "ยืนยันตัวตนไม่สำเร็จ ลองล็อกอินใหม่" });

    // ใช้ service role เช็ค role แทน (callerClient ไม่มี auth header แนบไปตอน query ทำให้ RLS มองเป็น anon แล้วเห็นข้อมูลว่างเปล่าเสมอ)
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: callerProfile } = await admin.from("profiles").select("role").eq("id", userData.user.id).single();
    if (callerProfile?.role !== "admin") return res.status(403).json({ error: "เฉพาะแอดมินเท่านั้นที่สร้างบัญชีแบบนี้ได้" });

    // 2) ใช้ service role (สิทธิ์เต็ม) สร้างบัญชีจริง + แถว profile ให้
    const email = `${username.toLowerCase().trim()}@refhub.local`; // อีเมลปลอมภายใน ใช้แค่เป็น key ล็อกอิน ไม่มีการส่งเมลจริง

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email, password: pin, email_confirm: true,
    });
    if (createErr) return res.status(400).json({ error: createErr.message === "User already registered" ? "ชื่อผู้ใช้นี้มีคนใช้แล้ว ลองชื่ออื่น" : createErr.message });

    const { error: profileErr } = await admin.from("profiles").insert({
      id: created.user.id, email, name: name.trim(),
      username: username.toLowerCase().trim(), login_type: "pin",
      role: "member", approved: true, // แอดมินสร้างให้ตรงๆ = อนุมัติทันที ไม่ต้องรอ
    });
    if (profileErr) return res.status(400).json({ error: profileErr.message });

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
