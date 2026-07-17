import {
  formatLabel,
  type StudioInputIntent,
  type StudioOutputIntent,
} from '@/lib/studio-seo/formats'

export interface StudioFormatPair {
  from: StudioInputIntent
  to: StudioOutputIntent
  /** Short unique angle for titles / first paragraph — not just “X to Y”. */
  angle: string
}

/**
 * Curated, indexable from→to intents with real search demand.
 * Keep this list intentional: every pair must ship unique FAQ/copy.
 * Do not auto-expand to the full cartesian product.
 */
export const INDEXABLE_FORMAT_PAIRS: readonly StudioFormatPair[] = [
  { from: 'png', to: 'webp', angle: 'shrink transparent UI assets for the web' },
  { from: 'jpeg', to: 'webp', angle: 'cut photo weight without leaving JPG behind' },
  { from: 'png', to: 'avif', angle: 'max compression for screenshots and graphics' },
  { from: 'jpeg', to: 'avif', angle: 'hero-image savings beyond WebP' },
  { from: 'webp', to: 'avif', angle: 'upgrade existing WebP libraries to AVIF' },
  { from: 'heic', to: 'jpeg', angle: 'make iPhone photos work everywhere' },
  { from: 'heic', to: 'png', angle: 'lossless-friendly HEIC exports for editing' },
  { from: 'heic', to: 'webp', angle: 'share iPhone photos as modern web images' },
  { from: 'heic', to: 'avif', angle: 'smallest private HEIC conversions for the web' },
  { from: 'png', to: 'jpeg', angle: 'flatten graphics into smaller photo-style files' },
  { from: 'jpeg', to: 'png', angle: 'need a lossless intermediate from a photo' },
  { from: 'webp', to: 'jpeg', angle: 'compatibility when WebP is not accepted' },
  { from: 'avif', to: 'jpeg', angle: 'fallback-friendly exports from AVIF sources' },
  { from: 'avif', to: 'webp', angle: 'wider WebP reach from AVIF masters' },
  { from: 'gif', to: 'webp', angle: 'still-frame GIFs as modern stills' },
  { from: 'gif', to: 'png', angle: 'preserve crisp GIF frames without animation' },
  { from: 'bmp', to: 'png', angle: 'replace huge BMP dumps with portable PNGs' },
  { from: 'bmp', to: 'webp', angle: 'web-ready files from BMP exports' },
  { from: 'svg', to: 'png', angle: 'rasterize icons when SVG is not an option' },
  { from: 'svg', to: 'webp', angle: 'lightweight raster fallbacks from SVG' },
  { from: 'tiff', to: 'jpeg', angle: 'print/scan TIFFs into shareable JPGs' },
  { from: 'tiff', to: 'png', angle: 'archive TIFFs as portable PNGs' },
  { from: 'tiff', to: 'webp', angle: 'web delivery from TIFF masters' },
  { from: 'png', to: 'jxl', angle: 'next-gen lossless-friendly PNG successors' },
  { from: 'jpeg', to: 'jxl', angle: 'JPEG XL trials from photo libraries' },
  { from: 'webp', to: 'png', angle: 'decode WebP back to editable PNG' },
  { from: 'jpeg', to: 'qoi', angle: 'fast lossless QOI for tooling pipelines' },
  { from: 'png', to: 'qoi', angle: 'simple lossless QOI from PNG sources' },
] as const

/** Popular “any input → this output” pages (input unrestricted). */
export const INDEXABLE_OUTPUT_TARGETS: readonly StudioOutputIntent[] = [
  'webp',
  'avif',
  'jpeg',
  'png',
  'jxl',
  'qoi',
] as const

function pairKey(from: StudioInputIntent, to: StudioOutputIntent): string {
  return `${from}->${to}`
}

const PAIR_BY_KEY = new Map(
  INDEXABLE_FORMAT_PAIRS.map((pair) => [pairKey(pair.from, pair.to), pair]),
)

export function getIndexablePair(
  from: StudioInputIntent,
  to: StudioOutputIntent,
): StudioFormatPair | undefined {
  return PAIR_BY_KEY.get(pairKey(from, to))
}

export function isIndexablePair(
  from: StudioInputIntent,
  to: StudioOutputIntent,
): boolean {
  return PAIR_BY_KEY.has(pairKey(from, to))
}

export function isIndexableOutputTarget(to: StudioOutputIntent): boolean {
  return INDEXABLE_OUTPUT_TARGETS.includes(to)
}

const POPULAR_PAIR_KEYS = new Set([
  'png->webp',
  'jpeg->webp',
  'heic->jpeg',
  'png->avif',
  'jpeg->avif',
  'webp->avif',
])

export function relatedPairsFor(
  from: StudioInputIntent | undefined,
  to: StudioOutputIntent | undefined,
  limit = 6,
): StudioFormatPair[] {
  if (!from && !to) {
    return INDEXABLE_FORMAT_PAIRS.filter((pair) =>
      POPULAR_PAIR_KEYS.has(`${pair.from}->${pair.to}`),
    ).slice(0, limit)
  }

  const scored = INDEXABLE_FORMAT_PAIRS.map((pair) => {
    let score = 0
    if (from && pair.from === from) score += 2
    if (to && pair.to === to) score += 2
    if (from && pair.to === from) score += 1
    if (to && pair.from === to) score += 1
    if (from && to && pair.from === from && pair.to === to) score = -1
    return { pair, score }
  })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, limit).map((row) => row.pair)
}

export function pairLinkLabel(pair: StudioFormatPair): string {
  return `${formatLabel(pair.from)} to ${formatLabel(pair.to)}`
}
