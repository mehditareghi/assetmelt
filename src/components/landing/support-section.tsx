import { motion } from 'motion/react'
import { Coins, Heart, Sparkles } from 'lucide-react'
import { DONATION_SECTION } from '@/lib/crypto-donations'
import { CryptoDonationPanel } from '@/components/landing/crypto-donation-panel'
import { Badge } from '@/components/ui/badge'

export function SupportSection() {
  return (
    <section
      id={DONATION_SECTION.id}
      className="relative scroll-mt-20 px-4 py-24 sm:px-6 lg:px-8"
      aria-labelledby="support-heading"
    >
      <div className="donate-section-glow pointer-events-none absolute inset-x-0 top-1/2 -z-10 h-[min(80vh,640px)] -translate-y-1/2" />

      <div className="mx-auto max-w-5xl">
        <motion.div
          className="donate-panel relative overflow-hidden rounded-2xl border border-primary/20 p-6 sm:p-10 lg:p-12"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55 }}
        >
          <div className="donate-panel-grid pointer-events-none absolute inset-0 opacity-40" />
          <div className="donate-panel-scan pointer-events-none absolute inset-0" />

          <div className="relative">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-md lg:shrink-0">
                <Badge
                  variant="secondary"
                  className="mb-4 gap-1.5 border-primary/20 bg-primary/10 font-mono text-xs text-primary"
                >
                  <Sparkles className="size-3" />
                  {DONATION_SECTION.eyebrow}
                </Badge>

                <h2
                  id="support-heading"
                  className="font-display text-3xl font-bold tracking-tight sm:text-4xl"
                >
                  {DONATION_SECTION.title}
                  <span className="mt-1 block bg-gradient-to-r from-primary via-amber-200 to-chart-3 bg-clip-text text-transparent dark:via-amber-100">
                    with crypto
                  </span>
                </h2>

                <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {DONATION_SECTION.description}
                </p>

                <div className="mt-6 flex items-center gap-2 font-mono text-xs text-muted-foreground">
                  <Heart className="size-3.5 shrink-0 text-primary" aria-hidden />
                  <span>Thank you for supporting open, local-first tooling</span>
                </div>
              </div>

              <motion.div
                className="min-w-0 flex-1"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: 0.12 }}
              >
                <div className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  <Coins className="size-3.5 text-primary" />
                  Choose asset &amp; network
                </div>
                <CryptoDonationPanel />
              </motion.div>
            </div>

            <p className="relative mt-8 border-t border-border/40 pt-6 text-center font-mono text-[11px] leading-relaxed text-muted-foreground">
              {DONATION_SECTION.footnote}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
