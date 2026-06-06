export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()

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

export function isIosSafari(): boolean {
  if (!isIos()) return false
  const ua = navigator.userAgent
  return /safari/i.test(ua) && !/crios|fxios|edgios|opios|gsa/i.test(ua)
}

export function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  return /(FBAN|FBAV|Instagram|Twitter|Line|LinkedInApp|Snapchat|Pinterest)/i.test(
    navigator.userAgent,
  )
}

export type InstallPlatform = 'native' | 'ios'

export function getInstallPlatform(): InstallPlatform | null {
  if (isAppInstalled()) return null
  if (deferredPrompt) return 'native'
  if (isIos()) return 'ios'
  return null
}

export function canShowInstall(): boolean {
  return getInstallPlatform() !== null
}

export function hasNativeInstallPrompt(): boolean {
  return deferredPrompt !== null
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
