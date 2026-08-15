import { describe, expect, it } from 'vitest'
import { parseAspectRatio } from '@/lib/image/crop-math'
import {
  getActivePlatformWorkflow,
  getPlatformPreset,
  PLATFORM_BUILT_IN_PRESETS,
  PLATFORM_WORKFLOWS,
} from '@/lib/platform-presets'

function exactSize(presetId: string): { width: number; height: number } {
  const resize = getPlatformPreset(presetId)?.config.resize
  expect(resize?.mode).toBe('exact')
  return { width: resize!.width, height: resize!.height }
}

describe('platform kits', () => {
  it('includes X card at 1200×600 (2:1)', () => {
    expect(exactSize('x-card')).toEqual({ width: 1200, height: 600 })
    expect(getPlatformPreset('x-card')?.platform?.suggestedCropAspect).toBe('2:1')
    expect(parseAspectRatio('2:1')).toBe(2)
  })

  it('App Store kit zips iPhone 6.9" and iPad 13" portrait JPEGs', () => {
    const workflow = getActivePlatformWorkflow('app-store-kit')
    expect(workflow?.variants.map((v) => v.id)).toEqual([
      'app-store-iphone',
      'app-store-ipad',
    ])
    expect(workflow?.previewVariantId).toBe('app-store-iphone')
    const iphone = workflow?.variants[0]?.config.resize
    const ipad = workflow?.variants[1]?.config.resize
    expect(iphone).toMatchObject({ mode: 'exact', width: 1320, height: 2868 })
    expect(ipad).toMatchObject({ mode: 'exact', width: 2064, height: 2752 })
    expect(parseAspectRatio('6:13')).toBeCloseTo(6 / 13)
    expect(parseAspectRatio('3:4')).toBe(0.75)
  })

  it('newsletter kit caps width at 600 and 1200', () => {
    const workflow = getActivePlatformWorkflow('newsletter-kit')
    expect(workflow?.variants.map((v) => v.id)).toEqual([
      'newsletter-600',
      'newsletter-1200',
    ])
    expect(workflow?.variants[0]?.config.resize).toMatchObject({
      mode: 'maxWidth',
      width: 600,
      lockAspectRatio: true,
    })
    expect(workflow?.variants[1]?.config.resize).toMatchObject({
      mode: 'maxWidth',
      width: 1200,
    })
  })

  it('keeps favicon kit as a zip workflow', () => {
    expect(PLATFORM_WORKFLOWS.map((w) => w.id)).toEqual([
      'favicon-kit',
      'app-store-kit',
      'newsletter-kit',
    ])
    expect(PLATFORM_BUILT_IN_PRESETS.some((p) => p.id === 'favicon-kit')).toBe(true)
  })
})
