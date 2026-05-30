import type { MozJpegOptions } from '@/lib/schemas/pipeline-schema'

/** Matches @jsquash/jpeg MozJpegColorSpace enum values. */
export const MOZ_JPEG_COLOR_SPACE = {
  GRAYSCALE: 1,
  RGB: 2,
  YCbCr: 3,
} as const

type LegacyColorSpace = keyof typeof MOZ_JPEG_COLOR_SPACE

function normalizeColorSpace(colorSpace: MozJpegOptions['color_space'] | string): number {
  if (typeof colorSpace === 'number') return colorSpace
  return MOZ_JPEG_COLOR_SPACE[colorSpace as LegacyColorSpace] ?? MOZ_JPEG_COLOR_SPACE.YCbCr
}

/** Convert pipeline MozJPEG options to the shape expected by @jsquash/jpeg WASM. */
export function toMozJpegWasmOptions(
  options: MozJpegOptions | Record<string, unknown>,
): Record<string, unknown> {
  const { color_space: colorSpace, ...rest } = options
  return {
    ...rest,
    color_space: normalizeColorSpace(colorSpace as MozJpegOptions['color_space'] | string),
  }
}

export function normalizeMozJpegOptions(options: Record<string, unknown>): MozJpegOptions {
  return {
    ...options,
    color_space: normalizeColorSpace(
      options.color_space as MozJpegOptions['color_space'] | string,
    ) as MozJpegOptions['color_space'],
  } as MozJpegOptions
}
