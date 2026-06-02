import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import type { CropAspectRatio, CropConfig } from '@/lib/schemas/pipeline-schema'
import {
  cropConfigToRect,
  cropToDisplay,
  getObjectContainRect,
  mergeCropRect,
  resizeCropFromHandle,
  type CropHandle,
} from '@/lib/image/crop-math'
import { cn } from '@/lib/utils'

const HANDLES: Array<{ id: CropHandle; className: string; cursor: string }> = [
  { id: 'nw', className: '-left-1.5 -top-1.5', cursor: 'cursor-nwse-resize' },
  { id: 'n', className: 'left-1/2 -top-1.5 -translate-x-1/2', cursor: 'cursor-ns-resize' },
  { id: 'ne', className: '-right-1.5 -top-1.5', cursor: 'cursor-nesw-resize' },
  { id: 'e', className: '-right-1.5 top-1/2 -translate-y-1/2', cursor: 'cursor-ew-resize' },
  { id: 'se', className: '-right-1.5 -bottom-1.5', cursor: 'cursor-nwse-resize' },
  { id: 's', className: 'bottom-[-6px] left-1/2 -translate-x-1/2', cursor: 'cursor-ns-resize' },
  { id: 'sw', className: '-bottom-1.5 -left-1.5', cursor: 'cursor-nesw-resize' },
  { id: 'w', className: '-left-1.5 top-1/2 -translate-y-1/2', cursor: 'cursor-ew-resize' },
]

interface CropOverlayProps {
  crop: CropConfig
  sourceWidth: number
  sourceHeight: number
  onCropChange: (crop: CropConfig) => void
  containerRef: React.RefObject<HTMLElement | null>
  /** Bumped when the preview image loads or the active file changes. */
  layoutKey?: string | number
}

export function CropOverlay({
  crop,
  sourceWidth,
  sourceHeight,
  onCropChange,
  containerRef,
  layoutKey,
}: CropOverlayProps) {
  const cropRef = useRef(crop)
  const dragRef = useRef<{
    handle: CropHandle
    pointerId: number
    startX: number
    startY: number
    startCrop: ReturnType<typeof cropConfigToRect>
    scale: number
    lockAspectRatio: CropAspectRatio
  } | null>(null)
  const [imageRect, setImageRect] = useState({ x: 0, y: 0, width: 0, height: 0 })

  cropRef.current = crop

  const updateImageRect = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    setImageRect(
      getObjectContainRect(
        container.clientWidth,
        container.clientHeight,
        sourceWidth,
        sourceHeight,
      ),
    )
  }, [containerRef, sourceWidth, sourceHeight])

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    let cancelled = false
    let frameId = 0

    const measure = () => {
      if (!cancelled) updateImageRect()
    }

    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(container)

    // Container can report 0×0 on first paint (grid mount, aspect-ratio) before ResizeObserver fires.
    const retryUntilSized = () => {
      if (cancelled) return
      measure()
      if (container.clientWidth <= 0 || container.clientHeight <= 0) {
        frameId = requestAnimationFrame(retryUntilSized)
      }
    }
    frameId = requestAnimationFrame(retryUntilSized)

    return () => {
      cancelled = true
      observer.disconnect()
      cancelAnimationFrame(frameId)
    }
  }, [containerRef, updateImageRect, sourceWidth, sourceHeight, layoutKey])

  const endDrag = useCallback(() => {
    dragRef.current = null
  }, [])

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      const drag = dragRef.current
      if (!drag || event.pointerId !== drag.pointerId) return
      if (event.buttons !== 1) {
        endDrag()
        return
      }

      const deltaX = (event.clientX - drag.startX) * drag.scale
      const deltaY = (event.clientY - drag.startY) * drag.scale

      const nextRect = resizeCropFromHandle(
        drag.startCrop,
        drag.handle,
        deltaX,
        deltaY,
        drag.lockAspectRatio,
        sourceWidth,
        sourceHeight,
      )

      const isCorner =
        drag.handle === 'nw' ||
        drag.handle === 'ne' ||
        drag.handle === 'sw' ||
        drag.handle === 'se'
      const lockAspect =
        isCorner && drag.lockAspectRatio !== 'free' ? drag.lockAspectRatio : undefined

      onCropChange(mergeCropRect(cropRef.current, nextRect, lockAspect))
    },
    [endDrag, onCropChange, sourceWidth, sourceHeight],
  )

  const onPointerUp = useCallback(
    (event: PointerEvent) => {
      if (!dragRef.current || event.pointerId !== dragRef.current.pointerId) return
      endDrag()
    },
    [endDrag],
  )

  useLayoutEffect(() => {
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
    }
  }, [onPointerMove, onPointerUp])

  const displayCrop = cropToDisplay(
    cropConfigToRect(crop),
    imageRect,
    sourceWidth,
    sourceHeight,
  )

  const startDrag = (handle: CropHandle) => (event: React.PointerEvent) => {
    if (event.button !== 0 || imageRect.width <= 0) return

    event.preventDefault()
    event.stopPropagation()

    const scale = sourceWidth / imageRect.width
    dragRef.current = {
      handle,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startCrop: cropConfigToRect(cropRef.current),
      scale,
      lockAspectRatio: cropRef.current.aspectRatio,
    }
  }

  if (imageRect.width <= 0 || imageRect.height <= 0) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <div
        className="pointer-events-auto absolute touch-none cursor-move"
        style={{
          left: displayCrop.x,
          top: displayCrop.y,
          width: displayCrop.width,
          height: displayCrop.height,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55)',
        }}
        onPointerDown={startDrag('move')}
      >
        <div className="pointer-events-none absolute inset-0 border-2 border-primary shadow-[0_0_0_1px_rgba(0,0,0,0.35)_inset]" />

        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-y-0 left-1/3 w-px bg-white/25" />
          <div className="absolute inset-y-0 left-2/3 w-px bg-white/25" />
          <div className="absolute inset-x-0 top-1/3 h-px bg-white/25" />
          <div className="absolute inset-x-0 top-2/3 h-px bg-white/25" />
        </div>

        <div className="pointer-events-none absolute bottom-1 left-1 rounded bg-primary/90 px-1.5 py-0.5 font-mono text-[10px] font-medium text-primary-foreground shadow-sm">
          {crop.width} × {crop.height}
        </div>

        {HANDLES.map(({ id, className, cursor }) => (
          <div
            key={id}
            className={cn(
              'absolute size-3 rounded-sm border-2 border-primary bg-background shadow-sm',
              className,
              cursor,
            )}
            onPointerDown={startDrag(id)}
          />
        ))}
      </div>
    </div>
  )
}
