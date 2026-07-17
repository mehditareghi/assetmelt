import { Link } from '@tanstack/react-router'
import { motion } from 'motion/react'
import {
  ArrowRight,
  ChevronRight,
  Download,
  Route,
  Settings,
  Sparkles,
  Upload,
} from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LandingSectionHeader } from '@/components/landing/landing-section-header'
import { TOOL_PAGE_ICONS } from '@/components/tools/tool-page-icons'
import { getRelatedToolPages } from '@/lib/tool-pages'
import type { ToolPageContent } from '@/lib/tool-pages/types'
import { toStudioSearchParams, studioLinkOptions } from '@/lib/studio-seo'
import { cn } from '@/lib/utils'

const STEP_ICONS = [Upload, Settings, Download] as const

interface ToolLandingPageProps {
  content: ToolPageContent
}

function StudioCtaLink({
  content,
  children,
  className,
}: {
  content: ToolPageContent
  children: React.ReactNode
  className?: string
}) {
  const link = content.studioSearch
    ? studioLinkOptions(toStudioSearchParams(content.studioSearch))
    : ({ to: '/studio' } as const)

  if (link.to === '/studio') {
    return (
      <Link to="/studio" className={className}>
        {children}
      </Link>
    )
  }

  return (
    <Link to="/studio/$conversion" params={link.params} className={className}>
      {children}
    </Link>
  )
}

export function ToolLandingPage({ content }: ToolLandingPageProps) {
  const relatedPages = getRelatedToolPages(content.relatedTools)

  return (
    <main className="flex-1">
      <ToolPageHero content={content} />
      <ToolPageBenefits content={content} />
      <ToolPageSteps content={content} />
      <ToolPageContent content={content} />
      {content.comparison ? <ToolPageComparison content={content} /> : null}
      <ToolPageFaq content={content} />
      <ToolPageRelated relatedPages={relatedPages} />
      <ToolPageCta content={content} />
    </main>
  )
}

function ToolPageBreadcrumb({ content }: { content: ToolPageContent }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-8 flex justify-center">
      <ol className="flex flex-wrap items-center justify-center gap-1.5 font-mono text-xs text-muted-foreground">
        <li>
          <Link to="/" className="transition-colors hover:text-primary">
            Home
          </Link>
        </li>
        <li aria-hidden="true">
          <ChevronRight className="size-3" />
        </li>
        <li className="text-foreground">{content.breadcrumbLabel}</li>
      </ol>
    </nav>
  )
}

function ToolPageHero({ content }: { content: ToolPageContent }) {
  return (
    <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="mesh-gradient noise-overlay absolute inset-0 -z-10" />
      <div className="landing-hero-grid pointer-events-none absolute inset-0 -z-10" />
      <div className="landing-section-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[60vh]" />

      <div className="relative mx-auto max-w-3xl text-center">
        <ToolPageBreadcrumb content={content} />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <Badge variant="glass" className="mb-5 gap-1.5 px-3 py-1 font-mono text-xs">
            <Sparkles className="size-3" />
            {content.heroBadge}
          </Badge>
        </motion.div>

        <motion.h1
          className="font-display font-extrabold tracking-tight"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
        >
          <span className="block text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            {content.h1}
          </span>
          {content.h1Accent ? (
            <span className="landing-gradient-text mt-2 block text-2xl font-semibold sm:text-3xl">
              {content.h1Accent}
            </span>
          ) : null}
        </motion.h1>

        <motion.p
          className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2 }}
        >
          {content.heroDescription}
        </motion.p>

        <motion.div
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.32 }}
        >
          <Button size="lg" asChild className="group h-12 px-8 text-base">
            <StudioCtaLink content={content}>
              {content.ctaLabel ?? 'Open Studio — it\u2019s free'}
              <ArrowRight className="transition-transform group-hover:translate-x-1" />
            </StudioCtaLink>
          </Button>
          <Button variant="outline" size="lg" asChild className="h-12 px-8 text-base">
            <a href="#how-it-works">See how it works</a>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}

