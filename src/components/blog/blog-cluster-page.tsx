import { Link } from '@tanstack/react-router'
import { ArrowRight, ChevronRight, Layers3, Wrench } from 'lucide-react'
import { BlogClusterArticleIndex } from '@/components/blog/blog-cluster-article-index'
import { BlogPostCard } from '@/components/blog/blog-post-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { BlogCluster, BlogPostMeta } from '@/lib/blog/types'
import { getRelatedToolPages } from '@/lib/tool-pages'

const CLUSTER_TOOL_IDS = {
  'image-compression': ['batch-image-compressor', 'avif-compressor', 'squoosh-alternative'],
  'format-conversion': ['heic-to-jpg', 'batch-image-compressor', 'avif-compressor'],
  'performance-seo': ['batch-image-compressor', 'avif-compressor'],
} as const satisfies Record<BlogCluster['id'], BlogPostMeta['relatedTools']>

interface BlogClusterPageProps {
  cluster: BlogCluster
  posts: BlogPostMeta[]
}

export function BlogClusterPage({ cluster, posts }: BlogClusterPageProps) {
  const [pillar, ...supporting] = posts
  const tools = getRelatedToolPages([...CLUSTER_TOOL_IDS[cluster.id]])

  return (
    <main className="flex-1">
      <section className="relative overflow-hidden px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="mesh-gradient noise-overlay absolute inset-0 -z-10" />
        <div className="landing-hero-grid pointer-events-none absolute inset-0 -z-10" />
        <div className="landing-section-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[40vh]" />

        <div className="mx-auto max-w-5xl">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-1.5 font-mono text-xs text-muted-foreground">
              <li>
                <Link to="/" className="transition-colors hover:text-primary">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="size-3" />
              </li>
              <li>
                <Link to="/blog" className="transition-colors hover:text-primary">
                  Blog
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="size-3" />
              </li>
              <li className="text-foreground">{cluster.title}</li>
            </ol>
          </nav>

          <div className="max-w-3xl">
            <div className="mb-2 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-primary">
              <Layers3 className="size-3.5" aria-hidden="true" />
              Topic cluster
            </div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              {cluster.title} guides
            </h1>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg">
              {cluster.description}
            </p>
          </div>

          {pillar ? (
            <a
              href={pillar.path}
              className="glass-surface group mt-6 flex items-start gap-4 rounded-2xl border border-primary/20 p-4 transition-colors hover:border-primary/40 sm:p-5"
            >
              <Badge variant="glass" className="shrink-0 font-mono text-[10px] uppercase tracking-wider">
                Start here
              </Badge>
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-bold transition-colors group-hover:text-primary">
                  {pillar.title}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{pillar.excerpt}</p>
              </div>
              <ArrowRight
                className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                aria-hidden="true"
              />
            </a>
          ) : null}
        </div>
      </section>

      <section id="guides" className="mx-auto max-w-5xl px-4 pb-12 sm:px-6 lg:px-8">
        <h2 className="mb-4 font-display text-lg font-bold tracking-tight sm:text-xl">
          All guides in this topic
        </h2>
        <BlogClusterArticleIndex posts={posts} />
      </section>

      {supporting.length > 0 ? (
        <section className="mx-auto max-w-7xl border-t border-border/40 px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="mb-6 font-display text-lg font-bold tracking-tight sm:text-xl">
            Browse by card
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BlogPostCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      ) : null}

      {tools.length > 0 ? (
        <section className="border-t border-border/40 px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-5 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-primary">
              <Wrench className="size-3.5" aria-hidden="true" />
              Related tools
            </div>
            <div className="flex flex-wrap gap-2">
              {tools.map((tool) => (
                <Button key={tool.id} variant="outline" size="sm" asChild>
                  <Link to={tool.path}>{tool.breadcrumbLabel}</Link>
                </Button>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  )
}
