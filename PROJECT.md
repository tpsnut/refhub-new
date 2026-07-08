# 📘 PROJECT SCOPE — Ref Hub (TPSNUT)

> **ไฟล์นี้คือ context หลักของโปรเจกต์** — วางไว้ที่ root ของโปรเจกต์ (ชื่อ `PROJECT.md`)
> เพื่อให้ AI (Cursor) เข้าใจภาพรวมทั้งหมดก่อนแก้โค้ดทุกครั้ง
> อัปเดตล่าสุด: ก.ค. 2026 · เจ้าของ: Piyanut (Max) · ผู้ร่วมออกแบบ: Claude

---

## 1. 🎯 วิสัยทัศน์ (Vision)

**Ref Hub** คือเว็บแอป "ที่พักใจ + ศูนย์รวมชีวิต" ส่วนตัว — ไม่ใช่แค่ productivity app
แต่เป็นที่ที่ผู้ใช้ **อยากเปิดค้างไว้ทั้งวัน** ตั้งแต่ตื่นนอน ตอนว่าง จนก่อนนอน (ติดเหมือนเกม)

หัวใจของแอป:
- **สวย อบอุ่น สงบ** — ธีมเปลี่ยนตามเวลาจริง (กลางวันสว่างสง่า / หลัง 18:00 มืดสงบมีดาว)
- **AI Mentor 3 ตัวละคร** เป็น signature — โค้ชประจำตัวที่เปลี่ยนธีมสี คำคม และบุคลิกการคุย
- **ใช้งานจริงในชีวิตประจำวัน** — การเงิน, โน้ต, เป้าหมาย, เพลง, ความรู้
- **Notion คือคลังหลังบ้าน** — เป้าหมายระยะยาวคือ sync ทุกอย่างเข้า Notion ของผู้ใช้

เป้าหมายธุรกิจ: เริ่มจากให้แฟน/เพื่อนทดลองใช้ → ถ้าติด → ขยายเป็น product ขายจริง

---

## 2. 👥 AI Mentors (3 ตัวละคร) — หัวใจของแอป

| Mentor | บุคลิก | สี (accent) | แนวเพลง/mood |
|---|---|---|---|
| **Loid** (Loid Forger) | กลยุทธ์ วางแผน เวลา | 🟢 เขียว `#3E8E5A` (สีสูทตามต้นฉบับ) | อบอุ่น โฟกัส |
| **Itachi** (Itachi Uchiha) | จิตใจ ปรัชญา ความนิ่ง | 🔴 แดง `#C0392B` | สงบ ลึก |
| **Bond** (James Bond) | มั่นใจ เจรจา บุคลิก | 🔵 ฟ้า `#2E6FB0` | หรู เท่ |

กติกา:
- เลือก Mentor แล้ว → **accent สีทั้งแอปเปลี่ยน**, คำคมบนการ์ดโค้ชเปลี่ยน, สไตล์คำตอบแชทเปลี่ยน
- คำคมหมุนอัตโนมัติทุก ~9 วินาที
- แชทกับโค้ชตอนนี้เป็น **mock replies** (สุ่มจาก replies array) — เฟสหลังต่อ AI จริง

---

## 3. 🎨 Design System

### ธีม
- **Auto ตามเวลา**: `>= 18:00` หรือ `< 6:00` = Night / นอกนั้น = Day
- ผู้ใช้ override ได้: ปุ่มวน `auto → day → night`
- **Day**: พื้นครีมอุ่น `#F6F1E8`, การ์ดขาว, hero กรมท่า gradient
- **Night**: พื้นกรมเข้ม `#0A1020`, มีดาว SVG โปรยด้านบน, การ์ดโทน `#16223C`

### Layout (มือถือเป็นหลัก, max-width 440px กลางจอ)
- **Header**: รูปโปรไฟล์+ชื่อ (แตะ=แก้ไข), ปุ่ม 🔍 ค้นหา, ปุ่ม 🎵 เพลง, ปุ่มสลับธีม / หน้า sub มีปุ่ม ← กลับ
- **Content**: การ์ดวิดเจ็ต 4 สี (เขียว=เงิน, เหลือง=ความรู้, ส้ม=เป้าหมาย, ม่วง=โน้ต) + การ์ดโค้ช hero (quote + วงแหวน % เป้าหมาย)
- **Footer**: Dock ลอย 7 ปุ่ม `Home · Ideas · Trade · [+] · News · Lang · Note`
  - ปุ่ม **[+] กลาง = เปิดฟอร์มเพิ่มรายรับรายจ่ายทันที** (ไม่ใช่แค่พาไปหน้า ledger)

### หลักการ UI
- การ์ดมุมโค้ง 20-26px, เงานุ่มตอน Day, ไร้เงาตอน Night
- ทุก modal เป็น bottom sheet (สไลด์จากล่าง, `borderRadius: 24px 24px 0 0`)
- bottom sheet ต้องมี padding ล่างพอ **ไม่ให้ปุ่มชน dock**

