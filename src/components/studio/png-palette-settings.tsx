import { SETTING_HELP } from '@/lib/setting-help'
import { SettingLabel, SettingRow } from '@/components/studio/setting-label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import type { OxipngOptions } from '@/lib/schemas/pipeline-schema'

const INK_CELLS = 32

function inkWellColor(index: number, count: number): string {
  const t = count <= 1 ? 0 : index / (count - 1)
  const lightness = 0.26 + t * 0.44
  const chroma = 0.035 + t * 0.07
  const hue = 48 + t * 155
  return `oklch(${lightness.toFixed(3)} ${chroma.toFixed(3)} ${hue.toFixed(1)})`
}

function PaletteInkStrip({ numColors, dither }: { numColors: number; dither: number }) {
  const cells = Math.max(2, Math.min(INK_CELLS, numColors))
  return (
    <div
      className="relative h-2.5 overflow-hidden rounded-sm ring-1 ring-border/70"
      aria-hidden
    >
      <div className="flex h-full">
        {Array.from({ length: cells }, (_, i) => (
          <span
            key={i}
            className="min-w-0 flex-1"
            style={{ background: inkWellColor(i, cells) }}
          />
        ))}
      </div>
      <div
        className="pointer-events-none absolute inset-0 mix-blend-multiply"
        style={{
          opacity: dither * 0.42,
          backgroundImage:
            'repeating-linear-gradient(90deg, transparent 0 1px, rgb(0 0 0 / 0.28) 1px 2px), repeating-linear-gradient(0deg, transparent 0 1px, rgb(255 255 255 / 0.18) 1px 2px)',
        }}
      />
    </div>
  )
}

export function PngPaletteSettings({
  options,
  onChange,
}: {
  options: OxipngOptions
  onChange: (options: OxipngOptions) => void
}) {
  return (
    <div className="space-y-3">
      <SettingRow
        label="Reduce palette"
        help={SETTING_HELP.pngPalette}
        htmlFor="png-palette"
      >
        <Switch
          id="png-palette"
          checked={options.paletteEnabled}
          onCheckedChange={(paletteEnabled) => onChange({ ...options, paletteEnabled })}
        />
      </SettingRow>

      {options.paletteEnabled ? (
        <div className="space-y-3 rounded-md border border-border/80 bg-muted/25 px-3 py-3">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
              Ink count
            </p>
            <p className="font-mono text-[10px] text-muted-foreground">
              {options.numColors} colors · dither {Math.round(options.dither * 100)}%
            </p>
          </div>
          <PaletteInkStrip numColors={options.numColors} dither={options.dither} />

          <div className="space-y-2">
            <div className="flex justify-between">
              <SettingLabel label="Colors" help={SETTING_HELP.pngNumColors} />
              <span className="font-mono text-xs text-muted-foreground">{options.numColors}</span>
            </div>
            <Slider
              value={[options.numColors]}
              min={2}
              max={256}
              step={1}
              onValueChange={([numColors]) => onChange({ ...options, numColors })}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <SettingLabel label="Dither" help={SETTING_HELP.pngDither} />
              <span className="font-mono text-xs text-muted-foreground">
                {Math.round(options.dither * 100)}%
              </span>
            </div>
            <Slider
              value={[options.dither]}
              min={0}
              max={1}
              step={0.05}
              onValueChange={([dither]) => onChange({ ...options, dither })}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
