import { motion } from 'motion/react'
import { HelpCircle } from 'lucide-react'
import { LandingSectionHeader } from '@/components/landing/landing-section-header'
import { FAQ_ITEMS } from '@/lib/llm-content'

export function FaqSection() {
  return (
    <section
      id="faq"
      className="relative scroll-mt-20 border-t border-border/30 px-4 py-24 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.45 }}
        >
          <LandingSectionHeader
            icon={HelpCircle}
            eyebrow="FAQ"
            title="Common questions"
            titleAccent="straight answers"
            description="Everything you need to know before opening the studio."
            className="mb-10"
          />
        </motion.div>

        <dl className="space-y-6">
          {FAQ_ITEMS.map((item, i) => (
            <motion.div
              key={item.question}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.35, delay: i * 0.04 }}
              className="glass-surface rounded-2xl p-5 sm:p-6"
            >
              <dt className="font-display text-base font-semibold sm:text-lg">
                {item.question}
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {item.answer}
              </dd>
            </motion.div>
          ))}
        </dl>
      </div>
    </section>
  )
}
