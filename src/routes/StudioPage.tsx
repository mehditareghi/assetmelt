import { SiteHeader } from '@/components/layout/site-header'
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

  useEffect(() => {
    warmUpWorker()
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader variant="studio" />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <StudioToolbar />

        {files.length === 0 ? (
          <DropZone />
        ) : (
          <>
            {/* Mobile: horizontal file queue */}
            <div className="lg:hidden">
              <div className="flex gap-2 overflow-x-auto pb-2">
                <FileQueue />
              </div>
            </div>

            <div className="grid flex-1 gap-6 lg:grid-cols-[240px_1fr_320px]">
              {/* Desktop file queue */}
              <aside className="hidden lg:block">
                <FileQueue />
              </aside>

              <section className="min-w-0">
                <PreviewPanel />
              </section>

              {/* Desktop settings */}
              <aside className="hidden lg:block">
                <div className="sticky top-20 rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm">
                  <h3 className="mb-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Settings
                  </h3>
                  <SettingsPanel />
                </div>
              </aside>
            </div>

            {/* Mobile settings sheet */}
            <div className="fixed bottom-6 right-6 lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button size="lg" className="size-14 rounded-full shadow-lg">
                    <SlidersHorizontal className="size-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
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
    </div>
  )
}
