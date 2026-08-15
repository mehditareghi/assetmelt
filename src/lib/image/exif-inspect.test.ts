import { describe, expect, it } from 'vitest'
import { exifApp1FromTiff } from '@/lib/image/metadata'
import {
  formatExifDate,
  formatExifGps,
  gpsKeepRisk,
  inspectExif,
} from '@/lib/image/exif-inspect'

function le16(n: number): number[] {
  return [n & 0xff, (n >> 8) & 0xff]
}

function le32(n: number): number[] {
  return [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >> 24) & 0xff]
}

/** Little-endian TIFF: Orientation=6, GPSLatitudeRef=N. */
function gpsOrientationTiff(): Uint8Array {
  const gpsOffset = 38
  return Uint8Array.from([
    0x49, 0x49, 0x2a, 0x00,
    ...le32(8),
    ...le16(2),
    ...le16(0x0112), ...le16(3), ...le32(1), ...le16(6), 0x00, 0x00,
    ...le16(0x8825), ...le16(4), ...le32(1), ...le32(gpsOffset),
    ...le32(0),
    ...le16(1),
    ...le16(0x0001), ...le16(2), ...le32(2), 0x4e, 0x00, 0x00, 0x00,
    ...le32(0),
  ])
}

function toBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

function jpegWithExif(tiff: Uint8Array): ArrayBuffer {
  const payload = exifApp1FromTiff(tiff)
  const length = payload.length + 2
  const app1 = new Uint8Array(4 + payload.length)
  app1[0] = 0xff
  app1[1] = 0xe1
  app1[2] = (length >> 8) & 0xff
  app1[3] = length & 0xff
  app1.set(payload, 4)
  const jpeg = new Uint8Array(2 + app1.length + 2)
  jpeg[0] = 0xff
  jpeg[1] = 0xd8
  jpeg.set(app1, 2)
  jpeg[jpeg.length - 2] = 0xff
  jpeg[jpeg.length - 1] = 0xd9
  return toBuffer(jpeg)
}

describe('exif inspect', () => {
  it('formats EXIF timestamps and GPS', () => {
    expect(formatExifDate('2024:06:12 14:30:01')).toBe('2024-06-12 14:30')
    expect(formatExifGps({ lat: 59.33668, lng: 18.072 })).toBe('59.33668° N, 18.07200° E')
    expect(formatExifGps({ lat: -33.86, lng: -151.21 })).toBe('33.86000° S, 151.21000° W')
  })

  it('returns undefined when there is no camera, date, or GPS', () => {
    expect(inspectExif(new ArrayBuffer(8))).toBeUndefined()
  })

  it('flags GPS on a JPEG with a GPS IFD', () => {
    const summary = inspectExif(jpegWithExif(gpsOrientationTiff()))
    expect(summary?.hasGps).toBe(true)
  })

  it('warns when Keep would write GPS into JPEG/WebP/PNG', () => {
    const gps = { camera: null, date: null, gps: null, hasGps: true }
    expect(gpsKeepRisk(gps, 'keep', 'jpeg')).toBe('write')
    expect(gpsKeepRisk(gps, 'keep', 'webp')).toBe('write')
    expect(gpsKeepRisk(gps, 'keep', 'png')).toBe('write')
    expect(gpsKeepRisk(gps, 'keep', 'avif')).toBe('pixels-only')
    expect(gpsKeepRisk(gps, 'strip-gps', 'jpeg')).toBeNull()
    expect(gpsKeepRisk(gps, 'strip', 'jpeg')).toBeNull()
    expect(gpsKeepRisk(undefined, 'keep', 'jpeg')).toBeNull()
  })
})
