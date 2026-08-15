import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Crop as CropIcon,
  Images,
  Loader2,
  Target as TargetIcon,
  X,
} from 'lucide-react'
import { filesize } from 'filesize'
import { useStudioStore } from '@/stores/studio-store'
import { formatSizeBudgetTarget } from '@/lib/image/size-budget-encode'
import { needsPipelinePreview, needsPreCropPreview } from '@/lib/image/pipeline-preview'
import { getCropSpaceDimensions } from '@/lib/image/transform-space'
import { usePreCropPreview } from '@/hooks/use-pre-crop-preview'
import { useVisualPreview } from '@/hooks/use-visual-preview'
import { CompareScrubber } from '@/components/studio/compare-scrubber'
import { CropOverlay } from '@/components/studio/crop-overlay'
import { ExifPreviewStrip } from '@/components/studio/exif-inspector'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useStudioChromeStore } from '@/stores/studio-chrome-store'
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
  const setResponsiveExportOpen = useStudioChromeStore((s) => s.setResponsiveExportOpen)
  const [comparePos, setComparePos] = useState(50)
  const [variantCompareIndex, setVariantCompareIndex] = useState(0)
  const [previewLayoutKey, setPreviewLayoutKey] = useState(0)
  const previewContainerRef = useRef<HTMLDivElement>(null)
  const previewImageRef = useRef<HTMLImageElement>(null)
  const activeFile = files.find((f) => f.id === activeFileId)
  const workflowVariants = activeFile?.workflowResults
  const hasVariantCompare = Boolean(
    workflowVariants &&
      workflowVariants.length > 0 &&
      activeFile?.status === 'done' &&
      activeFile.originalUrl,
  )

  const safeVariantIndex = hasVariantCompare
    ? Math.min(variantCompareIndex, workflowVariants!.length - 1)
    : 0

  const activeVariant = hasVariantCompare ? workflowVariants![safeVariantIndex] : undefined

  const resultPreviewUrl = hasVariantCompare
    ? activeVariant?.previewUrl
    : (activeFile?.previewUrl ?? activeFile?.resultUrl)

  const showCompare =
    activeFile?.status === 'done' &&
    Boolean(resultPreviewUrl && activeFile.originalUrl)

  const compareStats = hasVariantCompare ? activeVariant?.stats : activeFile?.stats

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
    setVariantCompareIndex(0)
    setComparePos(50)
  }, [activeFile?.id, activeFile?.status])

  useEffect(() => {
    if (!workflowVariants?.length) return
    if (variantCompareIndex >= workflowVariants.length) {
      setVariantCompareIndex(0)
    }
  }, [workflowVariants, variantCompareIndex])

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
    safeVariantIndex,
    resultPreviewUrl,
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

  const variantCount = workflowVariants?.length ?? 0

  const variantNavOverlay =
    hasVariantCompare && variantCount > 1 ? (
      <div className="absolute bottom-11 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-lg border border-border/60 bg-background/90 p-1 shadow-sm backdrop-blur-sm">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Previous size"
          disabled={safeVariantIndex <= 0}
          onClick={() => setVariantCompareIndex((i) => Math.max(0, i - 1))}
        >
          <ChevronLeft className="size-3.5" />
        </Button>
        <span className="min-w-[4.5rem] text-center font-mono text-xs tabular-nums">
          {safeVariantIndex + 1} / {variantCount}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Next size"
          disabled={safeVariantIndex >= variantCount - 1}
          onClick={() => setVariantCompareIndex((i) => Math.min(variantCount - 1, i + 1))}
        >
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
    ) : null

  return (
    <div className="flex h-full flex-col gap-4">
      {showCompare && resultPreviewUrl && activeFile.originalUrl ? (
        <>
          <CompareScrubber
            className="glass-surface rounded-2xl"
            position={comparePos}
            onPositionChange={setComparePos}
            beforeUrl={activeFile.originalUrl}
            afterUrl={resultPreviewUrl}
            afterLabel={hasVariantCompare ? (activeVariant?.label ?? 'After') : 'After'}
            overlay={variantNavOverlay}
          />
          <p className="text-center font-mono text-xs text-muted-foreground">
            Drag anywhere on the image to compare
          </p>
        </>
      ) : (
        <div className="overflow-visible rounded-xl p-px ring-1 ring-border/50">
          <div
            ref={previewContainerRef}
            className="relative aspect-video w-full overflow-hidden rounded-[calc(0.75rem-1px)] bg-muted/20"
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

      {!showCropOverlay ? <ExifPreviewStrip summary={activeFile.exif} /> : null}

      {compareStats && (
        <div className="space-y-3">
          {compareStats.sizeBudget && (
            <div
              className={cn(
                'flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-xs',
                compareStats.sizeBudget.met
                  ? 'border-primary/30 bg-primary/5 text-foreground'
                  : 'callout-warning',
              )}
            >
              <TargetIcon className="size-3.5 shrink-0 text-primary" />
              <span>
                Size budget: {formatSizeBudgetTarget(compareStats.sizeBudget.targetBytes)} target
                {' · '}
                {compareStats.sizeBudget.met ? 'met' : 'closest match'}
                {' · '}
                Q{Math.round(compareStats.sizeBudget.appliedQuality)}
                {compareStats.sizeBudget.appliedScale < 0.999 && (
                  <> · {Math.round(compareStats.sizeBudget.appliedScale * 100)}% scale</>
                )}
              </span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 overflow-visible sm:grid-cols-4">
            <Stat label="Original" value={filesize(compareStats.originalSize)} />
            <Stat label="Output" value={filesize(compareStats.outputSize)} />
            <Stat
              label="Saved"
              value={`${compareStats.savingsPercent.toFixed(1)}%`}
              highlight={compareStats.savingsPercent > 0}
            />
            <Stat
              label="Dimensions"
              value={`${compareStats.outputWidth}×${compareStats.outputHeight}`}
            />
          </div>
        </div>
      )}

      {activeFile && !isCropEditing ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setResponsiveExportOpen(true)}
            className="group inline-flex items-center gap-2 rounded-full border border-transparent px-3 py-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:border-border/60 hover:bg-muted/40 hover:text-foreground"
          >
            <Images className="size-3.5 opacity-70 transition-opacity group-hover:opacity-100" />
            Responsive export
            <span className="text-muted-foreground/70 group-hover:text-muted-foreground">
              — widths, ZIP &amp; code
            </span>
          </button>
        </div>
      ) : null}
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
    <div className="glass-surface overflow-visible rounded-xl p-px">
      <div className="rounded-[calc(0.75rem-1px)] p-3">
        <p className="font-mono text-xs text-muted-foreground">{label}</p>
        <p className={cn('mt-1 font-mono text-sm font-medium', highlight && 'text-primary')}>
          {value}
        </p>
      </div>
    </div>
  )
}
