import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  convertHeicToJpeg,
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

describe('convertHeicToJpeg', () => {
  beforeEach(() => {
    heicToMock.mockReset()
  })

  it('converts a HEIC file to a JPEG blob with the expected encoder options', async () => {
    const file = makeFile('photo.heic', 'image/heic')
    const jpegBlob = new Blob(['jpeg-bytes'], { type: 'image/jpeg' })
    heicToMock.mockResolvedValueOnce(jpegBlob)

    await expect(convertHeicToJpeg(file)).resolves.toEqual({
      blob: jpegBlob,
      name: 'photo.jpg',
    })
    expect(heicToMock).toHaveBeenCalledOnce()
    expect(heicToMock).toHaveBeenCalledWith({
      blob: file,
      type: 'image/jpeg',
      quality: 0.92,
    })
  })

  it('replaces HEIF extensions case-insensitively', async () => {
    const jpegBlob = new Blob(['jpeg-bytes'], { type: 'image/jpeg' })
    heicToMock.mockResolvedValueOnce(jpegBlob)

    await expect(convertHeicToJpeg(makeFile('Vacation.HEIF', 'image/heif'))).resolves.toEqual({
      blob: jpegBlob,
      name: 'Vacation.jpg',
    })
  })

  it('leaves names without HEIC or HEIF extensions unchanged', async () => {
    const jpegBlob = new Blob(['jpeg-bytes'], { type: 'image/jpeg' })
    heicToMock.mockResolvedValueOnce(jpegBlob)

    await expect(convertHeicToJpeg(makeFile('upload.bin', 'application/octet-stream'))).resolves.toEqual({
      blob: jpegBlob,
      name: 'upload.bin',
    })
  })

  it('wraps decoder errors with a user-facing message and preserves the cause', async () => {
    const decoderError = new Error('unsupported brand')
    heicToMock.mockRejectedValueOnce(decoderError)

    await expect(convertHeicToJpeg(makeFile('broken.heic', 'image/heic'))).rejects.toMatchObject({
      message: 'Could not decode HEIC image: unsupported brand',
      cause: decoderError,
    })
  })

  it('handles non-Error decoder failures', async () => {
    heicToMock.mockRejectedValueOnce('decoder crashed')

    await expect(convertHeicToJpeg(makeFile('broken.heic', 'image/heic'))).rejects.toThrow(
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

  it('converts HEIC files to JPEG files and records the original byte size', async () => {
    const file = new File(['heic-bytes'], 'photo.heic', { type: 'image/heic' })
    const jpegBlob = new Blob(['jpeg-bytes'], { type: 'image/jpeg' })
    heicToMock.mockResolvedValueOnce(jpegBlob)

    const result = await prepareFileForProcessing(file, 'heic' as InputFormat)

    expect(result.inputFormat).toBe('jpeg')
    expect(result.sourceByteSize).toBe(file.size)
    expect(result.file).toBeInstanceOf(File)
    expect(result.file).not.toBe(file)
    expect(result.file.name).toBe('photo.jpg')
    expect(result.file.type).toBe('image/jpeg')
    await expect(result.file.text()).resolves.toBe('jpeg-bytes')
    expect(heicToMock).toHaveBeenCalledWith({
      blob: file,
      type: 'image/jpeg',
      quality: 0.92,
    })
  })

  it('converts files that only look like HEIC from metadata', async () => {
    const file = makeFile('camera-output.HEIF', 'application/octet-stream')
    const jpegBlob = new Blob(['jpeg-bytes'], { type: 'image/jpeg' })
    heicToMock.mockResolvedValueOnce(jpegBlob)

    const result = await prepareFileForProcessing(file, 'unknown' as InputFormat)

    expect(result.inputFormat).toBe('jpeg')
    expect(result.file.name).toBe('camera-output.jpg')
    expect(isHeicMock).not.toHaveBeenCalled()
  })

  it('sniffs unknown files before deciding whether to convert', async () => {
    const file = makeFile('upload.bin', 'application/octet-stream')
    const jpegBlob = new Blob(['jpeg-bytes'], { type: 'image/jpeg' })
    isHeicMock.mockResolvedValueOnce(true)
    heicToMock.mockResolvedValueOnce(jpegBlob)

    const result = await prepareFileForProcessing(file, 'unknown' as InputFormat)

    expect(result.inputFormat).toBe('jpeg')
    expect(result.file.name).toBe('upload.bin')
    expect(isHeicMock).toHaveBeenCalledWith(file)
    expect(heicToMock).toHaveBeenCalledWith({
      blob: file,
      type: 'image/jpeg',
      quality: 0.92,
    })
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
