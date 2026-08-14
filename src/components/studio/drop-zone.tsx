import { Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStudioStore } from '@/stores/studio-store'
import { STUDIO_IMAGE_ACCEPT } from '@/lib/image/pick-image-files'
import { getCustomPresetSummary, getPresetDisplayName } from '@/lib/presets'
import { useCallback, useState } from 'react'

function usePresetChipLabel() {
  const activePresetId = useStudioStore((s) => s.activePresetId)
  const customPresets = useStudioStore((s) => s.customPresets)
  const pipeline = useStudioStore((s) => s.pipeline)

  const name = getPresetDisplayName(activePresetId, customPresets)
  const summary = getCustomPresetSummary(pipeline)

  return { name, summary }
}

export function DropZone({ className }: { className?: string }) {
  const addFiles = useStudioStore((s) => s.addFiles)
  const [isDragging, setIsDragging] = useState(false)
  const { name, summary } = usePresetChipLabel()

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
        'glass-surface flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-8 py-16 transition-colors sm:py-20',
        className,
        isDragging
          ? 'border-primary/50 bg-primary/10'
          : 'border-primary/15 hover:border-primary/30 hover:bg-background/30 dark:border-primary/20 dark:hover:border-primary/35',
      )}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
        <Upload className="size-6 text-primary" />
      </div>
      <p className="font-display text-lg font-semibold tracking-tight sm:text-xl">
        Drop, paste, or click to browse
      </p>
      <p className="mt-2 font-mono text-xs text-muted-foreground">
        JPEG · PNG · WebP · AVIF · HEIC · SVG · GIF · JXL · TIFF
      </p>
      <span className="mt-6 inline-flex max-w-full items-center gap-1.5 rounded-full border border-border/60 bg-background/40 px-3 py-1 font-mono text-[11px] text-muted-foreground">
        <span className="truncate text-foreground/80">{name}</span>
        <span className="text-border" aria-hidden>
          ·
        </span>
        <span className="truncate">{summary}</span>
      </span>
      <input
        type="file"
        multiple
        accept={STUDIO_IMAGE_ACCEPT}
        className="sr-only"
        onChange={handleFileInput}
      />
    </label>
  )
}
