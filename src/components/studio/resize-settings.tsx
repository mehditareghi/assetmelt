import { Link2, RotateCcw } from 'lucide-react'
import { useStudioStore } from '@/stores/studio-store'
import type { CropAspectRatio, PipelineConfig, ResizeConfig } from '@/lib/schemas/pipeline-schema'
import {
  applyAspectRatioToCrop,
  CROP_ASPECT_PRESETS,
  createDefaultCrop,
  cropConfigToRect,
  normalizeCropInput,
} from '@/lib/image/crop-math'
import { computeTargetSize } from '@/lib/image/resize-compute'
import { RESIZE_MODE_LABELS, SETTING_HELP } from '@/lib/setting-help'
import { SettingLabel, SettingRow } from '@/components/studio/setting-label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const PERCENTAGE_PRESETS = [25, 50, 75, 100, 125, 150, 200]

interface ResizeSettingsProps {
  pipeline: PipelineConfig
  isAdvanced: boolean
  onUpdate: (partial: Partial<PipelineConfig>) => void
}

export function ResizeSettings({ pipeline, isAdvanced, onUpdate }: ResizeSettingsProps) {
  const activeFile = useStudioStore((s) => {
    const id = s.activeFileId
    return id ? s.files.find((f) => f.id === id) : undefined
  })
  const syncResizeFromActiveFile = useStudioStore((s) => s.syncResizeFromActiveFile)

  const resize = pipeline.resize
  const sourceW = activeFile?.originalWidth
  const sourceH = activeFile?.originalHeight
  const hasSource = sourceW != null && sourceH != null && sourceW > 0 && sourceH > 0

  const preview =
    hasSource && resize.enabled
      ? computeTargetSize(sourceW, sourceH, resize)
      : null

  const updateResize = (partial: Partial<ResizeConfig>) => {
    onUpdate({ resize: { ...resize, ...partial } })
  }

  const handleEnable = (enabled: boolean) => {
    if (enabled && hasSource) {
      onUpdate({
        resize: {
          ...resize,
          enabled: true,
          width: sourceW,
          height: sourceH,
        },
      })
      return
    }
    updateResize({ enabled })
  }

  return (
    <div className="space-y-4 rounded-lg border border-border/50 bg-muted/10 p-4">
      <SettingRow label="Resize" help={SETTING_HELP.resizeEnabled} htmlFor="resize-toggle">
        <Switch
          id="resize-toggle"
          checked={resize.enabled}
          onCheckedChange={handleEnable}
        />
      </SettingRow>

      {hasSource && (
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="font-mono text-xs">
            Source: {sourceW} × {sourceH}
          </Badge>
          {preview && !preview.skipped && (
            <Badge variant="outline" className="font-mono text-xs text-primary">
              → {preview.width} × {preview.height}
            </Badge>
          )}
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="h-6 gap-1 font-mono text-xs"
            onClick={() => syncResizeFromActiveFile()}
          >
            <RotateCcw className="size-3" />
            Use source size
          </Button>
        </div>
      )}

      {!hasSource && (
        <p className="text-xs text-muted-foreground">
          Add an image to see its dimensions and preview output size.
        </p>
      )}

      {resize.enabled && (
        <>
          <div className="space-y-2">
            <SettingLabel label="Resize mode" help={SETTING_HELP.resizeMode} />
            <Select
              value={resize.mode}
              onValueChange={(v) =>
                updateResize({ mode: v as ResizeConfig['mode'] })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.entries(RESIZE_MODE_LABELS) as [
                    ResizeConfig['mode'],
                    { label: string; description: string },
                  ][]
                ).map(([value, { label }]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {RESIZE_MODE_LABELS[resize.mode].description}
            </p>
          </div>

          {resize.mode === 'percentage' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <SettingLabel label="Scale" help={SETTING_HELP.resizePercentage} />
                <span className="font-mono text-xs text-muted-foreground">
                  {resize.percentage}%
                </span>
              </div>
              <Slider
                value={[resize.percentage]}
                min={1}
                max={200}
                step={1}
                onValueChange={([v]) => updateResize({ percentage: v })}
              />
              <div className="flex flex-wrap gap-1.5">
                {PERCENTAGE_PRESETS.map((pct) => (
                  <Button
                    key={pct}
                    type="button"
                    variant={resize.percentage === pct ? 'secondary' : 'outline'}
                    size="xs"
                    className="h-7 font-mono text-xs"
                    onClick={() => updateResize({ percentage: pct })}
                  >
                    {pct}%
                  </Button>
                ))}
              </div>
            </div>
          )}

          {resize.mode === 'maxSide' && (
            <div className="space-y-2">
              <SettingLabel label="Max side (px)" help={SETTING_HELP.resizeWidth} />
              <Input
                type="number"
                min={1}
                value={resize.width}
                onChange={(e) => updateResize({ width: Number(e.target.value) })}
                className="font-mono"
              />
            </div>
          )}

          {resize.mode === 'maxWidth' && (
            <div className="space-y-2">
              <SettingLabel label="Max width (px)" help={SETTING_HELP.resizeWidth} />
              <Input
                type="number"
                min={1}
                value={resize.width}
                onChange={(e) => updateResize({ width: Number(e.target.value) })}
                className="font-mono"
              />
            </div>
          )}

          {resize.mode === 'maxHeight' && (
            <div className="space-y-2">
              <SettingLabel label="Max height (px)" help={SETTING_HELP.resizeHeight} />
              <Input
                type="number"
                min={1}
                value={resize.height}
                onChange={(e) => updateResize({ height: Number(e.target.value) })}
                className="font-mono"
              />
            </div>
          )}

          {resize.mode === 'exact' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <SettingLabel label="Width (px)" help={SETTING_HELP.resizeWidth} />
                  <Input
                    type="number"
                    min={1}
                    value={resize.width}
                    onChange={(e) => updateResize({ width: Number(e.target.value) })}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <SettingLabel label="Height (px)" help={SETTING_HELP.resizeHeight} />
                  <Input
                    type="number"
                    min={1}
                    value={resize.height}
                    onChange={(e) => updateResize({ height: Number(e.target.value) })}
                    className="font-mono"
                  />
                </div>
              </div>
              {hasSource && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 font-mono text-xs"
                  onClick={() =>
                    updateResize({ width: sourceW, height: sourceH })
                  }
                >
                  <Link2 className="size-3.5" />
                  Match source ({sourceW} × {sourceH})
                </Button>
              )}
            </>
          )}

          <SettingRow
            label="Lock aspect ratio"
            help={SETTING_HELP.lockAspectRatio}
            htmlFor="lock-aspect"
          >
            <Switch
              id="lock-aspect"
              checked={resize.lockAspectRatio}
              disabled={resize.mode === 'percentage' || resize.mode === 'maxSide'}
              onCheckedChange={(lockAspectRatio) => updateResize({ lockAspectRatio })}
            />
          </SettingRow>

          {(resize.mode === 'exact' && !resize.lockAspectRatio) && (
            <div className="space-y-2">
              <SettingLabel label="Fit mode" help={SETTING_HELP.fitMethod} />
              <Select
                value={resize.fitMethod}
                onValueChange={(v) =>
                  updateResize({ fitMethod: v as ResizeConfig['fitMethod'] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contain">Contain (no crop)</SelectItem>
                  <SelectItem value="stretch">Stretch to fill</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <SettingLabel label="Algorithm" help={SETTING_HELP.resizeMethod} />
            <Select
              value={resize.method}
              onValueChange={(v) =>
                updateResize({ method: v as ResizeConfig['method'] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lanczos3">Lanczos3 — general purpose</SelectItem>
                <SelectItem value="mitchell">Mitchell — smooth downscale</SelectItem>
                <SelectItem value="catrom">Catrom — balanced</SelectItem>
                <SelectItem value="triangle">Triangle — fast, soft</SelectItem>
                <SelectItem value="hqx">HQX — pixel art upscale</SelectItem>
                <SelectItem value="magicKernel">Magic Kernel</SelectItem>
                <SelectItem value="magicKernelSharp2013">Magic Kernel Sharp 2013</SelectItem>
                <SelectItem value="magicKernelSharp2021">Magic Kernel Sharp 2021</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isAdvanced && (
            <Accordion type="single" collapsible>
              <AccordionItem value="resize-advanced" className="border-border/50">
                <AccordionTrigger className="py-2 font-mono text-xs">
                  Advanced resize
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <SettingRow
                    label="Premultiply alpha"
                    help={SETTING_HELP.premultiply}
                    htmlFor="premultiply"
                  >
                    <Switch
                      id="premultiply"
                      checked={resize.premultiply}
                      onCheckedChange={(premultiply) => updateResize({ premultiply })}
                    />
                  </SettingRow>
                  <SettingRow
                    label="Linear RGB"
                    help={SETTING_HELP.linearRGB}
                    htmlFor="linear-rgb"
                  >
                    <Switch
                      id="linear-rgb"
                      checked={resize.linearRGB}
                      onCheckedChange={(linearRGB) => updateResize({ linearRGB })}
                    />
                  </SettingRow>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </>
      )}
    </div>
  )
}

export function CropSettings({
  pipeline,
  onUpdate,
}: {
  pipeline: PipelineConfig
  onUpdate: (partial: Partial<PipelineConfig>) => void
}) {
  const activeFile = useStudioStore((s) => {
    const id = s.activeFileId
    return id ? s.files.find((f) => f.id === id) : undefined
  })
  const syncCropFromActiveFile = useStudioStore((s) => s.syncCropFromActiveFile)

  const crop = pipeline.crop
  const sourceWidth = activeFile?.originalWidth
  const sourceHeight = activeFile?.originalHeight
  const hasSource = sourceWidth != null && sourceHeight != null && sourceWidth > 0 && sourceHeight > 0

  const updateCrop = (partial: Partial<typeof crop>) => {
    const next = { ...crop, ...partial }
    if (hasSource) {
      onUpdate({ crop: normalizeCropInput(next, sourceWidth, sourceHeight) })
      return
    }
    onUpdate({ crop: next })
  }

  const selectAspectRatio = (aspectRatio: CropAspectRatio) => {
    if (!hasSource) return

    if (aspectRatio === 'free') {
      onUpdate({ crop: { ...crop, aspectRatio: 'free' } })
      return
    }

    if (!crop.enabled) {
      onUpdate({
        crop: {
          enabled: true,
          aspectRatio,
          ...createDefaultCrop(sourceWidth, sourceHeight, aspectRatio),
        },
      })
      return
    }

    const rect = applyAspectRatioToCrop(
      cropConfigToRect(crop),
      aspectRatio,
      sourceWidth,
      sourceHeight,
    )
    onUpdate({ crop: { ...crop, aspectRatio, ...rect } })
  }

  const updateCropField = (field: 'x' | 'y' | 'width' | 'height', rawValue: string) => {
    const value = Number.parseInt(rawValue, 10)
    if (!Number.isFinite(value)) return
    updateCrop({ [field]: value })
  }

  return (
    <div className="space-y-4 rounded-lg border border-border/50 bg-muted/10 p-4">
      <SettingRow label="Crop" help={SETTING_HELP.cropEnabled} htmlFor="crop-toggle">
        <Switch
          id="crop-toggle"
          checked={crop.enabled}
          onCheckedChange={(enabled) => {
            if (enabled && hasSource) {
              syncCropFromActiveFile()
            } else {
              updateCrop({ enabled })
            }
          }}
        />
      </SettingRow>

      {crop.enabled && (
        <>
          <div className="space-y-2">
            <SettingLabel label="Aspect ratio" help={SETTING_HELP.cropAspectRatio} />
            <div className="flex flex-wrap gap-1.5">
              {CROP_ASPECT_PRESETS.map((preset) => (
                <Button
                  key={preset.value}
                  type="button"
                  size="sm"
                  variant={crop.aspectRatio === preset.value ? 'default' : 'outline'}
                  className="h-7 px-2.5 font-mono text-xs"
                  onClick={() => selectAspectRatio(preset.value)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {hasSource && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full font-mono text-xs"
              onClick={() => syncCropFromActiveFile()}
            >
              Reset crop to full image
            </Button>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <SettingLabel label="X" help={SETTING_HELP.cropX} />
              <Input
                type="number"
                min={0}
                max={hasSource ? sourceWidth - 1 : undefined}
                value={crop.x}
                onChange={(e) => updateCropField('x', e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <SettingLabel label="Y" help={SETTING_HELP.cropY} />
              <Input
                type="number"
                min={0}
                max={hasSource ? sourceHeight - 1 : undefined}
                value={crop.y}
                onChange={(e) => updateCropField('y', e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <SettingLabel label="Width" help={SETTING_HELP.cropWidth} />
              <Input
                type="number"
                min={1}
                max={hasSource ? sourceWidth : undefined}
                value={crop.width}
                onChange={(e) => updateCropField('width', e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <SettingLabel label="Height" help={SETTING_HELP.cropHeight} />
              <Input
                type="number"
                min={1}
                max={hasSource ? sourceHeight : undefined}
                value={crop.height}
                onChange={(e) => updateCropField('height', e.target.value)}
                className="font-mono"
              />
            </div>
          </div>

          {hasSource && (
            <p className="font-mono text-xs text-muted-foreground">
              Output region: {crop.width}×{crop.height} from {sourceWidth}×{sourceHeight} source
            </p>
          )}
        </>
      )}
    </div>
  )
}
