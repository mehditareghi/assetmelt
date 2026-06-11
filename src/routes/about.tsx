import { Link } from '@tanstack/react-router'
import { createFileRoute } from '@tanstack/react-router'
import { Cpu, Heart, Layers, Shield, Sparkles, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TrustCardGrid, TrustHighlight, TrustPageShell } from '@/components/trust/trust-page-shell'
import { buildTrustPageHead } from '@/lib/trust-pages/seo'
import { SITE_AUTHOR, SITE_NAME } from '@/lib/site'

export const Route = createFileRoute('/about')({
  head: () => buildTrustPageHead('/about'),
  component: AboutPage,
})

const PRINCIPLES = [
  {
    icon: Shield,
    title: 'Privacy by architecture',
    description:
      'Not a policy checkbox — the app has no upload endpoint. If images leave your machine, it is because you exported them.',
  },
  {
    icon: Zap,
    title: 'Squoosh-grade codecs',
    description:
      'MozJPEG, AVIF, WebP, Oxipng, JXL, and QOI via WebAssembly — the same family of engines that proved browser compression works.',
  },
  {
    icon: Layers,
    title: 'Built for real workflows',
    description:
      'Batch queues, size budgets, platform presets, and a full transform pipeline — not just one image at a time.',
  },
  {
    icon: Heart,
    title: 'Free forever',
    description:
      'No accounts, no subscriptions, no artificial limits. Optional crypto donations help keep the lights on.',
  },
] as const

function AboutPage() {
  return (
    <TrustPageShell
      eyebrow="About"
      icon={Sparkles}
      title="Built because I needed it"
      titleAccent="a compressor I could trust"
      description={`${SITE_NAME} started as a personal tool — a way to shrink and convert images without handing files to a cloud service. It grew into something I hope is useful for you too.`}
    >
      <h2>Why {SITE_NAME} exists</h2>
      <p>
        I compress and convert images constantly — for websites, side projects, and client work. Every
        time I reached for an online tool, the same friction appeared: upload my files, trust someone
        else&apos;s server, hope they delete them, and accept whatever limits the free tier imposed.
      </p>
      <p>
        I wanted something different: professional results, modern formats like AVIF and WebP, batch
        processing when a folder of exports lands on my desk — and the certainty that{' '}
        <strong className="text-foreground">nothing ever leaves my machine</strong>.
      </p>
      <p>
        Google&apos;s Squoosh had already shown that WASM codecs in the browser could match server
        quality. But Squoosh was built for one image at a time, and it is no longer actively
        maintained. {SITE_NAME} is my answer: the same codec DNA, with the workflow features I
        actually needed day to day.
      </p>

      <TrustHighlight title={`What ${SITE_NAME} is today`}>
        <p>
          A free, browser-based image studio at{' '}
          <Link to="/studio" className="font-medium text-primary hover:underline">
            assetmelt.com/studio
          </Link>
          . Drop images, configure a pipeline, compare before/after, and export — individually or
          as a ZIP. Install it as a PWA for offline use. Read guides on the{' '}
          <Link to="/blog" className="font-medium text-primary hover:underline">
            blog
          </Link>{' '}
          when you want the theory behind the tooling.
        </p>
      </TrustHighlight>

      <h2>How it works</h2>
      <p>
        {SITE_NAME} is a static web application — there is no backend that receives your images.
        When you open Studio, the app downloads WebAssembly codec modules to your browser. Decoding,
        resizing, cropping, and encoding all run in Web Workers on your CPU. The site is hosted on
        Vercel, which only delivers the app itself — HTML, JavaScript, and codec bundles. Your
        images never leave your device, so the host never sees them.
      </p>

      <TrustCardGrid items={PRINCIPLES} />

      <h2>Under the hood</h2>
      <p>
        The codec stack builds on the open-source ecosystem that powered Squoosh —{' '}
        <code>@jsquash</code> bindings around MozJPEG, libwebp, rav1e, Oxipng, and more. HEIC
        decoding uses local WASM decoders. The UI is a React app built with TanStack Start and
        TanStack Router, prerendered for fast loads and search-engine discoverability.
      </p>
      <p>
        <Cpu className="mb-0.5 inline size-4 text-primary" aria-hidden="true" />{' '}
        <span className="font-mono text-sm text-muted-foreground">
          /* shipped without a backend */
        </span>
      </p>

      <h2>Who builds it</h2>
      <p>
        {SITE_NAME} is designed, built, and maintained by{' '}
        <Link to="/author" className="font-medium text-primary hover:underline">
          {SITE_AUTHOR}
        </Link>
        , a software engineer. I write the blog, tune the presets, and ship updates. It is an indie
        project — not a venture-backed startup — which means decisions favor users over growth
        metrics.
      </p>
      <p>
        If you want to understand exactly what data the site collects (spoiler: not your images),
        read the <Link to="/privacy">privacy policy</Link>.
      </p>

      <div className="not-prose mt-12 flex flex-col items-center gap-4 rounded-2xl border border-primary/20 bg-primary/5 px-6 py-10 text-center">
        <p className="font-display text-lg font-semibold text-foreground">
          Ready to try it?
        </p>
        <p className="max-w-md text-sm text-muted-foreground">
          No signup, no upload. Open Studio and drop an image — you will see the difference in
          seconds.
        </p>
        <Button size="lg" asChild>
          <Link to="/studio">Open Studio</Link>
        </Button>
      </div>
    </TrustPageShell>
  )
}
