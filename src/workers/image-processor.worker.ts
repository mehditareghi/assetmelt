import type { PipelineConfig } from '@/lib/schemas/pipeline-schema'
import type { InputFormat } from '@/lib/image/format-detection'
import type {
  WorkerInboundMessage,
  WorkerPreviewRequest,
  WorkerProcessRequest,
  WorkerProcessResponse,
  WorkerResponse,
} from '@/lib/image/types'
import { needsWasmPreview, PREVIEW_MIME_TYPE } from '@/lib/image/browser-display'
import { computeTargetSize, normalizeResizeConfig } from '@/lib/image/resize-compute'
import {
  encodeToSizeBudget,
  isSizeBudgetSupported,
} from '@/lib/image/size-budget-encode'
import { toMozJpegWasmOptions } from '@/lib/image/jpeg-encode'
import { formatOutputFilename } from '@/lib/presets'
import { orientImageDataFromExif } from '@/lib/image/exif-orientation'
import { applyCrop, applyFilters, applyRotateFlip } from '@/lib/image/image-transforms'

function postProgress(id: string, progress: number, stage: string) {
  self.postMessage({ type: 'progress', id, progress, stage } satisfies WorkerResponse)
}

async function decodeToImageData(
  buffer: ArrayBuffer,
  format: InputFormat,
): Promise<ImageData> {
  let imageData: ImageData
  switch (format) {
    case 'jpeg': {
      const { decode } = await import('@jsquash/jpeg')
      imageData = await decode(buffer)
      break
    }
    case 'png': {
      const { decode } = await import('@jsquash/png')
      imageData = await decode(buffer)
      break
    }
    case 'webp': {
      const { decode } = await import('@jsquash/webp')
      imageData = await decode(buffer)
      break
    }
    case 'avif': {
      const { decode } = await import('@jsquash/avif')
      const decoded = await decode(buffer)
      if (!decoded) throw new Error('Failed to decode AVIF')
      imageData = decoded
      break
    }
    case 'jxl': {
      const { decode } = await import('@jsquash/jxl')
      imageData = await decode(buffer)
      break
    }
    case 'qoi': {
      const { decode } = await import('@jsquash/qoi')
      imageData = await decode(buffer)
      break
    }
    default:
      imageData = await decodeViaCanvas(buffer)
  }

  return orientImageDataFromExif(imageData, buffer)
}

async function decodeViaCanvas(buffer: ArrayBuffer): Promise<ImageData> {
  const blob = new Blob([buffer])
  const bitmap = await createImageBitmap(blob, { imageOrientation: 'none' })
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()
  return ctx.getImageData(0, 0, canvas.width, canvas.height)
}

async function applyResize(
  imageData: ImageData,
  resize: PipelineConfig['resize'],
): Promise<ImageData> {
  const normalized = normalizeResizeConfig(resize as PipelineConfig['resize'] & Record<string, unknown>)
  const { width: targetW, height: targetH, fitMethod, skipped } = computeTargetSize(
    imageData.width,
    imageData.height,
    normalized,
  )

  if (skipped || (targetW === imageData.width && targetH === imageData.height)) {
    return imageData
  }

  const { default: resizeFn } = await import('@jsquash/resize')
  return resizeFn(imageData, {
    width: targetW,
    height: targetH,
    method: normalized.method,
    fitMethod,
    premultiply: normalized.premultiply,
    linearRGB: normalized.linearRGB,
  })
}

async function bufferToDisplayPreview(
  buffer: ArrayBuffer,
  format: InputFormat,
): Promise<{ previewBuffer: ArrayBuffer; width: number; height: number }> {
  const imageData = await decodeToImageData(buffer, format)
  const { encode: encodePng } = await import('@jsquash/png')
  const previewBuffer = await encodePng(imageData)
  return { previewBuffer, width: imageData.width, height: imageData.height }
}

async function createInputPreview(
  request: WorkerPreviewRequest,
): Promise<WorkerResponse & { type: 'preview-result' }> {
  const { id, buffer, format } = request
  const { previewBuffer, width, height } = await bufferToDisplayPreview(buffer, format)
  return { type: 'preview-result', id, previewBuffer, width, height }
}

