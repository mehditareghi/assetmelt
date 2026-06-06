export const OFFLINE_CACHE_NAME = 'assetmelt-offline-v2'
export const OFFLINE_VERSION_KEY = 'assetmelt-offline-version'
export const OFFLINE_MANIFEST_META_KEY = 'assetmelt-offline-manifest-meta'
export const OFFLINE_SW_ACTIVATING_KEY = 'assetmelt-sw-activating-offline'
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

function getCachedManifestMeta(): Pick<OfflineManifest, 'version' | 'totalBytes'> | null {
  try {
    const raw = localStorage.getItem(OFFLINE_MANIFEST_META_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Pick<OfflineManifest, 'version' | 'totalBytes'>
    if (typeof parsed.version !== 'string' || typeof parsed.totalBytes !== 'number') return null
    return parsed
  } catch {
    return null
  }
}

function setCachedManifestMeta(manifest: OfflineManifest): void {
  try {
    localStorage.setItem(
      OFFLINE_MANIFEST_META_KEY,
      JSON.stringify({ version: manifest.version, totalBytes: manifest.totalBytes }),
    )
  } catch {
    // ignore storage failures
  }
}

export function markOfflineServiceWorkerActivation(): void {
  try {
    sessionStorage.setItem(OFFLINE_SW_ACTIVATING_KEY, '1')
  } catch {
    // ignore storage failures
  }
}

export function consumeOfflineServiceWorkerActivation(): boolean {
  try {
    const active = sessionStorage.getItem(OFFLINE_SW_ACTIVATING_KEY) === '1'
    if (active) sessionStorage.removeItem(OFFLINE_SW_ACTIVATING_KEY)
    return active
  } catch {
    return false
  }
}

async function hasCachedStudioShell(): Promise<boolean> {
  const cache = await caches.open(OFFLINE_CACHE_NAME)
  return Boolean(await cache.match('/studio'))
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
async function toStorableResponse(response: Response): Promise<{ response: Response; size: number }> {
  if (!response.ok || isRedirectResponse(response)) {
    throw new Error(`Unexpected response while caching (${response.status}).`)
  }

  const body = await response.blob()
  const headers = new Headers()
  const contentType = response.headers.get('Content-Type')
  if (contentType) headers.set('Content-Type', contentType)

  return {
    response: new Response(body, { status: 200, headers }),
    size: body.size,
  }
}

async function seedNavigationShells(cache: Cache): Promise<void> {
  for (const url of ['/studio', '/']) {
    const existing = await cache.match(url)
    if (existing && !isRedirectResponse(existing)) continue

    const response = await fetch(url, { redirect: 'follow' })
    const { response: storable } = await toStorableResponse(response)
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
  markOfflineServiceWorkerActivation()
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
  const cachedMeta = getCachedManifestMeta()
  const hasShell = storedVersion ? await hasCachedStudioShell() : false

  if (storedVersion && hasShell) {
    const cachedManifest: OfflineManifest | null = cachedMeta
      ? {
          version: cachedMeta.version,
          totalBytes: cachedMeta.totalBytes,
          assets: [],
          assetSizes: {},
        }
      : null

    if (!navigator.onLine) {
      return { status: 'ready', manifest: cachedManifest, storedVersion }
    }

    try {
      const remoteManifest = await fetchOfflineManifest()
      if (remoteManifest.version !== storedVersion) {
        return { status: 'outdated', manifest: remoteManifest, storedVersion }
      }
      setCachedManifestMeta(remoteManifest)
      return { status: 'ready', manifest: remoteManifest, storedVersion }
    } catch {
      return { status: 'ready', manifest: cachedManifest, storedVersion }
    }
  }

  try {
    const manifest = await fetchOfflineManifest()
    return { status: 'not-ready', manifest, storedVersion }
  } catch {
    if (storedVersion && hasShell) {
      return {
        status: 'ready',
        manifest: cachedMeta
          ? {
              version: cachedMeta.version,
              totalBytes: cachedMeta.totalBytes,
              assets: [],
              assetSizes: {},
            }
          : null,
        storedVersion,
      }
    }
    return { status: 'error', manifest: null, storedVersion }
  }
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
    const expectedSize = manifest.assetSizes[url] ?? 0

    if (!shouldReplace && (await cache.match(request))) {
      loadedBytes += expectedSize
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
    const { response: storable, size: storedSize } = await toStorableResponse(response)

    try {
      await cache.put(request, storable)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw error
      }
      throw new Error(`Could not save ${url} to device storage.`)
    }
    loadedBytes += expectedSize > 0 ? expectedSize : storedSize

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
    loadedBytes: Math.max(loadedBytes, manifest.totalBytes),
    totalBytes: Math.max(manifest.totalBytes, loadedBytes),
  })

  await activateServiceWorker()
  setStoredOfflineVersion(manifest.version)
  setCachedManifestMeta(manifest)
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
