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
  validateSearch: (search: Record<string, unknown>): { recipe?: string; budget?: string } => {
    const parsed = parseStudioSearch(search)
    const next: { recipe?: string; budget?: string } = {}
    if (parsed.recipe) next.recipe = parsed.recipe
    if (parsed.budget) next.budget = parsed.budget
    return next
  },
  beforeLoad: ({ params }) => {
    if (!parseConversionSlug(params.conversion)) {
      throw notFound()
    }
  },
  head: ({ params, match }) => {
    const recipe = match.search.recipe
    const budget = match.search.budget
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
      llmDiscovery: !recipe && !budget,
      jsonLd: buildStudioJsonLd(content),
      noindex: Boolean(recipe || budget),
    })
  },
  component: function StudioConversion() {
    const { conversion } = Route.useParams()
    const query = Route.useSearch()
    const parsed = parseConversionSlug(conversion) ?? {}
    return <StudioPage search={{ ...parsed, ...query }} />
  },
})
