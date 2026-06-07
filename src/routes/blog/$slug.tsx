import { createFileRoute, notFound } from '@tanstack/react-router'
import { BlogPostPage } from '@/components/blog/blog-post-page'
import { buildBlogPostHead } from '@/lib/blog/seo'
import { getBlogPost, getCachedBlogPostContent, loadBlogPostContent } from '@/lib/blog'

export const Route = createFileRoute('/blog/$slug')({
  loader: async ({ params }) => {
    const post = getBlogPost(params.slug)
    if (!post) throw notFound()

    const Content = await loadBlogPostContent(params.slug)
    if (!Content) throw notFound()

    return { post, contentSlug: params.slug }
  },
  head: ({ loaderData }) => {
    if (!loaderData?.post) return {}
    return buildBlogPostHead(loaderData.post)
  },
  component: BlogPostRoute,
})

function BlogPostRoute() {
  const { post, contentSlug } = Route.useLoaderData()
  const Content = getCachedBlogPostContent(contentSlug)
  if (!Content) throw notFound()
  return <BlogPostPage post={post} Content={Content} />
}
