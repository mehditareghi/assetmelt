import type { CropConfig, PipelineConfig } from '@/lib/schemas/pipeline-schema'
import { clampCrop, mergeCropRect } from '@/lib/image/crop-math'
import {
  getCropSpaceDimensions,
  hasPreCropAdjustments,
} from '@/lib/image/transform-space'
import { hasActiveFilters } from '@/lib/image/image-transforms'

export function isFullImageCrop(
  crop: CropConfig,
  cropSpaceWidth: number,
  cropSpaceHeight: number,
): boolean {
  if (!crop.enabled) return true
  return (
    crop.x <= 0 &&
    crop.y <= 0 &&
    crop.width >= cropSpaceWidth &&
    crop.height >= cropSpaceHeight
  )
}

export function getCropSpaceSize(
  sourceWidth: number,
  sourceHeight: number,
  rotate: PipelineConfig['rotate'],
): { width: number; height: number } {
  return getCropSpaceDimensions(sourceWidth, sourceHeight, rotate)
}

/** Map crop rect from source pixels to a (possibly downscaled) ImageData bitmap. */
export function scaleCropToImageData(
  crop: CropConfig,
  sourceWidth: number,
  sourceHeight: number,
  dataWidth: number,
  dataHeight: number,
): CropConfig {
  if (!crop.enabled || sourceWidth <= 0 || sourceHeight <= 0) return crop
  const scaleX = dataWidth / sourceWidth
  const scaleY = dataHeight / sourceHeight
  const rect = clampCrop(
    {
      x: Math.round(crop.x * scaleX),
      y: Math.round(crop.y * scaleY),
      width: Math.max(1, Math.round(crop.width * scaleX)),
      height: Math.max(1, Math.round(crop.height * scaleY)),
    },
    dataWidth,
    dataHeight,
  )
  return mergeCropRect(crop, rect)
}

/** True when the preview should run the transform pipeline (not just show the source file). */
export function needsPipelinePreview(
  pipeline: PipelineConfig,
  sourceWidth?: number,
  sourceHeight?: number,
): boolean {
  if (hasPreCropAdjustments(pipeline)) return true
  if (hasActiveFilters(pipeline.filters)) return true
  if (!pipeline.crop.enabled) return false
  if (sourceWidth == null || sourceHeight == null) return true
  const cropSpace = getCropSpaceDimensions(sourceWidth, sourceHeight, pipeline.rotate)
  return !isFullImageCrop(pipeline.crop, cropSpace.width, cropSpace.height)
}

/** True when crop editing should render rotate/flip/filters before showing handles. */
export function needsPreCropPreview(pipeline: PipelineConfig): boolean {
  return hasPreCropAdjustments(pipeline)
}
