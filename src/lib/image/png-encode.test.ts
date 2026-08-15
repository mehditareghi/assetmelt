import { describe, expect, it } from 'vitest'
import {
  getDefaultEncodeOptions,
  oxipngOptionsSchema,
  pipelineSchema,
} from '@/lib/schemas/pipeline-schema'
import { applyPreset, BUILT_IN_PRESETS, getCustomPresetSummary } from '@/lib/presets'
import { toOxipngWasmOptions } from '@/lib/image/png-encode'

describe('PNG encode options', () => {
  it('defaults palette reduction off so PNG stays lossless', () => {
    const options = oxipngOptionsSchema.parse({})
    expect(options).toEqual({
      level: 2,
      interlace: false,
      paletteEnabled: false,
      numColors: 256,
      dither: 1,
    })
    const encode = getDefaultEncodeOptions('png')
    expect(encode).toEqual({ format: 'png', options })
  })

  it('fills palette fields on legacy PNG recipes that only stored level', () => {
    const parsed = pipelineSchema.parse({
      outputFormat: 'png',
      encode: { format: 'png', options: { level: 4 } },
    })
    expect(parsed.encode).toEqual({
      format: 'png',
      options: {
        level: 4,
        interlace: false,
        paletteEnabled: false,
        numColors: 256,
        dither: 1,
      },
    })
  })

  it('rejects out-of-range colors and dither', () => {
    expect(() => oxipngOptionsSchema.parse({ numColors: 1 })).toThrow()
    expect(() => oxipngOptionsSchema.parse({ numColors: 257 })).toThrow()
    expect(() => oxipngOptionsSchema.parse({ dither: 1.2 })).toThrow()
  })

  it('strips palette knobs before Oxipng WASM', () => {
    expect(
      toOxipngWasmOptions({
        level: 4,
        interlace: true,
        paletteEnabled: true,
        numColors: 32,
        dither: 0.5,
      }),
    ).toEqual({ level: 4, interlace: true })
  })

  it('keeps the Lossless PNG preset lossless', () => {
    const preset = BUILT_IN_PRESETS.find((item) => item.id === 'lossless-png')
    expect(preset).toBeTruthy()
    const pipeline = applyPreset(preset!)
    expect(pipeline.encode.format).toBe('png')
    if (pipeline.encode.format !== 'png') return
    expect(pipeline.encode.options.paletteEnabled).toBe(false)
    expect(pipeline.encode.options.level).toBe(4)
    expect(pipeline.metadataMode).toBe('keep')
  })

  it('summarizes a palette PNG recipe by color count', () => {
    expect(
      getCustomPresetSummary({
        outputFormat: 'png',
        encode: {
          format: 'png',
          options: {
            level: 2,
            interlace: false,
            paletteEnabled: true,
            numColors: 64,
            dither: 1,
          },
        },
      }),
    ).toBe('PNG · 64 colors')
  })
})
