import { Link } from '@tanstack/react-router'
import { BookOpen } from 'lucide-react'
import { BlogPostCard } from '@/components/blog/blog-post-card'
import { LandingSectionHeader } from '@/components/landing/landing-section-header'
import { BLOG_POSTS } from '@/lib/blog'

export function BlogIndexPage() {
  const [featured, ...rest] = BLOG_POSTS

  return (
    <main className="flex-1">
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mesh-gradient noise-overlay absolute inset-0 -z-10" />
        <div className="landing-hero-grid pointer-events-none absolute inset-0 -z-10" />
        <div className="landing-section-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[50vh]" />

        <div className="relative mx-auto max-w-3xl text-center">
          <LandingSectionHeader
            icon={BookOpen}
            eyebrow="Blog"
            title="Image compression guides"
            titleAccent="for the privacy-conscious web"
            description="Deep dives on browser-based compression, modern formats, and workflows that never upload your files."
            className="mb-0"
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        {BLOG_POSTS.length === 0 ? (
          <p className="text-center text-muted-foreground">No posts yet — check back soon.</p>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            {featured ? (
              <div className="lg:col-span-2">
                <BlogPostCard post={featured} featured />
              </div>
            ) : null}
            {rest.map((post) => (
              <BlogPostCard key={post.slug} post={post} />
            ))}
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
