import { Link } from '@tanstack/react-router'
import type { MDXComponents } from '@/lib/blog/mdx-types'
import { isValidElement, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { getToolPage } from '@/lib/tool-pages'
import type { ToolPageId } from '@/lib/tool-pages/types'
import { studioLinkOptions, toStudioSearchParams } from '@/lib/studio-seo'
import { cn } from '@/lib/utils'
import { SrcsetPlanner } from '@/components/blog/srcset-planner'
import { ResponsivePicture } from '@/components/blog/responsive-picture'

interface BlogImageProps {
  slug: string
  name?: string
  alt: string
  caption?: string
  className?: string
}

export function BlogImage({
  slug,
  name = 'hero',
  alt,
  caption,
  className,
}: BlogImageProps) {
  const base = `/blog/${slug}/${name}`

  return (
    <figure className={cn('my-8 overflow-hidden rounded-xl border border-border/50', className)}>
      <ResponsivePicture
        avif={`${base}.avif`}
        webp={`${base}.webp`}
        jpeg={`${base}.jpg`}
        alt={alt}
        loading="lazy"
      />
      {caption ? (
        <figcaption className="border-t border-border/40 px-4 py-2 text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  )
}

interface CalloutProps {
  title?: string
  children: ReactNode
  variant?: 'info' | 'tip' | 'warning'
}

export function Callout({ title, children, variant = 'info' }: CalloutProps) {
  return (
    <aside
      className={cn(
        'my-6 rounded-xl border px-4 py-3 not-prose',
        variant === 'tip' && 'border-emerald-500/30 bg-emerald-500/5',
        variant === 'warning' && 'border-amber-500/30 bg-amber-500/5',
        variant === 'info' && 'border-primary/30 bg-primary/5',
      )}
    >
      {title ? <p className="mb-1 font-display text-sm font-semibold text-foreground">{title}</p> : null}
      <div className="text-sm leading-relaxed text-muted-foreground [&_p]:m-0">{children}</div>
    </aside>
  )
}

export function StudioCta({
  label = 'Open Studio — free, no uploads',
  from,
  to,
  budget,
}: {
  label?: string
  from?: string
  to?: string
  budget?: string
}) {
  const link = studioLinkOptions(toStudioSearchParams({ from, to, budget }))

  return (
    <div className="my-8 flex justify-center not-prose">
      <Button size="lg" asChild className="gap-2">
        {link.to === '/studio' ? (
          <Link to="/studio" search={link.search}>
            {label}
          </Link>
        ) : (
          <Link to="/studio/$conversion" params={link.params} search={link.search}>
            {label}
          </Link>
        )}
      </Button>
    </div>
  )
}

export function ToolLink({
  tool,
  children,
}: {
  tool: ToolPageId
  children?: ReactNode
}) {
  const page = getToolPage(tool)
  return (
    <Link to={page.path} className="font-medium text-primary underline-offset-4 hover:underline">
      {children ?? page.breadcrumbLabel}
    </Link>
  )
}

function getTextContent(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(getTextContent).join('')
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return getTextContent(node.props.children)
  }
  return ''
}

function slugifyHeading(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

function headingId(id: string | undefined, children: ReactNode): string | undefined {
  if (id) return id
  const slug = slugifyHeading(getTextContent(children))
  return slug || undefined
}

const defaultComponents: MDXComponents = {
  h2: ({ children, id, ...props }: { children?: ReactNode; id?: string }) => (
    <h2
      id={headingId(id, children)}
      className="mt-12 scroll-mt-24 font-display text-2xl font-bold tracking-tight text-foreground first:mt-0 sm:text-3xl"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, id, ...props }: { children?: ReactNode; id?: string }) => (
    <h3
      id={headingId(id, children)}
      className="mt-8 scroll-mt-24 font-display text-xl font-semibold tracking-tight text-foreground"
      {...props}
    >
      {children}
    </h3>
  ),
  p: ({ children, ...props }: { children?: ReactNode }) => (
    <p className="leading-relaxed text-muted-foreground" {...props}>
      {children}
    </p>
  ),
  a: ({ href, children, ...props }: { href?: string; children?: ReactNode }) => {
    if (href?.startsWith('/')) {
      return (
        <Link to={href} className="font-medium text-primary underline-offset-4 hover:underline">
          {children}
        </Link>
      )
    }
    return (
      <a
        href={href}
        className="font-medium text-primary underline-offset-4 hover:underline"
        target={href?.startsWith('http') ? '_blank' : undefined}
        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
        {...props}
      >
        {children}
      </a>
    )
  },
  ul: ({ children, ...props }: { children?: ReactNode }) => (
    <ul className="my-4 list-disc space-y-2 pl-6 text-muted-foreground" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: { children?: ReactNode }) => (
    <ol className="my-4 list-decimal space-y-2 pl-6 text-muted-foreground" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: { children?: ReactNode }) => (
    <li className="leading-relaxed" {...props}>
      {children}
    </li>
  ),
  strong: ({ children, ...props }: { children?: ReactNode }) => (
    <strong className="font-semibold text-foreground" {...props}>
      {children}
    </strong>
  ),
  code: ({ children, ...props }: { children?: ReactNode }) => (
    <code
      className="rounded bg-muted/80 px-1.5 py-0.5 font-mono text-[0.9em] text-foreground"
      {...props}
    >
      {children}
    </code>
  ),
  pre: ({ children, ...props }: { children?: ReactNode }) => (
    <pre
      className="my-6 overflow-x-auto rounded-xl border border-border/50 bg-muted/40 p-4 font-mono text-sm text-foreground"
      {...props}
    >
      {children}
    </pre>
  ),
  em: ({ children, ...props }: { children?: ReactNode }) => (
    <em className="text-foreground italic" {...props}>
      {children}
    </em>
  ),
  table: ({ children, ...props }: { children?: ReactNode }) => (
    <div className="my-8 overflow-x-auto rounded-xl border border-border/50 not-prose">
      <table className="w-full min-w-[480px] text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }: { children?: ReactNode }) => (
    <thead className="border-b border-border/40 bg-muted/30" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }: { children?: ReactNode }) => (
    <tbody {...props}>{children}</tbody>
  ),
  tr: ({ children, ...props }: { children?: ReactNode }) => (
    <tr className="border-b border-border/20 last:border-b-0 even:bg-muted/15" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }: { children?: ReactNode }) => (
    <th
      className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground sm:px-5"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }: { children?: ReactNode }) => (
    <td className="px-4 py-3 text-foreground sm:px-5" {...props}>
      {children}
    </td>
  ),
  blockquote: ({ children, ...props }: { children?: ReactNode }) => (
    <blockquote
      className="my-6 border-l-2 border-primary/40 pl-4 italic text-muted-foreground"
      {...props}
    >
      {children}
    </blockquote>
  ),
  Callout,
  StudioCta,
  ToolLink,
  BlogImage,
  SrcsetPlanner,
}

export function useMDXComponents(components: MDXComponents = {}): MDXComponents {
  return { ...defaultComponents, ...components }
}
