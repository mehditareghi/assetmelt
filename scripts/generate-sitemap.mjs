import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { resolveLastmod } from './lib/git-lastmod.mjs'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const SITE_URL = 'https://assetmelt.com'
const GENERATED_META = join(ROOT, 'src/generated/blog-meta.json')
const TOOL_CONTENT = join(ROOT, 'src/lib/tool-pages/content.ts')
const SITEMAP_PATH = join(ROOT, 'public/sitemap.xml')
const RSS_PATH = join(ROOT, 'public/rss.xml')

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
  if (!existsSync(TOOL_CONTENT)) return []
  const source = readFileSync(TOOL_CONTENT, 'utf8')
  const paths = [...source.matchAll(/path:\s*'(\/[^']+)'/g)].map((match) => match[1])
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

  const blogLastmods = blogPosts.map((post) =>
    resolveLastmod(join(ROOT, post.sourceFile), post.updatedAt ?? post.publishedAt),
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
      lastmod: resolveLastmod(join(ROOT, 'src/routes/studio.tsx')),
      changefreq: 'weekly',
      priority: '0.9',
    },
    {
      loc: `${SITE_URL}/blog`,
      lastmod: maxDate(blogLastmods),
      changefreq: 'weekly',
      priority: '0.8',
    },
    ...toolPaths.map((path) => ({
      loc: `${SITE_URL}${path}`,
      lastmod: resolveLastmod(TOOL_CONTENT),
      changefreq: 'monthly',
      priority: '0.8',
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
