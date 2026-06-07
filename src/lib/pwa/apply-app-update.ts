import { OFFLINE_CACHE_NAME } from '@/lib/pwa/offline-prep'

const SW_URL = '/sw.js'

const NAVIGATION_SHELL_PATHS = ['/studio', '/studio/index.html']

/** Drop cached app shells so the next load can fetch fresh HTML when online. */
export async function purgeCachedNavigationShells(): Promise<void> {
  if (!('caches' in window)) return

  const cache = await caches.open(OFFLINE_CACHE_NAME)
  await Promise.all(NAVIGATION_SHELL_PATHS.map((path) => cache.delete(new Request(path))))
}

/**
 * Apply a deployed app update: activate a waiting service worker when present,
 * purge stale navigation shells, then reload (or let controllerchange reload).
 */
export async function applyAppUpdate(): Promise<void> {
  await purgeCachedNavigationShells()

  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration(SW_URL)
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        return
      }
      await registration?.update()
    } catch {
      // Fall through to a normal reload.
    }
  }

  window.location.reload()
}
