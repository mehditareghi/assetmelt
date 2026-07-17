export {
  FORMAT_LABEL,
  FORMAT_LABEL_LONG,
  INPUT_URL_SLUG,
  OUTPUT_URL_SLUG,
  formatLabel,
  formatLabelLong,
  parseInputIntent,
  parseOutputIntent,
  type StudioFormatSlug,
  type StudioInputIntent,
  type StudioOutputIntent,
} from '@/lib/studio-seo/formats'

export {
  INDEXABLE_FORMAT_PAIRS,
  INDEXABLE_OUTPUT_TARGETS,
  getIndexablePair,
  isIndexableOutputTarget,
  isIndexablePair,
  pairLinkLabel,
  relatedPairsFor,
  type StudioFormatPair,
} from '@/lib/studio-seo/pairs'

export {
  buildConversionSlug,
  listIndexableConversionSlugs,
  pairConversionSlug,
  parseConversionSlug,
  studioPathForOutputChange,
  targetConversionSlug,
} from '@/lib/studio-seo/paths'

export {
  buildStudioPath,
  canonicalStudioPath,
  isStudioSearchIndexable,
  listIndexableStudioPaths,
  listIndexableStudioSearches,
  parseStudioSearch,
  resolveStudioSeoMode,
  studioLinkOptions,
  studioSearchFromPair,
  studioSearchIntents,
  toStudioSearchParams,
  type StudioSearch,
  type StudioSeoMode,
} from '@/lib/studio-seo/search'

export {
  buildStudioJsonLd,
  buildStudioSeoContent,
  type StudioFaqItem,
  type StudioSeoContent,
} from '@/lib/studio-seo/content'
