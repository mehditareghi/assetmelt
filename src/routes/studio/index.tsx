import { StudioPage } from '@/components/studio/studio-page'
import { buildSeoHead } from '@/lib/seo'
import {
  buildStudioJsonLd,
  buildStudioPath,
  buildStudioSeoContent,
  parseStudioSearch,
  type StudioSearch,
} from '@/lib/studio-seo'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/studio/')({
  validateSearch: (search: Record<string, unknown>): StudioSearch =>
    parseStudioSearch(search),
  beforeLoad: ({ search }) => {
    // Legacy query URLs → canonical path pages (unique prerendered HTML).
    if (!search.from && !search.to) return

    const path = buildStudioPath(search)
    if (path === '/studio') {
      throw redirect({ to: '/studio', search: {}, replace: true })
    }

    throw redirect({
      to: '/studio/$conversion',
      params: { conversion: path.replace(/^\/studio\//, '') },
      replace: true,
    })
  },
  head: () => {
    const content = buildStudioSeoContent({})
    return buildSeoHead({
      title: content.title,
      description: content.description,
      path: '/studio',
      llmDiscovery: true,
      jsonLd: buildStudioJsonLd(content),
    })
  },
  component: function StudioIndex() {
    return <StudioPage search={{}} />
  },
})
