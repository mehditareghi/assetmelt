import {
  INPUT_URL_SLUG,
  OUTPUT_URL_SLUG,
  parseInputIntent,
  parseOutputIntent,
  type StudioInputIntent,
  type StudioOutputIntent,
} from '@/lib/studio-seo/formats'
import {
  INDEXABLE_FORMAT_PAIRS,
  INDEXABLE_OUTPUT_TARGETS,
  getIndexablePair,
  isIndexableOutputTarget,
} from '@/lib/studio-seo/pairs'

type FormatSearch = { from?: string; to?: string }

/** Path segment for a pair: `png-to-webp`. */
export function pairConversionSlug(from: StudioInputIntent, to: StudioOutputIntent): string {
  return `${INPUT_URL_SLUG[from]}-to-${OUTPUT_URL_SLUG[to]}`
}

/** Path segment for output-only: `to-webp`. */
export function targetConversionSlug(to: StudioOutputIntent): string {
  return `to-${OUTPUT_URL_SLUG[to]}`
}

export function buildConversionSlug(search: FormatSearch): string | null {
  const from = parseInputIntent(search.from)
  const to = parseOutputIntent(search.to)

  if (from && to) {
    const pair = getIndexablePair(from, to)
    if (pair) return pairConversionSlug(pair.from, pair.to)
    if (isIndexableOutputTarget(to)) return targetConversionSlug(to)
    return null
  }

  if (to && isIndexableOutputTarget(to)) {
    return targetConversionSlug(to)
  }

  return null
}

export function parseConversionSlug(slug: string): FormatSearch | null {
  const trimmed = slug.trim().toLowerCase()

  const targetMatch = /^to-([a-z0-9]+)$/.exec(trimmed)
  if (targetMatch) {
    const to = parseOutputIntent(targetMatch[1])
    if (!to || !isIndexableOutputTarget(to)) return null
    return { to: OUTPUT_URL_SLUG[to] }
  }

  const pairMatch = /^([a-z0-9]+)-to-([a-z0-9]+)$/.exec(trimmed)
  if (pairMatch) {
    const from = parseInputIntent(pairMatch[1])
    const to = parseOutputIntent(pairMatch[2])
    if (!from || !to) return null
    if (!getIndexablePair(from, to)) return null
    return {
      from: INPUT_URL_SLUG[from],
      to: OUTPUT_URL_SLUG[to],
    }
  }

  return null
}

export function listIndexableConversionSlugs(): string[] {
  return [
    ...INDEXABLE_FORMAT_PAIRS.map((pair) =>
      pairConversionSlug(pair.from, pair.to),
    ),
    ...INDEXABLE_OUTPUT_TARGETS.map((to) => targetConversionSlug(to)),
  ]
}

/**
 * Best URL for a live output-format change while keeping optional `from` intent.
 * Uses replace-friendly path segments only (indexable), else bare /studio.
 */
export function studioPathForOutputChange(
  current: FormatSearch,
  nextTo: StudioOutputIntent,
): string {
  const from = parseInputIntent(current.from)
  if (from) {
    const pair = getIndexablePair(from, nextTo)
    if (pair) {
      return `/studio/${pairConversionSlug(pair.from, pair.to)}`
    }
  }
  if (isIndexableOutputTarget(nextTo)) {
    return `/studio/${targetConversionSlug(nextTo)}`
  }
  return '/studio'
}
