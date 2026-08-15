import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { resolveLastmod } from './lib/git-lastmod.mjs'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const SITE_URL = 'https://assetmelt.com'
const GENERATED_META = join(ROOT, 'src/generated/blog-meta.json')
const TOOL_CONTENT_DIR = join(ROOT, 'src/lib/tool-pages')
const SITE_MODULE = join(ROOT, 'src/lib/site.ts')
const STUDIO_PAIRS = join(ROOT, 'src/lib/studio-seo/pairs.ts')
const STUDIO_FORMATS = join(ROOT, 'src/lib/studio-seo/formats.ts')
const SITEMAP_PATH = join(ROOT, 'public/sitemap.xml')
const RSS_PATH = join(ROOT, 'public/rss.xml')
const BLOG_CLUSTERS = [
  { id: 'image-compression', path: '/blog/image-compression' },
  { id: 'format-conversion', path: '/blog/format-conversion' },
  { id: 'performance-seo', path: '/blog/performance-seo' },
]

const INPUT_URL_SLUG = {
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
  avif: 'avif',
  gif: 'gif',
  bmp: 'bmp',
  svg: 'svg',
  heic: 'heic',
  jxl: 'jxl',
  qoi: 'qoi',
  tiff: 'tiff',
}

const OUTPUT_URL_SLUG = {
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
  avif: 'avif',
  jxl: 'jxl',
  qoi: 'qoi',
}

function buildStudioSeoPath({ from, to }) {
  if (from && to) {
    const fromSlug = INPUT_URL_SLUG[from] ?? from
    const toSlug = OUTPUT_URL_SLUG[to] ?? to
    // Prefer jpg in public URLs (jpeg → jpg via map)
    return `/studio/${fromSlug}-to-${toSlug}`
  }
  if (to) {
    const toSlug = OUTPUT_URL_SLUG[to] ?? to
    return `/studio/to-${toSlug}`
  }
  return '/studio'
}

