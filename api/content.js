// 📰 RefHub — ดึงเนื้อหาจากภายนอก (ข่าว / หุ้น / คำศัพท์ ในอนาคต) รวมไว้ในไฟล์เดียว
// ไฟล์นี้วางไว้ที่ /api/content.js ที่ root ของโปรเจกต์ (ข้างๆ src/)
// ⚠️ แทนที่ api/pin-lookup.js ที่เป็นไฟล์ตาย (ไม่มีจุดไหนเรียกใช้แล้ว ถูก /api/link-pin แทนที่ไปนานแล้ว)
//    ต้องลบ api/pin-lookup.js ออกจาก repo ด้วย ไม่งั้นจะเกิน 12 ไฟล์ของ Vercel Hobby plan อีกครั้ง
//
// ออกแบบให้รองรับหลาย "type" ในไฟล์เดียว กันไม่ให้ชนโควต้า 12 ไฟล์ตอนทำ TradePage/LangPage ในอนาคต
// วิธีเรียก: GET /api/content?type=news&category=tech
//
// type=news   -> ดึง RSS ตามหมวด แปลงเป็น JSON (ใช้งานตอนนี้)
// type=stocks -> (ยังไม่ทำ — เผื่อไว้สำหรับ TradePage)
// type=vocab  -> (ยังไม่ทำ — เผื่อไว้สำหรับ LangPage)

// แหล่ง RSS ต่อหมวด — Beartai (สายเทค/ธุรกิจ/เกม/ไลฟ์สไตล์) + Thairath (เสริมบันเทิง/ต่างประเทศ ที่ Beartai ไม่มี)
// แต่ละหมวดมี "แหล่งข่าว" ได้มากกว่า 1 แหล่ง — ผลลัพธ์จะถูกรวมกันแล้วเรียงตามเวลาล่าสุด
// ถ้าแหล่งไหน fetch ไม่สำเร็จ (URL ผิด/โดนบล็อก) จะข้ามเงียบๆ ไม่ทำให้ทั้งหมวดพัง ตราบใดที่ยังมีอย่างน้อย 1 แหล่งที่ใช้ได้
const FEED_SOURCES = {
  tech: [
    { url: "https://www.thairath.co.th/rss/it", label: "Thairath" },
    { url: "https://news.google.com/rss/search?q=เทคโนโลยี+when:2d&hl=th&gl=TH&ceid=TH:th", label: "Google News", isGoogleNews: true },
  ],
  biz: [
    { url: "https://www.thairath.co.th/rss/business", label: "Thairath" },
    { url: "https://news.google.com/rss/search?q=เศรษฐกิจ+ธุรกิจ+when:2d&hl=th&gl=TH&ceid=TH:th", label: "Google News", isGoogleNews: true },
  ],
  game: [
    { url: "https://news.google.com/rss/search?q=เกม+when:2d&hl=th&gl=TH&ceid=TH:th", label: "Google News", isGoogleNews: true },
  ],
  life: [
    { url: "https://www.thairath.co.th/rss/lifestyle", label: "Thairath" },
    { url: "https://news.google.com/rss/search?q=ไลฟ์สไตล์+when:2d&hl=th&gl=TH&ceid=TH:th", label: "Google News", isGoogleNews: true },
  ],
  entertainment: [
    { url: "https://www.thairath.co.th/rss/entertain", label: "Thairath" },
  ],
  // Thairath ไม่มีฟีดแยกเฉพาะหมวดต่างประเทศ — ใช้ฟีดรวมทุกหมวด (/rss/news) แล้วกรองเอาเฉพาะ
  // ข่าวที่ลิงก์มีคำว่า /news/foreign/ (ยืนยันจากโครงสร้างจริงของฟีดแล้วว่าใช้ path นี้บอกหมวด)
  world: [
    { url: "https://www.thairath.co.th/rss/news", label: "Thairath", filterLinkContains: "/news/foreign/" },
  ],
};

// cache ในหน่วยความจำของ serverless instance — ลดจำนวนครั้งที่ยิง RSS จริง (10 นาที)
// หมายเหตุ: cache นี้อยู่ได้แค่ตราบใดที่ instance เดิมยังไม่ถูก Vercel recycle ไม่ใช่ cache แบบถาวร แต่ช่วยลดโหลดได้จริงในทางปฏิบัติ
const cache = {}; // { [category]: { data, ts } }
const CACHE_TTL_MS = 10 * 60 * 1000;

