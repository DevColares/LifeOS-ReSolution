// public/firebase-messaging-sw.js v2 (Forçar Update)
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

messaging.onBackgroundMessage((payload) => {
  console.log('[Service Worker] Message:', payload);
  
  const title = payload.notification?.title || payload.data?.title || "LifeOS";
  const body = payload.notification?.body || payload.data?.message || payload.data?.body || "Nova atualização!";
  
  const options = {
    body: body,
    icon: '/icon-192.png',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    data: {
      url: payload.data?.url || '/finance'
    }
  };

  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(event.notification.data?.url || '/') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data?.url || '/');
      }
    })
  );
});
