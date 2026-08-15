import { Check } from 'lucide-react'
import { toast } from 'sonner'
import { useStudioStore } from '@/stores/studio-store'
import {
  getPresetDisplayName,
  isCustomPresetId,
} from '@/lib/presets'
import {
  getPresetDimensionsLabel,
  getPlatformPresetIcon,
} from '@/lib/preset-icons'
import {
  PLATFORM_BUILT_IN_PRESETS,
  PLATFORM_PRESET_GROUPS,
  getActivePlatformWorkflow,
  resolvePlatformPresetId,
  type PlatformPreset,
} from '@/lib/platform-presets'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

function AspectThumb({
  width,
  height,
  active,
}: {
  width: number
  height: number
  active: boolean
}) {
  const max = 36
  const scale = Math.min(max / width, max / height)
  const w = Math.max(8, Math.round(width * scale))
  const h = Math.max(8, Math.round(height * scale))

  return (
    <span
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-md border',
        active
          ? 'border-primary/40 bg-primary/15'
          : 'border-border/50 bg-muted/40',
      )}
    >
      <span
        className={cn(
          'rounded-[2px] border',
          active ? 'border-primary/70 bg-primary/25' : 'border-muted-foreground/40 bg-muted-foreground/15',
        )}
        style={{ width: w, height: h }}
      />
    </span>
  )
}

function canvasDims(preset: PlatformPreset): { width: number; height: number } | null {
  const resize = preset.config.resize
  if (!resize?.enabled) return null
  if (resize.mode === 'exact') return { width: resize.width, height: resize.height }
  if (resize.mode === 'maxWidth') {
    return { width: resize.width, height: Math.max(1, Math.round(resize.width * 0.5)) }
  }
  return null
}

export function FitToSizeSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const activePresetId = useStudioStore((s) => s.activePresetId)
  const isPipelineModified = useStudioStore((s) => s.isPipelineModified)
  const customPresets = useStudioStore((s) => s.customPresets)
  const applyPresetById = useStudioStore((s) => s.applyPresetById)

  const resolvedActive = resolvePlatformPresetId(activePresetId)

  const handleSelect = (presetId: string) => {
    if (presetId === resolvedActive && !isPipelineModified) {
      onOpenChange(false)
      return
    }
    applyPresetById(presetId)
    onOpenChange(false)
    toast.success(`Applied "${getPresetDisplayName(presetId, customPresets)}"`)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full max-w-[100vw] flex-col gap-0 overflow-x-hidden p-0 sm:max-w-md"
        showCloseButton
      >
        <SheetHeader className="shrink-0 border-b border-border/50 px-4 pt-4 pb-3">
          <SheetTitle className="font-display text-lg">Fit to size</SheetTitle>
          <SheetDescription>
            Exact canvases for social posts, link previews, App Store screenshots, email, and site icons. Crop adjusts to match.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-6">
            {PLATFORM_PRESET_GROUPS.map((group) => {
              const presets = PLATFORM_BUILT_IN_PRESETS.filter((p) => p.group === group.id)
              if (presets.length === 0) return null

              return (
                <section key={group.id}>
                  <h3 className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </h3>
                  <div className="space-y-1.5">
                    {presets.map((preset) => {
                      const dims = canvasDims(preset)
                      const dimensions = getPresetDimensionsLabel(preset)
                      const active =
                        resolvedActive === preset.id &&
                        !isPipelineModified &&
                        !isCustomPresetId(activePresetId)
                      const workflow = getActivePlatformWorkflow(preset.id)
                      const Icon = getPlatformPresetIcon(preset)

                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelect(preset.id)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors',
                            active
                              ? 'border-primary/50 bg-primary/10'
                              : 'border-border/50 bg-background/40 hover:border-border hover:bg-accent/40',
                          )}
                        >
                          {dims ? (
                            <AspectThumb
                              width={dims.width}
                              height={dims.height}
                              active={active}
                            />
                          ) : (
                            <span
                              className={cn(
                                'flex size-10 shrink-0 items-center justify-center rounded-md border',
                                active
                                  ? 'border-primary/30 bg-primary/15 text-primary'
                                  : 'border-border/50 bg-muted/50 text-muted-foreground',
                              )}
                            >
                              <Icon className="size-4" strokeWidth={1.75} />
                            </span>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className={cn('text-sm', active && 'font-medium')}>
                                {preset.name}
                              </span>
                              {dimensions && (
                                <Badge
                                  variant="outline"
                                  className="h-5 font-mono text-[10px]"
                                >
                                  {dimensions}
                                </Badge>
                              )}
                              {workflow && (
                                <Badge
                                  variant="secondary"
                                  className="h-5 font-mono text-[10px]"
                                >
                                  {workflow.variants.length} sizes · zip
                                </Badge>
                              )}
                              {active && (
                                <Check className="ml-auto size-3.5 shrink-0 text-primary" />
                              )}
                            </div>
                            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                              {preset.description}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
