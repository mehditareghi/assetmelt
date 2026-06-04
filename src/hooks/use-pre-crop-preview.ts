import { useEffect, useMemo, useState } from 'react'
import type { PipelineConfig } from '@/lib/schemas/pipeline-schema'
import {
  needsPreCropPreview,
  renderPreCropPreview,
} from '@/lib/image/visual-preview-render'

const DEBOUNCE_MS = 80

function preCropPreviewSignature(pipeline: PipelineConfig): string {
  return JSON.stringify({
    rotate: pipeline.rotate,
    flip: pipeline.flip,
    filters: pipeline.filters,
  })
}

/** Preview of rotate → flip → filters (the canvas used for crop editing). */
export function usePreCropPreview(
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
  const signature = useMemo(() => preCropPreviewSignature(pipeline), [pipeline])

  useEffect(() => {
    if (!enabled || !imageUrl) {
      setPreviewUrl(undefined)
      setPreviewWidth(undefined)
      setPreviewHeight(undefined)
      setIsRendering(false)
      return
    }

    if (!needsPreCropPreview(pipeline)) {
      setPreviewUrl(undefined)
      setPreviewWidth(undefined)
      setPreviewHeight(undefined)
      setIsRendering(false)
      return
    }

    let cancelled = false
    setIsRendering(true)

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const result = await renderPreCropPreview(
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
    }, DEBOUNCE_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [enabled, imageUrl, pipeline, signature, sourceWidth, sourceHeight])

  return { previewUrl, previewWidth, previewHeight, isRendering }
}
