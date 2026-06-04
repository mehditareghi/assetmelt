import { DropZone } from '@/components/studio/drop-zone'
import { FileQueue } from '@/components/studio/file-queue'
import { PreviewPanel } from '@/components/studio/preview-panel'
import { SettingsPanel } from '@/components/studio/settings-panel'
import { StudioToolbar } from '@/components/studio/studio-toolbar'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { SlidersHorizontal } from 'lucide-react'
import { useStudioStore } from '@/stores/studio-store'
import { useEffect } from 'react'
import { warmUpWorker } from '@/lib/image/worker-bridge'

export function StudioPage() {
  const files = useStudioStore((s) => s.files)
  const undo = useStudioStore((s) => s.undo)
  const redo = useStudioStore((s) => s.redo)

  useEffect(() => {
    warmUpWorker()
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'z') return
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
        <div className="glass-surface rounded-2xl p-3 sm:p-4">
          <StudioToolbar />
        </div>

        {files.length === 0 ? (
          <DropZone />
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

              <section className="min-w-0">
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
                  <Button size="lg" className="size-14 rounded-full shadow-lg shadow-primary/20">
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

        {files.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            Or pick a preset and start — defaults to Web Optimized (WebP, max 1920px)
          </p>
        )}
      </main>
    </>
  )
}
