import type { PipelineConfig } from '@/lib/schemas/pipeline-schema'

export const FORMAT_EXTENSIONS: Record<string, string> = {
  jpeg: 'jpg',
  webp: 'webp',
  avif: 'avif',
  png: 'png',
  jxl: 'jxl',
  qoi: 'qoi',
}

export const FILENAME_TOKENS = [
  { token: '{name}', label: 'name', hint: 'Original basename' },
  { token: '{ext}', label: 'ext', hint: 'Output extension' },
  { token: '{width}', label: 'width', hint: 'Output width in pixels' },
  { token: '{height}', label: 'height', hint: 'Output height in pixels' },
  { token: '{quality}', label: 'quality', hint: 'Encode quality used' },
  { token: '{date}', label: 'date', hint: 'Local date as YYYY-MM-DD' },
] as const

export type FilenameToken = (typeof FILENAME_TOKENS)[number]['token']

export type FilenameTokenValues = {
  width?: number
  height?: number
  quality?: number
  date?: Date
}

const TOKEN_PATTERN = /\{(name|ext|width|height|quality|date)\}/g

type TokenKey = 'name' | 'ext' | 'width' | 'height' | 'quality' | 'date'

function sanitizeSegment(value: string): string {
  return value.replace(/[/\\?%*:|"<>]/g, '-').replace(/\s+/g, ' ').trim()
}

export function formatDateToken(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function encodeQualityForFilename(
  pipeline: PipelineConfig,
  appliedQuality?: number,
): number | undefined {
  if (appliedQuality != null && Number.isFinite(appliedQuality)) {
    return appliedQuality
  }
  const options = pipeline.encode.options
  if ('quality' in options && typeof options.quality === 'number') {
    return options.quality
  }
  return undefined
}

function qualityLabel(quality?: number): string {
  if (quality == null || !Number.isFinite(quality)) return ''
  return Number.isInteger(quality) ? String(quality) : String(Math.round(quality * 10) / 10)
}

export function formatOutputFilename(
  originalName: string,
  pattern: string,
  outputFormat: string,
  values: FilenameTokenValues = {},
): string {
  const ext = FORMAT_EXTENSIONS[outputFormat] ?? outputFormat
  const baseName = sanitizeSegment(originalName.replace(/\.[^.]+$/, '')) || 'image'
  const date = values.date ?? new Date()
  const tokens: Record<TokenKey, string> = {
    name: baseName,
    ext,
    width: values.width != null ? String(Math.round(values.width)) : '',
    height: values.height != null ? String(Math.round(values.height)) : '',
    quality: qualityLabel(values.quality),
    date: formatDateToken(date),
  }

  const trimmed = pattern.trim() || '{name}.{ext}'
  const rendered = trimmed.replace(TOKEN_PATTERN, (_match, key: TokenKey) => {
    return tokens[key] ?? ''
  })

  const safe = sanitizeSegment(rendered).replace(/^\.+/, '')
  // Never return a bare extension as the whole filename (e.g. pattern "{ext}" → "webp").
  if (!safe || safe === ext) {
    return `${baseName}.${ext}`
  }
  if (!safe.includes('.')) {
    return `${safe}.${ext}`
  }
  return safe
}

export function insertFilenameToken(
  pattern: string,
  token: string,
  selectionStart: number,
  selectionEnd = selectionStart,
): { next: string; cursor: number } {
  const start = Math.max(0, Math.min(selectionStart, pattern.length))
  const end = Math.max(start, Math.min(selectionEnd, pattern.length))
  const next = pattern.slice(0, start) + token + pattern.slice(end)
  return { next, cursor: start + token.length }
}
