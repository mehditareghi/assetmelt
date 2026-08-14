import { describe, expect, it } from 'vitest'
import { encodeIcoFromPngs, isIcoArrayBuffer } from './ico-encode'

/** Minimal valid 1×1 PNG (black pixel). */
function tinyPng(): ArrayBuffer {
  const bytes = Uint8Array.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
    0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
    0x00, 0x00, 0x03, 0x00, 0x01, 0x00, 0x05, 0xfe, 0xd4, 0xef, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45,
    0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ])
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
}

describe('encodeIcoFromPngs', () => {
  it('builds a multi-size ICO directory with embedded PNGs', () => {
    const png16 = tinyPng()
    const png32 = tinyPng()
    const ico = encodeIcoFromPngs([
      { size: 16, png: png16 },
      { size: 32, png: png32 },
    ])
    expect(isIcoArrayBuffer(ico)).toBe(true)
    const view = new DataView(ico)
    expect(view.getUint16(4, true)).toBe(2)
    expect(new Uint8Array(ico)[6]).toBe(16)
    expect(new Uint8Array(ico)[22]).toBe(32)
    // First image payload starts after header + 2 dir entries
    const offset0 = view.getUint32(18, true)
    expect(offset0).toBe(6 + 16 * 2)
    expect(new Uint8Array(ico).slice(offset0, offset0 + 4)).toEqual(
      new Uint8Array([0x89, 0x50, 0x4e, 0x47]),
    )
  })

  it('rejects empty or non-PNG input', () => {
    expect(() => encodeIcoFromPngs([])).toThrow(/at least one/)
    expect(() =>
      encodeIcoFromPngs([{ size: 16, png: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer }]),
    ).toThrow(/PNG/)
  })
})
