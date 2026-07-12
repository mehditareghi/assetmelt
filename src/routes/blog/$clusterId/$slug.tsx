import { createFileRoute, notFound, redirect } from '@tanstack/react-router'
import { BlogPostPage } from '@/components/blog/blog-post-page'
import { buildBlogPostHead } from '@/lib/blog/seo'
import { getBlogCluster, getBlogPost, getBlogPostContent } from '@/lib/blog'

export const Route = createFileRoute('/blog/$clusterId/$slug')({
  loader: ({ params }) => {
    const cluster = getBlogCluster(params.clusterId)
    const post = getBlogPost(params.slug)
    if (!cluster || !post || !getBlogPostContent(params.slug)) throw notFound()

    if (post.cluster !== cluster.id) {
      throw redirect({ href: post.path, replace: true })
    }

    return { post }
  },
  head: ({ loaderData }) => {
    if (!loaderData?.post) return {}
    return buildBlogPostHead(loaderData.post)
  },
  component: BlogPostRoute,
})

function BlogPostRoute() {
  const { post } = Route.useLoaderData()
  const Content = getBlogPostContent(post.slug)
  if (!Content) throw notFound()
  return <BlogPostPage post={post} Content={Content} />
}
