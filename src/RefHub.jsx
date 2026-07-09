import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Home, Lightbulb, TrendingUp, Plus, Newspaper, Languages, StickyNote,
  Sun, Moon, Send, Check, Trash2, X, Wallet, Target, BookOpen, ChevronRight,
  Sparkles, Clock, Search, Volume2, VolumeX, Pencil, Download, ArrowLeft,
  Utensils, Car, ShoppingBag, Receipt, Gamepad2, HeartPulse, Briefcase, Gift, Coffee, Music,
  Play, Pause, Link2, Upload, SkipBack, SkipForward, Handshake, Coins, PiggyBank, FileSpreadsheet, FileText, Palette, ALargeSmall, ShieldCheck, Bell, UserCheck, UserX, Wifi, MessageCircle, MoreVertical, KeyRound, MapPin, Copy
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
    label: "ค่าเริ่มต้น",
    day:   { accent: "#EA9552", accent2: "#F2B074", onAccent: "#3A2408", page: "#F6F1E8", bgTop: "#F6F1E8", bgBot: "#FBF8F2", surface: "#FFFFFF" },
    night: { accent: "#EA9552", accent2: "#F2B074", onAccent: "#3A2408", page: "#0A1020", bgTop: "#131E36", bgBot: "#0A1020", surface: "#16223C" },
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
    text: "#EEF2FB", sub: "#8A93A8", faint: "#5C6680", border: "rgba(255,255,255,0.08)",
    dock: T.surface, dockBorder: "rgba(120,140,190,0.28)", star: true, inputBg: "rgba(255,255,255,.06)",
    cat: { green: "#16223C", amber: "#1E2438", coral: "#2A1C24", violet: "#201E33" },
    catTx: { green: "#EAF2EC", amber: "#F0E9D6", coral: "#F6E4DC", violet: "#E7E3F6" },
    catLb: { green: "#8FA79A", amber: "#C6B274", coral: "#D89A86", violet: "#A99CD6" },
  };
  return {
    ...common, page: T.page, bg: `linear-gradient(180deg,${T.bgTop} 0%,${T.bgBot} 100%)`,
    surface: T.surface, hero: `linear-gradient(135deg,${T.accent2} 0%,${T.accent} 100%)`, heroBorder: "transparent",
    text: "#26303F", sub: "#7A828F", faint: "#A7ADB8", border: "rgba(0,0,0,0.06)",
    dock: T.surface, dockBorder: "rgba(0,0,0,0.05)", star: false, inputBg: "#F4F5F7",
    cat: { green: "#E7F1E9", amber: "#FBF0D6", coral: "#FBE4DC", violet: "#E9E7F4" },
    catTx: { green: "#2A3B30", amber: "#3A3320", coral: "#5A3327", violet: "#39316A" },
    catLb: { green: "#5E7A66", amber: "#8A7434", coral: "#A85C42", violet: "#6A5C9A" },
  };
}

