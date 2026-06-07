import { ToolLandingPage } from '@/components/tools/tool-landing-page'
import { buildToolPageHead, getToolPage } from '@/lib/tool-pages'
import { createFileRoute } from '@tanstack/react-router'

const content = getToolPage('squoosh-alternative')

export const Route = createFileRoute('/squoosh-alternative')({
  head: () => buildToolPageHead(content),
  component: SquooshAlternativePage,
})

function SquooshAlternativePage() {
  return <ToolLandingPage content={content} />
}
