import type {
  CropAspectRatio,
  CropConfig,
  PipelineConfig,
  ResizeConfig,
} from '@/lib/schemas/pipeline-schema'
import type { Preset } from '@/lib/presets'

function cropHint(aspectRatio: CropAspectRatio): CropConfig {
  return {
    enabled: false,
    aspectRatio,
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  }
}

/** Exact output dimensions for social / OG exports (crop first, then stretch to size). */
export function platformExactResize(
  width: number,
  height: number,
): ResizeConfig {
  return {
    enabled: true,
    mode: 'exact',
    width,
    height,
    percentage: 100,
    lockAspectRatio: false,
    lockTargetDimensions: true,
    method: 'lanczos3',
    fitMethod: 'stretch',
    premultiply: true,
    linearRGB: true,
  }
}

/** Cap width; height follows the source (email / newsletter). */
export function platformMaxWidth(width: number): ResizeConfig {
  return {
    enabled: true,
    mode: 'maxWidth',
    width,
    height: width,
    percentage: 100,
    lockAspectRatio: true,
    lockTargetDimensions: true,
    method: 'lanczos3',
    fitMethod: 'contain',
    premultiply: true,
    linearRGB: true,
  }
}

export interface PlatformPresetOptions {
  suggestedCropAspect?: CropAspectRatio
  /** When true, enables a centered crop for the aspect ratio after a file is loaded. */
  autoCrop?: boolean
}

export type PlatformPresetGroup = 'link' | 'instagram' | 'video' | 'store' | 'email' | 'site'

export const PLATFORM_PRESET_GROUPS: Array<{
  id: PlatformPresetGroup
  label: string
}> = [
  { id: 'link', label: 'Link preview' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'video', label: 'Video' },
  { id: 'store', label: 'App Store' },
  { id: 'email', label: 'Email' },
  { id: 'site', label: 'Site assets' },
]

export type PlatformPreset = Preset & {
  category: 'platform'
  group: PlatformPresetGroup
  icon?: string
  platform?: PlatformPresetOptions
}

/** Legacy platform ids that map onto the consolidated link-preview canvas. */
export const PLATFORM_PRESET_ALIASES: Record<string, string> = {
  'linkedin-share': 'og-image',
  'reddit-post': 'og-image',
}

export function resolvePlatformPresetId(presetId: string): string {
  return PLATFORM_PRESET_ALIASES[presetId] ?? presetId
}

export interface PlatformWorkflowVariant {
  id: string
  label: string
  filenamePattern: string
  config: Partial<PipelineConfig>
}

export interface PlatformWorkflow {
  id: string
  name: string
  description: string
  /** Built-in preset id used for studio preview / apply. */
  previewPresetId: string
  /** Variant shown in the studio preview after Export. */
  previewVariantId?: string
  variants: PlatformWorkflowVariant[]
}

