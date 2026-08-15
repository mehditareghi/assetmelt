import { describe, expect, it } from 'vitest'
import { getDefaultEncodeOptions, createDefaultPipeline } from '@/lib/schemas/pipeline-schema'
import { mergePipelineWithPartial } from '@/lib/presets'
import {
  canonicalBudgetParam,
  parseBudgetParam,
  pipelinePatchForSizeBudget,
  sizeBudgetBytes,
  sizeBudgetLandingPath,
  studioBudgetSearch,
} from '@/lib/studio-budget'
import { isSizeBudgetSupported } from '@/lib/image/size-budget-encode'
import { isStudioSearchIndexable, parseStudioSearch } from '@/lib/studio-seo/search'

describe('size-budget landing intent', () => {
  it('parses only the 50 / 100 / 200 KB slugs', () => {
    expect(parseBudgetParam('100kb')).toBe(100)
    expect(parseBudgetParam('50KB')).toBe(50)
    expect(parseBudgetParam('200kb')).toBe(200)
    expect(parseBudgetParam('150kb')).toBeUndefined()
    expect(parseBudgetParam('100')).toBeUndefined()
    expect(parseBudgetParam('102400')).toBeUndefined()
    expect(canonicalBudgetParam(100)).toBe('100kb')
    expect(sizeBudgetBytes(100)).toBe(102_400)
    expect(sizeBudgetLandingPath(100)).toBe('/compress/under-100kb')
    expect(studioBudgetSearch('100kb')).toEqual({ budget: '100kb' })
    expect(studioBudgetSearch('nope')).toEqual({})
  })

  it('wires /compress/under-100kb to Studio with budget on', async () => {
    const { getToolPage } = await import('@/lib/tool-pages/content')
    const page = getToolPage('compress-under-100kb')
    expect(page.path).toBe('/compress/under-100kb')
    expect(page.studioSearch).toEqual({ budget: '100kb' })
    expect(getToolPage('compress-under-50kb').studioSearch).toEqual({ budget: '50kb' })
    expect(getToolPage('compress-under-200kb').studioSearch).toEqual({ budget: '200kb' })
  })

  it('keeps budget on studio search and never indexes it', () => {
    expect(parseStudioSearch({ budget: '100kb', to: 'webp' })).toEqual({
      to: 'webp',
      budget: '100kb',
    })
    expect(isStudioSearchIndexable({ to: 'webp' })).toBe(true)
    expect(isStudioSearchIndexable({ to: 'webp', budget: '100kb' })).toBe(false)
    expect(isStudioSearchIndexable({ budget: '100kb' })).toBe(false)
  })

  it('enables size budget on the default WebP pipeline', () => {
    const patch = pipelinePatchForSizeBudget(createDefaultPipeline(), 100)
    expect(patch.sizeBudget).toEqual({
      enabled: true,
      targetBytes: 102_400,
      allowResize: true,
    })
    expect(patch.outputFormat).toBe('webp')
    expect(isSizeBudgetSupported({ ...createDefaultPipeline(), ...patch })).toBe(true)
  })

  it('switches PNG to WebP so the budget can actually run', () => {
    const png = mergePipelineWithPartial({
      outputFormat: 'png',
      encode: getDefaultEncodeOptions('png'),
    })
    const patch = pipelinePatchForSizeBudget(png, 50)
    expect(patch.outputFormat).toBe('webp')
    expect(patch.encode.format).toBe('webp')
    expect(patch.sizeBudget.targetBytes).toBe(50 * 1024)
  })

  it('turns off AVIF lossless instead of abandoning AVIF', () => {
    const avif = getDefaultEncodeOptions('avif')
    if (avif.format !== 'avif') throw new Error('expected avif')
    const pipeline = mergePipelineWithPartial({
      outputFormat: 'avif',
      encode: { format: 'avif', options: { ...avif.options, lossless: true } },
    })
    const patch = pipelinePatchForSizeBudget(pipeline, 200)
    expect(patch.outputFormat).toBe('avif')
    expect(patch.encode.format).toBe('avif')
    if (patch.encode.format !== 'avif') return
    expect(patch.encode.options.lossless).toBe(false)
  })
})
