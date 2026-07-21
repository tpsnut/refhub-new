import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Home, Lightbulb, TrendingUp, Plus, Newspaper, Languages, StickyNote,
  Sun, Moon, Send, Check, Trash2, X, Wallet, Target, BookOpen, ChevronRight,
  Sparkles, Clock, Search, Volume2, VolumeX, Pencil, Download, ArrowLeft, Users, Camera, Phone, Mic, MicOff, PhoneOff, RefreshCw,
  Utensils, Car, ShoppingBag, Receipt, Gamepad2, HeartPulse, Briefcase, Gift, Coffee, Music,
  Play, Pause, Link2, Upload, SkipBack, SkipForward, Handshake, Coins, PiggyBank, FileSpreadsheet, FileText, Palette, ALargeSmall, ShieldCheck, Bell, UserCheck, UserX, Wifi, MessageCircle, MoreVertical, KeyRound, MapPin, Copy, LockKeyhole, LogOut, LayoutGrid, Maximize2, Volume1
} from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from "recharts";
// 📝 BlockNote — editor แบบ Notion (toggle, checklist, หัวข้อ, แนบรูป/ไฟล์) สำหรับหน้าโน้ตฉบับเต็ม
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
// 🌐 ต่อท่อระบบฐานข้อมูล Cloud
import { supabase } from "./supabaseClient";
// userId ตอนนี้มาจาก Supabase Auth session แล้ว (ดูใน RefHub component ด้านล่าง) ไม่ใช่ค่าคงที่จาก .env อีกต่อไป

// ---------------- Mentors ----------------
const MENTORS = {
  loid: {
    name: "Loid", full: "Loid Forger", tag: "กลยุทธ์ · วางแผน · เวลา", mood: "อบอุ่น โฟกัส",
    letter: "L", accent: "#3E8E5A", accent2: "#5FB07C", onAccent: "#ffffff",
    scale: [261.6, 293.7, 329.6, 392.0, 440.0], root: 130.8, // C major pentatonic warm
    quotes: ["วางแผนให้ดี แล้วลงมือทันที", "ข้อมูลที่ดี นำไปสู่การตัดสินใจที่ดี", "ควบคุมเวลาของนาย ก่อนที่เวลาจะควบคุมนาย", "ทุกภารกิจสำเร็จได้ด้วยการเตรียมตัว"],
    replies: ["ทุกอย่างเริ่มจากการวางแผนที่ดี ลองแตกมันเป็นขั้นๆ แล้วลงมือทีละก้าว", "อย่าเพิ่งกังวลกับผลลัพธ์ โฟกัสที่ขั้นตอนถัดไปที่ควบคุมได้ก่อน", "ข้อมูลคืออาวุธ รวบรวมให้พอ แล้วการตัดสินใจจะง่ายขึ้นเอง"],
  },
  itachi: {
    name: "Itachi", full: "Itachi Uchiha", tag: "จิตใจ · ปรัชญา · ความนิ่ง", mood: "สงบ ลึก",
    letter: "I", accent: "#C0392B", accent2: "#E07A6E", onAccent: "#ffffff",
    scale: [220.0, 261.6, 293.7, 329.6, 392.0], root: 110.0, // A minor pentatonic melancholic
    quotes: ["การยอมรับความจริง คือความแข็งแกร่ง", "คนเราเติบโตจากความผิดพลาด ไม่ใช่ความสมบูรณ์แบบ", "อย่าตัดสินคนอื่นด้วยมุมมองของตัวเอง", "พลังที่แท้จริง มาจากการปกป้องสิ่งที่รัก"],
    replies: ["ความสงบภายในเริ่มจากการยอมรับสิ่งที่เป็น แล้วค่อยๆ เปลี่ยนมัน", "ความล้มเหลวไม่ใช่จุดจบ มันคือบทเรียนที่ทำให้นายแข็งแกร่งขึ้น", "หยุดสักครู่ หายใจ แล้วมองปัญหาด้วยใจที่นิ่ง คำตอบจะชัดขึ้น"],
  },
  bond: {
    name: "Bond", full: "James Bond", tag: "มั่นใจ · เจรจา · บุคลิก", mood: "หรู เท่",
    letter: "B", accent: "#2E6FB0", accent2: "#5B97D6", onAccent: "#ffffff",
    scale: [293.7, 349.2, 440.0, 523.3, 587.3], root: 146.8, // D dorian-ish cool/jazzy
    quotes: ["ความมั่นใจ คือการก้าวต่อทั้งที่กลัว", "สงบไว้ แล้วโลกจะเป็นของนาย", "รายละเอียดเล็กๆ แยกมืออาชีพออกจากมือสมัครเล่น", "อย่าอธิบายมาก แค่ทำให้ดู"],
    replies: ["เดินเข้าไปด้วยความมั่นใจ ยืดหลังตรง สบตา แล้วพูดให้ช้าและชัด", "ในสถานการณ์กดดัน คนที่นิ่งที่สุดคือคนที่คุมเกม", "เตรียมตัวให้พร้อมกว่าที่ใครคาด แล้วปล่อยให้ผลงานพูดแทน"],
  },
  none: {
    name: "ผู้ช่วย", full: "ผู้ช่วยทั่วไป", tag: "ช่วยเหลือทั่วไป · ไม่มีคาแรกเตอร์เฉพาะ", mood: "เป็นกลาง เป็นมิตร",
    letter: "A", accent: "#8A93A8", accent2: "#A7ADB8", onAccent: "#ffffff",
    scale: [261.6, 293.7, 329.6, 392.0, 440.0], root: 130.8,
    quotes: ["พร้อมช่วยเหลือคุณเสมอ", "ถามอะไรมาได้เลย", "มาลองคิดไปด้วยกัน", "ทุกก้าวเล็กๆ มีความหมาย"],
    replies: ["ลองเล่าเพิ่มเติมได้ไหมครับ จะได้ช่วยได้ตรงจุดขึ้น", "เข้าใจแล้ว ลองมาดูกันทีละขั้นตอนนะครับ", "นี่เป็นมุมมองที่น่าสนใจ ลองคิดต่อดูอีกหน่อยไหมครับ"],
  },
};


// ---------------- Categories ----------------
// ไอคอนที่เลือกใช้ได้สำหรับหมวดหมู่ (built-in + ที่ผู้ใช้สร้างเอง) — เก็บเป็น string key ได้ (ใส่ localStorage/DB ได้ตรงๆ)
const ICONS = { Utensils, Coffee, Car, ShoppingBag, Receipt, Gamepad2, HeartPulse, Briefcase, Gift, Handshake, Coins, PiggyBank, Wallet, Music, Sparkles, BookOpen, Target, StickyNote, TrendingUp, Newspaper, Languages };
const ICON_KEYS = Object.keys(ICONS);
const CAT_COLORS = ["#2E9E6B", "#3DA5D9", "#5C9EAD", "#C9A227", "#8FBF6B", "#E8894A", "#B07A4B", "#5C7A99", "#C0658C", "#7B6CB0", "#E0507B", "#4FB286", "#8A93A8"];

const DEFAULT_CATEGORIES = [
  { id: "salary",    label: "เงินเดือน", iconKey: "Briefcase", color: "#2E9E6B", kind: "in" },
  { id: "bonus",     label: "โบนัส/พิเศษ", iconKey: "Gift", color: "#3DA5D9", kind: "in" },
  { id: "freelance", label: "รายได้เสริม/ฟรีแลนซ์", iconKey: "Handshake", color: "#5C9EAD", kind: "in" },
  { id: "invest",    label: "เงินลงทุน", iconKey: "Coins", color: "#C9A227", kind: "in" },
  { id: "refund",    label: "เงินคืน/ได้รับคืน", iconKey: "PiggyBank", color: "#8FBF6B", kind: "in" },
  { id: "food",      label: "อาหาร", iconKey: "Utensils", color: "#E8894A", kind: "out" },
  { id: "coffee",    label: "กาแฟ/เครื่องดื่ม", iconKey: "Coffee", color: "#B07A4B", kind: "out" },
  { id: "transport", label: "เดินทาง", iconKey: "Car", color: "#5C7A99", kind: "out" },
  { id: "shopping",  label: "ช้อปปิ้ง", iconKey: "ShoppingBag", color: "#C0658C", kind: "out" },
  { id: "bills",     label: "บิล/ค่าใช้จ่าย", iconKey: "Receipt", color: "#7B6CB0", kind: "out" },
  { id: "fun",       label: "บันเทิง", iconKey: "Gamepad2", color: "#E0507B", kind: "out" },
  { id: "health",    label: "สุขภาพ", iconKey: "HeartPulse", color: "#4FB286", kind: "out" },
  { id: "other",     label: "อื่นๆ", iconKey: "Wallet", color: "#8A93A8", kind: "out" },
];
const FALLBACK_CAT = { label: "อื่นๆ", iconKey: "Wallet", color: "#8A93A8" }; // เผื่อ tx เก่าอ้างถึงหมวดที่ถูกลบไปแล้ว
const catList = (categories, kind) => categories.filter((c) => c.kind === kind);
const findCat = (categories, id) => categories.find((c) => c.id === id) || FALLBACK_CAT;


// ---------------- Ambient music engine (generative, royalty-free) ----------------
class Ambient {
  constructor() { this.ctx = null; this.playing = false; this.timer = null; this.drones = []; this.vol = 0.12; this.mood = "loid"; }
  ensure() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext; this.ctx = new AC();
    this.master = this.ctx.createGain(); this.master.gain.value = this.vol;
    this.lp = this.ctx.createBiquadFilter(); this.lp.type = "lowpass"; this.lp.frequency.value = 1400;
    this.master.connect(this.lp); this.lp.connect(this.ctx.destination);
  }
  startDrone() {
    this.stopDrone();
    const M = MENTORS[this.mood]; const t = this.ctx.currentTime;
    [M.root, M.root * 1.5].forEach((f, i) => {
      const o = this.ctx.createOscillator(); o.type = "sine"; o.frequency.value = f;
      const g = this.ctx.createGain(); g.gain.value = 0; g.gain.linearRampToValueAtTime(i ? 0.05 : 0.09, t + 3);
      o.connect(g); g.connect(this.master); o.start(); this.drones.push({ o, g });
    });
  }
  stopDrone() { this.drones.forEach(({ o, g }) => { try { g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5); o.stop(this.ctx.currentTime + 0.6); } catch (e) {} }); this.drones = []; }
  pluck() {
    if (!this.ctx) return;
    const M = MENTORS[this.mood]; const f = M.scale[Math.floor(Math.random() * M.scale.length)] * (Math.random() < 0.3 ? 2 : 1);
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(); o.type = "triangle"; o.frequency.value = f;
    const g = this.ctx.createGain(); g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.16, t + 0.4); g.gain.exponentialRampToValueAtTime(0.001, t + 2.6);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + 2.8);
  }
  start(mood) {
    try {
      this.mood = mood; this.ensure(); this.ctx.resume();
      this.startDrone(); this.playing = true;
      clearInterval(this.timer); this.timer = setInterval(() => this.pluck(), 1700);
      this.pluck();
    } catch (e) { this.playing = false; }
  }
  setMood(mood) { this.mood = mood; if (this.playing) this.startDrone(); }
  setVolume(v) { this.vol = v; if (this.master) this.master.gain.linearRampToValueAtTime(v, this.ctx.currentTime + 0.2); }
  stop() { this.playing = false; clearInterval(this.timer); this.stopDrone(); }
}
const ambient = new Ambient();

// ---------------- Theme ----------------
// 🎨 ระบบธีมสีแอป (แยกอิสระจากสี Mentor โดยสิ้นเชิง — Mentor ใช้แค่จุดที่เป็นตัวตนโค้ชเท่านั้น เช่น การ์ดเลือกโค้ช/แชท)
// แต่ละธีมมีเวอร์ชัน day และ night ของตัวเอง อิสระจากกัน (เลือกธีมได้โดยไม่ผูกกับเวลา/โหมดกลางวัน-กลางคืน)
const THEMES = {
  default:  {
    label: "PKNOW",
    day:   { accent: "#F2872E", accent2: "#F5A050", onAccent: "#141414", page: "#F5F3F0", bgTop: "#F5F3F0", bgBot: "#FFFFFF", surface: "#FFFFFF" },
    night: { accent: "#F2872E", accent2: "#F5A050", onAccent: "#141414", page: "#0D0C0B", bgTop: "#151311", bgBot: "#0D0C0B", surface: "#1C1A18" },
  },
  red: {
    label: "เรดโบลด์",
    day:   { accent: "#D64A3D", accent2: "#E8756A", onAccent: "#FFFFFF", page: "#FBF4F3", bgTop: "#FBF4F3", bgBot: "#FFFFFF", surface: "#FFFFFF" },
    night: { accent: "#E8574A", accent2: "#F2857A", onAccent: "#FFFFFF", page: "#170B0A", bgTop: "#241412", bgBot: "#170B0A", surface: "#271613" },
  },
  navy: {
    label: "เนวี่พรีเมียม",
    day:   { accent: "#2B3953", accent2: "#44577A", onAccent: "#FFFFFF", page: "#F3F5F9", bgTop: "#F3F5F9", bgBot: "#FAFBFD", surface: "#FFFFFF" },
    night: { accent: "#6C93D9", accent2: "#8CAEE8", onAccent: "#0D1420", page: "#0D1420", bgTop: "#16202E", bgBot: "#0D1420", surface: "#182333" },
  },
  twilight: {
    label: "ทไวไลท์",
    day:   { accent: "#C2607E", accent2: "#D6839B", onAccent: "#FFFFFF", page: "#FAF3F6", bgTop: "#FAF3F6", bgBot: "#FFFFFF", surface: "#FFFFFF" },
    night: { accent: "#B48DD9", accent2: "#CBA8E8", onAccent: "#241C2B", page: "#17121B", bgTop: "#241C2B", bgBot: "#17121B", surface: "#2A2130" },
  },
};

function palette(mode, themeId) {
  const th = THEMES[themeId] || THEMES.default;
  const T = th[mode] || th.day;
  const common = { accent: T.accent, accent2: T.accent2, onAccent: T.onAccent };
  if (mode === "night") return {
    ...common, page: T.page, bg: `linear-gradient(180deg,${T.bgTop} 0%,${T.bgBot} 100%)`,
    surface: T.surface, hero: `linear-gradient(135deg,${T.accent2} 0%,${T.accent} 100%)`, heroBorder: "transparent",
    text: "#F2EDE6", sub: "#8C857C", faint: "#5C5750", border: "rgba(255,255,255,0.08)",
    dock: T.surface, dockBorder: "rgba(255,255,255,0.10)", star: true, inputBg: "rgba(255,255,255,.06)",
    cat: { green: "#16223C", amber: "#1E2438", coral: "#2A1C24", violet: "#201E33" },
    catTx: { green: "#EAF2EC", amber: "#F0E9D6", coral: "#F6E4DC", violet: "#E7E3F6" },
    catLb: { green: "#8FA79A", amber: "#C6B274", coral: "#D89A86", violet: "#A99CD6" },
  };
  return {
    ...common, page: T.page, bg: `linear-gradient(180deg,${T.bgTop} 0%,${T.bgBot} 100%)`,
    surface: T.surface, hero: `linear-gradient(135deg,${T.accent2} 0%,${T.accent} 100%)`, heroBorder: "transparent",
    text: "#221F1C", sub: "#6B655F", faint: "#A39C93", border: "rgba(0,0,0,0.06)",
    dock: T.surface, dockBorder: "rgba(0,0,0,0.05)", star: false, inputBg: "#F4F5F7",
    cat: { green: "#E7F1E9", amber: "#FBF0D6", coral: "#FBE4DC", violet: "#E9E7F4" },
    catTx: { green: "#2A3B30", amber: "#3A3320", coral: "#5A3327", violet: "#39316A" },
    catLb: { green: "#5E7A66", amber: "#8A7434", coral: "#A85C42", violet: "#6A5C9A" },
  };
}

// 🚪 Portal สำหรับ popup ที่สร้างจากข้างในหน้าเพจ (เช่น Admin, Chat) ให้หลุดออกไปแปะที่ document.body ตรงๆ
// กันปัญหาติดอยู่ใน "เขตซ้อนชั้น" ของกล่องเนื้อหา ซึ่งทำให้ z-index สูงแค่ไหนก็ไม่มีทางซ้อนทับแถบเมนูด้านล่างได้
// 🖼️ ดูรูปเต็มจอ — ใช้ร่วมกันได้ทุกที่ในแอปที่มีรูป (แชท, avatar ฯลฯ)
// 📞 คุยด้วยเสียง/วิดีโอ — ฝัง Jitsi Meet ไว้ในแอป (ฟรี ไม่ต้องมี API key) ทุกคนในห้องแชทเดียวกันเจอห้องคุยเดียวกันอัตโนมัติ
// 📞 คุยด้วยเสียง — ทำเอง ไม่พึ่งบริการนอก (WebRTC + Supabase Realtime ส่งสัญญาณเชื่อมสาย) ไม่มีการบังคับล็อกอินใดๆ
// ใช้ STUN สาธารณะฟรีของ Google เชื่อมสายตรง (ไม่มี TURN server สำรอง เผื่อบางเครือข่ายที่เข้มงวดมากอาจเชื่อมไม่ติด แต่ฟรี 100%)
function CallModal({ t, threadId, userId, displayName, otherMemberIds, roomName, session, onMinimize, onClose }) {
  const [participants, setParticipants] = useState([]); // [{sid, identity, name, hasVideo}]
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [err, setErr] = useState("");
  const [volLevel, setVolLevel] = useState(1); // ตัวคูณความดังของเสียงที่ได้ยิน (1 = ปกติ)
  const [speakerOn, setSpeakerOn] = useState(false); // สลับลำโพงนอก (เฉพาะอุปกรณ์ที่รองรับ setSinkId)
  const [canSwitchSpeaker, setCanSwitchSpeaker] = useState(false);
  const [layout, setLayout] = useState("grid"); // grid | speaker
  const [focusSid, setFocusSid] = useState(null); // sid ของคนที่ถูกเลือกให้เป็นจอใหญ่ (speaker view)
  const roomRef = useRef(null);
  const audioElsRef = useRef({}); // identity -> <audio> element จริง (วิธีมาตรฐาน เล่นเสียงได้ทุกแพลตฟอร์ม)
  const localVideoRef = useRef(null);
  const presenceChannelRef = useRef(null);
  const joinedAtRef = useRef(null);
  const VOLUME_LEVELS = [1, 1.5, 2.2, 3]; // ปกติ -> ดัง -> ดังมาก -> สูงสุด -> วนกลับ

  // ปรับความดังของทุก <audio> element เมื่อเปลี่ยนระดับเสียง (element.volume จำกัดที่ 0-1 จึงใช้ค่าที่ clamp)
  useEffect(() => {
    Object.values(audioElsRef.current).forEach((el) => { el.volume = Math.min(1, volLevel); });
  }, [volLevel]);

  const attachAudio = (track, identity) => {
    // วิธีมาตรฐานของ LiveKit: สร้าง <audio> element จริงแล้วให้ browser เล่นเสียงเอง — ทำงานได้ทุกแพลตฟอร์ม
    // (เดิมใช้ Web Audio API + GainNode อย่างเดียว ทำให้บนมือถือ/บางเบราว์เซอร์เสียงเงียบสนิท)
    const el = track.attach(); // คืน <audio> ที่ผูก track แล้ว
    el.autoplay = true;
    el.playsInline = true;
    el.volume = Math.min(1, volLevel);
    if (canSwitchSpeaker && speakerOn && el.setSinkId) el.setSinkId("").catch(() => {});
    document.body.appendChild(el);
    el.play?.().catch(() => {});
    audioElsRef.current[identity] = el;
  };

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        // เช็คว่าอุปกรณ์นี้สลับลำโพง/หูฟังได้ไหม (setSinkId มีเฉพาะ Chrome/Edge desktop; iOS/Safari ไม่มี)
        try {
          const testEl = document.createElement("audio");
          if (typeof testEl.setSinkId === "function") setCanSwitchSpeaker(true);
        } catch (e) {}

        const { Room, RoomEvent, Track } = await import("livekit-client");

        const r = await fetch("/api/livekit-token", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomName: `refhub-${threadId}`, participantName: displayName, sessionId: crypto.randomUUID(), callerToken: session?.access_token }),
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        if (cancelled) return;

        const room = new Room({ adaptiveStream: true, dynacast: true });
        roomRef.current = room;

        const upsert = (participant) => {
          setParticipants((list) => {
            const others = list.filter((x) => x.sid !== participant.sid);
            return [...others, { sid: participant.sid, identity: participant.identity, name: participant.name || "เพื่อน", hasVideo: participant.isCameraEnabled }];
          });
        };

        room.on(RoomEvent.TrackSubscribed, (track, pub, participant) => {
          if (track.kind === Track.Kind.Audio) attachAudio(track, participant.identity);
          upsert(participant);
          if (track.kind === Track.Kind.Video) {
            let tries = 0;
            const tryAttach = () => {
              const el = document.getElementById(`vid-${participant.sid}`);
              if (el) { track.attach(el); return; }
              if (tries++ < 30) setTimeout(tryAttach, 100);
            };
            tryAttach();
          }
        });

        room.on(RoomEvent.TrackUnsubscribed, (track, pub, participant) => {
          if (track.kind === Track.Kind.Audio) {
            const el = audioElsRef.current[participant.identity];
            if (el) { try { track.detach(el); el.remove(); } catch (e) {} delete audioElsRef.current[participant.identity]; }
          }
          upsert(participant);
        });

        room.on(RoomEvent.ParticipantDisconnected, (participant) => {
          setParticipants((list) => list.filter((x) => x.sid !== participant.sid));
          const el = audioElsRef.current[participant.identity];
          if (el) { try { el.remove(); } catch (e) {} delete audioElsRef.current[participant.identity]; }
        });

        // เมื่อคนอื่นเปิด/ปิดกล้อง อัปเดตสถานะ hasVideo (ใช้ค่าจาก pub.isSubscribed จริง ไม่เดา)
        const refreshVideo = (participant) => upsert(participant);
        room.on(RoomEvent.TrackMuted, (pub, participant) => refreshVideo(participant));
        room.on(RoomEvent.TrackUnmuted, (pub, participant) => refreshVideo(participant));
        room.on(RoomEvent.LocalTrackPublished, () => {});

        await room.connect(data.url, data.token);
        const isFirstJoiner = room.remoteParticipants.size === 0;
        joinedAtRef.current = Date.now();
        if (userId) supabase.from("chat_messages").insert({ thread_id: threadId, sender_id: userId, text: isFirstJoiner ? `📞 ${displayName || "มีคน"} เริ่มการโทร` : `➡️ ${displayName || "มีคน"} เข้าร่วมสาย` }).then(() => {}, () => {});

        // เปิดไมค์ให้เลย (เสียงเริ่มต้นดังปกติ) พร้อมตัดเสียงสะท้อน/เสียงรบกวน
        await room.localParticipant.setMicrophoneEnabled(true, { echoCancellation: true, noiseSuppression: true, autoGainControl: true });

        // มีคนอยู่ในห้องอยู่ก่อนแล้ว -> subscribe เสียงเขาที่มีอยู่ (กันเคสเข้าห้องทีหลังแล้วไม่ได้ยินคนเก่า)
        room.remoteParticipants.forEach((participant) => {
          participant.trackPublications.forEach((pub) => {
            if (pub.track && pub.kind === Track.Kind.Audio) attachAudio(pub.track, participant.identity);
          });
          upsert(participant);
        });

        setConnecting(false);

        const presenceChannel = supabase.channel(`call-${threadId}`);
        presenceChannel.subscribe((status) => { if (status === "SUBSCRIBED") presenceChannel.track({ userId, name: displayName }); });
        presenceChannelRef.current = presenceChannel;

        notifyPush(otherMemberIds || [], `📞 ${displayName || "มีคน"}กำลังโทรเข้ามา`, `ในห้อง ${roomName || ""}`, session?.access_token);
      } catch (e) {
        setErr("เข้าร่วมสายไม่สำเร็จ (เช็คว่าอนุญาตสิทธิ์ไมค์ให้เว็บนี้หรือยัง): " + e.message);
      }
    };
    init();
    return () => {
      cancelled = true;
      roomRef.current?.disconnect();
      Object.values(audioElsRef.current).forEach((el) => { try { el.remove(); } catch (e) {} });
      audioElsRef.current = {};
      if (presenceChannelRef.current) supabase.removeChannel(presenceChannelRef.current);
      if (userId && joinedAtRef.current) {
        const mins = Math.max(1, Math.round((Date.now() - joinedAtRef.current) / 60000));
        supabase.from("chat_messages").insert({ thread_id: threadId, sender_id: userId, text: `⬅️ ${displayName || "มีคน"} วางสาย (คุยอยู่ ${mins} นาที)` }).then(() => {}, () => {});
      }
    };
  }, [threadId]);

  const toggleMute = async () => {
    const next = !muted;
    await roomRef.current?.localParticipant.setMicrophoneEnabled(!next);
    setMuted(next);
  };

  const toggleCamera = async () => {
    const next = !cameraOn;
    await roomRef.current?.localParticipant.setCameraEnabled(next);
    if (next) setTimeout(() => {
      const pub = [...(roomRef.current?.localParticipant.videoTrackPublications.values() || [])][0];
      if (pub?.track && localVideoRef.current) pub.track.attach(localVideoRef.current);
    }, 250);
    setCameraOn(next);
  };

  const toggleSpeaker = async () => {
    const next = !speakerOn;
    setSpeakerOn(next);
    // setSinkId("") = อุปกรณ์เสียงเริ่มต้น; ผู้ใช้ desktop บางคนต่อหูฟังจะสลับได้ (มือถือไม่รองรับ ปุ่มนี้จะถูกซ่อนไว้)
    for (const el of Object.values(audioElsRef.current)) {
      if (el.setSinkId) { try { await el.setSinkId(""); } catch (e) {} }
    }
  };

  const cycleVolume = () => {
    setVolLevel((v) => VOLUME_LEVELS[(VOLUME_LEVELS.indexOf(v) + 1) % VOLUME_LEVELS.length]);
  };

  // รวมทุกคน (ตัวเอง + คนอื่น) เป็นรายการเดียวเพื่อจัดเลย์เอาต์
  const allTiles = [{ sid: "self", name: `${displayName || "ฉัน"} (คุณ)`, isSelf: true, hasVideo: cameraOn }, ...participants];
  const total = allTiles.length;
  const focused = focusSid ? allTiles.find((x) => x.sid === focusSid) : allTiles.find((x) => x.hasVideo) || allTiles[0];
  const others = allTiles.filter((x) => x.sid !== focused?.sid);

  const VideoTile = ({ tile, big }) => {
    const dim = big ? { width: "100%", height: "100%" } : { width: 100, height: 130 };
    return (
      <div onClick={() => { setLayout("speaker"); setFocusSid(tile.sid); }} style={{ textAlign: "center", cursor: "pointer", position: big ? "relative" : "static", ...(big ? { width: "100%", height: "100%" } : {}) }}>
        {tile.hasVideo ? (
          tile.isSelf ? (
            <video ref={localVideoRef} autoPlay muted playsInline style={{ ...dim, borderRadius: 14, objectFit: "cover", background: "#000" }} />
          ) : (
            <video id={`vid-${tile.sid}`} autoPlay playsInline style={{ ...dim, borderRadius: 14, objectFit: "cover", background: "#000" }} />
          )
        ) : (
          <div style={{ ...(big ? { width: "100%", height: "100%" } : {}), display: "grid", placeItems: "center", background: big ? "#111827" : "transparent", borderRadius: 14 }}>
            <div style={{ width: big ? 96 : 64, height: big ? 96 : 64, borderRadius: "50%", background: tile.isSelf ? t.accent : "#5C7A99", display: "grid", placeItems: "center", fontSize: big ? 34 : 22, fontWeight: 700, color: "#fff" }}>{(tile.name || "?")[0]}</div>
          </div>
        )}
        <div style={{ fontSize: 11, marginTop: big ? 0 : 6, color: "#fff", ...(big ? { position: "absolute", bottom: 10, left: 12, background: "rgba(0,0,0,.5)", padding: "3px 8px", borderRadius: 8 } : {}) }}>{tile.name}</div>
      </div>
    );
  };

  return (
    <ModalPortal>
      <div style={{ position: "fixed", inset: 0, background: "#0D0C0B", zIndex: 100, display: "flex", flexDirection: "column", alignItems: "center", color: "#fff" }}>
        {err ? (
          <div style={{ margin: "auto", textAlign: "center", padding: "0 30px" }}>
            <div style={{ fontSize: 13, color: "#F0A0A0", marginBottom: 20 }}>{err}</div>
            <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: 12, border: "none", background: "#D9534F", color: "#fff", cursor: "pointer", fontWeight: 700 }}>ปิด</button>
          </div>
        ) : (
          <>
            {/* แถบบน: ย่อ + สลับเลย์เอาต์ */}
            <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 18px 0" }}>
              {onMinimize ? (
                <button onClick={onMinimize} style={{ background: "rgba(255,255,255,.12)", border: "none", borderRadius: 16, width: 34, height: 34, cursor: "pointer", display: "grid", placeItems: "center" }} title="ย่อเก็บ">
                  <ChevronRight size={16} color="#fff" style={{ transform: "rotate(90deg)" }} />
                </button>
              ) : <div style={{ width: 34 }} />}
              <div style={{ fontSize: 13, opacity: .7 }}>{connecting ? "กำลังเชื่อมต่อ..." : `📞 ${total} คน`}</div>
              <button onClick={() => { setLayout((l) => l === "grid" ? "speaker" : "grid"); setFocusSid(null); }} style={{ background: "rgba(255,255,255,.12)", border: "none", borderRadius: 16, width: 34, height: 34, cursor: "pointer", display: "grid", placeItems: "center" }} title={layout === "grid" ? "มุมมองเดี่ยว" : "มุมมองตาราง"}>
                {layout === "grid" ? <Maximize2 size={15} color="#fff" /> : <LayoutGrid size={15} color="#fff" />}
              </button>
            </div>

            {/* พื้นที่วิดีโอ */}
            <div style={{ flex: 1, width: "100%", maxWidth: 500, display: "flex", flexDirection: "column", padding: 16, minHeight: 0 }}>
              {layout === "speaker" && focused ? (
                <>
                  <div style={{ flex: 1, minHeight: 0, marginBottom: 10 }}><VideoTile tile={focused} big /></div>
                  {others.length > 0 && (
                    <div style={{ display: "flex", gap: 10, overflowX: "auto", flexShrink: 0, paddingBottom: 4 }}>
                      {others.map((tile) => <VideoTile key={tile.sid} tile={tile} />)}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ flex: 1, display: "grid", gridTemplateColumns: total <= 1 ? "1fr" : "1fr 1fr", gap: 12, alignContent: "center", justifyItems: "center", minHeight: 0 }}>
                  {allTiles.map((tile) => (
                    <div key={tile.sid} style={{ width: "100%", aspectRatio: total <= 2 ? "3/4" : "1/1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <VideoTile tile={tile} big={tile.hasVideo} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ปุ่มควบคุม */}
            <div style={{ display: "flex", gap: 14, padding: "0 0 8px", flexWrap: "wrap", justifyContent: "center" }}>
              <button onClick={toggleMute} style={{ width: 54, height: 54, borderRadius: 27, background: muted ? "#D9534F" : "rgba(255,255,255,.15)", border: "none", cursor: "pointer", display: "grid", placeItems: "center" }} title={muted ? "เปิดไมค์" : "ปิดไมค์"}>
                {muted ? <MicOff size={20} color="#fff" /> : <Mic size={20} color="#fff" />}
              </button>
              <button onClick={toggleCamera} style={{ width: 54, height: 54, borderRadius: 27, background: cameraOn ? "#2E9E6B" : "rgba(255,255,255,.15)", border: "none", cursor: "pointer", display: "grid", placeItems: "center" }} title={cameraOn ? "ปิดกล้อง" : "เปิดกล้อง"}>
                <Camera size={20} color="#fff" style={{ opacity: cameraOn ? 1 : .6 }} />
              </button>
              <button onClick={cycleVolume} style={{ width: 54, height: 54, borderRadius: 27, background: volLevel > 1 ? "#2E9E6B" : "rgba(255,255,255,.15)", border: "none", cursor: "pointer", display: "grid", placeItems: "center", position: "relative" }} title="ปรับเสียงดังขึ้น">
                <Volume2 size={20} color="#fff" />
                {volLevel > 1 && <span style={{ position: "absolute", top: -2, right: -2, background: "#fff", color: "#2E9E6B", fontSize: 9, fontWeight: 800, borderRadius: 8, padding: "1px 5px" }}>{volLevel === 3 ? "MAX" : "+"}</span>}
              </button>
              {canSwitchSpeaker && (
                <button onClick={toggleSpeaker} style={{ width: 54, height: 54, borderRadius: 27, background: speakerOn ? "#2E9E6B" : "rgba(255,255,255,.15)", border: "none", cursor: "pointer", display: "grid", placeItems: "center" }} title="สลับลำโพง/หูฟัง">
                  <Volume1 size={20} color="#fff" />
                </button>
              )}
              <button onClick={onClose} style={{ width: 54, height: 54, borderRadius: 27, background: "#D9534F", border: "none", cursor: "pointer", display: "grid", placeItems: "center" }} title="วางสาย">
                <PhoneOff size={20} color="#fff" />
              </button>
            </div>
            <div style={{ fontSize: 10.5, opacity: .5, padding: "6px 20px 18px", textAlign: "center" }}>
              {volLevel === 1 ? "เสียงปกติ" : volLevel === 1.5 ? "เสียงดังขึ้น" : volLevel === 2.2 ? "เสียงดังมาก" : "เสียงสูงสุด"} · แตะที่คนใดคนหนึ่งเพื่อขยายจอ
            </div>
          </>
        )}
      </div>
    </ModalPortal>
  );
}

function ImageLightbox({ src, onClose }) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const stateRef = useRef({ startDist: 0, startScale: 1, startPos: { x: 0, y: 0 }, dragStart: null, lastTap: 0 });

  const dist = (touches) => Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);

  const onTouchStart = (e) => {
    if (e.touches.length === 2) {
      stateRef.current.startDist = dist(e.touches);
      stateRef.current.startScale = scale;
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - stateRef.current.lastTap < 300) { setScale(1); setPos({ x: 0, y: 0 }); } // ดับเบิลแท็ป -> รีเซ็ตซูม
      stateRef.current.lastTap = now;
      stateRef.current.dragStart = { x: e.touches[0].clientX - pos.x, y: e.touches[0].clientY - pos.y };
    }
  };
  const onTouchMove = (e) => {
    if (e.touches.length === 2 && stateRef.current.startDist) {
      e.preventDefault();
      const newScale = Math.min(5, Math.max(1, stateRef.current.startScale * (dist(e.touches) / stateRef.current.startDist)));
      setScale(newScale);
    } else if (e.touches.length === 1 && scale > 1 && stateRef.current.dragStart) {
      e.preventDefault();
      setPos({ x: e.touches[0].clientX - stateRef.current.dragStart.x, y: e.touches[0].clientY - stateRef.current.dragStart.y });
    }
  };
  const onTouchEnd = () => { stateRef.current.startDist = 0; stateRef.current.dragStart = null; };
  const onWheel = (e) => { e.preventDefault(); setScale((s) => Math.min(5, Math.max(1, s - e.deltaY * 0.002))); };

  return (
    <ModalPortal>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.9)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", touchAction: "none" }} onClick={() => scale === 1 && onClose()}>
        <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,.15)", border: "none", borderRadius: 20, width: 40, height: 40, cursor: "pointer", display: "grid", placeItems: "center", zIndex: 1 }}><X size={22} color="#fff" /></button>
        {scale > 1 && <div style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,.6)", fontSize: 11 }}>ดับเบิลแท็ปเพื่อรีเซ็ตซูม</div>}
        <img
          src={src} alt=""
          onClick={(e) => e.stopPropagation()}
          onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onWheel={onWheel}
          style={{ maxWidth: "92vw", maxHeight: "85vh", objectFit: "contain", borderRadius: 8, transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`, transition: stateRef.current.startDist || stateRef.current.dragStart ? "none" : "transform .15s ease", cursor: scale > 1 ? "grab" : "zoom-in" }}
        />
      </div>
    </ModalPortal>
  );
}

function ModalPortal({ children }) {
  return createPortal(children, document.body);
}

const uid = () => Math.random().toString(36).slice(2, 9);

// 🔔 Push Notification — กุญแจสาธารณะ (ปลอดภัยที่จะฝังตรงนี้ ไม่ใช่ความลับ ต่างจาก private key ที่อยู่ฝั่งเซิร์ฟเวอร์เท่านั้น)
const VAPID_PUBLIC_KEY = "BFy33ifhVn7LbyBEss6YmzFys3ycPicm2QVblaxb7BOBTkpQoWDuihkoz0l7ZSeQvZpdUl5JfWgvvCzt24IFm4Y";
const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
};
// สมัครรับ push notification จริงของเครื่องนี้ (ต้องขออนุญาตผู้ใช้ก่อนเสมอ)
const subscribeToPush = async (userId) => {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) { alert("เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือนแบบ push"); return false; }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") { alert("ไม่ได้รับอนุญาตให้แจ้งเตือน ลองกดอนุญาตในตั้งค่าเบราว์เซอร์อีกครั้ง"); return false; }
  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready; // รอจนกว่า Service Worker จะ active จริงๆ ก่อนค่อย subscribe (ไม่งั้น subscribe จะพังเงียบๆ)
  const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) });
  const subJson = sub.toJSON();
  await supabase.from("push_subscriptions").upsert({ user_id: userId, endpoint: subJson.endpoint, keys: subJson.keys }, { onConflict: "endpoint" });
  return true;
};
// ยิงแจ้งเตือนไปหาคนอื่น (เรียกหลังส่งข้อความแชทสำเร็จ) — ยิงแบบ fire-and-forget ไม่ต้องรอผล ไม่กระทบ UX
const notifyPush = (recipientIds, title, body, callerToken) => {
  if (!recipientIds?.length) return;
  fetch("/api/push-send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipientIds, title, body, callerToken }) }).catch(() => {});
};

// 📝 แปลงเนื้อหาโน้ตเก่า (string ธรรมดา) ให้เป็นรูปแบบ block ที่ editor ใหม่ใช้ได้ — กันโน้ตเก่าพังตอนเปิด
const migrateBody = (body) => {
  if (Array.isArray(body) && body.length) return body;
  if (typeof body === "string" && body) return [{ type: "paragraph", content: body }];
  return [{ type: "paragraph", content: "" }];
};
// ดึงข้อความล้วนออกจาก block ทั้งหมด (ใช้ค้นหา/export .md/แสดงตัวอย่าง)
const blocksToPlainText = (blocks) => {
  if (typeof blocks === "string") return blocks;
  if (!Array.isArray(blocks)) return "";
  return blocks.map((b) => {
    const own = Array.isArray(b.content) ? b.content.map((c) => c.text || "").join("") : (typeof b.content === "string" ? b.content : "");
    const kids = b.children && b.children.length ? blocksToPlainText(b.children) : "";
    return [own, kids].filter(Boolean).join(" ");
  }).join(" ");
};

const fmt = (n) => "฿" + Math.round(n).toLocaleString("en-US");
const toDateStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const todayStr = () => toDateStr(new Date());

// 🎯 สร้างบทสรุปเป้าหมายของ user ให้โค้ช AI อ่านและวิเคราะห์ได้ (ทำวันนี้ + แนวโน้มย้อนหลัง)
const buildGoalsContext = (goals) => {
  if (!goals || !goals.length) return "ผู้ใช้ยังไม่เคยตั้งเป้าหมายในแอปเลยสักครั้ง";
  const today = todayStr();
  const todays = goals.filter((g) => g.date === today);
  const last7 = [...new Set([0, 1, 2, 3, 4, 5, 6].map((d) => { const dt = new Date(); dt.setDate(dt.getDate() - d); return toDateStr(dt); }))];
  const recentGoals = goals.filter((g) => last7.includes(g.date));
  const doneCount = recentGoals.filter((g) => g.done).length;
  const rate = recentGoals.length ? Math.round((doneCount / recentGoals.length) * 100) : null;

  // หาเป้าหมายที่ทำซ้ำๆ (ชื่อเดียวกัน) แต่ไม่เคยติ๊กสำเร็จเลยใน 3 วันล่าสุดที่ตั้งไว้
  const byText = {};
  recentGoals.forEach((g) => { const key = g.text.trim().toLowerCase(); (byText[key] = byText[key] || []).push(g); });
  const stuck = Object.entries(byText).filter(([, arr]) => arr.length >= 2 && arr.every((g) => !g.done)).map(([, arr]) => arr[0].text);

  let ctx = "";
  ctx += todays.length ? `เป้าหมายวันนี้ของผู้ใช้: ${todays.map((g) => `"${g.text}" (${g.done ? "ทำสำเร็จแล้ว" : "ยังไม่ติ๊กว่าสำเร็จ"})`).join(", ")}` : "วันนี้ผู้ใช้ยังไม่ได้ตั้งเป้าหมายไว้เลย";
  if (rate !== null) ctx += ` | อัตราทำสำเร็จ 7 วันล่าสุด: ${rate}%`;
  if (stuck.length) ctx += ` | เป้าหมายที่ค้างไม่สำเร็จซ้ำๆ หลายวัน: ${stuck.map((s) => `"${s}"`).join(", ")}`;
  return ctx;
};
const monthOf = (d) => d.slice(0, 7);
const thMonth = (ym) => { const [y, m] = ym.split("-"); return ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."][+m - 1] + " " + ((+y) + 543); };

export default function RefHub() {
  const [loaded, setLoaded] = useState(false);

  // 🔐 ระบบล็อกอินจริง (Supabase Auth) — แทนที่ userId คงที่เดิมจาก .env
  const [session, setSession] = useState(null);       // session ของ Supabase Auth (null = ยังไม่ล็อกอิน)
  const [authChecked, setAuthChecked] = useState(false); // true เมื่อเช็ค session ครั้งแรกเสร็จแล้ว (กันจอกระพริบ)
  const [authProfile, setAuthProfile] = useState(null);  // แถวในตาราง profiles: { approved, role, name, ... }
  const [authProfileChecked, setAuthProfileChecked] = useState(false); // true เมื่อเช็ค authProfile ครั้งแรกเสร็จแล้ว (กันโชว์ "รออนุมัติ" ผิดๆ ระหว่างกำลังโหลดจริง)
  const userId = session?.user?.id || null;
  const [themeMode, setThemeMode] = useState("night");
  const [mentor, setMentor] = useState("none");
  const [customMentors, setCustomMentors] = useState([]); // โค้ชที่ user สร้างเอง (ไม่ใช่แอดมิน) [{id, name, description, avatarUrl}]
  const [theme, setTheme] = useState("default"); // 🎨 ธีมสีแอป: default | red | navy | twilight — แยกอิสระจาก mentor
  const [fontScale, setFontScale] = useState(100); // 📏 ขนาดตัวอักษร: 100 | 115 | 130 (ปกติ/ใหญ่/ใหญ่มาก)
  const [page, setPage] = useState(() => { try { return sessionStorage.getItem("refhub:page") || "home"; } catch (e) { return "home"; } });
  const [notes, setNotes] = useState([]);
  const [goals, setGoals] = useState([]);
  const [tx, setTx] = useState([]);
  const [profile, setProfile] = useState({ name: "", avatar: "" });
  const [autoNight, setAutoNight] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [askAiTopic, setAskAiTopic] = useState(null); // หัวข้อบทความที่กด "ถาม AI ต่อ" มา (ให้ ChatModal เปิดมาพร้อมคำถามนี้)
  const [mentorPick, setMentorPick] = useState(false);
  const [activeCall, setActiveCall] = useState(null); // { threadId, roomName, otherMemberIds } ห้องที่กำลังคุยอยู่ (อยู่ระดับบนสุด กันสายหลุดตอนสลับหน้าในแอป)
  const [callMinimized, setCallMinimized] = useState(false);
  const [themePick, setThemePick] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
  const [profileLightbox, setProfileLightbox] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const [chatUnread, setChatUnread] = useState(0); // จำนวนข้อความแชทที่ยังไม่ได้อ่าน (คำนวณจริงในหน้าแชท)
  const [activeThread, setActiveThread] = useState(() => { try { return JSON.parse(sessionStorage.getItem("refhub:activeThread") || "null"); } catch (e) { return null; } });
  useEffect(() => { if (page === "chatRoom" && !activeThread) setPage("chat"); }, []);
  useEffect(() => { try { if (activeThread) sessionStorage.setItem("refhub:activeThread", JSON.stringify(activeThread)); else sessionStorage.removeItem("refhub:activeThread"); } catch (e) {} }, [activeThread]);
  const [addOpen, setAddOpen] = useState(false);
  const [exportText, setExportText] = useState(null);
  const [musicOpen, setMusicOpen] = useState(false);
  const [playlist, setPlaylist] = useState([]);
  const [folders, setFolders] = useState([]); // หมวดหมู่เพลงที่ผู้ใช้สร้างเอง เช่น {id, name}
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES); // หมวดหมู่การเงิน (แก้ไข/เพิ่ม/ลบ/สลับได้)
  const [curId, setCurId] = useState(null);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);
  const ytPlayerRef = useRef(null);   // เก็บ instance ของ YouTube IFrame Player
  const ytReadyRef = useRef(false);   // true เมื่อ YouTube API script โหลดเสร็จ
  const [volume, setVolume] = useState(45);
  const [quoteIdx, setQuoteIdx] = useState(0);

  const isNight = themeMode === "night" || (themeMode === "auto" && autoNight);
  const mode = isNight ? "night" : "day";
  const t = palette(mode, theme);
  const customMentorObj = customMentors.find((c) => c.id === mentor);
  const M = MENTORS[mentor] || (customMentorObj ? {
    name: customMentorObj.name, full: customMentorObj.name, tag: customMentorObj.description || "โค้ชส่วนตัวของคุณ", mood: "เป็นมิตร ตั้งใจช่วยเหลือ",
    letter: (customMentorObj.name || "?")[0]?.toUpperCase() || "A", accent: "#8A93A8", accent2: "#A7ADB8", onAccent: "#ffffff",
    scale: [261.6, 293.7, 329.6, 392.0, 440.0], root: 130.8, avatarUrl: customMentorObj.avatarUrl || null,
    quotes: ["พร้อมช่วยเหลือคุณเสมอ", "ถามอะไรมาได้เลย", "มาลองคิดไปด้วยกัน", "ทุกก้าวเล็กๆ มีความหมาย"],
    replies: ["ลองเล่าเพิ่มเติมได้ไหมครับ จะได้ช่วยได้ตรงจุดขึ้น", "เข้าใจแล้ว ลองมาดูกันทีละขั้นตอนนะครับ", "นี่เป็นมุมมองที่น่าสนใจ ลองคิดต่อดูอีกหน่อยไหมครับ"],
  } : MENTORS.none);

  useEffect(() => { const c = () => { const h = new Date().getHours(); setAutoNight(h >= 18 || h < 6); }; c(); const id = setInterval(c, 60000); return () => clearInterval(id); }, []);
  useEffect(() => { const id = setInterval(() => setQuoteIdx((i) => i + 1), 9000); return () => clearInterval(id); }, []);

  // load
  // load จาก Supabase Cloud
  useEffect(() => { 
    (async () => {
      if (!userId) {
        setLoaded(true);
        return;
      }
      try {
        // 1. ดึงข้อมูลเทมเพลตและการตั้งค่า (User Settings)
        const { data: uSettings, error: uSettingsErr } = await supabase
          .from("user_settings")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (uSettingsErr) {
          // ดึงข้อมูลไม่สำเร็จเพราะปัญหาชั่วคราว (เน็ต/ระบบ) — ไม่ใช่เพราะไม่มีข้อมูลจริง
          // ห้ามรีเซ็ตชื่อ/รูปกลับเป็นค่าเริ่มต้นเด็ดขาด ไม่งั้นระบบเซฟอัตโนมัติจะเขียนทับข้อมูลจริงหายถาวร
          console.error("โหลด user_settings ไม่สำเร็จ (ปัญหาชั่วคราว ไม่แตะข้อมูลโปรไฟล์เดิม):", uSettingsErr.message);
        } else if (uSettings) {
          setProfile({ name: uSettings.name, avatar: uSettings.avatar || "" });
          setMentor(uSettings.mentor || "none");
          setThemeMode(uSettings.theme_mode || "night");
          if (uSettings.theme) setTheme(uSettings.theme);
          if (typeof uSettings.volume === "number") setVolume(uSettings.volume);
        } else {
          // ยืนยันแล้วว่าไม่มี error และไม่มีแถวจริงๆ (ผู้ใช้ใหม่จริง) ถึงจะสร้างข้อมูลตั้งต้นให้
          // ดึงชื่อจริงจากตาราง profiles (ที่กรอกไว้ตอนสมัคร/สร้างบัญชี PIN) มาใช้ แทนการเดา/hardcode ชื่อ
          const { data: authRow } = await supabase.from("profiles").select("name, email").eq("id", userId).maybeSingle();
          const initialName = authRow?.name || authRow?.email?.split("@")[0] || "ผู้ใช้ใหม่";
          setProfile({ name: initialName, avatar: "" });
          await supabase.from("user_settings").insert({
            user_id: userId, name: initialName, mentor: mentor, theme_mode: themeMode, volume: volume
          });
        }

        // 2. ดึงรายการเงิน (Transactions)
        const { data: dbTx, error: txErr } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", userId)
          .order("date", { ascending: false });
        if (txErr) console.error("โหลดรายรับ-รายจ่ายไม่สำเร็จ (ไม่แตะข้อมูลเดิม):", txErr.message);
        else if (dbTx) setTx(dbTx);

        // 3. ดึงเป้าหมายวันนี้ (Goals)
        const { data: dbGoals, error: goalsErr } = await supabase
          .from("goals")
          .select("*")
          .eq("user_id", userId);
        if (goalsErr) console.error("โหลดเป้าหมายไม่สำเร็จ (ไม่แตะข้อมูลเดิม):", goalsErr.message);
        else if (dbGoals) setGoals(dbGoals.map((g) => ({ ...g, doneDate: g.done_date || null })));

        // 4. ดึงสมุดโน้ต (Notes)
        const { data: dbNotes, error: notesErr } = await supabase
          .from("notes")
          .select("*")
          .eq("user_id", userId)
          .order("date", { ascending: false });
        if (notesErr) console.error("โหลดโน้ตไม่สำเร็จ (ไม่แตะข้อมูลเดิม):", notesErr.message);
        else if (dbNotes) setNotes(dbNotes.map((n) => ({ ...n, notionId: n.notion_id || null })));

        // 5.5 ดึงโค้ชที่สร้างเอง (ไม่ใช่แอดมิน)
        const { data: dbCustomMentors, error: cmErr } = await supabase.from("custom_mentors").select("*").eq("user_id", userId);
        if (cmErr) console.error("โหลดโค้ชที่สร้างเองไม่สำเร็จ:", cmErr.message);
        else if (dbCustomMentors) setCustomMentors(dbCustomMentors.map((c) => ({ id: c.id, name: c.name, description: c.description, avatarUrl: c.avatar_url })));

        // 5. ดึงเพลย์ลิสต์เพลง (Playlists)
        const { data: dbPlaylist, error: plErr } = await supabase
          .from("playlists")
          .select("*")
          .eq("user_id", userId);
        if (plErr) console.error("โหลดเพลย์ลิสต์ไม่สำเร็จ (ไม่แตะข้อมูลเดิม):", plErr.message);
        if (dbPlaylist) {
          // แปลงชื่อฟิลด์ yt_id จากฐานข้อมูลกลับมาใช้ในแอป
          const mappedPlaylist = dbPlaylist.map(p => ({
            id: p.id, kind: p.kind, name: p.name, url: p.url, ytId: p.yt_id, persist: p.persist,
            platform: p.platform || "youtube", pinnedHome: !!p.pinned_home,
          }));
          setPlaylist(mappedPlaylist);
        }

      } catch (e) {
        console.error("โหลดข้อมูลจาก Cloud ผิดพลาด: ", e);
      }
      // หมวดหมู่เพลง (folders) ยังไม่มีตารางบน Supabase — เก็บไว้ใน localStorage ไปก่อน
      try { const f = JSON.parse(localStorage.getItem("refhub:folders") || "[]"); setFolders(f); } catch (e) {}
      try { const c = JSON.parse(localStorage.getItem("refhub:categories") || "null"); if (c && Array.isArray(c) && c.length) setCategories(c); } catch (e) {}
      try { const fs = JSON.parse(localStorage.getItem("refhub:fontScale") || "null"); if (fs) setFontScale(fs); } catch (e) {}
      setLoaded(true);
    })(); 
  }, [userId]);

  // เซฟหมวดหมู่เพลงกลับลง localStorage ทุกครั้งที่เปลี่ยน
  useEffect(() => { if (!loaded) return; try { localStorage.setItem("refhub:folders", JSON.stringify(folders)); } catch (e) {} }, [folders, loaded]);
  useEffect(() => { if (!loaded) return; try { localStorage.setItem("refhub:categories", JSON.stringify(categories)); } catch (e) {} }, [categories, loaded]);
  useEffect(() => { if (!loaded) return; try { localStorage.setItem("refhub:fontScale", JSON.stringify(fontScale)); } catch (e) {} }, [fontScale, loaded]);
  // 📏 ซิงค์ขนาดตัวอักษรกับฐานข้อมูลด้วย (จำได้ข้ามอุปกรณ์ ไม่ใช่แค่เครื่องเดียวที่เคยตั้งไว้)
  useEffect(() => { if (authProfile?.font_scale) setFontScale(authProfile.font_scale); }, [authProfile?.font_scale]);
  useEffect(() => {
    if (!loaded || !userId) return;
    if (authProfile?.font_scale === fontScale) return; // ไม่ต้องเขียนซ้ำถ้าค่าตรงกับที่อยู่ในฐานข้อมูลอยู่แล้ว
    supabase.from("profiles").update({ font_scale: fontScale }).eq("id", userId).then(() => {}, () => {});
  }, [fontScale, loaded, userId]);
  useEffect(() => { try { sessionStorage.setItem("refhub:page", page); } catch (e) {} }, [page]);

  // 🎯 migration ครั้งเดียว: เป้าหมายเก่าที่ยังไม่มีวันที่ผูกไว้ (จากก่อนมีระบบ report) ให้ใส่วันที่ปัจจุบันให้อัตโนมัติ พร้อมบันทึกกลับ Supabase จริง
  useEffect(() => {
    if (!loaded || !userId) return;
    const needsMigration = goals.filter((g) => !g.date);
    if (needsMigration.length) {
      const nowDate = todayStr();
      setGoals((gs) => gs.map((g) => (g.date ? g : { ...g, date: nowDate, doneDate: g.done ? nowDate : null })));
      needsMigration.forEach((g) => {
        supabase.from("goals").update({ date: nowDate, done_date: g.done ? nowDate : null }).eq("id", g.id).then(() => {}, () => {});
      });
    }
  }, [loaded, userId]);


  // ⚠️ (นำระบบ background sync แบบ diff-เทียบเป้าหมายเก่าที่นี่ออกไปแล้ว — มันมี race condition ทำให้เป้าหมายหาย/โผล่คืนมาแบบสุ่มเวลามีการเปลี่ยนแปลงเร็วๆ ติดกัน
  // ตอนนี้ทุกการเพิ่ม/ติ๊ก/ลบ เป้าหมาย จะยิงบันทึกตรงไปที่ Supabase ทันทีที่จุดเกิดเหตุแทน ไม่ต้องพึ่ง background sync ที่เดายากอีกต่อไป)

// (นำระบบ background sync แบบ diff-เทียบ ของรายรับ-รายจ่าย (tx) ออกไปแล้ว เหตุผลเดียวกับเป้าหมาย
// ตอนนี้ทุกการเพิ่ม/ลบ รายการเงิน จะยิงบันทึกตรงไปที่ Supabase ทันทีที่จุดเกิดเหตุแทน)

// (นำระบบ background sync แบบ diff-เทียบ ของโน้ต ออกไปแล้ว เหตุผลเดียวกับเป้าหมาย/รายรับ-รายจ่าย
// ตอนนี้ทุกการเพิ่ม/แก้ไข/ลบ/ปักหมุด โน้ต จะยิงบันทึกตรงไปที่ Supabase ทันทีที่จุดเกิดเหตุแทน)

// (นำระบบ background sync แบบ diff-เทียบ ของเพลย์ลิสต์ ออกไปแล้ว เหตุผลเดียวกับเป้าหมาย/รายรับ-รายจ่าย/โน้ต
// ตอนนี้ทุกการเพิ่ม/ลบเพลง จะยิงบันทึกตรงไปที่ Supabase ทันทีที่จุดเกิดเหตุแทน)

  useEffect(() => { 
    if (!loaded) return; 
    (async () => {
      try {
        const savePlaylist = playlist.filter((p) => p.kind === "yt" || (p.kind === "file" && p.persist));
        // เซฟลงคอมแบบเดิมเผื่อไว้
        localStorage.setItem("refhub:v2", JSON.stringify({ notes, goals, tx, profile, mentor, theme, themeMode, volume, playlist: savePlaylist }));
        
        // 🌐 ยิงอัปเดตสถานะพวกธีม, โค้ด mentor, ระดับเสียง ขึ้นตาราง user_settings บน Cloud ทันที
        // การ์ดกันชั้นที่ 2: ไม่เขียนชื่อว่างเปล่าทับฐานข้อมูลเด็ดขาด (กันข้อมูลจริงหายถาวรจากเหตุไม่คาดคิด)
        if (userId && profile.name) {
          await supabase.from("user_settings").update({
            name: profile.name,
            avatar: profile.avatar || "",
            mentor: mentor,
            theme_mode: themeMode,
            theme: theme, // ถ้ายังไม่มีคอลัมน์ "theme" ในตาราง user_settings คำสั่งนี้จะ error เงียบๆ (ถูกดักไว้ใน catch) — เพิ่มคอลัมน์ type text ได้เพื่อให้ธีม sync ข้ามอุปกรณ์
            volume: volume
          }).eq("user_id", userId);
          // ซิงค์ชื่อ+รูปไปที่ตาราง profiles ด้วย (ตารางนี้แชท/หน้า Admin ใช้แสดงข้อมูลของแต่ละคน ต้องให้ตรงกันเสมอ)
          await supabase.from("profiles").update({ name: profile.name, avatar_url: profile.avatar || null }).eq("id", userId);
        }
      } catch (e) {
        console.error("เซฟค่า Settings ลง Cloud ผิดพลาด: ", e);
      }
    })(); 
  }, [notes, goals, tx, profile, mentor, theme, themeMode, volume, playlist, loaded]);

  // music reactions
  const cur = playlist.find((p) => p.id === curId) || null;
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
    if (ytPlayerRef.current && ytPlayerRef.current.setVolume) ytPlayerRef.current.setVolume(volume);
  }, [volume, curId]);

  // 🔐 เช็ค session ตอนเปิดแอปครั้งแรก + คอยฟังการเปลี่ยนแปลง (ล็อกอิน/ล็อกเอาต์) ตลอดเวลา
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthChecked(true); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => { setSession(s); setAuthChecked(true); });
    return () => listener.subscription.unsubscribe();
  }, []);

  // 🔐 ดึงแถว profile (สถานะอนุมัติ/role) ทุกครั้งที่ userId เปลี่ยน (ล็อกอิน/ล็อกเอาต์)
  // ถ้ายังไม่มีแถว (เช่น เพิ่งยืนยันอีเมลเสร็จเป็นครั้งแรก) จะสร้างให้ตอนนี้เลย เพราะรับประกันว่ามี session จริงแล้ว (RLS ผ่านแน่นอน)
  useEffect(() => {
    if (!userId) { setAuthProfile(null); setAuthProfileChecked(false); return; }
    setAuthProfileChecked(false);
    (async () => {
      try {
        let { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
        if (!data) {
          const meta = session?.user?.user_metadata || {};
          const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true });
          const isFirstUser = !count;
          const { data: created, error: createErr } = await supabase.from("profiles").insert({
            id: userId,
            email: session?.user?.email || null,
            name: meta.name?.trim() || session?.user?.email?.split("@")[0] || "ผู้ใช้ใหม่",
            role: isFirstUser ? "admin" : "member",
            approved: isFirstUser,
            family_code: meta.family_code || null,
            login_type: "email",
          }).select().single();
          if (createErr) console.error("สร้างโปรไฟล์ไม่สำเร็จ:", createErr.message);
          data = created;
        }
        // ถ้าเพิ่งยืนยันลิงก์เปลี่ยนอีเมลสำเร็จ (เช่น บัญชี PIN ผูกอีเมลจริงแล้ว) อีเมลใน session จะไม่ตรงกับที่บันทึกไว้ -> sync ให้ตรงกันอัตโนมัติ
        const sessionEmail = session?.user?.email;
        if (data && sessionEmail && data.email !== sessionEmail) {
          const { data: synced } = await supabase.from("profiles").update({ email: sessionEmail, login_type: "email" }).eq("id", userId).select().single();
          if (synced) data = synced;
        }
        setAuthProfile(data || null);
        if (data) await supabase.from("profiles").update({ last_login: new Date().toISOString() }).eq("id", userId);
        if (data && !data.chat_code) {
          const code = Math.random().toString(36).slice(2, 8).toUpperCase();
          const { data: withCode } = await supabase.from("profiles").update({ chat_code: code }).eq("id", userId).select().single();
          if (withCode) setAuthProfile(withCode);
        }
      } catch (e) { console.error("โหลดโปรไฟล์ผิดพลาด:", e.message); setAuthProfile(null); }
      finally { setAuthProfileChecked(true); }
    })();
  }, [userId]);

  // 🔔 เด้งขอสิทธิ์แจ้งเตือนอัตโนมัติ ครั้งแรกที่เข้าแอปหลังได้รับอนุมัติ + ตอบสนองถ้าแอดมินกด "เตือนให้เปิดแจ้งเตือน" ซ้ำ
  useEffect(() => {
    if (!userId || !authProfile?.approved) return;
    if (!("Notification" in window) || Notification.permission !== "default") return;
    let already = false;
    try { already = localStorage.getItem("refhub:notifReminderHandled") === (authProfile.notif_reminder_at || "first"); } catch (e) {}
    if (already) return;
    const timer = setTimeout(async () => {
      await subscribeToPush(userId);
      try { localStorage.setItem("refhub:notifReminderHandled", authProfile.notif_reminder_at || "first"); } catch (e) {}
    }, 1500); // หน่วงนิดหน่อยกันดูรีบร้อนทันทีที่เข้าแอป
    return () => clearTimeout(timer);
  }, [userId, authProfile?.approved, authProfile?.notif_reminder_at]);

  // 💓 heartbeat — อัปเดต last_seen ทุก 60 วิ ตอนแอปเปิดอยู่ (ใช้บอกสถานะ "ออนไลน์อยู่ไหม" ในหน้า Admin)
  useEffect(() => {
    if (!userId) return;
    const ping = () => supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", userId).then(() => {}, () => {});
    ping();
    const id = setInterval(ping, 60000);
    return () => clearInterval(id);
  }, [userId]);

  // 📍 อัปเดตตำแหน่งเบื้องหลังทุก 5 นาทีตอนเปิดแอปอยู่ — เช็คแค่ "สิทธิ์ของเครื่อง" เท่านั้น ไม่มีสวิตช์เปิด/ปิดในแอปแยกต่างหากแล้ว
  useEffect(() => {
    if (!userId || !navigator.geolocation) return;
    const updateLoc = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => { supabase.from("locations").upsert({ user_id: userId, lat: pos.coords.latitude, lng: pos.coords.longitude, updated_at: new Date().toISOString(), share_enabled: true }).then(() => {}, () => {}); },
        () => {}, // เครื่องไม่ได้ให้สิทธิ์ตำแหน่งไว้ -> ไม่ทำอะไร เงียบๆ (ไม่ต้องมีสวิตช์ให้กดในแอป)
        { timeout: 10000 }
      );
    };
    updateLoc();
    const id = setInterval(updateLoc, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [userId]);
  const [adminAlerts, setAdminAlerts] = useState([]);
  useEffect(() => {
    if (!authProfile || authProfile.role !== "admin") return;
    const channel = supabase
      .channel("admin-profiles-watch")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "profiles" }, (payload) => {
        if (payload.new.id === userId) return; // ไม่ต้องแจ้งเตือนตัวเอง
        setAdminAlerts((a) => [{ id: uid(), text: `${payload.new.name || payload.new.email} สมัครสมาชิกใหม่ รอการอนุมัติ`, time: Date.now() }, ...a].slice(0, 20));
        notifyPush([userId], "🆕 มีคนสมัครสมาชิกใหม่", `${payload.new.name || payload.new.email} รอการอนุมัติอยู่`, session?.access_token);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [authProfile?.role, userId]);

  // 💬 คำนวณจำนวนข้อความแชทที่ยังไม่อ่านทั้งหมด (ทุกห้องที่เข้าถึงได้) อัปเดตสดทุกครั้งที่มีข้อความใหม่
  useEffect(() => {
    const hasChatAccess = authProfile?.can_chat || authProfile?.role === "admin" || authProfile?.role === "trusted";
    if (!userId || !hasChatAccess) { setChatUnread(0); return; }
    const computeUnread = async () => {
      try {
        const { data: mine } = await supabase.from("chat_thread_members").select("thread_id").eq("user_id", userId);
        const threadIds = (mine || []).map((m) => m.thread_id);
        const { data: reads } = await supabase.from("chat_reads").select("thread_id, last_read_at").eq("user_id", userId);
        const readMap = Object.fromEntries((reads || []).map((r) => [r.thread_id, r.last_read_at]));
        let total = 0;
        for (const tid of threadIds) {
          const since = readMap[tid] || "1970-01-01T00:00:00Z";
          const { count } = await supabase.from("chat_messages").select("id", { count: "exact", head: true }).eq("thread_id", tid).gt("created_at", since).neq("sender_id", userId);
          total += count || 0;
        }
        setChatUnread(total);
      } catch (e) {}
    };
    computeUnread();
    const channel = supabase.channel("unread-watch")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, computeUnread)
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_reads", filter: `user_id=eq.${userId}` }, computeUnread)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, authProfile?.can_chat, authProfile?.role]);

  // 🔤 โหลดฟอนต์ IBM Plex Sans Thai จาก Google Fonts ครั้งเดียวตอนแอปเปิด (ตัวเลขชัดสุด อ่านง่ายทุกวัย เหมาะกับหน้าการเงิน)
  useEffect(() => {
    if (document.getElementById("refhub-font-plex")) return;
    const link = document.createElement("link");
    link.id = "refhub-font-plex";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);

  // โหลด YouTube IFrame API script ครั้งเดียวตอนแอปเปิด
  useEffect(() => {
    if (window.YT && window.YT.Player) { ytReadyRef.current = true; return; }
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => { ytReadyRef.current = true; };
  }, []);

  // ทุกครั้งที่เปลี่ยนเพลงเป็น YouTube track -> สร้าง/โหลดวิดีโอใหม่ในผู้เล่นตัวเดียวที่ mount ค้างไว้ในการ์ด "กำลังเล่น" ท้ายหน้า Home
  // (div #yt-mini-player mount ค้างตลอด ไม่เคย unmount แล้ว เพลงเลยไม่ดับตอนสลับหน้า/ปิด modal)
  useEffect(() => {
    if (!cur || cur.kind !== "yt") return;
    const startYt = () => {
      if (!window.YT || !window.YT.Player) { setTimeout(startYt, 300); return; }
      try {
        if (ytPlayerRef.current && ytPlayerRef.current.loadVideoById) {
          ytPlayerRef.current.loadVideoById(cur.ytId);
          ytPlayerRef.current.setVolume(volume);
        } else {
          ytPlayerRef.current = new window.YT.Player("yt-mini-player", {
            height: "100%", width: "100%", videoId: cur.ytId,
            playerVars: { autoplay: 1, rel: 0, playsinline: 1 },
            events: {
              onReady: (e) => { e.target.setVolume(volume); e.target.playVideo(); },
              onStateChange: (e) => {
                if (e.data === window.YT.PlayerState.ENDED) nextTrack();
                if (e.data === window.YT.PlayerState.PLAYING) setPlaying(true);
                if (e.data === window.YT.PlayerState.PAUSED) setPlaying(false);
              },
            },
          });
        }
      } catch (err) { console.error("YouTube player error:", err); }
    };
    startYt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curId]);

  const stopAll = () => {
    try { audioRef.current && audioRef.current.pause(); } catch (e) {}
    try { ytPlayerRef.current && ytPlayerRef.current.pauseVideo && ytPlayerRef.current.pauseVideo(); } catch (e) {}
    setPlaying(false);
  };
  const playTrack = (track) => {
    try { audioRef.current && audioRef.current.pause(); } catch (e) {}
    try { if (track.kind === "file") ytPlayerRef.current && ytPlayerRef.current.pauseVideo && ytPlayerRef.current.pauseVideo(); } catch (e) {}
    setCurId(track.id);
    if (track.kind === "file") {
      setTimeout(() => { if (audioRef.current) { audioRef.current.src = track.src; audioRef.current.volume = volume / 100; audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false)); } }, 50);
    } else { setPlaying(true); } // youtube: จัดการโดย useEffect ด้านบนผ่าน YT IFrame API
  };
  const togglePlay = () => {
    if (!cur) return;
    if (cur.kind === "file") { if (playing) { audioRef.current?.pause(); setPlaying(false); } else { audioRef.current?.play(); setPlaying(true); } }
    else { if (playing) { ytPlayerRef.current?.pauseVideo?.(); } else { ytPlayerRef.current?.playVideo?.(); } }
  };
  const nextTrack = () => { if (!playlist.length) return; const i = playlist.findIndex((x) => x.id === curId); const nx = playlist[(i + 1) % playlist.length]; if (nx) playTrack(nx); };
  const prevTrack = () => { if (!playlist.length) return; const i = playlist.findIndex((x) => x.id === curId); const pv = playlist[(i - 1 + playlist.length) % playlist.length]; if (pv) playTrack(pv); };
  const moveTrack = (id, dir) => {
    setPlaylist((p) => {
      const i = p.findIndex((x) => x.id === id); const j = i + dir;
      if (i < 0 || j < 0 || j >= p.length) return p;
      const arr = [...p]; [arr[i], arr[j]] = [arr[j], arr[i]]; return arr;
    });
  };
  const toggleFavorite = (id) => setPlaylist((p) => p.map((x) => (x.id === id ? { ...x, favorite: !x.favorite } : x)));
  const renameTrack = (id, name) => {
    setPlaylist((p) => p.map((x) => (x.id === id ? { ...x, name } : x)));
    if (userId) supabase.from("playlists").update({ name }).eq("id", id).then(() => {}, () => {});
  };

  // 💰 จัดการหมวดหมู่การเงิน (เพิ่ม/ลบ/สลับลำดับ) — ใช้ได้ทั้งฝั่งรับเข้าและจ่ายออก
  const moveCategory = (id, dir) => {
    setCategories((cats) => {
      const kind = cats.find((c) => c.id === id)?.kind;
      if (!kind) return cats;
      const sameKindIdx = cats.map((c, i) => (c.kind === kind ? i : -1)).filter((i) => i !== -1);
      const pos = sameKindIdx.findIndex((i) => cats[i].id === id);
      const newPos = pos + dir;
      if (newPos < 0 || newPos >= sameKindIdx.length) return cats;
      const arr = [...cats];
      const ia = sameKindIdx[pos], ib = sameKindIdx[newPos];
      [arr[ia], arr[ib]] = [arr[ib], arr[ia]];
      return arr;
    });
  };
  const deleteCategory = (id) => setCategories((cats) => cats.filter((c) => c.id !== id));
  const addCategory = ({ label, iconKey, color, kind }) => {
    if (!label.trim()) return;
    setCategories((cats) => [...cats, { id: uid(), label: label.trim(), iconKey, color, kind }]);
  };

  const todayGoals = goals.filter((g) => (g.date || todayStr()) === todayStr());
  const goalDone = todayGoals.filter((g) => g.done).length;
  const goalPct = todayGoals.length ? Math.round((goalDone / todayGoals.length) * 100) : 0;
  const balance = tx.reduce((s, x) => s + (x.type === "in" ? x.amount : -x.amount), 0);

  // ✨ คำคม AI แต่งใหม่ทุกวัน (แยกตามโค้ชแต่ละคน) — สร้างแค่ 1 ครั้ง/วัน/คน เก็บไว้ในฐานข้อมูล ไม่ยิงซ้ำ ถ้าล้มเหลวสำรองกลับไปใช้คำคมคัดสรรเดิมอัตโนมัติ
  const [aiQuote, setAiQuote] = useState(null);
  useEffect(() => {
    if (!userId || !mentor) return;
    let cancelled = false;
    setAiQuote(null); // เปลี่ยนโค้ช/วันใหม่ -> เคลียร์ก่อน กันโชว์คำคมของโค้ชคนเก่าค้าง
    (async () => {
      const today = todayStr();
      const { data, error } = await supabase.from("daily_quotes").select("quote").eq("user_id", userId).eq("mentor", mentor).eq("date", today).maybeSingle();
      if (error) { console.error("โหลดคำคมวันนี้ไม่สำเร็จ:", error.message); return; }
      if (data) { if (!cancelled) setAiQuote(data.quote); return; }
      try {
        const r = await fetch("/api/chat", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mentor,
            messages: [{ who: "u", text: "แต่งคำคมให้กำลังใจ 1 ประโยคเต็มๆ ยาวประมาณ 12-25 คำ ในสไตล์ของคุณ (ห้ามสั้นเกินไปแบบแค่คำเดียวหรือวลีสั้นๆ ต้องเป็นประโยคที่มีเนื้อหาความหมายครบถ้วน) ไม่ต้องทักทายหรืออธิบายอะไรเพิ่มเติมเลย ตอบกลับมาแค่ตัวคำคมอย่างเดียวเท่านั้น ไม่ต้องมีเครื่องหมายคำพูดครอบ" }],
            userId, callerToken: session?.access_token, mentorName: M.full, mentorDescription: M.tag,
          }),
        });
        const resData = await r.json();
        if (!r.ok) throw new Error(resData.error);
        const q = (resData.text || "").trim().replace(/^["“]|["”]$/g, "").split("\n")[0];
        if (!q) throw new Error("AI ไม่ตอบกลับคำคม");
        if (!cancelled) setAiQuote(q);
        supabase.from("daily_quotes").insert({ user_id: userId, mentor, date: today, quote: q }).then(({ error: insErr }) => { if (insErr) console.error("บันทึกคำคมไม่สำเร็จ:", insErr.message); });
      } catch (e) {
        console.error("แต่งคำคมไม่สำเร็จ ใช้คำคมสำรองแทน:", e.message);
      }
    })();
    return () => { cancelled = true; };
  }, [userId, mentor]);
  const quote = aiQuote || M.quotes[quoteIdx % M.quotes.length];

  // 🔐 เกตระบบล็อกอิน — เช็คก่อนแสดงแอปจริง
  if (!authChecked) return <AuthLoadingScreen />;
  if (!session) return <AuthPage />;
  if (!authProfileChecked) return <AuthLoadingScreen />;
  if (!authProfile || !authProfile.approved) return <PendingApprovalScreen profile={authProfile} onLogout={() => supabase.auth.signOut()} />;

  return (
    <div style={{ minHeight: "100vh", background: t.page, display: "flex", justifyContent: "center", fontFamily: "'IBM Plex Sans Thai','Segoe UI','Helvetica Neue',system-ui,sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 440, position: "relative", background: t.bg, minHeight: "100vh", overflow: "hidden", transition: "background .5s" }}>
        {t.star && <Stars />}
        {/* 📏 ขยายเฉพาะส่วนหัว+เนื้อหา ไม่รวมแถบเมนูด้านล่าง กันเมนูหาย/เพี้ยน — ใช้ transform:scale แทน zoom เพราะ zoom ใช้งานไม่ได้เลยบน iOS Safari (zoom ไม่รองรับ ทำให้ก่อนหน้านี้ iPhone ไม่ขยายเลย) */}
        <div style={{ transform: `scale(${fontScale / 100})`, transformOrigin: "top left", width: `${10000 / fontScale}%` }}>

        {/* HEADER */}
        <div style={{ position: "relative", zIndex: 3, padding: "18px 18px 0" }}>
          {page === "home" ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <button onClick={() => profile.avatar && setProfileLightbox(true)} style={{ background: "none", border: "none", cursor: profile.avatar ? "pointer" : "default", padding: 0 }}>
                  <Avatar profile={profile} t={t} size={46} />
                </button>
                <button onClick={() => setEditProfile(true)} style={{ display: "flex", alignItems: "center", background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}>
                  <div>
                    <div style={{ fontSize: 11.5, color: t.sub }}>{greet(isNight)}</div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: t.text, display: "flex", alignItems: "center", gap: 5 }}>
                      {profile.name || (loaded ? "ผู้ใช้ใหม่" : "กำลังโหลด...")} <Pencil size={12} color={t.faint} />
                    </div>
                  </div>
                </button>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {authProfile?.role === "admin" && (
                  <button onClick={() => setPage("admin")} style={{ position: "relative", width: 38, height: 38, borderRadius: 19, background: t.surface, border: `1px solid ${t.border}`, cursor: "pointer", display: "grid", placeItems: "center" }}>
                    <ShieldCheck size={17} color={t.text} />
                    {adminAlerts.length > 0 && <span style={{ position: "absolute", top: 3, right: 3, width: 8, height: 8, borderRadius: 4, background: "#D9534F" }} />}
                  </button>
                )}
                <IconBtn t={t} onClick={() => setSearchOpen(true)}><Search size={17} color={t.text} /></IconBtn>
                <button onClick={() => setPage("chat")} style={{ position: "relative", width: 38, height: 38, borderRadius: 19, background: t.surface, border: `1px solid ${t.border}`, cursor: "pointer", display: "grid", placeItems: "center" }}>
                  <MessageCircle size={17} color={t.text} />
                  {chatUnread > 0 && <span style={{ position: "absolute", top: 3, right: 3, width: 8, height: 8, borderRadius: 4, background: "#D9534F" }} />}
                </button>
                <button onClick={() => setMoreMenuOpen(true)} style={{ position: "relative", width: 38, height: 38, borderRadius: 19, background: t.surface, border: `1px solid ${t.border}`, cursor: "pointer", display: "grid", placeItems: "center" }}>
                  <MoreVertical size={17} color={t.text} />
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <button onClick={() => setPage("home")} style={{ display: "flex", alignItems: "center", gap: 6, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 20, padding: "8px 14px 8px 10px", cursor: "pointer", color: t.text, fontWeight: 700, fontSize: 13 }}>
                <ArrowLeft size={17} color={t.text} /> กลับ
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                <IconBtn t={t} onClick={() => setSearchOpen(true)}><Search size={17} color={t.text} /></IconBtn>
                <IconBtn t={t} onClick={() => setMusicOpen(true)} active={playing} accent={t.accent}>
                  <Music size={17} color={playing ? t.accent : t.text} />
                </IconBtn>
              </div>
            </div>
          )}
          {/* mini now-playing bar (file tracks play across pages) */}
          {cur && cur.kind === "file" && (
            <div style={{ marginTop: 10, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, padding: "9px 12px", display: "flex", alignItems: "center", gap: 10, boxShadow: t.star ? "none" : "0 8px 20px rgba(30,40,70,.1)" }}>
              <button onClick={togglePlay} style={{ width: 32, height: 32, borderRadius: 16, border: "none", cursor: "pointer", background: t.accent, color: t.onAccent, display: "grid", placeItems: "center", flexShrink: 0 }}>
                {playing ? <Pause size={15} /> : <Play size={15} />}
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: t.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cur.name}</div>
                <div style={{ fontSize: 9.5, color: t.sub }}>{cur.kind === "yt" ? "YouTube" : cur.kind === "file" ? "ไฟล์เพลง" : "บรรเลงสด"}</div>
              </div>
              <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(+e.target.value)} style={{ width: 70, accentColor: t.accent }} />
              <button onClick={() => setMusicOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><Music size={16} color={t.sub} /></button>
            </div>
          )}
        </div>

        {/* CONTENT — ความสูงหารด้วยสเกลชดเชย transform:scale ข้างบน กันตอนขยายฟอนต์แล้วท้ายเนื้อหาจมใต้ Dock */}
        <div style={{ position: "relative", zIndex: 2, padding: `16px 18px ${page === "chat" || page === "chatRoom" ? 16 : 120}px`, height: `calc(${(10000 / fontScale).toFixed(2)}vh - 76px)`, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
          {page === "home" && <HomePage {...{ t, M, quote, isNight, setMentorPick, balance, tx, goals: todayGoals, goalDone, goalPct, setGoals, notes, setPage, setChatOpen, userId, playlist }} />}
          {page === "ledger" && <FinancePage {...{ t, tx, setTx, categories, openAdd: () => setAddOpen(true), openExport: (txt) => setExportText(txt), userId }} />}
          {page === "note" && <NotePage {...{ t, notes, setNotes, isNight, userId, session, authProfile }} />}
          {page === "ideas" && <IdeasPage t={t} M={M} userId={userId} session={session} authProfile={authProfile} setAuthProfile={setAuthProfile} setNotes={setNotes} setChatOpen={setChatOpen} setAskAiTopic={setAskAiTopic} />}
          {page === "trade" && <TradePage t={t} />}
          {page === "news" && <NewsPage t={t} />}
          {page === "lang" && <LangPage t={t} />}
          {page === "goalsReport" && <GoalsReportPage t={t} goals={goals} setGoals={setGoals} userId={userId} />}
          {page === "admin" && <AdminPage t={t} session={session} userId={userId} adminAlerts={adminAlerts} setAdminAlerts={setAdminAlerts} authProfile={authProfile} setAuthProfile={setAuthProfile} />}
          {page === "locations" && <LocationsPage t={t} userId={userId} />}
          {page === "chat" && <ChatEntryPage t={t} M={M} userId={userId} authProfile={authProfile} session={session} openThread={(id, name, isGroup, avatarUrl, createdBy) => { setActiveThread({ id, name, isGroup: !!isGroup, avatarUrl: avatarUrl || null, createdBy: createdBy || null }); setPage("chatRoom"); }} />}
          {page === "chatRoom" && activeThread && <ChatRoomPage t={t} userId={userId} thread={activeThread} profile={profile} session={session} onLeave={() => { setActiveThread(null); setPage("chat"); }} onBack={() => { setActiveThread(null); setPage("chat"); }} activeCall={activeCall} setActiveCall={setActiveCall} setCallMinimized={setCallMinimized} />}

          {/* 🎵 การ์ด "กำลังเล่น" ต่อท้ายเนื้อหาหน้า Home (ใต้เป้าหมาย) — div#yt-mini-player mount ค้างตลอด
              ไม่เคย unmount เลย (ซ่อนด้วย display:none เท่านั้น) กันปัญหา React ชนกับ DOM ที่ YouTube API แก้เอง */}
          <div style={{ display: page === "home" && cur && cur.kind === "yt" ? "block" : "none", marginTop: 16 }}>
            <div style={{ ...card(t), padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: t.text, display: "flex", alignItems: "center", gap: 6 }}><Music size={15} color={t.accent} /> กำลังเล่น</div>
                <button onClick={() => { stopAll(); setCurId(null); }} style={ghost} title="ปิด"><X size={18} color={t.faint} /></button>
              </div>
              <div style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${t.border}`, background: "#000" }}>
                <div id="yt-mini-player" style={{ width: "100%", height: 180 }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 12 }}>
                <button onClick={prevTrack} style={ghost} title="ย้อนกลับ"><SkipBack size={19} color={t.text} fill={t.text} /></button>
                <button onClick={togglePlay} style={{ width: 42, height: 42, borderRadius: 21, border: "none", cursor: "pointer", background: t.accent, color: t.onAccent, display: "grid", placeItems: "center", flexShrink: 0 }}>
                  {playing ? <Pause size={19} /> : <Play size={19} />}
                </button>
                <button onClick={nextTrack} style={ghost} title="เพลงถัดไป"><SkipForward size={19} color={t.text} fill={t.text} /></button>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.text, textAlign: "center", marginTop: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cur ? cur.name : ""}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                <button onClick={() => setVolume((v) => Math.max(0, v - 10))} style={ghost} title="ลดเสียง"><VolumeX size={16} color={t.faint} /></button>
                <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(+e.target.value)} style={{ flex: 1, accentColor: t.accent }} />
                <button onClick={() => setVolume((v) => Math.min(100, v + 10))} style={ghost} title="เพิ่มเสียง"><Volume2 size={16} color={t.faint} /></button>
              </div>
              <button onClick={() => setMusicOpen(true)} style={{ ...ghost, width: "100%", textAlign: "center", marginTop: 8, fontSize: 11.5, color: t.sub }}>ดูเพลย์ลิสต์ทั้งหมด <ChevronRight size={13} style={{ verticalAlign: "middle" }} /></button>
            </div>
          </div>
        </div>
        </div>

        {page !== "chat" && page !== "chatRoom" && <Dock t={t} page={page} setPage={setPage} onQuickAdd={() => setAddOpen(true)} />}

        {mentorPick && <MentorPicker t={t} mentor={mentor} setMentor={setMentor} authProfile={authProfile} setAuthProfile={setAuthProfile} userId={userId} customMentors={customMentors} setCustomMentors={setCustomMentors} close={() => setMentorPick(false)} />}
        {themePick && <ThemePicker t={t} theme={theme} setTheme={setTheme} mode={mode} close={() => setThemePick(false)} />}
        {moreMenuOpen && (
          <div style={overlay} onClick={() => setMoreMenuOpen(false)}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "24px 24px 0 0", padding: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: t.text, marginBottom: 14 }}>เพิ่มเติม</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <button onClick={() => { setMusicOpen(true); setMoreMenuOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 10px", borderRadius: 14, border: "none", background: "none", cursor: "pointer", textAlign: "left" }}><Music size={18} color={t.sub} /><span style={{ fontSize: 14, color: t.text }}>สื่อ</span></button>
                <button onClick={() => { setThemePick(true); setMoreMenuOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 10px", borderRadius: 14, border: "none", background: "none", cursor: "pointer", textAlign: "left" }}><Palette size={18} color={t.sub} /><span style={{ fontSize: 14, color: t.text }}>ธีมสีแอป</span></button>
                <button onClick={() => setFontScale((s) => (s === 100 ? 115 : s === 115 ? 130 : 100))} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 10px", borderRadius: 14, border: "none", background: "none", cursor: "pointer", textAlign: "left" }}><ALargeSmall size={18} color={t.sub} /><span style={{ fontSize: 14, color: t.text }}>ขนาดตัวอักษร ({fontScale}%)</span></button>
                <button onClick={() => setThemeMode(themeMode === "auto" ? "day" : themeMode === "day" ? "night" : "auto")} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 10px", borderRadius: 14, border: "none", background: "none", cursor: "pointer", textAlign: "left" }}>
                  {isNight ? <Moon size={18} color={t.sub} /> : <Sun size={18} color={t.sub} />}
                  <span style={{ fontSize: 14, color: t.text }}>โหมด: {themeMode === "auto" ? "อัตโนมัติ" : themeMode === "day" ? "กลางวัน" : "กลางคืน"}</span>
                </button>
                {authProfile?.role === "admin" && (
                  <button onClick={() => { setPage("admin"); setMoreMenuOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 10px", borderRadius: 14, border: "none", background: "none", cursor: "pointer", textAlign: "left" }}>
                    <ShieldCheck size={18} color={t.sub} /><span style={{ fontSize: 14, color: t.text }}>หน้า Admin</span>
                    {adminAlerts.length > 0 && <span style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: 4, background: "#D9534F" }} />}
                  </button>
                )}
                {(authProfile?.can_view_locations || authProfile?.role === "admin") && (
                  <button onClick={() => { setPage("locations"); setMoreMenuOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 10px", borderRadius: 14, border: "none", background: "none", cursor: "pointer", textAlign: "left" }}>
                    <MapPin size={18} color={t.sub} /><span style={{ fontSize: 14, color: t.text }}>ตำแหน่งล่าสุด</span>
                  </button>
                )}
                <button onClick={() => { setAccountSettingsOpen(true); setMoreMenuOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 10px", borderRadius: 14, border: "none", background: "none", cursor: "pointer", textAlign: "left" }}>
                  <KeyRound size={18} color={t.sub} /><span style={{ fontSize: 14, color: t.text }}>ตั้งค่าบัญชี</span>
                </button>
                <button onClick={() => supabase.auth.signOut()} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 10px", borderRadius: 14, border: "none", background: "none", cursor: "pointer", textAlign: "left" }}>
                  <X size={18} color="#D9534F" /><span style={{ fontSize: 14, color: "#D9534F" }}>ออกจากระบบ</span>
                </button>
              </div>
            </div>
          </div>
        )}
        {accountSettingsOpen && <AccountSettingsModal t={t} authProfile={authProfile} userId={userId} session={session} close={() => setAccountSettingsOpen(false)} />}
        {chatOpen && <ChatModal t={t} M={M} mentor={mentor} setMentor={setMentor} authProfile={authProfile} setAuthProfile={setAuthProfile} customMentors={customMentors} setCustomMentors={setCustomMentors} userId={userId} session={session} goals={goals} askAiTopic={askAiTopic} close={() => { setChatOpen(false); setAskAiTopic(null); }} />}
        {activeCall && !callMinimized && (
          <CallModal t={t} threadId={activeCall.threadId} userId={userId} displayName={profile?.name} otherMemberIds={activeCall.otherMemberIds} roomName={activeCall.roomName} session={session} onMinimize={() => setCallMinimized(true)} onClose={() => { setActiveCall(null); setCallMinimized(false); }} />
        )}
        {activeCall && callMinimized && (
          <button onClick={() => setCallMinimized(false)} style={{ position: "fixed", bottom: 90, right: 16, zIndex: 90, background: "#2E9E6B", border: "none", borderRadius: 24, padding: "10px 16px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", boxShadow: "0 6px 18px rgba(0,0,0,.25)" }}>
            <Phone size={15} color="#fff" /><span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>กำลังคุยอยู่ · แตะเพื่อกลับ</span>
          </button>
        )}
        {editProfile && <EditProfile t={t} M={M} profile={profile} setProfile={setProfile} userId={userId} authProfile={authProfile} setAuthProfile={setAuthProfile} close={() => setEditProfile(false)} />}
        {profileLightbox && profile.avatar && <ImageLightbox src={profile.avatar} onClose={() => setProfileLightbox(false)} />}
        {searchOpen && <SearchOverlay t={t} notes={notes} goals={goals} tx={tx} categories={categories} setPage={setPage} close={() => setSearchOpen(false)} />}
        {musicOpen && <MusicModal {...{ t, M, playlist, setPlaylist, folders, setFolders, curId, playing, playTrack, togglePlay, stopAll, moveTrack, toggleFavorite, volume, setVolume, userId, close: () => setMusicOpen(false) }} />}
        {addOpen && <AddTxModal t={t} tx={tx} setTx={setTx} categories={categories} moveCategory={moveCategory} deleteCategory={deleteCategory} addCategory={addCategory} userId={userId} close={() => setAddOpen(false)} />}
        {exportText != null && <ExportModal t={t} text={exportText} close={() => setExportText(null)} />}

        {/* hidden audio player for file tracks */}
        <audio ref={audioRef} onEnded={nextTrack} onPause={() => setPlaying(false)} onPlay={() => setPlaying(true)} style={{ display: "none" }} />
      </div>
    </div>
  );
}

// ---------------- 🔐 Auth screens ----------------
function AuthLoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0D0C0B", gap: 22 }}>
      <style>{`@keyframes rh-spin { to { transform: rotate(360deg); } } @keyframes rh-pulse { 0%,100% { transform: scale(1); opacity:1; } 50% { transform: scale(1.05); opacity:.85; } }`}</style>
      <div style={{ animation: "rh-pulse 1.6s ease-in-out infinite" }}><PKnowLockup width={180} gap={8} animated /></div>
      <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid #2A2825", borderTopColor: "#F2872E", animation: "rh-spin 0.8s linear infinite" }} />
    </div>
  );
}

function PKnowMark({ width = 220, animated = false }) {
  const h = width * 0.34;
  return (
    <svg width={width} height={h} viewBox="0 0 220 75" style={{ display: "block" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&display=swap');
        @keyframes pk-in { 0% { opacity: 0; transform: translateY(5px) scale(0.85); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes pk-dot { 0% { opacity: 0; } 25% { opacity: 1; } 75% { opacity: 1; } 100% { opacity: 0; } }
        .pk-p { animation: pk-in 0.3s cubic-bezier(.2,.8,.3,1.15) both; transform-box: fill-box; transform-origin: center; }
        .pk-know { animation: pk-in 0.25s cubic-bezier(.2,.8,.3,1.15) both; animation-delay: 0.62s; transform-box: fill-box; transform-origin: center; }
        .pk-dot1 { animation: pk-dot 0.45s ease-in-out both; animation-delay: 0.15s; }
        .pk-dot2 { animation: pk-dot 0.45s ease-in-out both; animation-delay: 0.23s; }
        .pk-dot3 { animation: pk-dot 0.45s ease-in-out both; animation-delay: 0.31s; }
      `}</style>
      <defs>
        <filter id="pkRough" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9 0.85" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.4" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <text x="50%" y="58" textAnchor="middle" filter="url(#pkRough)"
        style={{ fontFamily: "'Anton','IBM Plex Sans Thai',sans-serif", fontSize: 58, letterSpacing: 1 }}
        fill="#F2872E">
        {animated ? (<><tspan className="pk-p">P</tspan><tspan className="pk-know">KNOW</tspan></>) : "PKNOW"}
      </text>
      {animated && (
        <g filter="url(#pkRough)" fill="#F2872E">
          <circle className="pk-dot1" cx="48" cy="48" r="3.2" />
          <circle className="pk-dot2" cx="58" cy="48" r="3.2" />
          <circle className="pk-dot3" cx="68" cy="48" r="3.2" />
        </g>
      )}
    </svg>
  );
}

function PKnowLockup({ width = 220, gap = 10, animated = false }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap }}>
      <PKnowMark width={width} animated={animated} />
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 12, color: "#C7C2BC", letterSpacing: 1 }}>プレイヤーは知っている</div>
        <div style={{ fontSize: 11, color: "#6B655F", marginTop: 2 }}>คนเล่นเขารู้กัน</div>
      </div>
    </div>
  );
}

function AuthPage() {
  const [mode, setMode] = useState("login"); // login | signup
  const [loginWith, setLoginWith] = useState("email"); // email | pin (ใช้เฉพาะตอน mode==='login')
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [familyCode, setFamilyCode] = useState("");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  // 🛡️ พิมพ์รหัสผิดครบ 5 ครั้ง -> บังคับผ่าน CAPTCHA ก่อนถึงจะลองใหม่ได้ (กันสคริปต์เดา PIN/รหัสผ่านซ้ำๆ)
  const [failCount, setFailCount] = useState(() => +(localStorage.getItem("refhub_login_fails") || 0));
  const [captchaToken, setCaptchaToken] = useState(null);
  const captchaRef = useRef(null);
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  const needsCaptcha = failCount >= 5 && siteKey;

  useEffect(() => {
    if (!needsCaptcha || !captchaRef.current) return;
    const renderWidget = () => {
      if (captchaRef.current && window.turnstile) {
        captchaRef.current.innerHTML = "";
        window.turnstile.render(captchaRef.current, { sitekey: siteKey, callback: (token) => setCaptchaToken(token) });
      }
    };
    if (window.turnstile) { renderWidget(); return; }
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js"; s.async = true;
    s.onload = renderWidget;
    document.body.appendChild(s);
  }, [needsCaptcha]);

  const recordFail = () => {
    const next = failCount + 1;
    setFailCount(next);
    localStorage.setItem("refhub_login_fails", String(next));
    setCaptchaToken(null);
  };
  const clearFails = () => { setFailCount(0); localStorage.removeItem("refhub_login_fails"); };

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const submit = async () => {
    setErr(""); setInfo("");
    if (needsCaptcha && !captchaToken) { setErr("กรุณายืนยันตัวตนผ่าน CAPTCHA ก่อน (พิมพ์รหัสผิดหลายครั้งเกินไป)"); return; }
    setLoading(true);
    try {
      if (needsCaptcha) {
        const cr = await fetch("/api/verify-captcha", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: captchaToken }) });
        const cdata = await cr.json();
        if (!cr.ok) { setErr(cdata.error || "ยืนยัน CAPTCHA ไม่สำเร็จ"); setLoading(false); return; }
      }
      if (mode === "login" && loginWith === "pin") {
        if (!username.trim() || !pin) { setErr("กรอกชื่อผู้ใช้และ PIN ให้ครบ"); setLoading(false); return; }
        const lookupR = await fetch("/api/link-pin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "lookup", username: username.trim() }) });
        const lookupData = await lookupR.json();
        if (!lookupR.ok) { recordFail(); setErr(lookupData.error || "ไม่พบชื่อผู้ใช้นี้"); setLoading(false); return; }
        const { error } = await supabase.auth.signInWithPassword({ email: lookupData.email, password: pin });
        if (error) { recordFail(); throw error; }
        clearFails();
        setLoading(false); return;
      }
      if (!emailOk) { setErr("รูปแบบอีเมลยังไม่ถูกต้อง"); setLoading(false); return; }
      if (password.length < 6) { setErr("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"); setLoading(false); return; }
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { name: name.trim(), family_code: familyCode.trim() || null } },
        });
        if (error) throw error;
        // ไม่สร้างแถว profiles ตรงนี้ตรงๆ เพราะถ้า Supabase เปิด "Confirm email" ไว้ ตอนนี้ยังไม่มี session จริง
        // (RLS จะบล็อกเงียบๆ ไม่ error ให้เห็นด้วย) ให้ effect ตอนโหลด profile (ทำงานเมื่อมี session แน่นอนแล้ว) เป็นคนสร้างแทน
        setInfo(data.session ? "สมัครสำเร็จ กำลังเข้าสู่ระบบ..." : "สมัครสำเร็จ! เช็คอีเมลเพื่อกดยืนยันบัญชีก่อน ถึงจะเข้าใช้งานได้");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { recordFail(); throw error; }
        clearFails();
      }
    } catch (e) {
      setErr(e.message === "Invalid login credentials" ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง" : e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", background: "#0D0C0B", fontFamily: "'IBM Plex Sans Thai',sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 440, padding: "64px 24px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 40 }}><PKnowLockup width={230} /></div>

        <div style={{ display: "flex", background: "#1C1A18", borderRadius: 14, padding: 4, marginBottom: 16, border: "1px solid rgba(255,255,255,0.07)" }}>
          <button onClick={() => setMode("login")} style={{ flex: 1, textAlign: "center", padding: "10px 0", borderRadius: 11, border: "none", cursor: "pointer", background: mode === "login" ? "#F2872E" : "transparent", color: mode === "login" ? "#141414" : "#8C857C", fontWeight: 600, fontSize: 13.5 }}>เข้าสู่ระบบ</button>
          <button onClick={() => setMode("signup")} style={{ flex: 1, textAlign: "center", padding: "10px 0", borderRadius: 11, border: "none", cursor: "pointer", background: mode === "signup" ? "#F2872E" : "transparent", color: mode === "signup" ? "#141414" : "#8C857C", fontWeight: 600, fontSize: 13.5 }}>สมัครสมาชิก</button>
        </div>

        {mode === "login" && (
          <div style={{ display: "flex", gap: 14, marginBottom: 16, justifyContent: "center" }}>
            <button onClick={() => setLoginWith("email")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, color: loginWith === "email" ? "#F2872E" : "#6B655F", borderBottom: loginWith === "email" ? "2px solid #F2872E" : "2px solid transparent", paddingBottom: 4 }}>ด้วยอีเมล</button>
            <button onClick={() => setLoginWith("pin")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, color: loginWith === "pin" ? "#F2872E" : "#6B655F", borderBottom: loginWith === "pin" ? "2px solid #F2872E" : "2px solid transparent", paddingBottom: 4 }}>ด้วยชื่อ + PIN</button>
          </div>
        )}

        {mode === "login" && loginWith === "pin" ? (
          <>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ชื่อผู้ใช้ที่แอดมินตั้งให้ เช่น mom" style={{ background: "#1C1A18", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "11px 14px", fontSize: 13.5, marginBottom: 10, outline: "none", color: "#F2EDE6" }} />
            <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} type="password" inputMode="numeric" placeholder="PIN 4-6 หลัก" style={{ background: "#1C1A18", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "11px 14px", fontSize: 13.5, marginBottom: 14, outline: "none", letterSpacing: 3, color: "#F2EDE6" }} />
          </>
        ) : (
          <>
            {mode === "signup" && (
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อของคุณ" style={{ background: "#1C1A18", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "11px 14px", fontSize: 13.5, marginBottom: 10, outline: "none", color: "#F2EDE6" }} />
            )}

            <div style={{ background: "#1C1A18", border: `1px solid ${email && !emailOk ? "#E8685A" : "rgba(255,255,255,0.07)"}`, borderRadius: 12, padding: "11px 14px", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.com" style={{ flex: 1, border: "none", outline: "none", fontSize: 13.5, background: "transparent", color: "#F2EDE6" }} />
              {email && <span style={{ fontSize: 13, color: emailOk ? "#4CBE8D" : "#E8685A" }}>{emailOk ? "✓" : "!"}</span>}
            </div>
            <div style={{ fontSize: 11, color: email ? (emailOk ? "#4CBE8D" : "#E8685A") : "#6B655F", marginBottom: 10, paddingLeft: 2, minHeight: 14 }}>
              {email ? (emailOk ? "รูปแบบอีเมลถูกต้อง" : "รูปแบบอีเมลยังไม่ถูกต้อง") : "พิมพ์อีเมลของคุณ"}
            </div>

            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="รหัสผ่าน (อย่างน้อย 6 ตัว)" style={{ background: "#1C1A18", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "11px 14px", fontSize: 13.5, marginBottom: 10, outline: "none", color: "#F2EDE6" }} />

            {mode === "signup" && (
              <input value={familyCode} onChange={(e) => setFamilyCode(e.target.value)} placeholder="รหัสเชิญครอบครัว (ถ้ามี)" style={{ background: "#1C1A18", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "11px 14px", fontSize: 13.5, marginBottom: 14, outline: "none", color: "#F2EDE6" }} />
            )}
          </>
        )}

        {err && <div style={{ fontSize: 12, color: "#E8685A", marginBottom: 10, textAlign: "center" }}>{err}</div>}
        {info && <div style={{ fontSize: 12, color: "#4CBE8D", marginBottom: 10, textAlign: "center" }}>{info}</div>}

        {needsCaptcha && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11.5, color: "#8C857C", marginBottom: 8, textAlign: "center" }}>พิมพ์รหัสผิดหลายครั้งเกินไป กรุณายืนยันตัวตนก่อน</div>
            <div ref={captchaRef} style={{ display: "flex", justifyContent: "center" }} />
          </div>
        )}

        <button onClick={submit} disabled={loading || (needsCaptcha && !captchaToken)} style={{ background: loading || (needsCaptcha && !captchaToken) ? "#4A362A" : "#F2872E", border: "none", borderRadius: 14, padding: "13px 0", fontSize: 14, fontWeight: 700, color: "#141414", cursor: loading ? "default" : "pointer", marginTop: 6 }}>
          {loading ? "กำลังดำเนินการ..." : mode === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
        </button>
      </div>
    </div>
  );
}

function AccountSettingsModal({ t, authProfile, userId, session, close }) {
  const [newEmail, setNewEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const isPinAccount = authProfile?.login_type === "pin";

  // 🔒 เปลี่ยนรหัสผ่าน/PIN (ใช้กลไกเดียวกันทั้ง 2 แบบบัญชี เพราะ PIN คือรหัสผ่านจริงเบื้องหลัง)
  const [newPass, setNewPass] = useState("");
  const [passBusy, setPassBusy] = useState(false);
  const [passMsg, setPassMsg] = useState("");
  const changePassword = async () => {
    setPassMsg("");
    const isValid = isPinAccount ? /^[0-9]{4,6}$/.test(newPass) : newPass.length >= 6;
    if (!isValid) { setPassMsg(isPinAccount ? "PIN ต้องเป็นตัวเลข 4-6 หลัก" : "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"); return; }
    setPassBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw error;
      setPassMsg(isPinAccount ? "เปลี่ยน PIN สำเร็จแล้ว ✓" : "เปลี่ยนรหัสผ่านสำเร็จแล้ว ✓");
      setNewPass("");
    } catch (e) { setPassMsg("ไม่สำเร็จ: " + e.message); } finally { setPassBusy(false); }
  };

  // ⚡ ตั้งชื่อผู้ใช้ + PIN สำหรับ "เข้าเร็ว" (เฉพาะบัญชีอีเมล ไม่ทิ้งอีเมลเดิม แค่เพิ่มทางลัด)
  const [quickUsername, setQuickUsername] = useState(authProfile?.username || "");
  const [quickPin, setQuickPin] = useState("");
  const [quickBusy, setQuickBusy] = useState(false);
  const [quickMsg, setQuickMsg] = useState("");
  const linkPin = async () => {
    setQuickMsg("");
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(quickUsername)) { setQuickMsg("ชื่อผู้ใช้ต้องเป็นตัวอักษร/ตัวเลขภาษาอังกฤษ 3-20 ตัว"); return; }
    if (!/^[0-9]{4,6}$/.test(quickPin)) { setQuickMsg("PIN ต้องเป็นตัวเลข 4-6 หลัก"); return; }
    setQuickBusy(true);
    try {
      const r = await fetch("/api/link-pin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: quickUsername, pin: quickPin, callerToken: session?.access_token }) });
      let data;
      try { data = await r.json(); } catch (parseErr) { throw new Error("เซิร์ฟเวอร์ไม่ตอบกลับเป็นข้อมูลที่ถูกต้อง (สถานะ " + r.status + ") — เช็คว่าไฟล์ api/link-pin.js ถูก deploy ขึ้น Vercel แล้วหรือยัง"); }
      if (!r.ok) throw new Error(data.error);
      setQuickMsg(`ตั้งค่าสำเร็จ! ครั้งหน้าเข้าเร็วด้วยชื่อผู้ใช้ "${quickUsername}" + PIN นี้ได้เลย ✓`);
      setQuickPin("");
    } catch (e) { setQuickMsg("ไม่สำเร็จ: " + e.message); } finally { setQuickBusy(false); }
  };

  const linkEmail = async () => {
    setErr(""); setOk("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) { setErr("รูปแบบอีเมลยังไม่ถูกต้อง"); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      setOk(`ส่งลิงก์ยืนยันไปที่ ${newEmail} แล้ว เปิดอีเมลแล้วกดยืนยัน จากนั้นจะใช้อีเมลนี้ล็อกอินแทนได้เลย`);
    } catch (e) {
      setErr(e.message);
    } finally { setBusy(false); }
  };

  return (
    <div style={overlay} onClick={close}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "24px 24px 0 0", padding: 20, maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: t.text, marginBottom: 14 }}>ตั้งค่าบัญชี</div>
        <div style={{ ...card(t), padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: t.sub, marginBottom: 4 }}>เข้าสู่ระบบด้วย</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{isPinAccount ? `ชื่อผู้ใช้ + PIN (${authProfile?.username})` : authProfile?.email}</div>
        </div>

        <div style={{ ...card(t), padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 8 }}>{isPinAccount ? "เปลี่ยน PIN" : "เปลี่ยนรหัสผ่าน"}</div>
          <input value={newPass} onChange={(e) => setNewPass(e.target.value)} type={isPinAccount ? "tel" : "password"} inputMode={isPinAccount ? "numeric" : undefined} placeholder={isPinAccount ? "PIN ใหม่ (4-6 หลัก)" : "รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"} style={{ ...input(t), marginBottom: 8 }} />
          {passMsg && <div style={{ fontSize: 11.5, color: passMsg.startsWith("ไม่สำเร็จ") ? "#D9534F" : "#2E9E6B", marginBottom: 8 }}>{passMsg}</div>}
          <button onClick={changePassword} disabled={passBusy} style={{ width: "100%", padding: "10px 0", borderRadius: 10, border: `1px solid ${t.border}`, background: "none", cursor: "pointer", color: t.text, fontSize: 12.5, fontWeight: 700 }}>{passBusy ? "กำลังบันทึก..." : isPinAccount ? "เปลี่ยน PIN" : "เปลี่ยนรหัสผ่าน"}</button>
        </div>

        {!isPinAccount && (
          <div style={{ ...card(t), padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 4 }}>⚡ ตั้งค่าเข้าเร็วด้วยชื่อผู้ใช้ + PIN</div>
            <div style={{ fontSize: 11.5, color: t.sub, marginBottom: 10, lineHeight: 1.6 }}>ไม่ต้องพิมพ์อีเมล+รหัสผ่านยาวๆ ทุกครั้ง ตั้งชื่อผู้ใช้สั้นๆ + PIN ไว้ ครั้งหน้าเข้าเร็วได้เลย (อีเมลเดิมยังใช้ล็อกอินได้ปกติเหมือนเดิม ไม่ทิ้งของเก่า)</div>
            <input value={quickUsername} onChange={(e) => setQuickUsername(e.target.value)} placeholder="ตั้งชื่อผู้ใช้ (ภาษาอังกฤษ 3-20 ตัว)" style={{ ...input(t), marginBottom: 8 }} />
            <input value={quickPin} onChange={(e) => setQuickPin(e.target.value.replace(/\D/g, ""))} type="tel" inputMode="numeric" placeholder="ตั้ง PIN (4-6 หลัก)" style={{ ...input(t), marginBottom: 8 }} />
            {quickMsg && <div style={{ fontSize: 11.5, color: quickMsg.startsWith("ไม่สำเร็จ") ? "#D9534F" : "#2E9E6B", marginBottom: 8 }}>{quickMsg}</div>}
            <button onClick={linkPin} disabled={quickBusy} style={{ ...primaryBtn({ accent: t.accent, accent2: t.accent2, onAccent: t.onAccent }), width: "100%", padding: "11px 0" }}>{quickBusy ? "กำลังตั้งค่า..." : "ตั้งค่าเข้าเร็ว"}</button>
          </div>
        )}

        {isPinAccount ? (
          <>
            <div style={{ fontSize: 12.5, color: t.sub, marginBottom: 12, lineHeight: 1.6 }}>อยากเปลี่ยนไปล็อกอินด้วยอีเมลแทน? ผูกอีเมลจริงของคุณไว้ตรงนี้ได้เลย ระบบจะส่งลิงก์ยืนยันไปที่อีเมลนั้น กดยืนยันแล้วใช้อีเมล + PIN เดิม (ใช้เป็นรหัสผ่าน) ล็อกอินได้ทันที</div>
            <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="อีเมลจริงของคุณ" style={{ ...input(t), marginBottom: 10 }} />
            {err && <div style={{ fontSize: 12, color: "#D9534F", marginBottom: 10 }}>{err}</div>}
            {ok && <div style={{ fontSize: 12, color: "#2E9E6B", marginBottom: 10 }}>{ok}</div>}
            <button onClick={linkEmail} disabled={busy} style={{ ...primaryBtn({ accent: t.accent, accent2: t.accent2, onAccent: t.onAccent }), width: "100%", padding: "12px 0" }}>{busy ? "กำลังส่ง..." : "ผูกอีเมล"}</button>
          </>
        ) : (
          <div style={{ fontSize: 12.5, color: t.sub }}>บัญชีนี้ใช้อีเมลล็อกอินอยู่แล้ว</div>
        )}
      </div>
    </div>
  );
}

function PendingApprovalScreen({ profile, onLogout }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", background: "#0D0C0B", fontFamily: "'IBM Plex Sans Thai',sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 440, padding: "80px 24px", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}><PKnowLockup width={190} /></div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#F2EDE6", marginBottom: 8 }}>รอแอดมินอนุมัติ</div>
        <div style={{ fontSize: 13, color: "#8C857C", lineHeight: 1.6, marginBottom: 4 }}>
          บัญชี {profile?.email ? <b style={{ color: "#C7C2BC" }}>{profile.email}</b> : "ของคุณ"} สมัครสำเร็จแล้ว<br />แต่ยังใช้งานแอปไม่ได้จนกว่าแอดมินจะกดอนุมัติ
        </div>
        <button onClick={onLogout} style={{ marginTop: 24, background: "none", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "10px 20px", fontSize: 13, color: "#8C857C", cursor: "pointer" }}>ออกจากระบบ</button>
      </div>
    </div>
  );
}

function ytExtract(url) {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

// 🔍 ตรวจจับว่าลิงก์ที่วางมาเป็นสื่อจากแพลตฟอร์มไหน
function detectPlatform(url) {
  const u = url.toLowerCase();
  if (/youtube\.com|youtu\.be/.test(u)) return "youtube";
  if (/tiktok\.com/.test(u)) return "tiktok";
  if (/twitter\.com|x\.com/.test(u)) return "twitter";
  if (/instagram\.com/.test(u)) return "instagram";
  if (/facebook\.com|fb\.watch/.test(u)) return "facebook";
  return "other";
}
const PLATFORM_META = {
  youtube: { label: "YouTube", color: "#E0507B" },
  tiktok: { label: "TikTok", color: "#000000" },
  twitter: { label: "X (Twitter)", color: "#1DA1F2" },
  instagram: { label: "Instagram", color: "#C13584" },
  facebook: { label: "Facebook", color: "#1877F2" },
  other: { label: "ลิงก์", color: "#8A93A8" },
};

function MusicModal({ t, M, playlist, setPlaylist, folders, setFolders, curId, playing, playTrack, togglePlay, stopAll, moveTrack, toggleFavorite, volume, setVolume, userId, close }) {
  const [ytUrl, setYtUrl] = useState("");
  const fileRef = useRef(null);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState("all"); // "all" | "fav" | folder.id
  const flashSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 1800); };
  const [pendingYt, setPendingYt] = useState(null); // { id, url, name, platform } รอยืนยัน/แก้ชื่อก่อนบันทึกจริง
  const [ytLoading, setYtLoading] = useState(false);
  const [viewingMedia, setViewingMedia] = useState(null); // สื่อโซเชียล (ไม่ใช่เสียง) ที่กำลังเปิดดูอยู่
  const togglePinHome = (id) => {
    const target = playlist.find((p) => p.id === id);
    if (!target) return;
    const next = !target.pinnedHome;
    setPlaylist((p) => p.map((x) => (x.id === id ? { ...x, pinnedHome: next } : x)));
    if (userId) supabase.from("playlists").update({ pinned_home: next }).eq("id", id).then(() => {}, () => {});
  };

  const activeFolderId = tab === "all" || tab === "fav" ? null : tab;
  const addMedia = async () => {
    const url = ytUrl.trim();
    if (!url || !/^https?:\/\//i.test(url)) { alert("วางลิงก์ที่ถูกต้อง (ต้องขึ้นต้นด้วย http:// หรือ https://)"); return; }
    const platform = detectPlatform(url);
    setYtLoading(true);
    let realName = `${PLATFORM_META[platform].label} · ${url.slice(0, 40)}`;
    let ytId = null;
    try {
      if (platform === "youtube") {
        ytId = ytExtract(url);
        if (!ytId) { alert("ลิงก์ YouTube ไม่ถูกต้อง ลองก๊อปลิงก์จากปุ่ม Share ของ YouTube"); setYtLoading(false); return; }
        const r = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
        if (r.ok) { const data = await r.json(); if (data.title) realName = data.title; }
      } else if (platform === "twitter") {
        const r = await fetch(`https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`);
        if (r.ok) { const data = await r.json(); if (data.author_name) realName = `โพสต์ของ ${data.author_name}`; }
      } else if (platform === "tiktok") {
        const r = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
        if (r.ok) { const data = await r.json(); if (data.title) realName = data.title; }
      }
      // Instagram/Facebook ไม่มี oEmbed สาธารณะแบบไม่ต้องใช้ API key เลย ใช้ชื่อสำรอง (แก้เองได้ก่อนบันทึกอยู่แล้ว)
    } catch (e) {}
    setYtLoading(false);
    setPendingYt({ id: ytId, url, name: realName, platform });
  };
  const confirmAddYt = () => {
    if (!pendingYt) return;
    const track = { id: uid(), kind: pendingYt.platform === "youtube" ? "yt" : "link", platform: pendingYt.platform, name: pendingYt.name.trim() || pendingYt.url, ytId: pendingYt.id, url: pendingYt.url, favorite: false, folderId: activeFolderId, pinnedHome: false };
    setPlaylist((p) => [...p, track]);
    if (userId) supabase.from("playlists").insert({ id: track.id, user_id: userId, kind: track.kind, platform: track.platform, name: track.name, url: track.url, yt_id: track.ytId, persist: true }).then(({ error }) => { if (error) { console.error("บันทึกสื่อไม่สำเร็จ:", error.message); alert("บันทึกไม่สำเร็จ: " + error.message + " (เช็คว่ารัน SQL media_platforms_setup.sql แล้วหรือยัง)"); } }, () => {});
    setYtUrl(""); setPendingYt(null); flashSaved();
  };
  const addFileInner = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const small = f.size < 1.5 * 1024 * 1024;
    if (small) {
      const rd = new FileReader();
      rd.onload = () => {
        const track = { id: uid(), kind: "file", name: f.name, src: rd.result, persist: true, favorite: false, folderId: activeFolderId };
        setPlaylist((p) => [...p, track]);
        if (userId) supabase.from("playlists").insert({ id: track.id, user_id: userId, kind: track.kind, name: track.name, src: track.src, persist: true }).then(() => {}, () => {});
        flashSaved();
      };
      rd.readAsDataURL(f);
    } else {
      const url = URL.createObjectURL(f);
      setPlaylist((p) => [...p, { id: uid(), kind: "file", name: f.name + " (ไม่บันทึกถาวร)", src: url, persist: false, favorite: false, folderId: activeFolderId }]);
      flashSaved();
    }
  };
  const [newFolderName, setNewFolderName] = useState("");
  const [addingFolder, setAddingFolder] = useState(false);
  const addFolder = () => {
    const nm = newFolderName.trim();
    if (!nm) return;
    const f = { id: uid(), name: nm };
    setFolders((fs) => [...fs, f]); setTab(f.id); setNewFolderName(""); setAddingFolder(false);
  };
  const setTrackFolder = (id, folderId) => setPlaylist((p) => p.map((x) => (x.id === id ? { ...x, folderId: folderId || null } : x)));
  const deleteFolder = (folderId) => {
    setFolders((fs) => fs.filter((f) => f.id !== folderId));
    setPlaylist((p) => p.map((x) => (x.folderId === folderId ? { ...x, folderId: null } : x)));
    setTab((cur) => (cur === folderId ? "all" : cur));
  };

  const cur = playlist.find((p) => p.id === curId) || null;
  const shown = playlist.filter((tr) => {
    if (tab === "all") return true;
    if (tab === "fav") return !!tr.favorite;
    return tr.folderId === tab;
  });

  return (
    <div style={overlay} onClick={close}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "24px 24px 0 0", padding: "20px 20px 28px", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: t.text }}>สื่อของฉัน 📎</div>
          <button onClick={close} style={ghost}><X size={20} color={t.sub} /></button>
        </div>
        <div style={{ fontSize: 12, color: t.sub, marginBottom: 14 }}>เก็บสื่อจาก YouTube, TikTok, X, Instagram, Facebook ไว้ดูย้อนหลัง · เพิ่มแล้วบันทึกอัตโนมัติ</div>

        {/* ตอนนี้เพลง YouTube เล่นอยู่ที่ mini player ลอยมุมจอ (ไม่ดับตอนสลับหน้าแล้ว) */}
        {cur && cur.kind === "yt" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: `${t.accent}18`, border: `1px dashed ${t.accent}66`, borderRadius: 12, padding: "9px 12px", fontSize: 11.5, color: t.accent, fontWeight: 600, marginBottom: 14 }}>
            <Music size={14} /> กำลังเล่น "{cur.name}" อยู่ที่หน้า Home (ใต้เป้าหมายวันนี้)
          </div>
        )}

        {/* add controls */}
        <div style={{ ...card(t), padding: 14, marginBottom: 12 }}>
          <button onClick={() => fileRef.current?.click()} style={{ ...primaryBtn(t), width: "100%", padding: "11px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10 }}>
            <Upload size={17} /> แนบไฟล์เพลง (MP3 / MP4)
          </button>
          <input ref={fileRef} type="file" accept="audio/*,video/mp4,.mp3,.mp4" onChange={addFileInner} style={{ display: "none" }} />
          <div style={{ display: "flex", gap: 8 }}>
            <input value={ytUrl} onChange={(e) => setYtUrl(e.target.value)} placeholder="วางลิงก์ YouTube / TikTok / X / Instagram / Facebook..." style={input(t)} />
            <button onClick={addMedia} disabled={ytLoading} style={{ ...primaryBtn(t), padding: "0 14px", display: "flex", alignItems: "center", gap: 5, opacity: ytLoading ? 0.6 : 1 }}><Link2 size={15} /> {ytLoading ? "กำลังดึงชื่อ..." : "เพิ่ม"}</button>
          </div>
          {pendingYt && (
            <div style={{ marginTop: 10, padding: 12, borderRadius: 12, background: t.inputBg, border: `1px solid ${t.border}` }}>
              <div style={{ fontSize: 11, color: t.sub, marginBottom: 6 }}>ตั้งชื่อสื่อนี้ (แก้ได้ก่อนบันทึก):</div>
              <input value={pendingYt.name} onChange={(e) => setPendingYt((p) => ({ ...p, name: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && confirmAddYt()} style={{ ...input(t), marginBottom: 8 }} autoFocus />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setPendingYt(null)} style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: `1px solid ${t.border}`, background: "none", color: t.sub, cursor: "pointer", fontSize: 12.5, fontWeight: 700 }}>ยกเลิก</button>
                <button onClick={confirmAddYt} style={{ ...primaryBtn(t), flex: 1, padding: "9px 0" }}>บันทึกสื่อนี้</button>
              </div>
            </div>
          )}
          {activeFolderId && <div style={{ fontSize: 10.5, color: t.faint, marginTop: 8 }}>เพลงที่เพิ่มใหม่จะลงหมวด "{folders.find((f) => f.id === activeFolderId)?.name}" ทันที</div>}
        </div>
        {saved && <div style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: "#2E9E6B", marginBottom: 10 }}>✓ บันทึกลงเพลย์ลิสต์แล้ว</div>}

        {/* volume */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <VolumeX size={16} color={t.faint} />
          <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(+e.target.value)} style={{ flex: 1, accentColor: t.accent }} />
          <Volume2 size={16} color={t.faint} />
        </div>

        {/* แท็บหมวดหมู่ */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6, marginBottom: 10 }}>
          {[{ id: "all", name: "ทั้งหมด" }, { id: "fav", name: "❤ โปรด" }, ...folders].map((f) => (
            <div key={f.id} style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 2, borderRadius: 16, border: `1.5px solid ${tab === f.id ? t.accent : t.border}`, background: tab === f.id ? t.accent : "transparent", paddingRight: f.id !== "all" && f.id !== "fav" ? 4 : 0 }}>
              <button onClick={() => setTab(f.id)} style={{ padding: "7px 13px", border: "none", background: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, color: tab === f.id ? t.onAccent : t.sub }}>{f.name}</button>
              {f.id !== "all" && f.id !== "fav" && (
                <button onClick={() => deleteFolder(f.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 3, display: "grid", placeItems: "center" }} title="ลบหมวดหมู่นี้">
                  <X size={12} color={tab === f.id ? t.onAccent : t.faint} />
                </button>
              )}
            </div>
          ))}
          <button onClick={() => setAddingFolder((v) => !v)} style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 16, border: `1.5px dashed ${t.border}`, background: "none", cursor: "pointer", color: t.sub, display: "grid", placeItems: "center" }}><Plus size={15} /></button>
        </div>
        {addingFolder && (
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input autoFocus value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addFolder()} placeholder="ตั้งชื่อหมวดหมู่ เช่น ชิลล์ๆ, ออกกำลังกาย" style={input(t)} />
            <button onClick={addFolder} style={{ ...primaryBtn(t), padding: "0 14px" }}>สร้าง</button>
          </div>
        )}

        {/* playlist */}
        <div style={{ fontSize: 12.5, fontWeight: 800, color: t.sub, marginBottom: 8 }}>สื่อที่เก็บไว้ ({shown.length})</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {shown.length === 0 && <div style={{ textAlign: "center", color: t.sub, fontSize: 13, padding: "20px 0" }}>ยังไม่มีสื่อในหมวดนี้</div>}
          {shown.map((tr, i) => (
            <TrackRow key={tr.id} t={t} M={M} track={tr} active={curId === tr.id} playing={playing && curId === tr.id}
              folders={folders} isFirst={i === 0} isLast={i === shown.length - 1}
              onPlay={() => (tr.kind === "link" ? setViewingMedia(tr) : playTrack(tr))} onToggle={togglePlay}
              onDel={() => {
                if (tab === "all") { setPlaylist((p) => p.filter((x) => x.id !== tr.id)); if (userId) supabase.from("playlists").delete().eq("id", tr.id).then(() => {}, () => {}); } // แท็บทั้งหมด -> ลบจริง
                else if (tab === "fav") toggleFavorite(tr.id);                                   // แท็บโปรด -> แค่เอาออกจากโปรด
                else setTrackFolder(tr.id, null);                                                 // แท็บหมวดหมู่ -> แค่เอาออกจากหมวด ไม่ลบต้นฉบับ
              }}
              onFav={() => toggleFavorite(tr.id)}
              onMoveUp={() => moveTrack(tr.id, -1)} onMoveDown={() => moveTrack(tr.id, 1)}
              onFolder={(fid) => setTrackFolder(tr.id, fid)} onRename={(name) => renameTrack(tr.id, name)}
              onPinHome={() => togglePinHome(tr.id)} />
          ))}
        </div>
        {viewingMedia && <SocialEmbedModal t={t} item={viewingMedia} close={() => setViewingMedia(null)} />}
        <div style={{ fontSize: 10.5, color: t.faint, textAlign: "center", marginTop: 14 }}>
          เพลง YouTube แสดงเป็นการ์ด "กำลังเล่น" ที่หน้า Home ใต้เป้าหมายวันนี้ (ตาม YouTube ToS ต้องมองเห็นได้ตอนเล่น) — ถ้าออกจากหน้า Home วิดีโออาจหยุดเล่นตามพฤติกรรมเบราว์เซอร์ · ไฟล์เพลงเล่นต่อได้ทุกหน้าเหมือนเดิม · ไฟล์ใหญ่กว่า 1.5MB เล่นเฉพาะรอบนี้ · ดาวน์โหลดได้เฉพาะไฟล์ที่แนบเอง (YouTube ดาวน์โหลดไม่ได้ตามกติกา)
        </div>
      </div>
    </div>
  );
}

// 📎 แสดงสื่อจากแพลตฟอร์มโซเชียลต่างๆ (โหลด embed script ของแต่ละเจ้าแบบไดนามิก)
// แยกรหัสวิดีโอ TikTok จากลิงก์ (เช่น https://www.tiktok.com/@user/video/1234567890123456789)
function tiktokExtract(url) {
  const m = url.match(/\/video\/(\d+)/);
  return m ? m[1] : null;
}
// แยก shortcode ของ Instagram จากลิงก์ (เช่น https://www.instagram.com/p/ABC123xyz/ หรือ /reel/ABC123xyz/)
function instagramEmbedUrl(url) {
  const m = url.match(/instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
  return m ? `https://www.instagram.com/${m[1]}/${m[2]}/embed` : null;
}

function SocialEmbedModal({ t, item, close }) {
  const containerRef = useRef(null);
  const [twitterReady, setTwitterReady] = useState(!!window.twttr?.widgets);

  useEffect(() => {
    if (item.platform !== "twitter") return;
    if (window.twttr?.widgets) { window.twttr.widgets.load(containerRef.current); setTwitterReady(true); return; }
    const s = document.createElement("script");
    s.src = "https://platform.twitter.com/widgets.js"; s.async = true;
    s.onload = () => { setTwitterReady(true); window.twttr?.widgets?.load(containerRef.current); };
    document.body.appendChild(s);
  }, [item.url]);

  const tiktokId = item.platform === "tiktok" ? tiktokExtract(item.url) : null;
  const igEmbed = item.platform === "instagram" ? instagramEmbedUrl(item.url) : null;

  return (
    <ModalPortal>
      <div style={overlay} onClick={close}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "24px 24px 0 0", padding: 16, maxHeight: "85vh", overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
            <button onClick={close} style={ghost}><X size={20} color={t.sub} /></button>
          </div>
          <div ref={containerRef} style={{ display: "flex", justifyContent: "center" }}>
            {item.platform === "tiktok" && (
              tiktokId
                ? <iframe src={`https://www.tiktok.com/embed/v2/${tiktokId}`} style={{ width: "100%", maxWidth: 325, height: 580, border: "none", borderRadius: 12 }} allow="encrypted-media" title="tiktok" />
                : <div style={{ fontSize: 12, color: t.sub, padding: 20, textAlign: "center" }}>อ่านลิงก์นี้ไม่ได้ ลองกดเปิดต้นฉบับด้านล่างแทน</div>
            )}
            {item.platform === "twitter" && <blockquote className="twitter-tweet"><a href={item.url}>เปิดโพสต์ X</a></blockquote>}
            {item.platform === "instagram" && (
              igEmbed
                ? <iframe src={igEmbed} style={{ width: "100%", maxWidth: 400, height: 480, border: "none", borderRadius: 12 }} title="instagram" />
                : <div style={{ fontSize: 12, color: t.sub, padding: 20, textAlign: "center" }}>อ่านลิงก์นี้ไม่ได้ ลองกดเปิดต้นฉบับด้านล่างแทน</div>
            )}
            {item.platform === "facebook" && (
              <iframe src={`https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(item.url)}&show_text=true&width=400`} style={{ width: "100%", maxWidth: 400, height: 480, border: "none", borderRadius: 12 }} title="facebook" />
            )}
          </div>
          <a href={item.url} target="_blank" rel="noreferrer" style={{ display: "block", textAlign: "center", marginTop: 14, fontSize: 12.5, color: t.accent, fontWeight: 700, textDecoration: "none" }}>เปิดต้นฉบับในแอป {PLATFORM_META[item.platform]?.label} →</a>
        </div>
      </div>
    </ModalPortal>
  );
}

function TrackRow({ t, M, track, active, playing, folders, isFirst, isLast, onPlay, onToggle, onDel, onFav, onMoveUp, onMoveDown, onFolder, onRename, onPinHome }) {
  const isLink = track.kind === "link";
  const platMeta = PLATFORM_META[track.platform] || PLATFORM_META.other;
  const icon = isLink ? <Link2 size={16} color={platMeta.color} /> : track.kind === "yt" ? <Music size={16} color="#E0507B" /> : track.kind === "file" ? <Music size={16} color="#3DA5D9" /> : <Sparkles size={16} color={t.accent} />;
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(track.name);
  const saveRename = () => { if (editName.trim()) onRename?.(editName.trim()); setEditing(false); };
  return (
    <div style={{ ...card(t), padding: "10px 12px", border: `1px solid ${active ? t.accent : t.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={isLink ? onPlay : (active ? onToggle : onPlay)} style={{ width: 34, height: 34, borderRadius: 17, border: "none", cursor: "pointer", background: active ? t.accent : `${t.accent}22`, color: active ? t.onAccent : t.accent, display: "grid", placeItems: "center", flexShrink: 0 }}>
          {isLink ? <ChevronRight size={15} /> : active && playing ? <Pause size={15} /> : <Play size={15} />}
        </button>
        <span style={{ flexShrink: 0 }}>{icon}</span>
        {editing ? (
          <input value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveRename()} onBlur={saveRename} autoFocus style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, border: `1px solid ${t.accent}`, borderRadius: 8, padding: "3px 6px", background: t.inputBg, color: t.text }} />
        ) : (
          <div onClick={() => { setEditName(track.name); setEditing(true); }} style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: t.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", cursor: "pointer" }} title="กดเพื่อแก้ชื่อ">{track.name}</div>
        )}
        {isLink && (
          <button onClick={onPinHome} style={ghost} title={track.pinnedHome ? "เอาออกจากหน้าโฮม" : "โชว์ที่หน้าโฮม"}><Home size={15} color={track.pinnedHome ? "#2E9E6B" : t.faint} /></button>
        )}
        <button onClick={onFav} style={ghost} title="โปรด"><Sparkles size={15} color={track.favorite ? "#E0B24A" : t.faint} fill={track.favorite ? "#E0B24A" : "none"} /></button>
        {track.kind === "file" && (
          <a href={track.src} download={track.name} style={{ ...ghost, display: "grid", placeItems: "center" }} title="ดาวน์โหลด"><Download size={15} color={t.faint} /></a>
        )}
        {onDel && <button onClick={onDel} style={ghost}><Trash2 size={15} color={t.faint} /></button>}
      </div>
      {isLink && <div style={{ fontSize: 10, color: platMeta.color, fontWeight: 700, marginTop: 6, paddingLeft: 44 }}>{platMeta.label}</div>}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, paddingLeft: 44 }}>
        <button onClick={onMoveUp} disabled={isFirst} style={{ ...ghost, opacity: isFirst ? 0.3 : 1 }} title="ย้ายขึ้น">▲</button>
        <button onClick={onMoveDown} disabled={isLast} style={{ ...ghost, opacity: isLast ? 0.3 : 1 }} title="ย้ายลง">▼</button>
        {folders && folders.length > 0 && (
          <select value={track.folderId || ""} onChange={(e) => onFolder(e.target.value || null)} style={{ fontSize: 11, border: `1px solid ${t.border}`, borderRadius: 8, background: t.inputBg, color: t.sub, padding: "3px 6px" }}>
            <option value="">ไม่มีหมวดหมู่</option>
            {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        )}
      </div>
    </div>
  );
}

const greet = (night) => { const h = new Date().getHours(); return h < 6 ? "ดึกแล้ว พักบ้างนะ 🌙" : h < 12 ? "สวัสดีตอนเช้า ☀️" : h < 18 ? "สวัสดีตอนบ่าย 🌤️" : "ค่ำแล้ว วันนี้เป็นไงบ้าง 🌙"; };

// ---------------- Home ----------------
function HomePage({ t, M, quote, isNight, setMentorPick, balance, tx, goals, goalDone, goalPct, setGoals, notes, setPage, setChatOpen, userId, playlist }) {
  const [viewingPinned, setViewingPinned] = useState(null);
  const [commentingId, setCommentingId] = useState(null);
  const pinnedMedia = (playlist || []).filter((p) => p.kind === "link" && p.pinnedHome);
  const [goalText, setGoalText] = useState("");
  const latestNote = notes[0];
  const todayNet = tx.filter((x) => x.date === todayStr()).reduce((s, x) => s + (x.type === "in" ? x.amount : -x.amount), 0);

  // เพิ่มเป้าหมายพร้อมบันทึกลง Supabase ทันที (กันหายถ้ารีเฟรชเร็วเกินกว่า background sync จะทันบันทึก)
  const addGoal = () => {
    if (!goalText.trim()) return;
    const g = { id: uid(), text: goalText.trim(), done: false, date: todayStr(), doneDate: null };
    setGoals((gs) => [...gs, g]);
    setGoalText("");
    if (userId) supabase.from("goals").insert({ id: g.id, user_id: userId, text: g.text, done: g.done, date: g.date, done_date: g.doneDate }).then(() => {}, () => {});
  };

  // 📢 ป้ายประกาศระบบ — โหลดของที่ active อยู่ + ฟังการเปลี่ยนแปลงแบบสด + จำว่าปิดอันไหนไปแล้ว
  const [announcements, setAnnouncements] = useState([]);
  const [dismissed, setDismissed] = useState(() => { try { return JSON.parse(localStorage.getItem("refhub:dismissedAnnounce") || "[]"); } catch (e) { return []; } });
  useEffect(() => {
    supabase.from("announcements").select("*").eq("active", true).order("created_at", { ascending: false }).then(({ data }) => setAnnouncements(data || []));
    const channel = supabase.channel("announce-watch").on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, () => {
      supabase.from("announcements").select("*").eq("active", true).order("created_at", { ascending: false }).then(({ data }) => setAnnouncements(data || []));
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);
  const dismiss = (id) => {
    const next = [...dismissed, id];
    setDismissed(next);
    try { localStorage.setItem("refhub:dismissedAnnounce", JSON.stringify(next)); } catch (e) {}
  };
  const shownAnnouncements = announcements.filter((a) => !dismissed.includes(a.id));

  // 📚 ดึงบทความความรู้วันนี้จริงมาโชว์ (เดิมฟิกข้อความปลอมไว้)
  const [todayArticles, setTodayArticles] = useState(null); // null = กำลังโหลด, [] = ยังไม่มี
  useEffect(() => {
    if (!userId) return;
    supabase.from("knowledge_articles").select("title").eq("user_id", userId).eq("date", todayStr()).order("created_at", { ascending: true }).then(({ data, error }) => {
      if (error) { console.error("โหลดบทความความรู้วันนี้ไม่สำเร็จ:", error.message); return; }
      setTodayArticles(data || []);
    });
  }, [userId]);

  return (
    <>
      {shownAnnouncements.map((a) => (
        <div key={a.id} style={{ background: `${t.accent}14`, border: `1px solid ${t.accent}40`, borderRadius: 16, padding: "10px 12px", marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 26, height: 26, borderRadius: 13, background: `${t.accent}22`, display: "grid", placeItems: "center", flexShrink: 0 }}><Bell size={13} color={t.accent} /></span>
          <div style={{ flex: 1, fontSize: 12, color: t.text, lineHeight: 1.5 }}>{a.message}</div>
          <button onClick={() => dismiss(a.id)} style={{ background: "none", border: "none", cursor: "pointer", flexShrink: 0, padding: 2 }}><X size={15} color={t.faint} /></button>
        </div>
      ))}
      <div style={{ marginTop: 8, background: t.hero, border: `1px solid ${t.heroBorder}`, borderRadius: 26, padding: 20, position: "relative", overflow: "hidden", boxShadow: isNight ? "none" : "0 10px 24px rgba(30,40,70,.18)" }}>
        <div style={{ position: "absolute", top: -34, right: -34, width: 130, height: 130, borderRadius: "50%", background: "rgba(255,255,255,.10)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -44, left: -24, width: 105, height: 105, borderRadius: "50%", background: "rgba(255,255,255,.06)", pointerEvents: "none" }} />
        <div style={{ position: "relative" }}>
          <button onClick={() => setMentorPick(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: M.accent, letterSpacing: .5 }}>{isNight ? "โค้ชคืนนี้" : "โค้ชวันนี้"} · {M.name.toUpperCase()}</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,.5)" }}>เปลี่ยน ▾</span>
          </button>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, gap: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16.5, fontWeight: 700, color: "#fff", lineHeight: 1.4, minHeight: 46 }}>“{quote}”</div>
              <button onClick={() => setChatOpen(true)} style={{ marginTop: 14, border: "none", cursor: "pointer", background: "rgba(255,255,255,.18)", color: "#fff", fontWeight: 700, fontSize: 13, padding: "9px 16px", borderRadius: 18, display: "inline-flex", alignItems: "center", gap: 6 }}>คุยกับโค้ช <ChevronRight size={15} /></button>
            </div>
            <Ring pct={goalPct} color="#fff" label="เป้าหมาย" />
          </div>
        </div>
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: t.sub, margin: "22px 0 12px" }}>วิดเจ็ตของฉัน</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <CatCard t={t} k="green" icon={<Wallet size={15} color="#fff" />} label="การเงิน" onClick={() => setPage("ledger")}>
          <div style={{ fontSize: 19, fontWeight: 800, color: t.catTx.green }}>{fmt(balance)}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: todayNet >= 0 ? "#2E9E6B" : "#D9534F", marginTop: 2 }}>{todayNet >= 0 ? "▲ +" : "▼ "}{Math.abs(todayNet).toLocaleString()} วันนี้</div>
        </CatCard>
        <CatCard t={t} k="amber" icon={<BookOpen size={15} color="#fff" />} label="ความรู้วันนี้" onClick={() => setPage("ideas")}>
          <div style={{ fontSize: 14, fontWeight: 800, color: t.catTx.amber, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {todayArticles === null ? "กำลังโหลด..." : todayArticles.length === 0 ? "ยังไม่มีวันนี้" : todayArticles[0].title}
          </div>
          <div style={{ fontSize: 10.5, color: t.catLb.amber, marginTop: 3 }}>
            {todayArticles === null ? "" : todayArticles.length === 0 ? "แตะเพื่อดู" : `${todayArticles.length} บทความ · AI คัดให้`}
          </div>
        </CatCard>
        <CatCard t={t} k="coral" icon={<Target size={15} color="#fff" />} label="เป้าหมายวันนี้" onClick={() => setPage("goalsReport")}>
          <div style={{ fontSize: 16, fontWeight: 800, color: t.catTx.coral }}>{goalDone} / {goals.length || 0} สำเร็จ</div>
          <div style={{ height: 7, borderRadius: 4, background: "rgba(0,0,0,.1)", marginTop: 8, overflow: "hidden" }}><div style={{ width: `${goalPct}%`, height: "100%", background: "#E07B57" }} /></div>
        </CatCard>
        <CatCard t={t} k="violet" icon={<StickyNote size={15} color="#fff" />} label="โน้ตล่าสุด" onClick={() => setPage("note")}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: t.catTx.violet, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{latestNote ? latestNote.title || "(ไม่มีหัวข้อ)" : "ยังไม่มีโน้ต"}</div>
          <div style={{ fontSize: 10.5, color: t.catLb.violet, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{latestNote ? (blocksToPlainText(latestNote.body).trim() || "แตะเพื่อเปิด") : "แตะเพื่อเริ่ม"}</div>
        </CatCard>
      </div>

      <div style={{ ...card(t), marginTop: 16, padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: t.text }}>เป้าหมายวันนี้</div>
          <button onClick={() => setPage("goalsReport")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: t.accent, fontSize: 11, fontWeight: 700 }}>ดูย้อนหลัง <ChevronRight size={13} /></button>
        </div>
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          {goals.length === 0 && <div style={{ fontSize: 12.5, color: t.sub }}>ยังไม่มีเป้าหมาย เพิ่มอันแรกเลย 👇</div>}
          {goals.map((g) => (
            <div key={g.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button onClick={() => { const nd = !g.done; const dd = nd ? todayStr() : null; setGoals((gs) => gs.map((x) => (x.id === g.id ? { ...x, done: nd, doneDate: dd } : x))); if (userId) supabase.from("goals").update({ done: nd, done_date: dd }).eq("id", g.id).then(() => {}, () => {}); }} style={{ width: 22, height: 22, borderRadius: 7, border: `2px solid ${g.done ? t.accent : t.faint}`, background: g.done ? t.accent : "transparent", cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}>{g.done && <Check size={14} color={t.onAccent} />}</button>
                <button onClick={() => setCommentingId(commentingId === g.id ? null : g.id)} style={{ flex: 1, minWidth: 0, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
                  <div style={{ fontSize: 13.5, color: g.done ? t.sub : t.text, textDecoration: g.done ? "line-through" : "none" }}>{g.text}</div>
                  {g.comment && <div style={{ fontSize: 10.5, color: t.faint, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>💬 {g.comment}</div>}
                </button>
                <button onClick={() => setCommentingId(commentingId === g.id ? null : g.id)} style={ghost} title="เพิ่มคอมเมนต์/สถานะ"><MessageCircle size={14} color={g.comment ? t.accent : t.faint} /></button>
                <button onClick={() => { setGoals((gs) => gs.filter((x) => x.id !== g.id)); if (userId) supabase.from("goals").delete().eq("id", g.id).then(() => {}, () => {}); }} style={ghost}><Trash2 size={15} color={t.faint} /></button>
              </div>
              {commentingId === g.id && (
                <div style={{ display: "flex", gap: 6, marginTop: 6, marginLeft: 32 }}>
                  <input defaultValue={g.comment || ""} autoFocus onKeyDown={(e) => { if (e.key === "Enter") { const val = e.target.value.trim(); setGoals((gs) => gs.map((x) => (x.id === g.id ? { ...x, comment: val || null } : x))); if (userId) supabase.from("goals").update({ comment: val || null }).eq("id", g.id).then(() => {}, () => {}); setCommentingId(null); } }} placeholder="คอมเมนต์/สถานะเล็กๆ เช่น 'ทำได้ครึ่งทาง'..." style={{ ...input(t), fontSize: 12, padding: "6px 10px" }} />
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input value={goalText} onChange={(e) => setGoalText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addGoal(); }} placeholder="เพิ่มเป้าหมายวันนี้..." style={input(t)} />
          <button onClick={addGoal} style={{ ...primaryBtn(t), padding: "0 16px" }}>เพิ่ม</button>
        </div>
      </div>

      {pinnedMedia.length > 0 && (
        <div style={{ ...card(t), marginTop: 16, padding: 16 }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: t.text, marginBottom: 10 }}>📎 สื่อที่ปักหมุดไว้</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pinnedMedia.map((m) => {
              const meta = PLATFORM_META[m.platform] || PLATFORM_META.other;
              return (
                <button key={m.id} onClick={() => setViewingPinned(m)} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: `1px solid ${t.border}`, borderRadius: 12, padding: "10px 12px", cursor: "pointer", textAlign: "left" }}>
                  <Link2 size={15} color={meta.color} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
                    <div style={{ fontSize: 10, color: meta.color, fontWeight: 700 }}>{meta.label}</div>
                  </div>
                  <ChevronRight size={15} color={t.faint} />
                </button>
              );
            })}
          </div>
        </div>
      )}
      {viewingPinned && <SocialEmbedModal t={t} item={viewingPinned} close={() => setViewingPinned(null)} />}
    </>
  );
}

// ---------------- Finance (full) ----------------
function FinancePage({ t, tx, setTx, categories, openAdd, openExport, userId }) {
  const [editingTx, setEditingTx] = useState(null);
  const [periodMode, setPeriodMode] = useState("month"); // day | week | month | range
  const [anchor, setAnchor] = useState(todayStr());       // วันที่อ้างอิงสำหรับ day/week/month
  const [rangeStart, setRangeStart] = useState(todayStr());
  const [rangeEnd, setRangeEnd] = useState(todayStr());

  const weekRangeOf = (dateStr) => {
    const d = new Date(dateStr + "T00:00:00");
    const dow = (d.getDay() + 6) % 7; // จันทร์=0 ... อาทิตย์=6
    const mon = new Date(d); mon.setDate(d.getDate() - dow);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return { start: mon.toISOString().slice(0, 10), end: sun.toISOString().slice(0, 10) };
  };
  const shiftAnchor = (dir) => {
    const d = new Date(anchor + "T00:00:00");
    if (periodMode === "day") d.setDate(d.getDate() + dir);
    else if (periodMode === "week") d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setAnchor(d.toISOString().slice(0, 10));
  };

  let periodTx, periodLabel;
  if (periodMode === "day") {
    periodTx = tx.filter((x) => x.date === anchor);
    const d = new Date(anchor + "T00:00:00");
    periodLabel = `${d.getDate()} ${["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."][d.getMonth()]} ${d.getFullYear() + 543}`;
  } else if (periodMode === "week") {
    const { start, end } = weekRangeOf(anchor);
    periodTx = tx.filter((x) => x.date >= start && x.date <= end);
    periodLabel = `${dateLabel(start)} – ${dateLabel(end)}`;
  } else if (periodMode === "range") {
    periodTx = tx.filter((x) => x.date >= rangeStart && x.date <= rangeEnd);
    periodLabel = `${rangeStart} – ${rangeEnd}`;
  } else {
    const sel = monthOf(anchor);
    periodTx = tx.filter((x) => monthOf(x.date) === sel);
    periodLabel = thMonth(sel);
  }
  periodTx = [...periodTx].sort((a, b) => b.date.localeCompare(a.date));

  const income = periodTx.filter((x) => x.type === "in").reduce((s, x) => s + x.amount, 0);
  const expense = periodTx.filter((x) => x.type === "out").reduce((s, x) => s + x.amount, 0);

  const pie = Object.entries(periodTx.filter((x) => x.type === "out").reduce((a, x) => { a[x.cat] = (a[x.cat] || 0) + x.amount; return a; }, {}))
    .map(([id, value]) => { const c = findCat(categories, id); return { name: c.label, value, color: c.color }; }).sort((a, b) => b.value - a.value);

  const months = []; for (let i = 5; i >= 0; i--) { const d = new Date(); d.setMonth(d.getMonth() - i); months.push(d.toISOString().slice(0, 7)); }
  const bars = months.map((ym) => ({ m: thMonth(ym).split(" ")[0], รับ: tx.filter((x) => monthOf(x.date) === ym && x.type === "in").reduce((s, x) => s + x.amount, 0), จ่าย: tx.filter((x) => monthOf(x.date) === ym && x.type === "out").reduce((s, x) => s + x.amount, 0) }));

  const groups = {}; periodTx.forEach((x) => { (groups[x.date] = groups[x.date] || []).push(x); });

  const csvText = () => {
    const head = "date,type,category,amount,note\n";
    const rows = periodTx.map((x) => `${x.date},${x.type === "in" ? "income" : "expense"},${findCat(categories, x.cat).label},${x.amount},"${(x.note || "").replace(/"/g, "'")}"`).join("\n");
    return head + rows;
  };
  const doExportCsv = () => { try { const blob = new Blob(["\uFEFF" + csvText()], { type: "text/csv;charset=utf-8;" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "refhub-finance.csv"; document.body.appendChild(a); a.click(); a.remove(); } catch (e) { openExport(csvText()); } };

  // Export PDF: เปิดหน้าต่าง print ของเบราว์เซอร์เอง (ไม่ต้องเพิ่ม library ใหม่ + รองรับภาษาไทยถูกต้อง 100%
  // เพราะใช้ font จริงของเครื่อง ไม่ใช่ font ฝังใน PDF แบบ library ทำ) ผู้ใช้กด "บันทึกเป็น PDF" ในหน้าต่าง print ได้เลย
  const doExportPdf = () => {
    const rows = periodTx.map((x) => `<tr><td>${x.date}</td><td>${x.type === "in" ? "รับเข้า" : "จ่ายออก"}</td><td>${findCat(categories, x.cat).label}</td><td style="text-align:right">${x.amount.toLocaleString()}</td><td>${(x.note || "").replace(/</g, "&lt;")}</td></tr>`).join("");
    const html = `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><title>RefHub - รายงานการเงิน</title>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&display=swap">
      <style>
        body{font-family:'IBM Plex Sans Thai','Sarabun','Segoe UI',sans-serif;padding:24px;color:#222}
        h1{font-size:20px;margin-bottom:2px} .sub{color:#777;font-size:13px;margin-bottom:18px}
        table{width:100%;border-collapse:collapse;font-size:13px} th,td{padding:7px 8px;border-bottom:1px solid #e5e5e5;text-align:left}
        th{background:#f4f4f4} .summary{display:flex;gap:24px;margin-bottom:18px}
        .summary div{font-size:13px} .summary b{display:block;font-size:17px}
      </style></head><body>
      <h1>รายงานการเงิน — RefHub</h1>
      <div class="sub">ช่วงเวลา: ${periodLabel}</div>
      <div class="summary">
        <div>รายรับ<b style="color:#2E9E6B">${fmt(income)}</b></div>
        <div>รายจ่าย<b style="color:#D9534F">${fmt(expense)}</b></div>
        <div>คงเหลือ<b>${fmt(income - expense)}</b></div>
      </div>
      <table><thead><tr><th>วันที่</th><th>ประเภท</th><th>หมวดหมู่</th><th>จำนวนเงิน</th><th>รายละเอียด</th></tr></thead><tbody>${rows}</tbody></table>
      <script>window.onload = () => window.print();</script>
      </body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
  };

  return (
    <>
      <PageHead t={t} title="การเงิน" sub="รายรับ–รายจ่าย · ใช้ได้จริงทุกวัน" icon={<Wallet size={20} color={t.accent} />} />

      {/* ตัวเลือกช่วงเวลา */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {[["day", "วัน"], ["week", "สัปดาห์"], ["month", "เดือน"], ["range", "กำหนดเอง"]].map(([v, lb]) => (
          <button key={v} onClick={() => setPeriodMode(v)} style={{ flex: 1, padding: "8px 0", borderRadius: 10, cursor: "pointer", border: `1.5px solid ${periodMode === v ? t.accent : t.border}`, fontWeight: 700, fontSize: 12, background: periodMode === v ? t.accent : "transparent", color: periodMode === v ? t.onAccent : t.sub }}>{lb}</button>
        ))}
      </div>

      {/* ตัวเลือกช่วงเวลา + สรุป */}
      <div style={{ ...card(t), padding: 16 }}>
        {periodMode === "range" ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="date" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} style={{ ...input(t), fontSize: 12 }} />
            <span style={{ color: t.faint }}>–</span>
            <input type="date" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} style={{ ...input(t), fontSize: 12 }} />
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button onClick={() => shiftAnchor(-1)} style={navBtn(t)}>‹</button>
            <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>{periodLabel}</div>
            <button onClick={() => shiftAnchor(1)} style={navBtn(t)}>›</button>
          </div>
        )}
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <Stat t={t} label="รายรับ" val={income} color="#2E9E6B" />
          <Stat t={t} label="รายจ่าย" val={expense} color="#D9534F" />
          <Stat t={t} label="คงเหลือ" val={income - expense} color={t.accent} />
        </div>
      </div>

      {/* pie */}
      {pie.length > 0 && (
        <div style={{ ...card(t), padding: 16, marginTop: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: t.text, marginBottom: 6 }}>จ่ายไปกับอะไรบ้าง</div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ width: 140, height: 140 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={pie} dataKey="value" nameKey="name" innerRadius={38} outerRadius={62} paddingAngle={2}>
                  {pie.map((e, i) => <Cell key={i} fill={e.color} stroke="none" />)}
                </Pie><Tooltip formatter={(v) => fmt(v)} /></PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              {pie.slice(0, 5).map((e, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: e.color }} />
                  <span style={{ flex: 1, color: t.sub }}>{e.name}</span>
                  <span style={{ fontWeight: 700, color: t.text }}>{Math.round(e.value / expense * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* bar */}
      <div style={{ ...card(t), padding: 16, marginTop: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: t.text, marginBottom: 10 }}>สรุปรายเดือน (รับ vs จ่าย · 6 เดือนล่าสุด)</div>
        <div style={{ width: "100%", height: 150 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bars} barGap={2}>
              <XAxis dataKey="m" tick={{ fontSize: 10, fill: t.sub }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => fmt(v)} cursor={{ fill: "rgba(0,0,0,.04)" }} />
              <Bar dataKey="รับ" fill="#2E9E6B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="จ่าย" fill="#E07B57" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* actions */}
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <button onClick={openAdd} style={{ ...primaryBtn({ accent: t.accent, accent2: t.accent2, onAccent: t.onAccent }), flex: 1, padding: "13px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Plus size={18} /> เพิ่มรายการ</button>
        <button onClick={doExportCsv} style={{ ...card(t), border: `1px solid ${t.border}`, padding: "0 14px", cursor: "pointer", color: t.text, fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}><FileSpreadsheet size={17} color="#1D7A46" /> CSV</button>
        <button onClick={doExportPdf} style={{ ...card(t), border: `1px solid ${t.border}`, padding: "0 14px", cursor: "pointer", color: t.text, fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}><FileText size={17} color="#D9534F" /> PDF</button>
      </div>

      {/* log */}
      <div style={{ fontSize: 13, fontWeight: 800, color: t.sub, margin: "20px 0 10px" }}>รายการย้อนหลัง</div>
      {periodTx.length === 0 && <Empty t={t} text="ช่วงนี้ยังไม่มีรายการ" />}
      {Object.keys(groups).map((d) => (
        <div key={d} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: t.faint, marginBottom: 6 }}>{dateLabel(d)}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {groups[d].map((x) => { const C = findCat(categories, x.cat); const Ic = ICONS[C.iconKey] || Wallet; return (
              <div key={x.id} style={{ ...card(t), padding: "11px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 11, background: `${C.color}22`, display: "grid", placeItems: "center" }}><Ic size={17} color={C.color} /></div>
                  <div><div style={{ fontSize: 13.5, fontWeight: 600, color: t.text }}>{x.note}</div><div style={{ fontSize: 11, color: t.sub }}>{C.label}</div></div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 800, color: x.type === "in" ? "#2E9E6B" : t.text }}>{x.type === "in" ? "+" : "−"}{x.amount.toLocaleString()}</div>
                  <button onClick={() => setEditingTx(x)} style={ghost} title="แก้ไข"><Pencil size={15} color={t.faint} /></button>
                  <button onClick={() => { setTx((l) => l.filter((y) => y.id !== x.id)); if (userId) supabase.from("transactions").delete().eq("id", x.id).then(() => {}, () => {}); }} style={ghost}><Trash2 size={15} color={t.faint} /></button>
                </div>
              </div>
            ); })}
          </div>
        </div>
      ))}
      {editingTx && <EditTxModal t={t} x={editingTx} categories={categories} userId={userId} setTx={setTx} close={() => setEditingTx(null)} />}
    </>
  );
}

// 🎭 แอดมินจัดการชุด Reaction เอง (เพิ่ม/ลบ/แก้ emoji ได้ทั้งหมด)
function ReactionManagerCard({ t }) {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newEmoji, setNewEmoji] = useState("");
  const [newLabel, setNewLabel] = useState("");

  const load = () => { supabase.from("reaction_types").select("*").order("sort_order", { ascending: true }).then(({ data }) => { setTypes(data || []); setLoading(false); }); };
  useEffect(() => { load(); }, []);

  const addType = async () => {
    if (!newEmoji.trim() || !newLabel.trim()) return;
    const id = newLabel.trim().toLowerCase().replace(/[^a-z0-9ก-๙]/g, "") + "_" + uid();
    const { error } = await supabase.from("reaction_types").insert({ id, emoji: newEmoji.trim(), label: newLabel.trim(), sort_order: types.length + 1 });
    if (error) { alert("เพิ่มไม่สำเร็จ: " + error.message); return; }
    setNewEmoji(""); setNewLabel(""); load();
  };
  const removeType = async (id) => { await supabase.from("reaction_types").delete().eq("id", id); load(); };

  return (
    <div style={{ ...card(t), padding: 16 }}>
      <div style={{ fontSize: 13.5, fontWeight: 800, color: t.text, marginBottom: 4 }}>🎭 จัดการชุด Reaction (Passport)</div>
      <div style={{ fontSize: 11, color: t.sub, marginBottom: 12 }}>ปรับชุด reaction ที่ทุกคนใช้กดในหน้า Passport ได้เอง เพิ่ม/ลบได้ตามใจ</div>
      {loading ? <Empty t={t} text="กำลังโหลด..." /> : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {types.map((r) => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 6, background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 10, padding: "6px 10px" }}>
              <span style={{ fontSize: 16 }}>{r.emoji}</span>
              <span style={{ fontSize: 11.5, color: t.text, fontWeight: 700 }}>{r.label}</span>
              <button onClick={() => removeType(r.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "grid" }}><X size={12} color={t.faint} /></button>
            </div>
          ))}
          {types.length === 0 && <div style={{ fontSize: 11.5, color: t.faint }}>ยังไม่มี reaction เลย เพิ่มอันแรกด้านล่าง</div>}
        </div>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <input value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)} placeholder="😍" style={{ ...input(t), width: 60, textAlign: "center", fontSize: 16, padding: "8px 4px" }} maxLength={4} />
        <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addType()} placeholder="ชื่อ เช่น ว้าว" style={{ ...input(t), flex: 1 }} />
        <button onClick={addType} style={{ ...primaryBtn({ accent: t.accent, accent2: t.accent2, onAccent: t.onAccent }), padding: "0 16px" }}>เพิ่ม</button>
      </div>
    </div>
  );
}

function AdminPage({ t, session, userId, adminAlerts, setAdminAlerts, authProfile, setAuthProfile }) {
  const [tab, setTab] = useState("overview"); // overview | members | add
  const [members, setMembers] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [detailMember, setDetailMember] = useState(null); // เปิด detail sheet ของสมาชิกคนนี้อยู่

  const loadMembers = async () => {
    setLoadingList(true);
    try {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      const { data: locs } = await supabase.from("locations").select("user_id").eq("share_enabled", true);
      const { data: subs } = await supabase.from("push_subscriptions").select("user_id");
      const sharingIds = new Set((locs || []).map((l) => l.user_id));
      const notifIds = new Set((subs || []).map((s) => s.user_id));
      const merged = (data || []).map((m) => ({ ...m, locationShared: sharingIds.has(m.id), notifEnabled: notifIds.has(m.id) }));
      setMembers(merged);
      if (detailMember) { const fresh = merged.find((x) => x.id === detailMember.id); if (fresh) setDetailMember(fresh); }
    } catch (e) {}
    setLoadingList(false);
  };
  useEffect(() => { loadMembers(); }, []);

  const isOnline = (lastSeen) => lastSeen && (Date.now() - new Date(lastSeen).getTime()) < 2 * 60 * 1000;

  const setApproved = async (id, approved, email, name) => {
    await supabase.from("profiles").update({ approved }).eq("id", id);
    loadMembers();
    if (approved && email) {
      fetch("/api/send-approval-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ toEmail: email, toName: name, callerToken: session?.access_token }) })
        .then((r) => r.json()).then((d) => { if (d.error) console.error("ส่งอีเมลแจ้งอนุมัติไม่สำเร็จ:", d.error); })
        .catch((e) => console.error("เชื่อมต่อ /api/send-approval-email ไม่สำเร็จ:", e.message));
    }
  };
  const setRole = async (id, role) => { await supabase.from("profiles").update({ role }).eq("id", id); loadMembers(); };
  const setCanChat = async (id, can_chat) => { await supabase.from("profiles").update({ can_chat }).eq("id", id); loadMembers(); };
  const setCanViewLocations = async (id, can_view_locations) => { const { error } = await supabase.from("profiles").update({ can_view_locations }).eq("id", id); if (error) { alert("ตั้งสิทธิ์ดูตำแหน่งไม่สำเร็จ: " + error.message); console.error(error); } loadMembers(); };
  const remindNotification = async (id) => { await supabase.from("profiles").update({ notif_reminder_at: new Date().toISOString() }).eq("id", id); loadMembers(); };
  const setPremiumAi = async (id, premium_ai) => { await supabase.from("profiles").update({ premium_ai }).eq("id", id); loadMembers(); };
  const setCanUseSorting = async (id, can_use_sorting) => { await supabase.from("profiles").update({ can_use_sorting }).eq("id", id); loadMembers(); };
  const approveSwitch = async (targetUserId) => {
    const r = await fetch("/api/chat-room", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "approve_switch", targetUserId, callerToken: session?.access_token }) });
    const data = await r.json();
    if (data.error) alert("อนุมัติไม่สำเร็จ: " + data.error);
    loadMembers();
  };
  const setMentorLimit = async (id, mentor_limit) => { await supabase.from("profiles").update({ mentor_limit }).eq("id", id); loadMembers(); };
  const resetMentorPick = async (id) => { await supabase.from("custom_mentors").delete().eq("user_id", id); loadMembers(); };
  const setTopicLimit = async (id, topic_limit) => { await supabase.from("profiles").update({ topic_limit }).eq("id", id); loadMembers(); };
  const setDailyArticleLimit = async (id, daily_article_limit) => { await supabase.from("profiles").update({ daily_article_limit }).eq("id", id); loadMembers(); };
  const setCanRefreshArticles = async (id, can_refresh_articles) => { await supabase.from("profiles").update({ can_refresh_articles }).eq("id", id); loadMembers(); };
  const removeMember = async (id) => { await supabase.from("profiles").delete().eq("id", id); setDetailMember(null); loadMembers(); };

  const pendingCount = members.filter((m) => !m.approved).length;
  const onlineMembers = members.filter((m) => isOnline(m.last_seen));
  const recentMembers = [...members].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);

  const AvatarDot = ({ m, size = 40 }) => (
    <div style={{ position: "relative", flexShrink: 0 }}>
      {m.avatar_url ? (
        <img src={m.avatar_url} alt="" style={{ width: size, height: size, borderRadius: size * 0.3, objectFit: "cover", display: "block" }} />
      ) : (
        <div style={{ width: size, height: size, borderRadius: size * 0.3, background: colorFor(m.name || m.email || "?"), color: "#fff", display: "grid", placeItems: "center", fontSize: size * 0.4, fontWeight: 700 }}>{(m.name || m.email || "?")[0].toUpperCase()}</div>
      )}
      <div style={{ position: "absolute", bottom: -2, right: -2, width: size * 0.28, height: size * 0.28, borderRadius: size * 0.14, background: isOnline(m.last_seen) ? "#2E9E6B" : t.faint, border: `2px solid ${t.surface}` }} />
    </div>
  );

  return (
    <>
      <PageHead t={t} title="Admin" sub="จัดการสมาชิกและดูความเคลื่อนไหวของแอป" icon={<ShieldCheck size={20} color={t.accent} />} />

      {adminAlerts.length > 0 && (
        <div style={{ ...card(t), padding: 14, marginBottom: 14, border: `1px solid ${t.accent}55` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: t.text, display: "flex", alignItems: "center", gap: 6 }}><Bell size={14} color={t.accent} /> แจ้งเตือนล่าสุด</div>
            <button onClick={() => setAdminAlerts([])} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: t.sub }}>ล้างทั้งหมด</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {adminAlerts.slice(0, 5).map((a) => <div key={a.id} style={{ fontSize: 12, color: t.sub }}>• {a.text}</div>)}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {[["overview", "ภาพรวม"], ["members", "สมาชิก"], ["announce", "ประกาศ"], ["add", "เพิ่มสมาชิก"]].map(([v, lb]) => (
          <button key={v} onClick={() => setTab(v)} style={{ flex: 1, padding: "9px 0", borderRadius: 12, cursor: "pointer", border: `1.5px solid ${tab === v ? t.accent : t.border}`, fontWeight: 700, fontSize: 12.5, background: tab === v ? t.accent : "transparent", color: tab === v ? t.onAccent : t.sub }}>{lb}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ ...card(t), padding: 16 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: t.text, marginBottom: 4 }}>⚙️ ตั้งค่าคลังความรู้ (บัญชีของฉันเอง)</div>
            <div style={{ fontSize: 11, color: t.sub, marginBottom: 12 }}>กำหนดจำนวนบทความ/หมวดที่ AI สร้างให้ทุกวัน กันบทความล้นเก็บสะสมเยอะเกินไป</div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: t.faint, marginBottom: 4 }}>บทความ/วัน</div>
                <select value={authProfile?.daily_article_limit ?? 3} onChange={async (e) => { const v = +e.target.value; await supabase.from("profiles").update({ daily_article_limit: v }).eq("id", userId); setAuthProfile((p) => ({ ...p, daily_article_limit: v })); }} style={{ border: `1px solid ${t.border}`, borderRadius: 8, background: t.inputBg, color: t.text, fontWeight: 700, fontSize: 12.5, padding: "4px 8px", width: "100%" }}>
                  {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => <option key={n} value={n}>{n} บทความ</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: t.faint, marginBottom: 4 }}>หมวดที่เลือกได้สูงสุด</div>
                <select value={authProfile?.topic_limit ?? KNOWLEDGE_TOPICS.length} onChange={async (e) => { const v = +e.target.value; await supabase.from("profiles").update({ topic_limit: v }).eq("id", userId); setAuthProfile((p) => ({ ...p, topic_limit: v })); }} style={{ border: `1px solid ${t.border}`, borderRadius: 8, background: t.inputBg, color: t.text, fontWeight: 700, fontSize: 12.5, padding: "4px 8px", width: "100%" }}>
                  {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => <option key={n} value={n}>{n} หมวด</option>)}
                </select>
              </div>
            </div>
          </div>
          <ReactionManagerCard t={t} />
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ ...card(t), flex: 1, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: t.text }}>{members.length}</div>
              <div style={{ fontSize: 11, color: t.sub, marginTop: 2 }}>สมาชิกทั้งหมด</div>
            </div>
            <div style={{ ...card(t), flex: 1, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: pendingCount ? "#D9534F" : t.text }}>{pendingCount}</div>
              <div style={{ fontSize: 11, color: t.sub, marginTop: 2 }}>รออนุมัติ</div>
            </div>
            <div style={{ ...card(t), flex: 1, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#2E9E6B" }}>{onlineMembers.length}</div>
              <div style={{ fontSize: 11, color: t.sub, marginTop: 2 }}>ออนไลน์ตอนนี้</div>
            </div>
          </div>

          {pendingCount > 0 && (
            <button onClick={() => setTab("members")} style={{ ...primaryBtn({ accent: t.accent, accent2: t.accent2, onAccent: t.onAccent }), width: "100%", padding: "12px 0" }}>ไปอนุมัติสมาชิกที่รออยู่ ({pendingCount})</button>
          )}

          <div>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: t.sub, marginBottom: 8 }}>🟢 ออนไลน์ตอนนี้</div>
            {onlineMembers.length === 0 ? (
              <div style={{ ...card(t), padding: 14, fontSize: 12.5, color: t.faint, textAlign: "center" }}>ไม่มีใครออนไลน์อยู่ตอนนี้</div>
            ) : (
              <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
                {onlineMembers.map((m) => (
                  <button key={m.id} onClick={() => { setDetailMember(m); setTab("members"); }} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "center", flexShrink: 0 }}>
                    <AvatarDot m={m} size={46} />
                    <div style={{ fontSize: 10, color: t.sub, marginTop: 4, maxWidth: 56, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: t.sub, marginBottom: 8 }}>สมาชิกล่าสุด</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentMembers.map((m) => (
                <button key={m.id} onClick={() => { setDetailMember(m); setTab("members"); }} style={{ ...card(t), padding: 12, display: "flex", alignItems: "center", gap: 10, cursor: "pointer", border: "none", textAlign: "left", width: "100%" }}>
                  <AvatarDot m={m} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{m.name || m.email}</div>
                    <div style={{ fontSize: 10.5, color: t.sub }}>สมัคร {m.created_at ? new Date(m.created_at).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }) : "-"}</div>
                  </div>
                  {!m.approved && <span style={{ fontSize: 10, fontWeight: 700, color: "#D9534F", background: "#D9534F18", padding: "2px 8px", borderRadius: 8, flexShrink: 0 }}>รออนุมัติ</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "members" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {loadingList && <Empty t={t} text="กำลังโหลด..." />}
          {!loadingList && members.length === 0 && <Empty t={t} text="ยังไม่มีสมาชิก" />}
          {members.map((m) => (
            <button key={m.id} onClick={() => setDetailMember(m)} style={{ ...card(t), padding: 12, display: "flex", alignItems: "center", gap: 10, cursor: "pointer", border: `1px solid ${t.border}`, borderLeft: `3px solid ${m.approved ? "#2E9E6B" : "#D9534F"}`, textAlign: "left", width: "100%" }}>
              <AvatarDot m={m} size={38} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: t.text, display: "flex", alignItems: "center", gap: 6 }}>
                  {m.name || m.email}
                  {m.role === "admin" && <span style={{ fontSize: 9, fontWeight: 800, color: t.accent, background: `${t.accent}18`, padding: "1px 6px", borderRadius: 8, flexShrink: 0 }}>ADMIN</span>}
                </div>
                <div style={{ fontSize: 11, color: t.sub, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.login_type === "pin" ? `ชื่อผู้ใช้: ${m.username}` : m.email}</div>
              </div>
              {!m.approved && <span style={{ fontSize: 10, fontWeight: 700, color: "#D9534F", background: "#D9534F18", padding: "3px 8px", borderRadius: 10, flexShrink: 0 }}>รออนุมัติ</span>}
              <ChevronRight size={17} color={t.faint} style={{ flexShrink: 0 }} />
            </button>
          ))}
        </div>
      )}

      {tab === "announce" && <AnnouncementsAdmin t={t} userId={userId} />}
      {tab === "add" && <AdminAddPinMember t={t} session={session} onCreated={loadMembers} />}

      {detailMember && (
        <ModalPortal>
          <MemberDetailModal
            t={t} m={detailMember} isSelf={detailMember.id === userId}
            isOnline={isOnline(detailMember.last_seen)}
            setApproved={setApproved} setRole={setRole} setCanChat={setCanChat} setCanViewLocations={setCanViewLocations} remindNotification={remindNotification} setPremiumAi={setPremiumAi} setCanUseSorting={setCanUseSorting} approveSwitch={approveSwitch}
            setMentorLimit={setMentorLimit} setTopicLimit={setTopicLimit} setDailyArticleLimit={setDailyArticleLimit} setCanRefreshArticles={setCanRefreshArticles} resetMentorPick={resetMentorPick}
            removeMember={removeMember}
            close={() => setDetailMember(null)}
          />
        </ModalPortal>
      )}
    </>
  );
}

function MemberDetailModal({ t, m, isSelf, isOnline, setApproved, setRole, setCanChat, setCanViewLocations, setMentorLimit, setTopicLimit, setDailyArticleLimit, setCanRefreshArticles, resetMentorPick, removeMember, remindNotification, setPremiumAi, setCanUseSorting, approveSwitch, close }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const Row = ({ label, children }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${t.border}` }}>
      <span style={{ fontSize: 13, color: t.sub }}>{label}</span>
      {children}
    </div>
  );
  const selectStyle = { border: `1px solid ${t.border}`, borderRadius: 8, background: t.inputBg, color: t.text, fontWeight: 700, fontSize: 12.5, padding: "4px 8px" };

  return (
    <div style={overlay} onClick={close}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "24px 24px 0 0", padding: 20, maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ position: "relative" }}>
              {m.avatar_url ? (
                <img src={m.avatar_url} alt="" style={{ width: 52, height: 52, borderRadius: 16, objectFit: "cover", display: "block" }} />
              ) : (
                <div style={{ width: 52, height: 52, borderRadius: 16, background: colorFor(m.name || m.email || "?"), color: "#fff", display: "grid", placeItems: "center", fontSize: 20, fontWeight: 700 }}>{(m.name || m.email || "?")[0].toUpperCase()}</div>
              )}
              <div style={{ position: "absolute", bottom: -2, right: -2, width: 14, height: 14, borderRadius: 7, background: isOnline ? "#2E9E6B" : t.faint, border: `2px solid ${t.page}` }} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: t.text, display: "flex", alignItems: "center", gap: 6 }}>
                {m.name || "(ไม่มีชื่อ)"}
                {m.role === "admin" && <span style={{ fontSize: 9.5, fontWeight: 800, color: t.accent, background: `${t.accent}18`, padding: "1px 6px", borderRadius: 8 }}>ADMIN</span>}
              </div>
              <div style={{ fontSize: 11.5, color: t.sub }}>{isOnline ? "🟢 ออนไลน์อยู่ตอนนี้" : "ออฟไลน์"}</div>
            </div>
          </div>
          <button onClick={close} style={ghost}><X size={20} color={t.sub} /></button>
        </div>

        <div style={{ fontSize: 11.5, fontWeight: 800, color: t.faint, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>ข้อมูลบัญชี</div>
        <Row label="เข้าสู่ระบบด้วย"><span style={{ fontSize: 12.5, color: t.text, fontWeight: 600 }}>{m.login_type === "pin" ? `ชื่อผู้ใช้: ${m.username}` : m.email}</span></Row>
        <Row label="สมัครเมื่อ"><span style={{ fontSize: 12.5, color: t.text }}>{m.created_at ? new Date(m.created_at).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }) : "-"}</span></Row>
        <Row label="ล็อกอินล่าสุด"><span style={{ fontSize: 12.5, color: t.text }}>{m.last_login ? new Date(m.last_login).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }) : "ยังไม่เคย"}</span></Row>
        <Row label="ออนไลน์ล่าสุด"><span style={{ fontSize: 12.5, color: t.text }}>{m.last_seen ? new Date(m.last_seen).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }) : "ยังไม่เคย"}</span></Row>

        <div style={{ fontSize: 11.5, fontWeight: 800, color: t.faint, textTransform: "uppercase", letterSpacing: 0.5, margin: "18px 0 4px" }}>สถานะ</div>
        <Row label="การอนุมัติ">
          <button onClick={() => setApproved(m.id, !m.approved, m.email, m.name)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 10, border: `1px solid ${m.approved ? "#2E9E6B" : "#D9534F"}`, cursor: "pointer", background: m.approved ? "#2E9E6B18" : "#D9534F18", color: m.approved ? "#2E9E6B" : "#D9534F", fontSize: 12, fontWeight: 700 }}>
            {m.approved ? <UserCheck size={13} /> : <UserX size={13} />} {m.approved ? "อนุมัติแล้ว" : "รออนุมัติ (กดเพื่ออนุมัติ)"}
          </button>
        </Row>
        {!isSelf && (
          <Row label="สิทธิ์แอดมิน">
            <button onClick={() => setRole(m.id, m.role === "admin" ? "member" : "admin")} style={{ padding: "6px 12px", borderRadius: 10, border: `1px solid ${t.border}`, cursor: "pointer", background: "none", color: t.sub, fontSize: 12, fontWeight: 700 }}>{m.role === "admin" ? "ถอดสิทธิ์แอดมิน" : "ตั้งเป็นแอดมิน"}</button>
          </Row>
        )}
        <Row label="AI พรีเมียม (Gemini จ่ายเงิน/DeepSeek)">
          <button onClick={() => setPremiumAi(m.id, !m.premium_ai)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 10, border: `1px solid ${m.premium_ai ? "#2E9E6B" : t.border}`, cursor: "pointer", background: m.premium_ai ? "#2E9E6B18" : "none", color: m.premium_ai ? "#2E9E6B" : t.sub, fontSize: 12, fontWeight: 700 }}>{m.premium_ai ? "เปิดอยู่" : "ปิดอยู่ (กดเพื่อเปิด)"}</button>
        </Row>
        <Row label="เข้าร่วมห้องคัดสรร (R/E/F)">
          <button onClick={() => setCanUseSorting(m.id, !m.can_use_sorting)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 10, border: `1px solid ${m.can_use_sorting ? "#2E9E6B" : t.border}`, cursor: "pointer", background: m.can_use_sorting ? "#2E9E6B18" : "none", color: m.can_use_sorting ? "#2E9E6B" : t.sub, fontSize: 12, fontWeight: 700 }}>{m.can_use_sorting ? "เปิดอยู่" : "ปิดอยู่ (กดเพื่อเปิด)"}</button>
        </Row>
        {m.sorted_group && <Row label="กลุ่มที่คัดสรรแล้ว"><span style={{ fontSize: 12.5, fontWeight: 700, color: t.text }}>{{ reason: "🧠 Reason", emotion: "❤️ Emotion", force: "✊ Force" }[m.sorted_group]}</span></Row>}
        {m.group_switch_request && (
          <Row label={`ขอสลับไป: ${{ reason: "🧠 Reason", emotion: "❤️ Emotion", force: "✊ Force" }[m.group_switch_request]}`}>
            <button onClick={() => approveSwitch(m.id)} style={{ padding: "6px 12px", borderRadius: 10, border: "none", background: "#2E9E6B", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>อนุมัติ</button>
          </Row>
        )}
        {!isSelf && m.role !== "admin" && (
          <Row label="ใช้งานเต็มรูปแบบ (ไม่เห็นหน้า Admin)">
            <button onClick={() => setRole(m.id, m.role === "trusted" ? "member" : "trusted")} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 10, border: `1px solid ${m.role === "trusted" ? "#2E9E6B" : t.border}`, cursor: "pointer", background: m.role === "trusted" ? "#2E9E6B18" : "none", color: m.role === "trusted" ? "#2E9E6B" : t.sub, fontSize: 12, fontWeight: 700 }}>{m.role === "trusted" ? "เปิดอยู่" : "ปิดอยู่ (กดเพื่อเปิด)"}</button>
          </Row>
        )}

        {m.role !== "admin" && (
          <>
            <div style={{ fontSize: 11.5, fontWeight: 800, color: t.faint, textTransform: "uppercase", letterSpacing: 0.5, margin: "18px 0 4px" }}>สิทธิ์การใช้งาน</div>
            <Row label="แชท">
              <button onClick={() => setCanChat(m.id, !m.can_chat)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 10, border: `1px solid ${m.can_chat ? "#2E9E6B" : t.border}`, cursor: "pointer", background: m.can_chat ? "#2E9E6B18" : "none", color: m.can_chat ? "#2E9E6B" : t.sub, fontSize: 12, fontWeight: 700 }}><MessageCircle size={13} /> {m.can_chat ? "เปิดใช้งานอยู่" : "ปิดอยู่ (กดเพื่อเปิด)"}</button>
            </Row>
            <Row label="ดูตำแหน่งคนอื่นได้">
              <button onClick={() => setCanViewLocations(m.id, !m.can_view_locations)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 10, border: `1px solid ${m.can_view_locations ? "#2E9E6B" : t.border}`, cursor: "pointer", background: m.can_view_locations ? "#2E9E6B18" : "none", color: m.can_view_locations ? "#2E9E6B" : t.sub, fontSize: 12, fontWeight: 700 }}><MapPin size={13} /> {m.can_view_locations ? "เปิดใช้งานอยู่" : "ปิดอยู่ (กดเพื่อเปิด)"}</button>
            </Row>
            <Row label="แชร์ตำแหน่งของตัวเอง (ที่เขาเปิดเอง)">
              <span style={{ fontSize: 11.5, fontWeight: 700, color: m.locationShared ? "#2E9E6B" : t.faint }}>{m.locationShared ? "🟢 เปิดอยู่" : "⚪ ยังไม่เปิด"}</span>
            </Row>
            <Row label="เปิดรับแจ้งเตือน (push)">
              <span style={{ fontSize: 11.5, fontWeight: 700, color: m.notifEnabled ? "#2E9E6B" : t.faint }}>{m.notifEnabled ? "🟢 เปิดอยู่" : "⚪ ยังไม่เปิด"}</span>
            </Row>
            {!m.notifEnabled && (
              <Row label="แจ้งเตือน (push)">
                <button onClick={() => remindNotification(m.id)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 10, border: `1px solid ${t.border}`, cursor: "pointer", background: "none", color: t.sub, fontSize: 12, fontWeight: 700 }}><Bell size={13} /> เตือนให้เปิดแจ้งเตือน</button>
              </Row>
            )}
            <Row label="สร้างโค้ชของตัวเองได้สูงสุด">
              <select value={m.mentor_limit ?? 0} onChange={(e) => setMentorLimit(m.id, +e.target.value)} style={selectStyle}>
                {[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n} คน</option>)}
              </select>
            </Row>
            <Row label="ล้างโค้ชที่สร้างไว้ทั้งหมด">
              <button onClick={() => resetMentorPick(m.id)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 10, border: `1px solid ${t.border}`, cursor: "pointer", background: "none", color: t.sub, fontSize: 12, fontWeight: 700 }}>ล้างทั้งหมด</button>
            </Row>
            <Row label="หมวดความสนใจสูงสุด">
              <select value={m.topic_limit ?? 3} onChange={(e) => setTopicLimit(m.id, +e.target.value)} style={selectStyle}>
                {Array.from({ length: 14 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} หมวด</option>)}
              </select>
            </Row>
            <Row label="บทความความรู้/วัน">
              <select value={m.daily_article_limit ?? 3} onChange={(e) => setDailyArticleLimit(m.id, +e.target.value)} style={selectStyle}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} บทความ</option>)}
              </select>
            </Row>
            <Row label="รีเฟรชบทความเองได้">
              <button onClick={() => setCanRefreshArticles(m.id, !m.can_refresh_articles)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 10, border: `1px solid ${m.can_refresh_articles ? "#2E9E6B" : t.border}`, cursor: "pointer", background: m.can_refresh_articles ? "#2E9E6B18" : "none", color: m.can_refresh_articles ? "#2E9E6B" : t.sub, fontSize: 12, fontWeight: 700 }}>{m.can_refresh_articles ? "เปิดอยู่" : "ปิดอยู่ (กดเพื่อเปิด)"}</button>
            </Row>
          </>
        )}

        {!isSelf && (
          <>
            <div style={{ fontSize: 11.5, fontWeight: 800, color: "#D9534F", textTransform: "uppercase", letterSpacing: 0.5, margin: "18px 0 8px" }}>โซนอันตราย</div>
            {confirmDelete ? (
              <button onClick={() => removeMember(m.id)} style={{ width: "100%", padding: "12px 0", borderRadius: 12, border: "none", cursor: "pointer", background: "#D9534F", color: "#fff", fontSize: 13, fontWeight: 700 }}>ยืนยันลบสมาชิกคนนี้? (กดอีกครั้งเพื่อลบจริง)</button>
            ) : (
              <button onClick={() => setConfirmDelete(true)} style={{ width: "100%", padding: "12px 0", borderRadius: 12, border: "1px solid #D9534F55", cursor: "pointer", background: "none", color: "#D9534F", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Trash2 size={15} /> ลบสมาชิกคนนี้</button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function AnnouncementsAdmin({ t, userId }) {
  const [list, setList] = useState([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(20);
    setList(data || []);
  };
  useEffect(() => { load(); }, []);

  const post = async () => {
    if (!msg.trim()) return;
    setBusy(true);
    await supabase.from("announcements").insert({ message: msg.trim(), created_by: userId, active: true });
    setMsg(""); await load(); setBusy(false);
  };
  const toggleActive = async (a) => { await supabase.from("announcements").update({ active: !a.active }).eq("id", a.id); load(); };
  const del = async (id) => { await supabase.from("announcements").delete().eq("id", id); load(); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ ...card(t), padding: 16 }}>
        <div style={{ fontSize: 12.5, color: t.sub, marginBottom: 10 }}>โพสต์ประกาศใหม่ให้ทุกคนเห็นที่หน้า Home</div>
        <textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="เช่น วันนี้ปิดปรับปรุงระบบ 2 ทุ่ม..." rows={2} style={{ ...input(t), resize: "vertical", marginBottom: 10, fontFamily: "inherit" }} />
        <button onClick={post} disabled={busy || !msg.trim()} style={{ ...primaryBtn({ accent: t.accent, accent2: t.accent2, onAccent: t.onAccent }), width: "100%", padding: "11px 0", opacity: msg.trim() ? 1 : 0.5 }}>{busy ? "กำลังโพสต์..." : "โพสต์ประกาศ"}</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {list.length === 0 && <Empty t={t} text="ยังไม่มีประกาศ" />}
        {list.map((a) => (
          <div key={a.id} style={{ ...card(t), padding: 13, opacity: a.active ? 1 : 0.5 }}>
            <div style={{ fontSize: 13, color: t.text, lineHeight: 1.5 }}>{a.message}</div>
            <div style={{ fontSize: 10.5, color: t.faint, marginTop: 6 }}>{new Date(a.created_at).toLocaleString("th-TH")}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button onClick={() => toggleActive(a)} style={{ flex: 1, padding: "7px 0", borderRadius: 9, border: `1px solid ${t.border}`, background: "none", cursor: "pointer", color: t.sub, fontSize: 11.5, fontWeight: 700 }}>{a.active ? "ซ่อน" : "เปิดใช้อีกครั้ง"}</button>
              <button onClick={() => del(a.id)} style={ghost}><Trash2 size={14} color={t.faint} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminAddPinMember({ t, session, onCreated }) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const submit = async () => {
    setErr(""); setOk("");
    if (!name.trim() || !username.trim() || !pin) { setErr("กรอกให้ครบทุกช่อง"); return; }
    setLoading(true);
    try {
      const r = await fetch("/api/admin-create-user", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, pin, callerToken: session?.access_token }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "สร้างบัญชีไม่สำเร็จ");
      setOk(`สร้างบัญชีให้ "${name}" สำเร็จ — บอกชื่อผู้ใช้ "${username}" กับ PIN นี้ให้เขาได้เลย`);
      setName(""); setUsername(""); setPin("");
      onCreated?.();
    } catch (e) {
      setErr(e.message);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ ...card(t), padding: 16 }}>
      <div style={{ fontSize: 12.5, color: t.sub, marginBottom: 12, lineHeight: 1.6 }}>สำหรับผู้ใหญ่ที่ไม่ถนัดใช้อีเมล — สร้างบัญชีให้ตรงๆ ด้วยชื่อ + PIN แล้วบอกให้เขาไปกรอกที่หน้าล็อกอิน (แท็บ "ด้วยชื่อ + PIN")</div>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อที่แสดงในแอป เช่น แม่" style={{ ...input(t), marginBottom: 10 }} />
      <input value={username} onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))} placeholder="ชื่อผู้ใช้ (ภาษาอังกฤษ) เช่น mom" style={{ ...input(t), marginBottom: 10 }} />
      <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="PIN 4-6 หลัก" inputMode="numeric" style={{ ...input(t), marginBottom: 14, letterSpacing: 3 }} />
      {err && <div style={{ fontSize: 12, color: "#D9534F", marginBottom: 10 }}>{err}</div>}
      {ok && <div style={{ fontSize: 12, color: "#2E9E6B", marginBottom: 10 }}>{ok}</div>}
      <button onClick={submit} disabled={loading} style={{ ...primaryBtn({ accent: t.accent, accent2: t.accent2, onAccent: t.onAccent }), width: "100%", padding: "12px 0" }}>{loading ? "กำลังสร้าง..." : "สร้างบัญชี"}</button>
    </div>
  );
}

const AVATAR_COLORS = ["#C0658C", "#5C7A99", "#7B6CB0", "#4FB286", "#E0507B", "#3DA5D9", "#B07A4B"];
const colorFor = (str) => AVATAR_COLORS[[...(str || "?")].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];

// 🌐 Community — Passport เป็นหน้าหลัก (สอบแล้ว/แอดมิน เห็น Passport ตัวเองทันที ไม่ต้องกดผ่านหลายชั้นแบบเดิม)
function CommunityEntryView({ t, userId, authProfile, session, openThread }) {
  const isAdmin = authProfile?.role === "admin";
  const isSorted = isAdmin || !!authProfile?.sorted_group;
  const [showQuiz, setShowQuiz] = useState(false);
  const [showMyPassport, setShowMyPassport] = useState(isSorted); // เปิด Passport ตัวเองทันทีถ้าสอบแล้ว/แอดมิน
  const [showGlobal, setShowGlobal] = useState(false);

  if (!isSorted) {
    return (
      <div style={{ textAlign: "center", padding: "30px 10px" }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>🛂✨</div>
        <div style={{ fontSize: 15, fontWeight: 800, color: t.text, marginBottom: 6 }}>ยังไม่มี Passport ของคุณ</div>
        <div style={{ fontSize: 12.5, color: t.sub, marginBottom: 20, lineHeight: 1.7 }}>ทำแบบทดสอบสั้นๆ เพื่อสร้าง Passport และเข้าร่วมชุมชน R-E-F</div>
        <button onClick={() => setShowQuiz(true)} style={{ ...primaryBtn({ accent: t.accent, accent2: t.accent2, onAccent: t.onAccent }), padding: "12px 24px" }}>เริ่มทำแบบทดสอบ</button>
        {showQuiz && <SortingQuizModal t={t} userId={userId} authProfile={authProfile} session={session} openThread={openThread} close={() => setShowQuiz(false)} />}
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", padding: "20px 10px" }}>
      <div style={{ fontSize: 13, color: t.sub, marginBottom: 16 }}>Passport ของคุณคือหน้าตัวตนในชุมชน R-E-F</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 280, margin: "0 auto" }}>
        <button onClick={() => setShowMyPassport(true)} style={{ ...primaryBtn({ accent: t.accent, accent2: t.accent2, onAccent: t.onAccent }), padding: "13px 0" }}>🛂 เปิด Passport ของฉัน</button>
        <button onClick={() => setShowGlobal(true)} style={{ padding: "13px 0", borderRadius: 14, border: `1px solid ${t.border}`, background: "none", color: t.text, cursor: "pointer", fontSize: 13.5, fontWeight: 700 }}>🌐 ไปที่ Global (ดูทุกกลุ่ม + ห้องคัดสรร)</button>
      </div>
      {showMyPassport && <Hi5ProfileModal t={t} profileId={userId} userId={userId} authProfile={authProfile} session={session} openThread={openThread} close={() => setShowMyPassport(false)} />}
      {showGlobal && <SortingQuizModal t={t} userId={userId} authProfile={authProfile} session={session} openThread={openThread} close={() => setShowGlobal(false)} />}
    </div>
  );
}

function ChatEntryPage({ t, M, userId, authProfile, session, openThread }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState(null); // null | "menu" | "create" | "join" | "direct"
  const [showSorting, setShowSorting] = useState(false);
  const [chatMode, setChatMode] = useState("normal"); // normal | community
  const [showMyPassport, setShowMyPassport] = useState(false);
  const [friendCode, setFriendCode] = useState("");
  const [roomName, setRoomName] = useState("");
  const [roomAvatar, setRoomAvatar] = useState(null); // dataURL preview
  const [roomAvatarFile, setRoomAvatarFile] = useState(null);
  const [joinCode, setJoinCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const avatarFileRef = useRef(null);

  const loadRooms = async () => {
    setLoading(true);
    try {
      const { data: mine } = await supabase.from("chat_thread_members").select("thread_id").eq("user_id", userId);
      const threadIds = (mine || []).map((m) => m.thread_id);
      if (!threadIds.length) { setRooms([]); setLoading(false); return; }
      const { data: threads } = await supabase.from("chat_threads").select("*").in("id", threadIds);
      const { data: allMembers } = await supabase.from("chat_thread_members").select("thread_id, user_id").in("thread_id", threadIds);
      const otherIds = [...new Set((allMembers || []).filter((m) => m.user_id !== userId).map((m) => m.user_id))];
      const { data: otherProfiles } = otherIds.length ? await supabase.from("profiles").select("id, name, avatar_url").in("id", otherIds) : { data: [] };
      const { data: reads } = await supabase.from("chat_reads").select("thread_id, last_read_at").eq("user_id", userId);
      const readMap = Object.fromEntries((reads || []).map((r) => [r.thread_id, r.last_read_at]));
      const unreadCounts = {};
      await Promise.all(threadIds.map(async (tid) => {
        const since = readMap[tid] || "1970-01-01T00:00:00Z";
        const { count } = await supabase.from("chat_messages").select("id", { count: "exact", head: true }).eq("thread_id", tid).gt("created_at", since).neq("sender_id", userId);
        unreadCounts[tid] = count || 0;
      }));

      const list = (threads || []).map((th) => {
        if (th.type === "direct") {
          const otherUserId = (allMembers || []).find((m) => m.thread_id === th.id && m.user_id !== userId)?.user_id;
          const otherProfile = (otherProfiles || []).find((p) => p.id === otherUserId);
          return { id: th.id, name: otherProfile?.name || "เพื่อน", type: "direct", avatarUrl: otherProfile?.avatar_url || null, unread: unreadCounts[th.id] || 0 };
        }
        return { id: th.id, name: th.name || "ห้องแชท", type: "group", avatarUrl: th.avatar_url, joinCode: th.created_by === userId ? th.join_code : null, createdBy: th.created_by, unread: unreadCounts[th.id] || 0 };
      });
      setRooms(list);
    } catch (e) {} finally { setLoading(false); }
  };
  const hasFullAccess = authProfile?.role === "admin" || authProfile?.role === "trusted";
  useEffect(() => { if (authProfile?.can_chat || hasFullAccess) loadRooms(); }, [authProfile?.can_chat, hasFullAccess]);
  // 🔴 อัปเดตจุดแดงแบบสด ทั้งตอนมีข้อความใหม่เข้ามา และตอนอ่านแล้ว (ไม่ต้องรอรีเฟรช)
  useEffect(() => {
    if (!authProfile?.can_chat && !hasFullAccess) return;
    const channel = supabase.channel("room-list-unread-watch")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, loadRooms)
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_reads", filter: `user_id=eq.${userId}` }, loadRooms)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [authProfile?.can_chat, hasFullAccess, userId]);

  const closeSheet = () => { setSheet(null); setErr(""); setFriendCode(""); setJoinCode(""); setRoomName(""); setRoomAvatar(null); setRoomAvatarFile(null); setCreatedRoom(null); };

  const pickAvatar = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    setRoomAvatarFile(f);
    const rd = new FileReader(); rd.onload = () => setRoomAvatar(rd.result); rd.readAsDataURL(f);
  };

  const submitDirectCode = async () => {
    setErr("");
    if (!friendCode.trim()) { setErr("กรอกโค้ดก่อน"); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/chat-room", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "start_direct", friendCode, callerToken: session?.access_token }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      await loadRooms();
      closeSheet();
      openThread(data.threadId, data.friendName, false);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  const [createdRoom, setCreatedRoom] = useState(null); // { threadId, name, avatarUrl, joinCode } ห้องที่เพิ่งสร้างเสร็จ รอโชว์โค้ด
  const [copiedFlag, setCopiedFlag] = useState(""); // ชื่อ field ที่เพิ่งกด copy (โชว์ "คัดลอกแล้ว" ชั่วคราว)
  const copyText = (text, flag) => {
    navigator.clipboard?.writeText(text).then(() => { setCopiedFlag(flag); setTimeout(() => setCopiedFlag(""), 1500); });
  };

  const submitCreateRoom = async () => {
    setErr("");
    if (!roomName.trim()) { setErr("ตั้งชื่อห้องก่อน"); return; }
    setBusy(true);
    try {
      let avatarUrl = null;
      if (roomAvatarFile) {
        const path = `${userId}/room-${uid()}-${roomAvatarFile.name}`;
        const { error: upErr } = await supabase.storage.from("attachments").upload(path, roomAvatarFile);
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("attachments").getPublicUrl(path);
        avatarUrl = data.publicUrl;
      }
      const r = await fetch("/api/chat-room", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create", name: roomName, avatarUrl, callerToken: session?.access_token }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      await loadRooms();
      setCreatedRoom({ threadId: data.threadId, name: data.name, avatarUrl: data.avatarUrl, joinCode: data.joinCode });
      setSheet("created");
      setRoomName(""); setRoomAvatar(null); setRoomAvatarFile(null);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  const submitJoinRoom = async () => {
    setErr("");
    if (!joinCode.trim()) { setErr("กรอกโค้ดห้องก่อน"); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/chat-room", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "join", joinCode, callerToken: session?.access_token }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      await loadRooms();
      closeSheet();
      openThread(data.threadId, data.name, true, data.avatarUrl);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  if (!authProfile?.can_chat && !hasFullAccess) {
    return (
      <>
        <PageHead t={t} title="แชท" sub="คุยกับคนในครอบครัว" icon={<MessageCircle size={20} color={t.accent} />} />
        <Empty t={t} text="คุณยังไม่ได้รับสิทธิ์ใช้งานแชท — ให้แอดมินเปิดสิทธิ์ให้ที่หน้า Admin ก่อนนะ" />
      </>
    );
  }

  return (
    <>
      <PageHead t={t} title="แชท" sub="สร้างห้องเองหรือแลกโค้ดกับเพื่อน" icon={<MessageCircle size={20} color={t.accent} />} />

      {authProfile?.can_use_sorting && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16, ...card(t), padding: 4 }}>
          <button onClick={() => setChatMode("normal")} style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "none", cursor: "pointer", background: chatMode === "normal" ? t.accent : "none", color: chatMode === "normal" ? t.onAccent : t.sub, fontSize: 12.5, fontWeight: 700 }}>💬 แชทปกติ</button>
          <button onClick={() => setChatMode("community")} style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "none", cursor: "pointer", background: chatMode === "community" ? "#8A5CF6" : "none", color: chatMode === "community" ? "#fff" : t.sub, fontSize: 12.5, fontWeight: 700 }}>🌐 Community</button>
        </div>
      )}

      {chatMode === "community" ? (
        <CommunityEntryView t={t} userId={userId} authProfile={authProfile} session={session} openThread={openThread} />
      ) : (
        <>
      {authProfile.chat_code && (
        <div style={{ ...card(t), padding: 12, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ fontSize: 11.5, color: t.sub }}>โค้ดส่วนตัวของคุณ (แชร์ให้เพื่อนเริ่มแชท 1-1)</div>
          <button onClick={() => copyText(authProfile.chat_code, "mycode")} style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: t.accent, letterSpacing: 2 }}>{authProfile.chat_code}</span>
            {copiedFlag === "mycode" ? <Check size={14} color="#2E9E6B" /> : <Copy size={14} color={t.faint} />}
          </button>
        </div>
      )}
      {loading ? <Empty t={t} text="กำลังโหลด..." /> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px 10px", justifyItems: "center" }}>
          {rooms.length === 0 && <div style={{ gridColumn: "1 / -1" }}><Empty t={t} text="ยังไม่มีห้องแชท กด + เพื่อสร้างห้องหรือเข้าร่วมห้องได้เลย" /></div>}
          {rooms.map((r) => (
            <div key={r.id} style={{ position: "relative" }}>
              <button onClick={() => openThread(r.id, r.name, r.type === "group", r.avatarUrl, r.createdBy)} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "center", width: "100%" }}>
                {r.avatarUrl ? (
                  <img src={r.avatarUrl} alt="" style={{ width: 64, height: 64, borderRadius: 18, objectFit: "cover" }} />
                ) : (
                  <div style={{ width: 64, height: 64, borderRadius: 18, background: colorFor(r.name), display: "grid", placeItems: "center", color: "#fff", fontSize: 20, fontWeight: 700 }}>{r.name[0]}</div>
                )}
                <div style={{ fontSize: 11, color: t.text, marginTop: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 70 }}>{r.name}</div>
              </button>
              {r.unread > 0 && (
                <div style={{ position: "absolute", top: -4, left: -2, minWidth: 18, height: 18, borderRadius: 9, background: "#D9534F", color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", border: `2px solid ${t.page}` }}>{r.unread > 9 ? "9+" : r.unread}</div>
              )}
              {r.joinCode && (
                <button onClick={(e) => { e.stopPropagation(); setCreatedRoom({ threadId: r.id, name: r.name, avatarUrl: r.avatarUrl, joinCode: r.joinCode }); setSheet("created"); }} style={{ position: "absolute", top: -2, right: 4, width: 22, height: 22, borderRadius: 11, background: t.surface, border: `1px solid ${t.border}`, cursor: "pointer", display: "grid", placeItems: "center" }} title="ดูโค้ดเชิญ">
                  <KeyRound size={11} color={t.sub} />
                </button>
              )}
            </div>
          ))}
          <button onClick={() => setSheet("menu")} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: "none", border: `1.5px dashed ${t.border}`, display: "grid", placeItems: "center", color: t.faint }}>
              <Plus size={24} />
            </div>
            <div style={{ fontSize: 11, color: t.sub, marginTop: 6 }}>เพิ่มห้อง</div>
          </button>
        </div>
      )}

      {sheet && (
        <ModalPortal>
          <div style={overlay} onClick={closeSheet}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "24px 24px 0 0", padding: 20 }}>

              {sheet === "menu" && (
                <>
                  <div style={{ fontSize: 16, fontWeight: 800, color: t.text, marginBottom: 14 }}>เพิ่มห้องแชท</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <button onClick={() => setSheet("create")} style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, border: `1px solid ${t.border}`, background: "none", cursor: "pointer", textAlign: "left" }}><Plus size={18} color={t.accent} /><div><div style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>สร้างห้องใหม่</div><div style={{ fontSize: 11, color: t.sub }}>ตั้งชื่อ+รูป แล้วชวนคนอื่นด้วยโค้ด</div></div></button>
                    <button onClick={() => setSheet("join")} style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, border: `1px solid ${t.border}`, background: "none", cursor: "pointer", textAlign: "left" }}><KeyRound size={18} color={t.accent} /><div><div style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>เข้าร่วมห้องด้วยโค้ด</div><div style={{ fontSize: 11, color: t.sub }}>มีโค้ดห้องจากคนอื่นแล้ว</div></div></button>
                    <button onClick={() => setSheet("direct")} style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, border: `1px solid ${t.border}`, background: "none", cursor: "pointer", textAlign: "left" }}><MessageCircle size={18} color={t.accent} /><div><div style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>เริ่มแชทส่วนตัว 1-1</div><div style={{ fontSize: 11, color: t.sub }}>แลกโค้ดส่วนตัวกับเพื่อน</div></div></button>
                    {authProfile?.can_use_sorting && (
                      <button onClick={() => { closeSheet(); setShowSorting(true); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, border: "1px solid #8A5CF655", background: "#8A5CF618", cursor: "pointer", textAlign: "left" }}>
                        <Sparkles size={18} color="#8A5CF6" />
                        <div><div style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>เข้าร่วมห้องคัดสรร</div><div style={{ fontSize: 11, color: t.sub }}>{authProfile?.sorted_group ? "ไปที่ห้องกลุ่มของคุณ" : "ทำแบบทดสอบ รู้ผลว่าคุณอยู่กลุ่มไหน"}</div></div>
                      </button>
                    )}
                  </div>
                </>
              )}

              {sheet === "create" && (
                <>
                  <div style={{ fontSize: 16, fontWeight: 800, color: t.text, marginBottom: 14 }}>สร้างห้องใหม่</div>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
                    <button onClick={() => avatarFileRef.current?.click()} style={{ width: 72, height: 72, borderRadius: 20, background: roomAvatar ? "none" : t.inputBg, border: `1.5px dashed ${t.border}`, cursor: "pointer", overflow: "hidden", display: "grid", placeItems: "center" }}>
                      {roomAvatar ? <img src={roomAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Upload size={20} color={t.faint} />}
                    </button>
                    <input ref={avatarFileRef} type="file" accept="image/*" onChange={pickAvatar} style={{ display: "none" }} />
                  </div>
                  <input value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="ชื่อห้อง เช่น ครอบครัว, เพื่อนสนิท" style={{ ...input(t), marginBottom: 10 }} />
                  {err && <div style={{ fontSize: 12, color: "#D9534F", marginBottom: 10 }}>{err}</div>}
                  <button onClick={submitCreateRoom} disabled={busy} style={{ ...primaryBtn({ accent: t.accent, accent2: t.accent2, onAccent: t.onAccent }), width: "100%", padding: "12px 0" }}>{busy ? "กำลังสร้าง..." : "สร้างห้อง"}</button>
                </>
              )}

              {sheet === "join" && (
                <>
                  <div style={{ fontSize: 16, fontWeight: 800, color: t.text, marginBottom: 14 }}>เข้าร่วมห้องด้วยโค้ด</div>
                  <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="กรอกโค้ดห้อง" style={{ ...input(t), marginBottom: 10, letterSpacing: 2, textTransform: "uppercase" }} />
                  {err && <div style={{ fontSize: 12, color: "#D9534F", marginBottom: 10 }}>{err}</div>}
                  <button onClick={submitJoinRoom} disabled={busy} style={{ ...primaryBtn({ accent: t.accent, accent2: t.accent2, onAccent: t.onAccent }), width: "100%", padding: "12px 0" }}>{busy ? "กำลังเข้าร่วม..." : "เข้าร่วมห้อง"}</button>
                </>
              )}

              {sheet === "direct" && (
                <>
                  <div style={{ fontSize: 16, fontWeight: 800, color: t.text, marginBottom: 14 }}>เริ่มแชทส่วนตัวด้วยโค้ด</div>
                  <input value={friendCode} onChange={(e) => setFriendCode(e.target.value.toUpperCase())} placeholder="กรอกโค้ดส่วนตัวของเพื่อน" style={{ ...input(t), marginBottom: 10, letterSpacing: 2, textTransform: "uppercase" }} />
                  {err && <div style={{ fontSize: 12, color: "#D9534F", marginBottom: 10 }}>{err}</div>}
                  <button onClick={submitDirectCode} disabled={busy} style={{ ...primaryBtn({ accent: t.accent, accent2: t.accent2, onAccent: t.onAccent }), width: "100%", padding: "12px 0" }}>{busy ? "กำลังเชื่อมต่อ..." : "เริ่มแชท"}</button>
                </>
              )}

              {sheet === "created" && createdRoom && (
                <>
                  <div style={{ fontSize: 16, fontWeight: 800, color: t.text, marginBottom: 4 }}>สร้างห้อง "{createdRoom.name}" สำเร็จ!</div>
                  <div style={{ fontSize: 12, color: t.sub, marginBottom: 16 }}>ส่งโค้ดนี้ให้คนที่อยากชวนเข้าห้อง แล้วให้เขากด "เข้าร่วมห้องด้วยโค้ด" ที่หน้าแชทของเขา</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 14, padding: "14px 16px", marginBottom: 16 }}>
                    <div style={{ flex: 1, fontSize: 22, fontWeight: 800, color: t.accent, letterSpacing: 3, textAlign: "center" }}>{createdRoom.joinCode}</div>
                    <button onClick={() => copyText(createdRoom.joinCode, "roomcode")} style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 10, border: `1px solid ${t.border}`, background: "none", cursor: "pointer", color: t.text, fontSize: 12, fontWeight: 700 }}>
                      {copiedFlag === "roomcode" ? <><Check size={14} color="#2E9E6B" /> คัดลอกแล้ว</> : <>คัดลอก</>}
                    </button>
                  </div>
                  <button onClick={() => { closeSheet(); openThread(createdRoom.threadId, createdRoom.name, true, createdRoom.avatarUrl); }} style={{ ...primaryBtn({ accent: t.accent, accent2: t.accent2, onAccent: t.onAccent }), width: "100%", padding: "12px 0" }}>เข้าห้องแชทเลย</button>
                </>
              )}
            </div>
          </div>
        </ModalPortal>
      )}
        </>
      )}
      {showSorting && <SortingQuizModal t={t} userId={userId} authProfile={authProfile} session={session} openThread={openThread} close={() => setShowSorting(false)} />}
    </>
  );
}


// 🏠 ระบบคัดสรรกลุ่ม R-E-F
const PROFILE_BG_OPTIONS = [
  { key: "sunset", grad: "linear-gradient(135deg,#F6A56B,#E0507B)" },
  { key: "ocean", grad: "linear-gradient(135deg,#4A90D9,#2E6FA8)" },
  { key: "forest", grad: "linear-gradient(135deg,#6FBF8B,#2E9E6B)" },
  { key: "purple", grad: "linear-gradient(135deg,#B080E0,#7A5CC9)" },
  { key: "gold", grad: "linear-gradient(135deg,#F0C368,#E0A030)" },
  { key: "night", grad: "linear-gradient(135deg,#4A5578,#26304A)" },
  { key: "cherry", grad: "linear-gradient(135deg,#F5A3B8,#D9536F)" },
  { key: "mint", grad: "linear-gradient(135deg,#9DE0C8,#4FB88F)" },
  { key: "coral", grad: "linear-gradient(135deg,#FF9E80,#F4511E)" },
  { key: "sky", grad: "linear-gradient(135deg,#A8D8F0,#5CA9DB)" },
  { key: "rosegold", grad: "linear-gradient(135deg,#F0C4B8,#D98E7C)" },
  { key: "galaxy", grad: "linear-gradient(135deg,#2B2159,#7A4FBF,#D976A8)" },
];
const bgGradient = (key) => PROFILE_BG_OPTIONS.find((b) => b.key === key)?.grad || PROFILE_BG_OPTIONS[0].grad;

const GROUP_META = {
  reason: { label: "Reason", emoji: "🧠", color: "#4A90D9", threadId: "00000000-0000-0000-0000-0000000000f1", desc: "นักคิด วางแผน ใช้เหตุผลนำอารมณ์" },
  emotion: { label: "Emotion", emoji: "❤️", color: "#E0507B", threadId: "00000000-0000-0000-0000-0000000000f2", desc: "นักรู้สึก ใส่ใจความสัมพันธ์ ตัดสินใจด้วยหัวใจ" },
  force: { label: "Force", emoji: "✊", color: "#E0A030", threadId: "00000000-0000-0000-0000-0000000000f3", desc: "นักลงมือทำ พลังงานสูง ไม่ชอบคิดนาน" },
};
const QUIZ_QUESTIONS = [
  { q: "มีเวลาว่างทั้งวันแบบไม่ได้วางแผนอะไรเลย คุณจะ...", options: [
    { text: "คิดว่าจะทำอะไรให้คุ้มค่าที่สุดก่อน", g: "reason" }, { text: "ทำตามอารมณ์ตอนนั้นเลย", g: "emotion" }, { text: "ลุกไปทำอะไรสักอย่างทันที", g: "force" },
  ]},
  { q: "เจอปัญหาใหญ่ในงาน สิ่งแรกที่คุณทำคือ...", options: [
    { text: "วิเคราะห์หาสาเหตุก่อน", g: "reason" }, { text: "ถามความรู้สึกคนในทีมก่อน", g: "emotion" }, { text: "ลงมือแก้เลยแล้วปรับหน้างาน", g: "force" },
  ]},
  { q: "ทะเลาะกับเพื่อนสนิท คุณมักจะ...", options: [
    { text: "ขอเวลาคิดทบทวนเหตุผลทั้ง 2 ฝ่ายก่อน", g: "reason" }, { text: "อยากคุยกันตรงๆ ให้เข้าใจความรู้สึกกัน", g: "emotion" }, { text: "หาทางแก้ปัญหาให้จบเร็วที่สุด", g: "force" },
  ]},
  { q: "ได้รับข่าวไม่ดีกะทันหัน คุณจะ...", options: [
    { text: "ตั้งสติ ประเมินสถานการณ์ก่อน", g: "reason" }, { text: "ต้องการใครสักคนอยู่ด้วย", g: "emotion" }, { text: "หาทางจัดการทันที", g: "force" },
  ]},
  { q: "ดูหนังจบเรื่องหนึ่ง คุณมักจะ...", options: [
    { text: "วิเคราะห์โครงเรื่อง/เหตุผลตัวละคร", g: "reason" }, { text: "อินไปกับความรู้สึกตัวละครหลัก", g: "emotion" }, { text: "อยากลุกไปทำอะไรต่อทันที", g: "force" },
  ]},
  { q: "เพื่อนชวนลองของใหม่ที่ไม่เคยทำมาก่อน คุณจะ...", options: [
    { text: "ขอศึกษาข้อมูลก่อนตัดสินใจ", g: "reason" }, { text: "ถ้ารู้สึกสนุกก็ลองเลย", g: "emotion" }, { text: "ตอบตกลงทันทีไม่ต้องคิดเยอะ", g: "force" },
  ]},
];

function SortingQuizModal({ t, userId, authProfile, session, openThread, close }) {
  const isAdmin = authProfile?.role === "admin";
  const [step, setStep] = useState(isAdmin || authProfile?.sorted_group ? "hub" : "intro"); // intro | quiz | tie | reveal | hub
  const [qIdx, setQIdx] = useState(0);
  const [scores, setScores] = useState({ reason: 0, emotion: 0, force: 0 });
  const [tiedGroups, setTiedGroups] = useState([]);
  const [resultGroup, setResultGroup] = useState(authProfile?.sorted_group || null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [switchTarget, setSwitchTarget] = useState(null);
  const [houses, setHouses] = useState(null); // {reason:{name,avatarUrl}, emotion:{...}, force:{...}}
  const [showMembers, setShowMembers] = useState(false);
  const fileRef = useRef(null);
  const [uploadingFor, setUploadingFor] = useState(null);

  // 👑 แอดมิน: เข้าได้ทั้ง 3 ห้องอัตโนมัติ ไม่ต้องทำแบบทดสอบ
  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/chat-room", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "admin_join_all", callerToken: session?.access_token }) })
      .then((r) => r.json()).then((d) => { if (d.error) console.error("เข้าห้องคัดสรรอัตโนมัติไม่สำเร็จ:", d.error); });
  }, [isAdmin]);

  // ดึงชื่อ/รูปของ 3 ห้องมาโชว์
  useEffect(() => {
    if (step !== "hub") return;
    const ids = Object.values(GROUP_META).map((g) => g.threadId);
    supabase.from("chat_threads").select("id, name, avatar_url").in("id", ids).then(({ data, error }) => {
      if (error) { console.error("โหลดข้อมูลห้องคัดสรรไม่สำเร็จ:", error.message); return; }
      const map = {};
      Object.entries(GROUP_META).forEach(([key, meta]) => {
        const row = data?.find((d) => d.id === meta.threadId);
        map[key] = { name: row?.name || `${meta.emoji} ${meta.label}`, avatarUrl: row?.avatar_url || null };
      });
      setHouses(map);
    });
  }, [step]);

  const uploadHouseImage = async (e, groupKey) => {
    const f = e.target.files?.[0]; if (!f) return;
    e.target.value = "";
    setUploadingFor(groupKey);
    try {
      const path = `sorting-houses/${groupKey}-${uid()}.jpg`;
      const { error: upErr } = await supabase.storage.from("attachments").upload(path, f);
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("attachments").getPublicUrl(path);
      await supabase.from("chat_threads").update({ avatar_url: data.publicUrl }).eq("id", GROUP_META[groupKey].threadId);
      setHouses((h) => ({ ...h, [groupKey]: { ...h[groupKey], avatarUrl: data.publicUrl } }));
    } catch (e2) { alert("เปลี่ยนรูปไม่สำเร็จ: " + e2.message); } finally { setUploadingFor(null); }
  };

  const answer = (g) => {
    const next = { ...scores, [g]: scores[g] + 1 };
    setScores(next);
    if (qIdx + 1 < QUIZ_QUESTIONS.length) { setQIdx(qIdx + 1); return; }
    // ตอบครบแล้ว -> หาผู้ชนะ เช็คว่าเสมอกันไหม
    const max = Math.max(...Object.values(next));
    const winners = Object.entries(next).filter(([, v]) => v === max).map(([k]) => k);
    if (winners.length > 1) { setTiedGroups(winners); setStep("tie"); }
    else { finalize(winners[0]); }
  };

  const finalize = async (group) => {
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/chat-room", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "sort", group, callerToken: session?.access_token }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setResultGroup(group);
      setStep("reveal");
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  const requestSwitch = async () => {
    if (!switchTarget) return;
    setBusy(true);
    try {
      const r = await fetch("/api/chat-room", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "request_switch", group: switchTarget, callerToken: session?.access_token }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setErr(""); alert("ส่งคำขอสลับกลุ่มแล้ว รอแอดมินอนุมัติ");
      setSwitchTarget(null);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <ModalPortal>
      <div style={overlay} onClick={step === "quiz" ? undefined : close}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "24px 24px 0 0", padding: 24, maxHeight: "85vh", overflowY: "auto" }}>
          {step === "intro" && (
            <>
              <div style={{ fontSize: 18, fontWeight: 800, color: t.text, marginBottom: 8 }}>✨ ห้องคัดสรร</div>
              <div style={{ fontSize: 13, color: t.sub, lineHeight: 1.7, marginBottom: 20 }}>ตอบคำถาม 6 ข้อสั้นๆ เพื่อดูว่าคุณเข้ากับกลุ่มไหน แล้วจะได้เข้าร่วมชุมชนของกลุ่มนั้นถาวร ไม่ต้องคิดนาน ตอบตามสัญชาตญาณได้เลย</div>
              <button onClick={() => setStep("quiz")} style={{ ...primaryBtn({ accent: t.accent, accent2: t.accent2, onAccent: t.onAccent }), width: "100%", padding: "13px 0" }}>เริ่มทำแบบทดสอบ</button>
            </>
          )}

          {step === "quiz" && (
            <>
              <div style={{ fontSize: 11, color: t.faint, marginBottom: 6 }}>ข้อ {qIdx + 1}/{QUIZ_QUESTIONS.length}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: t.text, marginBottom: 18, lineHeight: 1.5 }}>{QUIZ_QUESTIONS[qIdx].q}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {QUIZ_QUESTIONS[qIdx].options.map((opt, i) => (
                  <button key={i} onClick={() => answer(opt.g)} style={{ padding: 16, borderRadius: 14, border: `1px solid ${t.border}`, background: t.surface, cursor: "pointer", textAlign: "left", fontSize: 13.5, color: t.text }}>{opt.text}</button>
                ))}
              </div>
            </>
          )}

          {step === "tie" && (
            <>
              <div style={{ fontSize: 16, fontWeight: 800, color: t.text, marginBottom: 6 }}>คะแนนสูสีมาก! 🤔</div>
              <div style={{ fontSize: 12.5, color: t.sub, marginBottom: 18 }}>คุณเข้าได้ทั้ง 2 กลุ่มนี้พอๆ กัน เลือกกลุ่มที่รู้สึกตรงกับตัวเองที่สุด</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {tiedGroups.map((g) => (
                  <button key={g} onClick={() => finalize(g)} disabled={busy} style={{ padding: 16, borderRadius: 14, border: `2px solid ${GROUP_META[g].color}`, background: `${GROUP_META[g].color}18`, cursor: "pointer", textAlign: "left" }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>{GROUP_META[g].emoji} {GROUP_META[g].label}</div>
                    <div style={{ fontSize: 11.5, color: t.sub, marginTop: 2 }}>{GROUP_META[g].desc}</div>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === "reveal" && resultGroup && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 13, color: t.sub, marginBottom: 16 }}>คุณถูกคัดสรรเข้ากลุ่ม...</div>
              <div style={{ fontSize: 56, marginBottom: 10, animation: "rh-pop .5s ease" }}>{GROUP_META[resultGroup].emoji}</div>
              <style>{`@keyframes rh-pop { 0% { transform: scale(0); opacity:0; } 60% { transform: scale(1.15); opacity:1; } 100% { transform: scale(1); } }`}</style>
              <div style={{ fontSize: 24, fontWeight: 800, color: GROUP_META[resultGroup].color, marginBottom: 8 }}>{GROUP_META[resultGroup].label}</div>
              <div style={{ fontSize: 13, color: t.sub, marginBottom: 24 }}>{GROUP_META[resultGroup].desc}</div>
              <button onClick={() => setStep("hub")} style={{ ...primaryBtn({ accent: t.accent, accent2: t.accent2, onAccent: t.onAccent }), width: "100%", padding: "13px 0" }}>ดูห้องคัดสรรทั้งหมด</button>
            </div>
          )}

          {step === "hub" && (
            <>
              <div style={{ fontSize: 17, fontWeight: 800, color: t.text, marginBottom: 4 }}>{isAdmin ? "🏠 จัดการห้องคัดสรร" : "🏠 ห้องคัดสรร"}</div>
              <div style={{ fontSize: 12, color: t.sub, marginBottom: 16 }}>{isAdmin ? "แอดมินเข้าได้ทุกห้อง จัดการรูปภาพได้เต็มที่" : "ชุมชนของคุณ"}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {Object.entries(GROUP_META).map(([key, meta]) => {
                  const house = houses?.[key];
                  const isMine = resultGroup === key;
                  const canEnter = isAdmin || isMine;
                  return (
                    <div key={key} style={{ borderRadius: 20, overflow: "hidden", border: `2px solid ${isMine ? meta.color : t.border}`, position: "relative" }}>
                      <div onClick={() => canEnter && (close(), openThread(meta.threadId, house?.name || `${meta.emoji} ${meta.label}`, true, house?.avatarUrl || null))}
                        style={{ height: 110, background: house?.avatarUrl ? `url(${house.avatarUrl}) center/cover` : `linear-gradient(135deg, ${meta.color}55, ${meta.color}22)`, display: "flex", alignItems: "flex-end", padding: 14, cursor: canEnter ? "pointer" : "default", position: "relative" }}>
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.55), transparent)" }} />
                        <div style={{ position: "relative", color: "#fff" }}>
                          <div style={{ fontSize: 16, fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}>{meta.emoji} {meta.label} {isMine && <span style={{ fontSize: 9, fontWeight: 800, background: meta.color, padding: "2px 7px", borderRadius: 8 }}>ของคุณ</span>}</div>
                          <div style={{ fontSize: 10.5, opacity: .85 }}>{meta.desc}</div>
                        </div>
                        {isAdmin && (
                          <button onClick={(e) => { e.stopPropagation(); setUploadingFor(key); fileRef.current?.click(); }} style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,.4)", border: "none", borderRadius: 14, width: 30, height: 30, cursor: "pointer", display: "grid", placeItems: "center" }} title="เปลี่ยนรูปห้องนี้">
                            {uploadingFor === key ? <span style={{ fontSize: 10, color: "#fff" }}>...</span> : <Camera size={14} color="#fff" />}
                          </button>
                        )}
                      </div>
                      {!canEnter && <div style={{ padding: "8px 14px", fontSize: 11, color: t.faint, background: t.surface }}>🔒 ดูได้เฉพาะสมาชิกกลุ่มนี้</div>}
                    </div>
                  );
                })}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={(e) => uploadHouseImage(e, uploadingFor)} style={{ display: "none" }} />

              <button onClick={() => setShowMembers(true)} style={{ width: "100%", marginTop: 16, padding: 14, borderRadius: 14, border: `1.5px dashed ${t.border}`, background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: t.sub, fontSize: 13, fontWeight: 700 }}>
                <Users size={16} /> ดูสมาชิกทุกกลุ่ม + พาสปอร์ต
              </button>
              {showMembers && <SortingMembersModal t={t} userId={userId} authProfile={authProfile} session={session} openThread={openThread} close={() => setShowMembers(false)} />}

              {!isAdmin && resultGroup && (
                <div style={{ marginTop: 20 }}>
                  {authProfile?.group_switch_request ? (
                    <div style={{ fontSize: 11.5, color: t.faint, textAlign: "center" }}>คำขอสลับไป {GROUP_META[authProfile.group_switch_request]?.label} กำลังรอแอดมินอนุมัติ</div>
                  ) : (
                    <>
                      <div style={{ fontSize: 12, color: t.sub, marginBottom: 8, textAlign: "center" }}>รู้สึกไม่ตรงกับกลุ่มนี้? ขอสลับได้ (ต้องรอแอดมินอนุมัติ)</div>
                      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        {Object.keys(GROUP_META).filter((g) => g !== resultGroup).map((g) => (
                          <button key={g} onClick={() => setSwitchTarget(g)} style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: `1.5px solid ${switchTarget === g ? GROUP_META[g].color : t.border}`, background: switchTarget === g ? `${GROUP_META[g].color}18` : "none", cursor: "pointer", fontSize: 12, fontWeight: 700, color: t.text }}>{GROUP_META[g].emoji} {GROUP_META[g].label}</button>
                        ))}
                      </div>
                      {switchTarget && <button onClick={requestSwitch} disabled={busy} style={{ width: "100%", padding: "9px 0", borderRadius: 10, border: "none", background: "#D9534F", color: "#fff", cursor: "pointer", fontSize: 12.5, fontWeight: 700 }}>ส่งคำขอสลับไป {GROUP_META[switchTarget].label}</button>}
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {err && <div style={{ fontSize: 12, color: "#D9534F", marginTop: 12, textAlign: "center" }}>{err}</div>}
        </div>
      </div>
    </ModalPortal>
  );
}

// 👥 รายชื่อสมาชิกทุกกลุ่มในห้องคัดสรร (ข้ามกลุ่มได้ ดูพาสปอร์ต+ทักแชทได้เท่านั้น เข้าห้องแชทกลุ่มอื่นไม่ได้)
function SortingMembersModal({ t, userId, authProfile, session, openThread, close }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingProfile, setViewingProfile] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: profs, error } = await supabase.from("profiles").select("id, name, avatar_url, sorted_group").not("sorted_group", "is", null);
      if (error) { console.error("โหลดสมาชิกห้องคัดสรรไม่สำเร็จ:", error.message); setLoading(false); return; }
      setMembers(profs || []);
      setLoading(false);
    })();
  }, []);

  const byGroup = (g) => members.filter((m) => m.sorted_group === g);

  return (
    <ModalPortal>
      <div style={overlay} onClick={close}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "24px 24px 0 0", padding: 20, maxHeight: "85vh", overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: t.text }}>สมาชิกห้องคัดสรรทั้งหมด</div>
            <button onClick={close} style={ghost}><X size={20} color={t.sub} /></button>
          </div>
          {loading && <Empty t={t} text="กำลังโหลด..." />}
          {!loading && Object.entries(GROUP_META).map(([key, meta]) => (
            <div key={key} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: meta.color, marginBottom: 8 }}>{meta.emoji} {meta.label} ({byGroup(key).length})</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {byGroup(key).map((m) => (
                  <button key={m.id} onClick={() => setViewingProfile(m.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", width: 64 }}>
                    {m.avatar_url ? <img src={m.avatar_url} alt="" style={{ width: 50, height: 50, borderRadius: 25, objectFit: "cover", border: `2px solid ${meta.color}` }} /> : <div style={{ width: 50, height: 50, borderRadius: 25, background: colorFor(m.name), color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, border: `2px solid ${meta.color}` }}>{m.name?.[0]}</div>}
                    <div style={{ fontSize: 10.5, color: t.text, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>{m.name}</div>
                  </button>
                ))}
                {byGroup(key).length === 0 && <div style={{ fontSize: 11.5, color: t.faint }}>ยังไม่มีใครในกลุ่มนี้</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
      {viewingProfile && <Hi5ProfileModal t={t} profileId={viewingProfile} userId={userId} authProfile={authProfile} session={session} openThread={openThread} close={() => setViewingProfile(null)} />}
    </ModalPortal>
  );
}

// 🛂 พาสปอร์ต — พื้นหลังแต่งเอง, เพลงประจำตัว, ป้ายทักษะ (ตราประทับ), มู้ดวันนี้, กระดานฝากข้อความ (ลายเซ็นผู้มาเยือน), ไลค์
function Hi5ProfileModal({ t, profileId, userId, authProfile, session, openThread, close }) {
  const isMe = profileId === userId;
  const [prof, setProf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testimonials, setTestimonials] = useState([]);
  const [reactionTypes, setReactionTypes] = useState([]);
  const [reactionCounts, setReactionCounts] = useState({});
  const [myReaction, setMyReaction] = useState(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [newMsg, setNewMsg] = useState("");
  const [editing, setEditing] = useState(false);
  const [myMedia, setMyMedia] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [msgBusy, setMsgBusy] = useState(false);
  const [msgErr, setMsgErr] = useState("");
  const bgPhotoRef = useRef(null);
  const [bgUploading, setBgUploading] = useState(false);
  const passportAvatarRef = useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const coverDragRef = useRef({ dragging: false, startY: 0, startPos: 50 });

  const uploadBgPhoto = async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    e.target.value = "";
    setBgUploading(true);
    try {
      const path = `passport-covers/${userId}-${uid()}.jpg`;
      const { error: upErr } = await supabase.storage.from("attachments").upload(path, f);
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("attachments").getPublicUrl(path);
      await supabase.from("profiles").update({ profile_bg_photo: data.publicUrl, profile_bg_photo_pos: "50%" }).eq("id", userId);
      setProf((p) => ({ ...p, profile_bg_photo: data.publicUrl, profile_bg_photo_pos: "50%" }));
    } catch (e2) { alert("อัปโหลดรูปปกไม่สำเร็จ: " + e2.message); } finally { setBgUploading(false); }
  };
  const clearBgPhoto = async () => { await supabase.from("profiles").update({ profile_bg_photo: null }).eq("id", userId); setProf((p) => ({ ...p, profile_bg_photo: null })); };

  // 🖱️ ลาก/เลื่อนปรับตำแหน่งรูปปกได้ (แบบ Facebook cover photo)
  const onCoverDragStart = (clientY) => { coverDragRef.current = { dragging: true, startY: clientY, startPos: parseInt(prof.profile_bg_photo_pos) || 50 }; };
  const onCoverDragMove = (clientY) => {
    if (!coverDragRef.current.dragging) return;
    const delta = clientY - coverDragRef.current.startY;
    const next = Math.max(0, Math.min(100, coverDragRef.current.startPos - delta / 2));
    setProf((p) => ({ ...p, profile_bg_photo_pos: `${Math.round(next)}%` }));
  };
  const onCoverDragEnd = async () => {
    if (!coverDragRef.current.dragging) return;
    coverDragRef.current.dragging = false;
    await supabase.from("profiles").update({ profile_bg_photo_pos: prof.profile_bg_photo_pos }).eq("id", userId);
  };

  // 📷 รูปโปรไฟล์เฉพาะ Passport (แยกจากรูปโปรไฟล์หลักของแอปได้ หรือจะใช้รูปเดียวกันก็ได้)
  const uploadPassportAvatar = async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    e.target.value = "";
    setAvatarUploading(true);
    try {
      const path = `passport-avatars/${userId}-${uid()}.jpg`;
      const { error: upErr } = await supabase.storage.from("attachments").upload(path, f);
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("attachments").getPublicUrl(path);
      await supabase.from("profiles").update({ passport_avatar_url: data.publicUrl, passport_use_main_avatar: false }).eq("id", userId);
      setProf((p) => ({ ...p, passport_avatar_url: data.publicUrl, passport_use_main_avatar: false }));
    } catch (e2) { alert("อัปโหลดรูปไม่สำเร็จ: " + e2.message); } finally { setAvatarUploading(false); }
  };
  const toggleUseMainAvatar = async (val) => {
    await supabase.from("profiles").update({ passport_use_main_avatar: val }).eq("id", userId);
    setProf((p) => ({ ...p, passport_use_main_avatar: val }));
  };

  const startChat = async () => {
    setMsgBusy(true); setMsgErr("");
    try {
      const r = await fetch("/api/chat-room", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "start_direct", targetUserId: profileId, callerToken: session?.access_token }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      openThread(data.threadId, data.friendName, false);
    } catch (e) { setMsgErr(e.message); } finally { setMsgBusy(false); }
  };

  const load = async () => {
    setLoading(true);
    const { data: p } = await supabase.from("profiles").select("*").eq("id", profileId).single();
    setProf(p);
    const { data: ts } = await supabase.from("profile_testimonials").select("*, author:author_id(name)").eq("owner_id", profileId).order("created_at", { ascending: false });
    if (ts) {
      const authorIds = [...new Set(ts.map((x) => x.author_id))];
      const { data: authors } = authorIds.length ? await supabase.from("profiles").select("id, name").in("id", authorIds) : { data: [] };
      setTestimonials(ts.map((x) => ({ ...x, authorName: authors?.find((a) => a.id === x.author_id)?.name || "ไม่ทราบชื่อ" })));
    }
    const { data: rt } = await supabase.from("reaction_types").select("*").order("sort_order", { ascending: true });
    setReactionTypes(rt || []);
    const { data: reactions } = await supabase.from("profile_likes").select("liker_id, reaction_type").eq("owner_id", profileId);
    const counts = {};
    (reactions || []).forEach((r) => { counts[r.reaction_type || "like"] = (counts[r.reaction_type || "like"] || 0) + 1; });
    setReactionCounts(counts);
    setMyReaction(reactions?.find((r) => r.liker_id === userId)?.reaction_type || null);
    if (!isMe) {
      const { data: muteRow } = await supabase.from("user_mutes").select("*").eq("muter_id", userId).eq("muted_id", profileId).maybeSingle();
      setIsMuted(!!muteRow);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, [profileId]);

  useEffect(() => {
    if (!isMe) return;
    supabase.from("playlists").select("id, name, url, platform, kind").eq("user_id", userId).then(({ data }) => setMyMedia(data || []));
  }, [isMe]);

  const setReaction = async (typeId) => {
    setShowReactionPicker(false);
    if (myReaction === typeId) {
      // กดซ้ำอันเดิม -> เอาออก
      await supabase.from("profile_likes").delete().eq("owner_id", profileId).eq("liker_id", userId);
      setReactionCounts((c) => ({ ...c, [typeId]: Math.max(0, (c[typeId] || 1) - 1) }));
      setMyReaction(null);
    } else {
      await supabase.from("profile_likes").upsert({ owner_id: profileId, liker_id: userId, reaction_type: typeId }, { onConflict: "owner_id,liker_id" });
      setReactionCounts((c) => {
        const next = { ...c };
        if (myReaction) next[myReaction] = Math.max(0, (next[myReaction] || 1) - 1);
        next[typeId] = (next[typeId] || 0) + 1;
        return next;
      });
      setMyReaction(typeId);
    }
  };
  const totalReactions = Object.values(reactionCounts).reduce((a, b) => a + b, 0);

  const toggleMute = async () => {
    if (isMuted) {
      await supabase.from("user_mutes").delete().eq("muter_id", userId).eq("muted_id", profileId);
      setIsMuted(false);
    } else {
      await supabase.from("user_mutes").insert({ muter_id: userId, muted_id: profileId });
      setIsMuted(true);
    }
  };

  const postTestimonial = async () => {
    if (!newMsg.trim()) return;
    const { error } = await supabase.from("profile_testimonials").insert({ owner_id: profileId, author_id: userId, text: newMsg.trim() });
    if (error) { alert("ฝากข้อความไม่สำเร็จ: " + error.message); return; }
    setNewMsg(""); load();
  };
  const deleteTestimonial = async (id) => { await supabase.from("profile_testimonials").delete().eq("id", id); load(); };

  const setBg = async (key) => { await supabase.from("profiles").update({ profile_bg: key }).eq("id", userId); setProf((p) => ({ ...p, profile_bg: key })); };
  const setSong = async (track) => {
    await supabase.from("profiles").update({ profile_song_name: track.name, profile_song_url: track.url, profile_song_platform: track.platform || "youtube" }).eq("id", userId);
    setProf((p) => ({ ...p, profile_song_name: track.name, profile_song_url: track.url, profile_song_platform: track.platform || "youtube" }));
  };
  const clearSong = async () => { await supabase.from("profiles").update({ profile_song_name: null, profile_song_url: null, profile_song_platform: null }).eq("id", userId); setProf((p) => ({ ...p, profile_song_name: null, profile_song_url: null })); };
  const addTag = async () => {
    if (!tagInput.trim()) return;
    const next = [...(prof.skill_tags || []), tagInput.trim()].slice(0, 8);
    await supabase.from("profiles").update({ skill_tags: next }).eq("id", userId);
    setProf((p) => ({ ...p, skill_tags: next })); setTagInput("");
  };
  const removeTag = async (tag) => {
    const next = (prof.skill_tags || []).filter((x) => x !== tag);
    await supabase.from("profiles").update({ skill_tags: next }).eq("id", userId);
    setProf((p) => ({ ...p, skill_tags: next }));
  };
  const setMood = async (emoji) => {
    const today = todayStr();
    await supabase.from("profiles").update({ mood_emoji: emoji, mood_date: today }).eq("id", userId);
    setProf((p) => ({ ...p, mood_emoji: emoji, mood_date: today }));
  };

  if (loading || !prof) return <ModalPortal><div style={overlay} onClick={close}><div style={{ padding: 40, textAlign: "center", color: "#fff" }}>กำลังโหลด...</div></div></ModalPortal>;

  const meta = GROUP_META[prof.sorted_group];
  const moodToday = prof.mood_date === todayStr() ? prof.mood_emoji : null;
  const MOOD_OPTIONS = ["😄", "😌", "😴", "😤", "🥰", "😐", "🤩", "😢"];

  return (
    <ModalPortal>
      <div style={overlay} onClick={close}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "24px 24px 0 0", maxHeight: "88vh", overflowY: "auto" }}>
          {/* 🎨 หัวโปรไฟล์ พื้นหลังแต่งเอง — ลากปรับตำแหน่งปกได้ตอนอยู่โหมดแก้ไข */}
          <div
            onMouseDown={(e) => isMe && editing && prof.profile_bg_photo && onCoverDragStart(e.clientY)}
            onMouseMove={(e) => isMe && editing && onCoverDragMove(e.clientY)}
            onMouseUp={onCoverDragEnd} onMouseLeave={onCoverDragEnd}
            onTouchStart={(e) => isMe && editing && prof.profile_bg_photo && onCoverDragStart(e.touches[0].clientY)}
            onTouchMove={(e) => isMe && editing && onCoverDragMove(e.touches[0].clientY)}
            onTouchEnd={onCoverDragEnd}
            style={{ background: prof.profile_bg_photo ? `url(${prof.profile_bg_photo}) center ${prof.profile_bg_photo_pos || "50%"}/cover` : bgGradient(prof.profile_bg), padding: "28px 20px 20px", position: "relative", borderRadius: "24px 24px 0 0", cursor: isMe && editing && prof.profile_bg_photo ? "ns-resize" : "default", touchAction: isMe && editing && prof.profile_bg_photo ? "none" : "auto" }}
          >
            {prof.profile_bg_photo && <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,.15), rgba(0,0,0,.5))", borderRadius: "24px 24px 0 0", pointerEvents: "none" }} />}
            {isMe && editing && prof.profile_bg_photo && <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", fontSize: 10, color: "#fff", background: "rgba(0,0,0,.4)", padding: "3px 10px", borderRadius: 8, pointerEvents: "none" }}>↕ ลากขึ้น-ลงเพื่อปรับตำแหน่งปก</div>}
            <button onClick={close} style={{ position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,.25)", border: "none", borderRadius: 16, width: 32, height: 32, cursor: "pointer", display: "grid", placeItems: "center" }}><X size={18} color="#fff" /></button>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ position: "relative" }}>
                {(() => {
                  const showAvatar = prof.passport_use_main_avatar !== false ? prof.avatar_url : prof.passport_avatar_url;
                  return showAvatar ? <img src={showAvatar} alt="" style={{ width: 66, height: 66, borderRadius: 33, objectFit: "cover", border: "3px solid #fff" }} /> : <div style={{ width: 66, height: 66, borderRadius: 33, background: "rgba(255,255,255,.3)", color: "#fff", display: "grid", placeItems: "center", fontSize: 24, fontWeight: 800, border: "3px solid #fff" }}>{prof.name?.[0]}</div>;
                })()}
                {moodToday && <span style={{ position: "absolute", bottom: -2, right: -2, fontSize: 20 }}>{moodToday}</span>}
                {isMe && editing && (
                  <button onClick={() => passportAvatarRef.current?.click()} style={{ position: "absolute", bottom: -2, left: -2, width: 22, height: 22, borderRadius: 11, background: t.accent, border: "2px solid #fff", cursor: "pointer", display: "grid", placeItems: "center" }} title="เปลี่ยนรูป Passport">
                    <Camera size={10} color={t.onAccent} />
                  </button>
                )}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>{prof.name}</div>
                {meta && <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: "rgba(0,0,0,.25)", display: "inline-block", padding: "2px 8px", borderRadius: 8, marginTop: 4 }}>{meta.emoji} {meta.label}</div>}
              </div>
            </div>
          </div>
          <input ref={passportAvatarRef} type="file" accept="image/*" onChange={uploadPassportAvatar} style={{ display: "none" }} />

          <div style={{ padding: 20 }}>
            {/* 🎭 Reaction + 💬 ทักแชท + 🔇 Mute */}
            {!isMe && (
              <div style={{ position: "relative", display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                <button onClick={() => setShowReactionPicker((s) => !s)} style={{ display: "flex", alignItems: "center", gap: 6, background: myReaction ? `${t.accent}18` : "none", border: `1px solid ${myReaction ? t.accent : t.border}`, borderRadius: 12, padding: "8px 14px", cursor: "pointer" }}>
                  <span style={{ fontSize: 15 }}>{myReaction ? reactionTypes.find((r) => r.id === myReaction)?.emoji : "👍"}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: myReaction ? t.accent : t.text }}>{myReaction ? reactionTypes.find((r) => r.id === myReaction)?.label : "แสดงความรู้สึก"} · {totalReactions}</span>
                </button>
                {showReactionPicker && (
                  <div style={{ position: "absolute", top: "100%", left: 0, marginTop: 6, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 8, display: "flex", gap: 4, boxShadow: "0 6px 18px rgba(0,0,0,.15)", zIndex: 2 }}>
                    {reactionTypes.map((r) => (
                      <button key={r.id} onClick={() => setReaction(r.id)} title={r.label} style={{ width: 38, height: 38, borderRadius: 10, border: "none", background: myReaction === r.id ? `${t.accent}25` : "none", cursor: "pointer", fontSize: 20, display: "grid", placeItems: "center" }}>{r.emoji}</button>
                    ))}
                  </div>
                )}
                <button onClick={startChat} disabled={msgBusy} style={{ display: "flex", alignItems: "center", gap: 6, background: t.accent, border: "none", borderRadius: 12, padding: "8px 14px", cursor: "pointer" }}>
                  <MessageCircle size={15} color={t.onAccent} />
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: t.onAccent }}>{msgBusy ? "..." : "ทักแชท"}</span>
                </button>
                <button onClick={toggleMute} style={{ display: "flex", alignItems: "center", gap: 6, background: isMuted ? "#D9534F18" : "none", border: `1px solid ${isMuted ? "#D9534F" : t.border}`, borderRadius: 12, padding: "8px 14px", cursor: "pointer" }} title={isMuted ? "เลิก mute คนนี้" : "Mute คนนี้ (ไม่อยากให้มาก่อกวน)"}>
                  <VolumeX size={15} color={isMuted ? "#D9534F" : t.sub} />
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: isMuted ? "#D9534F" : t.text }}>{isMuted ? "Mute อยู่" : "Mute"}</span>
                </button>
              </div>
            )}
            {msgErr && <div style={{ fontSize: 11.5, color: "#D9534F", marginBottom: 12 }}>{msgErr}</div>}
            {isMe && totalReactions > 0 && (
              <div style={{ fontSize: 12, color: t.sub, marginBottom: 16 }}>
                {reactionTypes.filter((r) => reactionCounts[r.id]).map((r) => `${r.emoji} ${reactionCounts[r.id]}`).join("  ")} · รวม {totalReactions} รีแอคชัน
              </div>
            )}

            {/* 🎭 ป้ายทักษะ */}
            {((prof.skill_tags || []).length > 0 || isMe) && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: t.sub, marginBottom: 6 }}>🏷️ ตราประทับ (เก่งเรื่องอะไร)</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {(prof.skill_tags || []).map((tag) => (
                    <span key={tag} style={{ fontSize: 11.5, fontWeight: 700, color: t.accent, background: `${t.accent}18`, padding: "4px 10px", borderRadius: 10, display: "flex", alignItems: "center", gap: 4 }}>
                      {tag} {isMe && editing && <X size={11} style={{ cursor: "pointer" }} onClick={() => removeTag(tag)} />}
                    </span>
                  ))}
                  {isMe && editing && (
                    <div style={{ display: "flex", gap: 4 }}>
                      <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTag()} placeholder="+ เพิ่มป้าย" style={{ fontSize: 11.5, padding: "4px 8px", borderRadius: 8, border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, width: 100 }} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 🎵 เพลงประจำตัว */}
            {(prof.profile_song_url || (isMe && editing)) && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: t.sub, marginBottom: 6 }}>🎵 เพลงประจำตัว</div>
                {prof.profile_song_url ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, ...card(t), padding: 10 }}>
                    <Music size={16} color={t.accent} />
                    <div style={{ flex: 1, fontSize: 12, color: t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{prof.profile_song_name}</div>
                    {isMe && editing && <button onClick={clearSong} style={ghost}><X size={14} color={t.faint} /></button>}
                  </div>
                ) : isMe && editing && <div style={{ fontSize: 11, color: t.faint }}>ยังไม่ได้เลือกเพลง เลือกจากรายการด้านล่าง</div>}
                {isMe && editing && myMedia.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8, maxHeight: 140, overflowY: "auto" }}>
                    {myMedia.map((mtrack) => (
                      <button key={mtrack.id} onClick={() => setSong(mtrack)} style={{ textAlign: "left", padding: "6px 10px", borderRadius: 8, border: `1px solid ${t.border}`, background: "none", cursor: "pointer", fontSize: 11.5, color: t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{mtrack.name}</button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 🎨 พื้นหลัง + มู้ด (โหมดแก้ไข เฉพาะเจ้าของ) */}
            {isMe && (
              <div style={{ marginBottom: 16 }}>
                <button onClick={() => setEditing((e) => !e)} style={{ width: "100%", padding: "10px 0", borderRadius: 10, border: `1px solid ${t.accent}`, background: editing ? t.accent : "none", color: editing ? t.onAccent : t.accent, cursor: "pointer", fontSize: 12.5, fontWeight: 700, marginBottom: editing ? 12 : 0 }}>{editing ? "เสร็จแล้ว ปิดโหมดแก้ไข" : "🛂 แต่งพาสปอร์ตของฉัน"}</button>
                {editing && (
                  <>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: t.sub, marginBottom: 6 }}>รูปโปรไฟล์ Passport</div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                      <button onClick={() => toggleUseMainAvatar(true)} style={{ padding: "8px 14px", borderRadius: 10, border: `1.5px solid ${prof.passport_use_main_avatar !== false ? t.accent : t.border}`, background: prof.passport_use_main_avatar !== false ? `${t.accent}18` : "none", color: t.text, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>ใช้รูปเดียวกับหน้าแอป</button>
                      <button onClick={() => passportAvatarRef.current?.click()} style={{ padding: "8px 14px", borderRadius: 10, border: `1.5px solid ${prof.passport_use_main_avatar === false ? t.accent : t.border}`, background: prof.passport_use_main_avatar === false ? `${t.accent}18` : "none", color: t.text, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>{avatarUploading ? "กำลังอัปโหลด..." : "📷 ใช้รูปอื่นแยกต่างหาก"}</button>
                    </div>
                    <div style={{ fontSize: 10, color: t.faint, marginBottom: 12 }}>เลือก "ใช้รูปอื่นแยกต่างหาก" แล้วเลือกไฟล์ใหม่ได้เลย ไม่กระทบรูปโปรไฟล์หลักของแอป</div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: t.sub, margin: "10px 0 6px" }}>สีพื้นหลัง</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                      {PROFILE_BG_OPTIONS.map((bg) => (
                        <button key={bg.key} onClick={() => setBg(bg.key)} style={{ width: 36, height: 36, borderRadius: 10, background: bg.grad, border: prof.profile_bg === bg.key && !prof.profile_bg_photo ? `3px solid ${t.text}` : "none", cursor: "pointer" }} />
                      ))}
                    </div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: t.sub, marginBottom: 6 }}>หรือใช้รูปของตัวเองแทน (ลากปรับตำแหน่งได้หลังอัปโหลด)</div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                      <button onClick={() => bgPhotoRef.current?.click()} style={{ padding: "8px 14px", borderRadius: 10, border: `1px solid ${t.border}`, background: "none", color: t.text, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>{bgUploading ? "กำลังอัปโหลด..." : "📷 อัปโหลดรูปปก"}</button>
                      {prof.profile_bg_photo && <button onClick={clearBgPhoto} style={{ padding: "8px 14px", borderRadius: 10, border: `1px solid ${t.border}`, background: "none", color: t.faint, cursor: "pointer", fontSize: 12 }}>เอารูปออก</button>}
                    </div>
                    <input ref={bgPhotoRef} type="file" accept="image/*" onChange={uploadBgPhoto} style={{ display: "none" }} />
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: t.sub, marginBottom: 6 }}>มู้ดวันนี้ (เปลี่ยนได้วันละครั้ง)</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {MOOD_OPTIONS.map((e2) => (
                        <button key={e2} onClick={() => setMood(e2)} style={{ fontSize: 20, width: 38, height: 38, borderRadius: 10, border: `1.5px solid ${moodToday === e2 ? t.accent : t.border}`, background: moodToday === e2 ? `${t.accent}18` : "none", cursor: "pointer" }}>{e2}</button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 📜 สมุดเยี่ยม (ลายเซ็นผู้มาเยือน) */}
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: t.sub, marginBottom: 8 }}>📜 สมุดเยี่ยม ({testimonials.length})</div>
              {!isMe && (
                <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                  <input value={newMsg} onChange={(e) => setNewMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && postTestimonial()} placeholder="ฝากข้อความถึงเขา..." style={{ ...input(t), flex: 1, fontSize: 12.5 }} />
                  <button onClick={postTestimonial} style={{ ...primaryBtn({ accent: t.accent, accent2: t.accent2, onAccent: t.onAccent }), padding: "0 16px" }}>ฝาก</button>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {testimonials.map((ts) => (
                  <div key={ts.id} style={{ ...card(t), padding: 10 }}>
                    <div style={{ fontSize: 12.5, color: t.text, marginBottom: 4 }}>{ts.text}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: 10, color: t.faint }}>— {ts.authorName}</div>
                      {(isMe || ts.author_id === userId) && <button onClick={() => deleteTestimonial(ts.id)} style={{ ...ghost, padding: 3 }}><Trash2 size={12} color={t.faint} /></button>}
                    </div>
                  </div>
                ))}
                {testimonials.length === 0 && <div style={{ fontSize: 11.5, color: t.faint, textAlign: "center", padding: "10px 0" }}>ยังไม่มีใครฝากข้อความไว้</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

function ChatRoomPage({ t, userId, thread, profile, session, onLeave, onBack, activeCall, setActiveCall, setCallMinimized }) {

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [confirmDeleteMsgId, setConfirmDeleteMsgId] = useState(null);
  const [senderMap, setSenderMap] = useState({}); // sender_id -> { name } กันโชว์ชื่อผิดคนตอนหลายคนคุยในห้องเดียวกัน
  const [uploading, setUploading] = useState(false);
  const [typingName, setTypingName] = useState(null); // ชื่อคนที่กำลังพิมพ์อยู่ (null = ไม่มีใครพิมพ์)
  const [otherMembers, setOtherMembers] = useState([]); // [{id, name}] สมาชิกคนอื่นในห้อง (ไม่รวมตัวเอง) ใช้ทำ "อ่านแล้ว"
  const [reads, setReads] = useState({}); // user_id -> last_read_at ของคนอื่นในห้อง
  const [lightbox, setLightbox] = useState(null); // url รูปที่กำลังดูเต็มจอ (null = ไม่ได้เปิดดู)
  const [confirmLeave, setConfirmLeave] = useState(false); // "ยืนยัน" | "" -> โหมด: "leave" (ออกจากห้อง) หรือ "delete" (ลบถาวร)
  const [showMembers, setShowMembers] = useState(false);
  const [callParticipants, setCallParticipants] = useState([]); // คนที่กำลังอยู่ในสายเสียงของห้องนี้ตอนนี้ (ไม่รวมตัวเอง ไว้โชว์แบนเนอร์เตือน)
  const playRingtone = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      // จังหวะ "ปี๊บ-ปี๊บ" 2 ครั้งติดกัน คล้ายเสียงโทรศัพท์เรียกเข้า สังเคราะห์สดๆ ไม่ต้องพึ่งไฟล์เสียงภายนอก
      [0, 0.3].forEach((startAt) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 880; osc.type = "sine";
        gain.gain.setValueAtTime(0.25, ctx.currentTime + startAt);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startAt + 0.25);
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime + startAt); osc.stop(ctx.currentTime + startAt + 0.25);
      });
    } catch (e) {}
  };
  useEffect(() => {
    const isMeInThisCall = activeCall?.threadId === thread.id;
    if (isMeInThisCall) { setCallParticipants([]); return; } // ตัวเองเข้าสายอยู่แล้ว ไม่ต้องโชว์แบนเนอร์เตือนตัวเอง
    const presenceChannel = supabase.channel(`call-${thread.id}`);
    presenceChannel.on("presence", { event: "sync" }, () => {
      const state = presenceChannel.presenceState();
      const people = Object.values(state).flat().filter((p) => p.userId !== userId);
      setCallParticipants((prev) => {
        if (prev.length === 0 && people.length > 0) playRingtone(); // มีคนเพิ่งเริ่ม/เข้าร่วมสายพอดี (ตอนแอปเปิดอยู่เท่านั้น)
        return people;
      });
    });
    presenceChannel.subscribe();
    return () => { supabase.removeChannel(presenceChannel); };
  }, [thread.id, activeCall?.threadId, userId]);
  const [leaveErr, setLeaveErr] = useState("");
  const isCreator = thread.createdBy && thread.createdBy === userId;
  const leaveRoom = async () => {
    const { error } = await supabase.from("chat_thread_members").delete().eq("thread_id", thread.id).eq("user_id", userId);
    if (error) { setLeaveErr("ออกจากห้องไม่สำเร็จ: " + error.message); setConfirmLeave(false); return; }
    onLeave?.();
  };
  const deleteRoomForever = async () => {
    try {
      const r = await fetch("/api/chat-room", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", threadId: thread.id, callerToken: session?.access_token }) });
      const data = await r.json();
      if (!r.ok) { setLeaveErr("ลบห้องไม่สำเร็จ: " + data.error); setConfirmLeave(false); return; }
      onLeave?.();
    } catch (e) { setLeaveErr("ลบห้องไม่สำเร็จ: " + e.message); setConfirmLeave(false); }
  };
  const fileRef = useRef(null);
  const endRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const broadcastRef = useRef(null);

  const markRead = () => supabase.from("chat_reads").upsert({ user_id: userId, thread_id: thread.id, last_read_at: new Date().toISOString() }, { onConflict: "user_id,thread_id" }).then(({ error }) => { if (error) console.error("บันทึก 'อ่านแล้ว' ไม่สำเร็จ:", error.message); }, () => {});

  // 👥 ดึงสมาชิกคนอื่นในห้อง + เวลาที่แต่ละคนอ่านล่าสุด (สำหรับทำ "อ่านแล้ว") + ฟังการเปลี่ยนแปลงแบบสด
  useEffect(() => {
    (async () => {
      const { data: members } = await supabase.from("chat_thread_members").select("user_id").eq("thread_id", thread.id).neq("user_id", userId);
      const otherIds = (members || []).map((m) => m.user_id);
      if (!otherIds.length) return;
      const { data: profiles } = await supabase.from("profiles").select("id, name, status_message").in("id", otherIds);
      setOtherMembers(profiles || []);
      const { data: readRows } = await supabase.from("chat_reads").select("user_id, last_read_at").eq("thread_id", thread.id).in("user_id", otherIds);
      setReads(Object.fromEntries((readRows || []).map((r) => [r.user_id, r.last_read_at])));
    })();
    const readsChannel = supabase
      .channel(`reads-${thread.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_reads", filter: `thread_id=eq.${thread.id}` }, (payload) => {
        const row = payload.new;
        if (row && row.user_id !== userId) setReads((r) => ({ ...r, [row.user_id]: row.last_read_at }));
      })
      .subscribe();
    return () => { supabase.removeChannel(readsChannel); };
  }, [thread.id]);

  // ⌨️ "กำลังพิมพ์..." — ใช้ Realtime Broadcast (ไม่ต้องเก็บลงฐานข้อมูล เบาและไวมาก)
  useEffect(() => {
    const channel = supabase.channel(`typing-${thread.id}`);
    channel.on("broadcast", { event: "typing" }, (payload) => {
      if (payload.payload.userId === userId) return; // ไม่ต้องโชว์ตัวเองพิมพ์
      setTypingName(payload.payload.name);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setTypingName(null), 3000);
    }).subscribe();
    broadcastRef.current = channel;
    return () => { supabase.removeChannel(channel); clearTimeout(typingTimeoutRef.current); };
  }, [thread.id]);

  const notifyTyping = () => {
    broadcastRef.current?.send({ type: "broadcast", event: "typing", payload: { userId, name: profile?.name || "เพื่อน" } });
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("chat_messages").select("*").eq("thread_id", thread.id).order("created_at", { ascending: true }).limit(200);
      setMessages(data || []);
      markRead();
    })();
    const channel = supabase
      .channel(`room-${thread.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `thread_id=eq.${thread.id}` }, (payload) => {
        setMessages((m) => [...m, payload.new]);
        if (payload.new.sender_id !== userId) markRead();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "chat_messages", filter: `thread_id=eq.${thread.id}` }, (payload) => {
        setMessages((m) => m.map((x) => (x.id === payload.new.id ? payload.new : x)));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "chat_messages", filter: `thread_id=eq.${thread.id}` }, (payload) => {
        setMessages((m) => m.filter((x) => x.id !== payload.old.id));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [thread.id]);

  // ดึงชื่อจริงของทุกคนที่เคยส่งข้อความในห้องนี้ (สำคัญมากสำหรับห้องกลุ่มที่มีมากกว่า 2 คน)
  useEffect(() => {
    const ids = [...new Set(messages.map((m) => m.sender_id))].filter((id) => id && !senderMap[id]);
    if (!ids.length) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("id, name, email, avatar_url").in("id", ids);
      if (data) setSenderMap((prev) => ({ ...prev, ...Object.fromEntries(data.map((p) => [p.id, { name: p.name || p.email || "ไม่ทราบชื่อ", avatarUrl: p.avatar_url || null }])) }));
    })();
  }, [messages]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); markRead(); }, [messages.length]);

  const send = async () => {
    if (!text.trim()) return;
    const t2 = text.trim(); setText("");
    const { error } = await supabase.from("chat_messages").insert({ thread_id: thread.id, sender_id: userId, text: t2 });
    if (error) { setLeaveErr("ส่งข้อความไม่สำเร็จ (อาจถูกปิดไม่ให้พิมพ์ในห้องนี้): " + error.message); setText(t2); return; }
    notifyPush(otherMembers.map((m) => m.id), `${profile?.name || "ข้อความใหม่"} · ${thread.name}`, t2, session?.access_token);
  };
  const startEdit = (m) => { setEditingId(m.id); setEditText(m.text); };
  const saveEdit = async () => {
    if (!editText.trim()) return;
    await supabase.from("chat_messages").update({ text: editText.trim(), edited_at: new Date().toISOString() }).eq("id", editingId);
    setEditingId(null);
  };
  const deleteMsg = async (id) => { await supabase.from("chat_messages").delete().eq("id", id); setConfirmDeleteMsgId(null); };

  // 📎 แนบรูป/ไฟล์ในแชท — เก็บผ่าน Supabase Storage bucket "attachments" (ตัวเดียวกับที่ใช้ในโน้ต)
  const pickFile = async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    e.target.value = "";
    setUploading(true);
    try {
      const isImage = f.type.startsWith("image/");
      const path = `${userId}/${uid()}-${f.name}`;
      const { error } = await supabase.storage.from("attachments").upload(path, f);
      if (error) throw error;
      const { data } = supabase.storage.from("attachments").getPublicUrl(path);
      await supabase.from("chat_messages").insert({
        thread_id: thread.id, sender_id: userId, text: "",
        attachment_url: data.publicUrl, attachment_name: f.name, attachment_type: isImage ? "image" : "file",
      });
      notifyPush(otherMembers.map((m) => m.id), `${profile?.name || "ข้อความใหม่"} · ${thread.name}`, isImage ? "ส่งรูปภาพมา" : `ส่งไฟล์: ${f.name}`, session?.access_token);
    } catch (err) {
      alert("แนบไฟล์ไม่สำเร็จ: " + err.message);
    } finally { setUploading(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 160px)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <button onClick={onBack} style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 17, background: t.surface, border: `1px solid ${t.border}`, cursor: "pointer", display: "grid", placeItems: "center" }} title="กลับไปรายการห้อง"><ArrowLeft size={18} color={t.text} /></button>
        {thread.avatarUrl ? (
          <img src={thread.avatarUrl} alt="" onClick={() => setLightbox(thread.avatarUrl)} style={{ width: 32, height: 32, borderRadius: 10, objectFit: "cover", cursor: "pointer" }} />
        ) : (
          <div style={{ width: 32, height: 32, borderRadius: 10, background: colorFor(thread.name), color: "#fff", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700 }}>{thread.name[0]}</div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>{thread.name}</div>
          {!thread.isGroup && otherMembers[0]?.status_message && <div style={{ fontSize: 11, color: t.sub, fontStyle: "italic" }}>{otherMembers[0].status_message}</div>}
        </div>
        <button onClick={() => { setActiveCall({ threadId: thread.id, roomName: thread.name, otherMemberIds: otherMembers.map((m) => m.id) }); setCallMinimized(false); }} style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 17, background: "#2E9E6B18", border: "1px solid #2E9E6B55", cursor: "pointer", display: "grid", placeItems: "center" }} title="เริ่ม/เข้าร่วมคุยด้วยเสียง"><Phone size={15} color="#2E9E6B" /></button>
        {isCreator && (
          <button onClick={() => setShowMembers(true)} style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 17, background: t.surface, border: `1px solid ${t.border}`, cursor: "pointer", display: "grid", placeItems: "center" }} title="จัดการสมาชิกห้อง"><Users size={16} color={t.sub} /></button>
        )}
        {confirmLeave === "leave" ? (
          <button onClick={leaveRoom} style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 10, border: "none", background: "#D9534F", color: "#fff", cursor: "pointer", fontSize: 11.5, fontWeight: 700 }}>ยืนยันออก?</button>
        ) : confirmLeave === "delete" ? (
          <button onClick={deleteRoomForever} style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 10, border: "none", background: "#D9534F", color: "#fff", cursor: "pointer", fontSize: 11.5, fontWeight: 700 }}>ยืนยันลบถาวร?</button>
        ) : confirmLeave === "menu" ? (
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button onClick={() => setConfirmLeave("leave")} style={{ padding: "7px 10px", borderRadius: 10, border: `1px solid ${t.border}`, background: "none", color: t.sub, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>ออกจากห้อง</button>
            <button onClick={() => setConfirmLeave("delete")} style={{ padding: "7px 10px", borderRadius: 10, border: "1px solid #D9534F", background: "#D9534F18", color: "#D9534F", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>ลบถาวร</button>
          </div>
        ) : (
          <button onClick={() => setConfirmLeave(isCreator ? "menu" : "leave")} style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 17, background: "#D9534F18", border: "1px solid #D9534F55", cursor: "pointer", display: "grid", placeItems: "center" }} title={isCreator ? "ออกจากห้อง / ลบห้อง" : "ออกจากห้อง"}><LogOut size={17} color="#D9534F" /></button>
        )}
      </div>
      {leaveErr && <div style={{ fontSize: 11.5, color: "#D9534F", marginBottom: 10 }}>{leaveErr}</div>}
      {callParticipants.length > 0 && (
        <button onClick={() => { setActiveCall({ threadId: thread.id, roomName: thread.name, otherMemberIds: otherMembers.map((m) => m.id) }); setCallMinimized(false); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: "#2E9E6B18", border: "1px solid #2E9E6B55", borderRadius: 14, padding: "10px 14px", marginBottom: 10, cursor: "pointer" }}>
          <Phone size={16} color="#2E9E6B" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, textAlign: "left", fontSize: 12, color: "#2E9E6B", fontWeight: 700 }}>📞 {callParticipants.map((p) => p.name).join(", ")} กำลังคุยด้วยเสียงอยู่</div>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", background: "#2E9E6B", padding: "5px 10px", borderRadius: 10 }}>เข้าร่วม</span>
        </button>
      )}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingBottom: 10 }}>
        {messages.map((m) => {
          const mine = m.sender_id === userId;
          const senderName = senderMap[m.sender_id]?.name || (mine ? profile?.name : thread.name);
          const isLastMine = mine && m.id === [...messages].reverse().find((x) => x.sender_id === userId)?.id;
          const readByCount = isLastMine ? otherMembers.filter((u) => reads[u.id] && new Date(reads[u.id]) >= new Date(m.created_at)).length : 0;
          return (
            <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start", maxWidth: "84%", alignSelf: mine ? "flex-end" : "flex-start" }}>
              {!mine && thread.isGroup && <div style={{ fontSize: 10.5, color: t.faint, marginBottom: 2, paddingLeft: 34 }}>{senderName}</div>}
              <div style={{ display: "flex", gap: 8, flexDirection: mine ? "row-reverse" : "row" }}>
                {!mine && (senderMap[m.sender_id]?.avatarUrl ? (
                  <img src={senderMap[m.sender_id].avatarUrl} alt="" onClick={() => setLightbox(senderMap[m.sender_id].avatarUrl)} style={{ width: 26, height: 26, borderRadius: 8, objectFit: "cover", flexShrink: 0, cursor: "pointer" }} />
                ) : (
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: colorFor(senderName || thread.name), color: "#fff", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{(senderName || thread.name)[0]}</div>
                ))}
                {editingId === m.id ? (
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input value={editText} onChange={(e) => setEditText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveEdit()} style={{ ...input(t), fontSize: 13 }} autoFocus />
                    <button onClick={saveEdit} style={{ ...ghost, color: t.accent }}><Check size={16} color={t.accent} /></button>
                    <button onClick={() => setEditingId(null)} style={ghost}><X size={16} color={t.faint} /></button>
                  </div>
                ) : (
                  <div style={{ background: mine ? t.accent : t.surface, color: mine ? t.onAccent : t.text, padding: m.attachment_url ? 6 : "9px 13px", borderRadius: 14, fontSize: 13.5, lineHeight: 1.4, border: mine ? "none" : `1px solid ${t.border}` }}>
                    {m.attachment_type === "image" && <img src={m.attachment_url} alt="" onClick={() => setLightbox(m.attachment_url)} style={{ maxWidth: 200, borderRadius: 10, display: "block", cursor: "pointer" }} />}
                    {m.attachment_type === "file" && (
                      <a href={m.attachment_url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, color: "inherit", textDecoration: "underline", padding: "3px 7px" }}><FileText size={14} /> {m.attachment_name}</a>
                    )}
                    {m.text && <div style={{ padding: m.attachment_url ? "6px 7px 2px" : 0 }}>{m.text}{m.edited_at && <span style={{ fontSize: 10, opacity: 0.6, marginLeft: 6 }}>(แก้ไขแล้ว)</span>}</div>}
                  </div>
                )}
              </div>
              {mine && editingId !== m.id && !m.attachment_url && (
                <div style={{ display: "flex", gap: 10, marginTop: 3, paddingRight: 2 }}>
                  <button onClick={() => startEdit(m)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10.5, color: t.faint }}>แก้ไข</button>
                  {confirmDeleteMsgId === m.id ? (
                    <button onClick={() => deleteMsg(m.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10.5, color: "#D9534F", fontWeight: 700 }}>ยืนยันลบ?</button>
                  ) : (
                    <button onClick={() => setConfirmDeleteMsgId(m.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10.5, color: t.faint }}>ลบ</button>
                  )}
                </div>
              )}
              {isLastMine && otherMembers.length > 0 && (
                <div style={{ fontSize: 10, color: t.faint, marginTop: 2, paddingRight: 2 }}>
                  {readByCount === 0 ? "ส่งแล้ว" : otherMembers.length === 1 ? "อ่านแล้ว ✓✓" : `อ่านแล้ว ${readByCount}/${otherMembers.length} ✓✓`}
                </div>
              )}
            </div>
          );
        })}
        {typingName && <div style={{ fontSize: 11, color: t.faint, paddingLeft: 4, fontStyle: "italic" }}>{typingName} กำลังพิมพ์...</div>}
        <div ref={endRef} />
      </div>
      <div style={{ display: "flex", gap: 8, paddingTop: 10 }}>
        <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ width: 42, borderRadius: 12, border: `1px solid ${t.border}`, background: t.inputBg, cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}>
          <Upload size={16} color={t.sub} />
        </button>
        <input ref={fileRef} type="file" accept="image/*,.pdf,.doc,.docx" onChange={pickFile} style={{ display: "none" }} />
        <textarea value={text} onChange={(e) => { setText(e.target.value); notifyTyping(); }} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="พิมพ์ข้อความ..." rows={1} style={{ ...input(t), resize: "none", maxHeight: 120, overflowY: "auto", fontFamily: "inherit", lineHeight: 1.4 }} onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }} />
        <button onClick={send} style={{ ...primaryBtn({ accent: t.accent, accent2: t.accent2, onAccent: t.onAccent }), width: 46, display: "grid", placeItems: "center" }}><Send size={17} /></button>
      </div>
      {lightbox && <ImageLightbox src={lightbox} onClose={() => setLightbox(null)} />}
      {showMembers && <RoomMembersModal t={t} threadId={thread.id} session={session} close={() => setShowMembers(false)} />}

    </div>
  );
}

function RoomMembersModal({ t, threadId, session, close }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [confirmKickId, setConfirmKickId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/chat-room", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "members", threadId, callerToken: session?.access_token }) });
      const data = await r.json();
      if (!r.ok) { setErr(data.error); setLoading(false); return; }
      setMembers(data.members || []);
    } catch (e) { setErr(e.message); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const kick = async (targetUserId) => {
    await fetch("/api/chat-room", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "kick", threadId, targetUserId, callerToken: session?.access_token }) });
    setConfirmKickId(null);
    load();
  };
  const toggleMute = async (targetUserId, muted) => {
    await fetch("/api/chat-room", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "toggle_mute", threadId, targetUserId, muted, callerToken: session?.access_token }) });
    load();
  };

  return (
    <ModalPortal>
      <div style={overlay} onClick={close}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "24px 24px 0 0", padding: 20, maxHeight: "80vh", overflowY: "auto" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: t.text, marginBottom: 4 }}>จัดการสมาชิกห้อง</div>
          <div style={{ fontSize: 11.5, color: t.sub, marginBottom: 16 }}>เตะออก หรือปิดไม่ให้พิมพ์ (mute) ได้เฉพาะคนที่ไม่ใช่ตัวคุณเอง</div>
          {err && <div style={{ fontSize: 12, color: "#D9534F", marginBottom: 10 }}>{err}</div>}
          {loading && <Empty t={t} text="กำลังโหลด..." />}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {members.map((m) => (
              <div key={m.userId} style={{ ...card(t), padding: 12, display: "flex", alignItems: "center", gap: 10 }}>
                {m.avatarUrl ? (
                  <img src={m.avatarUrl} alt="" style={{ width: 34, height: 34, borderRadius: 10, objectFit: "cover" }} />
                ) : (
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: colorFor(m.name), color: "#fff", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700 }}>{m.name[0]}</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: t.text, display: "flex", alignItems: "center", gap: 6 }}>
                    {m.name}
                    {m.isCreator && <span style={{ fontSize: 9, fontWeight: 800, color: t.accent, background: `${t.accent}18`, padding: "1px 6px", borderRadius: 8 }}>หัวห้อง</span>}
                  </div>
                  {m.muted && <div style={{ fontSize: 10.5, color: "#D9534F" }}>ปิดไม่ให้พิมพ์อยู่</div>}
                </div>
                {!m.isCreator && (
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button onClick={() => toggleMute(m.userId, !m.muted)} style={{ padding: "6px 10px", borderRadius: 9, border: `1px solid ${m.muted ? "#D9534F" : t.border}`, background: m.muted ? "#D9534F18" : "none", color: m.muted ? "#D9534F" : t.sub, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>{m.muted ? "เปิดพิมพ์" : "ปิดพิมพ์"}</button>
                    {confirmKickId === m.userId ? (
                      <button onClick={() => kick(m.userId)} style={{ padding: "6px 10px", borderRadius: 9, border: "none", background: "#D9534F", color: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>ยืนยัน?</button>
                    ) : (
                      <button onClick={() => setConfirmKickId(m.userId)} style={{ padding: "6px 10px", borderRadius: 9, border: "1px solid #D9534F", background: "none", color: "#D9534F", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>เตะออก</button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

function LocationsPage({ t, userId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data: locs } = await supabase.from("locations").select("*").neq("user_id", userId);
      const ids = (locs || []).map((l) => l.user_id);
      const { data: profiles } = ids.length ? await supabase.from("profiles").select("id, name").in("id", ids) : { data: [] };
      const merged = (locs || []).map((l) => ({ ...l, name: (profiles || []).find((p) => p.id === l.user_id)?.name || "ไม่ทราบชื่อ" }));
      setRows(merged);
    } catch (e) {}
    setLoading(false);
  };
  useEffect(() => {
    load();
    const channel = supabase.channel("locations-watch").on("postgres_changes", { event: "*", schema: "public", table: "locations" }, load).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const minutesAgo = (iso) => Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));

  return (
    <>
      <PageHead t={t} title="ตำแหน่งล่าสุด" sub="เห็นเฉพาะคนที่แชร์ไว้และแอดมินอนุญาตให้คุณดู" icon={<MapPin size={20} color={t.accent} />} />
      {loading && <Empty t={t} text="กำลังโหลด..." />}
      {!loading && rows.length === 0 && <Empty t={t} text="ยังไม่มีใครแชร์ตำแหน่งให้คุณเห็น (หรือคุณยังไม่ได้รับสิทธิ์ดูจากแอดมิน)" />}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map((r) => (
          <div key={r.user_id} style={{ ...card(t), padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: colorFor(r.name), color: "#fff", display: "grid", placeItems: "center", fontSize: 15, fontWeight: 700, flexShrink: 0 }}>{r.name[0]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>{r.name}</div>
              <div style={{ fontSize: 11, color: t.sub }}>{r.lat ? `อัปเดตเมื่อ ${minutesAgo(r.updated_at)} นาทีที่แล้ว` : "ยังไม่มีข้อมูลตำแหน่ง"}</div>
            </div>
            {r.lat && (
              <a href={`https://www.google.com/maps?q=${r.lat},${r.lng}`} target="_blank" rel="noreferrer" style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 10, border: `1px solid ${t.border}`, color: t.accent, fontSize: 11.5, fontWeight: 700, textDecoration: "none" }}>เปิดแผนที่ <ChevronRight size={13} /></a>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function GoalsReportPage({ t, goals, setGoals, userId }) {
  const [expandedGroup, setExpandedGroup] = useState(null); // label ของกลุ่มที่กำลังขยายดู log อยู่
  const dated = goals.filter((g) => g.date);

  // จัดกลุ่มเป้าหมายที่ข้อความคล้ายกัน (ตัดช่องว่าง+ตัวพิมพ์เล็กใหญ่) ให้นับเป็นเป้าหมายเดียวกันที่ทำซ้ำหลายวัน
  const groups = {};
  dated.forEach((g) => {
    const key = g.text.trim().toLowerCase();
    if (!key) return;
    if (!groups[key]) groups[key] = { label: g.text.trim(), total: 0, done: 0, doneDates: [] };
    groups[key].total += 1;
    if (g.done) { groups[key].done += 1; groups[key].doneDates.push(g.doneDate || g.date); }
  });
  const groupList = Object.values(groups).sort((a, b) => b.total - a.total);

  // นับ streak ปัจจุบัน (ทำต่อเนื่องกี่วันจนถึงวันนี้/เมื่อวาน)
  const calcStreak = (doneDates) => {
    const set = new Set(doneDates);
    let streak = 0; let d = new Date();
    if (!set.has(todayStr())) d.setDate(d.getDate() - 1); // ถ้าวันนี้ยังไม่ทำ เริ่มนับจากเมื่อวาน
    while (set.has(d.toISOString().slice(0, 10))) { streak++; d.setDate(d.getDate() - 1); }
    return streak;
  };

  // heatmap ปฏิทิน 12 สัปดาห์ล่าสุด (คล้าย GitHub contribution graph)
  const days = []; for (let i = 83; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push(d.toISOString().slice(0, 10)); }
  const doneCountByDate = {};
  dated.forEach((g) => { if (g.done) { const dd = g.doneDate || g.date; doneCountByDate[dd] = (doneCountByDate[dd] || 0) + 1; } });
  const maxCount = Math.max(1, ...Object.values(doneCountByDate));
  const weeks = []; for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  // กราฟแท่งแนวโน้ม 14 วันล่าสุด
  const trend = days.slice(-14).map((d) => { const dt = new Date(d); return { label: `${dt.getDate()}/${dt.getMonth() + 1}`, สำเร็จ: doneCountByDate[d] || 0 }; });

  const heatColor = (n) => {
    if (!n) return t.star ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.05)";
    const ratio = n / maxCount;
    return `${t.accent}${Math.round(30 + ratio * 70).toString(16).padStart(2, "0")}`;
  };

  // ✏️ แก้ไขย้อนหลัง: สลับสถานะสำเร็จ/ไม่สำเร็จของวันในอดีต (สร้างแถวใหม่ให้ถ้าวันนั้นยังไม่เคยมีเลย)
  const toggleRetroDate = async (label, date) => {
    const existing = dated.find((g) => g.text.trim().toLowerCase() === label.toLowerCase() && g.date === date);
    if (existing) {
      const nextDone = !existing.done;
      setGoals((gs) => gs.map((g) => (g.id === existing.id ? { ...g, done: nextDone, doneDate: nextDone ? date : null } : g)));
      if (userId) await supabase.from("goals").update({ done: nextDone, done_date: nextDone ? date : null }).eq("id", existing.id);
    } else {
      const newGoal = { id: uid(), text: label, date, done: true, doneDate: date };
      setGoals((gs) => [...gs, newGoal]);
      if (userId) await supabase.from("goals").insert({ id: newGoal.id, user_id: userId, text: label, date, done: true, done_date: date }).then(() => {}, () => {});
    }
  };

  return (
    <>
      <PageHead t={t} title="รายงานเป้าหมาย" sub="ย้อนดูว่าแต่ละวันทำอะไรไปบ้าง ทำบ่อยแค่ไหน" icon={<Target size={20} color={t.accent} />} />

      {dated.length === 0 ? (
        <Empty t={t} text="ยังไม่มีข้อมูลเป้าหมายให้ดูย้อนหลัง ลองเพิ่ม/ติ๊กเป้าหมายที่หน้า Home ก่อนนะ" />
      ) : (
        <>
          <div style={{ ...card(t), padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: t.text, marginBottom: 10 }}>ภาพรวม 12 สัปดาห์ล่าสุด</div>
            <div style={{ display: "flex", gap: 3, overflowX: "auto", paddingBottom: 4 }}>
              {weeks.map((week, wi) => (
                <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {week.map((d) => (
                    <div key={d} title={`${d}: ทำสำเร็จ ${doneCountByDate[d] || 0} อย่าง`} style={{ width: 12, height: 12, borderRadius: 3, background: heatColor(doneCountByDate[d]) }} />
                  ))}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 10, color: t.faint, marginTop: 8 }}>สีเข้ม = วันที่ทำสำเร็จเยอะ · สีจาง/ว่าง = ยังไม่ได้ทำ</div>
          </div>

          <div style={{ ...card(t), padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: t.text, marginBottom: 10 }}>แนวโน้ม 14 วันล่าสุด</div>
            <div style={{ width: "100%", height: 140 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend}>
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: t.sub }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="สำเร็จ" fill={t.accent} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ fontSize: 13, fontWeight: 800, color: t.sub, margin: "4px 0 10px" }}>เป้าหมายที่ทำบ่อย ({groupList.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {groupList.map((g, i) => {
              const pct = Math.round((g.done / g.total) * 100);
              const streak = calcStreak(g.doneDates);
              const isOpen = expandedGroup === g.label;
              // สร้างช่วง log ย้อนหลัง 21 วัน (หรือตั้งแต่เริ่มมีเป้าหมายนี้ ถ้าใหม่กว่า)
              const firstDate = dated.filter((x) => x.text.trim().toLowerCase() === g.label.toLowerCase()).map((x) => x.date).sort()[0];
              const daysBack = firstDate ? Math.min(21, Math.round((new Date() - new Date(firstDate)) / 86400000) + 1) : 21;
              const logDates = Array.from({ length: daysBack }, (_, k) => { const d = new Date(); d.setDate(d.getDate() - (daysBack - 1 - k)); return d.toISOString().slice(0, 10); });
              return (
                <div key={i} style={{ ...card(t), padding: 14 }}>
                  <button onClick={() => setExpandedGroup(isOpen ? null : g.label)} style={{ width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: t.text, display: "flex", alignItems: "center", gap: 6 }}>{g.label} <ChevronRight size={13} color={t.faint} style={{ transform: isOpen ? "rotate(90deg)" : "none", transition: "transform .15s" }} /></div>
                      {streak > 0 && <span style={{ fontSize: 10.5, fontWeight: 800, color: t.accent, background: `${t.accent}18`, padding: "2px 8px", borderRadius: 10, flexShrink: 0, whiteSpace: "nowrap" }}>🔥 {streak} วันติด</span>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                      <div style={{ flex: 1, height: 7, borderRadius: 4, background: "rgba(0,0,0,.08)", overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", background: t.accent }} /></div>
                      <span style={{ fontSize: 11.5, color: t.sub, flexShrink: 0 }}>{g.done}/{g.total} วัน ({pct}%)</span>
                    </div>
                  </button>
                  {isOpen && (
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${t.border}` }}>
                      <div style={{ fontSize: 10.5, color: t.faint, marginBottom: 8 }}>แตะวันไหนก็ได้เพื่อทำเครื่องหมายสำเร็จ/ยกเลิกย้อนหลัง (เผื่อลืมติ๊กหรืออยากเติมให้ครบ)</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {logDates.map((d) => {
                          const row = dated.find((x) => x.text.trim().toLowerCase() === g.label.toLowerCase() && x.date === d);
                          const isDone = row?.done;
                          const dt = new Date(d);
                          return (
                            <button key={d} onClick={() => toggleRetroDate(g.label, d)} title={d} style={{ width: 34, height: 34, borderRadius: 9, border: `1.5px solid ${isDone ? t.accent : t.border}`, background: isDone ? t.accent : "none", color: isDone ? t.onAccent : t.faint, cursor: "pointer", fontSize: 10, fontWeight: 700, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", lineHeight: 1.1 }}>
                              <span>{dt.getDate()}</span>
                              {isDone && <Check size={9} />}
                            </button>
                          );
                        })}
                      </div>
                      {firstDate && <div style={{ fontSize: 10, color: t.faint, marginTop: 10 }}>เริ่มตั้งเป้าหมายนี้ครั้งแรก: {new Date(firstDate).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

function EditTxModal({ t, x, categories, userId, setTx, close }) {
  const [type, setType] = useState(x.type);
  const [cat, setCat] = useState(x.cat);
  const [amount, setAmount] = useState(String(x.amount));
  const [note, setNote] = useState(x.note);
  const [date, setDate] = useState(x.date);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const a = parseFloat(amount);
    if (!a || a <= 0) return;
    setBusy(true);
    const updated = { type, cat, amount: a, note: note.trim() || findCat(categories, cat).label, date };
    setTx((l) => l.map((y) => (y.id === x.id ? { ...y, ...updated } : y)));
    if (userId) await supabase.from("transactions").update(updated).eq("id", x.id);
    setBusy(false);
    close();
  };

  return (
    <ModalPortal>
      <div style={overlay} onClick={close}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "24px 24px 0 0", padding: "20px 20px 28px", maxHeight: "88vh", overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: t.text }}>แก้ไขรายการ</div>
            <button onClick={close} style={ghost}><X size={20} color={t.sub} /></button>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {[["out", "จ่ายออก"], ["in", "รับเข้า"]].map(([v, lb]) => (
              <button key={v} onClick={() => setType(v)} style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: `1.5px solid ${type === v ? (v === "in" ? "#2E9E6B" : "#D9534F") : t.border}`, background: type === v ? (v === "in" ? "#2E9E6B18" : "#D9534F18") : "transparent", color: type === v ? (v === "in" ? "#2E9E6B" : "#D9534F") : t.sub, fontWeight: 700, cursor: "pointer" }}>{lb}</button>
            ))}
          </div>
          <select value={cat || ""} onChange={(e) => setCat(e.target.value)} style={{ ...input(t), marginBottom: 10 }}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" placeholder="จำนวนเงิน" style={{ ...input(t), marginBottom: 10, fontSize: 18, fontWeight: 700 }} />
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="รายละเอียด" style={{ ...input(t), marginBottom: 10 }} />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...input(t), marginBottom: 16 }} />
          <button onClick={save} disabled={busy} style={{ ...primaryBtn({ accent: t.accent, accent2: t.accent2, onAccent: t.onAccent }), width: "100%", padding: "13px 0" }}>{busy ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}</button>
        </div>
      </div>
    </ModalPortal>
  );
}


function AddTxModal({ t, tx, setTx, categories, moveCategory, deleteCategory, addCategory, userId, close }) {
  const [type, setType] = useState("out");
  const [cat, setCat] = useState(null); // ไม่ default หมวดหมู่ไว้แล้ว ต้องให้ผู้ใช้เลือกเอง
  const [catError, setCatError] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayStr());
  const [manageOpen, setManageOpen] = useState(false);
  const [amountSign, setAmountSign] = useState("+"); // โหมดกดปุ่มลัด: บวกเพิ่ม หรือ ลบออก จากยอดปัจจุบัน
  const quickAmounts = [10, 100, 500, 1000, 5000, 10000];
  const applyQuick = (v) => {
    setAmount((prev) => {
      const cur = parseFloat(prev) || 0;
      const next = amountSign === "+" ? cur + v : Math.max(0, cur - v);
      return String(next);
    });
  };

  const add = () => {
    const a = parseFloat(amount);
    if (!a || a <= 0) return;
    if (!cat) { setCatError(true); return; }
    const finalNote = note.trim() || findCat(categories, cat).label;
    const newTx = { id: uid(), type, cat, amount: a, note: finalNote, date };
    setTx((l) => [newTx, ...l]);
    if (userId) supabase.from("transactions").insert({ id: newTx.id, user_id: userId, type: newTx.type, cat: newTx.cat, amount: newTx.amount, note: newTx.note, date: newTx.date }).then(() => {}, () => {});
    close();
  };

  return (
    <div style={overlay} onClick={close}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "24px 24px 0 0", padding: "20px 20px 28px", maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: t.text }}>เพิ่มรายการ</div>
          <button onClick={close} style={ghost}><X size={20} color={t.sub} /></button>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {[["out", "จ่ายออก", "#D9534F"], ["in", "รับเข้า", "#2E9E6B"]].map(([v, lb, c]) => (
            <button key={v} onClick={() => { setType(v); setCat(null); setCatError(false); }} style={{ flex: 1, padding: "10px 0", borderRadius: 12, cursor: "pointer", border: `1.5px solid ${type === v ? c : t.border}`, fontWeight: 700, fontSize: 13.5, background: type === v ? c : "transparent", color: type === v ? "#fff" : t.sub }}>{lb}</button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: catError ? "#D9534F" : t.sub }}>หมวดหมู่ {catError && "— กรุณาเลือกก่อนบันทึก"}</div>
          <button onClick={() => setManageOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11.5, color: t.accent, fontWeight: 700 }}>จัดการหมวดหมู่</button>
        </div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6, marginBottom: 14 }}>
          {catList(categories, type).map((c) => { const Ic = ICONS[c.iconKey] || Wallet; const on = cat === c.id; return (
            <button key={c.id} onClick={() => { setCat(c.id); setCatError(false); }} style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer", background: "none", border: "none" }}>
              <span style={{ width: 48, height: 48, borderRadius: 15, display: "grid", placeItems: "center", background: on ? c.color : `${c.color}20`, border: catError && !on ? `1.5px dashed ${t.faint}` : "none", transition: "all .15s" }}><Ic size={21} color={on ? "#fff" : c.color} /></span>
              <span style={{ fontSize: 10, color: on ? t.text : t.sub, fontWeight: on ? 700 : 500 }}>{c.label}</span>
            </button>
          ); })}
        </div>
        <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="จำนวนเงิน (บาท)" style={{ ...input(t), marginBottom: 8, fontSize: 18, fontWeight: 700 }} />
        <div style={{ display: "flex", gap: 6, marginBottom: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", border: `1px solid ${t.border}`, flexShrink: 0 }}>
            <button onClick={() => setAmountSign("+")} style={{ width: 30, padding: "5px 0", border: "none", cursor: "pointer", background: amountSign === "+" ? "#2E9E6B" : t.inputBg, color: amountSign === "+" ? "#fff" : t.sub, fontWeight: 800, fontSize: 14 }}>+</button>
            <button onClick={() => setAmountSign("-")} style={{ width: 30, padding: "5px 0", border: "none", cursor: "pointer", background: amountSign === "-" ? "#D9534F" : t.inputBg, color: amountSign === "-" ? "#fff" : t.sub, fontWeight: 800, fontSize: 14 }}>−</button>
          </div>
          {quickAmounts.map((v) => (
            <button key={v} onClick={() => applyQuick(v)} style={{ padding: "5px 12px", borderRadius: 10, border: `1px solid ${t.border}`, background: t.inputBg, color: t.sub, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{amountSign}{v.toLocaleString()}</button>
          ))}
          <button onClick={() => setAmount("")} style={{ padding: "5px 10px", borderRadius: 10, border: "none", background: "none", color: t.faint, fontSize: 11, cursor: "pointer" }}>ล้าง</button>
        </div>
        <div style={{ fontSize: 10.5, color: t.faint, marginTop: -6, marginBottom: 10 }}>เลือกโหมด + หรือ − แล้วกดปุ่มตัวเลขซ้ำๆ เพื่อสะสมยอดได้เลย เช่น กด +100 สามครั้ง = 300</div>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="รายละเอียด (ไม่ใส่ก็ได้)" style={{ ...input(t), marginBottom: 10 }} />
        <div style={{ fontSize: 12, fontWeight: 700, color: t.sub, marginBottom: 6 }}>วันที่ (ย้อนหลังได้)</div>
        <input value={date} onChange={(e) => setDate(e.target.value)} type="date" style={{ ...input(t), marginBottom: 16 }} />
        <button onClick={add} style={{ ...primaryBtn({ accent: t.accent, accent2: t.accent2, onAccent: t.onAccent }), width: "100%", padding: "13px 0", fontSize: 15 }}>บันทึก</button>
      </div>
      {manageOpen && <CategoryManagerModal t={t} categories={categories} moveCategory={moveCategory} deleteCategory={deleteCategory} addCategory={addCategory} close={() => setManageOpen(false)} />}
    </div>
  );
}

function CategoryManagerModal({ t, categories, moveCategory, deleteCategory, addCategory, close }) {
  const [kind, setKind] = useState("out");
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newIcon, setNewIcon] = useState(ICON_KEYS[0]);
  const [newColor, setNewColor] = useState(CAT_COLORS[0]);
  const [confirmDel, setConfirmDel] = useState(null); // id ที่กำลังถามยืนยันลบ (กดสองครั้ง กันลบพลาด)

  const list = catList(categories, kind);
  const submitNew = () => {
    if (!newLabel.trim()) return;
    addCategory({ label: newLabel, iconKey: newIcon, color: newColor, kind });
    setNewLabel(""); setAdding(false);
  };

  return (
    <div style={{ ...overlay, zIndex: 60 }} onClick={close}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "24px 24px 0 0", padding: "20px 20px 28px", maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: t.text }}>จัดการหมวดหมู่</div>
          <button onClick={close} style={ghost}><X size={20} color={t.sub} /></button>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {[["out", "จ่ายออก", "#D9534F"], ["in", "รับเข้า", "#2E9E6B"]].map(([v, lb, c]) => (
            <button key={v} onClick={() => setKind(v)} style={{ flex: 1, padding: "9px 0", borderRadius: 12, cursor: "pointer", border: `1.5px solid ${kind === v ? c : t.border}`, fontWeight: 700, fontSize: 13, background: kind === v ? c : "transparent", color: kind === v ? "#fff" : t.sub }}>{lb}</button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          {list.map((c, i) => { const Ic = ICONS[c.iconKey] || Wallet; return (
            <div key={c.id} style={{ ...card(t), padding: "9px 12px", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 34, height: 34, borderRadius: 11, background: `${c.color}22`, display: "grid", placeItems: "center", flexShrink: 0 }}><Ic size={16} color={c.color} /></span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: t.text }}>{c.label}</span>
              <button onClick={() => moveCategory(c.id, -1)} disabled={i === 0} style={{ ...ghost, opacity: i === 0 ? 0.3 : 1 }}>▲</button>
              <button onClick={() => moveCategory(c.id, 1)} disabled={i === list.length - 1} style={{ ...ghost, opacity: i === list.length - 1 ? 0.3 : 1 }}>▼</button>
              {confirmDel === c.id ? (
                <button onClick={() => { deleteCategory(c.id); setConfirmDel(null); }} style={{ ...ghost, color: "#D9534F", fontSize: 11, fontWeight: 700 }}>ยืนยันลบ?</button>
              ) : (
                <button onClick={() => setConfirmDel(c.id)} style={ghost}><Trash2 size={15} color={t.faint} /></button>
              )}
            </div>
          ); })}
          {list.length === 0 && <Empty t={t} text="ยังไม่มีหมวดหมู่ในฝั่งนี้" />}
        </div>

        {!adding ? (
          <button onClick={() => setAdding(true)} style={{ ...card(t), width: "100%", padding: "11px 0", border: `1.5px dashed ${t.border}`, cursor: "pointer", color: t.sub, fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Plus size={16} /> เพิ่มหมวดหมู่ใหม่</button>
        ) : (
          <div style={{ ...card(t), padding: 14 }}>
            <input autoFocus value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="ชื่อหมวดหมู่" style={{ ...input(t), marginBottom: 10 }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: t.sub, marginBottom: 6 }}>เลือกไอคอน</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              {ICON_KEYS.map((k) => { const Ic = ICONS[k]; const on = newIcon === k; return (
                <button key={k} onClick={() => setNewIcon(k)} style={{ width: 32, height: 32, borderRadius: 10, border: `1.5px solid ${on ? t.accent : t.border}`, background: on ? `${t.accent}22` : "none", cursor: "pointer", display: "grid", placeItems: "center" }}><Ic size={15} color={on ? t.accent : t.sub} /></button>
              ); })}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: t.sub, marginBottom: 6 }}>เลือกสี</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
              {CAT_COLORS.map((c) => (
                <button key={c} onClick={() => setNewColor(c)} style={{ width: 26, height: 26, borderRadius: 13, background: c, border: newColor === c ? `2.5px solid ${t.text}` : "2.5px solid transparent", cursor: "pointer" }} />
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setAdding(false)} style={{ ...card(t), flex: 1, padding: "9px 0", border: `1px solid ${t.border}`, cursor: "pointer", color: t.sub, fontWeight: 700, fontSize: 13 }}>ยกเลิก</button>
              <button onClick={submitNew} style={{ ...primaryBtn({ accent: t.accent, accent2: t.accent2, onAccent: t.onAccent }), flex: 1, padding: "9px 0", fontSize: 13 }}>สร้าง</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ExportModal({ t, text, close }) {
  return (
    <div style={overlay} onClick={close}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "24px 24px 0 0", padding: "20px 20px 28px", maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: t.text }}>Export CSV</div>
          <button onClick={close} style={ghost}><X size={20} color={t.sub} /></button>
        </div>
        <div style={{ fontSize: 12, color: t.sub, marginBottom: 10 }}>คัดลอกข้อความด้านล่าง วางใน Excel / Notion ได้เลย</div>
        <textarea readOnly value={text} rows={7} style={{ ...input(t), fontFamily: "monospace", fontSize: 11 }} />
        <button onClick={() => { navigator.clipboard?.writeText(text); }} style={{ ...primaryBtn({ accent: t.accent, accent2: t.accent2, onAccent: t.onAccent }), width: "100%", padding: "11px 0", marginTop: 10 }}>คัดลอกทั้งหมด</button>
      </div>
    </div>
  );
}

const dateLabel = (d) => { const today = todayStr(); const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10); if (d === today) return "วันนี้"; if (d === y) return "เมื่อวาน"; const dt = new Date(d); return `${dt.getDate()} ${["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."][dt.getMonth()]}`; };

// ---------------- Note ----------------
// 📝 ตัว editor แบบ Notion — mount ใหม่ทุกครั้งที่ note เปลี่ยน (ใช้ key จากภายนอกคุมการรีเซ็ต)
function NoteEditor({ content, onChange, theme, userId }) {
  const editor = useCreateBlockNote({
    initialContent: migrateBody(content),
    uploadFile: async (file) => {
      try {
        const path = `${userId || "anon"}/${uid()}-${file.name}`;
        const { error } = await supabase.storage.from("attachments").upload(path, file);
        if (error) throw error;
        const { data } = supabase.storage.from("attachments").getPublicUrl(path);
        return data.publicUrl;
      } catch (e) {
        alert("แนบไฟล์ไม่สำเร็จ: " + e.message + " (เช็คว่าสร้าง Storage bucket ชื่อ 'attachments' ใน Supabase แล้วหรือยัง)");
        throw e;
      }
    },
  });
  return <BlockNoteView editor={editor} theme={theme} onChange={() => onChange(editor.document)} />;
}

function NotionSetupModal({ t, userId, close }) {
  const [tokenVal, setTokenVal] = useState("");
  const [dbId, setDbId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    supabase.from("notion_configs").select("*").eq("user_id", userId).maybeSingle().then(({ data, error }) => {
      if (error) console.error("โหลดการตั้งค่า Notion ไม่สำเร็จ:", error.message);
      if (data) { setTokenVal(data.notion_token || ""); setDbId(data.notion_database_id || ""); }
      setLoading(false);
    });
  }, [userId]);

  const save = async () => {
    setSaving(true); setMsg("");
    const { error } = await supabase.from("notion_configs").upsert({ user_id: userId, notion_token: tokenVal.trim(), notion_database_id: dbId.trim(), updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    setSaving(false);
    setMsg(error ? "บันทึกไม่สำเร็จ: " + error.message : "บันทึกแล้ว ✓ ลองกด Sync Notion ได้เลย");
  };

  return (
    <div style={overlay} onClick={close}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "24px 24px 0 0", padding: 20, maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: t.text }}>ตั้งค่า Notion ของฉัน</div>
          <button onClick={close} style={ghost}><X size={20} color={t.sub} /></button>
        </div>
        <div style={{ fontSize: 11.5, color: t.sub, lineHeight: 1.7, marginBottom: 16, background: t.inputBg, borderRadius: 12, padding: 12 }}>
          <b>วิธีตั้งค่า (ทำครั้งเดียว):</b><br />
          1. ไปที่ <b>notion.so/my-integrations</b> กด "New integration" ตั้งชื่ออะไรก็ได้ → copy "Internal Integration Secret" มาใส่ช่องแรกด้านล่าง<br />
          2. สร้างหน้า Database ใน Notion ต้องมีคอลัมน์: Name (Title), Tags (Multi-select), Pinned (Checkbox), Date (Date)<br />
          3. เปิดหน้า database นั้น กด "..." มุมขวาบน → Connections → เชื่อม Integration ที่สร้างไว้ในข้อ 1<br />
          4. Copy "Database ID" จาก URL ของหน้านั้น (ชุดตัวอักษร/ตัวเลขยาวๆ ก่อนเครื่องหมาย ? ) มาใส่ช่องที่สอง
        </div>
        {loading ? <Empty t={t} text="กำลังโหลด..." /> : (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, color: t.sub, marginBottom: 6 }}>Notion Integration Secret</div>
            <input type="password" value={tokenVal} onChange={(e) => setTokenVal(e.target.value)} placeholder="ntn_xxxxxxxxxxxxx" style={{ ...input(t), marginBottom: 12 }} />
            <div style={{ fontSize: 12, fontWeight: 700, color: t.sub, marginBottom: 6 }}>Notion Database ID</div>
            <input value={dbId} onChange={(e) => setDbId(e.target.value)} placeholder="เช่น a1b2c3d4e5f6..." style={{ ...input(t), marginBottom: 16 }} />
            {msg && <div style={{ fontSize: 11.5, color: msg.startsWith("บันทึกไม่สำเร็จ") ? "#D9534F" : "#2E9E6B", marginBottom: 12 }}>{msg}</div>}
            <button onClick={save} disabled={saving} style={{ ...primaryBtn({ accent: t.accent, accent2: t.accent2, onAccent: t.onAccent }), width: "100%", padding: "12px 0" }}>{saving ? "กำลังบันทึก..." : "บันทึก"}</button>
          </>
        )}
      </div>
    </div>
  );
}

function NotePage({ t, notes, setNotes, isNight, userId, session, authProfile }) {

  const [title, setTitle] = useState(""); const [body, setBody] = useState(null); const [tagsInput, setTagsInput] = useState("");
  const [draftKey, setDraftKey] = useState(0); // เปลี่ยนค่านี้เพื่อบังคับให้ NoteEditor ตัวเพิ่มโน้ตใหม่รีเซ็ตเนื้อหาว่าง
  const [editingId, setEditingId] = useState(null);
  const [viewingId, setViewingId] = useState(null); // โน้ตที่กำลังกางดูเต็มๆ (อ่านอย่างเดียว แยกจากโหมดแก้ไข)
  const [editTitle, setEditTitle] = useState(""); const [editBody, setEditBody] = useState(null); const [editTags, setEditTags] = useState("");
  const [tagFilter, setTagFilter] = useState(null);

  const parseTags = (str) => str.split(",").map((s) => s.trim()).filter(Boolean);

  const add = () => {
    const plain = blocksToPlainText(body).trim();
    if (!title.trim() && !plain) return;
    const newNote = { id: uid(), title: title.trim(), body: body || migrateBody(""), date: todayStr(), pinned: false, tags: parseTags(tagsInput) };
    setNotes((n) => [newNote, ...n]);
    if (userId) supabase.from("notes").insert({ id: newNote.id, user_id: userId, title: newNote.title, body: newNote.body, date: newNote.date, pinned: newNote.pinned, tags: newNote.tags }).then(() => {}, () => {});
    setTitle(""); setBody(null); setTagsInput(""); setDraftKey((k) => k + 1);
  };
  const startEdit = (n) => { setEditingId(n.id); setEditTitle(n.title); setEditBody(migrateBody(n.body)); setEditTags((n.tags || []).join(", ")); };
  const saveEdit = () => {
    const newTitle = editTitle.trim(), newTags = parseTags(editTags);
    setNotes((list) => list.map((n) => (n.id === editingId ? { ...n, title: newTitle, body: editBody, tags: newTags } : n)));
    if (userId) supabase.from("notes").update({ title: newTitle, body: editBody, tags: newTags }).eq("id", editingId).then(() => {}, () => {});
    setEditingId(null);
  };
  const togglePin = (id) => {
    const target = notes.find((n) => n.id === id);
    if (!target) return;
    const nextPinned = !target.pinned;
    setNotes((list) => list.map((n) => (n.id === id ? { ...n, pinned: nextPinned } : n)));
    if (userId) supabase.from("notes").update({ pinned: nextPinned }).eq("id", id).then(() => {}, () => {});
  };

  // 📤 Export เป็น Markdown — Notion ลากไฟล์ .md ไป import ตรงๆ ได้เลย (ใช้ได้ทันทีไม่ต้องรอ deploy)
  // 👁️ render โน้ตแบบอ่านอย่างเดียว (ใช้ตอนกดดูโน้ตเฉยๆ ไม่ใช่โหมดแก้ไข)
  const renderBlockView = (b, depth = 0) => {
    const text = Array.isArray(b.content) ? b.content.map((c) => c.text || "").join("") : (typeof b.content === "string" ? b.content : "");
    const kids = (b.children || []).length > 0 && (
      <div style={{ marginLeft: 16 }}>{b.children.map((c, i) => <div key={i}>{renderBlockView(c, depth + 1)}</div>)}</div>
    );
    let inner;
    if (b.type === "heading") inner = <div style={{ fontSize: 22 - Math.min(Math.max(b.props?.level || 2, 1), 6) * 2, fontWeight: 800, margin: "6px 0" }}>{text}</div>;
    else if (b.type === "bulletListItem") inner = <div style={{ display: "flex", gap: 8 }}><span>•</span><span>{text}</span></div>;
    else if (b.type === "numberedListItem") inner = <div style={{ display: "flex", gap: 8 }}><span>·</span><span>{text}</span></div>;
    else if (b.type === "checkListItem") inner = <div style={{ display: "flex", gap: 8 }}><span>{b.props?.checked ? "☑" : "☐"}</span><span style={{ textDecoration: b.props?.checked ? "line-through" : "none", opacity: b.props?.checked ? 0.6 : 1 }}>{text}</span></div>;
    else if (b.type === "toggleListItem") inner = <div style={{ fontWeight: 700 }}>▸ {text}</div>;
    else if (b.type === "image") inner = <img src={b.props?.url} alt={b.props?.name || ""} style={{ maxWidth: "100%", borderRadius: 8, display: "block", margin: "4px 0" }} />;
    else if (b.type === "file") inner = <a href={b.props?.url} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>📎 {b.props?.name || "ไฟล์แนบ"}</a>;
    else inner = <div>{text}</div>;
    return (<>{inner}{kids}</>);
  };


  const blockToMd = (b, depth) => {
    const text = Array.isArray(b.content) ? b.content.map((c) => c.text || "").join("") : (typeof b.content === "string" ? b.content : "");
    const indent = "  ".repeat(depth);
    let line;
    if (b.type === "heading") line = `${"#".repeat(Math.min(Math.max(b.props?.level || 2, 1), 6))} ${text}`;
    else if (b.type === "bulletListItem") line = `${indent}- ${text}`;
    else if (b.type === "numberedListItem") line = `${indent}1. ${text}`;
    else if (b.type === "checkListItem") line = `${indent}- [${b.props?.checked ? "x" : " "}] ${text}`;
    else if (b.type === "toggleListItem") line = `${indent}> ${text}`;
    else if (b.type === "image") line = `![${b.props?.name || "รูปภาพ"}](${b.props?.url || ""})`;
    else if (b.type === "file") line = `[📎 ${b.props?.name || "ไฟล์แนบ"}](${b.props?.url || ""})`;
    else line = text;
    const kids = (b.children || []).map((c) => blockToMd(c, depth + 1)).join("\n");
    return kids ? line + "\n" + kids : line;
  };
  const noteToMd = (n) => {
    const bodyMd = migrateBody(n.body).map((b) => blockToMd(b, 0)).join("\n");
    return `# ${n.title || "(ไม่มีหัวข้อ)"}\n\n${bodyMd}\n\n${(n.tags || []).map((tg) => "#" + tg).join(" ")}\n\n_บันทึกเมื่อ ${n.date}_\n`;
  };
  // เติม UTF-8 BOM (\uFEFF) นำหน้าไฟล์เสมอ กันโปรแกรมเปิดไฟล์ (เช่น Notepad บน Windows) เดา encoding ผิด
  // จนภาษาไทยในไฟล์กลายเป็นตัวอักษรยึกยือ (ปัญหานี้เกิดกับไฟล์ .md/.txt ภาษาไทยบ่อยมาก โดยเฉพาะไม่มี BOM กำกับ)
  const downloadText = (filename, text, mime) => { try { const blob = new Blob(["\uFEFF" + text], { type: mime }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); } catch (e) {} };
  const exportAllMd = () => downloadText("refhub-notes.md", notes.map(noteToMd).join("\n---\n\n"), "text/markdown;charset=utf-8;");
  const exportOneMd = (n) => downloadText(`${(n.title || "note").slice(0, 40).replace(/[\\/:*?"<>|]/g, "")}.md`, noteToMd(n), "text/markdown;charset=utf-8;");

  // 🔗 Sync ขึ้น Notion ของตัวเอง (ต้องตั้งค่า Notion token/database ของตัวเองก่อนที่ปุ่ม ⚙️ ข้างล่างนี้)
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);
  const [showNotionSetup, setShowNotionSetup] = useState(false);
  const syncToNotion = async () => {
    const pending = notes.filter((n) => !n.notionId); // sync เฉพาะโน้ตที่ยังไม่เคยส่งไป (กันสร้างซ้ำ)
    if (pending.length === 0) { setSyncMsg("ไม่มีโน้ตใหม่ที่ต้อง sync"); setTimeout(() => setSyncMsg(null), 2500); return; }
    setSyncing(true); setSyncMsg(null);
    try {
      const r = await fetch("/api/notion-sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notes: pending, userId, callerToken: session?.access_token }) });
      const data = await r.json();
      if (!r.ok) { setSyncMsg("Sync ไม่สำเร็จ: " + (data.error || "unknown error")); return; }
      const okMap = Object.fromEntries((data.results || []).filter((x) => x.ok).map((x) => [x.id, x.notionId]));
      setNotes((list) => list.map((n) => (okMap[n.id] ? { ...n, notionId: okMap[n.id] } : n)));
      if (userId) Object.entries(okMap).forEach(([id, notionId]) => { supabase.from("notes").update({ notion_id: notionId }).eq("id", id).then(() => {}, () => {}); });
      const failed = (data.results || []).filter((x) => !x.ok);
      setSyncMsg(failed.length ? `sync สำเร็จ ${Object.keys(okMap).length} อัน, พลาด ${failed.length} อัน` : `sync ขึ้น Notion สำเร็จ ${Object.keys(okMap).length} อัน ✓`);
    } catch (e) {
      setSyncMsg("เชื่อมต่อ /api/notion-sync ไม่ได้ (ต้อง deploy ขึ้น Vercel ก่อนถึงจะมี endpoint นี้)");
    } finally { setSyncing(false); }
  };

  const allTags = [...new Set(notes.flatMap((n) => n.tags || []))];
  const shown = [...notes]
    .filter((n) => !tagFilter || (n.tags || []).includes(tagFilter))
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  const editorTheme = isNight ? "dark" : "light";

  return (
    <>
      <PageHead t={t} title="โน้ต" sub="จดไอเดีย บันทึกการเรียนรู้ · แนบรูป/ไฟล์ได้" icon={<StickyNote size={20} color={t.accent} />} />

      {notes.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <button onClick={exportAllMd} style={{ ...card(t), flex: 1, padding: "9px 0", border: `1px solid ${t.border}`, cursor: "pointer", color: t.text, fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><FileText size={14} color={t.accent} /> Export .md</button>
          {authProfile?.role === "admin" && (
            <>
              <button onClick={syncToNotion} disabled={syncing} style={{ ...card(t), flex: 1, padding: "9px 0", border: `1px solid ${t.border}`, cursor: syncing ? "default" : "pointer", color: t.text, fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: syncing ? 0.6 : 1 }}>{syncing ? "กำลัง sync..." : "🔗 Sync Notion"}</button>
              <button onClick={() => setShowNotionSetup(true)} style={{ ...card(t), width: 38, border: `1px solid ${t.border}`, cursor: "pointer", display: "grid", placeItems: "center" }} title="ตั้งค่า Notion ของตัวเอง"><KeyRound size={15} color={t.sub} /></button>
            </>
          )}
        </div>
      )}
      {syncMsg && <div style={{ fontSize: 11, color: t.sub, textAlign: "center", marginBottom: 12 }}>{syncMsg}</div>}
      {showNotionSetup && <NotionSetupModal t={t} userId={userId} close={() => setShowNotionSetup(false)} />}

      <div style={{ ...card(t), padding: 16 }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="หัวข้อ" style={{ ...input(t), marginBottom: 8, fontWeight: 700 }} />
        <div style={{ border: `1px solid ${t.border}`, borderRadius: 12, marginBottom: 8, minHeight: 140, overflow: "hidden" }}>
          <NoteEditor key={`new-${draftKey}`} content={null} onChange={setBody} theme={editorTheme} userId={userId} />
        </div>
        <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="แท็ก (คั่นด้วยจุลภาค เช่น งาน, ไอเดีย)" style={{ ...input(t), marginBottom: 12, fontSize: 12.5 }} />
        <button onClick={add} style={{ ...primaryBtn({ accent: t.accent, accent2: t.accent2, onAccent: t.onAccent }), width: "100%", padding: "11px 0" }}>บันทึกโน้ต</button>
        <div style={{ fontSize: 10.5, color: t.faint, textAlign: "center", marginTop: 8 }}>พิมพ์ "/" ในกล่องข้อความ เพื่อเลือกหัวข้อ, checklist, toggle, แนบรูป/ไฟล์ ฯลฯ</div>
      </div>

      {allTags.length > 0 && (
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6, marginTop: 14 }}>
          <button onClick={() => setTagFilter(null)} style={{ flexShrink: 0, padding: "6px 12px", borderRadius: 14, cursor: "pointer", fontSize: 11.5, fontWeight: 700, border: `1.5px solid ${!tagFilter ? t.accent : t.border}`, background: !tagFilter ? t.accent : "transparent", color: !tagFilter ? t.onAccent : t.sub }}>ทั้งหมด</button>
          {allTags.map((tag) => (
            <button key={tag} onClick={() => setTagFilter(tag)} style={{ flexShrink: 0, padding: "6px 12px", borderRadius: 14, cursor: "pointer", fontSize: 11.5, fontWeight: 700, border: `1.5px solid ${tagFilter === tag ? t.accent : t.border}`, background: tagFilter === tag ? t.accent : "transparent", color: tagFilter === tag ? t.onAccent : t.sub }}>#{tag}</button>
          ))}
        </div>
      )}

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {shown.length === 0 && <Empty t={t} text="ยังไม่มีโน้ต เริ่มจดอันแรก" />}
        {shown.map((n) => (
          <div key={n.id} style={{ ...card(t), padding: 14, border: `1px solid ${n.pinned ? t.accent : t.border}` }}>
            {editingId === n.id ? (
              <>
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={{ ...input(t), marginBottom: 8, fontWeight: 700 }} />
                <div style={{ border: `1px solid ${t.border}`, borderRadius: 12, marginBottom: 8, minHeight: 140, overflow: "hidden" }}>
                  <NoteEditor key={`edit-${n.id}`} content={editBody} onChange={setEditBody} theme={editorTheme} userId={userId} />
                </div>
                <input value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="แท็ก (คั่นด้วยจุลภาค)" style={{ ...input(t), marginBottom: 10, fontSize: 12.5 }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setEditingId(null)} style={{ ...card(t), flex: 1, padding: "9px 0", border: `1px solid ${t.border}`, cursor: "pointer", color: t.sub, fontWeight: 700, fontSize: 13 }}>ยกเลิก</button>
                  <button onClick={saveEdit} style={{ ...primaryBtn({ accent: t.accent, accent2: t.accent2, onAccent: t.onAccent }), flex: 1, padding: "9px 0", fontSize: 13 }}>บันทึก</button>
                </div>
              </>
            ) : (
              <>
                <div onClick={() => setViewingId(viewingId === n.id ? null : n.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, cursor: "pointer" }}>
                  <div style={{ fontSize: 14.5, fontWeight: 800, color: t.text, display: "flex", alignItems: "center", gap: 6 }}>
                    {n.pinned && <Sparkles size={13} color={t.accent} />}{n.title || "(ไม่มีหัวข้อ)"}
                  </div>
                  <div style={{ display: "flex", gap: 2, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                    {n.notionId && <span title="sync ขึ้น Notion แล้ว" style={{ display: "grid", placeItems: "center", padding: 4 }}><Check size={14} color="#2E9E6B" /></span>}
                    <button onClick={() => exportOneMd(n)} style={ghost} title="Export เป็น Markdown"><Download size={15} color={t.faint} /></button>
                    <button onClick={() => togglePin(n.id)} style={ghost} title="ปักหมุด"><Target size={15} color={n.pinned ? t.accent : t.faint} /></button>
                    <button onClick={() => startEdit(n)} style={ghost} title="แก้ไข"><Pencil size={15} color={t.faint} /></button>
                    <button onClick={() => { setNotes((x) => x.filter((y) => y.id !== n.id)); if (userId) supabase.from("notes").delete().eq("id", n.id).then(() => {}, () => {}); }} style={ghost} title="ลบ"><Trash2 size={15} color={t.faint} /></button>
                  </div>
                </div>
                {viewingId === n.id ? (
                  <div onClick={() => setViewingId(null)} style={{ fontSize: 13, color: t.text, marginTop: 8, lineHeight: 1.6, cursor: "pointer" }}>
                    {migrateBody(n.body).map((b, i) => <div key={i}>{renderBlockView(b)}</div>)}
                  </div>
                ) : (
                  blocksToPlainText(n.body).trim() && <div onClick={() => setViewingId(n.id)} style={{ fontSize: 13, color: t.sub, marginTop: 6, whiteSpace: "pre-wrap", lineHeight: 1.5, maxHeight: 90, overflow: "hidden", cursor: "pointer" }}>{blocksToPlainText(n.body)}</div>
                )}
                {(n.tags || []).length > 0 && (
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 8 }}>
                    {n.tags.map((tag) => <span key={tag} style={{ fontSize: 10, fontWeight: 700, color: t.accent, background: `${t.accent}18`, padding: "2px 8px", borderRadius: 10 }}>#{tag}</span>)}
                  </div>
                )}
                <div style={{ fontSize: 10.5, color: t.faint, marginTop: 8 }}>{n.date}</div>
              </>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

// ---------------- Mock pages ----------------
const KNOWLEDGE_TOPICS = [
  { id: "tech", label: "เทคโนโลยี" }, { id: "health", label: "สุขภาพ" }, { id: "finance", label: "การเงิน" },
  { id: "psychology", label: "จิตวิทยา" }, { id: "history", label: "ประวัติศาสตร์" }, { id: "science", label: "วิทยาศาสตร์" },
  { id: "business", label: "ธุรกิจ" }, { id: "language", label: "ภาษา" }, { id: "art", label: "ศิลปะ" },
  { id: "lifestyle", label: "ไลฟ์สไตล์" }, { id: "environment", label: "สิ่งแวดล้อม" }, { id: "cooking", label: "อาหาร/การทำอาหาร" },
  { id: "travel", label: "ท่องเที่ยว" }, { id: "sports", label: "กีฬา" },
];
const topicLabel = (id) => KNOWLEDGE_TOPICS.find((t) => t.id === id)?.label || id;

function IdeasPage({ t, M, userId, session, authProfile, setAuthProfile, setNotes, setChatOpen, setAskAiTopic }) {
  const [notedIds, setNotedIds] = useState({}); // article.id -> true ถ้าเพิ่งส่งเข้าโน้ตไปแล้ว (โชว์ปุ่มเขียวชั่วคราว)
  const notedTo = (article) => {
    sendToNotes(article);
    setNotedIds((m) => ({ ...m, [article.id]: true }));
    setTimeout(() => setNotedIds((m) => ({ ...m, [article.id]: false })), 2500);
  };
  const askAi = (article) => {
    setAskAiTopic({ title: article.title, bullets: article.bullets });
    setChatOpen(true);
  };
  const interests = authProfile?.interests || [];
  const isAdmin = authProfile?.role === "admin" || authProfile?.role === "trusted";
  const topicLimit = authProfile?.topic_limit ?? (isAdmin ? KNOWLEDGE_TOPICS.length : 3);
  const dailyLimit = authProfile?.daily_article_limit ?? 3;

  const [tab, setTab] = useState("today"); // today | saved
  const [today, setToday] = useState([]);
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genMsg, setGenMsg] = useState("");
  const [expanded, setExpanded] = useState({}); // id -> bool (พับ/กางในคลัง)
  const [pickedInterests, setPickedInterests] = useState(interests);
  const [editingInterests, setEditingInterests] = useState(false);
  const [customTopic, setCustomTopic] = useState("");

  // 🔊 อ่านออกเสียง (ฟรี ใช้ระบบเสียงพูดในตัวเครื่อง/เบราว์เซอร์) + เลือกเสียงได้ จำค่าที่เลือกไว้
  const [voices, setVoices] = useState([]);
  const [voiceURI, setVoiceURI] = useState(() => { try { return localStorage.getItem("refhub:ttsVoice") || ""; } catch (e) { return ""; } });
  const [speakingId, setSpeakingId] = useState(null);
  useEffect(() => {
    if (!window.speechSynthesis) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);
  useEffect(() => { try { localStorage.setItem("refhub:ttsVoice", voiceURI); } catch (e) {} }, [voiceURI]);
  const thaiVoices = voices.filter((v) => v.lang?.toLowerCase().startsWith("th"));
  const otherVoices = voices.filter((v) => !v.lang?.toLowerCase().startsWith("th"));
  const speak = (id, text) => {
    if (!window.speechSynthesis) { alert("เบราว์เซอร์นี้ไม่รองรับการอ่านออกเสียง"); return; }
    if (speakingId === id) { window.speechSynthesis.cancel(); setSpeakingId(null); return; } // กดซ้ำ = หยุด
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = voices.find((x) => x.voiceURI === voiceURI);
    if (v) u.voice = v; else u.lang = "th-TH";
    u.onend = () => setSpeakingId(null);
    u.onerror = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(u);
  };

  const saveInterests = async () => {
    const { data } = await supabase.from("profiles").update({ interests: pickedInterests }).eq("id", userId).select().single();
    if (data) setAuthProfile(data);
    setEditingInterests(false);
  };
  const toggleInterest = (id) => {
    setPickedInterests((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      if (cur.length >= topicLimit) return cur; // เกินโควตา ไม่ให้เพิ่ม
      return [...cur, id];
    });
  };
  const openEditInterests = () => { setPickedInterests(interests); setEditingInterests(true); };
  const addCustomTopic = () => {
    const v = customTopic.trim();
    if (!v || pickedInterests.includes(v) || pickedInterests.length >= topicLimit) return;
    setPickedInterests((cur) => [...cur, v]);
    setCustomTopic("");
  };

  const loadToday = async () => {
    const todayStr2 = todayStr();
    const { data } = await supabase.from("knowledge_articles").select("*").eq("user_id", userId).eq("date", todayStr2).order("created_at", { ascending: true });
    return data || [];
  };
  const loadSaved = async () => {
    const { data } = await supabase.from("knowledge_articles").select("*").eq("user_id", userId).eq("starred", true).order("created_at", { ascending: false });
    setSaved(data || []);
  };

  const generateToday = async () => {
    setGenMsg("กำลังสร้างบทความความรู้วันนี้ให้...");
    try {
      const r = await fetch("/api/knowledge-generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests: interests.map(topicLabel), count: dailyLimit, callerToken: session?.access_token }),
      });
      const data = await r.json();
      if (!r.ok) { setGenMsg("สร้างไม่สำเร็จ: " + data.error); return; }
      const rows = data.articles.map((a) => ({
        user_id: userId, date: todayStr(),
        topic: KNOWLEDGE_TOPICS.find((x) => x.label === a.topic)?.id || interests[0] || null,
        title: a.title, bullets: a.bullets, starred: false,
      }));
      const { data: inserted } = await supabase.from("knowledge_articles").insert(rows).select();
      setToday(inserted || []);
      setGenMsg("");
    } catch (e) { setGenMsg("สร้างไม่สำเร็จ: " + e.message); }
  };

  const [refreshing, setRefreshing] = useState(false);
  const refreshToday = async () => {
    setRefreshing(true);
    try {
      await supabase.from("knowledge_articles").delete().eq("user_id", userId).eq("date", todayStr()).eq("starred", false); // ลบเฉพาะที่ไม่ได้บันทึกดาวไว้ กันบทความที่ชอบหายไป
      await generateToday();
    } finally { setRefreshing(false); }
  };

  useEffect(() => {
    if (!interests.length) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const t2 = await loadToday();
      if (t2.length > 0) { setToday(t2); } else { await generateToday(); }
      await loadSaved();
      setLoading(false);
    })();
  }, [interests.length, userId]);

  const toggleStar = async (article) => {
    const { data } = await supabase.from("knowledge_articles").update({ starred: !article.starred }).eq("id", article.id).select().single();
    if (data) {
      setToday((list) => list.map((x) => (x.id === data.id ? data : x)));
      loadSaved();
    }
  };

  const sendToNotes = (article) => {
    const body = [
      { type: "heading", props: { level: 2 }, content: article.title },
      ...(article.bullets || []).map((b) => ({ type: "bulletListItem", content: b })),
    ];
    const newNote = { id: uid(), title: article.title, body, date: todayStr(), pinned: false, tags: [topicLabel(article.topic)] };
    setNotes((n) => [newNote, ...n]);
    if (userId) supabase.from("notes").insert({ id: newNote.id, user_id: userId, title: newNote.title, body: newNote.body, date: newNote.date, pinned: newNote.pinned, tags: newNote.tags }).then(() => {}, () => {});
  };

  // ยังไม่ได้เลือกความสนใจ (ครั้งแรก) หรือกำลังกดแก้ไขอยู่ -> หน้าตั้งค่าความสนใจ
  if (!interests.length || editingInterests) {
    return (
      <>
        <PageHead t={t} title="คลังความรู้" sub="เลือกความสนใจของคุณก่อนเริ่มได้เลย" icon={<Lightbulb size={20} color={t.accent} />} />
        <div style={{ fontSize: 12.5, color: t.sub, marginBottom: 14 }}>เลือกได้สูงสุด {topicLimit} หมวด (ให้แอดมินเพิ่มโควตาได้ถ้าอยากได้มากกว่านี้)</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {[...KNOWLEDGE_TOPICS, ...pickedInterests.filter((id) => !KNOWLEDGE_TOPICS.some((k) => k.id === id)).map((id) => ({ id, label: id, custom: true }))].map((k) => {
            const on = pickedInterests.includes(k.id);
            const locked = !on && pickedInterests.length >= topicLimit;
            return (
              <button key={k.id} onClick={() => toggleInterest(k.id)} disabled={locked} style={{ padding: "8px 14px", borderRadius: 16, cursor: locked ? "default" : "pointer", border: `1.5px solid ${on ? t.accent : t.border}`, background: on ? t.accent : "transparent", color: on ? t.onAccent : locked ? t.faint : t.sub, fontSize: 12.5, fontWeight: 700, opacity: locked ? 0.5 : 1 }}>{k.label}{k.custom && " ✏️"}</button>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input value={customTopic} onChange={(e) => setCustomTopic(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCustomTopic()} placeholder="พิมพ์หมวดที่อยากได้เอง..." style={input(t)} disabled={pickedInterests.length >= topicLimit} />
          <button onClick={addCustomTopic} disabled={!customTopic.trim() || pickedInterests.length >= topicLimit} style={{ ...primaryBtn({ accent: t.accent, accent2: t.accent2, onAccent: t.onAccent }), padding: "0 16px", opacity: customTopic.trim() && pickedInterests.length < topicLimit ? 1 : 0.5 }}>เพิ่ม</button>
        </div>
        <div style={{ fontSize: 11, color: t.faint, marginBottom: 14 }}>เลือกแล้ว {pickedInterests.length}/{topicLimit}</div>
        <div style={{ display: "flex", gap: 8 }}>
          {interests.length > 0 && <button onClick={() => setEditingInterests(false)} style={{ ...card(t), flex: 1, padding: "12px 0", border: `1px solid ${t.border}`, cursor: "pointer", color: t.sub, fontWeight: 700, fontSize: 13 }}>ยกเลิก</button>}
          <button onClick={saveInterests} disabled={!pickedInterests.length} style={{ ...primaryBtn({ accent: t.accent, accent2: t.accent2, onAccent: t.onAccent }), flex: 2, padding: "12px 0", opacity: pickedInterests.length ? 1 : 0.5 }}>{interests.length > 0 ? "บันทึก" : "เริ่มเลย"}</button>
        </div>
      </>
    );
  }

  const list = tab === "today" ? today : saved;

  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 16 }}>
        <PageHead t={t} title="คลังความรู้" sub={`AI คัดให้ทุกวันตามความสนใจ (${interests.map(topicLabel).join(", ")})`} icon={<Lightbulb size={20} color={t.accent} />} />
        <button onClick={openEditInterests} style={{ ...card(t), flexShrink: 0, width: 38, height: 38, border: `1px solid ${t.border}`, cursor: "pointer", display: "grid", placeItems: "center" }} title="แก้ไขหมวดสนใจ"><Pencil size={15} color={t.sub} /></button>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {[["today", "วันนี้"], ["saved", `บันทึกไว้ (${saved.length})`]].map(([v, lb]) => (
          <button key={v} onClick={() => setTab(v)} style={{ flex: 1, padding: "9px 0", borderRadius: 12, cursor: "pointer", border: `1.5px solid ${tab === v ? t.accent : t.border}`, fontWeight: 700, fontSize: 12.5, background: tab === v ? t.accent : "transparent", color: tab === v ? t.onAccent : t.sub }}>{lb}</button>
        ))}
      </div>
      {voices.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Volume2 size={14} color={t.faint} />
          <select value={voiceURI} onChange={(e) => setVoiceURI(e.target.value)} style={{ flex: 1, fontSize: 11.5, border: `1px solid ${t.border}`, borderRadius: 8, background: t.inputBg, color: t.sub, padding: "5px 8px" }}>
            <option value="">เสียงอ่าน: ค่าเริ่มต้นของเครื่อง</option>
            {thaiVoices.length > 0 && <optgroup label="เสียงไทย">{thaiVoices.map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>)}</optgroup>}
            <optgroup label="เสียงอื่นๆ">{otherVoices.map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>)}</optgroup>
          </select>
        </div>
      )}

      {loading && <Empty t={t} text={genMsg || "กำลังโหลด..."} />}
      {!loading && genMsg && (
        <div style={{ ...card(t), padding: 14, marginBottom: 14, border: "1px solid #D9534F55", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ fontSize: 12.5, color: "#D9534F" }}>{genMsg}</div>
          <button onClick={() => { setGenMsg(""); setLoading(true); generateToday().finally(() => setLoading(false)); }} style={{ background: "none", border: `1px solid #D9534F55`, borderRadius: 8, padding: "5px 10px", fontSize: 11.5, fontWeight: 700, color: "#D9534F", cursor: "pointer", flexShrink: 0 }}>ลองใหม่</button>
        </div>
      )}

      {!loading && tab === "today" && (authProfile?.can_refresh_articles || authProfile?.role === "admin") && (
        <>
          <style>{`@keyframes rh-spin { to { transform: rotate(360deg); } } .rh-spin { animation: rh-spin .8s linear infinite; }`}</style>
          <button onClick={refreshToday} disabled={refreshing} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "9px 0", borderRadius: 10, border: `1px solid ${t.border}`, background: "none", color: t.sub, fontSize: 12, fontWeight: 700, cursor: "pointer", marginBottom: 12 }}>
            <RefreshCw size={13} className={refreshing ? "rh-spin" : ""} /> {refreshing ? "กำลังรีเฟรช..." : "รีเฟรชบทความวันนี้"}
          </button>
        </>
      )}
      {!loading && tab === "today" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {today.length === 0 && <Empty t={t} text="วันนี้ยังไม่มีบทความ" />}
          {today.map((a) => (
            <div key={a.id} style={{ ...card(t), padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <span style={{ fontSize: 10.5, fontWeight: 800, color: t.accent, background: `${t.accent}1A`, padding: "3px 10px", borderRadius: 20 }}>{topicLabel(a.topic)}</span>
                <div style={{ display: "flex", gap: 2 }}>
                  <button onClick={() => speak(a.id, `${a.title}. ${(a.bullets || []).join(". ")}`)} style={ghost} title="อ่านออกเสียง">
                    {speakingId === a.id ? <Pause size={16} color={t.accent} /> : <Volume2 size={16} color={t.faint} />}
                  </button>
                  <button onClick={() => toggleStar(a)} style={ghost}><Sparkles size={17} color={a.starred ? "#E0B24A" : t.faint} fill={a.starred ? "#E0B24A" : "none"} /></button>
                </div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginTop: 10, lineHeight: 1.4 }}>{a.title}</div>
              <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
                {(a.bullets || []).map((b, i) => <li key={i} style={{ fontSize: 12.5, color: t.sub, lineHeight: 1.6 }}>{b}</li>)}
              </ul>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={() => notedTo(a)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", borderRadius: 10, border: `1px solid ${notedIds[a.id] ? "#2E9E6B" : t.border}`, cursor: "pointer", background: notedIds[a.id] ? "#2E9E6B18" : "none", color: notedIds[a.id] ? "#2E9E6B" : t.text, fontSize: 12, fontWeight: 700 }}>{notedIds[a.id] ? <Check size={14} /> : <StickyNote size={14} />} {notedIds[a.id] ? "ส่งเข้าโน้ตแล้ว ✓" : "ส่งเข้าโน้ต"}</button>
                <button onClick={() => askAi(a)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", borderRadius: 10, border: "none", cursor: "pointer", background: t.accent, color: t.onAccent, fontSize: 12, fontWeight: 700 }}><MessageCircle size={14} /> ถามAIต่อ</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && tab === "saved" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {saved.length === 0 && <Empty t={t} text="ยังไม่มีบทความที่บันทึกไว้ กดดาว ⭐ ที่บทความวันนี้ได้เลย" />}
          {saved.map((a) => (
            <div key={a.id} style={{ ...card(t), padding: 14 }}>
              <button onClick={() => setExpanded((e) => ({ ...e, [a.id]: !e[a.id] }))} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{a.title}</div>
                <ChevronRight size={16} color={t.faint} style={{ transform: expanded[a.id] ? "rotate(90deg)" : "none", transition: "transform .15s", flexShrink: 0 }} />
              </button>
              {expanded[a.id] && (
                <>
                  <ul style={{ margin: "10px 0 0", paddingLeft: 18 }}>
                    {(a.bullets || []).map((b, i) => <li key={i} style={{ fontSize: 12.5, color: t.sub, lineHeight: 1.6 }}>{b}</li>)}
                  </ul>
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button onClick={() => notedTo(a)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", borderRadius: 10, border: `1px solid ${notedIds[a.id] ? "#2E9E6B" : t.border}`, cursor: "pointer", background: notedIds[a.id] ? "#2E9E6B18" : "none", color: notedIds[a.id] ? "#2E9E6B" : t.text, fontSize: 12, fontWeight: 700 }}>{notedIds[a.id] ? <Check size={14} /> : <StickyNote size={14} />} {notedIds[a.id] ? "ส่งเข้าโน้ตแล้ว ✓" : "ส่งเข้าโน้ต"}</button>
                    <button onClick={() => askAi(a)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", borderRadius: 10, border: "none", cursor: "pointer", background: t.accent, color: t.onAccent, fontSize: 12, fontWeight: 700 }}><MessageCircle size={14} /> ถามAIต่อ</button>
                    <button onClick={() => speak(a.id, `${a.title}. ${(a.bullets || []).join(". ")}`)} style={ghost} title="อ่านออกเสียง">
                      {speakingId === a.id ? <Pause size={16} color={t.accent} /> : <Volume2 size={16} color={t.faint} />}
                    </button>
                    <button onClick={() => toggleStar(a)} style={ghost}><Sparkles size={17} color="#E0B24A" fill="#E0B24A" /></button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
function TradePage({ t }) {
  const rows = [{ n: "ทองคำ (Gold Spot)", p: "฿52,400", c: +0.8 }, { n: "SET Index", p: "1,342.50", c: -0.4 }, { n: "Bitcoin", p: "฿2,380,000", c: +2.1 }, { n: "กองทุน SSF/RMF", p: "฿75,025", c: +0.6 }];
  return (<>
    <PageHead t={t} title="ตลาด & การลงทุน" sub="ทอง หุ้น คริปโต" icon={<TrendingUp size={20} color={t.accent} />} />
    <MockBanner t={t} text="ตัวอย่าง — ต่อ API ราคาจริง (ฟรี) ภายหลัง" />
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
      {rows.map((x, i) => (<div key={i} style={{ ...card(t), padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{x.n}</div>
        <div style={{ textAlign: "right" }}><div style={{ fontSize: 14.5, fontWeight: 800, color: t.text }}>{x.p}</div><div style={{ fontSize: 11.5, fontWeight: 700, color: x.c >= 0 ? "#2E9E6B" : "#D9534F" }}>{x.c >= 0 ? "▲ +" : "▼ "}{x.c}%</div></div>
      </div>))}
    </div>
  </>);
}
function NewsPage({ t }) {
  const news = [{ s: "Tech", h: "Microsoft ปล่อยฟีเจอร์ AI ใหม่ใน Power Automate", tm: "2 ชม.ที่แล้ว" }, { s: "World", h: "ตลาดหุ้นเอเชียปรับตัวขึ้นรับข่าวเศรษฐกิจ", tm: "4 ชม.ที่แล้ว" }, { s: "AI", h: "โมเดล AI ใหม่ทำงาน coding แม่นขึ้น 30%", tm: "6 ชม.ที่แล้ว" }, { s: "Thailand", h: "อุตสาหกรรมยานยนต์ไทยเร่งลงทุนระบบอัตโนมัติ", tm: "8 ชม.ที่แล้ว" }];
  return (<>
    <PageHead t={t} title="ข่าวสาร" sub="อัปเดตสถานการณ์โลก" icon={<Newspaper size={20} color={t.accent} />} />
    <MockBanner t={t} text="ตัวอย่าง — ต่อ News API จริงภายหลัง" />
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
      {news.map((x, i) => (<div key={i} style={{ ...card(t), padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 10.5, fontWeight: 800, color: t.accent }}>{x.s}</span><span style={{ fontSize: 10.5, color: t.faint }}>{x.tm}</span></div>
        <div style={{ fontSize: 14, fontWeight: 600, color: t.text, lineHeight: 1.4 }}>{x.h}</div>
      </div>))}
    </div>
  </>);
}
function LangPage({ t }) {
  const vocab = [{ w: "Resilience", m: "ความสามารถในการฟื้นตัวจากความยากลำบาก", ex: "Her resilience helped her overcome failure." }, { w: "Leverage", m: "ใช้ประโยชน์ / งัดให้เกิดผลสูงสุด", ex: "Leverage your skills to grow." }, { w: "Consistency", m: "ความสม่ำเสมอ", ex: "Consistency beats talent over time." }, { w: "Momentum", m: "แรงส่ง / โมเมนตัม", ex: "Small wins build momentum." }];
  const [i, setI] = useState(0); const [show, setShow] = useState(false); const v = vocab[i % vocab.length];
  return (<>
    <PageHead t={t} title="ฝึกภาษา" sub="ท่องศัพท์วันละคำ" icon={<Languages size={20} color={t.accent} />} />
    <div style={{ ...card(t), padding: 24, textAlign: "center", minHeight: 200, display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ fontSize: 30, fontWeight: 800, color: t.text }}>{v.w}</div>
      {show ? (<><div style={{ fontSize: 15, color: t.accent, fontWeight: 700, marginTop: 12 }}>{v.m}</div><div style={{ fontSize: 13, color: t.sub, marginTop: 10, fontStyle: "italic" }}>“{v.ex}”</div></>) : (<button onClick={() => setShow(true)} style={{ ...primaryBtn({ accent: t.accent, accent2: t.accent2, onAccent: t.onAccent }), margin: "18px auto 0", padding: "9px 22px" }}>เฉลยความหมาย</button>)}
    </div>
    <button onClick={() => { setI((x) => x + 1); setShow(false); }} style={{ ...card(t), width: "100%", marginTop: 12, padding: "13px 0", fontSize: 14, fontWeight: 700, color: t.text, cursor: "pointer" }}>คำต่อไป →</button>
  </>);
}

// ---------------- Modals ----------------
function ChatHistoryListModal({ t, userId, mentor, currentSessionId, onSelect, close }) {
  const [sessions, setSessions] = useState([]); // [{sessionId, preview, startedAt, count}]
  const [loading, setLoading] = useState(true);
  const [confirmDelId, setConfirmDelId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("mentor_chat_messages").select("session_id, who, text, created_at").eq("user_id", userId).eq("mentor", mentor).order("created_at", { ascending: true });
      if (error) { console.error("โหลดรายการแชทเก่าไม่สำเร็จ:", error.message); setSessions([]); return; }
      const bySession = {};
      (data || []).forEach((r) => {
        const sid = r.session_id || "00000000-0000-0000-0000-000000000001";
        if (!bySession[sid]) bySession[sid] = { sessionId: sid, startedAt: r.created_at, count: 0, preview: null };
        bySession[sid].count += 1;
        if (!bySession[sid].preview && r.who === "u") bySession[sid].preview = r.text; // เอาข้อความแรกที่ผู้ใช้พิมพ์เป็น preview
      });
      const list = Object.values(bySession).sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
      setSessions(list);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const delSession = async (sid) => {
    await supabase.from("mentor_chat_messages").delete().eq("user_id", userId).eq("mentor", mentor).eq("session_id", sid);
    setConfirmDelId(null);
    load();
  };

  return (
    <ModalPortal>
      <div style={overlay} onClick={close}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "24px 24px 0 0", padding: 20, maxHeight: "75vh", overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: t.text }}>ประวัติแชทเก่า</div>
            <button onClick={close} style={ghost}><X size={20} color={t.sub} /></button>
          </div>
          {loading && <Empty t={t} text="กำลังโหลด..." />}
          {!loading && sessions.length === 0 && <Empty t={t} text="ยังไม่มีประวัติแชทเก่า" />}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sessions.map((s) => (
              <div key={s.sessionId} style={{ ...card(t), padding: 12, border: `1px solid ${s.sessionId === currentSessionId ? t.accent : t.border}`, display: "flex", alignItems: "center", gap: 10 }}>
                <button onClick={() => onSelect(s.sessionId)} style={{ flex: 1, minWidth: 0, background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.preview || "(ไม่มีข้อความจากคุณ)"}</div>
                  <div style={{ fontSize: 10.5, color: t.faint, marginTop: 2 }}>{new Date(s.startedAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })} · {s.count} ข้อความ{s.sessionId === currentSessionId ? " · กำลังใช้อยู่" : ""}</div>
                </button>
                {confirmDelId === s.sessionId ? (
                  <button onClick={() => delSession(s.sessionId)} style={{ flexShrink: 0, padding: "6px 10px", borderRadius: 9, border: "none", background: "#D9534F", color: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>ยืนยัน?</button>
                ) : (
                  <button onClick={() => setConfirmDelId(s.sessionId)} style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", padding: 6 }}><Trash2 size={15} color={t.faint} /></button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

function ChatModal({ t, M, mentor, setMentor, authProfile, setAuthProfile, customMentors, setCustomMentors, userId, session, goals, askAiTopic, close }) {

  const [switchPick, setSwitchPick] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [histLoading, setHistLoading] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [showHistList, setShowHistList] = useState(false);
  const [inp, setInp] = useState(() => askAiTopic ? `ช่วยคุยเรื่อง "${askAiTopic.title}" ต่อให้หน่อย อยากรู้เพิ่มเติมเกี่ยวกับเรื่องนี้` : ""); const [loading, setLoading] = useState(false); const endRef = useRef(null);
  const [pendingImg, setPendingImg] = useState(null); // { dataUrl, mime } รูปที่เลือกไว้ รอกดส่ง
  const fileRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading]);

  const greeting = () => ({ who: "m", text: `สวัสดี ฉันคือ ${M.full} วันนี้อยากให้ช่วยเรื่องอะไร?` });

  // 🗂️ โหลด session ล่าสุดของโค้ชคนนี้จาก Supabase (ไม่หายเมื่อออกจากหน้าแชท) — โหลดใหม่ทุกครั้งที่เปิด/สลับโค้ช
  const loadHistory = async () => {
    setHistLoading(true);
    try {
      const { data: latest, error: latestErr } = await supabase.from("mentor_chat_messages").select("session_id").eq("user_id", userId).eq("mentor", mentor).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (latestErr) { console.error("โหลดประวัติแชทไม่สำเร็จ:", latestErr.message); setMsgs([greeting()]); return; }
      if (!latest) {
        const g = greeting(); const sid = crypto.randomUUID();
        setMsgs([g]); setCurrentSessionId(sid);
        if (userId) supabase.from("mentor_chat_messages").insert({ user_id: userId, mentor, session_id: sid, who: g.who, text: g.text }).then(({ error }) => { if (error) console.error("บันทึกข้อความทักทายไม่สำเร็จ:", error.message); }, () => {});
        return;
      }
      const { data, error } = await supabase.from("mentor_chat_messages").select("*").eq("user_id", userId).eq("mentor", mentor).eq("session_id", latest.session_id).order("created_at", { ascending: true });
      if (error) { console.error("โหลดประวัติแชทไม่สำเร็จ:", error.message); setMsgs([greeting()]); return; }
      setCurrentSessionId(latest.session_id);
      setMsgs((data || []).map((r) => ({ who: r.who, text: r.text, image: r.image || null })));
    } finally { setHistLoading(false); }
  };
  useEffect(() => { loadHistory(); }, [mentor]);

  // เริ่มแชทใหม่ = สร้าง session ใหม่ ไม่แตะของเก่าเลย (ดูย้อนหลังได้ทีหลังผ่านปุ่ม "ประวัติเก่า")
  const newChat = async () => {
    const g = greeting(); const sid = crypto.randomUUID();
    setMsgs([g]); setCurrentSessionId(sid); setShowHistList(false);
    if (userId) supabase.from("mentor_chat_messages").insert({ user_id: userId, mentor, session_id: sid, who: g.who, text: g.text }).then(({ error }) => { if (error) console.error("บันทึกข้อความทักทายไม่สำเร็จ:", error.message); }, () => {});
  };

  // ดูแชทเก่าที่เลือกจากรายการประวัติ (สลับไปดู/คุยต่อใน session นั้น)
  const viewSession = async (sid) => {
    setShowHistList(false);
    setHistLoading(true);
    try {
      const { data, error } = await supabase.from("mentor_chat_messages").select("*").eq("user_id", userId).eq("mentor", mentor).eq("session_id", sid).order("created_at", { ascending: true });
      if (error) { console.error("โหลดแชทเก่าไม่สำเร็จ:", error.message); return; }
      setCurrentSessionId(sid);
      setMsgs((data || []).map((r) => ({ who: r.who, text: r.text, image: r.image || null })));
    } finally { setHistLoading(false); }
  };

  // ย่อรูปก่อนส่ง กันไฟล์ใหญ่เกิน (Vercel จำกัด payload ต่อ request ไว้ไม่กี่ MB)
  const pickImage = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 1024; const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas"); c.width = img.width * scale; c.height = img.height * scale;
        const ctx = c.getContext("2d"); ctx.drawImage(img, 0, 0, c.width, c.height);
        setPendingImg({ dataUrl: c.toDataURL("image/jpeg", 0.75), mime: "image/jpeg" });
      };
      img.src = rd.result;
    };
    rd.readAsDataURL(f);
    e.target.value = "";
  };

  const send = async () => {
    if ((!inp.trim() && !pendingImg) || loading) return;
    const u = inp.trim();
    const userMsg = { who: "u", text: u || "(ส่งรูปภาพ)", image: pendingImg?.dataUrl || null };
    const nextMsgs = [...msgs, userMsg];
    setMsgs(nextMsgs); setInp(""); setPendingImg(null);
    if (userId) supabase.from("mentor_chat_messages").insert({ user_id: userId, mentor, session_id: currentSessionId, who: userMsg.who, text: userMsg.text, image: userMsg.image }).then(({ error }) => { if (error) console.error("บันทึกข้อความไม่สำเร็จ:", error.message); }, () => {});
    setLoading(true);
    try {
      const r = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mentor, messages: nextMsgs, userId, callerToken: session?.access_token, mentorName: M.full, mentorDescription: M.tag, goalsContext: buildGoalsContext(goals) }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "API error");
      const replyMsg = { who: "m", text: data.text || M.replies[Math.floor(Math.random() * M.replies.length)], source: data.source };
      setMsgs((m) => [...m, replyMsg]);
      if (userId) supabase.from("mentor_chat_messages").insert({ user_id: userId, mentor, session_id: currentSessionId, who: replyMsg.who, text: replyMsg.text }).then(({ error }) => { if (error) console.error("บันทึกคำตอบโค้ชไม่สำเร็จ:", error.message); }, () => {});
    } catch (e) {
      // ยังไม่ deploy หรือ API มีปัญหา -> fallback เป็น mock reply ชั่วคราว ไม่ให้แชทค้าง
      // แต่ log สาเหตุจริงไว้ให้เช็คได้ (กด F12 > Console) และติดป้ายบอกชัดว่านี่คือ mock ไม่ใช่ AI จริง
      console.error("เรียก /api/chat ไม่สำเร็จ ตกไปใช้ mock reply สาเหตุ:", e.message);
      const mockMsg = { who: "m", text: M.replies[Math.floor(Math.random() * M.replies.length)], isMock: true };
      setMsgs((m) => [...m, mockMsg]);
      if (userId) supabase.from("mentor_chat_messages").insert({ user_id: userId, mentor, session_id: currentSessionId, who: mockMsg.who, text: mockMsg.text }).then(({ error }) => { if (error) console.error("บันทึกข้อความ mock ไม่สำเร็จ:", error.message); }, () => {});
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={overlay} onClick={close}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, height: "82vh", background: t.page, borderRadius: "24px 24px 0 0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 12, background: t.hero }}>
          <button onClick={() => setSwitchPick(true)} style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0, background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}>
            {M.avatarUrl ? (
              <img src={M.avatarUrl} alt="" style={{ width: 40, height: 40, borderRadius: 20, objectFit: "cover", flexShrink: 0 }} />
            ) : (
              <span style={{ width: 40, height: 40, borderRadius: 20, background: `linear-gradient(135deg,${M.accent2},${M.accent})`, color: M.onAccent, display: "grid", placeItems: "center", fontWeight: 800, flexShrink: 0 }}>{M.letter}</span>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: 5 }}>{M.full} <ChevronRight size={13} color="rgba(255,255,255,.6)" style={{ transform: "rotate(90deg)" }} /></div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{M.tag}</div>
            </div>
          </button>
          <button onClick={() => setShowHistList(true)} style={{ background: "rgba(255,255,255,.15)", border: "none", borderRadius: 12, width: 32, height: 32, cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }} title="ดูแชทเก่าที่เก็บไว้"><Clock size={15} color="#fff" /></button>
          <button onClick={newChat} style={{ background: "rgba(255,255,255,.15)", border: "none", borderRadius: 12, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }} title="เริ่มแชทใหม่ (ของเก่ายังเก็บไว้ ดูย้อนหลังได้)">
            <Plus size={13} color="#fff" /><span style={{ fontSize: 10.5, color: "#fff", fontWeight: 700 }}>ใหม่</span>
          </button>
          <button onClick={close} style={{ background: "rgba(255,255,255,.15)", border: "none", borderRadius: 16, width: 32, height: 32, cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}><X size={18} color="#fff" /></button>
        </div>
        {switchPick && <MentorPicker t={t} mentor={mentor} setMentor={setMentor} authProfile={authProfile} setAuthProfile={setAuthProfile} userId={userId} customMentors={customMentors} setCustomMentors={setCustomMentors} close={() => setSwitchPick(false)} />}
        {showHistList && <ChatHistoryListModal t={t} userId={userId} mentor={mentor} currentSessionId={currentSessionId} onSelect={viewSession} close={() => setShowHistList(false)} />}
        <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          {histLoading && <div style={{ alignSelf: "center", color: t.sub, fontSize: 12.5, padding: "20px 0" }}>กำลังโหลดประวัติแชท...</div>}
          {!histLoading && msgs.map((m, i) => (
            <div key={i} style={{ alignSelf: m.who === "u" ? "flex-end" : "flex-start", maxWidth: "78%", background: m.who === "u" ? M.accent : t.surface, color: m.who === "u" ? M.onAccent : t.text, padding: "10px 14px", borderRadius: 16, fontSize: 13.5, lineHeight: 1.45, border: m.who === "u" ? "none" : `1px solid ${t.border}` }}>
              {m.image && <img src={m.image} alt="" style={{ maxWidth: "100%", borderRadius: 10, marginBottom: m.text ? 6 : 0, display: "block" }} />}
              {m.text}
              {m.isMock && <div style={{ fontSize: 9.5, opacity: 0.55, marginTop: 4 }}>⚠️ โหมดสำรอง (AI ตอบไม่สำเร็จ ดูสาเหตุใน Console)</div>}
            </div>
          ))}
          {loading && <div style={{ alignSelf: "flex-start", color: t.sub, fontSize: 12.5, padding: "4px 14px" }}>{M.name} กำลังพิมพ์...</div>}
          <div ref={endRef} />
        </div>
        <div style={{ padding: 12, background: t.page }}>
          {pendingImg && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 8 }}>
              <img src={pendingImg.dataUrl} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 8 }} />
              <span style={{ fontSize: 11.5, color: t.sub, flex: 1 }}>รูปพร้อมส่งแล้ว</span>
              <button onClick={() => setPendingImg(null)} style={ghost}><X size={15} color={t.faint} /></button>
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => fileRef.current?.click()} disabled={loading} style={{ width: 42, borderRadius: 12, border: `1px solid ${t.border}`, background: t.inputBg, cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Upload size={16} color={t.sub} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={pickImage} style={{ display: "none" }} />
            <textarea value={inp} onChange={(e) => setInp(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder={`ถาม ${M.name}...`} rows={1} style={{ ...input(t), resize: "none", maxHeight: 120, overflowY: "auto", fontFamily: "inherit", lineHeight: 1.4 }} disabled={loading} onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }} />
            <button onClick={send} disabled={loading} style={{ ...primaryBtn(M), width: 46, padding: 0, display: "grid", placeItems: "center", opacity: loading ? 0.6 : 1 }}><Send size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MentorPicker({ t, mentor, setMentor, authProfile, setAuthProfile, userId, customMentors, setCustomMentors, close }) {
  const isAdmin = authProfile?.role === "admin";
  const limit = authProfile?.mentor_limit ?? 0;
  const [err, setErr] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const avatarFileRef = useRef(null);
  const [avatarTargetId, setAvatarTargetId] = useState(null);
  const [avatarCropSrc, setAvatarCropSrc] = useState(null);

  const pickAvatarFile = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    e.target.value = "";
    const rd = new FileReader(); rd.onload = () => setAvatarCropSrc(rd.result); rd.readAsDataURL(f);
  };
  const confirmMentorAvatar = async (dataUrl) => {
    setAvatarCropSrc(null);
    const id = avatarTargetId;
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const path = `${userId}/mentor-${id}-${uid()}.jpg`;
      const { error: upErr } = await supabase.storage.from("attachments").upload(path, blob);
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("attachments").getPublicUrl(path);
      await supabase.from("custom_mentors").update({ avatar_url: data.publicUrl }).eq("id", id);
      setCustomMentors((cs) => cs.map((c) => (c.id === id ? { ...c, avatarUrl: data.publicUrl } : c)));
    } catch (e) { setErr("เปลี่ยนรูปไม่สำเร็จ: " + e.message); }
  };

  const pick = (id) => { setMentor(id); close(); };

  const createMentor = async () => {
    setErr("");
    if (!newName.trim()) { setErr("ตั้งชื่อโค้ชก่อนนะครับ"); return; }
    if (!isAdmin && customMentors.length >= limit) { setErr(`สร้างโค้ชได้สูงสุด ${limit} คน ให้แอดมินเพิ่มโควตาถ้าอยากสร้างเพิ่ม`); return; }
    setBusy(true);
    try {
      const { data, error } = await supabase.from("custom_mentors").insert({ user_id: userId, name: newName.trim(), description: newDesc.trim() || null }).select().single();
      if (error) throw error;
      const created = { id: data.id, name: data.name, description: data.description, avatarUrl: data.avatar_url };
      setCustomMentors((cs) => [...cs, created]);
      setMentor(created.id);
      close();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  return (<div style={overlay} onClick={close}><div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "24px 24px 0 0", padding: 20, maxHeight: "85vh", overflowY: "auto" }}>
    <div style={{ fontSize: 17, fontWeight: 800, color: t.text, marginBottom: 4 }}>โค้ชของคุณ</div>
    <div style={{ fontSize: 12.5, color: t.sub, marginBottom: 16 }}>
      {isAdmin ? "สร้างโค้ชของคุณเองได้ไม่จำกัด (สิทธิ์แอดมิน)" : `สร้างโค้ชของคุณเองได้สูงสุด ${limit} คน (${customMentors.length}/${limit})`}
    </div>
    {err && <div style={{ fontSize: 12, color: "#D9534F", marginBottom: 12 }}>{err}</div>}

    {!creating ? (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {isAdmin && Object.entries(MENTORS).filter(([k]) => k !== "none").map(([k, m]) => (
          <button key={k} onClick={() => pick(k)} style={{ display: "flex", alignItems: "center", gap: 14, padding: 14, borderRadius: 18, cursor: "pointer", textAlign: "left", background: t.surface, border: `2px solid ${mentor === k ? m.accent : t.border}` }}>
            <span style={{ width: 46, height: 46, borderRadius: 23, background: `linear-gradient(135deg,${m.accent2},${m.accent})`, color: m.onAccent, display: "grid", placeItems: "center", fontWeight: 800, fontSize: 18, flexShrink: 0 }}>{m.letter}</span>
            <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>{m.full}</div><div style={{ fontSize: 12, color: t.sub }}>{m.tag}</div></div>
            {mentor === k && <Check size={20} color={m.accent} />}
          </button>
        ))}
        <button onClick={() => pick("none")} style={{ display: "flex", alignItems: "center", gap: 14, padding: 14, borderRadius: 18, cursor: "pointer", textAlign: "left", background: t.surface, border: `2px solid ${mentor === "none" ? MENTORS.none.accent : t.border}` }}>
          <span style={{ width: 46, height: 46, borderRadius: 23, background: `linear-gradient(135deg,${MENTORS.none.accent2},${MENTORS.none.accent})`, color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 18, flexShrink: 0 }}>{MENTORS.none.letter}</span>
          <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>{MENTORS.none.full}</div><div style={{ fontSize: 12, color: t.sub }}>{MENTORS.none.tag}</div></div>
          {mentor === "none" && <Check size={20} color={MENTORS.none.accent} />}
        </button>
        {customMentors.map((c) => (
          <button key={c.id} onClick={() => pick(c.id)} style={{ display: "flex", alignItems: "center", gap: 14, padding: 14, borderRadius: 18, cursor: "pointer", textAlign: "left", background: t.surface, border: `2px solid ${mentor === c.id ? "#8A93A8" : t.border}` }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              {c.avatarUrl ? (
                <img src={c.avatarUrl} alt="" style={{ width: 46, height: 46, borderRadius: 23, objectFit: "cover" }} />
              ) : (
                <span style={{ width: 46, height: 46, borderRadius: 23, background: "linear-gradient(135deg,#A7ADB8,#8A93A8)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 18 }}>{(c.name || "?")[0].toUpperCase()}</span>
              )}
              <button onClick={(e) => { e.stopPropagation(); setAvatarTargetId(c.id); avatarFileRef.current?.click(); }} style={{ position: "absolute", bottom: -3, right: -3, width: 20, height: 20, borderRadius: 10, background: t.accent, border: `2px solid ${t.surface}`, cursor: "pointer", display: "grid", placeItems: "center" }}>
                <Camera size={10} color={t.onAccent} />
              </button>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>{c.name}</div><div style={{ fontSize: 12, color: t.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.description || "โค้ชส่วนตัวของคุณ"}</div></div>
            {mentor === c.id && <Check size={20} color="#8A93A8" />}
          </button>
        ))}
        <input ref={avatarFileRef} type="file" accept="image/*" onChange={pickAvatarFile} style={{ display: "none" }} />
        {avatarCropSrc && (
          <ModalPortal>
            <ImageCropModal t={t} src={avatarCropSrc} onCancel={() => setAvatarCropSrc(null)} onConfirm={confirmMentorAvatar} />
          </ModalPortal>
        )}
        {(isAdmin || customMentors.length < limit) && (
          <button onClick={() => setCreating(true)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 16, borderRadius: 18, cursor: "pointer", background: "none", border: `1.5px dashed ${t.border}`, color: t.sub, fontSize: 13.5, fontWeight: 700 }}>
            <Plus size={18} /> สร้างโค้ชใหม่
          </button>
        )}
        {!isAdmin && limit < 1 && <div style={{ fontSize: 11.5, color: t.faint, textAlign: "center", marginTop: 6 }}>ให้แอดมินเปิดสิทธิ์ให้ที่หน้า Admin ก่อน ถึงจะสร้างโค้ชของตัวเองได้</div>}
      </div>
    ) : (
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: t.sub, marginBottom: 6 }}>ตั้งชื่อโค้ช</div>
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="เช่น โค้ชแนน, Tony" style={{ ...input(t), marginBottom: 12 }} />
        <div style={{ fontSize: 12, fontWeight: 700, color: t.sub, marginBottom: 6 }}>ความเชี่ยวชาญ/บุคลิก (ไม่ใส่ก็ได้)</div>
        <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="เช่น เก่งด้านการเงินโดยเฉพาะ หรือ พูดจามั่นใจแบบ Tony Stark" rows={3} style={{ ...input(t), resize: "vertical", marginBottom: 14, fontFamily: "inherit" }} />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setCreating(false)} style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: `1px solid ${t.border}`, background: "none", color: t.sub, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>ยกเลิก</button>
          <button onClick={createMentor} disabled={busy} style={{ ...primaryBtn({ accent: t.accent, accent2: t.accent2, onAccent: t.onAccent }), flex: 2, padding: "11px 0" }}>{busy ? "กำลังสร้าง..." : "สร้างโค้ชนี้"}</button>
        </div>
      </div>
    )}
  </div></div>);
}

function ThemePicker({ t, theme, setTheme, mode, close }) {
  return (<div style={overlay} onClick={close}><div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "24px 24px 0 0", padding: 20 }}>
    <div style={{ fontSize: 17, fontWeight: 800, color: t.text, marginBottom: 4 }}>เลือกธีมสีแอป</div>
    <div style={{ fontSize: 12.5, color: t.sub, marginBottom: 16 }}>แต่ละธีมมีเวอร์ชันกลางวัน/กลางคืนของตัวเอง สลับได้อิสระจากโค้ช</div>
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Object.entries(THEMES).map(([k, th]) => { const T = th[mode] || th.day; const on = theme === k; return (
        <button key={k} onClick={() => { setTheme(k); close(); }} style={{ display: "flex", alignItems: "center", gap: 14, padding: 14, borderRadius: 18, cursor: "pointer", textAlign: "left", background: t.surface, border: `2px solid ${on ? T.accent : t.border}` }}>
          <span style={{ width: 46, height: 46, borderRadius: 23, background: `linear-gradient(135deg,${T.accent2},${T.accent})`, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>{th.label}</div>
            <div style={{ fontSize: 11.5, color: t.sub }}>{mode === "night" ? "เวอร์ชันกลางคืน" : "เวอร์ชันกลางวัน"}</div>
          </div>
          {on && <Check size={20} color={T.accent} />}
        </button>
      ); })}
    </div>
  </div></div>);
}

function EditProfile({ t, M, profile, setProfile, userId, authProfile, setAuthProfile, close }) {
  const [name, setName] = useState(profile.name); const [avatar, setAvatar] = useState(profile.avatar); const fileRef = useRef(null);
  const [showUrlBox, setShowUrlBox] = useState(false);
  const [cropSrc, setCropSrc] = useState(null); // dataURL ของรูปที่เพิ่งเลือก รอ crop อยู่
  const [status, setStatus] = useState(authProfile?.status_message || "");

  const pick = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    e.target.value = "";
    const rd = new FileReader();
    rd.onload = () => setCropSrc(rd.result);
    rd.readAsDataURL(f);
  };

  const save = async () => {
    setProfile({ name: name.trim() || "ฉัน", avatar });
    if (userId) {
      const { data } = await supabase.from("profiles").update({ status_message: status.trim() || null }).eq("id", userId).select().single();
      if (data) setAuthProfile(data);
    }
    close();
  };

  return (<div style={overlay} onClick={close}><div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "24px 24px 0 0", padding: 20 }}>
    <div style={{ fontSize: 17, fontWeight: 800, color: t.text, marginBottom: 16 }}>แก้ไขโปรไฟล์</div>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <div style={{ position: "relative" }}>
        <Avatar profile={{ name, avatar }} t={t} size={90} />
        <button onClick={() => fileRef.current?.click()} style={{ position: "absolute", bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, background: t.accent, border: `2px solid ${t.page}`, cursor: "pointer", display: "grid", placeItems: "center" }}><Pencil size={14} color={t.onAccent} /></button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={pick} style={{ display: "none" }} />
      <div style={{ fontSize: 11, color: t.sub }}>แตะรูปดินสอเพื่อเลือกรูปจากเครื่อง</div>
    </div>

    <div style={{ fontSize: 12, fontWeight: 700, color: t.sub, marginBottom: 6 }}>ชื่อ</div>
    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อของคุณ" style={{ ...input(t), marginBottom: 12 }} />

    <div style={{ fontSize: 12, fontWeight: 700, color: t.sub, marginBottom: 6 }}>สถานะ (คุณกำลังคิดอะไรอยู่?)</div>
    <input value={status} onChange={(e) => setStatus(e.target.value.slice(0, 60))} placeholder="เช่น กำลังยุ่งๆ, ว่างคุยได้, ขอเวลาส่วนตัวหน่อย..." style={{ ...input(t), marginBottom: 6 }} />
    <div style={{ fontSize: 10, color: t.faint, marginBottom: 12, textAlign: "right" }}>{status.length}/60 · คนที่แชทกับคุณจะเห็นข้อความนี้</div>

    <button onClick={() => setShowUrlBox((s) => !s)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11.5, color: t.sub, marginBottom: showUrlBox ? 8 : 16, padding: 0 }}>
      {showUrlBox ? "▾" : "▸"} หรือใส่ลิงก์รูปแทน
    </button>
    {showUrlBox && (
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input value={avatar && avatar.startsWith("http") ? avatar : ""} onChange={(e) => setAvatar(e.target.value)} placeholder="https://..." style={input(t)} />
        {avatar && <button onClick={() => setAvatar("")} style={{ ...card(t), border: `1px solid ${t.border}`, padding: "0 14px", cursor: "pointer", color: t.sub, fontSize: 12, fontWeight: 700 }}>ล้าง</button>}
      </div>
    )}

    <button onClick={save} style={{ ...primaryBtn(t), width: "100%", padding: "13px 0", fontSize: 15 }}>บันทึก</button>
  </div>

  {cropSrc && (
    <ModalPortal>
      <ImageCropModal t={t} src={cropSrc} onCancel={() => setCropSrc(null)} onConfirm={(dataUrl) => { setAvatar(dataUrl); setCropSrc(null); }} />
    </ModalPortal>
  )}
  </div>);
}

// 🖼️ ปรับตำแหน่ง/ซูมรูปก่อนบันทึกเป็นรูปโปรไฟล์ (ลาก = ขยับ, สไลเดอร์ = ซูม)
function ImageCropModal({ t, src, onCancel, onConfirm }) {
  const V = 260; // ขนาดกรอบวงกลมที่โชว์ตอน crop (px)
  const OUT = 800; // ขนาดไฟล์ผลลัพธ์สุดท้าย (px) — เพิ่มจาก 320 เป็น 800 กันภาพแตก/เบลอตอนดูเต็มจอ (ไอคอนเล็กๆ ยังโชว์ได้ปกติ แค่ตอนขยายดูเต็มจอจะคมชัดขึ้นมาก)
  const imgRef = useRef(null);
  const [imgSize, setImgSize] = useState(null); // { w, h } ขนาดจริงของรูป
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setImgSize({ w: img.width, h: img.height });
    img.src = src;
  }, [src]);

  if (!imgSize) return null;

  const baseScale = V / Math.min(imgSize.w, imgSize.h);
  const totalScale = baseScale * zoom;
  const maxOffX = Math.max(0, (imgSize.w * totalScale - V) / 2);
  const maxOffY = Math.max(0, (imgSize.h * totalScale - V) / 2);
  const clamp = (v, m) => Math.max(-m, Math.min(m, v));

  const startDrag = (clientX, clientY) => { dragRef.current = { startX: clientX, startY: clientY, origX: pos.x, origY: pos.y }; };
  const moveDrag = (clientX, clientY) => {
    if (!dragRef.current) return;
    const dx = clientX - dragRef.current.startX, dy = clientY - dragRef.current.startY;
    setPos({ x: clamp(dragRef.current.origX + dx, maxOffX), y: clamp(dragRef.current.origY + dy, maxOffY) });
  };
  const endDrag = () => { dragRef.current = null; };

  const confirm = () => {
    const c = document.createElement("canvas"); c.width = OUT; c.height = OUT;
    const ctx = c.getContext("2d");
    const left = (V - imgSize.w * totalScale) / 2 + pos.x;
    const top = (V - imgSize.h * totalScale) / 2 + pos.y;
    const sx = -left / totalScale, sy = -top / totalScale, sw = V / totalScale, sh = V / totalScale;
    ctx.drawImage(imgRef.current, sx, sy, sw, sh, 0, 0, OUT, OUT);
    onConfirm(c.toDataURL("image/jpeg", 0.85));
  };

  return (
    <div style={overlay} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "24px 24px 0 0", padding: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: t.text, marginBottom: 14 }}>ปรับรูปโปรไฟล์</div>
        <div
          style={{ width: V, height: V, borderRadius: "50%", overflow: "hidden", margin: "0 auto 16px", position: "relative", background: "#000", touchAction: "none", cursor: "grab" }}
          onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
          onMouseMove={(e) => e.buttons === 1 && moveDrag(e.clientX, e.clientY)}
          onMouseUp={endDrag} onMouseLeave={endDrag}
          onTouchStart={(e) => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchMove={(e) => moveDrag(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchEnd={endDrag}
        >
          <img
            ref={imgRef} src={src} alt="" draggable={false}
            style={{ position: "absolute", left: "50%", top: "50%", width: imgSize.w * totalScale, height: imgSize.h * totalScale, transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`, pointerEvents: "none" }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, padding: "0 4px" }}>
          <span style={{ fontSize: 11, color: t.sub, flexShrink: 0 }}>ซูม</span>
          <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(e) => { setZoom(+e.target.value); setPos((p) => ({ x: clamp(p.x, maxOffX), y: clamp(p.y, maxOffY) })); }} style={{ flex: 1 }} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onCancel} style={{ ...card(t), flex: 1, padding: "12px 0", border: `1px solid ${t.border}`, cursor: "pointer", color: t.sub, fontWeight: 700, fontSize: 13 }}>ยกเลิก</button>
          <button onClick={confirm} style={{ ...primaryBtn(t), flex: 1, padding: "12px 0", fontSize: 13 }}>ใช้รูปนี้</button>
        </div>
      </div>
    </div>
  );
}

function SearchOverlay({ t, notes, goals, tx, categories, setPage, close }) {
  const [q, setQ] = useState(""); const ql = q.trim().toLowerCase();
  const nr = ql ? notes.filter((n) => (n.title + blocksToPlainText(n.body)).toLowerCase().includes(ql)) : [];
  const gr = ql ? goals.filter((g) => g.text.toLowerCase().includes(ql)) : [];
  const tr = ql ? tx.filter((x) => (x.note + findCat(categories, x.cat).label).toLowerCase().includes(ql)) : [];
  const go = (p) => { setPage(p); close(); };
  return (<div style={{ ...overlay, alignItems: "flex-start" }} onClick={close}><div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "0 0 24px 24px", padding: 18, maxHeight: "80vh", overflowY: "auto" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 14, padding: "10px 14px" }}>
      <Search size={18} color={t.sub} />
      <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาโน้ต เป้าหมาย รายการเงิน..." style={{ flex: 1, background: "none", border: "none", outline: "none", color: t.text, fontSize: 14 }} />
      <button onClick={close} style={ghost}><X size={18} color={t.sub} /></button>
    </div>
    {!ql && <div style={{ textAlign: "center", color: t.sub, fontSize: 13, padding: "30px 0" }}>พิมพ์เพื่อค้นหาทุกอย่างในแอป</div>}
    {ql && nr.length + gr.length + tr.length === 0 && <div style={{ textAlign: "center", color: t.sub, fontSize: 13, padding: "30px 0" }}>ไม่พบ "{q}"</div>}
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
      {nr.map((n) => <SR key={n.id} t={t} icon={<StickyNote size={16} color="#7B6CB0" />} title={n.title || blocksToPlainText(n.body)} sub="โน้ต" onClick={() => go("note")} />)}
      {gr.map((g) => <SR key={g.id} t={t} icon={<Target size={16} color="#E07B57" />} title={g.text} sub="เป้าหมาย" onClick={() => go("home")} />)}
      {tr.map((x) => <SR key={x.id} t={t} icon={<Wallet size={16} color="#2E9E6B" />} title={`${x.note} · ${x.amount.toLocaleString()}฿`} sub={`การเงิน · ${x.date}`} onClick={() => go("ledger")} />)}
    </div>
  </div></div>);
}
function SR({ t, icon, title, sub, onClick }) { return (<button onClick={onClick} style={{ ...card(t), padding: "11px 14px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", textAlign: "left", width: "100%" }}><span style={{ flexShrink: 0 }}>{icon}</span><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 600, color: t.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div><div style={{ fontSize: 11, color: t.sub }}>{sub}</div></div><ChevronRight size={16} color={t.faint} /></button>); }

// ---------------- Dock ----------------
function Dock({ t, page, setPage, onQuickAdd }) {
  const items = [{ k: "home", ic: Home, lb: "Home" }, { k: "ideas", ic: Lightbulb, lb: "Ideas" }, { k: "trade", ic: TrendingUp, lb: "Trade" }, { k: "_", ic: Plus, lb: "" }, { k: "news", ic: Newspaper, lb: "News" }, { k: "lang", ic: Languages, lb: "Lang" }, { k: "note", ic: StickyNote, lb: "Note" }];
  return (<div style={{ position: "absolute", bottom: 16, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 20, pointerEvents: "none" }}>
    <div style={{ pointerEvents: "auto", display: "flex", alignItems: "center", background: t.dock, border: `1px solid ${t.dockBorder}`, borderRadius: 34, padding: "8px 10px", maxWidth: 420, width: "92%", justifyContent: "space-between", boxShadow: "0 8px 26px rgba(20,25,45,.18)" }}>
      {items.map((it) => {
        if (it.k === "_") return (<button key="c" onClick={onQuickAdd} style={{ width: 50, height: 50, borderRadius: 25, border: "none", cursor: "pointer", background: `linear-gradient(135deg,${t.accent2},${t.accent})`, color: t.onAccent, display: "grid", placeItems: "center", boxShadow: `0 6px 16px ${t.accent}66`, marginTop: -18 }}><Plus size={26} /></button>);
        const A = it.ic; const on = page === it.k;
        return (<button key={it.k} onClick={() => setPage(it.k)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "4px 6px", flex: 1 }}><A size={20} color={on ? t.accent : t.sub} strokeWidth={on ? 2.6 : 1.9} /><span style={{ fontSize: 8.5, color: on ? t.accent : t.sub, fontWeight: on ? 700 : 500 }}>{it.lb}</span></button>);
      })}
    </div>
  </div>);
}

// ---------------- small ----------------
function Avatar({ profile, t, size }) {
  if (profile.avatar) return <img src={profile.avatar} alt="" style={{ width: size, height: size, borderRadius: size / 2, objectFit: "cover", border: `2px solid ${t.accent}` }} />;
  return <div style={{ width: size, height: size, borderRadius: size / 2, background: `linear-gradient(135deg,${t.accent2},${t.accent})`, color: t.onAccent, display: "grid", placeItems: "center", fontWeight: 800, fontSize: size * 0.42 }}>{(profile.name || "?")[0].toUpperCase()}</div>;
}
function Ring({ pct, color, label }) {
  const r = 32, c = 2 * Math.PI * r, dash = (pct / 100) * c;
  return (<div style={{ position: "relative", width: 82, height: 82, flexShrink: 0 }}>
    <svg width="82" height="82"><circle cx="41" cy="41" r={r} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="8" /><circle cx="41" cy="41" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${dash} ${c}`} transform="rotate(-90 41 41)" /></svg>
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}><div style={{ textAlign: "center" }}><div style={{ fontSize: 17, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{pct}%</div><div style={{ fontSize: 8.5, color: "rgba(255,255,255,.7)" }}>{label}</div></div></div>
  </div>);
}
function CatCard({ t, k, icon, label, children, onClick }) {
  return (<div onClick={onClick} style={{ background: t.cat[k], borderRadius: 20, padding: 14, cursor: onClick ? "pointer" : "default", border: `1px solid ${t.border}`, boxShadow: t.star ? "none" : "0 4px 12px rgba(40,50,70,.06)" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><span style={{ width: 26, height: 26, borderRadius: 13, background: catIcBg(k), display: "grid", placeItems: "center", flexShrink: 0 }}>{icon}</span><span style={{ fontSize: 10.5, fontWeight: 700, color: t.catLb[k] }}>{label}</span></div>
    {children}
  </div>);
}
const catIcBg = (k) => ({ green: "#7FB894", amber: "#E0B24A", coral: "#E07B57", violet: "#7B6CB0" }[k]);
function PageHead({ t, title, sub, icon }) { return (<div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}><div style={{ width: 44, height: 44, borderRadius: 14, background: `${t.accent}1A`, display: "grid", placeItems: "center", flexShrink: 0 }}>{icon}</div><div><div style={{ fontSize: 21, fontWeight: 800, color: t.text }}>{title}</div><div style={{ fontSize: 12.5, color: t.sub }}>{sub}</div></div></div>); }
function MockBanner({ t, text }) { return (<div style={{ display: "flex", alignItems: "center", gap: 8, background: `${t.accent}14`, border: `1px dashed ${t.accent}66`, borderRadius: 12, padding: "9px 12px", fontSize: 11.5, color: t.accent, fontWeight: 600 }}><Clock size={14} /> {text}</div>); }
function Empty({ t, text }) { return <div style={{ textAlign: "center", color: t.sub, fontSize: 13, padding: "26px 0" }}>{text}</div>; }
function IconBtn({ t, onClick, children, active, accent }) { return <button onClick={onClick} style={{ width: 38, height: 38, borderRadius: 19, background: active ? `${accent}1A` : t.surface, border: `1px solid ${active ? accent + "55" : t.border}`, cursor: "pointer", display: "grid", placeItems: "center", boxShadow: t.star ? "none" : "0 3px 10px rgba(40,50,70,.08)" }}>{children}</button>; }
function Stat({ t, label, val, color }) { return (<div style={{ flex: 1, textAlign: "center" }}><div style={{ fontSize: 10.5, color: t.sub, marginBottom: 3 }}>{label}</div><div style={{ fontSize: 15, fontWeight: 800, color }}>{fmt(val)}</div></div>); }
function Stars() { const s = Array.from({ length: 26 }).map(() => ({ x: Math.random() * 100, y: Math.random() * 42, r: Math.random() * 1.3 + 0.4, o: Math.random() * 0.6 + 0.3 })); return (<svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1, pointerEvents: "none" }}>{s.map((v, i) => <circle key={i} cx={`${v.x}%`} cy={`${v.y}%`} r={v.r} fill="#fff" opacity={v.o} />)}</svg>); }

// styles
const card = (t) => ({ background: t.surface, borderRadius: 20, border: `1px solid ${t.border}`, boxShadow: t.star ? "none" : "0 4px 12px rgba(40,50,70,.05)" });
const input = (t) => ({ flex: 1, background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 12, padding: "11px 14px", fontSize: 13.5, color: t.text, outline: "none", width: "100%", boxSizing: "border-box" });
const primaryBtn = (M) => ({ background: `linear-gradient(135deg,${M.accent2 || M.accent},${M.accent})`, color: M.onAccent, border: "none", borderRadius: 12, fontWeight: 700, fontSize: 13.5, cursor: "pointer" });
const navBtn = (t) => ({ width: 34, height: 34, borderRadius: 17, border: `1px solid ${t.border}`, background: "none", cursor: "pointer", fontSize: 20, color: t.text, lineHeight: 1 });
const ghost = { background: "none", border: "none", cursor: "pointer", padding: 4 };
const overlay = { position: "fixed", inset: 0, background: "rgba(10,14,25,.5)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(2px)" };
