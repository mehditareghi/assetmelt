import { Link, useLocation } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { cn } from '@/lib/utils'

interface SiteHeaderProps {
  variant?: 'landing' | 'studio'
}

const LANDING_LINKS = [
  { href: '/#features', label: 'Features' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#support', label: 'Support' },
] as const

export function SiteHeader({ variant = 'landing' }: SiteHeaderProps) {
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const showSectionLinks = variant === 'landing' && isHome

  return (
    <header className="sticky top-0 z-50 pt-3">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-12 items-center justify-between gap-4 glass-nav rounded-xl border px-4 shadow-sm sm:px-5">
        <Link
          to="/"
          className="font-display text-lg font-bold tracking-tight transition-opacity hover:opacity-90"
        >
          Asset<span className="text-primary">Melt</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {showSectionLinks &&
            LANDING_LINKS.map((link, i) => (
              <Button
                key={link.href}
                variant="ghost"
                size="sm"
                asChild
                className={cn(
                  'hidden font-mono text-xs sm:inline-flex',
                  i === 1 && 'hidden md:inline-flex',
                  i === 2 && 'hidden lg:inline-flex',
                )}
              >
                <a href={link.href}>{link.label}</a>
              </Button>
            ))}
          {!isHome && variant === 'landing' ? (
            <>
              <Button variant="ghost" size="sm" asChild className="hidden font-mono text-xs sm:inline-flex">
                <Link to="/">Home</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className="hidden font-mono text-xs sm:inline-flex">
                <Link to="/blog">Blog</Link>
              </Button>
            </>
          ) : null}
          <ThemeToggle />
          {variant === 'landing' ? (
            <Button size="sm" asChild className="ml-1">
              <Link to="/studio">Open Studio</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link to="/">Home</Link>
            </Button>
          )}
        </nav>
        </div>
      </div>
    </header>
  )
}
