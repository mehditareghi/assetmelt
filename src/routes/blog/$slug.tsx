import { createFileRoute, notFound, redirect } from '@tanstack/react-router'
import { BlogClusterPage } from '@/components/blog/blog-cluster-page'
import { buildBlogClusterHead } from '@/lib/blog/seo'
import { BLOG_POSTS, getBlogCluster, getBlogClusterPosts, getBlogPost } from '@/lib/blog'

export const Route = createFileRoute('/blog/$slug')({
  loader: ({ params }) => {
    const cluster = getBlogCluster(params.slug)
    if (cluster) {
      const posts = getBlogClusterPosts(BLOG_POSTS, cluster.id)
      return { cluster, posts }
    }

    const post = getBlogPost(params.slug)
    if (!post) throw notFound()
    throw redirect({ href: post.path, replace: true })
  },
  head: ({ loaderData }) => {
    if (!loaderData?.cluster) return {}
    return buildBlogClusterHead(loaderData.cluster, loaderData.posts)
  },
  component: BlogClusterRoute,
})

function BlogClusterRoute() {
  const { cluster, posts } = Route.useLoaderData()
  return <BlogClusterPage cluster={cluster} posts={posts} />
}
