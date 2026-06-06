import { useCallback, useEffect, useRef, useState } from 'react'
import {
  dismissOfflinePrompt,
  dismissOfflineReadyBanner,
  getOfflinePrepSnapshot,
  isOfflinePrepSupported,
  isOfflinePromptDismissed,
  isOfflineReadyBannerDismissed,
  prepareForOffline,
  restoreOfflinePrompt,
  type OfflineManifest,
  type OfflinePrepProgress,
  type OfflinePrepStatus,
} from '@/lib/pwa/offline-prep'
import { isAppInstalled } from '@/lib/pwa/install-prompt'

interface OfflinePrepState {
  visible: boolean
  status: OfflinePrepStatus
  manifest: OfflineManifest | null
  progress: OfflinePrepProgress | null
  error: string | null
  promptDismissed: boolean
  readyDismissed: boolean
}

const INITIAL_STATE: OfflinePrepState = {
  visible: false,
  status: 'checking',
  manifest: null,
  progress: null,
  error: null,
  promptDismissed: false,
  readyDismissed: false,
}

export function useOfflinePrep() {
  const [state, setState] = useState<OfflinePrepState>(INITIAL_STATE)
  const abortRef = useRef<AbortController | null>(null)

  const refresh = useCallback(async () => {
    if (!isAppInstalled() || !isOfflinePrepSupported()) {
      setState((current) => ({
        ...current,
        visible: false,
        status: 'unsupported',
        manifest: null,
        progress: null,
        error: null,
      }))
      return
    }

    setState((current) => ({
      ...current,
      visible: true,
      status: current.status === 'downloading' || current.status === 'activating'
        ? current.status
        : 'checking',
      error: null,
      promptDismissed: isOfflinePromptDismissed(),
      readyDismissed: isOfflineReadyBannerDismissed(),
    }))

    try {
      const snapshot = await getOfflinePrepSnapshot()
      setState((current) => ({
        ...current,
        visible: true,
        status:
          current.status === 'downloading' || current.status === 'activating'
            ? current.status
            : snapshot.status,
        manifest: snapshot.manifest,
        promptDismissed: isOfflinePromptDismissed(),
        readyDismissed: isOfflineReadyBannerDismissed(),
      }))
    } catch {
      setState((current) => ({
        ...current,
        visible: true,
        status: 'error',
        error: 'Could not check offline status.',
      }))
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const startDownload = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setState((current) => ({
      ...current,
      visible: true,
      status: 'downloading',
      progress: null,
      error: null,
      promptDismissed: false,
      readyDismissed: false,
    }))

    try {
      await prepareForOffline((progress) => {
        setState((current) => ({
          ...current,
          status: progress.phase === 'activating' ? 'activating' : 'downloading',
          progress,
        }))
      }, controller.signal)

      setState((current) => ({
        ...current,
        status: 'ready',
        progress: null,
        error: null,
        readyDismissed: false,
      }))
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        const snapshot = await getOfflinePrepSnapshot()
        setState((current) => ({
          ...current,
          status: snapshot.status === 'ready' ? 'ready' : 'not-ready',
          manifest: snapshot.manifest,
          progress: null,
          error: null,
        }))
        return
      }

      const message =
        error instanceof DOMException && error.name === 'QuotaExceededError'
          ? 'Not enough storage on this device. Free up space and try again.'
          : error instanceof Error
            ? error.message
            : 'Offline download failed.'

      setState((current) => ({
        ...current,
        status: 'error',
        progress: null,
        error: message,
      }))
    } finally {
      abortRef.current = null
    }
  }, [])

  const cancelDownload = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const dismissPrompt = useCallback(() => {
    dismissOfflinePrompt()
    setState((current) => ({ ...current, promptDismissed: true }))
  }, [])

  const dismissReady = useCallback(() => {
    dismissOfflineReadyBanner()
    setState((current) => ({ ...current, readyDismissed: true }))
  }, [])

  const restorePrompt = useCallback(() => {
    restoreOfflinePrompt()
    setState((current) => ({ ...current, promptDismissed: false }))
    requestAnimationFrame(() => {
      document.getElementById('offline-prep-panel')?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
    })
  }, [])

  const showRestoreLink =
    state.visible && state.promptDismissed && state.status === 'not-ready'

  return {
    ...state,
    showRestoreLink,
    refresh,
    startDownload,
    cancelDownload,
    dismissPrompt,
    dismissReady,
    restorePrompt,
  }
}