export const PLATFORM_BUILT_IN_PRESETS: PlatformPreset[] = [
  {
    id: 'og-image',
    category: 'platform',
    group: 'link',
    name: 'Link preview',
    description: '1200×630 · Facebook, Slack, Discord, LinkedIn, Reddit',
    platform: { suggestedCropAspect: '40:21', autoCrop: true },
    config: {
      outputFormat: 'jpeg',
      filenamePattern: '{name}-og.{ext}',
      metadataMode: 'strip',
      resize: platformExactResize(1200, 630),
      crop: cropHint('40:21'),
    },
  },
  {
    id: 'x-card',
    category: 'platform',
    group: 'link',
    name: 'X card',
    description: '1200×600 · summary large image (2:1)',
    platform: { suggestedCropAspect: '2:1', autoCrop: true },
    config: {
      outputFormat: 'jpeg',
      filenamePattern: '{name}-x-card.{ext}',
      metadataMode: 'strip',
      resize: platformExactResize(1200, 600),
      crop: cropHint('2:1'),
    },
  },
  {
    id: 'youtube-thumbnail',
    category: 'platform',
    group: 'video',
    name: 'YouTube thumbnail',
    description: '1280×720 · video thumbnail',
    platform: { suggestedCropAspect: '16:9', autoCrop: true },
    config: {
      outputFormat: 'jpeg',
      filenamePattern: '{name}-youtube.{ext}',
      metadataMode: 'strip',
      resize: platformExactResize(1280, 720),
      crop: cropHint('16:9'),
    },
  },
  {
    id: 'instagram-square',
    category: 'platform',
    group: 'instagram',
    name: 'Instagram feed',
    description: '1080×1080 · square posts',
    platform: { suggestedCropAspect: '1:1', autoCrop: true },
    config: {
      outputFormat: 'jpeg',
      filenamePattern: '{name}-instagram-square.{ext}',
      metadataMode: 'strip',
      resize: platformExactResize(1080, 1080),
      crop: cropHint('1:1'),
    },
  },
  {
    id: 'instagram-portrait',
    category: 'platform',
    group: 'instagram',
    name: 'Instagram portrait',
    description: '1080×1350 · 4:5 feed posts',
    platform: { suggestedCropAspect: '4:5', autoCrop: true },
    config: {
      outputFormat: 'jpeg',
      filenamePattern: '{name}-instagram-portrait.{ext}',
      metadataMode: 'strip',
      resize: platformExactResize(1080, 1350),
      crop: cropHint('4:5'),
    },
  },
  {
    id: 'instagram-story',
    category: 'platform',
    group: 'instagram',
    name: 'Instagram story / Reels',
    description: '1080×1920 · stories and Reels cover',
    platform: { suggestedCropAspect: '9:16', autoCrop: true },
    config: {
      outputFormat: 'jpeg',
      filenamePattern: '{name}-instagram-story.{ext}',
      metadataMode: 'strip',
      resize: platformExactResize(1080, 1920),
      crop: cropHint('9:16'),
    },
  },
  {
    id: 'instagram-landscape',
    category: 'platform',
    group: 'instagram',
    name: 'Instagram landscape',
    description: '1080×566 · wide feed posts',
    platform: { suggestedCropAspect: '40:21', autoCrop: true },
    config: {
      outputFormat: 'jpeg',
      filenamePattern: '{name}-instagram-landscape.{ext}',
      metadataMode: 'strip',
      resize: platformExactResize(1080, 566),
      crop: cropHint('40:21'),
    },
  },
  {
    id: 'favicon-kit',
    category: 'platform',
    group: 'site',
    name: 'Favicon kit',
    description: '16 / 32 / 180 / 512 PNG + favicon.ico (16+32+48) in one zip',
    config: {
      outputFormat: 'png',
      filenamePattern: '{name}-favicon-{width}.{ext}',
      metadataMode: 'strip',
      resize: platformExactResize(512, 512),
      crop: cropHint('1:1'),
    },
  },
  {
    id: 'app-store-kit',
    category: 'platform',
    group: 'store',
    name: 'App Store screenshots',
    description: 'iPhone 6.9" 1320×2868 + iPad 13" 2064×2752 · portrait JPEG zip',
    platform: { suggestedCropAspect: '6:13', autoCrop: true },
    config: {
      outputFormat: 'jpeg',
      filenamePattern: '{name}-app-store-iphone.{ext}',
      metadataMode: 'strip',
      resize: platformExactResize(1320, 2868),
      crop: cropHint('6:13'),
    },
  },
  {
    id: 'newsletter-kit',
    category: 'platform',
    group: 'email',
    name: 'Newsletter',
    description: '600px wide + 1200px (2×) JPEG zip · height follows the photo',
    config: {
      outputFormat: 'jpeg',
      filenamePattern: '{name}-email-{width}.{ext}',
      metadataMode: 'strip',
      resize: platformMaxWidth(600),
    },
  },
]

