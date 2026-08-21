export interface StudioFaqItem {
  question: string
  answer: string
}

export interface StudioSeoStep {
  title: string
  description: string
}

export interface StudioSeoSection {
  heading: string
  paragraphs: string[]
}

export interface StudioSeoTable {
  caption: string
  headers: string[]
  rows: string[][]
}

export type StudioSeoSampleScene = 'photo' | 'graphic' | 'icon' | 'scan' | 'screenshot'

export interface StudioSeoBeforeAfter {
  heading: string
  /** Short scenario shown under the sample (always in HTML). */
  scenario: string
  caption: string
  scene: StudioSeoSampleScene
  before: {
    format: string
    size: string
    note: string
  }
  after: {
    format: string
    size: string
    note: string
  }
  savings: string
}

export interface StudioSeoContent {
  mode: import('@/lib/studio-seo/search').StudioSeoMode
  title: string
  description: string
  h2: string
  paragraphs: string[]
  steps: StudioSeoStep[]
  beforeAfter: StudioSeoBeforeAfter
  tables: StudioSeoTable[]
  sections: StudioSeoSection[]
  faq: StudioFaqItem[]
  keywords: string
  /** Canonical path including query string when indexable. */
  canonicalPath: string
  /** Whether this URL should be indexed (sitemap + robots index). */
  indexable: boolean
  related: Array<{ label: string; path: string }>
  dropHint: string | null
}

/** Unique long-form fields that make each conversion page distinct. */
export interface PairGuide {
  /** Extra sentences after the shared opener — must mention the primary phrase. */
  hook: string
  why: string[]
  howItWorks: string[]
  whenToUse: string[]
  qualityNote: string
  settingsTips: string[]
  comparisonRows: [feature: string, fromValue: string, toValue: string][]
  typicalRows: [source: string, before: string, after: string, note: string][]
  beforeAfter: Omit<StudioSeoBeforeAfter, 'heading' | 'scene'> & {
    scene?: StudioSeoSampleScene
  }
  extraFaq: StudioFaqItem[]
}

export interface TargetGuide {
  hook: string
  why: string[]
  howItWorks: string[]
  whenToUse: string[]
  qualityNote: string
  settingsTips: string[]
  comparisonRows: [feature: string, value: string, note: string][]
  typicalRows: [source: string, before: string, after: string, note: string][]
  beforeAfter: Omit<StudioSeoBeforeAfter, 'heading' | 'scene'> & {
    scene?: StudioSeoSampleScene
  }
  extraFaq: StudioFaqItem[]
}
