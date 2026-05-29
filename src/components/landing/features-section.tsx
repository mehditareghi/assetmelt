import { motion } from 'motion/react'
import {
  Bookmark,
  Layers,
  Lock,
  SlidersHorizontal,
  Target,
  Zap,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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
    <section id="features" className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Everything in the studio, nothing on a server
          </h2>
          <p className="mt-4 text-muted-foreground">
            From byte-budget exports to batch zips — a complete image pipeline in the browser.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm transition-colors hover:border-primary/30">
                <CardHeader>
                  <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="size-5 text-primary" />
                  </div>
                  <CardTitle className="font-display text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
