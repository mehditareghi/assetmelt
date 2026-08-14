'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Code2, Copy, Download, Layers, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  buildNextImageSnippet,
  buildPictureMarkup,
  buildResponsiveWidths,
  clampWidthsToSource,
  DEFAULT_RESPONSIVE_FORMATS,
  defaultBasePathFromFileName,
  generateResponsiveExportZip,
  normalizeResponsiveFormats,
  RESPONSIVE_FORMAT_OPTIONS,
  RESPONSIVE_LAYOUT_PRESETS,
  stemFromBasePath,
  type ResponsiveFormat,
  type ResponsiveLayoutPreset,
} from '@/lib/responsive-export'
import { getActivePlatformWorkflow } from '@/lib/platform-presets'
import { useStudioStore } from '@/stores/studio-store'
import { cn } from '@/lib/utils'

function WidthScale({ widths }: { widths: number[] }) {
  if (widths.length === 0) return null
  const max = widths[widths.length - 1]!

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/40 bg-muted/20 px-3 py-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, transparent, transparent 11px, color-mix(in oklab, var(--border) 55%, transparent) 11px, color-mix(in oklab, var(--border) 55%, transparent) 12px)',
        }}
      />
      <div className="relative flex h-14 items-end gap-1.5">
        {widths.map((w, i) => {
          const pct = Math.max(0.18, w / max)
          const barH = Math.round(pct * 44)
          return (
            <div
              key={w}
              className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
              style={{ animationDelay: `${i * 45}ms` }}
            >
              <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                {w}
              </span>
              <span
                className="w-full max-w-10 rounded-t-sm bg-primary/80 shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_35%,transparent)] transition-[height] duration-500 ease-out"
                style={{ height: barH }}
              />
            </div>
          )
        })}
      </div>
      <p className="relative mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        Export ladder · px
      </p>
    </div>
  )
}

