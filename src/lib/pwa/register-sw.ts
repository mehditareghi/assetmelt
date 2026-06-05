const SW_URL = '/sw.js'

export interface ServiceWorkerCallbacks {
  onOfflineReady?: () => void
  onNeedRefresh?: (reload: () => void) => void
}

export function registerServiceWorker(callbacks: ServiceWorkerCallbacks): () => void {
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
        } else {
          callbacks.onOfflineReady?.()
        }
      })
    })
  }

  const register = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration(SW_URL)
      if (registration) {
        wireRegistration(registration)
        await registration.update()
        return
      }

      const nextRegistration = await navigator.serviceWorker.register(SW_URL, { scope: '/' })
      wireRegistration(nextRegistration)
    } catch {
      // SW registration can fail on unsupported or insecure contexts.
    }
  }

  void register()

  return () => {
    navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
  }
}

/** Inline-safe registration for the document shell (runs before React). */
export const serviceWorkerBootstrapScript = `(function(){if(!('serviceWorker'in navigator))return;navigator.serviceWorker.register('${SW_URL}',{scope:'/'}).catch(function(){})})();`
