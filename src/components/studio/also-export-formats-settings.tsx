import { Layers } from 'lucide-react'
import type { AlsoExportFormat, PipelineConfig } from '@/lib/schemas/pipeline-schema'
import {
  ALSO_EXPORT_OPTIONS,
  normalizeAlsoExportFormats,
  toggleAlsoExportFormat,
} from '@/lib/multi-format'
import { getActivePlatformWorkflow } from '@/lib/platform-presets'
import { SETTING_HELP } from '@/lib/setting-help'
import { SettingRow } from '@/components/studio/setting-label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { useStudioStore } from '@/stores/studio-store'

interface AlsoExportFormatsSettingsProps {
  pipeline: PipelineConfig
  onUpdate: (partial: Partial<PipelineConfig>) => void
}

export function AlsoExportFormatsSettings({
  pipeline,
  onUpdate,
}: AlsoExportFormatsSettingsProps) {
  const activePresetId = useStudioStore((s) => s.activePresetId)
  const platformWorkflow = getActivePlatformWorkflow(activePresetId)
  const selected = new Set(normalizeAlsoExportFormats(pipeline))
  const options = ALSO_EXPORT_OPTIONS.filter((opt) => opt.id !== pipeline.outputFormat)
  const enabled = selected.size > 0

  const setFormat = (format: AlsoExportFormat, next: boolean) => {
    onUpdate({
      alsoExportFormats: toggleAlsoExportFormat(pipeline, format, next),
    })
  }

  return (
    <div
      className={cn(
        'space-y-3 rounded-xl p-1 transition-colors',
        enabled && !platformWorkflow && 'ring-1 ring-primary/25',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
          <Layers className="size-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <SettingRow label="Also export" help={SETTING_HELP.alsoExportFormats}>
            <span className="font-mono text-[11px] text-muted-foreground">
              {enabled ? `${selected.size + 1} formats` : 'Off'}
            </span>
          </SettingRow>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Encode extra codecs in the same run. Download uses a ZIP with a folder per
            format (one batch ZIP if the queue has multiple files).
          </p>
        </div>
      </div>

      {platformWorkflow ? (
        <div className="callout-warning rounded-md px-3 py-2 text-xs">
          Multi-format is unavailable while a platform kit (favicon, App Store, or newsletter) is active.
        </div>
      ) : (
        <div className="space-y-2 pl-11">
          {options.map((opt) => (
            <SettingRow
              key={opt.id}
              label={opt.label}
              help={opt.hint ?? SETTING_HELP.alsoExportFormats}
              htmlFor={`also-export-${opt.id}`}
            >
              <Switch
                id={`also-export-${opt.id}`}
                checked={selected.has(opt.id)}
                onCheckedChange={(checked) => setFormat(opt.id, checked)}
              />
            </SettingRow>
          ))}
          {selected.has('jpeg') ? (
            <p className="text-xs text-muted-foreground">
              JPEG fallback flattens transparency to an opaque background.
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}
