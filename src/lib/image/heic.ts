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

export async function convertHeicToJpeg(file: File): Promise<{ blob: Blob; name: string }> {
  const { heicTo } = await import('heic-to')
  try {
    const blob = await heicTo({
      blob: file,
      type: 'image/jpeg',
      quality: 0.92,
    })
    const name = file.name.replace(/\.(heic|heif)$/i, '.jpg')
    return { blob, name }
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Could not decode HEIC image: ${detail}`, { cause: error })
  }
}

export async function prepareFileForProcessing(
  file: File,
  inputFormat: InputFormat,
): Promise<{ file: File; inputFormat: InputFormat; sourceByteSize?: number }> {
  const resolvedFormat = await resolveHeicInputFormat(file, inputFormat)
  if (!isHeicFormat(resolvedFormat)) {
    return { file, inputFormat: resolvedFormat }
  }

  const sourceByteSize = file.size
  const { blob, name } = await convertHeicToJpeg(file)
  return {
    file: new File([blob], name, { type: 'image/jpeg' }),
    inputFormat: 'jpeg',
    sourceByteSize,
  }
}
