import JSZip from 'jszip'
import { getDefaultEncodeOptions, type PipelineConfig } from '@/lib/schemas/pipeline-schema'
import { FORMAT_EXTENSIONS } from '@/lib/filename-pattern'
import type { PlatformWorkflow, PlatformWorkflowVariant } from '@/lib/platform-presets'
import type { WorkflowVariantResult } from '@/lib/image/types'
import { processPlatformWorkflowVariants } from '@/lib/platform-workflow-process'
import { prepareFileForProcessing } from '@/lib/image/heic'
import type { InputFormat } from '@/lib/image/format-detection'
import type { ProcessableFile } from '@/lib/image/types'

export type ResponsiveFormat = 'avif' | 'webp' | 'jpeg'
export type ResponsiveLayoutPreset =
  | 'full-bleed'
  | 'content-column'
  | 'sidebar'
  | 'product-grid'

export const RESPONSIVE_LAYOUT_PRESETS: Record<
  ResponsiveLayoutPreset,
  { label: string; sizes: string; description: string }
> = {
  'full-bleed': {
    label: 'Full-width hero',
    sizes: '(min-width: 1024px) 1200px, 100vw',
    description: 'Edge-to-edge on mobile, capped near 1200px on desktop.',
  },
  'content-column': {
    label: 'Article body (720px max)',
    sizes: '(min-width: 768px) 720px, 100vw',
    description: 'Typical blog prose width inside a centered column.',
  },
  sidebar: {
    label: 'Sidebar layout (60% width)',
    sizes: '(min-width: 1024px) 60vw, 100vw',
    description: 'Main column beside a sidebar on large screens.',
  },
  'product-grid': {
    label: 'Product grid (4-up)',
    sizes: '(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw',
    description: 'Quarter width on desktop, half on tablet, full on phone.',
  },
}

export const RESPONSIVE_FORMAT_OPTIONS: Array<{
  id: ResponsiveFormat
  label: string
  hint?: string
}> = [
  { id: 'avif', label: 'AVIF' },
  { id: 'webp', label: 'WebP' },
  { id: 'jpeg', label: 'JPEG', hint: 'img / next/image fallback' },
]

export const DEFAULT_RESPONSIVE_FORMATS: ResponsiveFormat[] = ['avif', 'webp', 'jpeg']

export function buildResponsiveWidths(maxCssWidth: number, includeRetina: boolean): number[] {
  const capped = Math.max(320, Math.min(2560, Math.round(maxCssWidth)))
  const base = [Math.round(capped * 0.5), Math.round(capped * 0.75), capped]
    .map((w) => Math.max(320, Math.min(w, 2560)))
    .filter((w, i, arr) => arr.indexOf(w) === i)
    .sort((a, b) => a - b)

  if (!includeRetina) return base

  const retina = base.map((w) => Math.min(w * 2, 2560))
  return [...new Set([...base, ...retina])].sort((a, b) => a - b)
}

/** Drop widths larger than the source; keep unique ascending list. */
export function clampWidthsToSource(widths: number[], sourceWidth?: number): number[] {
  if (sourceWidth == null || sourceWidth <= 0) {
    return [...new Set(widths.map((w) => Math.round(w)))].sort((a, b) => a - b)
  }
  const max = Math.max(1, Math.round(sourceWidth))
  return [...new Set(widths.map((w) => Math.min(Math.round(w), max)))].sort((a, b) => a - b)
}

export function normalizeResponsiveFormats(formats: ResponsiveFormat[]): ResponsiveFormat[] {
  const order: ResponsiveFormat[] = ['avif', 'webp', 'jpeg']
  const seen = new Set(formats)
  return order.filter((id) => seen.has(id))
}

export function stemFromBasePath(basePath: string, fallback = 'image'): string {
  const trimmed = basePath.trim().replace(/\/+$/, '')
  const segment = trimmed.split('/').filter(Boolean).pop()
  return segment || fallback
}

export function defaultBasePathFromFileName(fileName: string): string {
  const stem = fileName.replace(/\.[^.]+$/, '') || 'image'
  return `/images/${stem}`
}

