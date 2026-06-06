export const OFFLINE_CACHE_NAME = 'assetmelt-offline-v2'
export const OFFLINE_VERSION_KEY = 'assetmelt-offline-version'
export const OFFLINE_READY_DISMISSED_KEY = 'assetmelt-offline-ready-dismissed'
export const OFFLINE_PROMPT_DISMISSED_KEY = 'assetmelt-offline-prompt-dismissed'

const SW_URL = '/sw.js'
const MANIFEST_URL = '/offline-manifest.json'

export interface OfflineManifest {
  version: string
  totalBytes: number
  assets: string[]
  assetSizes: Record<string, number>
}

export interface OfflinePrepProgress {
  phase: 'downloading' | 'activating'
  loaded: number
  total: number
  loadedBytes: number
  totalBytes: number
  currentUrl?: string
}

export type OfflinePrepStatus =
  | 'unsupported'
  | 'checking'
  | 'not-ready'
  | 'outdated'
  | 'downloading'
  | 'activating'
  | 'ready'
  | 'error'

export function isOfflinePrepSupported(): boolean {
  return (
    import.meta.env.PROD &&
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'caches' in window
  )
}

export function dismissOfflineReadyBanner(): void {
  try {
    localStorage.setItem(OFFLINE_READY_DISMISSED_KEY, '1')
  } catch {
    // ignore storage failures
  }
}

export function dismissOfflinePrompt(): void {
  try {
    localStorage.setItem(OFFLINE_PROMPT_DISMISSED_KEY, '1')
  } catch {
    // ignore storage failures
  }
}

export function restoreOfflinePrompt(): void {
  try {
    localStorage.removeItem(OFFLINE_PROMPT_DISMISSED_KEY)
  } catch {
    // ignore storage failures
  }
}

