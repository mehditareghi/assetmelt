import { buildSeoHead } from '@/lib/seo'
import { SITE_NAME, SITE_URL } from '@/lib/site'
import type { ToolPageContent } from '@/lib/tool-pages/types'

export function buildToolPageJsonLd(content: ToolPageContent) {
  const pageUrl = `${SITE_URL}${content.path}`

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: content.title,
        description: content.metaDescription,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: {
          '@type': 'WebApplication',
          name: SITE_NAME,
          url: `${SITE_URL}/studio`,
          applicationCategory: 'MultimediaApplication',
          operatingSystem: 'Any',
          isAccessibleForFree: true,
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
            name: content.breadcrumbLabel,
            item: pageUrl,
          },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: content.faq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      },
      {
        '@type': 'WebApplication',
        '@id': `${pageUrl}#app`,
        name: `${SITE_NAME} — ${content.breadcrumbLabel}`,
        url: `${SITE_URL}/studio`,
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Any',
        description: content.metaDescription,
        isAccessibleForFree: true,
        keywords: content.keywords,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
    ],
  }
}

export function buildToolPageHead(content: ToolPageContent) {
  return buildSeoHead({
    title: content.title,
    description: content.metaDescription,
    path: content.path,
    jsonLd: buildToolPageJsonLd(content),
  })
}
