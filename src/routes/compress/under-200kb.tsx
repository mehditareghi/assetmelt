import { ToolLandingPage } from '@/components/tools/tool-landing-page'
import { buildToolPageHead, getToolPage } from '@/lib/tool-pages'
import { createFileRoute } from '@tanstack/react-router'

const content = getToolPage('compress-under-200kb')

export const Route = createFileRoute('/compress/under-200kb')({
  head: () => buildToolPageHead(content),
  component: CompressUnder200kbPage,
})

function CompressUnder200kbPage() {
  return <ToolLandingPage content={content} />
}
