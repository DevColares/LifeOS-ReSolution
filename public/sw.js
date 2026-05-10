// public/sw.js - Unificado (PWA + Firebase Push)
importScripts('https://www.gstatic.com/firebasejs/9.2.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.2.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDVthB6l_SXFQm1STedOXHhBM8N9Q64GjM",
  authDomain: "rs-pdv.firebaseapp.com",
  projectId: "rs-pdv",
  storageBucket: "rs-pdv.firebasestorage.app",
  messagingSenderId: "64737308759",
  appId: "1:64737308759:web:6029b41044de18f7957312"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

const CACHE_NAME = 'lifeos-v2';
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json', '/icon-512.png'];

// Install & Activate (PWA)
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.map(k => k !== CACHE_NAME && caches.delete(k)))));
  self.clients.claim();
});

// Fetch (PWA)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        return res;
      })
      .catch(() => caches.match(event.request).then(cached => cached || caches.match('/index.html')))
  );
});

// --- FIREBASE PUSH (Segundo Plano) ---
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Push:', payload);
  const title = payload.notification?.title || payload.data?.title || "LifeOS";
  const body = payload.notification?.body || payload.data?.message || payload.data?.body || "Nova atualização!";
  
  return self.registration.showNotification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    data: { url: payload.data?.url || '/finance' },
    requireInteraction: true
  });
});

// Clique na Notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const c of clients) {
        if (c.url.includes(event.notification.data.url) && 'focus' in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow(event.notification.data.url);
    })
  );
});
