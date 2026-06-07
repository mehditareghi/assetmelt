/**
 * Generates theme-neutral hero PNGs for blog posts.
 * Soft warm gradients and brand amber/teal accents read well on light and dark pages
 * once wrapped in the site's bordered card frame. compile-blog.mjs converts PNG → AVIF/WebP.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const CONTENT_DIR = join(ROOT, 'content/blog/assets')
const WIDTH = 1200
const HEIGHT = 630

const BG_TOP = '#f7f5f0'
const BG_BOTTOM = '#ebe4d8'
const CARD = '#ffffff'
const CARD_STROKE = '#d6cfc2'
const TEXT = '#1c1917'
const MUTED = '#57534e'
const AMBER = '#d97706'
const AMBER_SOFT = '#fef3c7'
const TEAL = '#059669'
const TEAL_SOFT = '#d1fae5'
const INDIGO = '#4f46e5'
const INDIGO_SOFT = '#e0e7ff'

function heroSvg(body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${BG_TOP}"/>
      <stop offset="100%" stop-color="${BG_BOTTOM}"/>
    </linearGradient>
    <linearGradient id="amberGlow" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${AMBER}" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="${AMBER}" stop-opacity="0.04"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#1c1917" flood-opacity="0.08"/>
    </filter>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <circle cx="1050" cy="90" r="140" fill="url(#amberGlow)"/>
  <circle cx="120" cy="540" r="100" fill="${TEAL}" fill-opacity="0.06"/>
  ${body}
</svg>`
}

const HEROES = {
  'compress-images-in-browser': heroSvg(`
  <g filter="url(#shadow)">
    <rect x="80" y="72" width="1040" height="486" rx="28" fill="${CARD}" stroke="${CARD_STROKE}" stroke-width="2"/>
  </g>
  <circle cx="220" cy="210" r="64" fill="${AMBER_SOFT}" stroke="${AMBER}" stroke-width="3" stroke-opacity="0.45"/>
  <rect x="320" y="170" width="480" height="24" rx="12" fill="${AMBER}" fill-opacity="0.85"/>
  <rect x="320" y="214" width="380" height="16" rx="8" fill="${MUTED}" fill-opacity="0.22"/>
  <rect x="320" y="246" width="320" height="16" rx="8" fill="${MUTED}" fill-opacity="0.15"/>
  <rect x="160" y="340" width="880" height="140" rx="20" fill="${AMBER_SOFT}" stroke="${AMBER}" stroke-width="2" stroke-opacity="0.25"/>
  <text x="600" y="405" text-anchor="middle" fill="${TEXT}" font-family="system-ui,sans-serif" font-size="40" font-weight="800">Compress in the browser</text>
  <text x="600" y="448" text-anchor="middle" fill="${MUTED}" font-family="system-ui,sans-serif" font-size="21">Zero uploads · WASM codecs · Private by default</text>
  `),

  'heic-to-jpg-browser-guide': heroSvg(`
  <g filter="url(#shadow)">
    <rect x="80" y="72" width="1040" height="486" rx="28" fill="${CARD}" stroke="${CARD_STROKE}" stroke-width="2"/>
  </g>
  <rect x="180" y="160" width="300" height="300" rx="24" fill="${TEAL_SOFT}" stroke="${TEAL}" stroke-width="3" stroke-opacity="0.4"/>
  <text x="330" y="320" text-anchor="middle" fill="${TEAL}" font-family="system-ui,sans-serif" font-size="52" font-weight="800">HEIC</text>
  <path d="M510 310h180" stroke="${TEXT}" stroke-width="5" stroke-linecap="round" stroke-opacity="0.35"/>
  <polygon points="690,310 660,290 660,330" fill="${TEXT}" fill-opacity="0.35"/>
  <rect x="720" y="160" width="300" height="300" rx="24" fill="${AMBER_SOFT}" stroke="${AMBER}" stroke-width="3" stroke-opacity="0.4"/>
  <text x="870" y="320" text-anchor="middle" fill="${AMBER}" font-family="system-ui,sans-serif" font-size="52" font-weight="800">JPG</text>
  <text x="600" y="510" text-anchor="middle" fill="${MUTED}" font-family="system-ui,sans-serif" font-size="22">Convert iPhone photos locally — no cloud upload</text>
  `),

  'avif-vs-webp-2026': heroSvg(`
  <g filter="url(#shadow)">
    <rect x="80" y="72" width="1040" height="486" rx="28" fill="${CARD}" stroke="${CARD_STROKE}" stroke-width="2"/>
  </g>
  <rect x="120" y="120" width="460" height="320" rx="24" fill="${INDIGO_SOFT}" stroke="${INDIGO}" stroke-width="3" stroke-opacity="0.35"/>
  <text x="350" y="265" text-anchor="middle" fill="${INDIGO}" font-family="system-ui,sans-serif" font-size="64" font-weight="800">AVIF</text>
  <text x="350" y="315" text-anchor="middle" fill="${MUTED}" font-family="system-ui,sans-serif" font-size="20">Best compression</text>
  <rect x="620" y="120" width="460" height="320" rx="24" fill="${TEAL_SOFT}" stroke="${TEAL}" stroke-width="3" stroke-opacity="0.35"/>
  <text x="850" y="265" text-anchor="middle" fill="${TEAL}" font-family="system-ui,sans-serif" font-size="64" font-weight="800">WebP</text>
  <text x="850" y="315" text-anchor="middle" fill="${MUTED}" font-family="system-ui,sans-serif" font-size="20">Broad support</text>
  <text x="600" y="530" text-anchor="middle" fill="${TEXT}" font-family="system-ui,sans-serif" font-size="26" font-weight="700">Which format wins in 2026?</text>
  `),

  'squoosh-alternative-guide': heroSvg(`
  <g filter="url(#shadow)">
    <rect x="80" y="72" width="1040" height="486" rx="28" fill="${CARD}" stroke="${CARD_STROKE}" stroke-width="2"/>
  </g>
  <circle cx="600" cy="260" r="100" fill="${AMBER_SOFT}" stroke="${AMBER}" stroke-width="3" stroke-opacity="0.4"/>
  <path d="M545 260 L585 300 L655 220" stroke="${AMBER}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <text x="600" y="410" text-anchor="middle" fill="${TEXT}" font-family="system-ui,sans-serif" font-size="38" font-weight="800">Squoosh-grade codecs</text>
  <text x="600" y="455" text-anchor="middle" fill="${MUTED}" font-family="system-ui,sans-serif" font-size="21">Same WASM engines · batch workflow · 100% local</text>
  `),
}

async function main() {
  for (const [slug, svg] of Object.entries(HEROES)) {
    const outDir = join(CONTENT_DIR, slug)
    const outPath = join(outDir, 'hero.png')
    mkdirSync(outDir, { recursive: true })

    await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(outPath)
    console.log(`  ✓ ${slug}/hero.png`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
