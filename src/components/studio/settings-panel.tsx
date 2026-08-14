import { useStudioStore } from '@/stores/studio-store'
import { cn } from '@/lib/utils'
import { usePipelineForm } from '@/hooks/use-pipeline-form'
import type { MetadataMode, PipelineConfig } from '@/lib/schemas/pipeline-schema'
import type { PipelineChangeOptions } from '@/stores/pipeline-change'
import { getDefaultEncodeOptions } from '@/lib/schemas/pipeline-schema'
import { isSizeBudgetSupported } from '@/lib/image/size-budget-encode'
import { SETTING_HELP } from '@/lib/setting-help'
import { SettingLabel, SettingRow } from '@/components/studio/setting-label'
import { CropSettings, ResizeSettings } from '@/components/studio/resize-settings'
import { FilenamePatternField } from '@/components/studio/filename-pattern-field'
import { SizeBudgetSettings } from '@/components/studio/size-budget-settings'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
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

export function SettingsPanel() {
  const pipeline = useStudioStore((s) => s.pipeline)
  const isAdvancedMode = useStudioStore((s) => s.isAdvancedMode)
  const setAdvancedMode = useStudioStore((s) => s.setAdvancedMode)
  const isCropEditing = useStudioStore((s) => s.isCropEditing)
  const cancelCropEdit = useStudioStore((s) => s.cancelCropEdit)
  const commitCropEdit = useStudioStore((s) => s.commitCropEdit)
  const updatePipeline = useStudioStore((s) => s.updatePipeline)
  usePipelineForm()

  const update = (
    partial: Partial<PipelineConfig>,
    options?: PipelineChangeOptions & { historyDebounceMs?: number },
  ) => {
    const patch = { ...partial }
    if (partial.outputFormat) {
      patch.encode = getDefaultEncodeOptions(partial.outputFormat)
    }
    updatePipeline(patch, options)
  }

  const { outputFormat } = pipeline

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-background/30 px-3 py-2.5">
        <div className="min-w-0">
          <p className="text-sm font-medium">Advanced</p>
          <p className="font-mono text-[11px] text-muted-foreground">
            Codec method, effort, and resize color options
          </p>
        </div>
        <Switch
          id="settings-advanced"
          checked={isAdvancedMode}
          onCheckedChange={setAdvancedMode}
          disabled={isCropEditing}
          aria-label="Advanced settings"
        />
      </div>

      {isCropEditing && (
        <div className="glass-surface space-y-2 rounded-xl border-primary/20 p-3 ring-1 ring-primary/20">
          <p className="text-xs text-foreground">
            Crop editing is active. Adjust the crop, then use Done to apply (one undo step) or
            Cancel to discard. Other settings are locked until you finish.
          </p>
          <div className="flex gap-2">
            <Button type="button" size="sm" className="h-7 flex-1 font-mono text-xs" onClick={() => commitCropEdit()}>
              Done
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 flex-1 font-mono text-xs"
              onClick={() => cancelCropEdit()}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <Tabs defaultValue="format" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="format" disabled={isCropEditing}>
            Format
          </TabsTrigger>
          <TabsTrigger value="transform">Transform</TabsTrigger>
          <TabsTrigger value="filters" disabled={isCropEditing}>
            Filters
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="format"
          className={cn('mt-4 space-y-4', isCropEditing && 'pointer-events-none opacity-40')}
        >
          <SizeBudgetSettings pipeline={pipeline} onUpdate={update} />

          <div className="space-y-2">
            <SettingLabel label="Output format" help={SETTING_HELP.outputFormat} />
            <Select
              value={outputFormat}
              onValueChange={(v) =>
                update({ outputFormat: v as PipelineConfig['outputFormat'] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="webp">WebP</SelectItem>
                <SelectItem value="avif">AVIF</SelectItem>
                <SelectItem value="jpeg">JPEG (MozJPEG)</SelectItem>
                <SelectItem value="png">PNG (Oxipng)</SelectItem>
                <SelectItem value="jxl">JPEG XL</SelectItem>
                <SelectItem value="qoi">QOI</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <CodecOptions
            format={outputFormat}
            pipeline={pipeline}
            isAdvanced={isAdvancedMode}
            onChange={(encode) => update({ encode })}
          />

          <div className="space-y-2">
            <SettingLabel label="Metadata" help={SETTING_HELP.stripMetadata} />
            <Select
              value={pipeline.metadataMode}
              onValueChange={(v) => update({ metadataMode: v as MetadataMode })}
            >
              <SelectTrigger id="metadata-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="strip">Strip all</SelectItem>
                <SelectItem value="strip-gps">Strip GPS only</SelectItem>
                <SelectItem value="keep">Keep (lossy-safe)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <FilenamePatternField />
        </TabsContent>

        <TabsContent value="transform" className="mt-4 space-y-4">
          <div className={cn(isCropEditing && 'pointer-events-none opacity-40')}>
            <ResizeSettings
              pipeline={pipeline}
              isAdvanced={isAdvancedMode}
              onUpdate={update}
            />
          </div>

          <CropSettings pipeline={pipeline} onUpdate={update} />

          <div className={cn(isCropEditing && 'pointer-events-none opacity-40')}>
            <div className="space-y-2">
              <SettingLabel label="Rotate" help={SETTING_HELP.rotate} />
              <Select
                value={String(pipeline.rotate)}
                onValueChange={(v) =>
                  update({ rotate: Number(v) as PipelineConfig['rotate'] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0°</SelectItem>
                  <SelectItem value="90">90°</SelectItem>
                  <SelectItem value="180">180°</SelectItem>
                  <SelectItem value="270">270°</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-4 flex gap-6">
            <div className="flex items-center gap-2">
              <Switch
                id="flip-h"
                checked={pipeline.flip.horizontal}
                onCheckedChange={(v) =>
                  update({ flip: { ...pipeline.flip, horizontal: v } })
                }
              />
              <SettingLabel htmlFor="flip-h" label="Flip H" help={SETTING_HELP.flipHorizontal} />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="flip-v"
                checked={pipeline.flip.vertical}
                onCheckedChange={(v) =>
                  update({ flip: { ...pipeline.flip, vertical: v } })
                }
              />
              <SettingLabel htmlFor="flip-v" label="Flip V" help={SETTING_HELP.flipVertical} />
            </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="filters"
          className={cn('mt-4 space-y-4', isCropEditing && 'pointer-events-none opacity-40')}
        >
          <SettingRow
            label="Enable filters"
            help={SETTING_HELP.filtersEnabled}
            htmlFor="filters-toggle"
          >
            <Switch
              id="filters-toggle"
              checked={pipeline.filters.enabled}
              onCheckedChange={(v) =>
                update({ filters: { ...pipeline.filters, enabled: v } })
              }
            />
          </SettingRow>

          {pipeline.filters.enabled && (
            <>
              <FilterSlider
                label="Brightness"
                help={SETTING_HELP.brightness}
                value={pipeline.filters.brightness}
                min={-100}
                max={100}
                onChange={(v) =>
                  update({ filters: { ...pipeline.filters, brightness: v } })
                }
              />
              <FilterSlider
                label="Contrast"
                help={SETTING_HELP.contrast}
                value={pipeline.filters.contrast}
                min={-100}
                max={100}
                onChange={(v) =>
                  update({ filters: { ...pipeline.filters, contrast: v } })
                }
              />
              <FilterSlider
                label="Saturation"
                help={SETTING_HELP.saturation}
                value={pipeline.filters.saturation}
                min={-100}
                max={100}
                onChange={(v) =>
                  update({ filters: { ...pipeline.filters, saturation: v } })
                }
              />
              <FilterSlider
                label="Sharpen"
                help={SETTING_HELP.sharpen}
                value={pipeline.filters.sharpen}
                min={0}
                max={100}
                onChange={(v) =>
                  update({ filters: { ...pipeline.filters, sharpen: v } })
                }
              />
              <SettingRow
                label="Grayscale"
                help={SETTING_HELP.grayscale}
                htmlFor="grayscale"
              >
                <Switch
                  id="grayscale"
                  checked={pipeline.filters.grayscale}
                  onCheckedChange={(v) =>
                    update({ filters: { ...pipeline.filters, grayscale: v } })
                  }
                />
              </SettingRow>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function FilterSlider({
  label,
  help,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  help: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <SettingLabel label={label} help={help} />
        <span className="font-mono text-xs text-muted-foreground">{value}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={1} onValueChange={([v]) => onChange(v)} />
    </div>
  )
}

function CodecOptions({
  format,
  pipeline,
  isAdvanced,
  onChange,
}: {
  format: PipelineConfig['outputFormat']
  pipeline: PipelineConfig
  isAdvanced: boolean
  onChange: (encode: PipelineConfig['encode']) => void
}) {
  const { encode } = pipeline
  const qualityLocked = pipeline.sizeBudget.enabled && isSizeBudgetSupported(pipeline)

  const qualitySlider = (val: number, onUpdate: (q: number) => void) => (
    <div className="space-y-2">
      <div className="flex justify-between">
        <SettingLabel label="Quality" help={SETTING_HELP.quality} />
        <span className="font-mono text-xs text-muted-foreground">
          {qualityLocked ? 'Auto' : val}
        </span>
      </div>
      {qualityLocked ? (
        <p className="text-xs text-muted-foreground">
          Quality is optimized automatically to meet your size target.
        </p>
      ) : (
        <Slider value={[val]} min={0} max={100} step={1} onValueChange={([v]) => onUpdate(v)} />
      )}
    </div>
  )

  if (format === 'webp' && encode.format === 'webp') {
    return (
      <div className="space-y-4">
        {qualitySlider(encode.options.quality, (quality) =>
          onChange({ format: 'webp', options: { ...encode.options, quality } }),
        )}
        {isAdvanced && (
          <Accordion type="single" collapsible>
            <AccordionItem value="webp-advanced">
              <AccordionTrigger className="font-mono text-xs">Advanced WebP</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <NumberField
                  label="Method (0-6)"
                  help={SETTING_HELP.webpMethod}
                  value={encode.options.method}
                  onChange={(method) =>
                    onChange({ format: 'webp', options: { ...encode.options, method } })
                  }
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </div>
    )
  }

  if (format === 'avif' && encode.format === 'avif') {
    return (
      <div className="space-y-4">
        {qualitySlider(encode.options.quality, (quality) =>
          onChange({ format: 'avif', options: { ...encode.options, quality } }),
        )}
        {isAdvanced && (
          <Accordion type="single" collapsible>
            <AccordionItem value="avif-advanced">
              <AccordionTrigger className="font-mono text-xs">Advanced AVIF</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <NumberField
                  label="Speed (0-10)"
                  help={SETTING_HELP.avifSpeed}
                  value={encode.options.speed}
                  onChange={(speed) =>
                    onChange({ format: 'avif', options: { ...encode.options, speed } })
                  }
                />
                <SettingRow label="Lossless" help={SETTING_HELP.avifLossless} htmlFor="avif-lossless">
                  <Switch
                    id="avif-lossless"
                    checked={encode.options.lossless}
                    onCheckedChange={(lossless) =>
                      onChange({ format: 'avif', options: { ...encode.options, lossless } })
                    }
                  />
                </SettingRow>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </div>
    )
  }

  if (format === 'jpeg' && encode.format === 'jpeg') {
    return (
      <div className="space-y-4">
        {qualitySlider(encode.options.quality, (quality) =>
          onChange({ format: 'jpeg', options: { ...encode.options, quality } }),
        )}
        {isAdvanced && (
          <Accordion type="single" collapsible>
            <AccordionItem value="jpeg-advanced">
              <AccordionTrigger className="font-mono text-xs">Advanced MozJPEG</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <SettingRow
                  label="Progressive"
                  help={SETTING_HELP.jpegProgressive}
                  htmlFor="jpeg-progressive"
                >
                  <Switch
                    id="jpeg-progressive"
                    checked={encode.options.progressive}
                    onCheckedChange={(progressive) =>
                      onChange({ format: 'jpeg', options: { ...encode.options, progressive } })
                    }
                  />
                </SettingRow>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </div>
    )
  }

  if (format === 'png' && encode.format === 'png') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <SettingLabel label="Oxipng level" help={SETTING_HELP.oxipngLevel} />
            <span className="font-mono text-xs text-muted-foreground">
              {encode.options.level}
            </span>
          </div>
          <Slider
            value={[encode.options.level]}
            min={0}
            max={6}
            step={1}
            onValueChange={([level]) =>
              onChange({ format: 'png', options: { ...encode.options, level } })
            }
          />
        </div>
      </div>
    )
  }

  if (format === 'jxl' && encode.format === 'jxl') {
    return (
      <div className="space-y-4">
        {qualitySlider(encode.options.quality, (quality) =>
          onChange({ format: 'jxl', options: { ...encode.options, quality } }),
        )}
        {isAdvanced && (
          <NumberField
            label="Effort (1-9)"
            help={SETTING_HELP.jxlEffort}
            value={encode.options.effort}
            onChange={(effort) =>
              onChange({ format: 'jxl', options: { ...encode.options, effort } })
            }
          />
        )}
      </div>
    )
  }

  return (
    <p className="font-mono text-xs text-muted-foreground">
      QOI uses lossless encoding with no options.
    </p>
  )
}

function NumberField({
  label,
  help,
  value,
  onChange,
}: {
  label: string
  help: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-2">
      <SettingLabel label={label} help={help} />
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="font-mono text-xs"
      />
    </div>
  )
}
