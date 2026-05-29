import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
      <div className="mesh-gradient noise-overlay absolute inset-0 -z-10" />

      <div className="mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Badge variant="secondary" className="mb-6 gap-1.5 font-mono text-xs">
            <Sparkles className="size-3 text-primary" />
            Zero uploads · Runs in your browser
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
          className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          Compress, convert, and transform images entirely in your browser.
          Squoosh-grade codecs, full control, no server required.
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
          className="mt-16 font-mono text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          MozJPEG · AVIF · WebP · Oxipng · JXL · QOI
        </motion.div>
      </div>
    </section>
  )
}
