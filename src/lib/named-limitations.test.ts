import { describe, expect, it } from 'vitest'
import {
  OPEN_LIMITATIONS,
  SIZE_BUDGET_SKIPS_QOI_COPY,
  TIFF_FIRST_PAGE_COPY,
  sizeBudgetInputLimitsCopy,
} from '@/lib/named-limitations'
import { SIZE_BUDGET_TOOL_PAGES } from '@/lib/tool-pages/size-budget-pages'

describe('open limitation copy (drop the key when the catalog ID ships)', () => {
  it('keeps 4.3 / 4.4 named until those IDs ship', () => {
    expect(OPEN_LIMITATIONS['4.3'].copy).toMatch(/quality 0\.92/)
    expect(OPEN_LIMITATIONS['4.4'].copy).toMatch(/first frame/)
    expect(TIFF_FIRST_PAGE_COPY).toMatch(/first page/)
    expect(SIZE_BUDGET_SKIPS_QOI_COPY).toMatch(/QOI/)
  })

  it('puts input limits on every size-budget landing page', () => {
    const input = sizeBudgetInputLimitsCopy()
    for (const page of Object.values(SIZE_BUDGET_TOOL_PAGES)) {
      const body = [
        ...page.contentSections.flatMap((section) => section.paragraphs),
        ...page.faq.map((item) => item.answer),
        ...page.steps.map((step) => step.description),
      ].join('\n')
      expect(body).toContain(OPEN_LIMITATIONS['4.3'].copy)
      expect(body).toContain(OPEN_LIMITATIONS['4.4'].copy)
      expect(body).toContain(TIFF_FIRST_PAGE_COPY)
      expect(body).toContain(SIZE_BUDGET_SKIPS_QOI_COPY)
      expect(page.faq.some((item) => item.question === 'Does size budget work with PNG?')).toBe(
        true,
      )
      expect(input).toMatch(/first frame/)
    }
  })
})