export function ResponsiveExportSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const files = useStudioStore((s) => s.files)
  const activeFileId = useStudioStore((s) => s.activeFileId)
  const pipeline = useStudioStore((s) => s.pipeline)
  const activePresetId = useStudioStore((s) => s.activePresetId)
  const activeFile = files.find((f) => f.id === activeFileId) ?? files[0]

  const [maxWidth, setMaxWidth] = useState('1200')
  const [preset, setPreset] = useState<ResponsiveLayoutPreset>('full-bleed')
  const [includeRetina, setIncludeRetina] = useState(true)
  const [formats, setFormats] = useState<ResponsiveFormat[]>(DEFAULT_RESPONSIVE_FORMATS)
  const [basePath, setBasePath] = useState('/images/hero')
  const [altText, setAltText] = useState('')
  const [snippetTab, setSnippetTab] = useState<'picture' | 'next'>('picture')
  const [copied, setCopied] = useState<'picture' | 'next' | null>(null)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!open || !activeFile) return
    setBasePath(defaultBasePathFromFileName(activeFile.name))
    setAltText((prev) => prev || activeFile.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '))
  }, [open, activeFile?.id, activeFile?.name])

  const maxCssWidth = Math.max(320, Math.min(2560, Number(maxWidth) || 1200))
  const layout = RESPONSIVE_LAYOUT_PRESETS[preset]
  const plannedWidths = useMemo(
    () => buildResponsiveWidths(maxCssWidth, includeRetina),
    [maxCssWidth, includeRetina],
  )
  const exportWidths = useMemo(
    () => clampWidthsToSource(plannedWidths, activeFile?.originalWidth),
    [plannedWidths, activeFile?.originalWidth],
  )
  const normalizedFormats = useMemo(() => normalizeResponsiveFormats(formats), [formats])
  const filenameStem = useMemo(
    () => stemFromBasePath(basePath, activeFile?.name.replace(/\.[^.]+$/, '') || 'image'),
    [basePath, activeFile?.name],
  )

  const pictureMarkup = useMemo(
    () =>
      buildPictureMarkup({
        basePath,
        widths: exportWidths,
        sizes: layout.sizes,
        alt: altText || 'Descriptive alt text',
        formats: normalizedFormats,
        sourceWidth: activeFile?.originalWidth,
        sourceHeight: activeFile?.originalHeight,
      }),
    [
      basePath,
      exportWidths,
      layout.sizes,
      altText,
      normalizedFormats,
      activeFile?.originalWidth,
      activeFile?.originalHeight,
    ],
  )

  const nextSnippet = useMemo(
    () =>
      buildNextImageSnippet({
        basePath,
        widths: exportWidths,
        sizes: layout.sizes,
        alt: altText || 'Descriptive alt text',
        formats: normalizedFormats,
        sourceWidth: activeFile?.originalWidth,
        sourceHeight: activeFile?.originalHeight,
      }),
    [
      basePath,
      exportWidths,
      layout.sizes,
      altText,
      normalizedFormats,
      activeFile?.originalWidth,
      activeFile?.originalHeight,
    ],
  )

  const variantCount = exportWidths.length * normalizedFormats.length
  const sourceCapped =
    activeFile?.originalWidth != null &&
    plannedWidths.some((w) => w > activeFile.originalWidth!)

  const toggleFormat = (format: ResponsiveFormat, enabled: boolean) => {
    setFormats((prev) => {
      const next = new Set(prev)
      if (enabled) next.add(format)
      else next.delete(format)
      const normalized = normalizeResponsiveFormats([...next])
      return normalized.length > 0 ? normalized : prev
    })
  }

  const handleCopy = async (kind: 'picture' | 'next') => {
    const text = kind === 'picture' ? pictureMarkup : nextSnippet
    try {
      await navigator.clipboard.writeText(text)
      setCopied(kind)
      window.setTimeout(() => setCopied(null), 1800)
      toast.success(kind === 'picture' ? 'Copied <picture> markup' : 'Copied next/image snippet')
    } catch {
      toast.error('Could not copy — select the code and copy manually')
    }
  }

  const handleGenerate = async () => {
    if (!activeFile || generating) return
    if (normalizedFormats.length === 0) {
      toast.error('Pick at least one format')
      return
    }
    setGenerating(true)
    setProgress(0)
    try {
      // Platform kits (favicon / OG) force exact canvases — strip that crop for srcset kits.
      const platform = getActivePlatformWorkflow(activePresetId)
      const exportPipeline = platform
        ? {
            ...pipeline,
            alsoExportFormats: [] as typeof pipeline.alsoExportFormats,
            crop: {
              enabled: false,
              aspectRatio: 'free' as const,
              x: 0,
              y: 0,
              width: 100,
              height: 100,
            },
          }
        : { ...pipeline, alsoExportFormats: [] as typeof pipeline.alsoExportFormats }

      const { count, zipName } = await generateResponsiveExportZip({
        file: activeFile,
        pipeline: exportPipeline,
        widths: exportWidths,
        formats: normalizedFormats,
        filenameStem,
        onProgress: setProgress,
      })
      toast.success(`Downloaded ${zipName}`, {
        description: `${count} files in width folders · copy markup when ready`,
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Responsive export failed')
    } finally {
      setGenerating(false)
      setProgress(0)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full max-w-[100vw] flex-col gap-0 overflow-x-hidden p-0 sm:max-w-lg"
        showCloseButton
      >
        <SheetHeader className="relative shrink-0 overflow-hidden border-b border-border/50 px-4 pt-4 pb-4">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,color-mix(in_oklab,var(--primary)_18%,transparent),transparent_55%)]"
          />
          <SheetTitle className="relative font-display text-lg tracking-tight">
            Responsive export
          </SheetTitle>
          <SheetDescription className="relative text-sm leading-relaxed">
            Plan widths, download a ZIP named by width, and copy{' '}
            <code className="rounded bg-muted/80 px-1 font-mono text-[11px]">&lt;picture&gt;</code>{' '}
            or next/image — without changing your normal Download.
          </SheetDescription>
        </SheetHeader>

        {!activeFile ? (
          <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground">
            Add an image to the queue first. This kit uses the current file only.
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-6">
              <section className="space-y-3">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    Width ladder
                  </h3>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {activeFile.originalWidth
                      ? `source ${activeFile.originalWidth}px`
                      : 'source size unknown'}
                  </span>
                </div>
                <WidthScale widths={exportWidths} />
                {sourceCapped ? (
                  <p className="text-xs text-muted-foreground">
                    Widths above the source are capped at {activeFile.originalWidth}px — we never
                    upscale.
                  </p>
                ) : null}
              </section>

              <section className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="responsive-max-width" className="text-xs font-medium">
                    Max CSS width (px)
                  </Label>
                  <Input
                    id="responsive-max-width"
                    type="number"
                    min={320}
                    max={2560}
                    value={maxWidth}
                    onChange={(e) => setMaxWidth(e.target.value)}
                    disabled={generating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="responsive-base-path" className="text-xs font-medium">
                    Deploy path prefix
                  </Label>
                  <Input
                    id="responsive-base-path"
                    type="text"
                    value={basePath}
                    onChange={(e) => setBasePath(e.target.value)}
                    disabled={generating}
                    spellCheck={false}
                  />
                </div>
              </section>

              <fieldset className="space-y-2">
                <legend className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Layout → sizes
                </legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(Object.keys(RESPONSIVE_LAYOUT_PRESETS) as ResponsiveLayoutPreset[]).map(
                    (key) => {
                      const item = RESPONSIVE_LAYOUT_PRESETS[key]
                      const active = preset === key
                      return (
                        <button
                          key={key}
                          type="button"
                          disabled={generating}
                          onClick={() => setPreset(key)}
                          className={cn(
                            'rounded-lg border px-3 py-2.5 text-left transition-colors',
                            active
                              ? 'border-primary/45 bg-primary/10 text-foreground'
                              : 'border-border/50 bg-background/40 text-muted-foreground hover:border-border hover:text-foreground',
                          )}
                        >
                          <span className="block text-sm font-medium text-foreground">
                            {item.label}
                          </span>
                          <span className="mt-1 block font-mono text-[10px] leading-snug opacity-80">
                            {item.sizes}
                          </span>
                        </button>
                      )
                    },
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{layout.description}</p>
              </fieldset>

              <label className="flex cursor-pointer items-start gap-2.5 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={includeRetina}
                  onChange={(e) => setIncludeRetina(e.target.checked)}
                  disabled={generating}
                  className="mt-0.5 size-4 rounded border-border accent-primary"
                />
                <span>
                  Include 2× retina widths
                  <span className="mt-0.5 block text-xs opacity-80">
                    Recommended for heroes and product shots on dense displays.
                  </span>
                </span>
              </label>

              <fieldset className="space-y-2">
                <legend className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Formats
                </legend>
                <div className="flex flex-wrap gap-2">
                  {RESPONSIVE_FORMAT_OPTIONS.map((opt) => {
                    const on = normalizedFormats.includes(opt.id)
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={generating}
                        onClick={() => toggleFormat(opt.id, !on)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-xs transition-colors',
                          on
                            ? 'border-primary/40 bg-primary/12 text-foreground'
                            : 'border-border/50 text-muted-foreground hover:border-border',
                        )}
                      >
                        {on ? <Check className="size-3" /> : <Layers className="size-3 opacity-50" />}
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  JPEG is the{' '}
                  <code className="rounded bg-muted/70 px-1 font-mono text-[10px]">img</code> /{' '}
                  <code className="rounded bg-muted/70 px-1 font-mono text-[10px]">next/image</code>{' '}
                  fallback. ZIP folders are named by width ({exportWidths[0] ?? '…'}/, …).
                </p>
              </fieldset>

              <div className="space-y-2">
                <Label htmlFor="responsive-alt" className="text-xs font-medium">
                  Alt text
                </Label>
                <Input
                  id="responsive-alt"
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  disabled={generating}
                />
              </div>

              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <Code2 className="size-3.5 text-muted-foreground" />
                  <h3 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    Drop-in code
                  </h3>
                </div>
                <Tabs
                  value={snippetTab}
                  onValueChange={(v) => setSnippetTab(v as 'picture' | 'next')}
                >
                  <TabsList variant="line" className="w-full justify-start">
                    <TabsTrigger value="picture">&lt;picture&gt;</TabsTrigger>
                    <TabsTrigger value="next">next/image</TabsTrigger>
                  </TabsList>
                  <TabsContent value="picture" className="mt-3 space-y-2">
                    <pre className="max-h-48 overflow-auto rounded-lg border border-border/40 bg-muted/25 p-3 font-mono text-[11px] leading-relaxed text-foreground">
                      {pictureMarkup}
                    </pre>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="gap-1.5"
                      onClick={() => void handleCopy('picture')}
                    >
                      <Copy className="size-3.5" />
                      {copied === 'picture' ? 'Copied' : 'Copy HTML'}
                    </Button>
                  </TabsContent>
                  <TabsContent value="next" className="mt-3 space-y-2">
                    <pre className="max-h-48 overflow-auto rounded-lg border border-border/40 bg-muted/25 p-3 font-mono text-[11px] leading-relaxed text-foreground">
                      {nextSnippet}
                    </pre>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="gap-1.5"
                      onClick={() => void handleCopy('next')}
                    >
                      <Copy className="size-3.5" />
                      {copied === 'next' ? 'Copied' : 'Copy snippet'}
                    </Button>
                  </TabsContent>
                </Tabs>
              </section>
            </div>
          </div>
        )}

        {activeFile ? (
          <div className="shrink-0 space-y-3 border-t border-border/50 bg-background/80 px-4 py-3 backdrop-blur-sm">
            {generating ? (
              <div className="space-y-1.5">
                <div className="flex justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span>Encoding kit</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-200 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-[11px] text-muted-foreground">
                {variantCount} file{variantCount === 1 ? '' : 's'} · {exportWidths.length} width
                {exportWidths.length === 1 ? '' : 's'} × {normalizedFormats.length} format
                {normalizedFormats.length === 1 ? '' : 's'}
              </p>
              <Button
                type="button"
                size="sm"
                className="gap-1.5"
                disabled={generating || variantCount === 0}
                onClick={() => void handleGenerate()}
              >
                {generating ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Download className="size-3.5" />
                )}
                {generating ? 'Encoding…' : 'Download ZIP'}
              </Button>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Uses your current quality, filters, and crop. Fit-to-size / favicon presets are ignored
              for this kit so heroes stay full-bleed. Primary Download stays a single output.
            </p>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
