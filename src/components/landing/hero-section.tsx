import { Link } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const CODEC_CHIPS = ['MozJPEG', 'AVIF', 'WebP', 'Oxipng', 'JXL', 'QOI', 'HEIC', 'WASM']

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
      <div className="mesh-gradient noise-overlay absolute inset-0 -z-10" />
      <div className="landing-hero-grid pointer-events-none absolute inset-0 -z-10" />
      <div className="landing-section-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[70vh]" />

      <div className="relative mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Badge variant="glass" className="mb-6 gap-1.5 px-3 py-1 font-mono text-xs">
            <Sparkles className="size-3" />
            Zero uploads · Free forever
          </Badge>
        </motion.div>

        <motion.h1
          className="font-display text-5xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Asset
          <span className="relative mx-2 inline-block text-primary">
            Melt
            <motion.span
              className="absolute -inset-x-2 -inset-y-1 -z-10 rounded-lg bg-primary/10 blur-xl"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </span>
        </motion.h1>

        <motion.p
          className="mx-auto mt-6 max-w-2xl text-base font-medium leading-relaxed text-foreground sm:text-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          Compress, convert, and transform images entirely in your{' '}
          <span className="landing-gradient-text">browser</span>. Set a file-size target, dial in
          every codec option, or start from a preset — no uploads required.
        </motion.p>

        <motion.div
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Button size="lg" asChild className="group h-12 px-8 text-base">
            <Link to="/studio">
              Open Studio
              <ArrowRight className="transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild className="h-12 px-8 text-base">
            <a href="#how-it-works">See how it works</a>
          </Button>
        </motion.div>

        <motion.div
          className="mx-auto mt-14 flex max-w-2xl flex-wrap items-center justify-center gap-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
        >
          {CODEC_CHIPS.map((chip, i) => (
            <motion.span
              key={chip}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + i * 0.04 }}
              className={cn(
                'rounded-full border border-border/50 px-3 py-1 font-mono text-[11px] text-muted-foreground',
                'transition-colors hover:border-primary/30 hover:text-foreground',
              )}
            >
              {chip}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
