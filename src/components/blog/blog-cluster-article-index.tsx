import { ArrowRight, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { BlogPostMeta } from '@/lib/blog/types'
import { isPillarPost } from '@/lib/blog/clusters'
import { cn } from '@/lib/utils'

interface BlogClusterArticleIndexProps {
  posts: BlogPostMeta[]
  className?: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function BlogClusterArticleIndex({ posts, className }: BlogClusterArticleIndexProps) {
  return (
    <ol className={cn('divide-y divide-border/40 rounded-2xl border border-border/50', className)}>
      {posts.map((post, index) => {
        const pillar = isPillarPost(post)

        return (
          <li key={post.slug}>
            <a
              href={post.path}
              className="group flex items-start gap-4 px-4 py-4 transition-colors hover:bg-muted/30 sm:px-5 sm:py-4"
            >
              <span
                aria-hidden="true"
                className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted/50 font-mono text-xs text-muted-foreground"
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  {pillar ? (
                    <Badge variant="glass" className="font-mono text-[10px] uppercase tracking-wider">
                      Start here
                    </Badge>
                  ) : null}
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                    <span aria-hidden="true"> · </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3" aria-hidden="true" />
                      {post.readingTimeMinutes} min
                    </span>
                  </span>
                </div>
                <p className="font-display font-semibold tracking-tight transition-colors group-hover:text-primary">
                  {post.title}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
              </div>
              <ArrowRight
                className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                aria-hidden="true"
              />
            </a>
          </li>
        )
      })}
    </ol>
  )
}
