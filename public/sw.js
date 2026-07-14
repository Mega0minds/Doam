const CACHE_NAME = 'doam-v3';
const OFFLINE_URLS = ['/', '/index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/auth') || url.hostname.includes('supabase')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request).then((r) => r || caches.match('/')))
  );
});

// ---- Push notifications ----
self.addEventListener('push', (event) => {
  let payload = {
    title: 'DoAm',
    body: "DoAm is checking in on you 👋",
    url: '/dashboard',
    kind: 'general',
  };
  try {
    if (event.data) {
      const data = event.data.json();
      payload = { ...payload, ...data };
    }
  } catch (e) {
    if (event.data) payload.body = event.data.text();
  }

  // Alarms (wake/sleep) get persistent + their own tag so they don't replace each other.
  const isAlarm = payload.kind === 'wake' || payload.kind === 'sleep';

  const options = {
    body: payload.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: payload.url || '/dashboard', kind: payload.kind || 'general' },
    tag: `doam-${payload.kind || 'general'}`,
    renotify: true,
    requireInteraction: isAlarm || !!payload.requireInteraction,
    vibrate: isAlarm ? [300, 150, 300, 150, 300] : [120, 60, 120],
  };

  event.waitUntil(self.registration.showNotification(payload.title || 'DoAm', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/dashboard';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      for (const client of clientsArr) {
        if ('focus' in client) {
          client.navigate(targetUrl).catch(() => {});
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
