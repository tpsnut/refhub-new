// 📰 RefHub — ดึงเนื้อหาจากภายนอก (ข่าว / หุ้น / คำศัพท์ ในอนาคต) รวมไว้ในไฟล์เดียว
// ไฟล์นี้วางไว้ที่ /api/content.js ที่ root ของโปรเจกต์ (ข้างๆ src/)
// ⚠️ แทนที่ api/pin-lookup.js ที่เป็นไฟล์ตาย (ไม่มีจุดไหนเรียกใช้แล้ว ถูก /api/link-pin แทนที่ไปนานแล้ว)
//    ต้องลบ api/pin-lookup.js ออกจาก repo ด้วย ไม่งั้นจะเกิน 12 ไฟล์ของ Vercel Hobby plan อีกครั้ง
//
// ออกแบบให้รองรับหลาย "type" ในไฟล์เดียว กันไม่ให้ชนโควต้า 12 ไฟล์ตอนทำ TradePage/LangPage ในอนาคต
// วิธีเรียก: GET /api/content?type=news&category=tech
//
// type=news   -> ดึง RSS ตามหมวด แปลงเป็น JSON (ใช้งานตอนนี้)
// type=stocks -> ราคาทอง/SET/บิตคอยน์/USD-THB จาก 4 แหล่งฟรีรวมกัน (ใช้งานตอนนี้ — TradePage)
// type=vocab  -> (ยังไม่ทำ — เผื่อไว้สำหรับ LangPage)

