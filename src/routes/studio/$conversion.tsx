import { StudioPage } from '@/components/studio/studio-page'
import { buildSeoHead } from '@/lib/seo'
import {
  buildStudioJsonLd,
  buildStudioSeoContent,
  parseConversionSlug,
} from '@/lib/studio-seo'
import { createFileRoute, notFound } from '@tanstack/react-router'

export const Route = createFileRoute('/studio/$conversion')({
  beforeLoad: ({ params }) => {
    if (!parseConversionSlug(params.conversion)) {
      throw notFound()
    }
  },
  head: ({ params }) => {
    const search = parseConversionSlug(params.conversion)
    if (!search) {
      return buildSeoHead({
        title: 'Studio | Asset Melt',
        description: 'Compress and convert images in your browser.',
        path: '/studio',
        noindex: true,
      })
    }
    const content = buildStudioSeoContent(search)
    return buildSeoHead({
      title: content.title,
      description: content.description,
      path: content.canonicalPath as `/${string}`,
      llmDiscovery: true,
      jsonLd: buildStudioJsonLd(content),
    })
  },
  component: function StudioConversion() {
    const { conversion } = Route.useParams()
    const search = parseConversionSlug(conversion) ?? {}
    return <StudioPage search={search} />
  },
})
