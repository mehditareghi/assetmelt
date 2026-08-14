import type { MetadataMode, OutputFormat } from '@/lib/schemas/pipeline-schema'

const JPEG_SOI = 0xffd8
const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const EXIF_HEADER = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00] // Exif\0\0
const ICC_JPEG_HEADER = 'ICC_PROFILE\0'

const TAG_IMAGE_WIDTH = 0x0100
const TAG_IMAGE_LENGTH = 0x0101
const TAG_ORIENTATION = 0x0112
const TAG_JPEG_IF = 0x0201
const TAG_JPEG_IF_LEN = 0x0202
const TAG_EXIF_IFD = 0x8769
const TAG_GPS_IFD = 0x8825
const TAG_PIXEL_X = 0xa002
const TAG_PIXEL_Y = 0xa003
const TAG_MAKER_NOTE = 0x927c

const TYPE_SHORT = 3
const TYPE_LONG = 4
const TYPE_SIZE: Record<number, number> = {
  1: 1,
  2: 1,
  3: 2,
  4: 4,
  5: 8,
  7: 1,
  9: 4,
  10: 8,
}

export const METADATA_KEEP_OUTPUT_FORMATS: OutputFormat[] = ['jpeg', 'webp', 'png']

export type IfdEntry = {
  tag: number
  type: number
  count: number
  value: Uint8Array
}

export type ExtractedMetadata = {
  exifTiff: Uint8Array | null
  icc: Uint8Array | null
  hasGps: boolean
}

export function supportsMetadataKeep(format: OutputFormat): boolean {
  return METADATA_KEEP_OUTPUT_FORMATS.includes(format)
}

export function shouldWriteMetadata(mode: MetadataMode): boolean {
  return mode === 'keep' || mode === 'strip-gps'
}

function bytesEqual(a: ArrayLike<number>, b: ArrayLike<number>, offset = 0): boolean {
  if (a.length < offset + b.length) return false
  for (let i = 0; i < b.length; i++) {
    if (a[offset + i] !== b[i]) return false
  }
  return true
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}

function readU16(view: DataView, offset: number, le: boolean): number {
  return le ? view.getUint16(offset, true) : view.getUint16(offset, false)
}

function readU32(view: DataView, offset: number, le: boolean): number {
  return le ? view.getUint32(offset, true) : view.getUint32(offset, false)
}

function writeU16(view: DataView, offset: number, value: number, le: boolean) {
  view.setUint16(offset, value, le)
}

function writeU32(view: DataView, offset: number, value: number, le: boolean) {
  view.setUint32(offset, value, le)
}

function latin1(bytes: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(start, start + length))
}

/** TIFF payload only (no JPEG `Exif\0\0` prefix). */
export function tiffFromExifPayload(payload: Uint8Array): Uint8Array | null {
  if (payload.length >= 8 && bytesEqual(payload, EXIF_HEADER)) {
    return payload.subarray(6)
  }
  if (
    payload.length >= 8 &&
    ((payload[0] === 0x49 && payload[1] === 0x49) || (payload[0] === 0x4d && payload[1] === 0x4d))
  ) {
    return payload
  }
  return null
}

export function exifApp1FromTiff(tiff: Uint8Array): Uint8Array {
  const out = new Uint8Array(6 + tiff.length)
  out.set(EXIF_HEADER, 0)
  out.set(tiff, 6)
  return out
}

function parseIfd(
  view: DataView,
  bytes: Uint8Array,
  offset: number,
  le: boolean,
): IfdEntry[] | null {
  if (offset < 0 || offset + 2 > bytes.length) return null
  const count = readU16(view, offset, le)
  const end = offset + 2 + count * 12 + 4
  if (count > 256 || end > bytes.length) return null
  const entries: IfdEntry[] = []
  for (let i = 0; i < count; i++) {
    const base = offset + 2 + i * 12
    const tag = readU16(view, base, le)
    const type = readU16(view, base + 2, le)
    const valueCount = readU32(view, base + 4, le)
    const unit = TYPE_SIZE[type] ?? 1
    const size = unit * valueCount
    if (size < 0 || size > bytes.length) return null
    let value: Uint8Array
    if (size <= 4) {
      value = bytes.slice(base + 8, base + 8 + size)
    } else {
      const ptr = readU32(view, base + 8, le)
      if (ptr < 0 || ptr + size > bytes.length) return null
      value = bytes.slice(ptr, ptr + size)
    }
    entries.push({ tag, type, count: valueCount, value })
  }
  return entries
}

