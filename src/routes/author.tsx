import { Link } from '@tanstack/react-router'
import { createFileRoute } from '@tanstack/react-router'
import { BookOpen, ExternalLink, Mail, User } from 'lucide-react'
import { GitHubIcon, LinkedInIcon } from '@/components/icons/brand-icons'
import { Button } from '@/components/ui/button'
import { BLOG_POSTS } from '@/lib/blog'
import { TrustHighlight, TrustPageShell } from '@/components/trust/trust-page-shell'
import { buildTrustPageHead } from '@/lib/trust-pages/seo'
import {
  SITE_AUTHOR,
  SITE_CONTACT_EMAIL,
  SITE_NAME,
  SITE_SOCIAL,
} from '@/lib/site'

export const Route = createFileRoute('/author')({
  head: () => buildTrustPageHead('/author'),
  component: AuthorPage,
})

function AuthorPage() {
  const recentPosts = BLOG_POSTS.slice(0, 3)

  return (
    <TrustPageShell
      eyebrow="Author"
      icon={User}
      title={SITE_AUTHOR}
      titleAccent="software engineer & creator of Asset Melt"
      description="I build tools that respect your privacy. Asset Melt is the image compressor I wished existed — so I made it."
    >
      <h2>About me</h2>
      <p>
        I&apos;m a software engineer who spends a lot of time in the overlap between web
        performance, developer experience, and tools that stay out of your way. I built{' '}
        <strong className="text-foreground">{SITE_NAME}</strong> because I was tired of uploading
        sensitive images to random cloud converters — and because the best existing option,
        Squoosh, was no longer keeping pace with how I actually work.
      </p>
      <p>
        {SITE_NAME} is a solo project: I write the code, author the blog posts, and respond to
        feedback. That keeps the product focused — every feature has to earn its place in a
        client-side, privacy-first architecture.
      </p>

      <TrustHighlight title="What I write about">
        <p>
          The{' '}
          <Link to="/blog" className="font-medium text-primary hover:underline">
            {SITE_NAME} blog
          </Link>{' '}
          covers practical image optimization: AVIF vs WebP, HEIC conversion, Core Web Vitals,
          browser-based compression workflows, and guides for people migrating from Squoosh. I write
          what I learn while building and using the tool.
        </p>
      </TrustHighlight>

      <h2>Connect</h2>
      <div className="not-prose my-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button variant="outline" size="sm" asChild className="justify-start gap-2 font-mono text-xs">
          <a href={SITE_SOCIAL.github} rel="noopener noreferrer" target="_blank">
            <GitHubIcon />
            GitHub
            <ExternalLink className="ml-auto size-3 opacity-50" aria-hidden="true" />
          </a>
        </Button>
        <Button variant="outline" size="sm" asChild className="justify-start gap-2 font-mono text-xs">
          <a href={SITE_SOCIAL.linkedin} rel="noopener noreferrer" target="_blank">
            <LinkedInIcon />
            LinkedIn
            <ExternalLink className="ml-auto size-3 opacity-50" aria-hidden="true" />
          </a>
        </Button>
        <Button variant="outline" size="sm" asChild className="justify-start gap-2 font-mono text-xs">
          <a href={`mailto:${SITE_CONTACT_EMAIL}`}>
            <Mail className="size-3.5" aria-hidden="true" />
            {SITE_CONTACT_EMAIL}
          </a>
        </Button>
      </div>

      <h2>Expertise</h2>
      <ul>
        <li>
          Software engineering — mostly frontend work, with an eye on performance and how apps feel
          in the browser
        </li>
        <li>
          Browser APIs, WebAssembly, and Web Workers for compute-heavy client-side applications
        </li>
        <li>
          Image codec pipelines, format tradeoffs, and compression workflows for web delivery
        </li>
        <li>Indie product development — shipping useful tools without a backend</li>
      </ul>

      {recentPosts.length > 0 ? (
        <>
          <h2>
            <BookOpen className="mb-1 inline size-5 text-primary" aria-hidden="true" /> Recent
            writing
          </h2>
          <ul>
            {recentPosts.map((post) => (
              <li key={post.slug}>
                <a href={post.path} className="font-medium">
                  {post.title}
                </a>
                <span className="text-muted-foreground"> — {post.readingTimeMinutes} min read</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <p>
        Learn more about the product on the <Link to="/about">About</Link> page. For data
        handling details, see the <Link to="/privacy">privacy policy</Link>.
      </p>
    </TrustPageShell>
  )
}
