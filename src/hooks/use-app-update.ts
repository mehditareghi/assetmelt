import { useCallback, useEffect, useState } from 'react'
import { applyAppUpdate } from '@/lib/pwa/apply-app-update'
import {
  dismissUpdate,
  fetchRemoteVersion,
  getBundledAppVersion,
  shouldShowAppUpdate,
} from '@/lib/version-check'

const CHECK_INTERVAL_MS = 5 * 60 * 1000

export function useAppUpdate() {
  const [latestVersion, setLatestVersion] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  const checkForUpdate = useCallback(async () => {
    const remote = await fetchRemoteVersion()
    if (!remote) return

    setLatestVersion(remote.version)
    setVisible(shouldShowAppUpdate(remote.version))
  }, [])

  useEffect(() => {
    void checkForUpdate()

    const onFocus = () => {
      void checkForUpdate()
    }

    window.addEventListener('focus', onFocus)
    const interval = window.setInterval(() => {
      void checkForUpdate()
    }, CHECK_INTERVAL_MS)

    return () => {
      window.removeEventListener('focus', onFocus)
      window.clearInterval(interval)
    }
  }, [checkForUpdate])

  const dismiss = useCallback(() => {
    if (latestVersion) dismissUpdate(latestVersion)
    setVisible(false)
  }, [latestVersion])

  const reload = useCallback(() => {
    void applyAppUpdate()
  }, [])

  return {
    visible,
    currentVersion: getBundledAppVersion(),
    latestVersion,
    dismiss,
    reload,
  }
}