export function isOfflineReadyBannerDismissed(): boolean {
  try {
    return localStorage.getItem(OFFLINE_READY_DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

export function isOfflinePromptDismissed(): boolean {
  try {
    return localStorage.getItem(OFFLINE_PROMPT_DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

export function clearOfflineDismissals(): void {
  try {
    localStorage.removeItem(OFFLINE_READY_DISMISSED_KEY)
    localStorage.removeItem(OFFLINE_PROMPT_DISMISSED_KEY)
  } catch {
    // ignore storage failures
  }
}

function getStoredOfflineVersion(): string | null {
  try {
    return localStorage.getItem(OFFLINE_VERSION_KEY)
  } catch {
    return null
  }
}

function setStoredOfflineVersion(version: string): void {
  try {
    localStorage.setItem(OFFLINE_VERSION_KEY, version)
  } catch {
    // ignore storage failures
  }
}

async function fetchOfflineManifest(): Promise<OfflineManifest> {
  const response = await fetch(MANIFEST_URL, { cache: 'no-cache' })
  if (!response.ok) {
    throw new Error('Could not load the offline manifest.')
  }
  return response.json() as Promise<OfflineManifest>
}

function isRedirectResponse(response: Response): boolean {
  return (
    (response.status >= 300 && response.status < 400) ||
    response.type === 'opaqueredirect'
  )
}

/** Safari rejects cached responses that carry redirect metadata — store clean 200 copies. */
async function toStorableResponse(response: Response): Promise<Response> {
  if (!response.ok || isRedirectResponse(response)) {
    throw new Error(`Unexpected response while caching (${response.status}).`)
  }

  const body = await response.blob()
  const headers = new Headers()
  const contentType = response.headers.get('Content-Type')
  if (contentType) headers.set('Content-Type', contentType)

  return new Response(body, { status: 200, headers })
}

async function seedNavigationShells(cache: Cache): Promise<void> {
  for (const url of ['/studio', '/']) {
    const existing = await cache.match(url)
    if (existing && !isRedirectResponse(existing)) continue

    const response = await fetch(url, { redirect: 'follow' })
    const storable = await toStorableResponse(response)
    await cache.put(url, storable)
  }
}

async function waitForServiceWorkerControl(timeoutMs = 10_000): Promise<void> {
  if (navigator.serviceWorker.controller) return

  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error('Timed out while activating offline mode.'))
    }, timeoutMs)

    navigator.serviceWorker.addEventListener(
      'controllerchange',
      () => {
        window.clearTimeout(timer)
        resolve()
      },
      { once: true },
    )
  })
}

async function activateServiceWorker(): Promise<void> {
  const registration = await navigator.serviceWorker.register(SW_URL, { scope: '/' })

  if (registration.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' })
  } else if (registration.installing) {
    await new Promise<void>((resolve) => {
      registration.installing!.addEventListener('statechange', () => {
        if (registration.installing?.state !== 'installed') return
        registration.waiting?.postMessage({ type: 'SKIP_WAITING' })
        resolve()
      })
    })
  }

  if (!navigator.serviceWorker.controller) {
    await waitForServiceWorkerControl()
  }
}

export async function getOfflinePrepSnapshot(): Promise<{
  status: OfflinePrepStatus
  manifest: OfflineManifest | null
  storedVersion: string | null
}> {
  if (!isOfflinePrepSupported()) {
    return { status: 'unsupported', manifest: null, storedVersion: null }
  }

  const storedVersion = getStoredOfflineVersion()
  let manifest: OfflineManifest | null = null

  try {
    manifest = await fetchOfflineManifest()
  } catch {
    return { status: 'error', manifest: null, storedVersion }
  }

  if (!storedVersion) {
    return { status: 'not-ready', manifest, storedVersion }
  }

  if (manifest.version !== storedVersion) {
    return { status: 'outdated', manifest, storedVersion }
  }

  const cache = await caches.open(OFFLINE_CACHE_NAME)
  const hasStudioShell = await cache.match('/studio')

  if (!hasStudioShell) {
    return { status: 'not-ready', manifest, storedVersion: null }
  }

  return { status: 'ready', manifest, storedVersion }
}

export async function prepareForOffline(
  onProgress: (progress: OfflinePrepProgress) => void,
  signal?: AbortSignal,
): Promise<void> {
  if (!isOfflinePrepSupported()) {
    throw new Error('Offline mode is not supported in this browser.')
  }

  const manifest = await fetchOfflineManifest()
  const storedVersion = getStoredOfflineVersion()
  const shouldReplace = storedVersion !== manifest.version

  if (shouldReplace) {
    await caches.delete(OFFLINE_CACHE_NAME)
    clearOfflineDismissals()
  }

  const cache = await caches.open(OFFLINE_CACHE_NAME)
  const total = manifest.assets.length
  let loadedBytes = 0

  for (let index = 0; index < manifest.assets.length; index++) {
    if (signal?.aborted) {
      throw new DOMException('Download cancelled.', 'AbortError')
    }

    const url = manifest.assets[index]!
    const request = new Request(url, { credentials: 'same-origin' })

    if (!shouldReplace && (await cache.match(request))) {
      loadedBytes += manifest.assetSizes[url] ?? 0
      onProgress({
        phase: 'downloading',
        loaded: index + 1,
        total,
        loadedBytes,
        totalBytes: manifest.totalBytes,
        currentUrl: url,
      })
      continue
    }

    const response = await fetch(request, { redirect: 'follow' })
    const storable = await toStorableResponse(response)

    try {
      await cache.put(request, storable)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw error
      }
      throw new Error(`Could not save ${url} to device storage.`)
    }
    loadedBytes += manifest.assetSizes[url] ?? Number(response.headers.get('content-length') ?? 0)

    onProgress({
      phase: 'downloading',
      loaded: index + 1,
      total,
      loadedBytes,
      totalBytes: manifest.totalBytes,
      currentUrl: url,
    })
  }

  await seedNavigationShells(cache)

  onProgress({
    phase: 'activating',
    loaded: total,
    total,
    loadedBytes: manifest.totalBytes,
    totalBytes: manifest.totalBytes,
  })

  await activateServiceWorker()
  setStoredOfflineVersion(manifest.version)
}

export function formatOfflineSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)} KB`
  }
  return `${bytes} B`
}

export function formatOfflineProgress(progress: OfflinePrepProgress): number {
  if (progress.totalBytes <= 0) {
    return progress.total > 0 ? Math.round((progress.loaded / progress.total) * 100) : 0
  }
  return Math.min(100, Math.round((progress.loadedBytes / progress.totalBytes) * 100))
}

export function offlineAssetLabel(url: string): string {
  const name = url.split('/').pop() ?? url
  return name.length > 42 ? `…${name.slice(-39)}` : name
}
