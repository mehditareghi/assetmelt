import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import GlassSurface from '@/components/GlassSurface'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { HEADER_LIQUID_GLASS } from '@/lib/glass-surface-presets'
import {
  headerLinkVisibility,
  scrollToLandingSection,
  SITE_HEADER_LINKS,
} from '@/lib/site-navigation'
import { cn } from '@/lib/utils'

function HeaderHashLink({
  id,
  label,
  className,
}: {
  id: string
  label: string
  className?: string
}) {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <Button
      variant="ghost"
      size="sm"
      asChild
      className={cn('font-mono text-xs', className)}
    >
      <a
        href={`/#${id}`}
        onClick={(event) => {
          event.preventDefault()
          if (location.pathname === '/') {
            scrollToLandingSection(id)
            return
          }
          navigate({ to: '/', hash: id })
        }}
      >
        {label}
      </a>
    </Button>
  )
}

export function SiteHeader() {
  const { pathname } = useLocation()
  const isStudio = pathname.startsWith('/studio')
  const isBlog = pathname.startsWith('/blog')

  return (
    <header className="sticky top-0 z-50 flex justify-center px-4 pt-3 sm:px-6">
      <GlassSurface
        width="auto"
        height={48}
        className="w-fit max-w-[calc(100vw-2rem)] [&>div]:p-1"
        {...HEADER_LIQUID_GLASS}
      >
        <div className="flex h-full items-center gap-3 pl-3 sm:gap-5 sm:pl-4 pr-1">
          <Link
            to="/"
            className="font-display text-lg font-bold tracking-tight transition-opacity hover:opacity-90"
            aria-current={pathname === '/' ? 'page' : undefined}
          >
            Asset<span className="text-primary">Melt</span>
          </Link>

          <nav aria-label="Main" className="flex items-center gap-1 sm:gap-1.5">
            {SITE_HEADER_LINKS.map((link) =>
              link.kind === 'hash' ? (
                <HeaderHashLink
                  key={link.id}
                  id={link.id}
                  label={link.label}
                  className={headerLinkVisibility(link.minWidth)}
                />
              ) : (
                <Button
                  key={link.to}
                  variant="ghost"
                  size="sm"
                  asChild
                  className={cn(
                    'font-mono text-xs',
                    headerLinkVisibility(link.minWidth),
                    isBlog && 'bg-accent/80 text-accent-foreground dark:bg-accent/50',
                  )}
                >
                  <Link to={link.to} aria-current={isBlog ? 'page' : undefined}>
                    {link.label}
                  </Link>
                </Button>
              ),
            )}
            <ThemeToggle />
            <Button
              size="sm"
              asChild
              variant={isStudio ? 'secondary' : 'default'}
              className="shrink-0"
            >
              <Link to="/studio" aria-current={isStudio ? 'page' : undefined}>
                Open Studio
              </Link>
            </Button>
          </nav>
        </div>
      </GlassSurface>
    </header>
  )
}
