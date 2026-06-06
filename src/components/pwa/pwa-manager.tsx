import { useEffect } from 'react'
import { toast } from 'sonner'
import { initInstallPrompt } from '@/lib/pwa/install-prompt'
import { watchServiceWorkerUpdates } from '@/lib/pwa/register-sw'

export function PwaManager() {
  useEffect(() => {
    const cleanupInstallPrompt = initInstallPrompt()

    const cleanupSw = watchServiceWorkerUpdates({
      onNeedRefresh: (reload) => {
        toast('Update available', {
          description: 'A new version of Asset Melt is ready.',
          duration: Infinity,
          action: {
            label: 'Reload',
            onClick: reload,
          },
        })
      },
    })

    return () => {
      cleanupInstallPrompt()
      cleanupSw()
    }
  }, [])

  return null
}
