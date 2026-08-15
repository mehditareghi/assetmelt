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
  type StudioFormatPair,
} from '@/lib/studio-seo/pairs'
import {
  buildConversionSlug,
  pairConversionSlug,
  targetConversionSlug,
} from '@/lib/studio-seo/paths'
import { parseRecipeParam, studioRecipeSearch } from '@/lib/studio-recipe'
import { parseBudgetParam, studioBudgetSearch } from '@/lib/studio-budget'

/**
 * Format intent used across Studio SEO (URL slugs like `jpg`, not `jpeg`).
 * `recipe` is a shareable pipeline token — never indexed, never contains images.
 * `budget` is a one-shot size-budget landing intent (`50kb` / `100kb` / `200kb`).
 */
export interface StudioSearch {
  from?: string
  to?: string
  recipe?: string
  budget?: string
}

export function parseStudioSearch(raw: Record<string, unknown>): StudioSearch {
  const fromIntent = parseInputIntent(raw.from)
  const toIntent = parseOutputIntent(raw.to)
  const search: StudioSearch = {}
  if (fromIntent) search.from = INPUT_URL_SLUG[fromIntent]
  if (toIntent) search.to = OUTPUT_URL_SLUG[toIntent]
  const recipe = parseRecipeParam(raw.recipe)
  if (recipe) search.recipe = recipe
  const budget = parseBudgetParam(raw.budget)
  if (budget) search.budget = `${budget}kb`
  return search
}

export function studioSearchIntents(search: StudioSearch): {
  from?: StudioInputIntent
  to?: StudioOutputIntent
} {
  return {
    from: parseInputIntent(search.from),
    to: parseOutputIntent(search.to),
  }
}

/** Normalize loose from/to/budget into URL-facing slugs. */
export function toStudioSearchParams(search: {
  from?: string
  to?: string
  budget?: string
}): StudioSearch {
  return parseStudioSearch({
    from: search.from,
    to: search.to,
    budget: search.budget,
  })
}

export function studioIntentSearch(search: StudioSearch = {}): {
  recipe?: string
  budget?: string
} {
  return {
    ...studioRecipeSearch(search.recipe),
    ...studioBudgetSearch(search.budget),
  }
}

/**
 * Canonical Studio URL path (no query string).
 * Indexable intents → `/studio/png-to-webp` or `/studio/to-webp`.
 */
export function buildStudioPath(search: StudioSearch = {}): string {
  const params = parseStudioSearch({
    from: search.from,
    to: search.to,
  })
  const slug = buildConversionSlug(params)
  return slug ? `/studio/${slug}` : '/studio'
}

export function studioSearchFromPair(pair: StudioFormatPair): StudioSearch {
  return {
    from: INPUT_URL_SLUG[pair.from],
    to: OUTPUT_URL_SLUG[pair.to],
  }
}

export type StudioSeoMode =
  | { kind: 'default' }
  | { kind: 'pair'; from: StudioInputIntent; to: StudioOutputIntent; pair: StudioFormatPair }
  | { kind: 'target'; to: StudioOutputIntent }
  | { kind: 'settings-only'; from?: StudioInputIntent; to?: StudioOutputIntent }

/**
 * Indexable modes get self-canonical path URLs + sitemap + prerender entries.
 * settings-only applies pipeline prefs but canonicalizes to bare /studio.
 */
export function resolveStudioSeoMode(search: StudioSearch): StudioSeoMode {
  const { from, to } = studioSearchIntents(search)

  if (from && to) {
    const pair = getIndexablePair(from, to)
    if (pair) return { kind: 'pair', from, to, pair }
    return { kind: 'settings-only', from, to }
  }

  if (to && isIndexableOutputTarget(to)) {
    return { kind: 'target', to }
  }

  if (from || to) {
    return { kind: 'settings-only', from, to }
  }

  return { kind: 'default' }
}

export function isStudioSearchIndexable(search: StudioSearch): boolean {
  if (search.recipe || search.budget) return false
  const mode = resolveStudioSeoMode(search)
  return mode.kind === 'pair' || mode.kind === 'target'
}

export function canonicalStudioPath(search: StudioSearch): string {
  const mode = resolveStudioSeoMode(search)
  if (mode.kind === 'pair') {
    return `/studio/${pairConversionSlug(mode.from, mode.to)}`
  }
  if (mode.kind === 'target') {
    return `/studio/${targetConversionSlug(mode.to)}`
  }
  return '/studio'
}

/** Every search state that should appear in the XML sitemap / prerender list. */
export function listIndexableStudioSearches(): StudioSearch[] {
  return [
    ...INDEXABLE_FORMAT_PAIRS.map((pair) => studioSearchFromPair(pair)),
    ...INDEXABLE_OUTPUT_TARGETS.map((to) => ({ to: OUTPUT_URL_SLUG[to] })),
  ]
}

export function listIndexableStudioPaths(): string[] {
  return listIndexableStudioSearches().map((search) => buildStudioPath(search))
}

/** TanStack Link target for a Studio SEO intent. */
export function studioLinkOptions(search: StudioSearch = {}):
  | { to: '/studio'; search: { recipe?: string; budget?: string } }
  | {
      to: '/studio/$conversion'
      params: { conversion: string }
      search: { recipe?: string; budget?: string }
    } {
  const params = toStudioSearchParams(search)
  const slug = buildConversionSlug(params)
  const query = studioIntentSearch(params)
  if (!slug) return { to: '/studio', search: query }
  return {
    to: '/studio/$conversion',
    params: { conversion: slug },
    search: query,
  }
}
