import { encodeQualityForFilename, formatOutputFilename } from '@/lib/filename-pattern'
import { createPreviewObjectUrl } from '@/lib/image/browser-display'
import { encodeIcoFromPngs } from '@/lib/image/ico-encode'
import { processImageInWorker } from '@/lib/image/worker-bridge'
import type { InputFormat } from '@/lib/image/format-detection'
import { applyCenteredAspectCrop, mergePipelineWithPartial } from '@/lib/presets'
import type { PipelineConfig } from '@/lib/schemas/pipeline-schema'
import type { ProcessStats, WorkflowVariantResult } from '@/lib/image/types'
import type { PlatformWorkflow, PlatformWorkflowVariant } from '@/lib/platform-presets'
import { platformExactResize } from '@/lib/platform-presets'

export function pickPrimaryWorkflowVariant(
  results: WorkflowVariantResult[],
  preferredVariantId?: string,
): WorkflowVariantResult {
  if (preferredVariantId) {
    const preferred = results.find((r) => r.variantId === preferredVariantId)
    if (preferred) return preferred
  }
  return (
    results.find((r) => r.variantId === 'favicon-512') ??
    results[results.length - 1] ??
    results[0]
  )
}

async function encodeWorkflowVariant(options: {
  fileId: string
  buffer: ArrayBuffer
  fileName: string
  inputFormat: InputFormat
  originalByteSize: number
  sourceWidth?: number
  sourceHeight?: number
  basePipeline: PipelineConfig
  variant: PlatformWorkflowVariant
  onProgress?: (progress: number) => void
  progressStart?: number
  progressEnd?: number
}): Promise<WorkflowVariantResult> {
  const {
    fileId,
    buffer,
    fileName,
    inputFormat,
    originalByteSize,
    sourceWidth,
    sourceHeight,
    basePipeline,
    variant,
    onProgress,
    progressStart = 0,
    progressEnd = 100,
  } = options

  let variantPipeline = mergePipelineWithPartial(variant.config, basePipeline)
  variantPipeline = {
    ...variantPipeline,
    filenamePattern: variant.filenamePattern,
  }

  if (
    sourceWidth != null &&
    sourceHeight != null &&
    variantPipeline.crop.aspectRatio !== 'free'
  ) {
    variantPipeline = applyCenteredAspectCrop(
      variantPipeline,
      sourceWidth,
      sourceHeight,
      variantPipeline.rotate,
      variantPipeline.crop.aspectRatio,
    )
  }

  const result = await processImageInWorker(
    {
      id: `${fileId}-${variant.id}`,
      buffer: buffer.slice(0),
      fileName,
      inputFormat,
      pipeline: variantPipeline,
    },
    (workerProgress) => {
      const mapped =
        progressStart + (workerProgress / 100) * (progressEnd - progressStart)
      onProgress?.(Math.round(mapped))
    },
  )

  const blob = new Blob([result.buffer], { type: result.mimeType })
  const resultUrl = URL.createObjectURL(blob)
  const previewUrl = result.previewBuffer
    ? createPreviewObjectUrl(result.previewBuffer)
    : resultUrl

  const outputName =
    result.outputName ??
    formatOutputFilename(fileName, variant.filenamePattern, variantPipeline.outputFormat, {
      width: result.stats.outputWidth,
      height: result.stats.outputHeight,
      quality: encodeQualityForFilename(
        variantPipeline,
        result.stats.sizeBudget?.appliedQuality,
      ),
    })

  const stats: ProcessStats = {
    ...result.stats,
    originalSize: originalByteSize,
    savingsPercent:
      originalByteSize > 0
        ? ((originalByteSize - result.stats.outputSize) / originalByteSize) * 100
        : result.stats.savingsPercent,
  }

  return {
    variantId: variant.id,
    label: variant.label,
    outputName,
    blob,
    previewUrl,
    resultUrl,
    stats,
  }
}

