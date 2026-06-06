import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  formatOfflineProgress,
  formatOfflineSize,
  offlineAssetLabel,
} from '@/lib/pwa/offline-prep'
import { useOfflinePrepContext } from '@/lib/pwa/offline-prep-context'
import {
  AlertCircle,
  Download,
  Loader2,
  RefreshCw,
  WifiOff,
  X,
} from 'lucide-react'
import type { ReactNode } from 'react'

export function OfflinePrepPanel() {
  const {
    visible,
    status,
    manifest,
    progress,
    error,
    promptDismissed,
    readyDismissed,
    startDownload,
    cancelDownload,
    dismissPrompt,
    dismissReady,
    refresh,
  } = useOfflinePrepContext()

  if (!visible) return null

  if (status === 'ready' && readyDismissed) return null
  if ((status === 'not-ready' || status === 'unsupported') && promptDismissed) return null

  let content: ReactNode

  if (status === 'checking') {
    content = (
      <div className="glass-surface flex items-center gap-3 rounded-xl border border-border/50 px-4 py-3 text-sm text-muted-foreground">
        <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />
        Checking offline status…
      </div>
    )
  } else if (status === 'ready') {
    content = (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <WifiOff className="size-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-emerald-100">Ready for offline use</p>
            <p className="text-xs text-emerald-200/70">
              The studio works without a connection on this device.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-emerald-200/70 hover:text-emerald-100"
          aria-label="Dismiss offline ready message"
          onClick={dismissReady}
        >
          <X className="size-4" />
        </Button>
      </div>
    )
  } else if (status === 'downloading' || status === 'activating') {
    const percent = progress ? formatOfflineProgress(progress) : 0
    const detail =
      status === 'activating'
        ? 'Activating offline mode…'
        : progress
          ? `${progress.loaded} of ${progress.total} files · ${formatOfflineSize(progress.loadedBytes)} of ${formatOfflineSize(progress.totalBytes)}`
          : 'Preparing download…'

    content = (
      <div className="glass-surface rounded-xl border border-border/50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="text-sm font-medium">
                {status === 'activating' ? 'Finishing up…' : 'Downloading offline pack'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
              {progress?.currentUrl && status === 'downloading' && (
                <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground/80">
                  {offlineAssetLabel(progress.currentUrl)}
                </p>
              )}
            </div>
            <Progress value={percent} aria-label="Offline download progress" />
            {status === 'downloading' && (
              <Button type="button" variant="outline" size="sm" onClick={cancelDownload}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  } else {
    const downloadSize = manifest ? formatOfflineSize(manifest.totalBytes) : 'about 20 MB'
    const isOutdated = status === 'outdated'
    const isError = status === 'error'

    content = (
      <div className="glass-surface rounded-xl border border-border/50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {isError ? (
              <AlertCircle className="size-4" aria-hidden="true" />
            ) : isOutdated ? (
              <RefreshCw className="size-4" aria-hidden="true" />
            ) : (
              <Download className="size-4" aria-hidden="true" />
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">
                  {isOutdated
                    ? 'Offline pack update available'
                    : 'Use the studio offline'}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {isOutdated
                    ? 'A new version is available. Update once while online to keep offline mode working.'
                    : `Optional one-time download (${downloadSize}). Only if you want to compress images without a connection.`}
                </p>
                {isError && error && (
                  <p className="mt-2 text-sm text-destructive">{error}</p>
                )}
              </div>
              {!isError && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 text-muted-foreground"
                  aria-label="Dismiss offline download prompt"
                  onClick={dismissPrompt}
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={() => void startDownload()}>
                {isOutdated ? (
                  <>
                    <RefreshCw className="size-3.5" />
                    Update offline pack
                  </>
                ) : isError ? (
                  <>
                    <RefreshCw className="size-3.5" />
                    Try again
                  </>
                ) : (
                  <>
                    <Download className="size-3.5" />
                    Download for offline
                  </>
                )}
              </Button>
              {isError && (
                <Button type="button" variant="outline" size="sm" onClick={() => void refresh()}>
                  Refresh status
                </Button>
              )}
              {!isOutdated && !isError && (
                <Button type="button" variant="ghost" size="sm" onClick={dismissPrompt}>
                  Not now
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <div id="offline-prep-panel">{content}</div>
}
