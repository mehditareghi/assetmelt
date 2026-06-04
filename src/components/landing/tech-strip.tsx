import { motion } from 'motion/react'
import { Cpu } from 'lucide-react'
import { LandingSectionHeader } from '@/components/landing/landing-section-header'
import { cn } from '@/lib/utils'

const technologies = [
  'MozJPEG',
  'AVIF',
  'WebP',
  'Oxipng',
  'JPEG XL',
  'QOI',
  'Lanczos3',
  'Magic Kernel',
  'HEIC decode',
  'Web Workers',
  'WASM codecs',
  'Size budget',
]

export function TechStrip() {
  return (
    <section className="relative px-4 py-20 sm:px-6 lg:px-8">
      <div className="landing-section-glow pointer-events-none absolute inset-x-0 top-1/2 -z-10 h-48 -translate-y-1/2 opacity-60" />

      <div className="relative mx-auto max-w-4xl">
        <LandingSectionHeader
          icon={Cpu}
          eyebrow="Under the hood"
          title="Squoosh-grade engines,"
          titleAccent="compiled to WASM"
          description="Every codec and resize kernel runs locally — no server round-trip."
          className="mb-10"
        />

        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {technologies.map((item, i) => (
            <motion.span
              key={item}
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.04 + i * 0.025, duration: 0.3 }}
              className={cn(
                'rounded-full border border-border/50 px-3.5 py-1.5 font-mono text-xs text-muted-foreground',
                'transition-colors hover:border-primary/30 hover:text-foreground',
              )}
            >
              {item}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  )
}
