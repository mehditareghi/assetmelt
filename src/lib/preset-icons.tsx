import type { LucideIcon } from 'lucide-react'
import {
  AppWindow,
  Briefcase,
  Code2,
  Globe,
  Image,
  LayoutGrid,
  MessageSquare,
  Minimize2,
  Play,
  RectangleHorizontal,
  RectangleVertical,
  Smartphone,
  Sparkles,
  Square,
  Zap,
} from 'lucide-react'
import type { Preset } from '@/lib/presets'
import type { PlatformPreset } from '@/lib/platform-presets'

export type PresetIconId =
  | 'og-image'
  | 'linkedin-share'
  | 'reddit-post'
  | 'youtube-thumbnail'
  | 'instagram-square'
  | 'instagram-portrait'
  | 'instagram-story'
  | 'instagram-landscape'
  | 'favicon-kit'
  | 'web-optimized'
  | 'dev-assets'
  | 'lossless-png'
  | 'thumbnail'
  | 'max-compress'
  | 'custom'
  | 'workflow-favicon'

const PRESET_ICON_MAP: Record<PresetIconId, LucideIcon> = {
  'og-image': Globe,
  'linkedin-share': Briefcase,
  'reddit-post': MessageSquare,
  'youtube-thumbnail': Play,
  'instagram-square': Square,
  'instagram-portrait': RectangleVertical,
  'instagram-story': Smartphone,
  'instagram-landscape': RectangleHorizontal,
  'favicon-kit': AppWindow,
  'web-optimized': Zap,
  'dev-assets': Code2,
  'lossless-png': Image,
  thumbnail: LayoutGrid,
  'max-compress': Minimize2,
  custom: Sparkles,
  'workflow-favicon': AppWindow,
}

export function getPresetIcon(id: string): LucideIcon {
  if (id in PRESET_ICON_MAP) {
    return PRESET_ICON_MAP[id as PresetIconId]
  }
  if (id.startsWith('custom-')) return PRESET_ICON_MAP.custom
  return Sparkles
}

export function getPresetDimensionsLabel(preset: Preset): string | null {
  const resize = preset.config.resize
  if (!resize?.enabled) return null
  if (resize.mode === 'exact') {
    return `${resize.width}×${resize.height}`
  }
  if (resize.mode === 'maxSide') {
    return `≤${resize.width}px`
  }
  if (resize.mode === 'percentage') {
    return `${resize.percentage}%`
  }
  return null
}

export function getPlatformPresetIcon(preset: PlatformPreset): LucideIcon {
  const iconId = preset.icon ?? preset.id
  return getPresetIcon(iconId)
}

export function getGeneralPresetIcon(preset: Preset): LucideIcon {
  return getPresetIcon(preset.id)
}
