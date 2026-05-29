import { motion } from 'motion/react'
import {
  Layers,
  Lock,
  Settings2,
  SlidersHorizontal,
  Target,
  Zap,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const features = [
  {
    icon: Zap,
    title: 'Squoosh-grade codecs',
    description:
      'MozJPEG, AVIF, WebP, Oxipng, JXL, and QOI — the same WASM engines that power Google Squoosh.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Full control',
    description:
      'Every codec parameter exposed. Resize algorithms, filters, crop, rotate — nothing locked behind presets.',
  },
  {
    icon: Target,
    title: 'Size budget encoding',
    description:
      'Set a max file size — AssetMelt finds the highest quality encode that fits, resizing only if it has to.',
  },
  {
    icon: Layers,
    title: 'Batch processing',
    description:
      'Drop a folder of assets, apply one pipeline, download everything as a zip. Built for real workflows.',
  },
  {
    icon: Settings2,
    title: 'Presets + JSON config',
    description:
      'Start fast with presets or export/import pipeline configs as JSON for reproducible builds.',
  },
  {
    icon: Lock,
    title: 'Privacy by design',
    description:
      'Your images never leave your machine. No accounts, no API keys, no tracking. Just WASM in a tab.',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Built for developers who care about assets
          </h2>
          <p className="mt-4 text-muted-foreground">
            Professional tooling for your asset pipeline.
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
