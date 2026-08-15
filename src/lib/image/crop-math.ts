import type { CropAspectRatio, CropConfig } from '@/lib/schemas/pipeline-schema'

export interface CropRect {
  x: number
  y: number
  width: number
  height: number
}

export interface DisplayRect {
  x: number
  y: number
  width: number
  height: number
}

export type CropHandle = 'move' | 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se'

export const CROP_ASPECT_PRESETS: Array<{ value: CropAspectRatio; label: string }> = [
  { value: 'free', label: 'Free' },
  { value: '1:1', label: '1:1' },
  { value: '4:3', label: '4:3' },
  { value: '4:5', label: '4:5' },
  { value: '3:2', label: '3:2' },
  { value: '16:9', label: '16:9' },
  { value: '2:1', label: '2:1' },
  { value: '40:21', label: 'OG (1.91:1)' },
  { value: '3:4', label: '3:4' },
  { value: '2:3', label: '2:3' },
  { value: '9:16', label: '9:16' },
  { value: '6:13', label: 'iPhone (6.9")' },
]

export function parseAspectRatio(aspectRatio: CropAspectRatio): number | null {
  switch (aspectRatio) {
    case 'free':
      return null
    case '1:1':
      return 1
    case '4:3':
      return 4 / 3
    case '4:5':
      return 4 / 5
    case '3:2':
      return 3 / 2
    case '16:9':
      return 16 / 9
    case '2:1':
      return 2
    case '40:21':
      return 40 / 21
    case '3:4':
      return 3 / 4
    case '2:3':
      return 2 / 3
    case '9:16':
      return 9 / 16
    case '6:13':
      return 6 / 13
    default:
      return null
  }
}

export function getObjectContainRect(
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number,
): DisplayRect {
  if (
    containerWidth <= 0 ||
    containerHeight <= 0 ||
    imageWidth <= 0 ||
    imageHeight <= 0
  ) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }

  const scale = Math.min(containerWidth / imageWidth, containerHeight / imageHeight)
  const width = imageWidth * scale
  const height = imageHeight * scale

  return {
    x: (containerWidth - width) / 2,
    y: (containerHeight - height) / 2,
    width,
    height,
  }
}

export function clampCrop(crop: CropRect, sourceWidth: number, sourceHeight: number): CropRect {
  let width = Math.max(1, Math.round(crop.width))
  let height = Math.max(1, Math.round(crop.height))
  width = Math.min(width, sourceWidth)
  height = Math.min(height, sourceHeight)

  let x = Math.round(crop.x)
  let y = Math.round(crop.y)
  x = Math.max(0, Math.min(x, sourceWidth - width))
  y = Math.max(0, Math.min(y, sourceHeight - height))

  return { x, y, width, height }
}

/** Clamp a resize while keeping the handle's anchor edge(s) fixed. */
function clampCropFromHandle(
  left: number,
  top: number,
  right: number,
  bottom: number,
  handle: CropHandle,
  start: CropRect,
  sourceWidth: number,
  sourceHeight: number,
): CropRect {
  if (right - left < 1) {
    if (handle.includes('w')) left = right - 1
    else right = left + 1
  }
  if (bottom - top < 1) {
    if (handle.includes('n')) top = bottom - 1
    else bottom = top + 1
  }

  const anchorLeft = start.x
  const anchorTop = start.y
  const anchorRight = start.x + start.width
  const anchorBottom = start.y + start.height

  switch (handle) {
    case 'e':
      left = anchorLeft
      right = Math.min(Math.max(right, left + 1), sourceWidth)
      break
    case 'w':
      right = anchorRight
      left = Math.max(Math.min(left, right - 1), 0)
      break
    case 's':
      top = anchorTop
      bottom = Math.min(Math.max(bottom, top + 1), sourceHeight)
      break
    case 'n':
      bottom = anchorBottom
      top = Math.max(Math.min(top, bottom - 1), 0)
      break
    case 'se':
      left = anchorLeft
      top = anchorTop
      right = Math.min(Math.max(right, left + 1), sourceWidth)
      bottom = Math.min(Math.max(bottom, top + 1), sourceHeight)
      break
    case 'sw':
      right = anchorRight
      top = anchorTop
      left = Math.max(Math.min(left, right - 1), 0)
      bottom = Math.min(Math.max(bottom, top + 1), sourceHeight)
      break
    case 'ne':
      left = anchorLeft
      bottom = anchorBottom
      right = Math.min(Math.max(right, left + 1), sourceWidth)
      top = Math.max(Math.min(top, bottom - 1), 0)
      break
    case 'nw':
      right = anchorRight
      bottom = anchorBottom
      left = Math.max(Math.min(left, right - 1), 0)
      top = Math.max(Math.min(top, bottom - 1), 0)
      break
  }

  return {
    x: Math.round(left),
    y: Math.round(top),
    width: Math.max(1, Math.round(right - left)),
    height: Math.max(1, Math.round(bottom - top)),
  }
}

