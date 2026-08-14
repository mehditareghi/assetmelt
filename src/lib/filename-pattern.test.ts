import { describe, expect, it } from 'vitest'
import { createDefaultPipeline } from '@/lib/schemas/pipeline-schema'
import {
  encodeQualityForFilename,
  formatDateToken,
  formatOutputFilename,
  insertFilenameToken,
} from './filename-pattern'

describe('formatOutputFilename', () => {
  it('keeps name and ext tokens', () => {
    expect(formatOutputFilename('hero.PNG', '{name}-melted.{ext}', 'webp')).toBe(
      'hero-melted.webp',
    )
  })

  it('fills width, height, quality, and date', () => {
    expect(
      formatOutputFilename('hero.jpg', '{name}-{width}x{height}-q{quality}-{date}.{ext}', 'jpeg', {
        width: 1200,
        height: 630,
        quality: 82,
        date: new Date(2026, 7, 14),
      }),
    ).toBe('hero-1200x630-q82-2026-08-14.jpg')
  })

  it('leaves quality blank for formats without it', () => {
    expect(
      formatOutputFilename('icon.png', '{name}-q{quality}.{ext}', 'png', {
        width: 32,
        height: 32,
      }),
    ).toBe('icon-q.png')
  })

  it('strips path characters from the original basename', () => {
    expect(formatOutputFilename('a/b:c.jpg', '{name}.{ext}', 'webp')).toBe('a-b-c.webp')
  })
})

describe('filename token helpers', () => {
  it('formats local YYYY-MM-DD dates', () => {
    expect(formatDateToken(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('prefers size-budget quality over the slider', () => {
    const pipeline = createDefaultPipeline()
    expect(encodeQualityForFilename(pipeline, 61)).toBe(61)
    expect(encodeQualityForFilename(pipeline)).toBe(75)
  })

  it('inserts a token at the caret', () => {
    expect(insertFilenameToken('{name}.{ext}', '{width}', 6)).toEqual({
      next: '{name}{width}.{ext}',
      cursor: 13,
    })
  })
})
