export type InputFormat =
  | 'jpeg'
  | 'png'
  | 'webp'
  | 'avif'
  | 'gif'
  | 'bmp'
  | 'svg'
  | 'heic'
  | 'jxl'
  | 'qoi'
  | 'tiff'
  | 'unknown'

/** ISO BMFF major brands used by HEIC/HEIF still images (not AVIF). */
const HEIF_MAJOR_BRANDS = new Set([
  'heic',
  'heif',
  'heix',
  'hevc',
  'hevx',
  'heim',
  'heis',
  'hevm',
  'hevs',
  'mif1',
  'msf1',
  'hif1',
])

function detectHeifFromIsoBmff(view: Uint8Array): boolean {
  if (view.length < 12) return false
  if (view[4] !== 0x66 || view[5] !== 0x74 || view[6] !== 0x79 || view[7] !== 0x70) {
    return false
  }
  const brand = String.fromCharCode(view[8], view[9], view[10], view[11])
  return HEIF_MAJOR_BRANDS.has(brand)
}

const SIGNATURES: Array<{ format: InputFormat; bytes: number[]; offset?: number }> = [
  { format: 'jpeg', bytes: [0xff, 0xd8, 0xff] },
  { format: 'png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { format: 'gif', bytes: [0x47, 0x49, 0x46] },
  { format: 'webp', bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },
  { format: 'bmp', bytes: [0x42, 0x4d] },
  { format: 'avif', bytes: [0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66], offset: 4 },
  { format: 'heic', bytes: [0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63], offset: 4 },
  { format: 'heic', bytes: [0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x66], offset: 4 },
  { format: 'jxl', bytes: [0xff, 0x0a] },
  { format: 'jxl', bytes: [0x00, 0x00, 0x00, 0x0c, 0x4a, 0x58, 0x4c, 0x20] },
  { format: 'jxl', bytes: [0x6a, 0x78, 0x6c], offset: 8 },
  { format: 'qoi', bytes: [0x71, 0x6f, 0x69, 0x66] },
  { format: 'tiff', bytes: [0x49, 0x49, 0x2a, 0x00] },
  { format: 'tiff', bytes: [0x4d, 0x4d, 0x00, 0x2a] },
]

export function detectFormatFromBuffer(buffer: ArrayBuffer, fileName?: string): InputFormat {
  const view = new Uint8Array(buffer.slice(0, 32))

  for (const sig of SIGNATURES) {
    const offset = sig.offset ?? 0
    if (sig.bytes.every((byte, i) => view[offset + i] === byte)) {
      if (sig.format === 'webp') {
        const webpSig = [0x57, 0x45, 0x42, 0x50]
        if (webpSig.every((byte, i) => view[8 + i] === byte)) return 'webp'
        continue
      }
      return sig.format
    }
  }

  if (detectHeifFromIsoBmff(view)) return 'heic'

  if (fileName) {
    const ext = fileName.split('.').pop()?.toLowerCase()
    const extMap: Record<string, InputFormat> = {
      jpg: 'jpeg',
      jpeg: 'jpeg',
      png: 'png',
      webp: 'webp',
      avif: 'avif',
      gif: 'gif',
      bmp: 'bmp',
      svg: 'svg',
      heic: 'heic',
      heif: 'heic',
      jxl: 'jxl',
      qoi: 'qoi',
      tif: 'tiff',
      tiff: 'tiff',
    }
    if (ext && extMap[ext]) return extMap[ext]
  }

  const text = new TextDecoder().decode(buffer.slice(0, 256)).trim()
  if (text.startsWith('<svg') || text.startsWith('<?xml')) return 'svg'

  return 'unknown'
}

export function isImageFile(file: File): boolean {
  const mime = file.type.toLowerCase()
  if (mime.startsWith('image/')) return true
  if (mime.startsWith('image/heic') || mime.startsWith('image/heif')) return true
  const ext = file.name.split('.').pop()?.toLowerCase()
  return ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'bmp', 'svg', 'heic', 'heif', 'jxl', 'qoi', 'tiff', 'tif'].includes(ext ?? '')
}
