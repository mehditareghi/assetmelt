import type { LucideIcon } from 'lucide-react'
import {
  Check,
  Folder,
  Gauge,
  Globe,
  Image,
  Layers,
  Lock,
  RefreshCw,
  Shield,
  Smartphone,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react'
import type { ToolPageIcon } from '@/lib/tool-pages/types'

export const TOOL_PAGE_ICONS: Record<ToolPageIcon, LucideIcon> = {
  shield: Shield,
  zap: Zap,
  layers: Layers,
  target: Target,
  smartphone: Smartphone,
  lock: Lock,
  refresh: RefreshCw,
  folder: Folder,
  gauge: Gauge,
  image: Image,
  sparkles: Sparkles,
  check: Check,
  globe: Globe,
}
