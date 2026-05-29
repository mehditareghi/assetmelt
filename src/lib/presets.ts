import type { PipelineConfig } from '@/lib/schemas/pipeline-schema'
import {
  createDefaultPipeline,
  getDefaultEncodeOptions,
  pipelineSchema,
} from '@/lib/schemas/pipeline-schema'
import { formatSizeBudgetTarget } from '@/lib/image/size-budget-encode'

export interface Preset {
  id: string
  name: string
  description: string
  config: Partial<PipelineConfig>
}

export interface CustomPreset {
  id: string
  name: string
  config: Partial<PipelineConfig>
}

export function isCustomPresetId(id: string): boolean {
  return id.startsWith('custom-')
}

export function getPresetDisplayName(
  activePresetId: string,
  customPresets: CustomPreset[],
): string {
  const builtIn = BUILT_IN_PRESETS.find((preset) => preset.id === activePresetId)
  if (builtIn) return builtIn.name
  return customPresets.find((preset) => preset.id === activePresetId)?.name ?? 'Preset'
}

export function getCustomPresetSummary(config: Partial<PipelineConfig>): string {
  const format = config.outputFormat?.toUpperCase() ?? 'Unknown format'
  if (config.sizeBudget?.enabled) {
    return `${format} · under ${formatSizeBudgetTarget(config.sizeBudget.targetBytes)}`
  }
  if (config.resize?.enabled) {
    const mode = config.resize.mode
    if (mode === 'maxSide') return `${format} · max ${config.resize.width}px`
    if (mode === 'percentage') return `${format} · ${config.resize.percentage}% scale`
    return `${format} · resize on`
  }
  return format
}

export function resolveCustomPresetPipeline(preset: CustomPreset): PipelineConfig {
  const base = createDefaultPipeline()
  return {
    ...base,
    ...preset.config,
    resize: { ...base.resize, ...preset.config.resize },
    crop: { ...base.crop, ...preset.config.crop },
    flip: { ...base.flip, ...preset.config.flip },
    filters: { ...base.filters, ...preset.config.filters },
    sizeBudget: { ...base.sizeBudget, ...preset.config.sizeBudget },
    encode: preset.config.encode ?? base.encode,
  } as PipelineConfig
}

export function pipelinesEqual(a: PipelineConfig, b: PipelineConfig): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function findMatchingCustomPreset(
  pipeline: PipelineConfig,
  customPresets: CustomPreset[],
): CustomPreset | undefined {
  return customPresets.find((preset) =>
    pipelinesEqual(pipeline, resolveCustomPresetPipeline(preset)),
  )
}

export const BUILT_IN_PRESETS: Preset[] = [
  {
    id: 'web-optimized',
    name: 'Web Optimized',
    description: 'WebP at 80% quality, max 1920px wide',
    config: {
      outputFormat: 'webp',
      resize: {
        enabled: true,
        mode: 'maxSide',
        width: 1920,
        height: 1920,
        percentage: 100,
        lockAspectRatio: true,
        method: 'lanczos3',
        fitMethod: 'contain',
        premultiply: true,
        linearRGB: true,
      },
      stripMetadata: true,
    },
  },
  {
    id: 'dev-assets',
    name: 'Dev Assets',
    description: 'AVIF at 75% quality with metadata stripped',
    config: {
      outputFormat: 'avif',
      stripMetadata: true,
    },
  },
  {
    id: 'lossless-png',
    name: 'Lossless PNG',
    description: 'Oxipng level 4 optimization',
    config: {
      outputFormat: 'png',
      stripMetadata: false,
    },
  },
  {
    id: 'thumbnail',
    name: 'Thumbnail',
    description: '400px max, WebP 85%',
    config: {
      outputFormat: 'webp',
      resize: {
        enabled: true,
        mode: 'maxSide',
        width: 400,
        height: 400,
        percentage: 100,
        lockAspectRatio: true,
        method: 'lanczos3',
        fitMethod: 'contain',
        premultiply: true,
        linearRGB: true,
      },
      stripMetadata: true,
    },
  },
  {
    id: 'max-compress',
    name: 'Max Compress',
    description: 'AVIF 50%, aggressive resize to 1280px',
    config: {
      outputFormat: 'avif',
      resize: {
        enabled: true,
        mode: 'maxSide',
        width: 1280,
        height: 1280,
        percentage: 100,
        lockAspectRatio: true,
        method: 'lanczos3',
        fitMethod: 'contain',
        premultiply: true,
        linearRGB: true,
      },
      stripMetadata: true,
    },
  },
]

export function applyPreset(preset: Preset): PipelineConfig {
  const base = createDefaultPipeline()
  const outputFormat = preset.config.outputFormat ?? base.outputFormat
  const encode = getDefaultEncodeOptions(outputFormat)

  if (outputFormat === 'webp' && encode.format === 'webp') {
    encode.options.quality = preset.id === 'thumbnail' ? 85 : 80
  }
  if (outputFormat === 'avif' && encode.format === 'avif') {
    encode.options.quality = preset.id === 'max-compress' ? 50 : 75
    encode.options.speed = preset.id === 'max-compress' ? 8 : 6
  }
  if (outputFormat === 'png' && encode.format === 'png') {
    encode.options.level = 4
  }

  return pipelineSchema.parse({
    ...base,
    ...preset.config,
    resize: { ...base.resize, ...preset.config.resize },
    crop: { ...base.crop, ...preset.config.crop },
    flip: { ...base.flip, ...preset.config.flip },
    filters: { ...base.filters, ...preset.config.filters },
    sizeBudget: { ...base.sizeBudget, ...preset.config.sizeBudget },
    encode,
  })
}

export const FORMAT_EXTENSIONS: Record<string, string> = {
  jpeg: 'jpg',
  webp: 'webp',
  avif: 'avif',
  png: 'png',
  jxl: 'jxl',
  qoi: 'qoi',
}

export const FORMAT_MIME: Record<string, string> = {
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  avif: 'image/avif',
  png: 'image/png',
  jxl: 'image/jxl',
  qoi: 'image/qoi',
}

export function formatOutputFilename(
  originalName: string,
  pattern: string,
  outputFormat: string,
): string {
  const ext = FORMAT_EXTENSIONS[outputFormat] ?? outputFormat
  const baseName = originalName.replace(/\.[^.]+$/, '')
  return pattern
    .replace('{name}', baseName)
    .replace('{ext}', ext)
}
