import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ShortcutHint } from '@/components/studio/shortcut-cheatsheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { exportStudioResults } from '@/lib/studio-actions'
import { useStudioStore } from '@/stores/studio-store'

export function StudioDownloadButton({
  count,
  variant = 'default',
  size = 'sm',
  className,
  showCountOnly = false,
}: {
  count: number
  variant?: 'default' | 'secondary'
  size?: 'sm'
  className?: string
  showCountOnly?: boolean
}) {
  const isExporting = useStudioStore((s) => s.isExporting)
  const exportProgress = useStudioStore((s) => s.exportProgress)

  if (isExporting) {
    const label =
      exportProgress && exportProgress.total > 1
        ? `ZIP ${Math.max(exportProgress.current, 1)}/${exportProgress.total}`
        : 'Downloading…'
    return (
      <Button size={size} variant={variant} disabled className={className ?? 'gap-1.5'}>
        <Loader2 className="size-3.5 animate-spin" />
        {label}
      </Button>
    )
  }

  const label = showCountOnly ? String(count) : `Download (${count})`

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size={size}
          variant={variant}
          onClick={() => void exportStudioResults()}
          disabled={count === 0}
          className={className ?? 'gap-1.5'}
          aria-keyshortcuts="Meta+S Control+S"
        >
          <Download className="size-3.5" />
          {label}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <ShortcutHint shortcutId="download" label="Download" />
      </TooltipContent>
    </Tooltip>
  )
}
