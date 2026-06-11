import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { scrollToLandingSection } from '@/lib/site-navigation'
import { GitHubIcon, LinkedInIcon } from '@/components/icons/brand-icons'
import { InstallAppLink } from '@/components/pwa/install-app-link'
import { OfflinePrepRestoreLink } from '@/components/pwa/offline-prep-restore-link'
import { Badge } from '@/components/ui/badge'
import { TOOL_PAGE_LIST } from '@/lib/tool-pages'
import { SITE_AUTHOR, SITE_SOCIAL } from '@/lib/site'
import { cn } from '@/lib/utils'
import { useAppVersion } from '@/lib/version'
import { Rss, Shield } from 'lucide-react'

const YEAR = new Date().getFullYear()

const FOOTER_LINK_CLASS =
  'font-mono text-xs text-muted-foreground transition-colors hover:text-primary'

const LANDING_SECTION_LINKS = [
  { id: 'features', label: 'Features' },
  { id: 'how-it-works', label: 'How it works' },
  { id: 'faq', label: 'FAQ' },
  { id: 'support', label: 'Support' },
] as const

function FooterSection({
  title,
  children,
  className,
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        {title}
      </h2>
      <nav className="flex flex-col gap-2">{children}</nav>
    </div>
  )
}

function FooterHashLink({ id, label }: { id: string; label: string }) {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <a
      href={`/#${id}`}
      className={FOOTER_LINK_CLASS}
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
  )
}

function FooterRouteLink({
  to,
  children,
  className,
}: {
  to: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Link to={to} className={cn(FOOTER_LINK_CLASS, className)}>
      {children}
    </Link>
  )
}

export function SiteFooter() {
  const version = useAppVersion()
  const location = useLocation()
  const isStudio = location.pathname.startsWith('/studio')

  return (
    <footer className="mt-auto border-t border-border/40">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="flex flex-col gap-4 sm:col-span-2 lg:col-span-4">
            <Link to="/" className="font-display text-xl font-bold tracking-tight">
              Asset<span className="text-primary">Melt</span>
            </Link>
            <p className="max-w-xs text-sm text-muted-foreground">
              Client-side image studio for compression, conversion, and transforms.
            </p>
            <Badge variant="glass" className="w-fit gap-1.5 px-3 py-1 font-mono text-xs">
              <Shield className="size-3" aria-hidden="true" />
              100% client-side
            </Badge>
            <div className="flex items-center gap-3">
              <a
                href={SITE_SOCIAL.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-primary"
                aria-label="GitHub"
              >
                <GitHubIcon className="size-4" />
              </a>
              <a
                href={SITE_SOCIAL.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-primary"
                aria-label="LinkedIn"
              >
                <LinkedInIcon className="size-4" />
              </a>
              <a
                href="/rss.xml"
                className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-primary"
                aria-label="RSS feed"
              >
                <Rss className="size-3.5" aria-hidden="true" />
                <span className="font-mono text-xs">RSS</span>
              </a>
            </div>
            {version ? (
              <span className="font-mono text-xs text-muted-foreground/80">v{version}</span>
            ) : null}
          </div>

          <FooterSection title="Product" className="lg:col-span-2">
            <FooterRouteLink to="/studio">Studio</FooterRouteLink>
            {LANDING_SECTION_LINKS.map((link) => (
              <FooterHashLink key={link.id} id={link.id} label={link.label} />
            ))}
            <div className="flex flex-col gap-2 pt-1">
              <InstallAppLink />
              {isStudio ? <OfflinePrepRestoreLink /> : null}
            </div>
          </FooterSection>

          <FooterSection title="Guides" className="lg:col-span-3">
            {TOOL_PAGE_LIST.map((page) => (
              <FooterRouteLink key={page.id} to={page.path}>
                {page.breadcrumbLabel}
              </FooterRouteLink>
            ))}
            <FooterRouteLink to="/blog">Blog</FooterRouteLink>
          </FooterSection>

          <FooterSection title="About" className="lg:col-span-3">
            <FooterRouteLink to="/about">About Asset Melt</FooterRouteLink>
            <FooterRouteLink to="/author">Author</FooterRouteLink>
            <FooterRouteLink to="/privacy">Privacy</FooterRouteLink>
          </FooterSection>
        </div>
      </div>

      <div className="border-t border-border/30">
        <div className="mx-auto max-w-7xl px-4 py-4 text-center sm:px-6 lg:px-8">
          <p className="flex flex-col items-center gap-1 font-mono text-xs text-muted-foreground sm:flex-row sm:justify-center">
            <span>
              © {YEAR}{' '}
              <Link
                to="/author"
                className="text-foreground transition-colors hover:text-primary"
              >
                {SITE_AUTHOR}
              </Link>
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
