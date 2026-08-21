import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// ── طلب إذن الإشعارات ──
if ('Notification' in window) {
  console.log('📌 [Main] Notifications supported, checking permission...');
  if (Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      console.log('📌 [Main] Initial permission result:', permission);
      if (permission === 'denied') {
        console.warn('⚠️ [Main] Notifications blocked. User can enable from browser settings.');
      }
    });
  } else {
    console.log('📌 [Main] Initial permission:', Notification.permission);
  }
}

// ── تسجيل Service Worker للإشعارات و PWA ──
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then((registration) => {
      console.log('✅ [Main] Service Worker registered successfully');
      
      // ✅ إظهار رسالة التحديث فقط في بيئة الإنتاج
      // وليس في بيئة التطوير (dev)
      if (import.meta.env.PROD) {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🔄 [Main] تحديث جديد متاح!');
                // عرض رسالة للمستخدم لتحديث الصفحة
                if (confirm('يوجد تحديث جديد للتطبيق. هل تريد إعادة التحميل؟')) {
                  window.location.reload();
                }
              }
            });
          }
        });
      } else {
        console.log('ℹ️ [Main] وضع التطوير - تم تعطيل رسائل التحديث التلقائي');
      }
    })
    .catch(err => console.warn('❌ [Main] Service Worker registration failed:', err));
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);