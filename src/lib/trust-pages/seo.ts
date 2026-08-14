import { buildSeoHead } from '@/lib/seo'
import { SITE_AUTHOR, SITE_NAME, SITE_URL } from '@/lib/site'
import type { TrustPagePath } from '@/lib/site'

const TRUST_PAGE_META: Record<
  TrustPagePath,
  { title: string; description: string; lastmodFile: string }
> = {
  '/privacy': {
    title: 'Privacy Policy | Asset Melt',
    description:
      'How Asset Melt handles your data: image processing is 100% client-side, I cannot see your photos, and session replay does not record image pixels. Analytics and Sentry are disclosed here — no accounts or image uploads.',
    lastmodFile: 'src/routes/privacy.tsx',
  },
  '/about': {
    title: 'About Asset Melt — Privacy-First Image Compression',
    description:
      'Why Asset Melt exists: a free, client-side image studio built for people who need professional compression without uploading files to the cloud.',
    lastmodFile: 'src/routes/about.tsx',
  },
  '/author': {
    title: `${SITE_AUTHOR} — Creator of Asset Melt`,
    description:
      'Mehdi Tareghi is a software engineer who built Asset Melt — a browser-based image compressor that keeps every file on your device.',
    lastmodFile: 'src/routes/author.tsx',
  },
}

function buildTrustPageJsonLd(path: TrustPagePath, name: string, description: string) {
  const pageUrl = `${SITE_URL}${path}`

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name,
        description,
        isPartOf: { '@id': `${SITE_URL}/#website` },
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
            name: path === '/author' ? SITE_AUTHOR : name.split(' | ')[0] ?? name,
            item: pageUrl,
          },
        ],
      },
    ],
  }
}

export function buildAuthorPageJsonLd(description: string) {
  const pageUrl = `${SITE_URL}/author`

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: `${SITE_AUTHOR} — Creator of ${SITE_NAME}`,
        description,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        mainEntity: {
          '@type': 'Person',
          '@id': `${pageUrl}#person`,
          name: SITE_AUTHOR,
          url: pageUrl,
          jobTitle: 'Software Engineer',
          worksFor: {
            '@type': 'Organization',
            name: SITE_NAME,
            url: SITE_URL,
          },
          sameAs: ['https://github.com/mehditareghi', 'https://linkedin.com/in/mehditareghi'],
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
            name: SITE_AUTHOR,
            item: pageUrl,
          },
        ],
      },
    ],
  }
}

export function buildTrustPageHead(path: TrustPagePath) {
  const meta = TRUST_PAGE_META[path]
  const jsonLd =
    path === '/author'
      ? buildAuthorPageJsonLd(meta.description)
      : buildTrustPageJsonLd(path, meta.title, meta.description)

  return buildSeoHead({
    title: meta.title,
    description: meta.description,
    path,
    jsonLd,
  })
}

export { TRUST_PAGE_META }
