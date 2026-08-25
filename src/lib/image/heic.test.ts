import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  decodeHeic,
  isHeicFileName,
  isHeicFormat,
  isHeicMimeType,
  looksLikeHeic,
  prepareFileForProcessing,
  resolveHeicInputFormat,
} from './heic'
import type { InputFormat } from '@/lib/image/format-detection'

const isHeicMock = vi.fn()
const heicToMock = vi.fn()

vi.mock('heic-to', () => ({
  heicTo: heicToMock,
  isHeic: isHeicMock,
}))

function makeFile(name: string, type = 'image/jpeg'): File {
  return new File(['image-bytes'], name, { type })
}

describe('isHeicFormat', () => {
  it('returns true for HEIC format', () => {
    expect(isHeicFormat('heic' as InputFormat)).toBe(true)
  })
  it('returns false for non-HEIC format', () => {
    expect(isHeicFormat('jpeg' as InputFormat)).toBe(false)
  })
})

describe('isHeicMimeType', () => {
  it('returns true for HEIC MIME type', () => {
    expect(isHeicMimeType('image/heic')).toBe(true)
  })
  it('handles uppercase MIME type', () => {
    expect(isHeicMimeType('IMAGE/HEIC')).toBe(true)
  })
  it('returns false for non-HEIC MIME type', () => {
    expect(isHeicMimeType('image/jpeg')).toBe(false)
  })
})

describe('isHeicFileName', () => {
  it('returns true for HEIC file name', () => {
    expect(isHeicFileName('image.heic')).toBe(true)
  })
  it('returns false for non-HEIC file name', () => {
    expect(isHeicFileName('image.jpg')).toBe(false)
  })
})

describe('looksLikeHeic', () => {
  it('returns true for HEIC format', () => {
    expect(looksLikeHeic('heic' as InputFormat, { name: 'image.heic', type: 'image/heic' })).toBe(true)
  })
  it('returns false for non-HEIC format', () => {
    expect(looksLikeHeic('jpeg' as InputFormat, { name: 'image.jpg', type: 'image/jpeg' })).toBe(false)
  })
})

describe('resolveHeicInputFormat', () => {
  beforeEach(() => {
    isHeicMock.mockReset()
  })

  it('keeps an already detected HEIC format without sniffing the file bytes', async () => {
    await expect(resolveHeicInputFormat(makeFile('image.jpg'), 'heic' as InputFormat)).resolves.toBe('heic')
    expect(isHeicMock).not.toHaveBeenCalled()
  })

  it('resolves to HEIC when a misleading detected format has a HEIC MIME type', async () => {
    await expect(resolveHeicInputFormat(makeFile('image.jpg', 'image/heif-sequence'), 'jpeg' as InputFormat)).resolves.toBe('heic')
    expect(isHeicMock).not.toHaveBeenCalled()
  })

  it('resolves to HEIC when a misleading detected format has a HEIC file extension', async () => {
    await expect(resolveHeicInputFormat(makeFile('photo.HEIC', 'image/jpeg'), 'jpeg' as InputFormat)).resolves.toBe('heic')
    expect(isHeicMock).not.toHaveBeenCalled()
  })

  it('sniffs unknown files and resolves to HEIC when the blob detector matches', async () => {
    const file = makeFile('upload.bin', 'application/octet-stream')
    isHeicMock.mockResolvedValueOnce(true)

    await expect(resolveHeicInputFormat(file, 'unknown' as InputFormat)).resolves.toBe('heic')
    expect(isHeicMock).toHaveBeenCalledOnce()
    expect(isHeicMock).toHaveBeenCalledWith(file)
  })

  it('keeps unknown format when byte sniffing does not detect HEIC', async () => {
    isHeicMock.mockResolvedValueOnce(false)

    await expect(resolveHeicInputFormat(makeFile('upload.bin', 'application/octet-stream'), 'unknown' as InputFormat)).resolves.toBe('unknown')
  })

  it('keeps a non-HEIC detected format when metadata does not look like HEIC', async () => {
    await expect(resolveHeicInputFormat(makeFile('image.jpg'), 'jpeg' as InputFormat)).resolves.toBe('jpeg')
    expect(isHeicMock).not.toHaveBeenCalled()
  })
})

