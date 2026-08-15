const CACHE_NAME = 'groovycare-cache-v2';
const OFFLINE_URL = '/offline.html';

const ASSETS_TO_CACHE = [
  OFFLINE_URL,
  '/manifest.json',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  // Force new service worker to take over immediately
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching fresh white offline fallback page v2');
      // Use no-cache fetch to ensure we get the latest public/offline.html file from server
      return Promise.all(
        ASSETS_TO_CACHE.map((url) => {
          return fetch(url, { cache: 'no-cache' }).then((response) => {
            if (!response.ok) throw new Error(`Failed to fetch ${url}`);
            return cache.put(url, response);
          });
        })
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cached offline page:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle navigation requests (page loads / HTML requests)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async (error) => {
        console.warn('[Service Worker] Network request failed for navigation, serving fresh offline.html:', error);
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(OFFLINE_URL);
        return cachedResponse || new Response('Koneksi internet terputus', {
          status: 503,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      })
    );
  }
});