// 🚪 Portal สำหรับ popup ที่สร้างจากข้างในหน้าเพจ (เช่น Admin, Chat) ให้หลุดออกไปแปะที่ document.body ตรงๆ
// กันปัญหาติดอยู่ใน "เขตซ้อนชั้น" ของกล่องเนื้อหา ซึ่งทำให้ z-index สูงแค่ไหนก็ไม่มีทางซ้อนทับแถบเมนูด้านล่างได้
// 🖼️ ดูรูปเต็มจอ — ใช้ร่วมกันได้ทุกที่ในแอปที่มีรูป (แชท, avatar ฯลฯ)
function ImageLightbox({ src, onClose }) {
  return (
    <ModalPortal>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.9)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
        <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,.15)", border: "none", borderRadius: 20, width: 40, height: 40, cursor: "pointer", display: "grid", placeItems: "center" }}><X size={22} color="#fff" /></button>
        <img src={src} alt="" style={{ maxWidth: "92vw", maxHeight: "85vh", objectFit: "contain", borderRadius: 8 }} onClick={(e) => e.stopPropagation()} />
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
const monthOf = (d) => d.slice(0, 7);
const thMonth = (ym) => { const [y, m] = ym.split("-"); return ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."][+m - 1] + " " + ((+y) + 543); };

export default function RefHub() {
  const [loaded, setLoaded] = useState(false);

  // 🔐 ระบบล็อกอินจริง (Supabase Auth) — แทนที่ userId คงที่เดิมจาก .env
  const [session, setSession] = useState(null);       // session ของ Supabase Auth (null = ยังไม่ล็อกอิน)
  const [authChecked, setAuthChecked] = useState(false); // true เมื่อเช็ค session ครั้งแรกเสร็จแล้ว (กันจอกระพริบ)
  const [authProfile, setAuthProfile] = useState(null);  // แถวในตาราง profiles: { approved, role, name, ... }
  const userId = session?.user?.id || null;
  const [themeMode, setThemeMode] = useState("auto");
  const [mentor, setMentor] = useState("loid");
  const [theme, setTheme] = useState("default"); // 🎨 ธีมสีแอป: default | red | navy | twilight — แยกอิสระจาก mentor
  const [fontScale, setFontScale] = useState(100); // 📏 ขนาดตัวอักษร: 100 | 115 | 130 (ปกติ/ใหญ่/ใหญ่มาก)
  const [page, setPage] = useState(() => { try { return sessionStorage.getItem("refhub:page") || "home"; } catch (e) { return "home"; } });
  const [notes, setNotes] = useState([]);
  const [goals, setGoals] = useState([]);
  const [tx, setTx] = useState([]);
  const [profile, setProfile] = useState({ name: "", avatar: "" });
  const [autoNight, setAutoNight] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [mentorPick, setMentorPick] = useState(false);
  const [themePick, setThemePick] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const [chatUnread, setChatUnread] = useState(0); // จำนวนข้อความแชทที่ยังไม่ได้อ่าน (คำนวณจริงในหน้าแชท)
  const [activeThread, setActiveThread] = useState(null); // { id, name } ห้องแชทที่กำลังเปิดดูอยู่
  useEffect(() => { if (page === "chatRoom" && !activeThread) setPage("chat"); }, []);
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
  const M = MENTORS[mentor];

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
          setMentor(uSettings.mentor || "loid");
          setThemeMode(uSettings.theme_mode || "auto");
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
        const { data: dbTx } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", userId)
          .order("date", { ascending: false });
        if (dbTx) setTx(dbTx);

        // 3. ดึงเป้าหมายวันนี้ (Goals)
        const { data: dbGoals } = await supabase
          .from("goals")
          .select("*")
          .eq("user_id", userId);
        if (dbGoals) setGoals(dbGoals.map((g) => ({ ...g, doneDate: g.done_date || null })));

        // 4. ดึงสมุดโน้ต (Notes)
        const { data: dbNotes } = await supabase
          .from("notes")
          .select("*")
          .eq("user_id", userId)
          .order("date", { ascending: false });
        if (dbNotes) setNotes(dbNotes.map((n) => ({ ...n, notionId: n.notion_id || null })));

        // 5. ดึงเพลย์ลิสต์เพลง (Playlists)
        const { data: dbPlaylist } = await supabase
          .from("playlists")
          .select("*")
          .eq("user_id", userId);
        if (dbPlaylist) {
          // แปลงชื่อฟิลด์ yt_id จากฐานข้อมูลกลับมาใช้ในแอป
          const mappedPlaylist = dbPlaylist.map(p => ({
            id: p.id, kind: p.kind, name: p.name, url: p.url, ytId: p.yt_id, persist: p.persist
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
  useEffect(() => { try { sessionStorage.setItem("refhub:page", page); } catch (e) {} }, [page]);

  // 🎯 migration ครั้งเดียว: เป้าหมายเก่าที่ยังไม่มีวันที่ผูกไว้ (จากก่อนมีระบบ report) ให้ใส่วันที่ปัจจุบันให้อัตโนมัติ
  useEffect(() => {
    if (!loaded) return;
    const needsMigration = goals.some((g) => !g.date);
    if (needsMigration) setGoals((gs) => gs.map((g) => (g.date ? g : { ...g, date: todayStr(), doneDate: g.done ? todayStr() : null })));
  }, [loaded]);


  // save ทั้ง Local และระบบ Cloud (Settings)
// ⚡ ตัว Interceptor: ดักฟังการเปลี่ยนแปลงจากปุ่มเดิมของพี่ แล้วสั่งทำงานขนานคู่กันไปเลย!
useEffect(() => {
  if (!loaded || !userId) return;
  // เมื่อใดก็ตามที่ปุ่มเดิมของพี่ทำฟังก์ชัน setGoals สำเร็จ และข้อมูลเปลี่ยน
  // เราจะใช้จุดนี้ตรวจเช็กและซิงค์ความต่างขึ้นตาราง Supabase ทันทีโดยอัตโนมัติ
  const syncGoalsToCloud = async () => {
    try {
      // ดึงข้อมูลล่าสุดจาก Cloud มาเทียบ
      const { data: currentDb } = await supabase.from("goals").select("*").eq("user_id", userId);
      if (!currentDb) return;

      const dbMap = Object.fromEntries(currentDb.map((x) => [x.id, x]));
      const localIds = goals.map(x => x.id);

      // 1. ตรวจสอบตัวที่เพิ่มใหม่ในแอป -> ยิงขึ้น Cloud
      for (const g of goals) {
        const match = dbMap[g.id];
        if (!match) {
          await supabase.from("goals").insert({ id: g.id, user_id: userId, text: g.text, done: g.done, date: g.date || todayStr(), done_date: g.doneDate || null });
        } else if (match.done !== g.done || (match.done_date || null) !== (g.doneDate || null)) {
          // 2. ตรวจสอบตัวที่สลับสถานะ ติ๊กถูก/เอาออก
          await supabase.from("goals").update({ done: g.done, done_date: g.doneDate || null }).eq("id", g.id);
        }
      }

      // 3. ตรวจสอบตัวที่โดนลบออกไปจากแอป -> สั่งลบใน Cloud
      for (const dbG of currentDb) {
        if (!localIds.includes(dbG.id)) {
          await supabase.from("goals").delete().eq("id", dbG.id);
        }
      }
    } catch (e) {}
  };
  syncGoalsToCloud();
}, [goals, loaded]);

// 🌐 sync รายการเงิน (tx) ขึ้น Supabase แบบเดียวกับ goals
useEffect(() => {
  if (!loaded || !userId) return;
  const syncTxToCloud = async () => {
    try {
      const { data: currentDb } = await supabase.from("transactions").select("id").eq("user_id", userId);
      if (!currentDb) return;
      const dbIds = currentDb.map((x) => x.id);
      const localIds = tx.map((x) => x.id);
      for (const x of tx) {
        if (!dbIds.includes(x.id)) {
          await supabase.from("transactions").insert({ id: x.id, user_id: userId, type: x.type, cat: x.cat, amount: x.amount, note: x.note, date: x.date });
        }
      }
      for (const dbX of currentDb) {
        if (!localIds.includes(dbX.id)) await supabase.from("transactions").delete().eq("id", dbX.id);
      }
    } catch (e) {}
  };
  syncTxToCloud();
}, [tx, loaded]);

// 🌐 sync โน้ต (notes) ขึ้น Supabase
useEffect(() => {
  if (!loaded || !userId) return;
  const syncNotesToCloud = async () => {
    try {
      const { data: currentDb } = await supabase.from("notes").select("*").eq("user_id", userId);
      if (!currentDb) return;
      const dbMap = Object.fromEntries(currentDb.map((x) => [x.id, x]));
      const localIds = notes.map((x) => x.id);
      for (const n of notes) {
        const dbN = dbMap[n.id];
        if (!dbN) {
          await supabase.from("notes").insert({ id: n.id, user_id: userId, title: n.title, body: n.body, date: n.date, pinned: !!n.pinned, tags: n.tags || [], notion_id: n.notionId || null });
        } else if (dbN.title !== n.title || JSON.stringify(dbN.body) !== JSON.stringify(n.body) || !!dbN.pinned !== !!n.pinned || JSON.stringify(dbN.tags || []) !== JSON.stringify(n.tags || []) || (dbN.notion_id || null) !== (n.notionId || null)) {
          // เนื้อหาแก้ไขแล้ว (จากฟีเจอร์แก้ไขโน้ต) หรือเพิ่ง sync ขึ้น Notion -> update ขึ้น cloud ด้วย ไม่ใช่แค่ insert/delete
          await supabase.from("notes").update({ title: n.title, body: n.body, pinned: !!n.pinned, tags: n.tags || [], notion_id: n.notionId || null }).eq("id", n.id);
        }
      }
      for (const dbN of currentDb) {
        if (!localIds.includes(dbN.id)) await supabase.from("notes").delete().eq("id", dbN.id);
      }
    } catch (e) {}
  };
  syncNotesToCloud();
}, [notes, loaded]);

// 🌐 sync เพลย์ลิสต์ (playlist) ขึ้น Supabase — ไม่ sync ไฟล์ที่ persist:false (ไฟล์ใหญ่ >1.5MB)
useEffect(() => {
  if (!loaded || !userId) return;
  const syncPlaylistToCloud = async () => {
    try {
      const syncable = playlist.filter((p) => p.kind === "yt" || (p.kind === "file" && p.persist));
      const { data: currentDb } = await supabase.from("playlists").select("id").eq("user_id", userId);
      if (!currentDb) return;
      const dbIds = currentDb.map((x) => x.id);
      const localIds = syncable.map((x) => x.id);
      for (const p of syncable) {
        if (!dbIds.includes(p.id)) {
          await supabase.from("playlists").insert({ id: p.id, user_id: userId, kind: p.kind, name: p.name, url: p.url || null, yt_id: p.ytId || null, src: p.kind === "file" ? p.src : null, persist: !!p.persist });
        }
      }
      for (const dbP of currentDb) {
        if (!localIds.includes(dbP.id)) await supabase.from("playlists").delete().eq("id", dbP.id);
      }
    } catch (e) {}
  };
  syncPlaylistToCloud();
}, [playlist, loaded]);

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
    if (!userId) { setAuthProfile(null); return; }
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
    })();
  }, [userId]);

  // 💓 heartbeat — อัปเดต last_seen ทุก 60 วิ ตอนแอปเปิดอยู่ (ใช้บอกสถานะ "ออนไลน์อยู่ไหม" ในหน้า Admin)
  useEffect(() => {
    if (!userId) return;
    const ping = () => supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", userId).then(() => {}, () => {});
    ping();
    const id = setInterval(ping, 60000);
    return () => clearInterval(id);
  }, [userId]);

  // 📍 อัปเดตตำแหน่งเบื้องหลังทุก 5 นาทีตอนเปิดแอปอยู่ (เฉพาะคนที่เปิดแชร์ตำแหน่งไว้เท่านั้น)
  useEffect(() => {
    if (!userId) return;
    const updateLoc = async () => {
      try {
        const { data } = await supabase.from("locations").select("share_enabled").eq("user_id", userId).maybeSingle();
        if (!data?.share_enabled || !navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
          (pos) => { supabase.from("locations").update({ lat: pos.coords.latitude, lng: pos.coords.longitude, updated_at: new Date().toISOString() }).eq("user_id", userId).then(() => {}, () => {}); },
          () => {}, { timeout: 10000 }
        );
      } catch (e) {}
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
    const channel = supabase.channel("unread-watch").on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, computeUnread).subscribe();
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
  const quote = M.quotes[quoteIdx % M.quotes.length];

  // 🔐 เกตระบบล็อกอิน — เช็คก่อนแสดงแอปจริง
  if (!authChecked) return <AuthLoadingScreen />;
  if (!session) return <AuthPage />;
  if (!authProfile || !authProfile.approved) return <PendingApprovalScreen profile={authProfile} onLogout={() => supabase.auth.signOut()} />;

  return (
    <div style={{ minHeight: "100vh", background: t.page, display: "flex", justifyContent: "center", fontFamily: "'IBM Plex Sans Thai','Segoe UI','Helvetica Neue',system-ui,sans-serif", zoom: `${fontScale}%` }}>
      <div style={{ width: "100%", maxWidth: 440, position: "relative", background: t.bg, minHeight: "100vh", overflow: "hidden", transition: "background .5s" }}>
        {t.star && <Stars />}

        {/* HEADER */}
        <div style={{ position: "relative", zIndex: 3, padding: "18px 18px 0" }}>
          {page === "home" ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <button onClick={() => setEditProfile(true)} style={{ display: "flex", alignItems: "center", gap: 11, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                <Avatar profile={profile} t={t} size={46} />
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 11.5, color: t.sub }}>{greet(isNight)}</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: t.text, display: "flex", alignItems: "center", gap: 5 }}>
                    {profile.name || (loaded ? "ผู้ใช้ใหม่" : "กำลังโหลด...")} <Pencil size={12} color={t.faint} />
                  </div>
                </div>
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                <IconBtn t={t} onClick={() => setSearchOpen(true)}><Search size={17} color={t.text} /></IconBtn>
                <button onClick={() => setPage("chat")} style={{ position: "relative", width: 38, height: 38, borderRadius: 19, background: t.surface, border: `1px solid ${t.border}`, cursor: "pointer", display: "grid", placeItems: "center" }}>
                  <MessageCircle size={17} color={t.text} />
                  {chatUnread > 0 && <span style={{ position: "absolute", top: 3, right: 3, width: 8, height: 8, borderRadius: 4, background: "#D9534F" }} />}
                </button>
                <button onClick={() => setMoreMenuOpen(true)} style={{ position: "relative", width: 38, height: 38, borderRadius: 19, background: t.surface, border: `1px solid ${t.border}`, cursor: "pointer", display: "grid", placeItems: "center" }}>
                  <MoreVertical size={17} color={t.text} />
                  {adminAlerts.length > 0 && <span style={{ position: "absolute", top: 3, right: 3, width: 8, height: 8, borderRadius: 4, background: "#D9534F" }} />}
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

        {/* CONTENT */}
        <div style={{ position: "relative", zIndex: 2, padding: "16px 18px 120px", height: "calc(100vh - 76px)", overflowY: "auto" }}>
          {page === "home" && <HomePage {...{ t, M, quote, isNight, setMentorPick, balance, tx, goals: todayGoals, goalDone, goalPct, setGoals, notes, setPage, setChatOpen }} />}
          {page === "ledger" && <FinancePage {...{ t, tx, setTx, categories, openAdd: () => setAddOpen(true), openExport: (txt) => setExportText(txt) }} />}
          {page === "note" && <NotePage {...{ t, notes, setNotes, isNight, userId }} />}
          {page === "ideas" && <IdeasPage t={t} M={M} userId={userId} session={session} authProfile={authProfile} setAuthProfile={setAuthProfile} setNotes={setNotes} />}
          {page === "trade" && <TradePage t={t} />}
          {page === "news" && <NewsPage t={t} />}
          {page === "lang" && <LangPage t={t} />}
          {page === "goalsReport" && <GoalsReportPage t={t} goals={goals} />}
          {page === "admin" && <AdminPage t={t} session={session} userId={userId} adminAlerts={adminAlerts} setAdminAlerts={setAdminAlerts} />}
          {page === "locations" && <LocationsPage t={t} userId={userId} />}
          {page === "chat" && <ChatEntryPage t={t} M={M} userId={userId} authProfile={authProfile} session={session} openThread={(id, name, isGroup, avatarUrl) => { setActiveThread({ id, name, isGroup: !!isGroup, avatarUrl: avatarUrl || null }); setPage("chatRoom"); }} />}
          {page === "chatRoom" && activeThread && <ChatRoomPage t={t} userId={userId} thread={activeThread} profile={profile} session={session} />}

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

        <Dock t={t} page={page} setPage={setPage} onQuickAdd={() => setAddOpen(true)} />

        {mentorPick && <MentorPicker t={t} mentor={mentor} setMentor={setMentor} authProfile={authProfile} setAuthProfile={setAuthProfile} userId={userId} close={() => setMentorPick(false)} />}
        {themePick && <ThemePicker t={t} theme={theme} setTheme={setTheme} mode={mode} close={() => setThemePick(false)} />}
        {moreMenuOpen && (
          <div style={overlay} onClick={() => setMoreMenuOpen(false)}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "24px 24px 0 0", padding: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: t.text, marginBottom: 14 }}>เพิ่มเติม</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <button onClick={() => { setMusicOpen(true); setMoreMenuOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 10px", borderRadius: 14, border: "none", background: "none", cursor: "pointer", textAlign: "left" }}><Music size={18} color={t.sub} /><span style={{ fontSize: 14, color: t.text }}>เพลง</span></button>
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
                <button onClick={() => { setPage("locations"); setMoreMenuOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 10px", borderRadius: 14, border: "none", background: "none", cursor: "pointer", textAlign: "left" }}>
                  <MapPin size={18} color={t.sub} /><span style={{ fontSize: 14, color: t.text }}>ตำแหน่งครอบครัว</span>
                </button>
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
        {accountSettingsOpen && <AccountSettingsModal t={t} authProfile={authProfile} userId={userId} close={() => setAccountSettingsOpen(false)} />}
        {chatOpen && <ChatModal t={t} M={M} mentor={mentor} close={() => setChatOpen(false)} />}
        {editProfile && <EditProfile t={t} M={M} profile={profile} setProfile={setProfile} userId={userId} authProfile={authProfile} setAuthProfile={setAuthProfile} close={() => setEditProfile(false)} />}
        {searchOpen && <SearchOverlay t={t} notes={notes} goals={goals} tx={tx} categories={categories} setPage={setPage} close={() => setSearchOpen(false)} />}
        {musicOpen && <MusicModal {...{ t, M, playlist, setPlaylist, folders, setFolders, curId, playing, playTrack, togglePlay, stopAll, moveTrack, toggleFavorite, volume, setVolume, close: () => setMusicOpen(false) }} />}
        {addOpen && <AddTxModal t={t} tx={tx} setTx={setTx} categories={categories} moveCategory={moveCategory} deleteCategory={deleteCategory} addCategory={addCategory} close={() => setAddOpen(false)} />}
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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F6F1E8" }}>
      <div style={{ width: 64, height: 64, borderRadius: 18, background: "#EA9552" }} />
    </div>
  );
}

function CloverMark({ size = 80 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.25, background: "#EA9552", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", flexShrink: 0 }}>
      <span style={{ fontFamily: "'Baloo 2','IBM Plex Sans Thai',sans-serif", fontSize: size * 0.5, fontWeight: 700, color: "#3A2408" }}>R</span>
      <div style={{ position: "absolute", top: size * 0.1, right: size * 0.08, width: size * 0.22, height: size * 0.22 }}>
        <div style={{ position: "absolute", left: "35%", top: "0%", width: "40%", height: "40%", borderRadius: "50%", background: "#FFFFFF" }} />
        <div style={{ position: "absolute", left: "35%", top: "55%", width: "40%", height: "40%", borderRadius: "50%", background: "#FFFFFF" }} />
        <div style={{ position: "absolute", left: "0%", top: "27%", width: "40%", height: "40%", borderRadius: "50%", background: "#FFFFFF" }} />
        <div style={{ position: "absolute", left: "65%", top: "27%", width: "40%", height: "40%", borderRadius: "50%", background: "#FFFFFF" }} />
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

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const submit = async () => {
    setErr(""); setInfo("");
    setLoading(true);
    try {
      if (mode === "login" && loginWith === "pin") {
        if (!username.trim() || !pin) { setErr("กรอกชื่อผู้ใช้และ PIN ให้ครบ"); setLoading(false); return; }
        const { error } = await supabase.auth.signInWithPassword({ email: `${username.trim().toLowerCase()}@refhub.local`, password: pin });
        if (error) throw error;
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
        if (error) throw error;
      }
    } catch (e) {
      setErr(e.message === "Invalid login credentials" ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง" : e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", background: "#F6F1E8", fontFamily: "'IBM Plex Sans Thai',sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 440, padding: "56px 24px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}><CloverMark size={84} /></div>
        <div style={{ textAlign: "center", fontSize: 18, fontWeight: 700, color: "#26303F", marginBottom: 2 }}>RefHub</div>
        <div style={{ textAlign: "center", fontSize: 12.5, color: "#7A828F", marginBottom: 26 }}>ที่พักใจของครอบครัวคุณ</div>

        <div style={{ display: "flex", background: "#FFFFFF", borderRadius: 14, padding: 4, marginBottom: 16, border: "1px solid rgba(0,0,0,0.06)" }}>
          <button onClick={() => setMode("login")} style={{ flex: 1, textAlign: "center", padding: "10px 0", borderRadius: 11, border: "none", cursor: "pointer", background: mode === "login" ? "#EA9552" : "transparent", color: mode === "login" ? "#3A2408" : "#7A828F", fontWeight: 600, fontSize: 13.5 }}>เข้าสู่ระบบ</button>
          <button onClick={() => setMode("signup")} style={{ flex: 1, textAlign: "center", padding: "10px 0", borderRadius: 11, border: "none", cursor: "pointer", background: mode === "signup" ? "#EA9552" : "transparent", color: mode === "signup" ? "#3A2408" : "#7A828F", fontWeight: 600, fontSize: 13.5 }}>สมัครสมาชิก</button>
        </div>

        {mode === "login" && (
          <div style={{ display: "flex", gap: 14, marginBottom: 16, justifyContent: "center" }}>
            <button onClick={() => setLoginWith("email")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, color: loginWith === "email" ? "#EA9552" : "#A7ADB8", borderBottom: loginWith === "email" ? "2px solid #EA9552" : "2px solid transparent", paddingBottom: 4 }}>ด้วยอีเมล</button>
            <button onClick={() => setLoginWith("pin")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, color: loginWith === "pin" ? "#EA9552" : "#A7ADB8", borderBottom: loginWith === "pin" ? "2px solid #EA9552" : "2px solid transparent", paddingBottom: 4 }}>ด้วยชื่อ + PIN</button>
          </div>
        )}

        {mode === "login" && loginWith === "pin" ? (
          <>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ชื่อผู้ใช้ที่แอดมินตั้งให้ เช่น mom" style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 12, padding: "11px 14px", fontSize: 13.5, marginBottom: 10, outline: "none" }} />
            <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} type="password" inputMode="numeric" placeholder="PIN 4-6 หลัก" style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 12, padding: "11px 14px", fontSize: 13.5, marginBottom: 14, outline: "none", letterSpacing: 3 }} />
          </>
        ) : (
          <>
            {mode === "signup" && (
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อของคุณ" style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 12, padding: "11px 14px", fontSize: 13.5, marginBottom: 10, outline: "none" }} />
            )}

            <div style={{ background: "#FFFFFF", border: `1px solid ${email && !emailOk ? "#D9534F" : "rgba(0,0,0,0.06)"}`, borderRadius: 12, padding: "11px 14px", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.com" style={{ flex: 1, border: "none", outline: "none", fontSize: 13.5, background: "transparent" }} />
              {email && <span style={{ fontSize: 13, color: emailOk ? "#2E9E6B" : "#D9534F" }}>{emailOk ? "✓" : "!"}</span>}
            </div>
            <div style={{ fontSize: 11, color: email ? (emailOk ? "#2E9E6B" : "#D9534F") : "#A7ADB8", marginBottom: 10, paddingLeft: 2, minHeight: 14 }}>
              {email ? (emailOk ? "รูปแบบอีเมลถูกต้อง" : "รูปแบบอีเมลยังไม่ถูกต้อง") : "พิมพ์อีเมลของคุณ"}
            </div>

            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="รหัสผ่าน (อย่างน้อย 6 ตัว)" style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 12, padding: "11px 14px", fontSize: 13.5, marginBottom: 10, outline: "none" }} />

            {mode === "signup" && (
              <input value={familyCode} onChange={(e) => setFamilyCode(e.target.value)} placeholder="รหัสเชิญครอบครัว (ถ้ามี)" style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 12, padding: "11px 14px", fontSize: 13.5, marginBottom: 14, outline: "none" }} />
            )}
          </>
        )}

        {err && <div style={{ fontSize: 12, color: "#D9534F", marginBottom: 10, textAlign: "center" }}>{err}</div>}
        {info && <div style={{ fontSize: 12, color: "#2E9E6B", marginBottom: 10, textAlign: "center" }}>{info}</div>}

        <button onClick={submit} disabled={loading} style={{ background: loading ? "#F0DCC3" : "#EA9552", border: "none", borderRadius: 14, padding: "13px 0", fontSize: 14, fontWeight: 700, color: "#3A2408", cursor: loading ? "default" : "pointer", marginTop: 6 }}>
          {loading ? "กำลังดำเนินการ..." : mode === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
        </button>

        <div style={{ textAlign: "center", fontSize: 11, color: "#A7ADB8", marginTop: 18 }}>บัญชีใหม่ต้องรอแอดมินอนุมัติก่อนใช้งาน (ยกเว้นคนแรกสุด)</div>
      </div>
    </div>
  );
}

function AccountSettingsModal({ t, authProfile, userId, close }) {
  const [newEmail, setNewEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMsg, setPushMsg] = useState("");
  const [locShare, setLocShare] = useState(false);
  const [locBusy, setLocBusy] = useState(false);
  const [locMsg, setLocMsg] = useState("");
  const isPinAccount = authProfile?.login_type === "pin";

  useEffect(() => {
    supabase.from("locations").select("share_enabled").eq("user_id", userId).maybeSingle().then(({ data }) => setLocShare(data?.share_enabled || false));
  }, [userId]);

  const toggleLocationShare = async () => {
    setLocBusy(true); setLocMsg("");
    try {
      if (!locShare) {
        if (!navigator.geolocation) throw new Error("เบราว์เซอร์นี้ไม่รองรับตำแหน่ง");
        const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 }));
        await supabase.from("locations").upsert({ user_id: userId, lat: pos.coords.latitude, lng: pos.coords.longitude, updated_at: new Date().toISOString(), share_enabled: true });
        setLocShare(true);
        setLocMsg("เปิดแชร์ตำแหน่งแล้ว");
      } else {
        await supabase.from("locations").update({ share_enabled: false }).eq("user_id", userId);
        setLocShare(false);
        setLocMsg("ปิดแชร์ตำแหน่งแล้ว");
      }
    } catch (e) {
      setLocMsg("ทำรายการไม่สำเร็จ: " + e.message);
    } finally { setLocBusy(false); }
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

  const enableNotifications = async () => {
    setPushBusy(true); setPushMsg("");
    try {
      const ok2 = await subscribeToPush(userId);
      setPushMsg(ok2 ? "เปิดการแจ้งเตือนสำเร็จ! มีข้อความใหม่จะเด้งแจ้งเตือนแม้ปิดแอปอยู่" : "");
    } catch (e) {
      setPushMsg("เปิดไม่สำเร็จ: " + e.message);
    } finally { setPushBusy(false); }
  };

  return (
    <div style={overlay} onClick={close}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "24px 24px 0 0", padding: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: t.text, marginBottom: 14 }}>ตั้งค่าบัญชี</div>
        <div style={{ ...card(t), padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: t.sub, marginBottom: 4 }}>เข้าสู่ระบบด้วย</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{isPinAccount ? `ชื่อผู้ใช้ + PIN (${authProfile?.username})` : authProfile?.email}</div>
        </div>

        <div style={{ ...card(t), padding: 14, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}><Bell size={15} color={t.accent} /><span style={{ fontSize: 13, fontWeight: 700, color: t.text }}>การแจ้งเตือน</span></div>
          <div style={{ fontSize: 11.5, color: t.sub, marginBottom: 10, lineHeight: 1.6 }}>เปิดแล้วจะได้รับแจ้งเตือนทันทีเมื่อมีข้อความแชทใหม่ แม้ปิดแอปอยู่ก็ตาม (เบราว์เซอร์จะขออนุญาตก่อน)</div>
          {pushMsg && <div style={{ fontSize: 11.5, color: pushMsg.startsWith("เปิดไม่สำเร็จ") ? "#D9534F" : "#2E9E6B", marginBottom: 10 }}>{pushMsg}</div>}
          <button onClick={enableNotifications} disabled={pushBusy} style={{ width: "100%", padding: "10px 0", borderRadius: 10, border: `1px solid ${t.border}`, background: "none", cursor: "pointer", color: t.text, fontSize: 12.5, fontWeight: 700 }}>{pushBusy ? "กำลังเปิด..." : "เปิดการแจ้งเตือน"}</button>
        </div>

        <div style={{ ...card(t), padding: 14, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}><MapPin size={15} color={t.accent} /><span style={{ fontSize: 13, fontWeight: 700, color: t.text }}>แชร์ตำแหน่งของฉัน</span></div>
          <div style={{ fontSize: 11.5, color: t.sub, marginBottom: 10, lineHeight: 1.6 }}>เปิดแล้วคนที่แอดมินอนุญาตให้ดูได้จะเห็นตำแหน่งล่าสุดของคุณ (อัปเดตทุก 5 นาทีตอนเปิดแอปอยู่) ปิดได้ตลอดเวลา</div>
          {locMsg && <div style={{ fontSize: 11.5, color: locMsg.startsWith("ทำรายการไม่สำเร็จ") ? "#D9534F" : "#2E9E6B", marginBottom: 10 }}>{locMsg}</div>}
          <button onClick={toggleLocationShare} disabled={locBusy} style={{ width: "100%", padding: "10px 0", borderRadius: 10, border: `1px solid ${locShare ? "#2E9E6B" : t.border}`, background: locShare ? "#2E9E6B18" : "none", cursor: "pointer", color: locShare ? "#2E9E6B" : t.text, fontSize: 12.5, fontWeight: 700 }}>{locBusy ? "กำลังทำรายการ..." : locShare ? "กำลังแชร์อยู่ (กดเพื่อปิด)" : "เปิดแชร์ตำแหน่ง"}</button>
        </div>

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
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", background: "#F6F1E8", fontFamily: "'IBM Plex Sans Thai',sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 440, padding: "80px 24px", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}><CloverMark size={72} /></div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#26303F", marginBottom: 8 }}>รอแอดมินอนุมัติ</div>
        <div style={{ fontSize: 13, color: "#7A828F", lineHeight: 1.6, marginBottom: 4 }}>
          บัญชี {profile?.email ? <b>{profile.email}</b> : "ของคุณ"} สมัครสำเร็จแล้ว<br />แต่ยังใช้งานแอปไม่ได้จนกว่าแอดมินจะกดอนุมัติ
        </div>
        <button onClick={onLogout} style={{ marginTop: 24, background: "none", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 12, padding: "10px 20px", fontSize: 13, color: "#7A828F", cursor: "pointer" }}>ออกจากระบบ</button>
      </div>
    </div>
  );
}

