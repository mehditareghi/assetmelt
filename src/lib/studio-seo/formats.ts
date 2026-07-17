import type { OutputFormat } from '@/lib/schemas/pipeline-schema'
import type { InputFormat } from '@/lib/image/format-detection'

/** SEO / URL slugs for formats users search for. Includes aliases like `jpg`. */
export type StudioFormatSlug =
  | 'jpeg'
  | 'jpg'
  | 'png'
  | 'webp'
  | 'avif'
  | 'gif'
  | 'bmp'
  | 'svg'
  | 'heic'
  | 'heif'
  | 'jxl'
  | 'qoi'
  | 'tiff'
  | 'tif'

/** Canonical input intent used in copy and URLs (aliases collapse here). */
export type StudioInputIntent =
  | 'jpeg'
  | 'png'
  | 'webp'
  | 'avif'
  | 'gif'
  | 'bmp'
  | 'svg'
  | 'heic'
  | 'jxl'
  | 'qoi'
  | 'tiff'

export type StudioOutputIntent = OutputFormat

const INPUT_ALIAS: Record<string, StudioInputIntent> = {
  jpeg: 'jpeg',
  jpg: 'jpeg',
  png: 'png',
  webp: 'webp',
  avif: 'avif',
  gif: 'gif',
  bmp: 'bmp',
  svg: 'svg',
  heic: 'heic',
  heif: 'heic',
  jxl: 'jxl',
  qoi: 'qoi',
  tiff: 'tiff',
  tif: 'tiff',
}

const OUTPUT_ALIAS: Record<string, StudioOutputIntent> = {
  jpeg: 'jpeg',
  jpg: 'jpeg',
  png: 'png',
  webp: 'webp',
  avif: 'avif',
  jxl: 'jxl',
  qoi: 'qoi',
}

/** Prefer search-friendly slug in public URLs (jpg over jpeg). */
export const INPUT_URL_SLUG: Record<StudioInputIntent, string> = {
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
  avif: 'avif',
  gif: 'gif',
  bmp: 'bmp',
  svg: 'svg',
  heic: 'heic',
  jxl: 'jxl',
  qoi: 'qoi',
  tiff: 'tiff',
}

export const OUTPUT_URL_SLUG: Record<StudioOutputIntent, string> = {
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
  avif: 'avif',
  jxl: 'jxl',
  qoi: 'qoi',
}

export const FORMAT_LABEL: Record<StudioInputIntent | StudioOutputIntent, string> = {
  jpeg: 'JPG',
  png: 'PNG',
  webp: 'WebP',
  avif: 'AVIF',
  gif: 'GIF',
  bmp: 'BMP',
  svg: 'SVG',
  heic: 'HEIC',
  jxl: 'JPEG XL',
  qoi: 'QOI',
  tiff: 'TIFF',
}

export const FORMAT_LABEL_LONG: Record<StudioInputIntent | StudioOutputIntent, string> = {
  jpeg: 'JPEG / JPG',
  png: 'PNG',
  webp: 'WebP',
  avif: 'AVIF',
  gif: 'GIF',
  bmp: 'BMP',
  svg: 'SVG',
  heic: 'HEIC / HEIF',
  jxl: 'JPEG XL',
  qoi: 'QOI',
  tiff: 'TIFF',
}

export function parseInputIntent(value: unknown): StudioInputIntent | undefined {
  if (typeof value !== 'string') return undefined
  return INPUT_ALIAS[value.trim().toLowerCase()]
}

export function parseOutputIntent(value: unknown): StudioOutputIntent | undefined {
  if (typeof value !== 'string') return undefined
  return OUTPUT_ALIAS[value.trim().toLowerCase()]
}

export function formatLabel(intent: StudioInputIntent | StudioOutputIntent): string {
  return FORMAT_LABEL[intent]
}

export function formatLabelLong(intent: StudioInputIntent | StudioOutputIntent): string {
  return FORMAT_LABEL_LONG[intent]
}

/** Maps SEO input intent to pipeline InputFormat when there is a 1:1 match. */
export function inputIntentToInputFormat(
  intent: StudioInputIntent,
): InputFormat | undefined {
  if (intent === 'tiff') return undefined
  return intent
}
