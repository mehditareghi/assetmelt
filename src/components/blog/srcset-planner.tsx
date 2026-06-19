'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type LayoutPreset = 'full-bleed' | 'content-column' | 'sidebar' | 'product-grid'

const LAYOUT_PRESETS: Record<
  LayoutPreset,
  { label: string; sizes: string; description: string }
> = {
  'full-bleed': {
    label: 'Full-width hero',
    sizes: '(min-width: 1024px) 1200px, 100vw',
    description: 'Edge-to-edge on mobile, capped near 1200px on desktop.',
  },
  'content-column': {
    label: 'Article body (720px max)',
    sizes: '(min-width: 768px) 720px, 100vw',
    description: 'Typical blog prose width inside a centered column.',
  },
  sidebar: {
    label: 'Sidebar layout (60% width)',
    sizes: '(min-width: 1024px) 60vw, 100vw',
    description: 'Main column beside a sidebar on large screens.',
  },
  'product-grid': {
    label: 'Product grid (4-up)',
    sizes: '(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw',
    description: 'Quarter width on desktop, half on tablet, full on phone.',
  },
}

function buildWidths(maxCssWidth: number, includeRetina: boolean): number[] {
  const base = [
    Math.round(maxCssWidth * 0.5),
    Math.round(maxCssWidth * 0.75),
    maxCssWidth,
  ]
    .map((w) => Math.max(320, Math.min(w, 2560)))
    .filter((w, i, arr) => arr.indexOf(w) === i)
    .sort((a, b) => a - b)

  if (!includeRetina) return base

  const retina = base.map((w) => Math.min(w * 2, 2560))
  return [...new Set([...base, ...retina])].sort((a, b) => a - b)
}

function buildSrcsetMarkup(
  basePath: string,
  widths: number[],
  sizes: string,
  alt: string,
): string {
  const avifEntries = widths.map((w) => `  ${basePath}-${w}.avif ${w}w`).join(',\n')
  const webpEntries = widths.map((w) => `  ${basePath}-${w}.webp ${w}w`).join(',\n')
  const fallback = widths[widths.length - 1] ?? 800

  return `<picture>
  <source
    type="image/avif"
    srcset="
${avifEntries}
    "
    sizes="${sizes}"
  />
  <source
    type="image/webp"
    srcset="
${webpEntries}
    "
    sizes="${sizes}"
  />
  <img
    src="${basePath}-${fallback}.jpg"
    alt="${alt}"
    width="${fallback}"
    height="${Math.round(fallback * 0.625)}"
    loading="lazy"
    decoding="async"
  />
</picture>`
}

export function SrcsetPlanner() {
  const [maxWidth, setMaxWidth] = useState('1200')
  const [preset, setPreset] = useState<LayoutPreset>('full-bleed')
  const [includeRetina, setIncludeRetina] = useState(true)
  const [basePath, setBasePath] = useState('/images/hero')
  const [altText, setAltText] = useState('Descriptive alt text for this image')
  const [copied, setCopied] = useState(false)

  const maxCssWidth = Math.max(320, Math.min(2560, Number(maxWidth) || 1200))
  const layout = LAYOUT_PRESETS[preset]
  const widths = useMemo(
    () => buildWidths(maxCssWidth, includeRetina),
    [maxCssWidth, includeRetina],
  )
  const markup = useMemo(
    () => buildSrcsetMarkup(basePath, widths, layout.sizes, altText),
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
          Pick a layout, get export widths for Asset Melt and copy-paste{' '}
          <code className="rounded bg-muted/80 px-1 py-0.5 font-mono text-xs">&lt;picture&gt;</code>{' '}
          markup. Adjust values to match your real CSS.
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
          {(Object.keys(LAYOUT_PRESETS) as LayoutPreset[]).map((key) => (
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
              <span className="font-medium">{LAYOUT_PRESETS[key].label}</span>
              <span className="mt-0.5 block font-mono text-[10px] leading-snug opacity-80">
                sizes=&quot;{LAYOUT_PRESETS[key].sizes}&quot;
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
          Export these widths in Asset Melt
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
          Batch-export AVIF + WebP at each width. Keep a JPEG at the largest width as the{' '}
          <code className="rounded bg-muted/80 px-1 font-mono">img src</code> fallback.
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
