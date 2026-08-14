import { beforeAll, describe, expect, it } from 'vitest'
import { decodeTiff } from '@/lib/image/tiff'

function le16(n: number): number[] {
  return [n & 0xff, (n >> 8) & 0xff]
}

function le32(n: number): number[] {
  return [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >> 24) & 0xff]
}

function ifdEntry(tag: number, type: number, count: number, value: number): number[] {
  return [...le16(tag), ...le16(type), ...le32(count), ...le32(value)]
}

/** Uncompressed little-endian RGB TIFF: 2×1, red then blue. */
function rgb2x1Tiff(): ArrayBuffer {
  const bitsOffset = 122
  const pixelsOffset = 128
  const entries = [
    ifdEntry(256, 3, 1, 2),
    ifdEntry(257, 3, 1, 1),
    ifdEntry(258, 3, 3, bitsOffset),
    ifdEntry(259, 3, 1, 1),
    ifdEntry(262, 3, 1, 2),
    ifdEntry(273, 4, 1, pixelsOffset),
    ifdEntry(277, 3, 1, 3),
    ifdEntry(278, 3, 1, 1),
    ifdEntry(279, 4, 1, 6),
  ]
  const bytes = [
    0x49, 0x49, 0x2a, 0x00,
    ...le32(8),
    ...le16(entries.length),
    ...entries.flat(),
    ...le32(0),
    8, 0, 8, 0, 8, 0,
    255, 0, 0, 0, 0, 255,
  ]
  return Uint8Array.from(bytes).buffer
}

beforeAll(() => {
  if (typeof ImageData !== 'undefined') return
  class ImageDataPolyfill {
    data: Uint8ClampedArray
    width: number
    height: number
    colorSpace = 'srgb' as const
    constructor(data: Uint8ClampedArray, width: number, height: number) {
      this.data = data
      this.width = width
      this.height = height
    }
  }
  Object.assign(globalThis, { ImageData: ImageDataPolyfill })
})

describe('decodeTiff', () => {
  it('decodes uncompressed RGB TIFF to ImageData', async () => {
    const image = await decodeTiff(rgb2x1Tiff())
    expect(image.width).toBe(2)
    expect(image.height).toBe(1)
    expect(Array.from(image.data.slice(0, 4))).toEqual([255, 0, 0, 255])
    expect(Array.from(image.data.slice(4, 8))).toEqual([0, 0, 255, 255])
  })

  it('throws a clear error for non-TIFF bytes', async () => {
    await expect(decodeTiff(Uint8Array.from([0, 1, 2, 3]).buffer)).rejects.toThrow(
      /Couldn't decode this TIFF/,
    )
  })
})
