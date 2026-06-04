import type { PipelineConfig } from '@/lib/schemas/pipeline-schema'
import { applyCrop } from '@/lib/image/image-transforms'
import { applyPreCropTransforms, getCropSpaceDimensions } from '@/lib/image/transform-space'
import {
  needsPipelinePreview,
  needsPreCropPreview,
  scaleCropToImageData,
} from '@/lib/image/pipeline-preview'

const PREVIEW_MAX_DIMENSION = 2048

export interface VisualPreviewResult {
  url: string
  width: number
  height: number
}

export { needsPipelinePreview, needsPreCropPreview }

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load preview image'))
    img.src = url
  })
}

function imageToImageData(img: HTMLImageElement, maxDimension: number): ImageData {
  const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight))
  const width = Math.max(1, Math.round(img.naturalWidth * scale))
  const height = Math.max(1, Math.round(img.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, width, height)
  return ctx.getImageData(0, 0, width, height)
}

function imageDataToObjectUrl(imageData: ImageData): string {
  const canvas = document.createElement('canvas')
  canvas.width = imageData.width
  canvas.height = imageData.height
  canvas.getContext('2d')!.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
}

export async function renderPreCropPreview(
  imageUrl: string,
  pipeline: PipelineConfig,
  _sourceWidth?: number,
  _sourceHeight?: number,
): Promise<VisualPreviewResult> {
  const img = await loadImage(imageUrl)
  let imageData = imageToImageData(img, PREVIEW_MAX_DIMENSION)
  imageData = applyPreCropTransforms(imageData, pipeline)

  return {
    url: imageDataToObjectUrl(imageData),
    width: imageData.width,
    height: imageData.height,
  }
}

export async function renderVisualPreview(
  imageUrl: string,
  pipeline: PipelineConfig,
  sourceWidth?: number,
  sourceHeight?: number,
): Promise<VisualPreviewResult> {
  const img = await loadImage(imageUrl)
  const srcW = sourceWidth ?? img.naturalWidth
  const srcH = sourceHeight ?? img.naturalHeight

  let imageData = imageToImageData(img, PREVIEW_MAX_DIMENSION)
  const cropSpace = getCropSpaceDimensions(srcW, srcH, pipeline.rotate)

  imageData = applyPreCropTransforms(imageData, pipeline)

  if (pipeline.crop.enabled) {
    const scaledCrop = scaleCropToImageData(
      pipeline.crop,
      cropSpace.width,
      cropSpace.height,
      imageData.width,
      imageData.height,
    )
    imageData = applyCrop(imageData, scaledCrop)
  }

  return {
    url: imageDataToObjectUrl(imageData),
    width: imageData.width,
    height: imageData.height,
  }
}
