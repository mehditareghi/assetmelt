// Sentry initialization should be imported first!
import './instrument.client'

import { StartClient } from '@tanstack/react-start/client'
import { StrictMode, startTransition } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { patchDomForBrowserTranslation } from '@/lib/patch-dom-for-browser-translation'

patchDomForBrowserTranslation()

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <StartClient />
    </StrictMode>,
  )
})
