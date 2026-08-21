// public/sw.js
const CACHE_NAME = 'novex-pharma-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx',
  '/logo.png',
];

// تثبيت Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✅ تم فتح الكاش');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// تنشيط Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ حذف الكاش القديم:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// اعتراض الطلبات (خدمة دون اتصال)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // إرجاع الملف من الكاش إذا كان موجوداً
        if (response) {
          return response;
        }
        // وإلا، جلب من الشبكة
        return fetch(event.request).catch(() => {
          // إذا كان طلب صفحة، نعرض صفحة offline
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/offline.html');
          }
        });
      })
  );
});

// استقبال إشعارات push
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title = data.title || 'Novex Pharma';
  const options = {
    body: data.body || 'لديك إشعار جديد',
    icon: '/logo.png',
    badge: '/logo.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    }
  };
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// فتح التطبيق عند الضغط على الإشعار
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});