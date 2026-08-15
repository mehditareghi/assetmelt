import { MapPin } from 'lucide-react'
import { useStudioStore } from '@/stores/studio-store'
import {
  formatExifGps,
  gpsKeepRisk,
  isExifSummaryEmpty,
  type ExifInspectSummary,
} from '@/lib/image/exif-inspect'
import type { MetadataMode, OutputFormat } from '@/lib/schemas/pipeline-schema'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function ExifInspector({
  summary,
  metadataMode,
  outputFormat,
  onStripGps,
}: {
  summary: ExifInspectSummary | undefined
  metadataMode: MetadataMode | undefined
  outputFormat: OutputFormat
  onStripGps: () => void
}) {
  const risk = gpsKeepRisk(summary, metadataMode, outputFormat)
  const empty = isExifSummaryEmpty(summary)

  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-border/40 bg-background/30 px-3 py-2.5">
        {empty ? (
          <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
            No camera, date, or GPS tags in this file. Inspector reads the source before encode —
            HEIC is inspected before the JPEG bounce.
          </p>
        ) : (
          <dl className="grid gap-1.5 font-mono text-[11px]">
            <ExifRow label="Camera" value={summary!.camera ?? '—'} />
            <ExifRow label="Taken" value={summary!.date ?? '—'} />
            <ExifRow
              label="GPS"
              value={
                summary!.gps
                  ? formatExifGps(summary!.gps)
                  : summary!.hasGps
                    ? 'Present (coordinates not readable)'
                    : '—'
              }
              warn={summary!.hasGps}
            />
          </dl>
        )}
      </div>

      {risk === 'write' ? (
        <div className="callout-warning space-y-2 rounded-md px-3 py-2 text-xs">
          <p className="leading-relaxed">
            This photo has GPS. Keep will write location into JPEG, WebP, or PNG. Use Strip GPS
            unless you intend to publish coordinates.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 font-mono text-[11px]"
            onClick={onStripGps}
          >
            Strip GPS
          </Button>
        </div>
      ) : null}

      {risk === 'pixels-only' ? (
        <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
          This photo has GPS. AVIF, JXL, and QOI export pixels only — location will not be in the
          file. Keep on JPEG, WebP, or PNG would write it.
        </p>
      ) : null}
    </div>
  )
}

function ExifRow({
  label,
  value,
  warn,
}: {
  label: string
  value: string
  warn?: boolean
}) {
  return (
    <div className="flex min-w-0 items-baseline gap-2">
      <dt className="w-14 shrink-0 text-muted-foreground">{label}</dt>
      <dd className={cn('min-w-0 break-words text-foreground', warn && 'text-amber-600 dark:text-amber-400')}>
        {value}
      </dd>
    </div>
  )
}

export function ExifPreviewStrip({ summary }: { summary: ExifInspectSummary | undefined }) {
  if (isExifSummaryEmpty(summary)) return null
  const parts = [summary!.camera, summary!.date, summary!.hasGps ? 'GPS' : null].filter(Boolean)
  if (parts.length === 0) return null
  return (
    <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 font-mono text-[11px] text-muted-foreground">
      {summary!.hasGps ? <MapPin className="size-3 text-amber-600 dark:text-amber-400" aria-hidden /> : null}
      <span>{parts.join(' · ')}</span>
    </p>
  )
}

export function ActiveFileExifInspector() {
  const files = useStudioStore((s) => s.files)
  const activeFileId = useStudioStore((s) => s.activeFileId)
  const pipeline = useStudioStore((s) => s.pipeline)
  const updatePipeline = useStudioStore((s) => s.updatePipeline)
  const active = files.find((file) => file.id === activeFileId)

  if (!active) {
    return (
      <p className="font-mono text-[11px] text-muted-foreground">
        Add a file to inspect camera, date, and GPS before strip.
      </p>
    )
  }

  return (
    <ExifInspector
      summary={active.exif}
      metadataMode={pipeline.metadataMode}
      outputFormat={pipeline.outputFormat}
      onStripGps={() => updatePipeline({ metadataMode: 'strip-gps' })}
    />
  )
}