function readStudioSeoPaths() {
  if (!existsSync(STUDIO_PAIRS)) return []

  const source = readFileSync(STUDIO_PAIRS, 'utf8')
  const pairPaths = [
    ...source.matchAll(/\{\s*from:\s*'([a-z]+)',\s*to:\s*'([a-z]+)'/g),
  ].map((match) => buildStudioSeoPath({ from: match[1], to: match[2] }))

  const targetsBlock = source.match(
    /INDEXABLE_OUTPUT_TARGETS[^=]*=\s*\[([\s\S]*?)\]\s*as const/,
  )
  const targetPaths = targetsBlock
    ? [...targetsBlock[1].matchAll(/'([a-z]+)'/g)].map((match) =>
        buildStudioSeoPath({ to: match[1] }),
      )
    : []

  return [...new Set([...pairPaths, ...targetPaths])]
}

function readBlogMeta() {
  if (!existsSync(GENERATED_META)) return []
  try {
    const parsed = JSON.parse(readFileSync(GENERATED_META, 'utf8'))
    return Array.isArray(parsed.posts) ? parsed.posts : []
  } catch {
    return []
  }
}

function readToolPagePaths() {
  const typesFile = join(TOOL_CONTENT_DIR, 'types.ts')
  if (!existsSync(typesFile)) return []
  const source = readFileSync(typesFile, 'utf8')
  const block = source.match(/export type ToolPagePath =([\s\S]*?)export type ToolPageIcon/)
  if (!block) return []
  return [...new Set([...block[1].matchAll(/'(\/[^']+)'/g)].map((match) => match[1]))]
}

function toolPagesLastmod() {
  return maxDate([
    resolveLastmod(join(TOOL_CONTENT_DIR, 'content.ts')),
    resolveLastmod(join(TOOL_CONTENT_DIR, 'size-budget-pages.ts')),
    resolveLastmod(join(TOOL_CONTENT_DIR, 'types.ts')),
  ])
}

function readTrustPagePaths() {
  if (!existsSync(SITE_MODULE)) return []
  const source = readFileSync(SITE_MODULE, 'utf8')
  const paths = [...source.matchAll(/'(\/(?:privacy|about|author))'/g)].map((match) => match[1])
  return [...new Set(paths)]
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatUrlEntry({ loc, lastmod, changefreq, priority }) {
  const lines = [`  <url>`, `    <loc>${xmlEscape(loc)}</loc>`]
  if (lastmod) lines.push(`    <lastmod>${lastmod}</lastmod>`)
  if (changefreq) lines.push(`    <changefreq>${changefreq}</changefreq>`)
  if (priority) lines.push(`    <priority>${priority}</priority>`)
  lines.push(`  </url>`)
  return lines.join('\n')
}

function maxDate(dates) {
  const valid = dates.filter(Boolean).sort()
  return valid.at(-1) ?? null
}

function generateSitemap() {
  const blogPosts = readBlogMeta()
  const toolPaths = readToolPagePaths()
  const trustPaths = readTrustPagePaths()
  const studioSeoPaths = readStudioSeoPaths()
  const studioLastmod = maxDate([
    resolveLastmod(join(ROOT, 'src/routes/studio/index.tsx')),
    resolveLastmod(join(ROOT, 'src/routes/studio/$conversion.tsx')),
    resolveLastmod(STUDIO_PAIRS),
    resolveLastmod(join(ROOT, 'src/lib/studio-seo/content.ts')),
    resolveLastmod(join(ROOT, 'src/lib/studio-seo/paths.ts')),
    resolveLastmod(STUDIO_FORMATS),
  ])

  const blogLastmods = blogPosts.map((post) =>
    resolveLastmod(join(ROOT, post.sourceFile), post.updatedAt ?? post.publishedAt),
  )
  const clusterLastmods = new Map(
    BLOG_CLUSTERS.map((cluster) => {
      const dates = blogPosts
        .filter((post) => post.cluster === cluster.id)
        .map((post) => resolveLastmod(join(ROOT, post.sourceFile), post.updatedAt ?? post.publishedAt))
      return [cluster.id, maxDate(dates)]
    }),
  )

  const entries = [
    {
      loc: `${SITE_URL}/`,
      lastmod: resolveLastmod(join(ROOT, 'src/routes/index.tsx')),
      changefreq: 'weekly',
      priority: '1.0',
    },
    {
      loc: `${SITE_URL}/studio`,
      lastmod: studioLastmod,
      changefreq: 'weekly',
      priority: '0.9',
    },
    ...studioSeoPaths.map((path) => ({
      loc: `${SITE_URL}${path}`,
      lastmod: studioLastmod,
      changefreq: 'monthly',
      priority: '0.85',
    })),
    {
      loc: `${SITE_URL}/blog`,
      lastmod: maxDate(blogLastmods),
      changefreq: 'weekly',
      priority: '0.8',
    },
    ...BLOG_CLUSTERS.map((cluster) => ({
      loc: `${SITE_URL}${cluster.path}`,
      lastmod: clusterLastmods.get(cluster.id),
      changefreq: 'weekly',
      priority: '0.75',
    })),
    ...toolPaths.map((path) => ({
      loc: `${SITE_URL}${path}`,
      lastmod: toolPagesLastmod(),
      changefreq: 'monthly',
      priority: '0.8',
    })),
    ...trustPaths.map((path) => ({
      loc: `${SITE_URL}${path}`,
      lastmod: resolveLastmod(join(ROOT, `src/routes${path}.tsx`)),
      changefreq: 'yearly',
      priority: '0.5',
    })),
    ...blogPosts.map((post) => ({
      loc: `${SITE_URL}${post.path}`,
      lastmod: resolveLastmod(join(ROOT, post.sourceFile), post.updatedAt ?? post.publishedAt),
      changefreq: 'monthly',
      priority: '0.7',
    })),
  ]

  const body = entries.map(formatUrlEntry).join('\n')
  writeFileSync(
    SITEMAP_PATH,
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`,
  )

  console.log(`Sitemap: ${entries.length} URLs → public/sitemap.xml`)
}

function rfc822Date(isoDate) {
  return new Date(isoDate).toUTCString()
}

function generateRss() {
  const blogPosts = readBlogMeta()
  const items = blogPosts.slice(0, 20).map((post) => {
    const pubDate = rfc822Date(post.publishedAt)
    const link = `${SITE_URL}${post.path}`
    return `    <item>
      <title>${xmlEscape(post.title)}</title>
      <link>${xmlEscape(link)}</link>
      <guid isPermaLink="true">${xmlEscape(link)}</guid>
      <description>${xmlEscape(post.description)}</description>
      <pubDate>${pubDate}</pubDate>
    </item>`
  })

  writeFileSync(
    RSS_PATH,
    `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Asset Melt Blog</title>
    <link>${SITE_URL}/blog</link>
    <description>Guides on client-side image compression, format conversion, and browser-based privacy-first workflows.</description>
    <language>en-us</language>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
${items.join('\n')}
  </channel>
</rss>
`,
  )

  console.log(`RSS: ${Math.min(blogPosts.length, 20)} items → public/rss.xml`)
}

generateSitemap()
generateRss()
