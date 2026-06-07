import { ToolLandingPage } from '@/components/tools/tool-landing-page'
import { buildToolPageHead, getToolPage } from '@/lib/tool-pages'
import { createFileRoute } from '@tanstack/react-router'

const content = getToolPage('avif-compressor')

export const Route = createFileRoute('/compress/avif')({
  head: () => buildToolPageHead(content),
  component: AvifCompressorPage,
})

function AvifCompressorPage() {
  return <ToolLandingPage content={content} />
}
