import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Crop as CropIcon, Loader2, Target as TargetIcon, X } from 'lucide-react'
import { filesize } from 'filesize'
import { useStudioStore } from '@/stores/studio-store'
import { formatSizeBudgetTarget } from '@/lib/image/size-budget-encode'
import { needsPipelinePreview, needsPreCropPreview } from '@/lib/image/pipeline-preview'
import { getCropSpaceDimensions } from '@/lib/image/transform-space'
import { usePreCropPreview } from '@/hooks/use-pre-crop-preview'
import { useVisualPreview } from '@/hooks/use-visual-preview'
import { CropOverlay } from '@/components/studio/crop-overlay'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
export function PreviewPanel() {
  const files = useStudioStore((s) => s.files)
  const activeFileId = useStudioStore((s) => s.activeFileId)
  const pipeline = useStudioStore((s) => s.pipeline)
  const isCropEditing = useStudioStore((s) => s.isCropEditing)
  const updatePipeline = useStudioStore((s) => s.updatePipeline)
  const commitCropEdit = useStudioStore((s) => s.commitCropEdit)
  const cancelCropEdit = useStudioStore((s) => s.cancelCropEdit)
  const beginCropEdit = useStudioStore((s) => s.beginCropEdit)
  const [comparePos, setComparePos] = useState(50)
  const [previewLayoutKey, setPreviewLayoutKey] = useState(0)
  const previewContainerRef = useRef<HTMLDivElement>(null)
  const previewImageRef = useRef<HTMLImageElement>(null)
  const activeFile = files.find((f) => f.id === activeFileId)
  const resultPreviewUrl = activeFile?.previewUrl ?? activeFile?.resultUrl
  const showCompare =
    activeFile?.status === 'done' && Boolean(resultPreviewUrl && activeFile.originalUrl)

  const fileWidth = activeFile?.originalWidth
  const fileHeight = activeFile?.originalHeight
  const hasSource =
    fileWidth != null && fileHeight != null && fileWidth > 0 && fileHeight > 0

  const cropSpace = useMemo(() => {
    if (!hasSource) return null
    return getCropSpaceDimensions(fileWidth!, fileHeight!, pipeline.rotate)
  }, [hasSource, fileWidth, fileHeight, pipeline.rotate])

  const showCropEditing =
    isCropEditing && hasSource && Boolean(activeFile?.originalUrl) && !showCompare

  /** Full pipeline preview (incl. crop) — paused during crop edit so the image stays fixed while dragging handles. */
  const runPipelinePreview =
    Boolean(activeFile?.originalUrl) && !showCompare && !showCropEditing

  const { previewUrl: transformPreviewUrl, isRendering: isTransformPreviewRendering } =
    useVisualPreview(
      activeFile?.originalUrl,
      pipeline,
      runPipelinePreview,
      fileWidth,
      fileHeight,
    )

  const { previewUrl: preCropPreviewUrl, isRendering: isPreCropRendering } = usePreCropPreview(
    activeFile?.originalUrl,
    pipeline,
    showCropEditing,
    fileWidth,
    fileHeight,
  )

  useEffect(() => {
    setPreviewLayoutKey(0)
    const img = previewImageRef.current
    if (img?.complete && img.naturalWidth > 0) {
      setPreviewLayoutKey(1)
    }
  }, [
    activeFile?.id,
    activeFile?.originalUrl,
    transformPreviewUrl,
    preCropPreviewUrl,
    isCropEditing,
  ])

  if (!activeFile) {
    return (
      <div className="glass-surface flex h-full min-h-[300px] items-center justify-center rounded-2xl border border-dashed border-border/40">
        <p className="text-sm text-muted-foreground">Add images to preview</p>
      </div>
    )
  }

  const wantsPipelinePreview =
    !showCropEditing && needsPipelinePreview(pipeline, fileWidth, fileHeight)

  const cropEditBaseUrl = needsPreCropPreview(pipeline)
    ? (preCropPreviewUrl ?? activeFile.originalUrl)
    : activeFile.originalUrl

  const displayUrl = showCropEditing
    ? cropEditBaseUrl
    : wantsPipelinePreview
      ? (transformPreviewUrl ?? activeFile.originalUrl)
      : activeFile.originalUrl

  const isPreviewRendering = showCropEditing
    ? needsPreCropPreview(pipeline) && isPreCropRendering
    : isTransformPreviewRendering

  const showCropOverlay = showCropEditing && cropSpace != null

  const showLivePreviewBadge =
    !showCropOverlay && !showCompare && needsPipelinePreview(pipeline, fileWidth, fileHeight)

  return (
    <div className="flex h-full flex-col gap-4">
      {showCompare ? (
        <div className="glass-surface relative aspect-video w-full overflow-hidden rounded-2xl">
          <img
            src={resultPreviewUrl}
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
        <div
          ref={previewContainerRef}
          className="relative aspect-video w-full overflow-hidden rounded-xl border border-border/50 bg-muted/20"
        >
          {displayUrl && (
            <img
              ref={previewImageRef}
              src={displayUrl}
              alt={activeFile.name}
              className={cn(
                'size-full object-contain transition-opacity duration-150',
                isPreviewRendering && 'opacity-70',
              )}
              onLoad={() => setPreviewLayoutKey((key) => key + 1)}
            />
          )}
          {isPreviewRendering && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-background/20">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {showCropOverlay && (
            <CropOverlay
              key={`${activeFile.id}-${pipeline.rotate}-${pipeline.flip.horizontal}-${pipeline.flip.vertical}`}
              crop={pipeline.crop}
              sourceWidth={cropSpace.width}
              sourceHeight={cropSpace.height}
              onCropChange={(crop) => updatePipeline({ crop })}
              containerRef={previewContainerRef}
              layoutKey={previewLayoutKey}
            />
          )}
          {showCropOverlay && (
            <div className="absolute left-3 top-3 z-20 flex flex-wrap items-center gap-2">
              <Badge className="gap-1 font-mono text-xs">
                <CropIcon className="size-3" />
                Editing crop
              </Badge>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-7 gap-1 px-2.5 font-mono text-xs shadow-sm"
                onClick={() => commitCropEdit()}
              >
                <Check className="size-3" />
                Done
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 gap-1 border-background/40 bg-background/80 px-2.5 font-mono text-xs shadow-sm backdrop-blur-sm"
                onClick={() => cancelCropEdit()}
              >
                <X className="size-3" />
                Cancel
              </Button>
            </div>
          )}
          {showLivePreviewBadge && (
            <Badge className="absolute left-3 top-3 z-20 font-mono text-xs">
              Live preview
            </Badge>
          )}
          {pipeline.crop.enabled && !isCropEditing && hasSource && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="absolute right-3 top-3 z-20 h-7 gap-1 px-2.5 font-mono text-xs shadow-sm"
              onClick={() => beginCropEdit()}
            >
              <CropIcon className="size-3" />
              Edit crop
            </Button>
          )}
        </div>
      )}

      {showCropOverlay && (
        <p className="text-center font-mono text-xs text-muted-foreground">
          Crop matches what you see — rotate, flip, and filters are applied first. Use Done to keep
          changes (undoable) or Cancel to discard. Drag inside the box to move · Corner handles keep
          ratio
          {pipeline.crop.aspectRatio !== 'free' && (
            <> · Active: {pipeline.crop.aspectRatio}</>
          )}
        </p>
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
                  : 'callout-warning',
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
    <div className="glass-surface rounded-xl p-3">
      <p className="font-mono text-xs text-muted-foreground">{label}</p>
      <p className={cn('mt-1 font-mono text-sm font-medium', highlight && 'text-primary')}>
        {value}
      </p>
    </div>
  )
}
