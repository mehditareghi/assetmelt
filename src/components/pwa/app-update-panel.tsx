import { Button } from '@/components/ui/button'
import { useAppUpdate } from '@/hooks/use-app-update'
import { RefreshCw, X } from 'lucide-react'

export function AppUpdatePanel() {
  const { visible, currentVersion, latestVersion, dismiss, reload } = useAppUpdate()

  if (!visible || !latestVersion) return null

  return (
    <div id="app-update-panel" className="glass-surface rounded-xl border border-border/50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <RefreshCw className="size-4" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Update available</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                A new version of Asset Melt is ready
                {currentVersion ? (
                  <>
                    {' '}
                    (v{currentVersion} → v{latestVersion})
                  </>
                ) : null}
                . Reload to get the latest fixes and improvements.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0 text-muted-foreground"
              aria-label="Dismiss update notice"
              onClick={dismiss}
            >
              <X className="size-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={reload}>
              <RefreshCw className="size-3.5" />
              Reload now
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={dismiss}>
              Not now
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
