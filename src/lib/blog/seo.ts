import { buildFaqJsonLd, buildSeoHead } from '@/lib/seo'
import { SITE_AUTHOR, SITE_NAME, SITE_URL } from '@/lib/site'
import type { BlogCluster, BlogPostMeta } from '@/lib/blog/types'
import { BLOG_CLUSTER_BY_ID } from '@/lib/blog/clusters'

const RSS_URL = `${SITE_URL}/rss.xml`

export function buildBlogIndexHead() {
  return buildSeoHead({
    title: 'Blog — Image Compression & Format Guides | Asset Melt',
    description:
      'Practical guides on browser-based image compression, AVIF vs WebP, HEIC conversion, and privacy-first workflows — no uploads required.',
    path: '/blog',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': `${SITE_URL}/blog#webpage`,
          url: `${SITE_URL}/blog`,
          name: 'Asset Melt Blog',
          description:
            'Guides organized into image compression, format conversion, and performance SEO clusters.',
          isPartOf: { '@id': `${SITE_URL}/#website` },
        },
        {
          '@type': 'Blog',
          '@id': `${SITE_URL}/blog#blog`,
          url: `${SITE_URL}/blog`,
          name: 'Asset Melt Blog',
          description:
            'Guides organized into image compression, format conversion, and performance SEO clusters.',
          publisher: {
            '@type': 'Organization',
            name: SITE_NAME,
            url: SITE_URL,
          },
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: SITE_URL,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Blog',
              item: `${SITE_URL}/blog`,
            },
          ],
        },
      ],
    },
    rssAlternate: RSS_URL,
  })
}

export function buildBlogClusterHead(cluster: BlogCluster, posts: BlogPostMeta[]) {
  const pageUrl = `${SITE_URL}${cluster.path}`

  return buildSeoHead({
    title: `${cluster.title} Guides — Asset Melt Blog`,
    description: `${cluster.description} Browse practical Asset Melt guides, workflows, and tools for ${cluster.title.toLowerCase()}.`,
    path: cluster.path,
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'CollectionPage',
          '@id': `${pageUrl}#webpage`,
          url: pageUrl,
          name: `${cluster.title} Guides`,
          description: cluster.description,
          isPartOf: { '@id': `${SITE_URL}/blog#blog` },
          mainEntity: {
            '@type': 'ItemList',
            itemListElement: posts.map((post, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              url: `${SITE_URL}${post.path}`,
              name: post.title,
            })),
          },
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: SITE_URL,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Blog',
              item: `${SITE_URL}/blog`,
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: cluster.title,
              item: pageUrl,
            },
          ],
        },
      ],
    },
    rssAlternate: RSS_URL,
  })
}

export function buildBlogPostHead(post: BlogPostMeta) {
  const pageUrl = `${SITE_URL}${post.path}`
  const ogImage = post.heroJpeg
    ? `${SITE_URL}${post.heroJpeg}`
    : post.heroWebp
      ? `${SITE_URL}${post.heroWebp}`
      : undefined
  const modified = post.updatedAt ?? post.publishedAt
  const breadcrumbItems = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: SITE_URL,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Blog',
      item: `${SITE_URL}/blog`,
    },
    ...(post.cluster
      ? [
          {
            '@type': 'ListItem',
            position: 3,
            name: BLOG_CLUSTER_BY_ID[post.cluster].title,
            item: `${SITE_URL}${BLOG_CLUSTER_BY_ID[post.cluster].path}`,
          },
        ]
      : []),
    {
      '@type': 'ListItem',
      position: post.cluster ? 4 : 3,
      name: post.title,
      item: pageUrl,
    },
  ]

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'BlogPosting',
      '@id': `${pageUrl}#article`,
      headline: post.title,
      description: post.description,
      url: pageUrl,
      datePublished: post.publishedAt,
      dateModified: modified,
      author: {
        '@type': 'Person',
        name: SITE_AUTHOR,
        url: `${SITE_URL}/author`,
      },
      publisher: {
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
      },
      image: ogImage ? [ogImage] : undefined,
      keywords: post.keywords,
      articleSection: post.cluster ? BLOG_CLUSTER_BY_ID[post.cluster].title : undefined,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': pageUrl,
      },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbItems,
    },
  ]

  if (post.faq.length > 0) {
    graph.push(buildFaqJsonLd(post.faq, `${pageUrl}#faq`))
  }

  return buildSeoHead({
    title: `${post.title} | Asset Melt Blog`,
    description: post.description,
    path: post.path,
    ogType: 'article',
    ogImage,
    publishedTime: post.publishedAt,
    modifiedTime: modified,
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': graph,
    },
    rssAlternate: RSS_URL,
  })
}
