import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Home, Lightbulb, TrendingUp, Plus, Newspaper, Languages, StickyNote, Eye, Menu, Image as ImageIcon, CheckSquare, Heading2, List, Paperclip,
  Sun, Moon, Send, Check, Trash2, X, Wallet, Target, BookOpen, ChevronRight,
  Sparkles, Clock, Search, Volume2, VolumeX, Pencil, Download, ArrowLeft, Users, Camera, Phone, Mic, MicOff, PhoneOff, RefreshCw,
  Utensils, Car, ShoppingBag, Receipt, Gamepad2, HeartPulse, Briefcase, Gift, Coffee, Music,
  Play, Pause, Link2, Upload, SkipBack, SkipForward, Handshake, Coins, PiggyBank, FileSpreadsheet, FileText, Palette, ALargeSmall, ShieldCheck, Bell, UserCheck, UserX, Wifi, MessageCircle, MoreVertical, KeyRound, MapPin, Copy, LockKeyhole, LogOut, LayoutGrid, Maximize2, Volume1, Settings, Bookmark, Share2, Repeat2, Heart, User, Pin,
  Heading1, Heading3, ListOrdered, ListTree, Quote, Code2, Minus, Table2, Video, Smile, RotateCcw, GripVertical, ChevronLeft, ChevronUp, ChevronDown, Repeat, Repeat1, Shuffle, Timer
} from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from "recharts";
// 🔀 dnd-kit — ใช้ทำ "ลากวางจัดเรียงจริง" (drag & drop) ทั่วแอป แทนปุ่มขึ้น/ลง — รองรับ touch บนมือถือมาให้เลย
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS as DndCSS } from "@dnd-kit/utilities";
// 📝 BlockNote — editor แบบ Notion (toggle, checklist, หัวข้อ, แนบรูป/ไฟล์) สำหรับหน้าโน้ตฉบับเต็ม
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
// 🌐 ต่อท่อระบบฐานข้อมูล Cloud
import { supabase } from "./supabaseClient";
// userId ตอนนี้มาจาก Supabase Auth session แล้ว (ดูใน RefHub component ด้านล่าง) ไม่ใช่ค่าคงที่จาก .env อีกต่อไป

// 🔀 ===== ระบบลากวางจัดเรียง (Drag & Drop reorder) ใช้ร่วมกันได้ทั้งแอป =====
// ใช้ dnd-kit — ดักการลากที่ "drag handle" (ไอคอน ⋮⋮) เท่านั้น ไม่ใช่ทั้งแถว กันชนกับปุ่มอื่นในแถวเดียวกัน (แก้ไข/ลบ ฯลฯ)
// และกันชนกับการเลื่อนดู list ปกติบนมือถือ (ถ้าดักทั้งแถวจะปนกับ scroll)
// 🖐️ ต้องกดค้างที่ handle ก่อนถึงจะเริ่มลากได้จริง (กันมือโดนแล้วลากทันทีโดยไม่ตั้งใจ) — ระหว่างกดค้าง handle จะเข้มขึ้น (ผ่าน priming) ให้รู้ว่าใกล้ลากได้แล้ว
const DRAG_HOLD_MS = 550;
function SortableRow({ id, children, disabled }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  const [priming, setPriming] = useState(false);
  const timerRef = useRef(null);
  const cancelPriming = () => { if (timerRef.current) clearTimeout(timerRef.current); timerRef.current = null; setPriming(false); };
  const style = { transform: DndCSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, position: "relative", zIndex: isDragging ? 10 : "auto" };
  const handleProps = {
    ...attributes, ...listeners,
    onPointerDown: (e) => { timerRef.current = setTimeout(() => setPriming(true), DRAG_HOLD_MS); listeners.onPointerDown?.(e); },
    onPointerUp: (e) => { cancelPriming(); listeners.onPointerUp?.(e); },
    onPointerLeave: (e) => { cancelPriming(); listeners.onPointerLeave?.(e); },
    onPointerCancel: (e) => { cancelPriming(); listeners.onPointerCancel?.(e); },
    style: { touchAction: "none", cursor: disabled ? "default" : "grab", userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" },
    onContextMenu: (e) => e.preventDefault(), // กันเมนู copy/select ของเบราว์เซอร์ขึ้นตอนกดค้าง (long-press) ที่ handle
  };
  return <div ref={setNodeRef} style={style}>{children({ handleProps, priming: priming || isDragging })}</div>;
}
// items: array ของ object ใดๆ / getId: (item) => string ไอดีที่ไม่ซ้ำ / onReorder: (newItemsArray) => void / renderItem: (item, index, {handleProps, priming}) => JSX
function DragReorderList({ items, getId, onReorder, renderItem, disabled }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { delay: DRAG_HOLD_MS, tolerance: 8 } })); // ต้องกดค้างก่อนถึงเริ่มลากจริง (ไม่ใช่แค่ขยับนิดเดียวแล้วลากทันที) กันมือโดนแล้วลากพลาด
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((it) => getId(it) === active.id);
    const newIndex = items.findIndex((it) => getId(it) === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(items, oldIndex, newIndex));
  };
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map(getId)} strategy={verticalListSortingStrategy}>
        {items.map((item, i) => (
          <SortableRow key={getId(item)} id={getId(item)} disabled={disabled}>
            {({ handleProps, priming }) => renderItem(item, i, { handleProps, priming })}
          </SortableRow>
        ))}
      </SortableContext>
    </DndContext>
  );
}

// 💡 ===== ระบบคำแนะนำการใช้งาน (Hint / Coachmark) — แอดมินเขียนข้อความเองได้ + เช็คได้ว่าใครดูไปแล้วบ้าง =====
// เก็บ "เคยดูแล้ว" ลงตาราง hint_seen จริง (ไม่ใช่ localStorage) เพื่อให้แอดมินดูได้จากหน้าแอดมินว่าใครดูไปแล้วกี่คน
// คำแนะนำแต่ละจุด (key) ต้องมีแถวใน hint_definitions ก่อน (สร้าง/แก้ข้อความ/เปิดปิดได้จากหน้าแอดมิน) — key ใหม่ต้องเดฟผูกจุดในโค้ดเองก่อน แอดมินแก้ได้แค่ข้อความ+เปิดปิด ไม่ได้เพิ่มจุดใหม่เองได้ (เพราะต้องมีโค้ดรองรับตำแหน่งนั้นจริงๆ)
function useHint(key, hintDefs, seenHintKeys, dismissHint) {
  const def = hintDefs.find((h) => h.key === key);
  const show = !!def?.active && !seenHintKeys.has(key);
  const text = def?.body || "";
  const dismiss = () => dismissHint(key);
  return [show, text, dismiss];
}
// ⚠️ ตัว anchor (ปุ่ม/องค์ประกอบที่ชี้ถึง) ต้องห่อด้วย position:"relative" เอง แล้ววาง <Coachmark> เป็น sibling ถัดจาก anchor นั้น
function Coachmark({ t, show, text, onDismiss, placement = "bottom", align = "left" }) {
  if (!show || !text) return null;
  const vertical = placement === "bottom" ? { top: "calc(100% + 10px)" } : { bottom: "calc(100% + 10px)" };
  const horizontal = align === "right" ? { right: 0 } : align === "center" ? { left: "50%", transform: "translateX(-50%)" } : { left: 0 };
  const arrowSide = align === "right" ? { right: 22 } : align === "center" ? { left: "50%", marginLeft: -5 } : { left: 22 };
  return (
    <div style={{ position: "absolute", ...vertical, ...horizontal, zIndex: 45, width: 270, background: t.accent, color: t.onAccent, borderRadius: 14, padding: "12px 14px", boxShadow: "0 10px 26px rgba(0,0,0,.25)", fontSize: 13, lineHeight: 1.5 }}>
      <div style={{ position: "absolute", [placement === "bottom" ? "top" : "bottom"]: -5, ...arrowSide, width: 11, height: 11, background: t.accent, transform: `rotate(45deg)${align === "center" ? "" : ""}` }} />
      <div style={{ marginBottom: 10 }}>{text}</div>
      <button onClick={onDismiss} style={{ background: "rgba(255,255,255,.25)", border: "none", borderRadius: 9, padding: "6px 14px", color: t.onAccent, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>เข้าใจแล้ว</button>
    </div>
  );
}

// ✅ ===== ระบบถามยืนยันก่อนทำ (ลบ/แก้ไข) ใช้ร่วมกันได้ทุกหน้า — ห่อด้วย ModalPortal เองในตัว ปลอดภัยไม่ว่าจะเรียกจากที่ไหนในแอป =====
function useConfirm(t) {
  const [pending, setPending] = useState(null); // { message, confirmLabel, onConfirm }
  const askConfirm = (message, onConfirm, confirmLabel) => setPending({ message, onConfirm, confirmLabel: confirmLabel || "ยืนยัน" });
  const ConfirmUI = pending ? (
    <ModalPortal>
      <div style={overlay} onClick={() => setPending(null)}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 380, background: t?.page || "#fff", borderRadius: 20, padding: 20 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 18, lineHeight: 1.5, color: t?.text || "#222" }}>{pending.message}</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setPending(null)} style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: `1.5px solid ${t?.border || "#ddd"}`, background: "none", color: t?.text || "#222", cursor: "pointer", fontWeight: 700, fontSize: 13.5 }}>ยกเลิก</button>
            <button onClick={() => { pending.onConfirm(); setPending(null); }} style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "none", background: "#D9534F", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13.5 }}>{pending.confirmLabel}</button>
          </div>
        </div>
      </div>
    </ModalPortal>
  ) : null;
  return [askConfirm, ConfirmUI];
}

// 📄 ===== ระบบแบ่งหน้า (Pagination) ใช้ร่วมกันได้ทุกลิสต์ที่อาจมีรายการเยอะ =====
function usePagination(items, pageSize = 10, resetKey) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  useEffect(() => { if (page > totalPages - 1) setPage(0); }, [items.length, totalPages]); // รายการหดจนหน้าปัจจุบันเกินขอบ -> กลับไปหน้าแรก กันจอว่างเปล่า
  useEffect(() => { setPage(0); }, [resetKey]); // resetKey เปลี่ยน (เช่น สลับหมวดหมู่/แท็บ) -> กลับไปหน้าแรกเสมอ ไม่ค้างหน้าเดิมของชุดข้อมูลก่อนหน้า
  const pageItems = items.slice(page * pageSize, page * pageSize + pageSize);
  return { pageItems, page, setPage, totalPages, pageSize };
}
function PaginationBar({ t, page, setPage, totalPages }) {
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 14, marginBottom: 4 }}>
      <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} style={{ width: 32, height: 32, borderRadius: 16, border: `1px solid ${t.border}`, background: t.inputBg, display: "grid", placeItems: "center", cursor: page === 0 ? "default" : "pointer", opacity: page === 0 ? 0.4 : 1 }}><ChevronLeft size={15} color={t.text} /></button>
      <span style={{ fontSize: 12, fontWeight: 700, color: t.sub }}>หน้า {page + 1} / {totalPages}</span>
      <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1} style={{ width: 32, height: 32, borderRadius: 16, border: `1px solid ${t.border}`, background: t.inputBg, display: "grid", placeItems: "center", cursor: page === totalPages - 1 ? "default" : "pointer", opacity: page === totalPages - 1 ? 0.4 : 1 }}><ChevronRight size={15} color={t.text} /></button>
    </div>
  );
}

// 🏮 ไอคอนโคมลอยเล็กๆ แทน emoji ไฟ 🔥 ของ streak — tier 1=7วัน+, 2=30วัน+, 3=100วัน+ (ยิ่ง tier สูงยิ่งเรืองแสงกว้างขึ้น)
function LanternIcon({ size = 14, tier = 1 }) {
  const glow = tier >= 3 ? 1 : tier >= 2 ? 0.85 : 0.65;
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 20 23" style={{ flexShrink: 0 }}>
      {tier >= 3 && <circle cx="10" cy="9" r="9" fill="#F2872E" opacity="0.18" />}
      <ellipse cx="10" cy="9" rx="7" ry="9" fill="#F2872E" opacity={glow} />
      <ellipse cx="10" cy="9" rx="4.5" ry="6.2" fill="#F5A050" opacity={glow} />
      <rect x="7.5" y="18" width="5" height="2" rx="1" fill="#5C5750" />
    </svg>
  );
}

// ✨ กราฟ "กลุ่มดาว" แทนกราฟเส้นทั่วไป — ดาวดวงใหญ่/สว่างกว่า = สัปดาห์ที่ทำเป้าหมายสำเร็จเยอะกว่า เชื่อมเป็นเส้นเรื่องราวเดียวกัน
function ConstellationChart({ t, data }) {
  const w = 320, h = 110, pad = 16;
  const n = Math.max(1, data.length);
  const stepX = n > 1 ? (w - pad * 2) / (n - 1) : 0;
  const points = data.map((d, i) => {
    const pct = d["สำเร็จ%"] || 0;
    const x = pad + i * stepX;
    const y = pad + (100 - pct) / 100 * (h - pad * 2 - 12) + 6;
    const r = 2.5 + (pct / 100) * 4.5;
    return { x, y, r, pct, label: d.label };
  });
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h + 20}`}>
      <path d={linePath} fill="none" stroke={t.accent} strokeWidth="1" opacity="0.35" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={p.r + 3} fill={t.accent} opacity="0.12" />
          <circle cx={p.x} cy={p.y} r={p.r} fill={p.pct >= 70 ? t.accent : (t.accent2 || t.accent)} opacity={p.pct === 0 ? 0.28 : 0.9} />
          <text x={p.x} y={h + 14} textAnchor="middle" fontSize="8" fill={t.faint}>{p.label}</text>
        </g>
      ))}
    </svg>
  );
}


// 📄 ชิปเลขหน้าเล็กๆ ใช้แทน PaginationBar เต็มแถวได้ตอนพื้นที่จำกัด — คลิกที่ตัวเลขหน้าเพื่อเลือกหน้าตรงๆ ได้เลย (ไม่ต้องกด ‹ › ทีละหน้า)
function PageJumpChip({ t, page, setPage, totalPages }) {
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0, height: 38, padding: "0 4px", borderRadius: 12, border: `1px solid ${t.border}`, background: t.inputBg }}>
      <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} style={{ width: 22, height: 22, borderRadius: 8, border: "none", background: "none", display: "grid", placeItems: "center", cursor: page === 0 ? "default" : "pointer", opacity: page === 0 ? 0.4 : 1 }}>
        <ChevronLeft size={13} color={t.text} />
      </button>
      <span style={{ position: "relative", fontSize: 11.5, fontWeight: 700, color: t.sub, whiteSpace: "nowrap", padding: "0 2px" }}>
        {page + 1}/{totalPages}
        <select value={page} onChange={(e) => setPage(Number(e.target.value))} aria-label="เลือกหน้า" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}>
          {Array.from({ length: totalPages }, (_, i) => <option key={i} value={i}>หน้า {i + 1}</option>)}
        </select>
      </span>
      <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1} style={{ width: 22, height: 22, borderRadius: 8, border: "none", background: "none", display: "grid", placeItems: "center", cursor: page === totalPages - 1 ? "default" : "pointer", opacity: page === totalPages - 1 ? 0.4 : 1 }}>
        <ChevronRight size={13} color={t.text} />
      </button>
    </div>
  );
}

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

// 📋 Activity log — เก็บแค่ "ทำอะไรที่ไหนตอนไหน" ห้ามใส่เนื้อหาอ่อนไหว (ยอดเงิน/เนื้อหาโน้ต/ข้อความแชท) ลงใน summary เด็ดขาด
// ยิงแบบ fire-and-forget เสมอ ไม่ await ไม่บล็อก UI และไม่ทำให้ฟีเจอร์หลักพังถ้า log ล้มเหลว
const logAudit = (userId, module, action, summary) => {
  if (!userId) return;
  supabase.from("activity_log").insert({ user_id: userId, module, action, summary }).then(() => {}, () => {});
};


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

// ---------------- 🔔 เสียงแจ้งเตือน/เรียกเข้า (สังเคราะห์สดๆ ไม่ต้องพึ่งไฟล์เสียง) ----------------
function beepOn(ctx, freq, start, dur, type, vol) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type || "sine"; o.frequency.value = freq;
  g.gain.setValueAtTime(vol || 0.22, ctx.currentTime + start);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
  o.connect(g).connect(ctx.destination);
  o.start(ctx.currentTime + start); o.stop(ctx.currentTime + start + dur);
}
// เสียงข้อความเข้า = "ตุ๊บเบาๆ" (เล่นครั้งเดียวสั้นๆ)
function playMessagePop() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    beepOn(ctx, 660, 0, 0.15, "sine", 0.22);
    beepOn(ctx, 880, 0.08, 0.18, "sine", 0.18);
    setTimeout(() => { try { ctx.close(); } catch (e) {} }, 500);
  } catch (e) {}
}
// เสียงโทรเข้า = "ริงโทนนุ่ม + ตุ๊งแตง" สลับกัน วนจนครบ ~60 วิ แล้วหยุดเอง
// คืน object { stop } ให้ผู้เรียกสั่งหยุดก่อนเวลาได้ (ตอนกดรับ/ปฏิเสธ)
function startCallRingtone() {
  let ctx = null, timer = null, stopped = false;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    ctx = new AudioCtx();
  } catch (e) { return { stop: () => {} }; }

  const softRing = () => [[523, 0], [659, 0.18], [784, 0.36], [1047, 0.54]].forEach(([f, t]) => beepOn(ctx, f, t, 0.5, "triangle", 0.2));
  const bell = () => [0, 0.5].forEach((t) => { beepOn(ctx, 1568, t, 0.6, "sine", 0.18); beepOn(ctx, 2093, t, 0.6, "sine", 0.08); });

  let useBell = false;
  const cycle = () => {
    if (stopped) return;
    try { ctx.resume().catch(() => {}); (useBell ? bell : softRing)(); } catch (e) {}
    useBell = !useBell;
  };
  cycle();
  timer = setInterval(cycle, 1500); // สลับริงโทน↔ตุ๊งแตงทุก 1.5 วิ
  const autoStop = setTimeout(() => stop(), 60000); // ครบ 1 นาทีไม่รับ -> ดับเอง

  function stop() {
    if (stopped) return;
    stopped = true;
    clearInterval(timer); clearTimeout(autoStop);
    try { ctx.close(); } catch (e) {}
  }
  return { stop };
}

// 🔔⏱ เสียงปลุกตัวจับเวลาเป้าหมาย — ดัง "ปี๊บ 3 โน้ต" ต่อครั้ง วนซ้ำ 5 ครั้งห่างกัน 1.5 วิ แล้วดับเอง
// คืน object { stop } เหมือน startCallRingtone — กด "รับทราบ" แล้วเรียก stop() หยุดได้ก่อนครบ 5 ครั้ง
// onRing(count) เรียกทุกครั้งที่ดัง ให้ฝั่ง UI โชว์ "ครั้งที่ N/5" ได้แบบเรียลไทม์
function startTimerAlarm(onRing, maxRings) {
  const total = maxRings || 5;
  let ctx = null, timer = null, stopped = false, count = 0;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    ctx = new AudioCtx();
  } catch (e) { return { stop: () => {} }; }

  const ring = () => [0, 0.2, 0.4].forEach((t) => beepOn(ctx, 880, t, 0.15, "square", 0.24));

  const cycle = () => {
    if (stopped) return;
    count++;
    try { ctx.resume().catch(() => {}); ring(); } catch (e) {}
    onRing?.(count);
    if (count >= total) { stop(); return; }
    timer = setTimeout(cycle, 1500);
  };
  cycle();

  function stop() {
    if (stopped) return;
    stopped = true;
    clearTimeout(timer);
    try { ctx.close(); } catch (e) {}
  }
  return { stop };
}

// ---------------- Theme ----------------
// 🎨 ระบบธีมสีแอป (แยกอิสระจากสี Mentor โดยสิ้นเชิง — Mentor ใช้แค่จุดที่เป็นตัวตนโค้ชเท่านั้น เช่น การ์ดเลือกโค้ช/แชท)
// แต่ละธีมมีเวอร์ชัน day และ night ของตัวเอง อิสระจากกัน (เลือกธีมได้โดยไม่ผูกกับเวลา/โหมดกลางวัน-กลางคืน)
// 🎨 สถาปัตยกรรมธีมใหม่ — แยก "โหมด" (สว่าง/มืด = พื้นหลัง/การ์ด/ตัวหนังสือ ขาว-ดำสากล ใช้ร่วมกันทุกธีม)
// ออกจาก "สีเด่น" (accent เฉพาะของแต่ละธีม คุมแค่ปุ่ม/ไอคอน active/hero/ไฮไลท์) ตามที่ Maxnuss ขอ
// ข้อดี: ธีมไหนก็พื้นขาว/ดำเหมือนกันหมด ต่างกันแค่สีจุดเน้นที่โผล่มา + เพิ่มธีมใหม่ได้ง่ายแค่ใส่ accent ไม่ต้องคิดพื้นหลังใหม่ทุกครั้ง
const MODE_BASE = {
  day: {
    page: "#F5F5F4", bgTop: "#F5F5F4", bgBot: "#FFFFFF", surface: "#FFFFFF",
    text: "#1A1A1A", sub: "#6E6E6E", faint: "#A3A3A3", border: "rgba(0,0,0,0.07)",
    inputBg: "#F1F1F0", dock: "#FFFFFF", dockBorder: "rgba(0,0,0,0.05)", star: false,
    cat: { green: "#E7F1E9", amber: "#FBF0D6", coral: "#FBE4DC", violet: "#E9E7F4" },
    catTx: { green: "#2A3B30", amber: "#3A3320", coral: "#5A3327", violet: "#39316A" },
    catLb: { green: "#5E7A66", amber: "#8A7434", coral: "#A85C42", violet: "#6A5C9A" },
  },
  night: {
    page: "#0D0D0D", bgTop: "#151515", bgBot: "#0D0D0D", surface: "#1C1C1C",
    text: "#F2F2F2", sub: "#9A9A9A", faint: "#5C5C5C", border: "rgba(255,255,255,0.08)",
    inputBg: "rgba(255,255,255,.06)", dock: "#1C1C1C", dockBorder: "rgba(255,255,255,0.10)", star: true,
    cat: { green: "#16223C", amber: "#1E2438", coral: "#2A1C24", violet: "#201E33" },
    catTx: { green: "#EAF2EC", amber: "#F0E9D6", coral: "#F6E4DC", violet: "#E7E3F6" },
    catLb: { green: "#8FA79A", amber: "#C6B274", coral: "#D89A86", violet: "#A99CD6" },
  },
};

const THEMES = {
  gray: {
    label: "เทา",
    day:   { accent: "#8A8A8E", accent2: "#A6A6AA", onAccent: "#FFFFFF" },
    night: { accent: "#B5B5BA", accent2: "#D0D0D4", onAccent: "#141414" },
  },
  default:  {
    label: "PKNOW (ส้ม)",
    day:   { accent: "#F2872E", accent2: "#F5A050", onAccent: "#141414" },
    night: { accent: "#F2872E", accent2: "#F5A050", onAccent: "#141414" },
  },
  red: {
    label: "เรดโบลด์",
    day:   { accent: "#D64A3D", accent2: "#E8756A", onAccent: "#FFFFFF" },
    night: { accent: "#E8574A", accent2: "#F2857A", onAccent: "#FFFFFF" },
  },
  navy: {
    label: "เนวี่พรีเมียม",
    day:   { accent: "#2B3953", accent2: "#44577A", onAccent: "#FFFFFF" },
    night: { accent: "#6C93D9", accent2: "#8CAEE8", onAccent: "#0D1420" },
  },
  twilight: {
    label: "ทไวไลท์",
    day:   { accent: "#C2607E", accent2: "#D6839B", onAccent: "#FFFFFF" },
    night: { accent: "#B48DD9", accent2: "#CBA8E8", onAccent: "#241C2B" },
  },
};

// 🎨 helper สำหรับธีมสีกำหนดเอง — ผสมสีให้อ่อนลง (ทำ accent2 จาก accent หลักที่ user เลือก) + คำนวณความสว่างเพื่อเลือกสีตัวหนังสือ (onAccent) ให้ contrast ปลอดภัยอัตโนมัติ
function hexToRgb(hex) {
  const h = (hex || "#F2872E").replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}
function lightenHex(hex, amt) {
  const { r, g, b } = hexToRgb(hex);
  const mix = (c) => Math.round(c + (255 - c) * amt);
  return `#${[mix(r), mix(g), mix(b)].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}
function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const [rl, gl, bl] = [r, g, b].map((c) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

function palette(mode, themeId, customAccent) {
  let T;
  if (themeId === "custom" && customAccent) {
    const onAccent = relativeLuminance(customAccent) > 0.5 ? "#141414" : "#FFFFFF";
    T = { accent: customAccent, accent2: lightenHex(customAccent, 0.2), onAccent };
  } else {
    const th = THEMES[themeId] || THEMES.default;
    T = th[mode] || th.day;
  }
  const base = MODE_BASE[mode] || MODE_BASE.day;
  const common = { accent: T.accent, accent2: T.accent2, onAccent: T.onAccent };
  return {
    ...common, page: base.page, bg: `linear-gradient(180deg,${base.bgTop} 0%,${base.bgBot} 100%)`,
    surface: base.surface, hero: `linear-gradient(135deg,${T.accent2} 0%,${T.accent} 100%)`, heroBorder: "transparent",
    text: base.text, sub: base.sub, faint: base.faint, border: base.border,
    dock: base.dock, dockBorder: base.dockBorder, star: base.star, inputBg: base.inputBg,
    cat: base.cat, catTx: base.catTx, catLb: base.catLb,
  };
}

// 🔲 ทรงกรอบการ์ด — sharp (เหลี่ยมคมแบบ SCB ไม่มีเงา ไม่มีมุมโค้ง คั่นด้วยเส้นบางแทน) หรือ soft (มนเบาๆ ใกล้ตัวอักษร ไม่กลมฟูเหมือนเดิม)
// ใช้ร่วมกับ t (จาก palette()) เพื่อคำนวณ border/shadow ที่ตรงกับธีมสีปัจจุบันด้วย
function shapeTokens(cardShape, t) {
  if (cardShape === "sharp") return {
    radius: 0, shadow: "none", border: `1px solid ${t.border}`, bg: t.surface, iconRadius: 0,
  };
  return {
    radius: 10, shadow: t.star ? "none" : "0 2px 8px rgba(0,0,0,.05)", border: "none", bg: t.surface, iconRadius: 8,
  };
}


// 🚪 Portal สำหรับ popup ที่สร้างจากข้างในหน้าเพจ (เช่น Admin, Chat) ให้หลุดออกไปแปะที่ document.body ตรงๆ
// กันปัญหาติดอยู่ใน "เขตซ้อนชั้น" ของกล่องเนื้อหา ซึ่งทำให้ z-index สูงแค่ไหนก็ไม่มีทางซ้อนทับแถบเมนูด้านล่างได้
// 🖼️ ดูรูปเต็มจอ — ใช้ร่วมกันได้ทุกที่ในแอปที่มีรูป (แชท, avatar ฯลฯ)
// 📞 คุยด้วยเสียง/วิดีโอ — ฝัง Jitsi Meet ไว้ในแอป (ฟรี ไม่ต้องมี API key) ทุกคนในห้องแชทเดียวกันเจอห้องคุยเดียวกันอัตโนมัติ
// 📞 คุยด้วยเสียง — ทำเอง ไม่พึ่งบริการนอก (WebRTC + Supabase Realtime ส่งสัญญาณเชื่อมสาย) ไม่มีการบังคับล็อกอินใดๆ
// ใช้ STUN สาธารณะฟรีของ Google เชื่อมสายตรง (ไม่มี TURN server สำรอง เผื่อบางเครือข่ายที่เข้มงวดมากอาจเชื่อมไม่ติด แต่ฟรี 100%)
// กล่องวิดีโอ/โปรไฟล์ 1 คนในหน้าโทร — เป็น component ระดับโมดูล (ไม่ได้อยู่ใน CallModal)
// ถ้านิยามไว้ข้างใน CallModal จะถูกสร้างใหม่ทุก re-render -> React remount กล่องวิดีโอ ทำให้กล้องดำ+โปรไฟล์ซ้อน
function CallVideoTile({ tile, big, t, onExpand, attachLocalVideo, attachRemoteVideo }) {
  const dim = big ? { width: "100%", height: "100%" } : { width: 100, height: 130 };
  return (
    <div onClick={onExpand} style={{ textAlign: "center", cursor: "pointer", position: big ? "relative" : "static", ...(big ? { width: "100%", height: "100%" } : {}) }}>
      {tile.hasVideo ? (
        tile.isSelf ? (
          <video ref={attachLocalVideo} autoPlay muted playsInline style={{ ...dim, borderRadius: 14, objectFit: "cover", background: "#000", transform: "scaleX(-1)" }} />
        ) : (
          <video id={`vid-${tile.sid}`} ref={attachRemoteVideo(tile.sid)} autoPlay playsInline style={{ ...dim, borderRadius: 14, objectFit: "cover", background: "#000" }} />
        )
      ) : (
        <div style={{ ...(big ? { width: "100%", height: "100%" } : {}), display: "grid", placeItems: "center", background: big ? "#111827" : "transparent", borderRadius: 14 }}>
          {tile.avatar ? (
            <img src={tile.avatar} alt="" style={{ width: big ? 96 : 64, height: big ? 96 : 64, borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: big ? 96 : 64, height: big ? 96 : 64, borderRadius: "50%", background: tile.isSelf ? t.accent : "#5C7A99", display: "grid", placeItems: "center", fontSize: big ? 34 : 22, fontWeight: 700, color: "#fff" }}>{(tile.name || "?")[0]}</div>
          )}
        </div>
      )}
      <div style={{ fontSize: 11, marginTop: big ? 0 : 6, color: "#fff", ...(big ? { position: "absolute", bottom: 10, left: 12, background: "rgba(0,0,0,.5)", padding: "3px 8px", borderRadius: 8 } : {}) }}>{tile.name}</div>
    </div>
  );
}

function CallModal({ t, threadId, userId, displayName, myAvatar, otherMemberIds, roomName, session, minimized, onMinimize, onClose }) {
  const [participants, setParticipants] = useState([]); // [{sid, identity, name, hasVideo}]
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [err, setErr] = useState("");
  const [speakerLoud, setSpeakerLoud] = useState(false); // false = เบา (แนบหู) / true = ดัง (เปิดลำโพง) — เริ่มที่เบาเหมือนโทรศัพท์
  const [speakerMuted, setSpeakerMuted] = useState(false); // ปิดเสียงลำโพง = ไม่ได้ยินเสียงคนอื่นเลย (ต่างจากปิดไมค์ที่เป็นเสียงเรา)
  const [layout, setLayout] = useState("grid"); // grid | speaker
  const [focusSid, setFocusSid] = useState(null); // sid ของคนที่ถูกเลือกให้เป็นจอใหญ่ (speaker view)
  const roomRef = useRef(null);
  const audioElsRef = useRef({}); // identity -> <audio> element จริง (วิธีมาตรฐาน เล่นเสียงได้ทุกแพลตฟอร์ม)
  const videoTracksRef = useRef({}); // sid -> video track ของคนอื่น
  const localVideoRef = useRef(null);
  const presenceChannelRef = useRef(null);
  const watchChannelRef = useRef(null);
  const joinedAtRef = useRef(null);
  const SOFT_VOL = 0.35, LOUD_VOL = 1.0; // เบาแนบหู vs ดังเปิดลำโพง

  // ปรับความดังของทุก <audio> element เมื่อสลับเบา/ดัง
  useEffect(() => {
    Object.values(audioElsRef.current).forEach((el) => { el.muted = speakerMuted; el.volume = speakerLoud ? LOUD_VOL : SOFT_VOL; });
  }, [speakerLoud, speakerMuted]);

  const attachAudio = (track, identity) => {
    const el = track.attach(); // คืน <audio> ที่ผูก track แล้ว
    el.autoplay = true;
    el.playsInline = true;
    el.volume = speakerLoud ? LOUD_VOL : SOFT_VOL;
    el.muted = speakerMuted;
    document.body.appendChild(el);
    el.play?.().catch(() => {});
    audioElsRef.current[identity] = el;
  };

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const { Room, RoomEvent, Track } = await import("livekit-client");

        // ดึง token สดจาก session ปัจจุบันก่อนเสมอ (token เก่าใน prop อาจหมดอายุ -> "ยืนยันตัวตนไม่สำเร็จ")
        let freshToken = session?.access_token;
        try {
          const { data: sess } = await supabase.auth.getSession();
          if (sess?.session?.access_token) freshToken = sess.session.access_token;
        } catch (e) {}

        const requestToken = async (tok) => {
          const rr = await fetch("/api/livekit-token", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomName: `refhub-${threadId}`, participantName: displayName, avatar: myAvatar || "", sessionId: crypto.randomUUID(), callerToken: tok }),
          });
          return { ok: rr.ok, data: await rr.json() };
        };

        let { ok, data } = await requestToken(freshToken);
        // ถ้ายืนยันตัวตนไม่ผ่าน -> รีเฟรช session ขอ token ใหม่แล้วลองอีกครั้ง (กันเคส token หมดอายุตอนกดรับสาย)
        if (!ok) {
          try {
            const { data: refreshed } = await supabase.auth.refreshSession();
            const newTok = refreshed?.session?.access_token;
            if (newTok) { const retry = await requestToken(newTok); ok = retry.ok; data = retry.data; }
          } catch (e) {}
        }
        if (!ok) throw new Error(data.error);
        if (cancelled) return;

        const room = new Room({ adaptiveStream: true, dynacast: true });
        roomRef.current = room;

        const upsert = (participant) => {
          // ข้ามตัวเอง (local participant) — ตัวเองโชว์ผ่านกล่อง "self" อยู่แล้ว
          if (participant.isLocal || participant.identity === roomRef.current?.localParticipant?.identity) return;
          let avatar = "";
          try { avatar = JSON.parse(participant.metadata || "{}").avatar || ""; } catch (e) {}
          setParticipants((list) => {
            const others = list.filter((x) => x.sid !== participant.sid);
            return [...others, { sid: participant.sid, identity: participant.identity, name: participant.name || "เพื่อน", hasVideo: participant.isCameraEnabled, avatar }];
          });
        };

        room.on(RoomEvent.TrackSubscribed, (track, pub, participant) => {
          if (track.kind === Track.Kind.Audio) attachAudio(track, participant.identity);
          if (track.kind === Track.Kind.Video) {
            videoTracksRef.current[participant.sid] = track;
            const el = document.getElementById(`vid-${participant.sid}`);
            if (el) { try { track.attach(el); } catch (e) {} }
          }
          upsert(participant);
        });

        room.on(RoomEvent.TrackUnsubscribed, (track, pub, participant) => {
          if (track.kind === Track.Kind.Audio) {
            const el = audioElsRef.current[participant.identity];
            if (el) { try { track.detach(el); el.remove(); } catch (e) {} delete audioElsRef.current[participant.identity]; }
          }
          if (track.kind === Track.Kind.Video) delete videoTracksRef.current[participant.sid];
          upsert(participant);
        });

        room.on(RoomEvent.ParticipantDisconnected, (participant) => {
          setParticipants((list) => list.filter((x) => x.sid !== participant.sid));
          const el = audioElsRef.current[participant.identity];
          if (el) { try { el.remove(); } catch (e) {} delete audioElsRef.current[participant.identity]; }
          delete videoTracksRef.current[participant.sid];
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
        // ช่องที่ 2 แยกหัวข้อ สำหรับ IncomingCallWatcher ระดับแอป (กันชนหัวข้อเดียวกับ ChatRoomPage ที่ทำให้ crash)
        const watchChannel = supabase.channel(`callwatch-${threadId}`);
        watchChannel.subscribe((status) => { if (status === "SUBSCRIBED") watchChannel.track({ userId, name: displayName }); });
        watchChannelRef.current = watchChannel;

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
      if (watchChannelRef.current) supabase.removeChannel(watchChannelRef.current);
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
    setCameraOn(next);
  };

  // ต่อวิดีโอตัวเองเข้ากับ element เมื่อเปิดกล้อง (callback ref ทำงานทุกครั้งที่ element mount ใหม่ กันจอดำ/ซ้อน)
  const attachLocalVideo = (el) => {
    localVideoRef.current = el;
    if (el && cameraOn) {
      const pub = [...(roomRef.current?.localParticipant.videoTrackPublications.values() || [])][0];
      if (pub?.track) { try { pub.track.attach(el); } catch (e) {} }
    }
  };
  // ต่อวิดีโอคนอื่นเข้ากับ element (callback ref — เรียกทุกครั้งที่ element ของ sid นั้น mount)
  const attachRemoteVideo = (sid) => (el) => {
    if (el && videoTracksRef.current[sid]) { try { videoTracksRef.current[sid].attach(el); } catch (e) {} }
  };

  // รวมทุกคน (ตัวเอง + คนอื่น) เป็นรายการเดียวเพื่อจัดเลย์เอาต์
  const allTiles = [{ sid: "self", name: `${displayName || "ฉัน"} (คุณ)`, isSelf: true, hasVideo: cameraOn, avatar: myAvatar || "" }, ...participants];
  const total = allTiles.length;
  const focused = focusSid ? allTiles.find((x) => x.sid === focusSid) : allTiles.find((x) => x.hasVideo) || allTiles[0];
  const others = allTiles.filter((x) => x.sid !== focused?.sid);
  const tileProps = (tile, big) => ({ tile, big, t, onExpand: () => { setLayout("speaker"); setFocusSid(tile.sid); }, attachLocalVideo, attachRemoteVideo });

  return (
    <ModalPortal>
      <div style={{ position: "fixed", inset: 0, background: "#0D0C0B", zIndex: 100, display: minimized ? "none" : "flex", flexDirection: "column", alignItems: "center", color: "#fff" }}>
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
                  <div style={{ flex: 1, minHeight: 0, marginBottom: 10 }}><CallVideoTile {...tileProps(focused, true)} /></div>
                  {others.length > 0 && (
                    <div style={{ display: "flex", gap: 10, overflowX: "auto", flexShrink: 0, paddingBottom: 4 }}>
                      {others.map((tile) => <CallVideoTile key={tile.sid} {...tileProps(tile, false)} />)}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ flex: 1, display: "grid", gridTemplateColumns: total <= 1 ? "1fr" : "1fr 1fr", gap: 12, alignContent: "center", justifyItems: "center", minHeight: 0 }}>
                  {allTiles.map((tile) => (
                    <div key={tile.sid} style={{ width: "100%", aspectRatio: total <= 2 ? "3/4" : "1/1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CallVideoTile {...tileProps(tile, tile.hasVideo)} />
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
              <button onClick={() => setSpeakerLoud((s) => !s)} style={{ width: 54, height: 54, borderRadius: 27, background: speakerLoud ? "#2E9E6B" : "rgba(255,255,255,.15)", border: "none", cursor: "pointer", display: "grid", placeItems: "center" }} title={speakerLoud ? "ปิดลำโพง (เสียงเบาแนบหู)" : "เปิดลำโพง (เสียงดัง)"}>
                {speakerLoud ? <Volume2 size={20} color="#fff" /> : <Volume1 size={20} color="#fff" />}
              </button>
              <button onClick={() => setSpeakerMuted((m) => !m)} style={{ width: 54, height: 54, borderRadius: 27, background: speakerMuted ? "#D9534F" : "rgba(255,255,255,.15)", border: "none", cursor: "pointer", display: "grid", placeItems: "center" }} title={speakerMuted ? "เปิดเสียง (ได้ยินคนอื่น)" : "ปิดเสียง (ไม่ได้ยินคนอื่น)"}>
                {speakerMuted ? <VolumeX size={20} color="#fff" /> : <Volume2 size={20} color="#fff" />}
              </button>
              <button onClick={onClose} style={{ width: 54, height: 54, borderRadius: 27, background: "#D9534F", border: "none", cursor: "pointer", display: "grid", placeItems: "center" }} title="วางสาย">
                <PhoneOff size={20} color="#fff" />
              </button>
            </div>
            <div style={{ fontSize: 10.5, opacity: .5, padding: "6px 20px 18px", textAlign: "center" }}>
              {speakerLoud ? "🔊 เปิดลำโพง (เสียงดัง)" : "🔉 เสียงเบา (แนบหู) · กดลำโพงเพื่อเปิดเสียงดัง"} · แตะที่คนใดคนหนึ่งเพื่อขยายจอ
            </div>
          </>
        )}
      </div>
    </ModalPortal>
  );
}

// 🖼️ ดูรูปเต็มจอ — รองรับทั้งรูปเดียว (ส่ง src) และหลายรูปในโพสต์เดียวกัน (ส่ง images+index ปัด/กดลูกศรเลื่อนไปรูปถัดไปได้)
// เพิ่มปุ่มดาวน์โหลดรูปลงเครื่อง — ใช้วิธี fetch เป็น blob ก่อนสร้างลิงก์ดาวน์โหลด (เหมือน pattern doExportCsv/downloadText เดิม)
// เพราะ URL ของ Supabase Storage เป็นคนละ origin การใส่ attribute download ตรงๆ บน <a> เฉยๆ เบราว์เซอร์จะไม่ยอมบังคับดาวน์โหลดให้ (แค่เปิดรูปแทน)
function ImageLightbox({ src, images, index, onClose }) {
  const list = images && images.length > 0 ? images : (src ? [src] : []);
  const [curIndex, setCurIndex] = useState(index || 0);
  const currentSrc = list[curIndex] || src;
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const stateRef = useRef({ startDist: 0, startScale: 1, startPos: { x: 0, y: 0 }, dragStart: null, lastTap: 0 });
  const swipeRef = useRef({ startX: 0, lastX: 0, active: false });

  const dist = (touches) => Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
  const goNext = () => { setScale(1); setPos({ x: 0, y: 0 }); setCurIndex((i) => Math.min(list.length - 1, i + 1)); };
  const goPrev = () => { setScale(1); setPos({ x: 0, y: 0 }); setCurIndex((i) => Math.max(0, i - 1)); };

  const onTouchStart = (e) => {
    if (e.touches.length === 2) {
      stateRef.current.startDist = dist(e.touches);
      stateRef.current.startScale = scale;
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - stateRef.current.lastTap < 300) { setScale(1); setPos({ x: 0, y: 0 }); } // ดับเบิลแท็ป -> รีเซ็ตซูม
      stateRef.current.lastTap = now;
      stateRef.current.dragStart = { x: e.touches[0].clientX - pos.x, y: e.touches[0].clientY - pos.y };
      swipeRef.current = { startX: e.touches[0].clientX, lastX: e.touches[0].clientX, active: scale === 1 && list.length > 1 }; // ปัดซ้าย/ขวาเลื่อนรูปได้เฉพาะตอนไม่ได้ซูมอยู่ และมีมากกว่า 1 รูป
    }
  };
  const onTouchMove = (e) => {
    if (e.touches.length === 2 && stateRef.current.startDist) {
      e.preventDefault();
      const newScale = Math.min(5, Math.max(1, stateRef.current.startScale * (dist(e.touches) / stateRef.current.startDist)));
      setScale(newScale);
    } else if (e.touches.length === 1) {
      if (scale > 1 && stateRef.current.dragStart) {
        e.preventDefault();
        setPos({ x: e.touches[0].clientX - stateRef.current.dragStart.x, y: e.touches[0].clientY - stateRef.current.dragStart.y });
      }
      if (swipeRef.current.active) swipeRef.current.lastX = e.touches[0].clientX;
    }
  };
  const onTouchEnd = () => {
    if (swipeRef.current.active) {
      const delta = swipeRef.current.lastX - swipeRef.current.startX;
      if (delta < -50) goNext(); else if (delta > 50) goPrev(); // ปัดซ้ายแรงพอ -> รูปถัดไป, ปัดขวา -> ย้อนกลับ
    }
    stateRef.current.startDist = 0; stateRef.current.dragStart = null;
    swipeRef.current = { startX: 0, lastX: 0, active: false };
  };
  const onWheel = (e) => { e.preventDefault(); setScale((s) => Math.min(5, Math.max(1, s - e.deltaY * 0.002))); };

  const downloadImage = async () => {
    try {
      const res = await fetch(currentSrc);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl; a.download = `refhub-${Date.now()}.jpg`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
    } catch (e) {
      window.open(currentSrc, "_blank"); // เผื่อโหลดเป็น blob ไม่สำเร็จ (เช่น CORS) เปิดแท็บใหม่ให้กด save เองแทน
    }
  };

  return (
    <ModalPortal>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.9)", zIndex: 150, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", touchAction: "none" }} onClick={() => scale === 1 && onClose()}>
        <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,.15)", border: "none", borderRadius: 20, width: 40, height: 40, cursor: "pointer", display: "grid", placeItems: "center", zIndex: 2 }}><X size={22} color="#fff" /></button>
        <button onClick={(e) => { e.stopPropagation(); downloadImage(); }} style={{ position: "absolute", top: 20, right: 70, background: "rgba(255,255,255,.15)", border: "none", borderRadius: 20, width: 40, height: 40, cursor: "pointer", display: "grid", placeItems: "center", zIndex: 2 }} title="บันทึกรูปลงเครื่อง"><Download size={19} color="#fff" /></button>
        {list.length > 1 && <div style={{ position: "absolute", top: 27, left: "50%", transform: "translateX(-50%)", color: "#fff", fontSize: 12, fontWeight: 700, background: "rgba(255,255,255,.18)", padding: "4px 12px", borderRadius: 12, zIndex: 2 }}>{curIndex + 1}/{list.length}</div>}
        {list.length > 1 && curIndex > 0 && <button onClick={(e) => { e.stopPropagation(); goPrev(); }} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,.15)", border: "none", borderRadius: 20, width: 40, height: 40, cursor: "pointer", display: "grid", placeItems: "center", zIndex: 2 }}><ChevronLeft size={24} color="#fff" /></button>}
        {list.length > 1 && curIndex < list.length - 1 && <button onClick={(e) => { e.stopPropagation(); goNext(); }} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,.15)", border: "none", borderRadius: 20, width: 40, height: 40, cursor: "pointer", display: "grid", placeItems: "center", zIndex: 2 }}><ChevronRight size={24} color="#fff" /></button>}
        {scale > 1 && <div style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,.6)", fontSize: 11 }}>ดับเบิลแท็ปเพื่อรีเซ็ตซูม</div>}
        <img
          src={currentSrc} alt=""
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
  const [theme, setTheme] = useState("default"); // 🎨 ธีมสีแอป: gray | default | red | navy | twilight | custom — แยกอิสระจาก mentor
  const [customAccent, setCustomAccent] = useState("#F2872E"); // 🎨 สีที่ user กำหนดเอง ใช้เมื่อ theme === "custom" (accent2/onAccent คำนวณอัตโนมัติจากสีนี้)
  const [cardShape, setCardShape] = useState("soft"); // 🔲 ทรงกรอบการ์ด: sharp (เหลี่ยมคมแบบ SCB ไม่มีเงา) | soft (มนเบาๆ ใกล้ตัวอักษร) — default soft ตามที่ตกลง
  const [homeLayout, setHomeLayout] = useState("original"); // 🏠 โครงหน้า Home: original (ของเดิม) | wallet (แนววอลเล็ต) | bento (บล็อกผสม) — default original ตามที่ตกลง
  const [fontScale, setFontScale] = useState(() => { // 📏 ขนาดตัวอักษร: 100 | 115 | 130 (ปกติ/ใหญ่/ใหญ่มาก) — อ่านจาก localStorage ทันทีตอน mount กันจอกระพริบกลับไป 100 ก่อนแวบนึง
    try { const fs = JSON.parse(localStorage.getItem("refhub:fontScale") || "null"); return fs || 100; } catch (e) { return 100; }
  });
  const dbFontScaleHydratedRef = useRef(false); // 🔒 กันบั๊ก: ค่าจาก DB (font_scale) เคยไปทับค่าที่เพิ่งเลือกไว้ในเครื่องนี้ทุกครั้งที่ authProfile โหลดใหม่ — ให้ดึงจาก DB มาทับได้แค่ "ครั้งแรก" ตอน hydrate เท่านั้น และเฉพาะตอนที่เครื่องนี้ไม่มีค่าอยู่ในเครื่องอยู่แล้ว (เครื่องใหม่/ล้าง storage)
  const [page, setPage] = useState(() => { try { return sessionStorage.getItem("refhub:page") || "home"; } catch (e) { return "home"; } });
  const contentScrollRef = useRef(null); // 📜 container หลักที่ scroll ของทุกหน้า — ใช้เด้งกลับขึ้นบนตอนเปลี่ยนหน้า + ปุ่มเลื่อนขึ้น/ลง
  const [atTop, setAtTop] = useState(true); // true = อยู่บนสุด (ปุ่มลอยจะเป็นลูกศรลง), false = เลื่อนลงมาแล้ว (ปุ่มลอยเป็นลูกศรขึ้น)
  useEffect(() => { contentScrollRef.current?.scrollTo({ top: 0, behavior: "auto" }); setAtTop(true); }, [page]); // 🐛 เปลี่ยนหน้าแล้วเนื้อหาค้างตำแหน่ง scroll เดิมของหน้าก่อน ทำให้บางทีเปิดหน้าใหม่มาแล้วเจอเนื้อหาตรงกลาง/ท้ายหน้าทันที ไม่เห็นหัวข้อ
  const [notes, setNotes] = useState([]);
  const [goals, setGoals] = useState([]);
  const [goalTemplates, setGoalTemplates] = useState([]); // แม่แบบเป้าหมายประจำสัปดาห์ [{id, text, daysOfWeek, difficulty, active}]
  const [tx, setTx] = useState([]);
  const [billReminders, setBillReminders] = useState([]); // แม่แบบบิลที่ต้องจ่าย [{id, label, amount, recurring, dueDay, dueDate, categoryId, active}]
  const [billPayments, setBillPayments] = useState([]); // แต่ละ "รอบ" ที่ต้องจ่าย [{id, billId, periodKey, dueDate, amount, paid, paidAt, lastNotifiedDate}]
  const [reminders, setReminders] = useState([]); // ระบบเตือนกลาง [{id, targetType, targetId, label, recurrence, time, specificDate, dayOfWeek, dayOfMonth, active, lastFiredKey}]
  const [reminderTarget, setReminderTarget] = useState(null); // { targetType, targetId, label, existing } — เปิด ReminderModal เมื่อไม่เป็น null
  const [hintDefs, setHintDefs] = useState([]); // [{key, locationLabel, body, active}] — คำแนะนำที่แอดมินตั้งค่าไว้ (ทุกอัน active หรือไม่ก็ตาม เผื่อหน้าแอดมินต้องเห็นครบ)
  const [seenHintKeys, setSeenHintKeys] = useState(new Set()); // key ของคำแนะนำที่ผู้ใช้คนนี้เคยดูไปแล้ว
  const [profile, setProfile] = useState({ name: "", avatar: "" });
  const [autoNight, setAutoNight] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [askAiTopic, setAskAiTopic] = useState(null); // หัวข้อบทความที่กด "ถาม AI ต่อ" มา (ให้ ChatModal เปิดมาพร้อมคำถามนี้)
  const [mentorPick, setMentorPick] = useState(false);
  const [activeCall, setActiveCall] = useState(null); // { threadId, roomName, otherMemberIds } ห้องที่กำลังคุยอยู่ (อยู่ระดับบนสุด กันสายหลุดตอนสลับหน้าในแอป)
  const [callMinimized, setCallMinimized] = useState(false);
  const [themePick, setThemePick] = useState(false);
  const [homeLayoutPick, setHomeLayoutPick] = useState(false); // 🏠 modal เลือกโครงหน้า Home (original/wallet/bento)
  const [editProfile, setEditProfile] = useState(false);
  const [profileLightbox, setProfileLightbox] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [hamburgerOpen, setHamburgerOpen] = useState(false); // ☰ เมนูนำทางไปหน้าใหญ่ๆ แยกจาก ⋮ ที่เหลือแค่ปรับหน้าตาด่วน
  const [communityOpen, setCommunityOpen] = useState(false); // เปิดหน้า Community (โลกใน navbar)
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const [myActivityOpen, setMyActivityOpen] = useState(false);
  const [chatUnread, setChatUnread] = useState(0); // จำนวนข้อความแชทที่ยังไม่ได้อ่าน (คำนวณจริงในหน้าแชท)
  const [msgToast, setMsgToast] = useState(null); // ป็อปอัพแจ้งข้อความใหม่ทั่วทั้งแอป { name, text, threadId, at }
  useEffect(() => { if (!msgToast) return; const id = setTimeout(() => setMsgToast(null), 4000); return () => clearTimeout(id); }, [msgToast?.at]);
  const [activeThread, setActiveThread] = useState(() => { try { return JSON.parse(sessionStorage.getItem("refhub:activeThread") || "null"); } catch (e) { return null; } });
  useEffect(() => { if (page === "chatRoom" && !activeThread) setPage("chat"); }, []);
  useEffect(() => { try { if (activeThread) sessionStorage.setItem("refhub:activeThread", JSON.stringify(activeThread)); else sessionStorage.removeItem("refhub:activeThread"); } catch (e) {} }, [activeThread]);
  const [addOpen, setAddOpen] = useState(false);
  const [billManagerOpen, setBillManagerOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false); // ⚠️ ย้ายมาจากใน HomePage — เดิม modal เรนเดอร์อยู่ในกล่อง transform:scale ของ HomePage ทำให้ position:fixed เพี้ยน ไม่เต็มจอจริง (ซ้อนทับกับ Dock) บั๊กแบบเดียวกับที่เคยเจอกับ BillManagerModal ต้องเรนเดอร์จากระดับบนสุดของแอปเท่านั้น
  const [goalTimerTarget, setGoalTimerTarget] = useState(null); // ⏱ เก็บ goal object ที่กำลังจับเวลาอยู่ (null = ไม่ได้เปิด) เรนเดอร์ GoalTimerModal จากระดับบนสุดตาม pattern เดียวกับ leaderboardOpen ข้างบน
  const [scoreRulesOpen, setScoreRulesOpen] = useState(false); // 📐 หน้ากฎการนับคะแนน — เรนเดอร์จากระดับบนสุดเช่นกัน กันบั๊ก transform:scale
  const [addGoalOpen, setAddGoalOpen] = useState(false); // ⚠️ ย้ายมาจากใน HomePage — เจอบั๊กเดียวกับ leaderboardOpen/BillManagerModal คือ position:fixed เพี้ยนเพราะอยู่ในกล่อง transform:scale ทำให้ modal ไปชนซ้อนกับหัวแอปด้านบน
  const [exportText, setExportText] = useState(null);
  const [musicOpen, setMusicOpen] = useState(false);
  const [playlist, setPlaylist] = useState([]);
  const [folders, setFolders] = useState([]); // หมวดหมู่เพลงที่ผู้ใช้สร้างเอง เช่น {id, name}
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES); // หมวดหมู่การเงิน (แก้ไข/เพิ่ม/ลบ/สลับได้)
  const [curId, setCurId] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [repeatMode, setRepeatMode] = useState("all"); // 🔁 'off' = จบคิวแล้วหยุด, 'all' = วนทั้งคิว (ค่าเริ่มต้น ตรงกับพฤติกรรมเดิม), 'one' = วนซ้ำเพลงเดียว
  const [shuffleOn, setShuffleOn] = useState(false); // 🔀 สุ่มเพลงถัดไป (ไม่ซ้ำเพลงปัจจุบัน) แทนการเรียงตามลำดับคิว
  const audioRef = useRef(null);
  const ytPlayerRef = useRef(null);   // เก็บ instance ของ YouTube IFrame Player
  const ytReadyRef = useRef(false);   // true เมื่อ YouTube API script โหลดเสร็จ
  const [volume, setVolume] = useState(45);
  const [quoteIdx, setQuoteIdx] = useState(0);

  const isNight = themeMode === "night" || (themeMode === "auto" && autoNight);
  const mode = isNight ? "night" : "day";
  const t = palette(mode, theme, customAccent);
  const customMentorObj = customMentors.find((c) => c.id === mentor);
  // ⚠️ เดิมเช็ค MENTORS[mentor] || (...) แต่ MENTORS.none มีอยู่จริงในอ็อบเจกต์ เลยชนะ || ก่อนเสมอ
  // ทำให้ไม่มีวันไปถึงส่วนที่เอารูปที่ user ตั้งเองมาใส่ — ต้องเช็ค "none" แยกเป็นเคสแรกสุด
  const M = mentor === "none"
    ? { ...MENTORS.none, avatarUrl: authProfile?.assistant_avatar_url || null } // ผู้ช่วยทั่วไป — ใช้รูปที่ user ตั้งเองได้ (เก็บใน profiles)
    : MENTORS[mentor] ? { ...MENTORS[mentor], avatarUrl: authProfile?.builtin_mentor_avatars?.[mentor] || null } // Loid/Itachi/Bond — ก็ตั้งรูปเองได้เหมือนกัน (เก็บใน profiles.builtin_mentor_avatars แยกเป็นคนละคีย์ต่อโค้ช)
    : (customMentorObj ? {
    name: customMentorObj.name, full: customMentorObj.name, tag: customMentorObj.description || "โค้ชส่วนตัวของคุณ", mood: "เป็นมิตร ตั้งใจช่วยเหลือ",
    letter: (customMentorObj.name || "?")[0]?.toUpperCase() || "A", accent: "#8A93A8", accent2: "#A7ADB8", onAccent: "#ffffff",
    scale: [261.6, 293.7, 329.6, 392.0, 440.0], root: 130.8, avatarUrl: customMentorObj.avatarUrl || null,
    quotes: ["พร้อมช่วยเหลือคุณเสมอ", "ถามอะไรมาได้เลย", "มาลองคิดไปด้วยกัน", "ทุกก้าวเล็กๆ มีความหมาย"],
    replies: ["ลองเล่าเพิ่มเติมได้ไหมครับ จะได้ช่วยได้ตรงจุดขึ้น", "เข้าใจแล้ว ลองมาดูกันทีละขั้นตอนนะครับ", "นี่เป็นมุมมองที่น่าสนใจ ลองคิดต่อดูอีกหน่อยไหมครับ"],
  } : { ...MENTORS.none, avatarUrl: authProfile?.assistant_avatar_url || null });

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
          if (uSettings.custom_accent) setCustomAccent(uSettings.custom_accent);
          if (uSettings.card_shape) setCardShape(uSettings.card_shape);
          if (uSettings.home_layout) setHomeLayout(uSettings.home_layout);
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
        else if (dbGoals) setGoals(dbGoals.map((g) => ({ ...g, doneDate: g.done_date || null, timerMode: g.timer_mode || null, timerUnit: g.timer_unit || null, timerSeconds: g.timer_seconds || null, timerRepeatCount: g.timer_repeat_count || null })));

        // 3b. ดึงแม่แบบเป้าหมายประจำสัปดาห์ + สร้างรายการของ "วันนี้" อัตโนมัติถ้ายังไม่มี (ไม่แตะรายการเก่า ไม่สร้างซ้ำ)
        const { data: dbTemplates, error: tplErr } = await supabase
          .from("goal_templates")
          .select("*")
          .eq("user_id", userId)
          .eq("active", true);
        if (tplErr) console.error("โหลดแม่แบบเป้าหมายไม่สำเร็จ (ไม่แตะข้อมูลเดิม):", tplErr.message);
        else if (dbTemplates) {
          const templates = dbTemplates.map((tp) => ({ id: tp.id, text: tp.text, daysOfWeek: tp.days_of_week || [], points: tp.points ?? null, active: tp.active, timerMode: tp.timer_mode || null, timerUnit: tp.timer_unit || null, timerSeconds: tp.timer_seconds || null, timerRepeatCount: tp.timer_repeat_count || null }));
          setGoalTemplates(templates);
          const todayDow = (new Date().getDay() + 6) % 7; // จันทร์=0 ... อาทิตย์=6
          const today = todayStr();
          const existingByTemplate = new Set((dbGoals || []).filter((g) => g.template_id && g.date === today).map((g) => g.template_id));
          const toCreate = templates.filter((tp) => tp.daysOfWeek.includes(todayDow) && !existingByTemplate.has(tp.id));
          if (toCreate.length > 0) {
            const newRows = toCreate.map((tp) => ({
              id: uid(),
              user_id: userId,
              text: tp.text,
              comment: tp.comment || tp.note || "",
              date: today,
              done: false,
              template_id: tp.id,
              points: tp.points ?? 5,
              timerMode: tp.timerMode || null,
              timerUnit: tp.timerUnit || null,
              timerSeconds: tp.timerSeconds || null,
              timerRepeatCount: tp.timerRepeatCount || null,
            }));

            const { error: genErr } = await supabase.from("goals").insert(
              newRows.map(({ id, user_id, text, comment, date, done, template_id, points, timerMode, timerUnit, timerSeconds, timerRepeatCount }) => ({
                id,
                user_id,
                text,
                comment,
                date,
                done,
                template_id,
                points,
                timer_mode: timerMode,
                timer_unit: timerUnit,
                timer_seconds: timerSeconds,
                timer_repeat_count: timerRepeatCount,
              }))
            );
            if (genErr) console.error("สร้างเป้าหมายประจำวันจากแม่แบบไม่สำเร็จ:", genErr.message);
            else setGoals((gs) => [...gs, ...newRows.map((r) => ({ ...r, doneDate: null }))]);
          }
        }

        // 3c. ดึงหมวดหมู่การเงิน — เดิมไม่เคยบันทึกลงฐานข้อมูลเลย (แก้/เพิ่ม/ลบ อยู่แค่ในเครื่อง หายเมื่อเปิดแอปใหม่) ตอนนี้โหลด/บันทึกจริงแล้ว
        const { data: dbCats, error: catsErr } = await supabase
          .from("categories")
          .select("*")
          .eq("user_id", userId)
          .order("sort_order", { ascending: true });
        if (catsErr) console.error("โหลดหมวดหมู่ไม่สำเร็จ (ไม่แตะข้อมูลเดิม):", catsErr.message);
        else if (dbCats && dbCats.length > 0) {
          setCategories(dbCats.map((c) => ({ id: c.id, label: c.label, iconKey: c.icon_key, color: c.color, kind: c.kind })));
        } else {
          // ยังไม่เคยมีหมวดหมู่ในฐานข้อมูลเลย (ผู้ใช้ใหม่ หรือของเก่าก่อนแก้บั๊กนี้) — สร้างค่าเริ่มต้นให้ครั้งแรกครั้งเดียว
          const seedRows = DEFAULT_CATEGORIES.map((c, i) => ({ id: c.id, user_id: userId, label: c.label, icon_key: c.iconKey, color: c.color, kind: c.kind, sort_order: i }));
          const { error: seedErr } = await supabase.from("categories").insert(seedRows);
          if (seedErr) console.error("สร้างหมวดหมู่เริ่มต้นไม่สำเร็จ:", seedErr.message);
          setCategories(DEFAULT_CATEGORIES);
        }

        // 3d. ดึงบิลที่ต้องจ่ายประจำ (bill_reminders) + สร้าง "รอบของเดือนนี้" อัตโนมัติถ้ายังไม่มี (pattern เดียวกับแม่แบบเป้าหมายด้านบน — ไม่แตะรอบเก่า ไม่สร้างซ้ำ)
        const { data: dbBills, error: billsErr } = await supabase.from("bill_reminders").select("*").eq("user_id", userId).eq("active", true);
        if (billsErr) console.error("โหลดบิลที่ต้องจ่ายไม่สำเร็จ (ไม่แตะข้อมูลเดิม):", billsErr.message);
        else if (dbBills) {
          const bills = dbBills.map((b) => ({ id: b.id, label: b.label, amount: Number(b.amount) || 0, recurring: b.recurring, dueDay: b.due_day, dueDate: b.due_date, categoryId: b.category_id, active: b.active }));
          setBillReminders(bills);

          const { data: dbPayments, error: payErr } = await supabase.from("bill_payments").select("*").eq("user_id", userId);
          if (payErr) console.error("โหลดรอบจ่ายบิลไม่สำเร็จ (ไม่แตะข้อมูลเดิม):", payErr.message);
          const existingPayments = dbPayments || [];

          // เดือนปัจจุบัน — คำนวณวันครบกำหนดของรอบนี้ (เผื่อ due_day เกินจำนวนวันในเดือน เช่น 31 แต่เดือนนี้มี 30 วัน ให้ใช้วันสุดท้ายของเดือนแทน)
          const now = new Date();
          const y = now.getFullYear(), m = now.getMonth(); // m = 0-based
          const daysInThisMonth = new Date(y, m + 1, 0).getDate();
          const thisPeriodKey = `${y}-${String(m + 1).padStart(2, "0")}`;
          const existingByBillPeriod = new Set(existingPayments.map((p) => `${p.bill_id}:${p.period_key}`));
          const toCreate = bills.filter((b) => b.recurring && !existingByBillPeriod.has(`${b.id}:${thisPeriodKey}`)).map((b) => {
            const dueDay = Math.min(b.dueDay || 1, daysInThisMonth);
            return { id: uid(), bill_id: b.id, user_id: userId, period_key: thisPeriodKey, due_date: `${y}-${String(m + 1).padStart(2, "0")}-${String(dueDay).padStart(2, "0")}`, amount: b.amount, paid: false };
          });
          if (toCreate.length > 0) {
            const { error: genBillErr } = await supabase.from("bill_payments").insert(toCreate);
            if (genBillErr) console.error("สร้างรอบจ่ายบิลเดือนนี้ไม่สำเร็จ:", genBillErr.message);
            else existingPayments.push(...toCreate);
          }
          setBillPayments(existingPayments.map((p) => ({ id: p.id, billId: p.bill_id, periodKey: p.period_key, dueDate: p.due_date, amount: Number(p.amount) || 0, paid: p.paid, paidAt: p.paid_at, lastNotifiedDate: p.last_notified_date })));
        }

        // 3e. ดึงระบบเตือนกลาง (reminders) — ใช้ร่วมกันได้ทั้งเป้าหมายและโน้ต รองรับครั้งเดียว/รายวัน/รายสัปดาห์/รายเดือน
        const { data: dbReminders, error: remErr } = await supabase.from("reminders").select("*").eq("user_id", userId).eq("active", true);
        if (remErr) console.error("โหลดรายการเตือนไม่สำเร็จ (ไม่แตะข้อมูลเดิม):", remErr.message);
        else if (dbReminders) {
          setReminders(dbReminders.map((r) => ({ id: r.id, targetType: r.target_type, targetId: r.target_id, label: r.label, recurrence: r.recurrence, time: r.time, specificDate: r.specific_date, dayOfWeek: r.day_of_week, dayOfMonth: r.day_of_month, active: r.active, lastFiredKey: r.last_fired_key })));
        }

        // 3f. ดึงคำแนะนำการใช้งาน (hint_definitions) ที่แอดมินตั้งค่าไว้ + เช็คว่าผู้ใช้คนนี้เคยดูอันไหนไปแล้วบ้าง
        const { data: dbHintDefs, error: hintDefErr } = await supabase.from("hint_definitions").select("*");
        if (hintDefErr) console.error("โหลดคำแนะนำการใช้งานไม่สำเร็จ (ไม่แตะข้อมูลเดิม):", hintDefErr.message);
        else setHintDefs((dbHintDefs || []).map((h) => ({ key: h.key, locationLabel: h.location_label, body: h.body, active: h.active })));
        const { data: dbHintSeen, error: hintSeenErr } = await supabase.from("hint_seen").select("hint_key").eq("user_id", userId);
        if (hintSeenErr) console.error("โหลดสถานะคำแนะนำที่เคยดูไม่สำเร็จ:", hintSeenErr.message);
        else setSeenHintKeys(new Set((dbHintSeen || []).map((h) => h.hint_key)));

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
          // 🔀 เรียงตาม sort_order ถ้ามีคอลัมน์นี้แล้ว (ต้องรัน SQL เพิ่มคอลัมน์ก่อน) — ใช้ ?? กันพัง เผื่อคอลัมน์ยังไม่มี/ยังไม่เคยตั้งค่า จะ fallback เรียงแบบเดิม ไม่มีผลกระทบถ้ายังไม่ได้รัน SQL
          const mappedPlaylist = dbPlaylist.map(p => ({
            id: p.id, kind: p.kind, name: p.name, url: p.url, ytId: p.yt_id, persist: p.persist,
            platform: p.platform || "youtube", pinnedHome: !!p.pinned_home, sortOrder: p.sort_order,
            folderId: p.folder_id || null, // ⚠️ บั๊กเดิม: select("*") ดึง folder_id มาจาก DB แล้ว แต่ตรงนี้ไม่ได้ map เข้า state เลย ทำให้รีเฟรชแล้วหมวดหมู่หายทุกครั้ง (โดยที่ folder_id ใน DB จริงๆ ยังอยู่ครบ)
          })).sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));
          setPlaylist(mappedPlaylist);
        }

        // 5b. ดึงหมวดหมู่สื่อ/เพลง (media_folders) — เดิมเก็บแค่ localStorage เท่านั้น (หายได้ถ้า browser ล้าง storage เช่น Safari บน iPhone ที่ล้าง PWA storage อัตโนมัติถ้าไม่ได้เปิดแอปเกิน 7 วัน) ย้ายมาเก็บถาวรบน Supabase แทน
        const { data: dbFolders, error: folderErr } = await supabase
          .from("media_folders")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: true });
        if (folderErr) console.error("โหลดหมวดหมู่สื่อไม่สำเร็จ (ไม่แตะข้อมูลเดิม):", folderErr.message);
        else if (dbFolders && dbFolders.length > 0) {
          const sorted = [...dbFolders].sort((a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999));
          setFolders(sorted.map((f) => ({ id: f.id, name: f.name })));
        } else {
          // ยังไม่เคยมีในฐานข้อมูลเลย เผื่อมีของเก่าจาก localStorage (ก่อนแก้บั๊กนี้) ย้ายเข้าฐานข้อมูลให้ครั้งเดียว กันข้อมูลหาย
          try {
            const old = JSON.parse(localStorage.getItem("refhub:folders") || "[]");
            if (Array.isArray(old) && old.length > 0) {
              setFolders(old);
              await supabase.from("media_folders").insert(old.map((f) => ({ id: f.id, user_id: userId, name: f.name })));
            }
          } catch (e) {}
        }

      } catch (e) {
        console.error("โหลดข้อมูลจาก Cloud ผิดพลาด: ", e);
      }
      // หมวดหมู่เพลง (folders) ย้ายไปเก็บบน Supabase แล้ว (โหลดในบล็อกด้านบน) — fontScale อ่านจาก localStorage ตอน mount ไปแล้วผ่าน lazy init ด้านบน ไม่ต้องอ่านซ้ำตรงนี้
      setLoaded(true);
    })(); 
  }, [userId]);

  useEffect(() => { if (!loaded) return; try { localStorage.setItem("refhub:fontScale", JSON.stringify(fontScale)); } catch (e) {} }, [fontScale, loaded]);
  // 📏 ซิงค์ขนาดตัวอักษรกับฐานข้อมูลด้วย (จำได้ข้ามอุปกรณ์ ไม่ใช่แค่เครื่องเดียวที่เคยตั้งไว้)
  // 🐛 เดิมบั๊ก: effect นี้ setFontScale ทับด้วยค่าจาก DB ทุกครั้งที่ authProfile.font_scale เปลี่ยน/โหลดใหม่
  //    ถ้า DB มีค่าเก่าค้างอยู่ (เช่น รอบก่อนเขียนขึ้น DB ไม่ทันเพราะปิดแอปไปก่อน/เน็ตหลุด) พอเปิดแอปรอบถัดไป
  //    ค่าที่เพิ่งเลือกไว้ในเครื่องนี้ (ถูกต้องแล้ว) จะโดนค่าเก่าจาก DB ทับกลับไปแบบเงียบๆ — นี่คืออาการ "เลือกฟอนต์ไว้แล้วหลุด"
  //    ✅ แก้โดยดึงจาก DB มา "ทับ" ได้แค่ครั้งแรกที่ hydrate เท่านั้น (กันด้วย ref) และเฉพาะตอนที่เครื่องนี้ไม่มีค่าอยู่ในเครื่องอยู่แล้วเท่านั้น (เครื่องใหม่/ล้าง storage) — ถ้ามีค่าในเครื่องอยู่แล้ว ค่าในเครื่องชนะเสมอ แล้วค่อยเขียนทับขึ้น DB แทน (source of truth คือเครื่องปัจจุบันที่ผู้ใช้เพิ่งเลือก)
  useEffect(() => {
    if (dbFontScaleHydratedRef.current) return; // hydrate ได้แค่ครั้งเดียวต่อการเปิดแอป กันไม่ให้ทับซ้ำทุกครั้งที่ authProfile โหลดใหม่
    if (!authProfile?.font_scale) return; // ยังไม่มีค่าใน DB เลย (user ใหม่/ยังไม่เคยตั้ง) ไม่ต้องทำอะไร ปล่อยให้ค่าในเครื่อง/ค่า default ใช้ไปก่อน
    dbFontScaleHydratedRef.current = true;
    let localValue = null;
    try { localValue = JSON.parse(localStorage.getItem("refhub:fontScale") || "null"); } catch (e) {}
    if (!localValue) setFontScale(authProfile.font_scale); // ไม่มีค่าอยู่ในเครื่องนี้เลย (เครื่องใหม่/ล้าง storage) → ใช้ค่าจาก DB แทน
    // ถ้ามี localValue อยู่แล้ว ปล่อยผ่าน ไม่ทับ — ค่าที่เครื่องนี้เพิ่งตั้งไว้สำคัญกว่า จะถูกเขียนทับขึ้น DB เองผ่าน effect ถัดไปด้านล่าง
  }, [authProfile?.font_scale]);
  useEffect(() => {
    if (!loaded || !userId) return;
    if (authProfile?.font_scale === fontScale) return; // ไม่ต้องเขียนซ้ำถ้าค่าตรงกับที่อยู่ในฐานข้อมูลอยู่แล้ว
    supabase.from("profiles").update({ font_scale: fontScale }).eq("id", userId).then(
      () => {},
      (e) => console.error("บันทึกขนาดตัวอักษรขึ้น DB ไม่สำเร็จ (จะลองใหม่ตอนค่าเปลี่ยนครั้งถัดไป):", e?.message)
    );
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
            custom_accent: customAccent, // ต้องมีคอลัมน์ "custom_accent" (text) เช่นกัน
            card_shape: cardShape, // เช่นกัน ต้องมีคอลัมน์ "card_shape" (text) ถึงจะ sync ข้ามอุปกรณ์ได้ ไม่งั้น error เงียบๆ เหมือนกัน
            home_layout: homeLayout, // ต้องมีคอลัมน์ "home_layout" (text) เช่นกัน
            volume: volume
          }).eq("user_id", userId);
          // ซิงค์ชื่อ+รูปไปที่ตาราง profiles ด้วย (ตารางนี้แชท/หน้า Admin ใช้แสดงข้อมูลของแต่ละคน ต้องให้ตรงกันเสมอ)
          await supabase.from("profiles").update({ name: profile.name, avatar_url: profile.avatar || null }).eq("id", userId);
        }
      } catch (e) {
        console.error("เซฟค่า Settings ลง Cloud ผิดพลาด: ", e);
      }
    })(); 
  }, [notes, goals, tx, profile, mentor, theme, themeMode, customAccent, cardShape, homeLayout, volume, playlist, loaded]);

  // music reactions
  const cur = playlist.find((p) => p.id === curId) || null;
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
    if (ytPlayerRef.current && ytPlayerRef.current.setVolume) ytPlayerRef.current.setVolume(volume);
  }, [volume, curId]);

  // 🔐 เช็ค session ตอนเปิดแอปครั้งแรก + คอยฟังการเปลี่ยนแปลง (ล็อกอิน/ล็อกเอาต์) ตลอดเวลา
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthChecked(true); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s); setAuthChecked(true);
      if (_event === "SIGNED_IN" && s?.user?.id) logAudit(s.user.id, "auth", "login", "เข้าสู่ระบบ");
    });
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
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_log" }, async (payload) => {
        if (payload.new.user_id === userId) return; // ไม่ต้องแจ้งเตือนการกระทำของตัวเอง
        const { data: prof } = await supabase.from("profiles").select("name, email").eq("id", payload.new.user_id).maybeSingle();
        const who = prof?.name || prof?.email || "สมาชิก";
        const label = payload.new.module === "auth" ? "เข้าสู่ระบบ" : payload.new.summary;
        setAdminAlerts((a) => [{ id: uid(), text: `${who} — ${label}`, time: Date.now() }, ...a].slice(0, 20));
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
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, async (payload) => {
        computeUnread();
        // 🔔 ข้อความจากคนอื่น (ไม่ใช่ของเราเอง) + ไม่ได้เปิดอ่านห้องนั้นอยู่ -> เด้ง toast + เสียงตุ๊บ
        const msg = payload.new;
        if (msg && msg.sender_id && msg.sender_id !== userId) {
          const { data: mem } = await supabase.from("chat_thread_members").select("thread_id").eq("user_id", userId).eq("thread_id", msg.thread_id).maybeSingle();
          if (mem) { // เป็นห้องที่เราอยู่จริง
            playMessagePop();
            const { data: sender } = await supabase.from("profiles").select("name").eq("id", msg.sender_id).maybeSingle();
            setMsgToast({ name: sender?.name || "ข้อความใหม่", text: msg.text || (msg.attachment_url ? "ส่งไฟล์มา" : ""), threadId: msg.thread_id, at: Date.now() });
          }
        }
      })
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
      if (!document.getElementById("yt-mini-player")) { setTimeout(startYt, 300); return; } // 🐛 กันกรณี DOM ยังไม่ทันสร้าง (portal ยังไม่ attach ตอนนี้) ลองใหม่จนกว่าจะเจอ แทนที่จะพังเงียบๆ แล้วไม่มีทางฟื้นเอง
      try {
        if (ytPlayerRef.current && ytPlayerRef.current.loadVideoById) {
          ytPlayerRef.current.loadVideoById(cur.ytId);
          ytPlayerRef.current.setVolume(volume);
        } else {
          ytPlayerRef.current = new window.YT.Player("yt-mini-player", {
            height: "100%", width: "100%", videoId: cur.ytId,
            // 🐛 ลองใช้ host: youtube-nocookie.com ไปรอบก่อน แต่ทำให้เกิด postMessage origin mismatch error จริง (เห็นชัดใน console ที่พี่ส่งมา) — ถอยกลับมาใช้ youtube.com ปกติ เก็บแค่ origin ไว้ ซึ่งเป็น best practice ที่ไม่มีผลข้างเคียง
            playerVars: { autoplay: 1, rel: 0, playsinline: 1, origin: window.location.origin },
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
  // ⚠️ บั๊กเดิม: nextTrack/prevTrack เดินตาม index ของ playlist ทั้งชุด (รวมแทร็กชนิด "link" อย่าง TikTok/X/IG ที่เล่นในคิวนี้ไม่ได้ ต้องเปิดดูในหน้าสื่อเท่านั้น)
  // พอกด "ถัดไป" แล้วดันไปตกที่แทร็ก link การ์ด "กำลังเล่น" เลยหายวับไปทันทีโดยไม่มีคำอธิบาย งงว่ามันหายไปไหน
  // แก้ด้วยการกรองเฉพาะแทร็กที่ "เล่นในคิวได้จริง" (yt/file) มาเรียงคิวแทน ข้ามแทร็ก link ไปเลย
  const playableQueue = () => playlist.filter((x) => x.kind === "yt" || x.kind === "file");
  const nextTrack = () => {
    const q = playableQueue();
    if (q.length === 0) return;
    if (repeatMode === "one") { const c = q.find((x) => x.id === curId) || q[0]; playTrack(c); return; } // 🔁 วนซ้ำเพลงเดียว
    if (shuffleOn && q.length > 1) { const candidates = q.filter((x) => x.id !== curId); playTrack(candidates[Math.floor(Math.random() * candidates.length)]); return; } // 🔀 สุ่มเพลงถัดไป ไม่ซ้ำเพลงปัจจุบัน
    const i = q.findIndex((x) => x.id === curId);
    const nextIdx = i + 1;
    if (nextIdx >= q.length) { if (repeatMode === "all") playTrack(q[0]); else stopAll(); return; } // จบคิว: 'all' วนกลับต้นคิว, 'off' หยุดเล่น
    playTrack(q[nextIdx]);
  };
  const prevTrack = () => {
    const q = playableQueue();
    if (q.length === 0) return;
    const i = q.findIndex((x) => x.id === curId);
    const pv = q[(i - 1 + q.length) % q.length];
    if (pv) playTrack(pv);
  };
  const toggleFavorite = (id) => setPlaylist((p) => p.map((x) => (x.id === id ? { ...x, favorite: !x.favorite } : x)));
  const renameTrack = (id, name) => {
    setPlaylist((p) => p.map((x) => (x.id === id ? { ...x, name } : x)));
    if (userId) supabase.from("playlists").update({ name }).eq("id", id).then(() => {}, () => {});
  };

  // 💰 จัดการหมวดหมู่การเงิน (เพิ่ม/ลบ/จัดเรียง) — ใช้ได้ทั้งฝั่งรับเข้าและจ่ายออก
  // เดิมแก้แค่ state ในเครื่อง ไม่เคยบันทึกลงฐานข้อมูลเลย ทำให้หมวดหมู่ที่สร้าง/สลับ/ลบ หายไปทุกครั้งที่เปิดแอปใหม่ — แก้ให้ sync กับ Supabase จริงทุกจุด
  // 🔀 รับลิสต์ใหม่ทั้งชุดของ "หมวดเดียว" (kindVal) หลังลากวางจัดเรียงเสร็จ — เอาไปแทนที่ตำแหน่งเดิมของหมวดนั้นๆ ใน categories รวม (ไม่แตะหมวดอีกฝั่ง) แล้ว sync sort_order ใหม่ทั้งชุดขึ้น DB
  const reorderCategoriesForKind = (kindVal, newOrderForKind) => {
    setCategories((cats) => {
      const sameKindIdx = cats.map((c, i) => (c.kind === kindVal ? i : -1)).filter((i) => i !== -1);
      if (sameKindIdx.length !== newOrderForKind.length) return cats; // กันเผื่อข้อมูลไม่ตรงกัน ไม่เสี่ยงทำพัง
      const arr = [...cats];
      sameKindIdx.forEach((posInArr, j) => { arr[posInArr] = newOrderForKind[j]; });
      if (userId) {
        arr.forEach((c, i) => { supabase.from("categories").update({ sort_order: i }).eq("user_id", userId).eq("id", c.id).then(() => {}, () => {}); });
      }
      return arr;
    });
  };
  const deleteCategory = (id) => {
    setCategories((cats) => cats.filter((c) => c.id !== id));
    if (userId) supabase.from("categories").delete().eq("user_id", userId).eq("id", id).then(() => {}, () => {});
  };
  const addCategory = ({ label, iconKey, color, kind }) => {
    if (!label.trim()) return;
    const id = uid();
    setCategories((cats) => {
      const sortOrder = cats.length;
      if (userId) supabase.from("categories").insert({ id, user_id: userId, label: label.trim(), icon_key: iconKey, color, kind, sort_order: sortOrder }).then(() => {}, () => {});
      return [...cats, { id, label: label.trim(), iconKey, color, kind }];
    });
  };

  // 💳 ===== ระบบเตือนจ่ายบิล =====
  // เพิ่มบิลใหม่ — recurring: true = ซ้ำทุกเดือน (ใช้ dueDay), false = ครั้งเดียว (ใช้ dueDate ตรงๆ และสร้างรอบจ่ายทันทีเลย ไม่ต้องรอ auto-generate ตอนเปิดแอปรอบหน้า)
  const addBillReminder = async ({ label, amount, recurring, dueDay, dueDate, categoryId }) => {
    if (!label.trim() || !userId) return;
    const id = uid();
    const row = { id, user_id: userId, label: label.trim(), amount: Number(amount) || 0, recurring, due_day: recurring ? dueDay : null, due_date: recurring ? null : dueDate, category_id: categoryId || null, active: true };
    const { error } = await supabase.from("bill_reminders").insert(row);
    if (error) { alert("เพิ่มบิลไม่สำเร็จ: " + error.message + " (เช็คว่ารัน SQL สร้างตาราง bill_reminders/bill_payments แล้วหรือยัง)"); return; }
    setBillReminders((list) => [...list, { id, label: label.trim(), amount: Number(amount) || 0, recurring, dueDay: recurring ? dueDay : null, dueDate: recurring ? null : dueDate, categoryId: categoryId || null, active: true }]);
    if (!recurring) {
      // ครั้งเดียว — สร้างรอบจ่ายทันทีเลย ไม่ต้องรอรอบ auto-generate
      const payId = uid();
      const payRow = { id: payId, bill_id: id, user_id: userId, period_key: dueDate, due_date: dueDate, amount: Number(amount) || 0, paid: false };
      const { error: payErr } = await supabase.from("bill_payments").insert(payRow);
      if (!payErr) setBillPayments((list) => [...list, { id: payId, billId: id, periodKey: dueDate, dueDate, amount: Number(amount) || 0, paid: false, paidAt: null, lastNotifiedDate: null }]);
    }
  };
  const deleteBillReminder = (id) => {
    setBillReminders((list) => list.filter((b) => b.id !== id));
    setBillPayments((list) => list.filter((p) => p.billId !== id)); // ลบรอบจ่ายที่ผูกกับบิลนี้ออกจากเครื่องด้วย (DB ลบให้อัตโนมัติผ่าน ON DELETE CASCADE)
    if (userId) supabase.from("bill_reminders").delete().eq("user_id", userId).eq("id", id).then(() => {}, () => {});
  };
  // กดยืนยันว่าจ่ายแล้ว — actualAmount ใส่ยอดจริงที่จ่ายได้ ถ้าไม่ใส่ใช้ยอดประมาณการเดิม
  const markBillPaid = (paymentId, actualAmount) => {
    const paidAt = new Date().toISOString();
    setBillPayments((list) => list.map((p) => (p.id === paymentId ? { ...p, paid: true, paidAt, amount: actualAmount != null ? Number(actualAmount) : p.amount } : p)));
    const patch = { paid: true, paid_at: paidAt };
    if (actualAmount != null) patch.amount = Number(actualAmount);
    if (userId) supabase.from("bill_payments").update(patch).eq("user_id", userId).eq("id", paymentId).then(() => {}, () => {});
  };
  const unmarkBillPaid = (paymentId) => { // เผื่อกดพลาด ย้อนกลับได้
    setBillPayments((list) => list.map((p) => (p.id === paymentId ? { ...p, paid: false, paidAt: null } : p)));
    if (userId) supabase.from("bill_payments").update({ paid: false, paid_at: null }).eq("user_id", userId).eq("id", paymentId).then(() => {}, () => {});
  };
  // 🔔 เตือนบิลที่ถึงกำหนด/เลยกำหนดแล้วยังไม่จ่าย — ส่ง push จริงวันละครั้งต่อบิล (เตือนต่อเนื่องทุกวันจนกว่าจะกดจ่ายแล้ว) ทุกครั้งที่เปิดแอปในวันใหม่
  useEffect(() => {
    if (!userId || !session?.access_token || billPayments.length === 0) return;
    const today = todayStr();
    const due = billPayments.filter((p) => !p.paid && p.dueDate <= today && p.lastNotifiedDate !== today);
    if (due.length === 0) return;
    due.forEach((p) => {
      const bill = billReminders.find((b) => b.id === p.billId);
      notifyPush([userId], "💳 ถึงกำหนดจ่ายบิลแล้ว", `${bill?.label || "บิล"} • ฿${p.amount.toLocaleString()}${p.dueDate < today ? " (เลยกำหนดแล้ว)" : ""}`, session.access_token);
      supabase.from("bill_payments").update({ last_notified_date: today }).eq("id", p.id).then(() => {}, () => {});
    });
    setBillPayments((list) => list.map((p) => (due.some((d) => d.id === p.id) ? { ...p, lastNotifiedDate: today } : p)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billPayments.length, userId]);

  // 🔔 ===== ระบบเตือนกลาง (ใช้ร่วมกันได้ทั้งเป้าหมายและโน้ต) =====
  // targetType: 'note' | 'goal' | 'goal_summary' (goal_summary = เตือนภาพรวม "มีเป้าหมายที่ยังไม่ทำวันนี้" ไม่ผูกกับเป้าหมายไหนเป็นพิเศษ)
  const upsertReminder = async ({ id, targetType, targetId, label, recurrence, time, specificDate, dayOfWeek, dayOfMonth }) => {
    if (!userId) return;
    const row = {
      user_id: userId, target_type: targetType, target_id: targetId != null ? String(targetId) : null, label, recurrence, time,
      specific_date: recurrence === "once" ? specificDate : null,
      day_of_week: recurrence === "weekly" ? dayOfWeek : null,
      day_of_month: recurrence === "monthly" ? dayOfMonth : null,
      active: true,
    };
    if (id) {
      const { error } = await supabase.from("reminders").update(row).eq("id", id).eq("user_id", userId);
      if (error) { alert("บันทึกการเตือนไม่สำเร็จ: " + error.message); return; }
      setReminders((list) => list.map((r) => (r.id === id ? { ...r, targetType, targetId: row.target_id, label, recurrence, time, specificDate: row.specific_date, dayOfWeek: row.day_of_week, dayOfMonth: row.day_of_month, active: true, lastFiredKey: null } : r)));
    } else {
      const newId = crypto.randomUUID(); // ⚠️ ตาราง reminders ใช้คอลัมน์ id เป็น uuid จริง — ห้ามใช้ uid() (สร้าง string base36 ไม่ใช่ uuid) ต้องใช้ crypto.randomUUID()
      const { error } = await supabase.from("reminders").insert({ id: newId, ...row });
      if (error) { alert("ตั้งเตือนไม่สำเร็จ: " + error.message + " (เช็คว่ารัน SQL สร้างตาราง reminders แล้วหรือยัง)"); return; }
      setReminders((list) => [...list, { id: newId, targetType, targetId: row.target_id, label, recurrence, time, specificDate: row.specific_date, dayOfWeek: row.day_of_week, dayOfMonth: row.day_of_month, active: true, lastFiredKey: null }]);
    }
  };
  const deleteReminder = (id) => {
    setReminders((list) => list.filter((r) => r.id !== id));
    if (userId) supabase.from("reminders").delete().eq("user_id", userId).eq("id", id).then(() => {}, () => {});
  };
  // เปิด ReminderModal สำหรับ target หนึ่งๆ — หาการเตือนเดิมที่เคยตั้งไว้ให้ target นี้มาแสดง (แก้ไข/ลบได้) ถ้ายังไม่มีจะเป็นตั้งใหม่
  const openReminder = (targetType, targetId, label) => {
    const existing = reminders.find((r) => r.targetType === targetType && r.targetId === (targetId != null ? String(targetId) : null));
    setReminderTarget({ targetType, targetId, label, existing: existing || null });
  };
  // 💡 บันทึกว่า "ดูคำแนะนำนี้แล้ว" ลง DB จริง (ไม่ใช่ localStorage) เพื่อให้แอดมินเช็คได้จากหน้าแอดมินว่าใครดูไปแล้วบ้าง
  const dismissHint = (key) => {
    setSeenHintKeys((s) => new Set(s).add(key));
    if (userId) supabase.from("hint_seen").upsert({ user_id: userId, hint_key: key, seen_at: new Date().toISOString() }, { onConflict: "user_id,hint_key" }).then(() => {}, () => {});
  };
  // เช็คทุกครั้งที่เปิดแอป/ข้อมูลเปลี่ยน ว่ามีการเตือนไหนถึงเวลาแล้วบ้าง (เช็คแค่ตอนเปิดแอป ไม่มี cron พื้นหลังจริง เหมือนระบบเตือนบิล)
  useEffect(() => {
    if (!userId || !session?.access_token || reminders.length === 0) return;
    const now = new Date();
    const todayKey = todayStr();
    const nowHM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const curDow = (now.getDay() + 6) % 7; // จันทร์=0 ... อาทิตย์=6
    const curDom = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const periodKeyFor = (r) => (r.recurrence === "once" ? r.specificDate : r.recurrence === "monthly" ? monthKey : todayKey);
    const isDueNow = (r) => {
      if (!r.time || r.time > nowHM) return false; // ยังไม่ถึงเวลาที่ตั้งไว้วันนี้
      if (r.recurrence === "once") return r.specificDate === todayKey;
      if (r.recurrence === "daily") return true;
      if (r.recurrence === "weekly") return r.dayOfWeek === curDow;
      if (r.recurrence === "monthly") return Math.min(r.dayOfMonth || 1, daysInMonth) === curDom;
      return false;
    };

    const due = reminders.filter((r) => r.active && isDueNow(r) && r.lastFiredKey !== periodKeyFor(r));
    if (due.length === 0) return;

    due.forEach((r) => {
      let shouldNotify = true;
      if (r.targetType === "goal_summary") shouldNotify = goals.some((g) => (g.date || todayKey) === todayKey && !g.done); // ไม่ต้องเตือนถ้าทำครบหมดแล้ว
      else if (r.targetType === "goal") { const g = goals.find((x) => x.id === r.targetId); shouldNotify = !!g && !g.done; } // เป้าหมายทำเสร็จแล้วไม่ต้องเตือนซ้ำ
      if (shouldNotify) {
        const icon = r.targetType === "note" ? "📝" : "🎯";
        notifyPush([userId], `${icon} ${r.label}`, "ถึงเวลาที่ตั้งเตือนไว้แล้ว", session.access_token);
      }
      const patch = { last_fired_key: periodKeyFor(r) };
      if (r.recurrence === "once") patch.active = false; // เตือนครั้งเดียวจบแล้วปิดอัตโนมัติ ไม่ต้องเช็คซ้ำอีก
      supabase.from("reminders").update(patch).eq("id", r.id).then(() => {}, () => {});
    });
    setReminders((list) => list.map((r) => (due.some((d) => d.id === r.id) ? { ...r, lastFiredKey: periodKeyFor(r), active: r.recurrence === "once" ? false : r.active } : r)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reminders.length, userId, goals.length]);


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
        <div style={{ position: "relative", zIndex: 3, padding: "18px 10px 0" }}>
          {page === "home" ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                {/* ☰ ตั้งใจไม่ใส่พื้นหลังวงกลม — เลือกแบบ B (ไอคอนโล่งๆ) ตามที่ Maxnuss ยืนยัน */}
                <button onClick={() => setHamburgerOpen(true)} style={{ position: "relative", width: 38, height: 38, background: "none", border: "none", cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <Menu size={20} color={t.text} />
                  {adminAlerts.length > 0 && <span style={{ position: "absolute", top: 3, right: 3, width: 8, height: 8, borderRadius: 4, background: "#D9534F" }} />}
                </button>
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
                <div style={{ position: "relative" }}>
                  {/* ✨ แสงวูบวาบรอบวงกลมไอคอน — อยู่ชั้นล่างสุด (behind ปุ่ม) โชว์เฉพาะตอนกำลังเล่นอยู่จริงเท่านั้น หยุด/จบเพลงแล้วหายไปพร้อมกับสีไอคอนกลับเป็นปกติ */}
                  {playing && <div style={{ position: "absolute", inset: 0, borderRadius: 19, animation: "rh-note-glow 1.6s ease-in-out infinite", pointerEvents: "none" }} />}
                  <IconBtn t={t} onClick={() => setMusicOpen(true)} active={playing} accent={t.accent}>
                    <Music size={17} color={playing ? t.accent : t.text} />
                  </IconBtn>
                  {/* 🎵 เอฟเฟคโน้ตดนตรีลอยออกจากไอคอน — โชว์เฉพาะตอนกำลังเล่นเพลง/คลิปอยู่จริง ให้รู้ว่ามีอะไรเล่นอยู่โดยไม่ต้องกดเข้าไปดู */}
                  {playing && (
                    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                      <Music size={9} color={t.accent} style={{ position: "absolute", left: 8, top: 10, opacity: 0, animation: "rh-note-float 2.2s ease-in infinite" }} />
                      <Music size={7} color={t.accent} style={{ position: "absolute", right: 6, top: 12, opacity: 0, animation: "rh-note-float 2.2s ease-in infinite .75s" }} />
                      <Music size={8} color={t.accent} style={{ position: "absolute", left: 16, top: 8, opacity: 0, animation: "rh-note-float 2.2s ease-in infinite 1.5s" }} />
                      <style>{`@keyframes rh-note-float { 0% { transform: translateY(0) translateX(0) scale(.6) rotate(0deg); opacity: 0; } 18% { opacity: 1; } 100% { transform: translateY(-30px) translateX(7px) scale(1.1) rotate(12deg); opacity: 0; } } @keyframes rh-note-glow { 0%,100% { box-shadow: 0 0 3px ${t.accent}40, 0 0 0px ${t.accent}00; } 50% { box-shadow: 0 0 12px ${t.accent}, 0 0 22px ${t.accent}88; } }`}</style>
                    </div>
                  )}
                </div>
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
        <div ref={contentScrollRef} onScroll={(e) => setAtTop(e.currentTarget.scrollTop < 80)} style={{ position: "relative", zIndex: 2, padding: `16px 10px ${page === "chat" || page === "chatRoom" ? 16 : 120}px`, height: `calc(${(10000 / fontScale).toFixed(2)}vh - 76px)`, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
          {page === "home" && <ErrorCatcher t={t}><HomePage {...{ t, M, quote, isNight, setMentorPick, balance, tx, goals: todayGoals, allGoals: goals, goalDone, goalPct, setGoals, goalTemplates, setGoalTemplates, notes, setPage, setChatOpen, userId, authProfile, playlist, setCommunityOpen, reminders, openReminder, setLeaderboardOpen, setGoalTimerTarget, setAddGoalOpen, setScoreRulesOpen, cardShape, homeLayout }} /></ErrorCatcher>}
          {page === "ledger" && <FinancePage {...{ t, tx, setTx, categories, openAdd: () => setAddOpen(true), openExport: (txt) => setExportText(txt), userId, billReminders, billPayments, markBillPaid, setBillManagerOpen }} />}
          {page === "note" && <NotePage {...{ t, notes, setNotes, isNight, userId, session, authProfile, reminders, openReminder }} />}
          {page === "ideas" && <IdeasPage t={t} M={M} userId={userId} session={session} authProfile={authProfile} setAuthProfile={setAuthProfile} setNotes={setNotes} setChatOpen={setChatOpen} setAskAiTopic={setAskAiTopic} />}
          {page === "trade" && <TradePage t={t} />}
          {page === "news" && <NewsPage t={t} userId={userId} authProfile={authProfile} setAuthProfile={setAuthProfile} setChatOpen={setChatOpen} setAskAiTopic={setAskAiTopic} hintDefs={hintDefs} seenHintKeys={seenHintKeys} dismissHint={dismissHint} setNotes={setNotes} />}
          {page === "lang" && <LangPage t={t} />}
          {page === "goalsReport" && <GoalsReportPage t={t} goals={goals} setGoals={setGoals} userId={userId} />}
          {page === "admin" && <AdminPage t={t} session={session} userId={userId} adminAlerts={adminAlerts} setAdminAlerts={setAdminAlerts} authProfile={authProfile} setAuthProfile={setAuthProfile} />}
          {page === "locations" && <LocationsPage t={t} userId={userId} />}
          {page === "chat" && <ChatEntryPage t={t} M={M} userId={userId} authProfile={authProfile} session={session} openThread={(id, name, isGroup, avatarUrl, createdBy) => { setActiveThread({ id, name, isGroup: !!isGroup, avatarUrl: avatarUrl || null, createdBy: createdBy || null }); setPage("chatRoom"); }} />}
          {page === "chatRoom" && activeThread && <ChatRoomPage t={t} userId={userId} thread={activeThread} profile={profile} session={session} onLeave={() => { setActiveThread(null); setPage("chat"); }} onBack={() => { setActiveThread(null); setPage("chat"); }} activeCall={activeCall} setActiveCall={setActiveCall} setCallMinimized={setCallMinimized} />}

          {/* 🎵 การ์ด "กำลังเล่น" ต่อท้ายเนื้อหาหน้า Home (ใต้เป้าหมาย) — div#yt-mini-player mount ค้างตลอด
              ไม่เคย unmount เลย (ซ่อนด้วย display:none เท่านั้น) กันปัญหา React ชนกับ DOM ที่ YouTube API แก้เอง
              🐛 เคยลองทำ portal ย้ายไปโชว์ในหน้าสื่อด้วย แต่พิสูจน์แล้วว่าไม่เสถียร (ref thrashing/DOM timing หลายรอบ) ถอยกลับมาเล่นได้แค่หน้า Home แบบเดิมที่เชื่อถือได้แน่นอนกว่า */}
          <div id="yt-now-playing-card" style={{ display: page === "home" && cur && cur.kind === "yt" ? "block" : "none", marginTop: 16 }}>
            <div style={{ ...card(t), padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: t.text, display: "flex", alignItems: "center", gap: 6 }}><Music size={15} color={t.accent} /> กำลังเล่น</div>
                <button onClick={() => { stopAll(); setCurId(null); }} style={ghost} title="ปิด"><X size={18} color={t.faint} /></button>
              </div>
              <div style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${t.border}`, background: "#000" }}>
                <div id="yt-mini-player" style={{ width: "100%", height: 180 }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 12 }}>
                <button onClick={() => setShuffleOn((s) => !s)} style={ghost} title={shuffleOn ? "สุ่มเพลง: เปิดอยู่ (แตะเพื่อปิด)" : "สุ่มเพลง: ปิดอยู่ (แตะเพื่อเปิด)"}><Shuffle size={17} color={shuffleOn ? t.accent : t.faint} /></button>
                <button onClick={prevTrack} style={ghost} title="ย้อนกลับ"><SkipBack size={19} color={t.text} fill={t.text} /></button>
                <button onClick={togglePlay} style={{ width: 42, height: 42, borderRadius: 21, border: "none", cursor: "pointer", background: t.accent, color: t.onAccent, display: "grid", placeItems: "center", flexShrink: 0 }}>
                  {playing ? <Pause size={19} /> : <Play size={19} />}
                </button>
                <button onClick={nextTrack} style={ghost} title="เพลงถัดไป"><SkipForward size={19} color={t.text} fill={t.text} /></button>
                {/* 🔁 วนต่อกัน 3 สถานะ: ปิด → วนทั้งคิว → วนเพลงเดียว → ปิด (วนกลับ) */}
                <button onClick={() => setRepeatMode((m) => (m === "off" ? "all" : m === "all" ? "one" : "off"))} style={ghost} title={repeatMode === "off" ? "วนซ้ำ: ปิดอยู่" : repeatMode === "all" ? "วนซ้ำ: ทั้งคิว" : "วนซ้ำ: เพลงเดียว"}>
                  {repeatMode === "one" ? <Repeat1 size={17} color={t.accent} /> : <Repeat size={17} color={repeatMode === "all" ? t.accent : t.faint} />}
                </button>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.text, textAlign: "center", marginTop: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cur ? cur.name : ""}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                <button onClick={() => setVolume((v) => Math.max(0, v - 10))} style={ghost} title="ลดเสียง"><VolumeX size={16} color={t.faint} /></button>
                <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(+e.target.value)} style={{ flex: 1, accentColor: t.accent }} />
                <button onClick={() => setVolume((v) => Math.min(100, v + 10))} style={ghost} title="เพิ่มเสียง"><Volume2 size={16} color={t.faint} /></button>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button onClick={() => setMusicOpen(true)} style={{ ...ghost, flex: 1, textAlign: "center", border: `1px solid ${t.border}`, borderRadius: 10, fontSize: 11.5, color: t.sub, padding: "7px 0" }}>ดูเพลย์ลิสต์ทั้งหมด <ChevronRight size={13} style={{ verticalAlign: "middle" }} /></button>
                {cur?.ytId && <a href={`https://www.youtube.com/watch?v=${cur.ytId}`} target="_blank" rel="noreferrer" style={{ ...ghost, flex: 1, textAlign: "center", border: `1px solid ${t.border}`, borderRadius: 10, fontSize: 11.5, color: t.sub, padding: "7px 0", textDecoration: "none", display: "block" }}>เปิดใน YouTube ↗</a>}
              </div>
            </div>
          </div>
        </div>

        </div>

        {page !== "chat" && page !== "chatRoom" && <Dock t={t} page={page} setPage={setPage} onQuickAdd={() => setAddOpen(true)} />}

        {page !== "chat" && page !== "chatRoom" && (
          <button
            onClick={() => {
              const el = contentScrollRef.current; if (!el) return;
              if (atTop) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
              else el.scrollTo({ top: 0, behavior: "smooth" });
            }}
            style={{ position: "absolute", bottom: 92, right: 16, zIndex: 20, width: 38, height: 38, borderRadius: 19, border: `1px solid ${t.dockBorder}`, background: t.dock, display: "grid", placeItems: "center", cursor: "pointer", boxShadow: "0 6px 16px rgba(20,25,45,.18)" }}
            title={atTop ? "เลื่อนไปล่างสุด" : "เลื่อนขึ้นบนสุด"}
          >
            {atTop ? <ChevronDown size={18} color={t.sub} /> : <ChevronUp size={18} color={t.sub} />}
          </button>
        )}

        {mentorPick && <MentorPicker t={t} mentor={mentor} setMentor={setMentor} authProfile={authProfile} setAuthProfile={setAuthProfile} userId={userId} customMentors={customMentors} setCustomMentors={setCustomMentors} close={() => setMentorPick(false)} />}
        {themePick && <ThemePicker t={t} theme={theme} setTheme={setTheme} mode={mode} customAccent={customAccent} setCustomAccent={setCustomAccent} close={() => setThemePick(false)} />}
        {homeLayoutPick && <HomeLayoutPicker t={t} homeLayout={homeLayout} setHomeLayout={setHomeLayout} close={() => setHomeLayoutPick(false)} />}
        {moreMenuOpen && (
          <div style={overlay} onClick={() => setMoreMenuOpen(false)}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "24px 24px 0 0", padding: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: t.text, marginBottom: 2 }}>การแสดงผล</div>
              <div style={{ fontSize: 11, color: t.sub, marginBottom: 12 }}>ของที่มักปรับบ่อยๆ ระหว่างใช้งาน</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <button onClick={() => { setThemePick(true); setMoreMenuOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 10px", borderRadius: 14, border: "none", background: "none", cursor: "pointer", textAlign: "left" }}><Palette size={18} color={t.sub} /><span style={{ fontSize: 14, color: t.text }}>ธีมสีแอป</span></button>
                <button onClick={() => setFontScale((s) => (s === 100 ? 115 : s === 115 ? 130 : 100))} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 10px", borderRadius: 14, border: "none", background: "none", cursor: "pointer", textAlign: "left" }}><ALargeSmall size={18} color={t.sub} /><span style={{ fontSize: 14, color: t.text }}>ขนาดตัวอักษร ({fontScale}%)</span></button>
                <button onClick={() => setThemeMode(themeMode === "auto" ? "day" : themeMode === "day" ? "night" : "auto")} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 10px", borderRadius: 14, border: "none", background: "none", cursor: "pointer", textAlign: "left" }}>
                  {isNight ? <Moon size={18} color={t.sub} /> : <Sun size={18} color={t.sub} />}
                  <span style={{ fontSize: 14, color: t.text }}>โหมด: {themeMode === "auto" ? "อัตโนมัติ" : themeMode === "day" ? "กลางวัน" : "กลางคืน"}</span>
                </button>
                <button onClick={() => setCardShape(cardShape === "sharp" ? "soft" : "sharp")} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 10px", borderRadius: 14, border: "none", background: "none", cursor: "pointer", textAlign: "left" }}>
                  <LayoutGrid size={18} color={t.sub} />
                  <span style={{ fontSize: 14, color: t.text }}>ทรงกรอบการ์ด: {cardShape === "sharp" ? "เหลี่ยมคม" : "มนเบาๆ"}</span>
                </button>
                <button onClick={() => { setHomeLayoutPick(true); setMoreMenuOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 10px", borderRadius: 14, border: "none", background: "none", cursor: "pointer", textAlign: "left" }}>
                  <Home size={18} color={t.sub} />
                  <span style={{ fontSize: 14, color: t.text }}>โครงหน้า Home: {homeLayout === "wallet" ? "แนววอลเล็ต" : homeLayout === "bento" ? "เบนโต" : "ของเดิม"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
        {/* ☰ เมนูนำทาง — พาไปหน้า/ฟีเจอร์ใหญ่ๆ ที่แยกจากหน้าปัจจุบันจริงจัง จบด้วยออกจากระบบด้านล่างสุด (แยกออกมาจาก ⋮ เดิมตามที่ตกลงกันไว้) */}
        {hamburgerOpen && (
          <div style={overlay} onClick={() => setHamburgerOpen(false)}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "24px 24px 0 0", padding: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: t.text, marginBottom: 2 }}>เมนู</div>
              <div style={{ fontSize: 11, color: t.sub, marginBottom: 12 }}>พาไปหน้า/ฟีเจอร์ใหญ่ๆ ที่แยกจากหน้าปัจจุบัน</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {authProfile?.role === "admin" && (
                  <button onClick={() => { setPage("admin"); setHamburgerOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 10px", borderRadius: 14, border: "none", background: "none", cursor: "pointer", textAlign: "left" }}>
                    <ShieldCheck size={18} color={t.sub} /><span style={{ fontSize: 14, color: t.text }}>หน้า Admin</span>
                    {adminAlerts.length > 0 && <span style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: 4, background: "#D9534F" }} />}
                  </button>
                )}
                <button onClick={() => { setMusicOpen(true); setHamburgerOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 10px", borderRadius: 14, border: "none", background: "none", cursor: "pointer", textAlign: "left" }}><Music size={18} color={t.sub} /><span style={{ fontSize: 14, color: t.text }}>สื่อ</span></button>
                {(authProfile?.can_view_locations || authProfile?.role === "admin") && (
                  <button onClick={() => { setPage("locations"); setHamburgerOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 10px", borderRadius: 14, border: "none", background: "none", cursor: "pointer", textAlign: "left" }}>
                    <MapPin size={18} color={t.sub} /><span style={{ fontSize: 14, color: t.text }}>ตำแหน่งล่าสุด</span>
                  </button>
                )}
                <button onClick={() => { setAccountSettingsOpen(true); setHamburgerOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 10px", borderRadius: 14, border: "none", background: "none", cursor: "pointer", textAlign: "left" }}>
                  <KeyRound size={18} color={t.sub} /><span style={{ fontSize: 14, color: t.text }}>ตั้งค่าบัญชี</span>
                </button>
                <button onClick={() => { setMyActivityOpen(true); setHamburgerOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 10px", borderRadius: 14, border: "none", background: "none", cursor: "pointer", textAlign: "left" }}>
                  <Clock size={18} color={t.sub} /><span style={{ fontSize: 14, color: t.text }}>ประวัติการใช้งานของฉัน</span>
                </button>
                <button onClick={() => supabase.auth.signOut()} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 10px", borderRadius: 14, border: "none", background: "none", cursor: "pointer", textAlign: "left" }}>
                  <X size={18} color="#D9534F" /><span style={{ fontSize: 14, color: "#D9534F" }}>ออกจากระบบ</span>
                </button>
              </div>
            </div>
          </div>
        )}
        {accountSettingsOpen && <AccountSettingsModal t={t} authProfile={authProfile} setAuthProfile={setAuthProfile} userId={userId} session={session} close={() => setAccountSettingsOpen(false)} />}
        {myActivityOpen && <MyActivityModal t={t} userId={userId} close={() => setMyActivityOpen(false)} />}
        {communityOpen && <CommunityOverlay t={t} userId={userId} authProfile={authProfile} session={session} openThread={() => {}} close={() => setCommunityOpen(false)} />}
        {chatOpen && <ChatModal t={t} M={M} mentor={mentor} setMentor={setMentor} authProfile={authProfile} setAuthProfile={setAuthProfile} customMentors={customMentors} setCustomMentors={setCustomMentors} userId={userId} session={session} goals={goals} askAiTopic={askAiTopic} close={() => { setChatOpen(false); setAskAiTopic(null); }} />}
        {activeCall && (
          <CallModal t={t} threadId={activeCall.threadId} userId={userId} displayName={profile?.name} myAvatar={profile?.avatar} otherMemberIds={activeCall.otherMemberIds} roomName={activeCall.roomName} session={session} minimized={callMinimized} onMinimize={() => setCallMinimized(true)} onClose={() => { setActiveCall(null); setCallMinimized(false); }} />
        )}
        {activeCall && callMinimized && (
          <button onClick={() => setCallMinimized(false)} style={{ position: "fixed", bottom: 90, right: 16, zIndex: 90, background: "#2E9E6B", border: "none", borderRadius: 24, padding: "10px 16px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", boxShadow: "0 6px 18px rgba(0,0,0,.25)" }}>
            <Phone size={15} color="#fff" /><span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>กำลังคุยอยู่ · แตะเพื่อกลับ</span>
          </button>
        )}
        {!activeCall && <IncomingCallWatcher t={t} userId={userId} onAccept={(threadId, roomName, otherIds) => { setActiveCall({ threadId, roomName, otherMemberIds: otherIds }); setCallMinimized(false); }} />}
        {msgToast && !(page === "chatRoom" && activeThread?.id === msgToast.threadId) && (
          <ModalPortal>
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 115, display: "flex", justifyContent: "center", padding: "12px 12px 0", pointerEvents: "none" }}>
              <button onClick={() => { const tid = msgToast.threadId; setMsgToast(null); setPage("chat"); }} style={{ pointerEvents: "auto", width: "100%", maxWidth: 420, background: "#1C1A18", border: "1px solid rgba(255,255,255,.1)", borderRadius: 16, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 10px 30px rgba(0,0,0,.4)", cursor: "pointer", textAlign: "left", animation: "rh-ring-in .3s ease" }}>
                <style>{`@keyframes rh-ring-in { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
                <div style={{ width: 40, height: 40, borderRadius: 20, background: t.accent, display: "grid", placeItems: "center", flexShrink: 0 }}><MessageCircle size={18} color={t.onAccent} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: "#F2EDE6", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{msgToast.name}</div>
                  <div style={{ fontSize: 12, color: "#8C857C", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{msgToast.text || "ส่งข้อความมา"}</div>
                </div>
                <ChevronRight size={16} color="#8C857C" />
              </button>
            </div>
          </ModalPortal>
        )}
        {editProfile && <EditProfile t={t} M={M} profile={profile} setProfile={setProfile} userId={userId} authProfile={authProfile} setAuthProfile={setAuthProfile} close={() => setEditProfile(false)} />}
        {profileLightbox && profile.avatar && <ImageLightbox src={profile.avatar} onClose={() => setProfileLightbox(false)} />}
        {searchOpen && <SearchOverlay t={t} notes={notes} goals={goals} tx={tx} categories={categories} setPage={setPage} close={() => setSearchOpen(false)} />}
        {musicOpen && <MusicModal {...{ t, M, playlist, setPlaylist, folders, setFolders, curId, playing, playTrack, togglePlay, stopAll, toggleFavorite, renameTrack, volume, setVolume, userId, setPage, close: () => setMusicOpen(false) }} />}
        {addOpen && <AddTxModal t={t} tx={tx} setTx={setTx} categories={categories} reorderCategoriesForKind={reorderCategoriesForKind} deleteCategory={deleteCategory} addCategory={addCategory} userId={userId} session={session} close={() => setAddOpen(false)} />}
        {billManagerOpen && <BillManagerModal t={t} billReminders={billReminders} billPayments={billPayments} addBillReminder={addBillReminder} deleteBillReminder={deleteBillReminder} markBillPaid={markBillPaid} unmarkBillPaid={unmarkBillPaid} close={() => setBillManagerOpen(false)} />}
        {leaderboardOpen && <LeaderboardModal t={t} userId={userId} close={() => setLeaderboardOpen(false)} />}
        {goalTimerTarget && <GoalTimerModal t={t} goal={goalTimerTarget} close={() => setGoalTimerTarget(null)} />}
        {addGoalOpen && <AddGoalModal t={t} userId={userId} session={session} setGoals={setGoals} goalTemplates={goalTemplates} setGoalTemplates={setGoalTemplates} close={() => setAddGoalOpen(false)} />}
        {scoreRulesOpen && <ScoreRulesModal t={t} close={() => setScoreRulesOpen(false)} />}
        {reminderTarget && <ReminderModal t={t} targetType={reminderTarget.targetType} targetId={reminderTarget.targetId} label={reminderTarget.label} existing={reminderTarget.existing} upsertReminder={upsertReminder} deleteReminder={deleteReminder} close={() => setReminderTarget(null)} />}
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
      <style>{`@keyframes rh-pulse { 0%,100% { transform: scale(1); opacity:1; } 50% { transform: scale(1.05); opacity:.85; } } @keyframes rh-lantern-sway { 0%,100% { transform: rotate(-6deg); } 50% { transform: rotate(6deg); } }`}</style>
      <div style={{ animation: "rh-pulse 1.6s ease-in-out infinite" }}><PKnowLockup width={180} gap={8} animated /></div>
      <div style={{ animation: "rh-lantern-sway 1.6s ease-in-out infinite", transformOrigin: "top center" }}><LanternIcon size={30} tier={2} /></div>
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

// 🕘 ประวัติการใช้งานของฉัน — ทุกคนดูของตัวเองได้ (ไม่ใช่แค่แอดมิน) กรองตามช่วงเวลาได้เหมือนหน้าการเงิน
function MyActivityModal({ t, userId, close }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodMode, setPeriodMode] = useState("week"); // day | week | month | range
  const [anchor, setAnchor] = useState(todayStr());
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

  let rangeFrom, rangeTo, periodLabel;
  if (periodMode === "day") {
    rangeFrom = anchor; rangeTo = anchor;
    const d = new Date(anchor + "T00:00:00");
    periodLabel = `${d.getDate()} ${["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."][d.getMonth()]} ${d.getFullYear() + 543}`;
  } else if (periodMode === "week") {
    const { start, end } = weekRangeOf(anchor); rangeFrom = start; rangeTo = end;
    periodLabel = `${dateLabel(start)} – ${dateLabel(end)}`;
  } else if (periodMode === "range") {
    rangeFrom = rangeStart; rangeTo = rangeEnd;
    periodLabel = `${rangeStart} – ${rangeEnd}`;
  } else {
    const sel = monthOf(anchor);
    const [y, m] = sel.split("-"); const lastDay = new Date(+y, +m, 0).getDate();
    rangeFrom = `${sel}-01`; rangeTo = `${sel}-${String(lastDay).padStart(2, "0")}`;
    periodLabel = thMonth(sel);
  }

  useEffect(() => {
    setLoading(true);
    (async () => {
      const { data } = await supabase.from("activity_log").select("*").eq("user_id", userId)
        .gte("created_at", rangeFrom + "T00:00:00")
        .lte("created_at", rangeTo + "T23:59:59")
        .order("created_at", { ascending: false })
        .limit(300);
      setLogs(data || []);
      setLoading(false);
    })();
  }, [userId, rangeFrom, rangeTo]);

  const moduleMeta = {
    finance: { label: "การเงิน", icon: Wallet, color: "#E8894A" },
    goals: { label: "เป้าหมาย", icon: Target, color: "#3DA5D9" },
    notes: { label: "โน้ต", icon: StickyNote, color: "#7B6CB0" },
    community: { label: "ชุมชน", icon: Users, color: "#C0658C" },
    mentor: { label: "แชทโค้ช", icon: Sparkles, color: "#2E9E6B" },
    auth: { label: "บัญชี", icon: KeyRound, color: "#8A93A8" },
  };

  // จัดกลุ่มตามวันที่ ให้อ่านง่ายเหมือนหน้าการเงิน
  const groups = {};
  logs.forEach((l) => { const d = (l.created_at || "").slice(0, 10); (groups[d] = groups[d] || []).push(l); });

  return (
    <div style={overlay} onClick={close}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "24px 24px 0 0", padding: 20, maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: t.text }}>ประวัติการใช้งานของฉัน</div>
          <button onClick={close} style={ghost}><X size={20} color={t.sub} /></button>
        </div>
        <div style={{ fontSize: 11.5, color: t.sub, marginBottom: 14 }}>สรุปสิ่งที่คุณทำในแอป</div>

        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {[["day", "วัน"], ["week", "สัปดาห์"], ["month", "เดือน"], ["range", "กำหนดเอง"]].map(([v, lb]) => (
            <button key={v} onClick={() => setPeriodMode(v)} style={{ flex: 1, padding: "7px 0", borderRadius: 10, cursor: "pointer", border: `1.5px solid ${periodMode === v ? t.accent : t.border}`, fontWeight: 700, fontSize: 11.5, background: periodMode === v ? t.accent : "transparent", color: periodMode === v ? t.onAccent : t.sub }}>{lb}</button>
          ))}
        </div>

        {periodMode === "range" ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14 }}>
            <input type="date" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} style={{ ...input(t), fontSize: 12 }} />
            <span style={{ color: t.faint }}>–</span>
            <input type="date" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} style={{ ...input(t), fontSize: 12 }} />
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <button onClick={() => shiftAnchor(-1)} style={navBtn(t)}>‹</button>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: t.text }}>{periodLabel}</div>
            <button onClick={() => shiftAnchor(1)} style={navBtn(t)}>›</button>
          </div>
        )}

        {loading && <Empty t={t} text="กำลังโหลด..." />}
        {!loading && logs.length === 0 && <Empty t={t} text="ช่วงนี้ยังไม่มีประวัติการใช้งาน" />}

        {Object.keys(groups).map((d) => (
          <div key={d} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: t.faint, marginBottom: 6 }}>{dateLabel(d)}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {groups[d].map((l) => {
                const meta = moduleMeta[l.module] || { label: l.module, icon: Clock, color: t.faint };
                const Ic = meta.icon;
                return (
                  <div key={l.id} style={{ ...card(t), padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 10, background: `${meta.color}22`, display: "grid", placeItems: "center", flexShrink: 0 }}><Ic size={14} color={meta.color} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, color: t.text, fontWeight: 600 }}>{l.summary}</div>
                      <div style={{ fontSize: 10.5, color: t.faint }}>{meta.label} · {new Date(l.created_at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AccountSettingsModal({ t, authProfile, setAuthProfile, userId, session, close }) {
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

  // 💬 ข้อเสนอแนะ — ตั้งใจให้เรียบง่ายที่สุด (แค่พิมพ์กับกดส่ง) ลดความเกร็ง ให้กล้าเขียนตรงๆ
  const [fbText, setFbText] = useState("");
  const [fbBusy, setFbBusy] = useState(false);
  const [fbSent, setFbSent] = useState(false);
  const sendFeedback = async () => {
    if (!fbText.trim()) return;
    setFbBusy(true);
    const { error } = await supabase.from("feedback").insert({ user_id: userId, message: fbText.trim() });
    setFbBusy(false);
    if (!error) { setFbSent(true); setFbText(""); setTimeout(() => setFbSent(false), 4000); }
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
          <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 4 }}>💬 เสนอไอเดีย/ข้อเสนอแนะ</div>
          <div style={{ fontSize: 11.5, color: t.sub, marginBottom: 10, lineHeight: 1.6 }}>ส่งตรงถึงแอดมินคนเดียว เขียนได้อย่างสบายใจเลย ไม่ว่าจะติหรือชม อยากได้ฟีเจอร์ไหนเพิ่ม หรือเจอจุดไหนใช้งานไม่ลื่น บอกได้หมด</div>
          <textarea value={fbText} onChange={(e) => setFbText(e.target.value)} placeholder="พิมพ์ข้อเสนอแนะที่นี่..." rows={4} style={{ ...input(t), resize: "vertical", marginBottom: 8, fontFamily: "inherit" }} />
          {fbSent && <div style={{ fontSize: 11.5, color: "#2E9E6B", marginBottom: 8 }}>ส่งแล้ว ขอบคุณมากครับ 🙏</div>}
          <button onClick={sendFeedback} disabled={fbBusy || !fbText.trim()} style={{ ...primaryBtn({ accent: t.accent, accent2: t.accent2, onAccent: t.onAccent }), width: "100%", padding: "11px 0", opacity: fbBusy || !fbText.trim() ? 0.6 : 1 }}>{fbBusy ? "กำลังส่ง..." : "ส่งข้อเสนอแนะ"}</button>
        </div>

        <div style={{ ...card(t), padding: 14, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 4 }}>🏆 กระดานผู้นำเป้าหมาย</div>
              <div style={{ fontSize: 11.5, color: t.sub, lineHeight: 1.6 }}>เปิดแล้วคนอื่นในบ้านจะเห็นแต้มสัปดาห์นี้ของคุณในกระดานผู้นำ (ไม่เห็นรายละเอียดเป้าหมาย เห็นแค่แต้มรวม)</div>
            </div>
            <button onClick={async () => { const next = !authProfile?.show_on_leaderboard; await supabase.from("profiles").update({ show_on_leaderboard: next }).eq("id", userId); setAuthProfile((p) => ({ ...p, show_on_leaderboard: next })); }} style={{ flexShrink: 0, marginLeft: 12, width: 46, height: 26, borderRadius: 13, border: "none", cursor: "pointer", background: authProfile?.show_on_leaderboard ? t.accent : t.border, position: "relative", transition: "background .15s" }}>
              <span style={{ position: "absolute", top: 3, left: authProfile?.show_on_leaderboard ? 23 : 3, width: 20, height: 20, borderRadius: 10, background: "#fff", transition: "left .15s" }} />
            </button>
          </div>
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
  if (/threads\.net|threads\.com/.test(u)) return "threads";
  if (/facebook\.com|fb\.watch/.test(u)) return "facebook";
  return "other";
}
const PLATFORM_META = {
  youtube: { label: "YouTube", color: "#E0507B" },
  tiktok: { label: "TikTok", color: "#000000" },
  twitter: { label: "X (Twitter)", color: "#1DA1F2" },
  instagram: { label: "Instagram", color: "#C13584" },
  threads: { label: "Threads", color: "#000000" },
  facebook: { label: "Facebook", color: "#1877F2" },
  other: { label: "ลิงก์", color: "#8A93A8" },
};

// 📁 แถวจัดการหมวดหมู่สื่อ 1 อัน — แก้ไขชื่อได้ (กดที่ชื่อ), ลบได้, ลากจัดเรียงได้ (ผ่าน handleProps ที่ส่งมาจาก DragReorderList)
function FolderManageRow({ t, folder, handleProps, priming, onRename, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(folder.name);
  const save = () => { if (name.trim()) onRename(name.trim()); setEditing(false); };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", borderRadius: 10, background: t.inputBg, marginBottom: 4 }}>
      <span {...handleProps}><GripVertical size={16} color={priming ? t.accent : t.faint} /></span>
      {editing ? (
        <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} onBlur={save} autoFocus style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 700, border: `1px solid ${t.accent}`, borderRadius: 8, padding: "3px 6px", background: t.page, color: t.text }} />
      ) : (
        <button onClick={() => { setName(folder.name); setEditing(true); }} style={{ flex: 1, textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 700, color: t.text }} title="กดเพื่อแก้ไขชื่อ">{folder.name}</button>
      )}
      <button onClick={onDelete} style={ghost} title="ลบหมวดหมู่นี้"><Trash2 size={14} color={t.faint} /></button>
    </div>
  );
}

function MusicModal({ t, M, playlist, setPlaylist, folders, setFolders, curId, playing, playTrack, togglePlay, stopAll, toggleFavorite, renameTrack, volume, setVolume, userId, setPage, close }) {
  const [askConfirm, ConfirmUI] = useConfirm(t);
  const scrollRef = useRef(null); // 📜 เลื่อนขึ้นบนสุดอัตโนมัติตอนกดเล่น (ผู้เล่น/การ์ด embed อยู่บนสุดเสมอ)
  const [ytUrl, setYtUrl] = useState("");
  const fileRef = useRef(null);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState("all"); // "all" | "fav" | folder.id
  const [showMoreFolders, setShowMoreFolders] = useState(false); // 🔽 "เพิ่มเติม" ของแท็บหมวดหมู่ - ไว้เจอ/เลือกหมวดที่เหลือ (browse)
  const [managingFolders, setManagingFolders] = useState(false); // ⚙️ "จัดการหมวดหมู่" แยกต่างหาก - ไว้ลบ/เพิ่มหมวดใหม่ (manage)
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
    if (userId) supabase.from("media_folders").insert({ id: f.id, user_id: userId, name: f.name }).then(({ error }) => { if (error) console.error("บันทึกหมวดหมู่สื่อไม่สำเร็จ:", error.message); }, () => {});
  };
  const setTrackFolder = (id, folderId) => {
    setPlaylist((p) => p.map((x) => (x.id === id ? { ...x, folderId: folderId || null } : x)));
    // ⚠️ บั๊กเดิม: ฟังก์ชันนี้แก้แค่ state ในเครื่อง ไม่เคยยิง update ไป Supabase เลย ทำให้พอรีเฟรช/โหลดใหม่ค่า folder_id ใน DB ยังเป็นของเดิม (null) หมวดหมู่ที่เพิ่งเลือกเลยหายไปทุกครั้ง
    if (userId) supabase.from("playlists").update({ folder_id: folderId || null }).eq("id", id).eq("user_id", userId).then(({ error }) => { if (error) console.error("บันทึกหมวดหมู่สื่อไม่สำเร็จ:", error.message); }, () => {});
  };
  const deleteFolder = (folderId) => {
    if (userId) supabase.from("media_folders").delete().eq("user_id", userId).eq("id", folderId).then(() => {}, () => {});
    setFolders((fs) => fs.filter((f) => f.id !== folderId));
    setPlaylist((p) => p.map((x) => (x.folderId === folderId ? { ...x, folderId: null } : x)));
    setTab((cur) => (cur === folderId ? "all" : cur));
  };
  const renameFolder = (folderId, newName) => {
    const nm = newName.trim();
    if (!nm) return;
    setFolders((fs) => fs.map((f) => (f.id === folderId ? { ...f, name: nm } : f)));
    if (userId) supabase.from("media_folders").update({ name: nm }).eq("user_id", userId).eq("id", folderId).then(() => {}, () => {});
  };
  const reorderFolders = (newOrder) => {
    setFolders(newOrder);
    if (userId) newOrder.forEach((f, i) => { supabase.from("media_folders").update({ sort_order: i }).eq("user_id", userId).eq("id", f.id).then(() => {}, () => {}); });
  };

  const cur = playlist.find((p) => p.id === curId) || null;
  const shown = playlist.filter((tr) => {
    if (tab === "all") return true;
    if (tab === "fav") return !!tr.favorite;
    return tr.folderId === tab;
  });
  // 📄 แบ่งหน้าจริง (เลขหน้า) — ลากจัดเรียงยังทำได้ปกติ แต่ลากได้แค่ภายในหน้าเดียวกันเท่านั้น (ลากข้ามหน้าไม่ได้ ต้องเปลี่ยนหน้าก่อน)
  const mediaPagination = usePagination(shown, 10);
  useEffect(() => { mediaPagination.setPage(0); }, [tab]); // เปลี่ยนแท็บ -> กลับไปหน้าแรก
  const visibleShown = mediaPagination.pageItems;
  // 🔀 จัดเรียงเฉพาะรายการที่กำลังโชว์อยู่ในหน้านี้ของ tab ปัจจุบัน — ไม่ไปยุ่งตำแหน่งของสื่ออื่นนอก tab/นอกหน้านี้
  // เอาผลลัพธ์ไปแทนที่ตำแหน่งเดิมของรายการที่โชว์ใน playlist รวม แล้ว sync sort_order ใหม่ทั้งชุดขึ้น Supabase (คอลัมน์ sort_order ต้องรัน SQL เพิ่มก่อน ไม่งั้นจะจำลำดับได้แค่ในเซสชันนี้ ไม่ค้างข้ามรอบเปิดแอป)
  const reorderShown = (newOrderShown) => {
    const shownIds = new Set(visibleShown.map((x) => x.id));
    setPlaylist((p) => {
      const idxs = p.map((x, i) => (shownIds.has(x.id) ? i : -1)).filter((i) => i !== -1);
      if (idxs.length !== newOrderShown.length) return p;
      const arr = [...p];
      idxs.forEach((posInArr, j) => { arr[posInArr] = newOrderShown[j]; });
      if (userId) arr.forEach((tr, i) => { supabase.from("playlists").update({ sort_order: i }).eq("id", tr.id).then(() => {}, () => {}); });
      return arr;
    });
  };

  return (
    <div style={overlay} onClick={close}>
      <div ref={scrollRef} onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "24px 24px 0 0", padding: "20px 20px 28px", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: t.text }}>สื่อของฉัน 📎</div>
          <button onClick={close} style={ghost}><X size={20} color={t.sub} /></button>
        </div>
        <div style={{ fontSize: 12, color: t.sub, marginBottom: 14 }}>เก็บสื่อจาก YouTube, TikTok, X, Instagram, Facebook ไว้ดูย้อนหลัง · เพิ่มแล้วบันทึกอัตโนมัติ</div>

        {/* 🎬 ผู้เล่น YouTube ย้ายมาเล่นตรงนี้ได้เลย (เดิมบอกแค่ว่าไปเล่นอยู่หน้า Home ตอนนี้เล่น+คุมได้จากตรงนี้ทันที) */}
        {/* ตอนนี้เพลง YouTube เล่นอยู่ที่การ์ด "กำลังเล่น" หน้า Home เท่านั้น (ลองทำให้เล่นในหน้าสื่อได้ด้วยไปแล้ว แต่ไม่เสถียรพอ เลยถอยกลับมาแบบนี้ที่เชื่อถือได้แน่นอนกว่า) */}
        {cur && cur.kind === "yt" && (
          <button onClick={() => { setPage("home"); close(); setTimeout(() => { document.getElementById("yt-now-playing-card")?.scrollIntoView({ behavior: "smooth", block: "center" }); }, 80); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: `${t.accent}18`, border: `1px dashed ${t.accent}66`, borderRadius: 12, padding: "9px 12px", fontSize: 11.5, color: t.accent, fontWeight: 600, marginBottom: 14, cursor: "pointer", textAlign: "left" }}>
            <Music size={14} /> กำลังเล่น "{cur.name}" อยู่ที่หน้า Home <ChevronRight size={13} style={{ marginLeft: "auto" }} />
          </button>
        )}
        {/* 📎 IG/X/TikTok/Facebook — โชว์ด้านบนแบบเดียวกับ YouTube เลย ไม่ต้องเปิด modal ซ้อนอีกต่อไป */}
        {viewingMedia && (
          <div style={{ ...card(t), padding: 14, marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{viewingMedia.name}</div>
              <button onClick={() => setViewingMedia(null)} style={ghost} title="ปิด"><X size={18} color={t.faint} /></button>
            </div>
            <SocialEmbedBody t={t} item={viewingMedia} />
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

        {/* volume — โชว์แค่ตอนมีอะไรเล่นอยู่จริง (ไม่ใช่ YouTube เพราะการ์ด "กำลังเล่น" ด้านบนมีปุ่มเสียงของตัวเองอยู่แล้ว กันซ้ำ) */}
        {cur && cur.kind !== "yt" && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <VolumeX size={16} color={t.faint} />
            <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(+e.target.value)} style={{ flex: 1, accentColor: t.accent }} />
            <Volume2 size={16} color={t.faint} />
          </div>
        )}

        {/* แท็บหมวดหมู่ — เหมือน pattern โน้ตเป๊ะๆ: โชว์หลัก 4 ช่อง (ทั้งหมด/โปรด + หมวดที่สร้างเอง 2 อันแรก) + "เพิ่มเติม" ไว้เจอหมวดที่เหลือ (กดเลือกได้เลย) + มุมขวาบนของพาแนลนั้นมีปุ่ม "จัดการหมวดหมู่" สลับเป็นโหมดแก้ไขชื่อ/ลากจัดเรียง/ลบ/เพิ่มใหม่ */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            {[{ id: "all", name: "ทั้งหมด" }, { id: "fav", name: "❤ โปรด" }, ...folders].slice(0, 4).map((f) => (
              <button key={f.id} onClick={() => setTab(f.id)} style={{ padding: "7px 13px", borderRadius: 16, cursor: "pointer", border: `1.5px solid ${tab === f.id ? t.accent : t.border}`, fontWeight: 700, fontSize: 12, background: tab === f.id ? t.accent : "transparent", color: tab === f.id ? t.onAccent : t.sub }}>{f.name}</button>
            ))}
            <button onClick={() => setShowMoreFolders((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 13px", borderRadius: 16, cursor: "pointer", border: `1.5px solid ${showMoreFolders ? t.accent : t.border}`, fontWeight: 700, fontSize: 12, background: "none", color: t.sub }}>
              <MoreVertical size={13} color={t.sub} /> เพิ่มเติม <ChevronRight size={12} color={t.sub} style={{ transform: showMoreFolders ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
            </button>
          </div>
          {showMoreFolders && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${t.border}` }}>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 2 }}>
                <button onClick={() => setManagingFolders((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "2px 4px" }}>
                  {managingFolders ? <Check size={12} color={t.accent} /> : <Settings size={12} color={t.faint} />}
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: managingFolders ? t.accent : t.faint }}>{managingFolders ? "เสร็จแล้ว" : "จัดการหมวดหมู่"}</span>
                </button>
              </div>
              {managingFolders ? (
                <>
                  <DragReorderList
                    items={folders}
                    getId={(f) => f.id}
                    onReorder={reorderFolders}
                    renderItem={(f, i, { handleProps, priming }) => (
                      <FolderManageRow t={t} folder={f} handleProps={handleProps} priming={priming} onRename={(nm) => renameFolder(f.id, nm)} onDelete={() => askConfirm(`ลบหมวดหมู่ "${f.name}" เลยไหม?`, () => deleteFolder(f.id))} />
                    )}
                  />
                  {folders.length === 0 && <div style={{ fontSize: 11.5, color: t.faint, padding: "4px 10px" }}>ยังไม่มีหมวดหมู่ที่สร้างเอง</div>}
                  <button onClick={() => setAddingFolder((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 10px", borderRadius: 10, border: "none", background: "none", cursor: "pointer", textAlign: "left" }}>
                    <Plus size={15} color={t.sub} /><span style={{ fontSize: 12.5, color: t.sub, fontWeight: 700 }}>เพิ่มหมวดหมู่ใหม่</span>
                  </button>
                </>
              ) : (
                folders.slice(2).map((f) => (
                  <button key={f.id} onClick={() => { setTab(f.id); setShowMoreFolders(false); }} style={{ display: "flex", alignItems: "center", width: "100%", padding: "9px 10px", borderRadius: 10, border: "none", background: tab === f.id ? `${t.accent}18` : "none", cursor: "pointer", textAlign: "left" }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: tab === f.id ? t.accent : t.text }}>{f.name}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {addingFolder && (
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input autoFocus value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addFolder()} placeholder="ตั้งชื่อหมวดหมู่ เช่น ชิลล์ๆ, ออกกำลังกาย" style={input(t)} />
            <button onClick={addFolder} style={{ ...primaryBtn(t), padding: "0 14px" }}>สร้าง</button>
          </div>
        )}

        {/* playlist */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: t.sub }}>สื่อที่เก็บไว้ ({shown.length})</div>
          <PageJumpChip t={t} page={mediaPagination.page} setPage={mediaPagination.setPage} totalPages={mediaPagination.totalPages} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {shown.length === 0 && <div style={{ textAlign: "center", color: t.sub, fontSize: 13, padding: "20px 0" }}>ยังไม่มีสื่อในหมวดนี้</div>}
          <DragReorderList
            items={visibleShown}
            getId={(tr) => tr.id}
            onReorder={reorderShown}
            renderItem={(tr, i, { handleProps, priming }) => (
              <div style={{ marginBottom: 8 }}>
                <TrackRow t={t} M={M} track={tr} active={curId === tr.id} playing={playing && curId === tr.id}
                  folders={folders} dragHandleProps={handleProps} dragPriming={priming}
                  onPlay={() => {
                    if (tr.kind === "link") { setViewingMedia(tr); requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })); }
                    else if (tr.kind === "yt") { playTrack(tr); setPage("home"); close(); } // 🎬 YouTube เล่นได้แน่นอนแค่ที่หน้า Home เท่านั้น กดเล่นแล้วเด้งไปหน้า Home ให้เลย ไม่ต้องกดเองอีกที
                    else { playTrack(tr); requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })); }
                  }} onToggle={togglePlay}
                  onDel={() => {
                    if (tab === "all") askConfirm(`ลบ "${tr.name}" ออกจากสื่อทั้งหมดเลยไหม?`, () => { setPlaylist((p) => p.filter((x) => x.id !== tr.id)); if (userId) supabase.from("playlists").delete().eq("id", tr.id).then(() => {}, () => {}); }); // แท็บทั้งหมด -> ลบจริง (ถามยืนยันก่อน)
                    else if (tab === "fav") toggleFavorite(tr.id);                                   // แท็บโปรด -> แค่เอาออกจากโปรด ไม่ต้องยืนยัน (ย้อนกลับง่าย)
                    else setTrackFolder(tr.id, null);                                                 // แท็บหมวดหมู่ -> แค่เอาออกจากหมวด ไม่ลบต้นฉบับ
                  }}
                  onFav={() => toggleFavorite(tr.id)}
                  onFolder={(fid) => setTrackFolder(tr.id, fid)} onRename={(name) => renameTrack(tr.id, name)}
                  onPinHome={() => togglePinHome(tr.id)} />
              </div>
            )}
          />
          {shown.length > mediaPagination.pageSize && (
            <>
              <div style={{ fontSize: 10.5, color: t.faint, textAlign: "center", marginTop: 4 }}>ลากจัดเรียงได้เฉพาะภายในหน้านี้ (ลากข้ามหน้าไม่ได้)</div>
              <PaginationBar t={t} page={mediaPagination.page} setPage={mediaPagination.setPage} totalPages={mediaPagination.totalPages} />
            </>
          )}
        </div>
        <div style={{ fontSize: 10.5, color: t.faint, textAlign: "center", marginTop: 14 }}>
          เพลง YouTube เล่นได้แน่นอนแค่ที่การ์ด "กำลังเล่น" หน้า Home (ตาม YouTube ToS ต้องมองเห็นได้ตอนเล่น) — กดเล่นจากหน้าสื่อนี้แล้วเด้งไปหน้า Home ให้เองเลย ไม่ต้องกดเองอีกที · ถ้าออกจากหน้า Home วิดีโออาจหยุดเล่นตามพฤติกรรมเบราว์เซอร์ · ไฟล์เพลงเล่นต่อได้ทุกหน้าเหมือนเดิม · ไฟล์ใหญ่กว่า 1.5MB เล่นเฉพาะรอบนี้ · ดาวน์โหลดได้เฉพาะไฟล์ที่แนบเอง (YouTube ดาวน์โหลดไม่ได้ตามกติกา)
        </div>
      </div>
      {ConfirmUI}
    </div>
  );
}

// 📎 แสดงสื่อจากแพลตฟอร์มโซเชียลต่างๆ (โหลด embed script ของแต่ละเจ้าแบบไดนามิก)
// แยก shortcode ของ Instagram จากลิงก์ (เช่น https://www.instagram.com/p/ABC123xyz/ หรือ /reel/ABC123xyz/)
function instagramEmbedUrl(url) {
  const m = url.match(/instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
  return m ? `https://www.instagram.com/${m[1]}/${m[2]}/embed` : null;
}
// 📎 เนื้อหา embed จริง (ไม่รวม modal chrome) — ใช้ซ้ำได้ทั้งใน SocialEmbedModal (แบบเต็มจอ) และแบบฝังในหน้าสื่อ (inline บนสุด เหมือน YouTube)
function SocialEmbedBody({ t, item }) {
  const twitterRef = useRef(null);
  const tiktokRef = useRef(null);
  const [tiktokEmbedHtml, setTiktokEmbedHtml] = useState(null);
  const [tiktokFailed, setTiktokFailed] = useState(false);

  // 🐛 ทั้ง 3 แพลตฟอร์มด้านล่าง (X/TikTok/Instagram) ใช้สคริปต์ของเจ้าของแพลตฟอร์มเองมาแทนที่ DOM ที่เรา render ไว้ (blockquote -> iframe จริง)
  // ถ้าปล่อยให้ React เป็นคน render เนื้อหานั้น (ผ่าน JSX ตรงๆ หรือ dangerouslySetInnerHTML) React จะงงว่า DOM หายไปไหน พอ re-render/unmount
  // จะพังด้วย "Uncaught NotFoundError: Failed to execute removeChild" (เจอจริงใน console ที่พี่ส่งมา) — แก้โดยใส่ HTML ผ่าน ref ด้วยมือแทน
  // ให้ React เห็นแค่ <div ref={...} /> ว่างๆ ไม่ยุ่งกับลูกข้างในเลย ปลอดภัยไม่ว่าสคริปต์ข้างนอกจะมาสลับ DOM ยังไงก็ตาม

  useEffect(() => {
    if (item.platform !== "twitter" || !twitterRef.current) return;
    twitterRef.current.innerHTML = `<blockquote class="twitter-tweet"><a href="${item.url}"></a></blockquote>`;
    const process = () => window.twttr?.widgets?.load(twitterRef.current);
    if (window.twttr?.widgets) { process(); return; }
    const s = document.createElement("script");
    s.src = "https://platform.twitter.com/widgets.js"; s.async = true;
    s.onload = process;
    document.body.appendChild(s);
  }, [item.url]);

  // 🎵 TikTok — ดึง HTML embed อย่างเป็นทางการตรงจาก TikTok oEmbed API (เหมือนที่แอปเรียกอยู่แล้วตอน "เพิ่มสื่อ" เพื่อดึงชื่อ) แทนการเดา blockquote/video-id เอง
  useEffect(() => {
    if (item.platform !== "tiktok") return;
    setTiktokEmbedHtml(null); setTiktokFailed(false);
    fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(item.url)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.html) setTiktokEmbedHtml(data.html); else setTiktokFailed(true); })
      .catch(() => setTiktokFailed(true));
  }, [item.url]);
  useEffect(() => {
    if (item.platform !== "tiktok" || !tiktokEmbedHtml || !tiktokRef.current) return;
    tiktokRef.current.innerHTML = tiktokEmbedHtml;
    const s = document.createElement("script");
    s.src = "https://www.tiktok.com/embed.js"; s.async = true;
    document.body.appendChild(s);
    return () => { try { document.body.removeChild(s); } catch (e) {} };
  }, [tiktokEmbedHtml]);

  // 📸 Instagram — ลองใช้วิธีทางการ (blockquote + embed.js) ไปแล้วแต่ยังไม่เสถียร (Meta น่าจะจำกัดสิทธิ์ embed แบบเดียวกับ Facebook/Threads) เปลี่ยนเป็นบอกตรงๆ แทนพยายามฝังแล้วพัง/เด้งออกแอปแบบสุ่ม

  // 📸 Instagram — คืนกลับมาใช้ iframe ธรรมดาแบบเดิม (instagram.com/p/{id}/embed) เพราะพี่ยืนยันว่าเวอร์ชันนี้ดูผ่านแอปได้จริง
  const igEmbed = item.platform === "instagram" ? instagramEmbedUrl(item.url) : null;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "center" }}>
        {item.platform === "tiktok" && (
          tiktokEmbedHtml
            ? <div ref={tiktokRef} style={{ width: "100%", display: "flex", justifyContent: "center" }} />
            : <div style={{ fontSize: 12, color: t.sub, padding: 20, textAlign: "center" }}>{tiktokFailed ? "อ่านลิงก์นี้ไม่ได้ ลองกดเปิดต้นฉบับด้านล่างแทน" : "กำลังโหลด..."}</div>
        )}
        {item.platform === "twitter" && <div ref={twitterRef} style={{ width: "100%" }} />}
        {item.platform === "instagram" && (
          igEmbed
            ? <iframe src={igEmbed} style={{ width: "100%", maxWidth: 400, height: 480, border: "none", borderRadius: 12 }} title="instagram" />
            : <div style={{ fontSize: 12, color: t.sub, padding: 20, textAlign: "center" }}>อ่านลิงก์นี้ไม่ได้ ลองกดเปิดต้นฉบับด้านล่างแทน</div>
        )}
        {item.platform === "threads" && (
          <div style={{ fontSize: 12, color: t.sub, padding: 20, textAlign: "center", lineHeight: 1.6 }}>Threads ยังฝังดูตรงในแอปไม่ได้ครับ (ต้องลงทะเบียน Meta Developer App + access token ก่อนถึงจะขอ embed ได้ ต่างจาก TikTok/X ที่เปิดให้ใช้ฟรีไม่ต้องลงทะเบียน) — กดเปิดต้นฉบับด้านล่างแทนได้เลย</div>
        )}
        {item.platform === "facebook" && (
          <div style={{ fontSize: 12, color: t.sub, padding: 20, textAlign: "center", lineHeight: 1.6 }}>Facebook มักฝังดูตรงในแอปไม่ได้ครับ (ปลั๊กอินของ Facebook เองมักบล็อกโพสต์ที่ไม่ได้มาจากเพจสาธารณะ หรือต้องลงทะเบียน Meta App ก่อนถึงจะแสดงได้เต็มรูปแบบ) — กดเปิดต้นฉบับด้านล่างแทนได้เลย</div>
        )}
      </div>
      <a href={item.url} target="_blank" rel="noreferrer" style={{ display: "block", textAlign: "center", marginTop: 14, fontSize: 12.5, color: t.accent, fontWeight: 700, textDecoration: "none" }}>เปิดต้นฉบับในแอป {PLATFORM_META[item.platform]?.label} →</a>
    </>
  );
}

function SocialEmbedModal({ t, item, close }) {
  return (
    <ModalPortal>
      <div style={overlay} onClick={close}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "24px 24px 0 0", padding: 16, maxHeight: "85vh", overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
            <button onClick={close} style={ghost}><X size={20} color={t.sub} /></button>
          </div>
          <SocialEmbedBody t={t} item={item} />
        </div>
      </div>
    </ModalPortal>
  );
}

function TrackRow({ t, M, track, active, playing, folders, dragHandleProps, dragPriming, onPlay, onToggle, onDel, onFav, onFolder, onRename, onPinHome }) {
  const isLink = track.kind === "link";
  const platMeta = PLATFORM_META[track.platform] || PLATFORM_META.other;
  const icon = isLink ? <Link2 size={16} color={platMeta.color} /> : track.kind === "yt" ? <Music size={16} color="#E0507B" /> : track.kind === "file" ? <Music size={16} color="#3DA5D9" /> : <Sparkles size={16} color={t.accent} />;
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(track.name);
  const saveRename = () => { if (editName.trim()) onRename?.(editName.trim()); setEditing(false); };
  return (
    <div style={{ ...card(t), padding: "10px 12px", border: `1px solid ${active ? t.accent : t.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span {...dragHandleProps} style={{ ...dragHandleProps?.style, flexShrink: 0 }}><GripVertical size={16} color={dragPriming ? t.accent : t.faint} /></span>
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
      {folders && folders.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, paddingLeft: 44 }}>
          <select value={track.folderId || ""} onChange={(e) => onFolder(e.target.value || null)} style={{ fontSize: 11, border: `1px solid ${t.border}`, borderRadius: 8, background: t.inputBg, color: t.sub, padding: "3px 6px" }}>
            <option value="">ไม่มีหมวดหมู่</option>
            {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}

const greet = (night) => { const h = new Date().getHours(); return h < 6 ? "ดึกแล้ว พักบ้างนะ 🌙" : h < 12 ? "สวัสดีตอนเช้า ☀️" : h < 18 ? "สวัสดีตอนบ่าย 🌤️" : "ค่ำแล้ว วันนี้เป็นไงบ้าง 🌙"; };

// ---------------- Home ----------------
// 🎯 เพิ่มเป้าหมาย — เลือกได้ว่าทำครั้งเดียววันนี้ หรือ ตั้งเป็นตารางประจำสัปดาห์ (เลือกวันเองหรือทุกวัน) + ระดับความหิน
function AddGoalModal({ t, userId, session, setGoals, goalTemplates, setGoalTemplates, close }) {
  const [mode, setMode] = useState("once"); // once | recurring
  const [text, setText] = useState("");
  const [days, setDays] = useState([]); // 0=จ ... 6=อา
  const [busy, setBusy] = useState(false);
  const [timerOn, setTimerOn] = useState(false); // ⏱ ตั้งเวลา (ไม่บังคับ) — เปิดแล้วจะมีปุ่ม "เริ่มจับเวลา" โผล่ที่การ์ดเป้าหมายนี้
  const [timerMode, setTimerMode] = useState("single"); // single = นับถอยหลังครั้งเดียว, interval = เตือนเป็นช่วง
  const [timerUnit, setTimerUnit] = useState("min"); // sec = วินาที, min = นาที, hour = ชม.
  const [timerMinutes, setTimerMinutes] = useState("30"); // ตัวเลขดิบตามหน่วยที่เลือก (โหมด single = ระยะเวลารวม, โหมด interval = ความยาวต่อช่วง)
  const [timerRepeatCount, setTimerRepeatCount] = useState("4"); // จำนวนช่วง (โหมด interval เท่านั้น)
  const dayLabels = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];

  // ✨ AI ช่วยคิดเป้าหมาย — step: form (หน้าหลัก) -> source (เลือกแหล่ง) -> topic (พิมพ์หัวข้อ) -> loading -> results (แก้ไข/ลบ/เพิ่มเองก่อนบันทึก)
  const [step, setStep] = useState("form");
  const [aiTopic, setAiTopic] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState([]); // [{id, text, points, reason}]
  const [aiError, setAiError] = useState("");
  const backStep = { source: "form", topic: "source", results: "source" };

  const toggleDay = (i) => setDays((ds) => (ds.includes(i) ? ds.filter((x) => x !== i) : [...ds, i].sort()));

  // 🎯 ประเมินคะแนนด้วย AI แทนระบบเลือกระดับความหินเอง (self-report ไม่แฟร์ กดยากมั่วเพื่อเอาแต้มได้)
  // ประเมินไม่สำเร็จ (เน็ตหลุด/AI ล่ม) fallback เป็นค่ากลาง 5 แต้ม ไม่บล็อกการบันทึกเป้าหมาย
  const assessPoints = async (goalText) => {
    try {
      const r = await fetch("/api/knowledge-generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "goal_ai", mode: "assess", text: goalText, callerToken: session?.access_token }) });
      const data = await r.json();
      if (r.ok && data.points) return data.points;
    } catch (e) {}
    return 5;
  };

  const save = async () => {
    if (!text.trim()) return;
    if (mode === "recurring" && days.length === 0) return;
    setBusy(true);
    try {
      const points = await assessPoints(text.trim());
      // ⏱ สรุป field ตั้งเวลาเป็น snake_case พร้อมส่งลง DB — เก็บเป็น "วินาทีรวม" เสมอ (timer_seconds) ไม่ว่าจะเลือกหน่วยไหน เพื่อให้คำนวณง่ายตอนจับเวลาจริง ส่วน timer_unit เก็บไว้แค่จำหน่วยที่เคยเลือกไว้โชว์ตอนแก้ไขภายหลัง
      const unitToSec = { sec: 1, min: 60, hour: 3600 };
      const timerPatch = timerOn
        ? {
            timer_mode: timerMode,
            timer_unit: timerUnit,
            timer_seconds: (Number(timerMinutes) || 0) * (unitToSec[timerUnit] || 60) || null,
            timer_repeat_count: timerMode === "interval" ? (Number(timerRepeatCount) || null) : null,
          }
        : { timer_mode: null, timer_unit: null, timer_seconds: null, timer_repeat_count: null };
      if (mode === "once") {
        const g = { id: uid(), text: text.trim(), done: false, date: todayStr(), doneDate: null, points, timerMode: timerPatch.timer_mode, timerUnit: timerPatch.timer_unit, timerSeconds: timerPatch.timer_seconds, timerRepeatCount: timerPatch.timer_repeat_count };
        setGoals((gs) => [...gs, g]);
        if (userId) { await supabase.from("goals").insert({ id: g.id, user_id: userId, text: g.text, done: g.done, date: g.date, done_date: g.doneDate, points, ...timerPatch }); logAudit(userId, "goals", "add", "เพิ่มเป้าหมาย"); }
      } else {
        const { data, error } = await supabase.from("goal_templates").insert({ user_id: userId, text: text.trim(), days_of_week: days, points, ...timerPatch }).select().single();
        if (!error && data) {
          setGoalTemplates((ts) => [...ts, { id: data.id, text: data.text, daysOfWeek: data.days_of_week, points: data.points, active: true, timerMode: data.timer_mode, timerUnit: data.timer_unit, timerSeconds: data.timer_seconds, timerRepeatCount: data.timer_repeat_count }]);
          logAudit(userId, "goals", "add", "ตั้งเป้าหมายประจำสัปดาห์ใหม่");
          // ถ้าวันนี้ตรงกับวันที่เลือกไว้ สร้างรายการของวันนี้ให้เลย ไม่ต้องรอรีเฟรชหน้า
          const todayDow = (new Date().getDay() + 6) % 7;
          if (days.includes(todayDow)) {
            const g = { id: uid(), text: text.trim(), done: false, date: todayStr(), doneDate: null, template_id: data.id, points, timerMode: timerPatch.timer_mode, timerUnit: timerPatch.timer_unit, timerSeconds: timerPatch.timer_seconds, timerRepeatCount: timerPatch.timer_repeat_count };
            setGoals((gs) => [...gs, g]);
            await supabase.from("goals").insert({ id: g.id, user_id: userId, text: g.text, done: false, date: g.date, template_id: data.id, points, ...timerPatch });
          }
        }
      }
      close();
    } finally { setBusy(false); }
  };

  const pauseTemplate = async (id) => {
    await supabase.from("goal_templates").update({ active: false, archived_at: new Date().toISOString() }).eq("id", id);
    setGoalTemplates((ts) => ts.filter((x) => x.id !== id));
  };

  // ✨ ---- AI ช่วยคิดเป้าหมาย ----
  const chooseSource = async (src) => {
    setAiError("");
    if (src === "topic") { setStep("topic"); return; }
    await generateSuggestions("history", "");
  };

  const generateSuggestions = async (src, topic) => {
    setStep("loading");
    setAiError("");
    try {
      let historyTexts = [];
      if (src === "history" && userId) {
        const { data } = await supabase.from("goals").select("text").eq("user_id", userId).order("date", { ascending: false }).limit(20);
        historyTexts = (data || []).map((g) => g.text).filter(Boolean);
      }
      const r = await fetch("/api/knowledge-generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "goal_ai", mode: "suggest", source: src, topic, historyTexts, callerToken: session?.access_token }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "AI ช่วยคิดเป้าหมายไม่สำเร็จ");
      setAiSuggestions((data.goals || []).map((g) => ({ id: uid(), text: g.text, points: g.points, reason: g.reason })));
      setStep("results");
    } catch (e) {
      setAiError(e.message || "เกิดข้อผิดพลาด ลองใหม่อีกครั้ง");
      setStep("source");
    }
  };

  const updateSuggestion = (id, patch) => setAiSuggestions((list) => list.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const removeSuggestion = (id) => setAiSuggestions((list) => list.filter((s) => s.id !== id));
  const addBlankSuggestion = () => setAiSuggestions((list) => [...list, { id: uid(), text: "", points: 5, reason: "" }]);

  const confirmSuggestions = async () => {
    const valid = aiSuggestions.filter((s) => s.text.trim());
    if (valid.length === 0) return;
    setBusy(true);
    try {
      const rows = valid.map((s) => ({ id: uid(), text: s.text.trim(), done: false, date: todayStr(), doneDate: null, points: s.points || 5 }));
      setGoals((gs) => [...gs, ...rows]);
      if (userId) {
        await supabase.from("goals").insert(rows.map((g) => ({ id: g.id, user_id: userId, text: g.text, done: g.done, date: g.date, done_date: g.doneDate, points: g.points })));
        logAudit(userId, "goals", "add", `เพิ่มเป้าหมายจาก AI ${rows.length} ข้อ`);
      }
      close();
    } finally { setBusy(false); }
  };

  const disabled = busy || !text.trim() || (mode === "recurring" && days.length === 0);
  const validSuggestions = aiSuggestions.filter((s) => s.text.trim());

  return (
    <div style={overlay} onClick={close}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "24px 24px 0 0", maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px 20px 0", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
              {step !== "form" && <button onClick={() => setStep(backStep[step] || "form")} style={{ ...ghost, flexShrink: 0 }}><ChevronLeft size={20} color={t.sub} /></button>}
              <div style={{ fontSize: 17, fontWeight: 800, color: t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {step === "form" && "เพิ่มเป้าหมาย"}
                {step === "source" && "✨ AI ช่วยคิดเป้าหมาย"}
                {step === "topic" && "พิมพ์หัวข้อที่อยากพัฒนา"}
                {step === "loading" && "กำลังคิดเป้าหมายให้..."}
                {step === "results" && `AI แนะนำให้ ${aiSuggestions.length} ข้อ`}
              </div>
            </div>
            <button onClick={close} style={{ ...ghost, flexShrink: 0 }}><X size={20} color={t.sub} /></button>
          </div>
        </div>

        <div style={{ padding: "0 20px", overflowY: "auto", flex: 1, minHeight: 0 }}>

          {/* ===== STEP: form (หน้าหลัก) ===== */}
          {step === "form" && (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {[["once", "ครั้งเดียว (วันนี้)"], ["recurring", "ทำประจำ (ตั้งตาราง)"]].map(([v, lb]) => (
                  <button key={v} onClick={() => setMode(v)} style={{ flex: 1, padding: "10px 0", borderRadius: 12, cursor: "pointer", border: `1.5px solid ${mode === v ? t.accent : t.border}`, fontWeight: 700, fontSize: 12.5, background: mode === v ? t.accent : "transparent", color: mode === v ? t.onAccent : t.sub }}>{lb}</button>
                ))}
              </div>

              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="เช่น ออกกำลังกาย 30 นาที" style={{ ...input(t), marginBottom: 12 }} autoFocus />

              <button onClick={() => setStep("source")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "11px 0", borderRadius: 12, border: `1.5px dashed ${t.accent}66`, background: `${t.accent}0f`, color: t.accent, fontWeight: 700, fontSize: 13, cursor: "pointer", marginBottom: 16 }}>
                <Sparkles size={15} /> ให้ AI ช่วยคิดเป้าหมาย
              </button>

              {mode === "recurring" && (
                <>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: t.sub }}>ทำวันไหนบ้าง</div>
                    <button onClick={() => setDays([0, 1, 2, 3, 4, 5, 6])} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11.5, color: t.accent, fontWeight: 700 }}>ทุกวัน</button>
                  </div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                    {dayLabels.map((lb, i) => (
                      <button key={i} onClick={() => toggleDay(i)} style={{ flex: 1, padding: "9px 0", borderRadius: 10, cursor: "pointer", border: `1.5px solid ${days.includes(i) ? t.accent : t.border}`, fontWeight: 700, fontSize: 12, background: days.includes(i) ? t.accent : "transparent", color: days.includes(i) ? t.onAccent : t.sub }}>{lb}</button>
                    ))}
                  </div>
                </>
              )}

              <div style={{ fontSize: 10.5, color: t.faint, marginBottom: 20, lineHeight: 1.6 }}>💡 ไม่ต้องเลือกระดับความยากเองแล้ว — AI จะประเมินคะแนนให้ตอนกดบันทึก อ้างอิงมาตรฐานสุขภาพ/พัฒนาตัวเองจริง ให้แฟร์เท่ากันทุกคน</div>

              {/* ⏱ ตั้งเวลา (ไม่บังคับ) — เปิดแล้วจะมีปุ่ม "▶ เริ่มจับเวลา" โผล่ที่การ์ดเป้าหมายนี้ */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: timerOn ? 10 : 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: t.sub }}>⏱ ตั้งเวลา (ไม่บังคับ)</div>
                <button onClick={() => setTimerOn((v) => !v)} style={{ width: 42, height: 24, borderRadius: 12, border: "none", cursor: "pointer", background: timerOn ? t.accent : t.border, position: "relative", transition: "background .15s" }}>
                  <span style={{ position: "absolute", top: 2, left: timerOn ? 20 : 2, width: 20, height: 20, borderRadius: 10, background: "#fff", transition: "left .15s" }} />
                </button>
              </div>
              {timerOn && (
                <div style={{ ...card(t), padding: 12, marginBottom: 20 }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    {[["single", "นับถอยหลังครั้งเดียว"], ["interval", "เตือนเป็นช่วง"]].map(([v, lb]) => (
                      <button key={v} onClick={() => setTimerMode(v)} style={{ flex: 1, padding: "8px 0", borderRadius: 10, cursor: "pointer", border: `1.5px solid ${timerMode === v ? t.accent : t.border}`, fontWeight: 700, fontSize: 11, background: timerMode === v ? `${t.accent}18` : "transparent", color: t.text }}>{lb}</button>
                    ))}
                  </div>
                  {timerMode === "single" ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <input type="number" min="1" value={timerMinutes} onChange={(e) => setTimerMinutes(e.target.value)} style={{ ...input(t), flex: 1 }} />
                      {[["sec", "วิ"], ["min", "นาที"], ["hour", "ชม."]].map(([v, lb]) => (
                        <button key={v} onClick={() => setTimerUnit(v)} style={{ padding: "9px 10px", borderRadius: 8, cursor: "pointer", border: `1.5px solid ${timerUnit === v ? t.accent : t.border}`, fontWeight: 700, fontSize: 11, background: timerUnit === v ? t.accent : "transparent", color: timerUnit === v ? t.onAccent : t.sub, flexShrink: 0 }}>{lb}</button>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                        <span style={{ fontSize: 12, color: t.sub, width: 60, flexShrink: 0 }}>เตือนทุก</span>
                        <input type="number" min="1" value={timerMinutes} onChange={(e) => setTimerMinutes(e.target.value)} style={{ ...input(t), flex: 1 }} />
                        {[["sec", "วิ"], ["min", "นาที"], ["hour", "ชม."]].map(([v, lb]) => (
                          <button key={v} onClick={() => setTimerUnit(v)} style={{ padding: "9px 8px", borderRadius: 8, cursor: "pointer", border: `1.5px solid ${timerUnit === v ? t.accent : t.border}`, fontWeight: 700, fontSize: 10.5, background: timerUnit === v ? t.accent : "transparent", color: timerUnit === v ? t.onAccent : t.sub, flexShrink: 0 }}>{lb}</button>
                        ))}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12, color: t.sub, width: 78, flexShrink: 0 }}>จำนวนครั้ง</span>
                        <input type="number" min="1" value={timerRepeatCount} onChange={(e) => setTimerRepeatCount(e.target.value)} style={{ ...input(t), flex: 1 }} />
                      </div>
                      <div style={{ fontSize: 10.5, color: t.faint, marginTop: 8, lineHeight: 1.5 }}>เช่น ทุก 15 นาที × 4 ครั้ง = ครบ 1 ชม. เตือนเป็นระยะระหว่างทาง ไม่ใช่รอครบทีเดียว</div>
                    </>
                  )}
                </div>
              )}

              {goalTemplates.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: t.sub, marginBottom: 8 }}>เป้าหมายประจำที่ตั้งไว้</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {goalTemplates.map((tp) => (
                      <div key={tp.id} style={{ ...card(t), padding: "9px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                        {tp.points != null && <span style={{ fontSize: 10, fontWeight: 800, color: t.accent, background: `${t.accent}18`, borderRadius: 6, padding: "2px 5px", flexShrink: 0 }}>+{tp.points}</span>}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, color: t.text, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tp.text}</div>
                          <div style={{ fontSize: 10, color: t.faint }}>{tp.daysOfWeek.length === 7 ? "ทุกวัน" : tp.daysOfWeek.map((i) => dayLabels[i]).join(" ")}</div>
                        </div>
                        <button onClick={() => pauseTemplate(tp.id)} style={ghost} title="หยุด/ลบเป้าหมายประจำนี้"><Trash2 size={14} color={t.faint} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ===== STEP: source (เลือกแหล่งข้อมูลให้ AI) ===== */}
          {step === "source" && (
            <div style={{ paddingBottom: 20 }}>
              <div style={{ fontSize: 12, color: t.sub, marginBottom: 14, lineHeight: 1.6 }}>อยากให้ AI เอาอะไรมาช่วยคิด?</div>
              {aiError && <div style={{ fontSize: 11.5, color: "#D9534F", marginBottom: 12, padding: "8px 10px", background: "#D9534F18", borderRadius: 8 }}>{aiError}</div>}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button onClick={() => chooseSource("history")} style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, border: `1.5px solid ${t.border}`, background: t.surface, cursor: "pointer", textAlign: "left" }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: `${t.accent}18`, display: "grid", placeItems: "center", flexShrink: 0, fontSize: 18 }}>📊</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>ดูจากประวัติของฉัน</div>
                    <div style={{ fontSize: 11, color: t.sub }}>อิงจากเป้าหมายที่เคยตั้งไว้ก่อนหน้านี้</div>
                  </div>
                </button>
                <button onClick={() => chooseSource("topic")} style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, border: `1.5px solid ${t.border}`, background: t.surface, cursor: "pointer", textAlign: "left" }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: `${t.accent}18`, display: "grid", placeItems: "center", flexShrink: 0, fontSize: 18 }}>⌨️</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>พิมพ์หัวข้อเอง</div>
                    <div style={{ fontSize: 11, color: t.sub }}>บอกสิ่งที่อยากพัฒนา ให้ AI แตกเป็นเป้าหมายย่อย</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ===== STEP: topic (พิมพ์หัวข้อ) ===== */}
          {step === "topic" && (
            <div style={{ paddingBottom: 20 }}>
              <div style={{ fontSize: 12, color: t.sub, marginBottom: 12, lineHeight: 1.6 }}>เช่น "อยากลดน้ำหนัก" "อยากเก่งภาษาอังกฤษ" "อยากมีวินัยเรื่องเงิน"</div>
              <input value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} placeholder="พิมพ์สิ่งที่อยากพัฒนา..." style={{ ...input(t), marginBottom: 16 }} autoFocus />
              <button onClick={() => generateSuggestions("topic", aiTopic.trim())} disabled={!aiTopic.trim()} style={{ ...primaryBtn(t), width: "100%", padding: "12px 0", opacity: aiTopic.trim() ? 1 : 0.5 }}>ให้ AI ช่วยคิด →</button>
            </div>
          )}

          {/* ===== STEP: loading ===== */}
          {step === "loading" && (
            <div style={{ padding: "60px 0", textAlign: "center" }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", border: `3px solid ${t.border}`, borderTopColor: t.accent, margin: "0 auto 14px", animation: "rh-ai-spin .8s linear infinite" }} />
              <div style={{ fontSize: 12.5, color: t.sub }}>กำลังให้ AI ช่วยคิดเป้าหมาย...<br />(อ้างอิงมาตรฐานสุขภาพ + ข้อมูลของคุณ)</div>
              <style>{`@keyframes rh-ai-spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* ===== STEP: results (แก้ไข/ลบ/เพิ่มเองก่อนบันทึก) ===== */}
          {step === "results" && (
            <div style={{ paddingBottom: 20 }}>
              <div style={{ fontSize: 11, color: t.sub, marginBottom: 14 }}>แก้ไขชื่อ ลบทิ้ง หรือเพิ่มข้อเองได้ก่อนบันทึก — ทุกข้อบันทึกเป็นเป้าหมายวันนี้</div>
              {aiSuggestions.map((s) => (
                <div key={s.id} style={{ ...card(t), padding: 12, marginBottom: 10, display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <input value={s.text} onChange={(e) => updateSuggestion(s.id, { text: e.target.value })} style={{ ...input(t), padding: "8px 10px", fontSize: 13, fontWeight: 600, marginBottom: s.reason ? 4 : 0 }} />
                    {s.reason && <div style={{ fontSize: 10, color: t.faint, lineHeight: 1.5, padding: "0 2px" }}>{s.reason}</div>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: t.accent, background: `${t.accent}18`, borderRadius: 8, padding: "3px 7px", whiteSpace: "nowrap" }}>+{s.points}</span>
                    <button onClick={() => removeSuggestion(s.id)} style={ghost}><Trash2 size={14} color={t.faint} /></button>
                  </div>
                </div>
              ))}
              <button onClick={addBlankSuggestion} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "10px 0", borderRadius: 12, border: `1.5px dashed ${t.border}`, color: t.sub, fontSize: 12, cursor: "pointer", background: "none", marginBottom: 4 }}><Plus size={14} /> เพิ่มเป้าหมายเอง</button>
            </div>
          )}
        </div>

        {(step === "form" || step === "results") && (
          <div style={{ padding: "12px 20px calc(20px + env(safe-area-inset-bottom, 0px) + 78px)", flexShrink: 0, borderTop: `1px solid ${t.border}` }}>
            {step === "form"
              ? <button onClick={save} disabled={disabled} style={{ ...primaryBtn(t), width: "100%", padding: "13px 0", fontSize: 15, opacity: disabled ? 0.6 : 1 }}>{busy ? "กำลังประเมิน+บันทึก..." : "บันทึก"}</button>
              : <button onClick={confirmSuggestions} disabled={busy || validSuggestions.length === 0} style={{ ...primaryBtn(t), width: "100%", padding: "13px 0", fontSize: 15, opacity: busy || validSuggestions.length === 0 ? 0.6 : 1 }}>{busy ? "กำลังบันทึก..." : `บันทึกทั้งหมด (${validSuggestions.length})`}</button>}
          </div>
        )}
      </div>
    </div>
  );
}

// 🏆 กระดานผู้นำ — เห็นแค่คนที่เปิด opt-in ไว้เอง (show_on_leaderboard) คำนวณผ่าน SECURITY DEFINER function บนฐานข้อมูล
// จะได้ไม่ต้องให้ client อ่านตาราง goals ของคนอื่นตรงๆ (ปลอดภัย เห็นแค่แต้มรวม ไม่เห็นรายการเป้าหมายจริงของใคร)
function LeaderboardModal({ t, userId, close }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("get_goal_leaderboard");
      if (error) console.error("โหลดกระดานผู้นำไม่สำเร็จ:", error.message);
      setRows(data || []);
      setLoading(false);
    })();
  }, []);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div style={overlay} onClick={close}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "24px 24px 0 0", padding: 20, maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: t.text }}>🏆 กระดานผู้นำสัปดาห์นี้</div>
          <button onClick={close} style={ghost}><X size={20} color={t.sub} /></button>
        </div>
        <div style={{ fontSize: 11.5, color: t.sub, marginBottom: 16 }}>เห็นเฉพาะคนที่เปิดเข้าร่วมเอง (ตั้งค่าได้ที่ตั้งค่าบัญชี)</div>

        {loading && <Empty t={t} text="กำลังโหลด..." />}
        {!loading && rows.length === 0 && <Empty t={t} text="ยังไม่มีใครเข้าร่วมกระดานผู้นำเลย ชวนคนในบ้านเปิด toggle ในตั้งค่าบัญชีได้เลย" />}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map((r, i) => (
            <div key={r.user_id} style={{ ...card(t), padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, border: r.user_id === userId ? `1.5px solid ${t.accent}` : undefined }}>
              <div style={{ width: 26, fontSize: i < 3 ? 18 : 13, fontWeight: 800, color: t.sub, textAlign: "center", flexShrink: 0 }}>{medals[i] || `#${i + 1}`}</div>
              {r.avatar_url ? (
                <img src={r.avatar_url} alt="" style={{ width: 34, height: 34, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 34, height: 34, borderRadius: 12, background: colorFor(r.name || "?"), color: "#fff", display: "grid", placeItems: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{(r.name || "?")[0]?.toUpperCase()}</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>{r.name || "ไม่ทราบชื่อ"}{r.user_id === userId ? " (คุณ)" : ""}</div>
                <div style={{ fontSize: 10.5, color: t.faint }}>ทำสำเร็จ {r.done_count} รายการ</div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: t.accent, flexShrink: 0 }}>{r.points}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 📣 แชร์สถิติเป้าหมาย/streak ไปหน้าชุมชน — เปิดให้แก้ข้อความก่อนโพสต์เสมอ (ไม่โพสต์ให้เองเงียบๆ)
function ShareGoalModal({ t, userId, authProfile, weekPoints, bestStreak, badge, close }) {
  const defaultText = `${badge || "🎯"} สัปดาห์นี้ทำเป้าหมายได้ ${weekPoints} แต้ม${bestStreak > 0 ? ` ต่อเนื่อง ${bestStreak} วันแล้ว!` : "!"}`;
  const [text, setText] = useState(defaultText);
  const [posting, setPosting] = useState(false);

  const post = async () => {
    if (!text.trim()) return;
    setPosting(true);
    const { error } = await supabase.from("posts").insert({ author_id: userId, text: text.trim(), images: [], visibility: "public" });
    setPosting(false);
    if (!error) { logAudit(userId, "community", "post", "แชร์สถิติเป้าหมายไปชุมชน"); close(); }
  };

  return (
    <div style={overlay} onClick={close}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "24px 24px 0 0", padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: t.text }}>แชร์ไปหน้าชุมชน</div>
          <button onClick={close} style={ghost}><X size={20} color={t.sub} /></button>
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} style={{ ...input(t), resize: "vertical", marginBottom: 14, fontFamily: "inherit" }} />
        <button onClick={post} disabled={posting || !text.trim()} style={{ ...primaryBtn(t), width: "100%", padding: "12px 0", opacity: posting || !text.trim() ? 0.6 : 1 }}>{posting ? "กำลังโพสต์..." : "โพสต์เลย"}</button>
      </div>
    </div>
  );
}

// ⏱ ===== ตัวจับเวลาเป้าหมาย =====
// นับถอยหลังพร้อมอนิเมชันนาฬิกาทราย (พลิกทุก 15 วิ) ครบเวลาแล้วดังเสียงปลุกจริง 5 ครั้งห่างกัน 1.5 วิ (startTimerAlarm)
// กด "รับทราบ" หยุดเสียงได้ก่อนครบ 5 ครั้ง — โหมด interval ทำซ้ำหลายช่วง (เช่น 15 นาที×4 ครั้ง) แต่ละช่วงจบแล้วดังปลุกเหมือนกันทุกช่วง
// ⚠️ ต้องเรนเดอร์จากระดับบนสุดของแอปเท่านั้น (นอกกล่อง transform:scale) ไม่งั้น position:fixed เพี้ยน — บั๊กแบบเดียวกับ LeaderboardModal ที่เพิ่งแก้ไป
// ⏱ แปลงวินาทีรวมกลับเป็นตัวเลข+หน่วยที่ผู้ใช้เลือกไว้ตอนสร้าง (เก็บ timer_unit ไว้เพื่อโชว์กลับแบบเดิมเป๊ะๆ ไม่ปัดเศษเพี้ยน)
function formatTimerBadge(totalSeconds, unit) {
  if (!totalSeconds) return "";
  const map = { sec: [1, "วิ"], min: [60, "น."], hour: [3600, "ชม."] };
  const [div, label] = map[unit] || map.min;
  const val = totalSeconds / div;
  return `${Number.isInteger(val) ? val : val.toFixed(1)}${label}`;
}

function GoalTimerModal({ t, goal, close }) {
  const totalSegments = goal.timerMode === "interval" ? (Number(goal.timerRepeatCount) || 1) : 1;
  const segmentSeconds = Number(goal.timerSeconds) || 60;
  const [segmentIndex, setSegmentIndex] = useState(1); // ช่วงที่กำลังนับอยู่ (นับจาก 1)
  const [remainingSec, setRemainingSec] = useState(segmentSeconds);
  const [paused, setPaused] = useState(false);
  const [ringing, setRinging] = useState(false); // true = ครบเวลาช่วงนี้แล้ว กำลังดังปลุกรอกดรับทราบ
  const [ringInfo, setRingInfo] = useState({ count: 0, total: 5 });
  const alarmRef = useRef(null);

  useEffect(() => {
    if (paused || ringing) return;
    if (remainingSec <= 0) { setRinging(true); alarmRef.current = startTimerAlarm((count) => setRingInfo({ count, total: 5 }), 5); return; }
    const timer = setTimeout(() => setRemainingSec((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [remainingSec, paused, ringing]);

  useEffect(() => () => { alarmRef.current?.stop(); }, []); // ปิด modal ระหว่างเสียงกำลังดัง ก็ต้องหยุดเสียงด้วย ไม่ปล่อยค้างเล่นต่อเบื้องหลัง

  const acknowledge = () => {
    alarmRef.current?.stop(); alarmRef.current = null; setRinging(false);
    if (segmentIndex >= totalSegments) { close(); return; } // ครบทุกช่วงของเซสชันนี้แล้ว ปิดเลย
    setSegmentIndex((i) => i + 1);
    setRemainingSec(segmentSeconds);
  };

  const rs = Math.max(0, remainingSec);
  const showHours = rs >= 3600 || segmentSeconds >= 3600;
  const hh = String(Math.floor(rs / 3600)).padStart(2, "0");
  const mm = String(Math.floor((rs % 3600) / 60)).padStart(2, "0");
  const ss = String(rs % 60).padStart(2, "0");
  const timeLabel = showHours ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`;

  if (ringing) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(circle at 50% 30%, rgba(217,83,79,.35), rgba(10,14,25,.94) 70%)" }}>
        <div style={{ textAlign: "center", padding: 24, maxWidth: 340 }}>
          <div style={{ fontSize: 56, animation: "rh-timer-shake .4s infinite" }}>⏰</div>
          <div style={{ fontFamily: "'Kanit',sans-serif", fontSize: 22, fontWeight: 800, color: "#D9534F", margin: "14px 0 4px" }}>ครบเวลาแล้ว!</div>
          <div style={{ fontSize: 13, color: t.sub, marginBottom: 6 }}>"{goal.text}"{totalSegments > 1 ? ` — ช่วงที่ ${segmentIndex}/${totalSegments}` : ""}</div>
          <div style={{ fontSize: 11, color: t.faint, marginBottom: 22 }}>ดังแจ้งเตือนครั้งที่ {ringInfo.count} / {ringInfo.total}</div>
          <button onClick={acknowledge} style={{ width: 240, padding: "14px 0", borderRadius: 14, border: "none", background: `linear-gradient(135deg,${t.accent2},${t.accent})`, color: t.onAccent, fontWeight: 800, fontSize: 14, cursor: "pointer" }}>✓ รับทราบ หยุดเสียง</button>
        </div>
        <style>{`@keyframes rh-timer-shake { 0%,100% { transform: rotate(-8deg); } 50% { transform: rotate(8deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={overlay} onClick={close}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "24px 24px 0 0", padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: t.text }}>⏱ {goal.text}</div>
          <button onClick={close} style={ghost}><X size={20} color={t.sub} /></button>
        </div>
        {totalSegments > 1 && <div style={{ fontSize: 11.5, color: t.sub, marginBottom: 14 }}>ช่วงที่ {segmentIndex} / {totalSegments}</div>}

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0" }}>
          <div style={{ width: 100, height: 136, position: "relative", animation: "rh-hourglass-flip 15s linear infinite" }}>
            <div style={{ position: "absolute", left: 8, right: 8, top: 4, height: 58, border: `3px solid ${t.accent2}`, borderRadius: "44px 44px 6px 6px", overflow: "hidden", clipPath: "polygon(0 0,100% 0,100% 40%,50% 100%,0 40%)" }}>
              <div style={{ position: "absolute", left: 2, right: 2, bottom: 0, background: t.accent, animation: "rh-hourglass-drain 15s linear infinite" }} />
            </div>
            <div style={{ position: "absolute", left: 8, right: 8, bottom: 4, height: 58, border: `3px solid ${t.accent2}`, borderRadius: "6px 6px 44px 44px", overflow: "hidden", clipPath: "polygon(50% 0,100% 60%,100% 100%,0 100%,0 60%)" }}>
              <div style={{ position: "absolute", left: 2, right: 2, bottom: 0, background: t.accent, animation: "rh-hourglass-fill 15s linear infinite" }} />
            </div>
          </div>
          <div style={{ fontFamily: "'Kanit',sans-serif", fontSize: showHours ? 30 : 38, fontWeight: 800, color: t.text, marginTop: 16, letterSpacing: 1 }}>{timeLabel}</div>
          <div style={{ fontSize: 11.5, color: t.sub, marginTop: 4 }}>{paused ? "หยุดชั่วคราวอยู่" : "กำลังนับถอยหลัง..."}</div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setPaused((p) => !p)} style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: `1.5px solid ${t.border}`, background: "none", color: t.text, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{paused ? "เล่นต่อ" : "หยุดชั่วคราว"}</button>
          <button onClick={close} style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: `1.5px solid ${t.border}`, background: "none", color: t.sub, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>ยกเลิก</button>
        </div>
        <style>{`
          @keyframes rh-hourglass-flip { 0%,92% { transform: rotate(0deg); } 96%,100% { transform: rotate(180deg); } }
          @keyframes rh-hourglass-drain { 0% { height: 90%; } 90% { height: 0%; } 100% { height: 0%; } }
          @keyframes rh-hourglass-fill { 0% { height: 0%; } 90% { height: 90%; } 100% { height: 90%; } }
        `}</style>
      </div>
    </div>
  );
}

// 📐 ===== หน้ากฎการนับคะแนน =====
// ⚠️ ต้องเรนเดอร์จากระดับบนสุดของแอปเท่านั้น (นอกกล่อง transform:scale) ไม่งั้น position:fixed เพี้ยน — บั๊กแบบเดียวกับ LeaderboardModal/AddGoalModal ที่เคยแก้ไป
function ScoreRulesModal({ t, close }) {
  const RuleCard = ({ num, title, children }) => (
    <div style={{ ...card(t), padding: 14, marginBottom: 10 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <div style={{ width: 24, height: 24, borderRadius: 12, background: t.accent, color: t.onAccent, fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{num}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 4 }}>{title}</div>
          <div style={{ fontSize: 11.5, color: t.sub, lineHeight: 1.6 }}>{children}</div>
        </div>
      </div>
    </div>
  );
  return (
    <div style={overlay} onClick={close}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "24px 24px 0 0", maxHeight: "85vh", overflowY: "auto", padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: t.text }}>📐 กฎการนับคะแนน</div>
          <button onClick={close} style={ghost}><X size={20} color={t.sub} /></button>
        </div>
        <div style={{ fontSize: 11.5, color: t.sub, marginBottom: 16 }}>อ่านเข้าใจง่าย รู้ว่าทำไมได้แต้มเท่านี้</div>

        <RuleCard num="1" title="AI ประเมินคะแนนให้ทุกเป้าหมาย">
          แต่ละเป้าหมายจะได้คะแนน 1-10 แต้ม ประเมินจากความยาก/ความสำคัญเทียบกับเป้าหมายรายวันทั่วไป อ้างอิงมาตรฐานสุขภาพจริง (WHO ก้าวเดิน, เวลาหน้าจอ, สมาธิ ฯลฯ) ไม่ใช่กดเลือกเอง — ทุกคนใช้เกณฑ์เดียวกัน แฟร์เท่ากันหมด
        </RuleCard>

        <RuleCard num="2" title="ตั้งเยอะทำไม่ครบ โดนหักตามสัดส่วน">
          แต้มที่ได้จริงไม่ใช่แค่บวกตรงๆ แต่คูณด้วย "อัตราสำเร็จ" ของวันนั้นด้วย กันการตั้งเป้าพรวดพราดแล้วทำไม่ครบ
          <div style={{ background: `${t.accent}10`, border: `1px dashed ${t.accent}66`, borderRadius: 12, padding: 12, margin: "10px 0", fontSize: 11.5, color: t.text, lineHeight: 1.8 }}>
            <b style={{ color: t.accent }}>แต้มที่ได้จริง</b> = Σ(แต้มที่ทำสำเร็จ) × (จำนวนที่ทำสำเร็จ ÷ จำนวนที่ตั้งไว้)
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead><tr>{["ตั้ง", "ทำสำเร็จ", "แต้มดิบ", "ได้จริง"].map((h) => <th key={h} style={{ color: t.faint, fontWeight: 700, fontSize: 10, padding: "6px 4px", borderBottom: `1px solid ${t.border}` }}>{h}</th>)}</tr></thead>
            <tbody>
              <tr>{["3", "3", "30", "30"].map((v, i) => <td key={i} style={{ textAlign: "center", padding: "7px 4px", borderBottom: `1px solid ${t.border}`, fontWeight: i === 3 ? 800 : 400, color: i === 3 ? t.accent : t.text }}>{v}</td>)}</tr>
              <tr>{["5", "2", "20", "8"].map((v, i) => <td key={i} style={{ textAlign: "center", padding: "7px 4px", fontWeight: i === 3 ? 800 : 400, color: i === 3 ? t.accent : t.text }}>{v}</td>)}</tr>
            </tbody>
          </table>
        </RuleCard>

        <RuleCard num="3" title="กระดานผู้นำ นับเฉพาะสัปดาห์นี้">
          คะแนนที่ขึ้นกระดานผู้นำ 🏆 คำนวณจากเป้าหมายที่ทำสำเร็จ "ภายในสัปดาห์นี้" เท่านั้น (จันทร์-อาทิตย์) เห็นเฉพาะคนที่เปิด "แสดงในกระดานผู้นำ" ไว้ในตั้งค่าบัญชีเอง
        </RuleCard>

        <RuleCard num="4" title="ทำไม่สำเร็จ = ไม่ได้แต้ม ไม่ใช่โดนลบ">
          เป้าหมายที่ยังไม่กาถูกไม่เสียแต้มที่มีอยู่ แค่ไม่ได้แต้มใหม่จากข้อนั้นเท่านั้น
        </RuleCard>
      </div>
    </div>
  );
}

// 🏠 โครง Home แบบ "วอลเล็ต" — ยอดเงินตัวใหญ่บนสุด + แถวไอคอนฟังก์ชันลัด + list เรียบ (ทางเลือกที่ 2 จาก 3 แบบที่ user เลือกได้)
function HomeWidgetsWallet({ t, shp, M, quote, isNight, setMentorPick, setChatOpen, balance, todayNet, goalDone, goals, todayArticles, latestNote, setPage, setCommunityOpen, commPreview }) {
  return (
    <>
      <div style={{ marginTop: 8, background: t.hero, borderRadius: shp.radius, padding: "18px 16px", position: "relative", overflow: "hidden" }}>
        <button onClick={() => setMentorPick(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: `${t.onAccent}CC` }}>{isNight ? "โค้ชคืนนี้" : "โค้ชวันนี้"} · {M.name.toUpperCase()} ▾</span>
        </button>
        <div style={{ fontSize: 30, fontWeight: 800, color: t.onAccent, marginTop: 8, letterSpacing: -0.5 }}>{fmt(balance)}</div>
        <div style={{ fontSize: 11, color: `${t.onAccent}CC`, marginTop: 6 }}>{todayNet >= 0 ? "▲ +" : "▼ "}{Math.abs(todayNet).toLocaleString()} วันนี้ · เป้าหมายสำเร็จ {goalDone}/{goals.length || 0}</div>
        <button onClick={() => setChatOpen(true)} style={{ marginTop: 12, border: "none", cursor: "pointer", background: `${t.onAccent}2E`, color: t.onAccent, fontWeight: 700, fontSize: 12.5, padding: "8px 14px", borderRadius: shp.radius === 0 ? 0 : 18, display: "inline-flex", alignItems: "center", gap: 6 }}>คุยกับโค้ช <ChevronRight size={14} /></button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18, marginBottom: 6 }}>
        <WalletQuick t={t} icon={<Wallet size={18} color={t.accent} />} label="การเงิน" onClick={() => setPage("ledger")} />
        <WalletQuick t={t} icon={<BookOpen size={18} color={t.accent} />} label="ความรู้" onClick={() => setPage("ideas")} />
        <WalletQuick t={t} icon={<Target size={18} color={t.accent} />} label="เป้าหมาย" onClick={() => setPage("goalsReport")} />
        <WalletQuick t={t} icon={<StickyNote size={18} color={t.accent} />} label="โน้ต" onClick={() => setPage("note")} />
        <WalletQuick t={t} icon={<Users size={18} color={t.accent} />} label="ชุมชน" onClick={() => setCommunityOpen(true)} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 8 }}>
        <WalletRow t={t} shp={shp} icon={<BookOpen size={17} color={t.accent} />} title="ความรู้วันนี้" sub={todayArticles === null ? "กำลังโหลด..." : todayArticles.length === 0 ? "ยังไม่มีวันนี้" : `${todayArticles.length} บทความ · AI คัดให้`} onClick={() => setPage("ideas")} />
        <WalletRow t={t} shp={shp} icon={<StickyNote size={17} color={t.accent} />} title="โน้ตล่าสุด" sub={latestNote ? (latestNote.title || "(ไม่มีหัวข้อ)") : "ยังไม่มีโน้ต"} onClick={() => setPage("note")} />
        <WalletRow t={t} shp={shp} icon={<Users size={17} color={t.accent} />} title="ชุมชน" sub={commPreview.newCount > 0 ? `มีโพสต์ใหม่ ${commPreview.newCount} รายการวันนี้` : "แตะเพื่อเข้าสู่โลกโซเชียล"} onClick={() => setCommunityOpen(true)} />
      </div>
    </>
  );
}
function WalletQuick({ t, icon, label, onClick }) {
  return (
    <button onClick={onClick} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 60 }}>
      <span style={{ width: 50, height: 50, borderRadius: 25, background: t.surface, border: `1px solid ${t.border}`, display: "grid", placeItems: "center" }}>{icon}</span>
      <span style={{ fontSize: 10, fontWeight: 700, color: t.sub, textAlign: "center" }}>{label}</span>
    </button>
  );
}
function WalletRow({ t, shp, icon, title, sub, onClick }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 12, background: shp.bg, border: shp.border, borderRadius: shp.radius, boxShadow: shp.shadow, padding: "12px 14px", cursor: "pointer", textAlign: "left", width: "100%" }}>
      <span style={{ width: 34, height: 34, borderRadius: shp.iconRadius, background: t.inputBg, display: "grid", placeItems: "center", flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
        <div style={{ fontSize: 10.5, color: t.sub, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</div>
      </div>
      <ChevronRight size={15} color={t.faint} />
    </button>
  );
}

// 🧱 โครง Home แบบ "เบนโต" — บล็อกขนาดผสม การ์ดยอดเงินใหญ่เด่น + การ์ดเล็กล้อมรอบ (ทางเลือกที่ 3 จาก 3 แบบที่ user เลือกได้)
function HomeWidgetsBento({ t, shp, M, isNight, setMentorPick, balance, todayNet, goalDone, goals, todayArticles, latestNote, setPage, setCommunityOpen, commPreview }) {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 10, marginTop: 8 }}>
        <div style={{ background: t.hero, borderRadius: shp.radius, padding: 16, position: "relative", overflow: "hidden" }}>
          <button onClick={() => setMentorPick(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: `${t.onAccent}CC` }}>{isNight ? "โค้ชคืนนี้" : "โค้ชวันนี้"}</span>
          </button>
          <div style={{ fontSize: 22, fontWeight: 800, color: t.onAccent, marginTop: 6 }}>{fmt(balance)}</div>
          <div style={{ fontSize: 10.5, color: `${t.onAccent}CC`, marginTop: 4 }}>{todayNet >= 0 ? "▲ +" : "▼ "}{Math.abs(todayNet).toLocaleString()} วันนี้</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <BentoTile shp={shp} icon={<Target size={15} color="#fff" />} bg={t.cat.coral} label={`${goalDone}/${goals.length || 0} เป้าหมาย`} onClick={() => setPage("goalsReport")} />
          <BentoTile shp={shp} icon={<BookOpen size={15} color="#fff" />} bg={t.cat.amber} label={todayArticles === null ? "กำลังโหลด" : todayArticles.length === 0 ? "ยังไม่มีวันนี้" : `${todayArticles.length} บทความ`} onClick={() => setPage("ideas")} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
        <BentoTile shp={shp} icon={<StickyNote size={15} color="#fff" />} bg={t.cat.violet} label={latestNote ? (latestNote.title || "(ไม่มีหัวข้อ)") : "ยังไม่มีโน้ต"} onClick={() => setPage("note")} full />
        <BentoTile shp={shp} icon={<Users size={15} color="#fff" />} bg={t.cat.green} label={commPreview.newCount > 0 ? `ชุมชน · ใหม่ ${commPreview.newCount}` : "ชุมชน"} onClick={() => setCommunityOpen(true)} full />
      </div>
    </>
  );
}
function BentoTile({ shp, icon, bg, label, onClick, full }) {
  return (
    <button onClick={onClick} style={{ background: bg, border: "none", borderRadius: shp.radius, padding: 12, cursor: "pointer", textAlign: "left", display: "flex", flexDirection: full ? "row" : "column", alignItems: full ? "center" : "flex-start", gap: full ? 10 : 6, flex: full ? "none" : 1, width: "100%" }}>
      <span style={{ width: 26, height: 26, borderRadius: shp.iconRadius, background: "rgba(0,0,0,.15)", display: "grid", placeItems: "center", flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: full ? "nowrap" : "normal", flex: full ? 1 : "none" }}>{label}</span>
    </button>
  );
}

function HomePage({ t, M, quote, isNight, setMentorPick, balance, tx, goals, allGoals, goalDone, goalPct, setGoals, goalTemplates, setGoalTemplates, notes, setPage, setChatOpen, userId, authProfile, playlist, setCommunityOpen, reminders, openReminder, setLeaderboardOpen, setGoalTimerTarget, setAddGoalOpen, setScoreRulesOpen, cardShape, homeLayout }) {
  const [askConfirm, ConfirmUI] = useConfirm(t);
  const [viewingPinned, setViewingPinned] = useState(null);
  const [commentingId, setCommentingId] = useState(null);
  const pinnedMedia = (playlist || []).filter((p) => p.kind === "link" && p.pinnedHome);
  const [shareGoalOpen, setShareGoalOpen] = useState(false);
  const latestNote = notes[0];
  const todayNet = tx.filter((x) => x.date === todayStr()).reduce((s, x) => s + (x.type === "in" ? x.amount : -x.amount), 0);
  const shp = shapeTokens(cardShape, t); // 🔲 ทรงกรอบการ์ดที่ user เลือก (sharp/soft) ใช้กับ hero/CatCard/การ์ดชุมชนในหน้านี้

  // 🏆 คำนวณแต้ม + streak ที่ดีที่สุด จากข้อมูลเป้าหมายทั้งหมด (ไม่ใช่แค่วันนี้)
  const diffPoints = { easy: 1, normal: 2, hard: 3 }; // เก็บไว้เป็น fallback สำหรับเป้าหมายเก่าก่อนเปลี่ยนมาใช้ AI ประเมินคะแนน (g.points)
  const pointsInRange = (fromDate) => (allGoals || []).filter((g) => g.done && g.date && (!fromDate || g.date >= fromDate)).reduce((s, g) => s + (g.points ?? diffPoints[g.difficulty] ?? 2), 0);
  const weekStartStr = (() => { const d = new Date(); const dow = (d.getDay() + 6) % 7; d.setDate(d.getDate() - dow); return d.toISOString().slice(0, 10); })();
  const monthStartStr = todayStr().slice(0, 7) + "-01";
  const weekPoints = pointsInRange(weekStartStr);
  const monthPoints = pointsInRange(monthStartStr);
  const allTimePoints = pointsInRange(null);

  const bestStreak = (() => {
    const byText = {};
    (allGoals || []).forEach((g) => { if (!g.date) return; const k = g.text.trim().toLowerCase(); if (!k) return; (byText[k] = byText[k] || new Set()).add(g.done ? (g.doneDate || g.date) : null); });
    let best = 0;
    Object.values(byText).forEach((doneDatesSet) => {
      const set = new Set([...doneDatesSet].filter(Boolean));
      let streak = 0; let d = new Date();
      if (!set.has(todayStr())) d.setDate(d.getDate() - 1);
      while (set.has(d.toISOString().slice(0, 10))) { streak++; d.setDate(d.getDate() - 1); }
      if (streak > best) best = streak;
    });
    return best;
  })();
  const badge = bestStreak >= 100 ? "💎" : bestStreak >= 30 ? "🏆" : bestStreak >= 7 ? "🔥" : null;
  const badgeTier = bestStreak >= 100 ? 3 : bestStreak >= 30 ? 2 : bestStreak >= 7 ? 1 : 0; // ใช้กับ LanternIcon ในหน้า UI (badge ข้างบนยังเก็บ emoji ไว้ให้ข้อความแชร์ชุมชนใช้เหมือนเดิม)

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

  // 🌐 พรีวิว Community สำหรับการ์ดในหน้า Home (avatar คนโพสต์ล่าสุด + จำนวนโพสต์วันนี้)
  const [commPreview, setCommPreview] = useState({ avatars: [], newCount: 0, latest: "" });
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const { data: recent } = await supabase.from("posts").select("text, created_at, author:profiles!posts_author_id_fkey(name, avatar_url)").order("created_at", { ascending: false }).limit(10);
        if (!recent) return;
        const seen = new Set(); const avatars = [];
        for (const p of recent) { const a = p.author; if (a && !seen.has(a.name)) { seen.add(a.name); avatars.push(a); } if (avatars.length >= 4) break; }
        const dayAgo = Date.now() - 86400000;
        const newCount = recent.filter((p) => new Date(p.created_at) > dayAgo).length;
        setCommPreview({ avatars, newCount, latest: recent[0]?.text || recent[0]?.author?.name || "" });
      } catch (e) {}
    })();
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
      {homeLayout === "wallet" ? (
        <HomeWidgetsWallet t={t} shp={shp} M={M} isNight={isNight} setMentorPick={setMentorPick} setChatOpen={setChatOpen} balance={balance} todayNet={todayNet} goalDone={goalDone} goals={goals} todayArticles={todayArticles} latestNote={latestNote} setPage={setPage} setCommunityOpen={setCommunityOpen} commPreview={commPreview} />
      ) : homeLayout === "bento" ? (
        <HomeWidgetsBento t={t} shp={shp} M={M} isNight={isNight} setMentorPick={setMentorPick} balance={balance} todayNet={todayNet} goalDone={goalDone} goals={goals} todayArticles={todayArticles} latestNote={latestNote} setPage={setPage} setCommunityOpen={setCommunityOpen} commPreview={commPreview} />
      ) : (
        <>
      <div style={{ marginTop: 8, background: t.hero, border: `1px solid ${t.heroBorder}`, borderRadius: shp.radius, padding: 20, position: "relative", overflow: "hidden", boxShadow: isNight ? "none" : "0 10px 24px rgba(30,40,70,.18)" }}>
        <div style={{ position: "absolute", top: -34, right: -34, width: 130, height: 130, borderRadius: "50%", background: "rgba(255,255,255,.10)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -44, left: -24, width: 105, height: 105, borderRadius: "50%", background: "rgba(255,255,255,.06)", pointerEvents: "none" }} />
        <div style={{ position: "relative" }}>
          <button onClick={() => setMentorPick(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 14.5, fontWeight: 800, color: t.onAccent, letterSpacing: .5 }}>{isNight ? "โค้ชคืนนี้" : "โค้ชวันนี้"} · {M.name.toUpperCase()}</span>
            <span style={{ fontSize: 10, fontWeight: 800, color: "#D9302F" }}>เปลี่ยน ▾</span>
          </button>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, gap: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16.5, fontWeight: 700, color: t.onAccent, lineHeight: 1.4, minHeight: 46 }}>“{quote}”</div>
              <style>{`@keyframes rh-coach-nudge { 0%,88%,100% { transform: translateX(0) rotate(0); } 90% { transform: translateX(-2px) rotate(-1.5deg); } 92% { transform: translateX(2px) rotate(1.5deg); } 94% { transform: translateX(-2px) rotate(-1deg); } 96% { transform: translateX(2px) rotate(1deg); } 98% { transform: translateX(0) rotate(0); } }`}</style>
              <button onClick={() => setChatOpen(true)} style={{ marginTop: 14, border: "none", cursor: "pointer", background: `${t.onAccent}2E`, color: t.onAccent, fontWeight: 700, fontSize: 13, padding: "9px 16px", borderRadius: shp.radius === 0 ? 0 : 18, display: "inline-flex", alignItems: "center", gap: 6, animation: "rh-coach-nudge 3s ease-in-out infinite" }}>คุยกับโค้ช <ChevronRight size={15} /></button>
            </div>
            <Ring pct={goalPct} color={t.onAccent} label="เป้าหมาย" />
          </div>
        </div>
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: t.sub, margin: "22px 0 12px" }}>วิดเจ็ตของฉัน</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <CatCard t={t} shp={shp} k="green" icon={<Wallet size={15} color="#fff" />} label="การเงิน" onClick={() => setPage("ledger")}>
          <div style={{ fontSize: 19, fontWeight: 800, color: t.catTx.green }}>{fmt(balance)}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: todayNet >= 0 ? "#2E9E6B" : "#D9534F", marginTop: 2 }}>{todayNet >= 0 ? "▲ +" : "▼ "}{Math.abs(todayNet).toLocaleString()} วันนี้</div>
        </CatCard>
        <CatCard t={t} shp={shp} k="amber" icon={<BookOpen size={15} color="#fff" />} label="ความรู้วันนี้" onClick={() => setPage("ideas")}>
          <div style={{ fontSize: 14, fontWeight: 800, color: t.catTx.amber, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {todayArticles === null ? "กำลังโหลด..." : todayArticles.length === 0 ? "ยังไม่มีวันนี้" : todayArticles[0].title}
          </div>
          <div style={{ fontSize: 10.5, color: t.catLb.amber, marginTop: 3 }}>
            {todayArticles === null ? "" : todayArticles.length === 0 ? "แตะเพื่อดู" : `${todayArticles.length} บทความ · AI คัดให้`}
          </div>
        </CatCard>
        <CatCard t={t} shp={shp} k="coral" icon={<Target size={15} color="#fff" />} label="เป้าหมายวันนี้" onClick={() => setPage("goalsReport")}>
          <div style={{ fontSize: 16, fontWeight: 800, color: t.catTx.coral }}>{goalDone} / {goals.length || 0} สำเร็จ</div>
          <div style={{ height: 7, borderRadius: 4, background: "rgba(0,0,0,.1)", marginTop: 8, overflow: "hidden" }}><div style={{ width: `${goalPct}%`, height: "100%", background: "#E07B57" }} /></div>
        </CatCard>
        <CatCard t={t} shp={shp} k="violet" icon={<StickyNote size={15} color="#fff" />} label="โน้ตล่าสุด" onClick={() => setPage("note")}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: t.catTx.violet, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{latestNote ? latestNote.title || "(ไม่มีหัวข้อ)" : "ยังไม่มีโน้ต"}</div>
          <div style={{ fontSize: 10.5, color: t.catLb.violet, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{latestNote ? (blocksToPlainText(latestNote.body).trim() || "แตะเพื่อเปิด") : "แตะเพื่อเริ่ม"}</div>
        </CatCard>
      </div>

      {/* 🌐 การ์ดเข้าชุมชน — พรีวิวเนื้อหาจริง + ลูกโลกหมุน */}
      <button onClick={() => setCommunityOpen(true)} style={{ marginTop: 16, width: "100%", border: `1px solid ${t.border}`, cursor: "pointer", textAlign: "left", borderRadius: shp.radius, padding: 16, background: `linear-gradient(135deg, ${t.accent}22, ${t.surface})`, position: "relative", overflow: "hidden", boxShadow: shp.radius === 0 ? "none" : (t.star ? "none" : "0 8px 22px rgba(40,50,70,.10)") }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle, ${t.accent}33, transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <GlobeIcon size={40} accent={t.accent} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: t.text }}>ชุมชน</div>
              <div style={{ fontSize: 11, color: t.sub }}>โลกโซเชียลของ PKNOW</div>
            </div>
          </div>
          {commPreview.newCount > 0 && <div style={{ background: "#E0563E", color: "#fff", fontSize: 10.5, fontWeight: 800, padding: "3px 9px", borderRadius: 10 }}>{commPreview.newCount > 99 ? "99+" : commPreview.newCount} ใหม่</div>}
        </div>
        {commPreview.avatars.length > 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, position: "relative" }}>
            <div style={{ display: "flex" }}>
              {commPreview.avatars.map((a, i) => (
                <div key={i} style={{ width: 26, height: 26, borderRadius: 13, marginLeft: i === 0 ? 0 : -8, border: `2px solid ${t.surface}`, overflow: "hidden", background: colorFor(a.name || "?"), display: "grid", placeItems: "center", color: "#fff", fontSize: 11, fontWeight: 700 }}>
                  {a.avatar_url ? <img src={a.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (a.name || "?")[0]}
                </div>
              ))}
            </div>
            <span style={{ fontSize: 12, color: t.sub }}>แตะเพื่อดูโพสต์ล่าสุดของทุกคน</span>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: t.sub, marginTop: 12, position: "relative" }}>แตะเพื่อเข้าสู่โลกโซเชียล — โพสต์ แชร์ ติดตามกัน</div>
        )}
      </button>
        </>
      )}

      <div style={{ ...card(t), marginTop: 16, padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: t.text }}>เป้าหมายวันนี้</div>
          <button onClick={() => setPage("goalsReport")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: t.accent, fontSize: 11, fontWeight: 700 }}>ดูย้อนหลัง <ChevronRight size={13} /></button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, padding: "10px 12px", borderRadius: 12, background: `${t.accent}10` }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: t.text, display: "flex", alignItems: "center", gap: 4 }}>{weekPoints} แต้ม {badgeTier > 0 && <LanternIcon size={15} tier={badgeTier} />}
              <button onClick={() => setScoreRulesOpen(true)} style={{ width: 18, height: 18, borderRadius: 9, border: `1px solid ${t.accent}55`, background: `${t.accent}18`, color: t.accent, fontSize: 10, fontWeight: 800, cursor: "pointer", display: "grid", placeItems: "center", marginLeft: 2 }} title="กฎการนับคะแนน">i</button>
            </div>
            <div style={{ fontSize: 10.5, color: t.sub }}>สัปดาห์นี้ · เดือนนี้ {monthPoints} · สะสม {allTimePoints}{bestStreak > 0 ? ` · ต่อเนื่อง ${bestStreak} วัน` : ""}</div>
          </div>
          <button onClick={() => setLeaderboardOpen(true)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 11px", borderRadius: 10, border: "none", background: t.accent, color: t.onAccent, cursor: "pointer", fontSize: 11.5, fontWeight: 700 }}>🏆 กระดาน</button>
          <button onClick={() => openReminder("goal_summary", null, "เป้าหมายที่ยังไม่ทำวันนี้")} style={{ display: "flex", alignItems: "center", padding: "7px 9px", borderRadius: 10, border: `1px solid ${reminders.some((r) => r.targetType === "goal_summary") ? t.accent : t.border}`, background: "none", cursor: "pointer" }} title="ตั้งเตือนเป้าหมายที่ยังไม่ทำ">
            <Bell size={14} color={reminders.some((r) => r.targetType === "goal_summary") ? t.accent : t.sub} fill={reminders.some((r) => r.targetType === "goal_summary") ? t.accent : "none"} />
          </button>
          {badge && <button onClick={() => setShareGoalOpen(true)} style={{ display: "flex", alignItems: "center", padding: "7px 9px", borderRadius: 10, border: `1px solid ${t.border}`, background: "none", cursor: "pointer" }} title="แชร์ไปหน้าชุมชน"><Share2 size={14} color={t.sub} /></button>}
        </div>

        <div style={{ marginTop: 10, display: "flex", flexDirection: "column" }}>
          {goals.length === 0 && <div style={{ fontSize: 12.5, color: t.sub }}>ยังไม่มีเป้าหมาย เพิ่มอันแรกเลย 👇</div>}
          {goals.map((g, gi) => (
            <div key={g.id} style={{ borderTop: gi === 0 ? "none" : `1px solid ${t.border}`, paddingTop: gi === 0 ? 0 : 10, paddingBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <button onClick={() => { const nd = !g.done; const dd = nd ? todayStr() : null; setGoals((gs) => gs.map((x) => (x.id === g.id ? { ...x, done: nd, doneDate: dd } : x))); if (userId) { supabase.from("goals").update({ done: nd, done_date: dd }).eq("id", g.id).then(() => {}, () => {}); if (nd) logAudit(userId, "goals", "complete", "ทำเป้าหมายสำเร็จ"); } }} style={{ width: 22, height: 22, borderRadius: 7, border: `2px solid ${g.done ? t.accent : t.faint}`, background: g.done ? t.accent : "transparent", cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0, marginTop: 1 }}>{g.done && <Check size={14} color={t.onAccent} />}</button>
                {/* 💯 badge คะแนน — ความกว้างคงที่เสมอ (แม้ไม่มีคะแนนก็ยังกันที่ไว้) ล็อกตำแหน่งซ้ายบน ไม่ลอยตามความสูงข้อความที่ตัดบรรทัดอีกต่อไป */}
                <div style={{ width: 28, height: 20, flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: t.accent, background: g.points != null ? `${t.accent}18` : "transparent", borderRadius: 6 }}>{g.points != null ? `+${g.points}` : ""}</div>
                <button onClick={() => setCommentingId(commentingId === g.id ? null : g.id)} style={{ flex: 1, minWidth: 0, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
                  <div style={{ fontSize: 13.5, color: g.done ? t.sub : t.text, textDecoration: g.done ? "line-through" : "none", lineHeight: 1.5 }}>
                    {g.text}{g.template_id && <Repeat2 size={11} color={t.faint} style={{ marginLeft: 5, verticalAlign: "middle" }} />}
                  </div>
                  {g.comment && <div style={{ fontSize: 10.5, color: t.faint, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>💬 {g.comment}</div>}
                </button>
                <div style={{ display: "flex", gap: 4, flexShrink: 0, marginTop: 2 }}>
                  <button onClick={() => setCommentingId(commentingId === g.id ? null : g.id)} style={ghost} title="เพิ่มคอมเมนต์/สถานะ"><MessageCircle size={14} color={g.comment ? t.accent : t.faint} /></button>
                  {g.timerMode && <button onClick={() => setGoalTimerTarget(g)} style={{ ...ghost, display: "flex", alignItems: "center", gap: 3, border: `1px solid ${t.accent}55`, background: `${t.accent}12`, padding: "5px 8px" }} title="เริ่มจับเวลา"><Timer size={13} color={t.accent} /><span style={{ fontSize: 10.5, fontWeight: 700, color: t.accent }}>{formatTimerBadge(g.timerSeconds, g.timerUnit)}</span></button>}
                  <button onClick={() => openReminder("goal", g.id, g.text)} style={ghost} title="ตั้งเตือนเป้าหมายนี้"><Bell size={14} color={reminders.some((r) => r.targetType === "goal" && r.targetId === g.id) ? t.accent : t.faint} fill={reminders.some((r) => r.targetType === "goal" && r.targetId === g.id) ? t.accent : "none"} /></button>
                  <button onClick={() => askConfirm(`ลบเป้าหมาย "${g.text}" เลยไหม?`, () => { setGoals((gs) => gs.filter((x) => x.id !== g.id)); if (userId) { supabase.from("goals").delete().eq("id", g.id).then(() => {}, () => {}); logAudit(userId, "goals", "delete", "ลบเป้าหมาย"); } })} style={ghost}><Trash2 size={15} color={t.faint} /></button>
                </div>
              </div>
              {commentingId === g.id && (
                <div style={{ display: "flex", gap: 6, marginTop: 6, marginLeft: 32 }}>
                  <input
                    value={g.comment || ""}
                    autoFocus
                    onChange={(e) => {
                      const val = e.target.value;
                      setGoals((gs) => gs.map((x) => (x.id === g.id ? { ...x, comment: val } : x)));
                    }}
                    onBlur={async (e) => {
                      const val = e.target.value.trim();
                      setGoals((gs) => gs.map((x) => (x.id === g.id ? { ...x, comment: val || null } : x)));
                      if (userId && typeof supabase !== "undefined") {
                        await supabase.from("goals").update({ comment: val || null }).eq("id", g.id);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.target.blur(); // เมื่อกด Enter ให้หลุดโฟกัสเพื่อไปยิง onBlur เซฟให้อัตโนมัติ
                        setCommentingId(null);
                      }
                    }}
                    placeholder="คอมเมนต์/สถานะเล็กๆ เช่น 'ทำได้ครึ่งทาง'..."
                    style={{ ...input(t), fontSize: 12, padding: "6px 10px" }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <button onClick={() => setAddGoalOpen(true)} style={{ ...primaryBtn(t), width: "100%", padding: "11px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Plus size={16} /> เพิ่มเป้าหมาย</button>
        </div>
      </div>
      {shareGoalOpen && <ShareGoalModal t={t} userId={userId} authProfile={authProfile} weekPoints={weekPoints} bestStreak={bestStreak} badge={badge} close={() => setShareGoalOpen(false)} />}

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
      {ConfirmUI}
    </>
  );
}

// ---------------- Finance (full) ----------------
function FinancePage({ t, tx, setTx, categories, openAdd, openExport, userId, billReminders, billPayments, markBillPaid, setBillManagerOpen }) {
  const [askConfirm, ConfirmUI] = useConfirm(t);
  const [editingTx, setEditingTx] = useState(null);
  const [viewReceipt, setViewReceipt] = useState(null); // signed url ของรูปสลิป/ใบเสร็จที่กำลังดู
  const openReceipt = async (path) => {
    const { data, error } = await supabase.storage.from("receipts").createSignedUrl(path, 120);
    if (!error && data?.signedUrl) setViewReceipt(data.signedUrl);
  };
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
  const txPagination = usePagination(Object.keys(groups), 10); // 📄 แบ่งหน้าตามกลุ่มวันที่ (ไม่ตัดรายการของวันเดียวกันข้ามหน้า)

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

  // 💳 บิลที่ถึงกำหนด/เลยกำหนดแล้วยังไม่จ่าย เรียงตามวันครบกำหนดเก่าสุดก่อน (เร่งด่วนสุดขึ้นบน)
  const dueBills = [...billPayments].filter((p) => !p.paid && p.dueDate <= todayStr())
    .map((p) => ({ ...p, bill: billReminders.find((b) => b.id === p.billId) }))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <>
      <PageHead t={t} title="การเงิน" sub="รายรับ–รายจ่าย · ใช้ได้จริงทุกวัน" icon={<Wallet size={20} color={t.accent} />} />

      {/* 💳 เตือนจ่ายบิล — โชว์เฉพาะบิลที่ถึงกำหนด/เลยกำหนดแล้วยังไม่กดจ่าย */}
      {dueBills.length > 0 && (
        <div style={{ ...card(t), padding: 14, marginBottom: 10, border: `1.5px solid #D9534F` }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: "#D9534F", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><Bell size={14} color="#D9534F" /> บิลที่ต้องจ่าย ({dueBills.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {dueBills.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, background: t.inputBg }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{p.bill?.label || "บิล"}</div>
                  <div style={{ fontSize: 11, color: p.dueDate < todayStr() ? "#D9534F" : t.faint }}>{p.dueDate < todayStr() ? "เลยกำหนดแล้ว" : "ถึงกำหนดวันนี้"} · ฿{p.amount.toLocaleString()}</div>
                </div>
                <button onClick={() => markBillPaid(p.id)} style={{ ...primaryBtn(t), padding: "7px 14px", fontSize: 12 }}>จ่ายแล้ว</button>
              </div>
            ))}
          </div>
        </div>
      )}
      <button onClick={() => setBillManagerOpen(true)} style={{ ...card(t), width: "100%", padding: "10px 0", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer", fontSize: 12.5, fontWeight: 700, color: t.sub }}><Bell size={14} color={t.sub} /> จัดการบิลที่ต้องจ่าย</button>

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
      <PaginationBar t={t} page={txPagination.page} setPage={txPagination.setPage} totalPages={txPagination.totalPages} />
      {periodTx.length === 0 && <Empty t={t} text="ช่วงนี้ยังไม่มีรายการ" />}
      {txPagination.pageItems.map((d) => (
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
                  {x.receipt_path && <button onClick={() => openReceipt(x.receipt_path)} style={ghost} title="ดูรูปสลิป/ใบเสร็จ"><Receipt size={15} color={t.accent} /></button>}
                  <button onClick={() => setEditingTx(x)} style={ghost} title="แก้ไข"><Pencil size={15} color={t.faint} /></button>
                  <button onClick={() => askConfirm(`ลบรายการ "${x.note || (x.type === "in" ? "รายรับ" : "รายจ่าย")}" ฿${x.amount.toLocaleString()} เลยไหม?`, () => { setTx((l) => l.filter((y) => y.id !== x.id)); if (userId) { supabase.from("transactions").delete().eq("id", x.id).then(() => {}, () => {}); logAudit(userId, "finance", "delete", "ลบรายการการเงิน"); } })} style={ghost}><Trash2 size={15} color={t.faint} /></button>
                </div>
              </div>
            ); })}
          </div>
        </div>
      ))}
      <PaginationBar t={t} page={txPagination.page} setPage={txPagination.setPage} totalPages={txPagination.totalPages} />
      {editingTx && <EditTxModal t={t} x={editingTx} categories={categories} userId={userId} setTx={setTx} close={() => setEditingTx(null)} />}
      {viewReceipt && <ImageLightbox src={viewReceipt} onClose={() => setViewReceipt(null)} />}
      {ConfirmUI}
    </>
  );
}

// 💳 จัดการบิลที่ต้องจ่ายประจำ — เพิ่ม/ลบ/ดูสถานะรอบปัจจุบัน + กดจ่ายแล้ว/ย้อนกลับได้
function BillManagerModal({ t, billReminders, billPayments, addBillReminder, deleteBillReminder, markBillPaid, unmarkBillPaid, close }) {
  const [askConfirm, ConfirmUI] = useConfirm(t);
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [recurring, setRecurring] = useState(true);
  const [dueDay, setDueDay] = useState(5);
  const [dueDate, setDueDate] = useState(todayStr());
  const [busy, setBusy] = useState(false);
  const billPagination = usePagination(billReminders, 10); // 📄 แบ่งหน้าถ้าตั้งบิลไว้เกิน 10 รายการ

  const submitNew = async () => {
    if (!label.trim() || busy) return;
    setBusy(true);
    await addBillReminder({ label, amount: Number(amount) || 0, recurring, dueDay: Number(dueDay) || 1, dueDate, categoryId: null });
    setBusy(false);
    setLabel(""); setAmount(""); setAdding(false);
  };

  // หารอบล่าสุดของบิลนี้ (ที่ยังไม่ผ่านหรือรอบที่ผ่านล่าสุด) ไว้โชว์สถานะ + ปุ่มจ่ายแล้ว/ย้อนกลับ
  const latestPaymentOf = (billId) => {
    const rows = billPayments.filter((p) => p.billId === billId).sort((a, b) => b.dueDate.localeCompare(a.dueDate));
    return rows[0] || null;
  };

  return (
    <div style={{ ...overlay, zIndex: 60 }} onClick={close}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "24px 24px 0 0", padding: "20px 20px 28px", maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: t.text }}>บิลที่ต้องจ่าย</div>
          <button onClick={close} style={ghost}><X size={20} color={t.sub} /></button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          <PaginationBar t={t} page={billPagination.page} setPage={billPagination.setPage} totalPages={billPagination.totalPages} />
          {billReminders.length === 0 && <Empty t={t} text="ยังไม่มีบิลที่ตั้งไว้" />}
          {billPagination.pageItems.map((b) => {
            const latest = latestPaymentOf(b.id);
            return (
              <div key={b.id} style={{ ...card(t), padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 34, height: 34, borderRadius: 11, background: `${t.accent}22`, display: "grid", placeItems: "center", flexShrink: 0 }}><Bell size={16} color={t.accent} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{b.label}</div>
                    <div style={{ fontSize: 11, color: t.faint }}>{b.recurring ? `ทุกเดือน วันที่ ${b.dueDay}` : `ครั้งเดียว ${b.dueDate}`} · ฿{b.amount.toLocaleString()}</div>
                  </div>
                  <button onClick={() => askConfirm(`ลบบิล "${b.label}" เลยไหม?`, () => deleteBillReminder(b.id))} style={ghost}><Trash2 size={15} color={t.faint} /></button>
                </div>
                {latest && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8, paddingLeft: 44 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: latest.paid ? "#2E9E6B" : "#D9534F" }}>{latest.paid ? "✓ จ่ายแล้ว" : "ยังไม่จ่าย"} (รอบ {latest.dueDate})</span>
                    {latest.paid ? (
                      <button onClick={() => unmarkBillPaid(latest.id)} style={{ ...ghost, fontSize: 11 }}>ย้อนกลับ</button>
                    ) : (
                      <button onClick={() => markBillPaid(latest.id)} style={{ ...primaryBtn(t), padding: "5px 12px", fontSize: 11 }}>จ่ายแล้ว</button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <PaginationBar t={t} page={billPagination.page} setPage={billPagination.setPage} totalPages={billPagination.totalPages} />
        </div>

        {!adding ? (
          <button onClick={() => setAdding(true)} style={{ ...card(t), width: "100%", padding: "11px 0", border: `1.5px dashed ${t.border}`, cursor: "pointer", color: t.sub, fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Plus size={16} /> เพิ่มบิลใหม่</button>
        ) : (
          <div style={{ ...card(t), padding: 14 }}>
            <input autoFocus value={label} onChange={(e) => setLabel(e.target.value)} placeholder="ชื่อบิล เช่น บัตรเครดิตกสิกร" style={{ ...input(t), marginBottom: 10 }} />
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="จำนวนเงินโดยประมาณ" style={{ ...input(t), marginBottom: 10 }} />
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              {[[true, "ซ้ำทุกเดือน"], [false, "ครั้งเดียว"]].map(([v, lb]) => (
                <button key={String(v)} onClick={() => setRecurring(v)} style={{ flex: 1, padding: "9px 0", borderRadius: 12, cursor: "pointer", border: `1.5px solid ${recurring === v ? t.accent : t.border}`, fontWeight: 700, fontSize: 13, background: recurring === v ? t.accent : "transparent", color: recurring === v ? t.onAccent : t.sub }}>{lb}</button>
              ))}
            </div>
            {recurring ? (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: t.sub, marginBottom: 6 }}>ครบกำหนดทุกวันที่ (1-31)</div>
                <input type="number" min={1} max={31} value={dueDay} onChange={(e) => setDueDay(Math.min(31, Math.max(1, Number(e.target.value) || 1)))} style={input(t)} />
              </div>
            ) : (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: t.sub, marginBottom: 6 }}>วันครบกำหนด</div>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={input(t)} />
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setAdding(false)} style={{ ...ghost, flex: 1, textAlign: "center", border: `1px solid ${t.border}`, borderRadius: 10, padding: "9px 0" }}>ยกเลิก</button>
              <button onClick={submitNew} disabled={busy} style={{ ...primaryBtn(t), flex: 2 }}>{busy ? "กำลังบันทึก..." : "บันทึก"}</button>
            </div>
          </div>
        )}
      </div>
      {ConfirmUI}
    </div>
  );
}

// 🔔 ตั้งเตือนกลาง — ใช้ร่วมกันได้ทั้งโน้ตและเป้าหมาย (targetType/targetId ถูกส่งมาจากจุดที่เรียกใช้)
function ReminderModal({ t, targetType, targetId, label, existing, upsertReminder, deleteReminder, close }) {
  const [recurrence, setRecurrence] = useState(existing?.recurrence || "once");
  const [time, setTime] = useState(existing?.time || "09:00");
  const [specificDate, setSpecificDate] = useState(existing?.specificDate || todayStr());
  const [dayOfWeek, setDayOfWeek] = useState(existing?.dayOfWeek ?? 0);
  const [dayOfMonth, setDayOfMonth] = useState(existing?.dayOfMonth ?? 1);
  const [busy, setBusy] = useState(false);
  const dowLabels = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];

  const save = async () => {
    setBusy(true);
    await upsertReminder({ id: existing?.id, targetType, targetId, label, recurrence, time, specificDate, dayOfWeek, dayOfMonth });
    setBusy(false);
    close();
  };
  const remove = () => { if (existing?.id) deleteReminder(existing.id); close(); };

  return (
    <div style={overlay} onClick={close}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "24px 24px 0 0", padding: "20px 20px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: t.text }}>🔔 ตั้งเตือน</div>
          <button onClick={close} style={ghost}><X size={20} color={t.sub} /></button>
        </div>
        <div style={{ fontSize: 12.5, color: t.sub, marginBottom: 14 }}>{label}</div>

        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
          {[["once", "ครั้งเดียว"], ["daily", "รายวัน"], ["weekly", "รายสัปดาห์"], ["monthly", "รายเดือน"]].map(([v, lb]) => (
            <button key={v} onClick={() => setRecurrence(v)} style={{ flex: "1 0 45%", padding: "9px 0", borderRadius: 12, cursor: "pointer", border: `1.5px solid ${recurrence === v ? t.accent : t.border}`, fontWeight: 700, fontSize: 12.5, background: recurrence === v ? t.accent : "transparent", color: recurrence === v ? t.onAccent : t.sub }}>{lb}</button>
          ))}
        </div>

        {recurrence === "once" && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: t.sub, marginBottom: 6 }}>วันที่</div>
            <input type="date" value={specificDate} onChange={(e) => setSpecificDate(e.target.value)} style={input(t)} />
          </div>
        )}
        {recurrence === "weekly" && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: t.sub, marginBottom: 6 }}>ทุกวัน</div>
            <div style={{ display: "flex", gap: 6 }}>
              {dowLabels.map((d, i) => (
                <button key={i} onClick={() => setDayOfWeek(i)} style={{ flex: 1, padding: "8px 0", borderRadius: 10, cursor: "pointer", border: `1.5px solid ${dayOfWeek === i ? t.accent : t.border}`, fontWeight: 700, fontSize: 12, background: dayOfWeek === i ? t.accent : "transparent", color: dayOfWeek === i ? t.onAccent : t.sub }}>{d}</button>
              ))}
            </div>
          </div>
        )}
        {recurrence === "monthly" && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: t.sub, marginBottom: 6 }}>ทุกวันที่ (1-31)</div>
            <input type="number" min={1} max={31} value={dayOfMonth} onChange={(e) => setDayOfMonth(Math.min(31, Math.max(1, Number(e.target.value) || 1)))} style={input(t)} />
          </div>
        )}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: t.sub, marginBottom: 6 }}>เวลา</div>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={input(t)} />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {existing && <button onClick={remove} style={{ flex: 1, textAlign: "center", border: `1px solid #D9534F55`, borderRadius: 10, padding: "9px 0", background: "none", cursor: "pointer", color: "#D9534F", fontWeight: 700, fontSize: 13 }}>ลบการเตือน</button>}
          <button onClick={save} disabled={busy} style={{ ...primaryBtn(t), flex: 2, padding: "11px 0" }}>{busy ? "กำลังบันทึก..." : "บันทึก"}</button>
        </div>
      </div>
    </div>
  );
}


function AdminActivityPanel({ t, members }) {
  const [logs, setLogs] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: l } = await supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(300);
      const { data: f } = await supabase.from("feedback").select("*").order("created_at", { ascending: false }).limit(100);
      setLogs(l || []); setFeedback(f || []);
      setLoading(false);
    })();
  }, []);

  const memberOf = (id) => members.find((m) => m.id === id);
  const moduleLabel = { finance: "การเงิน", goals: "เป้าหมาย", notes: "โน้ต", community: "ชุมชน", mentor: "แชทโค้ช" };

  const days = []; for (let i = 13; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push(d.toISOString().slice(0, 10)); }
  const chartData = days.map((d) => {
    const dayLogs = logs.filter((x) => (x.created_at || "").slice(0, 10) === d);
    return {
      d: d.slice(5),
      การเงิน: dayLogs.filter((x) => x.module === "finance").length,
      เป้าหมาย: dayLogs.filter((x) => x.module === "goals").length,
      โน้ต: dayLogs.filter((x) => x.module === "notes").length,
      ชุมชน: dayLogs.filter((x) => x.module === "community").length,
      โค้ช: dayLogs.filter((x) => x.module === "mentor").length,
    };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ ...card(t), padding: 16 }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: t.text, marginBottom: 2 }}>ความเคลื่อนไหวในแอป</div>
        <div style={{ fontSize: 11, color: t.sub, marginBottom: 10 }}>14 วันล่าสุด · แยกตามหมวด (ไม่รวมรายละเอียดอ่อนไหว)</div>
        <div style={{ width: "100%", height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="d" tick={{ fontSize: 9, fill: t.sub }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="การเงิน" stackId="a" fill="#E8894A" />
              <Bar dataKey="เป้าหมาย" stackId="a" fill="#3DA5D9" />
              <Bar dataKey="โน้ต" stackId="a" fill="#7B6CB0" />
              <Bar dataKey="ชุมชน" stackId="a" fill="#C0658C" />
              <Bar dataKey="โค้ช" stackId="a" fill="#2E9E6B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: t.sub, marginBottom: 8 }}>รายการล่าสุด</div>
        {loading && <Empty t={t} text="กำลังโหลด..." />}
        {!loading && logs.length === 0 && <Empty t={t} text="ยังไม่มีความเคลื่อนไหว" />}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {logs.slice(0, 40).map((l) => { const m = memberOf(l.user_id); return (
            <div key={l.id} style={{ ...card(t), padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 9, background: colorFor(m?.name || "?"), color: "#fff", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{(m?.name || "?")[0]?.toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, color: t.text }}><b>{m?.name || "ไม่ทราบชื่อ"}</b> — {l.summary}</div>
                <div style={{ fontSize: 10.5, color: t.faint }}>{moduleLabel[l.module] || l.module} · {new Date(l.created_at).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}</div>
              </div>
            </div>
          ); })}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: t.sub, marginBottom: 8 }}>💬 ข้อเสนอแนะจากผู้ใช้</div>
        {!loading && feedback.length === 0 && <Empty t={t} text="ยังไม่มีข้อเสนอแนะ" />}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {feedback.map((f) => { const m = memberOf(f.user_id); return (
            <div key={f.id} style={{ ...card(t), padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                {m?.avatar_url ? <img src={m.avatar_url} alt="" style={{ width: 24, height: 24, borderRadius: 8, objectFit: "cover" }} /> : <div style={{ width: 24, height: 24, borderRadius: 8, background: colorFor(m?.name || "?"), color: "#fff", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 700 }}>{(m?.name || "?")[0]?.toUpperCase()}</div>}
                <div style={{ fontSize: 12, fontWeight: 700, color: t.text }}>{m?.name || m?.email || "ไม่ทราบชื่อ"}</div>
                <div style={{ fontSize: 10, color: t.faint, marginLeft: "auto" }}>{new Date(f.created_at).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}</div>
              </div>
              <div style={{ fontSize: 13, color: t.text, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{f.message}</div>
            </div>
          ); })}
        </div>
      </div>
    </div>
  );
}

function AdminNewsPanel({ t }) {
  const [disabledCats, setDisabledCats] = useState([]);
  const [defaultCat, setDefaultCat] = useState("tech");
  const [globalBlocked, setGlobalBlocked] = useState([]);
  const [knownSources, setKnownSources] = useState([]);
  const [pickedSource, setPickedSource] = useState("");
  const [topViews, setTopViews] = useState([]);
  const [topLikes, setTopLikes] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [customGroups, setCustomGroups] = useState([]);
  const [categoryLimits, setCategoryLimits] = useState({});
  const [newCatLabel, setNewCatLabel] = useState("");
  const [newCatQuery, setNewCatQuery] = useState("");
  const [newCatGroup, setNewCatGroup] = useState("");
  const [newGroupLabel, setNewGroupLabel] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: settings }, { data: blocked }, { data: statsData }, { data: likesData }, { data: allSources }] = await Promise.all([
      supabase.from("app_settings").select("*").in("key", ["news_disabled_categories", "news_default_category", "news_custom_categories", "news_custom_groups", "news_category_limits"]),
      supabase.from("blocked_news_sources_global").select("source").order("created_at", { ascending: false }),
      supabase.from("news_stats").select("*").order("views", { ascending: false }).limit(8),
      supabase.from("news_likes").select("link, title"),
      supabase.from("news_stats").select("source"),
    ]);
    const disabledRow = (settings || []).find((s) => s.key === "news_disabled_categories");
    const defaultRow = (settings || []).find((s) => s.key === "news_default_category");
    const customCatsRow = (settings || []).find((s) => s.key === "news_custom_categories");
    const customGroupsRow = (settings || []).find((s) => s.key === "news_custom_groups");
    const limitsRow = (settings || []).find((s) => s.key === "news_category_limits");
    setDisabledCats(disabledRow?.value || []);
    setDefaultCat(defaultRow?.value || "tech");
    setCustomCategories(customCatsRow?.value || []);
    setCustomGroups(customGroupsRow?.value || []);
    setCategoryLimits(limitsRow?.value || {});
    const blockedList = (blocked || []).map((x) => x.source);
    setGlobalBlocked(blockedList);
    // รวมชื่อแหล่งข่าวที่เคยเห็นจริงทั้งหมด (ไม่ซ้ำ) ตัดอันที่บล็อกไปแล้วออก เอาไว้ทำ dropdown เลือก
    const distinct = [...new Set((allSources || []).map((x) => x.source).filter(Boolean))].sort();
    setKnownSources(distinct.filter((s) => !blockedList.includes(s)));
    setTopViews(statsData || []);
    // นับไลค์รวมต่อข่าวเอง (Supabase client ไม่มี GROUP BY ตรงๆ)
    const likeCounts = {};
    (likesData || []).forEach((x) => {
      if (!likeCounts[x.link]) likeCounts[x.link] = { link: x.link, title: x.title, count: 0 };
      likeCounts[x.link].count++;
    });
    setTopLikes(Object.values(likeCounts).sort((a, b) => b.count - a.count).slice(0, 8));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const saveLimitFor = async (id, val) => {
    const n = Math.min(50, Math.max(1, parseInt(val, 10) || 10));
    const next = { ...categoryLimits, [id]: n };
    setCategoryLimits(next);
    await supabase.from("app_settings").upsert({ key: "news_category_limits", value: next });
  };

  const toggleCatDisabled = async (id) => {
    const next = disabledCats.includes(id) ? disabledCats.filter((x) => x !== id) : [...disabledCats, id];
    setDisabledCats(next);
    await supabase.from("app_settings").upsert({ key: "news_disabled_categories", value: next });
  };

  const saveDefaultCat = async (id) => {
    setDefaultCat(id);
    await supabase.from("app_settings").upsert({ key: "news_default_category", value: id });
  };

  const addCustomCategory = async () => {
    const label = newCatLabel.trim();
    const query = newCatQuery.trim() || label.replace(/^\S+\s/, "").trim() || label; // ถ้าไม่กรอกคำค้นหา ใช้ label (ตัด emoji นำหน้าออก) แทน
    if (!label) return;
    const id = "c_" + label.replace(/[^a-zA-Z0-9ก-๙]/g, "").slice(0, 20) + "_" + Math.random().toString(36).slice(2, 6);
    const next = [...customCategories, { id, label, query, groupId: newCatGroup || null }];
    setCustomCategories(next);
    setNewCatLabel(""); setNewCatQuery(""); setNewCatGroup("");
    await supabase.from("app_settings").upsert({ key: "news_custom_categories", value: next });
  };
  const removeCustomCategory = async (id) => {
    const next = customCategories.filter((c) => c.id !== id);
    setCustomCategories(next);
    await supabase.from("app_settings").upsert({ key: "news_custom_categories", value: next });
  };

  const addCustomGroup = async () => {
    const label = newGroupLabel.trim();
    if (!label) return;
    const id = "g_" + label.replace(/[^a-zA-Z0-9ก-๙]/g, "").slice(0, 20) + "_" + Math.random().toString(36).slice(2, 6);
    const next = [...customGroups, { id, label }];
    setCustomGroups(next);
    setNewGroupLabel("");
    await supabase.from("app_settings").upsert({ key: "news_custom_groups", value: next });
  };
  const removeCustomGroup = async (id) => {
    // ลบกลุ่มแล้ว ต้องเอาหมวดที่เคยอยู่ในกลุ่มนี้ออกมาเป็นเดี่ยว (ไม่ลบตัวหมวดหมู่ทิ้ง)
    const nextCats = customCategories.map((c) => (c.groupId === id ? { ...c, groupId: null } : c));
    const nextGroups = customGroups.filter((g) => g.id !== id);
    setCustomCategories(nextCats);
    setCustomGroups(nextGroups);
    await Promise.all([
      supabase.from("app_settings").upsert({ key: "news_custom_categories", value: nextCats }),
      supabase.from("app_settings").upsert({ key: "news_custom_groups", value: nextGroups }),
    ]);
  };

  const addGlobalBlock = async () => {
    const source = pickedSource;
    if (!source || globalBlocked.includes(source)) return;
    setGlobalBlocked((s) => [source, ...s]);
    setKnownSources((s) => s.filter((x) => x !== source));
    setPickedSource("");
    await supabase.from("blocked_news_sources_global").insert({ source });
  };
  const removeGlobalBlock = async (source) => {
    setGlobalBlocked((s) => s.filter((x) => x !== source));
    setKnownSources((s) => [...s, source].sort());
    await supabase.from("blocked_news_sources_global").delete().eq("source", source);
  };

  if (loading) return <Empty t={t} text="กำลังโหลด..." />;

  const allCatsForAdmin = [...NEWS_CATEGORIES.filter((c) => c.id !== "saved"), ...customCategories.map((c) => ({ id: c.id, label: c.label }))];
  const allGroupsForAdmin = [...NEWS_CATEGORY_GROUPS, ...customGroups];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ ...card(t), padding: 16 }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: t.text, marginBottom: 4 }}>➕ เพิ่มหมวดหมู่ข่าวใหม่</div>
        <div style={{ fontSize: 11, color: t.sub, marginBottom: 12 }}>ระบบจะดึงข่าวจาก Google News อัตโนมัติด้วยคำค้นหาที่ตั้งไว้ ไม่ต้องหา URL RSS เอง</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
          <input value={newCatLabel} onChange={(e) => setNewCatLabel(e.target.value)} placeholder="ชื่อหมวด เช่น ⚽ กีฬา" style={input(t)} />
          <input value={newCatQuery} onChange={(e) => setNewCatQuery(e.target.value)} placeholder="คำค้นหา (ไม่กรอกจะใช้ชื่อหมวดแทน) เช่น กีฬา ฟุตบอล" style={input(t)} />
          <select value={newCatGroup} onChange={(e) => setNewCatGroup(e.target.value)} style={{ ...input(t), appearance: "auto" }}>
            <option value="">ไม่อยู่ในกลุ่มไหน (แสดงเป็นปุ่มเดี่ยว)</option>
            {allGroupsForAdmin.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
          </select>
        </div>
        <button onClick={addCustomCategory} disabled={!newCatLabel.trim()} style={{ ...primaryBtn({ accent: t.accent, accent2: t.accent2, onAccent: t.onAccent }), padding: "10px 16px", width: "100%", opacity: newCatLabel.trim() ? 1 : .5 }}>เพิ่มหมวดหมู่</button>
        {customCategories.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
            {customCategories.map((c) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: 10, background: t.inputBg }}>
                <span style={{ fontSize: 12.5, color: t.text }}>{c.label} <span style={{ color: t.faint, fontSize: 10.5 }}>({c.query})</span></span>
                <button onClick={() => removeCustomCategory(c.id)} style={{ fontSize: 11, fontWeight: 700, color: "#D9534F", background: "none", border: "none", cursor: "pointer" }}>ลบ</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ ...card(t), padding: 16 }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: t.text, marginBottom: 4 }}>📁 เพิ่มกลุ่มหมวดหมู่ (accordion)</div>
        <div style={{ fontSize: 11, color: t.sub, marginBottom: 12 }}>เอาไว้จัดหลายหมวดให้พับเก็บอยู่ด้วยกันในเมนู เหมือน "ข่าว" / "ไลฟ์สไตล์"</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <input value={newGroupLabel} onChange={(e) => setNewGroupLabel(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCustomGroup()} placeholder="ชื่อกลุ่ม เช่น 🎓 การศึกษา" style={input(t)} />
          <button onClick={addCustomGroup} disabled={!newGroupLabel.trim()} style={{ ...primaryBtn({ accent: t.accent, accent2: t.accent2, onAccent: t.onAccent }), padding: "0 16px", opacity: newGroupLabel.trim() ? 1 : .5 }}>เพิ่ม</button>
        </div>
        {customGroups.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {customGroups.map((g) => (
              <div key={g.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: 10, background: t.inputBg }}>
                <span style={{ fontSize: 12.5, color: t.text }}>{g.label}</span>
                <button onClick={() => removeCustomGroup(g.id)} style={{ fontSize: 11, fontWeight: 700, color: "#D9534F", background: "none", border: "none", cursor: "pointer" }}>ลบกลุ่ม (หมวดในนั้นไม่หาย)</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ ...card(t), padding: 16 }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: t.text, marginBottom: 4 }}>📑 เปิด/ปิดหมวดข่าว</div>
        <div style={{ fontSize: 11, color: t.sub, marginBottom: 12 }}>หมวดที่ปิดจะไม่แสดงให้ทุกคนในบ้านเห็นเลย (ยกเว้น "บันทึกไว้" ที่เป็นของส่วนตัว)</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {allCatsForAdmin.map((c) => {
            const isOff = disabledCats.includes(c.id);
            return (
              <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: 10, background: t.inputBg }}>
                <span style={{ fontSize: 13, color: t.text }}>{c.label}</span>
                <button onClick={() => toggleCatDisabled(c.id)} style={{
                  width: 42, height: 24, borderRadius: 999, border: "none", cursor: "pointer", position: "relative",
                  background: isOff ? t.border : t.accent, transition: "background .15s",
                }}>
                  <span style={{ position: "absolute", top: 2, left: isOff ? 2 : 20, width: 20, height: 20, borderRadius: 999, background: "#fff", transition: "left .15s" }} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ ...card(t), padding: 16 }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: t.text, marginBottom: 4 }}>🔢 จำนวนข่าวต่อหมวด</div>
        <div style={{ fontSize: 11, color: t.sub, marginBottom: 12 }}>ตั้งได้สูงสุด 50 เรื่องต่อหมวด (ค่าเริ่มต้น 10 ถ้าไม่ได้ตั้ง)</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {allCatsForAdmin.map((c) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: 10, background: t.inputBg }}>
              <span style={{ fontSize: 13, color: t.text }}>{c.label}</span>
              <input
                type="number" min={1} max={50}
                defaultValue={categoryLimits[c.id] || 10}
                onBlur={(e) => saveLimitFor(c.id, e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
                style={{ width: 56, textAlign: "center", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: "6px 4px", fontSize: 13, color: t.text }}
              />
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...card(t), padding: 16 }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: t.text, marginBottom: 4 }}>🏁 หมวดเริ่มต้นสำหรับสมาชิกใหม่</div>
        <div style={{ fontSize: 11, color: t.sub, marginBottom: 12 }}>สมาชิกที่เพิ่งเข้ามาครั้งแรกจะเห็นหมวดนี้เป็นค่าเริ่มต้น</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {allCatsForAdmin.map((c) => (
            <button key={c.id} onClick={() => saveDefaultCat(c.id)} style={{
              padding: "8px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: "pointer",
              border: `1px solid ${defaultCat === c.id ? "transparent" : t.border}`,
              background: defaultCat === c.id ? t.accent : "transparent",
              color: defaultCat === c.id ? t.onAccent : t.sub,
            }}>{c.label}</button>
          ))}
        </div>
      </div>

      <div style={{ ...card(t), padding: 16 }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: t.text, marginBottom: 4 }}>🚫 บล็อกแหล่งข่าวทั้งบ้าน</div>
        <div style={{ fontSize: 11, color: t.sub, marginBottom: 12 }}>ต่างจากบล็อกส่วนตัว — อันนี้ทุกคนในบ้านจะไม่เห็นข่าวจากแหล่งนี้เลย</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <select value={pickedSource} onChange={(e) => setPickedSource(e.target.value)} style={{ ...input(t), appearance: "auto" }}>
            <option value="">— เลือกแหล่งข่าวที่จะบล็อก —</option>
            {knownSources.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={addGlobalBlock} disabled={!pickedSource} style={{ ...primaryBtn({ accent: t.accent, accent2: t.accent2, onAccent: t.onAccent }), padding: "0 16px", opacity: pickedSource ? 1 : .5 }}>บล็อก</button>
        </div>
        {knownSources.length === 0 && <div style={{ fontSize: 10.5, color: t.faint, marginBottom: 10 }}>ยังไม่มีข้อมูลแหล่งข่าว — ต้องให้สมาชิกเปิดอ่านข่าวในแอปก่อนสักครั้ง ระบบถึงจะรู้จักชื่อแหล่งข่าว</div>}
        {globalBlocked.length === 0 ? (
          <div style={{ fontSize: 11.5, color: t.faint }}>ยังไม่มีแหล่งข่าวที่บล็อกไว้</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {globalBlocked.map((s) => (
              <div key={s} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", borderRadius: 10, background: t.inputBg }}>
                <span style={{ fontSize: 12, color: t.text }}>{s}</span>
                <button onClick={() => removeGlobalBlock(s)} style={{ fontSize: 11, fontWeight: 700, color: t.accent, background: "none", border: "none", cursor: "pointer" }}>เลิกบล็อก</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ ...card(t), padding: 16 }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: t.text, marginBottom: 10 }}>📈 ข่าวยอดวิวสูงสุด (ทั้งบ้าน)</div>
        {topViews.length === 0 ? <div style={{ fontSize: 11.5, color: t.faint }}>ยังไม่มีข้อมูล</div> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {topViews.map((x, i) => (
              <a key={x.link} href={x.link} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: t.faint, width: 16 }}>{i + 1}</span>
                <span style={{ flex: 1, fontSize: 12.5, color: t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{x.title || x.link}</span>
                <span style={{ fontSize: 11, color: t.accent, fontWeight: 700, flexShrink: 0 }}>{x.views} วิว</span>
              </a>
            ))}
          </div>
        )}
      </div>

      <div style={{ ...card(t), padding: 16 }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: t.text, marginBottom: 10 }}>❤️ ข่าวยอดไลค์สูงสุด (ทั้งบ้าน)</div>
        {topLikes.length === 0 ? <div style={{ fontSize: 11.5, color: t.faint }}>ยังไม่มีข้อมูล</div> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {topLikes.map((x, i) => (
              <a key={x.link} href={x.link} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: t.faint, width: 16 }}>{i + 1}</span>
                <span style={{ flex: 1, fontSize: 12.5, color: t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{x.title || x.link}</span>
                <span style={{ fontSize: 11, color: "#E0245E", fontWeight: 700, flexShrink: 0 }}>{x.count} ไลค์</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 💡 หน้าแอดมิน "คำแนะนำการใช้งาน" — แก้ข้อความ/เปิดปิดคำแนะนำแต่ละจุดที่เดฟผูกไว้ในโค้ดแล้ว + ดูว่าสมาชิกกี่คนเคยเห็นแล้ว
// หมายเหตุ: แอดมินแก้ได้แค่ "ข้อความ" กับ "เปิด/ปิด" ของจุดที่มีอยู่แล้ว ไม่ได้เพิ่มจุดคำแนะนำใหม่เองได้ เพราะแต่ละจุดต้องผูกกับโค้ดตำแหน่งนั้นจริงๆ ก่อน (ต้องให้เดฟเพิ่มโค้ดก่อน)
function AdminHintsPanel({ t, totalMembers }) {
  const [hints, setHints] = useState([]); // [{key, locationLabel, body, active, editBody}]
  const [seenCounts, setSeenCounts] = useState({}); // { [key]: จำนวนคนที่เคยดู }
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);

  const load = async () => {
    setLoading(true);
    const { data: defs } = await supabase.from("hint_definitions").select("*").order("key");
    const { data: seenRows } = await supabase.from("hint_seen").select("hint_key");
    const counts = {};
    (seenRows || []).forEach((r) => { counts[r.hint_key] = (counts[r.hint_key] || 0) + 1; });
    setSeenCounts(counts);
    setHints((defs || []).map((h) => ({ key: h.key, locationLabel: h.location_label, body: h.body, active: h.active, editBody: h.body })));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async (key) => {
    const h = hints.find((x) => x.key === key);
    if (!h) return;
    setSavingKey(key);
    const { error } = await supabase.from("hint_definitions").update({ body: h.editBody }).eq("key", key);
    if (error) alert("บันทึกไม่สำเร็จ: " + error.message);
    else setHints((list) => list.map((x) => (x.key === key ? { ...x, body: x.editBody } : x)));
    setSavingKey(null);
  };
  const toggleActive = async (key, active) => {
    setHints((list) => list.map((x) => (x.key === key ? { ...x, active } : x)));
    await supabase.from("hint_definitions").update({ active }).eq("key", key);
  };

  if (loading) return <Empty t={t} text="กำลังโหลด..." />;

  return (
    <div>
      <div style={{ fontSize: 12, color: t.sub, marginBottom: 14, lineHeight: 1.6 }}>
        แก้ข้อความและเปิด/ปิดคำแนะนำ (coachmark) แต่ละจุดที่มีอยู่แล้วในแอปได้ที่นี่ — จุดใหม่ต้องให้เดฟเพิ่มโค้ดผูกตำแหน่งก่อน ถึงจะมาแก้ข้อความที่นี่ได้ ตัวเลข "เห็นแล้ว" นับจากสมาชิกที่อนุมัติแล้วทั้งหมด ({totalMembers} คน)
      </div>
      {hints.length === 0 && <Empty t={t} text="ยังไม่มีคำแนะนำที่ตั้งไว้ในระบบ" />}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {hints.map((h) => {
          const seen = seenCounts[h.key] || 0;
          const dirty = h.editBody !== h.body;
          return (
            <div key={h.key} style={{ ...card(t), padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: t.text }}>{h.locationLabel}</div>
                <button onClick={() => toggleActive(h.key, !h.active)} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: h.active ? "#2E9E6B" : t.faint }}>{h.active ? "เปิดอยู่" : "ปิดอยู่"}</span>
                  <div style={{ width: 34, height: 19, borderRadius: 10, background: h.active ? "#2E9E6B" : t.border, position: "relative", transition: "background .15s" }}>
                    <div style={{ position: "absolute", top: 2, left: h.active ? 17 : 2, width: 15, height: 15, borderRadius: 8, background: "#fff", transition: "left .15s" }} />
                  </div>
                </button>
              </div>
              <textarea value={h.editBody} onChange={(e) => setHints((list) => list.map((x) => (x.key === h.key ? { ...x, editBody: e.target.value } : x)))} rows={2} style={{ ...input(t), resize: "vertical", marginBottom: 8, fontFamily: "inherit" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: t.faint }}>เห็นแล้ว {seen} / {totalMembers} คน</span>
                {dirty && <button onClick={() => save(h.key)} disabled={savingKey === h.key} style={{ ...primaryBtn(t), padding: "6px 16px", fontSize: 12 }}>{savingKey === h.key ? "กำลังบันทึก..." : "บันทึก"}</button>}
              </div>
            </div>
          );
        })}
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
  const setCanUseCommunity = async (id, can_use_community) => { await supabase.from("profiles").update({ can_use_community }).eq("id", id); loadMembers(); };
  const setCanViewLocations = async (id, can_view_locations) => { const { error } = await supabase.from("profiles").update({ can_view_locations }).eq("id", id); if (error) { alert("ตั้งสิทธิ์ดูตำแหน่งไม่สำเร็จ: " + error.message); console.error(error); } loadMembers(); };
  const remindNotification = async (id) => { await supabase.from("profiles").update({ notif_reminder_at: new Date().toISOString() }).eq("id", id); loadMembers(); };
  const setPremiumAi = async (id, premium_ai) => { await supabase.from("profiles").update({ premium_ai }).eq("id", id); loadMembers(); };
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

      <div style={{ position: "relative", marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
          {[["overview", "ภาพรวม"], ["members", "สมาชิก"], ["activity", "กิจกรรม"], ["announce", "ประกาศ"], ["news", "ข่าวสาร"], ["hints", "คำแนะนำ"], ["add", "เพิ่มสมาชิก"]].map(([v, lb]) => (
            <button key={v} onClick={() => setTab(v)} style={{ flexShrink: 0, padding: "9px 16px", borderRadius: 12, cursor: "pointer", border: `1.5px solid ${tab === v ? t.accent : t.border}`, fontWeight: 700, fontSize: 12.5, background: tab === v ? t.accent : "transparent", color: tab === v ? t.onAccent : t.sub, whiteSpace: "nowrap" }}>{lb}</button>
          ))}
        </div>
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 2, width: 28, pointerEvents: "none", background: `linear-gradient(to right, transparent, ${t.bg})` }} />
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

      {tab === "activity" && <AdminActivityPanel t={t} members={members} />}
      {tab === "announce" && <AnnouncementsAdmin t={t} userId={userId} />}
      {tab === "news" && <AdminNewsPanel t={t} />}
      {tab === "hints" && <AdminHintsPanel t={t} totalMembers={members.filter((m) => m.approved).length} />}
      {tab === "add" && <AdminAddPinMember t={t} session={session} onCreated={loadMembers} />}

      {detailMember && (
        <ModalPortal>
          <MemberDetailModal
            t={t} m={detailMember} isSelf={detailMember.id === userId}
            isOnline={isOnline(detailMember.last_seen)}
            setApproved={setApproved} setRole={setRole} setCanChat={setCanChat} setCanUseCommunity={setCanUseCommunity} setCanViewLocations={setCanViewLocations} remindNotification={remindNotification} setPremiumAi={setPremiumAi}
            setMentorLimit={setMentorLimit} setTopicLimit={setTopicLimit} setDailyArticleLimit={setDailyArticleLimit} setCanRefreshArticles={setCanRefreshArticles} resetMentorPick={resetMentorPick}
            removeMember={removeMember}
            close={() => setDetailMember(null)}
          />
        </ModalPortal>
      )}
    </>
  );
}

function MemberDetailModal({ t, m, isSelf, isOnline, setApproved, setRole, setCanChat, setCanUseCommunity, setCanViewLocations, setMentorLimit, setTopicLimit, setDailyArticleLimit, setCanRefreshArticles, resetMentorPick, removeMember, remindNotification, setPremiumAi, close }) {
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
            <Row label="ชุมชน (Community)">
              <button onClick={() => setCanUseCommunity(m.id, !m.can_use_community)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 10, border: `1px solid ${m.can_use_community ? "#F2872E" : t.border}`, cursor: "pointer", background: m.can_use_community ? "#F2872E1A" : "none", color: m.can_use_community ? "#F2872E" : t.sub, fontSize: 12, fontWeight: 700 }}>🌐 {m.can_use_community ? "ปลดล็อกแล้ว" : "ล็อกอยู่ (กดเพื่อปลด)"}</button>
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
// ย่อตัวเลขกันล้นการ์ด: 1500 -> "1.5พัน", 1200000 -> "1.2ล้าน"
const fmtCount = (n) => {
  n = Number(n) || 0;
  if (n < 1000) return String(n);
  if (n < 999500) { const v = n / 1000; return (v < 10 ? v.toFixed(1).replace(/\.0$/, "") : Math.round(v)) + "พัน"; }
  const v = n / 1000000; return (v < 10 ? v.toFixed(1).replace(/\.0$/, "") : Math.round(v)) + "ล้าน";
};
// แยกข้อความออกเป็นส่วนๆ สำหรับไฮไลต์ #แท็ก และ @แท็กชื่อคน
// mentions: [{id, name}] รายชื่อคนที่ถูกแท็กจริงในข้อความนี้ (มาจาก mentioned_ids ที่บันทึกไว้ตอนโพสต์ — แม่นยำแม้ชื่อมีเว้นวรรค เพราะค้นหาด้วยชื่อเป๊ะๆ ไม่เดาขอบเขตคำ)
function splitRichText(text, mentions = []) {
  if (!text) return [];
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const found = (mentions || []).filter((m) => m?.name && text.includes(`@${m.name}`)).sort((a, b) => b.name.length - a.name.length);
  const mentionPattern = found.map((m) => esc(`@${m.name}`)).join("|");
  const pattern = mentionPattern ? `(${mentionPattern}|#[^\\s#]+)` : `(#[^\\s#]+)`;
  return text.split(new RegExp(pattern, "g")).filter((s) => s !== "").map((seg) => {
    if (seg.startsWith("#") && seg.length > 1) return { type: "tag", value: seg };
    const m = found.find((mm) => seg === `@${mm.name}`);
    if (m) return { type: "mention", value: seg, id: m.id };
    return { type: "text", value: seg };
  });
}
// แสดงข้อความที่มี #แท็ก / @แท็กชื่อคน กดได้ (ใช้ทั้งในโพสต์และคอมเมนต์)
function RichText({ text, mentions, t, onTag, onOpenProfile }) {
  return splitRichText(text, mentions).map((seg, i) => {
    if (seg.type === "tag") return <span key={i} role="button" onClick={(e) => { e.stopPropagation(); onTag?.(seg.value.slice(1)); }} style={{ color: t.accent, fontWeight: 700, cursor: "pointer" }}>{seg.value}</span>;
    if (seg.type === "mention") return <span key={i} role="button" onClick={(e) => { e.stopPropagation(); onOpenProfile?.(seg.id); }} style={{ color: t.accent, fontWeight: 700, cursor: "pointer" }}>{seg.value}</span>;
    return <span key={i}>{seg.value}</span>;
  });
}
// ช่องพิมพ์ที่พิมพ์ "@" แล้วเลือกคนได้ (แชร์ใช้ทั้งเขียนโพสต์และคอมเมนต์)
function MentionInput({ value, onChange, onSend, mentioned, setMentioned, t, placeholder, isTextarea, autoFocus, style }) {
  const [showList, setShowList] = useState(false);
  const [results, setResults] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!showList) return;
    const h = setTimeout(async () => {
      try {
        const { data } = await supabase.from("profiles").select("id, name, community_name, community_use_main, avatar_url, community_avatar").ilike("name", `%${query}%`).limit(6);
        setResults(data || []);
      } catch (e) { setResults([]); }
    }, 200);
    return () => clearTimeout(h);
  }, [query, showList]);

  const handleChange = (e) => {
    const v = e.target.value;
    onChange(v);
    const m = /@([^\s@#]*)$/.exec(v); // มี "@คำ" ค้างอยู่ท้ายข้อความไหม
    if (m) { setQuery(m[1]); setShowList(true); } else setShowList(false);
  };
  const pickPerson = (p) => {
    const name = (p.community_use_main === false && p.community_name) ? p.community_name : p.name || "ผู้ใช้";
    const next = value.replace(/@([^\s@#]*)$/, `@${name} `);
    onChange(next);
    setMentioned?.((list) => (list.some((x) => x.id === p.id) ? list : [...list, { id: p.id, name }]));
    setShowList(false);
  };

  return (
    <div style={{ position: "relative", flex: 1 }}>
      {showList && results.length > 0 && (
        <div style={{ position: "absolute", bottom: "100%", left: 0, right: 0, marginBottom: 6, background: t.page, border: `1px solid ${t.border}`, borderRadius: 12, boxShadow: "0 -4px 16px rgba(0,0,0,.15)", maxHeight: 180, overflowY: "auto", zIndex: 20 }}>
          {results.map((p) => {
            const nm = (p.community_use_main === false && p.community_name) ? p.community_name : p.name || "ผู้ใช้";
            const ava = (p.community_use_main === false && p.community_avatar) ? p.community_avatar : p.avatar_url;
            return (
              <button key={p.id} onClick={() => pickPerson(p)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                {ava ? <img src={ava} alt="" style={{ width: 26, height: 26, borderRadius: 13, objectFit: "cover" }} /> : <div style={{ width: 26, height: 26, borderRadius: 13, background: colorFor(nm), display: "grid", placeItems: "center", color: "#fff", fontSize: 11, fontWeight: 700 }}>{nm[0]}</div>}
                <span style={{ fontSize: 12.5, fontWeight: 700, color: t.text }}>{nm}</span>
              </button>
            );
          })}
        </div>
      )}
      {isTextarea ? (
        <textarea value={value} onChange={handleChange} placeholder={placeholder} autoFocus={autoFocus} style={style} />
      ) : (
        <input value={value} onChange={handleChange} onKeyDown={(e) => e.key === "Enter" && !showList && onSend?.()} placeholder={placeholder} style={style} />
      )}
    </div>
  );
}
// เวลาแบบย่อสำหรับโพสต์ในฟีด — ใหม่ๆ บอกเป็น "กี่นาที/ชม./วัน", เก่ากว่านั้นบอกวันที่+เวลา
const timeAgo = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return "เมื่อกี้";
  if (s < 3600) return `${Math.floor(s / 60)} นาที`;
  if (s < 86400) return `${Math.floor(s / 3600)} ชม.`;
  if (s < 604800) return `${Math.floor(s / 86400)} วัน`;
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleString("th-TH", { day: "numeric", month: "short", ...(sameYear ? {} : { year: "2-digit" }), hour: "2-digit", minute: "2-digit" }).replace(" น.", "");
};
// วันที่+เวลาเต็ม (ใช้ตอนกดดู / hover)
const fullDT = (ts) => {
  if (!ts) return "";
  return new Date(ts).toLocaleString("th-TH", { dateStyle: "long", timeStyle: "short" });
};

// 🌍 ลูกโลก — มีดาวข้างใน + เส้น grid หมุน (สีตามธีม ส่งผ่าน accent)
function GlobeIcon({ size = 40, accent = "#F2872E" }) {
  const stars = [[26, 22, 1.5], [58, 34, 1], [40, 55, 1.8], [70, 62, 1.2], [30, 74, 1], [78, 20, .9], [18, 45, 1.1], [52, 78, 1.3]];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", position: "relative", overflow: "hidden", background: `radial-gradient(circle at 32% 28%, ${accent}, ${accent}CC 55%, ${accent}66)`, boxShadow: `0 0 14px ${accent}8C`, flexShrink: 0 }}>
      <style>{`@keyframes rh-globe-spin { from { background-position: 0 0; } to { background-position: ${size}px 0; } } @keyframes rh-globe-twinkle { 0%,100% { opacity: .35; } 50% { opacity: 1; } }`}</style>
      <svg viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        {stars.map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="#FFFFFF" style={{ animation: `rh-globe-twinkle ${1.5 + (i % 4) * 0.4}s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }} />
        ))}
      </svg>
      <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(90deg, transparent 0 5px, rgba(255,255,255,.18) 5px 6px)", animation: "rh-globe-spin 3.5s linear infinite" }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", boxShadow: "inset -3px -3px 8px rgba(0,0,0,.4), inset 2px 2px 6px rgba(255,255,255,.25)" }} />
    </div>
  );
}

// 🌍 ลูกโลกหมุนได้ — ทางเข้า Community (ใช้ GlobeIcon ที่มีดาวข้างใน)
function SpinningGlobe({ onClick, size = 38, accent }) {
  return (
    <button onClick={onClick} title="เข้าสู่ชุมชน" style={{ background: "none", border: "none", padding: 0, cursor: "pointer", flexShrink: 0, lineHeight: 0 }}>
      <GlobeIcon size={size} accent={accent} />
    </button>
  );
}

// 🌐 หน้า Community เต็มจอ — ถ้าไม่มีสิทธิ์ใช้จะขึ้นชวนปลดล็อก (แบบ 2)
// ✨ ตราสัญลักษณ์ P..KNOW บนหัวฟีด — รวม 3 เอฟเฟค: จุดกระพริบ + แสงกวาด + เรืองแสง
function PKnowBanner({ accent = "#F2872E" }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 12 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&display=swap');
        @keyframes pkb-dot { 0%,100% { opacity:.5; transform: scale(.9) } 50% { opacity:1; transform: scale(1.15) } }
        @keyframes pkb-sweep { 0% { background-position: 140% 0 } 100% { background-position: -140% 0 } }
        @keyframes pkb-glow { 0%,100% { filter: drop-shadow(0 0 3px ${accent}55) } 50% { filter: drop-shadow(0 0 14px ${accent}) drop-shadow(0 0 26px ${accent}77) } }
        .pkb-wrap { display:inline-block; animation: pkb-glow 2.6s ease-in-out infinite; }
        .pkb-txt {
          font-family: Anton, Impact, 'Arial Black', sans-serif;
          font-size: 25px; letter-spacing: 1.5px; line-height: 1;
          background: linear-gradient(90deg, ${accent} 0%, #FFE0BB 45%, ${accent} 90%);
          background-size: 240% 100%;
          -webkit-background-clip: text; background-clip: text; color: transparent;
          animation: pkb-sweep 3s linear infinite;
        }
        .pkb-d { animation: pkb-dot 1.4s ease-in-out infinite; display:inline-block; color:${accent}; -webkit-text-fill-color:${accent}; }
        .pkb-d2 { animation-delay:.2s } .pkb-d3 { animation-delay:.4s }
      `}</style>
      <div className="pkb-wrap">
        <span className="pkb-txt">P<span className="pkb-d">.</span><span className="pkb-d pkb-d2">.</span><span className="pkb-d pkb-d3">.</span>KNOW</span>
      </div>
    </div>
  );
}

// 🛡️ ตัวดักจับ error — ถ้าส่วนไหนพัง จะโชว์ข้อความบอกแทนที่จะจอดำทั้งหน้า
class ErrorCatcher extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) { console.error("RefHub error:", err, info); }
  render() {
    if (this.state.err) {
      const t = this.props.t || {};
      return (
        <div style={{ padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 34, marginBottom: 10 }}>⚠️</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: t.text || "#fff", marginBottom: 6 }}>ส่วนนี้มีปัญหา</div>
          <div style={{ fontSize: 12, color: t.sub || "#999", lineHeight: 1.6, marginBottom: 14 }}>ลองปิดแล้วเปิดใหม่ ถ้ายังเป็นอยู่ ส่งข้อความข้างล่างนี้ให้ผู้ดูแล</div>
          <div style={{ fontSize: 11, color: "#E0563E", background: "rgba(224,86,62,.1)", border: "1px solid rgba(224,86,62,.3)", borderRadius: 10, padding: 12, textAlign: "left", wordBreak: "break-word", fontFamily: "monospace" }}>
            {String(this.state.err?.message || this.state.err)}
          </div>
          <button onClick={() => this.setState({ err: null })} style={{ marginTop: 14, padding: "10px 22px", borderRadius: 12, border: "none", background: t.accent || "#F2872E", color: t.onAccent || "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>ลองใหม่</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function CommunityOverlay({ t, userId, authProfile, session, openThread, close }) {
  const canUse = authProfile?.can_use_community || authProfile?.role === "admin";
  const [tab, setTab] = useState("feed"); // feed | search | activity | profile
  const [viewProfileId, setViewProfileId] = useState(userId);
  const [showSettings, setShowSettings] = useState(false);
  const [composing, setComposing] = useState(false);
  const [feedKey, setFeedKey] = useState(0); // บังคับรีโหลดฟีดหลังโพสต์ใหม่
  const [unread, setUnread] = useState(0);
  const openProfile = (id) => { setViewProfileId(id); setTab("profile"); };

  // นับแจ้งเตือนที่ยังไม่อ่าน
  useEffect(() => {
    if (!canUse || !userId) return;
    (async () => {
      try { const { count } = await supabase.from("community_activity").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("read", false); setUnread(count || 0); } catch (e) {}
    })();
  }, [userId, tab, canUse]);

  return (
    <ModalPortal>
      <div style={{ position: "fixed", inset: 0, background: t.page, zIndex: 100, display: "flex", flexDirection: "column" }}>
        {/* หัวแถบ */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 10px 12px", borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
          <button onClick={close} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 18, width: 36, height: 36, cursor: "pointer", display: "grid", placeItems: "center" }}><ArrowLeft size={18} color={t.text} /></button>
          <div style={{ display: "flex", alignItems: "center", gap: 9, flex: 1 }}>
            <GlobeIcon size={30} accent={t.accent} />
            <div style={{ fontSize: 17, fontWeight: 800, color: t.text }}>ชุมชน</div>
          </div>
          {canUse && <button onClick={() => setShowSettings(true)} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 18, width: 36, height: 36, cursor: "pointer", display: "grid", placeItems: "center" }}><Settings size={17} color={t.text} /></button>}
        </div>

        {/* เนื้อหา */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 10px 90px" }}>
          {!canUse ? (
            <div style={{ textAlign: "center", padding: "50px 20px" }}>
              <div style={{ width: 90, height: 90, borderRadius: 45, margin: "0 auto 22px", position: "relative", overflow: "hidden", background: `radial-gradient(circle at 32% 28%, ${t.accent}, ${t.accent}CC 60%, ${t.accent}66)`, boxShadow: `0 0 30px ${t.accent}66`, opacity: .6 }}>
                <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(90deg, transparent 0 10px, rgba(255,255,255,.20) 10px 12px)" }} />
                <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}><LockKeyhole size={34} color="#fff" /></div>
              </div>
              <div style={{ fontSize: 19, fontWeight: 800, color: t.text, marginBottom: 8 }}>โลกใบนี้ยังล็อกอยู่ 🔒</div>
              <div style={{ fontSize: 13.5, color: t.sub, lineHeight: 1.7, maxWidth: 300, margin: "0 auto 24px" }}>ชุมชนคือพื้นที่โซเชียลลับของ PKNOW — โพสต์ แชร์ ติดตามกันได้เหมือนโซเชียลส่วนตัว ต้องปลดล็อกสิทธิ์ก่อนถึงจะเข้าได้</div>
              <div style={{ ...card(t), padding: 16, maxWidth: 320, margin: "0 auto", textAlign: "left" }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: t.text, marginBottom: 10 }}>✨ ปลดล็อกแล้วได้อะไรบ้าง</div>
                {["📝 โพสต์รูป + ข้อความ", "❤️ ไลก์ · 💬 คอมเมนต์ · 🔁 รีโพสต์", "👥 ติดตามคนอื่น มีฟีดส่วนตัว", "🔖 บันทึกโพสต์แยกหมวดหมู่"].map((x, i) => (
                  <div key={i} style={{ fontSize: 12.5, color: t.sub, padding: "5px 0" }}>{x}</div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: t.faint, marginTop: 22 }}>ติดต่อแอดมินเพื่อขอปลดล็อกสิทธิ์ชุมชน</div>
            </div>
          ) : (
            <ErrorCatcher t={t}>
              {tab === "feed" && <CommunityFeed key={feedKey} t={t} userId={userId} session={session} onOpenProfile={openProfile} />}
              {tab === "search" && <CommunitySearch t={t} userId={userId} onOpenProfile={openProfile} />}
              {tab === "activity" && <CommunityActivity t={t} userId={userId} onOpenProfile={openProfile} />}
              {tab === "profile" && <CommunityProfile t={t} userId={userId} authProfile={authProfile} profileId={viewProfileId} session={session} onOpenProfile={(id) => setViewProfileId(id)} />}
            </ErrorCatcher>
          )}
        </div>

        {/* แท็บบาร์ล่าง 5 อัน (ปุ่มโพสต์อยู่กลาง) */}
        {canUse && (
          <div style={{ display: "flex", alignItems: "center", borderTop: `1px solid ${t.border}`, background: t.surface, padding: "8px 0 10px", flexShrink: 0 }}>
            {[{ k: "feed", Ic: Home, label: "ฟีด" }, { k: "search", Ic: Search, label: "ค้นหา" }].map((tb) => {
              const on = tab === tb.k, Ic = tb.Ic;
              return (
                <button key={tb.k} onClick={() => setTab(tb.k)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <Ic size={22} color={on ? t.accent : t.faint} fill={on ? t.accent : "none"} strokeWidth={2} />
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: on ? t.accent : t.faint }}>{tb.label}</span>
                </button>
              );
            })}
            {/* ปุ่มโพสต์กลาง — วงกลมใหญ่ */}
            <button onClick={() => setComposing(true)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center" }} title="โพสต์ใหม่">
              <span style={{ width: 52, height: 52, borderRadius: 26, background: t.accent, display: "grid", placeItems: "center", boxShadow: `0 4px 14px ${t.accent}66`, marginTop: -14 }}>
                <Plus size={26} color={t.onAccent} strokeWidth={2.6} />
              </span>
            </button>
            {[{ k: "activity", Ic: Heart, label: "กิจกรรม" }, { k: "profile", Ic: User, label: "ฉัน" }].map((tb) => {
              const on = tab === tb.k, Ic = tb.Ic;
              return (
                <button key={tb.k} onClick={() => { setTab(tb.k); if (tb.k === "profile") setViewProfileId(userId); }} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, position: "relative" }}>
                  <Ic size={22} color={on ? t.accent : t.faint} fill={on ? t.accent : "none"} strokeWidth={2} />
                  {tb.k === "activity" && unread > 0 && <span style={{ position: "absolute", top: -3, right: "50%", marginRight: -17, background: "#E0563E", color: "#fff", fontSize: 8.5, fontWeight: 800, borderRadius: 7, padding: "1px 5px" }}>{unread > 99 ? "99+" : unread}</span>}
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: on ? t.accent : t.faint }}>{tb.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      {showSettings && <CommunitySettings t={t} userId={userId} close={() => setShowSettings(false)} />}
      {composing && <ComposeModal t={t} userId={userId} onDone={() => { setComposing(false); setTab("feed"); setFeedKey((k) => k + 1); }} close={() => setComposing(false)} />}
    </ModalPortal>
  );
}

// 🔍 ค้นหาคนเพื่อไป follow
function CommunitySearch({ t, userId, onOpenProfile }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const h = setTimeout(async () => {
      if (!q.trim()) { setResults([]); return; }
      setLoading(true);
      try {
        const { data } = await supabase.from("profiles").select("id, name, avatar_url, community_name, community_avatar, community_use_main").ilike("name", `%${q.trim()}%`).limit(20);
        setResults((data || []).filter((p) => p.id !== userId));
      } catch (e) {}
      setLoading(false);
    }, 350);
    return () => clearTimeout(h);
  }, [q]);
  const nameOf = (p) => (p.community_use_main === false && p.community_name ? p.community_name : p.name) || "ผู้ใช้";
  const avaOf = (p) => (p.community_use_main === false && p.community_avatar ? p.community_avatar : p.avatar_url);

  return (
    <div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาชื่อคน..." autoFocus style={{ ...input(t), marginBottom: 14 }} />
      {loading && <div style={{ textAlign: "center", padding: 20, color: t.faint, fontSize: 13 }}>กำลังค้นหา...</div>}
      {!loading && q.trim() && results.length === 0 && <div style={{ textAlign: "center", padding: 20, color: t.faint, fontSize: 13 }}>ไม่พบใครชื่อนี้</div>}
      {results.map((p) => (
        <button key={p.id} onClick={() => onOpenProfile(p.id)} style={{ ...card(t), padding: 12, marginBottom: 8, width: "100%", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", border: `1px solid ${t.border}`, textAlign: "left" }}>
          {avaOf(p) ? <img src={avaOf(p)} alt="" style={{ width: 42, height: 42, borderRadius: 21, objectFit: "cover" }} /> : <div style={{ width: 42, height: 42, borderRadius: 21, background: colorFor(nameOf(p)), display: "grid", placeItems: "center", color: "#fff", fontWeight: 700 }}>{nameOf(p)[0]}</div>}
          <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{nameOf(p)}</div>
        </button>
      ))}
    </div>
  );
}

// รวมฟังก์ชันช่วยของ feed (โหลดโพสต์ + ไลก์ + คอมเมนต์)
function usePostActions(userId) {
  const toggleLike = async (postId, liked) => {
    if (liked) await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId);
    else await supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
  };
  return { toggleLike };
}

// การ์ดโพสต์ 1 อัน (ใช้ทั้งใน feed และหน้าโปรไฟล์)
function PostCard({ t, post, userId, onOpenProfile, onChanged, onTag }) {
  const [liked, setLiked] = useState(post.liked);
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentMentioned, setCommentMentioned] = useState([]); // [{id,name}] คนที่แท็กไว้ในคอมเมนต์ที่กำลังพิมพ์
  const [replyTo, setReplyTo] = useState(null); // { id, name } คอมเมนต์ที่กำลังตอบกลับอยู่
  const [editingCommentId, setEditingCommentId] = useState(null); // id คอมเมนต์ที่กำลังแก้ไขข้อความอยู่ (แบบเฟซบุ๊ก)
  const [editCommentText, setEditCommentText] = useState("");
  const [reposted, setReposted] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [showFullTime, setShowFullTime] = useState(false);
  const { toggleLike } = usePostActions(userId);
  const author = post.author || {};
  const orig = post.original; // ถ้าเป็นรีโพสต์ = โพสต์ต้นฉบับ

  const doLike = async () => {
    const nx = !liked; setLiked(nx); setLikeCount((c) => c + (nx ? 1 : -1));
    await toggleLike(post.id, liked);
    if (nx) logActivity({ userId: post.author_id, actorId: userId, type: "like", postId: post.id, preview: post.text || "" });
  };
  const loadComments = async () => {
    const { data } = await supabase.from("post_comments").select("*, author:profiles!post_comments_author_id_fkey(id, name, avatar_url, community_name, community_use_main)").eq("post_id", post.id).order("created_at", { ascending: true });
    const rows = data || [];
    if (rows.length === 0) { setComments([]); return; }
    const ids = rows.map((c) => c.id);
    const [{ data: likes }, { data: myLikes }] = await Promise.all([
      supabase.from("comment_likes").select("comment_id").in("comment_id", ids),
      supabase.from("comment_likes").select("comment_id").in("comment_id", ids).eq("user_id", userId),
    ]);
    const likeCountMap = {}; (likes || []).forEach((l) => { likeCountMap[l.comment_id] = (likeCountMap[l.comment_id] || 0) + 1; });
    const myLikedSet = new Set((myLikes || []).map((l) => l.comment_id));
    const byId = Object.fromEntries(rows.map((c) => [c.id, c]));
    const nameOf = (c) => c ? ((c.author?.community_use_main === false && c.author?.community_name ? c.author.community_name : c.author?.name) || "ผู้ใช้") : "";
    // ดึงชื่อคนที่ถูกแท็กในคอมเมนต์เหล่านี้
    const allMentionIds = [...new Set(rows.flatMap((c) => c.mentioned_ids || []))];
    let mentionMap = {};
    if (allMentionIds.length > 0) {
      const { data: mProfs } = await supabase.from("profiles").select("id, name, community_name, community_use_main").in("id", allMentionIds);
      (mProfs || []).forEach((p) => { mentionMap[p.id] = (p.community_use_main === false && p.community_name ? p.community_name : p.name) || "ผู้ใช้"; });
    }
    setComments(rows.map((c) => ({
      ...c,
      like_count: likeCountMap[c.id] || 0,
      liked: myLikedSet.has(c.id),
      replyToName: c.reply_to_id ? nameOf(byId[c.reply_to_id]) : null,
      mentions: (c.mentioned_ids || []).map((id) => ({ id, name: mentionMap[id] })).filter((m) => m.name),
    })));
  };
  const openComments = () => { setShowComments((s) => !s); if (!showComments) loadComments(); };
  const sendComment = async () => {
    const txt = commentText.trim(); if (!txt) return;
    setCommentText("");
    const mentionIds = commentMentioned.filter((m) => txt.includes(`@${m.name}`)).map((m) => m.id);
    setCommentMentioned([]);
    const replyingTo = replyTo; setReplyTo(null);
    const { data } = await supabase.from("post_comments").insert({ post_id: post.id, author_id: userId, text: txt, reply_to_id: replyingTo?.id || null, mentioned_ids: mentionIds }).select().maybeSingle();
    logActivity({ userId: post.author_id, actorId: userId, type: "comment", postId: post.id, preview: txt });
    if (replyingTo && replyingTo.authorId && replyingTo.authorId !== post.author_id) logActivity({ userId: replyingTo.authorId, actorId: userId, type: "comment", postId: post.id, preview: txt });
    mentionIds.forEach((id) => logActivity({ userId: id, actorId: userId, type: "mention", postId: post.id, preview: txt }));
    loadComments();
  };
  const toggleCommentLike = async (c) => {
    setComments((list) => list.map((x) => x.id === c.id ? { ...x, liked: !x.liked, like_count: x.like_count + (x.liked ? -1 : 1) } : x));
    if (c.liked) await supabase.from("comment_likes").delete().eq("comment_id", c.id).eq("user_id", userId);
    else { await supabase.from("comment_likes").insert({ comment_id: c.id, user_id: userId }); logActivity({ userId: c.author_id, actorId: userId, type: "like", postId: post.id, preview: c.text }); }
  };
  const startEditComment = (c) => { setEditingCommentId(c.id); setEditCommentText(c.text); };
  const saveEditComment = async (c) => {
    const txt = editCommentText.trim();
    setEditingCommentId(null);
    if (!txt || txt === c.text) return;
    const editedAt = new Date().toISOString();
    setComments((list) => list.map((x) => (x.id === c.id ? { ...x, text: txt, edited_at: editedAt } : x)));
    await supabase.from("post_comments").update({ text: txt, edited_at: editedAt }).eq("id", c.id);
  };
  const doRepost = async () => {
    if (reposted) return;
    setReposted(true);
    await supabase.from("posts").insert({ author_id: userId, text: "", images: [], repost_of: post.id });
    logActivity({ userId: post.author_id, actorId: userId, type: "repost", postId: post.id, preview: post.text || "" });
    onChanged?.();
  };
  const deletePost = async () => { await supabase.from("posts").delete().eq("id", post.id); logAudit(userId, "community", "delete", "ลบโพสต์ในชุมชน"); onChanged?.(); };
  const hideAuthor = async () => {
    const nm = (author.community_use_main === false && author.community_name ? author.community_name : author.name) || "คนนี้";
    if (!window.confirm(`ซ่อนโพสต์ของ ${nm} จากฟีด?\n(เลิกซ่อนได้ที่ ตั้งค่า > คนที่ซ่อนไว้)`)) return;
    await supabase.from("community_hidden").upsert({ user_id: userId, hidden_id: post.author_id });
    onChanged?.();
  };
  const [bookmarked, setBookmarked] = useState(post.bookmarked || false);
  const [showBmMenu, setShowBmMenu] = useState(false);
  const toggleBookmark = async () => {
    if (bookmarked) { setBookmarked(false); await supabase.from("post_bookmarks").delete().eq("user_id", userId).eq("post_id", post.id); }
    else setShowBmMenu(true); // เปิดให้เลือกหมวดก่อนบันทึก
  };
  const share = async () => {
    const text = (post.text || "") + "\n\n— แชร์จากชุมชน PKNOW";
    try {
      if (navigator.share) await navigator.share({ text });
      else { await navigator.clipboard.writeText(text); alert("คัดลอกข้อความโพสต์แล้ว"); }
    } catch (e) {}
  };
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.text || "");
  const saveEdit = async () => { await supabase.from("posts").update({ text: editText.trim() }).eq("id", post.id); setEditing(false); onChanged?.(); };
  const imgs = Array.isArray(post.images) ? post.images : [];

  return (
    <div style={{ ...card(t), padding: 14, marginBottom: 12 }}>
      {post.repost_of && <div style={{ fontSize: 11, color: t.faint, marginBottom: 8 }}>🔁 {(author.community_use_main === false && author.community_name ? author.community_name : author.name) || "มีคน"} รีโพสต์</div>}
      {(() => {
        const show = orig || { author, text: post.text, images: imgs, created_at: post.created_at };
        const a = show.author || author;
        const aName = (a.community_use_main === false && a.community_name ? a.community_name : a.name) || "ผู้ใช้";
        const aAva = a.community_use_main === false && a.community_avatar ? a.community_avatar : a.avatar_url;
        const showImgs = Array.isArray(show.images) ? show.images : [];
        return (
          <>
            <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
              <button onClick={() => onOpenProfile?.(a.id)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", flexShrink: 0 }}>
                {aAva ? <img src={aAva} alt="" style={{ width: 38, height: 38, borderRadius: 19, objectFit: "cover" }} /> : <div style={{ width: 38, height: 38, borderRadius: 19, background: colorFor(aName), display: "grid", placeItems: "center", color: "#fff", fontWeight: 700 }}>{aName[0]}</div>}
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button onClick={() => onOpenProfile?.(a.id)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 13.5, fontWeight: 800, color: t.text }}>{aName}</button>
                  <button onClick={(e) => { e.stopPropagation(); setShowFullTime((v) => !v); }} title={fullDT(show.created_at)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 11, color: t.faint, flexShrink: 0 }}>
                    {showFullTime ? fullDT(show.created_at) : timeAgo(show.created_at)}
                  </button>
                </div>
                {show.text && (
                  <div style={{ fontSize: 13.5, color: t.text, marginTop: 3, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                    <RichText text={show.text} mentions={show.mentions || post.mentions} t={t} onTag={onTag} onOpenProfile={onOpenProfile} />
                  </div>
                )}
              </div>
            </div>
            {showImgs.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: showImgs.length === 1 ? "1fr" : "1fr 1fr", gap: 6, marginBottom: 8, marginLeft: 48 }}>
                {showImgs.map((url, i) => <img key={i} src={url} alt="" onClick={() => setLightbox({ images: showImgs, index: i })} style={{ width: "100%", aspectRatio: showImgs.length === 1 ? "auto" : "1/1", maxHeight: showImgs.length === 1 ? 360 : "auto", objectFit: "cover", borderRadius: 12, cursor: "pointer" }} />)}
              </div>
            )}
          </>
        );
      })()}
      {/* ปุ่ม action */}
      <div style={{ display: "flex", gap: 20, marginLeft: 48, marginTop: 4, alignItems: "center" }}>
        <button onClick={doLike} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: liked ? "#E0245E" : t.faint }}>
          <Heart size={17} fill={liked ? "#E0245E" : "none"} color={liked ? "#E0245E" : t.faint} /> <span style={{ fontSize: 12 }}>{likeCount > 0 ? fmtCount(likeCount) : ""}</span>
        </button>
        <button onClick={openComments} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: t.faint }}>
          <MessageCircle size={17} color={t.faint} /> <span style={{ fontSize: 12 }}>{post.comment_count > 0 ? fmtCount(post.comment_count) : ""}</span>
        </button>
        <button onClick={doRepost} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: reposted ? "#2E9E6B" : t.faint }}>
          <Repeat2 size={18} color={reposted ? "#2E9E6B" : t.faint} />
        </button>
        <button onClick={share} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: t.faint }}>
          <Share2 size={16} color={t.faint} />
        </button>
        <button onClick={toggleBookmark} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: bookmarked ? t.accent : t.faint }}>
          <Bookmark size={16} fill={bookmarked ? t.accent : "none"} color={bookmarked ? t.accent : t.faint} />
        </button>
        {post.author_id === userId && !post.repost_of && <button onClick={() => { setEditText(post.text || ""); setEditing(true); }} style={{ background: "none", border: "none", cursor: "pointer", marginLeft: "auto", fontSize: 11, color: t.faint }}>แก้ไข</button>}
        {post.author_id === userId && <button onClick={deletePost} style={{ background: "none", border: "none", cursor: "pointer", marginLeft: post.repost_of ? "auto" : 12, fontSize: 11, color: t.faint }}>ลบ</button>}
        {post.author_id !== userId && <button onClick={hideAuthor} style={{ background: "none", border: "none", cursor: "pointer", marginLeft: "auto", fontSize: 11, color: t.faint }}>🙈 ซ่อน</button>}
      </div>
      {showBmMenu && <BookmarkPicker t={t} userId={userId} postId={post.id} onDone={() => { setShowBmMenu(false); setBookmarked(true); }} close={() => setShowBmMenu(false)} />}
      {/* คอมเมนต์ */}
      {showComments && (
        <div style={{ marginLeft: 48, marginTop: 12, borderTop: `1px solid ${t.border}`, paddingTop: 10 }}>
          {(() => {
            // 🧵 จัดกลุ่มคอมเมนต์เป็นเธรดแบบเฟซบุ๊ก/ไอจี — ตอบกลับกี่ต่อกี่ทอด ก็กองรวมอยู่ในบล็อกเดียวกับคอมเมนต์บนสุดของเธรดนั้น
            // นอกจากเป็นคอมเมนต์ใหม่ที่ไม่ได้ตอบใคร (reply_to_id เป็น null) ถึงจะขึ้นบล็อกใหม่แยกต่างหาก
            const byId = Object.fromEntries(comments.map((c) => [c.id, c]));
            const rootIdOf = (c, seen = new Set()) => {
              if (!c.reply_to_id || seen.has(c.id)) return c.id; // กันลูปเผื่อข้อมูลเพี้ยน
              seen.add(c.id);
              const parent = byId[c.reply_to_id];
              return parent ? rootIdOf(parent, seen) : c.id;
            };
            const groups = {}; const order = [];
            comments.forEach((c) => {
              const root = rootIdOf(c);
              if (!groups[root]) { groups[root] = []; order.push(root); }
              groups[root].push(c);
            });
            return order.map((rootId) => (
              <div key={rootId} style={{ marginBottom: 12 }}>
                {groups[rootId].map((c, idx) => {
                  const cName = (c.author?.community_use_main === false && c.author?.community_name ? c.author.community_name : c.author?.name) || "ผู้ใช้";
                  const isMine = c.author_id === userId;
                  const isEditing = editingCommentId === c.id;
                  return (
                    <div key={c.id} style={{ display: "flex", gap: 8, marginTop: idx > 0 ? 8 : 0, marginLeft: idx > 0 ? 30 : 0 }}>
                      <button onClick={() => onOpenProfile?.(c.author_id)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", flexShrink: 0 }}>
                        {c.author?.avatar_url ? <img src={c.author.avatar_url} alt="" style={{ width: idx > 0 ? 22 : 26, height: idx > 0 ? 22 : 26, borderRadius: 13, objectFit: "cover" }} /> : <div style={{ width: idx > 0 ? 22 : 26, height: idx > 0 ? 22 : 26, borderRadius: 13, background: colorFor(cName), display: "grid", placeItems: "center", color: "#fff", fontSize: 11, fontWeight: 700 }}>{cName[0]}</div>}
                      </button>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {idx > 0 && c.replyToName && <div style={{ fontSize: 10.5, color: t.faint, marginBottom: 1 }}>↳ ตอบกลับ {c.replyToName}</div>}
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: t.text }}>{cName}</span>
                        <span style={{ fontSize: 10, color: t.faint, marginLeft: 6 }} title={fullDT(c.created_at)}>{timeAgo(c.created_at)}</span>
                        {c.edited_at && <span style={{ fontSize: 10, color: t.faint, marginLeft: 4 }}>· แก้ไขแล้ว</span>}
                        {isEditing ? (
                          <div style={{ marginTop: 4 }}>
                            <textarea value={editCommentText} onChange={(e) => setEditCommentText(e.target.value)} autoFocus rows={2} style={{ ...input(t), fontSize: 12.5, resize: "vertical", width: "100%" }} />
                            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                              <button onClick={() => saveEditComment(c)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10.5, color: t.accent, fontWeight: 700 }}>บันทึก</button>
                              <button onClick={() => setEditingCommentId(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10.5, color: t.faint, fontWeight: 700 }}>ยกเลิก</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: 12.5, color: t.text, marginTop: 1, lineHeight: 1.4 }}><RichText text={c.text} mentions={c.mentions} t={t} onTag={onTag} onOpenProfile={onOpenProfile} /></div>
                        )}
                        {!isEditing && (
                          <div style={{ display: "flex", gap: 14, marginTop: 4 }}>
                            <button onClick={() => toggleCommentLike(c)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3, color: c.liked ? "#E0245E" : t.faint }}>
                              <Heart size={12.5} fill={c.liked ? "#E0245E" : "none"} color={c.liked ? "#E0245E" : t.faint} /> <span style={{ fontSize: 10.5 }}>{c.like_count > 0 ? fmtCount(c.like_count) : ""}</span>
                            </button>
                            <button onClick={() => setReplyTo({ id: c.id, name: cName, authorId: c.author_id })} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10.5, color: t.faint, fontWeight: 700 }}>ตอบกลับ</button>
                            {isMine && <button onClick={() => startEditComment(c)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10.5, color: t.faint, fontWeight: 700 }}>แก้ไข</button>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ));
          })()}
          {replyTo && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: `${t.accent}14`, borderRadius: 10, padding: "5px 10px", marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: t.sub, flex: 1 }}>กำลังตอบกลับ <b style={{ color: t.accent }}>{replyTo.name}</b></span>
              <button onClick={() => setReplyTo(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}><X size={13} color={t.faint} /></button>
            </div>
          )}
          <div style={{ display: "flex", gap: 6, marginTop: 8, alignItems: "flex-start" }}>
            <MentionInput value={commentText} onChange={setCommentText} onSend={sendComment} mentioned={commentMentioned} setMentioned={setCommentMentioned} t={t} placeholder={replyTo ? `ตอบกลับ ${replyTo.name}...` : "แสดงความเห็น... (พิมพ์ @ เพื่อแท็ก)"} style={{ ...input(t), fontSize: 12.5 }} />
            <button onClick={sendComment} style={{ ...primaryBtn({ accent: t.accent, accent2: t.accent2, onAccent: t.onAccent }), padding: "0 14px", height: 38 }}>ส่ง</button>
          </div>
        </div>
      )}
      {lightbox && <ImageLightbox images={lightbox.images} index={lightbox.index} onClose={() => setLightbox(null)} />}
      {editing && (
        <ModalPortal>
          <div style={overlayHi} onClick={() => setEditing(false)}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "20px 20px 0 0", padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <button onClick={() => setEditing(false)} style={{ background: "none", border: "none", color: t.sub, fontSize: 14, cursor: "pointer" }}>ยกเลิก</button>
                <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>แก้ไขโพสต์</div>
                <button onClick={saveEdit} style={{ background: "#F2872E", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, padding: "7px 16px", borderRadius: 10, cursor: "pointer" }}>บันทึก</button>
              </div>
              <textarea value={editText} onChange={(e) => setEditText(e.target.value)} autoFocus style={{ ...input(t), minHeight: 90, resize: "vertical", lineHeight: 1.5 }} />
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}

// หน้า Feed — โพสต์ของคนที่เรา follow (+ ตัวเราเอง) + ปุ่มโพสต์ใหม่
// ♡ หน้ากิจกรรม — ใครมาไลก์/คอมเมนต์/ติดตาม/รีโพสต์ ของเรา
function CommunityActivity({ t, userId, onOpenProfile }) {
  const [items, setItems] = useState(null);
  const [filter, setFilter] = useState("all"); // all | like | comment | follow

  const load = async () => {
    try {
      let q = supabase.from("community_activity").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(100);
      if (filter !== "all") q = q.eq("type", filter);
      const { data } = await q;
      const rows = data || [];
      const actorIds = [...new Set(rows.map((r) => r.actor_id))];
      let amap = {};
      if (actorIds.length > 0) {
        const { data: profs } = await supabase.from("profiles").select("id, name, avatar_url, community_name, community_avatar, community_use_main").in("id", actorIds);
        (profs || []).forEach((p) => { amap[p.id] = p; });
      }
      setItems(rows.map((r) => ({ ...r, actor: amap[r.actor_id] })));
      // mark อ่านแล้ว
      const unread = rows.filter((r) => !r.read).map((r) => r.id);
      if (unread.length > 0) supabase.from("community_activity").update({ read: true }).in("id", unread).then(() => {});
    } catch (e) { setItems([]); }
  };
  useEffect(() => { load(); }, [filter]);

  const nameOf = (p) => p ? ((p.community_use_main === false && p.community_name ? p.community_name : p.name) || "ผู้ใช้") : "ผู้ใช้";
  const avaOf = (p) => p ? (p.community_use_main === false && p.community_avatar ? p.community_avatar : p.avatar_url) : "";
  const verb = { like: "ถูกใจโพสต์ของคุณ", comment: "แสดงความเห็นในโพสต์ของคุณ", follow: "เริ่มติดตามคุณ", repost: "รีโพสต์โพสต์ของคุณ", follow_request: "ขอติดตามคุณ", mention: "แท็กคุณในโพสต์/คอมเมนต์" };
  const emo = { like: "❤️", comment: "💬", follow: "👥", repost: "🔁", follow_request: "🔔", mention: "📣" };

  // กดรับ / ปฏิเสธ คำขอติดตาม
  const respondRequest = async (actorId, accept) => {
    if (accept) await supabase.from("follows").update({ status: "accepted" }).eq("follower_id", actorId).eq("following_id", userId);
    else await supabase.from("follows").delete().eq("follower_id", actorId).eq("following_id", userId);
    await supabase.from("community_activity").delete().eq("user_id", userId).eq("actor_id", actorId).eq("type", "follow_request");
    load();
  };
  const chip = (k, label) => (
    <button onClick={() => setFilter(k)} style={{ padding: "6px 14px", borderRadius: 16, border: `1.5px solid ${filter === k ? t.accent : t.border}`, background: filter === k ? t.accent : "transparent", color: filter === k ? t.onAccent : t.sub, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>{label}</button>
  );

  return (
    <div>
      <div style={{ position: "relative", marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {chip("all", "ทั้งหมด")}{chip("like", "❤️ ถูกใจ")}{chip("comment", "💬 ความเห็น")}{chip("follow", "👥 ติดตาม")}
        </div>
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 4, width: 28, pointerEvents: "none", background: `linear-gradient(to right, transparent, ${t.bg})` }} />
      </div>
      {items === null ? <div style={{ textAlign: "center", padding: 30, color: t.faint, fontSize: 13 }}>กำลังโหลด...</div>
        : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 16px" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: t.text, marginBottom: 4 }}>ยังไม่มีกิจกรรม</div>
            <div style={{ fontSize: 12, color: t.sub }}>เมื่อมีคนถูกใจหรือแสดงความเห็นในโพสต์ของคุณ จะแสดงที่นี่</div>
          </div>
        ) : items.map((it) => (
          <button key={it.id} onClick={() => onOpenProfile?.(it.actor_id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 11, padding: "11px 4px", background: it.read ? "none" : `${t.accent}0D`, border: "none", borderBottom: `1px solid ${t.border}`, cursor: "pointer", textAlign: "left" }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              {avaOf(it.actor) ? <img src={avaOf(it.actor)} alt="" style={{ width: 40, height: 40, borderRadius: 20, objectFit: "cover" }} /> : <div style={{ width: 40, height: 40, borderRadius: 20, background: colorFor(nameOf(it.actor)), display: "grid", placeItems: "center", color: "#fff", fontWeight: 700 }}>{nameOf(it.actor)[0]}</div>}
              <span style={{ position: "absolute", bottom: -2, right: -4, fontSize: 13 }}>{emo[it.type]}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: t.text, lineHeight: 1.4 }}>
                <span style={{ fontWeight: 800 }}>{nameOf(it.actor)}</span> <span style={{ color: t.sub }}>{verb[it.type] || ""}</span>
              </div>
              {it.preview && <div style={{ fontSize: 11.5, color: t.faint, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.preview}</div>}
            </div>
            {it.type === "follow_request" ? (
              <span style={{ display: "flex", gap: 6, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                <span role="button" onClick={() => respondRequest(it.actor_id, true)} style={{ padding: "6px 12px", borderRadius: 10, background: t.accent, color: t.onAccent, fontSize: 11.5, fontWeight: 800, cursor: "pointer" }}>รับ</span>
                <span role="button" onClick={() => respondRequest(it.actor_id, false)} style={{ padding: "6px 10px", borderRadius: 10, border: `1px solid ${t.border}`, color: t.sub, fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>ปฏิเสธ</span>
              </span>
            ) : (
              <span title={fullDT(it.created_at)} style={{ fontSize: 10.5, color: t.faint, flexShrink: 0 }}>{timeAgo(it.created_at)}</span>
            )}
          </button>
        ))}
    </div>
  );
}

// บันทึกกิจกรรมเพื่อแจ้งเตือนเจ้าของโพสต์/คนถูกติดตาม (ไม่แจ้งถ้าทำกับตัวเอง)
async function logActivity({ userId, actorId, type, postId = null, preview = "" }) {
  if (!userId || !actorId || userId === actorId) return;
  try {
    // เช็คว่าเจ้าตัวเปิดรับแจ้งเตือนประเภทนี้ไหม (ปิดแล้วไม่ต้องบันทึก)
    const col = type === "like" ? "community_notify_like" : type === "comment" ? "community_notify_comment" : type === "follow" ? "community_notify_follow" : null;
    if (col) {
      const { data: p } = await supabase.from("profiles").select(col).eq("id", userId).maybeSingle();
      if (p && p[col] === false) return;
    }
    await supabase.from("community_activity").insert({ user_id: userId, actor_id: actorId, type, post_id: postId, preview: (preview || "").slice(0, 120) });
  } catch (e) {}
}

// เลือกหมวดตอนบันทึกโพสต์ (สร้างหมวดใหม่ได้ด้วย)
function BookmarkPicker({ t, userId, postId, onDone, close }) {
  const [cats, setCats] = useState([]);
  const [newCat, setNewCat] = useState("");
  const load = async () => { const { data } = await supabase.from("bookmark_categories").select("*").eq("user_id", userId).order("created_at"); setCats(data || []); };
  useEffect(() => { load(); }, []);
  const saveTo = async (categoryId) => {
    await supabase.from("post_bookmarks").upsert({ user_id: userId, post_id: postId, category_id: categoryId });
    onDone?.();
  };
  const addCat = async () => {
    const n = newCat.trim(); if (!n) return;
    const { data } = await supabase.from("bookmark_categories").insert({ user_id: userId, name: n }).select().maybeSingle();
    setNewCat(""); if (data) saveTo(data.id);
  };
  return (
    <ModalPortal>
      <div style={overlayHi} onClick={close}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "20px 20px 0 0", padding: 20, maxHeight: "70vh", overflowY: "auto" }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: t.text, marginBottom: 14, textAlign: "center" }}>🔖 บันทึกลงหมวด</div>
          <button onClick={() => saveTo(null)} style={{ width: "100%", ...card(t), padding: 13, marginBottom: 8, cursor: "pointer", border: `1px solid ${t.border}`, textAlign: "left", fontSize: 13, fontWeight: 700, color: t.text }}>📌 บันทึกทั่วไป (ไม่จัดหมวด)</button>
          {cats.map((c) => (
            <button key={c.id} onClick={() => saveTo(c.id)} style={{ width: "100%", ...card(t), padding: 13, marginBottom: 8, cursor: "pointer", border: `1px solid ${t.border}`, textAlign: "left", fontSize: 13, fontWeight: 700, color: t.text }}>📁 {c.name}</button>
          ))}
          <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
            <input value={newCat} onChange={(e) => setNewCat(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCat()} placeholder="+ สร้างหมวดใหม่..." style={{ ...input(t), flex: 1 }} />
            <button onClick={addCat} style={{ background: t.accent, border: "none", color: t.onAccent, fontWeight: 700, padding: "0 16px", borderRadius: 12, cursor: "pointer" }}>สร้าง</button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

// หน้าบันทึก (บุ๊กมาร์ก) — แยกตามหมวด กันรก
function CommunityBookmarks({ t, userId, onOpenProfile }) {
  const [cats, setCats] = useState([]);
  const [activeCat, setActiveCat] = useState("all"); // all | uncat | <catId>
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data: cs } = await supabase.from("bookmark_categories").select("*").eq("user_id", userId).order("created_at");
      setCats(cs || []);
      let q = supabase.from("post_bookmarks").select("post_id, category_id").eq("user_id", userId);
      if (activeCat === "uncat") q = q.is("category_id", null);
      else if (activeCat !== "all") q = q.eq("category_id", activeCat);
      const { data: bms } = await q;
      const ids = (bms || []).map((b) => b.post_id);
      if (ids.length === 0) { setPosts([]); setLoading(false); return; }
      const { data: raw } = await supabase.from("posts").select("*, author:profiles!posts_author_id_fkey(id, name, avatar_url, community_name, community_avatar, community_use_main)").in("id", ids).order("created_at", { ascending: false });
      const enriched = await enrichPosts(raw || [], userId);
      setPosts(enriched.map((p) => ({ ...p, bookmarked: true })));
    } catch (e) {}
    setLoading(false);
  };
  useEffect(() => { load(); }, [activeCat]);

  const chip = (k, label) => (
    <button onClick={() => setActiveCat(k)} style={{ padding: "6px 14px", borderRadius: 16, border: `1.5px solid ${activeCat === k ? t.accent : t.border}`, background: activeCat === k ? t.accent : "transparent", color: activeCat === k ? t.onAccent : t.sub, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>{label}</button>
  );

  return (
    <div>
      <div style={{ position: "relative", marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {chip("all", "ทั้งหมด")}
          {chip("uncat", "📌 ทั่วไป")}
          {cats.map((c) => chip(c.id, `📁 ${c.name}`))}
        </div>
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 4, width: 28, pointerEvents: "none", background: `linear-gradient(to right, transparent, ${t.bg})` }} />
      </div>
      {loading ? <div style={{ textAlign: "center", padding: 30, color: t.faint, fontSize: 13 }}>กำลังโหลด...</div>
        : posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 16px" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔖</div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: t.text, marginBottom: 4 }}>ยังไม่มีโพสต์ที่บันทึก</div>
            <div style={{ fontSize: 12, color: t.sub }}>กดไอคอน 🔖 ใต้โพสต์เพื่อบันทึกไว้อ่านทีหลัง</div>
          </div>
        ) : posts.map((p) => <PostCard key={p.id} t={t} post={p} userId={userId} onOpenProfile={onOpenProfile} onChanged={load} />)}
    </div>
  );
}

// ⚙️ ตั้งค่าชุมชน
function CommunitySettings({ t, userId, close }) {
  const [askConfirm, ConfirmUI] = useConfirm(t);
  const [cats, setCats] = useState([]);
  const [prefs, setPrefs] = useState(null); // { community_notify_like, ..., community_private }
  const [hidden, setHidden] = useState([]);

  const load = async () => {
    // แยก query แต่ละอันกันพัง — ถ้าตารางไหนยังไม่ถูกสร้าง (ยังไม่ได้รัน SQL) อันอื่นต้องยังทำงานได้
    try { const { data: cs } = await supabase.from("bookmark_categories").select("*").eq("user_id", userId).order("created_at"); setCats(cs || []); } catch (e) { setCats([]); }
    try { const { data: p } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle(); setPrefs(p || {}); } catch (e) { setPrefs({}); }
    try {
      const { data: hids } = await supabase.from("community_hidden").select("hidden_id").eq("user_id", userId);
      const ids = (hids || []).map((h) => h.hidden_id);
      if (ids.length > 0) {
        const { data: profs } = await supabase.from("profiles").select("id, name, avatar_url, community_name, community_use_main").in("id", ids);
        setHidden(profs || []);
      } else setHidden([]);
    } catch (e) { setHidden([]); }
  };
  useEffect(() => { load(); }, []);

  const setPref = async (key, val) => {
    setPrefs((p) => ({ ...p, [key]: val }));
    await supabase.from("profiles").update({ [key]: val }).eq("id", userId);
  };
  const delCat = async (id) => { await supabase.from("bookmark_categories").delete().eq("id", id); load(); };
  const unhide = async (id) => { await supabase.from("community_hidden").delete().eq("user_id", userId).eq("hidden_id", id); load(); };

  const Toggle = ({ on, onClick }) => (
    <button onClick={onClick} style={{ width: 44, height: 26, borderRadius: 13, background: on ? t.accent : t.border, position: "relative", border: "none", cursor: "pointer", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: 10, background: "#fff", transition: "left .2s" }} />
    </button>
  );
  const SettingRow = ({ label, sub, on, onClick }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "11px 0", borderBottom: `1px solid ${t.border}` }}>
      <div><div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{label}</div>{sub && <div style={{ fontSize: 11, color: t.faint, marginTop: 1 }}>{sub}</div>}</div>
      <Toggle on={on} onClick={onClick} />
    </div>
  );
  const secHead = (txt) => <div style={{ fontSize: 12, fontWeight: 800, color: t.faint, textTransform: "uppercase", letterSpacing: .5, margin: "20px 0 4px" }}>{txt}</div>;
  const nameOf = (p) => (p.community_use_main === false && p.community_name ? p.community_name : p.name) || "ผู้ใช้";

  return (
    <ModalPortal>
      <div style={overlayHi} onClick={close}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "20px 20px 0 0", padding: 20, maxHeight: "85vh", overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: t.text }}>⚙️ ตั้งค่าชุมชน</div>
            <button onClick={close} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} color={t.sub} /></button>
          </div>

          {prefs === null ? <div style={{ textAlign: "center", padding: 20, color: t.faint, fontSize: 13 }}>กำลังโหลด...</div> : (
            <>
              {secHead("🔔 การแจ้งเตือน (หน้ากิจกรรม)")}
              <SettingRow label="มีคนถูกใจโพสต์" on={prefs.community_notify_like !== false} onClick={() => setPref("community_notify_like", !(prefs.community_notify_like !== false))} />
              <SettingRow label="มีคนแสดงความเห็น" on={prefs.community_notify_comment !== false} onClick={() => setPref("community_notify_comment", !(prefs.community_notify_comment !== false))} />
              <SettingRow label="มีคนติดตามฉัน" on={prefs.community_notify_follow !== false} onClick={() => setPref("community_notify_follow", !(prefs.community_notify_follow !== false))} />

              {secHead("🔒 ความเป็นส่วนตัว")}
              <SettingRow label="โพสต์ส่วนตัว" sub={prefs.community_private ? "เฉพาะคนที่ติดตามฉันเท่านั้นที่เห็นโพสต์" : "ทุกคนในชุมชนเห็นโพสต์ของฉันได้"} on={!!prefs.community_private} onClick={() => setPref("community_private", !prefs.community_private)} />

              {secHead("🙈 คนที่ซ่อนไว้")}
              {hidden.length === 0 ? <div style={{ fontSize: 12.5, color: t.sub, padding: "8px 0" }}>ยังไม่ได้ซ่อนใคร — กด ⋯ บนโพสต์ของคนนั้นเพื่อซ่อน</div>
                : hidden.map((p) => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${t.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {p.avatar_url ? <img src={p.avatar_url} alt="" style={{ width: 32, height: 32, borderRadius: 16, objectFit: "cover" }} /> : <div style={{ width: 32, height: 32, borderRadius: 16, background: colorFor(nameOf(p)), display: "grid", placeItems: "center", color: "#fff", fontSize: 13, fontWeight: 700 }}>{nameOf(p)[0]}</div>}
                      <span style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{nameOf(p)}</span>
                    </div>
                    <button onClick={() => unhide(p.id)} style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: 10, padding: "5px 12px", cursor: "pointer", fontSize: 11.5, fontWeight: 700, color: t.text }}>เลิกซ่อน</button>
                  </div>
                ))}

              {secHead("📁 หมวดหมู่บันทึก")}
              {cats.length === 0 ? <div style={{ fontSize: 12.5, color: t.sub, padding: "8px 0" }}>ยังไม่มีหมวดหมู่ — สร้างได้ตอนกดบันทึกโพสต์</div>
                : cats.map((c) => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${t.border}` }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: t.text }}>📁 {c.name}</span>
                    <button onClick={() => askConfirm(`ลบหมวดหมู่ "${c.name}" เลยไหม?`, () => delCat(c.id))} style={{ background: "none", border: "none", cursor: "pointer" }}><Trash2 size={15} color="#D9534F" /></button>
                  </div>
                ))}
              <div style={{ fontSize: 11.5, color: t.faint, marginTop: 8 }}>ลบหมวดแล้วโพสต์ที่บันทึกไว้จะกลับไปอยู่ "ทั่วไป" ไม่หายไป</div>
            </>
          )}
        </div>
      </div>
      {ConfirmUI}
    </ModalPortal>
  );
}

function CommunityFeed({ t, userId, session, onOpenProfile }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [mode, setMode] = useState("explore"); // explore = โพสต์สาธารณะทุกคน / following = เฉพาะคนที่ติดตาม
  const [q, setQ] = useState("");              // คำค้น (ชื่อคน / ข้อความ / #แท็ก)
  const [who, setWho] = useState("all");       // all | mine

  // กรองในเครื่องทันที ไม่ต้องยิงเน็ตใหม่ -> ค้นหาไว
  const shown = React.useMemo(() => {
    let list = posts;
    if (who === "mine") list = list.filter((p) => p.author_id === userId);
    const kw = q.trim().toLowerCase();
    if (kw) {
      const isTag = kw.startsWith("#");
      const term = isTag ? kw.slice(1) : kw;
      list = list.filter((p) => {
        const src = p.original || p;
        const text = String(src.text || "").toLowerCase();
        if (isTag) return text.includes("#" + term);
        const a = src.author || {};
        const nm = String((a.community_use_main === false && a.community_name ? a.community_name : a.name) || "").toLowerCase();
        return text.includes(term) || nm.includes(term);
      });
    }
    return list;
  }, [posts, q, who, userId]);

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: fol }, { data: hid }] = await Promise.all([
        supabase.from("follows").select("following_id").eq("follower_id", userId).eq("status", "accepted"),
        supabase.from("community_hidden").select("hidden_id").eq("user_id", userId),
      ]);
      const hiddenSet = new Set((hid || []).map((h) => h.hidden_id));
      const followSet = new Set((fol || []).map((f) => f.following_id));
      const sel = "*, author:profiles!posts_author_id_fkey(id, name, avatar_url, community_name, community_avatar, community_use_main, community_private)";
      let raw = [];

      if (mode === "following") {
        // เฉพาะคนที่ติดตาม + ตัวเราเอง (เห็นได้ทั้งโพสต์สาธารณะและเฉพาะผู้ติดตาม)
        const ids = [...followSet, userId].filter((id) => !hiddenSet.has(id));
        const { data } = await supabase.from("posts").select(sel).in("author_id", ids).order("created_at", { ascending: false }).limit(100);
        raw = data || [];
      } else {
        // สำรวจ: โพสต์สาธารณะของทุกคน + โพสต์ของเราเอง
        const { data } = await supabase.from("posts").select(sel).eq("visibility", "public").order("created_at", { ascending: false }).limit(100);
        raw = (data || []).filter((p) => {
          if (hiddenSet.has(p.author_id)) return false;                      // คนที่เราซ่อนไว้
          if (p.author_id === userId) return true;                           // ของเราเองเห็นเสมอ
          if (p.author?.community_private) return followSet.has(p.author_id); // บัญชีส่วนตัวต้องติดตามก่อน
          return true;
        });
      }
      setPosts(await enrichPosts(raw, userId));
    } catch (e) {}
    setLoading(false);
  };
  useEffect(() => { load(); }, [userId, mode]);

  return (
    <div>
      <PKnowBanner accent={t.accent} />

      {/* สลับมุมมองฟีด */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 4 }}>
        {[{ k: "explore", lb: "🌐 สำรวจ" }, { k: "following", lb: "👥 ติดตามอยู่" }].map((o) => (
          <button key={o.k} onClick={() => setMode(o.k)} style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: "none", cursor: "pointer", background: mode === o.k ? t.accent : "none", color: mode === o.k ? t.onAccent : t.sub, fontSize: 12.5, fontWeight: 700 }}>{o.lb}</button>
        ))}
      </div>

      {/* ค้นหาแบบไว — พิมพ์ชื่อคน / ข้อความ / #แท็ก */}
      <div style={{ position: "relative", marginBottom: 10 }}>
        <Search size={15} color={t.faint} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาชื่อคน ข้อความ หรือ #แท็ก" style={{ ...input(t), paddingLeft: 34, paddingRight: q ? 34 : 14 }} />
        {q && <button onClick={() => setQ("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4 }}><X size={15} color={t.faint} /></button>}
      </div>

      {/* ตัวกรอง */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, overflowX: "auto", paddingBottom: 2 }}>
        {[{ k: "all", lb: "ทั้งหมด" }, { k: "mine", lb: "📝 ของฉัน" }].map((o) => (
          <button key={o.k} onClick={() => setWho(o.k)} style={{ padding: "6px 14px", borderRadius: 16, border: `1.5px solid ${who === o.k ? t.accent : t.border}`, background: who === o.k ? t.accent : "transparent", color: who === o.k ? t.onAccent : t.sub, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>{o.lb}</button>
        ))}
      </div>

      <button onClick={() => setComposing(true)} style={{ ...card(t), padding: 12, marginBottom: 14, width: "100%", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", border: `1px solid ${t.border}`, textAlign: "left" }}>
        <div style={{ width: 34, height: 34, borderRadius: 17, background: t.accent, display: "grid", placeItems: "center", flexShrink: 0 }}><Plus size={18} color={t.onAccent} /></div>
        <span style={{ fontSize: 13, color: t.sub }}>มีอะไรใหม่...</span>
      </button>
      {loading ? (
        <div style={{ textAlign: "center", padding: 30, color: t.faint, fontSize: 13 }}>กำลังโหลด...</div>
      ) : shown.length === 0 ? (
        <div style={{ textAlign: "center", padding: "30px 16px" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>{q ? "🔍" : mode === "explore" ? "🌱" : "👥"}</div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: t.text, marginBottom: 4 }}>{q ? "ไม่พบโพสต์ที่ตรงกับที่ค้นหา" : who === "mine" ? "คุณยังไม่มีโพสต์" : mode === "explore" ? "ยังไม่มีโพสต์สาธารณะ" : "ยังไม่มีโพสต์จากคนที่ติดตาม"}</div>
          <div style={{ fontSize: 12, color: t.sub, lineHeight: 1.6 }}>{q ? "ลองพิมพ์คำอื่น หรือกด ✕ เพื่อล้างการค้นหา" : who === "mine" ? "กดปุ่มโพสต์เพื่อเริ่มเขียนอันแรก" : mode === "explore" ? "ลองโพสต์อะไรสักอย่างเป็นคนแรก" : "ลองกดแท็บ \"สำรวจ\" เพื่อหาคนน่าสนใจไปติดตาม"}</div>
        </div>
      ) : shown.map((p) => <PostCard key={p.id} t={t} post={p} userId={userId} onOpenProfile={onOpenProfile} onChanged={load} onTag={(tag) => setQ("#" + tag)} />)}
      {composing && <ComposeModal t={t} userId={userId} onDone={() => { setComposing(false); load(); }} close={() => setComposing(false)} />}
    </div>
  );
}

// เติมข้อมูล like/comment count + สถานะ liked + โพสต์ต้นฉบับ (สำหรับรีโพสต์)
async function enrichPosts(raw, userId) {
  if (raw.length === 0) return [];
  const ids = raw.map((p) => p.id);
  const [{ data: likes }, { data: myLikes }, { data: comments }, { data: myBms }] = await Promise.all([
    supabase.from("post_likes").select("post_id").in("post_id", ids),
    supabase.from("post_likes").select("post_id").in("post_id", ids).eq("user_id", userId),
    supabase.from("post_comments").select("post_id").in("post_id", ids),
    supabase.from("post_bookmarks").select("post_id").in("post_id", ids).eq("user_id", userId),
  ]);
  const likeCount = {}, commentCount = {}; const myLiked = new Set((myLikes || []).map((l) => l.post_id)); const myBm = new Set((myBms || []).map((b) => b.post_id));
  (likes || []).forEach((l) => { likeCount[l.post_id] = (likeCount[l.post_id] || 0) + 1; });
  (comments || []).forEach((c) => { commentCount[c.post_id] = (commentCount[c.post_id] || 0) + 1; });
  // โหลดโพสต์ต้นฉบับของรีโพสต์
  const repostIds = raw.filter((p) => p.repost_of).map((p) => p.repost_of);
  let origMap = {};
  if (repostIds.length > 0) {
    const { data: origs } = await supabase.from("posts").select("*, author:profiles!posts_author_id_fkey(id, name, avatar_url, community_name, community_avatar, community_use_main)").in("id", repostIds);
    (origs || []).forEach((o) => { origMap[o.id] = o; });
  }
  // แปะชื่อคนที่ถูกแท็ก (@) ให้แต่ละโพสต์ ไว้ให้ RichText ไฮไลต์ได้ถูกคน
  const allMentionIds = [...new Set(raw.flatMap((p) => p.mentioned_ids || []).concat(Object.values(origMap).flatMap((o) => o.mentioned_ids || [])))];
  let mentionMap = {};
  if (allMentionIds.length > 0) {
    const { data: mProfs } = await supabase.from("profiles").select("id, name, community_name, community_use_main").in("id", allMentionIds);
    (mProfs || []).forEach((p) => { mentionMap[p.id] = (p.community_use_main === false && p.community_name ? p.community_name : p.name) || "ผู้ใช้"; });
  }
  const namesFor = (ids) => (ids || []).map((id) => ({ id, name: mentionMap[id] })).filter((m) => m.name);
  Object.values(origMap).forEach((o) => { o.mentions = namesFor(o.mentioned_ids); });
  return raw.map((p) => ({ ...p, like_count: likeCount[p.id] || 0, comment_count: commentCount[p.id] || 0, liked: myLiked.has(p.id), bookmarked: myBm.has(p.id), original: p.repost_of ? origMap[p.repost_of] : null, mentions: namesFor(p.mentioned_ids) }));
}

// หน้าโปรไฟล์ — โพสต์ของคนนั้น + จำนวนผู้ติดตาม + ปุ่ม follow
function CommunityProfile({ t, userId, profileId, session, onOpenProfile }) {
  const [prof, setProf] = useState(null);
  const [posts, setPosts] = useState([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followState, setFollowState] = useState("none"); // none | pending | accepted
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [listModal, setListModal] = useState(null); // "followers" | "following" | null
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [lockedPrivate, setLockedPrivate] = useState(false);
  const [avatarZoom, setAvatarZoom] = useState(null); // URL รูปโปรไฟล์ที่กดดูแบบเต็มจอ
  const isMe = profileId === userId;

  // ชื่อ/รูปที่ใช้จริง (ถ้าตั้งแยก social ใช้ค่านั้น ไม่งั้นใช้ของโปรไฟล์หลัก)
  const effName = prof ? ((prof.community_use_main === false && prof.community_name) ? prof.community_name : prof.name) || "ผู้ใช้" : "";
  const effAva = prof ? ((prof.community_use_main === false && prof.community_avatar) ? prof.community_avatar : prof.avatar_url) : "";

  const load = async () => {
    setLoading(true);
    try {
      // ใช้ select("*") กันเคสคอลัมน์ใหม่ยังไม่ถูกสร้าง (ยังไม่ได้รัน SQL) แล้วทำให้โปรไฟล์ว่างทั้งหน้า
      const { data: p } = await supabase.from("profiles").select("*").eq("id", profileId).maybeSingle();
      setProf(p);
      // เช็คว่าเราติดตามเขาอยู่ไหม (ใช้ทั้งปุ่ม follow และเช็คสิทธิ์ดูโพสต์ส่วนตัว)
      let iFollow = false;
      if (!isMe) {
        const { data: f } = await supabase.from("follows").select("*").eq("follower_id", userId).eq("following_id", profileId).maybeSingle();
        iFollow = f?.status === "accepted"; setFollowState(f ? (f.status || "accepted") : "none");
      }
      // โพสต์ส่วนตัว: เห็นได้เฉพาะเจ้าตัว หรือคนที่ติดตามเขาอยู่
      const blocked = !isMe && p?.community_private && !iFollow;
      setLockedPrivate(blocked);
      if (blocked) setPosts([]);
      else {
        let q = supabase.from("posts").select("*, author:profiles!posts_author_id_fkey(id, name, avatar_url, community_name, community_avatar, community_use_main)").eq("author_id", profileId);
        // ถ้าไม่ใช่เจ้าตัวและยังไม่ได้ติดตาม -> เห็นเฉพาะโพสต์สาธารณะ
        if (!isMe && !iFollow) q = q.eq("visibility", "public");
        const { data: raw } = await q.order("created_at", { ascending: false }).limit(100);
        setPosts(await enrichPosts(raw || [], userId));
      }
      const [{ count: fc }, { count: fgc }] = await Promise.all([
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", profileId).eq("status", "accepted"),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", profileId).eq("status", "accepted"),
      ]);
      setFollowerCount(fc || 0); setFollowingCount(fgc || 0);
    } catch (e) {}
    setLoading(false);
  };
  useEffect(() => { load(); }, [profileId]);

  const toggleFollow = async () => {
    if (followState === "none") {
      // บัญชีส่วนตัว -> ส่งคำขอรออนุมัติ / บัญชีทั่วไป -> ติดตามได้เลย
      const needApprove = !!prof?.community_private;
      await supabase.from("follows").insert({ follower_id: userId, following_id: profileId, status: needApprove ? "pending" : "accepted" });
      setFollowState(needApprove ? "pending" : "accepted");
      if (!needApprove) setFollowerCount((c) => c + 1);
      logActivity({ userId: profileId, actorId: userId, type: needApprove ? "follow_request" : "follow" });
    } else {
      // ยกเลิกคำขอ หรือ เลิกติดตาม
      if (followState === "accepted") setFollowerCount((c) => Math.max(0, c - 1));
      await supabase.from("follows").delete().eq("follower_id", userId).eq("following_id", profileId);
      setFollowState("none");
    }
  };

  if (loading) return <div style={{ textAlign: "center", padding: 30, color: t.faint, fontSize: 13 }}>กำลังโหลด...</div>;
  if (!prof) return <div style={{ textAlign: "center", padding: 30, color: t.faint, fontSize: 13 }}>ไม่พบโปรไฟล์</div>;

  return (
    <div>
      <div style={{ ...card(t), padding: 18, marginBottom: 14, textAlign: "center" }}>
        {effAva ? (
          <button onClick={() => setAvatarZoom(effAva)} title="แตะเพื่อดูรูปเต็ม" style={{ background: "none", border: "none", padding: 0, cursor: "zoom-in", display: "block", margin: "0 auto 10px", position: "relative", lineHeight: 0 }}>
            <img src={effAva} alt="" style={{ width: 88, height: 88, borderRadius: 44, objectFit: "cover", border: `2.5px solid ${t.accent}`, boxShadow: `0 0 0 4px ${t.accent}22` }} />
            <span style={{ position: "absolute", bottom: 2, right: 2, width: 24, height: 24, borderRadius: 12, background: t.accent, display: "grid", placeItems: "center", border: `2px solid ${t.page}` }}>
              <Search size={11} color={t.onAccent} strokeWidth={3} />
            </span>
          </button>
        ) : (
          <div style={{ width: 88, height: 88, borderRadius: 44, background: colorFor(effName), display: "grid", placeItems: "center", color: "#fff", fontSize: 34, fontWeight: 700, margin: "0 auto 10px" }}>{effName[0]}</div>
        )}
        <div style={{ fontSize: 17, fontWeight: 800, color: t.text }}>{effName}</div>
        {prof.community_bio && <div style={{ fontSize: 12.5, color: t.sub, marginTop: 5, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{prof.community_bio}</div>}
        <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 12 }}>
          <button onClick={() => setListModal("followers")} style={{ background: "none", border: "none", cursor: "pointer" }}><div style={{ fontSize: 16, fontWeight: 800, color: t.text }}>{fmtCount(followerCount)}</div><div style={{ fontSize: 11, color: t.sub }}>ผู้ติดตาม</div></button>
          <button onClick={() => setListModal("following")} style={{ background: "none", border: "none", cursor: "pointer" }}><div style={{ fontSize: 16, fontWeight: 800, color: t.text }}>{fmtCount(followingCount)}</div><div style={{ fontSize: 11, color: t.sub }}>กำลังติดตาม</div></button>
          <div><div style={{ fontSize: 16, fontWeight: 800, color: t.text }}>{fmtCount(posts.length)}</div><div style={{ fontSize: 11, color: t.sub }}>โพสต์</div></div>
        </div>
        {isMe ? (
          <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "center" }}>
            <button onClick={() => setEditing(true)} style={{ padding: "9px 20px", borderRadius: 12, border: `1px solid ${t.border}`, background: "none", color: t.text, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>แก้ไขโปรไฟล์</button>
            <button onClick={() => setShowBookmarks(true)} style={{ padding: "9px 20px", borderRadius: 12, border: `1px solid ${t.border}`, background: "none", color: t.text, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}><Bookmark size={14} color={t.text} /> บันทึกไว้</button>
          </div>
        ) : (
          <button onClick={toggleFollow} style={{ marginTop: 14, padding: "9px 28px", borderRadius: 12, border: followState === "none" ? "none" : `1px solid ${t.border}`, background: followState === "none" ? t.accent : "none", color: followState === "none" ? t.onAccent : t.sub, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{followState === "accepted" ? "กำลังติดตาม" : followState === "pending" ? "⏳ รออนุมัติ" : "ติดตาม"}</button>
        )}
      </div>
      {lockedPrivate ? (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ width: 60, height: 60, borderRadius: 30, background: `${t.accent}1A`, display: "grid", placeItems: "center", margin: "0 auto 14px" }}><LockKeyhole size={26} color={t.accent} /></div>
          <div style={{ fontSize: 14.5, fontWeight: 800, color: t.text, marginBottom: 5 }}>บัญชีนี้เป็นส่วนตัว</div>
          <div style={{ fontSize: 12.5, color: t.sub, lineHeight: 1.6, maxWidth: 260, margin: "0 auto" }}>กดติดตามเพื่อดูโพสต์ของ {effName}</div>
        </div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: "center", padding: 30, color: t.faint, fontSize: 13 }}>ยังไม่มีโพสต์</div>
      ) : posts.map((p) => <PostCard key={p.id} t={t} post={p} userId={userId} onOpenProfile={onOpenProfile} onChanged={load} />)}
      {avatarZoom && <ImageLightbox src={avatarZoom} onClose={() => setAvatarZoom(null)} />}
      {editing && <EditCommunityProfile t={t} userId={userId} prof={prof} onDone={() => { setEditing(false); load(); }} close={() => setEditing(false)} />}
      {showBookmarks && (
        <ModalPortal>
          <div style={{ position: "fixed", inset: 0, background: t.page, zIndex: 110, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 10px 12px", borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
              <button onClick={() => setShowBookmarks(false)} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 18, width: 36, height: 36, cursor: "pointer", display: "grid", placeItems: "center" }}><ArrowLeft size={18} color={t.text} /></button>
              <div style={{ fontSize: 16, fontWeight: 800, color: t.text }}>🔖 โพสต์ที่บันทึกไว้</div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 10px 40px" }}>
              <CommunityBookmarks t={t} userId={userId} onOpenProfile={onOpenProfile} />
            </div>
          </div>
        </ModalPortal>
      )}
      {listModal && <FollowListModal t={t} type={listModal} profileId={profileId} userId={userId} onOpenProfile={(id) => { setListModal(null); onOpenProfile(id); }} close={() => setListModal(null)} />}
    </div>
  );
}

// แก้ไขโปรไฟล์ชุมชน — bio + เลือกใช้ชื่อ/รูปหลัก หรือตั้งใหม่
function EditCommunityProfile({ t, userId, prof, onDone, close }) {
  const [useMain, setUseMain] = useState(prof.community_use_main !== false);
  const [name, setName] = useState(prof.community_name || "");
  const [avatar, setAvatar] = useState(prof.community_avatar || "");
  const [bio, setBio] = useState(prof.community_bio || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const uploadAvatar = async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    setUploading(true);
    try {
      const path = `community/avatar-${userId}-${crypto.randomUUID()}.jpg`;
      const { error } = await supabase.storage.from("attachments").upload(path, f);
      if (!error) { const { data } = supabase.storage.from("attachments").getPublicUrl(path); setAvatar(data.publicUrl); }
    } catch (e) {}
    setUploading(false);
  };
  const save = async () => {
    setSaving(true);
    await supabase.from("profiles").update({ community_bio: bio.trim(), community_use_main: useMain, community_name: name.trim(), community_avatar: avatar }).eq("id", userId);
    setSaving(false); onDone?.();
  };

  return (
    <ModalPortal>
      <div style={overlayHi} onClick={close}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "20px 20px 0 0", padding: 20, maxHeight: "85vh", overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <button onClick={close} style={{ background: "none", border: "none", color: t.sub, fontSize: 14, cursor: "pointer" }}>ยกเลิก</button>
            <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>แก้ไขโปรไฟล์</div>
            <button onClick={save} disabled={saving} style={{ background: "#F2872E", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, padding: "7px 16px", borderRadius: 10, cursor: "pointer", opacity: saving ? .5 : 1 }}>{saving ? "บันทึก..." : "บันทึก"}</button>
          </div>

          {/* สวิตช์ ใช้ชื่อ/รูปหลัก */}
          <button onClick={() => setUseMain((v) => !v)} style={{ width: "100%", ...card(t), padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", marginBottom: 14, border: `1px solid ${t.border}` }}>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>ใช้ชื่อ/รูปเดียวกับโปรไฟล์หลัก</div>
              <div style={{ fontSize: 11, color: t.sub, marginTop: 2 }}>{useMain ? "กำลังใช้ชื่อ/รูปหลัก" : "ตั้งชื่อ/รูปแยกสำหรับชุมชน"}</div>
            </div>
            <div style={{ width: 44, height: 26, borderRadius: 13, background: useMain ? "#F2872E" : t.border, position: "relative", transition: "background .2s", flexShrink: 0 }}>
              <div style={{ position: "absolute", top: 3, left: useMain ? 21 : 3, width: 20, height: 20, borderRadius: 10, background: "#fff", transition: "left .2s" }} />
            </div>
          </button>

          {!useMain && (
            <>
              <div style={{ textAlign: "center", marginBottom: 14 }}>
                <button onClick={() => fileRef.current?.click()} style={{ background: "none", border: "none", cursor: "pointer", position: "relative" }}>
                  {avatar ? <img src={avatar} alt="" style={{ width: 84, height: 84, borderRadius: 42, objectFit: "cover" }} /> : <div style={{ width: 84, height: 84, borderRadius: 42, background: colorFor(name || "?"), display: "grid", placeItems: "center", color: "#fff", fontSize: 32, fontWeight: 700 }}>{(name || "?")[0]}</div>}
                  <div style={{ position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, background: "#F2872E", display: "grid", placeItems: "center", border: `2px solid ${t.page}` }}><Camera size={13} color="#fff" /></div>
                </button>
                <input ref={fileRef} type="file" accept="image/*" onChange={uploadAvatar} style={{ display: "none" }} />
                {uploading && <div style={{ fontSize: 11, color: t.sub, marginTop: 6 }}>กำลังอัปโหลด...</div>}
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: t.sub, marginBottom: 5 }}>ชื่อในชุมชน</div>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ตั้งชื่อที่จะใช้ในชุมชน" style={{ ...input(t), marginBottom: 14 }} />
            </>
          )}

          <div style={{ fontSize: 11.5, fontWeight: 700, color: t.sub, marginBottom: 5 }}>แนะนำตัว (bio)</div>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="เล่าเกี่ยวกับตัวคุณสั้นๆ..." style={{ ...input(t), minHeight: 70, resize: "vertical", lineHeight: 1.5 }} />
        </div>
      </div>
    </ModalPortal>
  );
}

// รายชื่อ ผู้ติดตาม / กำลังติดตาม
function FollowListModal({ t, type, profileId, userId, onOpenProfile, close }) {
  const [list, setList] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const col = type === "followers" ? "follower_id" : "following_id";
        const matchCol = type === "followers" ? "following_id" : "follower_id";
        const { data: rows } = await supabase.from("follows").select(col).eq(matchCol, profileId).eq("status", "accepted");
        const ids = (rows || []).map((r) => r[col]);
        if (ids.length === 0) { setList([]); return; }
        const { data: profs } = await supabase.from("profiles").select("id, name, avatar_url, community_name, community_avatar, community_use_main").in("id", ids);
        setList(profs || []);
      } catch (e) { setList([]); }
    })();
  }, [type, profileId]);
  const nameOf = (p) => (p.community_use_main === false && p.community_name ? p.community_name : p.name) || "ผู้ใช้";
  const avaOf = (p) => (p.community_use_main === false && p.community_avatar ? p.community_avatar : p.avatar_url);

  return (
    <ModalPortal>
      <div style={overlayHi} onClick={close}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "20px 20px 0 0", padding: 20, maxHeight: "70vh", overflowY: "auto" }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: t.text, marginBottom: 14, textAlign: "center" }}>{type === "followers" ? "ผู้ติดตาม" : "กำลังติดตาม"}</div>
          {list === null ? <div style={{ textAlign: "center", padding: 20, color: t.faint, fontSize: 13 }}>กำลังโหลด...</div>
            : list.length === 0 ? <div style={{ textAlign: "center", padding: 20, color: t.faint, fontSize: 13 }}>{type === "followers" ? "ยังไม่มีผู้ติดตาม" : "ยังไม่ได้ติดตามใคร"}</div>
            : list.map((p) => (
              <button key={p.id} onClick={() => onOpenProfile(p.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 4px", background: "none", border: "none", borderBottom: `1px solid ${t.border}`, cursor: "pointer", textAlign: "left" }}>
                {avaOf(p) ? <img src={avaOf(p)} alt="" style={{ width: 40, height: 40, borderRadius: 20, objectFit: "cover" }} /> : <div style={{ width: 40, height: 40, borderRadius: 20, background: colorFor(nameOf(p)), display: "grid", placeItems: "center", color: "#fff", fontWeight: 700 }}>{nameOf(p)[0]}</div>}
                <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{nameOf(p)}</div>
              </button>
            ))}
        </div>
      </div>
    </ModalPortal>
  );
}

// Modal เขียนโพสต์ใหม่ (ข้อความ + แนบรูปหลายรูป)
function ComposeModal({ t, userId, onDone, close }) {
  const [text, setText] = useState("");
  const [images, setImages] = useState([]); // URL ที่อัปโหลดแล้ว
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [visibility, setVisibility] = useState("public"); // public | followers
  const [mentioned, setMentioned] = useState([]); // [{id, name}] คนที่แท็กไว้ (เลือกจากดรอปดาวน์ @)
  const fileRef = useRef(null);

  const uploadImages = async (e) => {
    const files = [...(e.target.files || [])]; if (files.length === 0) return;
    setUploading(true);
    try {
      for (const f of files) {
        const path = `community/${userId}-${crypto.randomUUID()}.jpg`;
        const { error } = await supabase.storage.from("attachments").upload(path, f);
        if (!error) { const { data } = supabase.storage.from("attachments").getPublicUrl(path); setImages((im) => [...im, data.publicUrl]); }
      }
    } catch (e) {}
    setUploading(false);
  };
  const post = async () => {
    if (!text.trim() && images.length === 0) return;
    setPosting(true);
    const finalText = text.trim();
    const mentionIds = mentioned.filter((m) => finalText.includes(`@${m.name}`)).map((m) => m.id); // เอาเฉพาะที่ยังพิมพ์อยู่จริงในข้อความ (กันเผลอลบ @ชื่อ ทิ้งไปแล้ว)
    await supabase.from("posts").insert({ author_id: userId, text: finalText, images, visibility, mentioned_ids: mentionIds });
    logAudit(userId, "community", "post", "โพสต์ใหม่ในชุมชน");
    mentionIds.forEach((id) => logActivity({ userId: id, actorId: userId, type: "mention", preview: finalText }));
    setPosting(false);
    onDone?.();
  };

  return (
    <ModalPortal>
      <div style={overlayHi} onClick={close}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "20px 20px 0 0", padding: 20, maxHeight: "80vh", overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <button onClick={close} style={{ background: "none", border: "none", color: t.sub, fontSize: 14, cursor: "pointer" }}>ยกเลิก</button>
            <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>โพสต์ใหม่</div>
            <button onClick={post} disabled={posting || (!text.trim() && images.length === 0)} style={{ background: "#F2872E", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, padding: "7px 16px", borderRadius: 10, cursor: "pointer", opacity: posting || (!text.trim() && images.length === 0) ? 0.5 : 1 }}>{posting ? "กำลังโพสต์..." : "โพสต์"}</button>
          </div>
          <MentionInput value={text} onChange={setText} mentioned={mentioned} setMentioned={setMentioned} t={t} placeholder="มีอะไรใหม่... (พิมพ์ @ เพื่อแท็กคน)" isTextarea autoFocus style={{ ...input(t), width: "100%", minHeight: 100, resize: "vertical", fontSize: 14, lineHeight: 1.5 }} />
          {images.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
              {images.map((url, i) => (
                <div key={i} style={{ position: "relative" }}>
                  <img src={url} alt="" style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover" }} />
                  <button onClick={() => setImages((im) => im.filter((_, j) => j !== i))} style={{ position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: 11, background: "#D9534F", border: "none", color: "#fff", cursor: "pointer", fontSize: 12 }}>×</button>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => fileRef.current?.click()} style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 10, border: `1px solid ${t.border}`, background: "none", color: t.text, cursor: "pointer", fontSize: 12.5, fontWeight: 700 }}>{uploading ? "กำลังอัปโหลด..." : "📷 เพิ่มรูป"}</button>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={uploadImages} style={{ display: "none" }} />

          {/* ใครเห็นโพสต์นี้ได้บ้าง */}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${t.border}` }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: t.sub, marginBottom: 7 }}>ใครเห็นโพสต์นี้ได้</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[{ k: "public", ic: "🌐", lb: "ทุกคนในชุมชน" }, { k: "followers", ic: "🔒", lb: "เฉพาะผู้ติดตาม" }].map((o) => (
                <button key={o.k} onClick={() => setVisibility(o.k)} style={{ flex: 1, padding: "10px 8px", borderRadius: 12, border: `1.5px solid ${visibility === o.k ? t.accent : t.border}`, background: visibility === o.k ? `${t.accent}1A` : "none", color: visibility === o.k ? t.accent : t.sub, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{o.ic} {o.lb}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

function ChatEntryPage({ t, M, userId, authProfile, session, openThread }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState(null); // null | "menu" | "create" | "join" | "direct"
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
    </>
  );
}


function ChatRoomPage({ t, userId, thread, profile, session, onLeave, onBack, activeCall, setActiveCall, setCallMinimized }) {

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [confirmDeleteMsgId, setConfirmDeleteMsgId] = useState(null);
  const [msgMenuId, setMsgMenuId] = useState(null); // id ข้อความที่กดค้างอยู่ (โชว์เมนูแก้ไข/ลบชั่วคราวแทนที่จะค้างตลอด)
  const longPressRef = useRef(null);
  const [senderMap, setSenderMap] = useState({}); // sender_id -> { name } กันโชว์ชื่อผิดคนตอนหลายคนคุยในห้องเดียวกัน
  const [uploading, setUploading] = useState(false);
  const [typingName, setTypingName] = useState(null); // ชื่อคนที่กำลังพิมพ์อยู่ (null = ไม่มีใครพิมพ์)
  const [otherMembers, setOtherMembers] = useState([]); // [{id, name}] สมาชิกคนอื่นในห้อง (ไม่รวมตัวเอง) ใช้ทำ "อ่านแล้ว"
  const [reads, setReads] = useState({}); // user_id -> last_read_at ของคนอื่นในห้อง
  const [lightbox, setLightbox] = useState(null); // url รูปที่กำลังดูเต็มจอ (null = ไม่ได้เปิดดู)
  const [confirmLeave, setConfirmLeave] = useState(false); // "ยืนยัน" | "" -> โหมด: "leave" (ออกจากห้อง) หรือ "delete" (ลบถาวร)
  const [showMembers, setShowMembers] = useState(false);
  const [callParticipants, setCallParticipants] = useState([]); // คนที่กำลังอยู่ในสายเสียงของห้องนี้ตอนนี้ (ไม่รวมตัวเอง ไว้โชว์แบนเนอร์เตือน)
  const [callDetail, setCallDetail] = useState(null); // สรุปประวัติการโทร (เปิดเมื่อกดที่ข้อความโทร) { starter, joiners[], durationMins, at }
  // เสียงเรียกเข้าย้ายไปที่ IncomingCallWatcher ระดับแอปแล้ว (ทำงานทุกหน้า) — ตรงนี้เหลือแค่แบนเนอร์ในห้อง กันเสียงซ้อนกัน
  useEffect(() => {
    const isMeInThisCall = activeCall?.threadId === thread.id;
    if (isMeInThisCall) { setCallParticipants([]); return; } // ตัวเองเข้าสายอยู่แล้ว ไม่ต้องโชว์แบนเนอร์เตือนตัวเอง
    const presenceChannel = supabase.channel(`call-${thread.id}`);
    presenceChannel.on("presence", { event: "sync" }, () => {
      const state = presenceChannel.presenceState();
      const people = Object.values(state).flat().filter((p) => p.userId !== userId);
      setCallParticipants(people);
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
  const deleteMsg = async (id) => { await supabase.from("chat_messages").delete().eq("id", id); setConfirmDeleteMsgId(null); setMsgMenuId(null); };
  // กดค้าง 380ms บนข้อความตัวเอง -> เปิดเมนูแก้ไข/ลบ (แทนที่จะโชว์ปุ่มค้างตลอดใต้ทุกข้อความ)
  const startLongPress = (m) => { longPressRef.current = setTimeout(() => setMsgMenuId(m.id), 380); };
  const cancelLongPress = () => { if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; } };

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
            <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start", maxWidth: "84%", alignSelf: mine ? "flex-end" : "flex-start", position: "relative" }}>
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
                ) : (() => {
                  const isCallMsg = m.text && /^(📞|➡️|⬅️)/.test(m.text);
                  const openCallDetail = () => {
                    // รวบรวมข้อความโทรทั้งชุดรอบๆ ข้อความนี้ (คั่นด้วยช่องว่างเวลา > 3 ชม. ถือเป็นคนละสาย)
                    const callMsgs = messages.filter((x) => x.text && /^(📞|➡️|⬅️)/.test(x.text)).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                    const idx = callMsgs.findIndex((x) => x.id === m.id);
                    let start = idx, end = idx;
                    while (start > 0 && (new Date(callMsgs[start].created_at) - new Date(callMsgs[start - 1].created_at)) < 3 * 3600 * 1000) start--;
                    while (end < callMsgs.length - 1 && (new Date(callMsgs[end + 1].created_at) - new Date(callMsgs[end].created_at)) < 3 * 3600 * 1000) end++;
                    const group = callMsgs.slice(start, end + 1);
                    const nameOf = (mm) => senderMap[mm.sender_id]?.name || (mm.sender_id === userId ? profile?.name : "เพื่อน");
                    const timeOf = (mm) => new Date(mm.created_at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
                    // สร้าง timeline: แต่ละเหตุการณ์ = { name, action, time } — กันซ้ำ (คนเดิม+action เดิม+เวลาเดียวกัน)
                    const seen = new Set();
                    const timeline = [];
                    for (const g of group) {
                      const action = g.text.startsWith("📞") ? "start" : g.text.startsWith("➡️") ? "join" : "leave";
                      const name = nameOf(g);
                      const time = timeOf(g);
                      const key = `${name}|${action}|${time}`;
                      if (seen.has(key)) continue;
                      seen.add(key);
                      timeline.push({ name, action, time });
                    }
                    const durations = group.filter((g) => g.text.startsWith("⬅️")).map((g) => { const mt = g.text.match(/(\d+)\s*นาที/); return mt ? +mt[1] : 0; });
                    const maxDur = durations.length ? Math.max(...durations) : 0;
                    setCallDetail({ timeline, durationMins: maxDur, at: group[0]?.created_at });
                  };
                  return (
                  <div
                    onClick={isCallMsg ? openCallDetail : undefined}
                    onMouseDown={mine && !m.attachment_url ? () => startLongPress(m) : undefined}
                    onMouseUp={mine && !m.attachment_url ? cancelLongPress : undefined}
                    onMouseLeave={mine && !m.attachment_url ? cancelLongPress : undefined}
                    onTouchStart={mine && !m.attachment_url ? () => startLongPress(m) : undefined}
                    onTouchEnd={mine && !m.attachment_url ? cancelLongPress : undefined}
                    onTouchMove={mine && !m.attachment_url ? cancelLongPress : undefined}
                    style={{ background: mine ? t.accent : t.surface, color: mine ? t.onAccent : t.text, padding: m.attachment_url ? 6 : "9px 13px", borderRadius: 14, fontSize: 13.5, lineHeight: 1.4, border: mine ? "none" : `1px solid ${t.border}`, cursor: isCallMsg ? "pointer" : (mine ? "default" : "default"), userSelect: "none", WebkitUserSelect: "none" }}
                  >
                    {m.attachment_type === "image" && <img src={m.attachment_url} alt="" onClick={() => setLightbox(m.attachment_url)} style={{ maxWidth: 200, borderRadius: 10, display: "block", cursor: "pointer" }} />}
                    {m.attachment_type === "file" && (
                      <a href={m.attachment_url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, color: "inherit", textDecoration: "underline", padding: "3px 7px" }}><FileText size={14} /> {m.attachment_name}</a>
                    )}
                    {m.text && <div style={{ padding: m.attachment_url ? "6px 7px 2px" : 0 }}>{m.text}{m.edited_at && <span style={{ fontSize: 10, opacity: 0.6, marginLeft: 6 }}>(แก้ไขแล้ว)</span>}{isCallMsg && <span style={{ fontSize: 10, opacity: 0.6, marginLeft: 6 }}>· ดูรายละเอียด</span>}</div>}
                  </div>
                  );
                })()}
              </div>
              {/* เมนูแก้ไข/ลบ — โผล่เฉพาะตอนกดค้าง ไม่ค้างอยู่ตลอดใต้ทุกข้อความ (กันหน้าจอรก) */}
              {msgMenuId === m.id && (
                <>
                  <div onClick={() => { setMsgMenuId(null); setConfirmDeleteMsgId(null); }} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
                  <div style={{ position: "absolute", top: "100%", [mine ? "right" : "left"]: 0, marginTop: 4, zIndex: 41, background: t.page, border: `1px solid ${t.border}`, borderRadius: 12, boxShadow: "0 6px 18px rgba(0,0,0,.18)", display: "flex", overflow: "hidden" }}>
                    <button onClick={() => { startEdit(m); setMsgMenuId(null); }} style={{ padding: "9px 16px", background: "none", border: "none", cursor: "pointer", fontSize: 12.5, color: t.text, fontWeight: 600, borderRight: `1px solid ${t.border}` }}>แก้ไข</button>
                    {confirmDeleteMsgId === m.id ? (
                      <button onClick={() => deleteMsg(m.id)} style={{ padding: "9px 16px", background: "none", border: "none", cursor: "pointer", fontSize: 12.5, color: "#D9534F", fontWeight: 700 }}>ยืนยันลบ?</button>
                    ) : (
                      <button onClick={() => setConfirmDeleteMsgId(m.id)} style={{ padding: "9px 16px", background: "none", border: "none", cursor: "pointer", fontSize: 12.5, color: "#D9534F", fontWeight: 600 }}>ลบ</button>
                    )}
                  </div>
                </>
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
      {callDetail && (
        <div style={overlay} onClick={() => setCallDetail(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 380, background: t.page, borderRadius: 20, padding: 24, textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: 28, background: "#2E9E6B", display: "grid", placeItems: "center", margin: "0 auto 14px" }}><Phone size={26} color="#fff" /></div>
            <div style={{ fontSize: 17, fontWeight: 800, color: t.text, marginBottom: 4 }}>ประวัติการโทร</div>
            <div style={{ fontSize: 12, color: t.sub, marginBottom: 18 }}>{callDetail.at ? new Date(callDetail.at).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }) : ""}</div>
            <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 2, maxHeight: 320, overflowY: "auto" }}>
              {callDetail.timeline.map((ev, i) => {
                const cfg = ev.action === "start" ? { icon: "📞", label: "เริ่มโทร", color: "#2E9E6B" } : ev.action === "join" ? { icon: "➡️", label: "เข้าร่วม", color: "#378ADD" } : { icon: "⬅️", label: "วางสาย", color: "#D9534F" };
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 4px", borderBottom: i < callDetail.timeline.length - 1 ? `1px solid ${t.border}` : "none" }}>
                    <span style={{ fontSize: 15, width: 22, textAlign: "center" }}>{cfg.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: t.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.name}</div>
                      <div style={{ fontSize: 11, color: cfg.color, fontWeight: 600 }}>{cfg.label}</div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: t.sub, flexShrink: 0 }}>{ev.time}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${t.border}`, marginTop: 10, paddingTop: 14 }}>
              <span style={{ fontSize: 13, color: t.sub }}>⏱️ ระยะเวลารวม</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: t.accent }}>{callDetail.durationMins > 0 ? `${callDetail.durationMins} นาที` : "ไม่ถึง 1 นาที"}</span>
            </div>
            <button onClick={() => setCallDetail(null)} style={{ marginTop: 20, width: "100%", padding: "12px 0", borderRadius: 12, border: "none", background: t.accent, color: t.onAccent, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>ปิด</button>
          </div>
        </div>
      )}
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
    if (!groups[key]) groups[key] = { label: g.text.trim(), total: 0, done: 0, doneDates: [], comment: g.comment || "" };
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

  // 🥧 วงกลม: สัดส่วนสำเร็จ/พลาด สัปดาห์นี้
  const weekRangeOfNow = () => {
    const d = new Date(); const dow = (d.getDay() + 6) % 7;
    const mon = new Date(d); mon.setDate(d.getDate() - dow);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return { start: mon.toISOString().slice(0, 10), end: sun.toISOString().slice(0, 10) };
  };
  const { start: weekStart, end: weekEnd } = weekRangeOfNow();
  const thisWeek = dated.filter((g) => g.date >= weekStart && g.date <= weekEnd);
  const weekDone = thisWeek.filter((g) => g.done).length;
  const weekMissed = thisWeek.length - weekDone;
  const pieData = [
    { name: "สำเร็จ", value: weekDone, color: "#2E9E6B" },
    { name: "ยังไม่ทำ", value: weekMissed, color: "#8A93A8" },
  ];

  // 📈 เส้น: % ความสำเร็จรายสัปดาห์ ย้อนหลัง 10 สัปดาห์
  const weeklyTrend = []; 
  for (let i = 9; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i * 7);
    const dow = (d.getDay() + 6) % 7;
    const mon = new Date(d); mon.setDate(d.getDate() - dow);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    const ws = mon.toISOString().slice(0, 10), we = sun.toISOString().slice(0, 10);
    const wgoals = dated.filter((g) => g.date >= ws && g.date <= we);
    const pct = wgoals.length ? Math.round((wgoals.filter((g) => g.done).length / wgoals.length) * 100) : 0;
    weeklyTrend.push({ label: `${mon.getDate()}/${mon.getMonth() + 1}`, "สำเร็จ%": pct });
  }

  // 📊 แท่ง: อัตราสำเร็จแยกตามวันในสัปดาห์ (จ-อา) — เห็นว่าวันไหนทำได้ดี/แย่
  const dayLabelsTh = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];
  const byWeekday = dayLabelsTh.map((lb, i) => {
    const rows = dated.filter((g) => (new Date(g.date + "T00:00:00").getDay() + 6) % 7 === i);
    const pct = rows.length ? Math.round((rows.filter((g) => g.done).length / rows.length) * 100) : 0;
    return { วัน: lb, "สำเร็จ%": pct };
  });

  const heatColor = (n) => {
    if (!n) return t.star ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.05)";
    const ratio = n / maxCount;
    return `${t.accent}${Math.round(30 + ratio * 70).toString(16).padStart(2, "0")}`;
  };

  // ✏️ แก้ไขย้อนหลัง: สลับสถานะสำเร็จ/ไม่สำเร็จของวันในอดีต (ส่ง comment ไปด้วยเสมอ)
  const toggleRetroDate = async (label, date) => {
    const existing = dated.find((g) => g.text.trim().toLowerCase() === label.toLowerCase() && g.date === date);
    const targetGroup = groups[label.toLowerCase()];
    const currentComment = existing?.comment || targetGroup?.comment || "";

    if (existing) {
      const nextDone = !existing.done;
      setGoals((gs) => gs.map((g) => (g.id === existing.id ? { ...g, done: nextDone, doneDate: nextDone ? date : null } : g)));
      if (userId && typeof supabase !== "undefined") {
        try {
          await supabase.from("goals").update({ done: nextDone, done_date: nextDone ? date : null, comment: currentComment }).eq("id", existing.id);
        } catch (err) {
          console.error("Error updating retro goal:", err);
        }
      }
    } else {
      const newGoal = { id: typeof uid === "function" ? uid() : Date.now().toString(), text: label, comment: currentComment, date, done: true, doneDate: date };
      setGoals((gs) => [...gs, newGoal]);
      if (userId && typeof supabase !== "undefined") {
        try {
          await supabase.from("goals").insert({ id: newGoal.id, user_id: userId, text: label, comment: currentComment, date, done: true, done_date: date });
        } catch (err) {
          console.error("Error inserting retro goal:", err);
        }
      }
    }
  };

  return (
    <div style={{ paddingBottom: 130 }}>
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

          <div style={{ display: "flex", gap: 14, marginBottom: 14, flexWrap: "wrap" }}>
            <div style={{ ...card(t), padding: 16, flex: 1, minWidth: 160 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: t.text, marginBottom: 4 }}>สัปดาห์นี้</div>
              <div style={{ fontSize: 11, color: t.sub, marginBottom: 6 }}>{weekDone}/{thisWeek.length || 0} สำเร็จ</div>
              <div style={{ width: "100%", height: 130, position: "relative" }}>
                {thisWeek.length === 0 ? (
                  <div style={{ display: "grid", placeItems: "center", height: "100%", fontSize: 11, color: t.faint }}>ยังไม่มีข้อมูลสัปดาห์นี้</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={34} outerRadius={55} paddingAngle={2}>
                        {pieData.map((e, i) => <Cell key={i} fill={e.color} stroke="none" />)}
                      </Pie>
                      <Tooltip formatter={(v) => `${v} รายการ`} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                {thisWeek.length > 0 && (
                  <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none" }}>
                    <div style={{ fontSize: 17, fontWeight: 800, color: t.text }}>{Math.round((weekDone / thisWeek.length) * 100)}%</div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ ...card(t), padding: 16, flex: 1, minWidth: 160 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: t.text, marginBottom: 10 }}>รายวันในสัปดาห์ (%)</div>
              <div style={{ width: "100%", height: 130 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byWeekday}>
                    <XAxis dataKey="วัน" tick={{ fontSize: 10, fill: t.sub }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Bar dataKey="สำเร็จ%" fill="#3DA5D9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div style={{ ...card(t), padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: t.text, marginBottom: 2 }}>พัฒนาการรายสัปดาห์</div>
            <div style={{ fontSize: 11, color: t.sub, marginBottom: 10 }}>% ความสำเร็จ ย้อนหลัง 10 สัปดาห์</div>
            <div style={{ width: "100%", height: 140 }}>
              <ConstellationChart t={t} data={weeklyTrend} />
            </div>
          </div>

          <div style={{ fontSize: 13, fontWeight: 800, color: t.sub, margin: "4px 0 10px" }}>เป้าหมายที่ทำบ่อย ({groupList.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {groupList.map((g, i) => {
              const pct = Math.round((g.done / g.total) * 100);
              const streak = calcStreak(g.doneDates);
              const isOpen = expandedGroup === g.label;
              const firstDate = dated.filter((x) => x.text.trim().toLowerCase() === g.label.toLowerCase()).map((x) => x.date).sort()[0];
              const daysBack = firstDate ? Math.min(21, Math.round((new Date() - new Date(firstDate)) / 86400000) + 1) : 21;
              const logDates = Array.from({ length: daysBack }, (_, k) => { const d = new Date(); d.setDate(d.getDate() - (daysBack - 1 - k)); return d.toISOString().slice(0, 10); });
              return (
                <div key={i} style={{ ...card(t), padding: 14 }}>
                  <button onClick={() => setExpandedGroup(isOpen ? null : g.label)} style={{ width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: t.text, display: "flex", alignItems: "center", gap: 6 }}>{g.label} <ChevronRight size={13} color={t.faint} style={{ transform: isOpen ? "rotate(90deg)" : "none", transition: "transform .15s" }} /></div>
                      {streak > 0 && <span style={{ fontSize: 10.5, fontWeight: 800, color: t.accent, background: `${t.accent}18`, padding: "2px 8px", borderRadius: 10, flexShrink: 0, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 4 }}><LanternIcon size={11} tier={streak >= 100 ? 3 : streak >= 30 ? 2 : 1} /> {streak} วันติด</span>}
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
    </div>
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
    logAudit(userId, "finance", "edit", "แก้ไขรายการการเงิน");
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


function AddTxModal({ t, tx, setTx, categories, reorderCategoriesForKind, deleteCategory, addCategory, userId, session, close }) {
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

  // 🧾 สแกนสลิป/ใบเสร็จด้วย AI — เติมฟอร์มให้อัตโนมัติ ผู้ใช้เช็คก่อนกดบันทึกเสมอ
  const receiptFileRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [pendingReceipt, setPendingReceipt] = useState(null); // { dataUrl, mime }
  const [scanResult, setScanResult] = useState(null); // { doc_type, items, source }

  const pickReceipt = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    e.target.value = "";
    const rd = new FileReader();
    rd.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 1400; const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas"); c.width = img.width * scale; c.height = img.height * scale;
        const ctx = c.getContext("2d"); ctx.drawImage(img, 0, 0, c.width, c.height);
        const dataUrl = c.toDataURL("image/jpeg", 0.85);
        setPendingReceipt({ dataUrl, mime: "image/jpeg" });
        scanReceipt(dataUrl);
      };
      img.src = rd.result;
    };
    rd.readAsDataURL(f);
  };

  const scanReceipt = async (dataUrl) => {
    setScanning(true); setScanError(""); setScanResult(null);
    try {
      const r = await fetch("/api/receipt-scan", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl, userId, callerToken: session?.access_token, categoryOptions: categories.map((c) => ({ id: c.id, label: c.label, kind: c.kind })) }),
      });
      const data = await r.json();
      if (!r.ok || data.error) { setScanError(data.error || "อ่านสลิป/ใบเสร็จไม่สำเร็จ"); return; }
      let catMatched = false;
      if (data.amount) setAmount(String(data.amount));
      if (data.date) setDate(data.date);
      if (data.merchant) setNote(data.merchant);
      if (data.suggested_category) {
        const raw = String(data.suggested_category).trim();
        // AI บางครั้งตอบชื่อหมวด (label) แทน id ทั้งที่สั่งให้ตอบ id — เผื่อไว้ทุกทาง กันไม่ได้เลือกให้เฉยๆ
        const found = categories.find((c) => c.id === raw)
          || categories.find((c) => c.id.toLowerCase() === raw.toLowerCase())
          || categories.find((c) => c.label === raw);
        if (found) { setType(found.kind); setCat(found.id); setCatError(false); catMatched = true; }
      }
      if (!catMatched) {
        // เดาไม่ได้เลย — อย่างน้อยเลือก "อื่นๆ" ให้ไว้ก่อน ลดงานที่ต้องกดเอง (คนยังเปลี่ยนเองได้เสมอ)
        const fallback = categories.find((c) => c.label === "อื่นๆ" && c.kind === "out") || categories.find((c) => c.kind === "out");
        if (fallback) { setType(fallback.kind); setCat(fallback.id); setCatError(false); }
      }
      setScanResult({ ...data, catMatched });
    } catch (e) { setScanError("เชื่อมต่อไม่สำเร็จ: " + e.message); }
    finally { setScanning(false); }
  };

  const [receiptZoom, setReceiptZoom] = useState(false);
  const clearReceipt = () => { setPendingReceipt(null); setScanResult(null); setScanError(""); };

  const add = () => {
    const a = parseFloat(amount);
    if (!a || a <= 0) return;
    if (!cat) { setCatError(true); return; }
    const finalNote = note.trim() || findCat(categories, cat).label;
    const newTx = { id: uid(), type, cat, amount: a, note: finalNote, date };
    setTx((l) => [newTx, ...l]);
    const items = scanResult?.doc_type === "receipt" && Array.isArray(scanResult.items) ? scanResult.items : null;
    const docType = scanResult?.doc_type || null;
    if (userId) {
      supabase.from("transactions").insert({ id: newTx.id, user_id: userId, type: newTx.type, cat: newTx.cat, amount: newTx.amount, note: newTx.note, date: newTx.date, items, doc_type: docType }).then(() => {}, () => {});
      logAudit(userId, "finance", "add", "เพิ่มรายการการเงิน");
      // อัปโหลดรูปสลิป/ใบเสร็จเข้า bucket ส่วนตัว (ไม่ public ต่างจากรูปอื่นในแอป เพราะมีข้อมูลการเงิน)
      if (pendingReceipt) {
        fetch(pendingReceipt.dataUrl).then((res) => res.blob()).then((blob) => {
          const path = `${userId}/${newTx.id}.jpg`;
          supabase.storage.from("receipts").upload(path, blob, { contentType: "image/jpeg" }).then(({ error }) => {
            if (!error) supabase.from("transactions").update({ receipt_path: path }).eq("id", newTx.id).then(() => {}, () => {});
          }, () => {});
        });
      }
    }
    close();
  };

  return (
    <div style={overlay} onClick={close}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "24px 24px 0 0", padding: "20px 20px 28px", maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: t.text }}>เพิ่มรายการ</div>
          <button onClick={close} style={ghost}><X size={20} color={t.sub} /></button>
        </div>
        <input ref={receiptFileRef} type="file" accept="image/*" onChange={pickReceipt} style={{ display: "none" }} />
        {!pendingReceipt ? (
          <button onClick={() => receiptFileRef.current?.click()} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "12px 0", borderRadius: 14, border: `1.5px dashed ${t.accent}`, background: `${t.accent}10`, color: t.accent, cursor: "pointer", fontWeight: 700, fontSize: 13, marginBottom: 14 }}>
            <Camera size={17} /> แนบรูปสลิป/ใบเสร็จ (AI อ่านให้อัตโนมัติ)
          </button>
        ) : (
          <div style={{ ...card(t), padding: 10, marginBottom: 14, display: "flex", gap: 10, alignItems: "flex-start" }}>
            <img src={pendingReceipt.dataUrl} alt="" onClick={() => setReceiptZoom(true)} style={{ width: 52, height: 52, borderRadius: 10, objectFit: "cover", flexShrink: 0, cursor: "pointer" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              {scanning && <div style={{ fontSize: 12, color: t.sub, fontWeight: 700 }}>กำลังอ่านข้อมูล...</div>}
              {!scanning && scanError && <div style={{ fontSize: 11.5, color: "#D9534F" }}>{scanError}</div>}
              {!scanning && !scanError && scanResult && (
                <div style={{ fontSize: 11.5, color: t.sub }}>
                  อ่านสำเร็จ ({scanResult.doc_type === "receipt" ? "ใบเสร็จ" : "สลิปโอนเงิน"}) — เช็คข้อมูลด้านล่างก่อนบันทึก
                  {!scanResult.catMatched && <div style={{ color: "#E8894A", marginTop: 2 }}>⚠️ เดาหมวดหมู่ไม่ได้ ตั้งเป็น "อื่นๆ" ไว้ก่อน — เลือกหมวดที่ถูกต้องเองด้านล่างด้วยนะ</div>}
                  {scanResult.doc_type === "receipt" && Array.isArray(scanResult.items) && scanResult.items.length > 0 && (
                    <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 2 }}>
                      {scanResult.items.map((it, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: t.faint }}>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>{it.name}</span>
                          <span>{Number(it.price).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <button onClick={clearReceipt} style={{ ...ghost, flexShrink: 0 }}><X size={16} color={t.sub} /></button>
          </div>
        )}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {[["out", "จ่ายออก", "#D9534F"], ["in", "รับเข้า", "#2E9E6B"]].map(([v, lb, c]) => (
            <button key={v} onClick={() => { setType(v); setCat(null); setCatError(false); }} style={{ flex: 1, padding: "10px 0", borderRadius: 12, cursor: "pointer", border: `1.5px solid ${type === v ? c : t.border}`, fontWeight: 700, fontSize: 13.5, background: type === v ? c : "transparent", color: type === v ? "#fff" : t.sub }}>{lb}</button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: catError ? "#D9534F" : t.sub }}>หมวดหมู่ {catError && "— กรุณาเลือกก่อนบันทึก"}</div>
          <button onClick={() => setManageOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11.5, color: t.accent, fontWeight: 700 }}>จัดการหมวดหมู่</button>
        </div>
        <div style={{ position: "relative", marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6 }}>
            {catList(categories, type).map((c) => { const Ic = ICONS[c.iconKey] || Wallet; const on = cat === c.id; return (
              <button key={c.id} onClick={() => { setCat(c.id); setCatError(false); }} style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer", background: "none", border: "none" }}>
                <span style={{ width: 48, height: 48, borderRadius: 15, display: "grid", placeItems: "center", background: on ? c.color : `${c.color}20`, border: catError && !on ? `1.5px dashed ${t.faint}` : "none", transition: "all .15s" }}><Ic size={21} color={on ? "#fff" : c.color} /></span>
                <span style={{ fontSize: 10, color: on ? t.text : t.sub, fontWeight: on ? 700 : 500 }}>{c.label}</span>
              </button>
            ); })}
          </div>
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 6, width: 28, pointerEvents: "none", background: `linear-gradient(to right, transparent, ${t.bg})` }} />
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
      {manageOpen && <CategoryManagerModal t={t} categories={categories} reorderCategoriesForKind={reorderCategoriesForKind} deleteCategory={deleteCategory} addCategory={addCategory} close={() => setManageOpen(false)} />}
      {receiptZoom && pendingReceipt && <ImageLightbox src={pendingReceipt.dataUrl} onClose={() => setReceiptZoom(false)} />}
    </div>
  );
}

function CategoryManagerModal({ t, categories, reorderCategoriesForKind, deleteCategory, addCategory, close }) {
  const [kind, setKind] = useState("out");
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newIcon, setNewIcon] = useState(ICON_KEYS[0]);
  const [newColor, setNewColor] = useState(CAT_COLORS[0]);
  const [askConfirm, ConfirmUI] = useConfirm(t);

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
          <DragReorderList
            items={list}
            getId={(c) => c.id}
            onReorder={(newList) => reorderCategoriesForKind(kind, newList)}
            renderItem={(c, i, { handleProps, priming }) => {
              const Ic = ICONS[c.iconKey] || Wallet;
              return (
                <div style={{ ...card(t), padding: "9px 12px", display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span {...handleProps}><GripVertical size={16} color={priming ? t.accent : t.faint} /></span>
                  <span style={{ width: 34, height: 34, borderRadius: 11, background: `${c.color}22`, display: "grid", placeItems: "center", flexShrink: 0 }}><Ic size={16} color={c.color} /></span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: t.text }}>{c.label}</span>
                  <button onClick={() => askConfirm(`ลบหมวดหมู่ "${c.label}" เลยไหม?`, () => deleteCategory(c.id))} style={ghost}><Trash2 size={15} color={t.faint} /></button>
                </div>
              );
            }}
          />
          {ConfirmUI}
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
// 📝 ลำดับเครื่องมือ default ของ quick toolbar โน้ต — พี่ปรับลำดับเองได้ผ่านปุ่ม "จัดเรียง" (persist ต่อเครื่องผ่าน localStorage)
const DEFAULT_NOTE_TOOL_ORDER = [
  "image", "checklist", "heading2", "bulletList", // 4 ตัวแรก = โชว์เสมอ (แถวหลัก)
  "addBlock", "attachFile", "importMd", "textColor", // ที่เหลือ = อยู่ใต้ "เพิ่มเติม"
  "heading1", "heading3", "numberedList", "toggleList", "quote", "codeBlock", "divider", "table", "video", "audio",
];

function NoteEditor({ content, onChange, theme, userId, t }) {
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

  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const mdInputRef = useRef(null);
  const videoInputRef = useRef(null); // 🎬 แนบวิดีโอ (เหมือนปุ่ม video ใน slash menu "+" ของ BlockNote)
  const audioInputRef = useRef(null); // 🎵 แนบเสียง (เหมือนปุ่ม audio ใน slash menu "+" ของ BlockNote)
  const [showColors, setShowColors] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [reorderMode, setReorderMode] = useState(false); // 🔀 โหมดจัดเรียงลำดับเครื่องมือ (ขึ้น/ลง)

  // 🔀 ลำดับเครื่องมือที่พี่จัดไว้ — เก็บต่อเครื่องผ่าน localStorage เผื่อมีเครื่องมือใหม่เพิ่มมาทีหลัง (อัปเดตแอป) ที่ยังไม่เคยบันทึกไว้ จะต่อท้ายให้ครบอัตโนมัติ ไม่หายไปจากรายการ
  const [toolOrder, setToolOrder] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("refhub:noteToolOrder") || "null");
      if (Array.isArray(saved) && saved.length) {
        const known = saved.filter((k) => DEFAULT_NOTE_TOOL_ORDER.includes(k));
        const missing = DEFAULT_NOTE_TOOL_ORDER.filter((k) => !known.includes(k));
        return [...known, ...missing];
      }
    } catch (e) {}
    return DEFAULT_NOTE_TOOL_ORDER;
  });
  useEffect(() => { try { localStorage.setItem("refhub:noteToolOrder", JSON.stringify(toolOrder)); } catch (e) {} }, [toolOrder]);

  // แทรกบล็อกใหม่ต่อจากตำแหน่งเคอร์เซอร์ปัจจุบันทันที ไม่ต้องพิมพ์ "/" แล้วเลือกเองทีละขั้น
  const insertAtCursor = (block) => {
    const cursor = editor.getTextCursorPosition();
    editor.insertBlocks([block], cursor.block, "after");
    onChange(editor.document);
  };

  const uploadAndInsert = async (file, type) => {
    try {
      const url = await editor.uploadFile(file);
      insertAtCursor({ type, props: { url: typeof url === "string" ? url : url?.url, name: file.name } });
    } catch (e) { /* uploadFile แจ้ง alert ไปแล้ว */ }
  };
  const handleImagePick = async (e) => { const file = e.target.files?.[0]; e.target.value = ""; if (file) await uploadAndInsert(file, "image"); };
  const handleFilePick = async (e) => { const file = e.target.files?.[0]; e.target.value = ""; if (file) await uploadAndInsert(file, "file"); };
  const handleVideoPick = async (e) => { const file = e.target.files?.[0]; e.target.value = ""; if (file) await uploadAndInsert(file, "video"); };
  const handleAudioPick = async (e) => { const file = e.target.files?.[0]; e.target.value = ""; if (file) await uploadAndInsert(file, "audio"); };

  // นำเข้าไฟล์ .md (เช่น export มาจาก Claude/AI) แปลงเป็นเนื้อหาโน้ตจริงเลย (หัวข้อ/ลิสต์/ตัวหนา กลายเป็น block แก้ไขได้)
  // แทนที่จะแค่แนบไฟล์ดิบๆ ไว้กดเปิด เพราะอ่านง่ายกว่า ค้นหาได้ แก้ไขต่อได้ในตัว
  const handleMdPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const blocks = await editor.tryParseMarkdownToBlocks(text);
      const cursor = editor.getTextCursorPosition();
      editor.insertBlocks(blocks, cursor.block, "after");
      onChange(editor.document);
    } catch (err) {
      alert("นำเข้าไฟล์ .md ไม่สำเร็จ: " + err.message);
    }
  };

  const COLOR_SWATCHES = [
    { key: "gray", hex: "#9b9a97" }, { key: "brown", hex: "#64473a" }, { key: "red", hex: "#e03e3e" },
    { key: "orange", hex: "#d9730d" }, { key: "yellow", hex: "#dfab01" }, { key: "green", hex: "#4d6461" },
    { key: "blue", hex: "#0b6e99" }, { key: "purple", hex: "#6940a5" }, { key: "pink", hex: "#ad1a72" },
  ];
  const applyColor = (colorKey) => {
    editor.addStyles({ textColor: colorKey }); // ใช้กับข้อความที่ไฮไลต์/เลือกไว้อยู่
    setShowColors(false);
    onChange(editor.document);
  };

  // 📋 เครื่องมือทั้งหมด — ครบเท่ากับปุ่ม "+" (slash menu) ของ BlockNote เอง ยกเว้นอีโมจิที่ยังพิมพ์ ":" เรียกได้ตามปกติในตัวเนื้อหาอยู่แล้ว
  const allTools = {
    image: { Icon: ImageIcon, label: "แนบรูป", onClick: () => imageInputRef.current?.click() },
    checklist: { Icon: CheckSquare, label: "เช็คลิสต์", onClick: () => insertAtCursor({ type: "checkListItem", content: "" }) },
    heading1: { Icon: Heading1, label: "หัวข้อใหญ่ (H1)", onClick: () => insertAtCursor({ type: "heading", props: { level: 1 }, content: "" }) },
    heading2: { Icon: Heading2, label: "หัวข้อ (H2)", onClick: () => insertAtCursor({ type: "heading", props: { level: 2 }, content: "" }) },
    heading3: { Icon: Heading3, label: "หัวข้อย่อย (H3)", onClick: () => insertAtCursor({ type: "heading", props: { level: 3 }, content: "" }) },
    bulletList: { Icon: List, label: "บูลเล็ต", onClick: () => insertAtCursor({ type: "bulletListItem", content: "" }) },
    numberedList: { Icon: ListOrdered, label: "ลิสต์ตัวเลข", onClick: () => insertAtCursor({ type: "numberedListItem", content: "" }) },
    toggleList: { Icon: ListTree, label: "ลิสต์พับได้ (toggle)", onClick: () => insertAtCursor({ type: "toggleListItem", content: "" }) },
    quote: { Icon: Quote, label: "คำพูดอ้างอิง", onClick: () => insertAtCursor({ type: "quote", content: "" }) },
    codeBlock: { Icon: Code2, label: "โค้ด", onClick: () => insertAtCursor({ type: "codeBlock" }) },
    divider: { Icon: Minus, label: "เส้นคั่น", onClick: () => insertAtCursor({ type: "divider" }) },
    table: { Icon: Table2, label: "ตาราง", onClick: () => insertAtCursor({ type: "table", content: { type: "tableContent", rows: [{ cells: ["", "", ""] }, { cells: ["", "", ""] }] } }) },
    video: { Icon: Video, label: "แนบวิดีโอ", onClick: () => videoInputRef.current?.click() },
    audio: { Icon: Music, label: "แนบเสียง", onClick: () => audioInputRef.current?.click() },
    addBlock: { Icon: Plus, label: "เพิ่มบล็อกเปล่า", onClick: () => insertAtCursor({ type: "paragraph", content: "" }) },
    attachFile: { Icon: Paperclip, label: "แนบไฟล์ทั่วไป", onClick: () => fileInputRef.current?.click() },
    importMd: { Icon: FileText, label: "นำเข้าไฟล์ .md", onClick: () => mdInputRef.current?.click() },
    textColor: { Icon: Palette, label: "เลือกสีข้อความ", onClick: () => setShowColors((v) => !v) },
  };
  const orderedKeys = toolOrder.filter((k) => allTools[k]);
  const primaryKeys = orderedKeys.slice(0, 4); // โชว์เสมอ ไม่ต้องเลื่อน
  const moreKeys = orderedKeys.slice(4); // อยู่ใต้ "เพิ่มเติม"
  const toolBtnStyle = { flexShrink: 0, display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 999, border: `1px solid ${t?.border || "#e5e5e5"}`, background: t?.inputBg || "#f5f5f5", cursor: "pointer" };

  return (
    <div>
      <div style={{ padding: "6px 8px", borderBottom: `1px solid ${t?.border || "#e5e5e5"}` }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {primaryKeys.map((key) => { const qt = allTools[key]; return (
            <button key={key} onClick={qt.onClick} style={toolBtnStyle}>
              <qt.Icon size={13} color={t?.sub || "#666"} />
              <span style={{ fontSize: 11, fontWeight: 700, color: t?.sub || "#666", whiteSpace: "nowrap" }}>{qt.label}</span>
            </button>
          ); })}
          <button onClick={() => setShowMore((v) => !v)} style={{ ...toolBtnStyle, border: `1px solid ${showMore ? (t?.accent || "#333") : (t?.border || "#e5e5e5")}` }}>
            <MoreVertical size={13} color={t?.sub || "#666"} />
            <span style={{ fontSize: 11, fontWeight: 700, color: t?.sub || "#666", whiteSpace: "nowrap" }}>เพิ่มเติม</span>
            <ChevronRight size={12} color={t?.sub || "#666"} style={{ transform: showMore ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
          </button>
        </div>
        {showMore && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${t?.border || "#e5e5e5"}` }}>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginBottom: 2 }}>
              {reorderMode && (
                <button onClick={() => setToolOrder(DEFAULT_NOTE_TOOL_ORDER)} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "2px 4px" }}>
                  <RotateCcw size={12} color={t?.faint || "#999"} /><span style={{ fontSize: 10.5, color: t?.faint || "#999" }}>รีเซ็ตลำดับ</span>
                </button>
              )}
              <button onClick={() => setReorderMode((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "2px 4px" }}>
                {reorderMode ? <Check size={12} color={t?.accent || "#333"} /> : <Settings size={12} color={t?.faint || "#999"} />}
                <span style={{ fontSize: 10.5, fontWeight: 700, color: reorderMode ? (t?.accent || "#333") : (t?.faint || "#999") }}>{reorderMode ? "เสร็จแล้ว" : "จัดเรียง"}</span>
              </button>
            </div>
            {reorderMode ? (
              <DragReorderList
                items={orderedKeys}
                getId={(k) => k}
                onReorder={(newOrder) => setToolOrder(newOrder)}
                renderItem={(key, i, { handleProps, priming }) => {
                  const qt = allTools[key];
                  return (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 10px", borderRadius: 10, background: t?.inputBg || "#f5f5f5", marginBottom: 4 }}>
                      <span {...handleProps}><GripVertical size={16} color={priming ? (t?.accent || "#333") : (t?.faint || "#999")} /></span>
                      <qt.Icon size={15} color={t?.sub || "#666"} style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 12.5, color: t?.text || "#333", flex: 1 }}>{qt.label}{i < 4 ? <span style={{ fontSize: 10, color: t?.faint || "#999", marginLeft: 6 }}>(แถวหลัก)</span> : null}</span>
                    </div>
                  );
                }}
              />
            ) : (
              moreKeys.map((key) => {
                const qt = allTools[key];
                return (
                  <button key={key} onClick={qt.onClick} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 10px", borderRadius: 10, border: "none", background: "none", cursor: "pointer", textAlign: "left" }}>
                    <qt.Icon size={15} color={t?.sub || "#666"} />
                    <span style={{ fontSize: 12.5, color: t?.text || "#333" }}>{qt.label}</span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
      {showColors && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "8px 10px", borderBottom: `1px solid ${t?.border || "#e5e5e5"}` }}>
          <div style={{ width: "100%", fontSize: 10, color: t?.faint || "#999", marginBottom: 2 }}>เลือกข้อความไว้ก่อน แล้วกดสีที่ต้องการ</div>
          {COLOR_SWATCHES.map((c) => (
            <button key={c.key} onClick={() => applyColor(c.key)} title={c.key} style={{ width: 24, height: 24, borderRadius: 999, background: c.hex, border: "none", cursor: "pointer" }} />
          ))}
        </div>
      )}
      <input ref={imageInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImagePick} />
      <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFilePick} />
      <input ref={mdInputRef} type="file" accept=".md,text/markdown" style={{ display: "none" }} onChange={handleMdPick} />
      <input ref={videoInputRef} type="file" accept="video/*" style={{ display: "none" }} onChange={handleVideoPick} />
      <input ref={audioInputRef} type="file" accept="audio/*" style={{ display: "none" }} onChange={handleAudioPick} />
      <BlockNoteView editor={editor} theme={theme} onChange={() => onChange(editor.document)} />
    </div>
  );
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

function NotePage({ t, notes, setNotes, isNight, userId, session, authProfile, reminders, openReminder }) {
  const [askConfirm, ConfirmUI] = useConfirm(t);
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
    if (userId) { supabase.from("notes").insert({ id: newNote.id, user_id: userId, title: newNote.title, body: newNote.body, date: newNote.date, pinned: newNote.pinned, tags: newNote.tags }).then(() => {}, () => {}); logAudit(userId, "notes", "add", "เพิ่มโน้ต"); }
    setTitle(""); setBody(null); setTagsInput(""); setDraftKey((k) => k + 1);
  };
  const startEdit = (n) => { setEditingId(n.id); setEditTitle(n.title); setEditBody(migrateBody(n.body)); setEditTags((n.tags || []).join(", ")); };
  const saveEdit = () => {
    const newTitle = editTitle.trim(), newTags = parseTags(editTags);
    setNotes((list) => list.map((n) => (n.id === editingId ? { ...n, title: newTitle, body: editBody, tags: newTags } : n)));
    if (userId) { supabase.from("notes").update({ title: newTitle, body: editBody, tags: newTags }).eq("id", editingId).then(() => {}, () => {}); logAudit(userId, "notes", "edit", "แก้ไขโน้ต"); }
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
  const notesPagination = usePagination(shown, 10); // 📄 แบ่งหน้าถ้าโน้ตเกิน 10 อัน

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
          <NoteEditor key={`new-${draftKey}`} content={null} onChange={setBody} theme={editorTheme} userId={userId} t={t} />
        </div>
        <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="แท็ก (คั่นด้วยจุลภาค เช่น งาน, ไอเดีย)" style={{ ...input(t), marginBottom: 12, fontSize: 12.5 }} />
        <button onClick={add} style={{ ...primaryBtn({ accent: t.accent, accent2: t.accent2, onAccent: t.onAccent }), width: "100%", padding: "11px 0" }}>บันทึกโน้ต</button>
        <div style={{ fontSize: 10.5, color: t.faint, textAlign: "center", marginTop: 8 }}>พิมพ์ "/" ในกล่องข้อความ เพื่อเลือกหัวข้อ, checklist, toggle, แนบรูป/ไฟล์ ฯลฯ</div>
      </div>

      {allTags.length > 0 && (
        <div style={{ position: "relative", marginTop: 14 }}>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6 }}>
            <button onClick={() => setTagFilter(null)} style={{ flexShrink: 0, padding: "6px 12px", borderRadius: 14, cursor: "pointer", fontSize: 11.5, fontWeight: 700, border: `1.5px solid ${!tagFilter ? t.accent : t.border}`, background: !tagFilter ? t.accent : "transparent", color: !tagFilter ? t.onAccent : t.sub }}>ทั้งหมด</button>
            {allTags.map((tag) => (
              <button key={tag} onClick={() => setTagFilter(tag)} style={{ flexShrink: 0, padding: "6px 12px", borderRadius: 14, cursor: "pointer", fontSize: 11.5, fontWeight: 700, border: `1.5px solid ${tagFilter === tag ? t.accent : t.border}`, background: tagFilter === tag ? t.accent : "transparent", color: tagFilter === tag ? t.onAccent : t.sub }}>#{tag}</button>
            ))}
          </div>
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 6, width: 28, pointerEvents: "none", background: `linear-gradient(to right, transparent, ${t.bg})` }} />
        </div>
      )}

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <PaginationBar t={t} page={notesPagination.page} setPage={notesPagination.setPage} totalPages={notesPagination.totalPages} />
        {shown.length === 0 && <Empty t={t} text="ยังไม่มีโน้ต เริ่มจดอันแรก" />}
        {notesPagination.pageItems.map((n) => (
          <div key={n.id} style={{ ...card(t), padding: 14, border: `1px solid ${n.pinned ? t.accent : t.border}` }}>
            {editingId === n.id ? (
              <>
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={{ ...input(t), marginBottom: 8, fontWeight: 700 }} />
                <div style={{ border: `1px solid ${t.border}`, borderRadius: 12, marginBottom: 8, minHeight: 140, overflow: "hidden" }}>
                  <NoteEditor key={`edit-${n.id}`} content={editBody} onChange={setEditBody} theme={editorTheme} userId={userId} t={t} />
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
                    {n.pinned && <Pin size={13} color={t.accent} fill={t.accent} />}{n.title || "(ไม่มีหัวข้อ)"}
                  </div>
                  <div style={{ display: "flex", gap: 2, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                    {n.notionId && <span title="sync ขึ้น Notion แล้ว" style={{ display: "grid", placeItems: "center", padding: 4 }}><Check size={14} color="#2E9E6B" /></span>}
                    <button onClick={() => exportOneMd(n)} style={ghost} title="Export เป็น Markdown"><Download size={15} color={t.faint} /></button>
                    <button onClick={() => togglePin(n.id)} style={ghost} title={n.pinned ? "ปักหมุดแล้ว" : "ปักหมุด"}><Pin size={15} color={n.pinned ? t.accent : t.faint} fill={n.pinned ? t.accent : "none"} /></button>
                    <button onClick={() => openReminder("note", n.id, n.title || "โน้ตไม่มีหัวข้อ")} style={ghost} title="ตั้งเตือนโน้ตนี้"><Bell size={15} color={reminders.some((r) => r.targetType === "note" && r.targetId === n.id) ? t.accent : t.faint} fill={reminders.some((r) => r.targetType === "note" && r.targetId === n.id) ? t.accent : "none"} /></button>
                    <button onClick={() => startEdit(n)} style={ghost} title="แก้ไข"><Pencil size={15} color={t.faint} /></button>
                    <button onClick={() => askConfirm(`ลบโน้ต "${n.title || "(ไม่มีหัวข้อ)"}" เลยไหม?`, () => { setNotes((x) => x.filter((y) => y.id !== n.id)); if (userId) { supabase.from("notes").delete().eq("id", n.id).then(() => {}, () => {}); logAudit(userId, "notes", "delete", "ลบโน้ต"); } })} style={ghost} title="ลบ"><Trash2 size={15} color={t.faint} /></button>
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
      <PaginationBar t={t} page={notesPagination.page} setPage={notesPagination.setPage} totalPages={notesPagination.totalPages} />
      {ConfirmUI}
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
  const savedPagination = usePagination(saved, 10, tab); // 📄 แบ่งหน้าบทความที่บันทึกไว้ ถ้าเกิน 10 เรื่อง
  const [loading, setLoading] = useState(true);
  const [genMsg, setGenMsg] = useState("");
  const [expanded, setExpanded] = useState({}); // id -> bool (พับ/กางในคลัง)
  const [pickedInterests, setPickedInterests] = useState(interests);
  const [editingInterests, setEditingInterests] = useState(false);
  const [customTopic, setCustomTopic] = useState("");

  // 🔊 อ่านออกเสียง — ใช้ Azure Neural TTS เป็นหลัก (ฟรี 500,000 ตัวอักษร/เดือน เสียงธรรมชาติ)
  // ถ้าพลาด (โควตาเดือนนี้เกิน 429 / ยังไม่ตั้งค่า key บน Vercel / เน็ตมีปัญหา) ให้ fallback ไปเสียงเครื่อง (speechSynthesis) แบบเงียบๆ อัตโนมัติ ไม่โชว์ error กวนใจผู้ใช้
  const [speakingId, setSpeakingId] = useState(null);
  const speakAudioRef = useRef(null); // เก็บ <audio> ที่กำลังเล่นอยู่ (เวอร์ชัน Azure) ไว้หยุดได้ตอนกดซ้ำ
  const speakFallbackBrowser = (id, text) => {
    if (!window.speechSynthesis) { setSpeakingId(null); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "th-TH"; // ไม่มีตัวเลือกเสียงให้กดแล้ว ใช้เสียงไทยเริ่มต้นของเครื่องไปเลย
    u.onend = () => setSpeakingId(null);
    u.onerror = () => setSpeakingId(null);
    window.speechSynthesis.speak(u);
  };
  const speak = async (id, text) => {
    // กดซ้ำที่กำลังเล่นอยู่ = หยุด
    if (speakingId === id) {
      window.speechSynthesis?.cancel();
      speakAudioRef.current?.pause();
      speakAudioRef.current = null;
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis?.cancel();
    speakAudioRef.current?.pause();
    setSpeakingId(id);
    try {
      const r = await fetch("/api/knowledge-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "tts", text, voice: "th-TH-PremwadeeNeural", callerToken: session?.access_token }),
      });
      if (!r.ok) throw new Error("azure_tts_failed"); // โควตาเกิน/ยังไม่ตั้งค่า key ฯลฯ — ไปเข้า catch แล้ว fallback
      const blob = await r.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      speakAudioRef.current = audio;
      audio.onended = () => setSpeakingId(null);
      audio.onerror = () => speakFallbackBrowser(id, text); // เล่นไฟล์เสียงพัง ก็ fallback เหมือนกัน
      await audio.play();
    } catch (e) {
      speakFallbackBrowser(id, text); // Azure ใช้ไม่ได้ด้วยเหตุผลอะไรก็ตาม → ใช้เสียงเครื่องแทนแบบเงียบๆ
    }
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
      <style>{`@keyframes rh-spin { to { transform: rotate(360deg); } } .rh-spin { animation: rh-spin .8s linear infinite; }`}</style>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 4, padding: 3, borderRadius: 12, background: t.inputBg, border: `1px solid ${t.border}` }}>
          {[["today", "วันนี้"], ["saved", `บันทึกไว้ ${saved.length}`]].map(([v, lb]) => (
            <button key={v} onClick={() => setTab(v)} style={{ padding: "6px 12px", borderRadius: 9, cursor: "pointer", border: "none", fontWeight: 700, fontSize: 11.5, whiteSpace: "nowrap", background: tab === v ? t.accent : "transparent", color: tab === v ? t.onAccent : t.sub }}>{lb}</button>
          ))}
        </div>
        {tab === "today" && (authProfile?.can_refresh_articles || authProfile?.role === "admin") && (
          <button onClick={refreshToday} disabled={refreshing} style={{ marginLeft: "auto", flexShrink: 0, width: 32, height: 32, borderRadius: 10, border: `1px solid ${t.border}`, background: t.inputBg, display: "grid", placeItems: "center", cursor: "pointer" }} title="รีเฟรชบทความวันนี้">
            <RefreshCw size={14} color={t.sub} className={refreshing ? "rh-spin" : ""} />
          </button>
        )}
        {tab === "saved" && (
          <div style={{ marginLeft: "auto" }}><PageJumpChip t={t} page={savedPagination.page} setPage={savedPagination.setPage} totalPages={savedPagination.totalPages} /></div>
        )}
      </div>


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
                  <button onClick={() => toggleStar(a)} style={ghost} title={a.starred ? "บันทึกแล้ว" : "บันทึก"}><Bookmark size={17} color={a.starred ? t.accent : t.faint} fill={a.starred ? t.accent : "none"} /></button>
                </div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginTop: 10, lineHeight: 1.4 }}>{a.title}</div>
              <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
                {(a.bullets || []).map((b, i) => <li key={i} style={{ fontSize: 12.5, color: t.sub, lineHeight: 1.6 }}>{b}</li>)}
              </ul>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={() => notedTo(a)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", borderRadius: 10, border: `1px solid ${notedIds[a.id] ? "#2E9E6B" : t.border}`, cursor: "pointer", background: notedIds[a.id] ? "#2E9E6B18" : "none", color: notedIds[a.id] ? "#2E9E6B" : t.text, fontSize: 12, fontWeight: 700 }}><StickyNote size={14} /> {notedIds[a.id] ? "ส่งเข้าโน้ตแล้ว ✓" : "ส่งเข้าโน้ต"}</button>
                <button onClick={() => askAi(a)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", borderRadius: 10, border: "none", cursor: "pointer", background: t.accent, color: t.onAccent, fontSize: 12, fontWeight: 700 }}><MessageCircle size={14} /> ถามAIต่อ</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && tab === "saved" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {saved.length === 0 && <Empty t={t} text="ยังไม่มีบทความที่บันทึกไว้ กดไอคอน 🔖 ที่บทความวันนี้ได้เลย" />}
          {savedPagination.pageItems.map((a) => (
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
                    <button onClick={() => notedTo(a)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", borderRadius: 10, border: `1px solid ${notedIds[a.id] ? "#2E9E6B" : t.border}`, cursor: "pointer", background: notedIds[a.id] ? "#2E9E6B18" : "none", color: notedIds[a.id] ? "#2E9E6B" : t.text, fontSize: 12, fontWeight: 700 }}><StickyNote size={14} /> {notedIds[a.id] ? "ส่งเข้าโน้ตแล้ว ✓" : "ส่งเข้าโน้ต"}</button>
                    <button onClick={() => askAi(a)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", borderRadius: 10, border: "none", cursor: "pointer", background: t.accent, color: t.onAccent, fontSize: 12, fontWeight: 700 }}><MessageCircle size={14} /> ถามAIต่อ</button>
                    <button onClick={() => speak(a.id, `${a.title}. ${(a.bullets || []).join(". ")}`)} style={ghost} title="อ่านออกเสียง">
                      {speakingId === a.id ? <Pause size={16} color={t.accent} /> : <Volume2 size={16} color={t.faint} />}
                    </button>
                    <button onClick={() => toggleStar(a)} style={ghost} title="บันทึกแล้ว"><Bookmark size={17} color={t.accent} fill={t.accent} /></button>
                  </div>
                </>
              )}
            </div>
          ))}
          <PaginationBar t={t} page={savedPagination.page} setPage={savedPagination.setPage} totalPages={savedPagination.totalPages} />
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
const NEWS_CATEGORIES = [
  { id: "tech", label: "💻 เทคโนโลยี" },
  { id: "biz", label: "💼 ธุรกิจ" },
  { id: "car", label: "🚗 รถยนต์" },
  { id: "game", label: "🎮 เกม" },
  { id: "life", label: "🌱 ไลฟ์สไตล์" },
  { id: "entertainment", label: "🎬 บันเทิง" },
  { id: "world", label: "🌏 ต่างประเทศ" },
  { id: "saved", label: "⭐ บันทึกไว้" },
];

// จัดกลุ่มหมวดหมู่แบบ accordion ในเมนู (อิงตามที่ไทยรัฐจัดจริง — ธุรกิจ/รถยนต์/ต่างประเทศ อยู่ใต้ "ข่าว",
// เทคโนโลยี/ไลฟ์สไตล์ อยู่ใต้ "ไลฟ์สไตล์") ส่วนที่ไม่อยู่ใน group ไหนจะแสดงเป็นปุ่มเดี่ยวตามปกติ
const NEWS_CATEGORY_GROUPS = [
  { id: "news", label: "📰 ข่าว", catIds: ["biz", "car", "world"] },
  { id: "lifestyle", label: "🎨 ไลฟ์สไตล์", catIds: ["tech", "life"] },
];

function NewsPage({ t, userId, authProfile, setAuthProfile, setChatOpen, setAskAiTopic, hintDefs, seenHintKeys, dismissHint, setNotes }) {
  const [category, setCategory] = useState(authProfile?.news_category || "tech");
  const [notedIds, setNotedIds] = useState({}); // article.link -> true ชั่วคราวหลังส่งเข้าโน้ตสำเร็จ (โชว์ติ๊กถูกเขียว เหมือนหน้าความรู้)
  const [showArrowHint, arrowHintText, dismissArrowHint] = useHint("news_category_arrows", hintDefs, seenHintKeys, dismissHint); // 💡 แนะนำครั้งแรกว่าปัด/กดลูกศรเปลี่ยนหมวดได้ (ข้อความแก้ได้จากหน้าแอดมิน)
  const [menuOpen, setMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(() => new Set(
    NEWS_CATEGORY_GROUPS.filter((g) => g.catIds.includes(category)).map((g) => g.id)
  ));
  const toggleGroup = (id) => setExpandedGroups((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const [items, setItems] = useState([]);
  const [lastFetchedAt, setLastFetchedAt] = useState(null); // ⏱️ เวลาที่ดึงข่าวจริงครั้งล่าสุด (โชว์ให้เห็นว่ารีเฟรชสำเร็จจริง)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savedLinks, setSavedLinks] = useState(new Set());
  const [blockedSources, setBlockedSources] = useState(new Set());
  const [globalBlockedSources, setGlobalBlockedSources] = useState(new Set());
  const [disabledCats, setDisabledCats] = useState([]);
  const [customCategories, setCustomCategories] = useState([]); // [{id,label,query,groupId}]
  const [customGroups, setCustomGroups] = useState([]); // [{id,label}]
  const [categoryLimits, setCategoryLimits] = useState({}); // { [categoryId]: number }

  const loadAppSettings = async () => {
    const [{ data: settings }, { data: blocked }] = await Promise.all([
      supabase.from("app_settings").select("*").in("key", ["news_disabled_categories", "news_default_category", "news_custom_categories", "news_custom_groups", "news_category_limits"]),
      supabase.from("blocked_news_sources_global").select("source"),
    ]);
    const disabledRow = (settings || []).find((s) => s.key === "news_disabled_categories");
    const defaultRow = (settings || []).find((s) => s.key === "news_default_category");
    const customCatsRow = (settings || []).find((s) => s.key === "news_custom_categories");
    const customGroupsRow = (settings || []).find((s) => s.key === "news_custom_groups");
    const limitsRow = (settings || []).find((s) => s.key === "news_category_limits");
    const disabled = disabledRow?.value || [];
    setDisabledCats(disabled);
    setCustomCategories(customCatsRow?.value || []);
    setCustomGroups(customGroupsRow?.value || []);
    setCategoryLimits(limitsRow?.value || {});
    setGlobalBlockedSources(new Set((blocked || []).map((x) => x.source)));
    // ถ้ายังไม่เคยเลือกหมวดมาก่อน (ไม่มีค่าใน authProfile) ให้ใช้หมวดเริ่มต้นที่ admin ตั้งไว้แทน "tech"
    if (!authProfile?.news_category && defaultRow?.value) { setCategory(defaultRow.value); return; }
    // ถ้าหมวดที่เลือกอยู่ถูก admin ปิดไปแล้ว ให้สลับไปหมวดเริ่มต้น (หรือหมวดแรกที่ยังเปิดอยู่) แทนอัตโนมัติ
    if (category !== "saved" && disabled.includes(category)) {
      const fallback = (defaultRow?.value && !disabled.includes(defaultRow.value)) ? defaultRow.value : NEWS_CATEGORIES.find((c) => c.id !== "saved" && !disabled.includes(c.id))?.id;
      if (fallback) setCategory(fallback);
    }
  };

  const loadBlockedSources = () => {
    if (!userId) return;
    supabase.from("blocked_news_sources").select("source").eq("user_id", userId).then(({ data }) => {
      setBlockedSources(new Set((data || []).map((x) => x.source)));
    });
  };

  const blockSource = async (source) => {
    if (!userId || !source) return;
    setBlockedSources((s) => new Set(s).add(source)); // ซ่อนออกจากจอทันที ไม่ต้องรอ
    setItems((list) => list.filter((x) => x.source !== source));
    await supabase.from("blocked_news_sources").upsert({ user_id: userId, source });
  };

  const unblockSource = async (source) => {
    if (!userId) return;
    setBlockedSources((s) => { const n = new Set(s); n.delete(source); return n; });
    await supabase.from("blocked_news_sources").delete().eq("user_id", userId).eq("source", source);
  };
  const [stats, setStats] = useState({}); // { [link]: { views, likeCount, likedByMe } }

  const loadStats = async (list) => {
    const links = list.map((x) => x.link).filter(Boolean);
    if (links.length === 0) return;
    const [{ data: statsData }, { data: likesData }] = await Promise.all([
      supabase.from("news_stats").select("link, views").in("link", links),
      supabase.from("news_likes").select("link, user_id").in("link", links),
    ]);
    const next = {};
    links.forEach((l) => {
      const s = (statsData || []).find((x) => x.link === l);
      const likesForLink = (likesData || []).filter((x) => x.link === l);
      next[l] = { views: s?.views || 0, likeCount: likesForLink.length, likedByMe: likesForLink.some((x) => x.user_id === userId) };
    });
    setStats((prev) => ({ ...prev, ...next }));
  };

  const toggleLike = async (x) => {
    if (!userId) return;
    const cur = stats[x.link] || { views: 0, likeCount: 0, likedByMe: false };
    if (cur.likedByMe) {
      await supabase.from("news_likes").delete().eq("link", x.link).eq("user_id", userId);
      setStats((s) => ({ ...s, [x.link]: { ...cur, likeCount: Math.max(0, cur.likeCount - 1), likedByMe: false } }));
    } else {
      await supabase.from("news_likes").insert({ link: x.link, user_id: userId, title: x.title });
      setStats((s) => ({ ...s, [x.link]: { ...cur, likeCount: cur.likeCount + 1, likedByMe: true } }));
    }
  };

  const openNews = (x) => {
    window.open(x.link, "_blank", "noopener,noreferrer");
    supabase.rpc("increment_news_view", { p_link: x.link, p_title: x.title, p_source: x.source }).then(() => {});
    setStats((s) => ({ ...s, [x.link]: { ...(s[x.link] || { likeCount: 0, likedByMe: false }), views: (s[x.link]?.views || 0) + 1 } }));
  };

  const loadSavedLinks = () => {
    if (!userId) return;
    supabase.from("saved_news").select("link").eq("user_id", userId).then(({ data }) => {
      setSavedLinks(new Set((data || []).map((x) => x.link)));
    });
  };

  const loadSavedList = () => {
    setLoading(true);
    setError("");
    supabase.from("saved_news").select("*").eq("user_id", userId).order("created_at", { ascending: false }).then(({ data, error: e }) => {
      if (e) setError("โหลดข่าวที่บันทึกไว้ไม่สำเร็จ");
      const list = (data || []).map((x) => ({ ...x, time: "" }));
      setItems(list);
      setLoading(false);
      loadStats(list);
    });
  };

  const load = (cat, force) => {
    if (cat === "saved") { loadSavedList(); return; }
    setLoading(true);
    setError("");
    const customCat = customCategories.find((c) => c.id === cat);
    const qParam = customCat ? `&q=${encodeURIComponent(customCat.query || customCat.label)}` : "";
    const limitParam = `&limit=${categoryLimits[cat] || 10}`;
    fetch(`/api/content?type=news&category=${cat}${qParam}${limitParam}${force ? "&force=1" : ""}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); setItems([]); }
        else { const list = data.items || []; setItems(list); loadStats(list); setLastFetchedAt(data.fetchedAt || null); }
      })
      .catch(() => setError("โหลดข่าวไม่สำเร็จ ลองใหม่อีกครั้ง"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadSavedLinks(); loadBlockedSources(); loadAppSettings(); }, [userId]);
  useEffect(() => { load(category); }, [category, customCategories, categoryLimits]);

  const selectCategory = async (cat) => {
    setCategory(cat);
    if (cat === "saved") return; // ไม่ต้องบันทึกเป็นหมวดโปรดถาวร เพราะเป็นแค่ที่เก็บชั่วคราว
    if (userId) {
      supabase.from("profiles").update({ news_category: cat }).eq("id", userId).then(() => {});
      setAuthProfile?.((p) => ({ ...p, news_category: cat }));
    }
  };

  const toggleSave = async (x) => {
    if (!userId) return;
    const isSaved = savedLinks.has(x.link);
    if (isSaved) {
      await supabase.from("saved_news").delete().eq("user_id", userId).eq("link", x.link);
      setSavedLinks((s) => { const n = new Set(s); n.delete(x.link); return n; });
      if (category === "saved") setItems((list) => list.filter((y) => y.link !== x.link));
    } else {
      await supabase.from("saved_news").insert({ user_id: userId, title: x.title, link: x.link, image: x.image, source: x.source, summary: x.summary });
      setSavedLinks((s) => new Set(s).add(x.link));
    }
  };

  const sendNewsToNote = async (x) => {
    const body = [
      { type: "heading", props: { level: 2 }, content: x.title },
      { type: "paragraph", content: x.summary || "" },
      { type: "paragraph", content: x.link },
    ];
    const newNote = { id: uid(), title: x.title, body, date: todayStr(), pinned: false, tags: ["ข่าว"] };
    setNotes?.((n) => [newNote, ...n]); // ⚠️ บั๊กเดิม: บันทึกลง DB จริง แต่ลืมอัปเดต state ในเครื่อง ทำให้หน้าโน้ตไม่เห็นทันที ต้องรีเฟรชทั้งแอปก่อนถึงจะเห็น
    setNotedIds((m) => ({ ...m, [x.link]: true }));
    setTimeout(() => setNotedIds((m) => ({ ...m, [x.link]: false })), 2500);
    if (userId) {
      await supabase.from("notes").insert({ id: newNote.id, user_id: userId, title: newNote.title, body: newNote.body, date: newNote.date, pinned: newNote.pinned, tags: newNote.tags });
      logAudit(userId, "notes", "add", "ส่งข่าวเข้าโน้ต: " + x.title);
    }
  };

  const askAi = (x) => {
    setAskAiTopic?.({ title: x.title });
    setChatOpen?.(true);
  };

  // ปัดซ้าย/ขวาบนพื้นที่ข่าว เปลี่ยนหมวดหมู่ถัดไป/ก่อนหน้า (ต้องปัดแนวนอนชัดเจน กันชนกับการเลื่อนดูข่าวขึ้นลง)
  const touchStartRef = useRef(null);
  const handleTouchStart = (e) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchEnd = (e) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.3) return; // ต้องปัดแนวนอนเด่นชัด ไม่ใช่แค่เลื่อนขึ้นลง
    const idx = visibleCategories.findIndex((c) => c.id === category);
    if (dx < 0 && idx < visibleCategories.length - 1) selectCategory(visibleCategories[idx + 1].id); // ปัดซ้าย -> หมวดถัดไป
    else if (dx > 0 && idx > 0) selectCategory(visibleCategories[idx - 1].id); // ปัดขวา -> หมวดก่อนหน้า
  };

  // รวมหมวดมาตรฐาน + หมวด custom ที่ admin เพิ่มเอง (แทรกก่อน "บันทึกไว้" เสมอ)
  const combinedCategories = [
    ...NEWS_CATEGORIES.filter((c) => c.id !== "saved"),
    ...customCategories.map((c) => ({ id: c.id, label: c.label })),
    NEWS_CATEGORIES.find((c) => c.id === "saved"),
  ];
  const combinedGroups = [...NEWS_CATEGORY_GROUPS, ...customGroups.map((g) => ({ id: g.id, label: g.label, catIds: [] }))];
  const currentCat = combinedCategories.find((c) => c.id === category);
  const visibleItems = category === "saved" ? items : items.filter((x) => !blockedSources.has(x.source) && !globalBlockedSources.has(x.source));
  const newsPagination = usePagination(visibleItems, 10, category); // 📄 แบ่งหน้าถ้าข่าวในหมวดนี้เกิน 10 เรื่อง (รีเซ็ตกลับหน้า 1 ทุกครั้งที่เปลี่ยนหมวดหมู่)
  const visibleCategories = combinedCategories.filter((c) => c.id === "saved" || !disabledCats.includes(c.id));
  // groupId ของ custom category อาจชี้ไปกลุ่ม hardcode หรือกลุ่ม custom ก็ได้ — รวม catIds ให้ครบทุกกลุ่ม
  const groupsWithCats = combinedGroups.map((g) => ({
    ...g,
    catIds: [...g.catIds, ...customCategories.filter((c) => c.groupId === g.id).map((c) => c.id)],
  }));

  return (<>
    <style>{`@keyframes rh-drawer-in { from { transform: translateX(-100%); } to { transform: translateX(0); } } @keyframes rh-drawer-backdrop { from { opacity: 0; } to { opacity: 1; } }`}</style>
    {menuOpen && (
      <ModalPortal>
        <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 130, background: "rgba(10,14,25,.55)", backdropFilter: "blur(2px)", animation: "rh-drawer-backdrop .2s ease-out" }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            position: "absolute", left: 0, top: 0, bottom: 0, width: "78%", maxWidth: 300,
            background: t.page, boxShadow: "6px 0 30px rgba(0,0,0,.3)", animation: "rh-drawer-in .28s cubic-bezier(.2,.9,.3,1)",
            display: "flex", flexDirection: "column", overflowY: "auto",
          }}>
            <div style={{ padding: "18px 18px 14px", background: `linear-gradient(135deg, ${t.accent}, ${t.accent2 || t.accent})`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: t.onAccent }}>หมวดหมู่ข่าว</div>
                <div style={{ fontSize: 11, color: t.onAccent, opacity: .85, marginTop: 2 }}>เลือกสิ่งที่สนใจ</div>
              </div>
              <button onClick={() => setMenuOpen(false)} style={{ background: "rgba(255,255,255,.2)", border: "none", borderRadius: 999, width: 30, height: 30, display: "grid", placeItems: "center", cursor: "pointer" }}>
                <X size={16} color={t.onAccent} />
              </button>
            </div>
            <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 3 }}>
              {groupsWithCats.map((g) => {
                const catsInGroup = visibleCategories.filter((c) => g.catIds.includes(c.id));
                if (catsInGroup.length === 0) return null; // ทุกตัวในกลุ่มถูกปิดหมด ไม่ต้องโชว์กลุ่ม
                const isOpen = expandedGroups.has(g.id);
                const activeInside = catsInGroup.some((c) => c.id === category);
                return (
                  <div key={g.id}>
                    <button onClick={() => toggleGroup(g.id)} style={{
                      display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "13px 14px", borderRadius: 12,
                      border: "none", cursor: "pointer", textAlign: "left", fontSize: 13.5, fontWeight: 700,
                      background: activeInside && !isOpen ? `${t.accent}20` : "transparent", color: t.text,
                    }}>
                      <span style={{ fontSize: 17 }}>{g.label.split(" ")[0]}</span>
                      <span style={{ flex: 1 }}>{g.label.split(" ").slice(1).join(" ")}</span>
                      <span style={{ fontSize: 15, color: t.faint, fontWeight: 800 }}>{isOpen ? "−" : "+"}</span>
                    </button>
                    {isOpen && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 3, paddingLeft: 20, marginBottom: 4 }}>
                        {catsInGroup.map((c) => (
                          <button key={c.id} onClick={() => { selectCategory(c.id); setMenuOpen(false); }} style={{
                            display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 14px", borderRadius: 12,
                            border: "none", cursor: "pointer", textAlign: "left", fontSize: 13, fontWeight: 700,
                            background: category === c.id ? t.accent : "transparent",
                            color: category === c.id ? t.onAccent : t.text,
                            transition: "background .15s",
                          }}>
                            <span style={{ fontSize: 15 }}>{c.label.split(" ")[0]}</span>
                            <span>{c.label.split(" ").slice(1).join(" ")}</span>
                            {category === c.id && <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: 999, background: t.onAccent }} />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {/* หมวดที่ไม่ได้อยู่ในกลุ่มไหน แสดงเป็นปุ่มเดี่ยวตามปกติ */}
              {visibleCategories.filter((c) => !groupsWithCats.some((g) => g.catIds.includes(c.id))).map((c) => (
                <button key={c.id} onClick={() => { selectCategory(c.id); setMenuOpen(false); }} style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "13px 14px", borderRadius: 12,
                  border: "none", cursor: "pointer", textAlign: "left", fontSize: 13.5, fontWeight: 700,
                  background: category === c.id ? t.accent : "transparent",
                  color: category === c.id ? t.onAccent : t.text,
                  transition: "background .15s",
                }}>
                  <span style={{ fontSize: 17 }}>{c.label.split(" ")[0]}</span>
                  <span>{c.label.split(" ").slice(1).join(" ")}</span>
                  {category === c.id && <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: 999, background: t.onAccent }} />}
                </button>
              ))}
            </div>
            {blockedSources.size > 0 && (
              <div style={{ padding: "10px 14px 18px", borderTop: `1px solid ${t.border}`, marginTop: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: t.faint, marginBottom: 8 }}>แหล่งข่าวที่บล็อกไว้ (เฉพาะบัญชีคุณ)</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[...blockedSources].map((s) => (
                    <div key={s} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", borderRadius: 10, background: t.inputBg }}>
                      <span style={{ fontSize: 12, color: t.sub }}>{s}</span>
                      <button onClick={() => unblockSource(s)} style={{ fontSize: 11, fontWeight: 700, color: t.accent, background: "none", border: "none", cursor: "pointer" }}>เลิกบล็อก</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </ModalPortal>
    )}
    <PageHead t={t} title="ข่าวสาร" sub={category !== "saved" && lastFetchedAt ? `อัปเดตล่าสุด ${new Date(lastFetchedAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.` : "อัปเดตสถานการณ์โลก"} icon={<Newspaper size={20} color={t.accent} />} right={
      <div style={{ position: "relative", display: "flex", gap: 4, flexShrink: 0 }}>
        {category !== "saved" && (
          <button onClick={() => load(category, true)} disabled={loading} style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${t.border}`, background: t.inputBg, display: "grid", placeItems: "center", cursor: "pointer" }} title="รีเฟรชข่าวล่าสุด">
            <RefreshCw size={15} color={t.text} className={loading ? "rh-news-spin" : ""} />
          </button>
        )}
        <button onClick={() => { const idx = visibleCategories.findIndex((c) => c.id === category); if (idx > 0) selectCategory(visibleCategories[idx - 1].id); dismissArrowHint(); }} style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${t.border}`, background: t.inputBg, display: "grid", placeItems: "center", cursor: "pointer" }} title="หมวดก่อนหน้า">
          <ChevronLeft size={16} color={t.text} />
        </button>
        <button onClick={() => { const idx = visibleCategories.findIndex((c) => c.id === category); if (idx < visibleCategories.length - 1) selectCategory(visibleCategories[idx + 1].id); dismissArrowHint(); }} style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${t.border}`, background: t.inputBg, display: "grid", placeItems: "center", cursor: "pointer" }} title="หมวดถัดไป">
          <ChevronRight size={16} color={t.text} />
        </button>
        <Coachmark t={t} show={showArrowHint} onDismiss={dismissArrowHint} align="right" text={arrowHintText} />
      </div>
    } />
    <style>{`@keyframes rh-news-spin { to { transform: rotate(360deg); } } .rh-news-spin { animation: rh-news-spin 0.8s linear infinite; }`}</style>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, marginBottom: 4 }}>
      <button onClick={() => setMenuOpen(true)} style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 12, border: `1px solid ${t.border}`, background: t.inputBg, display: "grid", placeItems: "center", cursor: "pointer" }} title="เลือกหมวดหมู่">
        <Menu size={18} color={t.text} />
      </button>
      <button onClick={() => setMenuOpen(true)} style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "9px 14px", borderRadius: 12, border: `1px solid ${t.border}`, background: t.inputBg, cursor: "pointer", textAlign: "center" }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentCat?.label}</span>
      </button>
      <PageJumpChip t={t} page={newsPagination.page} setPage={newsPagination.setPage} totalPages={newsPagination.totalPages} />
    </div>
    <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
      {loading && <Empty t={t} text="กำลังโหลด..." />}
      {!loading && error && <Empty t={t} text={`⚠️ ${error}`} />}
      {!loading && !error && visibleItems.length === 0 && <Empty t={t} text={category === "saved" ? "ยังไม่มีข่าวที่บันทึกไว้" : "ยังไม่มีข่าวในหมวดนี้"} />}
      {!loading && !error && newsPagination.pageItems.map((x, i) => {
        const st = stats[x.link] || { views: 0, likeCount: 0, likedByMe: false };
        return (
        <div key={x.link || i} style={{ ...card(t), padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          <div onClick={() => openNews(x)} style={{ display: "flex", gap: 12, cursor: "pointer" }}>
            {x.image && <img src={x.image} alt="" style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, gap: 8 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: t.accent, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{x.source}</span>
                  {category !== "saved" && (
                    <button onClick={(e) => { e.stopPropagation(); blockSource(x.source); }} title={`ไม่รับข่าวจาก ${x.source} อีก`} style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 2, background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 999, padding: "2px 6px", cursor: "pointer" }}>
                      <X size={9} color={t.faint} />
                      <span style={{ fontSize: 9.5, color: t.faint, fontWeight: 700, whiteSpace: "nowrap" }}>บล็อก</span>
                    </button>
                  )}
                </span>
                {x.time && <span style={{ fontSize: 10.5, color: t.faint, flexShrink: 0 }}>{x.time}</span>}
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: t.text, lineHeight: 1.4, marginBottom: 4 }}>{x.title}</div>
              {x.summary && <div style={{ fontSize: 11.5, color: t.sub, lineHeight: 1.4 }}>{x.summary}</div>}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", rowGap: 6, columnGap: 4, justifyContent: "flex-end", borderTop: `1px solid ${t.border}`, paddingTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginRight: "auto", color: t.faint }}>
              <Eye size={13} color={t.faint} />
              <span style={{ fontSize: 11 }}>{st.views}</span>
            </div>
            <button onClick={() => sendNewsToNote(x)} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "4px 6px" }}>
              <StickyNote size={15} color={notedIds[x.link] ? "#2E9E6B" : t.faint} />
              <span style={{ fontSize: 11, color: notedIds[x.link] ? "#2E9E6B" : t.faint, fontWeight: 700, whiteSpace: "nowrap" }}>{notedIds[x.link] ? "ส่งแล้ว ✓" : "ส่งเข้าโน้ต"}</span>
            </button>
            <button onClick={() => askAi(x)} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "4px 6px" }}>
              <MessageCircle size={15} color={t.faint} />
              <span style={{ fontSize: 11, color: t.faint, fontWeight: 700, whiteSpace: "nowrap" }}>ถาม AI ต่อ</span>
            </button>
            <button onClick={() => toggleLike(x)} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "4px 6px" }}>
              <Heart size={15} color={st.likedByMe ? "#E0245E" : t.faint} fill={st.likedByMe ? "#E0245E" : "none"} />
              <span style={{ fontSize: 11, color: st.likedByMe ? "#E0245E" : t.faint, fontWeight: 700, whiteSpace: "nowrap" }}>{st.likeCount > 0 ? st.likeCount : "ไลค์"}</span>
            </button>
            <button onClick={() => toggleSave(x)} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "4px 6px" }}>
              <Bookmark size={15} color={savedLinks.has(x.link) ? t.accent : t.faint} fill={savedLinks.has(x.link) ? t.accent : "none"} />
              <span style={{ fontSize: 11, color: savedLinks.has(x.link) ? t.accent : t.faint, fontWeight: 700, whiteSpace: "nowrap" }}>{savedLinks.has(x.link) ? "บันทึกแล้ว" : "บันทึก"}</span>
            </button>
          </div>
        </div>
        ); })}
      <PaginationBar t={t} page={newsPagination.page} setPage={newsPagination.setPage} totalPages={newsPagination.totalPages} />
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
  useEffect(() => { if (userId) load(); }, [userId, mentor]);

  const delSession = async (sid) => {
    await supabase.from("mentor_chat_messages").delete().eq("user_id", userId).eq("mentor", mentor).eq("session_id", sid);
    setConfirmDelId(null);
    load();
  };

  return (
    <ModalPortal>
      <div style={overlayHi} onClick={close}>
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
  useEffect(() => { if (userId) loadHistory(); }, [mentor, userId]);

  // เริ่มแชทใหม่ = สร้าง session ใหม่ ไม่แตะของเก่าเลย (ดูย้อนหลังได้ทีหลังผ่านปุ่ม "ประวัติเก่า")
  const newChat = async () => {
    const g = greeting(); const sid = crypto.randomUUID();
    setMsgs([g]); setCurrentSessionId(sid); setShowHistList(false);
    if (userId) { supabase.from("mentor_chat_messages").insert({ user_id: userId, mentor, session_id: sid, who: g.who, text: g.text }).then(({ error }) => { if (error) console.error("บันทึกข้อความทักทายไม่สำเร็จ:", error.message); }, () => {}); logAudit(userId, "mentor", "new_session", "เริ่มบทสนทนาใหม่กับโค้ช"); }
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
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: t.page }}>
      <div style={{ width: "100%", maxWidth: 440, height: "100%", margin: "0 auto", background: t.page, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 12, background: t.hero }}>
          <button onClick={() => setSwitchPick(true)} style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0, background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}>
            {M.avatarUrl ? (
              <img src={M.avatarUrl} alt="" style={{ width: 40, height: 40, borderRadius: 20, objectFit: "cover", flexShrink: 0 }} />
            ) : (
              <span style={{ width: 40, height: 40, borderRadius: 20, background: `linear-gradient(135deg,${M.accent2},${M.accent})`, color: M.onAccent, display: "grid", placeItems: "center", fontWeight: 800, flexShrink: 0 }}>{M.letter}</span>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: t.onAccent, display: "flex", alignItems: "center", gap: 5 }}>{M.full} <ChevronRight size={13} color={`${t.onAccent}99`} style={{ transform: "rotate(90deg)" }} /></div>
              <div style={{ fontSize: 11, color: `${t.onAccent}B3`, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{M.tag}</div>
            </div>
          </button>
          <button onClick={() => setShowHistList(true)} style={{ background: `${t.onAccent}26`, border: "none", borderRadius: 12, width: 32, height: 32, cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }} title="ดูแชทเก่าที่เก็บไว้"><Clock size={15} color={t.onAccent} /></button>
          <button onClick={newChat} style={{ background: `${t.onAccent}26`, border: "none", borderRadius: 12, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }} title="เริ่มแชทใหม่ (ของเก่ายังเก็บไว้ ดูย้อนหลังได้)">
            <Plus size={13} color={t.onAccent} /><span style={{ fontSize: 10.5, color: t.onAccent, fontWeight: 700 }}>ใหม่</span>
          </button>
          <button onClick={close} style={{ background: `${t.onAccent}26`, border: "none", borderRadius: 16, width: 32, height: 32, cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}><X size={18} color={t.onAccent} /></button>
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
    // 🐛 เดิมใช้ FileReader.readAsDataURL() แปลงไฟล์เป็น base64 string ทันที — รูปจากกล้องมือถือ (4000-8000px, 8-50MB)
    // กลายเป็น string มหึมาแล้ว decode เต็มความละเอียด ทำ RAM มือถือไม่พอ แอป crash เป็นหน้าดำ
    // ใช้ URL.createObjectURL() แทน เบากว่ามาก ไม่ต้อง encode/decode เต็มไฟล์ก่อน
    setAvatarCropSrc(URL.createObjectURL(f));
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
      if (id === "none") {
        // ผู้ช่วยทั่วไป — เก็บรูปไว้ในโปรไฟล์ผู้ใช้เอง (ไม่ใช่ตาราง custom_mentors)
        await supabase.from("profiles").update({ assistant_avatar_url: data.publicUrl }).eq("id", userId);
        setAuthProfile((p) => ({ ...p, assistant_avatar_url: data.publicUrl }));
      } else if (MENTORS[id]) {
        // โค้ช 3 ตัวหลักที่ฝังในระบบ (Loid/Itachi/Bond) — เป็นค่าคงที่ในโค้ด ไม่มีแถวในฐานข้อมูล
        // เก็บเป็น jsonb {mentorId: url} ในโปรไฟล์แทน จะได้ไม่ต้องเพิ่มคอลัมน์ทุกครั้งที่มีโค้ชใหม่
        const nextMap = { ...(authProfile?.builtin_mentor_avatars || {}), [id]: data.publicUrl };
        await supabase.from("profiles").update({ builtin_mentor_avatars: nextMap }).eq("id", userId);
        setAuthProfile((p) => ({ ...p, builtin_mentor_avatars: nextMap }));
      } else {
        await supabase.from("custom_mentors").update({ avatar_url: data.publicUrl }).eq("id", id);
        setCustomMentors((cs) => cs.map((c) => (c.id === id ? { ...c, avatarUrl: data.publicUrl } : c)));
      }
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
        {isAdmin && Object.entries(MENTORS).filter(([k]) => k !== "none").map(([k, m]) => {
          const savedAva = authProfile?.builtin_mentor_avatars?.[k];
          return (
          <button key={k} onClick={() => pick(k)} style={{ display: "flex", alignItems: "center", gap: 14, padding: 14, borderRadius: 18, cursor: "pointer", textAlign: "left", background: t.surface, border: `2px solid ${mentor === k ? m.accent : t.border}` }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              {savedAva ? (
                <img src={savedAva} alt="" style={{ width: 46, height: 46, borderRadius: 23, objectFit: "cover" }} />
              ) : (
                <span style={{ width: 46, height: 46, borderRadius: 23, background: `linear-gradient(135deg,${m.accent2},${m.accent})`, color: m.onAccent, display: "grid", placeItems: "center", fontWeight: 800, fontSize: 18 }}>{m.letter}</span>
              )}
              <button onClick={(e) => { e.stopPropagation(); setAvatarTargetId(k); avatarFileRef.current?.click(); }} style={{ position: "absolute", bottom: -3, right: -3, width: 20, height: 20, borderRadius: 10, background: t.accent, border: `2px solid ${t.surface}`, cursor: "pointer", display: "grid", placeItems: "center" }}>
                <Camera size={10} color={t.onAccent} />
              </button>
            </div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>{m.full}</div><div style={{ fontSize: 12, color: t.sub }}>{m.tag}</div></div>
            {mentor === k && <Check size={20} color={m.accent} />}
          </button>
          );
        })}
        <button onClick={() => pick("none")} style={{ display: "flex", alignItems: "center", gap: 14, padding: 14, borderRadius: 18, cursor: "pointer", textAlign: "left", background: t.surface, border: `2px solid ${mentor === "none" ? MENTORS.none.accent : t.border}` }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            {authProfile?.assistant_avatar_url ? (
              <img src={authProfile.assistant_avatar_url} alt="" style={{ width: 46, height: 46, borderRadius: 23, objectFit: "cover" }} />
            ) : (
              <span style={{ width: 46, height: 46, borderRadius: 23, background: `linear-gradient(135deg,${MENTORS.none.accent2},${MENTORS.none.accent})`, color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 18 }}>{MENTORS.none.letter}</span>
            )}
            <button onClick={(e) => { e.stopPropagation(); setAvatarTargetId("none"); avatarFileRef.current?.click(); }} style={{ position: "absolute", bottom: -3, right: -3, width: 20, height: 20, borderRadius: 10, background: t.accent, border: `2px solid ${t.surface}`, cursor: "pointer", display: "grid", placeItems: "center" }}>
              <Camera size={10} color={t.onAccent} />
            </button>
          </div>
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

function ThemePicker({ t, theme, setTheme, mode, customAccent, setCustomAccent, close }) {
  const [pendingColor, setPendingColor] = useState(customAccent);
  return (<div style={overlay} onClick={close}><div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "24px 24px 0 0", padding: 20, maxHeight: "85vh", overflowY: "auto" }}>
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

      {/* 🎨 กำหนดสีเอง — user เลือกสีอะไรก็ได้ อีก 2 สี (accent2/onAccent) คำนวณอัตโนมัติจากสีที่เลือก */}
      <div style={{ padding: 14, borderRadius: 18, background: t.surface, border: `2px solid ${theme === "custom" ? pendingColor : t.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <label style={{ position: "relative", width: 46, height: 46, borderRadius: 23, flexShrink: 0, cursor: "pointer", overflow: "hidden", background: pendingColor, border: `1px solid ${t.border}` }}>
            <input type="color" value={pendingColor} onChange={(e) => setPendingColor(e.target.value)} style={{ position: "absolute", inset: -4, width: "calc(100% + 8px)", height: "calc(100% + 8px)", opacity: 0, cursor: "pointer" }} />
          </label>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>กำหนดเอง</div>
            <div style={{ fontSize: 11.5, color: t.sub }}>แตะวงกลมเพื่อเลือกสีที่ชอบ</div>
          </div>
          {theme === "custom" && <Check size={20} color={pendingColor} />}
        </div>
        <button onClick={() => { setCustomAccent(pendingColor); setTheme("custom"); close(); }} style={{ ...primaryBtn({ accent: pendingColor, accent2: lightenHex(pendingColor, 0.2), onAccent: relativeLuminance(pendingColor) > 0.5 ? "#141414" : "#FFFFFF" }), width: "100%", padding: "10px 0", marginTop: 12, fontSize: 13 }}>ใช้สีนี้</button>
      </div>
    </div>
  </div></div>);
}

// 🏠 เลือกโครงหน้า Home — 3 แบบ (ของเดิม/แนววอลเล็ต/เบนโต) ตามที่ Maxnuss ยืนยันให้ user เลือกเองได้ทั้ง 3
const HOME_LAYOUTS = [
  { id: "original", label: "ของเดิม", desc: "Hero คำคม+ริง ตามด้วยการ์ด 2x2" },
  { id: "wallet", label: "แนววอลเล็ต", desc: "ยอดเงินตัวใหญ่บนสุด + แถวไอคอนลัด" },
  { id: "bento", label: "เบนโต", desc: "การ์ดใหญ่เด่น 1 อัน + บล็อกเล็กล้อมรอบ" },
];
function HomeLayoutPicker({ t, homeLayout, setHomeLayout, close }) {
  return (<div style={overlay} onClick={close}><div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.page, borderRadius: "24px 24px 0 0", padding: 20 }}>
    <div style={{ fontSize: 17, fontWeight: 800, color: t.text, marginBottom: 4 }}>โครงหน้า Home</div>
    <div style={{ fontSize: 12.5, color: t.sub, marginBottom: 16 }}>เลือกวิธีจัดวางวิดเจ็ตหน้าแรกที่ชอบ เปลี่ยนได้ตลอด</div>
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {HOME_LAYOUTS.map((l) => { const on = homeLayout === l.id; return (
        <button key={l.id} onClick={() => { setHomeLayout(l.id); close(); }} style={{ display: "flex", alignItems: "center", gap: 14, padding: 14, borderRadius: 18, cursor: "pointer", textAlign: "left", background: t.surface, border: `2px solid ${on ? t.accent : t.border}` }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>{l.label}</div>
            <div style={{ fontSize: 11.5, color: t.sub }}>{l.desc}</div>
          </div>
          {on && <Check size={20} color={t.accent} />}
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
    // 🐛 เดิมใช้ FileReader.readAsDataURL() — รูปกล้องมือถือความละเอียดสูงทำ RAM ไม่พอ แอป crash เป็นหน้าดำ (บัคเดียวกับ mentor avatar)
    setCropSrc(URL.createObjectURL(f));
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
  const MAX_IN = 1600; // 🐛 เดิมเอารูปต้นฉบับ (กล้องมือถือ 4000-8000px) มาวาดซ้ำๆ ตอนลาก/ซูมตรงๆ เลย ทำ RAM ไม่พอ แอป crash เป็นหน้าดำ — ย่อลงเหลือไม่เกิน 1600px ก่อนเริ่ม crop เสมอ
  const imgRef = useRef(null);
  const [imgSize, setImgSize] = useState(null); // { w, h } ขนาดของรูปที่ใช้ crop จริง (หลังย่อแล้วถ้าจำเป็น)
  const [dispSrc, setDispSrc] = useState(null); // src จริงที่ใช้แสดง/crop (อาจเป็นรูปย่อแล้ว ไม่ใช่ src ต้นฉบับเสมอไป)
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const { width: w, height: h } = img;
      if (Math.max(w, h) > MAX_IN) {
        // รูปใหญ่เกินไป — ย่อลงผ่าน canvas ก่อน แล้วค่อยใช้รูปที่ย่อแล้วตลอดขั้นตอน crop
        const ratio = MAX_IN / Math.max(w, h);
        const nw = Math.round(w * ratio), nh = Math.round(h * ratio);
        const c = document.createElement("canvas"); c.width = nw; c.height = nh;
        c.getContext("2d").drawImage(img, 0, 0, nw, nh);
        setDispSrc(c.toDataURL("image/jpeg", 0.9));
        setImgSize({ w: nw, h: nh });
      } else {
        setDispSrc(src);
        setImgSize({ w, h });
      }
    };
    img.src = src;
    return () => {
      cancelled = true;
      if (src?.startsWith("blob:")) URL.revokeObjectURL(src); // เคลียร์ object URL ต้นฉบับกันหน่วยความจำรั่ว
    };
  }, [src]);

  if (!imgSize || !dispSrc) return null;

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
            ref={imgRef} src={dispSrc} alt="" draggable={false}
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

// ---------------- 📞 Incoming call watcher (ทำงานทั่วทั้งแอป ไม่ว่าอยู่หน้าไหน) ----------------
// ฟัง presence ของทุกห้องแชทที่เราอยู่ พอมีคนเริ่มโทร -> เด้งแบนเนอร์ + เสียงเรียกเข้า ให้กดรับ/ปฏิเสธได้เลย
function IncomingCallWatcher({ t, userId, onAccept }) {
  const [incoming, setIncoming] = useState(null); // { threadId, roomName, callerName, otherIds }
  const ringRef = useRef(null);
  const dismissedRef = useRef({}); // threadId -> true (กดปฏิเสธแล้ว ไม่เด้งซ้ำจนกว่าจะมีสายใหม่)

  const playRing = () => { stopRing(); ringRef.current = startCallRingtone(); };
  const stopRing = () => { try { ringRef.current?.stop(); } catch (e) {} ringRef.current = null; };
  const prevCountRef = useRef({}); // threadId -> จำนวนคนในสายครั้งก่อน (ใช้จับ "สายใหม่จริงๆ" = เพิ่งเปลี่ยนจาก 0 เป็นมีคน)

  useEffect(() => {
    if (!userId) return;
    let channels = [];
    let cancelled = false;
    (async () => {
      const { data: mine } = await supabase.from("chat_thread_members").select("thread_id").eq("user_id", userId);
      if (cancelled || !mine) return;
      for (const row of mine) {
        const threadId = row.thread_id;
        const ch = supabase.channel(`callwatch-${threadId}`);
        ch.on("presence", { event: "sync" }, () => {
          const state = ch.presenceState();
          const people = Object.values(state).flat().filter((p) => p.userId && p.userId !== userId);
          const prevCount = prevCountRef.current[threadId] ?? 0;
          prevCountRef.current[threadId] = people.length;
          if (people.length > 0 && !dismissedRef.current[threadId]) {
            // ดังเฉพาะตอน "สายใหม่จริงๆ" = เพิ่งเปลี่ยนจากไม่มีใครเป็นมีคน
            // ถ้า sync ครั้งแรกแล้วมีคนอยู่ก่อนแล้ว (เช่นเพิ่งออกจากห้อง/วางสายเอง แต่คนอื่นยังคุยอยู่) แสดงแบนเนอร์เงียบๆ ไม่ต้องดัง
            const isNewCall = prevCount === 0;
            setIncoming((cur) => {
              if (cur) return cur; // มีสายค้างอยู่แล้ว ไม่ทับ
              if (isNewCall) playRing();
              return { threadId, callerName: people[0]?.name || "มีคน", otherIds: people.map((p) => p.userId) };
            });
          } else if (people.length === 0) {
            dismissedRef.current[threadId] = false; // สายจบแล้ว รีเซ็ตให้เด้งได้อีกครั้งถ้ามีสายใหม่
            setIncoming((cur) => { if (cur?.threadId === threadId) { stopRing(); return null; } return cur; });
          }
        });
        ch.subscribe();
        channels.push(ch);
      }
    })();
    return () => { cancelled = true; stopRing(); channels.forEach((c) => supabase.removeChannel(c)); };
  }, [userId]);

  if (!incoming) return null;
  const accept = () => { stopRing(); const inc = incoming; setIncoming(null); onAccept(inc.threadId, inc.callerName, inc.otherIds); };
  const decline = () => { stopRing(); dismissedRef.current[incoming.threadId] = true; setIncoming(null); };

  return (
    <ModalPortal>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 120, display: "flex", justifyContent: "center", padding: "12px 12px 0", pointerEvents: "none" }}>
        <div style={{ pointerEvents: "auto", width: "100%", maxWidth: 420, background: "#1C1A18", border: "1px solid rgba(255,255,255,.1)", borderRadius: 18, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 10px 30px rgba(0,0,0,.4)", animation: "rh-ring-in .3s ease" }}>
          <style>{`@keyframes rh-ring-in { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } } @keyframes rh-ring-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.12); } }`}</style>
          <div style={{ width: 46, height: 46, borderRadius: 23, background: "#2E9E6B", display: "grid", placeItems: "center", flexShrink: 0, animation: "rh-ring-pulse 1s ease-in-out infinite" }}>
            <Phone size={20} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#F2EDE6" }}>📞 สายเรียกเข้า</div>
            <div style={{ fontSize: 12, color: "#8C857C", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{incoming.callerName} กำลังโทรหาคุณ</div>
          </div>
          <button onClick={decline} style={{ width: 42, height: 42, borderRadius: 21, background: "#D9534F", border: "none", cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }} title="ปฏิเสธ"><PhoneOff size={18} color="#fff" /></button>
          <button onClick={accept} style={{ width: 42, height: 42, borderRadius: 21, background: "#2E9E6B", border: "none", cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }} title="รับสาย"><Phone size={18} color="#fff" /></button>
        </div>
      </div>
    </ModalPortal>
  );
}

// ---------------- Dock ----------------
function Dock({ t, page, setPage, onQuickAdd }) {
  const items = [{ k: "home", ic: Home, lb: "Home" }, { k: "ideas", ic: Lightbulb, lb: "Ideas" }, { k: "trade", ic: TrendingUp, lb: "Trade" }, { k: "_", ic: Plus, lb: "" }, { k: "news", ic: Newspaper, lb: "News" }, { k: "lang", ic: Languages, lb: "Lang" }, { k: "note", ic: StickyNote, lb: "Note" }];
  return (<div style={{ position: "absolute", bottom: 16, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 20, pointerEvents: "none" }}>
    <div style={{ pointerEvents: "auto", display: "flex", alignItems: "center", background: t.dock, border: `1px solid ${t.dockBorder}`, borderRadius: 34, padding: "8px 10px", maxWidth: 420, width: "92%", justifyContent: "space-between", boxShadow: "0 8px 26px rgba(20,25,45,.18)" }}>
      {items.map((it) => {
        if (it.k === "_") return (<button key="c" onClick={onQuickAdd} style={{ width: 50, height: 50, borderRadius: 25, border: "none", cursor: "pointer", background: `linear-gradient(135deg,${t.accent2},${t.accent})`, color: t.onAccent, display: "grid", placeItems: "center", boxShadow: `0 6px 16px ${t.accent}66`, marginTop: -18 }}><Plus size={26} /></button>);
        const A = it.ic; const on = page === it.k;
        return (<button key={it.k} onClick={() => setPage(it.k)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "4px 6px", flex: 1, position: "relative" }}>
          {on && <span style={{ position: "absolute", top: -3, width: 32, height: 32, borderRadius: "50%", background: `radial-gradient(circle, ${t.accent}33, transparent 70%)`, pointerEvents: "none" }} />}
          <A size={20} color={on ? t.accent : t.sub} strokeWidth={on ? 2.6 : 1.9} style={{ position: "relative" }} /><span style={{ fontSize: 8.5, color: on ? t.accent : t.sub, fontWeight: on ? 700 : 500, position: "relative" }}>{it.lb}</span>
        </button>);
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
function CatCard({ t, k, icon, label, children, onClick, shp }) {
  const s = shp || shapeTokens("soft", t);
  return (<div onClick={onClick} style={{ background: t.cat[k], borderRadius: s.radius, padding: 14, cursor: onClick ? "pointer" : "default", border: s.radius === 0 ? `1px solid ${t.border}` : `1px solid ${t.border}`, boxShadow: s.radius === 0 ? "none" : (t.star ? "none" : "0 4px 12px rgba(40,50,70,.06)") }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><span style={{ width: 26, height: 26, borderRadius: s.iconRadius, background: catIcBg(k), display: "grid", placeItems: "center", flexShrink: 0 }}>{icon}</span><span style={{ fontSize: 10.5, fontWeight: 700, color: t.catLb[k] }}>{label}</span></div>
    {children}
  </div>);
}
const catIcBg = (k) => ({ green: "#7FB894", amber: "#E0B24A", coral: "#E07B57", violet: "#7B6CB0" }[k]);
function PageHead({ t, title, sub, icon, right }) { return (<div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}><div style={{ width: 44, height: 44, borderRadius: 14, background: `${t.accent}1A`, display: "grid", placeItems: "center", flexShrink: 0 }}>{icon}</div><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 21, fontWeight: 700, color: t.text, fontFamily: "'Kanit', sans-serif" }}>{title}</div><div style={{ fontSize: 12.5, color: t.sub }}>{sub}</div></div>{right}</div>); }
function MockBanner({ t, text }) { return (<div style={{ display: "flex", alignItems: "center", gap: 8, background: `${t.accent}14`, border: `1px dashed ${t.accent}66`, borderRadius: 12, padding: "9px 12px", fontSize: 11.5, color: t.accent, fontWeight: 600 }}><Clock size={14} /> {text}</div>); }
function Empty({ t, text }) {
  const isLoading = typeof text === "string" && text.includes("กำลังโหลด");
  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "26px 0" }}>
        <style>{`@keyframes rh-lantern-sway { 0%,100% { transform: rotate(-6deg); } 50% { transform: rotate(6deg); } }`}</style>
        <div style={{ display: "inline-block", animation: "rh-lantern-sway 1.6s ease-in-out infinite", transformOrigin: "top center" }}><LanternIcon size={22} tier={1} /></div>
        <div style={{ marginTop: 6, display: "flex", justifyContent: "center" }}><PKnowMark width={90} animated /></div>
        <div style={{ color: t.sub, fontSize: 12, marginTop: 2 }}>{text}</div>
      </div>
    );
  }
  return (
    <div style={{ textAlign: "center", padding: "26px 0", position: "relative" }}>
      {t.star && (
        <div style={{ position: "relative", height: 0 }}>
          <span style={{ position: "absolute", top: -18, left: "38%", width: 2, height: 2, borderRadius: "50%", background: t.faint, opacity: 0.6 }} />
          <span style={{ position: "absolute", top: -10, left: "58%", width: 2, height: 2, borderRadius: "50%", background: t.faint, opacity: 0.4 }} />
          <span style={{ position: "absolute", top: -22, left: "50%", width: 2, height: 2, borderRadius: "50%", background: t.faint, opacity: 0.5 }} />
        </div>
      )}
      <div style={{ color: t.sub, fontSize: 13 }}>{text}</div>
    </div>
  );
}
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
// overlay สำหรับ modal ที่เปิดซ้อนบนหน้าชุมชน (หน้าชุมชนใช้ zIndex 100 ถ้าใช้ overlay ปกติจะจมอยู่ข้างหลังมองไม่เห็น)
const overlayHi = { ...overlay, zIndex: 130 };
