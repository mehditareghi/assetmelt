import { Link } from '@tanstack/react-router'
import { ArrowRight, Layers3 } from 'lucide-react'
import type { BlogPostMeta } from '@/lib/blog/types'
import { BLOG_CLUSTER_BY_ID, getClusterPillarPost, isPillarPost } from '@/lib/blog/clusters'
import { Badge } from '@/components/ui/badge'

interface BlogClusterRelatedProps {
  post: BlogPostMeta
  siblings: BlogPostMeta[]
}

export function BlogClusterRelated({ post, siblings }: BlogClusterRelatedProps) {
  if (!post.cluster || siblings.length === 0) return null

  const cluster = BLOG_CLUSTER_BY_ID[post.cluster]
  const pillar = getClusterPillarPost(siblings.concat(post), post.cluster)
  const onPillar = isPillarPost(post)
  const relatedPosts = pillar && !onPillar
    ? siblings.filter((sibling) => sibling.slug !== pillar.slug)
    : siblings

  return (
    <section
      aria-labelledby="cluster-related-heading"
      className="mx-auto max-w-3xl px-4 pb-12 sm:px-6 lg:px-8"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-primary">
          <Layers3 className="size-3.5" aria-hidden="true" />
          {cluster.title}
        </div>
        <Link
          to="/blog/$slug"
          params={{ slug: post.cluster }}
          className="font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
        >
          View all guides
        </Link>
      </div>

      <h2 id="cluster-related-heading" className="mb-4 font-display text-xl font-bold">
        {onPillar ? 'More in this topic' : 'Continue in this topic'}
      </h2>

      {!onPillar && pillar ? (
        <a
          href={pillar.path}
          className="glass-surface group mb-4 flex items-start gap-3 rounded-xl border border-primary/20 p-4 transition-colors hover:border-primary/40"
        >
          <Badge variant="glass" className="shrink-0 font-mono text-[10px] uppercase tracking-wider">
            Pillar guide
          </Badge>
          <div className="min-w-0 flex-1">
            <p className="font-display font-semibold transition-colors group-hover:text-primary">
              {pillar.title}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{pillar.excerpt}</p>
          </div>
          <ArrowRight
            className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
            aria-hidden="true"
          />
        </a>
      ) : null}

      <ul className="space-y-2">
        {relatedPosts.map((sibling) => (
          <li key={sibling.slug}>
            <a
              href={sibling.path}
              className="group flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/40"
            >
              <span className="min-w-0">
                <span className="font-medium transition-colors group-hover:text-primary">
                  {sibling.title}
                </span>
                {isPillarPost(sibling) ? (
                  <Badge
                    variant="outline"
                    className="ml-2 align-middle font-mono text-[10px] uppercase tracking-wider"
                  >
                    Start here
                  </Badge>
                ) : null}
              </span>
              <ArrowRight
                className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                aria-hidden="true"
              />
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
