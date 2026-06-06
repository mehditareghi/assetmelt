import { useOptionalOfflinePrepContext } from '@/lib/pwa/offline-prep-context'
import { WifiOff } from 'lucide-react'

interface OfflinePrepRestoreLinkProps {
  variant?: 'toolbar' | 'footer'
}

export function OfflinePrepRestoreLink({ variant = 'footer' }: OfflinePrepRestoreLinkProps) {
  const offlinePrep = useOptionalOfflinePrepContext()

  if (!offlinePrep?.showRestoreLink) return null

  const className =
    variant === 'toolbar'
      ? 'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground'
      : 'inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-primary'

  return (
    <button type="button" className={className} onClick={offlinePrep.restorePrompt}>
      <WifiOff className={variant === 'toolbar' ? 'size-3.5' : 'size-3'} aria-hidden="true" />
      Use offline
    </button>
  )
}
