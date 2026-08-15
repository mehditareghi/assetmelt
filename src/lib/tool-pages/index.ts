export type {
  ToolPageBenefit,
  ToolPageComparisonRow,
  ToolPageContent,
  ToolPageContentSection,
  ToolPageFaq,
  ToolPageIcon,
  ToolPageId,
  ToolPageStep,
} from '@/lib/tool-pages/types'

export {
  TOOL_PAGES,
  TOOL_PAGE_LIST,
  getRelatedToolPages,
  getToolPage,
  getToolPageByPath,
} from '@/lib/tool-pages/content'

export { buildToolPageHead, buildToolPageJsonLd } from '@/lib/tool-pages/seo'
