// 🏠 RefHub — ระบบคัดสรรกลุ่ม R-E-F (Reason/Emotion/Force)
// ไฟล์นี้วางไว้ที่ /api/sorting-group.js ที่ root ของโปรเจกต์ (ข้างๆ src/)

import { createClient } from "@supabase/supabase-js";

const GROUP_ROOM_IDS = {
  reason: "00000000-0000-0000-0000-0000000000f1",
  emotion: "00000000-0000-0000-0000-0000000000f2",
  force: "00000000-0000-0000-0000-0000000000f3",
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { action, group, callerToken } = req.body || {};
  if (!callerToken) return res.status(401).json({ error: "ไม่พบข้อมูลยืนยันตัวตน" });

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

  try {
    const authClient = createClient(supabaseUrl, anonKey);
    const { data: userData, error: userErr } = await authClient.auth.getUser(callerToken);
    if (userErr || !userData?.user) return res.status(401).json({ error: "ยืนยันตัวตนไม่สำเร็จ" });
    const callerId = userData.user.id;

    const admin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);

    if (action === "sort") {
      if (!GROUP_ROOM_IDS[group]) return res.status(400).json({ error: "ไม่รู้จักกลุ่มนี้" });

      // เช็คสิทธิ์และว่ายังไม่เคยถูกคัดสรรมาก่อน (กันยิงซ้ำ)
      const { data: prof } = await admin.from("profiles").select("can_use_sorting, sorted_group").eq("id", callerId).single();
      if (!prof?.can_use_sorting) return res.status(403).json({ error: "คุณยังไม่ได้รับสิทธิ์เข้าร่วมห้องคัดสรร" });
      if (prof.sorted_group) return res.status(400).json({ error: "คุณถูกคัดสรรไปแล้ว ใช้ระบบขอสลับกลุ่มแทน" });

      await admin.from("profiles").update({ sorted_group: group }).eq("id", callerId);
      const roomId = GROUP_ROOM_IDS[group];
      const { data: already } = await admin.from("chat_thread_members").select("*").eq("thread_id", roomId).eq("user_id", callerId).maybeSingle();
      if (!already) await admin.from("chat_thread_members").insert({ thread_id: roomId, user_id: callerId });

      return res.status(200).json({ ok: true, group, threadId: roomId });
    }

    if (action === "request_switch") {
      if (!GROUP_ROOM_IDS[group]) return res.status(400).json({ error: "ไม่รู้จักกลุ่มนี้" });
      await admin.from("profiles").update({ group_switch_request: group }).eq("id", callerId);
      return res.status(200).json({ ok: true });
    }

    if (action === "approve_switch") {
      // เฉพาะแอดมินเท่านั้นที่อนุมัติได้
      const { targetUserId } = req.body || {};
      const { data: callerProfile } = await admin.from("profiles").select("role").eq("id", callerId).single();
      if (callerProfile?.role !== "admin") return res.status(403).json({ error: "เฉพาะแอดมินเท่านั้น" });
      const { data: target } = await admin.from("profiles").select("group_switch_request, sorted_group").eq("id", targetUserId).single();
      if (!target?.group_switch_request) return res.status(400).json({ error: "คนนี้ไม่มีคำขอสลับกลุ่มค้างอยู่" });

      const newGroup = target.group_switch_request;
      const oldRoomId = GROUP_ROOM_IDS[target.sorted_group];
      const newRoomId = GROUP_ROOM_IDS[newGroup];
      if (oldRoomId) await admin.from("chat_thread_members").delete().eq("thread_id", oldRoomId).eq("user_id", targetUserId);
      const { data: already } = await admin.from("chat_thread_members").select("*").eq("thread_id", newRoomId).eq("user_id", targetUserId).maybeSingle();
      if (!already) await admin.from("chat_thread_members").insert({ thread_id: newRoomId, user_id: targetUserId });
      await admin.from("profiles").update({ sorted_group: newGroup, group_switch_request: null }).eq("id", targetUserId);

      return res.status(200).json({ ok: true });
    }

    if (action === "admin_join_all") {
      const { data: callerProfile } = await admin.from("profiles").select("role").eq("id", callerId).single();
      if (callerProfile?.role !== "admin") return res.status(403).json({ error: "เฉพาะแอดมินเท่านั้น" });
      for (const roomId of Object.values(GROUP_ROOM_IDS)) {
        const { data: already } = await admin.from("chat_thread_members").select("*").eq("thread_id", roomId).eq("user_id", callerId).maybeSingle();
        if (!already) await admin.from("chat_thread_members").insert({ thread_id: roomId, user_id: callerId });
      }
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: "ไม่รู้จัก action นี้" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
