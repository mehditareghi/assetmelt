import { motion } from 'motion/react'
import { Download, Route, Settings, Upload } from 'lucide-react'
import { LandingSectionHeader } from '@/components/landing/landing-section-header'

const steps = [
  {
    icon: Upload,
    step: '01',
    title: 'Drop your images',
    description:
      'Add files or folders. JPEG, PNG, WebP, AVIF, HEIC, GIF, SVG, and more — decoded locally in a Web Worker.',
  },
  {
    icon: Settings,
    step: '02',
    title: 'Build your pipeline',
    description:
      'Pick a preset, set a size budget, or tune format, resize, crop, and codec options across the Format and Transform tabs.',
  },
  {
    icon: Download,
    step: '03',
    title: 'Process and export',
    description:
      'Compare before and after, review byte savings and budget stats, then download files individually or as a zip.',
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
            title="Three steps."
            titleAccent="Zero uploads."
            description="Open the studio, configure once, and run the same pipeline across your whole queue."
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
