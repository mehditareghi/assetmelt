import { Target } from 'lucide-react'
import type { PipelineConfig } from '@/lib/schemas/pipeline-schema'
import {
  formatSizeBudgetTarget,
  isSizeBudgetSupported,
  SIZE_BUDGET_FORMATS,
} from '@/lib/image/size-budget-encode'
import { SETTING_HELP } from '@/lib/setting-help'
import { SettingLabel, SettingRow } from '@/components/studio/setting-label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const TARGET_PRESETS_KB = [50, 100, 200, 500, 1024] as const

interface SizeBudgetSettingsProps {
  pipeline: PipelineConfig
  onUpdate: (partial: Partial<PipelineConfig>) => void
}

export function SizeBudgetSettings({ pipeline, onUpdate }: SizeBudgetSettingsProps) {
  const budget = pipeline.sizeBudget
  const supported = isSizeBudgetSupported(pipeline)
  const targetKb = Math.round(budget.targetBytes / 1024)

  const updateBudget = (patch: Partial<PipelineConfig['sizeBudget']>) => {
    onUpdate({ sizeBudget: { ...budget, ...patch } })
  }

  return (
    <div
      className={cn(
        'space-y-4 rounded-lg border p-4 transition-colors',
        budget.enabled
          ? 'border-primary/30 bg-primary/5'
          : 'border-border/50 bg-muted/10',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
          <Target className="size-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <SettingRow
            label="Target file size"
            help={SETTING_HELP.sizeBudgetEnabled}
            htmlFor="size-budget-toggle"
          >
            <Switch
              id="size-budget-toggle"
              checked={budget.enabled}
              onCheckedChange={(enabled) => updateBudget({ enabled })}
            />
          </SettingRow>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Find the highest quality encode that fits your size limit.
          </p>
        </div>
      </div>

      {budget.enabled && (
        <>
          {!supported && (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200/90">
              Size budget works with lossy {SIZE_BUDGET_FORMATS.join(', ').toUpperCase()}.
              Switch format or disable lossless mode to use this feature.
            </div>
          )}

          <div className="space-y-2">
            <SettingLabel label="Max file size" help={SETTING_HELP.sizeBudgetTarget} />
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={51200}
                value={targetKb}
                onChange={(e) => {
                  const kb = Math.max(1, Number(e.target.value) || 1)
                  updateBudget({ targetBytes: kb * 1024 })
                }}
                className="h-9 font-mono"
              />
              <span className="shrink-0 text-sm text-muted-foreground">KB</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TARGET_PRESETS_KB.map((kb) => (
                <Button
                  key={kb}
                  type="button"
                  variant={targetKb === kb ? 'default' : 'outline'}
                  size="xs"
                  className="font-mono"
                  onClick={() => updateBudget({ targetBytes: kb * 1024 })}
                >
                  {kb >= 1024 ? '1 MB' : `${kb} KB`}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Target: {formatSizeBudgetTarget(budget.targetBytes)}
            </p>
          </div>

          <SettingRow
            label="Resize down if needed"
            help={SETTING_HELP.sizeBudgetAllowResize}
            htmlFor="size-budget-resize"
          >
            <Switch
              id="size-budget-resize"
              checked={budget.allowResize}
              onCheckedChange={(allowResize) => updateBudget({ allowResize })}
            />
          </SettingRow>

          {supported && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Quality is chosen automatically during export.
            </p>
          )}
        </>
      )}
    </div>
  )
}
