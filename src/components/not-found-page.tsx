import { Link, useLocation } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { ArrowLeft, ArrowRight, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

const EASE_OUT = [0.22, 1, 0.36, 1] as const

function NotFoundCode() {
  return (
    <motion.div
      className="font-display text-[clamp(5rem,22vw,9rem)] font-black leading-none tracking-[-0.04em] select-none"
      aria-hidden
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: EASE_OUT }}
    >
      <span className="text-foreground/20 dark:text-foreground/25">4</span>
      <span className="not-found-zero text-primary/50 dark:text-primary/60">0</span>
      <span className="text-foreground/20 dark:text-foreground/25">4</span>
    </motion.div>
  )
}

export function NotFoundPage() {
  const { pathname } = useLocation()

  // Motion `initial` must stay identical on server and first client paint.
  // useReducedMotion() used to branch those props and caused hydration errors
  // (ASSETMELT-WEB-9) for prefers-reduced-motion visitors on splat routes like /s.
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-24 sm:px-6 sm:py-32">
      <div className="mesh-gradient noise-overlay absolute inset-0 -z-10" />
      <div className="landing-hero-grid pointer-events-none absolute inset-0 -z-10" />
      <div className="landing-section-glow pointer-events-none absolute inset-x-0 top-1/2 -z-10 h-[50vh] -translate-y-1/2" />

      <div className="relative mx-auto flex w-full max-w-md flex-col items-center text-center">
        <NotFoundCode />

        <motion.div
          className="mt-8 space-y-4 sm:mt-10"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12, ease: EASE_OUT }}
        >
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Page not found
          </h1>

          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            <code className="rounded-md border border-border/60 bg-muted/50 px-2 py-0.5 font-mono text-xs text-foreground sm:text-sm">
              {pathname || '/'}
            </code>
            <span className="mt-2 block sm:mt-0 sm:inline sm:before:content-['\\00a0']">
              doesn&apos;t exist.
            </span>
          </p>
        </motion.div>

        <motion.div
          className="mt-10 flex w-full flex-col gap-3 sm:flex-row sm:justify-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.22, ease: EASE_OUT }}
        >
          <Button size="lg" asChild className="group h-11 px-7">
            <Link to="/studio">
              Open Studio
              <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>

          <Button size="lg" variant="outline" asChild className="group h-11 px-7">
            <Link to="/">
              <Home className="size-4" />
              Go home
            </Link>
          </Button>
        </motion.div>

        <motion.div
          className="mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.32 }}
        >
          <button
            type="button"
            onClick={() => window.history.back()}
            className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
            Go back
          </button>
        </motion.div>
      </div>
    </main>
  )
}
