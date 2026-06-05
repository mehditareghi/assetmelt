export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

const OFFLINE_TOAST_KEY = 'assetmelt-pwa-offline-toast'

let deferredPrompt: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()

export function hasShownOfflineToast(): boolean {
  try {
    return localStorage.getItem(OFFLINE_TOAST_KEY) === '1'
  } catch {
    return false
  }
}

export function markOfflineToastShown(): void {
  try {
    localStorage.setItem(OFFLINE_TOAST_KEY, '1')
  } catch {
    // ignore storage failures
  }
}

export function isAppInstalled(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function isIos(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export function canShowInstall(): boolean {
  if (isAppInstalled()) return false
  return deferredPrompt !== null || isIos()
}

export function subscribeInstallPrompt(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function initInstallPrompt(): () => void {
  if (typeof window === 'undefined') return () => {}

  const onBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
    event.preventDefault()
    deferredPrompt = event
    listeners.forEach((listener) => listener())
  }

  const onAppInstalled = () => {
    deferredPrompt = null
    listeners.forEach((listener) => listener())
  }

  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  window.addEventListener('appinstalled', onAppInstalled)

  return () => {
    window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.removeEventListener('appinstalled', onAppInstalled)
  }
}

export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) return false
  await deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  deferredPrompt = null
  listeners.forEach((listener) => listener())
  return outcome === 'accepted'
}
