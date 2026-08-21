import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronDown } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { StudioSeoSample } from '@/components/studio/studio-seo-sample'
import type { StudioSeoContent, StudioSeoSection, StudioSeoTable } from '@/lib/studio-seo/types'
import { cn } from '@/lib/utils'

function SeoDetails({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  return (
    <details
      className="group glass-surface rounded-2xl"
      open={defaultOpen || undefined}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 sm:px-6 [&::-webkit-details-marker]:hidden">
        <h3 className="font-display text-base font-semibold tracking-tight sm:text-lg">{title}</h3>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="space-y-4 border-t border-border/40 px-5 pb-5 sm:px-6 sm:pb-6">{children}</div>
    </details>
  )
}

function SeoTable({ table }: { table: StudioSeoTable }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/60 bg-card shadow-sm">
      <table className="w-full min-w-[480px] text-sm">
        <caption className="border-b border-border/50 bg-muted px-4 py-2.5 text-left font-mono text-[11px] text-muted-foreground">
          {table.caption}
        </caption>
        <thead>
          <tr className="border-b border-border/50 bg-muted">
            {table.headers.map((header) => (
              <th
                key={header}
                className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-card">
          {table.rows.map((row, rowIndex) => (
            <tr
              key={row.join('|')}
              className={cn(
                'border-b border-border/40 last:border-b-0',
                rowIndex % 2 === 1 && 'bg-muted/60',
              )}
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={`${rowIndex}-${cellIndex}-${cell.slice(0, 24)}`}
                  className={cn(
                    'px-4 py-3 align-top leading-relaxed',
                    cellIndex === 0 ? 'font-medium text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SectionBody({ section }: { section: StudioSeoSection }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
      {section.paragraphs.map((paragraph) => (
        <p key={paragraph.slice(0, 72)}>{paragraph}</p>
      ))}
    </div>
  )
}

export function StudioSeoSection({ content }: { content: StudioSeoContent }) {
  const [glanceTable, typicalTable] = content.tables
  const [why, ...moreSections] = content.sections

  return (
    <section className="mx-auto w-full max-w-3xl space-y-10 py-8">
      <div className="glass-surface rounded-2xl p-6 sm:p-8">
        <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
          {content.h2}
        </h2>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
          {content.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}
        </div>
      </div>

      <StudioSeoSample sample={content.beforeAfter} />

      <div>
        <h3 className="mb-4 font-display text-lg font-semibold tracking-tight sm:text-xl">
          How to use this converter
        </h3>
        <ol className="grid gap-3 sm:grid-cols-3">
          {content.steps.map((step, index) => (
            <li key={step.title} className="glass-surface rounded-2xl p-4">
              <p className="font-mono text-[11px] uppercase tracking-wider text-primary">
                Step {index + 1}
              </p>
              <h4 className="mt-2 font-display text-sm font-semibold">{step.title}</h4>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>

      {glanceTable ? (
        <div>
          <h3 className="mb-3 font-display text-lg font-semibold tracking-tight">{glanceTable.caption}</h3>
          <SeoTable table={glanceTable} />
        </div>
      ) : null}

      {why ? (
        <article className="glass-surface rounded-2xl p-6 sm:p-8">
          <h3 className="font-display text-lg font-semibold tracking-tight sm:text-xl">{why.heading}</h3>
          <div className="mt-3">
            <SectionBody section={why} />
          </div>
        </article>
      ) : null}

      <div className="space-y-3">
        {typicalTable ? (
          <SeoDetails title={typicalTable.caption}>
            <SeoTable table={typicalTable} />
          </SeoDetails>
        ) : null}

        {moreSections.map((section) => (
          <SeoDetails key={section.heading} title={section.heading}>
            <SectionBody section={section} />
          </SeoDetails>
        ))}
      </div>

      {content.related.length > 0 ? (
        <div className="glass-surface rounded-2xl p-6 sm:p-8">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Related conversions
          </p>
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {content.related.map((item) => {
              const conversion = item.path.replace(/^\/studio\//, '')
              return (
                <li key={item.path}>
                  <Link
                    to="/studio/$conversion"
                    params={{ conversion }}
                    className="font-mono text-xs text-primary transition-colors hover:underline"
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}

      <div id="faq" className="scroll-mt-24">
        <h2 className="mb-6 font-display text-xl font-bold tracking-tight sm:text-2xl">
          Frequently asked questions
        </h2>
        <div className="glass-surface rounded-2xl px-5 sm:px-6">
          <Accordion type="single" collapsible className="w-full">
            {content.faq.map((item, i) => (
              <AccordionItem key={item.question} value={`faq-${i}`}>
                <AccordionTrigger className="font-display text-base font-semibold hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent forceMount className="text-muted-foreground">{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