const faviconVariant = (size: number): Partial<PipelineConfig> => ({
  outputFormat: 'png',
  metadataMode: 'strip',
  resize: platformExactResize(size, size),
  crop: cropHint('1:1'),
})

export const PLATFORM_WORKFLOWS: PlatformWorkflow[] = [
  {
    id: 'favicon-kit',
    name: 'Favicon kit',
    description: 'PNG sizes 16–512, apple-touch, and multi-size favicon.ico',
    previewPresetId: 'favicon-kit',
    previewVariantId: 'favicon-512',
    variants: [
      {
        id: 'favicon-16',
        label: '16×16',
        filenamePattern: '{name}-favicon-{width}.{ext}',
        config: faviconVariant(16),
      },
      {
        id: 'favicon-32',
        label: '32×32',
        filenamePattern: '{name}-favicon-{width}.{ext}',
        config: faviconVariant(32),
      },
      {
        id: 'apple-touch',
        label: '180×180 (Apple touch)',
        filenamePattern: '{name}-apple-touch-icon.{ext}',
        config: faviconVariant(180),
      },
      {
        id: 'favicon-512',
        label: '512×512 (PWA)',
        filenamePattern: '{name}-favicon-{width}.{ext}',
        config: faviconVariant(512),
      },
    ],
  },
  {
    id: 'app-store-kit',
    name: 'App Store screenshots',
    description: 'Portrait iPhone 6.9" and iPad 13" JPEGs — the sizes App Store Connect requires',
    previewPresetId: 'app-store-kit',
    previewVariantId: 'app-store-iphone',
    variants: [
      {
        id: 'app-store-iphone',
        label: 'iPhone 6.9" (1320×2868)',
        filenamePattern: '{name}-app-store-iphone.{ext}',
        config: {
          outputFormat: 'jpeg',
          metadataMode: 'strip',
          resize: platformExactResize(1320, 2868),
          crop: cropHint('6:13'),
        },
      },
      {
        id: 'app-store-ipad',
        label: 'iPad 13" (2064×2752)',
        filenamePattern: '{name}-app-store-ipad.{ext}',
        config: {
          outputFormat: 'jpeg',
          metadataMode: 'strip',
          resize: platformExactResize(2064, 2752),
          crop: cropHint('3:4'),
        },
      },
    ],
  },
  {
    id: 'newsletter-kit',
    name: 'Newsletter',
    description: '600px-wide JPEG plus a 1200px 2× sibling for retina mail clients',
    previewPresetId: 'newsletter-kit',
    previewVariantId: 'newsletter-600',
    variants: [
      {
        id: 'newsletter-600',
        label: '600px wide',
        filenamePattern: '{name}-email-{width}.{ext}',
        config: {
          outputFormat: 'jpeg',
          metadataMode: 'strip',
          resize: platformMaxWidth(600),
        },
      },
      {
        id: 'newsletter-1200',
        label: '1200px wide (2×)',
        filenamePattern: '{name}-email-{width}.{ext}',
        config: {
          outputFormat: 'jpeg',
          metadataMode: 'strip',
          resize: platformMaxWidth(1200),
        },
      },
    ],
  },
]

export function getPlatformWorkflow(id: string): PlatformWorkflow | undefined {
  return PLATFORM_WORKFLOWS.find((workflow) => workflow.id === id)
}

export function isPlatformWorkflowPresetId(presetId: string): boolean {
  return PLATFORM_WORKFLOWS.some((workflow) => workflow.previewPresetId === presetId)
}

/** Preset id is a workflow preview (e.g. favicon kit) — use Export in toolbar, not Process/Download. */
export function getActivePlatformWorkflow(activePresetId: string): PlatformWorkflow | undefined {
  return PLATFORM_WORKFLOWS.find((workflow) => workflow.previewPresetId === activePresetId)
}

export function getPlatformPreset(id: string): PlatformPreset | undefined {
  return PLATFORM_BUILT_IN_PRESETS.find(
    (preset) => preset.id === resolvePlatformPresetId(id),
  )
}
