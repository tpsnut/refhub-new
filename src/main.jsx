import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// 🍎 ติด class เฉพาะ iOS ให้ <html> ก่อน React render — ใช้แก้บั๊กที่เกิดเฉพาะ iOS Safari (เช่น จอกระโดดตอนโฟกัส input)
// โดยไม่กระทบ Android เลย (CSS ที่ผูกกับ class นี้จะไม่ทำงานถ้าไม่ใช่ iOS)
if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
  document.documentElement.classList.add('ios-device');
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