function ytExtract(url) {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function MusicModal({ t, M, playlist, setPlaylist, folders, setFolders, curId, playing, playTrack, togglePlay, stopAll, moveTrack, toggleFavorite, volume, setVolume, close }) {
  const [ytUrl, setYtUrl] = useState("");
  const fileRef = useRef(null);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState("all"); // "all" | "fav" | folder.id
  const flashSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 1800); };

  const activeFolderId = tab === "all" || tab === "fav" ? null : tab;
  const addYt = () => {
    const id = ytExtract(ytUrl.trim());
    if (!id) { alert("ลิงก์ YouTube ไม่ถูกต้อง ลองก๊อปลิงก์จากปุ่ม Share ของ YouTube"); return; }
    setPlaylist((p) => [...p, { id: uid(), kind: "yt", name: "YouTube · " + id, ytId: id, url: ytUrl.trim(), favorite: false, folderId: activeFolderId }]); setYtUrl(""); flashSaved();
  };
  const addFileInner = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const small = f.size < 1.5 * 1024 * 1024;
    if (small) { const rd = new FileReader(); rd.onload = () => { setPlaylist((p) => [...p, { id: uid(), kind: "file", name: f.name, src: rd.result, persist: true, favorite: false, folderId: activeFolderId }]); flashSaved(); }; rd.readAsDataURL(f); }
    else { const url = URL.createObjectURL(f); setPlaylist((p) => [...p, { id: uid(), kind: "file", name: f.name + " (ไม่บันทึกถาวร)", src: url, persist: false, favorite: false, folderId: activeFolderId }]); flashSaved(); }
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
          <div style={{ fontSize: 17, fontWeight: 800, color: t.text }}>เพลงของฉัน 🎵</div>
          <button onClick={close} style={ghost}><X size={20} color={t.sub} /></button>
        </div>
        <div style={{ fontSize: 12, color: t.sub, marginBottom: 14 }}>เปิดเพลงที่ชอบระหว่างใช้แอป · เพิ่มแล้วบันทึกอัตโนมัติ</div>

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
            <input value={ytUrl} onChange={(e) => setYtUrl(e.target.value)} placeholder="วางลิงก์ YouTube..." style={input(t)} />
            <button onClick={addYt} style={{ ...primaryBtn(t), padding: "0 14px", display: "flex", alignItems: "center", gap: 5 }}><Link2 size={15} /> เพิ่ม</button>
          </div>
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
        <div style={{ fontSize: 12.5, fontWeight: 800, color: t.sub, marginBottom: 8 }}>เพลย์ลิสต์ ({shown.length})</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {shown.length === 0 && <div style={{ textAlign: "center", color: t.sub, fontSize: 13, padding: "20px 0" }}>ยังไม่มีเพลงในหมวดนี้</div>}
          {shown.map((tr, i) => (
            <TrackRow key={tr.id} t={t} M={M} track={tr} active={curId === tr.id} playing={playing && curId === tr.id}
              folders={folders} isFirst={i === 0} isLast={i === shown.length - 1}
              onPlay={() => playTrack(tr)} onToggle={togglePlay}
              onDel={() => {
                if (tab === "all") setPlaylist((p) => p.filter((x) => x.id !== tr.id));       // แท็บทั้งหมด -> ลบจริง
                else if (tab === "fav") toggleFavorite(tr.id);                                   // แท็บโปรด -> แค่เอาออกจากโปรด
                else setTrackFolder(tr.id, null);                                                 // แท็บหมวดหมู่ -> แค่เอาออกจากหมวด ไม่ลบต้นฉบับ
              }}
              onFav={() => toggleFavorite(tr.id)}
              onMoveUp={() => moveTrack(tr.id, -1)} onMoveDown={() => moveTrack(tr.id, 1)}
              onFolder={(fid) => setTrackFolder(tr.id, fid)} />
          ))}
        </div>
        <div style={{ fontSize: 10.5, color: t.faint, textAlign: "center", marginTop: 14 }}>
          เพลง YouTube แสดงเป็นการ์ด "กำลังเล่น" ที่หน้า Home ใต้เป้าหมายวันนี้ (ตาม YouTube ToS ต้องมองเห็นได้ตอนเล่น) — ถ้าออกจากหน้า Home วิดีโออาจหยุดเล่นตามพฤติกรรมเบราว์เซอร์ · ไฟล์เพลงเล่นต่อได้ทุกหน้าเหมือนเดิม · ไฟล์ใหญ่กว่า 1.5MB เล่นเฉพาะรอบนี้ · ดาวน์โหลดได้เฉพาะไฟล์ที่แนบเอง (YouTube ดาวน์โหลดไม่ได้ตามกติกา)
        </div>
      </div>
    </div>
  );
}

