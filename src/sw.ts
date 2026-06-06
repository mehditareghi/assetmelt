/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope

const CACHE_NAME = 'assetmelt-offline-v1'

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
    <p>Download the offline pack from the studio while you're online to use Asset Melt without a connection.</p>
  </div>
</body>
</html>`

async function matchCached(request: Request): Promise<Response | undefined> {
  const cache = await caches.open(CACHE_NAME)
  return (await cache.match(request)) ?? undefined
}

async function serveNavigation(pathname: string): Promise<Response | undefined> {
  const paths =
    pathname === '/studio' || pathname === '/studio/'
      ? ['/studio', '/studio/index.html']
      : pathname === '/'
        ? ['/', '/index.html']
        : [pathname]

  for (const path of paths) {
    const response = await matchCached(new Request(path))
    if (response) return response
  }

  return undefined
}

self.addEventListener('install', () => {
  // Activation is triggered by the client after the offline pack download completes.
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  event.respondWith(handleFetch(event.request))
})

async function handleFetch(request: Request): Promise<Response> {
  const cached = await matchCached(request)
  if (cached) return cached

  try {
    return await fetch(request)
  } catch {
    if (request.mode === 'navigate') {
      const pathname = new URL(request.url).pathname
      const shell = await serveNavigation(pathname)
      if (shell) return shell

      const studioShell = await serveNavigation('/studio')
      if (studioShell) return studioShell

      return new Response(OFFLINE_FALLBACK_HTML, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    return Response.error()
  }
}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
