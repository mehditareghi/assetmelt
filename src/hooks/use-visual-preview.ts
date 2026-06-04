import { useEffect, useMemo, useRef, useState } from 'react'
import type { PipelineConfig } from '@/lib/schemas/pipeline-schema'
import { renderVisualPreview } from '@/lib/image/visual-preview-render'
import { needsPipelinePreview } from '@/lib/image/pipeline-preview'

const DEBOUNCE_MS = 80

function visualPreviewSignature(pipeline: PipelineConfig): string {
  return JSON.stringify({
    crop: pipeline.crop,
    rotate: pipeline.rotate,
    flip: pipeline.flip,
    filters: pipeline.filters,
  })
}

export function useVisualPreview(
  imageUrl: string | undefined,
  pipeline: PipelineConfig,
  enabled: boolean,
  sourceWidth?: number,
  sourceHeight?: number,
): {
  previewUrl: string | undefined
  previewWidth: number | undefined
  previewHeight: number | undefined
  isRendering: boolean
} {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>()
  const [previewWidth, setPreviewWidth] = useState<number | undefined>()
  const [previewHeight, setPreviewHeight] = useState<number | undefined>()
  const [isRendering, setIsRendering] = useState(false)
  const wasEnabledRef = useRef(false)
  const pipelineSignature = useMemo(() => visualPreviewSignature(pipeline), [pipeline])

  useEffect(() => {
    if (!enabled || !imageUrl) {
      setIsRendering(false)
      wasEnabledRef.current = false
      return
    }

    if (!needsPipelinePreview(pipeline, sourceWidth, sourceHeight)) {
      setPreviewUrl(undefined)
      setPreviewWidth(undefined)
      setPreviewHeight(undefined)
      setIsRendering(false)
      wasEnabledRef.current = enabled
      return
    }

    const immediate = !wasEnabledRef.current
    wasEnabledRef.current = true

    let cancelled = false
    setIsRendering(true)

    const timer = window.setTimeout(
      () => {
        void (async () => {
          try {
            const result = await renderVisualPreview(
              imageUrl,
              pipeline,
              sourceWidth,
              sourceHeight,
            )
            if (cancelled) return
            setPreviewUrl(result.url)
            setPreviewWidth(result.width)
            setPreviewHeight(result.height)
          } catch {
            if (!cancelled) {
              setPreviewUrl(undefined)
              setPreviewWidth(undefined)
              setPreviewHeight(undefined)
            }
          } finally {
            if (!cancelled) setIsRendering(false)
          }
        })()
      },
      immediate ? 0 : DEBOUNCE_MS,
    )

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [enabled, imageUrl, pipeline, pipelineSignature, sourceWidth, sourceHeight])

  return { previewUrl, previewWidth, previewHeight, isRendering }
}
