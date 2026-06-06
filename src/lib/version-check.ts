import { APP_VERSION } from '@/generated/app-version'

export interface RemoteVersionInfo {
  version: string
  builtAt?: string
}

const DISMISS_PREFIX = 'assetmelt-update-dismissed-'

export function getBundledAppVersion(): string {
  return APP_VERSION
}

function parseSemver(version: string): [number, number, number] | null {
  const match = version.trim().match(/^v?(\d+)\.(\d+)\.(\d+)/)
  if (!match) return null
  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

export function isVersionNewer(latest: string, current: string): boolean {
  const a = parseSemver(latest)
  const b = parseSemver(current)
  if (!a || !b) return latest.trim() !== current.trim()
  for (let i = 0; i < 3; i += 1) {
    if (a[i] !== b[i]) return a[i] > b[i]
  }
  return false
}

export async function fetchRemoteVersion(): Promise<RemoteVersionInfo | null> {
  try {
    const response = await fetch(`/version.json?t=${Date.now()}`, {
      cache: 'no-store',
    })
    if (!response.ok) return null
    const data = (await response.json()) as RemoteVersionInfo
    if (typeof data.version !== 'string' || !data.version.trim()) return null
    return data
  } catch {
    return null
  }
}

export function isUpdateDismissed(version: string): boolean {
  try {
    return localStorage.getItem(`${DISMISS_PREFIX}${version}`) === '1'
  } catch {
    return false
  }
}

export function dismissUpdate(version: string): void {
  try {
    localStorage.setItem(`${DISMISS_PREFIX}${version}`, '1')
  } catch {
    // ignore storage failures
  }
}

export function shouldShowAppUpdate(remoteVersion: string): boolean {
  if (import.meta.env.DEV) return false
  const current = getBundledAppVersion()
  if (!current || current === 'dev') return false
  if (!isVersionNewer(remoteVersion, current)) return false
  return !isUpdateDismissed(remoteVersion)
}