async function encodeImage(
  imageData: ImageData,
  pipeline: PipelineConfig,
): Promise<{ buffer: ArrayBuffer; mimeType: string }> {
  const { outputFormat, encode } = pipeline

  switch (outputFormat) {
    case 'jpeg': {
      const { encode: encodeJpeg } = await import('@jsquash/jpeg')
      const buffer = await encodeJpeg(
        imageData,
        encode.format === 'jpeg' ? toMozJpegWasmOptions(encode.options) : {},
      )
      return { buffer, mimeType: 'image/jpeg' }
    }
    case 'webp': {
      const { encode: encodeWebp } = await import('@jsquash/webp')
      const buffer = await encodeWebp(imageData, encode.format === 'webp' ? encode.options : {})
      return { buffer, mimeType: 'image/webp' }
    }
    case 'avif': {
      const { encode: encodeAvif } = await import('@jsquash/avif')
      const opts = encode.format === 'avif' ? encode.options : {}
      const buffer = await encodeAvif(imageData, opts)
      return { buffer, mimeType: 'image/avif' }
    }
    case 'png': {
      const { optimise } = await import('@jsquash/oxipng')
      const opts = encode.format === 'png' ? encode.options : { level: 2 }
      const buffer = await optimise(imageData, opts)
      return { buffer, mimeType: 'image/png' }
    }
    case 'jxl': {
      const { encode: encodeJxl } = await import('@jsquash/jxl')
      const buffer = await encodeJxl(imageData, encode.format === 'jxl' ? encode.options : {})
      return { buffer, mimeType: 'image/jxl' }
    }
    case 'qoi': {
      const { encode: encodeQoi } = await import('@jsquash/qoi')
      const buffer = await encodeQoi(imageData)
      return { buffer, mimeType: 'image/qoi' }
    }
    default:
      throw new Error(`Unsupported output format: ${outputFormat}`)
  }
}

async function processImage(
  request: WorkerProcessRequest,
): Promise<WorkerResponse & { type: 'result' }> {
  const { id, buffer, fileName, inputFormat, pipeline } = request
  const originalSize = buffer.byteLength

  postProgress(id, 10, 'Decoding')
  let imageData = await decodeToImageData(buffer, inputFormat)
  const originalWidth = imageData.width
  const originalHeight = imageData.height

  if (pipeline.rotate !== 0 || pipeline.flip.horizontal || pipeline.flip.vertical) {
    postProgress(id, 25, 'Rotating')
    imageData = applyRotateFlip(imageData, pipeline.rotate, pipeline.flip)
  }

  if (pipeline.filters.enabled) {
    postProgress(id, 40, 'Applying filters')
    imageData = applyFilters(imageData, pipeline.filters)
  }

  if (pipeline.crop.enabled) {
    postProgress(id, 55, 'Cropping')
    imageData = applyCrop(imageData, pipeline.crop)
  }

  if (pipeline.resize.enabled) {
    postProgress(id, 65, 'Resizing')
    imageData = await applyResize(imageData, pipeline.resize)
  }

  postProgress(id, 80, 'Encoding')

  let outputBuffer: ArrayBuffer
  let mimeType: string
  let outputWidth = imageData.width
  let outputHeight = imageData.height
  let sizeBudgetStats: WorkerProcessResponse['stats']['sizeBudget']

  if (pipeline.sizeBudget.enabled && isSizeBudgetSupported(pipeline)) {
    postProgress(id, 82, 'Size budget')
    const budgetResult = await encodeToSizeBudget(imageData, pipeline, (fraction) => {
      postProgress(id, 82 + Math.round(fraction * 16), 'Size budget')
    })
    outputBuffer = budgetResult.buffer
    mimeType = budgetResult.mimeType
    outputWidth = budgetResult.outputWidth
    outputHeight = budgetResult.outputHeight
    sizeBudgetStats = {
      targetBytes: budgetResult.targetBytes,
      met: budgetResult.met,
      appliedQuality: budgetResult.quality,
      appliedScale: budgetResult.scale,
    }
  } else {
    const encoded = await encodeImage(imageData, pipeline)
    outputBuffer = encoded.buffer
    mimeType = encoded.mimeType
  }

  postProgress(id, 100, 'Done')

  const outputSize = outputBuffer.byteLength
  const savingsPercent =
    originalSize > 0 ? ((originalSize - outputSize) / originalSize) * 100 : 0

  const outputName = formatOutputFilename(
    fileName,
    pipeline.filenamePattern,
    pipeline.outputFormat,
  )

  let previewBuffer: ArrayBuffer | undefined
  if (needsWasmPreview(pipeline.outputFormat)) {
    postProgress(id, 98, 'Preview')
    const preview = await bufferToDisplayPreview(outputBuffer, pipeline.outputFormat)
    previewBuffer = preview.previewBuffer
  }

  return {
    type: 'result',
    id,
    buffer: outputBuffer,
    mimeType,
    outputName,
    previewBuffer,
    previewMimeType: previewBuffer ? PREVIEW_MIME_TYPE : undefined,
    stats: {
      originalSize,
      outputSize,
      originalWidth,
      originalHeight,
      outputWidth,
      outputHeight,
      savingsPercent,
      sizeBudget: sizeBudgetStats,
    },
  }
}

self.addEventListener('message', async (event: MessageEvent<WorkerInboundMessage>) => {
  const request = event.data

  try {
    if (request.type === 'preview') {
      const result = await createInputPreview(request)
      self.postMessage(result, { transfer: [result.previewBuffer] })
      return
    }

    if (request.type !== 'process') return

    const result = await processImage(request)
    const transferables = [result.buffer]
    if (result.previewBuffer) transferables.push(result.previewBuffer)
    self.postMessage(result, { transfer: transferables })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Processing failed'
    self.postMessage({ type: 'error', id: request.id, message } satisfies WorkerResponse)
  }
})

export {}
