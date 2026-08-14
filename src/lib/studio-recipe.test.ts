import { describe, expect, it } from 'vitest'
import { getDefaultEncodeOptions } from '@/lib/schemas/pipeline-schema'
import { applyPreset, BUILT_IN_PRESETS, mergePipelineWithPartial } from '@/lib/presets'
import { pipelinesEqual } from '@/lib/pipeline-history'
import {
  decodeStudioRecipe,
  encodeStudioRecipe,
  parseRecipeParam,
  studioRecipeSearch,
} from './studio-recipe'
import { isStudioSearchIndexable, parseStudioSearch } from './studio-seo/search'

describe('studio recipe URLs', () => {
  it('omits the default Web Optimized pipeline so /studio stays clean', () => {
    const web = BUILT_IN_PRESETS.find((preset) => preset.id === 'web-optimized')!
    expect(encodeStudioRecipe(applyPreset(web))).toBeNull()
  })

  it('round-trips a named built-in preset', () => {
    const og = BUILT_IN_PRESETS.find((preset) => preset.id === 'og-image')
    expect(og).toBeTruthy()
    const encoded = encodeStudioRecipe(applyPreset(og!))
    expect(encoded).toBe('og-image')
    const decoded = decodeStudioRecipe(encoded!)
    expect(decoded).toEqual({ kind: 'preset', id: 'og-image' })
  })

  it('resolves legacy platform aliases', () => {
    expect(decodeStudioRecipe('linkedin-share')).toEqual({ kind: 'preset', id: 'og-image' })
  })

  it('round-trips a compact custom pipeline without image bytes', () => {
    const jpeg = getDefaultEncodeOptions('jpeg')
    if (jpeg.format !== 'jpeg') throw new Error('expected jpeg encode defaults')
    const pipeline = mergePipelineWithPartial({
      outputFormat: 'jpeg',
      encode: { format: 'jpeg', options: { ...jpeg.options, quality: 82 } },
      filenamePattern: '{name}-{width}.{ext}',
    })
    const encoded = encodeStudioRecipe(pipeline)
    expect(encoded?.startsWith('c1.')).toBe(true)
    expect(encoded).not.toMatch(/data:image|buffer|files/i)
    const decoded = decodeStudioRecipe(encoded!)
    expect(decoded?.kind).toBe('pipeline')
    if (decoded?.kind !== 'pipeline') return
    expect(pipelinesEqual(decoded.pipeline, pipeline)).toBe(true)
  })

  it('rejects oversized or unsafe recipe params', () => {
    expect(parseRecipeParam('not valid!')).toBeUndefined()
    expect(parseRecipeParam('c1.' + 'a'.repeat(3000))).toBeUndefined()
    expect(decodeStudioRecipe('custom-secret')).toBeNull()
    expect(decodeStudioRecipe('c1.!!!')).toBeNull()
  })

  it('keeps recipe on studio search and never treats it as format intent', () => {
    expect(parseStudioSearch({ recipe: 'og-image', to: 'webp' })).toEqual({
      to: 'webp',
      recipe: 'og-image',
    })
    expect(parseStudioSearch({ recipe: 'og-image' }).from).toBeUndefined()
    expect(isStudioSearchIndexable({ to: 'webp' })).toBe(true)
    expect(isStudioSearchIndexable({ to: 'webp', recipe: 'og-image' })).toBe(false)
    expect(studioRecipeSearch(null)).toEqual({})
    expect(studioRecipeSearch('og-image')).toEqual({ recipe: 'og-image' })
  })

  it('rejects compact payloads that look like images', () => {
    const payload = btoa(JSON.stringify({ outputFormat: 'jpeg', buffer: 'x' }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    expect(decodeStudioRecipe(`c1.${payload}`)).toBeNull()
  })
})
