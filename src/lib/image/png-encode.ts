import type { OxipngOptions } from '@/lib/schemas/pipeline-schema'

/** Fields @jsquash/oxipng understands — palette knobs stay in our schema only. */
export function toOxipngWasmOptions(options: OxipngOptions): {
  level: number
  interlace: boolean
} {
  return {
    level: options.level,
    interlace: options.interlace,
  }
}

export function isPngPaletteEnabled(options: OxipngOptions): boolean {
  return options.paletteEnabled
}
