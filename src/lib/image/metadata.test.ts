import { describe, expect, it } from 'vitest'
import { applyPreset, BUILT_IN_PRESETS } from '@/lib/presets'
import {
  applyOutputMetadata,
  exifApp1FromTiff,
  exifHasGps,
  extractEmbeddedMetadata,
  parseExifTiff,
  prepareExifTiff,
  tiffFromExifPayload,
} from '@/lib/image/metadata'
import { createDefaultPipeline, pipelineSchema } from '@/lib/schemas/pipeline-schema'

function toBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

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

function jpegWithSegments(segments: Uint8Array[]): Uint8Array {
  const parts = [Uint8Array.from([0xff, 0xd8]), ...segments, Uint8Array.from([0xff, 0xd9])]
  const total = parts.reduce((sum, part) => sum + part.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}

function jpegApp1(tiff: Uint8Array): Uint8Array {
  const payload = exifApp1FromTiff(tiff)
  const length = payload.length + 2
  const out = new Uint8Array(4 + payload.length)
  out[0] = 0xff
  out[1] = 0xe1
  out[2] = (length >> 8) & 0xff
  out[3] = length & 0xff
  out.set(payload, 4)
  return out
}

function jpegApp2Icc(icc: Uint8Array): Uint8Array {
  const header = 'ICC_PROFILE\0'
  const payload = new Uint8Array(14 + icc.length)
  for (let i = 0; i < 12; i++) payload[i] = header.charCodeAt(i)
  payload[12] = 1
  payload[13] = 1
  payload.set(icc, 14)
  const length = payload.length + 2
  const out = new Uint8Array(4 + payload.length)
  out[0] = 0xff
  out[1] = 0xe2
  out[2] = (length >> 8) & 0xff
  out[3] = length & 0xff
  out.set(payload, 4)
  return out
}

const PNG_1X1 = Uint8Array.from(
  atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='),
  (c) => c.charCodeAt(0),
)

describe('pipeline metadataMode migration', () => {
  it('defaults to strip when neither field is set', () => {
    const pipeline = createDefaultPipeline()
    expect(pipeline.metadataMode).toBe('strip')
  })

  it('maps legacy stripMetadata: false to keep', () => {
    const { metadataMode: _ignored, ...withoutMode } = createDefaultPipeline()
    const parsed = pipelineSchema.parse({
      ...withoutMode,
      stripMetadata: false,
    })
    expect(parsed.metadataMode).toBe('keep')
    expect('stripMetadata' in parsed).toBe(false)
  })

  it('maps legacy stripMetadata: true to strip', () => {
    const parsed = pipelineSchema.parse({
      ...createDefaultPipeline(),
      stripMetadata: true,
    })
    expect(parsed.metadataMode).toBe('strip')
  })

  it('prefers explicit metadataMode over legacy boolean', () => {
    const parsed = pipelineSchema.parse({
      ...createDefaultPipeline(),
      metadataMode: 'strip-gps',
      stripMetadata: false,
    })
    expect(parsed.metadataMode).toBe('strip-gps')
  })

  it('lossless PNG preset keeps metadata', () => {
    const preset = BUILT_IN_PRESETS.find((item) => item.id === 'lossless-png')
    expect(preset).toBeTruthy()
    expect(applyPreset(preset!).metadataMode).toBe('keep')
  })
})

describe('EXIF prepare / inject', () => {
  it('parses orientation and GPS from a crafted TIFF', () => {
    const tiff = gpsOrientationTiff()
    const parsed = parseExifTiff(tiff)
    expect(parsed).not.toBeNull()
    expect(exifHasGps(tiff)).toBe(true)
    const orientation = parsed!.ifd0.find((entry) => entry.tag === 0x0112)
    expect(orientation).toBeTruthy()
    expect(new DataView(orientation!.value.buffer, orientation!.value.byteOffset).getUint16(0, true)).toBe(6)
  })

  it('sets orientation to 1, updates size, and drops GPS when asked', () => {
    const prepared = prepareExifTiff(gpsOrientationTiff(), {
      stripGps: true,
      width: 640,
      height: 480,
    })
    expect(prepared).not.toBeNull()
    expect(exifHasGps(prepared!)).toBe(false)
    const parsed = parseExifTiff(prepared!)
    const orientation = parsed!.ifd0.find((entry) => entry.tag === 0x0112)
    expect(new DataView(orientation!.value.buffer, orientation!.value.byteOffset).getUint16(0, true)).toBe(1)
    const width = parsed!.ifd0.find((entry) => entry.tag === 0x0100)
    expect(width).toBeTruthy()
    expect(new DataView(width!.value.buffer, width!.value.byteOffset).getUint32(0, true)).toBe(640)
  })

  it('keeps GPS when stripGps is false', () => {
    const prepared = prepareExifTiff(gpsOrientationTiff(), {
      stripGps: false,
      width: 100,
      height: 80,
    })
    expect(exifHasGps(prepared!)).toBe(true)
  })

  it('round-trips EXIF and ICC through a JPEG container', async () => {
    const source = jpegWithSegments([
      jpegApp1(gpsOrientationTiff()),
      jpegApp2Icc(Uint8Array.from([0x00, 0x01, 0x02, 0x03, 0x04])),
    ])
    const extracted = await extractEmbeddedMetadata(toBuffer(source))
    expect(extracted.hasGps).toBe(true)
    expect(extracted.icc).toEqual(Uint8Array.from([0x00, 0x01, 0x02, 0x03, 0x04]))

    const stripped = await applyOutputMetadata(toBuffer(jpegWithSegments([])), 'jpeg', toBuffer(source), {
      mode: 'strip',
      width: 10,
      height: 10,
    })
    const strippedMeta = await extractEmbeddedMetadata(stripped)
    expect(strippedMeta.exifTiff).toBeNull()
    expect(strippedMeta.icc).toBeNull()

    const gpsOnly = await applyOutputMetadata(toBuffer(jpegWithSegments([])), 'jpeg', toBuffer(source), {
      mode: 'strip-gps',
      width: 320,
      height: 240,
    })
    const gpsOnlyMeta = await extractEmbeddedMetadata(gpsOnly)
    expect(gpsOnlyMeta.hasGps).toBe(false)
    expect(gpsOnlyMeta.exifTiff).not.toBeNull()
    expect(gpsOnlyMeta.icc).toEqual(Uint8Array.from([0x00, 0x01, 0x02, 0x03, 0x04]))

    const kept = await applyOutputMetadata(toBuffer(jpegWithSegments([])), 'jpeg', toBuffer(source), {
      mode: 'keep',
      width: 320,
      height: 240,
    })
    const keptMeta = await extractEmbeddedMetadata(kept)
    expect(keptMeta.hasGps).toBe(true)
    expect(keptMeta.icc?.byteLength).toBe(5)
  })

  it('writes eXIf into PNG and reads it back', async () => {
    const jpegSource = jpegWithSegments([jpegApp1(gpsOrientationTiff())])
    const png = await applyOutputMetadata(toBuffer(PNG_1X1), 'png', toBuffer(jpegSource), {
      mode: 'strip-gps',
      width: 1,
      height: 1,
    })
    const extracted = await extractEmbeddedMetadata(png)
    expect(extracted.exifTiff).not.toBeNull()
    expect(extracted.hasGps).toBe(false)
    expect(tiffFromExifPayload(extracted.exifTiff!)?.length).toBeGreaterThan(8)
  })

  it('does not inject into AVIF even when keep is requested', async () => {
    const source = jpegWithSegments([jpegApp1(gpsOrientationTiff())])
    const fakeAvif = toBuffer(Uint8Array.from([0x00, 0x00, 0x00, 0x1c, 0x66, 0x74, 0x79, 0x70]))
    const result = await applyOutputMetadata(fakeAvif, 'avif', toBuffer(source), {
      mode: 'keep',
      width: 10,
      height: 10,
    })
    expect(result).toBe(fakeAvif)
  })
})
