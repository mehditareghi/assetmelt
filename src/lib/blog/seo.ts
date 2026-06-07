import { buildFaqJsonLd, buildSeoHead } from '@/lib/seo'
import { SITE_AUTHOR, SITE_NAME, SITE_URL } from '@/lib/site'
import type { BlogPostMeta } from '@/lib/blog/types'

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
            'Guides on client-side image compression, format conversion, and browser privacy.',
          isPartOf: { '@id': `${SITE_URL}/#website` },
        },
        {
          '@type': 'Blog',
          '@id': `${SITE_URL}/blog#blog`,
          url: `${SITE_URL}/blog`,
          name: 'Asset Melt Blog',
          description:
            'Guides on client-side image compression, format conversion, and browser privacy.',
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

export function buildBlogPostHead(post: BlogPostMeta) {
  const pageUrl = `${SITE_URL}${post.path}`
  const ogImage = post.heroWebp
    ? `${SITE_URL}${post.heroWebp}`
    : undefined
  const modified = post.updatedAt ?? post.publishedAt

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
      },
      publisher: {
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
      },
      image: ogImage ? [ogImage] : undefined,
      keywords: post.keywords,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': pageUrl,
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
          name: post.title,
          item: pageUrl,
        },
      ],
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
