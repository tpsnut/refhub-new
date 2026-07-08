import React, { useState, useEffect, useRef } from "react";
import {
  Home, Lightbulb, TrendingUp, Plus, Newspaper, Languages, StickyNote,
  Sun, Moon, Send, Check, Trash2, X, Wallet, Target, BookOpen, ChevronRight,
  Sparkles, Clock, Search, Volume2, VolumeX, Pencil, Download, ArrowLeft,
  Utensils, Car, ShoppingBag, Receipt, Gamepad2, HeartPulse, Briefcase, Gift, Coffee, Music,
  Play, Pause, Link2, Upload, SkipBack, SkipForward, Handshake, Coins, PiggyBank, FileSpreadsheet, FileText, Palette
} from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from "recharts";
// 🌐 ต่อท่อระบบฐานข้อมูล Cloud
import { supabase } from "./supabaseClient";
const USER_ID = import.meta.env.VITE_USER_ID;

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
    night: { accent: "#D98C4A", accent2: "#E8A868", onAccent: "#241300", page: "#0D1420", bgTop: "#16202E", bgBot: "#0D1420", surface: "#182333" },
  },
  twilight: {
    label: "ทไวไลท์",
    day:   { accent: "#C2607E", accent2: "#D6839B", onAccent: "#FFFFFF", page: "#FAF3F6", bgTop: "#FAF3F6", bgBot: "#FFFFFF", surface: "#FFFFFF" },
    night: { accent: "#E0839A", accent2: "#F2A08A", onAccent: "#2A0F1A", page: "#17121B", bgTop: "#241C2B", bgBot: "#17121B", surface: "#2A2130" },
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

const uid = () => Math.random().toString(36).slice(2, 9);
const fmt = (n) => "฿" + Math.round(n).toLocaleString("en-US");
const todayStr = () => new Date().toISOString().slice(0, 10);
const monthOf = (d) => d.slice(0, 7);
const thMonth = (ym) => { const [y, m] = ym.split("-"); return ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."][+m - 1] + " " + ((+y) + 543); };

export default function RefHub() {
  const [loaded, setLoaded] = useState(false);
  const [themeMode, setThemeMode] = useState("auto");
  const [mentor, setMentor] = useState("loid");
  const [theme, setTheme] = useState("default"); // 🎨 ธีมสีแอป: default | red | navy | twilight — แยกอิสระจาก mentor
  const [page, setPage] = useState("home");
  const [notes, setNotes] = useState([]);
  const [goals, setGoals] = useState([]);
  const [tx, setTx] = useState([]);
  const [profile, setProfile] = useState({ name: "Piyanut", avatar: "" });
  const [autoNight, setAutoNight] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [mentorPick, setMentorPick] = useState(false);
  const [themePick, setThemePick] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
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
      if (!USER_ID) {
        setLoaded(true);
        return;
      }
      try {
        // 1. ดึงข้อมูลเทมเพลตและการตั้งค่า (User Settings)
        const { data: uSettings } = await supabase
          .from("user_settings")
          .select("*")
          .eq("user_id", USER_ID)
          .single();

        if (uSettings) {
          setProfile({ name: uSettings.name, avatar: uSettings.avatar || "" });
          setMentor(uSettings.mentor || "loid");
          setThemeMode(uSettings.theme_mode || "auto");
          if (uSettings.theme) setTheme(uSettings.theme);
          if (typeof uSettings.volume === "number") setVolume(uSettings.volume);
        } else {
          // ถ้าเปิดซิงค์ครั้งแรกแล้วยังไม่มีข้อมูล ให้สร้างข้อมูล Row แรกทิ้งไว้ให้พี่เลย
          await supabase.from("user_settings").insert({
            user_id: USER_ID, name: profile.name || "Piyanut", mentor: mentor, theme_mode: themeMode, volume: volume
          });
        }

        // 2. ดึงรายการเงิน (Transactions)
        const { data: dbTx } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", USER_ID)
          .order("date", { ascending: false });
        if (dbTx) setTx(dbTx);

        // 3. ดึงเป้าหมายวันนี้ (Goals)
        const { data: dbGoals } = await supabase
          .from("goals")
          .select("*")
          .eq("user_id", USER_ID);
        if (dbGoals) setGoals(dbGoals);

        // 4. ดึงสมุดโน้ต (Notes)
        const { data: dbNotes } = await supabase
          .from("notes")
          .select("*")
          .eq("user_id", USER_ID)
          .order("date", { ascending: false });
        if (dbNotes) setNotes(dbNotes);

        // 5. ดึงเพลย์ลิสต์เพลง (Playlists)
        const { data: dbPlaylist } = await supabase
          .from("playlists")
          .select("*")
          .eq("user_id", USER_ID);
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
      setLoaded(true);
    })(); 
  }, []);

  // เซฟหมวดหมู่เพลงกลับลง localStorage ทุกครั้งที่เปลี่ยน
  useEffect(() => { if (!loaded) return; try { localStorage.setItem("refhub:folders", JSON.stringify(folders)); } catch (e) {} }, [folders, loaded]);
  useEffect(() => { if (!loaded) return; try { localStorage.setItem("refhub:categories", JSON.stringify(categories)); } catch (e) {} }, [categories, loaded]);


  // save ทั้ง Local และระบบ Cloud (Settings)
