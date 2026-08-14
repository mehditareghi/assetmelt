import {
  alsoExportFormatSchema,
  getDefaultEncodeOptions,
  type AlsoExportFormat,
  type OutputFormat,
  type PipelineConfig,
} from '@/lib/schemas/pipeline-schema'
import { FORMAT_EXTENSIONS } from '@/lib/filename-pattern'
import type { PlatformWorkflow, PlatformWorkflowVariant } from '@/lib/platform-presets'

export const MULTI_FORMAT_KIT_ID = 'formats'

export const ALSO_EXPORT_OPTIONS: Array<{
  id: AlsoExportFormat
  label: string
  hint?: string
}> = [
  { id: 'avif', label: 'AVIF' },
  { id: 'webp', label: 'WebP' },
  { id: 'jpeg', label: 'JPEG', hint: 'Fallback; flattens transparency' },
]

export function formatOutputLabel(format: OutputFormat | AlsoExportFormat): string {
  switch (format) {
    case 'jpeg':
      return 'JPEG'
    case 'webp':
      return 'WebP'
    case 'avif':
      return 'AVIF'
    case 'png':
      return 'PNG'
    case 'jxl':
      return 'JPEG XL'
    case 'qoi':
      return 'QOI'
  }
}

/** Drop primary + invalid entries; keep stable AVIF → WebP → JPEG order. */
export function normalizeAlsoExportFormats(
  pipeline: Pick<PipelineConfig, 'outputFormat' | 'alsoExportFormats'>,
): AlsoExportFormat[] {
  const order: AlsoExportFormat[] = ['avif', 'webp', 'jpeg']
  const seen = new Set<AlsoExportFormat>()
  for (const raw of pipeline.alsoExportFormats ?? []) {
    const parsed = alsoExportFormatSchema.safeParse(raw)
    if (!parsed.success) continue
    if (parsed.data === pipeline.outputFormat) continue
    seen.add(parsed.data)
  }
  return order.filter((id) => seen.has(id))
}

export function ensureFilenamePatternHasExt(pattern: string): string {
  if (/{ext}/i.test(pattern)) return pattern
  return `${pattern.replace(/\.$/, '')}.{ext}`
}

/** Multi-format ZIPs need a real basename so entries are not just `webp` / `avif`. */
export function ensureMultiFormatFilenamePattern(pattern: string): string {
  let next = ensureFilenamePatternHasExt(pattern.trim() || '{name}-melted.{ext}')
  if (!/{name}/i.test(next)) {
    next = `{name}-${next.replace(/^\.+/, '')}`
  }
  return next
}

export function multiFormatPrimaryVariantId(outputFormat: OutputFormat): string {
  return `fmt-${outputFormat}`
}

export function isMultiFormatVariantId(variantId: string): boolean {
  return variantId.startsWith('fmt-')
}

/** Folder name inside the ZIP (`jpeg`, `webp`, `avif`, …). */
export function multiFormatFolderName(variantId: string): string | null {
  if (!isMultiFormatVariantId(variantId)) return null
  return variantId.slice('fmt-'.length) || null
}

/**
 * ZIP entry path: `webp/photo-melted.webp` for multi-format, flat name for kits.
 */
export function workflowZipEntryPath(
  variant: { variantId: string; outputName: string },
  options?: { sourceBase?: string },
): string {
  const rawName = variant.outputName.replace(/^.*[/\\]/, '').trim()
  const folder = multiFormatFolderName(variant.variantId)
  if (!folder) return rawName || 'output'

  const ext =
    FORMAT_EXTENSIONS[folder === 'jpeg' ? 'jpeg' : folder] ??
    (rawName.includes('.') ? rawName.slice(rawName.lastIndexOf('.') + 1) : folder)

  let base = rawName.replace(/\.[^.]+$/, '')
  const knownBare = new Set(['avif', 'webp', 'jpeg', 'jpg', 'png', 'jxl', 'qoi', 'formats', 'kit'])
  if (!base || base === ext || base === folder || knownBare.has(base.toLowerCase())) {
    base = options?.sourceBase?.replace(/\.[^.]+$/, '') || 'image'
  }
  const fileName = `${base}.${ext}`
  return `${folder}/${fileName}`
}

/**
 * Synthetic workflow for one-run multi-format export.
 * Returns null when there are no extras (single-file download path).
 */
export function buildMultiFormatWorkflow(pipeline: PipelineConfig): PlatformWorkflow | null {
  const extras = normalizeAlsoExportFormats(pipeline)
  if (extras.length === 0) return null

  const pattern = ensureMultiFormatFilenamePattern(pipeline.filenamePattern)
  const primary = pipeline.outputFormat

  const primaryVariant: PlatformWorkflowVariant = {
    id: multiFormatPrimaryVariantId(primary),
    label: formatOutputLabel(primary),
    filenamePattern: pattern,
    config: {
      outputFormat: primary,
      encode: pipeline.encode,
      alsoExportFormats: [],
    },
  }

  const extraVariants: PlatformWorkflowVariant[] = extras.map((fmt) => ({
    id: multiFormatPrimaryVariantId(fmt),
    label: formatOutputLabel(fmt),
    filenamePattern: pattern,
    config: {
      outputFormat: fmt,
      encode: getDefaultEncodeOptions(fmt),
      alsoExportFormats: [],
      sizeBudget: {
        enabled: false,
        targetBytes: pipeline.sizeBudget.targetBytes,
        allowResize: pipeline.sizeBudget.allowResize,
      },
    },
  }))

  return {
    id: MULTI_FORMAT_KIT_ID,
    name: 'Multi-format',
    description: 'Primary output plus extra codecs; ZIP uses format folders',
    previewPresetId: 'web-optimized',
    variants: [primaryVariant, ...extraVariants],
  }
}

export function toggleAlsoExportFormat(
  pipeline: PipelineConfig,
  format: AlsoExportFormat,
  enabled: boolean,
): AlsoExportFormat[] {
  const current = new Set(normalizeAlsoExportFormats(pipeline))
  if (enabled) current.add(format)
  else current.delete(format)
  return normalizeAlsoExportFormats({
    outputFormat: pipeline.outputFormat,
    alsoExportFormats: [...current],
  })
}