function fallbackFormat(formats: ResponsiveFormat[]): ResponsiveFormat {
  if (formats.includes('jpeg')) return 'jpeg'
  if (formats.includes('webp')) return 'webp'
  return formats[0] ?? 'jpeg'
}

function extForFormat(format: ResponsiveFormat): string {
  return FORMAT_EXTENSIONS[format] ?? format
}

function heightForWidth(
  width: number,
  sourceWidth?: number,
  sourceHeight?: number,
): number {
  if (sourceWidth && sourceHeight && sourceWidth > 0) {
    return Math.max(1, Math.round((width * sourceHeight) / sourceWidth))
  }
  return Math.max(1, Math.round(width * 0.625))
}

export function buildPictureMarkup(options: {
  basePath: string
  widths: number[]
  sizes: string
  alt: string
  formats: ResponsiveFormat[]
  sourceWidth?: number
  sourceHeight?: number
}): string {
  const formats = normalizeResponsiveFormats(options.formats)
  if (formats.length === 0 || options.widths.length === 0) return ''

  const fallbackFmt = fallbackFormat(formats)
  const fallbackW = options.widths[options.widths.length - 1]!
  const fallbackH = heightForWidth(fallbackW, options.sourceWidth, options.sourceHeight)
  const fallbackExt = extForFormat(fallbackFmt)

  // Prefer AVIF/WebP as <source>; JPEG (or sole format) as <img>.
  const pictureSources = formats
    .filter((fmt) => fmt !== fallbackFmt)
    .map((fmt) => {
      const ext = extForFormat(fmt)
      const entries = options.widths
        .map((w) => `  ${options.basePath}-${w}.${ext} ${w}w`)
        .join(',\n')
      return `  <source
    type="image/${fmt}"
    srcset="
${entries}
    "
    sizes="${options.sizes}"
  />`
    })

  return `<picture>
${pictureSources.length > 0 ? `${pictureSources.join('\n')}\n` : ''}  <img
    src="${options.basePath}-${fallbackW}.${fallbackExt}"
    alt="${options.alt.replace(/"/g, '&quot;')}"
    width="${fallbackW}"
    height="${fallbackH}"
    loading="lazy"
    decoding="async"
  />
</picture>`
}

export function buildNextImageSnippet(options: {
  basePath: string
  widths: number[]
  sizes: string
  alt: string
  formats: ResponsiveFormat[]
  sourceWidth?: number
  sourceHeight?: number
}): string {
  const formats = normalizeResponsiveFormats(options.formats)
  if (formats.length === 0 || options.widths.length === 0) return ''

  const fallbackFmt = fallbackFormat(formats)
  const fallbackW = options.widths[options.widths.length - 1]!
  const fallbackH = heightForWidth(fallbackW, options.sourceWidth, options.sourceHeight)
  const fallbackExt = extForFormat(fallbackFmt)
  const altEscaped = options.alt.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')

  const sourceBlocks = formats
    .filter((fmt) => fmt !== fallbackFmt)
    .map((fmt) => {
      const ext = extForFormat(fmt)
      const srcSet = options.widths.map((w) => `${options.basePath}-${w}.${ext} ${w}w`).join(', ')
      return `      <source
        type="image/${fmt}"
        srcSet="${srcSet}"
        sizes="${options.sizes}"
      />`
    })
    .join('\n')

  return `import Image from 'next/image'

export function ResponsiveImage() {
  return (
    <picture>
${sourceBlocks}
      <Image
        src="${options.basePath}-${fallbackW}.${fallbackExt}"
        alt={\`${altEscaped}\`}
        width={${fallbackW}}
        height={${fallbackH}}
        sizes="${options.sizes}"
      />
    </picture>
  )
}`
}

function maxWidthResize(width: number): PipelineConfig['resize'] {
  return {
    enabled: true,
    mode: 'maxWidth',
    width,
    height: width,
    percentage: 100,
    lockAspectRatio: true,
    lockTargetDimensions: false,
    method: 'lanczos3',
    fitMethod: 'contain',
    premultiply: true,
    linearRGB: true,
  }
}

export function responsiveVariantId(width: number, format: ResponsiveFormat): string {
  return `srcset-${width}-${format}`
}

