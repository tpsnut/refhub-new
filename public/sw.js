// 🔔 RefHub Service Worker — รับ push notification จาก server แล้วโชว์แจ้งเตือนของเครื่อง
// วางไว้ที่ public/sw.js (Vite จะ serve ไฟล์นี้ตรงๆ ที่ /sw.js อัตโนมัติ)

self.addEventListener("push", (event) => {
  let data = { title: "RefHub", body: "มีการแจ้งเตือนใหม่" };
  try { data = event.data.json(); } catch (e) {}
  event.waitUntil(
    self.registration.showNotification(data.title || "RefHub", {
      body: data.body || "",
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      tag: "refhub-notification",
    })
  );
});

// กดที่แจ้งเตือน -> เปิดแอป (หรือโฟกัสแท็บที่เปิดอยู่แล้ว)
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("/");
    })
  );
});
