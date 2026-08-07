import type { ResizeConfig } from '@/lib/schemas/pipeline-schema'

export interface ComputedResize {
  width: number
  height: number
  fitMethod: 'stretch' | 'contain'
  skipped: boolean
}

const RESIZE_DIM_MIN = 1
const RESIZE_DIM_MAX = 16384
const RESIZE_PERCENTAGE_MIN = 1
const RESIZE_PERCENTAGE_MAX = 400

export function clampResizeDimension(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(RESIZE_DIM_MAX, Math.max(RESIZE_DIM_MIN, Math.round(n)))
}

function clampResizePercentage(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(RESIZE_PERCENTAGE_MAX, Math.max(RESIZE_PERCENTAGE_MIN, n))
}

/** Normalize legacy persisted resize configs. */
export function normalizeResizeConfig(resize: ResizeConfig & Record<string, unknown>): ResizeConfig {
  const legacy = resize as ResizeConfig & {
    maintainAspect?: boolean
    maxDimension?: number
    mode?: ResizeConfig['mode']
    lockAspectRatio?: boolean
    percentage?: number
  }

  const lockAspectRatio =
    legacy.lockAspectRatio ?? legacy.maintainAspect ?? true

  let mode = legacy.mode ?? 'maxSide'
  let width = clampResizeDimension(legacy.width, 1920)
  let height = clampResizeDimension(legacy.height, 1080)

  if (!legacy.mode && legacy.maxDimension) {
    mode = 'maxSide'
    width = clampResizeDimension(legacy.maxDimension, 1920)
    height = width
  }

  return {
    enabled: legacy.enabled ?? false,
    mode,
    width,
    height,
    percentage: clampResizePercentage(legacy.percentage, 100),
    lockAspectRatio,
    lockTargetDimensions: legacy.lockTargetDimensions ?? false,
    method: legacy.method ?? 'lanczos3',
    fitMethod: legacy.fitMethod ?? 'contain',
    premultiply: legacy.premultiply ?? true,
    linearRGB: legacy.linearRGB ?? true,
  }
}

export function computeTargetSize(
  sourceW: number,
  sourceH: number,
  resize: ResizeConfig,
): ComputedResize {
  if (!resize.enabled || sourceW <= 0 || sourceH <= 0) {
    return { width: sourceW, height: sourceH, fitMethod: 'contain', skipped: true }
  }

  const { mode, width, height, percentage, lockAspectRatio, fitMethod } = resize

  switch (mode) {
    case 'percentage': {
      const scale = percentage / 100
      return {
        width: Math.max(1, Math.round(sourceW * scale)),
        height: Math.max(1, Math.round(sourceH * scale)),
        fitMethod: 'stretch',
        skipped: false,
      }
    }
    case 'maxSide': {
      const maxSide = width
      const ratio = maxSide / Math.max(sourceW, sourceH)
      return {
        width: Math.max(1, Math.round(sourceW * ratio)),
        height: Math.max(1, Math.round(sourceH * ratio)),
        fitMethod: 'stretch',
        skipped: false,
      }
    }
    case 'maxWidth': {
      if (sourceW <= width) {
        return { width: sourceW, height: sourceH, fitMethod: 'stretch', skipped: false }
      }
      const ratio = width / sourceW
      return {
        width,
        height: lockAspectRatio ? Math.max(1, Math.round(sourceH * ratio)) : height,
        fitMethod: lockAspectRatio ? 'stretch' : fitMethod,
        skipped: false,
      }
    }
    case 'maxHeight': {
      if (sourceH <= height) {
        return { width: sourceW, height: sourceH, fitMethod: 'stretch', skipped: false }
      }
      const ratio = height / sourceH
      return {
        width: lockAspectRatio ? Math.max(1, Math.round(sourceW * ratio)) : width,
        height,
        fitMethod: lockAspectRatio ? 'stretch' : fitMethod,
        skipped: false,
      }
    }
    case 'exact': {
      if (lockAspectRatio) {
        const scale = Math.min(width / sourceW, height / sourceH)
        return {
          width: Math.max(1, Math.round(sourceW * scale)),
          height: Math.max(1, Math.round(sourceH * scale)),
          fitMethod: 'contain',
          skipped: false,
        }
      }
      return { width, height, fitMethod: 'stretch', skipped: false }
    }
    default:
      return { width: sourceW, height: sourceH, fitMethod: 'contain', skipped: true }
  }
}

export function resizeFromSourceDimensions(
  sourceW: number,
  sourceH: number,
  partial?: Partial<ResizeConfig>,
): ResizeConfig {
  return normalizeResizeConfig({
    enabled: true,
    mode: 'exact',
    width: sourceW,
    height: sourceH,
    percentage: 100,
    lockAspectRatio: true,
    lockTargetDimensions: false,
    method: 'lanczos3',
    fitMethod: 'contain',
    premultiply: true,
    linearRGB: true,
    ...partial,
  })
}
