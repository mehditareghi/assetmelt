import { ToolLandingPage } from '@/components/tools/tool-landing-page'
import { buildToolPageHead, getToolPage } from '@/lib/tool-pages'
import { createFileRoute } from '@tanstack/react-router'

const content = getToolPage('privacy-first-image-compression')

export const Route = createFileRoute('/privacy-first-image-compression')({
  head: () => buildToolPageHead(content),
  component: PrivacyFirstCompressionPage,
})

function PrivacyFirstCompressionPage() {
  return <ToolLandingPage content={content} />
}
