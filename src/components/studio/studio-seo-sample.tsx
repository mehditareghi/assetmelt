import { useState } from 'react'
import { ChevronsLeftRight } from 'lucide-react'
import type { StudioSeoBeforeAfter, StudioSeoSampleScene } from '@/lib/studio-seo/types'
import {
  STUDIO_SEO_SAMPLE_ALT,
  STUDIO_SEO_SAMPLE_SRC,
} from '@/lib/studio-seo/sample-assets'
import { cn } from '@/lib/utils'

function SampleImage({
  scene,
  variant,
  className,
}: {
  scene: StudioSeoSampleScene
  variant: 'before' | 'after'
  className?: string
}) {
  const src = STUDIO_SEO_SAMPLE_SRC[scene]
  const alt = STUDIO_SEO_SAMPLE_ALT[scene]

  return (
    <div className={cn('absolute inset-0 bg-muted', className)}>
      <img
        src={src}
        alt={alt}
        width={1400}
        height={788}
        decoding="async"
        draggable={false}
        className={cn(
          'pointer-events-none size-full object-cover',
          variant === 'before' && 'brightness-[0.97] contrast-[0.96] saturate-[0.92]',
          variant === 'after' && 'brightness-[1.02] contrast-[1.03] saturate-[1.04]',
        )}
      />
    </div>
  )
}

export function StudioSeoSample({ sample }: { sample: StudioSeoBeforeAfter }) {
  const [position, setPosition] = useState(58)

  return (
    <figure className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold tracking-tight">{sample.heading}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{sample.scenario}</p>
        </div>
        <p className="font-mono text-xs font-medium text-primary">{sample.savings}</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="relative aspect-[16/9] w-full select-none bg-muted">
          <SampleImage scene={sample.scene} variant="before" />
          <div
            className="absolute inset-0"
            style={{ clipPath: `inset(0 0 0 ${position}%)` }}
          >
            <SampleImage scene={sample.scene} variant="after" />
          </div>

          <div
            className="pointer-events-none absolute inset-y-0 z-20 w-px bg-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.12)]"
            style={{ left: `${position}%` }}
            aria-hidden
          >
            <span className="absolute top-1/2 left-1/2 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-card text-muted-foreground shadow-md">
              <ChevronsLeftRight className="size-3.5" strokeWidth={2.5} />
            </span>
          </div>

          <div className="pointer-events-none absolute inset-x-3 top-3 z-30 flex items-start justify-between gap-2">
            <span className="rounded-md border border-border/50 bg-card/95 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-foreground shadow-sm backdrop-blur-sm">
              {sample.before.format} · {sample.before.size}
            </span>
            <span className="rounded-md bg-primary px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-primary-foreground shadow-sm">
              {sample.after.format} · {sample.after.size}
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={100}
            value={position}
            onChange={(event) => setPosition(Number(event.target.value))}
            aria-label="Compare typical before and after sample"
            className="absolute inset-0 z-10 cursor-ew-resize opacity-0"
          />
        </div>

        <div className="grid gap-3 border-t border-border/50 bg-card p-4 sm:grid-cols-2">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Before · {sample.before.format}</span>
            <span className="mt-0.5 block font-mono text-xs">
              {sample.before.size} — {sample.before.note}
            </span>
          </p>
          <p className="text-sm text-muted-foreground sm:text-right">
            <span className="font-medium text-foreground">After · {sample.after.format}</span>
            <span className="mt-0.5 block font-mono text-xs">
              {sample.after.size} — {sample.after.note}
            </span>
          </p>
        </div>
      </div>

      <figcaption className="text-sm leading-relaxed text-muted-foreground">
        {sample.caption}
      </figcaption>
    </figure>
  )
}
