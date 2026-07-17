import { DropZone } from '@/components/studio/drop-zone'
import { AppUpdatePanel } from '@/components/pwa/app-update-panel'
import { OfflinePrepPanel } from '@/components/pwa/offline-prep-panel'
import { FileQueue } from '@/components/studio/file-queue'
import { PreviewPanel } from '@/components/studio/preview-panel'
import { SettingsPanel } from '@/components/studio/settings-panel'
import { StudioToolbar } from '@/components/studio/studio-toolbar'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { HardDriveDownload, Lock, ServerOff, UserX } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  filesFromClipboardEvent,
  isEditablePasteTarget,
} from '@/lib/image/clipboard-paste'
import { warmUpWorker } from '@/lib/image/worker-bridge'
import { useOptionalOfflinePrepContext } from '@/lib/pwa/offline-prep-context'
import { getDefaultEncodeOptions } from '@/lib/schemas/pipeline-schema'
import {
  buildStudioSeoContent,
  studioPathForOutputChange,
  studioSearchIntents,
  type StudioSearch,
  type StudioSeoContent,
} from '@/lib/studio-seo'
import { useStudioStore } from '@/stores/studio-store'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { SlidersHorizontal } from 'lucide-react'
import { useEffect, useRef } from 'react'

function applyOutputFromSearch(toSlug: string | undefined) {
  const to = studioSearchIntents({ to: toSlug }).to
  if (!to) return
  const { pipeline, updatePipeline } = useStudioStore.getState()
  if (pipeline.outputFormat === to && pipeline.encode.format === to) return
  updatePipeline({
    outputFormat: to,
    encode: getDefaultEncodeOptions(to),
  })
}

function pathFromLocation(pathname: string): string {
  return pathname.endsWith('/') && pathname.length > 1
    ? pathname.slice(0, -1)
    : pathname
}

