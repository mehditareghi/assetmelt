import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  getInstallPlatform,
  hasNativeInstallPrompt,
  isInAppBrowser,
  isIosSafari,
  promptInstall,
} from '@/lib/pwa/install-prompt'
import {
  Download,
  ExternalLink,
  Loader2,
  Plus,
  Share,
  Smartphone,
  Sparkles,
  WifiOff,
} from 'lucide-react'

interface InstallAppDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const BENEFITS = [
  {
    icon: Smartphone,
    text: 'Launch from your home screen in full screen',
  },
  {
    icon: Sparkles,
    text: 'Studio opens instantly, without browser tabs',
  },
  {
    icon: WifiOff,
    text: 'Offline mode is optional — download when you want it',
  },
] as const

function IosInstallSteps() {
  const inAppBrowser = isInAppBrowser()
  const safari = isIosSafari()

  if (inAppBrowser) {
    return (
      <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
        <div className="flex items-start gap-3">
          <ExternalLink className="mt-0.5 size-4 shrink-0 text-amber-400" aria-hidden="true" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-100">Open in Safari first</p>
            <p className="text-sm leading-relaxed text-amber-200/75">
              In-app browsers can&apos;t install apps. Open{' '}
              <span className="font-medium text-amber-100">assetmelt.com</span> in Safari, then
              come back to this dialog.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ol className="space-y-3">
      <li className="flex gap-3 rounded-xl border border-border/50 bg-background/40 p-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-mono text-xs font-semibold text-primary">
          1
        </span>
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium">Tap Share</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {safari ? (
              <>
                Use the <Share className="mx-0.5 inline size-3.5 align-text-bottom" /> Share
                button in Safari&apos;s toolbar.
              </>
            ) : (
              <>
                Open your browser&apos;s share menu — usually near the address bar.
              </>
            )}
          </p>
        </div>
      </li>
      <li className="flex gap-3 rounded-xl border border-border/50 bg-background/40 p-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-mono text-xs font-semibold text-primary">
          2
        </span>
        <div className="min-w-0 space-y-1">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            Choose <Plus className="size-3.5" aria-hidden="true" /> Add to Home Screen
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Scroll the share sheet if you don&apos;t see it right away.
          </p>
        </div>
      </li>
      <li className="flex gap-3 rounded-xl border border-border/50 bg-background/40 p-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-mono text-xs font-semibold text-primary">
          3
        </span>
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium">Tap Add</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Asset Melt will appear on your home screen like a regular app.
          </p>
        </div>
      </li>
    </ol>
  )
}

export function InstallAppDialog({ open, onOpenChange }: InstallAppDialogProps) {
  const platform = getInstallPlatform()
  const [installing, setInstalling] = useState(false)

  if (!platform) return null

  const handleNativeInstall = async () => {
    if (!hasNativeInstallPrompt()) return
    setInstalling(true)
    try {
      const accepted = await promptInstall()
      if (accepted) onOpenChange(false)
    } finally {
      setInstalling(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-surface max-h-[min(90vh,720px)] overflow-y-auto border-border/50 sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <div className="mx-auto mb-1 flex size-16 items-center justify-center overflow-hidden rounded-2xl border border-border/50 bg-background shadow-lg shadow-black/20">
            <img src="/icons/icon-192.png" alt="" className="size-full object-cover" />
          </div>
          <DialogTitle className="font-display text-xl">Install Asset Melt</DialogTitle>
          <DialogDescription className="max-w-sm text-center leading-relaxed">
            {platform === 'native'
              ? 'Add the studio to your device for a focused, app-like experience.'
              : 'Add Asset Melt to your home screen for a focused, app-like studio experience.'}
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2.5">
          {BENEFITS.map((benefit) => (
            <li
              key={benefit.text}
              className="flex items-start gap-3 rounded-lg border border-border/40 bg-background/30 px-3 py-2.5"
            >
              <benefit.icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="text-sm leading-relaxed text-muted-foreground">{benefit.text}</span>
            </li>
          ))}
        </ul>

        {platform === 'ios' ? <IosInstallSteps /> : null}

        <DialogFooter className="gap-2 sm:justify-center">
          {platform === 'native' ? (
            <>
              <Button
                type="button"
                className="w-full sm:w-auto"
                disabled={installing}
                onClick={() => void handleNativeInstall()}
              >
                {installing ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Installing…
                  </>
                ) : (
                  <>
                    <Download className="size-4" />
                    Install app
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full sm:w-auto"
                onClick={() => onOpenChange(false)}
              >
                Not now
              </Button>
            </>
          ) : (
            <Button type="button" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
              Got it
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
