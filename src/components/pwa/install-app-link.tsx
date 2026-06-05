import { useEffect, useState } from 'react'
import { Download, Share } from 'lucide-react'
import {
  canShowInstall,
  isIos,
  promptInstall,
  subscribeInstallPrompt,
} from '@/lib/pwa/install-prompt'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export function InstallAppLink() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const sync = () => setVisible(canShowInstall())
    sync()
    return subscribeInstallPrompt(sync)
  }, [])

  if (!visible) return null

  if (isIos()) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
          >
            <Download className="size-3" />
            Install app
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 text-sm">
          <p className="font-medium">Add to Home Screen</p>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-muted-foreground">
            <li className="flex items-start gap-1.5">
              <span>Tap</span>
              <Share className="mt-0.5 size-3.5 shrink-0" />
              <span>Share in Safari</span>
            </li>
            <li>Choose &ldquo;Add to Home Screen&rdquo;</li>
          </ol>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
      onClick={() => void promptInstall()}
    >
      <Download className="size-3" />
      Install app
    </button>
  )
}