function ifdOffset(entries: IfdEntry[], tag: number, le: boolean): number | null {
  const entry = entries.find((item) => item.tag === tag)
  if (!entry || entry.value.length < 4) return null
  const view = new DataView(entry.value.buffer, entry.value.byteOffset, entry.value.byteLength)
  return readU32(view, 0, le)
}

export function parseExifTiff(tiff: Uint8Array): {
  littleEndian: boolean
  ifd0: IfdEntry[]
  exif: IfdEntry[]
  gps: IfdEntry[]
} | null {
  if (tiff.length < 8) return null
  const le = tiff[0] === 0x49 && tiff[1] === 0x49
  const be = tiff[0] === 0x4d && tiff[1] === 0x4d
  if (!le && !be) return null
  const view = new DataView(tiff.buffer, tiff.byteOffset, tiff.byteLength)
  const magic = readU16(view, 2, le)
  if (magic !== 42) return null
  const ifd0Offset = readU32(view, 4, le)
  const ifd0 = parseIfd(view, tiff, ifd0Offset, le)
  if (!ifd0) return null
  const exifPtr = ifdOffset(ifd0, TAG_EXIF_IFD, le)
  const gpsPtr = ifdOffset(ifd0, TAG_GPS_IFD, le)
  const exif = exifPtr != null ? (parseIfd(view, tiff, exifPtr, le) ?? []) : []
  const gps = gpsPtr != null ? (parseIfd(view, tiff, gpsPtr, le) ?? []) : []
  return { littleEndian: le, ifd0, exif, gps }
}

function encodeValueField(entry: IfdEntry, le: boolean, dataOffset: number): Uint8Array {
  const field = new Uint8Array(4)
  const view = new DataView(field.buffer)
  if (entry.value.length <= 4) {
    field.set(entry.value)
    return field
  }
  writeU32(view, 0, dataOffset, le)
  return field
}

function writeIfd(
  entries: IfdEntry[],
  le: boolean,
  ifdOffsetValue: number,
  nextIfd: number,
): { bytes: Uint8Array; overflow: Uint8Array } {
  const overflowParts: Uint8Array[] = []
  let overflowCursor = ifdOffsetValue + 2 + entries.length * 12 + 4
  const bytes = new Uint8Array(2 + entries.length * 12 + 4)
  const view = new DataView(bytes.buffer)
  writeU16(view, 0, entries.length, le)
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    const base = 2 + i * 12
    writeU16(view, base, entry.tag, le)
    writeU16(view, base + 2, entry.type, le)
    writeU32(view, base + 4, entry.count, le)
    const field = encodeValueField(entry, le, overflowCursor)
    bytes.set(field, base + 8)
    if (entry.value.length > 4) {
      overflowParts.push(entry.value)
      overflowCursor += entry.value.length
      if (overflowCursor % 2 === 1) {
        overflowParts.push(new Uint8Array([0]))
        overflowCursor += 1
      }
    }
  }
  writeU32(view, 2 + entries.length * 12, nextIfd, le)
  return { bytes, overflow: concatBytes(overflowParts) }
}

function pointerEntry(tag: number, offset: number, le: boolean): IfdEntry {
  const value = new Uint8Array(4)
  writeU32(new DataView(value.buffer), 0, offset, le)
  return { tag, type: TYPE_LONG, count: 1, value }
}

function numericEntry(tag: number, type: number, value: number, le: boolean): IfdEntry {
  if (type === TYPE_SHORT) {
    const bytes = new Uint8Array(2)
    writeU16(new DataView(bytes.buffer), 0, value, le)
    return { tag, type, count: 1, value: bytes }
  }
  const bytes = new Uint8Array(4)
  writeU32(new DataView(bytes.buffer), 0, value, le)
  return { tag, type: TYPE_LONG, count: 1, value: bytes }
}

function upsertNumeric(entries: IfdEntry[], tag: number, value: number, le: boolean): IfdEntry[] {
  const existing = entries.find((entry) => entry.tag === tag)
  const type = existing?.type === TYPE_SHORT ? TYPE_SHORT : TYPE_LONG
  const next = numericEntry(tag, type, value, le)
  if (!existing) return [...entries, next]
  return entries.map((entry) => (entry.tag === tag ? next : entry))
}