---

## 4. 🧩 ฟีเจอร์ปัจจุบัน (เฟส 1 — ทำแล้ว ✅)

| ฟีเจอร์ | สถานะ | หมายเหตุ |
|---|---|---|
| ธีม Day/Night auto + manual | ✅ ใช้จริง | |
| Mentor 3 คน สลับธีม/คำคม | ✅ ใช้จริง | แชท = mock |
| เป้าหมายรายวัน (เพิ่ม/ติ๊ก/ลบ) + วงแหวน % | ✅ ใช้จริง | เฟสหน้า: streak, หมวด, rich editor |
| **การเงินครบเครื่อง** | ✅ ใช้จริง | หมวดหมู่ไอคอนสี 10 หมวด, เลือกวันที่ย้อนหลัง, กราฟวงกลม (จ่ายตามหมวด), กราฟแท่ง 6 เดือน (รับvsจ่าย), log จัดกลุ่มรายวัน, สลับเดือน, Export CSV |
| โน้ต (เพิ่ม/ลบ) | ✅ ใช้จริง | เฟสหน้า: sync Notion |
| ค้นหารวม (โน้ต/เป้าหมาย/รายการเงิน) | ✅ ใช้จริง | |
| โปรไฟล์ (ชื่อ + รูป upload/URL) | ✅ ใช้จริง | รูปเก็บเป็น dataURL ใน localStorage |
| เพลง: playlist แนบไฟล์ MP3/MP4 + ลิงก์ YouTube | ✅ ใช้จริง | YouTube เล่นใน music modal เท่านั้น (iframe), ไฟล์เล่นข้ามหน้าผ่าน `<audio>` ซ่อน, ไฟล์ >1.5MB ไม่ persist |
| หน้า Ideas / Trade / News / Lang | 🟡 Mock | ข้อมูลตัวอย่าง มีป้ายบอก "ต่อ API ภายหลัง" |
| เก็บข้อมูลถาวร | ✅ localStorage | key: `refhub:v2` |

---

## 5. 🗄️ Data Model (localStorage key: `refhub:v2`)

```jsonc
{
  "notes":   [{ "id", "title", "body", "date" }],            // date = YYYY-MM-DD
  "goals":   [{ "id", "text", "done" }],
  "tx":      [{ "id", "type": "in|out", "cat", "amount", "note", "date" }],
  "profile": { "name", "avatar" },                            // avatar = dataURL หรือ http URL
  "mentor":  "loid | itachi | bond",
  "themeMode": "auto | day | night",
  "volume":  0-100,
  "playlist": [{ "id", "kind": "yt|file", "name", "ytId?", "url?", "src?", "persist?" }]
}
```

หมวดการเงิน (`cat`): `salary, bonus (รายรับ) / food, coffee, transport, shopping, bills, fun, health, other (รายจ่าย)`
— นิยามอยู่ใน `CATS` object พร้อม icon (lucide) + สี

**กติกาสำคัญ**: ทุกฟีเจอร์ใหม่ต้องออกแบบข้อมูลให้มี `id`, `date` และโครงชัดเจน
เพราะเป้าหมายคือ **sync เข้า Notion database ได้ในอนาคต** (CSV export คือสะพานชั่วคราว)

---

## 6. 🛠️ Tech Stack

- **Frontend**: React 18 + Vite, ไฟล์หลักคือ `src/RefHub.jsx` (single component file, inline styles)
- **Icons**: `lucide-react`
- **Charts**: `recharts` (PieChart, BarChart)
- **Storage**: `localStorage` (เวอร์ชัน local) — *เวอร์ชัน artifact ในแชท Claude ใช้ `window.storage` แทน*
- **Styling**: inline style objects + helper functions (`card(t)`, `input(t)`, `primaryBtn(M)`, `overlay`) — **ไม่มี Tailwind/CSS framework** เพื่อความ portable
- **ภาษาใน UI**: ไทยเป็นหลัก

### Convention
- ธีมทั้งหมดออกจากฟังก์ชัน `palette(mode, mentor)` — ห้าม hardcode สีในคอมโพเนนต์ ให้อ่านจาก `t.*`
- สี Mentor อ่านจาก `MENTORS[key].accent / accent2 / onAccent`
- id ใหม่ใช้ `uid()`, วันที่ใช้ `todayStr()` (YYYY-MM-DD)
- ห้ามใช้ `sessionStorage` และห้ามเพิ่ม dependency ใหม่โดยไม่จำเป็น

---

## 7. 🚧 Roadmap เฟสถัดไป (หลังบ้านทั้งหมด)

