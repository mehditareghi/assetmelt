import { StudioPage } from '@/components/studio/studio-page'
import { buildSeoHead } from '@/lib/seo'
import {
  buildStudioJsonLd,
  buildStudioSeoContent,
  parseConversionSlug,
  parseStudioSearch,
} from '@/lib/studio-seo'
import { createFileRoute, notFound } from '@tanstack/react-router'

export const Route = createFileRoute('/studio/$conversion')({
  validateSearch: (search: Record<string, unknown>): { recipe?: string } => {
    const recipe = parseStudioSearch(search).recipe
    return recipe ? { recipe } : {}
  },
  beforeLoad: ({ params }) => {
    if (!parseConversionSlug(params.conversion)) {
      throw notFound()
    }
  },
  head: ({ params, match }) => {
    const recipe = match.search.recipe
    const parsed = parseConversionSlug(params.conversion)
    if (!parsed) {
      return buildSeoHead({
        title: 'Studio | Asset Melt',
        description: 'Compress and convert images in your browser.',
        path: '/studio',
        noindex: true,
      })
    }
    const content = buildStudioSeoContent(parsed)
    return buildSeoHead({
      title: content.title,
      description: content.description,
      path: content.canonicalPath as `/${string}`,
      llmDiscovery: !recipe,
      jsonLd: buildStudioJsonLd(content),
      noindex: Boolean(recipe),
    })
  },
  component: function StudioConversion() {
    const { conversion } = Route.useParams()
    const query = Route.useSearch()
    const parsed = parseConversionSlug(conversion) ?? {}
    return <StudioPage search={{ ...parsed, ...query }} />
  },
})
