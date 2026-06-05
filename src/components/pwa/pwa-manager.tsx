import { useEffect } from 'react'
import { toast } from 'sonner'
import {
  hasShownOfflineToast,
  initInstallPrompt,
  markOfflineToastShown,
} from '@/lib/pwa/install-prompt'
import { registerServiceWorker } from '@/lib/pwa/register-sw'

export function PwaManager() {
  useEffect(() => {
    const cleanupInstallPrompt = initInstallPrompt()

    const cleanupSw = registerServiceWorker({
      onOfflineReady: () => {
        if (hasShownOfflineToast()) return
        markOfflineToastShown()
        toast('Ready to work offline', {
          description: 'Asset Melt is cached on this device. Open it once while online, then the studio works offline.',
          duration: 8000,
        })
      },
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
