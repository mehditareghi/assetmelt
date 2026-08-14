export const SETTING_HELP = {
  outputFormat:
    'Target file format for export. WebP and AVIF usually give the smallest files; PNG is lossless.',
  stripMetadata:
    'Strip all (default) drops EXIF, GPS, and ICC. Strip GPS keeps camera and color-profile data but removes location. Keep writes a lossy-safe subset (orientation already applied, no thumbnail) into JPEG, WebP, and PNG. AVIF, JXL, and QOI always export pixels only.',
  filenamePattern:
    'Output naming template. Tokens: {name} original basename, {ext} new extension, {width} and {height} output pixels, {quality} encode quality (blank for PNG/QOI), {date} local YYYY-MM-DD. Applies to single downloads, ZIP batches, and favicon kits.',

  resizeEnabled: 'Scale images before encoding. Reduces file size and dimensions.',
  resizeMode:
    'How target size is calculated: exact box, longest-edge limit, width/height ceiling, or percentage scale.',
  resizeWidth: 'Target width in pixels. Meaning depends on the selected resize mode.',
  resizeHeight: 'Target height in pixels. Meaning depends on the selected resize mode.',
  resizePercentage:
    'Scale relative to the original. 100% keeps size; 50% halves width and height (¼ area).',
  lockAspectRatio:
    'When on, width and height scale together so the image is not stretched or squashed.',
  resizeMethod:
    'Resampling kernel. Lanczos3 is sharp and general-purpose; Magic Kernel is great for photos; HQX suits pixel art.',
  fitMethod:
    'When aspect ratio is unlocked in Exact mode: Stretch fills the box; Contain fits inside without cropping.',
  premultiply:
    'Premultiplies alpha before resize. Usually leave on for images with transparency.',
  linearRGB:
    'Resizes in linear light space for more accurate downscaling. Recommended for photos.',

  cropEnabled:
    'Apply a rectangular crop after rotate, flip, and filters — on the image as you see it. Use Edit crop to adjust on the preview.',
  cropAspectRatio:
    'Quick presets to reshape the crop. Manual edits update the active ratio automatically.',
  cropX: 'Left edge of the crop region, in pixels from the image origin.',
  cropY: 'Top edge of the crop region, in pixels from the image origin.',
  cropWidth: 'Width of the crop region in pixels.',
  cropHeight: 'Height of the crop region in pixels.',

  rotate: 'Rotate clockwise in 90° steps before crop, resize, and encode.',
  flipHorizontal: 'Mirror the image left-to-right.',
  flipVertical: 'Mirror the image top-to-bottom.',

  filtersEnabled: 'Apply color and sharpening adjustments in the browser before encode.',
  brightness: 'Shift overall lightness. 0 is unchanged; negative darkens, positive brightens.',
  contrast: 'Increase or decrease tonal separation between light and dark areas.',
  saturation: 'Color intensity. 0 is unchanged; negative moves toward grayscale.',
  sharpen: 'Edge enhancement after resize. Use sparingly — encoding also affects sharpness.',
  grayscale: 'Convert to grayscale before encoding.',

  quality: 'Lossy quality trade-off. Higher values look better but produce larger files.',
  oxipngLevel:
    'PNG optimization effort (0–6). Higher levels squeeze more bytes but take longer.',
  webpMethod: 'WebP encoder effort (0–6). Higher values compress better but are slower.',
  avifSpeed: 'AVIF encode speed (0–10). Higher is faster with slightly larger files.',
  avifLossless: 'Encode AVIF without lossy compression. Files are larger but pixel-perfect.',
  jpegProgressive: 'Progressive JPEG loads in multiple passes — better for web previews.',
  jxlEffort: 'JPEG XL encoder effort (1–9). Higher improves compression at the cost of time.',

  sizeBudgetEnabled:
    'Automatically tune quality (and optionally dimensions) so the output fits under your size limit while looking as good as possible.',
  sizeBudgetTarget: 'Maximum output file size. The encoder searches for the best quality that stays under this limit.',
  sizeBudgetAllowResize:
    'If quality alone cannot hit the target, progressively shrink dimensions until the file fits.',
} as const

export const RESIZE_MODE_LABELS: Record<
  import('@/lib/schemas/pipeline-schema').ResizeMode,
  { label: string; description: string }
> = {
  exact: {
    label: 'Exact dimensions',
    description: 'Fit into a width × height box (optionally keeping aspect ratio).',
  },
  maxSide: {
    label: 'Max side',
    description: 'Limit the longest edge; shorter edge scales proportionally.',
  },
  maxWidth: {
    label: 'Max width',
    description: 'Cap width; height follows aspect ratio when locked.',
  },
  maxHeight: {
    label: 'Max height',
    description: 'Cap height; width follows aspect ratio when locked.',
  },
  percentage: {
    label: 'Scale %',
    description: 'Resize by a percentage of the original width and height.',
  },
}
