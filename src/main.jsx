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

// 🐛 ตัวดักจับ error ชั่วคราว กันหน้าดำแบบเงียบๆ — เวลามี error ขึ้นจริงจะเด้ง alert โชว์ข้อความเลย ดีบักบนมือถือได้โดยไม่ต้องง้อ DevTools (เอาออกทีหลังเจอต้นตอครบแล้ว)
window.addEventListener('error', (e) => {
  alert('❌ JS Error:\n' + (e.error?.stack || e.message || String(e)));
});
window.addEventListener('unhandledrejection', (e) => {
  alert('❌ Unhandled Promise:\n' + (e.reason?.stack || e.reason?.message || String(e.reason)));
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
