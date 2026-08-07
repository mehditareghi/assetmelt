import { describe, expect, it } from 'vitest'
import { clonePipeline } from '@/lib/pipeline-history'
import { createDefaultPipeline } from '@/lib/schemas/pipeline-schema'
import { clampResizeDimension, normalizeResizeConfig } from './resize-compute'

describe('clampResizeDimension', () => {
  it('clamps below the minimum to 1', () => {
    expect(clampResizeDimension(0, 1080)).toBe(1)
    expect(clampResizeDimension(-10, 1080)).toBe(1)
  })

  it('clamps above the maximum to 16384', () => {
    expect(clampResizeDimension(20000, 1080)).toBe(16384)
  })

  it('falls back for NaN and non-finite values; treats empty as 0 → min', () => {
    expect(clampResizeDimension(Number(''), 1080)).toBe(1)
    expect(clampResizeDimension(Number.NaN, 1080)).toBe(1080)
    expect(clampResizeDimension(Number.POSITIVE_INFINITY, 1080)).toBe(1080)
  })
})

describe('normalizeResizeConfig', () => {
  it('clamps invalid width and height from cleared number inputs', () => {
    const normalized = normalizeResizeConfig({
      enabled: true,
      mode: 'exact',
      width: 0,
      height: 0,
      percentage: 100,
      lockAspectRatio: true,
      lockTargetDimensions: false,
      method: 'lanczos3',
      fitMethod: 'contain',
      premultiply: true,
      linearRGB: true,
    })

    expect(normalized.width).toBe(1)
    expect(normalized.height).toBe(1)
  })

  it('keeps history clones valid after invalid dimension updates', () => {
    const pipeline = createDefaultPipeline()
    const withInvalidHeight = {
      ...pipeline,
      resize: normalizeResizeConfig({
        ...pipeline.resize,
        height: 0,
      }),
    }

    expect(() => clonePipeline(withInvalidHeight)).not.toThrow()
    expect(clonePipeline(withInvalidHeight).resize.height).toBe(1)
  })
})
