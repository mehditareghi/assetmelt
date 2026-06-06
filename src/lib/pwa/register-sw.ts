const SW_URL = '/sw.js'

export interface ServiceWorkerCallbacks {
  onNeedRefresh?: (reload: () => void) => void
}

export function watchServiceWorkerUpdates(callbacks: ServiceWorkerCallbacks): () => void {
  if (!import.meta.env.PROD || typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return () => {}
  }

  let refreshing = false

  const onControllerChange = () => {
    if (refreshing) return
    refreshing = true
    window.location.reload()
  }

  navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

  const notifyNeedRefresh = (registration: ServiceWorkerRegistration) => {
    callbacks.onNeedRefresh?.(() => {
      registration.waiting?.postMessage({ type: 'SKIP_WAITING' })
    })
  }

  const wireRegistration = (registration: ServiceWorkerRegistration) => {
    if (registration.waiting && navigator.serviceWorker.controller) {
      notifyNeedRefresh(registration)
    }

    registration.addEventListener('updatefound', () => {
      const installing = registration.installing
      if (!installing) return

      installing.addEventListener('statechange', () => {
        if (installing.state !== 'installed') return
        if (navigator.serviceWorker.controller) {
          notifyNeedRefresh(registration)
        }
      })
    })
  }

  const watch = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration(SW_URL)
      if (!registration) return
      wireRegistration(registration)
      await registration.update()
    } catch {
      // SW updates are optional until the user opts into offline mode.
    }
  }

  void watch()

  return () => {
    navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
  }
}

/** Inline-safe bootstrap for the document shell (runs before React). */
export const documentBootstrapScript = `(function(){var p=location.pathname;if(p==='/studio/index.html'){history.replaceState(null,'','/studio'+location.search+location.hash)}})();`
