import { z } from 'zod'

export const outputFormatSchema = z.enum([
  'jpeg',
  'webp',
  'avif',
  'png',
  'jxl',
  'qoi',
])

export type OutputFormat = z.infer<typeof outputFormatSchema>

/** Formats that can ride along as extra ZIP outputs in a multi-format run. */
export const alsoExportFormatSchema = z.enum(['avif', 'webp', 'jpeg'])
export type AlsoExportFormat = z.infer<typeof alsoExportFormatSchema>

export const resizeMethodSchema = z.enum([
  'triangle',
  'catrom',
  'mitchell',
  'lanczos3',
  'hqx',
  'magicKernel',
  'magicKernelSharp2013',
  'magicKernelSharp2021',
])

export const resizeModeSchema = z.enum([
  'exact',
  'maxSide',
  'maxWidth',
  'maxHeight',
  'percentage',
])

export type ResizeMode = z.infer<typeof resizeModeSchema>

export const resizeSchema = z.object({
  enabled: z.boolean().default(false),
  mode: resizeModeSchema.default('maxSide'),
  width: z.number().int().min(1).max(16384).default(1920),
  height: z.number().int().min(1).max(16384).default(1080),
  percentage: z.number().min(1).max(400).default(100),
  lockAspectRatio: z.boolean().default(true),
  /** Keep width/height when switching source files (platform exact-size presets). */
  lockTargetDimensions: z.boolean().default(false),
  method: resizeMethodSchema.default('lanczos3'),
  fitMethod: z.enum(['stretch', 'contain']).default('contain'),
  premultiply: z.boolean().default(true),
  linearRGB: z.boolean().default(true),
})

export const cropAspectRatioSchema = z.enum([
  'free',
  '1:1',
  '4:3',
  '4:5',
  '3:2',
  '16:9',
  '40:21',
  '9:16',
  '3:4',
  '2:3',
])

export type CropAspectRatio = z.infer<typeof cropAspectRatioSchema>

export const cropSchema = z.object({
  enabled: z.boolean().default(false),
  aspectRatio: cropAspectRatioSchema.default('free'),
  x: z.number().int().min(0).default(0),
  y: z.number().int().min(0).default(0),
  width: z.number().int().min(1).default(100),
  height: z.number().int().min(1).default(100),
})

export const flipSchema = z.object({
  horizontal: z.boolean().default(false),
  vertical: z.boolean().default(false),
})

export const filtersSchema = z.object({
  enabled: z.boolean().default(false),
  brightness: z.number().min(-100).max(100).default(0),
  contrast: z.number().min(-100).max(100).default(0),
  saturation: z.number().min(-100).max(100).default(0),
  grayscale: z.boolean().default(false),
  blur: z.number().min(0).max(20).default(0),
  sharpen: z.number().min(0).max(100).default(0),
})

export const mozJpegOptionsSchema = z.object({
  quality: z.number().min(0).max(100).default(75),
  baseline: z.boolean().default(false),
  arithmetic: z.boolean().default(false),
  progressive: z.boolean().default(true),
  optimize_coding: z.boolean().default(true),
  smoothing: z.number().min(0).max(100).default(0),
  color_space: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(3),
  quant_table: z.number().int().min(0).max(5).default(3),
  trellis_multipass: z.boolean().default(false),
  trellis_opt_zero: z.boolean().default(false),
  trellis_opt_table: z.boolean().default(false),
  trellis_loops: z.number().int().min(1).max(50).default(1),
  auto_subsample: z.boolean().default(true),
  chroma_subsample: z.number().int().min(0).max(2).default(2),
  separate_chroma_quality: z.boolean().default(false),
  chroma_quality: z.number().int().min(0).max(100).default(75),
})

export const webpOptionsSchema = z.object({
  quality: z.number().min(0).max(100).default(75),
  target_size: z.number().int().min(0).default(0),
  target_PSNR: z.number().min(0).default(0),
  method: z.number().int().min(0).max(6).default(4),
  sns_strength: z.number().int().min(0).max(100).default(50),
  filter_strength: z.number().int().min(0).max(100).default(60),
  filter_sharpness: z.number().int().min(0).max(7).default(0),
  filter_type: z.number().int().min(0).max(2).default(1),
  autofilter: z.number().int().min(0).max(1).default(0),
  segments: z.number().int().min(1).max(4).default(4),
  pass: z.number().int().min(1).max(10).default(1),
  show_compressed: z.number().int().min(0).max(1).default(0),
  preprocessing: z.number().int().min(0).max(2).default(0),
  partitions: z.number().int().min(0).max(3).default(0),
  partition_limit: z.number().int().min(0).max(100).default(0),
  alpha_compression: z.number().int().min(0).max(1).default(1),
  alpha_filtering: z.number().int().min(0).max(2).default(1),
  alpha_quality: z.number().int().min(0).max(100).default(100),
  lossless: z.number().int().min(0).max(1).default(0),
  exact: z.number().int().min(0).max(1).default(0),
  image_hint: z.number().int().min(0).max(3).default(0),
  emulate_jpeg_size: z.number().int().min(0).max(1).default(0),
  thread_level: z.number().int().min(0).max(1).default(0),
  low_memory: z.number().int().min(0).max(1).default(0),
  near_lossless: z.number().int().min(0).max(100).default(100),
  use_delta_palette: z.number().int().min(0).max(1).default(0),
  use_sharp_yuv: z.number().int().min(0).max(1).default(0),
})