function dropTags(entries: IfdEntry[], tags: number[]): IfdEntry[] {
  const skip = new Set(tags)
  return entries.filter((entry) => !skip.has(entry.tag))
}

function overflowSize(entries: IfdEntry[]): number {
  let size = 0
  for (const entry of entries) {
    if (entry.value.length <= 4) continue
    size += entry.value.length
    if (size % 2 === 1) size += 1
  }
  return size
}

function ifdDirectorySize(entryCount: number): number {
  return 2 + entryCount * 12 + 4
}

export function prepareExifTiff(
  tiff: Uint8Array,
  options: { stripGps: boolean; width: number; height: number },
): Uint8Array | null {
  const parsed = parseExifTiff(tiff)
  if (!parsed) return null
  const { littleEndian: le } = parsed

  let ifd0 = dropTags(parsed.ifd0, [
    TAG_JPEG_IF,
    TAG_JPEG_IF_LEN,
    TAG_GPS_IFD,
    TAG_EXIF_IFD,
  ])
  ifd0 = upsertNumeric(ifd0, TAG_ORIENTATION, 1, le)
  ifd0 = upsertNumeric(ifd0, TAG_IMAGE_WIDTH, options.width, le)
  ifd0 = upsertNumeric(ifd0, TAG_IMAGE_LENGTH, options.height, le)

  let exif = dropTags(parsed.exif, [TAG_MAKER_NOTE])
  exif = upsertNumeric(exif, TAG_PIXEL_X, options.width, le)
  exif = upsertNumeric(exif, TAG_PIXEL_Y, options.height, le)

  const gps = options.stripGps ? [] : parsed.gps

  const header = 8
  const pointerCount = (exif.length > 0 ? 1 : 0) + (gps.length > 0 ? 1 : 0)
  const ifd0DirSize = ifdDirectorySize(ifd0.length + pointerCount)
  const ifd0Overflow = overflowSize(ifd0)
  let cursor = header + ifd0DirSize + ifd0Overflow
  const exifOffset = exif.length > 0 ? cursor : 0
  if (exif.length > 0) cursor += ifdDirectorySize(exif.length) + overflowSize(exif)
  const gpsOffset = gps.length > 0 ? cursor : 0

  if (exif.length > 0) ifd0 = [...ifd0, pointerEntry(TAG_EXIF_IFD, exifOffset, le)]
  if (gps.length > 0) ifd0 = [...ifd0, pointerEntry(TAG_GPS_IFD, gpsOffset, le)]

  const rebuilt0 = writeIfd(ifd0, le, header, 0)
  const rebuiltExif =
    exif.length > 0 ? writeIfd(exif, le, exifOffset, 0) : { bytes: new Uint8Array(), overflow: new Uint8Array() }
  const rebuiltGps =
    gps.length > 0 ? writeIfd(gps, le, gpsOffset, 0) : { bytes: new Uint8Array(), overflow: new Uint8Array() }

  const prefix = new Uint8Array(8)
  const prefixView = new DataView(prefix.buffer)
  if (le) {
    prefix[0] = 0x49
    prefix[1] = 0x49
  } else {
    prefix[0] = 0x4d
    prefix[1] = 0x4d
  }
  writeU16(prefixView, 2, 42, le)
  writeU32(prefixView, 4, header, le)

  return concatBytes([
    prefix,
    rebuilt0.bytes,
    rebuilt0.overflow,
    rebuiltExif.bytes,
    rebuiltExif.overflow,
    rebuiltGps.bytes,
    rebuiltGps.overflow,
  ])
}

export function exifHasGps(tiff: Uint8Array): boolean {
  const parsed = parseExifTiff(tiff)
  if (!parsed) return false
  return parsed.ifd0.some((entry) => entry.tag === TAG_GPS_IFD) || parsed.gps.length > 0
}

