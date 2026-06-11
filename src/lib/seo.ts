import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from '@/lib/site'

export interface SeoConfig {
  title: string
  description: string
  path: `/${string}` | '/'
  ogImage?: string
  ogType?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>
  llmDiscovery?: boolean
  rssAlternate?: string
}

type FaqLike = { question: string; answer: string }

export function buildSeoHead({
  title,
  description,
  path,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  publishedTime,
  modifiedTime,
  jsonLd,
  llmDiscovery = false,
  rssAlternate,
}: SeoConfig) {
  const url = path === '/' ? SITE_URL : `${SITE_URL}${path}`

  const head: {
    meta: Array<Record<string, string>>
    links: Array<Record<string, string>>
    scripts?: Array<{ type: string; children: string }>
  } = {
    meta: [
      { title },
      { name: 'description', content: description },
      { name: 'robots', content: 'index, follow' },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: url },
      { property: 'og:image', content: ogImage },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: title },
      { property: 'og:type', content: ogType },
      { property: 'og:site_name', content: SITE_NAME },
      { property: 'og:locale', content: 'en_US' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: ogImage },
      { name: 'twitter:image:alt', content: title },
    ],
    links: [
      { rel: 'canonical', href: url },
      ...(rssAlternate
        ? [
            {
              rel: 'alternate',
              type: 'application/rss+xml',
              title: `${SITE_NAME} Blog RSS`,
              href: rssAlternate,
            },
          ]
        : []),
      ...(llmDiscovery
        ? [
            {
              rel: 'alternate',
              type: 'text/markdown',
              title: 'LLM-readable summary',
              href: '/llms.txt',
            },
            {
              rel: 'alternate',
              type: 'text/markdown',
              title: 'LLM full product overview',
              href: '/llms-full.txt',
            },
          ]
        : []),
    ],
  }

  if (ogType === 'article') {
    if (publishedTime) {
      head.meta.push({ property: 'article:published_time', content: publishedTime })
    }
    if (modifiedTime) {
      head.meta.push({ property: 'article:modified_time', content: modifiedTime })
    }
  }

  if (jsonLd) {
    head.scripts = [
      {
        type: 'application/ld+json',
        children: JSON.stringify(jsonLd),
      },
    ]
  }

  return head
}

export function buildFaqJsonLd(faqItems: readonly FaqLike[], pageId?: string) {
  return {
    '@type': 'FAQPage',
    '@id': pageId ?? `${SITE_URL}/#faq`,
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}

export function buildLandingJsonLd(
  description: string,
  faqItems: readonly FaqLike[],
) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: SITE_URL,
        description,
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          url: SITE_URL,
          logo: DEFAULT_OG_IMAGE,
        },
      },
      {
        '@type': 'WebApplication',
        '@id': `${SITE_URL}/#app`,
        name: SITE_NAME,
        url: `${SITE_URL}/studio`,
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Any',
        browserRequirements:
          'Requires JavaScript and a modern browser with WebAssembly support.',
        description,
        isAccessibleForFree: true,
        keywords:
          'image compressor, image converter, client-side, browser, AVIF, WebP, HEIC, Squoosh alternative, free, privacy, batch compression',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        featureList: [
          'Client-side image compression',
          'Format conversion (JPEG, WebP, AVIF, PNG, JXL, QOI)',
          'Resize, crop, and transform',
          'Batch processing with ZIP export',
          'Size budget encoding',
          'Zero uploads — 100% private',
        ].join(', '),
      },
      buildFaqJsonLd(faqItems),
    ],
  }
}
