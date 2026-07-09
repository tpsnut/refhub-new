// 💬 RefHub — เริ่มห้องแชทส่วนตัวด้วยการแลกโค้ด (ใช้ service role สร้าง thread + membership ให้ทั้ง 2 ฝ่าย)
// ไฟล์นี้วางไว้ที่ /api/chat-start-direct.js ที่ root ของโปรเจกต์ (ข้างๆ src/)
// ใช้ Environment Variable เดียวกับ admin-create-user.js (SUPABASE_SERVICE_ROLE_KEY)

import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { friendCode, callerToken } = req.body || {};
  if (!friendCode?.trim()) return res.status(400).json({ error: "กรอกโค้ดของเพื่อนก่อน" });
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

    // เช็คว่าผู้เรียกมีสิทธิ์แชทไหม
    const { data: callerProfile } = await admin.from("profiles").select("can_chat").eq("id", callerId).single();
    if (!callerProfile?.can_chat) return res.status(403).json({ error: "คุณยังไม่ได้รับสิทธิ์ใช้งานแชท ติดต่อแอดมิน" });

    // หาเจ้าของโค้ด
    const { data: friend } = await admin.from("profiles").select("id, name, can_chat").eq("chat_code", friendCode.trim().toUpperCase()).single();
    if (!friend) return res.status(404).json({ error: "ไม่พบโค้ดนี้ในระบบ ลองเช็คอีกครั้ง" });
    if (friend.id === callerId) return res.status(400).json({ error: "นี่คือโค้ดของคุณเอง ให้เพื่อนกรอกแทนนะ" });
    if (!friend.can_chat) return res.status(403).json({ error: `${friend.name} ยังไม่ได้รับสิทธิ์ใช้งานแชท` });

    // เช็คว่ามีห้องแชทระหว่าง 2 คนนี้อยู่แล้วหรือยัง
    const { data: myThreads } = await admin.from("chat_thread_members").select("thread_id").eq("user_id", callerId);
    const { data: friendThreads } = await admin.from("chat_thread_members").select("thread_id").eq("user_id", friend.id);
    const shared = (myThreads || []).map((t) => t.thread_id).filter((id) => (friendThreads || []).some((f) => f.thread_id === id));

    let threadId = shared[0];
    if (!threadId) {
      const { data: newThread, error: threadErr } = await admin.from("chat_threads").insert({ type: "direct" }).select().single();
      if (threadErr) throw threadErr;
      threadId = newThread.id;
      await admin.from("chat_thread_members").insert([
        { thread_id: threadId, user_id: callerId },
        { thread_id: threadId, user_id: friend.id },
      ]);
    }

    return res.status(200).json({ ok: true, threadId, friendName: friend.name });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
