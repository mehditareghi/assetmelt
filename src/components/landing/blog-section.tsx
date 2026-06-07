import { Link } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { ArrowRight, BookOpen } from 'lucide-react'
import { BlogPostCard } from '@/components/blog/blog-post-card'
import { Button } from '@/components/ui/button'
import { LandingSectionHeader } from '@/components/landing/landing-section-header'
import { getLatestBlogPosts } from '@/lib/blog'

export function BlogSection() {
  const posts = getLatestBlogPosts(3)
  if (posts.length === 0) return null

  return (
    <section
      id="blog"
      className="relative scroll-mt-20 border-t border-border/30 px-4 py-24 sm:px-6 lg:px-8"
    >
      <div className="landing-section-glow pointer-events-none absolute inset-x-0 top-1/2 -z-10 h-[min(60vh,480px)] -translate-y-1/2 opacity-70" />

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.45 }}
          className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"
        >
          <LandingSectionHeader
            icon={BookOpen}
            eyebrow="From the blog"
            title="Image compression guides"
            titleAccent="that respect your privacy"
            description="Practical write-ups on browser-based workflows, modern formats, and getting smaller files without cloud uploads."
            align="left"
            className="mb-0 max-w-2xl"
          />
          <Button variant="outline" asChild className="shrink-0 gap-1.5 self-start sm:self-auto">
            <Link to="/blog">
              View all posts
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogPostCard key={post.slug} post={post} />
          ))}
        </div>
      </div>
    </section>
  )
}
