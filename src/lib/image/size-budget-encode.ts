import type { PipelineConfig } from '@/lib/schemas/pipeline-schema'
import type { OutputFormat } from '@/lib/schemas/pipeline-schema'

export const SIZE_BUDGET_FORMATS: OutputFormat[] = ['webp', 'avif', 'jpeg', 'jxl']

export interface SizeBudgetResult {
  buffer: ArrayBuffer
  mimeType: string
  quality: number
  scale: number
  outputWidth: number
  outputHeight: number
  met: boolean
  targetBytes: number
}

export function isSizeBudgetSupported(pipeline: PipelineConfig): boolean {
  if (!SIZE_BUDGET_FORMATS.includes(pipeline.outputFormat)) return false
  if (pipeline.encode.format === 'avif' && pipeline.encode.options.lossless) return false
  if (pipeline.encode.format === 'jxl' && pipeline.encode.options.lossless) return false
  return true
}

function withQuality(pipeline: PipelineConfig, quality: number): PipelineConfig {
  const { encode } = pipeline
  switch (encode.format) {
    case 'jpeg':
      return { ...pipeline, encode: { format: 'jpeg', options: { ...encode.options, quality } } }
    case 'webp':
      return { ...pipeline, encode: { format: 'webp', options: { ...encode.options, quality } } }
    case 'avif':
      return { ...pipeline, encode: { format: 'avif', options: { ...encode.options, quality } } }
    case 'jxl':
      return { ...pipeline, encode: { format: 'jxl', options: { ...encode.options, quality } } }
    default:
      return pipeline
  }
}

async function scaleImageData(imageData: ImageData, scale: number): Promise<ImageData> {
  if (scale >= 0.999) return imageData
  const width = Math.max(1, Math.round(imageData.width * scale))
  const height = Math.max(1, Math.round(imageData.height * scale))
  if (width === imageData.width && height === imageData.height) return imageData

  const { default: resizeFn } = await import('@jsquash/resize')
  return resizeFn(imageData, {
    width,
    height,
    method: 'lanczos3',
    fitMethod: 'stretch',
    premultiply: true,
    linearRGB: true,
  })
}

async function encodeImageData(
  imageData: ImageData,
  pipeline: PipelineConfig,
  webpTargetBytes?: number,
): Promise<ArrayBuffer> {
  const { outputFormat, encode } = pipeline

  switch (outputFormat) {
    case 'jpeg': {
      const { encode: encodeJpeg } = await import('@jsquash/jpeg')
      return encodeJpeg(
        imageData,
        encode.format === 'jpeg' ? (encode.options as Record<string, unknown>) : {},
      )
    }
    case 'webp': {
      const { encode: encodeWebp } = await import('@jsquash/webp')
      const options =
        encode.format === 'webp'
          ? {
              ...encode.options,
              ...(webpTargetBytes ? { target_size: webpTargetBytes } : {}),
            }
          : {}
      return encodeWebp(imageData, options)
    }
    case 'avif': {
      const { encode: encodeAvif } = await import('@jsquash/avif')
      const opts = encode.format === 'avif' ? encode.options : {}
      return encodeAvif(imageData, opts)
    }
    case 'jxl': {
      const { encode: encodeJxl } = await import('@jsquash/jxl')
      return encodeJxl(imageData, encode.format === 'jxl' ? encode.options : {})
    }
    default:
      throw new Error(`Size budget does not support ${outputFormat}`)
  }
}

function mimeForFormat(format: OutputFormat): string {
  const map: Record<OutputFormat, string> = {
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    avif: 'image/avif',
    png: 'image/png',
    jxl: 'image/jxl',
    qoi: 'image/qoi',
  }
  return map[format]
}

interface EncodeAttempt {
  buffer: ArrayBuffer
  quality: number
  size: number
}