export function StudioPage({ search }: { search: StudioSearch }) {
  const seo = buildStudioSeoContent(search)
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const files = useStudioStore((s) => s.files)
  const outputFormat = useStudioStore((s) => s.pipeline.outputFormat)
  const addFiles = useStudioStore((s) => s.addFiles)
  const undo = useStudioStore((s) => s.undo)
  const redo = useStudioStore((s) => s.redo)
  const offlinePrep = useOptionalOfflinePrepContext()
  const hideOfflinePanels = offlinePrep?.offlineStudioChrome ?? false

  /** Skip URL rewrite while applying format from the route itself. */
  const applyingFromRouteRef = useRef(false)
  /** Latest SEO search — used when syncing URL after a user format change. */
  const searchRef = useRef(search)
  /** Only rewrite the URL when outputFormat changes from a user action. */
  const lastSyncedFormatRef = useRef<string | null>(null)

  useEffect(() => {
    searchRef.current = search
  }, [search])

  useEffect(() => {
    warmUpWorker()
  }, [])

  // Route `to` wins over persisted localStorage settings after rehydration.
  useEffect(() => {
    if (!search.to) {
      // Bare /studio — treat current format as already synced so we don't
      // immediately bounce to /studio/to-webp.
      lastSyncedFormatRef.current = useStudioStore.getState().pipeline.outputFormat
      return
    }

    const apply = () => {
      applyingFromRouteRef.current = true
      applyOutputFromSearch(search.to)
      const applied = studioSearchIntents({ to: search.to }).to
      if (applied) lastSyncedFormatRef.current = applied
      // Keep the flag set long enough that the format-sync effect (scheduled
      // after this render) still sees the route-driven change as authoritative.
      requestAnimationFrame(() => {
        applyingFromRouteRef.current = false
      })
    }
    const persist = useStudioStore.persist

    if (persist.hasHydrated()) {
      apply()
      return
    }

    return persist.onFinishHydration(apply)
  }, [search.to])

  // Keep the shareable URL aligned with output format only (not quality/toggles).
  // Only runs when the user changes format in settings — not when related SEO
  // links change the route (that used to race and snap the URL back).
  useEffect(() => {
    if (applyingFromRouteRef.current) return

    if (lastSyncedFormatRef.current === null) {
      lastSyncedFormatRef.current = outputFormat
      return
    }
    if (lastSyncedFormatRef.current === outputFormat) return
    lastSyncedFormatRef.current = outputFormat

    const desired = studioPathForOutputChange(searchRef.current, outputFormat)
    const current = pathFromLocation(pathname)
    if (desired === current) return

    const intents = studioSearchIntents(searchRef.current)
    // On bare /studio with default webp and no SEO intent, don't force /studio/to-webp.
    if (
      current === '/studio' &&
      !intents.from &&
      !intents.to &&
      outputFormat === 'webp'
    ) {
      return
    }

    if (desired === '/studio') {
      void navigate({ to: '/studio', replace: true })
      return
    }

    const conversion = desired.replace(/^\/studio\//, '')
    void navigate({
      to: '/studio/$conversion',
      params: { conversion },
      replace: true,
    })
  }, [outputFormat, pathname, navigate])

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      if (isEditablePasteTarget(event.target)) return
      const pasted = filesFromClipboardEvent(event)
      if (pasted.length === 0) return
      event.preventDefault()
      void addFiles(pasted)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [addFiles])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'z')
        return
      const target = event.target
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return
      }
      event.preventDefault()
      if (event.shiftKey) redo()
      else undo()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [undo, redo])

  return (
    <>
      <div className="mesh-gradient studio-page-bg pointer-events-none fixed inset-0 -z-10" />
      <div className="landing-hero-grid pointer-events-none fixed inset-0 -z-10 opacity-25" />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        {!hideOfflinePanels ? <OfflinePrepPanel /> : null}
        {!hideOfflinePanels ? <AppUpdatePanel /> : null}
        <div className="glass-surface overflow-visible rounded-2xl p-3 sm:p-4">
          <StudioToolbar />
        </div>

        <StudioPrivacyStrip />

        {files.length === 0 ? (
          <>
            <DropZone className="min-h-[55vh]" />
            <p className="text-center text-sm text-muted-foreground">
              {seo.dropHint ??
                'Or pick a preset and start — defaults to Web Optimized (WebP, max 1920px)'}
            </p>
          </>
        ) : (
          <>
            <div className="lg:hidden">
              <div className="flex gap-2 overflow-x-auto pb-2">
                <FileQueue />
              </div>
            </div>

            <div className="grid flex-1 gap-5 lg:grid-cols-[240px_1fr_320px]">
              <aside className="hidden lg:block">
                <FileQueue />
              </aside>

              <section className="min-w-0 overflow-visible">
                <PreviewPanel />
              </section>

              <aside className="hidden lg:block">
                <div className="glass-surface sticky top-[4.5rem] rounded-2xl p-4">
                  <h3 className="mb-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Settings
                  </h3>
                  <SettingsPanel />
                </div>
              </aside>
            </div>

            <div className="fixed bottom-6 right-6 lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    size="lg"
                    className="size-14 rounded-full shadow-lg shadow-primary/20"
                  >
                    <SlidersHorizontal className="size-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="bottom"
                  className="max-h-[85vh] overflow-y-auto border-border/50 bg-background/95 backdrop-blur-xl"
                >
                  <SheetHeader>
                    <SheetTitle>Pipeline Settings</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 pb-8">
                    <SettingsPanel />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </>
        )}

        <StudioSeoSection content={seo} />
      </main>
    </>
  )
}

const PRIVACY_BADGES = [
  { icon: ServerOff, label: 'Files never uploaded' },
  { icon: HardDriveDownload, label: 'Processed in your browser' },
  { icon: UserX, label: 'No account needed' },
  { icon: Lock, label: 'Nothing stored or shared' },
] as const

function StudioPrivacyStrip() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
      {PRIVACY_BADGES.map(({ icon: Icon, label }) => (
        <span
          key={label}
          className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground"
        >
          <Icon className="size-3 shrink-0 text-primary" aria-hidden="true" />
          {label}
        </span>
      ))}
    </div>
  )
}

function StudioSeoSection({ content }: { content: StudioSeoContent }) {
  return (
    <section className="mx-auto w-full max-w-3xl space-y-12 py-8">
      <div className="glass-surface rounded-2xl p-6 sm:p-8">
        <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
          {content.h2}
        </h2>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
          {content.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}
        </div>

        {content.related.length > 0 ? (
          <div className="mt-6 border-t border-border/40 pt-5">
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
      </div>

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
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
