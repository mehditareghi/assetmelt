import { useEffect } from 'react'
import { Outlet, useLocation } from '@tanstack/react-router'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { OfflinePrepProvider } from '@/lib/pwa/offline-prep-context'

export function SiteLayout() {
  const { pathname, hash } = useLocation()
  const variant = pathname.startsWith('/studio') ? 'studio' : 'landing'
  const isStudio = pathname.startsWith('/studio')

  useEffect(() => {
    if (pathname !== '/' || !hash) return
    const id = hash.replace(/^#/, '')
    const timer = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }, 0)
    return () => window.clearTimeout(timer)
  }, [pathname, hash])

  const layout = (
    <div className="flex min-h-screen flex-col">
      <SiteHeader variant={variant} />
      <Outlet />
      <SiteFooter />
    </div>
  )

  if (isStudio) {
    return <OfflinePrepProvider>{layout}</OfflinePrepProvider>
  }

  return layout
}
