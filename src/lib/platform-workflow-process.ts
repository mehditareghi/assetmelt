import { applyCenteredAspectCrop, mergePipelineWithPartial } from '@/lib/presets'
import { createPreviewObjectUrl } from '@/lib/image/browser-display'
import { processImageInWorker } from '@/lib/image/worker-bridge'
import type { InputFormat } from '@/lib/image/format-detection'
import type { PipelineConfig } from '@/lib/schemas/pipeline-schema'
import type { ProcessStats, WorkflowVariantResult } from '@/lib/image/types'
import type { PlatformWorkflow } from '@/lib/platform-presets'

export function pickPrimaryWorkflowVariant(
  results: WorkflowVariantResult[],
): WorkflowVariantResult {
  return (
    results.find((r) => r.variantId === 'favicon-512') ??
    results[results.length - 1] ??
    results[0]
  )
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

  const baseName = fileName.replace(/\.[^.]+$/, '')
  const variantCount = workflow.variants.length
  const results: WorkflowVariantResult[] = []

  for (let i = 0; i < variantCount; i++) {
    const variant = workflow.variants[i]
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
        const sliceStart = (i / variantCount) * 100
        const sliceEnd = ((i + 1) / variantCount) * 100
        const mapped =
          sliceStart + (workerProgress / 100) * (sliceEnd - sliceStart)
        onProgress?.(Math.round(mapped))
      },
    )

    const blob = new Blob([result.buffer], { type: result.mimeType })
    const resultUrl = URL.createObjectURL(blob)
    const previewUrl = result.previewBuffer
      ? createPreviewObjectUrl(result.previewBuffer)
      : resultUrl

    const ext =
      variantPipeline.outputFormat === 'jpeg' ? 'jpg' : variantPipeline.outputFormat
    const outputName =
      result.outputName ??
      variant.filenamePattern.replace('{name}', baseName).replace('{ext}', ext)

    const stats: ProcessStats = {
      ...result.stats,
      originalSize: originalByteSize,
      savingsPercent:
        originalByteSize > 0
          ? ((originalByteSize - result.stats.outputSize) / originalByteSize) * 100
          : result.stats.savingsPercent,
    }

    results.push({
      variantId: variant.id,
      label: variant.label,
      outputName,
      blob,
      previewUrl,
      resultUrl,
      stats,
    })
  }

  onProgress?.(100)
  return results
}
