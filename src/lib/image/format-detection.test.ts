import { describe, expect, it } from 'vitest'
import { detectFormatFromBuffer, isImageFile } from '@/lib/image/format-detection'

function bufferOf(bytes: number[]): ArrayBuffer {
  return Uint8Array.from(bytes).buffer
}

describe('detectFormatFromBuffer', () => {
  it('detects little-endian TIFF magic', () => {
    expect(detectFormatFromBuffer(bufferOf([0x49, 0x49, 0x2a, 0x00]))).toBe('tiff')
  })

  it('detects big-endian TIFF magic', () => {
    expect(detectFormatFromBuffer(bufferOf([0x4d, 0x4d, 0x00, 0x2a]))).toBe('tiff')
  })

  it('falls back to .tif / .tiff when magic is missing', () => {
    const empty = new ArrayBuffer(0)
    expect(detectFormatFromBuffer(empty, 'scan.tif')).toBe('tiff')
    expect(detectFormatFromBuffer(empty, 'scan.TIFF')).toBe('tiff')
  })
})

describe('isImageFile', () => {
  it('accepts .tif and .tiff even without an image MIME type', () => {
    expect(isImageFile(new File(['x'], 'scan.tif', { type: 'application/octet-stream' }))).toBe(true)
    expect(isImageFile(new File(['x'], 'scan.tiff', { type: '' }))).toBe(true)
  })
})
