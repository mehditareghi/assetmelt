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

  const register = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })

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
    } catch {
      // SW registration can fail on unsupported or insecure contexts.
    }
  }

  void register()

  return () => {
    navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
  }
}
