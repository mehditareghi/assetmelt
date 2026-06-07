import { Link } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { ChevronRight, Clock } from 'lucide-react'
import type { ComponentType } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { getRelatedToolPages } from '@/lib/tool-pages'
import type { BlogPostMeta } from '@/lib/blog/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

interface BlogPostPageProps {
  post: BlogPostMeta
  Content: ComponentType
}

export function BlogPostPage({ post, Content }: BlogPostPageProps) {
  const relatedTools = getRelatedToolPages(post.relatedTools)

  return (
    <main className="flex-1">
      <article className="relative">
        <div className="mesh-gradient pointer-events-none absolute inset-0 -z-10 opacity-60" />

        <header className="mx-auto max-w-3xl px-4 pb-8 pt-12 sm:px-6 sm:pt-16 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-8">
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
              <li className="line-clamp-1 text-foreground">{post.title}</li>
            </ol>
          </nav>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div className="mb-4 flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              <time dateTime={post.publishedAt}>Published {formatDate(post.publishedAt)}</time>
              {post.updatedAt ? (
                <>
                  <span aria-hidden="true">·</span>
                  <time dateTime={post.updatedAt}>Updated {formatDate(post.updatedAt)}</time>
                </>
              ) : null}
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" aria-hidden="true" />
                {post.readingTimeMinutes} min read
              </span>
            </div>

            <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
              {post.title}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{post.description}</p>
          </motion.div>
        </header>

        {post.heroWebp ? (
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <figure className="overflow-hidden rounded-2xl border border-border/50 shadow-lg shadow-black/10">
              <picture>
                {post.heroAvif ? (
                  <source srcSet={post.heroAvif} type="image/avif" />
                ) : null}
                <source srcSet={post.heroWebp} type="image/webp" />
                <img
                  src={post.heroWebp}
                  alt={post.heroImageAlt}
                  width={1200}
                  height={630}
                  className="h-auto w-full"
                  fetchPriority="high"
                />
              </picture>
            </figure>
          </div>
        ) : null}

        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="prose prose-neutral max-w-none prose-headings:font-display prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline dark:prose-invert">
            <Content />
          </div>
        </div>

        {post.faq.length > 0 ? (
          <section className="mx-auto max-w-3xl px-4 pb-12 sm:px-6 lg:px-8">
            <h2 className="mb-4 font-display text-2xl font-bold">Frequently asked questions</h2>
            <div className="glass-surface rounded-2xl px-5 sm:px-6">
              <Accordion type="single" collapsible className="w-full">
                {post.faq.map((item, index) => (
                  <AccordionItem key={item.question} value={`faq-${index}`}>
                    <AccordionTrigger className="font-display text-base font-semibold hover:no-underline">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>
        ) : null}

        {relatedTools.length > 0 ? (
          <section className="mx-auto max-w-3xl px-4 pb-12 sm:px-6 lg:px-8">
            <h2 className="mb-4 font-display text-xl font-bold">Related tools</h2>
            <div className="flex flex-wrap gap-2">
              {relatedTools.map((tool) => (
                <Button key={tool.id} variant="outline" size="sm" asChild>
                  <Link to={tool.path}>{tool.breadcrumbLabel}</Link>
                </Button>
              ))}
            </div>
          </section>
        ) : null}

        <section className="border-t border-border/40 px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
            <p className="text-muted-foreground">
              Ready to compress images without uploading them?
            </p>
            <Button size="lg" asChild>
              <Link to="/studio">Open Asset Melt Studio</Link>
            </Button>
          </div>
        </section>
      </article>
    </main>
  )
}