function walkJpegSegments(
  bytes: Uint8Array,
  visit: (marker: number, payload: Uint8Array) => void,
): { sosIndex: number } | null {
  if (bytes.length < 4 || ((bytes[0] << 8) | bytes[1]) !== JPEG_SOI) return null
  let i = 2
  while (i + 1 < bytes.length) {
    if (bytes[i] !== 0xff) return { sosIndex: i }
    while (i < bytes.length && bytes[i] === 0xff) i++
    if (i >= bytes.length) return null
    const marker = bytes[i++]
    if (marker === 0xda) return { sosIndex: i - 2 }
    if (marker === 0xd9) return { sosIndex: i - 2 }
    if (marker >= 0xd0 && marker <= 0xd7) continue
    if (marker === 0x01) continue
    if (i + 1 >= bytes.length) return null
    const length = (bytes[i] << 8) | bytes[i + 1]
    if (length < 2 || i + length > bytes.length) return null
    visit(marker, bytes.subarray(i + 2, i + length))
    i += length
  }
  return { sosIndex: i }
}

function extractJpegExifIcc(bytes: Uint8Array): ExtractedMetadata {
  let exifTiff: Uint8Array | null = null
  const iccChunks: { index: number; total: number; data: Uint8Array }[] = []
  walkJpegSegments(bytes, (marker, payload) => {
    if (marker === 0xe1 && !exifTiff) {
      exifTiff = tiffFromExifPayload(payload)
    }
    if (marker === 0xe2 && payload.length > 14 && latin1(payload, 0, 12) === ICC_JPEG_HEADER) {
      iccChunks.push({
        index: payload[12],
        total: payload[13],
        data: payload.subarray(14),
      })
    }
  })
  iccChunks.sort((a, b) => a.index - b.index)
  const icc =
    iccChunks.length > 0 ? concatBytes(iccChunks.map((chunk) => chunk.data)) : null
  return {
    exifTiff,
    icc,
    hasGps: exifTiff ? exifHasGps(exifTiff) : false,
  }
}

function pngChunks(bytes: Uint8Array): { type: string; data: Uint8Array }[] | null {
  if (bytes.length < 8 || !bytesEqual(bytes, PNG_SIG)) return null
  const chunks: { type: string; data: Uint8Array }[] = []
  let i = 8
  while (i + 12 <= bytes.length) {
    const view = new DataView(bytes.buffer, bytes.byteOffset + i, 8)
    const length = view.getUint32(0, false)
    const type = latin1(bytes, i + 4, 4)
    if (i + 12 + length > bytes.length) return null
    chunks.push({ type, data: bytes.subarray(i + 8, i + 8 + length) })
    i += 12 + length
    if (type === 'IEND') break
  }
  return chunks
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c >>> 0
  }
  return table
})()

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

function writePngChunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length)
  const view = new DataView(out.buffer)
  view.setUint32(0, data.length, false)
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i)
  out.set(data, 8)
  const crcInput = out.subarray(4, 8 + data.length)
  view.setUint32(8 + data.length, crc32(crcInput), false)
  return out
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array | null> {
  if (typeof DecompressionStream === 'undefined') return null
  try {
    const stream = new Blob([data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer]).stream().pipeThrough(
      new DecompressionStream('deflate'),
    )
    return new Uint8Array(await new Response(stream).arrayBuffer())
  } catch {
    return null
  }
}

async function deflateRaw(data: Uint8Array): Promise<Uint8Array | null> {
  if (typeof CompressionStream === 'undefined') return null
  try {
    const stream = new Blob([data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer]).stream().pipeThrough(
      new CompressionStream('deflate'),
    )
    return new Uint8Array(await new Response(stream).arrayBuffer())
  } catch {
    return null
  }
}

async function extractPngIcc(data: Uint8Array): Promise<Uint8Array | null> {
  let i = 0
  while (i < data.length && data[i] !== 0) i++
  if (i >= data.length - 2) return null
  const compressed = data.subarray(i + 2)
  return inflateRaw(compressed)
}

async function extractPngMetadata(bytes: Uint8Array): Promise<ExtractedMetadata> {
  const chunks = pngChunks(bytes)
  if (!chunks) return { exifTiff: null, icc: null, hasGps: false }
  let exifTiff: Uint8Array | null = null
  let icc: Uint8Array | null = null
  for (const chunk of chunks) {
    if (chunk.type === 'eXIf') exifTiff = tiffFromExifPayload(chunk.data)
    if (chunk.type === 'iCCP') icc = await extractPngIcc(chunk.data)
  }
  return {
    exifTiff,
    icc,
    hasGps: exifTiff ? exifHasGps(exifTiff) : false,
  }
}

type WebpChunk = { fourcc: string; data: Uint8Array }

