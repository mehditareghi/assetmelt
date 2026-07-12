import { Link } from '@tanstack/react-router'
import { ArrowRight, Layers3 } from 'lucide-react'
import { motion } from 'motion/react'
import type { BlogCluster } from '@/lib/blog/types'
import type { BlogPostMeta } from '@/lib/blog/types'
import { cn } from '@/lib/utils'

interface ClusterWithPosts extends BlogCluster {
  posts: BlogPostMeta[]
}

interface BlogClusterHubCardsProps {
  clusters: ClusterWithPosts[]
  className?: string
}

export function BlogClusterHubCards({ clusters, className }: BlogClusterHubCardsProps) {
  return (
    <nav aria-label="Topic clusters" className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {clusters.map((cluster, index) => (
        <motion.div
          key={cluster.id}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.35, delay: index * 0.05 }}
        >
          <Link
            to="/blog/$slug"
            params={{ slug: cluster.id }}
            className="glass-surface group flex h-full flex-col rounded-2xl border border-border/50 p-5 transition-colors hover:border-primary/30 sm:p-6"
          >
            <div className="mb-3 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-primary">
              <Layers3 className="size-3.5" aria-hidden="true" />
              Topic cluster
            </div>
            <h2 className="font-display text-lg font-bold tracking-tight transition-colors group-hover:text-primary sm:text-xl">
              {cluster.title}
            </h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
              {cluster.description}
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 font-mono text-xs text-primary">
              {cluster.posts.length} guides
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </motion.div>
      ))}
    </nav>
  )
}
