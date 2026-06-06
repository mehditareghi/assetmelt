import { useCallback, useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { ChevronsLeftRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CompareScrubberProps {
  position: number
  onPositionChange: (position: number) => void
  beforeUrl: string
  afterUrl: string
  beforeLabel?: string
  afterLabel?: string
  overlay?: ReactNode
  className?: string
}

function positionFromClientX(clientX: number, rect: DOMRect): number {
  const ratio = (clientX - rect.left) / rect.width
  return Math.round(Math.max(0, Math.min(100, ratio * 100)))
}

export function CompareScrubber({
  position,
  onPositionChange,
  beforeUrl,
  afterUrl,
  beforeLabel = 'Before',
  afterLabel = 'After',
  overlay,
  className,
}: CompareScrubberProps) {
  const regionRef = useRef<HTMLDivElement>(null)

  const updateFromClientX = useCallback(
    (clientX: number) => {
      const rect = regionRef.current?.getBoundingClientRect()
      if (!rect || rect.width <= 0) return
      onPositionChange(positionFromClientX(clientX, rect))
    },
    [onPositionChange],
  )

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    const target = event.target as HTMLElement
    if (target.closest('[data-compare-overlay]')) return

    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    updateFromClientX(event.clientX)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    updateFromClientX(event.clientX)
  }

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  return (
    <div className={cn('glass-surface overflow-visible rounded-2xl p-px', className)}>
      <div
        ref={regionRef}
        role="slider"
        aria-label="Compare before and after. Drag horizontally."
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={position}
        tabIndex={0}
        className="group/compare relative aspect-video w-full cursor-ew-resize touch-none overflow-hidden rounded-[calc(1rem-1px)] bg-muted/20 select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') onPositionChange(Math.max(0, position - 2))
          if (e.key === 'ArrowRight') onPositionChange(Math.min(100, position + 2))
        }}
      >
        <img
          src={afterUrl}
          alt={afterLabel}
          className="pointer-events-none absolute inset-0 size-full object-contain"
          draggable={false}
        />

        <img
          src={beforeUrl}
          alt={beforeLabel}
          className="pointer-events-none absolute inset-0 size-full object-contain"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
          draggable={false}
        />

        {/* Full-height seam; grip sits on top at center without shortening the line */}
        <div
          className="pointer-events-none absolute inset-y-0 z-10 -translate-x-1/2"
          style={{ left: `${position}%` }}
          aria-hidden
        >
          <div className="h-full w-0.5 bg-primary shadow-[0_0_10px_var(--primary)]" />
          <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-sm border border-primary/50 bg-background/95 px-0.5 py-1 shadow-sm backdrop-blur-sm">
            <ChevronsLeftRight className="size-3.5 text-primary" strokeWidth={2.5} />
          </div>
        </div>

        <span className="pointer-events-none absolute left-3 top-3 z-20 rounded-md bg-background/70 px-2 py-0.5 font-mono text-xs backdrop-blur-sm">
          {beforeLabel}
        </span>
        <span className="pointer-events-none absolute right-3 top-3 z-20 max-w-[50%] truncate rounded-md bg-background/70 px-2 py-0.5 font-mono text-xs backdrop-blur-sm">
          {afterLabel}
        </span>

        {overlay && (
          <div data-compare-overlay className="pointer-events-auto">
            {overlay}
          </div>
        )}
      </div>
    </div>
  )
}
