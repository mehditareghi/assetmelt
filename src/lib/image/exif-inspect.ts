import ExifReader from 'exifreader'
import type { MetadataMode, OutputFormat } from '@/lib/schemas/pipeline-schema'
import { supportsMetadataKeep } from '@/lib/image/metadata'

export interface ExifGpsCoords {
  lat: number
  lng: number
}

export interface ExifInspectSummary {
  camera: string | null
  date: string | null
  gps: ExifGpsCoords | null
  hasGps: boolean
}

export type GpsKeepRisk = 'write' | 'pixels-only'

const EXIF_LOAD_OPTIONS = {
  expanded: true,
  async: false,
  excludeTags: {
    thumbnail: true,
    icc: true,
    iptc: true,
    xmp: true,
    photoshop: true,
    makerNotes: true,
    mpf: true,
  },
} as const

function tagText(tag: { description?: string; value?: unknown } | undefined): string | null {
  if (!tag) return null
  if (typeof tag.description === 'string' && tag.description.trim()) {
    const text = tag.description.trim()
    if (text !== 'Unknown' && text !== 'Undefined') return text
  }
  if (typeof tag.value === 'string' && tag.value.trim()) return tag.value.trim()
  if (Array.isArray(tag.value) && typeof tag.value[0] === 'string' && tag.value[0].trim()) {
    return tag.value[0].trim()
  }
  return null
}

function cameraLabel(make: string | null, model: string | null): string | null {
  if (make && model) {
    if (model.toLowerCase().startsWith(make.toLowerCase())) return model
    return `${make} ${model}`
  }
  return model ?? make
}

/** EXIF dates look like `2024:06:12 14:30:01`. */
export function formatExifDate(raw: string): string {
  const match = /^(\d{4}):(\d{2}):(\d{2})(?:\s+(\d{2}):(\d{2})(?::\d{2})?)?/.exec(raw.trim())
  if (!match) return raw.trim()
  const date = `${match[1]}-${match[2]}-${match[3]}`
  if (!match[4]) return date
  return `${date} ${match[4]}:${match[5]}`
}

export function formatExifGps(gps: ExifGpsCoords): string {
  const latHem = gps.lat >= 0 ? 'N' : 'S'
  const lngHem = gps.lng >= 0 ? 'E' : 'W'
  return `${Math.abs(gps.lat).toFixed(5)}° ${latHem}, ${Math.abs(gps.lng).toFixed(5)}° ${lngHem}`
}

export function inspectExif(buffer: ArrayBuffer): ExifInspectSummary | undefined {
  try {
    const tags = ExifReader.load(buffer, EXIF_LOAD_OPTIONS)
    const exif = tags.exif
    const camera = cameraLabel(tagText(exif?.Make), tagText(exif?.Model))
    const dateRaw =
      tagText(exif?.DateTimeOriginal) ?? tagText(exif?.DateTimeDigitized) ?? tagText(exif?.DateTime)
    const lat = tags.gps?.Latitude
    const lng = tags.gps?.Longitude
    const gps =
      typeof lat === 'number' &&
      Number.isFinite(lat) &&
      typeof lng === 'number' &&
      Number.isFinite(lng)
        ? { lat, lng }
        : null
    const hasGps =
      gps != null ||
      exif?.GPSLatitude != null ||
      exif?.GPSLatitudeRef != null ||
      exif?.GPSLongitude != null ||
      exif?.GPSLongitudeRef != null ||
      exif?.['GPS Info IFD Pointer'] != null

    if (!camera && !dateRaw && !hasGps) return undefined

    return {
      camera,
      date: dateRaw ? formatExifDate(dateRaw) : null,
      gps,
      hasGps,
    }
  } catch {
    return undefined
  }
}

export function gpsKeepRisk(
  summary: ExifInspectSummary | undefined,
  mode: MetadataMode | undefined,
  outputFormat: OutputFormat,
): GpsKeepRisk | null {
  if (!summary?.hasGps || mode !== 'keep') return null
  return supportsMetadataKeep(outputFormat) ? 'write' : 'pixels-only'
}

export function isExifSummaryEmpty(summary: ExifInspectSummary | undefined): boolean {
  return !summary || (!summary.camera && !summary.date && !summary.hasGps)
}
