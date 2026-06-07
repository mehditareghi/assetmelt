import { ToolLandingPage } from '@/components/tools/tool-landing-page'
import { buildToolPageHead, getToolPage } from '@/lib/tool-pages'
import { createFileRoute } from '@tanstack/react-router'

const content = getToolPage('heic-to-jpg')

export const Route = createFileRoute('/convert/heic-to-jpg')({
  head: () => buildToolPageHead(content),
  component: HeicToJpgPage,
})

function HeicToJpgPage() {
  return <ToolLandingPage content={content} />
}