/** Largest width/height with a fixed ratio that fits in the given bounds. */
function maxCropSizeForRatio(
  maxWidth: number,
  maxHeight: number,
  ratio: number,
): { width: number; height: number } {
  if (maxWidth / maxHeight >= ratio) {
    return { width: maxHeight * ratio, height: maxHeight }
  }
  return { width: maxWidth, height: maxWidth / ratio }
}

function clampCropSizeWithRatio(
  width: number,
  maxWidth: number,
  maxHeight: number,
  ratio: number,
): { width: number; height: number } {
  const desiredWidth = Math.max(1, width)
  const { width: limitWidth, height: limitHeight } = maxCropSizeForRatio(
    maxWidth,
    maxHeight,
    ratio,
  )
  const clampedWidth = Math.min(desiredWidth, limitWidth)
  const roundedWidth = Math.max(1, Math.round(clampedWidth))
  const roundedHeight = Math.max(1, Math.round(roundedWidth / ratio))

  return {
    width: roundedWidth,
    height: Math.min(roundedHeight, Math.round(limitHeight)),
  }
}

export function cropToDisplay(
  crop: CropRect,
  imageRect: DisplayRect,
  sourceWidth: number,
  sourceHeight: number,
): DisplayRect {
  if (imageRect.width <= 0 || imageRect.height <= 0) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }

  const scaleX = imageRect.width / sourceWidth
  const scaleY = imageRect.height / sourceHeight

  return {
    x: imageRect.x + crop.x * scaleX,
    y: imageRect.y + crop.y * scaleY,
    width: crop.width * scaleX,
    height: crop.height * scaleY,
  }
}

export function displayToCrop(
  display: DisplayRect,
  imageRect: DisplayRect,
  sourceWidth: number,
  sourceHeight: number,
): CropRect {
  const scaleX = sourceWidth / imageRect.width
  const scaleY = sourceHeight / imageRect.height

  return clampCrop(
    {
      x: (display.x - imageRect.x) * scaleX,
      y: (display.y - imageRect.y) * scaleY,
      width: display.width * scaleX,
      height: display.height * scaleY,
    },
    sourceWidth,
    sourceHeight,
  )
}

export function detectAspectRatioFromRect(width: number, height: number): CropAspectRatio {
  if (width <= 0 || height <= 0) return 'free'

  const ratio = width / height
  for (const preset of CROP_ASPECT_PRESETS) {
    if (preset.value === 'free') continue
    const target = parseAspectRatio(preset.value)!
    if (Math.abs(ratio - target) < 0.005) return preset.value
  }

  return 'free'
}

export function createFullImageCrop(sourceWidth: number, sourceHeight: number): CropConfig {
  return {
    enabled: true,
    aspectRatio: detectAspectRatioFromRect(sourceWidth, sourceHeight),
    x: 0,
    y: 0,
    width: sourceWidth,
    height: sourceHeight,
  }
}

export function createDefaultCrop(
  sourceWidth: number,
  sourceHeight: number,
  aspectRatio: CropAspectRatio,
): CropRect {
  const ratio = parseAspectRatio(aspectRatio)
  if (ratio == null) {
    return { x: 0, y: 0, width: sourceWidth, height: sourceHeight }
  }

  const size = maxCropSizeForRatio(sourceWidth, sourceHeight, ratio)
  return {
    x: Math.round((sourceWidth - size.width) / 2),
    y: Math.round((sourceHeight - size.height) / 2),
    width: Math.round(size.width),
    height: Math.round(size.height),
  }
}

