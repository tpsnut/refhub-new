import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// 📐 ตั้งค่า --app-vh ให้เท่ากับ "ความสูงจอที่เห็นจริง" แล้วอัปเดตเมื่อจอเปลี่ยน
// (หมุนจอ / แถบ URL ของเบราว์เซอร์ยืด-หด) — ถ้าไม่มีบรรทัดพวกนี้ CSS จะ fallback ไป 1vh
// ซึ่งบนบางเบราว์เซอร์คำนวณผิดจนแอปสูงแค่ครึ่งจอ
function setAppVh() {
  // visualViewport = ความสูงที่ตาเห็นจริง (หักแถบ URL/คีย์บอร์ดออกแล้ว) แม่นกว่า innerHeight บนมือถือ
  const h = window.visualViewport?.height || window.innerHeight;
  document.documentElement.style.setProperty('--app-vh', `${h / 100}px`);
}
setAppVh();
window.addEventListener('resize', setAppVh);
window.addEventListener('orientationchange', setAppVh);
if (window.visualViewport) window.visualViewport.addEventListener('resize', setAppVh);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
