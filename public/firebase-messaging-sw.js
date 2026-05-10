// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.2.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.2.0/firebase-messaging-compat.js');

// Configuração idêntica ao seu src/lib/firebase.ts
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

// Este é o segredo para funcionar com o sistema FECHADO
messaging.onBackgroundMessage((payload) => {
  console.log('[Service Worker] Background Message received: ', payload);
  
  const title = payload.data.title || "LifeOS";
  const options = {
    body: payload.data.message || "Nova atualização no financeiro!",
    icon: '/icon-192.png',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    data: {
      url: payload.data.url || '/finance'
    }
  };

  self.registration.showNotification(title, options);
});

// Lógica de clique para abrir o app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(event.notification.data.url) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});
