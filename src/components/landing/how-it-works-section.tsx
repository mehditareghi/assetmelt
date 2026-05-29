import { motion } from 'motion/react'
import { Download, Settings, Upload } from 'lucide-react'

const steps = [
  {
    icon: Upload,
    step: '01',
    title: 'Drop your assets',
    description: 'Drag images or entire folders. JPEG, PNG, WebP, AVIF, HEIC, SVG — all decoded locally.',
  },
  {
    icon: Settings,
    step: '02',
    title: 'Configure the pipeline',
    description: 'Pick a preset or dial in every codec option. Resize, crop, filter, convert — your call.',
  },
  {
    icon: Download,
    step: '03',
    title: 'Download results',
    description: 'Export single files or batch zip. See exact byte savings and dimensions before you ship.',
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="border-y border-border/50 bg-muted/20 px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Three steps. Zero uploads.
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((item, i) => (
            <motion.div
              key={item.step}
              className="relative text-center"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.15 }}
            >
              <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border border-border/50 bg-card">
                <item.icon className="size-7 text-primary" />
              </div>
              <span className="font-mono text-xs text-primary">{item.step}</span>
              <h3 className="mt-2 font-display text-xl font-semibold">{item.title}</h3>
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
