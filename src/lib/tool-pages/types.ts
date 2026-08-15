export type ToolPageId =
  | 'squoosh-alternative'
  | 'heic-to-jpg'
  | 'batch-image-compressor'
  | 'avif-compressor'
  | 'privacy-first-image-compression'
  | 'compress-under-50kb'
  | 'compress-under-100kb'
  | 'compress-under-200kb'

export type ToolPagePath =
  | '/squoosh-alternative'
  | '/convert/heic-to-jpg'
  | '/tools/batch-image-compressor'
  | '/compress/avif'
  | '/privacy-first-image-compression'
  | '/compress/under-50kb'
  | '/compress/under-100kb'
  | '/compress/under-200kb'

export type ToolPageIcon =
  | 'shield'
  | 'zap'
  | 'layers'
  | 'target'
  | 'smartphone'
  | 'lock'
  | 'refresh'
  | 'folder'
  | 'gauge'
  | 'image'
  | 'sparkles'
  | 'check'
  | 'globe'

export interface ToolPageFaq {
  question: string
  answer: string
}

export interface ToolPageStep {
  title: string
  description: string
}

export interface ToolPageBenefit {
  icon: ToolPageIcon
  title: string
  description: string
}

export interface ToolPageContentSection {
  heading: string
  paragraphs: string[]
}

export interface ToolPageComparisonRow {
  feature: string
  assetMelt: string
  competitor: string
}

export interface ToolPageContent {
  id: ToolPageId
  path: ToolPagePath
  title: string
  metaDescription: string
  eyebrow: string
  heroBadge: string
  h1: string
  h1Accent?: string
  heroDescription: string
  benefits: ToolPageBenefit[]
  steps: ToolPageStep[]
  contentSections: ToolPageContentSection[]
  faq: ToolPageFaq[]
  relatedTools: ToolPageId[]
  comparison?: {
    competitorName: string
    rows: ToolPageComparisonRow[]
  }
  ctaLabel?: string
  /** Deep-link Studio with format intent (`?from=` / `?to=`) and/or a size budget (`?budget=100kb`). */
  studioSearch?: {
    from?: string
    to?: string
    budget?: string
  }
  keywords: string
  breadcrumbLabel: string
}
