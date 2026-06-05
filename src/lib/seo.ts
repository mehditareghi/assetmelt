import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from '@/lib/site'

export interface SeoConfig {
  title: string
  description: string
  path: `/${string}` | '/'
  ogImage?: string
  ogType?: 'website' | 'article'
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>
}

export function buildSeoHead({
  title,
  description,
  path,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  jsonLd,
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
    links: [{ rel: 'canonical', href: url }],
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

export function buildLandingJsonLd(description: string) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: SITE_URL,
        description,
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
    ],
  }
}
