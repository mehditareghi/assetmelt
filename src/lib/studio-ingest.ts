import { toast } from 'sonner'
import {
  collectDroppedImages,
  normalizeIncomingImages,
  type IncomingImage,
} from '@/lib/image/folder-drop'
import { useStudioStore } from '@/stores/studio-store'

export async function ingestIncomingImages(
  files: FileList | File[] | IncomingImage[],
): Promise<number> {
  const incoming = normalizeIncomingImages(files)
  if (incoming.length === 0) {
    toast.error('No supported images in that selection')
    return 0
  }
  await useStudioStore.getState().addFiles(incoming)
  return incoming.length
}

export async function ingestDroppedImages(dataTransfer: DataTransfer): Promise<number> {
  const { images, skipped } = await collectDroppedImages(dataTransfer)
  if (images.length === 0) {
    toast.error(
      skipped > 0
        ? 'That drop had no supported images'
        : 'Drop image files or a folder of images',
    )
    return 0
  }
  await useStudioStore.getState().addFiles(images)
  if (skipped > 0) {
    toast.message(
      `Queued ${images.length} image${images.length === 1 ? '' : 's'} · skipped ${skipped} other file${skipped === 1 ? '' : 's'}`,
    )
  }
  return images.length
}
