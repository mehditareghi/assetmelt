import { applyAppUpdate } from '@/lib/pwa/apply-app-update'

const RELOAD_KEY = 'assetmelt-chunk-reload'

function messageLooksLikeChunkLoadFailure(message: string): boolean {
  return (
    /Failed to fetch dynamically imported module/i.test(message) ||
    /error loading dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message)
  )
}

/**
 * Detects Vite/browser failures when a hashed route chunk is missing
 * (usually after a deploy while the client still has stale HTML).
 */
export function isChunkLoadError(error: unknown): boolean {
  if (!error) return false
  if (typeof error === 'string') return messageLooksLikeChunkLoadFailure(error)
  if (!(error instanceof Error)) return false
  if (error.name === 'ChunkLoadError') return true
  if (messageLooksLikeChunkLoadFailure(error.message)) return true
  return isChunkLoadError(error.cause)
}

export function clearChunkReloadGuard(): void {
  try {
    sessionStorage.removeItem(RELOAD_KEY)
  } catch {
    // ignore storage failures
  }
}

/**
 * Hard-reload once per tab session so the browser fetches fresh HTML that
 * points at current asset hashes. Returns true when a reload was started.
 */
export function recoverFromChunkLoadError(): boolean {
  try {
    if (sessionStorage.getItem(RELOAD_KEY) === '1') return false
    sessionStorage.setItem(RELOAD_KEY, '1')
  } catch {
    // Storage blocked — still attempt a reload.
  }
  void applyAppUpdate()
  return true
}

/** Listen for Vite preload failures before React mounts the broken route. */
export function installChunkLoadRecovery(): void {
  if (typeof window === 'undefined') return

  window.addEventListener('vite:preloadError', ((event: Event) => {
    event.preventDefault()
    recoverFromChunkLoadError()
  }) as EventListener)
}