export function parseResponsiveVariantId(
  variantId: string,
): { width: number; format: ResponsiveFormat } | null {
  const match = /^srcset-(\d+)-(avif|webp|jpeg)$/.exec(variantId)
  if (!match) return null
  return { width: Number(match[1]), format: match[2] as ResponsiveFormat }
}

export function buildResponsiveWorkflow(options: {
  widths: number[]
  formats: ResponsiveFormat[]
  filenameStem: string
  basePipeline: PipelineConfig
}): PlatformWorkflow {
  const formats = normalizeResponsiveFormats(options.formats)
  const widths = [...new Set(options.widths.map((w) => Math.round(w)))].sort((a, b) => a - b)
  const stem = options.filenameStem.replace(/[^\w.-]+/g, '-') || 'image'

  const variants: PlatformWorkflowVariant[] = []
  for (const width of widths) {
    for (const format of formats) {
      const encode =
        options.basePipeline.outputFormat === format
          ? options.basePipeline.encode
          : getDefaultEncodeOptions(format)

      variants.push({
        id: responsiveVariantId(width, format),
        label: `${width}w ${format.toUpperCase()}`,
        filenamePattern: `${stem}-{width}.{ext}`,
        config: {
          outputFormat: format,
          encode,
          alsoExportFormats: [],
          resize: maxWidthResize(width),
          sizeBudget: {
            enabled: false,
            targetBytes: options.basePipeline.sizeBudget.targetBytes,
            allowResize: false,
          },
        },
      })
    }
  }

  return {
    id: 'srcset-kit',
    name: 'Responsive export',
    description: 'Width × format variants for srcset / picture',
    previewPresetId: 'web-optimized',
    variants,
  }
}

export function responsiveZipEntryPath(
  variant: Pick<WorkflowVariantResult, 'variantId' | 'outputName'>,
): string {
  const parsed = parseResponsiveVariantId(variant.variantId)
  const folder = parsed ? String(parsed.width) : 'out'
  const name = variant.outputName.replace(/^.*[/\\]/, '').trim() || 'output'
  return `${folder}/${name}`
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function generateResponsiveExportZip(options: {
  file: ProcessableFile
  pipeline: PipelineConfig
  widths: number[]
  formats: ResponsiveFormat[]
  filenameStem: string
  onProgress?: (progress: number) => void
}): Promise<{ count: number; zipName: string }> {
  const formats = normalizeResponsiveFormats(options.formats)
  const widths = clampWidthsToSource(options.widths, options.file.originalWidth)
  if (formats.length === 0) throw new Error('Pick at least one format')
  if (widths.length === 0) throw new Error('No export widths to encode')

  const { file: processFile, inputFormat: processFormat, sourceByteSize } =
    await prepareFileForProcessing(options.file.file, options.file.inputFormat)

  const buffer = await processFile.arrayBuffer()
  const originalByteSize =
    options.file.sourceByteSize ?? sourceByteSize ?? buffer.byteLength

  const workflow = buildResponsiveWorkflow({
    widths,
    formats,
    filenameStem: options.filenameStem,
    basePipeline: options.pipeline,
  })

  const results = await processPlatformWorkflowVariants({
    fileId: options.file.id,
    buffer,
    fileName: processFile.name,
    inputFormat: processFormat as InputFormat,
    originalByteSize,
    sourceWidth: options.file.originalWidth,
    sourceHeight: options.file.originalHeight,
    basePipeline: options.pipeline,
    workflow,
    onProgress: options.onProgress,
  })

  try {
    const zip = new JSZip()
    for (const variant of results) {
      zip.file(responsiveZipEntryPath(variant), variant.blob)
    }
    const blob = await zip.generateAsync({ type: 'blob' })
    const zipName = `${options.filenameStem}-srcset.zip`
    downloadBlob(blob, zipName)
    return { count: results.length, zipName }
  } finally {
    for (const variant of results) {
      URL.revokeObjectURL(variant.previewUrl)
      if (variant.previewUrl !== variant.resultUrl) {
        URL.revokeObjectURL(variant.resultUrl)
      }
    }
  }
}
