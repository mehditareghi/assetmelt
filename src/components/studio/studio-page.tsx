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
import { Download, Lock, Play, SlidersHorizontal, Square } from 'lucide-react'
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
import { fileHasDownloadableResult } from '@/lib/download-results'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { useStudioShortcuts } from '@/hooks/use-studio-shortcuts'
import { ShortcutCheatsheet } from '@/components/studio/shortcut-cheatsheet'
import { exportStudioResults, studioQueueStatus } from '@/lib/studio-actions'
import {
  decodeStudioRecipe,
  encodeStudioRecipe,
  studioRecipeSearch,
} from '@/lib/studio-recipe'

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

function applyRecipeOrFormat(search: StudioSearch) {
  if (search.recipe) {
    const decoded = decodeStudioRecipe(search.recipe)
    const store = useStudioStore.getState()
    if (decoded?.kind === 'preset') {
      store.applyPresetById(decoded.id)
      return
    }
    if (decoded?.kind === 'pipeline') {
      store.importPipelineConfig(decoded.pipeline)
      return
    }
  }
  applyOutputFromSearch(search.to)
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
  const pipeline = useStudioStore((s) => s.pipeline)
  const outputFormat = pipeline.outputFormat
  const addFiles = useStudioStore((s) => s.addFiles)
  const processAll = useStudioStore((s) => s.processAll)
  const cancelProcessing = useStudioStore((s) => s.cancelProcessing)
  const isProcessing = useStudioStore((s) => s.isProcessing)
  const isCropEditing = useStudioStore((s) => s.isCropEditing)
  const offlinePrep = useOptionalOfflinePrepContext()
  const hideOfflinePanels = offlinePrep?.offlineStudioChrome ?? false
  useStudioShortcuts()

  const doneCount = files.filter(fileHasDownloadableResult).length
  const pendingCount = files.filter(
    (f) => f.status === 'pending' || f.status === 'error',
  ).length
  const queueStatus = studioQueueStatus(files)
  const canProcess =
    files.length > 0 && pendingCount > 0 && !isCropEditing && !isProcessing
  const canDownload = doneCount > 0 && !isCropEditing && !isProcessing

  const handleMobileDownload = () => {
    void exportStudioResults()
  }

  /** Skip URL rewrite while applying format/recipe from the route itself. */
  const applyingFromRouteRef = useRef(false)
  /** Latest SEO search — used when syncing URL after a user format change. */
  const searchRef = useRef(search)
  /** Only rewrite the URL when outputFormat changes from a user action. */
  const lastSyncedFormatRef = useRef<string | null>(null)
  const lastWrittenRecipeRef = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    searchRef.current = search
  }, [search])

  useEffect(() => {
    warmUpWorker()
  }, [])

  // Recipe (or route `to`) wins over persisted localStorage settings after rehydration.
  useEffect(() => {
    if (
      lastWrittenRecipeRef.current === (search.recipe ?? null) &&
      lastSyncedFormatRef.current !== null
    ) {
      return
    }

    const apply = () => {
      applyingFromRouteRef.current = true
      applyRecipeOrFormat(search)
      lastSyncedFormatRef.current = useStudioStore.getState().pipeline.outputFormat
      lastWrittenRecipeRef.current = search.recipe ?? null
      requestAnimationFrame(() => {
        applyingFromRouteRef.current = false
      })
    }
    const persist = useStudioStore.persist

    if (!search.recipe && !search.to) {
      lastSyncedFormatRef.current = useStudioStore.getState().pipeline.outputFormat
      lastWrittenRecipeRef.current = encodeStudioRecipe(useStudioStore.getState().pipeline)
      return
    }

    if (persist.hasHydrated()) {
      apply()
      return
    }

    return persist.onFinishHydration(apply)
  }, [search, search.recipe, search.to])

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
    const encoded = encodeStudioRecipe(useStudioStore.getState().pipeline)
    const recipeSearch = studioRecipeSearch(encoded)
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

    lastWrittenRecipeRef.current = encoded ?? null

    if (desired === '/studio') {
      void navigate({ to: '/studio', search: recipeSearch, replace: true })
      return
    }

    const conversion = desired.replace(/^\/studio\//, '')
    void navigate({
      to: '/studio/$conversion',
      params: { conversion },
      search: recipeSearch,
      replace: true,
    })
  }, [outputFormat, pathname, navigate])

  useEffect(() => {
    if (applyingFromRouteRef.current) return
    const encoded = encodeStudioRecipe(pipeline)
    const next = encoded ?? null
    if (lastWrittenRecipeRef.current === next) return
    if ((search.recipe ?? null) === next) {
      lastWrittenRecipeRef.current = next
      return
    }

    const handle = window.setTimeout(() => {
      if (applyingFromRouteRef.current) return
      lastWrittenRecipeRef.current = next
      const recipeSearch = studioRecipeSearch(encoded)
      const current = pathFromLocation(pathname)
      if (current === '/studio') {
        void navigate({ to: '/studio', search: recipeSearch, replace: true })
        return
      }
      void navigate({
        to: '/studio/$conversion',
        params: { conversion: current.replace(/^\/studio\//, '') },
        search: recipeSearch,
        replace: true,
      })
    }, 400)

    return () => window.clearTimeout(handle)
  }, [pipeline, pathname, navigate, search.recipe])

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

  return (
    <>
      <div className="mesh-gradient studio-page-bg pointer-events-none fixed inset-0 -z-10" />
      <div className="landing-hero-grid pointer-events-none fixed inset-0 -z-10 opacity-25" />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-5 sm:gap-5 sm:px-6 sm:py-6 lg:px-8">
        {!hideOfflinePanels ? <OfflinePrepPanel /> : null}
        {!hideOfflinePanels ? <AppUpdatePanel /> : null}
        <div className="glass-surface overflow-visible rounded-2xl p-3 sm:p-4">
          <StudioToolbar />
        </div>

        {files.length === 0 ? (
          <>
            <DropZone className="min-h-[min(55vh,32rem)] flex-1" />
            <StudioPrivacyStrip />
            {seo.dropHint ? (
              <p className="text-center text-sm text-muted-foreground">{seo.dropHint}</p>
            ) : null}
          </>
        ) : (
          <>
            {queueStatus ? (
              <p className="text-center font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                {queueStatus}
              </p>
            ) : null}

            <div className="lg:hidden">
              <div className="overflow-x-auto pb-1">
                <FileQueue />
              </div>
            </div>

            <div className="grid flex-1 gap-5 pb-24 lg:grid-cols-[240px_1fr_320px] lg:pb-0">
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

            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/50 bg-background/90 px-4 py-3 backdrop-blur-xl lg:hidden">
              <div className="mx-auto flex max-w-7xl items-center gap-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="h-10 gap-2">
                      <SlidersHorizontal className="size-4" />
                      Settings
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="bottom"
                    className="max-h-[85vh] overflow-y-auto border-border/50 bg-background/95 backdrop-blur-xl"
                  >
                    <SheetHeader>
                      <SheetTitle>Settings</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4 pb-8">
                      <SettingsPanel />
                    </div>
                  </SheetContent>
                </Sheet>

                {isProcessing ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-10 flex-1 gap-2"
                    onClick={() => cancelProcessing()}
                  >
                    <Square className="size-4 fill-current" />
                    Cancel
                  </Button>
                ) : pendingCount > 0 ? (
                  <Button
                    size="sm"
                    className="h-10 flex-1 gap-2"
                    onClick={() => void processAll()}
                    disabled={!canProcess}
                  >
                    <Play className="size-4" />
                    Re-process ({pendingCount})
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="h-10 flex-1 gap-2"
                    onClick={() => void handleMobileDownload()}
                    disabled={!canDownload}
                  >
                    <Download className="size-4" />
                    Download ({doneCount})
                  </Button>
                )}

                {pendingCount > 0 && canDownload ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-10 gap-2"
                    onClick={() => void handleMobileDownload()}
                    disabled={!canDownload}
                  >
                    <Download className="size-4" />
                    {doneCount}
                  </Button>
                ) : null}
              </div>
            </div>
          </>
        )}

        <StudioSeoSection content={seo} />
      </main>
      <ShortcutCheatsheet />
    </>
  )
}

function StudioPrivacyStrip() {
  return (
    <p className="mx-auto max-w-2xl text-center font-mono text-[11px] leading-relaxed text-muted-foreground">
      Files never uploaded · 100% client-side · I cannot see your photos ·{' '}
      <Link to="/privacy" className="text-primary/90 underline-offset-2 hover:underline">
        Privacy policy
      </Link>
      <Lock className="ml-1 inline size-3 align-text-top text-primary/70" aria-hidden />
    </p>
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
