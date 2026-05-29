import { useCallback, useState } from 'react'
import { Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStudioStore } from '@/stores/studio-store'

export function DropZone() {
  const addFiles = useStudioStore((s) => s.addFiles)
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (e.dataTransfer.files.length) {
        await addFiles(e.dataTransfer.files)
      }
    },
    [addFiles],
  )

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        await addFiles(e.target.files)
        e.target.value = ''
      }
    },
    [addFiles],
  )

  return (
    <label
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors',
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-border/60 hover:border-primary/40 hover:bg-muted/30',
      )}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <Upload className="mb-3 size-8 text-muted-foreground" />
      <p className="text-sm font-medium">Drop images here or click to browse</p>
      <p className="mt-1 font-mono text-xs text-muted-foreground">
        JPEG · PNG · WebP · AVIF · HEIC · SVG · GIF · JXL
      </p>
      <input
        type="file"
        multiple
        accept="image/*,.heic,.heif,.jxl,.qoi"
        className="sr-only"
        onChange={handleFileInput}
      />
    </label>
  )
}
