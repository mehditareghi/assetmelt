import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ingestDroppedImages } from '@/lib/studio-ingest'
import { useStudioStore } from '@/stores/studio-store'

function transferHasFiles(event: DragEvent): boolean {
  return Boolean(event.dataTransfer?.types?.includes('Files'))
}

/**
 * Accept file/folder drops anywhere in Studio, including when a queue already exists.
 * Prevents the browser from navigating to the dropped folder.
 */
export function useStudioExternalDrop(): boolean {
  const [active, setActive] = useState(false)

  useEffect(() => {
    let depth = 0

    const onDragEnter = (event: DragEvent) => {
      if (!transferHasFiles(event)) return
      depth += 1
      setActive(true)
    }

    const onDragLeave = (event: DragEvent) => {
      if (!transferHasFiles(event)) return
      depth = Math.max(0, depth - 1)
      if (depth === 0) setActive(false)
    }

    const onDragOver = (event: DragEvent) => {
      if (!transferHasFiles(event)) return
      event.preventDefault()
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
    }

    const onDrop = (event: DragEvent) => {
      if (!transferHasFiles(event) || !event.dataTransfer) return
      event.preventDefault()
      depth = 0
      setActive(false)

      const { isCropEditing } = useStudioStore.getState()
      if (isCropEditing) {
        toast.error('Finish crop before adding more images')
        return
      }

      void ingestDroppedImages(event.dataTransfer)
    }

    window.addEventListener('dragenter', onDragEnter)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('dragover', onDragOver)
    window.addEventListener('drop', onDrop)
    return () => {
      window.removeEventListener('dragenter', onDragEnter)
      window.removeEventListener('dragleave', onDragLeave)
      window.removeEventListener('dragover', onDragOver)
      window.removeEventListener('drop', onDrop)
    }
  }, [])

  return active
}
