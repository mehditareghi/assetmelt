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
  studioIntentSearch,
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
  type StudioSeoBeforeAfter,
  type StudioSeoContent,
  type StudioSeoSection,
  type StudioSeoStep,
  type StudioSeoTable,
} from '@/lib/studio-seo/content'

export {
  countPhrase,
  flattenStudioSeoText,
  pairKeyword,
  pairPhrase,
  targetKeyword,
} from '@/lib/studio-seo/copy'
