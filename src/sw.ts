/// <reference lib="webworker" />

declare const OFFLINE_CACHE_NAME: string

const sw = self as unknown as ServiceWorkerGlobalScope

const CACHE_NAME = OFFLINE_CACHE_NAME

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

function isRedirectResponse(response: Response): boolean {
  return (
    (response.status >= 300 && response.status < 400) ||
    response.type === 'opaqueredirect'
  )
}

function isHtmlResponse(response: Response): boolean {
  const type = response.headers.get('content-type') ?? ''
  return type.includes('text/html')
}

function isStudioNavigation(pathname: string): boolean {
  return (
    pathname === '/studio' ||
    pathname === '/studio/' ||
    pathname === '/studio/index.html' ||
    pathname.startsWith('/studio/')
  )
}

function studioNavigationPaths(): string[] {
  return ['/studio', '/studio/index.html']
}

async function toNavigationResponse(response: Response): Promise<Response | undefined> {
  if (!response.ok || isRedirectResponse(response) || !isHtmlResponse(response)) {
    return undefined
  }

  const body = await response.blob()
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': response.headers.get('content-type') ?? 'text/html; charset=utf-8',
    },
  })
}

async function matchCached(request: Request): Promise<Response | undefined> {
  const cache = await caches.open(CACHE_NAME)
  const response = await cache.match(request)
  if (!response || isRedirectResponse(response)) return undefined
  return response
}

async function serveStudioNavigation(): Promise<Response | undefined> {
  for (const path of studioNavigationPaths()) {
    const cached = await matchCached(new Request(path))
    if (!cached) continue
    const navigationResponse = await toNavigationResponse(cached)
    if (navigationResponse) return navigationResponse
  }

  return undefined
}

async function cacheStudioNavigationShell(response: Response): Promise<void> {
  const storable = await toNavigationResponse(response)
  if (!storable) return

  const body = await storable.blob()
  const contentType =
    storable.headers.get('content-type') ?? 'text/html; charset=utf-8'
  const cache = await caches.open(CACHE_NAME)

  for (const path of studioNavigationPaths()) {
    await cache.put(
      new Request(path),
      new Response(body, {
        status: 200,
        headers: { 'Content-Type': contentType },
      }),
    )
  }
}

async function fetchFreshNavigation(request: Request): Promise<Response | undefined> {
  try {
    const response = await fetch(request, { cache: 'no-store' })
    if (!response.ok || isRedirectResponse(response) || !isHtmlResponse(response)) {
      return undefined
    }
    return response
  } catch {
    return undefined
  }
}

sw.addEventListener('install', () => {
  // Activation is triggered by the client after the offline pack download completes.
})

sw.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await caches.delete('assetmelt-offline-v1')
      await caches.delete('assetmelt-offline-v2')
      await sw.clients.claim()
    })(),
  )
})

sw.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  event.respondWith(handleFetch(event.request))
})

async function handleFetch(request: Request): Promise<Response> {
  const pathname = new URL(request.url).pathname

  if (request.mode === 'navigate') {
    if (sw.navigator.onLine) {
      const fresh = await fetchFreshNavigation(request)
      if (fresh) {
        if (isStudioNavigation(pathname)) {
          await cacheStudioNavigationShell(fresh.clone())
        }
        return fresh
      }
    }

    if (!sw.navigator.onLine) {
      const studioShell = await serveStudioNavigation()
      if (studioShell) return studioShell

      return new Response(OFFLINE_FALLBACK_HTML, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    if (isStudioNavigation(pathname)) {
      const studioShell = await serveStudioNavigation()
      if (studioShell) return studioShell
    }
  }

  const cached = await matchCached(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (isRedirectResponse(response)) return response
    return response
  } catch {
    if (request.mode === 'navigate') {
      const studioShell = await serveStudioNavigation()
      if (studioShell) return studioShell

      return new Response(OFFLINE_FALLBACK_HTML, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    return Response.error()
  }
}

sw.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    sw.skipWaiting()
  }
})
