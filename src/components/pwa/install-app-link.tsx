import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { InstallAppDialog } from '@/components/pwa/install-app-dialog'
import { canShowInstall, subscribeInstallPrompt } from '@/lib/pwa/install-prompt'

export function InstallAppLink() {
  const [visible, setVisible] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const sync = () => setVisible(canShowInstall())
    sync()
    return subscribeInstallPrompt(sync)
  }, [])

  if (!visible) return null

  return (
    <>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
        onClick={() => setOpen(true)}
      >
        <Download className="size-3" aria-hidden="true" />
        Install app
      </button>
      <InstallAppDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
