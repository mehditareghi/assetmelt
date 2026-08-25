import type { InputFormat } from '@/lib/image/format-detection'

const HEIC_MIME_PREFIXES = ['image/heic', 'image/heif'] as const

export function isHeicFormat(format: InputFormat): boolean {
  return format === 'heic'
}

export function isHeicMimeType(mime: string): boolean {
  const normalized = mime.toLowerCase()
  return HEIC_MIME_PREFIXES.some((prefix) => normalized.startsWith(prefix))
}

export function isHeicFileName(fileName: string): boolean {
  return /\.(heic|heif)$/i.test(fileName)
}

export function looksLikeHeic(
  format: InputFormat,
  file: Pick<File, 'name' | 'type'>,
): boolean {
  return (
    isHeicFormat(format) || isHeicMimeType(file.type) || isHeicFileName(file.name)
  )
}

async function isHeicBlob(file: File): Promise<boolean> {
  const { isHeic } = await import('heic-to')
  return isHeic(file)
}

export async function resolveHeicInputFormat(
  file: File,
  detectedFormat: InputFormat,
): Promise<InputFormat> {
  if (isHeicFormat(detectedFormat) || looksLikeHeic(detectedFormat, file)) {
    return 'heic'
  }
  if (detectedFormat === 'unknown' && (await isHeicBlob(file))) {
    return 'heic'
  }
  return detectedFormat
}

function imageBitmapToImageData(bitmap: ImageBitmap): ImageData {
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Could not create canvas context for HEIC decode')
  }
  ctx.drawImage(bitmap, 0, 0)
  return ctx.getImageData(0, 0, bitmap.width, bitmap.height)
}

/**
 * Decode HEIC/HEIF to ImageData via libheif (heic-to bitmap path).
 * No JPEG intermediate — HEIC→PNG/AVIF is not pre-lossy from decode.
 */
export async function decodeHeic(buffer: ArrayBuffer): Promise<ImageData> {
  const { heicTo } = await import('heic-to')
  try {
    const blob = new Blob([buffer], { type: 'image/heic' })
    const bitmap = await heicTo({ blob, type: 'bitmap' })
    try {
      return imageBitmapToImageData(bitmap)
    } finally {
      bitmap.close()
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Could not decode HEIC image: ${detail}`, { cause: error })
  }
}

/**
 * Resolve HEIC input format without converting the file.
 * HEIC bytes stay intact until the worker decodes them to ImageData.
 */
export async function prepareFileForProcessing(
  file: File,
  inputFormat: InputFormat,
): Promise<{ file: File; inputFormat: InputFormat; sourceByteSize?: number }> {
  const resolvedFormat = await resolveHeicInputFormat(file, inputFormat)
  return { file, inputFormat: resolvedFormat }
}
