import { Link } from '@tanstack/react-router'
import { ArrowRight, BookOpen } from 'lucide-react'
import { BlogClusterHubCards } from '@/components/blog/blog-cluster-hub-cards'
import { BlogPostCard } from '@/components/blog/blog-post-card'
import { LandingSectionHeader } from '@/components/landing/landing-section-header'
import { BLOG_POSTS, groupPostsByCluster } from '@/lib/blog'

const PREVIEW_POST_COUNT = 3

export function BlogIndexPage() {
  const clusters = groupPostsByCluster(BLOG_POSTS)
  const clusteredSlugs = new Set(clusters.flatMap((cluster) => cluster.posts.map((post) => post.slug)))
  const unclusteredPosts = BLOG_POSTS.filter((post) => !clusteredSlugs.has(post.slug))

  return (
    <main className="flex-1">
      <section className="relative overflow-hidden px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="mesh-gradient noise-overlay absolute inset-0 -z-10" />
        <div className="landing-hero-grid pointer-events-none absolute inset-0 -z-10" />
        <div className="landing-section-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[40vh]" />

        <div className="relative mx-auto max-w-3xl text-center">
          <LandingSectionHeader
            icon={BookOpen}
            eyebrow="Blog"
            title="Image optimization guides"
            titleAccent="organized by topic"
            description="Practical guides on compression, format conversion, and performance SEO — grouped into topic clusters so you can start broad or jump straight to a specific workflow."
            className="mb-0"
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <BlogClusterHubCards clusters={clusters} />
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        {BLOG_POSTS.length === 0 ? (
          <p className="text-center text-muted-foreground">No posts yet — check back soon.</p>
        ) : (
          <div className="space-y-14">
            {clusters.map((cluster) => {
              const previewPosts = cluster.posts.slice(0, PREVIEW_POST_COUNT)
              const hasMore = cluster.posts.length > PREVIEW_POST_COUNT

              return (
                <section key={cluster.id} aria-labelledby={`${cluster.id}-heading`}>
                  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <Link
                        to="/blog/$slug"
                        params={{ slug: cluster.id }}
                        className="group inline-flex"
                      >
                        <h2
                          id={`${cluster.id}-heading`}
                          className="font-display text-xl font-bold tracking-tight transition-colors group-hover:text-primary sm:text-2xl"
                        >
                          {cluster.title}
                        </h2>
                      </Link>
                      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                        {cluster.description}
                      </p>
                    </div>
                    <Link
                      to="/blog/$slug"
                      params={{ slug: cluster.id }}
                      className="inline-flex shrink-0 items-center gap-1 font-mono text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary"
                    >
                      {hasMore ? `All ${cluster.posts.length} guides` : `${cluster.posts.length} guides`}
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {previewPosts.map((post) => (
                      <BlogPostCard key={post.slug} post={post} />
                    ))}
                  </div>
                </section>
              )
            })}

            {unclusteredPosts.length > 0 ? (
              <section aria-labelledby="more-guides-heading">
                <h2
                  id="more-guides-heading"
                  className="mb-5 font-display text-xl font-bold tracking-tight sm:text-2xl"
                >
                  More guides
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {unclusteredPosts.map((post) => (
                    <BlogPostCard key={post.slug} post={post} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}

        <p className="mt-12 text-center text-sm text-muted-foreground">
          Prefer hands-on?{' '}
          <Link to="/studio" className="font-medium text-primary hover:underline">
            Open the studio
          </Link>{' '}
          and compress images directly in your browser.
        </p>
      </section>
    </main>
  )
}