function ToolPageBenefits({ content }: { content: ToolPageContent }) {
  return (
    <section className="relative px-4 py-20 sm:px-6 lg:px-8">
      <div className="landing-section-glow pointer-events-none absolute inset-x-0 top-1/2 -z-10 h-[min(50vh,400px)] -translate-y-1/2 opacity-60" />

      <div className="relative mx-auto max-w-6xl">
        <LandingSectionHeader
          eyebrow="Why Asset Melt"
          title="Built for this exact job"
          description="Everything you need — no uploads, no accounts, no compromises."
          className="mb-12"
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:gap-6">
          {content.benefits.map((benefit, i) => {
            const Icon = TOOL_PAGE_ICONS[benefit.icon]
            return (
              <motion.article
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="glass-surface rounded-2xl p-6 sm:p-7"
              >
                <div className="mb-4 flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                  <Icon className="size-5" strokeWidth={1.75} />
                </div>
                <h3 className="font-display text-lg font-semibold">{benefit.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {benefit.description}
                </p>
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function ToolPageSteps({ content }: { content: ToolPageContent }) {
  return (
    <section
      id="how-it-works"
      className="relative scroll-mt-24 border-y border-border/30 px-4 py-20 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.45 }}
        >
          <LandingSectionHeader
            icon={Route}
            eyebrow="How it works"
            title="Three steps"
            titleAccent="no upload step"
            description="Open the studio, process your files locally, and download — all in your browser."
          />
        </motion.div>

        <div className="grid gap-10 md:grid-cols-3 md:gap-8">
          {content.steps.map((step, i) => {
            const StepIcon = STEP_ICONS[i] ?? Upload
            return (
              <motion.div
                key={step.title}
                className="relative text-center md:text-left"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.08 + i * 0.1 }}
              >
                <span
                  className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 font-mono text-5xl font-bold text-primary/10 md:left-0 md:translate-x-0"
                  aria-hidden
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="relative mx-auto mb-4 flex size-12 items-center justify-center text-primary md:mx-0">
                  <StepIcon className="size-6" strokeWidth={1.75} />
                </div>
                <h3 className="font-display text-xl font-semibold">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function ToolPageContent({ content }: { content: ToolPageContent }) {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-12">
        {content.contentSections.map((section, i) => (
          <motion.article
            key={section.heading}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.45, delay: i * 0.05 }}
          >
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              {section.heading}
            </h2>
            <div className="mt-4 space-y-4">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 40)} className="text-base leading-relaxed text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  )
}

function ToolPageComparison({ content }: { content: ToolPageContent }) {
  const comparison = content.comparison
  if (!comparison) return null

  return (
    <section className="border-t border-border/30 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <LandingSectionHeader
          eyebrow="Comparison"
          title="Asset Melt vs"
          titleAccent={comparison.competitorName}
          description="A side-by-side look at what you get."
          className="mb-10"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.45 }}
          className="glass-surface overflow-hidden rounded-2xl"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-muted/30">
                  <th className="px-5 py-4 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Feature
                  </th>
                  <th className="px-5 py-4 text-left font-display font-semibold text-primary">
                    Asset Melt
                  </th>
                  <th className="px-5 py-4 text-left font-display font-semibold text-muted-foreground">
                    {comparison.competitorName}
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison.rows.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={cn(
                      'border-b border-border/20 last:border-b-0',
                      i % 2 === 0 && 'bg-background/20',
                    )}
                  >
                    <td className="px-5 py-3.5 font-medium">{row.feature}</td>
                    <td className="px-5 py-3.5 text-foreground">{row.assetMelt}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{row.competitor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function ToolPageFaq({ content }: { content: ToolPageContent }) {
  return (
    <section
      id="faq"
      className="scroll-mt-24 border-t border-border/30 px-4 py-20 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-3xl">
        <LandingSectionHeader
          eyebrow="FAQ"
          title="Common questions"
          description="Quick answers before you open the studio."
          className="mb-8"
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.4 }}
          className="glass-surface rounded-2xl px-5 sm:px-6"
        >
          <Accordion type="single" collapsible className="w-full">
            {content.faq.map((item, i) => (
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

function ToolPageRelated({ relatedPages }: { relatedPages: ToolPageContent[] }) {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <LandingSectionHeader
          eyebrow="More tools"
          title="Related pages"
          description="Other ways Asset Melt can help with your images."
          className="mb-10"
        />

        <div className="grid gap-4 sm:grid-cols-3">
          {relatedPages.map((page, i) => (
            <motion.div
              key={page.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
            >
              <Link
                to={page.path}
                className="group glass-surface flex h-full flex-col rounded-2xl p-5 transition-colors hover:border-primary/30"
              >
                <span className="font-mono text-[11px] uppercase tracking-wider text-primary">
                  {page.eyebrow}
                </span>
                <span className="mt-2 font-display text-lg font-semibold group-hover:text-primary">
                  {page.breadcrumbLabel}
                </span>
                <span className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {page.metaDescription.slice(0, 100)}…
                </span>
                <span className="mt-4 inline-flex items-center gap-1 font-mono text-xs text-primary">
                  Learn more
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ToolPageCta({ content }: { content: ToolPageContent }) {
  return (
    <section className="px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <motion.div
          className="landing-panel relative overflow-hidden rounded-2xl border border-primary/20 p-8 text-center sm:p-12"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
        >
          <div className="landing-panel-grid pointer-events-none absolute inset-0 opacity-40" />

          <div className="relative">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Ready to try it?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
              Open Asset Melt Studio — free, no account, no uploads. Your files stay on your device.
            </p>
            <Button size="lg" asChild className="group mt-8 h-12 px-8 text-base">
              <StudioCtaLink content={content}>
                {content.ctaLabel ?? 'Open Studio'}
                <ArrowRight className="transition-transform group-hover:translate-x-1" />
              </StudioCtaLink>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