// แหล่ง RSS ต่อหมวด — Beartai (สายเทค/ธุรกิจ/เกม/ไลฟ์สไตล์) + Thairath (เสริมบันเทิง/ต่างประเทศ ที่ Beartai ไม่มี)
// แต่ละหมวดมี "แหล่งข่าว" ได้มากกว่า 1 แหล่ง — ผลลัพธ์จะถูกรวมกันแล้วเรียงตามเวลาล่าสุด
// ถ้าแหล่งไหน fetch ไม่สำเร็จ (URL ผิด/โดนบล็อก) จะข้ามเงียบๆ ไม่ทำให้ทั้งหมวดพัง ตราบใดที่ยังมีอย่างน้อย 1 แหล่งที่ใช้ได้
const FEED_SOURCES = {
  tech: [
    { url: "https://www.blognone.com/atom.xml", label: "Blognone" },
    { url: "https://news.google.com/rss/search?q=เทคโนโลยี+when:2d&hl=th&gl=TH&ceid=TH:th", label: "Google News", isGoogleNews: true },
  ],
  biz: [
    { url: "https://news.google.com/rss/search?q=เศรษฐกิจ+ธุรกิจ+when:2d&hl=th&gl=TH&ceid=TH:th", label: "Google News", isGoogleNews: true },
  ],
  car: [
    { url: "https://www.thairath.co.th/rss/news", label: "Thairath", filterLinkContains: "/news/auto/" },
    { url: "https://news.google.com/rss/search?q=รถยนต์+when:2d&hl=th&gl=TH&ceid=TH:th", label: "Google News", isGoogleNews: true },
  ],
  game: [
    { url: "https://news.google.com/rss/search?q=เกม+when:2d&hl=th&gl=TH&ceid=TH:th", label: "Google News", isGoogleNews: true },
  ],
  life: [
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
function decodeEntitiesOnce(s) {
  return (s || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'");
}
function decodeEntities(s) {
  // ⚠️ ฟีดบางเจ้า (เช่น Google News RSS) escape ซ้อนสองชั้น: &nbsp; ตัวจริงถูก escape ซ้ำเป็น &amp;nbsp;
  // ถ้า decode รอบเดียวและแทน &nbsp; ก่อนแทน &amp; จะเจอบั๊ก: &amp;nbsp; -> &nbsp; (จากขั้น &amp;) แต่ไม่มีโอกาสถูกแปลงเป็นช่องว่างอีก
  // เพราะขั้นตอนแทน &nbsp; ผ่านไปแล้ว → หลุดออกมาเป็นข้อความดิบ "&nbsp;" ให้ผู้ใช้เห็น
  // แก้ด้วยการรัน decode 2 รอบ: รอบแรกแกะชั้นนอก (เผยให้เห็น &nbsp; ที่ซ่อนอยู่), รอบสองแปลงเป็นช่องว่างจริง
  return decodeEntitiesOnce(decodeEntitiesOnce(s)).replace(/\s+/g, " ").trim();
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

function extractLink(blockXml) {
  // RSS: <link>https://...</link>  |  Atom: <link rel="alternate" href="https://..."/>
  const hrefMatch = blockXml.match(/<link[^>]*href=["']([^"']+)["']/i);
  if (hrefMatch) return hrefMatch[1];
  return tagContent(blockXml, "link");
}
function extractDate(blockXml) {
  return tagContent(blockXml, "pubDate") || tagContent(blockXml, "updated") || tagContent(blockXml, "published");
}
function extractDescription(blockXml) {
  return tagContent(blockXml, "description") || tagContent(blockXml, "summary") || tagContent(blockXml, "content");
}

async function fetchOneSource(source, perSourceLimit) {
  const r = await fetch(source.url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
      "Accept-Language": "th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7",
      "Referer": "https://www.google.com/",
    },
  });
  if (!r.ok) throw new Error(`ดึง RSS ไม่สำเร็จ (${r.status}) จาก ${source.label}`);
  const xml = await r.text();

  // เช็คว่าสิ่งที่ได้กลับมาเป็น RSS/Atom จริงไหม — ถ้าไม่ใช่ มักเป็นเพราะโดน Cloudflare หรือระบบป้องกันบอทของปลายทางเสิร์ฟหน้า challenge กลับมาแทน (ตอบ 200 OK ปกติ แต่เนื้อหาไม่ใช่ XML)
  const isAtom = /<feed[\s>]/i.test(xml);
  if (!isAtom && !/<rss/i.test(xml)) {
    throw new Error(`${source.label} อาจบล็อกการเข้าถึงจากเซิร์ฟเวอร์ (ไม่ใช่ RSS/Atom จริงที่ได้กลับมา)`);
  }

  // ฟีดส่วนใหญ่เป็น RSS 2.0 (<item>) แต่บางเจ้า เช่น Blognone ใช้ Atom (<entry>) — รองรับทั้งคู่
  const blockTag = isAtom ? "entry" : "item";
  // ดึง raw item มาเผื่อเยอะกว่าที่ต้องการจริง เพราะแหล่งที่ต้องกรอง (filterLinkContains) จะเหลือหลังกรองน้อยกว่าที่ดึงมาก
  const rawLimit = source.filterLinkContains ? Math.max(perSourceLimit * 3, 60) : Math.max(perSourceLimit * 2, 20);
  const itemMatches = xml.match(new RegExp(`<${blockTag}[\\s>][\\s\\S]*?<\\/${blockTag}>`, "g")) || [];
  let candidates = itemMatches.slice(0, rawLimit);
  if (source.filterLinkContains) {
    candidates = candidates.filter((itemXml) => itemXml.includes(source.filterLinkContains));
  }
  return candidates.slice(0, perSourceLimit).map((itemXml) => {
    let title = decodeEntities(stripCdata(tagContent(itemXml, "title")));
    const link = decodeEntities(stripCdata(extractLink(itemXml)));
    const pubDate = stripCdata(extractDate(itemXml));
    const rawDesc = decodeEntities(stripCdata(extractDescription(itemXml)));
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

async function fetchNews(cacheKey, sources, force, limit) {
  const cached = cache[cacheKey + ":" + limit];
  if (!force && cached && Date.now() - cached.ts < CACHE_TTL_MS) return { items: cached.data, fetchedAt: cached.ts, fromCache: true };

  const results = await Promise.allSettled(sources.map((s) => fetchOneSource(s, limit)));
  const perSourceLists = []; // เก็บตามลำดับที่นิยามไว้ใน FEED_SOURCES (ไทยรัฐมาก่อนเสมอ)
  const failures = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      // เรียงข่าวใหม่สุดขึ้นก่อนเสมอ ภายในแหล่งเดียวกัน (กันฟีดต้นทางเรียงมาไม่ตรงลำดับเวลาจริง)
      const sorted = [...r.value].sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
      perSourceLists.push(sorted);
    } else {
      failures.push(`${sources[i].label}: ${r.reason.message}`);
    }
  });

  // ถ้าทุกแหล่งพังหมด ถึงจะ error ให้เห็น — ถ้ามีอย่างน้อย 1 แหล่งสำเร็จ ใช้ของที่ได้ต่อไปเงียบๆ
  if (perSourceLists.length === 0 && failures.length > 0) {
    throw new Error(failures.join(" | "));
  }

  const items = interleaveBlocks(perSourceLists, 5, limit);
  const ts = Date.now();
  cache[cacheKey + ":" + limit] = { data: items, ts };
  return { items, fetchedAt: ts, fromCache: false };
}

// สร้างแหล่งข่าว Google News จากคำค้นหาที่ admin พิมพ์เอง (สำหรับหมวดที่ admin เพิ่มเองผ่านหน้า admin)
function googleNewsSourceFromQuery(q) {
  return { url: `https://news.google.com/rss/search?q=${encodeURIComponent(q)}+when:2d&hl=th&gl=TH&ceid=TH:th`, label: "Google News", isGoogleNews: true };
}

// 💰 TradePage — ราคาจริงจากแหล่งฟรี (ไม่ใช้ key) รวมกัน ถ้าแหล่งไหนล่มข้ามไปเงียบๆ เหมือนระบบข่าว ตราบใดที่เหลืออย่างน้อย 1 แหล่ง
const numFromComma = (s) => parseFloat(String(s ?? "").replace(/,/g, ""));
// เบราว์เซอร์ปลอมให้ทุก fetch เส้นนี้ — บาง API/CDN (โดยเฉพาะที่อยู่หลัง Cloudflare) บล็อกหรือส่งหน้า challenge กลับมาแทน
// ถ้า request ไม่มี User-Agent เหมือนเบราว์เซอร์จริง เจอปัญหานี้มาแล้วตอน request จากเซิร์ฟเวอร์ Vercel โดยตรง (ไม่มีปัญหาตอน fetch จากเบราว์เซอร์ปกติ)
const BROWSER_HEADERS = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36", "Accept": "application/json,text/plain,*/*" };

async function withCache(key, fetcher, force) {
  const cached = cache[key];
  if (!force && cached && Date.now() - cached.ts < CACHE_TTL_MS) return { data: cached.data, fetchedAt: cached.ts, fromCache: true };
  const data = await fetcher();
  const ts = Date.now();
  cache[key] = { data, ts };
  return { data, fetchedAt: ts, fromCache: false };
}

async function fetchGoldPrice() {
  try {
    // สมาคมค้าทองคำ (goldtraders.or.th) ผ่าน API ชุมชนที่ยัง maintain อยู่ — ทองคำแท่ง 96.5% ราคาขายออก (แหล่งหลัก แม่นสุด)
    const r = await fetch("https://api.chnwt.dev/thai-gold-api/latest", { headers: BROWSER_HEADERS });
    const raw = await r.text();
    if (!r.ok) throw new Error(`ดึงราคาทองไม่สำเร็จ (HTTP ${r.status})`);
    let data;
    try { data = JSON.parse(raw); } catch { throw new Error(`ราคาทอง: อ่านผลลัพธ์ไม่ใช่ JSON (${raw.slice(0, 80)})`); }
    if (data.status !== "success") throw new Error(`ราคาทองไม่พร้อมใช้งาน (status: ${data.status})`);
    const price = numFromComma(data.response?.price?.gold_bar?.sell);
    if (!isFinite(price)) throw new Error(`อ่านราคาทองไม่ได้ (แหล่งข้อมูลต้นทางส่งค่าว่างมา — ปัญหาฝั่งเขา ไม่ใช่โค้ดเรา)`);
    return { key: "gold", name: "ทองคำแท่ง 96.5% (ขายออก)", price, unit: "บาท/บาททองคำ", change: null, updatedText: `${data.response.update_date} ${data.response.update_time}` };
  } catch (mainErr) {
    // 🔁 แหล่งหลักพัง — สำรองด้วยราคาทองคำโลก (COMEX Gold Futures) แปลงเป็นบาท/บาททองคำโดยประมาณ (1 บาททองคำ = 15.244 กรัม, 1 ออนซ์ = 31.1035 กรัม)
    // ราคานี้ไม่รวมค่ากำเหน็จ/ส่วนต่างร้านทอง จะต่างจากราคาสมาคมจริงเล็กน้อย แจ้งไว้ให้ผู้ใช้เห็นชัดเจน
    try {
      const goldUsd = await fetchYahooChartOne("GC=F");
      const fxRows = await fetchTopCurrencies();
      const usdThb = fxRows.find((c) => c.symbol === "USD")?.price;
      if (!usdThb) throw new Error("แปลงสกุลเงินไม่ได้");
      const price = (goldUsd.price / 31.1035) * 15.244 * usdThb;
      return { key: "gold", name: "ทองคำ (ประมาณการจากตลาดโลก)", price, unit: "บาท/บาททองคำ · ไม่รวมค่ากำเหน็จ", change: goldUsd.change, updatedText: "แหล่งหลัก (สมาคมค้าทองคำ) มีปัญหาชั่วคราว ใช้ราคาแปลงจากตลาดโลกแทน" };
    } catch (fallbackErr) {
      throw new Error(`${mainErr.message} | สำรองก็พัง: ${fallbackErr.message}`);
    }
  }
}

async function fetchSetIndex() {
  // ดัชนี SET สด — API ชุมชน (ไม่ใช่ SET อย่างเป็นทางการ ของจริงคิดค่าบริการหลักหมื่น/เดือน) เผื่อวันไหนพังไม่มีการรับประกัน uptime
  const r = await fetch("https://api.thaistock2d.com/live", { headers: BROWSER_HEADERS });
  const raw = await r.text();
  if (!r.ok) throw new Error(`ดึง SET Index ไม่สำเร็จ (HTTP ${r.status})`);
  let data;
  try { data = JSON.parse(raw); } catch { throw new Error(`SET Index: อ่านผลลัพธ์ไม่ใช่ JSON (${raw.slice(0, 80)})`); }
  const rawSet = data.live?.set;
  // ตลาดปิด (นอกเวลา 10:00-16:30 น. วันทำการ) API ตัวนี้ส่ง "--" กลับมาแทนค่าจริง — ไม่ใช่ error ให้โชว์สถานะปิดตลาดแทน
  if (!rawSet || rawSet === "--") {
    return { key: "set", name: "SET Index", price: null, unit: "จุด", change: null, updatedText: "ตลาดปิดอยู่ (เปิดทำการ 10:00–16:30 น. วันทำการ)", closed: true };
  }
  const price = numFromComma(rawSet);
  if (!isFinite(price)) throw new Error(`อ่านค่า SET Index ไม่ได้ (${JSON.stringify(data).slice(0, 100)})`);
  return { key: "set", name: "SET Index", price, unit: "จุด", change: null, updatedText: data.live?.time || "" };
}

// 🔧 Yahoo Finance v7/finance/quote เริ่มบล็อก (HTTP 401 Invalid Crumb) ตั้งแต่ปี 2025 เป็นต้นมา ต้องล็อกอิน/มี cookie ถึงจะใช้ได้
// ทางออก: ใช้ v8/finance/chart แทน (ยังไม่ต้อง auth ณ ตอนที่เขียน) แต่ดึงได้ทีละสัญลักษณ์ ไม่รองรับ batch เหมือน v7 เดิม
async function fetchYahooChartOne(symbol) {
  const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`, { headers: BROWSER_HEADERS });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const data = await r.json();
  const meta = data?.chart?.result?.[0]?.meta;
  if (!meta || meta.regularMarketPrice == null) throw new Error("ไม่พบราคา");
  const price = meta.regularMarketPrice;
  const prevClose = meta.previousClose ?? meta.chartPreviousClose;
  const change = prevClose ? ((price - prevClose) / prevClose) * 100 : null;
  return { price, change, currency: meta.currency || null };
}

async function fetchSP500Index() {
  try {
    const q = await fetchYahooChartOne("^GSPC");
    return { key: "sp500", name: "S&P 500 Index", price: q.price, unit: "จุด", change: q.change, updatedText: "" };
  } catch (e) { throw new Error(`ดึง S&P 500 ไม่สำเร็จ (${e.message})`); }
}

async function fetchTopCrypto() {
  const r = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=thb&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h", { headers: BROWSER_HEADERS });
  if (!r.ok) throw new Error("ดึงราคาคริปโตไม่สำเร็จ");
  const data = await r.json();
  if (!Array.isArray(data) || data.length === 0) throw new Error("ไม่พบข้อมูลคริปโต");
  return data.map((c) => ({ key: c.id, symbol: (c.symbol || "").toUpperCase(), name: c.name, price: c.current_price, change: c.price_change_percentage_24h ?? null, image: c.image }));
}

// 10 สกุลเงินที่คนไทยสนใจสุด (คู่ค้า/สายท่องเที่ยวหลัก) — ปรับลิสต์ได้ตามต้องการ
const TOP_CURRENCIES = ["USD", "EUR", "JPY", "GBP", "CNY", "SGD", "AUD", "HKD", "KRW", "TWD"];
const CURRENCY_NAMES = { USD: "ดอลลาร์สหรัฐ", EUR: "ยูโร", JPY: "เยนญี่ปุ่น", GBP: "ปอนด์สเตอร์ลิง", CNY: "หยวนจีน", SGD: "ดอลลาร์สิงคโปร์", AUD: "ดอลลาร์ออสเตรเลีย", HKD: "ดอลลาร์ฮ่องกง", KRW: "วอนเกาหลีใต้", TWD: "ดอลลาร์ไต้หวัน" };

async function fetchTopCurrencies() {
  const r = await fetch("https://open.er-api.com/v6/latest/USD", { headers: BROWSER_HEADERS });
  if (!r.ok) throw new Error(`ดึงอัตราแลกเปลี่ยนไม่สำเร็จ (HTTP ${r.status})`);
  const data = await r.json();
  const rates = data?.rates;
  if (!rates?.THB) throw new Error("ไม่พบอัตราแลกเปลี่ยน");
  const thbPerUsd = rates.THB;
  return TOP_CURRENCIES.map((code) => {
    const perUsd = rates[code];
    if (!perUsd) return null;
    return { key: code.toLowerCase(), symbol: code, name: CURRENCY_NAMES[code] || code, price: thbPerUsd / perUsd, change: null };
  }).filter(Boolean);
}

// หุ้นไทย 50 ตัว (SET) กระจายหลายกลุ่มอุตสาหกรรม — ชื่อบริษัทใส่ไว้เองเลย ไม่พึ่ง Yahoo (v8/chart ไม่ให้ชื่อบริษัทมาด้วย)
const THAI_STOCKS = [
  { symbol: "KBANK.BK", name: "ธนาคารกสิกรไทย" }, { symbol: "SCB.BK", name: "ธนาคารไทยพาณิชย์" }, { symbol: "BBL.BK", name: "ธนาคารกรุงเทพ" }, { symbol: "KTB.BK", name: "ธนาคารกรุงไทย" }, { symbol: "TTB.BK", name: "ทีเอ็มบีธนชาต" }, { symbol: "TISCO.BK", name: "ทิสโก้" },
  { symbol: "PTT.BK", name: "ปตท." }, { symbol: "PTTEP.BK", name: "ปตท.สำรวจและผลิตฯ" }, { symbol: "GULF.BK", name: "กัลฟ์ เอ็นเนอร์จี" }, { symbol: "BGRIM.BK", name: "บี.กริม เพาเวอร์" }, { symbol: "EGCO.BK", name: "เอ็กโก กรุ๊ป" }, { symbol: "RATCH.BK", name: "ราช กรุ๊ป" }, { symbol: "GPSC.BK", name: "โกลบอล เพาเวอร์ ซินเนอร์ยี่" },
  { symbol: "ADVANC.BK", name: "เอไอเอส" }, { symbol: "TRUE.BK", name: "ทรู คอร์ปอเรชั่น" }, { symbol: "INTUCH.BK", name: "อินทัช โฮลดิ้งส์" },
  { symbol: "CPALL.BK", name: "ซีพี ออลล์ (7-Eleven)" }, { symbol: "HMPRO.BK", name: "โฮมโปร" }, { symbol: "CRC.BK", name: "เซ็นทรัล รีเทล" }, { symbol: "COM7.BK", name: "คอมเซเว่น" }, { symbol: "MAKRO.BK", name: "สยามแม็คโคร" }, { symbol: "GLOBAL.BK", name: "สยามโกลบอลเฮ้าส์" },
  { symbol: "LH.BK", name: "แลนด์แอนด์เฮ้าส์" }, { symbol: "AP.BK", name: "เอพี ไทยแลนด์" }, { symbol: "SPALI.BK", name: "ศุภาลัย" }, { symbol: "SIRI.BK", name: "แสนสิริ" }, { symbol: "ORIGIN.BK", name: "ออริจิ้น พร็อพเพอร์ตี้" },
  { symbol: "AOT.BK", name: "ท่าอากาศยานไทย" }, { symbol: "MINT.BK", name: "ไมเนอร์ อินเตอร์เนชั่นแนล" }, { symbol: "ERW.BK", name: "ดิ เอราวัณ กรุ๊ป" }, { symbol: "BEM.BK", name: "ทางด่วนและรถไฟฟ้ากรุงเทพ" }, { symbol: "BTS.BK", name: "บีทีเอส กรุ๊ป" },
  { symbol: "CPF.BK", name: "เจริญโภคภัณฑ์อาหาร" }, { symbol: "TU.BK", name: "ไทยยูเนี่ยน กรุ๊ป" }, { symbol: "OSP.BK", name: "โอสถสภา" }, { symbol: "TFG.BK", name: "ไทยฟู้ดส์ กรุ๊ป" },
  { symbol: "SCC.BK", name: "ปูนซิเมนต์ไทย" }, { symbol: "SCGP.BK", name: "เอสซีจี แพคเกจจิ้ง" }, { symbol: "IVL.BK", name: "อินโดรามา เวนเจอร์ส" }, { symbol: "IRPC.BK", name: "ไออาร์พีซี" }, { symbol: "TOP.BK", name: "ไทยออยล์" },
  { symbol: "BDMS.BK", name: "กรุงเทพดุสิตเวชการ" }, { symbol: "BH.BK", name: "โรงพยาบาลบำรุงราษฎร์" }, { symbol: "BCH.BK", name: "บางกอก เชน ฮอสปิทอล" },
  { symbol: "DELTA.BK", name: "เดลต้า อีเลคโทรนิคส์" }, { symbol: "KCE.BK", name: "เคซีอี อีเลคโทรนิคส์" }, { symbol: "HANA.BK", name: "ฮานา ไมโครอิเล็คโทรนิคส" },
  { symbol: "KTC.BK", name: "บัตรกรุงไทย" }, { symbol: "MTC.BK", name: "เมืองไทย แคปปิตอล" }, { symbol: "SAWAD.BK", name: "ศรีสวัสดิ์ คอร์ปอเรชั่น" },
];
// หุ้นโลก 50 ตัว (ส่วนใหญ่จดทะเบียนในสหรัฐฯ) บริษัทที่คนรู้จักกว้างที่สุดในแต่ละกลุ่ม
const WORLD_STOCKS = [
  { symbol: "AAPL", name: "Apple" }, { symbol: "MSFT", name: "Microsoft" }, { symbol: "GOOGL", name: "Alphabet (Google)" }, { symbol: "AMZN", name: "Amazon" }, { symbol: "META", name: "Meta Platforms" }, { symbol: "NVDA", name: "Nvidia" }, { symbol: "TSLA", name: "Tesla" }, { symbol: "AVGO", name: "Broadcom" }, { symbol: "ORCL", name: "Oracle" }, { symbol: "ADBE", name: "Adobe" },
  { symbol: "CRM", name: "Salesforce" }, { symbol: "AMD", name: "AMD" }, { symbol: "INTC", name: "Intel" }, { symbol: "CSCO", name: "Cisco" }, { symbol: "QCOM", name: "Qualcomm" }, { symbol: "IBM", name: "IBM" }, { symbol: "NFLX", name: "Netflix" }, { symbol: "PYPL", name: "PayPal" }, { symbol: "UBER", name: "Uber" }, { symbol: "NOW", name: "ServiceNow" },
  { symbol: "JPM", name: "JPMorgan Chase" }, { symbol: "V", name: "Visa" }, { symbol: "MA", name: "Mastercard" }, { symbol: "BAC", name: "Bank of America" }, { symbol: "WFC", name: "Wells Fargo" }, { symbol: "GS", name: "Goldman Sachs" }, { symbol: "MS", name: "Morgan Stanley" }, { symbol: "AXP", name: "American Express" },
  { symbol: "WMT", name: "Walmart" }, { symbol: "PG", name: "Procter & Gamble" }, { symbol: "KO", name: "Coca-Cola" }, { symbol: "PEP", name: "PepsiCo" }, { symbol: "COST", name: "Costco" }, { symbol: "MCD", name: "McDonald's" }, { symbol: "NKE", name: "Nike" }, { symbol: "HD", name: "Home Depot" }, { symbol: "SBUX", name: "Starbucks" }, { symbol: "DIS", name: "Disney" },
  { symbol: "JNJ", name: "Johnson & Johnson" }, { symbol: "UNH", name: "UnitedHealth" }, { symbol: "PFE", name: "Pfizer" }, { symbol: "LLY", name: "Eli Lilly" }, { symbol: "ABBV", name: "AbbVie" }, { symbol: "MRK", name: "Merck" },
  { symbol: "XOM", name: "ExxonMobil" }, { symbol: "CVX", name: "Chevron" }, { symbol: "BA", name: "Boeing" }, { symbol: "CAT", name: "Caterpillar" }, { symbol: "GE", name: "General Electric" },
  { symbol: "BRK-B", name: "Berkshire Hathaway" },
];

// ยิงพร้อมกันทีละไม่เกิน N ตัว (ไม่ใช่ทั้ง 50 พร้อมกันหมด) กัน Yahoo มองว่าเป็นการโจมตี/รัว request จนบล็อก
async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      try { results[i] = { status: "fulfilled", value: await fn(items[i]) }; }
      catch (e) { results[i] = { status: "rejected", reason: e }; }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

async function fetchYahooQuotesBatch(list) {
  // ดึงทีละตัวแบบขนานจำกัดจำนวน (v8/chart ไม่รองรับ batch เหมือน v7 เดิมที่โดนบล็อกไปแล้ว) ตัวไหนพังข้ามไปเงียบๆ
  const results = await mapWithConcurrency(list, 10, (s) => fetchYahooChartOne(s.symbol));
  const items = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      items.push({ key: list[i].symbol, symbol: list[i].symbol.replace(".BK", ""), name: list[i].name, price: r.value.price, change: r.value.change, currency: r.value.currency });
    }
  });
  if (items.length === 0) throw new Error("ดึงข้อมูลหุ้นไม่สำเร็จทั้งหมด (Yahoo อาจบล็อกการเข้าถึงชั่วคราว)");
  return items;
}

// 📈 กราฟราคาย้อนหลัง — ใช้ v8/chart ตัวเดียวกับราคาปัจจุบัน แค่ขยาย range/interval
// interval ยิ่งช่วงยาว ยิ่งต้องห่างขึ้น กันข้อมูลเยอะเกินไป (Yahoo เองก็บังคับเพดานนี้อยู่แล้วเหมือนกัน)
const HISTORY_RANGES = {
  "1mo": { interval: "1d" }, "6mo": { interval: "1d" }, "1y": { interval: "1wk" }, "5y": { interval: "1wk" }, "max": { interval: "1mo" },
};
async function fetchYahooHistory(symbol, range) {
  const interval = HISTORY_RANGES[range]?.interval || "1wk";
  const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`, { headers: BROWSER_HEADERS });
  if (!r.ok) throw new Error(`ดึงราคาย้อนหลังไม่สำเร็จ (HTTP ${r.status})`);
  const data = await r.json();
  const result = data?.chart?.result?.[0];
  if (!result) throw new Error("ไม่พบข้อมูลราคาย้อนหลังของสัญลักษณ์นี้");
  const timestamps = result.timestamp || [];
  const closes = result.indicators?.quote?.[0]?.close || [];
  const points = timestamps.map((ts, i) => ({ t: ts * 1000, p: closes[i] })).filter((pt) => pt.p != null && isFinite(pt.p));
  if (points.length === 0) throw new Error("ไม่มีข้อมูลราคาย้อนหลังในช่วงที่เลือก");
  return points;
}

async function fetchStockList(market) {
  const list = market === "th" ? THAI_STOCKS : WORLD_STOCKS;
  const indexFetcher = market === "th" ? fetchSetIndex : fetchSP500Index;
  const [stocksR, indexR] = await Promise.allSettled([fetchYahooQuotesBatch(list), indexFetcher()]);
  const items = stocksR.status === "fulfilled" ? stocksR.value : [];
  const index = indexR.status === "fulfilled" ? indexR.value : null;
  if (items.length === 0 && !index) throw new Error([stocksR.reason?.message, indexR.reason?.message].filter(Boolean).join(" | "));
  return { index, items };
}



export default async function handler(req, res) {
  const { type, category, force, q, limit } = req.query || {};
  res.setHeader("Cache-Control", "no-store"); // กัน browser/edge เก็บ cache response นี้ไว้เอง (ปัญหาที่เคยเจอ: กดรีเฟรชแล้วดูเหมือนไม่ได้ข้อมูลใหม่)

  try {
    if (type === "news") {
      let sources;
      let cacheKey;
      if (category && FEED_SOURCES[category]) {
        // หมวดมาตรฐานที่มีอยู่แล้ว (เทค/ธุรกิจ/รถยนต์ ฯลฯ)
        sources = FEED_SOURCES[category];
        cacheKey = category;
      } else if (q) {
        // หมวด custom ที่ admin เพิ่มเองจากหน้า admin — ใช้ Google News ค้นหาด้วยคำที่ตั้งไว้
        sources = [googleNewsSourceFromQuery(q)];
        cacheKey = `custom:${q}`;
      } else {
        return res.status(400).json({ error: "ระบุ category หรือ q (คำค้นหาสำหรับหมวด custom) มาด้วย" });
      }
      // จำกัดจำนวนข่าวที่ 1-50 เรื่อง (default 10 ถ้าไม่ระบุมา) — ป้องกันค่าผิดปกติจากภายนอกด้วย
      const parsedLimit = parseInt(limit, 10);
      const safeLimit = Number.isFinite(parsedLimit) ? Math.min(50, Math.max(1, parsedLimit)) : 10;
      const { items, fetchedAt, fromCache } = await fetchNews(cacheKey, sources, force === "1" || force === "true", safeLimit);
      return res.status(200).json({ items, fetchedAt, fromCache });
    }

    // เผื่อไว้สำหรับอนาคต — TradePage / LangPage จะมาเพิ่ม branch ตรงนี้
    if (type === "stocks") {
      const view = req.query.view || "overview";
      const doForce = force === "1" || force === "true";
      if (view === "overview") {
        const { data, fetchedAt, fromCache } = await withCache("trade_overview", async () => {
          const results = await Promise.allSettled([fetchGoldPrice(), fetchSetIndex(), fetchSP500Index()]);
          const items = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
          if (items.length === 0) throw new Error(results.map((r) => r.reason?.message).filter(Boolean).join(" | "));
          return items;
        }, doForce);
        return res.status(200).json({ items: data, fetchedAt, fromCache });
      }
      if (view === "crypto") {
        const { data, fetchedAt, fromCache } = await withCache("trade_crypto", fetchTopCrypto, doForce);
        return res.status(200).json({ items: data, fetchedAt, fromCache });
      }
      if (view === "currency") {
        const { data, fetchedAt, fromCache } = await withCache("trade_currency", fetchTopCurrencies, doForce);
        return res.status(200).json({ items: data, fetchedAt, fromCache });
      }
      if (view === "th" || view === "world") {
        const { data, fetchedAt, fromCache } = await withCache(`trade_${view}`, () => fetchStockList(view), doForce);
        return res.status(200).json({ index: data.index, items: data.items, fetchedAt, fromCache });
      }
      if (view === "history") {
        const symbol = req.query.symbol;
        if (!symbol) return res.status(400).json({ error: "ระบุ symbol มาด้วย" });
        const range = Object.keys(HISTORY_RANGES).includes(req.query.range) ? req.query.range : "1y";
        const { data, fetchedAt, fromCache } = await withCache(`trade_hist_${symbol}_${range}`, () => fetchYahooHistory(symbol, range), doForce);
        return res.status(200).json({ points: data, fetchedAt, fromCache });
      }
      // 🎮 ราคาสดของสัญลักษณ์ที่ระบุเจาะจง (ไม่ใช่ทั้งลิสต์ 50 ตัว) — ใช้ตีมูลค่าพอร์ตจำลองแบบเรียลไทม์ ไม่ต้อง cache นานเพราะจำนวนคำขอน้อยอยู่แล้ว
      if (view === "quotes") {
        const market = req.query.market;
        const symbols = (req.query.symbols || "").split(",").map((s) => s.trim()).filter(Boolean);
        if (!symbols.length) return res.status(400).json({ error: "ระบุ symbols มาด้วย" });
        if (market === "crypto") {
          const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${symbols.join(",")}&vs_currencies=thb`, { headers: BROWSER_HEADERS });
          if (!r.ok) return res.status(500).json({ error: `ดึงราคาคริปโตไม่สำเร็จ (HTTP ${r.status})` });
          const data = await r.json();
          return res.status(200).json({ items: symbols.map((id) => ({ key: id, price: data[id]?.thb ?? null })) });
        }
        const results = await mapWithConcurrency(symbols.map((s) => ({ symbol: s })), 10, (s) => fetchYahooChartOne(s.symbol));
        const items = symbols.map((sym, i) => (results[i]?.status === "fulfilled" ? { key: sym, price: results[i].value.price, currency: results[i].value.currency } : { key: sym, price: null }));
        return res.status(200).json({ items });
      }
      // 🪙 bid/ask จริงของคริปโต — Binance ให้ฟรีไม่ต้องใช้ key (คู่เทรด USDT) แปลงเป็นบาทฝั่ง frontend เอง
      if (view === "cryptobidask") {
        const symbol = (req.query.symbol || "").toUpperCase();
        if (!symbol) return res.status(400).json({ error: "ระบุ symbol มาด้วย" });
        const r = await fetch(`https://api.binance.com/api/v3/ticker/bookTicker?symbol=${symbol}USDT`, { headers: BROWSER_HEADERS });
        if (!r.ok) return res.status(500).json({ error: `Binance ไม่มีคู่เทรด ${symbol}USDT หรือดึงไม่สำเร็จ (HTTP ${r.status})` });
        const data = await r.json();
        if (!data.bidPrice || !data.askPrice) return res.status(500).json({ error: "ไม่พบข้อมูล bid/ask ของเหรียญนี้" });
        return res.status(200).json({ bidUsd: parseFloat(data.bidPrice), askUsd: parseFloat(data.askPrice) });
      }
      return res.status(400).json({ error: "view ไม่ถูกต้อง (overview/crypto/currency/th/world/history/quotes/cryptobidask)" });
    }
    if (type === "vocab") {
      return res.status(501).json({ error: "ยังไม่ได้ทำส่วนคำศัพท์" });
    }

    return res.status(400).json({ error: "ระบุ type ไม่ถูกต้อง (news/stocks/vocab)" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
