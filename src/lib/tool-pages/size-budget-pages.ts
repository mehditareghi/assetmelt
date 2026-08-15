import type { ToolPageContent } from '@/lib/tool-pages/types'
import {
  OPEN_LIMITATIONS,
  TIFF_FIRST_PAGE_COPY,
  sizeBudgetInputLimitsCopy,
} from '@/lib/named-limitations'
import {
  canonicalBudgetParam,
  SIZE_BUDGET_LANDING_KB,
  sizeBudgetLandingPath,
  type SizeBudgetLandingKb,
} from '@/lib/studio-budget'

export type SizeBudgetToolPageId = `compress-under-${SizeBudgetLandingKb}kb`

const SIBLING_IDS: Record<SizeBudgetLandingKb, SizeBudgetToolPageId[]> = {
  50: ['compress-under-100kb', 'compress-under-200kb'],
  100: ['compress-under-50kb', 'compress-under-200kb'],
  200: ['compress-under-50kb', 'compress-under-100kb'],
}

const PAGE_COPY: Record<
  SizeBudgetLandingKb,
  Omit<ToolPageContent, 'id' | 'path' | 'relatedTools' | 'studioSearch'>
> = {
  50: {
    title: 'Compress Image Under 50 KB — Free Size-Budget Encoder | Asset Melt',
    metaDescription:
      'Shrink a photo under 50 KB in your browser. Free size-budget encoding for email, Slack, and tiny CMS caps. JPEG, WebP, AVIF, or JXL — no uploads.',
    eyebrow: '50 KB budget',
    heroBadge: 'Size budget · 50 KB',
    h1: 'Compress images under 50 KB',
    h1Accent: 'without guessing quality',
    heroDescription:
      'Email, Slack, and some CMS fields still cap files at 50 KB. Open Studio with a 50 KB size budget already on — Asset Melt searches quality (and resizes only if it must) until the file fits. 100% client-side.',
    benefits: [
      {
        icon: 'target',
        title: 'Budget is already on',
        description:
          'The Studio opens with a 50 KB cap enabled. Drop a file and process — no hunting for the size-budget toggle.',
      },
      {
        icon: 'gauge',
        title: 'Highest quality that fits',
        description:
          'Binary-search quality on JPEG, WebP, AVIF, or JPEG XL. Resize is allowed when quality alone cannot hit 50 KB.',
      },
      {
        icon: 'folder',
        title: 'Batch the same cap',
        description:
          'Queue a folder. Each file is encoded to the 50 KB budget on its own, then downloaded as a ZIP.',
      },
      {
        icon: 'shield',
        title: 'Nothing is uploaded',
        description:
          'Encoding runs in Web Workers on your device. Photos are not sent to a server, and session replay does not include image pixels.',
      },
    ],
    steps: [
      {
        title: 'Open Studio at 50 KB',
        description:
          'This page deep-links Studio with size budget on and the target set to 50 KB.',
      },
      {
        title: 'Drop images',
        description:
          'Add JPEG, PNG, WebP, AVIF, HEIC, or a folder. Nested images are queued; non-images are skipped.',
      },
      {
        title: 'Process and download',
        description:
          'Compare before/after. If 50 KB is met, you will see it on the preview. Download one file or a ZIP.',
      },
    ],
    contentSections: [
      {
        heading: 'When 50 KB is the real constraint',
        paragraphs: [
          'Fifty kilobytes is a thumbnail and attachment budget, not a hero-image budget. Profile photos, email signatures, Slack-adjacent assets, and older CMS “tiny image” fields still enforce it.',
          'A 2400px photo will not look like the original at 50 KB. Resize to the real display size first — Studio will also scale down if quality search cannot land under the cap.',
        ],
      },
      {
        heading: 'What size-budget encoding actually does',
        paragraphs: [
          'Asset Melt binary-searches encode quality for JPEG (MozJPEG), WebP, AVIF, and JPEG XL, then scales the bitmap only if the smallest useful quality is still over budget.',
          'Need a looser cap? Use the 100 KB or 200 KB pages. Need a walkthrough? The under-100 KB guide covers resize-then-encode order in more detail.',
        ],
      },
    ],
    faq: [
      {
        question: 'Will every photo fit under 50 KB?',
        answer:
          'No. Detailed photos may need a much smaller pixel size, or they will look damaged. Studio reports whether the budget was met or only the closest match.',
      },
      {
        question: 'Are my images uploaded?',
        answer:
          'No. Image processing is 100% client-side. Photos are not uploaded, I cannot see them, and sampled session replay does not include image pixels. Site telemetry is listed on the privacy policy.',
      },
      {
        question: 'Can I batch files under 50 KB?',
        answer:
          'Yes. Drop multiple files or a folder. Each image is encoded to the same 50 KB budget. Download a ZIP when the queue is done.',
      },
    ],
    keywords:
      'compress image under 50kb, reduce image to 50kb, 50kb image compressor, email image size, shrink photo 50kb',
    breadcrumbLabel: 'Under 50 KB',
    ctaLabel: 'Open Studio — under 50 KB',
  },
  100: {
    title: 'Compress Image Under 100 KB — Free Size-Budget Encoder | Asset Melt',
    metaDescription:
      'Compress images under 100 KB in your browser. Free size-budget encoding for cards, thumbnails, and article images. JPEG, WebP, AVIF, or JXL — no uploads.',
    eyebrow: '100 KB budget',
    heroBadge: 'Size budget · 100 KB',
    h1: 'Compress images under 100 KB',
    h1Accent: 'highest quality that still fits',
    heroDescription:
      'A 100 KB cap is the usual ask for cards, thumbnails, and inline article images. This page opens Studio with size-budget encoding already set to 100 KB — quality search, resize only if needed, files never leave your device.',
    benefits: [
      {
        icon: 'target',
        title: '100 KB, already armed',
        description:
          'Skip the settings hunt. Studio loads with size budget on and the target at 100 KB (the same default the encoder uses).',
      },
      {
        icon: 'sparkles',
        title: 'Quality search, not guesswork',
        description:
          'MozJPEG, WebP, AVIF, or JPEG XL: Asset Melt finds the highest quality that stays under 100 KB instead of you exporting ten times.',
      },
      {
        icon: 'layers',
        title: 'One cap for the whole folder',
        description:
          'Batch encode every file to 100 KB, compare before/after, and download a ZIP. Queue order is the ZIP order.',
      },
      {
        icon: 'lock',
        title: 'Client-side only',
        description:
          'No upload endpoint. Photos stay on your machine. Session replay is UI-only and does not include image pixels.',
      },
    ],
    steps: [
      {
        title: 'Open Studio at 100 KB',
        description:
          'The button below sends you to Studio with ?budget=100kb. Size budget turns on after settings hydrate, even if you had a previous pipeline saved.',
      },
      {
        title: 'Add files or a folder',
        description:
          'Drop images, paste, or pick files. Nested folder drops queue supported images and skip the rest.',
      },
      {
        title: 'Process, check, download',
        description:
          'The preview shows whether the 100 KB target was met. Download one result or the whole queue as a ZIP.',
      },
    ],
    contentSections: [
      {
        heading: 'Why people search “image under 100 KB”',
        paragraphs: [
          'Upload forms, LMS fields, and older CDNs still advertise a 100 KB limit. The wrong move is dragging a quality slider until the file explorer says 98 KB and the photo looks sandy. The right move is resize to display size, pick a modern codec, then let a size budget search quality.',
          'Asset Melt does that last step locally. 100 KB is also the Studio default target — this landing page just turns the budget on so you do not have to.',
        ],
      },
      {
        heading: '100 KB is not for every hero',
        paragraphs: [
          'A crisp 180 KB AVIF hero can beat a crushed 95 KB file on LCP and on brand. Use 100 KB for repeated content images, cards, and thumbnails. For product shots and Open Graph, the 200 KB page is usually kinder.',
        ],
      },
    ],
    faq: [
      {
        question: 'Can every image be compressed under 100 KB?',
        answer:
          'No. Large, detailed photos may need a smaller pixel size or they will look damaged. Studio shows whether the budget was met or only the closest match.',
      },
      {
        question: 'What format is best for under 100 KB?',
        answer:
          'AVIF is often smallest for photos, WebP is the reliable default (and what this page keeps unless you change it), JPEG still wins on compatibility.',
      },
      {
        question: 'Does this upload my photos?',
        answer:
          'No. Processing is 100% client-side. Photos are not uploaded, I cannot see them, and session replay does not include image pixels. Details are on the privacy policy.',
      },
      {
        question: 'Can I use a different cap after I open Studio?',
        answer:
          'Yes. Change Max file size in Format settings, or start from the 50 KB or 200 KB pages instead. Copy a recipe link if you want to reuse the pipeline — it never includes the image.',
      },
    ],
    keywords:
      'compress image under 100kb, reduce image size under 100kb, image under 100kb, 100kb compressor, compress photo to 100kb',
    breadcrumbLabel: 'Under 100 KB',
    ctaLabel: 'Open Studio — under 100 KB',
  },
  200: {
    title: 'Compress Image Under 200 KB — Free Size-Budget Encoder | Asset Melt',
    metaDescription:
      'Compress images under 200 KB in your browser. Free size-budget encoding for product photos, blog images, and social previews. JPEG, WebP, AVIF, or JXL — no uploads.',
    eyebrow: '200 KB budget',
    heroBadge: 'Size budget · 200 KB',
    h1: 'Compress images under 200 KB',
    h1Accent: 'room for product and blog photos',
    heroDescription:
      'Two hundred kilobytes is the usual cap for product shots, blog figures, and many social preview fields. Open Studio with a 200 KB size budget already on — highest quality that fits, resize only when it has to, nothing uploaded.',
    benefits: [
      {
        icon: 'target',
        title: '200 KB from the first click',
        description:
          'Studio opens with size budget enabled at 200 KB. Drop a catalog folder and encode every file to the same cap.',
      },
      {
        icon: 'image',
        title: 'Less crushing than 50 or 100 KB',
        description:
          'Quality search still runs, but 200 KB leaves more room for texture, type in screenshots, and wider blog images.',
      },
      {
        icon: 'refresh',
        title: 'WebP, AVIF, JPEG, or JXL',
        description:
          'Switch codecs after you land. Size budget follows the active lossy format.',
      },
      {
        icon: 'shield',
        title: 'Local encode',
        description:
          'WebAssembly codecs run in your browser. Photos are not uploaded; session replay does not record image pixels.',
      },
    ],
    steps: [
      {
        title: 'Open Studio at 200 KB',
        description:
          'This page sets ?budget=200kb. After Studio hydrates, size budget is on and allow-resize is on so stubborn files can still land under the cap.',
      },
      {
        title: 'Queue the batch',
        description:
          'Drop files or a folder. Nested images are queued; non-images are skipped.',
      },
      {
        title: 'Export',
        description:
          'Check the size-budget readout on the preview, then download individually or as a ZIP that keeps folder paths.',
      },
    ],
    contentSections: [
      {
        heading: '200 KB for photos that still have to sell',
        paragraphs: [
          'Product grids, case-study figures, and many Open Graph fields sit around a 200 KB ceiling. That is tight for a 2400px original and comfortable for a 1200px WebP or AVIF. Resize to the layout width, then let the budget search quality.',
          'If a platform wants 50 KB or 100 KB instead, use those pages — they are the same encoder with a stricter cap.',
        ],
      },
    ],
    faq: [
      {
        question: 'Is 200 KB enough for a blog hero?',
        answer:
          'Often yes at 1200–1600px in AVIF or WebP. If the image is the LCP element and looks damaged, raise the budget in Studio or serve a larger file — Core Web Vitals care about a sharp image as much as bytes.',
      },
      {
        question: 'Are files uploaded to hit the budget?',
        answer:
          'No. Binary-search encode runs in Web Workers on your machine. Photos are not uploaded, I cannot see them, and session replay does not include image pixels.',
      },
      {
        question: 'Can I keep JPEG for compatibility?',
        answer:
          'Yes. After Studio opens, set output to JPEG. Size budget still applies to MozJPEG. The landing page does not force AVIF.',
      },
    ],
    keywords:
      'compress image under 200kb, reduce image to 200kb, 200kb jpeg, image size budget 200kb, compress photo under 200kb',
    breadcrumbLabel: 'Under 200 KB',
    ctaLabel: 'Open Studio — under 200 KB',
  },
}

