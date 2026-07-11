// 📞 RefHub — สร้าง LiveKit access token สำหรับเข้าห้องคุยเสียง/วิดีโอ
// ไฟล์นี้วางไว้ที่ /api/livekit-token.js ที่ root ของโปรเจกต์ (ข้างๆ src/)
//
// ขั้นตอนตั้งค่า (ทำครั้งเดียว):
// 1) สมัครฟรีที่ https://livekit.io (Cloud) ไม่ต้องผูกบัตร
// 2) สร้างโปรเจกต์ใหม่ > Settings > Keys > Create Key ได้ API Key + API Secret
// 3) จะได้ URL ของ LiveKit server ด้วย (รูปแบบ wss://your-project.livekit.cloud)
// 4) ตั้งค่า Environment Variables บน Vercel:
//    LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL

import { AccessToken } from "livekit-server-sdk";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { roomName, participantName, callerToken } = req.body || {};
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
    const authClient = createClient(supabaseUrl, anonKey);
    const { data: userData, error: userErr } = await authClient.auth.getUser(callerToken);
    if (userErr || !userData?.user) return res.status(401).json({ error: "ยืนยันตัวตนไม่สำเร็จ" });

    const at = new AccessToken(apiKey, apiSecret, {
      identity: userData.user.id,
      name: participantName || "ผู้ใช้",
    });
    at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true, canPublishData: true });
    const token = await at.toJwt();

    return res.status(200).json({ token, url: livekitUrl });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