export const avifOptionsSchema = z.object({
  quality: z.number().min(0).max(100).default(50),
  qualityAlpha: z.number().min(-1).max(100).default(-1),
  denoiseLevel: z.number().int().min(0).max(50).default(0),
  tileColsLog2: z.number().int().min(0).max(6).default(0),
  tileRowsLog2: z.number().int().min(0).max(6).default(0),
  speed: z.number().int().min(0).max(10).default(6),
  subsample: z.number().int().min(0).max(3).default(1),
  chromaDeltaQ: z.boolean().default(false),
  sharpness: z.number().int().min(0).max(7).default(0),
  tune: z.enum(['auto', 'psnr', 'ssim']).default('auto'),
  lossless: z.boolean().default(false),
  bitDepth: z.union([z.literal(8), z.literal(10), z.literal(12)]).default(8),
})

export const oxipngOptionsSchema = z.object({
  level: z.number().int().min(0).max(6).default(2),
  interlace: z.boolean().default(false),
})

export const sizeBudgetSchema = z.object({
  enabled: z.boolean().default(false),
  targetBytes: z.number().int().min(512).max(52_428_800).default(102_400),
  allowResize: z.boolean().default(true),
})

/** How to treat source EXIF/ICC on encode. Legacy `stripMetadata` maps in parse. */
export const metadataModeSchema = z.enum(['strip', 'strip-gps', 'keep'])

export type MetadataMode = z.infer<typeof metadataModeSchema>

export const jxlOptionsSchema = z.object({
  quality: z.number().min(-1).max(100).default(75),
  effort: z.number().int().min(1).max(9).default(7),
  lossless: z.boolean().default(false),
  decodingSpeedTier: z.number().int().min(0).max(4).default(0),
  photonNoiseIso: z.number().int().min(0).default(0),
  lossyModular: z.boolean().default(false),
  progressive: z.boolean().default(false),
  epf: z.number().int().min(-1).max(3).default(-1),
  responsive: z.boolean().default(false),
  extraChannel: z.number().int().min(0).default(0),
})

export const qoiOptionsSchema = z.object({})

export const encodeOptionsSchema = z.discriminatedUnion('format', [
  z.object({ format: z.literal('jpeg'), options: mozJpegOptionsSchema }),
  z.object({ format: z.literal('webp'), options: webpOptionsSchema }),
  z.object({ format: z.literal('avif'), options: avifOptionsSchema }),
  z.object({ format: z.literal('png'), options: oxipngOptionsSchema }),
  z.object({ format: z.literal('jxl'), options: jxlOptionsSchema }),
  z.object({ format: z.literal('qoi'), options: qoiOptionsSchema }),
])

export const pipelineSchema = z.object({
  outputFormat: outputFormatSchema.default('webp'),
  resize: resizeSchema.default({
    enabled: false,
    mode: 'maxSide',
    width: 1920,
    height: 1080,
    percentage: 100,
    lockAspectRatio: true,
    lockTargetDimensions: false,
    method: 'lanczos3',
    fitMethod: 'contain',
    premultiply: true,
    linearRGB: true,
  }),
  crop: cropSchema.default({
    enabled: false,
    aspectRatio: 'free',
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  }),
  rotate: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]).default(0),
  flip: flipSchema.default({ horizontal: false, vertical: false }),
  filters: filtersSchema.default({
    enabled: false,
    brightness: 0,
    contrast: 0,
    saturation: 0,
    grayscale: false,
    blur: 0,
    sharpen: 0,
  }),
  encode: encodeOptionsSchema,
  sizeBudget: sizeBudgetSchema.default({
    enabled: false,
    targetBytes: 102_400,
    allowResize: true,
  }),
  /**
   * Extra codecs to encode in the same run (ZIP). Primary `outputFormat` is always first.
   * Ignored under platform workflows (e.g. favicon kit).
   */
  alsoExportFormats: z.array(alsoExportFormatSchema).default([]),
  metadataMode: metadataModeSchema.optional(),
  /** @deprecated Prefer `metadataMode`. Accepted on parse for saved pipelines. */
  stripMetadata: z.boolean().optional(),
  filenamePattern: z.string().default('{name}-melted.{ext}'),
}).transform(({ stripMetadata, metadataMode: modeFromData, ...rest }) => {
  const metadataMode: MetadataMode =
    modeFromData ?? (stripMetadata === false ? 'keep' : 'strip')
  return { ...rest, metadataMode }
})

export type PipelineConfig = z.infer<typeof pipelineSchema>
export type ResizeConfig = z.infer<typeof resizeSchema>
export type CropConfig = z.infer<typeof cropSchema>
export type FiltersConfig = z.infer<typeof filtersSchema>
export type MozJpegOptions = z.infer<typeof mozJpegOptionsSchema>
export type WebpOptions = z.infer<typeof webpOptionsSchema>
export type AvifOptions = z.infer<typeof avifOptionsSchema>
export type OxipngOptions = z.infer<typeof oxipngOptionsSchema>
export type JxlOptions = z.infer<typeof jxlOptionsSchema>
export type SizeBudgetConfig = z.infer<typeof sizeBudgetSchema>

export function getDefaultEncodeOptions(format: OutputFormat) {
  switch (format) {
    case 'jpeg':
      return { format: 'jpeg' as const, options: mozJpegOptionsSchema.parse({}) }
    case 'webp':
      return { format: 'webp' as const, options: webpOptionsSchema.parse({}) }
    case 'avif':
      return { format: 'avif' as const, options: avifOptionsSchema.parse({}) }
    case 'png':
      return { format: 'png' as const, options: oxipngOptionsSchema.parse({}) }
    case 'jxl':
      return { format: 'jxl' as const, options: jxlOptionsSchema.parse({}) }
    case 'qoi':
      return { format: 'qoi' as const, options: qoiOptionsSchema.parse({}) }
  }
}

export function createDefaultPipeline(): PipelineConfig {
  const outputFormat = 'webp' as const
  return pipelineSchema.parse({
    outputFormat,
    encode: getDefaultEncodeOptions(outputFormat),
  })
}
