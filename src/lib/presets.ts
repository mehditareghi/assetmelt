import type { CropConfig, PipelineConfig } from '@/lib/schemas/pipeline-schema'
import {
  createDefaultPipeline,
  getDefaultEncodeOptions,
  pipelineSchema,
} from '@/lib/schemas/pipeline-schema'
import { formatSizeBudgetTarget } from '@/lib/image/size-budget-encode'
import { createDefaultCrop } from '@/lib/image/crop-math'
import { getCropSpaceDimensions } from '@/lib/image/transform-space'
import { PLATFORM_BUILT_IN_PRESETS, resolvePlatformPresetId, type PlatformPreset } from '@/lib/platform-presets'

export interface Preset {
  id: string
  name: string
  description: string
  category?: 'general' | 'platform'
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

export const GENERAL_BUILT_IN_PRESETS: Preset[] = [
  {
    id: 'web-optimized',
    name: 'Web Optimized',
    description: 'WebP for the web — max 1920px',
    category: 'general',
    config: {
      outputFormat: 'webp',
      resize: {
        enabled: true,
        mode: 'maxSide',
        width: 1920,
        height: 1920,
        percentage: 100,
        lockAspectRatio: true,
        lockTargetDimensions: false,
        method: 'lanczos3',
        fitMethod: 'contain',
        premultiply: true,
        linearRGB: true,
      },
      metadataMode: 'strip',
    },
  },
  {
    id: 'dev-assets',
    name: 'Dev Assets',
    description: 'AVIF with metadata stripped',
    category: 'general',
    config: {
      outputFormat: 'avif',
      metadataMode: 'strip',
    },
  },
  {
    id: 'lossless-png',
    name: 'Lossless PNG',
    description: 'Sharp PNG — Oxipng level 4, keeps EXIF/ICC',
    category: 'general',
    config: {
      outputFormat: 'png',
      metadataMode: 'keep',
    },
  },
  {
    id: 'thumbnail',
    name: 'Thumbnail',
    description: 'Tiny WebP — max 400px',
    category: 'general',
    config: {
      outputFormat: 'webp',
      resize: {
        enabled: true,
        mode: 'maxSide',
        width: 400,
        height: 400,
        percentage: 100,
        lockAspectRatio: true,
        lockTargetDimensions: false,
        method: 'lanczos3',
        fitMethod: 'contain',
        premultiply: true,
        linearRGB: true,
      },
      metadataMode: 'strip',
    },
  },
  {
    id: 'max-compress',
    name: 'Max Compress',
    description: 'Smallest AVIF — max 1280px',
    category: 'general',
    config: {
      outputFormat: 'avif',
      resize: {
        enabled: true,
        mode: 'maxSide',
        width: 1280,
        height: 1280,
        percentage: 100,
        lockAspectRatio: true,
        lockTargetDimensions: false,
        method: 'lanczos3',
        fitMethod: 'contain',
        premultiply: true,
        linearRGB: true,
      },
      metadataMode: 'strip',
    },
  },
]

export const BUILT_IN_PRESETS: Preset[] = [
  ...GENERAL_BUILT_IN_PRESETS,
  ...PLATFORM_BUILT_IN_PRESETS,
]

export function getPresetDisplayName(
  activePresetId: string,
  customPresets: CustomPreset[],
): string {
  const resolvedId = resolvePlatformPresetId(activePresetId)
  const builtIn = BUILT_IN_PRESETS.find((preset) => preset.id === resolvedId)
  if (builtIn) return builtIn.name
  return customPresets.find((preset) => preset.id === activePresetId)?.name ?? 'Recipe'
}

export function getCustomPresetSummary(config: Partial<PipelineConfig>): string {
  const format = config.outputFormat?.toUpperCase() ?? 'Unknown format'
  if (config.sizeBudget?.enabled) {
    return `${format} · under ${formatSizeBudgetTarget(config.sizeBudget.targetBytes)}`
  }
  if (config.resize?.enabled) {
    const mode = config.resize.mode
    if (mode === 'exact') {
      return `${format} · ${config.resize.width}×${config.resize.height}`
    }
    if (mode === 'maxSide') return `${format} · max ${config.resize.width}px`
    if (mode === 'percentage') return `${format} · ${config.resize.percentage}% scale`
    return `${format} · resize on`
  }
  return format
}

export function resolveCustomPresetPipeline(preset: CustomPreset): PipelineConfig {
  return mergePipelineWithPartial(preset.config)
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

const PLATFORM_JPEG_QUALITY = 88

function applyPlatformEncode(preset: Preset, encode: PipelineConfig['encode']): PipelineConfig['encode'] {
  if (preset.config.outputFormat !== 'jpeg' || encode.format !== 'jpeg') return encode
  return {
    format: 'jpeg',
    options: {
      ...encode.options,
      quality: PLATFORM_JPEG_QUALITY,
      progressive: true,
    },
  }
}

export function mergePipelineWithPartial(
  partial: Partial<PipelineConfig>,
  base?: PipelineConfig,
): PipelineConfig {
  const root = base ?? createDefaultPipeline()
  const outputFormat = partial.outputFormat ?? root.outputFormat
  const encode =
    partial.encode ??
    (partial.outputFormat && partial.outputFormat !== root.outputFormat
      ? getDefaultEncodeOptions(outputFormat)
      : root.encode)

  return pipelineSchema.parse({
    ...root,
    ...partial,
    resize: { ...root.resize, ...partial.resize },
    crop: { ...root.crop, ...partial.crop },
    flip: { ...root.flip, ...partial.flip },
    filters: { ...root.filters, ...partial.filters },
    sizeBudget: { ...root.sizeBudget, ...partial.sizeBudget },
    encode,
  })
}

export function applyCenteredAspectCrop(
  pipeline: PipelineConfig,
  sourceWidth: number,
  sourceHeight: number,
  rotate: PipelineConfig['rotate'],
  aspect: CropConfig['aspectRatio'],
): PipelineConfig {
  if (aspect === 'free') return pipeline

  const cropSpace = getCropSpaceDimensions(sourceWidth, sourceHeight, rotate)
  const rect = createDefaultCrop(cropSpace.width, cropSpace.height, aspect)
  const crop: CropConfig = {
    enabled: true,
    aspectRatio: aspect,
    ...rect,
  }

  return { ...pipeline, crop }
}

export function applyPlatformCropForPreset(
  pipeline: PipelineConfig,
  preset: PlatformPreset,
  sourceWidth: number,
  sourceHeight: number,
  rotate: PipelineConfig['rotate'],
): PipelineConfig {
  const aspect = preset.platform?.suggestedCropAspect
  if (!preset.platform?.autoCrop || !aspect || aspect === 'free') {
    return pipeline
  }
  return applyCenteredAspectCrop(pipeline, sourceWidth, sourceHeight, rotate, aspect)
}

export function applyPreset(preset: Preset): PipelineConfig {
  const base = createDefaultPipeline()
  const outputFormat = preset.config.outputFormat ?? base.outputFormat
  let encode = getDefaultEncodeOptions(outputFormat)

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
  encode = applyPlatformEncode(preset, encode)

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
