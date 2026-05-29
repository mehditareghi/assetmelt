import { motion } from 'motion/react'
import { Badge } from '@/components/ui/badge'

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
]

export function TechStrip() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <motion.p
          className="mb-6 font-mono text-xs uppercase tracking-widest text-muted-foreground"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Under the hood
        </motion.p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {technologies.map((item, i) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Badge
                variant="outline"
                className="font-mono text-xs transition-colors hover:border-primary/50 hover:bg-primary/5"
              >
                {item}
              </Badge>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