async function appendFaviconIcoVariant(
  results: WorkflowVariantResult[],
  options: {
    fileId: string
    buffer: ArrayBuffer
    fileName: string
    inputFormat: InputFormat
    originalByteSize: number
    sourceWidth?: number
    sourceHeight?: number
    basePipeline: PipelineConfig
    onProgress?: (progress: number) => void
  },
): Promise<void> {
  const png16 = results.find((r) => r.variantId === 'favicon-16')
  const png32 = results.find((r) => r.variantId === 'favicon-32')
  if (!png16 || !png32) return

  options.onProgress?.(92)

  // 48×48 is classic favicon.ico coverage; kept out of the ZIP as a separate PNG.
  const png48 = await encodeWorkflowVariant({
    ...options,
    variant: {
      id: 'favicon-48-ico-only',
      label: '48×48',
      filenamePattern: '{name}-favicon-{width}.{ext}',
      config: {
        outputFormat: 'png',
        metadataMode: 'strip',
        resize: platformExactResize(48, 48),
        crop: {
          enabled: false,
          aspectRatio: '1:1',
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        },
      },
    },
    progressStart: 92,
    progressEnd: 98,
  })

  try {
    const icoBuffer = encodeIcoFromPngs([
      { size: 16, png: await png16.blob.arrayBuffer() },
      { size: 32, png: await png32.blob.arrayBuffer() },
      { size: 48, png: await png48.blob.arrayBuffer() },
    ])

    const blob = new Blob([icoBuffer], { type: 'image/x-icon' })
    const resultUrl = URL.createObjectURL(blob)
    // Browsers rarely render .ico in <img>; reuse 32×32 PNG pixels for the kit carousel.
    const previewUrl = URL.createObjectURL(png32.blob)
    const outputName = formatOutputFilename(
      options.fileName,
      '{name}-favicon.ico',
      'png',
      { width: 48, height: 48 },
    ).replace(/\.png$/i, '.ico')

    const outputSize = icoBuffer.byteLength
    const stats: ProcessStats = {
      originalSize: options.originalByteSize,
      outputSize,
      originalWidth: png16.stats.originalWidth,
      originalHeight: png16.stats.originalHeight,
      outputWidth: 48,
      outputHeight: 48,
      savingsPercent:
        options.originalByteSize > 0
          ? ((options.originalByteSize - outputSize) / options.originalByteSize) * 100
          : 0,
    }

    results.push({
      variantId: 'favicon-ico',
      label: 'favicon.ico (16+32+48)',
      outputName,
      blob,
      previewUrl,
      resultUrl,
      stats,
    })
  } finally {
    URL.revokeObjectURL(png48.previewUrl)
    if (png48.previewUrl !== png48.resultUrl) URL.revokeObjectURL(png48.resultUrl)
  }
}

export async function processPlatformWorkflowVariants(
  options: {
    fileId: string
    buffer: ArrayBuffer
    fileName: string
    inputFormat: InputFormat
    originalByteSize: number
    sourceWidth?: number
    sourceHeight?: number
    basePipeline: PipelineConfig
    workflow: PlatformWorkflow
    onProgress?: (progress: number) => void
  },
): Promise<WorkflowVariantResult[]> {
  const {
    fileId,
    buffer,
    fileName,
    inputFormat,
    originalByteSize,
    sourceWidth,
    sourceHeight,
    basePipeline,
    workflow,
    onProgress,
  } = options

  const variantCount = workflow.variants.length
  const results: WorkflowVariantResult[] = []
  // Reserve the last ~8% for favicon.ico assembly when applicable.
  const pngSpan = workflow.id === 'favicon-kit' ? 90 : 100

  for (let i = 0; i < variantCount; i++) {
    const variant = workflow.variants[i]
    const progressStart = (i / variantCount) * pngSpan
    const progressEnd = ((i + 1) / variantCount) * pngSpan
    results.push(
      await encodeWorkflowVariant({
        fileId,
        buffer,
        fileName,
        inputFormat,
        originalByteSize,
        sourceWidth,
        sourceHeight,
        basePipeline,
        variant,
        onProgress,
        progressStart,
        progressEnd,
      }),
    )
  }

  if (workflow.id === 'favicon-kit') {
    await appendFaviconIcoVariant(results, {
      fileId,
      buffer,
      fileName,
      inputFormat,
      originalByteSize,
      sourceWidth,
      sourceHeight,
      basePipeline,
      onProgress,
    })
  }

  onProgress?.(100)
  return results
}
