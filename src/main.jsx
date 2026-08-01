import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

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
