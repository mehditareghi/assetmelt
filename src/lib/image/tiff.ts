import type { IFD } from 'utif2'

type UtifApi = {
  decode: (buffer: ArrayBuffer) => IFD[]
  decodeImage: (buffer: ArrayBuffer, ifd: IFD) => void
  toRGBA8: (ifd: IFD) => Uint8Array
}

const DECODE_FAILED = "Couldn't decode this TIFF. Try exporting as PNG or JPEG first."

function asUtifApi(mod: unknown): UtifApi | undefined {
  if (!mod || typeof mod !== 'object') return undefined
  const record = mod as { decode?: unknown; default?: unknown }
  if (typeof record.decode === 'function') return mod as UtifApi
  if (record.default) return asUtifApi(record.default)
  return undefined
}

async function loadUtif(): Promise<UtifApi> {
  const loaded = asUtifApi(await import('utif2'))
  if (!loaded) throw new Error(DECODE_FAILED)
  return loaded
}

function hasPixelData(ifd: IFD): boolean {
  return Boolean(ifd.t273 || ifd.t324 || ifd.t513)
}

/** First page with pixel data — same “still only” rule as GIF. */
function pickFirstPage(ifds: IFD[]): IFD {
  return ifds.find(hasPixelData) ?? ifds[0]
}

function ifdDimension(ifd: IFD, key: 'width' | 'height', tag: 't256' | 't257'): number {
  const tagged = ifd[tag]
  const fromTag = Array.isArray(tagged) ? Number(tagged[0]) : 0
  const direct = typeof ifd[key] === 'number' ? ifd[key] : 0
  return Number(direct || fromTag || 0)
}

function toImageData(rgba: Uint8Array, width: number, height: number): ImageData {
  const expected = width * height * 4
  const data = new Uint8ClampedArray(expected)
  data.set(rgba.subarray(0, expected))
  return new ImageData(data, width, height)
}

export async function decodeTiff(buffer: ArrayBuffer): Promise<ImageData> {
  const UTIF = await loadUtif()
  let ifds: IFD[]
  try {
    ifds = UTIF.decode(buffer)
  } catch {
    throw new Error(DECODE_FAILED)
  }
  if (!ifds.length) {
    throw new Error("Couldn't decode this TIFF (no image pages found).")
  }

  const page = pickFirstPage(ifds)
  try {
    UTIF.decodeImage(buffer, page)
  } catch {
    throw new Error(DECODE_FAILED)
  }

  const width = ifdDimension(page, 'width', 't256')
  const height = ifdDimension(page, 'height', 't257')
  if (width < 1 || height < 1) {
    throw new Error("Couldn't decode this TIFF (missing dimensions).")
  }

  let rgba: Uint8Array
  try {
    rgba = UTIF.toRGBA8(page)
  } catch {
    throw new Error(DECODE_FAILED)
  }
  if (rgba.length < width * height * 4) {
    throw new Error("Couldn't decode this TIFF (unsupported or incomplete pixel data).")
  }

  return toImageData(rgba, width, height)
}
