import type { BlogCluster, BlogClusterId, BlogPostMeta } from '@/lib/blog/types'

export const BLOG_CLUSTERS: BlogCluster[] = [
  {
    id: 'image-compression',
    title: 'Image Compression',
    description:
      'Quality, byte budgets, CMS workflows, and practical settings for smaller web images.',
    path: '/blog/image-compression',
    pillarSlug: 'how-to-compress-images-without-losing-quality',
  },
  {
    id: 'format-conversion',
    title: 'Format Conversion',
    description:
      'HEIC, JPG, WebP, AVIF, and format choices for compatibility, privacy, and speed.',
    path: '/blog/format-conversion',
    pillarSlug: 'best-format-for-website-images',
  },
  {
    id: 'performance-seo',
    title: 'Performance & SEO',
    description:
      'Core Web Vitals, LCP, responsive images, sitemaps, and social preview assets.',
    path: '/blog/performance-seo',
    pillarSlug: 'image-seo-guide-2026',
  },
]

export const BLOG_CLUSTER_BY_ID: Record<BlogClusterId, BlogCluster> = Object.fromEntries(
  BLOG_CLUSTERS.map((cluster) => [cluster.id, cluster]),
) as Record<BlogClusterId, BlogCluster>

export function groupPostsByCluster(posts: BlogPostMeta[]) {
  return BLOG_CLUSTERS.map((cluster) => ({
    ...cluster,
    posts: sortClusterPosts(posts.filter((post) => post.cluster === cluster.id), cluster.pillarSlug),
  })).filter((cluster) => cluster.posts.length > 0)
}

export function getBlogCluster(id: string): BlogCluster | undefined {
  return BLOG_CLUSTERS.find((cluster) => cluster.id === id)
}

export function getBlogClusterPosts(posts: BlogPostMeta[], id: BlogClusterId) {
  const cluster = BLOG_CLUSTER_BY_ID[id]
  return sortClusterPosts(
    posts.filter((post) => post.cluster === id),
    cluster.pillarSlug,
  )
}

function sortClusterPosts(posts: BlogPostMeta[], pillarSlug: string) {
  return [...posts].sort((a, b) => {
    if (a.slug === pillarSlug) return -1
    if (b.slug === pillarSlug) return 1
    return Date.parse(b.publishedAt) - Date.parse(a.publishedAt)
  })
}

export function isPillarPost(post: BlogPostMeta): boolean {
  if (!post.cluster) return false
  return BLOG_CLUSTER_BY_ID[post.cluster].pillarSlug === post.slug
}

export function getClusterPillarPost(
  posts: BlogPostMeta[],
  clusterId: BlogClusterId,
): BlogPostMeta | undefined {
  const pillarSlug = BLOG_CLUSTER_BY_ID[clusterId].pillarSlug
  return posts.find((post) => post.slug === pillarSlug)
}

export function getClusterSiblingPosts(
  post: BlogPostMeta,
  posts: BlogPostMeta[],
  limit = 4,
): BlogPostMeta[] {
  if (!post.cluster) return []
  const cluster = BLOG_CLUSTER_BY_ID[post.cluster]
  return sortClusterPosts(
    posts.filter((candidate) => candidate.cluster === post.cluster && candidate.slug !== post.slug),
    cluster.pillarSlug,
  ).slice(0, limit)
}
