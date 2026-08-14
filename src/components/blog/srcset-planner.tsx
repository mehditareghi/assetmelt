'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  buildPictureMarkup,
  buildResponsiveWidths,
  RESPONSIVE_LAYOUT_PRESETS,
  type ResponsiveLayoutPreset,
} from '@/lib/responsive-export'

export function SrcsetPlanner() {
  const [maxWidth, setMaxWidth] = useState('1200')
  const [preset, setPreset] = useState<ResponsiveLayoutPreset>('full-bleed')
  const [includeRetina, setIncludeRetina] = useState(true)
  const [basePath, setBasePath] = useState('/images/hero')
  const [altText, setAltText] = useState('Descriptive alt text for this image')
  const [copied, setCopied] = useState(false)

  const maxCssWidth = Math.max(320, Math.min(2560, Number(maxWidth) || 1200))
  const layout = RESPONSIVE_LAYOUT_PRESETS[preset]
  const widths = useMemo(
    () => buildResponsiveWidths(maxCssWidth, includeRetina),
    [maxCssWidth, includeRetina],
  )
  const markup = useMemo(
    () =>
      buildPictureMarkup({
        basePath,
        widths,
        sizes: layout.sizes,
        alt: altText,
        formats: ['avif', 'webp', 'jpeg'],
      }),
    [basePath, widths, layout.sizes, altText],
  )

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(markup)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="my-8 rounded-xl border border-primary/25 bg-primary/5 p-5 not-prose sm:p-6">
      <div className="mb-4">
        <p className="font-display text-base font-semibold text-foreground">
          Responsive image planner
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a layout, get export widths, and copy{' '}
          <code className="rounded bg-muted/80 px-1 py-0.5 font-mono text-xs">&lt;picture&gt;</code>{' '}
          markup. In Studio, open{' '}
          <strong className="font-medium text-foreground">Responsive export</strong> to encode those
          widths into a ZIP and copy next/image too.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="srcset-max-width" className="text-xs font-medium text-foreground">
            Max CSS width (px)
          </Label>
          <Input
            id="srcset-max-width"
            type="number"
            min={320}
            max={2560}
            value={maxWidth}
            onChange={(e) => setMaxWidth(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="srcset-base-path" className="text-xs font-medium text-foreground">
            File path prefix
          </Label>
          <Input
            id="srcset-base-path"
            type="text"
            value={basePath}
            onChange={(e) => setBasePath(e.target.value)}
          />
        </div>
      </div>

      <fieldset className="mt-4">
        <legend className="mb-2 text-xs font-medium text-foreground">Layout preset</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {(Object.keys(RESPONSIVE_LAYOUT_PRESETS) as ResponsiveLayoutPreset[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setPreset(key)}
              className={cn(
                'rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                preset === key
                  ? 'border-primary/50 bg-primary/10 text-foreground'
                  : 'border-border/50 bg-background/50 text-muted-foreground hover:border-border',
              )}
            >
              <span className="font-medium">{RESPONSIVE_LAYOUT_PRESETS[key].label}</span>
              <span className="mt-0.5 block font-mono text-[10px] leading-snug opacity-80">
                sizes=&quot;{RESPONSIVE_LAYOUT_PRESETS[key].sizes}&quot;
              </span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{layout.description}</p>
      </fieldset>

      <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={includeRetina}
          onChange={(e) => setIncludeRetina(e.target.checked)}
          className="size-4 rounded border-border accent-primary"
        />
        Include 2× retina widths (recommended for hero and product shots)
      </label>

      <div className="mt-5 rounded-lg border border-border/40 bg-background/60 p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Export these widths in Studio → Responsive export
        </p>
        <div className="flex flex-wrap gap-2">
          {widths.map((w) => (
            <span
              key={w}
              className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-xs text-foreground"
            >
              {w}px
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Studio encodes AVIF + WebP (+ optional JPEG) at each width into a ZIP with folders named by
          width, and copies matching markup.
        </p>
      </div>

      <div className="mt-4 space-y-2">
        <Label htmlFor="srcset-alt" className="text-xs font-medium text-foreground">
          Alt text preview
        </Label>
        <Input id="srcset-alt" type="text" value={altText} onChange={(e) => setAltText(e.target.value)} />
      </div>

      <pre className="mt-4 max-h-64 overflow-auto rounded-lg border border-border/40 bg-muted/30 p-3 font-mono text-[11px] leading-relaxed text-foreground sm:text-xs">
        {markup}
      </pre>

      <div className="mt-3 flex justify-end">
        <Button type="button" size="sm" variant="secondary" onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy markup'}
        </Button>
      </div>
    </div>
  )
}
