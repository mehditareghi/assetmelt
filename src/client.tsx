// Sentry initialization should be imported first!
import './instrument.client'

import { StartClient } from '@tanstack/react-start/client'
import { StrictMode, startTransition } from 'react'
import { hydrateRoot } from 'react-dom/client'
import {
  clearChunkReloadGuard,
  installChunkLoadRecovery,
} from '@/lib/chunk-load-recovery'
import { patchDomForBrowserTranslation } from '@/lib/patch-dom-for-browser-translation'

patchDomForBrowserTranslation()
installChunkLoadRecovery()

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <StartClient />
    </StrictMode>,
  )
})

// Clear only after the tab has stayed healthy long enough that route chunks
// could load — clearing immediately would defeat the one-shot reload guard.
window.setTimeout(() => {
  clearChunkReloadGuard()
}, 15_000)
