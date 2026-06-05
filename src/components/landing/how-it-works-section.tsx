import { motion } from 'motion/react'
import { Download, Route, Settings, Upload } from 'lucide-react'
import { LandingSectionHeader } from '@/components/landing/landing-section-header'

const steps = [
  {
    icon: Upload,
    step: '01',
    title: 'Drop images to compress',
    description:
      'Add photos from your device — JPEG, PNG, WebP, AVIF, HEIC, GIF, SVG, and more. Everything decodes locally in a Web Worker; nothing is sent to a server.',
  },
  {
    icon: Settings,
    step: '02',
    title: 'Choose how to compress',
    description:
      'Pick Web Optimized or convert HEIC to JPG in the browser. Set a size budget, resize for the web, crop to a social preset, or tune AVIF/WebP quality by hand.',
  },
  {
    icon: Download,
    step: '03',
    title: 'Download smaller files',
    description:
      'Compare the original side-by-side with your compressed output, check byte savings, then export one file or batch-download a ZIP of every optimized image.',
  },
]

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="relative scroll-mt-20 border-y border-border/30 px-4 py-24 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.45 }}
        >
          <LandingSectionHeader
            icon={Route}
            eyebrow="Workflow"
            title="Compress images online"
            titleAccent="in three steps"
            description="Open the studio, run client-side image compression on your whole queue, and download — no signup, no upload step, no waiting on a server."
          />
        </motion.div>

        <div className="grid gap-12 md:grid-cols-3 md:gap-8">
          {steps.map((item, i) => (
            <motion.div
              key={item.step}
              className="relative text-center md:text-left"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.08 + i * 0.1 }}
            >
              <span
                className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 font-mono text-5xl font-bold text-primary/10 md:left-0 md:translate-x-0"
                aria-hidden
              >
                {item.step}
              </span>

              <div className="relative mx-auto mb-4 flex size-12 items-center justify-center text-primary md:mx-0">
                <item.icon className="size-6" strokeWidth={1.75} />
              </div>

              <h3 className="font-display text-xl font-semibold">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
