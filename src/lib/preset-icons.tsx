import type { LucideIcon } from 'lucide-react'
import {
  AppWindow,
  Briefcase,
  Code2,
  Globe,
  Image,
  LayoutGrid,
  Mail,
  MessageSquare,
  Minimize2,
  Play,
  RectangleHorizontal,
  RectangleVertical,
  Share2,
  Smartphone,
  Sparkles,
  Square,
  TabletSmartphone,
  Zap,
} from 'lucide-react'
import type { Preset } from '@/lib/presets'
import type { PlatformPreset } from '@/lib/platform-presets'

export type PresetIconId =
  | 'og-image'
  | 'x-card'
  | 'linkedin-share'
  | 'reddit-post'
  | 'youtube-thumbnail'
  | 'instagram-square'
  | 'instagram-portrait'
  | 'instagram-story'
  | 'instagram-landscape'
  | 'favicon-kit'
  | 'app-store-kit'
  | 'newsletter-kit'
  | 'web-optimized'
  | 'dev-assets'
  | 'lossless-png'
  | 'thumbnail'
  | 'max-compress'
  | 'custom'
  | 'workflow-favicon'

const PRESET_ICON_MAP: Record<PresetIconId, LucideIcon> = {
  'og-image': Globe,
  'x-card': Share2,
  'linkedin-share': Briefcase,
  'reddit-post': MessageSquare,
  'youtube-thumbnail': Play,
  'instagram-square': Square,
  'instagram-portrait': RectangleVertical,
  'instagram-story': Smartphone,
  'instagram-landscape': RectangleHorizontal,
  'favicon-kit': AppWindow,
  'app-store-kit': TabletSmartphone,
  'newsletter-kit': Mail,
  'web-optimized': Zap,
  'dev-assets': Code2,
  'lossless-png': Image,
  thumbnail: LayoutGrid,
  'max-compress': Minimize2,
  custom: Sparkles,
  'workflow-favicon': AppWindow,
}

export function getPresetIcon(id: string): LucideIcon {
  const resolved = id === 'linkedin-share' || id === 'reddit-post' ? 'og-image' : id
  if (resolved in PRESET_ICON_MAP) {
    return PRESET_ICON_MAP[resolved as PresetIconId]
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
  if (resize.mode === 'maxWidth') {
    return `≤${resize.width}w`
  }
  if (resize.mode === 'maxHeight') {
    return `≤${resize.height}h`
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
