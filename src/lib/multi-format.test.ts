import { describe, expect, it } from 'vitest'
import { createDefaultPipeline, getDefaultEncodeOptions } from '@/lib/schemas/pipeline-schema'
import {
  buildMultiFormatWorkflow,
  ensureFilenamePatternHasExt,
  ensureMultiFormatFilenamePattern,
  MULTI_FORMAT_KIT_ID,
  normalizeAlsoExportFormats,
  toggleAlsoExportFormat,
  workflowZipEntryPath,
} from './multi-format'

describe('multi-format one-run', () => {
  it('drops the primary format from extras', () => {
    expect(
      normalizeAlsoExportFormats({
        outputFormat: 'webp',
        alsoExportFormats: ['avif', 'webp', 'jpeg'],
      }),
    ).toEqual(['avif', 'jpeg'])
  })

  it('keeps a stable AVIF → WebP → JPEG order', () => {
    expect(
      normalizeAlsoExportFormats({
        outputFormat: 'png',
        alsoExportFormats: ['jpeg', 'avif', 'webp'],
      }),
    ).toEqual(['avif', 'webp', 'jpeg'])
  })

  it('ensures {ext} is in the filename pattern', () => {
    expect(ensureFilenamePatternHasExt('{name}-melted.{ext}')).toBe('{name}-melted.{ext}')
    expect(ensureFilenamePatternHasExt('{name}-melted')).toBe('{name}-melted.{ext}')
  })

  it('forces {name} into multi-format patterns', () => {
    expect(ensureMultiFormatFilenamePattern('{ext}')).toBe('{name}-{ext}')
    expect(ensureMultiFormatFilenamePattern('{name}-melted.{ext}')).toBe('{name}-melted.{ext}')
  })

  it('builds a synthetic workflow only when extras are set', () => {
    const base = createDefaultPipeline()
    expect(buildMultiFormatWorkflow(base)).toBeNull()

    const workflow = buildMultiFormatWorkflow({
      ...base,
      alsoExportFormats: ['avif', 'jpeg'],
    })
    expect(workflow?.id).toBe(MULTI_FORMAT_KIT_ID)
    expect(workflow?.variants.map((v) => v.id)).toEqual(['fmt-webp', 'fmt-avif', 'fmt-jpeg'])
    expect(workflow?.variants[0]?.config.encode).toEqual(base.encode)
  })

  it('toggles extras without duplicating primary', () => {
    const webp = createDefaultPipeline()
    expect(toggleAlsoExportFormat(webp, 'jpeg', true)).toEqual(['jpeg'])
    expect(
      toggleAlsoExportFormat({ ...webp, alsoExportFormats: ['jpeg'] }, 'jpeg', false),
    ).toEqual([])

    const avifPrimary = {
      ...createDefaultPipeline(),
      outputFormat: 'avif' as const,
      encode: getDefaultEncodeOptions('avif'),
      alsoExportFormats: [] as Array<'avif' | 'webp' | 'jpeg'>,
    }
    expect(toggleAlsoExportFormat(avifPrimary, 'avif', true)).toEqual([])
  })

  it('puts multi-format outputs under format folders', () => {
    expect(
      workflowZipEntryPath(
        { variantId: 'fmt-webp', outputName: 'hero-melted.webp' },
        { sourceBase: 'hero' },
      ),
    ).toBe('webp/hero-melted.webp')
    expect(
      workflowZipEntryPath(
        { variantId: 'fmt-jpeg', outputName: 'webp' },
        { sourceBase: 'photo.jpg' },
      ),
    ).toBe('jpeg/photo.jpg')
    expect(
      workflowZipEntryPath({ variantId: 'favicon-32', outputName: 'favicon-32.png' }),
    ).toBe('favicon-32.png')
  })
})
