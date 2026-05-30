import { useState } from 'react'
import { Target as TargetIcon } from 'lucide-react'
import { filesize } from 'filesize'
import { useStudioStore } from '@/stores/studio-store'
import { formatSizeBudgetTarget } from '@/lib/image/size-budget-encode'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

export function PreviewPanel() {
  const files = useStudioStore((s) => s.files)
  const activeFileId = useStudioStore((s) => s.activeFileId)
  const [comparePos, setComparePos] = useState(50)

  const activeFile = files.find((f) => f.id === activeFileId)

  if (!activeFile) {
    return (
      <div className="flex h-full min-h-[300px] items-center justify-center rounded-xl border border-dashed border-border/50 bg-muted/10">
        <p className="text-sm text-muted-foreground">Add images to preview</p>
      </div>
    )
  }

  const previewUrl = activeFile.previewUrl ?? activeFile.resultUrl
  const showCompare = activeFile.status === 'done' && previewUrl && activeFile.originalUrl

  return (
    <div className="flex h-full flex-col gap-4">
      {showCompare ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border/50 bg-muted/20">
          <img
            src={previewUrl}
            alt="Output"
            className="absolute inset-0 size-full object-contain"
          />
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - comparePos}% 0 0)` }}
          >
            <img
              src={activeFile.originalUrl}
              alt="Original"
              className="size-full object-contain"
            />
          </div>
          <div
            className="absolute inset-y-0 w-0.5 bg-primary shadow-[0_0_8px_var(--primary)]"
            style={{ left: `${comparePos}%` }}
          />
          <Badge className="absolute left-3 top-3 font-mono text-xs">Before</Badge>
          <Badge className="absolute right-3 top-3 font-mono text-xs">After</Badge>
        </div>
      ) : (
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border/50 bg-muted/20">
          {activeFile.originalUrl && (
            <img
              src={activeFile.originalUrl}
              alt={activeFile.name}
              className="size-full object-contain"
            />
          )}
        </div>
      )}

      {showCompare && (
        <div className="px-2">
          <Slider
            value={[comparePos]}
            onValueChange={([v]) => setComparePos(v)}
            max={100}
            step={1}
            className="w-full"
          />
          <p className="mt-1 text-center font-mono text-xs text-muted-foreground">
            Drag to compare
          </p>
        </div>
      )}

      {activeFile.stats && (
        <div className="space-y-3">
          {activeFile.stats.sizeBudget && (
            <div
              className={cn(
                'flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-xs',
                activeFile.stats.sizeBudget.met
                  ? 'border-primary/30 bg-primary/5 text-foreground'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-100',
              )}
            >
              <TargetIcon className="size-3.5 shrink-0 text-primary" />
              <span>
                Size budget: {formatSizeBudgetTarget(activeFile.stats.sizeBudget.targetBytes)} target
                {' · '}
                {activeFile.stats.sizeBudget.met ? 'met' : 'closest match'}
                {' · '}
                Q{Math.round(activeFile.stats.sizeBudget.appliedQuality)}
                {activeFile.stats.sizeBudget.appliedScale < 0.999 && (
                  <> · {Math.round(activeFile.stats.sizeBudget.appliedScale * 100)}% scale</>
                )}
              </span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Original" value={filesize(activeFile.stats.originalSize)} />
            <Stat label="Output" value={filesize(activeFile.stats.outputSize)} />
            <Stat
              label="Saved"
              value={`${activeFile.stats.savingsPercent.toFixed(1)}%`}
              highlight={activeFile.stats.savingsPercent > 0}
            />
            <Stat
              label="Dimensions"
              value={`${activeFile.stats.outputWidth}×${activeFile.stats.outputHeight}`}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-card/50 p-3">
      <p className="font-mono text-xs text-muted-foreground">{label}</p>
      <p className={cn('mt-1 font-mono text-sm font-medium', highlight && 'text-primary')}>
        {value}
      </p>
    </div>
  )
}