function parseWebp(bytes: Uint8Array): WebpChunk[] | null {
  if (bytes.length < 12 || latin1(bytes, 0, 4) !== 'RIFF' || latin1(bytes, 8, 4) !== 'WEBP') {
    return null
  }
  const chunks: WebpChunk[] = []
  let i = 12
  while (i + 8 <= bytes.length) {
    const fourcc = latin1(bytes, i, 4)
    const size = new DataView(bytes.buffer, bytes.byteOffset + i + 4, 4).getUint32(0, true)
    if (i + 8 + size > bytes.length) return null
    chunks.push({ fourcc, data: bytes.subarray(i + 8, i + 8 + size) })
    i += 8 + size + (size % 2)
  }
  return chunks
}

function extractWebpMetadata(bytes: Uint8Array): ExtractedMetadata {
  const chunks = parseWebp(bytes)
  if (!chunks) return { exifTiff: null, icc: null, hasGps: false }
  let exifTiff: Uint8Array | null = null
  let icc: Uint8Array | null = null
  for (const chunk of chunks) {
    if (chunk.fourcc === 'EXIF') exifTiff = tiffFromExifPayload(chunk.data)
    if (chunk.fourcc === 'ICCP') icc = chunk.data
  }
  return {
    exifTiff,
    icc,
    hasGps: exifTiff ? exifHasGps(exifTiff) : false,
  }
}

export async function extractEmbeddedMetadata(buffer: ArrayBuffer): Promise<ExtractedMetadata> {
  const bytes = new Uint8Array(buffer)
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    return extractJpegExifIcc(bytes)
  }
  if (bytesEqual(bytes, PNG_SIG)) {
    return extractPngMetadata(bytes)
  }
  if (latin1(bytes, 0, 4) === 'RIFF' && latin1(bytes, 8, 4) === 'WEBP') {
    return extractWebpMetadata(bytes)
  }
  return { exifTiff: null, icc: null, hasGps: false }
}

function jpegAppSegment(marker: number, payload: Uint8Array): Uint8Array {
  const out = new Uint8Array(4 + payload.length)
  out[0] = 0xff
  out[1] = marker
  const length = payload.length + 2
  out[2] = (length >> 8) & 0xff
  out[3] = length & 0xff
  out.set(payload, 4)
  return out
}

function jpegIccSegments(icc: Uint8Array): Uint8Array[] {
  const max = 65535 - 2 - 14
  const total = Math.ceil(icc.length / max) || 1
  const segments: Uint8Array[] = []
  for (let i = 0; i < total; i++) {
    const slice = icc.subarray(i * max, Math.min(icc.length, (i + 1) * max))
    const payload = new Uint8Array(14 + slice.length)
    for (let c = 0; c < 12; c++) payload[c] = ICC_JPEG_HEADER.charCodeAt(c)
    payload[12] = i + 1
    payload[13] = total
    payload.set(slice, 14)
    segments.push(jpegAppSegment(0xe2, payload))
  }
  return segments
}

function injectJpegMetadata(
  output: Uint8Array,
  exifTiff: Uint8Array | null,
  icc: Uint8Array | null,
): Uint8Array {
  if (output.length < 2 || ((output[0] << 8) | output[1]) !== JPEG_SOI) return output
  let insertAt = 2
  if (output.length >= 6 && output[2] === 0xff && output[3] === 0xe0) {
    const len = (output[4] << 8) | output[5]
    insertAt = 4 + len
  }
  const extras: Uint8Array[] = []
  if (exifTiff) extras.push(jpegAppSegment(0xe1, exifApp1FromTiff(exifTiff)))
  if (icc) extras.push(...jpegIccSegments(icc))
  if (extras.length === 0) return output
  return concatBytes([output.subarray(0, insertAt), ...extras, output.subarray(insertAt)])
}

async function pngIccpChunk(icc: Uint8Array): Promise<Uint8Array | null> {
  const compressed = await deflateRaw(icc)
  if (!compressed) return null
  const name = new TextEncoder().encode('ICC Profile')
  const data = new Uint8Array(name.length + 2 + compressed.length)
  data.set(name, 0)
  data[name.length] = 0
  data[name.length + 1] = 0
  data.set(compressed, name.length + 2)
  return writePngChunk('iCCP', data)
}