function TrackRow({ t, M, track, active, playing, folders, isFirst, isLast, onPlay, onToggle, onDel, onFav, onMoveUp, onMoveDown, onFolder }) {
  const icon = track.kind === "yt" ? <Music size={16} color="#E0507B" /> : track.kind === "file" ? <Music size={16} color="#3DA5D9" /> : <Sparkles size={16} color={t.accent} />;
  return (
    <div style={{ ...card(t), padding: "10px 12px", border: `1px solid ${active ? t.accent : t.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={active ? onToggle : onPlay} style={{ width: 34, height: 34, borderRadius: 17, border: "none", cursor: "pointer", background: active ? t.accent : `${t.accent}22`, color: active ? t.onAccent : t.accent, display: "grid", placeItems: "center", flexShrink: 0 }}>
          {active && playing ? <Pause size={15} /> : <Play size={15} />}
        </button>
        <span style={{ flexShrink: 0 }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: t.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.name}</div>
        <button onClick={onFav} style={ghost} title="โปรด"><Sparkles size={15} color={track.favorite ? "#E0B24A" : t.faint} fill={track.favorite ? "#E0B24A" : "none"} /></button>
        {track.kind === "file" && (
          <a href={track.src} download={track.name} style={{ ...ghost, display: "grid", placeItems: "center" }} title="ดาวน์โหลด"><Download size={15} color={t.faint} /></a>
        )}
        {onDel && <button onClick={onDel} style={ghost}><Trash2 size={15} color={t.faint} /></button>}
      </div>
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
function HomePage({ t, M, quote, isNight, setMentorPick, balance, tx, goals, goalDone, goalPct, setGoals, notes, setPage, setChatOpen }) {
  const [goalText, setGoalText] = useState("");
  const latestNote = notes[0];
  const todayNet = tx.filter((x) => x.date === todayStr()).reduce((s, x) => s + (x.type === "in" ? x.amount : -x.amount), 0);

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
        <CatCard t={t} k="green" icon={<Wallet size={15} color="#fff" />} label="พอร์ตโฟลิโอ" onClick={() => setPage("ledger")}>
          <div style={{ fontSize: 19, fontWeight: 800, color: t.catTx.green }}>{fmt(balance)}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: todayNet >= 0 ? "#2E9E6B" : "#D9534F", marginTop: 2 }}>{todayNet >= 0 ? "▲ +" : "▼ "}{Math.abs(todayNet).toLocaleString()} วันนี้</div>
        </CatCard>
        <CatCard t={t} k="amber" icon={<BookOpen size={15} color="#fff" />} label="ความรู้วันนี้" onClick={() => setPage("ideas")}>
          <div style={{ fontSize: 14, fontWeight: 800, color: t.catTx.amber }}>RPA ขั้นเทพ</div>
          <div style={{ fontSize: 10.5, color: t.catLb.amber, marginTop: 3 }}>4 บทความ · AI คัดให้</div>
        </CatCard>
        <CatCard t={t} k="coral" icon={<Target size={15} color="#fff" />} label="เป้าหมายวันนี้" onClick={() => setPage("goalsReport")}>
          <div style={{ fontSize: 16, fontWeight: 800, color: t.catTx.coral }}>{goalDone} / {goals.length || 0} สำเร็จ</div>
          <div style={{ height: 7, borderRadius: 4, background: "rgba(0,0,0,.1)", marginTop: 8, overflow: "hidden" }}><div style={{ width: `${goalPct}%`, height: "100%", background: "#E07B57" }} /></div>
        </CatCard>
        <CatCard t={t} k="violet" icon={<StickyNote size={15} color="#fff" />} label="โน้ตล่าสุด" onClick={() => setPage("note")}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: t.catTx.violet, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{latestNote ? latestNote.title || "(ไม่มีหัวข้อ)" : "ยังไม่มีโน้ต"}</div>
          <div style={{ fontSize: 10.5, color: t.catLb.violet, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{latestNote ? latestNote.body || "แตะเพื่อเปิด" : "แตะเพื่อเริ่ม"}</div>
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
            <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => setGoals((gs) => gs.map((x) => (x.id === g.id ? { ...x, done: !x.done, doneDate: !x.done ? todayStr() : null } : x)))} style={{ width: 22, height: 22, borderRadius: 7, border: `2px solid ${g.done ? t.accent : t.faint}`, background: g.done ? t.accent : "transparent", cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}>{g.done && <Check size={14} color={t.onAccent} />}</button>
              <span style={{ flex: 1, fontSize: 13.5, color: g.done ? t.sub : t.text, textDecoration: g.done ? "line-through" : "none" }}>{g.text}</span>
              <button onClick={() => setGoals((gs) => gs.filter((x) => x.id !== g.id))} style={ghost}><Trash2 size={15} color={t.faint} /></button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input value={goalText} onChange={(e) => setGoalText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && goalText.trim()) { setGoals((gs) => [...gs, { id: uid(), text: goalText.trim(), done: false, date: todayStr(), doneDate: null }]); setGoalText(""); } }} placeholder="เพิ่มเป้าหมายวันนี้..." style={input(t)} />
          <button onClick={() => { if (goalText.trim()) { setGoals((gs) => [...gs, { id: uid(), text: goalText.trim(), done: false, date: todayStr(), doneDate: null }]); setGoalText(""); } }} style={{ ...primaryBtn(t), padding: "0 16px" }}>เพิ่ม</button>
        </div>
      </div>
    </>
  );
}

// ---------------- Finance (full) ----------------
function FinancePage({ t, tx, setTx, categories, openAdd, openExport }) {
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
                  <button onClick={() => setTx((l) => l.filter((y) => y.id !== x.id))} style={ghost}><Trash2 size={15} color={t.faint} /></button>
                </div>
              </div>
            ); })}
          </div>
        </div>
      ))}
    </>
  );
}

function AdminPage({ t, session, userId, adminAlerts, setAdminAlerts }) {
  const [tab, setTab] = useState("overview"); // overview | members | add
  const [members, setMembers] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [detailMember, setDetailMember] = useState(null); // เปิด detail sheet ของสมาชิกคนนี้อยู่

  const loadMembers = async () => {
    setLoadingList(true);
    try {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      setMembers(data || []);
      if (detailMember) { const fresh = (data || []).find((x) => x.id === detailMember.id); if (fresh) setDetailMember(fresh); }
    } catch (e) {}
    setLoadingList(false);
  };
  useEffect(() => { loadMembers(); }, []);

  const isOnline = (lastSeen) => lastSeen && (Date.now() - new Date(lastSeen).getTime()) < 2 * 60 * 1000;

  const setApproved = async (id, approved) => { await supabase.from("profiles").update({ approved }).eq("id", id); loadMembers(); };
  const setRole = async (id, role) => { await supabase.from("profiles").update({ role }).eq("id", id); loadMembers(); };
  const setCanChat = async (id, can_chat) => { await supabase.from("profiles").update({ can_chat }).eq("id", id); loadMembers(); };
  const setCanViewLocations = async (id, can_view_locations) => { await supabase.from("profiles").update({ can_view_locations }).eq("id", id); loadMembers(); };
  const setMentorLimit = async (id, mentor_limit) => { await supabase.from("profiles").update({ mentor_limit }).eq("id", id); loadMembers(); };
  const resetMentorPick = async (id) => { await supabase.from("profiles").update({ unlocked_mentors: [] }).eq("id", id); loadMembers(); };
  const setTopicLimit = async (id, topic_limit) => { await supabase.from("profiles").update({ topic_limit }).eq("id", id); loadMembers(); };
  const setDailyArticleLimit = async (id, daily_article_limit) => { await supabase.from("profiles").update({ daily_article_limit }).eq("id", id); loadMembers(); };
  const removeMember = async (id) => { await supabase.from("profiles").delete().eq("id", id); setDetailMember(null); loadMembers(); };

  const pendingCount = members.filter((m) => !m.approved).length;
  const onlineMembers = members.filter((m) => isOnline(m.last_seen));
  const recentMembers = [...members].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);

  const AvatarDot = ({ m, size = 40 }) => (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <div style={{ width: size, height: size, borderRadius: size * 0.3, background: colorFor(m.name || m.email || "?"), color: "#fff", display: "grid", placeItems: "center", fontSize: size * 0.4, fontWeight: 700 }}>{(m.name || m.email || "?")[0].toUpperCase()}</div>
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
            setApproved={setApproved} setRole={setRole} setCanChat={setCanChat} setCanViewLocations={setCanViewLocations}
            setMentorLimit={setMentorLimit} setTopicLimit={setTopicLimit} setDailyArticleLimit={setDailyArticleLimit} resetMentorPick={resetMentorPick}
            removeMember={removeMember}
            close={() => setDetailMember(null)}
          />
        </ModalPortal>
      )}
    </>
  );
}

function MemberDetailModal({ t, m, isSelf, isOnline, setApproved, setRole, setCanChat, setCanViewLocations, setMentorLimit, setTopicLimit, setDailyArticleLimit, resetMentorPick, removeMember, close }) {
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
              <div style={{ width: 52, height: 52, borderRadius: 16, background: colorFor(m.name || m.email || "?"), color: "#fff", display: "grid", placeItems: "center", fontSize: 20, fontWeight: 700 }}>{(m.name || m.email || "?")[0].toUpperCase()}</div>
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
          <button onClick={() => setApproved(m.id, !m.approved)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 10, border: `1px solid ${m.approved ? "#2E9E6B" : "#D9534F"}`, cursor: "pointer", background: m.approved ? "#2E9E6B18" : "#D9534F18", color: m.approved ? "#2E9E6B" : "#D9534F", fontSize: 12, fontWeight: 700 }}>
            {m.approved ? <UserCheck size={13} /> : <UserX size={13} />} {m.approved ? "อนุมัติแล้ว" : "รออนุมัติ (กดเพื่ออนุมัติ)"}
          </button>
        </Row>
        {!isSelf && (
          <Row label="สิทธิ์แอดมิน">
            <button onClick={() => setRole(m.id, m.role === "admin" ? "member" : "admin")} style={{ padding: "6px 12px", borderRadius: 10, border: `1px solid ${t.border}`, cursor: "pointer", background: "none", color: t.sub, fontSize: 12, fontWeight: 700 }}>{m.role === "admin" ? "ถอดสิทธิ์แอดมิน" : "ตั้งเป็นแอดมิน"}</button>
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
            <Row label="จำนวนโค้ชที่ปลดล็อกได้">
              <select value={m.mentor_limit ?? 0} onChange={(e) => setMentorLimit(m.id, +e.target.value)} style={selectStyle}>
                {[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n} คน</option>)}
              </select>
            </Row>
            {(m.unlocked_mentors || []).length > 0 && (
              <Row label={`เลือกโค้ชแล้ว: ${MENTORS[m.unlocked_mentors[0]]?.full || m.unlocked_mentors[0]}`}>
                <button onClick={() => resetMentorPick(m.id)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 10, border: `1px solid ${t.border}`, cursor: "pointer", background: "none", color: t.sub, fontSize: 12, fontWeight: 700 }}>รีเซ็ตให้เลือกใหม่</button>
              </Row>
            )}
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

function ChatEntryPage({ t, M, userId, authProfile, session, openThread }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState(null); // null | "menu" | "create" | "join" | "direct"
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

      const list = (threads || []).map((th) => {
        if (th.type === "direct") {
          const otherUserId = (allMembers || []).find((m) => m.thread_id === th.id && m.user_id !== userId)?.user_id;
          const otherProfile = (otherProfiles || []).find((p) => p.id === otherUserId);
          return { id: th.id, name: otherProfile?.name || "เพื่อน", type: "direct", avatarUrl: otherProfile?.avatar_url || null };
        }
        return { id: th.id, name: th.name || "ห้องแชท", type: "group", avatarUrl: th.avatar_url, joinCode: th.created_by === userId ? th.join_code : null };
      });
      setRooms(list);
    } catch (e) {} finally { setLoading(false); }
  };
  const hasFullAccess = authProfile?.role === "admin" || authProfile?.role === "trusted";
  useEffect(() => { if (authProfile?.can_chat || hasFullAccess) loadRooms(); }, [authProfile?.can_chat, hasFullAccess]);

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
      const r = await fetch("/api/chat-start-direct", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ friendCode, callerToken: session?.access_token }) });
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
              <button onClick={() => openThread(r.id, r.name, r.type === "group", r.avatarUrl)} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "center", width: "100%" }}>
                {r.avatarUrl ? (
                  <img src={r.avatarUrl} alt="" style={{ width: 64, height: 64, borderRadius: 18, objectFit: "cover" }} />
                ) : (
                  <div style={{ width: 64, height: 64, borderRadius: 18, background: colorFor(r.name), display: "grid", placeItems: "center", color: "#fff", fontSize: 20, fontWeight: 700 }}>{r.name[0]}</div>
                )}
                <div style={{ fontSize: 11, color: t.text, marginTop: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 70 }}>{r.name}</div>
              </button>
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
  );
}


function ChatRoomPage({ t, userId, thread, profile, session }) {
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
  const fileRef = useRef(null);
  const endRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const broadcastRef = useRef(null);

  const markRead = () => supabase.from("chat_reads").upsert({ user_id: userId, thread_id: thread.id, last_read_at: new Date().toISOString() }).then(() => {}, () => {});

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
    await supabase.from("chat_messages").insert({ thread_id: thread.id, sender_id: userId, text: t2 });
    notifyPush(otherMembers.map((m) => m.id), profile?.name || "ข้อความใหม่", t2, session?.access_token);
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
      notifyPush(otherMembers.map((m) => m.id), profile?.name || "ข้อความใหม่", isImage ? "ส่งรูปภาพมา" : `ส่งไฟล์: ${f.name}`, session?.access_token);
    } catch (err) {
      alert("แนบไฟล์ไม่สำเร็จ: " + err.message);
    } finally { setUploading(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 160px)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        {thread.avatarUrl ? (
          <img src={thread.avatarUrl} alt="" onClick={() => setLightbox(thread.avatarUrl)} style={{ width: 32, height: 32, borderRadius: 10, objectFit: "cover", cursor: "pointer" }} />
        ) : (
          <div style={{ width: 32, height: 32, borderRadius: 10, background: colorFor(thread.name), color: "#fff", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700 }}>{thread.name[0]}</div>
        )}
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>{thread.name}</div>
          {!thread.isGroup && otherMembers[0]?.status_message && <div style={{ fontSize: 11, color: t.sub, fontStyle: "italic" }}>{otherMembers[0].status_message}</div>}
        </div>
      </div>
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
        <input value={text} onChange={(e) => { setText(e.target.value); notifyTyping(); }} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="พิมพ์ข้อความ..." style={input(t)} />
        <button onClick={send} style={{ ...primaryBtn({ accent: t.accent, accent2: t.accent2, onAccent: t.onAccent }), width: 46, display: "grid", placeItems: "center" }}><Send size={17} /></button>
      </div>
      {lightbox && <ImageLightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </div>
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
      <PageHead t={t} title="ตำแหน่งครอบครัว" sub="เห็นเฉพาะคนที่แชร์ไว้และแอดมินอนุญาตให้คุณดู" icon={<MapPin size={20} color={t.accent} />} />
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

function GoalsReportPage({ t, goals }) {
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
              return (
                <div key={i} style={{ ...card(t), padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>{g.label}</div>
                    {streak > 0 && <span style={{ fontSize: 10.5, fontWeight: 800, color: t.accent, background: `${t.accent}18`, padding: "2px 8px", borderRadius: 10, flexShrink: 0, whiteSpace: "nowrap" }}>🔥 {streak} วันติด</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                    <div style={{ flex: 1, height: 7, borderRadius: 4, background: "rgba(0,0,0,.08)", overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", background: t.accent }} /></div>
                    <span style={{ fontSize: 11.5, color: t.sub, flexShrink: 0 }}>{g.done}/{g.total} วัน ({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

function AddTxModal({ t, tx, setTx, categories, moveCategory, deleteCategory, addCategory, close }) {
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
    setTx((l) => [{ id: uid(), type, cat, amount: a, note: finalNote, date }, ...l]);
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

function NotePage({ t, notes, setNotes, isNight, userId }) {
  const [title, setTitle] = useState(""); const [body, setBody] = useState(null); const [tagsInput, setTagsInput] = useState("");
  const [draftKey, setDraftKey] = useState(0); // เปลี่ยนค่านี้เพื่อบังคับให้ NoteEditor ตัวเพิ่มโน้ตใหม่รีเซ็ตเนื้อหาว่าง
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState(""); const [editBody, setEditBody] = useState(null); const [editTags, setEditTags] = useState("");
  const [tagFilter, setTagFilter] = useState(null);

  const parseTags = (str) => str.split(",").map((s) => s.trim()).filter(Boolean);

  const add = () => {
    const plain = blocksToPlainText(body).trim();
    if (!title.trim() && !plain) return;
    setNotes((n) => [{ id: uid(), title: title.trim(), body: body || migrateBody(""), date: todayStr(), pinned: false, tags: parseTags(tagsInput) }, ...n]);
    setTitle(""); setBody(null); setTagsInput(""); setDraftKey((k) => k + 1);
  };
  const startEdit = (n) => { setEditingId(n.id); setEditTitle(n.title); setEditBody(migrateBody(n.body)); setEditTags((n.tags || []).join(", ")); };
  const saveEdit = () => {
    setNotes((list) => list.map((n) => (n.id === editingId ? { ...n, title: editTitle.trim(), body: editBody, tags: parseTags(editTags) } : n)));
    setEditingId(null);
  };
  const togglePin = (id) => setNotes((list) => list.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)));

  // 📤 Export เป็น Markdown — Notion ลากไฟล์ .md ไป import ตรงๆ ได้เลย (ใช้ได้ทันทีไม่ต้องรอ deploy)
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

  // 🔗 Sync ขึ้น Notion จริง (ต้อง deploy ขึ้น Vercel + ตั้งค่า NOTION_TOKEN/NOTION_DATABASE_ID ก่อนถึงจะทำงานได้จริง)
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);
  const syncToNotion = async () => {
    const pending = notes.filter((n) => !n.notionId); // sync เฉพาะโน้ตที่ยังไม่เคยส่งไป (กันสร้างซ้ำ)
    if (pending.length === 0) { setSyncMsg("ไม่มีโน้ตใหม่ที่ต้อง sync"); setTimeout(() => setSyncMsg(null), 2500); return; }
    setSyncing(true); setSyncMsg(null);
    try {
      const r = await fetch("/api/notion-sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notes: pending }) });
      const data = await r.json();
      if (!r.ok) { setSyncMsg("Sync ไม่สำเร็จ: " + (data.error || "unknown error")); return; }
      const okMap = Object.fromEntries((data.results || []).filter((x) => x.ok).map((x) => [x.id, x.notionId]));
      setNotes((list) => list.map((n) => (okMap[n.id] ? { ...n, notionId: okMap[n.id] } : n)));
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
          <button onClick={syncToNotion} disabled={syncing} style={{ ...card(t), flex: 1, padding: "9px 0", border: `1px solid ${t.border}`, cursor: syncing ? "default" : "pointer", color: t.text, fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: syncing ? 0.6 : 1 }}>{syncing ? "กำลัง sync..." : "🔗 Sync Notion"}</button>
        </div>
      )}
      {syncMsg && <div style={{ fontSize: 11, color: t.sub, textAlign: "center", marginBottom: 12 }}>{syncMsg}</div>}

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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 800, color: t.text, display: "flex", alignItems: "center", gap: 6 }}>
                    {n.pinned && <Sparkles size={13} color={t.accent} />}{n.title || "(ไม่มีหัวข้อ)"}
                  </div>
                  <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                    {n.notionId && <span title="sync ขึ้น Notion แล้ว" style={{ display: "grid", placeItems: "center", padding: 4 }}><Check size={14} color="#2E9E6B" /></span>}
                    <button onClick={() => exportOneMd(n)} style={ghost} title="Export เป็น Markdown"><Download size={15} color={t.faint} /></button>
                    <button onClick={() => togglePin(n.id)} style={ghost} title="ปักหมุด"><Target size={15} color={n.pinned ? t.accent : t.faint} /></button>
                    <button onClick={() => startEdit(n)} style={ghost} title="แก้ไข"><Pencil size={15} color={t.faint} /></button>
                    <button onClick={() => setNotes((x) => x.filter((y) => y.id !== n.id))} style={ghost} title="ลบ"><Trash2 size={15} color={t.faint} /></button>
                  </div>
                </div>
                {blocksToPlainText(n.body).trim() && <div style={{ fontSize: 13, color: t.sub, marginTop: 6, whiteSpace: "pre-wrap", lineHeight: 1.5, maxHeight: 90, overflow: "hidden" }}>{blocksToPlainText(n.body)}</div>}
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

function IdeasPage({ t, M, userId, session, authProfile, setAuthProfile, setNotes }) {
  const interests = authProfile?.interests || [];
  const isAdmin = authProfile?.role === "admin" || authProfile?.role === "trusted";
  const topicLimit = isAdmin ? KNOWLEDGE_TOPICS.length : (authProfile?.topic_limit ?? 3);
  const dailyLimit = isAdmin ? 10 : (authProfile?.daily_article_limit ?? 3);

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
    const body = [{
      type: "toggleListItem",
      content: article.title,
      children: (article.bullets || []).map((b) => ({ type: "bulletListItem", content: b })),
    }];
    setNotes((n) => [{ id: uid(), title: article.title, body, date: todayStr(), pinned: false, tags: [topicLabel(article.topic)] }, ...n]);
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
                    <button onClick={() => sendToNotes(a)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", borderRadius: 10, border: `1px solid ${t.border}`, cursor: "pointer", background: "none", color: t.text, fontSize: 12, fontWeight: 700 }}><StickyNote size={14} /> ส่งเข้าโน้ต</button>
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
function ChatModal({ t, M, mentor, close }) {
  const [msgs, setMsgs] = useState([{ who: "m", text: `สวัสดี ฉันคือ ${M.full} วันนี้อยากให้ช่วยเรื่องอะไร?` }]);
  const [inp, setInp] = useState(""); const [loading, setLoading] = useState(false); const endRef = useRef(null);
  const [pendingImg, setPendingImg] = useState(null); // { dataUrl, mime } รูปที่เลือกไว้ รอกดส่ง
  const fileRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading]);

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
    setLoading(true);
    try {
      const r = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mentor, messages: nextMsgs }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "API error");
      setMsgs((m) => [...m, { who: "m", text: data.text || M.replies[Math.floor(Math.random() * M.replies.length)] }]);
    } catch (e) {
      // ยังไม่ deploy หรือ API มีปัญหา -> fallback เป็น mock reply ชั่วคราว ไม่ให้แชทค้าง
      setMsgs((m) => [...m, { who: "m", text: M.replies[Math.floor(Math.random() * M.replies.length)] }]);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={overlay} onClick={close}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, height: "82vh", background: t.page, borderRadius: "24px 24px 0 0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 12, background: t.hero }}>
          <span style={{ width: 40, height: 40, borderRadius: 20, background: `linear-gradient(135deg,${M.accent2},${M.accent})`, color: M.onAccent, display: "grid", placeItems: "center", fontWeight: 800 }}>{M.letter}</span>
          <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{M.full}</div><div style={{ fontSize: 11, color: "rgba(255,255,255,.7)" }}>{M.tag}</div></div>
          <button onClick={close} style={{ background: "rgba(255,255,255,.15)", border: "none", borderRadius: 16, width: 32, height: 32, cursor: "pointer", display: "grid", placeItems: "center" }}><X size={18} color="#fff" /></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ alignSelf: m.who === "u" ? "flex-end" : "flex-start", maxWidth: "78%", background: m.who === "u" ? M.accent : t.surface, color: m.who === "u" ? M.onAccent : t.text, padding: "10px 14px", borderRadius: 16, fontSize: 13.5, lineHeight: 1.45, border: m.who === "u" ? "none" : `1px solid ${t.border}` }}>
              {m.image && <img src={m.image} alt="" style={{ maxWidth: "100%", borderRadius: 10, marginBottom: m.text ? 6 : 0, display: "block" }} />}
              {m.text}
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
            <input value={inp} onChange={(e) => setInp(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder={`ถาม ${M.name}...`} style={input(t)} disabled={loading} />
            <button onClick={send} disabled={loading} style={{ ...primaryBtn(M), width: 46, padding: 0, display: "grid", placeItems: "center", opacity: loading ? 0.6 : 1 }}><Send size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MentorPicker({ t, mentor, setMentor, authProfile, setAuthProfile, userId, close }) {
  const isAdmin = authProfile?.role === "admin" || authProfile?.role === "trusted";
  const limit = authProfile?.mentor_limit ?? 0;
  const unlocked = authProfile?.unlocked_mentors || []; // ปกติจะมีได้แค่ 0 หรือ 1 ตัว (ล็อกถาวรตั้งแต่เลือกครั้งแรก)
  const [err, setErr] = useState("");

  const pick = async (k) => {
    setErr("");
    if (isAdmin || k === "none") { setMentor(k); close(); return; }
    if (unlocked.includes(k)) { setMentor(k); close(); return; } // กดตัวที่เลือกไปแล้วซ้ำ ใช้ได้ปกติ
    if (unlocked.length > 0) {
      setErr(`คุณเลือกโค้ชไปแล้ว (${MENTORS[unlocked[0]]?.full || unlocked[0]}) เปลี่ยนไม่ได้ ต้องให้แอดมินรีเซ็ตให้ก่อนถึงจะเลือกใหม่ได้`);
      return;
    }
    if (limit < 1) {
      setErr("คุณยังไม่ได้รับสิทธิ์เลือกโค้ช ให้แอดมินเปิดสิทธิ์ให้ที่หน้า Admin ก่อนนะ");
      return;
    }
    const { data } = await supabase.from("profiles").update({ unlocked_mentors: [k] }).eq("id", userId).select().single();
    if (data) setAuthProfile(data);
    setMentor(k); close();
  };

  return (<div style={overlay} onClick={close}><div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "24px 24px 0 0", padding: 20 }}>
    <div style={{ fontSize: 17, fontWeight: 800, color: t.text, marginBottom: 4 }}>เลือกโค้ชของคุณ</div>
    <div style={{ fontSize: 12.5, color: t.sub, marginBottom: 16 }}>
      คำคมและสไตล์การคุยจะเปลี่ยนตามโค้ช (สีธีมแอปปรับแยกได้ที่ไอคอนจานสี 🎨 ด้านบน)
      {!isAdmin && (unlocked.length > 0 ? <> · เลือกไว้แล้ว เปลี่ยนไม่ได้จนกว่าแอดมินจะรีเซ็ต</> : limit < 1 ? <> · ยังไม่ได้รับสิทธิ์เลือกโค้ช</> : <> · เลือกได้ 1 คน (เลือกแล้วเปลี่ยนไม่ได้)</>)}
    </div>
    {err && <div style={{ fontSize: 12, color: "#D9534F", marginBottom: 12 }}>{err}</div>}
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Object.entries(MENTORS).map(([k, m]) => {
        const locked = !isAdmin && k !== "none" && !unlocked.includes(k) && (unlocked.length > 0 || limit < 1);
        return (
          <button key={k} onClick={() => pick(k)} style={{ display: "flex", alignItems: "center", gap: 14, padding: 14, borderRadius: 18, cursor: "pointer", textAlign: "left", background: t.surface, border: `2px solid ${mentor === k ? m.accent : t.border}`, opacity: locked ? 0.5 : 1 }}>
            <span style={{ width: 46, height: 46, borderRadius: 23, background: `linear-gradient(135deg,${m.accent2},${m.accent})`, color: m.onAccent, display: "grid", placeItems: "center", fontWeight: 800, fontSize: 18, flexShrink: 0 }}>{m.letter}</span>
            <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>{m.full}</div><div style={{ fontSize: 12, color: t.sub }}>{m.tag}</div></div>
            {locked ? <LockKeyhole size={18} color={t.faint} /> : mentor === k && <Check size={20} color={m.accent} />}
          </button>
        );
      })}
    </div>
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
  const OUT = 320; // ขนาดไฟล์ผลลัพธ์สุดท้าย (px)
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
