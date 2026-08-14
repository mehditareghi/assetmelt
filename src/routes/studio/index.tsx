import { StudioPage } from '@/components/studio/studio-page'
import { buildSeoHead } from '@/lib/seo'
import {
  buildStudioJsonLd,
  buildStudioPath,
  buildStudioSeoContent,
  parseStudioSearch,
  type StudioSearch,
} from '@/lib/studio-seo'
import { studioRecipeSearch } from '@/lib/studio-recipe'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/studio/')({
  validateSearch: (search: Record<string, unknown>): StudioSearch =>
    parseStudioSearch(search),
  beforeLoad: ({ search }) => {
    // Legacy query URLs → canonical path pages (unique prerendered HTML).
    if (!search.from && !search.to) return

    const path = buildStudioPath(search)
    const recipeSearch = studioRecipeSearch(search.recipe)
    if (path === '/studio') {
      throw redirect({ to: '/studio', search: recipeSearch, replace: true })
    }

    throw redirect({
      to: '/studio/$conversion',
      params: { conversion: path.replace(/^\/studio\//, '') },
      search: recipeSearch,
      replace: true,
    })
  },
  head: ({ match }) => {
    const recipe = match.search.recipe
    const content = buildStudioSeoContent({})
    return buildSeoHead({
      title: content.title,
      description: content.description,
      path: '/studio',
      llmDiscovery: !recipe,
      jsonLd: buildStudioJsonLd(content),
      noindex: Boolean(recipe),
    })
  },
  component: function StudioIndex() {
    const search = Route.useSearch()
    return <StudioPage search={search} />
  },
})