function buildSizeBudgetPage(kb: SizeBudgetLandingKb): ToolPageContent {
  const id: SizeBudgetToolPageId = `compress-under-${kb}kb`
  const copy = PAGE_COPY[kb]
  const png = OPEN_LIMITATIONS['5.5']
  return {
    id,
    path: sizeBudgetLandingPath(kb),
    ...copy,
    steps: copy.steps.map((step, index) =>
      index === 1
        ? { ...step, description: `${step.description} ${sizeBudgetInputLimitsCopy()}` }
        : step,
    ),
    contentSections: [
      ...copy.contentSections,
      {
        heading: 'Honest limits',
        paragraphs: [
          png.copy,
          `${OPEN_LIMITATIONS['4.3'].copy} ${OPEN_LIMITATIONS['4.4'].copy} ${TIFF_FIRST_PAGE_COPY}`,
        ],
      },
    ],
    faq: [
      ...copy.faq,
      { question: png.faqQuestion, answer: png.faqAnswer },
    ],
    relatedTools: [...SIBLING_IDS[kb], 'batch-image-compressor'],
    studioSearch: { budget: canonicalBudgetParam(kb) },
  }
}

export const SIZE_BUDGET_TOOL_PAGES = Object.fromEntries(
  SIZE_BUDGET_LANDING_KB.map((kb) => {
    const page = buildSizeBudgetPage(kb)
    return [page.id, page]
  }),
) as Record<SizeBudgetToolPageId, ToolPageContent>
