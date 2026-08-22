/**
 * User-facing limitation copy keyed by product-map catalog ID.
 *
 * When that ID ships: delete the key, grep the id (and the distinctive
 * phrase), and drop every remaining mention in the same change.
 * Catalog IDs stay in this file only — not in visitor-facing strings.
 */
export const OPEN_LIMITATIONS = {
  '4.3': {
    label: 'HEIC JPEG bounce',
    copy:
      'HEIC / HEIF is decoded through JPEG at quality 0.92 before the rest of the pipeline, so HEIC→PNG or HEIC→AVIF is not lossless from the original.',
  },
  '4.4': {
    label: 'GIF first frame only',
    copy: 'GIF uses the first frame only — animation is not encoded.',
  },
} as const

export type OpenLimitationId = keyof typeof OPEN_LIMITATIONS

/**
 * 4.2 shipped TIFF as first-page decode. No follow-up catalog ID yet.
 * Drop this string when multi-page TIFF exists.
 */
export const TIFF_FIRST_PAGE_COPY = 'TIFF uses the first page only.'

export function sizeBudgetInputLimitsCopy(): string {
  return `${OPEN_LIMITATIONS['4.4'].copy} ${TIFF_FIRST_PAGE_COPY} ${OPEN_LIMITATIONS['4.3'].copy}`
}

/** QOI has no size-budget path — visitor copy only (no catalog row). */
export const SIZE_BUDGET_SKIPS_QOI_COPY =
  'Size-budget encoding skips QOI — use quality and resize instead.'
