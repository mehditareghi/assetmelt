import { isImageFile } from '@/lib/image/format-detection'

const MIME_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/bmp': 'bmp',
  'image/svg+xml': 'svg',
  'image/heic': 'heic',
  'image/heif': 'heif',
}

function pastedImageFilename(mimeType: string, index: number): string {
  const ext = MIME_EXTENSION[mimeType.toLowerCase()] ?? 'png'
  const suffix = index > 0 ? `-${index + 1}` : ''
  return `pasted-image${suffix}.${ext}`
}

function needsGeneratedName(name: string): boolean {
  const trimmed = name.trim()
  return trimmed === '' || trimmed === 'image.png' || trimmed === 'blob'
}

export function isEditablePasteTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  )
}

export function filesFromClipboardEvent(event: ClipboardEvent): File[] {
  const data = event.clipboardData
  if (!data) return []

  const files: File[] = []
  let imageIndex = 0

  for (const item of data.items) {
    if (item.kind !== 'file') continue
    const file = item.getAsFile()
    if (!file || !isImageFile(file)) continue

    if (needsGeneratedName(file.name)) {
      files.push(
        new File([file], pastedImageFilename(file.type, imageIndex++), {
          type: file.type,
          lastModified: file.lastModified,
        }),
      )
    } else {
      files.push(file)
      imageIndex++
    }
  }

  return files
}
