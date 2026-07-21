// 🏠 RefHub — รวมฟังก์ชันเกี่ยวกับ "ห้องแชท" ทั้งหมดไว้ในไฟล์เดียว
// (เดิมแยกเป็น chat-room.js + chat-start-direct.js + sorting-group.js — รวมกันเพื่อไม่ให้เกินโควตา
//  12 Serverless Functions ของ Vercel Hobby plan ตอนเพิ่มฟีเจอร์ใหม่ๆ เข้ามาอีก)
// ไฟล์นี้วางไว้ที่ /api/chat-room.js ที่ root ของโปรเจกต์ (ข้างๆ src/)
// แทนที่ chat-room.js เดิม และลบ chat-start-direct.js, sorting-group.js ออกจาก repo ทิ้งไปเลย
//
// action ทั้งหมดที่รองรับ:
//   create, join, delete, members, kick, toggle_mute   -> เดิมของ chat-room.js
//   start_direct                                        -> เดิมของ chat-start-direct.js (ไม่มี action มาก่อน เลยตั้งชื่อให้)
//   sort, request_switch, approve_switch, admin_join_all -> เดิมของ sorting-group.js (ระบบคัดสรรกลุ่ม R-E-F)

import { createClient } from "@supabase/supabase-js";

const genCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

const GROUP_ROOM_IDS = {
  reason: "00000000-0000-0000-0000-0000000000f1",
  emotion: "00000000-0000-0000-0000-0000000000f2",
  force: "00000000-0000-0000-0000-0000000000f3",
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { action, callerToken } = req.body || {};
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

    // ========== กลุ่ม action ของ chat-room เดิม (ต้องมีสิทธิ์แชทก่อนเสมอ) ==========
    if (["create", "join", "delete", "members", "kick", "toggle_mute", "start_direct"].includes(action)) {
      const { data: callerProfile } = await admin.from("profiles").select("can_chat, role").eq("id", callerId).single();
      const callerHasFullAccess = callerProfile?.role === "admin" || callerProfile?.role === "trusted";
      if (!callerProfile?.can_chat && !callerHasFullAccess) return res.status(403).json({ error: "คุณยังไม่ได้รับสิทธิ์ใช้งานแชท ติดต่อแอดมิน" });
    }

    if (action === "create") {
      const { name, avatarUrl } = req.body || {};
      if (!name?.trim()) return res.status(400).json({ error: "ตั้งชื่อห้องก่อน" });
      let joinCodeNew = genCode();
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
      const { joinCode } = req.body || {};
      if (!joinCode?.trim()) return res.status(400).json({ error: "กรอกโค้ดห้องก่อน" });
      const { data: thread } = await admin.from("chat_threads").select("*").eq("join_code", joinCode.trim().toUpperCase()).maybeSingle();
      if (!thread) return res.status(404).json({ error: "ไม่พบห้องที่ใช้โค้ดนี้ ลองเช็คอีกครั้ง" });
      const { data: already } = await admin.from("chat_thread_members").select("*").eq("thread_id", thread.id).eq("user_id", callerId).maybeSingle();
      if (!already) await admin.from("chat_thread_members").insert({ thread_id: thread.id, user_id: callerId });
      return res.status(200).json({ ok: true, threadId: thread.id, name: thread.name, avatarUrl: thread.avatar_url });
    }

    if (action === "delete") {
      const { threadId } = req.body || {};
      if (!threadId) return res.status(400).json({ error: "ไม่พบห้องที่จะลบ" });
      const { data: thread } = await admin.from("chat_threads").select("created_by").eq("id", threadId).maybeSingle();
      if (!thread) return res.status(404).json({ error: "ไม่พบห้องนี้" });
      if (thread.created_by !== callerId) return res.status(403).json({ error: "ลบห้องนี้ได้เฉพาะคนที่สร้างห้องเท่านั้น" });
      await admin.from("chat_messages").delete().eq("thread_id", threadId);
      await admin.from("chat_reads").delete().eq("thread_id", threadId);
      await admin.from("chat_thread_members").delete().eq("thread_id", threadId);
      await admin.from("chat_threads").delete().eq("id", threadId);
      return res.status(200).json({ ok: true });
    }

    if (action === "members") {
      const { threadId } = req.body || {};
      if (!threadId) return res.status(400).json({ error: "ไม่พบห้อง" });
      const { data: thread } = await admin.from("chat_threads").select("created_by").eq("id", threadId).maybeSingle();
      if (!thread) return res.status(404).json({ error: "ไม่พบห้องนี้" });
      const { data: members } = await admin.from("chat_thread_members").select("user_id, muted").eq("thread_id", threadId);
      const ids = (members || []).map((m) => m.user_id);
      const { data: profiles } = ids.length ? await admin.from("profiles").select("id, name, avatar_url").in("id", ids) : { data: [] };
      const list = (members || []).map((m) => ({
        userId: m.user_id, muted: m.muted,
        name: (profiles || []).find((p) => p.id === m.user_id)?.name || "ไม่ทราบชื่อ",
        avatarUrl: (profiles || []).find((p) => p.id === m.user_id)?.avatar_url || null,
        isCreator: m.user_id === thread.created_by,
      }));
      return res.status(200).json({ ok: true, members: list, isCreator: thread.created_by === callerId });
    }

    if (action === "kick" || action === "toggle_mute") {
      const { threadId, targetUserId, muted } = req.body || {};
      if (!threadId || !targetUserId) return res.status(400).json({ error: "ข้อมูลไม่ครบ" });
      const { data: thread } = await admin.from("chat_threads").select("created_by").eq("id", threadId).maybeSingle();
      if (!thread) return res.status(404).json({ error: "ไม่พบห้องนี้" });
      if (thread.created_by !== callerId) return res.status(403).json({ error: "ทำได้เฉพาะคนที่สร้างห้องเท่านั้น" });
      if (targetUserId === callerId) return res.status(400).json({ error: "จัดการตัวเองด้วยวิธีนี้ไม่ได้" });
      if (action === "kick") {
        await admin.from("chat_thread_members").delete().eq("thread_id", threadId).eq("user_id", targetUserId);
      } else {
        await admin.from("chat_thread_members").update({ muted: !!muted }).eq("thread_id", threadId).eq("user_id", targetUserId);
      }
      return res.status(200).json({ ok: true });
    }

    // ========== เดิมของ chat-start-direct.js ==========
    if (action === "start_direct") {
      const { friendCode, targetUserId } = req.body || {};
      if (!friendCode?.trim() && !targetUserId) return res.status(400).json({ error: "กรอกโค้ดของเพื่อนก่อน" });

      const { data: friend } = targetUserId
        ? await admin.from("profiles").select("id, name, can_chat, role").eq("id", targetUserId).maybeSingle()
        : await admin.from("profiles").select("id, name, can_chat, role").eq("chat_code", friendCode.trim().toUpperCase()).maybeSingle();
      if (!friend) return res.status(404).json({ error: targetUserId ? "ไม่พบผู้ใช้นี้" : "ไม่พบโค้ดนี้ในระบบ ลองเช็คอีกครั้ง" });
      if (friend.id === callerId) return res.status(400).json({ error: "นี่คือโค้ดของคุณเอง ให้เพื่อนกรอกแทนนะ" });
      const friendHasFullAccess = friend.role === "admin" || friend.role === "trusted";
      if (!friend.can_chat && !friendHasFullAccess) return res.status(403).json({ error: `${friend.name} ยังไม่ได้รับสิทธิ์ใช้งานแชท` });

      const { data: myThreads } = await admin.from("chat_thread_members").select("thread_id").eq("user_id", callerId);
      const { data: friendThreads } = await admin.from("chat_thread_members").select("thread_id").eq("user_id", friend.id);
      const sharedIds = (myThreads || []).map((t) => t.thread_id).filter((id) => (friendThreads || []).some((f) => f.thread_id === id));

      let threadId = null;
      if (sharedIds.length) {
        const { data: directThreads } = await admin.from("chat_threads").select("id").in("id", sharedIds).eq("type", "direct");
        threadId = directThreads?.[0]?.id || null;
      }
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
    }

    // ========== เดิมของ sorting-group.js ==========
    if (action === "sort") {
      const { group } = req.body || {};
      if (!GROUP_ROOM_IDS[group]) return res.status(400).json({ error: "ไม่รู้จักกลุ่มนี้" });
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
      const { group } = req.body || {};
      if (!GROUP_ROOM_IDS[group]) return res.status(400).json({ error: "ไม่รู้จักกลุ่มนี้" });
      await admin.from("profiles").update({ group_switch_request: group }).eq("id", callerId);
      return res.status(200).json({ ok: true });
    }

    if (action === "approve_switch") {
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
