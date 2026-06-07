import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { InstallAppLink } from '@/components/pwa/install-app-link'
import { OfflinePrepRestoreLink } from '@/components/pwa/offline-prep-restore-link'
import { Badge } from '@/components/ui/badge'
import { TOOL_PAGE_LIST } from '@/lib/tool-pages'
import { useAppVersion } from '@/lib/version'
import { Shield } from 'lucide-react'

const YEAR = new Date().getFullYear()

const SECTION_LINKS = [
  { id: 'features', label: 'Features' },
  { id: 'how-it-works', label: 'How it works' },
  { id: 'faq', label: 'FAQ' },
  { id: 'support', label: 'Support' },
] as const

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  window.history.pushState(null, '', `#${id}`)
}

function FooterSectionLink({ id, label }: { id: string; label: string }) {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <a
      href={`/#${id}`}
      className="font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
      onClick={(event) => {
        event.preventDefault()
        if (location.pathname === '/') {
          scrollToSection(id)
          return
        }
        navigate({ to: '/', hash: id })
      }}
    >
      {label}
    </a>
  )
}

export function SiteFooter() {
  const version = useAppVersion()
  const location = useLocation()
  const isStudio = location.pathname.startsWith('/studio')

  return (
    <footer className="mt-auto border-t border-border/40">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <Link to="/" className="font-display text-xl font-bold tracking-tight">
              Asset<span className="text-primary">Melt</span>
            </Link>
            <p className="max-w-xs text-center text-sm text-muted-foreground sm:text-left">
              Client-side image studio for compression, conversion, and transforms.
            </p>
            <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 sm:justify-start">
              {SECTION_LINKS.map((link) => (
                <FooterSectionLink key={link.id} id={link.id} label={link.label} />
              ))}
              <Link
                to="/studio"
                className="font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
              >
                Studio
              </Link>
              {isStudio ? <OfflinePrepRestoreLink /> : null}
              <InstallAppLink />
            </nav>

            <nav
              aria-label="Tool pages"
              className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 sm:justify-start"
            >
              {TOOL_PAGE_LIST.map((page) => (
                <Link
                  key={page.id}
                  to={page.path}
                  className="font-mono text-[11px] text-muted-foreground transition-colors hover:text-primary"
                >
                  {page.breadcrumbLabel}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex flex-col items-center gap-3 sm:items-end">
            <Badge variant="glass" className="gap-1.5 px-3 py-1 font-mono text-xs">
              <Shield className="size-3" />
              100% client-side
            </Badge>
            {version ? (
              <span className="font-mono text-xs text-muted-foreground">v{version}</span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="border-t border-border/30">
        <div className="mx-auto max-w-7xl px-4 py-4 text-center sm:px-6 lg:px-8">
          <p className="flex flex-col items-center gap-1 font-mono text-xs text-muted-foreground sm:flex-row sm:justify-center">
            <span>
              © {YEAR}{' '}
              <span className="text-foreground">Mehdi Tareghi</span>
            </span>
            <span aria-hidden="true" className="hidden sm:inline">
              {' · '}
            </span>
            <span>/* shipped without a backend */</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
