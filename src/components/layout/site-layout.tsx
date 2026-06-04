import { useEffect } from 'react'
import { Outlet, useLocation } from '@tanstack/react-router'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'

export function SiteLayout() {
  const { pathname, hash } = useLocation()
  const variant = pathname.startsWith('/studio') ? 'studio' : 'landing'

  useEffect(() => {
    if (pathname !== '/' || !hash) return
    const id = hash.replace(/^#/, '')
    const timer = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }, 0)
    return () => window.clearTimeout(timer)
  }, [pathname, hash])

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader variant={variant} />
      <Outlet />
      <SiteFooter />
    </div>
  )
}
