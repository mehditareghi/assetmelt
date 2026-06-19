/**
 * Validates curated blog hero sources in content/blog/assets/{slug}/hero.png.
 *
 * Curated PNGs are NEVER overwritten here — prebuild only checks presence.
 * compile-blog.mjs converts each hero.png → AVIF + WebP + JPEG fallback.
 *
 * Add a new post: place hero.png in content/blog/assets/{slug}/, then run prebuild.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const CONTENT_DIR = join(ROOT, 'content/blog')
const ASSETS_DIR = join(CONTENT_DIR, 'assets')

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function heroSourcePath(slug, heroImageBase = 'hero') {
  const assetDir = join(ASSETS_DIR, slug)
  for (const ext of ['png', 'jpg', 'jpeg', 'webp']) {
    const candidate = join(assetDir, `${heroImageBase}.${ext}`)
    if (existsSync(candidate)) return candidate
  }
  return null
}

function main() {
  const mdxFiles = readdirSync(CONTENT_DIR)
    .filter((file) => file.endsWith('.mdx'))
    .sort()

  let missing = 0

  for (const fileName of mdxFiles) {
    const raw = readFileSync(join(CONTENT_DIR, fileName), 'utf8')
    const { data } = matter(raw)
    const slug = slugify(data.slug ?? basename(fileName, '.mdx'))
    const heroImageBase = String(data.heroImage ?? 'hero').trim()
    const sourcePath = heroSourcePath(slug, heroImageBase)

    if (sourcePath) {
      console.log(`  ✓ ${slug}/${basename(sourcePath)} (curated)`)
    } else {
      console.warn(
        `  ⚠ Missing hero for ${slug} — add content/blog/assets/${slug}/${heroImageBase}.png`,
      )
      missing += 1
    }
  }

  if (missing > 0) {
    process.exit(1)
  }
}

main()