### เฟส 2 — Deploy + แชร์ให้เพื่อนลอง (ลำดับถัดไป)
- [ ] Deploy ขึ้น **Vercel** (ฟรี) → ได้ URL จริงให้เพื่อนเปิด/Add to Home Screen
- [ ] ปรับ PWA เบื้องต้น (manifest + icon) ให้ปักหน้าจอมือถือสวยๆ
- [ ] เก็บ feedback จากผู้ใช้จริง (แฟน/เพื่อน)

### เฟส 3 — Backend & บัญชีผู้ใช้
- [ ] **Auth/Login**: อีเมล + Facebook + เบอร์มือถือ OTP (แผน: Supabase Auth — ฟรี tier พอ)
  - ดึงชื่อ+รูปโปรไฟล์จาก provider มาตั้งต้นให้อัตโนมัติ
- [ ] ย้ายข้อมูลจาก localStorage → **Supabase Postgres** (sync ข้ามอุปกรณ์)
  - ตาราง: `users, notes, goals, transactions, playlists, settings`
- [ ] Serverless functions (Vercel Functions) เป็นชั้นกลางเรียก API ภายนอกทั้งหมด
  - เหตุผล: CORS + ซ่อน API keys (ห้ามฝัง key ในโค้ด frontend เด็ดขาด)

### เฟส 4 — Notion Sync (เป้าหมายใหญ่ของเจ้าของ)
- [ ] ผู้ใช้เชื่อมบัญชี Notion ของตัวเอง (Notion Integration token หรือ OAuth)
- [ ] Sync 2 ทางผ่าน **Notion API** (REST): notes, transactions, goals, vocab, chat logs
  - โครงสร้าง: 1 Notion database ต่อ 1 ประเภทข้อมูล
  - ทำผ่าน serverless function เท่านั้น (Notion API เรียกตรงจากเบราว์เซอร์ไม่ได้ — ติด CORS)
- [ ] ระหว่างรอ: ปุ่ม **Export CSV** ใช้เป็นสะพาน (Notion import CSV ได้)

### เฟส 5 — AI Mentor จริง + ข้อมูลสด
- [ ] แชทโค้ชต่อ **Claude API** ผ่าน serverless function — system prompt แยกตามบุคลิก 3 Mentor
- [ ] ราคาหุ้น/ทอง/คริปโต จาก API ฟรี (เช่น CoinGecko / ทองจาก API ไทย)
- [ ] ข่าวจาก News API + AI สรุป
- [ ] "ความรู้วันนี้" — AI คัดบทความตามความสนใจผู้ใช้
- [ ] Lang: ระบบท่องศัพท์แบบ spaced repetition + AI สร้างประโยคตัวอย่าง

### เฟส 6 — Gamification (ทำให้ "ติดเหมือนเกม")
- [ ] Streak รายวัน (เข้าแอปต่อเนื่อง, ทำเป้าหมายต่อเนื่อง)
- [ ] Level/แต้มสะสม, badge จากโค้ช
- [ ] เป้าหมายอัปเกรด: หมวดหมู่, กำหนดเวลา, โน้ตย่อย/rich editor ในเป้าหมาย

---

## 8. ⚠️ ข้อควรระวัง / บทเรียนที่ผ่านมา

1. **อย่าทำทุกอย่างพร้อมกัน** — โปรเจกต์นี้เคยล้มมาแล้วรอบหนึ่ง (กับ Gemini) เพราะ scope ใหญ่เกิน
   ให้ทำทีละเฟส เทสต์ให้เวิร์กก่อนไปต่อ
2. **YouTube embed**: ต้องมี iframe มองเห็นได้ (ซ่อนสนิทผิด ToS), autoplay ต้องเกิดหลัง user คลิก, ปัจจุบันเล่นเฉพาะใน music modal
3. **Browser autoplay policy**: เสียงทุกชนิดเล่นได้หลัง user interaction เท่านั้น — default ปุ่มเพลงเป็น "ปิด" เสมอ
4. **localStorage มีลิมิต (~5MB)**: รูปโปรไฟล์ถูก resize เป็น 200x200 ก่อนเก็บ, ไฟล์เพลง >1.5MB ไม่ persist
5. **เงินเดิม (legacy)**: รายการ tx เก่าอาจไม่มี `cat` — โค้ดต้อง fallback เป็น `other` เสมอ
6. เจ้าของโปรเจกต์ถนัด REST API (GET/POST/PUT/DELETE, token auth) และ RPA/VBA — อธิบาย technical ได้เต็มที่ แต่เพิ่งเริ่ม React จึงควรคอมเมนต์โค้ดสำคัญเป็นภาษาเข้าใจง่าย

---

## 9. 📌 นิยามความสำเร็จ

- เฟสสั้น: แฟน/เพื่อนของเจ้าของเปิดใช้จริงทุกวันโดยไม่ต้องบังคับ
- เฟสกลาง: ผู้ใช้ 10-20 คนใช้ต่อเนื่อง + feedback เชิงบวก
- เฟสยาว: sync Notion สมบูรณ์ + มี AI Mentor จริง → พร้อมคิดโมเดลรายได้
