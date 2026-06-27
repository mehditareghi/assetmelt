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
import { buildFaqJsonLd, buildSeoHead } from '@/lib/seo'
import { SITE_URL } from '@/lib/site'
import { useStudioStore } from '@/stores/studio-store'
import { createFileRoute } from '@tanstack/react-router'
import { SlidersHorizontal } from 'lucide-react'
import { useEffect } from 'react'

const STUDIO_DESCRIPTION =
  'Compress, convert, resize, and crop images entirely in your browser. Batch processing, size budget encoding, platform presets, and Squoosh-grade codecs — no uploads, no accounts.'

const STUDIO_FAQ = [
  {
    question: 'Does Asset Melt upload my images to a server?',
    answer:
      'No. Every operation — compression, conversion, resizing, and cropping — runs entirely inside your browser using WebAssembly. Your files never leave your device.',
  },
  {
    question: 'Which image formats does the Studio support?',
    answer:
      'You can open JPEG, PNG, WebP, AVIF, GIF, TIFF, BMP, and HEIC/HEIF files. For output you can choose JPEG, PNG, WebP, or AVIF — the modern formats that deliver the smallest file sizes.',
  },
  {
    question: 'Can I compress multiple images at once?',
    answer:
      'Yes. Drag and drop as many files as you like (or paste from clipboard) and the Studio processes them all in parallel. You can download each result individually or grab a ZIP of everything.',
  },
  {
    question: 'What is "size budget" encoding?',
    answer:
      'Size budget lets you set a target file size (e.g. 100 KB) and the Studio automatically finds the highest quality that still fits within that limit. Useful when an upload form has a strict size cap.',
  },
  {
    question: 'How does Asset Melt compare to Squoosh?',
    answer:
      'Asset Melt uses the same Squoosh-grade codecs (libavif, MozJPEG, WebP) but adds batch processing, platform presets, size-budget encoding, and a non-destructive crop — features that Squoosh lacks.',
  },
  {
    question: 'Is Asset Melt Studio free?',
    answer:
      'Completely free, with no account required. There are no watermarks, no file-count limits, and no premium tier — the full feature set is available to everyone.',
  },
  {
    question: 'Can I use the Studio offline?',
    answer:
      'Yes. After your first visit the Studio installs as a Progressive Web App. You can add it to your home screen or desktop and open it with no internet connection.',
  },
]

export const Route = createFileRoute("/studio")({
  head: () =>
    buildSeoHead({
      title: 'Studio — Compress & Convert Images in Your Browser | Asset Melt',
      description: STUDIO_DESCRIPTION,
      path: '/studio',
      llmDiscovery: true,
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebApplication',
            '@id': `${SITE_URL}/studio#app`,
            name: 'Asset Melt Studio',
            url: `${SITE_URL}/studio`,
            applicationCategory: 'MultimediaApplication',
            operatingSystem: 'Any',
            description: STUDIO_DESCRIPTION,
            isAccessibleForFree: true,
            keywords:
              'image compressor, image converter, browser, client-side, AVIF, WebP, HEIC, batch, free',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
            },
          },
          buildFaqJsonLd(STUDIO_FAQ, `${SITE_URL}/studio#faq`),
        ],
      },
    }),
  component: Studio,
});

function Studio() {
  const files = useStudioStore((s) => s.files);
  const addFiles = useStudioStore((s) => s.addFiles);
  const undo = useStudioStore((s) => s.undo);
  const redo = useStudioStore((s) => s.redo);
  const offlinePrep = useOptionalOfflinePrepContext();
  const hideOfflinePanels = offlinePrep?.offlineStudioChrome ?? false;

  useEffect(() => {
    warmUpWorker();
  }, []);

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      if (isEditablePasteTarget(event.target)) return;
      const pasted = filesFromClipboardEvent(event);
      if (pasted.length === 0) return;
      event.preventDefault();
      void addFiles(pasted);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [addFiles]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "z")
        return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return;
      }
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo]);
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
              Or pick a preset and start — defaults to Web Optimized (WebP, max
              1920px)
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

        <StudioSeoSection />
      </main>
    </>
  );
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
        <span key={label} className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
          <Icon className="size-3 shrink-0 text-primary" aria-hidden="true" />
          {label}
        </span>
      ))}
    </div>
  )
}

function StudioSeoSection() {
  return (
    <section className="mx-auto w-full max-w-3xl space-y-12 py-8">
      <div className="glass-surface rounded-2xl p-6 sm:p-8">
        <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
          Free image compressor & converter — right in your browser
        </h2>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            Asset Melt Studio is a client-side image processing tool that runs entirely in your
            browser. There are no uploads, no accounts, and no file-size limits imposed by a server
            — just drag in your images and get optimised results in seconds.
          </p>
          <p>
            The Studio supports all common formats including JPEG, PNG, WebP, AVIF, and HEIC. You
            can compress images to a specific quality level or target file size, convert between
            formats, resize to exact pixel dimensions, and crop non-destructively. Batch processing
            means you can handle dozens of images in a single session.
          </p>
          <p>
            Under the hood the Studio uses the same codec libraries as Google's Squoosh — MozJPEG,
            libavif, and the official WebP encoder — compiled to WebAssembly so they run at near-native
            speed without any server involvement. Your files stay on your device at all times.
          </p>
        </div>
      </div>

      <div id="faq" className="scroll-mt-24">
        <h2 className="mb-6 font-display text-xl font-bold tracking-tight sm:text-2xl">
          Frequently asked questions
        </h2>
        <div className="glass-surface rounded-2xl px-5 sm:px-6">
          <Accordion type="single" collapsible className="w-full">
            {STUDIO_FAQ.map((item, i) => (
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
