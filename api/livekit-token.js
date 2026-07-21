// 📞 RefHub — สร้าง LiveKit access token สำหรับเข้าห้องคุยเสียง/วิดีโอ
// ไฟล์นี้วางไว้ที่ /api/livekit-token.js ที่ root ของโปรเจกต์ (ข้างๆ src/)
//
// Environment Variables ที่ต้องมีบน Vercel:
//   LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL
//   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

import { AccessToken } from "livekit-server-sdk";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { roomName, participantName, avatar, sessionId, callerToken } = req.body || {};
  if (!roomName) return res.status(400).json({ error: "ไม่พบชื่อห้อง" });
  if (!callerToken) return res.status(401).json({ error: "ไม่พบข้อมูลยืนยันตัวตน" });

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const livekitUrl = process.env.LIVEKIT_URL;
  if (!apiKey || !apiSecret || !livekitUrl) {
    return res.status(500).json({ error: "ยังไม่ได้ตั้งค่า LIVEKIT_API_KEY/LIVEKIT_API_SECRET/LIVEKIT_URL บน Vercel" });
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !anonKey) {
      return res.status(500).json({ error: "ยังไม่ได้ตั้งค่า VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY บน Vercel" });
    }

    // ✅ ยืนยัน token ผ่าน Authorization header (เชื่อถือได้กว่าการส่ง token เป็น argument ตรงๆ)
    // วิธีเดิม getUser(token) บางครั้ง reject token ที่ยัง valid — วิธีนี้ให้ client แนบ header ให้เอง
    let userId = null;
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${callerToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userErr } = await authClient.auth.getUser();
    if (!userErr && userData?.user) {
      userId = userData.user.id;
    } else {
      // สำรอง: ลองแบบส่ง token เป็น argument (เผื่อ header ไม่ทำงานในบางกรณี)
      const { data: d2, error: e2 } = await authClient.auth.getUser(callerToken);
      if (!e2 && d2?.user) userId = d2.user.id;
    }

    if (!userId) return res.status(401).json({ error: "ยืนยันตัวตนไม่สำเร็จ" });

    const at = new AccessToken(apiKey, apiSecret, {
      identity: `${userId}:${sessionId || Date.now()}`,
      name: participantName || "ผู้ใช้",
      metadata: JSON.stringify({ avatar: avatar || "" }),
    });
    at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true, canPublishData: true });
    const token = await at.toJwt();

    return res.status(200).json({ token, url: livekitUrl });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
