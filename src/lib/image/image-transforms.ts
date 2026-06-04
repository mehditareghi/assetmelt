import type { CropConfig, FiltersConfig, PipelineConfig } from '@/lib/schemas/pipeline-schema'

export function hasRotateOrFlip(pipeline: Pick<PipelineConfig, 'rotate' | 'flip'>): boolean {
  return pipeline.rotate !== 0 || pipeline.flip.horizontal || pipeline.flip.vertical
}

export function hasActiveFilters(filters: FiltersConfig): boolean {
  if (!filters.enabled) return false
  return (
    filters.brightness !== 0 ||
    filters.contrast !== 0 ||
    filters.saturation !== 0 ||
    filters.grayscale ||
    filters.sharpen > 0
  )
}

/** @deprecated Use needsPipelinePreview from pipeline-preview.ts */
export function needsVisualPreview(pipeline: PipelineConfig): boolean {
  if (hasRotateOrFlip(pipeline)) return true
  if (hasActiveFilters(pipeline.filters)) return true
  if (pipeline.crop.enabled) return true
  return false
}

export function applyCrop(imageData: ImageData, crop: CropConfig): ImageData {
  const canvas = imageDataToCanvas(imageData)
  const cropped = getTransformContext(canvas).getImageData(
    crop.x,
    crop.y,
    crop.width,
    crop.height,
  )
  const out = createCanvas(crop.width, crop.height)
  getTransformContext(out).putImageData(cropped, 0, 0)
  return canvasToImageData(out)
}

export function applyRotateFlip(
  imageData: ImageData,
  rotate: PipelineConfig['rotate'],
  flip: PipelineConfig['flip'],
): ImageData {
  const src = imageDataToCanvas(imageData)
  const swap = rotate === 90 || rotate === 270
  const w = swap ? src.height : src.width
  const h = swap ? src.width : src.height
  const canvas = createCanvas(w, h)
  const ctx = getTransformContext(canvas)

  ctx.translate(w / 2, h / 2)
  ctx.rotate((rotate * Math.PI) / 180)
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1)
  ctx.drawImage(src as unknown as CanvasImageSource, -src.width / 2, -src.height / 2)

  return canvasToImageData(canvas)
}

export function applyFilters(imageData: ImageData, filters: FiltersConfig): ImageData {
  const data = new Uint8ClampedArray(imageData.data)
  const { brightness, contrast, saturation, grayscale, sharpen } = filters

  const brightnessFactor = (brightness / 100) * 255
  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast))

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i]
    let g = data[i + 1]
    let b = data[i + 2]

    if (filters.enabled) {
      if (grayscale) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b
        r = g = b = gray
      }

      if (saturation !== 0) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b
        const sat = 1 + saturation / 100
        r = gray + sat * (r - gray)
        g = gray + sat * (g - gray)
        b = gray + sat * (b - gray)
      }

      r = contrastFactor * (r - 128) + 128 + brightnessFactor
      g = contrastFactor * (g - 128) + 128 + brightnessFactor
      b = contrastFactor * (b - 128) + 128 + brightnessFactor

      data[i] = Math.max(0, Math.min(255, r))
      data[i + 1] = Math.max(0, Math.min(255, g))
      data[i + 2] = Math.max(0, Math.min(255, b))
    }
  }

  let result = new ImageData(data, imageData.width, imageData.height)

  if (filters.enabled && sharpen > 0) {
    result = applySharpen(result, sharpen / 100)
  }

  return result
}

export function applySharpen(imageData: ImageData, amount: number): ImageData {
  const w = imageData.width
  const h = imageData.height
  const src = imageData.data
  const out = new Uint8ClampedArray(src.length)
  const kernel = [0, -amount, 0, -amount, 1 + 4 * amount, -amount, 0, -amount, 0]

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0
        let ki = 0
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * w + (x + kx)) * 4 + c
            sum += src[idx] * kernel[ki++]
          }
        }
        out[(y * w + x) * 4 + c] = Math.max(0, Math.min(255, sum))
      }
      out[(y * w + x) * 4 + 3] = src[(y * w + x) * 4 + 3]
    }
  }

  return new ImageData(out, w, h)
}

export {
  applyPreCropTransforms,
  applyVisualPreviewTransforms,
  getCropSpaceDimensions,
  hasPreCropAdjustments,
} from '@/lib/image/transform-space'

type TransformCanvas = OffscreenCanvas | HTMLCanvasElement
type TransformContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

function createCanvas(width: number, height: number): TransformCanvas {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height)
  }
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

function getTransformContext(canvas: TransformCanvas): TransformContext {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas context unavailable')
  return ctx as TransformContext
}

function imageDataToCanvas(imageData: ImageData): TransformCanvas {
  const canvas = createCanvas(imageData.width, imageData.height)
  getTransformContext(canvas).putImageData(imageData, 0, 0)
  return canvas
}

function canvasToImageData(canvas: TransformCanvas): ImageData {
  const ctx = getTransformContext(canvas)
  return ctx.getImageData(0, 0, canvas.width, canvas.height)
}
