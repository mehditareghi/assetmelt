/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core'
import {
  cleanupOutdatedCaches,
  matchPrecache,
  precacheAndRoute,
} from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { CacheFirst, NetworkFirst } from 'workbox-strategies'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { ExpirationPlugin } from 'workbox-expiration'

declare const self: ServiceWorkerGlobalScope

const PAGES_CACHE = 'pages-cache'

/** Keys match Workbox precache manifest URLs (relative to /sw.js, no leading slash). */
const PRERENDERED_SHELLS: Record<string, string> = {
  '/': 'index.html',
  '/studio': 'studio/index.html',
  '/studio/': 'studio/index.html',
  '/studio/index.html': 'studio/index.html',
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
  </style>
</head>
<body>
  <div>
    <h1>You're offline</h1>
    <p>Open Asset Melt once while online so this device can cache the studio. Then it works on a plane.</p>
  </div>
</body>
</html>`

async function serveShellForPath(pathname: string): Promise<Response | undefined> {
  const shellKey = PRERENDERED_SHELLS[pathname]
  if (!shellKey) return undefined
  return (await matchPrecache(shellKey)) ?? undefined
}

async function prefetchOfflinePages() {
  const cache = await caches.open(PAGES_CACHE)
  await Promise.allSettled(
    ['/', '/studio'].map((path) =>
      cache.add(new Request(path, { credentials: 'same-origin' })),
    ),
  )
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      await prefetchOfflinePages()
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await clientsClaim()
    })(),
  )
})

registerRoute(
  new NavigationRoute(async ({ request, url }) => {
    const pathname = new URL(url).pathname

    try {
      const networkResponse = await fetch(request)
      if (networkResponse?.ok) {
        const cache = await caches.open(PAGES_CACHE)
        await cache.put(request, networkResponse.clone())
        return networkResponse
      }
    } catch {
      // offline — serve precached shells below
    }

    const shell = await serveShellForPath(pathname)
    if (shell) return shell

    const cached = await caches.match(request, { ignoreSearch: true })
    if (cached) return cached

    const studioShell = await serveShellForPath('/studio')
    if (studioShell) return studioShell

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
