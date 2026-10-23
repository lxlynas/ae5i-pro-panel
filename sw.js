/* Only app shell and public 3D resources are cached. Account/API data is excluded. */
const CACHE = 'ae5i-panel-v1';
const SHELL = ['index.html', 'assets/panel.css', 'assets/panel.js', 'manifest.webmanifest',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
  'vendor/model-viewer.min.js', 'models/ae4-max2plus-display.glb', 'guide.html', 'version.json'];
const scope = new URL('./', self.location.href);
const allowedPaths = new Set(SHELL.map(file => new URL(file, scope).pathname));
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(SHELL.map(file => new URL(file, scope).href));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== scope.origin || request.headers.has('range')) return;
  if (url.pathname === scope.pathname) url.pathname += 'index.html';
  if (!allowedPaths.has(url.pathname) || url.search) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cacheKey = url.href;
    const cached = await cache.match(cacheKey);
    if (cached && request.mode !== 'navigate' && !url.pathname.endsWith('/version.json')) return cached;
    try {
      const response = await fetch(request);
      if (response.ok && response.type === 'basic') await cache.put(cacheKey, response.clone());
      return response;
    } catch (error) {
      if (cached) return cached;
      throw error;
    }
  })());
});
