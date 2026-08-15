import { ToolLandingPage } from '@/components/tools/tool-landing-page'
import { buildToolPageHead, getToolPage } from '@/lib/tool-pages'
import { createFileRoute } from '@tanstack/react-router'

const content = getToolPage('compress-under-50kb')

export const Route = createFileRoute('/compress/under-50kb')({
  head: () => buildToolPageHead(content),
  component: CompressUnder50kbPage,
})

function CompressUnder50kbPage() {
  return <ToolLandingPage content={content} />
}
