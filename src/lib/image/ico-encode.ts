/** PNG payloads embedded in a classic multi-size .ico (Vista+ PNG-in-ICO). */

export type IcoPngEntry = {
  /** Pixel size (square icons: width === height). */
  size: number
  png: ArrayBuffer
}

function writeUint16LE(view: DataView, offset: number, value: number) {
  view.setUint16(offset, value, true)
}

function writeUint32LE(view: DataView, offset: number, value: number) {
  view.setUint32(offset, value, true)
}

/**
 * Build a multi-size ICO from PNG buffers (no BMP conversion).
 * Entries should be unique sizes; order is preserved in the file.
 */
export function encodeIcoFromPngs(entries: IcoPngEntry[]): ArrayBuffer {
  if (entries.length === 0) {
    throw new Error('ICO requires at least one PNG image')
  }
  if (entries.length > 255) {
    throw new Error('ICO supports at most 255 images')
  }

  for (const entry of entries) {
    if (!Number.isInteger(entry.size) || entry.size < 1 || entry.size > 256) {
      throw new Error(`Invalid ICO size: ${entry.size}`)
    }
    if (entry.png.byteLength < 8) {
      throw new Error('PNG payload is too small for ICO')
    }
    const bytes = new Uint8Array(entry.png)
    if (bytes[0] !== 0x89 || bytes[1] !== 0x50 || bytes[2] !== 0x4e || bytes[3] !== 0x47) {
      throw new Error('ICO entry must be a PNG')
    }
  }

  const count = entries.length
  const headerSize = 6
  const dirEntrySize = 16
  const directorySize = headerSize + dirEntrySize * count
  let offset = directorySize
  const offsets: number[] = []
  let total = directorySize
  for (const entry of entries) {
    offsets.push(offset)
    offset += entry.png.byteLength
    total += entry.png.byteLength
  }

  const out = new ArrayBuffer(total)
  const view = new DataView(out)
  const bytes = new Uint8Array(out)

  writeUint16LE(view, 0, 0) // reserved
  writeUint16LE(view, 2, 1) // type = icon
  writeUint16LE(view, 4, count)

  for (let i = 0; i < count; i++) {
    const entry = entries[i]
    const dirOffset = headerSize + i * dirEntrySize
    const sizeByte = entry.size >= 256 ? 0 : entry.size
    bytes[dirOffset] = sizeByte // width
    bytes[dirOffset + 1] = sizeByte // height
    bytes[dirOffset + 2] = 0 // color count
    bytes[dirOffset + 3] = 0 // reserved
    writeUint16LE(view, dirOffset + 4, 1) // planes
    writeUint16LE(view, dirOffset + 6, 32) // bit count
    writeUint32LE(view, dirOffset + 8, entry.png.byteLength)
    writeUint32LE(view, dirOffset + 12, offsets[i])
  }

  for (let i = 0; i < count; i++) {
    bytes.set(new Uint8Array(entries[i].png), offsets[i])
  }

  return out
}

export function isIcoArrayBuffer(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 6) return false
  const view = new DataView(buffer)
  return view.getUint16(0, true) === 0 && view.getUint16(2, true) === 1
}
