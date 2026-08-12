import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// 🍎🔍 ตาข่ายกันพลาดเรื่องซูม — ถึงจะแก้ font-size ช่องพิมพ์ทุกจุดให้ ≥16px แล้ว (สาเหตุหลักที่ iOS Safari ซูมเข้าเองตอนโฟกัส
// ช่องพิมพ์ตัวเล็ก) เผื่อมีช่องไหนหลุดรอดไป อันนี้จะบังคับปิดซูมไว้ตอนกำลังพิมพ์ แล้วคืนกลับให้ซูมได้ปกติทันทีที่เลิกพิมพ์
// (focusin/focusout bubble ขึ้นมาที่ document ได้ ไม่ต้องผูก listener ทีละช่อง ครอบคลุมช่องที่ยังไม่เกิดในตอนนี้ด้วย)
if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  const normalContent = 'width=device-width, initial-scale=1.0';
  const noZoomContent = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
  document.addEventListener('focusin', (e) => {
    if (viewportMeta && e.target.matches && e.target.matches('input, textarea')) {
      viewportMeta.setAttribute('content', noZoomContent);
    }
  });
  document.addEventListener('focusout', (e) => {
    if (viewportMeta && e.target.matches && e.target.matches('input, textarea')) {
      viewportMeta.setAttribute('content', normalContent);
    }
  });
}

// 🐛 ตัวดักจับ error ทั่วแอป — เปลี่ยนจาก alert() เป็น console.error แทน (alert เดิมเด้งใส่ผู้ใช้จริงทุกคนตอน error ใดๆก็ตามเกิดขึ้น
// รวมถึง error ที่ไม่กระทบการทำงานจริง เช่นตอนวางสายเร็วระหว่างกำลังเปิดไมค์ ทำให้ดูเหมือนแอปพังทั้งที่ไม่ได้พัง)
// เช็ค log ผ่าน remote debugging ได้ปกติ (chrome://inspect บน Android, Safari Web Inspector บน iOS) ไม่ต้องพึ่ง alert แล้ว
window.addEventListener('error', (e) => {
  console.error('JS Error:', e.error?.stack || e.message || String(e));
});
window.addEventListener('unhandledrejection', (e) => {
  const msg = e.reason?.stack || e.reason?.message || String(e.reason);
  // ข้าม error นี้ไปเงียบๆ — เป็นพฤติกรรมปกติภายในของ LiveKit ตอน publish ไมค์/กล้องค้างอยู่แล้วโดนยกเลิกกลางทาง
  // (เช่นวางสายเร็วเกินไประหว่างกำลังขอสิทธิ์ไมค์) ไม่ใช่ error ที่กระทบการทำงานจริง
  if (msg.includes('Cancelled publication by calling unpublish')) return;
  console.error('Unhandled Promise:', msg);
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
