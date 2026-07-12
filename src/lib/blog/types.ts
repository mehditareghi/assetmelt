import type { ToolPageId } from '@/lib/tool-pages/types'

export type BlogClusterId = 'image-compression' | 'format-conversion' | 'performance-seo'

export interface BlogCluster {
  id: BlogClusterId
  title: string
  description: string
  path: `/blog/${BlogClusterId}`
  pillarSlug: string
}

export interface BlogPostFaq {
  question: string
  answer: string
}

export interface BlogPostMeta {
  slug: string
  path: `/blog/${string}`
  legacyPath: `/blog/${string}`
  title: string
  description: string
  excerpt: string
  publishedAt: string
  updatedAt?: string
  keywords: string
  cluster: BlogClusterId | null
  heroImage: string
  heroImageAlt: string
  heroAvif: string | null
  heroWebp: string | null
  heroJpeg: string | null
  readingTimeMinutes: number
  relatedTools: ToolPageId[]
  faq: BlogPostFaq[]
  sourceFile: string
}
