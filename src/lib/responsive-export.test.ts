import { describe, expect, it } from 'vitest'
import {
  buildNextImageSnippet,
  buildPictureMarkup,
  buildResponsiveWidths,
  buildResponsiveWorkflow,
  clampWidthsToSource,
  normalizeResponsiveFormats,
  parseResponsiveVariantId,
  responsiveZipEntryPath,
  stemFromBasePath,
} from '@/lib/responsive-export'
import { getDefaultEncodeOptions } from '@/lib/schemas/pipeline-schema'

const basePipeline = {
  outputFormat: 'webp' as const,
  encode: getDefaultEncodeOptions('webp'),
  alsoExportFormats: [] as Array<'avif' | 'webp' | 'jpeg'>,
  filenamePattern: '{name}-melted.{ext}',
  sizeBudget: { enabled: false, targetBytes: 100_000, allowResize: false },
} as Parameters<typeof buildResponsiveWorkflow>[0]['basePipeline']

describe('buildResponsiveWidths', () => {
  it('builds half / three-quarter / max and optional retina', () => {
    expect(buildResponsiveWidths(1200, false)).toEqual([600, 900, 1200])
    expect(buildResponsiveWidths(1200, true)).toEqual([600, 900, 1200, 1800, 2400])
  })
})

describe('clampWidthsToSource', () => {
  it('caps to source width without inventing duplicates', () => {
    expect(clampWidthsToSource([600, 1200, 2400], 1000)).toEqual([600, 1000])
  })
})

describe('markup', () => {
  it('emits picture with AVIF/WebP sources and JPEG img', () => {
    const html = buildPictureMarkup({
      basePath: '/images/hero',
      widths: [640, 1280],
      sizes: '100vw',
      alt: 'Hero',
      formats: ['avif', 'webp', 'jpeg'],
      sourceWidth: 1280,
      sourceHeight: 720,
    })
    expect(html).toContain('type="image/avif"')
    expect(html).toContain('type="image/webp"')
    expect(html).toContain('src="/images/hero-1280.jpg"')
    expect(html).toContain('height="720"')
    expect(html).not.toContain('type="image/jpeg"')
  })

  it('builds next/image wrapper with picture sources', () => {
    const snippet = buildNextImageSnippet({
      basePath: '/images/hero',
      widths: [640, 1280],
      sizes: '100vw',
      alt: 'Hero',
      formats: ['avif', 'webp', 'jpeg'],
    })
    expect(snippet).toContain("import Image from 'next/image'")
    expect(snippet).toContain('srcSet=')
    expect(snippet).toContain('<Image')
    expect(snippet).toContain('src="/images/hero-1280.jpg"')
  })
})

describe('workflow + zip paths', () => {
  it('builds width × format variants', () => {
    const workflow = buildResponsiveWorkflow({
      widths: [640, 1280],
      formats: ['avif', 'jpeg'],
      filenameStem: 'hero',
      basePipeline,
    })
    expect(workflow.variants).toHaveLength(4)
    expect(workflow.variants[0]?.id).toBe('srcset-640-avif')
    expect(workflow.variants[0]?.config.resize?.mode).toBe('maxWidth')
    expect(workflow.variants[0]?.config.resize?.width).toBe(640)
  })

  it('parses variant ids and zip folders by width', () => {
    expect(parseResponsiveVariantId('srcset-900-webp')).toEqual({
      width: 900,
      format: 'webp',
    })
    expect(
      responsiveZipEntryPath({
        variantId: 'srcset-900-webp',
        outputName: 'hero-900.webp',
      }),
    ).toBe('900/hero-900.webp')
  })

  it('normalizes format order and stem', () => {
    expect(normalizeResponsiveFormats(['jpeg', 'avif'])).toEqual(['avif', 'jpeg'])
    expect(stemFromBasePath('/images/hero/')).toBe('hero')
  })
})
