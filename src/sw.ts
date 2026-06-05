/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { CacheFirst, NetworkFirst } from 'workbox-strategies'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { ExpirationPlugin } from 'workbox-expiration'

declare const self: ServiceWorkerGlobalScope

const PAGES_CACHE = 'pages-cache'
const OFFLINE_PAGES = ['/', '/studio'] as const
const PRERENDERED_SHELLS: Record<string, string> = {
  '/': '/index.html',
  '/studio': '/studio/index.html',
}

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

const pageCachePlugins = [
  new CacheableResponsePlugin({ statuses: [0, 200] }),
  new ExpirationPlugin({
    maxEntries: 32,
    maxAgeSeconds: 7 * 24 * 60 * 60,
  }),
]

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
    <p>Open Asset Melt once while online so this device can cache the studio. Then it works on a plane.</p>
  </div>
</body>
</html>`

async function prefetchOfflinePages() {
  const cache = await caches.open(PAGES_CACHE)
  await Promise.allSettled(
    OFFLINE_PAGES.map((path) =>
      cache.add(new Request(path, { credentials: 'same-origin' })),
    ),
  )
}

self.addEventListener('install', (event) => {
  event.waitUntil(prefetchOfflinePages())
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await clientsClaim()
    })(),
  )
})

const navigationHandler = new NetworkFirst({
  cacheName: PAGES_CACHE,
  networkTimeoutSeconds: 3,
  plugins: pageCachePlugins,
})

registerRoute(
  new NavigationRoute(async ({ event, request }) => {
    try {
      const response = await navigationHandler.handle({ event, request })
      if (response) return response
    } catch {
      // network unavailable
    }

    const cached = await caches.match(request, { ignoreSearch: true })
    if (cached) return cached

    for (const path of OFFLINE_PAGES) {
      if (new URL(request.url).pathname === path) {
        const fallback = await caches.match(path, { ignoreSearch: true })
        if (fallback) return fallback

        const shellPath = PRERENDERED_SHELLS[path]
        if (shellPath) {
          try {
            const shellHandler = createHandlerBoundToURL(shellPath)
            const shellResponse = await shellHandler({ event, request, url: new URL(request.url) })
            if (shellResponse) return shellResponse
          } catch {
            // shell not in precache yet
          }
        }
      }
    }

    return new Response(OFFLINE_FALLBACK_HTML, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }),
)

registerRoute(
  ({ url }) => url.pathname === '/version.json',
  new NetworkFirst({
    cacheName: 'version-cache',
    networkTimeoutSeconds: 3,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
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
      new CacheableResponsePlugin({ statuses: [0, 200] }),
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
      new CacheableResponsePlugin({ statuses: [0, 200] }),
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
      new CacheableResponsePlugin({ statuses: [0, 200] }),
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
