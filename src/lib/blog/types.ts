import type { ToolPageId } from '@/lib/tool-pages/types'

export interface BlogPostFaq {
  question: string
  answer: string
}

export interface BlogPostMeta {
  slug: string
  path: `/blog/${string}`
  title: string
  description: string
  excerpt: string
  publishedAt: string
  updatedAt?: string
  keywords: string
  heroImage: string
  heroImageAlt: string
  heroAvif: string | null
  heroWebp: string | null
  readingTimeMinutes: number
  relatedTools: ToolPageId[]
  faq: BlogPostFaq[]
  sourceFile: string
}