export function applyAspectRatioToCrop(
  crop: CropRect,
  aspectRatio: CropAspectRatio,
  sourceWidth: number,
  sourceHeight: number,
): CropRect {
  const ratio = parseAspectRatio(aspectRatio)
  if (ratio == null) return clampCrop(crop, sourceWidth, sourceHeight)

  const centerX = crop.x + crop.width / 2
  const centerY = crop.y + crop.height / 2
  const { width, height } = maxCropSizeForRatio(sourceWidth, sourceHeight, ratio)

  return {
    x: Math.round(Math.max(0, Math.min(centerX - width / 2, sourceWidth - width))),
    y: Math.round(Math.max(0, Math.min(centerY - height / 2, sourceHeight - height))),
    width: Math.round(width),
    height: Math.round(height),
  }
}

export function resizeCropFromHandle(
  start: CropRect,
  handle: CropHandle,
  deltaX: number,
  deltaY: number,
  aspectRatio: CropAspectRatio,
  sourceWidth: number,
  sourceHeight: number,
): CropRect {
  const ratio = parseAspectRatio(aspectRatio)

  if (handle === 'move') {
    return clampCrop(
      {
        x: start.x + deltaX,
        y: start.y + deltaY,
        width: start.width,
        height: start.height,
      },
      sourceWidth,
      sourceHeight,
    )
  }

  const isCorner =
    handle === 'nw' || handle === 'ne' || handle === 'sw' || handle === 'se'

  if (ratio != null && isCorner) {
    switch (handle) {
      case 'se': {
        const size = clampCropSizeWithRatio(
          start.width + deltaX,
          sourceWidth - start.x,
          sourceHeight - start.y,
          ratio,
        )
        return { x: start.x, y: start.y, ...size }
      }
      case 'nw': {
        const brx = start.x + start.width
        const bry = start.y + start.height
        const size = clampCropSizeWithRatio(
          start.width - deltaX,
          brx,
          bry,
          ratio,
        )
        return {
          x: brx - size.width,
          y: bry - size.height,
          ...size,
        }
      }
      case 'ne': {
        const bry = start.y + start.height
        const size = clampCropSizeWithRatio(
          start.width + deltaX,
          sourceWidth - start.x,
          bry,
          ratio,
        )
        return { x: start.x, y: bry - size.height, ...size }
      }
      case 'sw': {
        const brx = start.x + start.width
        const size = clampCropSizeWithRatio(
          start.width - deltaX,
          brx,
          sourceHeight - start.y,
          ratio,
        )
        return { x: brx - size.width, y: start.y, ...size }
      }
    }
  }

  let left = start.x
  let top = start.y
  let right = start.x + start.width
  let bottom = start.y + start.height

  switch (handle) {
    case 'nw':
      left += deltaX
      top += deltaY
      break
    case 'n':
      top += deltaY
      break
    case 'ne':
      right += deltaX
      top += deltaY
      break
    case 'e':
      right += deltaX
      break
    case 'se':
      right += deltaX
      bottom += deltaY
      break
    case 's':
      bottom += deltaY
      break
    case 'sw':
      left += deltaX
      bottom += deltaY
      break
    case 'w':
      left += deltaX
      break
  }

  return clampCropFromHandle(
    left,
    top,
    right,
    bottom,
    handle,
    start,
    sourceWidth,
    sourceHeight,
  )
}

export function cropConfigToRect(crop: CropConfig): CropRect {
  return { x: crop.x, y: crop.y, width: crop.width, height: crop.height }
}

export function mergeCropRect(
  crop: CropConfig,
  rect: CropRect,
  lockAspectRatio?: CropAspectRatio,
): CropConfig {
  const detected = detectAspectRatioFromRect(rect.width, rect.height)
  const aspectRatio =
    lockAspectRatio && lockAspectRatio !== 'free' ? lockAspectRatio : detected

  return {
    ...crop,
    ...rect,
    aspectRatio,
  }
}

export function normalizeCropInput(
  crop: CropConfig,
  sourceWidth: number,
  sourceHeight: number,
): CropConfig {
  const rect = clampCrop(cropConfigToRect(crop), sourceWidth, sourceHeight)
  return mergeCropRect(crop, rect)
}
