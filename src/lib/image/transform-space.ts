import type { PipelineConfig } from '@/lib/schemas/pipeline-schema'
import {
  applyCrop,
  applyFilters,
  applyRotateFlip,
  hasActiveFilters,
  hasRotateOrFlip,
} from '@/lib/image/image-transforms'

/** Dimensions of the image as seen before crop (after rotate / flip). */
export function getCropSpaceDimensions(
  sourceWidth: number,
  sourceHeight: number,
  rotate: PipelineConfig['rotate'],
): { width: number; height: number } {
  if (rotate === 90 || rotate === 270) {
    return { width: sourceHeight, height: sourceWidth }
  }
  return { width: sourceWidth, height: sourceHeight }
}

/** Rotate → flip → filters (what the user sees before drawing a crop). */
export function applyPreCropTransforms(
  imageData: ImageData,
  pipeline: PipelineConfig,
): ImageData {
  let data = imageData
  if (hasRotateOrFlip(pipeline)) {
    data = applyRotateFlip(data, pipeline.rotate, pipeline.flip)
  }
  if (pipeline.filters.enabled) {
    data = applyFilters(data, pipeline.filters)
  }
  return data
}

/** Full studio preview: pre-crop transforms, then crop. */
export function applyVisualPreviewTransforms(
  imageData: ImageData,
  pipeline: PipelineConfig,
): ImageData {
  let data = applyPreCropTransforms(imageData, pipeline)
  if (pipeline.crop.enabled) {
    data = applyCrop(data, pipeline.crop)
  }
  return data
}

export function hasPreCropAdjustments(pipeline: PipelineConfig): boolean {
  return hasRotateOrFlip(pipeline) || hasActiveFilters(pipeline.filters)
}
