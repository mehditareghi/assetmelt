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

export interface PlatformPresetOptions {
  suggestedCropAspect?: CropAspectRatio
  /** When true, enables a centered crop for the aspect ratio after a file is loaded. */
  autoCrop?: boolean
}

export type PlatformPresetGroup = 'link' | 'instagram' | 'video' | 'site'

export const PLATFORM_PRESET_GROUPS: Array<{
  id: PlatformPresetGroup
  label: string
}> = [
  { id: 'link', label: 'Link previews' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'video', label: 'Video' },
  { id: 'site', label: 'Site assets' },
]

export type PlatformPreset = Preset & {
  category: 'platform'
  group: PlatformPresetGroup
  icon?: string
  platform?: PlatformPresetOptions
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
  variants: PlatformWorkflowVariant[]
}

export const PLATFORM_BUILT_IN_PRESETS: PlatformPreset[] = [
  {
    id: 'og-image',
    category: 'platform',
    group: 'link',
    name: 'Open Graph',
    description: '1200×630 JPEG — link previews (Facebook, Slack, Discord)',
    platform: { suggestedCropAspect: '40:21', autoCrop: true },
    config: {
      outputFormat: 'jpeg',
      filenamePattern: '{name}-og.{ext}',
      stripMetadata: true,
      resize: platformExactResize(1200, 630),
      crop: cropHint('40:21'),
    },
  },
  {
    id: 'linkedin-share',
    category: 'platform',
    group: 'link',
    name: 'LinkedIn share',
    description: '1200×627 JPEG — feed link image',
    platform: { suggestedCropAspect: '40:21', autoCrop: true },
    config: {
      outputFormat: 'jpeg',
      filenamePattern: '{name}-linkedin.{ext}',
      stripMetadata: true,
      resize: platformExactResize(1200, 627),
      crop: cropHint('40:21'),
    },
  },
  {
    id: 'reddit-post',
    category: 'platform',
    group: 'link',
    name: 'Reddit post',
    description: '1200×628 JPEG — image posts & link previews',
    platform: { suggestedCropAspect: '40:21', autoCrop: true },
    config: {
      outputFormat: 'jpeg',
      filenamePattern: '{name}-reddit.{ext}',
      stripMetadata: true,
      resize: platformExactResize(1200, 628),
      crop: cropHint('40:21'),
    },
  },
  {
    id: 'youtube-thumbnail',
    category: 'platform',
    group: 'video',
    name: 'YouTube thumbnail',
    description: '1280×720 JPEG — video thumbnail',
    platform: { suggestedCropAspect: '16:9', autoCrop: true },
    config: {
      outputFormat: 'jpeg',
      filenamePattern: '{name}-youtube.{ext}',
      stripMetadata: true,
      resize: platformExactResize(1280, 720),
      crop: cropHint('16:9'),
    },
  },
  {
    id: 'instagram-square',
    category: 'platform',
    group: 'instagram',
    name: 'Instagram feed (1:1)',
    description: '1080×1080 JPEG — square posts',
    platform: { suggestedCropAspect: '1:1', autoCrop: true },
    config: {
      outputFormat: 'jpeg',
      filenamePattern: '{name}-instagram-square.{ext}',
      stripMetadata: true,
      resize: platformExactResize(1080, 1080),
      crop: cropHint('1:1'),
    },
  },
  {
    id: 'instagram-portrait',
    category: 'platform',
    group: 'instagram',
    name: 'Instagram portrait (4:5)',
    description: '1080×1350 JPEG — portrait feed posts',
    platform: { suggestedCropAspect: '4:5', autoCrop: true },
    config: {
      outputFormat: 'jpeg',
      filenamePattern: '{name}-instagram-portrait.{ext}',
      stripMetadata: true,
      resize: platformExactResize(1080, 1350),
      crop: cropHint('4:5'),
    },
  },
  {
    id: 'instagram-story',
    category: 'platform',
    group: 'instagram',
    name: 'Instagram story / Reels',
    description: '1080×1920 JPEG — stories and Reels cover',
    platform: { suggestedCropAspect: '9:16', autoCrop: true },
    config: {
      outputFormat: 'jpeg',
      filenamePattern: '{name}-instagram-story.{ext}',
      stripMetadata: true,
      resize: platformExactResize(1080, 1920),
      crop: cropHint('9:16'),
    },
  },
  {
    id: 'instagram-landscape',
    category: 'platform',
    group: 'instagram',
    name: 'Instagram landscape',
    description: '1080×566 JPEG — wide feed posts (~1.91:1)',
    platform: { suggestedCropAspect: '40:21', autoCrop: true },
    config: {
      outputFormat: 'jpeg',
      filenamePattern: '{name}-instagram-landscape.{ext}',
      stripMetadata: true,
      resize: platformExactResize(1080, 566),
      crop: cropHint('40:21'),
    },
  },
  {
    id: 'favicon-kit',
    category: 'platform',
    group: 'site',
    name: 'Favicon kit',
    description: '512×512 PNG preview — export zip for 16/32/180/512',
    config: {
      outputFormat: 'png',
      filenamePattern: '{name}-favicon-512.{ext}',
      stripMetadata: true,
      resize: platformExactResize(512, 512),
      crop: cropHint('1:1'),
    },
  },
]

const faviconVariant = (size: number): Partial<PipelineConfig> => ({
  outputFormat: 'png',
  stripMetadata: true,
  resize: platformExactResize(size, size),
  crop: cropHint('1:1'),
})

export const PLATFORM_WORKFLOWS: PlatformWorkflow[] = [
  {
    id: 'favicon-kit',
    name: 'Favicon kit',
    description: '16, 32, 180, and 512 px PNG icons in one zip',
    previewPresetId: 'favicon-kit',
    variants: [
      {
        id: 'favicon-16',
        label: '16×16',
        filenamePattern: '{name}-favicon-16.{ext}',
        config: faviconVariant(16),
      },
      {
        id: 'favicon-32',
        label: '32×32',
        filenamePattern: '{name}-favicon-32.{ext}',
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
        filenamePattern: '{name}-favicon-512.{ext}',
        config: faviconVariant(512),
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
  return PLATFORM_BUILT_IN_PRESETS.find((preset) => preset.id === id)
}
