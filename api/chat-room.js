// 🏠 RefHub — สร้าง/เข้าร่วมห้องแชทกลุ่มที่ผู้ใช้สร้างเอง (ใช้ service role สร้าง thread + membership ให้ปลอดภัย)
// ไฟล์นี้วางไว้ที่ /api/chat-room.js ที่ root ของโปรเจกต์ (ข้างๆ src/)
// ใช้ Environment Variable เดียวกับ chat-start-direct.js (SUPABASE_SERVICE_ROLE_KEY)

import { createClient } from "@supabase/supabase-js";

const genCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { action, name, avatarUrl, joinCode, callerToken } = req.body || {};
  if (!callerToken) return res.status(401).json({ error: "ไม่พบข้อมูลยืนยันตัวตน ลองล็อกอินใหม่" });

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

    const { data: callerProfile } = await admin.from("profiles").select("can_chat").eq("id", callerId).single();
    if (!callerProfile?.can_chat) return res.status(403).json({ error: "คุณยังไม่ได้รับสิทธิ์ใช้งานแชท ติดต่อแอดมิน" });

    if (action === "create") {
      if (!name?.trim()) return res.status(400).json({ error: "ตั้งชื่อห้องก่อน" });
      let joinCodeNew = genCode();
      // กันโค้ดชนกัน (โอกาสน้อยมาก แต่เช็คไว้)
      for (let i = 0; i < 3; i++) {
        const { data: exists } = await admin.from("chat_threads").select("id").eq("join_code", joinCodeNew).maybeSingle();
        if (!exists) break;
        joinCodeNew = genCode();
      }
      const { data: thread, error: threadErr } = await admin.from("chat_threads").insert({
        type: "group", name: name.trim(), avatar_url: avatarUrl || null, created_by: callerId, join_code: joinCodeNew,
      }).select().single();
      if (threadErr) throw threadErr;
      await admin.from("chat_thread_members").insert({ thread_id: thread.id, user_id: callerId });
      return res.status(200).json({ ok: true, threadId: thread.id, name: thread.name, joinCode: joinCodeNew, avatarUrl: thread.avatar_url });
    }

    if (action === "join") {
      if (!joinCode?.trim()) return res.status(400).json({ error: "กรอกโค้ดห้องก่อน" });
      const { data: thread } = await admin.from("chat_threads").select("*").eq("join_code", joinCode.trim().toUpperCase()).single();
      if (!thread) return res.status(404).json({ error: "ไม่พบห้องที่ใช้โค้ดนี้ ลองเช็คอีกครั้ง" });
      const { data: already } = await admin.from("chat_thread_members").select("*").eq("thread_id", thread.id).eq("user_id", callerId).maybeSingle();
      if (!already) await admin.from("chat_thread_members").insert({ thread_id: thread.id, user_id: callerId });
      return res.status(200).json({ ok: true, threadId: thread.id, name: thread.name, avatarUrl: thread.avatar_url });
    }

    return res.status(400).json({ error: "ไม่รู้จัก action นี้" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