function stripCdata(s) {
  return (s || "").replace(/<!\[CDATA\[/g, "").replace(/\]\]>/g, "").trim();
}
function decodeEntities(s) {
  return (s || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'");
}
function stripHtmlTags(s) {
  return (s || "").replace(/<[^>]*>/g, "").trim();
}
function tagContent(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m ? m[1] : "";
}
function firstImageUrl(itemXml) {
  // ลองหลายรูปแบบที่ RSS มักใช้แนบรูป: media:content, enclosure, หรือ <img> ในตัว description
  let m = itemXml.match(/<media:content[^>]*url=["']([^"']+)["']/i);
  if (m) return m[1];
  m = itemXml.match(/<enclosure[^>]*url=["']([^"']+)["'][^>]*type=["']image/i);
  if (m) return m[1];
  m = itemXml.match(/<img[^>]*src=["']([^"']+)["']/i);
  if (m) return m[1];
  return null;
}
function timeAgo(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "เมื่อสักครู่";
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ชม.ที่แล้ว`;
  const days = Math.floor(hrs / 24);
  return `${days} วันที่แล้ว`;
}

async function fetchOneSource(source) {
  const r = await fetch(source.url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "application/rss+xml, application/xml, text/xml, */*",
      "Accept-Language": "th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7",
      "Referer": "https://www.google.com/",
    },
  });
  if (!r.ok) throw new Error(`ดึง RSS ไม่สำเร็จ (${r.status}) จาก ${source.label}`);
  const xml = await r.text();

  // เช็คว่าสิ่งที่ได้กลับมาเป็น RSS จริงไหม — ถ้าไม่ใช่ มักเป็นเพราะโดน Cloudflare หรือระบบป้องกันบอทของปลายทางเสิร์ฟหน้า challenge กลับมาแทน (ตอบ 200 OK ปกติ แต่เนื้อหาไม่ใช่ XML)
  if (!/<rss|<feed/i.test(xml)) {
    throw new Error(`${source.label} อาจบล็อกการเข้าถึงจากเซิร์ฟเวอร์ (ไม่ใช่ RSS จริงที่ได้กลับมา)`);
  }

  const rawLimit = source.filterLinkContains ? 60 : 20;
  const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
  let candidates = itemMatches.slice(0, rawLimit);
  if (source.filterLinkContains) {
    candidates = candidates.filter((itemXml) => itemXml.includes(source.filterLinkContains));
  }
  return candidates.slice(0, 20).map((itemXml) => {
    let title = decodeEntities(stripCdata(tagContent(itemXml, "title")));
    const link = decodeEntities(stripCdata(tagContent(itemXml, "link")));
    const pubDate = stripCdata(tagContent(itemXml, "pubDate"));
    const rawDesc = decodeEntities(stripCdata(tagContent(itemXml, "description")));
    const summary = stripHtmlTags(rawDesc).slice(0, 160);
    const image = firstImageUrl(itemXml);

    let sourceLabel = source.label;
    if (source.isGoogleNews) {
      // Google News RSS ตั้งชื่อ title เป็น "หัวข้อจริง - ชื่อสำนักข่าว" — แยกชื่อสำนักข่าวจริงออกมาแสดงแทน "Google News" เฉยๆ
      const idx = title.lastIndexOf(" - ");
      if (idx > 0) {
        sourceLabel = title.slice(idx + 3).trim();
        title = title.slice(0, idx).trim();
      }
    }

    return { title, link, summary, image, source: sourceLabel, time: timeAgo(pubDate), pubDate };
  });
}

// สลับผลลัพธ์เป็นบล็อกๆ ตามลำดับแหล่งที่กำหนดไว้ (แหล่งแรกในนิยาม FEED_SOURCES ขึ้นก่อนเสมอ)
// เช่น ไทยรัฐ 5 ข่าว -> กูเกิลนิวส์ 5 ข่าว -> ไทยรัฐ 5 ข่าว -> กูเกิลนิวส์ 5 ข่าว จนครบ maxTotal
// ถ้าแหล่งใดหมดก่อน จะดึงจากแหล่งที่เหลืออยู่ต่อจนครบ ไม่ทิ้งที่ว่างไว้เฉยๆ
function interleaveBlocks(arraysInOrder, blockSize, maxTotal) {
  const result = [];
  const cursors = arraysInOrder.map(() => 0);
  let progressed = true;
  while (progressed && result.length < maxTotal) {
    progressed = false;
    for (let i = 0; i < arraysInOrder.length; i++) {
      const arr = arraysInOrder[i];
      let taken = 0;
      while (taken < blockSize && cursors[i] < arr.length && result.length < maxTotal) {
        result.push(arr[cursors[i]]);
        cursors[i]++;
        taken++;
        progressed = true;
      }
    }
  }
  return result;
}

async function fetchNews(category, force) {
  const sources = FEED_SOURCES[category];
  if (!sources) throw new Error("หมวดหมู่ไม่ถูกต้อง");

  const cached = cache[category];
  if (!force && cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.data;

  const results = await Promise.allSettled(sources.map(fetchOneSource));
  const perSourceLists = []; // เก็บตามลำดับที่นิยามไว้ใน FEED_SOURCES (ไทยรัฐมาก่อนเสมอ)
  const failures = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") perSourceLists.push(r.value);
    else failures.push(`${sources[i].label}: ${r.reason.message}`);
  });

  // ถ้าทุกแหล่งพังหมด ถึงจะ error ให้เห็น — ถ้ามีอย่างน้อย 1 แหล่งสำเร็จ ใช้ของที่ได้ต่อไปเงียบๆ
  if (perSourceLists.length === 0 && failures.length > 0) {
    throw new Error(failures.join(" | "));
  }

  const items = interleaveBlocks(perSourceLists, 5, 20);

  cache[category] = { data: items, ts: Date.now() };
  return items;
}

export default async function handler(req, res) {
  const { type, category, force } = req.query || {};

  try {
    if (type === "news") {
      if (!category || !FEED_SOURCES[category]) {
        return res.status(400).json({ error: "ระบุ category ไม่ถูกต้อง (tech/biz/game/life/entertainment/world)" });
      }
      const items = await fetchNews(category, force === "1" || force === "true");
      return res.status(200).json({ items });
    }

    // เผื่อไว้สำหรับอนาคต — TradePage / LangPage จะมาเพิ่ม branch ตรงนี้
    if (type === "stocks") {
      return res.status(501).json({ error: "ยังไม่ได้ทำส่วนหุ้น" });
    }
    if (type === "vocab") {
      return res.status(501).json({ error: "ยังไม่ได้ทำส่วนคำศัพท์" });
    }

    return res.status(400).json({ error: "ระบุ type ไม่ถูกต้อง (news/stocks/vocab)" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
