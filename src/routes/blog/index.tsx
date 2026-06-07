import { createFileRoute } from '@tanstack/react-router'
import { BlogIndexPage } from '@/components/blog/blog-index-page'
import { buildBlogIndexHead } from '@/lib/blog/seo'

export const Route = createFileRoute('/blog/')({
  head: () => buildBlogIndexHead(),
  component: BlogIndexPage,
})
