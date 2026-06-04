import { motion } from 'motion/react'
import {
  Bookmark,
  Layers,
  Lock,
  SlidersHorizontal,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react'
import { LandingSectionHeader } from '@/components/landing/landing-section-header'

const features = [
  {
    icon: Target,
    title: 'Size budget encoding',
    description:
      'Set a max file size — AssetMelt searches for the highest quality encode that fits, resizing only when it has to.',
  },
  {
    icon: Zap,
    title: 'Squoosh-grade codecs',
    description:
      'MozJPEG, AVIF, WebP, Oxipng, JXL, and QOI via WASM — the same engines that power Google Squoosh.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Full pipeline control',
    description:
      'Resize modes, crop, rotate, flip, filters, and advanced codec parameters — with tooltips on every setting.',
  },
  {
    icon: Bookmark,
    title: 'Presets you can own',
    description:
      'Start from built-in presets, save your own, revert unsaved tweaks, or export and import pipeline JSON.',
  },
  {
    icon: Layers,
    title: 'Batch processing',
    description:
      'Queue multiple files, run one pipeline, and download everything as a zip with per-file size stats.',
  },
  {
    icon: Lock,
    title: 'Privacy by design',
    description:
      'Images never leave your machine. No accounts, no API keys, no server — just WASM in a tab.',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="relative scroll-mt-20 px-4 py-24 sm:px-6 lg:px-8">
      <div className="landing-section-glow pointer-events-none absolute inset-x-0 top-1/2 -z-10 h-[min(60vh,480px)] -translate-y-1/2 opacity-70" />

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.45 }}
        >
          <LandingSectionHeader
            icon={Sparkles}
            eyebrow="Studio toolkit"
            title="Everything in the studio,"
            titleAccent="nothing on a server"
            description="From byte-budget exports to batch zips — a complete image pipeline in the browser."
          />
        </motion.div>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-12 lg:gap-y-12">
          {features.map((feature, i) => (
            <motion.article
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <div className="mb-4 flex size-10 items-center justify-center text-primary">
                <feature.icon className="size-5" strokeWidth={1.75} />
              </div>
              <h3 className="font-display text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
