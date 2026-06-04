import { motion } from 'motion/react'
import { Coins, Heart } from 'lucide-react'
import { DONATION_SECTION } from '@/lib/crypto-donations'
import { CryptoDonationPanel } from '@/components/landing/crypto-donation-panel'
import { LandingSectionHeader } from '@/components/landing/landing-section-header'

export function SupportSection() {
  return (
    <section
      id={DONATION_SECTION.id}
      className="relative scroll-mt-20 px-4 py-24 sm:px-6 lg:px-8"
      aria-labelledby="support-heading"
    >
      <div className="landing-section-glow pointer-events-none absolute inset-x-0 top-1/2 -z-10 h-[min(80vh,640px)] -translate-y-1/2" />

      <div className="mx-auto max-w-5xl">
        <motion.div
          className="landing-panel relative overflow-hidden rounded-2xl border border-primary/20 p-6 sm:p-10 lg:p-12"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55 }}
        >
          <div className="landing-panel-grid pointer-events-none absolute inset-0 opacity-40" />
          <div className="landing-panel-scan pointer-events-none absolute inset-0" />

          <div className="relative">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-md lg:shrink-0">
                <LandingSectionHeader
                  id="support-heading"
                  align="left"
                  eyebrow={DONATION_SECTION.eyebrow}
                  title={DONATION_SECTION.title}
                  titleAccent="with crypto"
                  description={DONATION_SECTION.description}
                  className="mb-0"
                />

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