async function findBestQualityUnderBudget(
  imageData: ImageData,
  pipeline: PipelineConfig,
  targetBytes: number,
): Promise<EncodeAttempt | null> {
  const tryQuality = async (quality: number): Promise<EncodeAttempt> => {
    const buffer = await encodeImageData(imageData, withQuality(pipeline, quality))
    return { buffer, quality, size: buffer.byteLength }
  }

  const atMax = await tryQuality(100)
  if (atMax.size <= targetBytes) return atMax

  const atMin = await tryQuality(1)
  if (atMin.size > targetBytes) return null

  let lo = 1
  let hi = 100
  let best = atMin

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    const attempt = await tryQuality(mid)
    if (attempt.size <= targetBytes) {
      best = attempt
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }

  return best
}

async function tryWebpNativeTargetSize(
  imageData: ImageData,
  pipeline: PipelineConfig,
  targetBytes: number,
): Promise<EncodeAttempt | null> {
  if (pipeline.outputFormat !== 'webp' || pipeline.encode.format !== 'webp') return null

  const buffer = await encodeImageData(imageData, pipeline, targetBytes)
  const size = buffer.byteLength
  if (size > targetBytes * 1.05) return null

  return {
    buffer,
    quality: pipeline.encode.options.quality,
    size,
  }
}

export async function encodeToSizeBudget(
  imageData: ImageData,
  pipeline: PipelineConfig,
  onProgress?: (fraction: number) => void,
): Promise<SizeBudgetResult> {
  const budget = pipeline.sizeBudget
  if (!budget?.enabled) {
    throw new Error('Size budget is not enabled')
  }

  const targetBytes = budget.targetBytes
  const mimeType = mimeForFormat(pipeline.outputFormat)
  let step = 0
  const tick = () => {
    step += 1
    onProgress?.(Math.min(0.98, step / 24))
  }

  const scales = budget.allowResize
    ? [1, 0.85, 0.7, 0.55, 0.4, 0.3, 0.22, 0.16, 0.12]
    : [1]

  if (pipeline.outputFormat === 'webp') {
    const native = await tryWebpNativeTargetSize(imageData, pipeline, targetBytes)
    tick()
    if (native && native.size <= targetBytes) {
      onProgress?.(1)
      return {
        buffer: native.buffer,
        mimeType,
        quality: native.quality,
        scale: 1,
        outputWidth: imageData.width,
        outputHeight: imageData.height,
        met: true,
        targetBytes,
      }
    }
  }

  let bestAttempt: (EncodeAttempt & { scale: number; imageData: ImageData }) | null = null

  for (const scale of scales) {
    const scaled = await scaleImageData(imageData, scale)
    tick()

    const attempt = await findBestQualityUnderBudget(scaled, pipeline, targetBytes)
    tick()

    if (attempt) {
      const candidate = { ...attempt, scale, imageData: scaled }
      if (
        !bestAttempt ||
        attempt.quality > bestAttempt.quality ||
        (attempt.quality === bestAttempt.quality && scale > bestAttempt.scale)
      ) {
        bestAttempt = candidate
      }
      if (attempt.quality >= 95 && scale >= 0.85) break
    }
  }

  if (!bestAttempt) {
    const scaled = await scaleImageData(imageData, scales[scales.length - 1])
    const buffer = await encodeImageData(scaled, withQuality(pipeline, 1))
    onProgress?.(1)
    return {
      buffer,
      mimeType,
      quality: 1,
      scale: scales[scales.length - 1],
      outputWidth: scaled.width,
      outputHeight: scaled.height,
      met: false,
      targetBytes,
    }
  }

  onProgress?.(1)
  return {
    buffer: bestAttempt.buffer,
    mimeType,
    quality: bestAttempt.quality,
    scale: bestAttempt.scale,
    outputWidth: bestAttempt.imageData.width,
    outputHeight: bestAttempt.imageData.height,
    met: bestAttempt.size <= targetBytes,
    targetBytes,
  }
}

export function formatSizeBudgetTarget(bytes: number): string {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`
  return `${Math.round(bytes / 1024)} KB`
}
