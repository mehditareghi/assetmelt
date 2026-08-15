import { Upload } from 'lucide-react'
import { useCallback, useState } from 'react'
import { ShortcutKeycaps } from '@/components/studio/shortcut-cheatsheet'
import { STUDIO_IMAGE_ACCEPT } from '@/lib/image/pick-image-files'
import { ingestIncomingImages } from '@/lib/studio-ingest'
import { getCustomPresetSummary, getPresetDisplayName } from '@/lib/presets'
import { useAppleModifier } from '@/lib/studio-shortcuts'
import { cn } from '@/lib/utils'
import { useStudioChromeStore } from '@/stores/studio-chrome-store'
import { useStudioStore } from '@/stores/studio-store'

function usePresetChipLabel() {
  const activePresetId = useStudioStore((s) => s.activePresetId)
  const customPresets = useStudioStore((s) => s.customPresets)
  const pipeline = useStudioStore((s) => s.pipeline)

  const name = getPresetDisplayName(activePresetId, customPresets)
  const summary = getCustomPresetSummary(pipeline)

  return { name, summary }
}

export function DropZone({ className }: { className?: string }) {
  const openShortcuts = useStudioChromeStore((s) => s.setShortcutsOpen)
  const apple = useAppleModifier()
  const [isDragging, setIsDragging] = useState(false)
  const { name, summary } = usePresetChipLabel()

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      await ingestIncomingImages(e.target.files)
      e.target.value = ''
    }
  }, [])

  return (
    <div
      className={cn(
        'glass-surface relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-8 py-16 transition-colors sm:py-20',
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
      onDrop={(e) => {
        e.preventDefault()
        setIsDragging(false)
      }}
    >
      <label className="absolute inset-0 z-0 cursor-pointer rounded-2xl">
        <span className="sr-only">Choose images</span>
        <input
          type="file"
          multiple
          accept={STUDIO_IMAGE_ACCEPT}
          className="sr-only"
          onChange={handleFileInput}
        />
      </label>

      <div className="pointer-events-none relative z-10 flex flex-col items-center">
        <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
          <Upload className="size-6 text-primary" />
        </div>
        <p className="font-display text-lg font-semibold tracking-tight sm:text-xl">
          Drop a folder, or click to choose images
        </p>
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          JPEG · PNG · WebP · AVIF · HEIC · SVG · GIF · JXL · TIFF
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/40 px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
            <ShortcutKeycaps combo={{ key: 'v', meta: true }} apple={apple} compact />
            Paste
          </span>
          <button
            type="button"
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/40 px-2.5 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:border-primary/35 hover:bg-background/70 hover:text-foreground"
            onClick={() => openShortcuts(true)}
          >
            <ShortcutKeycaps combo={{ key: '?' }} apple={apple} compact />
            Shortcuts
          </button>
        </div>
        <span className="mt-5 inline-flex max-w-full items-center gap-1.5 rounded-full border border-border/60 bg-background/40 px-3 py-1 font-mono text-[11px] text-muted-foreground">
          <span className="truncate text-foreground/80">{name}</span>
          <span className="text-border" aria-hidden>
            ·
          </span>
          <span className="truncate">{summary}</span>
        </span>
      </div>
    </div>
  )
}
