import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// 🍎 ติด class เฉพาะ iOS ให้ <html> ก่อน React render — ใช้แก้บั๊กที่เกิดเฉพาะ iOS Safari (เช่น จอกระโดดตอนโฟกัส input)
// โดยไม่กระทบ Android เลย (CSS ที่ผูกกับ class นี้จะไม่ทำงานถ้าไม่ใช่ iOS)
if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
  document.documentElement.classList.add('ios-device');
  // 🍎🐛 ตัวจริงของบั๊กจอกระโดด คือตอนคีย์บอร์ดเปิด/ปิด (โฟกัส input) iOS Safari จะย่อ "visual viewport" แล้วพยายามเลื่อนหน้าตาม
  // position:fixed อย่างเดียวไม่พอกันสิ่งนี้ ต้องดัก event นี้ตรงๆ แล้วบังคับ scrollTo(0,0) ทับกลับทันที ให้ layout ข้างในแอปที่คุมเองอยู่แล้วทำงานแทน
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => window.scrollTo(0, 0));
    window.visualViewport.addEventListener('scroll', () => window.scrollTo(0, 0));
  }
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
