import { motion } from 'motion/react'
import { HelpCircle } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
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
            className="mb-8"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.4 }}
          className="glass-surface rounded-2xl px-5 sm:px-6"
        >
          <Accordion type="single" collapsible className="w-full">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem key={item.question} value={`faq-${i}`}>
                <AccordionTrigger className="font-display text-base font-semibold hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  )
}
