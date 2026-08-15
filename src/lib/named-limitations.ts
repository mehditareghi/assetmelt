/**
 * User-facing limitation copy keyed by product-map catalog ID.
 *
 * When that ID ships: delete the key, grep the id (and the distinctive
 * phrase), and drop every remaining mention in the same change.
 * Catalog IDs stay in this file only — not in visitor-facing strings.
 */
export const OPEN_LIMITATIONS = {
  '5.5': {
    label: 'Size budget skips PNG and QOI',
    copy:
      'Size-budget encoding runs on JPEG, WebP, AVIF, and JPEG XL only. PNG and QOI are skipped — PNG stays lossless Oxipng unless Reduce palette is on, which is not a byte-cap search. These pages switch a saved PNG pipeline to WebP so the budget can run.',
    faqQuestion: 'Does size budget work with PNG?',
    faqAnswer:
      'Not yet. Size-budget encoding runs on JPEG, WebP, AVIF, and JPEG XL. PNG stays lossless Oxipng unless you turn on Reduce palette, which is not a byte-cap search. This page switches PNG output to WebP so the budget can run.',
  },
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
