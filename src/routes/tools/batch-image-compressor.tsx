import { ToolLandingPage } from '@/components/tools/tool-landing-page'
import { buildToolPageHead, getToolPage } from '@/lib/tool-pages'
import { createFileRoute } from '@tanstack/react-router'

const content = getToolPage('batch-image-compressor')

export const Route = createFileRoute('/tools/batch-image-compressor')({
  head: () => buildToolPageHead(content),
  component: BatchImageCompressorPage,
})

function BatchImageCompressorPage() {
  return <ToolLandingPage content={content} />
}