async function injectPngMetadata(
  output: Uint8Array,
  exifTiff: Uint8Array | null,
  icc: Uint8Array | null,
): Promise<Uint8Array> {
  const chunks = pngChunks(output)
  if (!chunks) return output
  const extras: Uint8Array[] = []
  if (icc) {
    const iccp = await pngIccpChunk(icc)
    if (iccp) extras.push(iccp)
  }
  if (exifTiff) extras.push(writePngChunk('eXIf', exifTiff))
  if (extras.length === 0) return output
  const rebuilt: Uint8Array[] = [new Uint8Array(PNG_SIG)]
  for (const chunk of chunks) {
    if (chunk.type === 'IEND') rebuilt.push(...extras)
    if (chunk.type === 'eXIf' || chunk.type === 'iCCP') continue
    rebuilt.push(writePngChunk(chunk.type, chunk.data))
  }
  return concatBytes(rebuilt)
}

function writeWebpChunk(fourcc: string, data: Uint8Array): Uint8Array {
  const padded = data.length % 2 === 1
  const out = new Uint8Array(8 + data.length + (padded ? 1 : 0))
  for (let i = 0; i < 4; i++) out[i] = fourcc.charCodeAt(i)
  new DataView(out.buffer).setUint32(4, data.length, true)
  out.set(data, 8)
  return out
}

function vp8xPayload(width: number, height: number, flags: number): Uint8Array {
  const data = new Uint8Array(10)
  data[0] = flags
  const w = Math.max(1, width) - 1
  const h = Math.max(1, height) - 1
  data[4] = w & 0xff
  data[5] = (w >> 8) & 0xff
  data[6] = (w >> 16) & 0xff
  data[7] = h & 0xff
  data[8] = (h >> 8) & 0xff
  data[9] = (h >> 16) & 0xff
  return data
}

function injectWebpMetadata(
  output: Uint8Array,
  exifTiff: Uint8Array | null,
  icc: Uint8Array | null,
  width: number,
  height: number,
): Uint8Array {
  const chunks = parseWebp(output)
  if (!chunks) return output
  const rest = chunks.filter(
    (chunk) => chunk.fourcc !== 'EXIF' && chunk.fourcc !== 'ICCP' && chunk.fourcc !== 'VP8X',
  )
  const existingVp8x = chunks.find((chunk) => chunk.fourcc === 'VP8X')
  let flags = existingVp8x?.data[0] ?? 0
  if (icc) flags |= 0x20
  if (exifTiff) flags |= 0x08
  const vp8x = writeWebpChunk('VP8X', vp8xPayload(width, height, flags))
  const body: Uint8Array[] = [vp8x]
  if (icc) body.push(writeWebpChunk('ICCP', icc))
  for (const chunk of rest) body.push(writeWebpChunk(chunk.fourcc, chunk.data))
  if (exifTiff) body.push(writeWebpChunk('EXIF', exifApp1FromTiff(exifTiff)))
  const payload = concatBytes(body)
  const riff = new Uint8Array(12 + payload.length)
  riff.set([0x52, 0x49, 0x46, 0x46], 0)
  new DataView(riff.buffer).setUint32(4, 4 + payload.length, true)
  riff.set([0x57, 0x45, 0x42, 0x50], 8)
  riff.set(payload, 12)
  return riff
}

export async function applyOutputMetadata(
  output: ArrayBuffer,
  format: OutputFormat,
  source: ArrayBuffer,
  options: { mode: MetadataMode; width: number; height: number },
): Promise<ArrayBuffer> {
  if (!shouldWriteMetadata(options.mode) || !supportsMetadataKeep(format)) {
    return output
  }

  try {
    const extracted = await extractEmbeddedMetadata(source)
    const preparedExif =
      extracted.exifTiff != null
        ? prepareExifTiff(extracted.exifTiff, {
            stripGps: options.mode === 'strip-gps',
            width: options.width,
            height: options.height,
          })
        : null
    const icc = extracted.icc
    if (!preparedExif && !icc) return output

    const bytes = new Uint8Array(output)
    let next: Uint8Array
    if (format === 'jpeg') next = injectJpegMetadata(bytes, preparedExif, icc)
    else if (format === 'png') next = await injectPngMetadata(bytes, preparedExif, icc)
    else next = injectWebpMetadata(bytes, preparedExif, icc, options.width, options.height)

    const copy = new Uint8Array(next.byteLength)
    copy.set(next)
    return copy.buffer
  } catch {
    return output
  }
}
