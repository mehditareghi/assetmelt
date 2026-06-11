import { useEffect } from 'react'
import { Outlet, useLocation } from '@tanstack/react-router'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import {
  OfflinePrepProvider,
  useOptionalOfflinePrepContext,
} from '@/lib/pwa/offline-prep-context'

function SiteLayoutFrame() {
  const offlinePrep = useOptionalOfflinePrepContext()
  const hideChrome = offlinePrep?.offlineStudioChrome ?? false

  if (hideChrome) {
    return (
      <div className="flex min-h-screen flex-col">
        <Outlet />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <Outlet />
      <SiteFooter />
    </div>
  )
}

export function SiteLayout() {
  const { pathname, hash } = useLocation()
  const isStudio = pathname.startsWith('/studio')

  useEffect(() => {
    if (pathname !== '/' || !hash) return
    const id = hash.replace(/^#/, '')
    const timer = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }, 0)
    return () => window.clearTimeout(timer)
  }, [pathname, hash])

  if (isStudio) {
    return (
      <OfflinePrepProvider>
        <SiteLayoutFrame />
      </OfflinePrepProvider>
    )
  }

  return <SiteLayoutFrame />
}