describe('decodeHeic', () => {
  beforeEach(() => {
    heicToMock.mockReset()
  })

  it('decodes HEIC to ImageData via the bitmap path (no JPEG bounce)', async () => {
    const pixels = new Uint8ClampedArray([10, 20, 30, 255, 40, 50, 60, 255])
    const imageData = { width: 2, height: 1, data: pixels } as ImageData
    const bitmap = {
      width: 2,
      height: 1,
      close: vi.fn(),
    }
    heicToMock.mockResolvedValueOnce(bitmap)

    const drawImage = vi.fn()
    const getImageData = vi.fn(() => imageData)
    const getContext = vi.fn(() => ({ drawImage, getImageData }))
    vi.stubGlobal(
      'OffscreenCanvas',
      class {
        width: number
        height: number
        constructor(width: number, height: number) {
          this.width = width
          this.height = height
        }
        getContext() {
          return getContext()
        }
      },
    )

    const buffer = new Uint8Array([1, 2, 3]).buffer
    await expect(decodeHeic(buffer)).resolves.toBe(imageData)
    expect(heicToMock).toHaveBeenCalledOnce()
    expect(heicToMock).toHaveBeenCalledWith({
      blob: expect.any(Blob),
      type: 'bitmap',
    })
    expect(drawImage).toHaveBeenCalledWith(bitmap, 0, 0)
    expect(bitmap.close).toHaveBeenCalledOnce()
    vi.unstubAllGlobals()
  })

  it('wraps decoder errors with a user-facing message and preserves the cause', async () => {
    const decoderError = new Error('unsupported brand')
    heicToMock.mockRejectedValueOnce(decoderError)

    await expect(decodeHeic(new ArrayBuffer(4))).rejects.toMatchObject({
      message: 'Could not decode HEIC image: unsupported brand',
      cause: decoderError,
    })
  })

  it('handles non-Error decoder failures', async () => {
    heicToMock.mockRejectedValueOnce('decoder crashed')

    await expect(decodeHeic(new ArrayBuffer(4))).rejects.toThrow(
      'Could not decode HEIC image: Unknown error',
    )
  })
})

describe('prepareFileForProcessing', () => {
  beforeEach(() => {
    heicToMock.mockReset()
    isHeicMock.mockReset()
  })

  it('returns the original file when the resolved input format is not HEIC', async () => {
    const file = makeFile('photo.jpg', 'image/jpeg')

    await expect(prepareFileForProcessing(file, 'jpeg' as InputFormat)).resolves.toEqual({
      file,
      inputFormat: 'jpeg',
    })
    expect(heicToMock).not.toHaveBeenCalled()
    expect(isHeicMock).not.toHaveBeenCalled()
  })

  it('keeps the original HEIC file and format (no JPEG bounce)', async () => {
    const file = new File(['heic-bytes'], 'photo.heic', { type: 'image/heic' })

    await expect(prepareFileForProcessing(file, 'heic' as InputFormat)).resolves.toEqual({
      file,
      inputFormat: 'heic',
    })
    expect(heicToMock).not.toHaveBeenCalled()
  })

  it('resolves metadata-lookalike files to HEIC without converting', async () => {
    const file = makeFile('camera-output.HEIF', 'application/octet-stream')

    const result = await prepareFileForProcessing(file, 'unknown' as InputFormat)

    expect(result).toEqual({ file, inputFormat: 'heic' })
    expect(heicToMock).not.toHaveBeenCalled()
    expect(isHeicMock).not.toHaveBeenCalled()
  })

  it('sniffs unknown files before deciding the format, still without converting', async () => {
    const file = makeFile('upload.bin', 'application/octet-stream')
    isHeicMock.mockResolvedValueOnce(true)

    const result = await prepareFileForProcessing(file, 'unknown' as InputFormat)

    expect(result).toEqual({ file, inputFormat: 'heic' })
    expect(isHeicMock).toHaveBeenCalledWith(file)
    expect(heicToMock).not.toHaveBeenCalled()
  })

  it('does not convert unknown files when byte sniffing does not detect HEIC', async () => {
    const file = makeFile('upload.bin', 'application/octet-stream')
    isHeicMock.mockResolvedValueOnce(false)

    await expect(prepareFileForProcessing(file, 'unknown' as InputFormat)).resolves.toEqual({
      file,
      inputFormat: 'unknown',
    })
    expect(heicToMock).not.toHaveBeenCalled()
  })
})
