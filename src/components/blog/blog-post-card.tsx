import { motion } from 'motion/react'
import { ArrowRight, Clock } from 'lucide-react'
import type { BlogPostMeta } from '@/lib/blog/types'
import { ResponsivePicture } from '@/components/blog/responsive-picture'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { BLOG_CLUSTER_BY_ID, isPillarPost } from '@/lib/blog/clusters'

interface BlogPostCardProps {
  post: BlogPostMeta
  featured?: boolean
  className?: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function BlogPostCard({ post, featured = false, className }: BlogPostCardProps) {
  const pillar = isPillarPost(post)

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4 }}
      className={cn('group', className)}
    >
      <a
        href={post.path}
        className="glass-surface flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 transition-colors hover:border-primary/30"
      >
        {post.heroJpeg && post.heroWebp ? (
          <div className="relative aspect-[16/9] overflow-hidden bg-muted/30">
            <ResponsivePicture
              avif={post.heroAvif}
              webp={post.heroWebp}
              jpeg={post.heroJpeg}
              alt={post.heroImageAlt}
              imgClassName="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              loading="lazy"
            />
          </div>
        ) : null}

        <div className={cn('flex flex-1 flex-col p-5 sm:p-6', featured && 'lg:p-7')}>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {pillar ? (
              <Badge variant="glass" className="font-mono text-[10px] uppercase tracking-wider">
                Start here
              </Badge>
            ) : null}
            <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            {post.cluster ? (
              <>
                <span>{BLOG_CLUSTER_BY_ID[post.cluster].title}</span>
                <span aria-hidden="true">·</span>
              </>
            ) : null}
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" aria-hidden="true" />
              {post.readingTimeMinutes} min read
            </span>
            </div>
          </div>

          <h2
            className={cn(
              'font-display font-bold tracking-tight transition-colors group-hover:text-primary',
              featured ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl',
            )}
          >
            {post.title}
          </h2>

          <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
            {post.excerpt}
          </p>

          <span className="mt-4 inline-flex items-center gap-1.5 font-mono text-xs text-primary">
            Read article
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </a>
    </motion.article>
  )
}
