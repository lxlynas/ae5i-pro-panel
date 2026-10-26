/* Only app shell and public 3D resources are cached. Account/API data is excluded. */
const CACHE = 'ae5i-panel-v1.2.0';
const SHELL = ['index.html', 'assets/panel.css?v=1.2.0', 'assets/panel.js?v=1.2.0', 'assets/local-photo.js?v=1.2.0', 'manifest.webmanifest',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
  'vendor/model-viewer.min.js', 'models/ae4-max2plus-display.glb', 'guide.html', 'version.json', 'models/model-sources.json', 'models/user-model-sources.json', 'api.html', 'theme.LICENSE.txt'];
// Large character models are cached only after the user chooses one.
const OPTIONAL_MODELS = ['models/gugugaga.glb', 'models/deepseek-fumo.glb', 'models/miko-bust.glb', 'models/wukong-statue.glb', 'models/wasteland-motorcycle.glb'];
const scope = new URL('./', self.location.href);
const allowedUrls = new Set([...SHELL, ...OPTIONAL_MODELS].map(file => new URL(file, scope).href));
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
  if (!allowedUrls.has(url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cacheKey = url.href;
    const cached = await cache.match(cacheKey);
    if (cached && request.mode !== 'navigate' && !url.pathname.endsWith('/version.json')) return cached;
    try {
      const response = await fetch(request);
      if (response.ok && response.type === 'basic') {
        try { await cache.put(cacheKey, response.clone()); } catch { /* A full cache must not prevent viewing a downloaded model. */ }
      }
      return response;
    } catch (error) {
      if (cached) return cached;
      throw error;
    }
  })());
});
