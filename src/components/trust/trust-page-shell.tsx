import { Link } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface TrustPageShellProps {
  eyebrow: string
  icon: LucideIcon
  title: string
  titleAccent?: string
  description: string
  lastUpdated?: string
  children: ReactNode
  aside?: ReactNode
}

const PROSE_CLASS =
  'prose prose-neutral max-w-none prose-headings:font-display prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline dark:prose-invert'

export function TrustPageShell({
  eyebrow,
  icon: Icon,
  title,
  titleAccent,
  description,
  lastUpdated,
  children,
  aside,
}: TrustPageShellProps) {
  return (
    <main className="flex-1">
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mesh-gradient noise-overlay absolute inset-0 -z-10" />
        <div className="landing-hero-grid pointer-events-none absolute inset-0 -z-10" />
        <div className="landing-section-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[45vh]" />

        <div className="relative mx-auto max-w-3xl">
          <nav aria-label="Breadcrumb" className="mb-8 flex justify-center">
            <ol className="flex flex-wrap items-center justify-center gap-1.5 font-mono text-xs text-muted-foreground">
              <li>
                <Link to="/" className="transition-colors hover:text-primary">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="size-3" />
              </li>
              <li className="text-foreground">{eyebrow}</li>
            </ol>
          </nav>

          <div className="text-center">
            <Badge variant="glass" className="mb-5 gap-1.5 px-3 py-1 font-mono text-xs">
              <Icon className="size-3" aria-hidden="true" />
              {eyebrow}
            </Badge>

            <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
              {title}
              {titleAccent ? (
                <span className="landing-gradient-text mt-2 block text-2xl font-semibold sm:text-3xl">
                  {titleAccent}
                </span>
              ) : null}
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {description}
            </p>

            {lastUpdated ? (
              <p className="mt-4 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Last updated {lastUpdated}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className={cn(aside ? 'grid gap-10 lg:grid-cols-[1fr_240px] lg:items-start' : undefined)}>
          <div className={PROSE_CLASS}>{children}</div>
          {aside ? (
            <aside className="lg:sticky lg:top-24">{aside}</aside>
          ) : null}
        </div>
      </section>
    </main>
  )
}

interface TrustHighlightProps {
  title: string
  children: ReactNode
}

export function TrustHighlight({ title, children }: TrustHighlightProps) {
  return (
    <div className="not-prose my-8 rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6">
      <p className="font-display text-sm font-semibold text-foreground">{title}</p>
      <div className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </div>
  )
}

interface TrustCardGridProps {
  items: ReadonlyArray<{ icon: LucideIcon; title: string; description: string }>
}

export function TrustCardGrid({ items }: TrustCardGridProps) {
  return (
    <div className="not-prose my-10 grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.title}
          className="glass-surface rounded-xl border border-border/50 p-5 transition-colors hover:border-primary/30"
        >
          <item.icon className="mb-3 size-5 text-primary" aria-hidden="true" />
          <p className="font-display text-sm font-semibold text-foreground">{item.title}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
        </div>
      ))}
    </div>
  )
}

interface TrustTocProps {
  items: ReadonlyArray<{ id: string; label: string }>
}

export function TrustToc({ items }: TrustTocProps) {
  return (
    <nav aria-label="On this page" className="glass-surface rounded-xl border border-border/50 p-4">
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        On this page
      </p>
      <ol className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="block font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
