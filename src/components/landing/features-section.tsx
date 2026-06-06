import { motion } from 'motion/react'
import {
  Bookmark,
  Layers,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react'
import { LandingSectionHeader } from '@/components/landing/landing-section-header'

const features = [
  {
    icon: Target,
    title: 'Hit a target file size',
    description:
      'Need a 200 KB JPEG or a sub-100 KB WebP? Set a size budget and Asset Melt finds the highest-quality online compression that fits — resizing only when it has to.',
  },
  {
    icon: Zap,
    title: 'Modern format conversion',
    description:
      'Compress to AVIF or WebP, export lossless PNG, or convert HEIC to JPG in the browser. MozJPEG, Oxipng, JXL, and QOI — the same WASM engines as Google Squoosh.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Resize, crop & transform',
    description:
      'Online image editing without uploads: Lanczos resize, aspect-ratio crop, rotate, flip, and brightness/contrast filters — plus advanced codec controls when you need them.',
  },
  {
    icon: Bookmark,
    title: 'Platform & social presets',
    description:
      'One-click OG images, Instagram sizes, and favicon kits at exact dimensions. Save your own presets or import a JSON pipeline for repeatable client-side compression.',
  },
  {
    icon: Layers,
    title: 'Batch compress online',
    description:
      'Drop a folder, queue dozens of files, and compress images online in one pass. Compare before/after, then download individually or as a ZIP with per-file byte savings.',
  },
  {
    icon: Smartphone,
    title: 'Installable app, offline on demand',
    description:
      'Add Asset Melt to your home screen for a focused studio experience. Offline mode is optional — download the pack once when you want plane-ready compression.',
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
            title="Online image compression"
            titleAccent="without uploading a single byte"
            description="Compress images online, convert HEIC to JPG, resize for the web, and export batches — a full client-side image pipeline, free forever."
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
