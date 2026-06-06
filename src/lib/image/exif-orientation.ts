import ExifReader from 'exifreader'
import { applyExifOrientation } from '@/lib/image/image-transforms'

export function readExifOrientation(buffer: ArrayBuffer): number {
  try {
    const tags = ExifReader.load(buffer)
    const value = tags.Orientation?.value
    if (typeof value === 'number' && value >= 1 && value <= 8) return value
  } catch {
    // No EXIF block or unsupported container — treat as upright.
  }
  return 1
}

export function orientImageDataFromExif(
  imageData: ImageData,
  buffer: ArrayBuffer,
): ImageData {
  const orientation = readExifOrientation(buffer)
  return orientation === 1 ? imageData : applyExifOrientation(imageData, orientation)
}
