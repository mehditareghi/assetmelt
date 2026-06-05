/// <reference lib="webworker" />

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { CacheFirst, NetworkFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

declare const self: ServiceWorkerGlobalScope

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

const OFFLINE_FALLBACK_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Asset Melt — Offline</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #1a1a1a; color: #fafafa; margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 1.5rem; text-align: center; }
    p { color: #a3a3a3; max-width: 28rem; line-height: 1.5; }
    a { color: #f59e0b; }
  </style>
</head>
<body>
  <div>
    <h1>You're offline</h1>
    <p>This page hasn't been cached yet. Visit <a href="/studio">/studio</a> while online once, then it will work offline.</p>
  </div>
</body>
</html>`

registerRoute(
  new NavigationRoute(
    async ({ event, request }) => {
      try {
        const response = await new NetworkFirst({
          cacheName: 'pages-cache',
          networkTimeoutSeconds: 3,
          plugins: [
            new ExpirationPlugin({
              maxEntries: 32,
              maxAgeSeconds: 7 * 24 * 60 * 60,
            }),
          ],
        }).handle({ event, request })

        if (response) return response
      } catch {
        // fall through to offline fallback
      }

      const cached = await caches.match(request)
      if (cached) return cached

      return new Response(OFFLINE_FALLBACK_HTML, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    },
  ),
)

registerRoute(
  ({ url }) => url.pathname === '/version.json',
  new NetworkFirst({
    cacheName: 'version-cache',
    networkTimeoutSeconds: 3,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 4,
        maxAgeSeconds: 60 * 60,
      }),
    ],
  }),
)

registerRoute(
  ({ url }) =>
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 32,
        maxAgeSeconds: 365 * 24 * 60 * 60,
      }),
    ],
  }),
)

registerRoute(
  ({ request }) =>
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font' ||
    request.destination === 'worker',
  new CacheFirst({
    cacheName: 'static-assets',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 128,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }),
    ],
  }),
)

registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 64,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  }),
)

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
