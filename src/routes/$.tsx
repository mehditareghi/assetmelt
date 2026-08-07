import { createFileRoute } from '@tanstack/react-router'
import { NotFoundPage } from '@/components/not-found-page'
import { buildSeoHead } from '@/lib/seo'

export const Route = createFileRoute('/$')({
  head: () =>
    buildSeoHead({
      title: '404 — Page Not Found | Asset Melt',
      description: 'The page you are looking for does not exist.',
      path: '/404',
      noindex: true,
    }),
  component: NotFoundPage,
  notFoundComponent: NotFoundPage,
})
