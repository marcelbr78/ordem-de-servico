/**
 * OS4U Service Worker
 * Cache inteligente: assets estáticos em cache, API sempre na rede
 */
const CACHE_NAME = 'os4u-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
];

// Instalar — cachear assets essenciais
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

// Ativar — limpar caches antigos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch — estratégia por tipo de recurso
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // API — sempre rede (nunca cache)
    if (url.pathname.startsWith('/api') || 
        url.hostname.includes('onrender.com') ||
        url.hostname.includes('os4u-backend')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Assets JS/CSS — cache first, atualiza em background
    if (url.pathname.startsWith('/assets/')) {
        event.respondWith(
            caches.match(event.request).then(cached => {
                const fetchPromise = fetch(event.request).then(response => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
                    }
                    return response;
                });
                return cached || fetchPromise;
            })
        );
        return;
    }

    // HTML — network first, fallback cache (SPA)
    event.respondWith(
        fetch(event.request)
            .then(response => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
                }
                return response;
            })
            .catch(() => caches.match('/index.html'))
    );
});

// Push notifications (para WhatsApp/OS updates no futuro)
self.addEventListener('push', (event) => {
    if (!event.data) return;
    const data = event.data.json();
    event.waitUntil(
        self.registration.showNotification(data.title || 'OS4U', {
            body: data.body || '',
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: data.tag || 'os4u',
            data: { url: data.url || '/' },
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data?.url || '/')
    );
});
