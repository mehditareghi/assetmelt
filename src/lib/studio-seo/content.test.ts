import { describe, expect, it } from 'vitest'
import { OPEN_LIMITATIONS, TIFF_FIRST_PAGE_COPY } from '@/lib/named-limitations'
import { buildStudioJsonLd, buildStudioSeoContent } from '@/lib/studio-seo/content'
import {
  countPhrase,
  flattenStudioSeoText,
  pairKeyword,
  pairPhrase,
  targetKeyword,
} from '@/lib/studio-seo/copy'
import { INDEXABLE_FORMAT_PAIRS, INDEXABLE_OUTPUT_TARGETS } from '@/lib/studio-seo/pairs'
import { getPairGuide } from '@/lib/studio-seo/pair-guides'
import { TARGET_GUIDES } from '@/lib/studio-seo/target-guides'
import { studioSearchFromPair } from '@/lib/studio-seo/search'
import { OUTPUT_URL_SLUG } from '@/lib/studio-seo/formats'

describe('studio SEO long-form content', () => {
  it('ships a unique guide for every indexable pair', () => {
    const hooks = new Set<string>()
    const firstWhy = new Set<string>()
    const extraQuestions = new Set<string>()

    const shortAnswers: string[] = []
    for (const pair of INDEXABLE_FORMAT_PAIRS) {
      const guide = getPairGuide(pair.from, pair.to)
      expect(guide, `${pair.from}->${pair.to} guide`).toBeDefined()
      if (!guide) continue
      expect(guide.why.length).toBeGreaterThanOrEqual(2)
      expect(guide.howItWorks.length).toBeGreaterThanOrEqual(2)
      expect(guide.whenToUse.length).toBeGreaterThanOrEqual(2)
      expect(guide.extraFaq.length).toBeGreaterThanOrEqual(3)
      expect(guide.comparisonRows.length).toBeGreaterThanOrEqual(4)
      expect(guide.typicalRows.length).toBeGreaterThanOrEqual(3)
      expect(hooks.has(guide.hook)).toBe(false)
      hooks.add(guide.hook)
      expect(firstWhy.has(guide.why[0]!)).toBe(false)
      firstWhy.add(guide.why[0]!)
      for (const item of guide.extraFaq) {
        expect(extraQuestions.has(item.question)).toBe(false)
        extraQuestions.add(item.question)
        if (item.answer.length < 80) {
          shortAnswers.push(`${pair.from}->${pair.to} (${item.answer.length}) ${item.question}`)
        }
      }
    }
    expect(shortAnswers, shortAnswers.join('\n')).toEqual([])
  })

  it('repeats the primary conversion phrase at least 10 times on every pair page', () => {
    for (const pair of INDEXABLE_FORMAT_PAIRS) {
      const content = buildStudioSeoContent(studioSearchFromPair(pair))
      const text = flattenStudioSeoText(content)
      const labeled = pairPhrase(pair.from, pair.to)
      const slugged = pairKeyword(pair.from, pair.to)
      const labeledCount = countPhrase(text, labeled)
      const sluggedCount = countPhrase(text, slugged)
      const combined = labeled.toLowerCase() === slugged.toLowerCase()
        ? labeledCount
        : labeledCount + sluggedCount
      expect(
        combined,
        `${slugged} / ${labeled} count on ${pair.from}->${pair.to}`,
      ).toBeGreaterThanOrEqual(10)
      expect(content.faq.length).toBeGreaterThanOrEqual(8)
      expect(content.tables.length).toBe(2)
      expect(content.sections.length).toBeGreaterThanOrEqual(4)
      expect(content.steps.length).toBe(3)
      expect(content.beforeAfter.caption.length).toBeGreaterThan(40)
    }
  })

  it('names GIF / TIFF / HEIC limits on those pair pages', () => {
    for (const pair of INDEXABLE_FORMAT_PAIRS) {
      const text = flattenStudioSeoText(buildStudioSeoContent(studioSearchFromPair(pair)))
      if (pair.from === 'gif') {
        expect(text).toContain(OPEN_LIMITATIONS['4.4'].copy)
      }
      if (pair.from === 'tiff') {
        expect(text).toContain(TIFF_FIRST_PAGE_COPY)
      }
      if (pair.from === 'heic') {
        expect(text).toContain(OPEN_LIMITATIONS['4.3'].copy)
      }
    }
  })

  it('enriches every convert-to-* page with tables, sample, and keyword coverage', () => {
    for (const to of INDEXABLE_OUTPUT_TARGETS) {
      const content = buildStudioSeoContent({ to: OUTPUT_URL_SLUG[to] })
      const text = flattenStudioSeoText(content)
      const keyword = targetKeyword(to)
      expect(countPhrase(text, keyword)).toBeGreaterThanOrEqual(10)
      expect(TARGET_GUIDES[to]).toBeDefined()
      expect(content.tables.length).toBe(2)
      expect(content.faq.length).toBeGreaterThanOrEqual(8)
      expect(content.beforeAfter.after.format.length).toBeGreaterThan(0)
    }
  })

  it('enriches the default studio page like a compressor landing', () => {
    const content = buildStudioSeoContent({})
    const text = flattenStudioSeoText(content)
    expect(content.tables.length).toBe(2)
    expect(content.sections.length).toBeGreaterThanOrEqual(3)
    expect(content.faq.length).toBeGreaterThanOrEqual(12)
    expect(text.toLowerCase()).toMatch(/image compressor/)
    expect(text.toLowerCase()).toMatch(/client-side|browser/)
    expect(text).toContain(OPEN_LIMITATIONS['4.4'].copy)
    expect(text).toContain(TIFF_FIRST_PAGE_COPY)
    expect(text).toContain(OPEN_LIMITATIONS['4.3'].copy)
    expect(content.beforeAfter.caption.toLowerCase()).not.toMatch(/tinyjpg|tinypng/)
  })

  it('keeps FAQ + HowTo JSON-LD in the graph', () => {
    const content = buildStudioSeoContent({ from: 'gif', to: 'png' })
    const jsonLd = buildStudioJsonLd(content) as {
      '@graph': Array<{ '@type': string; mainEntity?: unknown[]; step?: unknown[] }>
    }
    const types = jsonLd['@graph'].map((node) => node['@type'])
    expect(types).toContain('FAQPage')
    expect(types).toContain('HowTo')
    expect(types).toContain('BreadcrumbList')
    const faq = jsonLd['@graph'].find((node) => node['@type'] === 'FAQPage')
    expect(faq?.mainEntity?.length).toBe(content.faq.length)
    const howTo = jsonLd['@graph'].find((node) => node['@type'] === 'HowTo')
    expect(howTo?.step?.length).toBe(3)
  })
})