// ⚡ ตัว Interceptor: ดักฟังการเปลี่ยนแปลงจากปุ่มเดิมของพี่ แล้วสั่งทำงานขนานคู่กันไปเลย!
useEffect(() => {
  if (!loaded || !USER_ID) return;
  // เมื่อใดก็ตามที่ปุ่มเดิมของพี่ทำฟังก์ชัน setGoals สำเร็จ และข้อมูลเปลี่ยน
  // เราจะใช้จุดนี้ตรวจเช็กและซิงค์ความต่างขึ้นตาราง Supabase ทันทีโดยอัตโนมัติ
  const syncGoalsToCloud = async () => {
    try {
      // ดึงข้อมูลล่าสุดจาก Cloud มาเทียบ
      const { data: currentDb } = await supabase.from("goals").select("id, done").eq("user_id", USER_ID);
      if (!currentDb) return;

      const dbIds = currentDb.map(x => x.id);
      const localIds = goals.map(x => x.id);

      // 1. ตรวจสอบตัวที่เพิ่มใหม่ในแอป -> ยิงขึ้น Cloud
      for (const g of goals) {
        if (!dbIds.includes(g.id)) {
          await supabase.from("goals").insert({ id: g.id, user_id: USER_ID, text: g.text, done: g.done });
        } else {
          // 2. ตรวจสอบตัวที่สลับสถานะ ติ๊กถูก/เอาออก
          const match = currentDb.find(x => x.id === g.id);
          if (match && match.done !== g.done) {
            await supabase.from("goals").update({ done: g.done }).eq("id", g.id);
          }
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
  if (!loaded || !USER_ID) return;
  const syncTxToCloud = async () => {
    try {
      const { data: currentDb } = await supabase.from("transactions").select("id").eq("user_id", USER_ID);
      if (!currentDb) return;
      const dbIds = currentDb.map((x) => x.id);
      const localIds = tx.map((x) => x.id);
      for (const x of tx) {
        if (!dbIds.includes(x.id)) {
          await supabase.from("transactions").insert({ id: x.id, user_id: USER_ID, type: x.type, cat: x.cat, amount: x.amount, note: x.note, date: x.date });
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
  if (!loaded || !USER_ID) return;
  const syncNotesToCloud = async () => {
    try {
      const { data: currentDb } = await supabase.from("notes").select("id").eq("user_id", USER_ID);
      if (!currentDb) return;
      const dbIds = currentDb.map((x) => x.id);
      const localIds = notes.map((x) => x.id);
      for (const n of notes) {
        if (!dbIds.includes(n.id)) {
          await supabase.from("notes").insert({ id: n.id, user_id: USER_ID, title: n.title, body: n.body, date: n.date });
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
  if (!loaded || !USER_ID) return;
  const syncPlaylistToCloud = async () => {
    try {
      const syncable = playlist.filter((p) => p.kind === "yt" || (p.kind === "file" && p.persist));
      const { data: currentDb } = await supabase.from("playlists").select("id").eq("user_id", USER_ID);
      if (!currentDb) return;
      const dbIds = currentDb.map((x) => x.id);
      const localIds = syncable.map((x) => x.id);
      for (const p of syncable) {
        if (!dbIds.includes(p.id)) {
          await supabase.from("playlists").insert({ id: p.id, user_id: USER_ID, kind: p.kind, name: p.name, url: p.url || null, yt_id: p.ytId || null, src: p.kind === "file" ? p.src : null, persist: !!p.persist });
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
        if (USER_ID) {
          await supabase.from("user_settings").update({
            name: profile.name,
            avatar: profile.avatar || "",
            mentor: mentor,
            theme_mode: themeMode,
            theme: theme, // ถ้ายังไม่มีคอลัมน์ "theme" ในตาราง user_settings คำสั่งนี้จะ error เงียบๆ (ถูกดักไว้ใน catch) — เพิ่มคอลัมน์ type text ได้เพื่อให้ธีม sync ข้ามอุปกรณ์
            volume: volume
          }).eq("user_id", USER_ID);
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

  // 🔤 โหลดฟอนต์ Anuphan จาก Google Fonts ครั้งเดียวตอนแอปเปิด (ฟอนต์ไทยสมัยใหม่ อ่านตัวเลขชัด เหมาะกับหน้าการเงิน)
  useEffect(() => {
    if (document.getElementById("refhub-font-anuphan")) return;
    const link = document.createElement("link");
    link.id = "refhub-font-anuphan";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Anuphan:wght@400;500;600;700;800&display=swap";
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

  const goalDone = goals.filter((g) => g.done).length;
  const goalPct = goals.length ? Math.round((goalDone / goals.length) * 100) : 0;
  const balance = tx.reduce((s, x) => s + (x.type === "in" ? x.amount : -x.amount), 0);
  const quote = M.quotes[quoteIdx % M.quotes.length];

  return (
    <div style={{ minHeight: "100vh", background: t.page, display: "flex", justifyContent: "center", fontFamily: "'Anuphan','Segoe UI','Helvetica Neue',system-ui,sans-serif" }}>
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
                    {profile.name} <Pencil size={12} color={t.faint} />
                  </div>
                </div>
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                <IconBtn t={t} onClick={() => setSearchOpen(true)}><Search size={17} color={t.text} /></IconBtn>
                <IconBtn t={t} onClick={() => setMusicOpen(true)} active={playing} accent={t.accent}>
                  <Music size={17} color={playing ? t.accent : t.text} />
                </IconBtn>
                <IconBtn t={t} onClick={() => setThemePick(true)}><Palette size={17} color={t.text} /></IconBtn>
                <IconBtn t={t} onClick={() => setThemeMode(themeMode === "auto" ? "day" : themeMode === "day" ? "night" : "auto")}>
                  {isNight ? <Moon size={17} color={t.text} /> : <Sun size={17} color={t.text} />}
                </IconBtn>
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
          {page === "home" && <HomePage {...{ t, M, quote, isNight, setMentorPick, balance, tx, goals, goalDone, goalPct, setGoals, notes, setPage, setChatOpen }} />}
          {page === "ledger" && <FinancePage {...{ t, tx, setTx, categories, openAdd: () => setAddOpen(true), openExport: (txt) => setExportText(txt) }} />}
          {page === "note" && <NotePage {...{ t, notes, setNotes }} />}
          {page === "ideas" && <IdeasPage t={t} />}
          {page === "trade" && <TradePage t={t} />}
          {page === "news" && <NewsPage t={t} />}
          {page === "lang" && <LangPage t={t} />}

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

        {mentorPick && <MentorPicker t={t} mentor={mentor} setMentor={setMentor} close={() => setMentorPick(false)} />}
        {themePick && <ThemePicker t={t} theme={theme} setTheme={setTheme} mode={mode} close={() => setThemePick(false)} />}
        {chatOpen && <ChatModal t={t} M={M} close={() => setChatOpen(false)} />}
        {editProfile && <EditProfile t={t} M={M} profile={profile} setProfile={setProfile} close={() => setEditProfile(false)} />}
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
  return (
    <>
      <div style={{ marginTop: 8, background: t.hero, border: `1px solid ${t.heroBorder}`, borderRadius: 26, padding: 20, boxShadow: isNight ? "none" : "0 10px 24px rgba(30,40,70,.18)" }}>
        <button onClick={() => setMentorPick(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: M.accent, letterSpacing: .5 }}>{isNight ? "โค้ชคืนนี้" : "โค้ชวันนี้"} · {M.name.toUpperCase()}</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,.5)" }}>เปลี่ยน ▾</span>
        </button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16.5, fontWeight: 700, color: "#fff", lineHeight: 1.4, minHeight: 46 }}>“{quote}”</div>
            <button onClick={() => setChatOpen(true)} style={{ marginTop: 14, border: "none", cursor: "pointer", background: `linear-gradient(135deg,${t.accent2},${t.accent})`, color: t.onAccent, fontWeight: 700, fontSize: 13, padding: "9px 16px", borderRadius: 18, display: "inline-flex", alignItems: "center", gap: 6 }}>คุยกับโค้ช <ChevronRight size={15} /></button>
          </div>
          <Ring pct={goalPct} color={t.accent} label="เป้าหมาย" />
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
        <CatCard t={t} k="coral" icon={<Target size={15} color="#fff" />} label="เป้าหมายวันนี้">
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
          <div style={{ fontSize: 13.5, fontWeight: 800, color: t.text }}>เป้าหมายวันนี้</div><Sparkles size={16} color={t.accent} />
        </div>
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          {goals.length === 0 && <div style={{ fontSize: 12.5, color: t.sub }}>ยังไม่มีเป้าหมาย เพิ่มอันแรกเลย 👇</div>}
          {goals.map((g) => (
            <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => setGoals((gs) => gs.map((x) => (x.id === g.id ? { ...x, done: !x.done } : x)))} style={{ width: 22, height: 22, borderRadius: 7, border: `2px solid ${g.done ? t.accent : t.faint}`, background: g.done ? t.accent : "transparent", cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}>{g.done && <Check size={14} color={t.onAccent} />}</button>
              <span style={{ flex: 1, fontSize: 13.5, color: g.done ? t.sub : t.text, textDecoration: g.done ? "line-through" : "none" }}>{g.text}</span>
              <button onClick={() => setGoals((gs) => gs.filter((x) => x.id !== g.id))} style={ghost}><Trash2 size={15} color={t.faint} /></button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input value={goalText} onChange={(e) => setGoalText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && goalText.trim()) { setGoals((gs) => [...gs, { id: uid(), text: goalText.trim(), done: false }]); setGoalText(""); } }} placeholder="เพิ่มเป้าหมายวันนี้..." style={input(t)} />
          <button onClick={() => { if (goalText.trim()) { setGoals((gs) => [...gs, { id: uid(), text: goalText.trim(), done: false }]); setGoalText(""); } }} style={{ ...primaryBtn(t), padding: "0 16px" }}>เพิ่ม</button>
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
  const doExportCsv = () => { try { const blob = new Blob([csvText()], { type: "text/csv;charset=utf-8;" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "refhub-finance.csv"; document.body.appendChild(a); a.click(); a.remove(); } catch (e) { openExport(csvText()); } };

  // Export PDF: เปิดหน้าต่าง print ของเบราว์เซอร์เอง (ไม่ต้องเพิ่ม library ใหม่ + รองรับภาษาไทยถูกต้อง 100%
  // เพราะใช้ font จริงของเครื่อง ไม่ใช่ font ฝังใน PDF แบบ library ทำ) ผู้ใช้กด "บันทึกเป็น PDF" ในหน้าต่าง print ได้เลย
  const doExportPdf = () => {
    const rows = periodTx.map((x) => `<tr><td>${x.date}</td><td>${x.type === "in" ? "รับเข้า" : "จ่ายออก"}</td><td>${findCat(categories, x.cat).label}</td><td style="text-align:right">${x.amount.toLocaleString()}</td><td>${(x.note || "").replace(/</g, "&lt;")}</td></tr>`).join("");
    const html = `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><title>RefHub - รายงานการเงิน</title>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anuphan:wght@400;500;600;700;800&display=swap">
      <style>
        body{font-family:'Anuphan','Sarabun','Segoe UI',sans-serif;padding:24px;color:#222}
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

function AddTxModal({ t, tx, setTx, categories, moveCategory, deleteCategory, addCategory, close }) {
  const [type, setType] = useState("out");
  const [cat, setCat] = useState(null); // ไม่ default หมวดหมู่ไว้แล้ว ต้องให้ผู้ใช้เลือกเอง
  const [catError, setCatError] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayStr());
  const [withVat, setWithVat] = useState(false);
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

  const amountNum = parseFloat(amount) || 0;
  const vatBase = withVat ? amountNum / 1.07 : 0;
  const vatPortion = withVat ? amountNum - vatBase : 0;

  const add = () => {
    const a = parseFloat(amount);
    if (!a || a <= 0) return;
    if (!cat) { setCatError(true); return; }
    let finalNote = note.trim() || findCat(categories, cat).label;
    if (withVat) finalNote += ` (รวม VAT 7%: ฐาน ~${vatBase.toFixed(2)} บาท, ภาษี ~${vatPortion.toFixed(2)} บาท)`;
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
          {[["out", "จ่ายออก"], ["in", "รับเข้า"]].map(([v, lb]) => (
            <button key={v} onClick={() => { setType(v); setCat(null); setCatError(false); }} style={{ flex: 1, padding: "10px 0", borderRadius: 12, cursor: "pointer", border: `1.5px solid ${type === v ? t.accent : t.border}`, fontWeight: 700, fontSize: 13.5, background: type === v ? t.accent : "transparent", color: type === v ? t.onAccent : t.sub }}>{lb}</button>
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
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: withVat ? 6 : 10, cursor: "pointer" }}>
          <input type="checkbox" checked={withVat} onChange={(e) => setWithVat(e.target.checked)} />
          <span style={{ fontSize: 12.5, color: t.sub }}>ยอดนี้รวม VAT 7% แล้ว (แยกยอดภาษีให้อัตโนมัติ)</span>
        </label>
        {withVat && amountNum > 0 && (
          <div style={{ fontSize: 11.5, color: t.faint, marginBottom: 10, background: t.inputBg, borderRadius: 10, padding: "8px 12px" }}>
            ฐานก่อนภาษี ~{vatBase.toFixed(2)} บาท · VAT 7% ~{vatPortion.toFixed(2)} บาท
          </div>
        )}
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
          {[["out", "จ่ายออก"], ["in", "รับเข้า"]].map(([v, lb]) => (
            <button key={v} onClick={() => setKind(v)} style={{ flex: 1, padding: "9px 0", borderRadius: 12, cursor: "pointer", border: `1.5px solid ${kind === v ? t.accent : t.border}`, fontWeight: 700, fontSize: 13, background: kind === v ? t.accent : "transparent", color: kind === v ? t.onAccent : t.sub }}>{lb}</button>
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
function NotePage({ t, notes, setNotes }) {
  const [title, setTitle] = useState(""); const [body, setBody] = useState("");
  const add = () => { if (!title.trim() && !body.trim()) return; setNotes((n) => [{ id: uid(), title: title.trim(), body: body.trim(), date: todayStr() }, ...n]); setTitle(""); setBody(""); };
  return (
    <>
      <PageHead t={t} title="โน้ต" sub="จดไอเดีย บันทึกการเรียนรู้" icon={<StickyNote size={20} color={t.accent} />} />
      <div style={{ ...card(t), padding: 16 }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="หัวข้อ" style={{ ...input(t), marginBottom: 8, fontWeight: 700 }} />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="เขียนอะไรก็ได้ที่อยากจดไว้..." rows={3} style={{ ...input(t), resize: "vertical", marginBottom: 12, fontFamily: "inherit" }} />
        <button onClick={add} style={{ ...primaryBtn({ accent: t.accent, accent2: t.accent2, onAccent: t.onAccent }), width: "100%", padding: "11px 0" }}>บันทึกโน้ต</button>
      </div>
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {notes.length === 0 && <Empty t={t} text="ยังไม่มีโน้ต เริ่มจดอันแรก" />}
        {notes.map((n) => (
          <div key={n.id} style={{ ...card(t), padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <div style={{ fontSize: 14.5, fontWeight: 800, color: t.text }}>{n.title || "(ไม่มีหัวข้อ)"}</div>
              <button onClick={() => setNotes((x) => x.filter((y) => y.id !== n.id))} style={ghost}><Trash2 size={15} color={t.faint} /></button>
            </div>
            {n.body && <div style={{ fontSize: 13, color: t.sub, marginTop: 6, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{n.body}</div>}
            <div style={{ fontSize: 10.5, color: t.faint, marginTop: 8 }}>{n.date}</div>
          </div>
        ))}
      </div>
    </>
  );
}

// ---------------- Mock pages ----------------
function IdeasPage({ t }) {
  const items = [
    { tag: "RPA", title: "ออกแบบ bot ให้ maintain ง่ายด้วย Reusable Component", sum: "แยก logic เป็นส่วนๆ ใช้ซ้ำได้ ลดเวลาแก้บั๊ก" },
    { tag: "AI", title: "ใช้ Prompt Chaining ทำงานซับซ้อนให้แม่นขึ้น", sum: "แตกงานใหญ่เป็น prompt ย่อยๆ ต่อกันเป็นสาย" },
    { tag: "Career", title: "5 ทักษะที่สาย Automation ควรมีในปี 2026", sum: "REST API, Power Automate, cloud และ soft skill" },
    { tag: "Mindset", title: "Deep Work: โฟกัส 90 นาที ได้งานเท่าคนอื่นทั้งวัน", sum: "ตัดสิ่งรบกวน จัดบล็อกเวลา ทำทีละอย่าง" },
  ];
  return (<>
    <PageHead t={t} title="คลังความรู้" sub="หัวข้อที่อยากเรียน · AI คัดให้ทุกวัน" icon={<Lightbulb size={20} color={t.accent} />} />
    <MockBanner t={t} text="ตัวอย่าง — ต่อ AI คัดบทความจริงภายหลัง" />
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
      {items.map((x, i) => (<div key={i} style={{ ...card(t), padding: 16 }}>
        <span style={{ fontSize: 10.5, fontWeight: 800, color: t.accent, background: `${t.accent}1A`, padding: "3px 10px", borderRadius: 20 }}>{x.tag}</span>
        <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginTop: 10, lineHeight: 1.4 }}>{x.title}</div>
        <div style={{ fontSize: 12.5, color: t.sub, marginTop: 6, lineHeight: 1.5 }}>{x.sum}</div>
      </div>))}
    </div>
  </>);
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
function ChatModal({ t, M, close }) {
  const [msgs, setMsgs] = useState([{ who: "m", text: `สวัสดี ฉันคือ ${M.full} วันนี้อยากให้ช่วยเรื่องอะไร?` }]);
  const [inp, setInp] = useState(""); const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);
  const send = () => { if (!inp.trim()) return; const u = inp.trim(); setInp(""); setMsgs((m) => [...m, { who: "u", text: u }]); setTimeout(() => setMsgs((m) => [...m, { who: "m", text: M.replies[Math.floor(Math.random() * M.replies.length)] }]), 500); };
  return (
    <div style={overlay} onClick={close}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, height: "82vh", background: t.page, borderRadius: "24px 24px 0 0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 12, background: t.hero }}>
          <span style={{ width: 40, height: 40, borderRadius: 20, background: `linear-gradient(135deg,${M.accent2},${M.accent})`, color: M.onAccent, display: "grid", placeItems: "center", fontWeight: 800 }}>{M.letter}</span>
          <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{M.full}</div><div style={{ fontSize: 11, color: "rgba(255,255,255,.7)" }}>{M.tag}</div></div>
          <button onClick={close} style={{ background: "rgba(255,255,255,.15)", border: "none", borderRadius: 16, width: 32, height: 32, cursor: "pointer", display: "grid", placeItems: "center" }}><X size={18} color="#fff" /></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          {msgs.map((m, i) => (<div key={i} style={{ alignSelf: m.who === "u" ? "flex-end" : "flex-start", maxWidth: "78%", background: m.who === "u" ? M.accent : t.surface, color: m.who === "u" ? M.onAccent : t.text, padding: "10px 14px", borderRadius: 16, fontSize: 13.5, lineHeight: 1.45, border: m.who === "u" ? "none" : `1px solid ${t.border}` }}>{m.text}</div>))}
          <div ref={endRef} />
        </div>
        <div style={{ padding: 12, background: t.page }}>
          <div style={{ fontSize: 10.5, color: t.faint, textAlign: "center", marginBottom: 8 }}>โหมดตัวอย่าง — เชื่อม AI จริงภายหลัง</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={inp} onChange={(e) => setInp(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder={`ถาม ${M.name}...`} style={input(t)} />
            <button onClick={send} style={{ ...primaryBtn(M), width: 46, padding: 0, display: "grid", placeItems: "center" }}><Send size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MentorPicker({ t, mentor, setMentor, close }) {
  return (<div style={overlay} onClick={close}><div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "24px 24px 0 0", padding: 20 }}>
    <div style={{ fontSize: 17, fontWeight: 800, color: t.text, marginBottom: 4 }}>เลือกโค้ชของคุณ</div>
    <div style={{ fontSize: 12.5, color: t.sub, marginBottom: 16 }}>คำคมและสไตล์การคุยจะเปลี่ยนตามโค้ช (สีธีมแอปปรับแยกได้ที่ไอคอนจานสี 🎨 ด้านบน)</div>
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Object.entries(MENTORS).map(([k, m]) => (<button key={k} onClick={() => { setMentor(k); close(); }} style={{ display: "flex", alignItems: "center", gap: 14, padding: 14, borderRadius: 18, cursor: "pointer", textAlign: "left", background: t.surface, border: `2px solid ${mentor === k ? m.accent : t.border}` }}>
        <span style={{ width: 46, height: 46, borderRadius: 23, background: `linear-gradient(135deg,${m.accent2},${m.accent})`, color: m.onAccent, display: "grid", placeItems: "center", fontWeight: 800, fontSize: 18, flexShrink: 0 }}>{m.letter}</span>
        <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>{m.full}</div><div style={{ fontSize: 12, color: t.sub }}>{m.tag}</div></div>
        {mentor === k && <Check size={20} color={m.accent} />}
      </button>))}
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

function EditProfile({ t, M, profile, setProfile, close }) {
  const [name, setName] = useState(profile.name); const [avatar, setAvatar] = useState(profile.avatar); const fileRef = useRef(null);
  const pick = (e) => { const f = e.target.files?.[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { const img = new Image(); img.onload = () => { const c = document.createElement("canvas"); const s = 200; c.width = s; c.height = s; const ctx = c.getContext("2d"); const min = Math.min(img.width, img.height); ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, s, s); setAvatar(c.toDataURL("image/jpeg", 0.8)); }; img.src = rd.result; }; rd.readAsDataURL(f); };
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
    <div style={{ fontSize: 12, fontWeight: 700, color: t.sub, marginBottom: 6 }}>หรือวางลิงก์รูป (URL)</div>
    <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
      <input value={avatar && avatar.startsWith("http") ? avatar : ""} onChange={(e) => setAvatar(e.target.value)} placeholder="https://..." style={input(t)} />
      {avatar && <button onClick={() => setAvatar("")} style={{ ...card(t), border: `1px solid ${t.border}`, padding: "0 14px", cursor: "pointer", color: t.sub, fontSize: 12, fontWeight: 700 }}>ล้าง</button>}
    </div>
    <div style={{ fontSize: 12, fontWeight: 700, color: t.sub, marginBottom: 6 }}>ชื่อ</div>
    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อของคุณ" style={{ ...input(t), marginBottom: 16 }} />
    <button onClick={() => { setProfile({ name: name.trim() || "ฉัน", avatar }); close(); }} style={{ ...primaryBtn(t), width: "100%", padding: "13px 0", fontSize: 15 }}>บันทึก</button>
  </div></div>);
}

function SearchOverlay({ t, notes, goals, tx, categories, setPage, close }) {
  const [q, setQ] = useState(""); const ql = q.trim().toLowerCase();
  const nr = ql ? notes.filter((n) => (n.title + n.body).toLowerCase().includes(ql)) : [];
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
      {nr.map((n) => <SR key={n.id} t={t} icon={<StickyNote size={16} color="#7B6CB0" />} title={n.title || n.body} sub="โน้ต" onClick={() => go("note")} />)}
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
const overlay = { position: "absolute", inset: 0, background: "rgba(10,14,25,.5)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(2px)" };
