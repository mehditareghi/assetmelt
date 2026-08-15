import { ToolLandingPage } from '@/components/tools/tool-landing-page'
import { buildToolPageHead, getToolPage } from '@/lib/tool-pages'
import { createFileRoute } from '@tanstack/react-router'

const content = getToolPage('compress-under-100kb')

export const Route = createFileRoute('/compress/under-100kb')({
  head: () => buildToolPageHead(content),
  component: CompressUnder100kbPage,
})

function CompressUnder100kbPage() {
  return <ToolLandingPage content={content} />
}
