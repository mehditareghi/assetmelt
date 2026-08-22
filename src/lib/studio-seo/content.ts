import { SITE_URL } from '@/lib/site'
import { OPEN_LIMITATIONS, TIFF_FIRST_PAGE_COPY } from '@/lib/named-limitations'
import {
  formatLabel,
  formatLabelLong,
  type StudioInputIntent,
  type StudioOutputIntent,
} from '@/lib/studio-seo/formats'
import {
  pairLinkLabel,
  relatedPairsFor,
  type StudioFormatPair,
} from '@/lib/studio-seo/pairs'
import {
  canonicalStudioPath,
  buildStudioPath,
  resolveStudioSeoMode,
  studioSearchFromPair,
  studioSearchIntents,
  type StudioSearch,
} from '@/lib/studio-seo/search'
import {
  PRIVACY_SNIPPET,
  codecBlurb,
  pairKeyword,
  pairPhrase,
  sceneFor,
  sharedPairFaq,
  sharedTargetFaq,
  targetKeyword,
} from '@/lib/studio-seo/copy'
import { getPairGuide } from '@/lib/studio-seo/pair-guides'
import { TARGET_GUIDES } from '@/lib/studio-seo/target-guides'
import type {
  StudioFaqItem,
  StudioSeoBeforeAfter,
  StudioSeoContent,
  StudioSeoSection,
  StudioSeoStep,
  StudioSeoTable,
} from '@/lib/studio-seo/types'

export type {
  StudioFaqItem,
  StudioSeoBeforeAfter,
  StudioSeoContent,
  StudioSeoSection,
  StudioSeoStep,
  StudioSeoTable,
} from '@/lib/studio-seo/types'

const DEFAULT_DESCRIPTION =
  'Compress, convert, resize, and crop images entirely in your browser. Batch processing, size budget encoding, platform presets, and Squoosh-grade codecs — no uploads, no accounts.'

const DEFAULT_FAQ: StudioFaqItem[] = [
  {
    question: 'Does Asset Melt upload my images to a server?',
    answer:
      'No. Image processing is 100% client-side in your browser with WebAssembly. Your photos are not uploaded, I cannot see or recover them, and sampled session replay does not include image pixels (media is blocked). The site still sends usage analytics, crash reports, and a sample of UI-only session replay — details are on the privacy page.',
  },
  {
    question: 'Which image formats does the Studio support?',
    answer:
      'You can open JPEG, PNG, WebP, AVIF, GIF (first frame), TIFF (first page), BMP, SVG, HEIC/HEIF, JPEG XL, and QOI. For output you can choose JPEG (MozJPEG), PNG (Oxipng, optional Reduce palette), WebP, AVIF, JPEG XL, or QOI. HEIC/HEIF is decoded through a high-quality JPEG (quality 0.92) before the rest of the pipeline, so HEIC→PNG is not a lossless round-trip from the original file.',
  },
  {
    question: 'Can I make PNGs as small as TinyPNG?',
    answer:
      'Yes. PNG is lossless Oxipng unless you turn on Reduce palette in Format settings. That quantizes to 2–256 colors with dither (lossy PNG-8), then Oxipng — the same trick TinyPNG and Squoosh Reduce Palette use. Best for logos and icons. Size budget can also binary-search palette colors for PNG; QOI is skipped.',
  },
  {
    question: 'Can I compress multiple images at once?',
    answer:
      'Yes. Drag and drop files or a folder (nested images are queued; other files are skipped), click to choose images, or paste from the clipboard. Drops still work after the queue already has images, including while a batch is encoding. Drag queue rows to reorder; a batch ZIP follows that list for this session (files are not saved across reloads). The Studio encodes in parallel on a worker pool sized to your CPU (up to 4), with live per-file progress, Pause, and Cancel. Pause lets in-flight files finish so you can download what is ready. Optional “ZIP every 25 files” (Pipeline options) packs numbered ZIPs during encode; Download saves every part with a ZIP 1/N progress state on the button and drops result blobs to ease tab memory — there is still no 20-image cap; very large batches depend on device RAM. Download each result or a ZIP — folder trees keep relative paths like products/a/hero.webp.',
  },
  {
    question: 'What is "size budget" encoding?',
    answer:
      'Size budget lets you set a target file size (e.g. 100 KB) and the Studio automatically finds the highest quality that still fits within that limit. Dedicated entry pages at /compress/under-50kb, /compress/under-100kb, and /compress/under-200kb open Studio with the budget already on. JPEG, WebP, AVIF, JPEG XL, and PNG (palette color search) are supported; QOI is skipped. Useful when an upload form has a strict size cap.',
  },
  {
    question: 'How does Asset Melt compare to Squoosh?',
    answer:
      'Asset Melt uses the same Squoosh-grade codecs (libavif, MozJPEG, WebP) but adds batch processing, platform presets, size-budget encoding, shareable recipe URLs, and a non-destructive crop — features that Squoosh lacks.',
  },
  {
    question: 'Is Asset Melt Studio free?',
    answer:
      'Completely free, with no account required. There are no watermarks, no file-count limits, and no premium tier — the full feature set is available to everyone.',
  },
  {
    question: 'Can I use the Studio offline?',
    answer:
      'Not automatically. Install the app if you want, then download the optional offline pack from the Studio while you are online. After that, Studio can run without a network connection.',
  },
  {
    question: 'Are there keyboard shortcuts?',
    answer:
      'Yes. Press ? in the Studio for the cheatsheet. Process the queue with Cmd/Ctrl+Enter, download with Cmd/Ctrl+S, open recipes with Cmd/Ctrl+K, and undo with Cmd/Ctrl+Z. Paste still adds images when you are not typing in a field.',
  },
  {
    question: 'Can I customize output filenames?',
    answer:
      'Yes. The filename pattern field accepts {name}, {ext}, {width}, {height}, {quality}, and {date} (local YYYY-MM-DD). The same tokens apply to ZIP downloads and platform-kit files. {quality} is the encode quality used — including size-budget results — and stays blank for PNG and QOI.',
  },
  {
    question: 'Can I see EXIF before stripping metadata?',
    answer:
      'Yes. Format → Metadata shows camera, capture date, and GPS from the source file (HEIC is read before the JPEG bounce). Keep on JPEG, WebP, or PNG warns if the photo has GPS. Strip GPS removes location and keeps camera/ICC. AVIF, JXL, and QOI always export pixels only. Inspection is local — tags are not uploaded.',
  },
  {
    question: 'Can I share my Studio settings?',
    answer:
      'Yes. Copy the recipe link from the Studio toolbar. It stores the pipeline (preset or compact settings) in ?recipe= — photos never go in the URL. Opening the link restores those settings on this device.',
  },
  {
    question: 'Can I export AVIF, WebP, and JPEG in one run?',
    answer:
      'Yes. Under Format → Also export, toggle extra codecs (AVIF, WebP, and optional JPEG fallback). Process once; download is a ZIP with folders like avif/, webp/, jpeg/. One image in the queue → name-formats.zip; several images → one batch ZIP (or numbered parts if ZIP every 25 files is on). JPEG fallback flattens transparency. Unavailable while a platform kit (favicon, App Store, newsletter) is active.',
  },
  {
    question: 'Can I export responsive widths and copy <picture> / next/image code?',
    answer:
      'Yes. Open Responsive export from the Studio overflow menu (⋯) or the quiet link under the preview. It encodes the current file at multiple widths × formats into a ZIP with folders named by width, and lets you copy <picture> HTML or a next/image snippet. Normal Download stays a single output — this kit is optional.',
  },
  {
    question: 'What is in the favicon kit?',
    answer:
      'The Favicon kit recipe exports PNG icons at 16, 32, 180 (apple-touch), and 512 px, plus a classic multi-size favicon.ico (16+32+48 embedded). Everything lands in one ZIP.',
  },
  {
    question: 'Can I export X cards, App Store screenshots, or newsletter images?',
    answer:
      'Yes. Fit to size includes an X card (1200×600, 2:1), a newsletter kit (600px-wide JPEG plus a 1200px 2× sibling), and an App Store screenshot kit (portrait iPhone 6.9" 1320×2868 and iPad 13" 2064×2752 in one ZIP). App Store is portrait only; Apple also accepts other 6.9" pixel sizes. The iPad size uses a centered 3:4 crop from the source, not the iPhone crop you edited.',
  },
]

function buildRelated(from?: StudioInputIntent, to?: StudioOutputIntent) {
  return relatedPairsFor(from, to, 6).map((pair) => ({
    label: pairLinkLabel(pair),
    path: buildStudioPath(studioSearchFromPair(pair)),
  }))
}

function dropHintFor(search: StudioSearch): string | null {
  const { from, to } = studioSearchIntents(search)
  if (from && to) {
    return `Pipeline ready: ${formatLabel(from)} → ${formatLabel(to)} (any input still accepted)`
  }
  if (to) {
    return `Output pre-selected: ${formatLabel(to)} — drop any supported image`
  }
  if (from) {
    return `Tip: drop ${formatLabel(from)} files — or any other supported format`
  }
  return null
}

function pairSteps(from: StudioInputIntent, to: StudioOutputIntent): StudioSeoStep[] {
  const phrase = pairPhrase(from, to)
  const fromLabel = formatLabel(from)
  const toLabel = formatLabel(to)
  return [
    {
      title: `Open this ${phrase} page`,
      description: `You are already on the ${phrase} converter. Output is pre-selected as ${toLabel}. You can still drop mixed formats — the ${phrase} URL is a starting point, not a file-type lock.`,
    },
    {
      title: `Drop ${fromLabel} files (or a folder)`,
      description: `Drag ${fromLabel} images onto the studio, click to choose, or paste. Folder drops queue nested images. Then process — ${phrase} encoding runs in Web Workers on this device.`,
    },
    {
      title: `Preview, tweak, download`,
      description: `Use the before/after scrubber until the ${phrase} result looks right. Adjust quality, crop, or resize, then download one ${toLabel} or a ZIP of the batch.`,
    },
  ]
}

function targetSteps(to: StudioOutputIntent): StudioSeoStep[] {
  const keyword = targetKeyword(to)
  const toLabel = formatLabel(to)
  return [
    {
      title: `Stay on convert to ${toLabel}`,
      description: `This page already set output to ${toLabel}. You can ${keyword} from JPEG, PNG, WebP, AVIF, HEIC, GIF, TIFF, BMP, SVG, and more in one queue.`,
    },
    {
      title: 'Drop a mixed batch',
      description: `Add files or a folder. When you ${keyword}, decode and encode stay in the browser — nothing is uploaded.`,
    },
    {
      title: `Download ${toLabel}`,
      description: `Scrub quality, optionally set a size budget (JPEG, WebP, AVIF, JXL, PNG palette search), then download one file or a ZIP after you ${keyword}.`,
    },
  ]
}

function pairContent(pair: StudioFormatPair): Omit<
  StudioSeoContent,
  'mode' | 'canonicalPath' | 'indexable' | 'related' | 'dropHint'
> {
  const guide = getPairGuide(pair.from, pair.to)
  if (!guide) {
    throw new Error(`Missing pair guide for ${pair.from}->${pair.to}`)
  }

  const fromLabel = formatLabel(pair.from)
  const toLabel = formatLabel(pair.to)
  const fromLong = formatLabelLong(pair.from)
  const toLong = formatLabelLong(pair.to)
  const phrase = pairPhrase(pair.from, pair.to)
  const keyword = pairKeyword(pair.from, pair.to)

  const beforeAfter: StudioSeoBeforeAfter = {
    heading: `Typical ${phrase} result`,
    scene: guide.beforeAfter.scene ?? sceneFor(pair.from),
    scenario: guide.beforeAfter.scenario,
    caption: guide.beforeAfter.caption,
    before: guide.beforeAfter.before,
    after: guide.beforeAfter.after,
    savings: guide.beforeAfter.savings,
  }

  const tables: StudioSeoTable[] = [
    {
      caption: `${phrase} at a glance`,
      headers: ['Topic', fromLabel, toLabel],
      rows: guide.comparisonRows.map((row) => [...row]),
    },
    {
      caption: `Typical ${phrase} file sizes`,
      headers: ['Source', 'Before', 'After', 'Note'],
      rows: guide.typicalRows.map((row) => [...row]),
    },
  ]

  const sections: StudioSeoSection[] = [
    {
      heading: `Why convert ${phrase}`,
      paragraphs: guide.why,
    },
    {
      heading: `How ${phrase} works in Asset Melt`,
      paragraphs: guide.howItWorks,
    },
    {
      heading: `When to use ${phrase} (and when not to)`,
      paragraphs: guide.whenToUse,
    },
    {
      heading: `${phrase} quality and settings`,
      paragraphs: [guide.qualityNote, ...guide.settingsTips],
    },
    {
      heading: `Privacy while you convert ${phrase}`,
      paragraphs: [
        `${PRIVACY_SNIPPET} That includes every ${phrase} job — the converter never needs your files on a server.`,
        `Upload compressors send your bitmap to someone else’s API. Asset Melt keeps ${keyword} on this device. Session replay, if sampled, is UI-only and does not include image pixels.`,
      ],
    },
  ]

  return {
    title: `Convert ${phrase} Online — Free, No Upload | Asset Melt`,
    description: `Convert ${phrase} in your browser. ${guide.hook} Free ${keyword} converter, private, batch ZIP — ${fromLong} files never leave your device.`,
    h2: `Free ${phrase} converter in your browser`,
    paragraphs: [
      `Asset Melt Studio is a ${phrase} converter that runs entirely on your device. ${guide.hook}`,
      `Drop one ${fromLabel} or a whole folder — the pipeline is already set to ${toLabel} using ${codecBlurb(pair.to)}. That is the ${phrase} workflow people search for: convert ${phrase} without an upload, then resize, crop, or hit a size budget (when the codec allows) before you download.`,
      `Input is not locked to ${fromLabel}: you can still open JPEG, PNG, WebP, AVIF, HEIC, GIF, and more in the same session. The ${phrase} URL simply pre-selects ${toLong} so ${keyword} jobs start in one click.`,
    ],
    steps: pairSteps(pair.from, pair.to),
    beforeAfter,
    tables,
    sections,
    faq: [...sharedPairFaq(pair.from, pair.to), ...guide.extraFaq],
    keywords: `${keyword}, convert ${keyword}, ${keyword} converter, free ${fromLabel.toLowerCase()} converter, ${phrase}, no upload`,
  }
}

function targetContent(to: StudioOutputIntent): Omit<
  StudioSeoContent,
  'mode' | 'canonicalPath' | 'indexable' | 'related' | 'dropHint'
> {
  const guide = TARGET_GUIDES[to]
  const toLabel = formatLabel(to)
  const toLong = formatLabelLong(to)
  const keyword = targetKeyword(to)

  const beforeAfter: StudioSeoBeforeAfter = {
    heading: `Typical ${keyword} result`,
    scene: guide.beforeAfter.scene ?? 'photo',
    scenario: guide.beforeAfter.scenario,
    caption: guide.beforeAfter.caption,
    before: guide.beforeAfter.before,
    after: guide.beforeAfter.after,
    savings: guide.beforeAfter.savings,
  }

  const tables: StudioSeoTable[] = [
    {
      caption: `${keyword} at a glance`,
      headers: ['Topic', 'What you get', 'Note'],
      rows: guide.comparisonRows.map((row) => [...row]),
    },
    {
      caption: `Typical results when you ${keyword}`,
      headers: ['Source', 'Before', 'After', 'Note'],
      rows: guide.typicalRows.map((row) => [...row]),
    },
  ]

  const sections: StudioSeoSection[] = [
    {
      heading: `Why ${keyword}`,
      paragraphs: guide.why,
    },
    {
      heading: `How to ${keyword} in Asset Melt`,
      paragraphs: guide.howItWorks,
    },
    {
      heading: `When you should ${keyword}`,
      paragraphs: guide.whenToUse,
    },
    {
      heading: `Quality when you ${keyword}`,
      paragraphs: [guide.qualityNote, ...guide.settingsTips],
    },
    {
      heading: `Privacy when you ${keyword}`,
      paragraphs: [
        `When you ${keyword}, ${PRIVACY_SNIPPET}`,
        `Convert to ${toLabel} never uploads the bitmap. GIF still uses the first frame only. TIFF uses the first page only. HEIC still uses the JPEG 0.92 bounce before you ${keyword}.`,
      ],
    },
  ]

  return {
    title: `Convert Images to ${toLabel} Online — Free Browser Converter | Asset Melt`,
    description: `${keyword.charAt(0).toUpperCase()}${keyword.slice(1)} in your browser. ${guide.hook} Free, no uploads, batch ZIP, Squoosh-grade WASM.`,
    h2: `Free convert-to-${toLabel} studio — any input welcome`,
    paragraphs: [
      `This Studio link pre-selects ${toLong} so you can ${keyword} immediately. ${guide.hook}`,
      `Bring JPEG, PNG, WebP, AVIF, HEIC, GIF, SVG, and more — input format is never blocked when you ${keyword}. Encoding uses ${codecBlurb(to)}.`,
      `Looking for a specific source format? Use deep links like PNG to ${toLabel} or HEIC to ${toLabel} for conversion-focused copy, or stay here when your batch is mixed and you still want to ${keyword}.`,
    ],
    steps: targetSteps(to),
    beforeAfter,
    tables,
    sections,
    faq: [...sharedTargetFaq(to), ...guide.extraFaq],
    keywords: `${keyword}, ${toLabel.toLowerCase()} converter, compress to ${toLabel.toLowerCase()}, free ${toLabel.toLowerCase()} encoder, no upload`,
  }
}

function defaultContent(): Omit<
  StudioSeoContent,
  'mode' | 'canonicalPath' | 'indexable' | 'related' | 'dropHint'
> {
  return {
    title: 'Studio — Compress & Convert Images in Your Browser | Asset Melt',
    description: DEFAULT_DESCRIPTION,
    h2: 'Free image compressor & converter — right in your browser',
    paragraphs: [
      'Asset Melt Studio is a client-side image compressor and converter that runs entirely in your browser. There are no uploads, no accounts, and no file-size limits imposed by a server — just drag in your images and get optimised results in seconds.',
      'The Studio supports JPEG, PNG, WebP, AVIF, HEIC, TIFF (first page), GIF (first frame), BMP, SVG, JPEG XL, and QOI. Compress images to a quality level or a size budget, convert between formats, resize to exact pixels, and crop non-destructively. Batch processing means dozens of files in one session.',
      'Under the hood the Studio uses the same codec libraries as Google Squoosh — MozJPEG, libavif, and the official WebP encoder — compiled to WebAssembly. Your files stay on your device; image bytes are never sent to a compression API.',
    ],
    steps: [
      {
        title: 'Drop images on the studio',
        description:
          'Drag files or a folder, click to choose, or paste. Nested images are queued. Processing is 100% client-side — photos are not uploaded.',
      },
      {
        title: 'Pick a format, budget, or preset',
        description:
          'WebP and AVIF for the web, MozJPEG for compatibility, Oxipng (optional Reduce palette) for graphics. Size budget searches quality or palette colors until the file fits — JPEG, WebP, AVIF, JPEG XL, and PNG (palette search).',
      },
      {
        title: 'Compare and download',
        description:
          'Scrub before/after, then download one file or a ZIP. Optional ZIP every 25 files eases memory. Folder trees keep relative paths.',
      },
    ],
    beforeAfter: {
      heading: 'Typical compression result',
      scene: 'photo',
      scenario: 'A mountain landscape compressed for a website hero — illustrative, not your file.',
      caption:
        'Illustrative sample only — your savings depend on the photo. Drop a file above to compress it on this device; nothing is uploaded.',
      before: { format: 'JPEG', size: '3.2 MB', note: 'Photo export' },
      after: { format: 'WebP', size: '390 KB', note: 'Quality ~80, ~1920px' },
      savings: '~88% smaller',
    },
    tables: [
      {
        caption: 'Which output format should I pick?',
        headers: ['Format', 'Best for', 'Alpha', 'Size budget'],
        rows: [
          ['WebP', 'Default web stills', 'Yes', 'Yes'],
          ['AVIF', 'Smallest modern heroes', 'Yes', 'Yes'],
          ['JPEG (MozJPEG)', 'Universal share / forms', 'No (flattens)', 'Yes'],
          ['PNG (Oxipng)', 'Logos, UI, lossless stills', 'Yes', 'Yes — palette color search'],
          ['JPEG XL', 'Next-gen trials', 'Yes', 'Yes'],
          ['QOI', 'Tooling, not websites', 'Yes', 'No'],
        ],
      },
      {
        caption: 'Typical web results (illustrative)',
        headers: ['Source', 'Before', 'After', 'Notes'],
        rows: [
          ['Landscape JPEG', '3–5 MB', 'WebP ~300–500 KB', 'Resize to ~1920px first'],
          ['Phone UI PNG', '1–3 MB', 'WebP/AVIF ~100–250 KB', 'Watch small text on AVIF'],
          ['Product / logo PNG', '20–80 KB', 'Palette PNG-8 or WebP', 'Turn on Reduce palette for flat art'],
          ['iPhone HEIC', '~2.5 MB', 'JPEG ~0.9 MB or WebP ~0.3 MB', OPEN_LIMITATIONS['4.3'].copy],
        ],
      },
    ],
    sections: [
      {
        heading: 'Why compress images in the browser?',
        paragraphs: [
          'Images are most of a page’s weight. Compressing them improves LCP, saves bandwidth, and keeps upload forms happy. An image compressor that never leaves the device also means Camera roll photos are not sitting on someone else’s disk.',
          'Asset Melt Studio runs Squoosh-grade WASM codecs in your browser, then adds the workflow pieces upload tools usually skip: batch ZIP, size budgets, HEIC input, platform kits, and a full crop/resize pipeline — with no account and no image upload.',
        ],
      },
      {
        heading: 'How the studio compresses (without a server)',
        paragraphs: [
          'Decode in a worker, optional crop/resize/filters, then encode with Squoosh-grade WASM. Live before/after is the same preview you will download.',
          `${OPEN_LIMITATIONS['4.4'].copy} ${TIFF_FIRST_PAGE_COPY} ${OPEN_LIMITATIONS['4.3'].copy}`,
          'For logos and flat graphics, Reduce palette (lossy PNG-8) then Oxipng, or turn on size budget for PNG. For photos with a hard KB cap, turn on size budget for JPEG, WebP, AVIF, or JPEG XL.',
        ],
      },
      {
        heading: 'Choosing quality (and when to use a size budget)',
        paragraphs: [
          'For web photos, quality 75–85 is the usual band. Below 60, artifacts show. For screenshots with text, stay higher or use PNG/WebP with care on AVIF.',
          'When a form says 100 KB, do not guess the slider — turn on size budget (or open /compress/under-100kb). QOI is skipped; PNG uses palette color search — best for flat graphics.',
        ],
      },
      {
        heading: 'Privacy',
        paragraphs: [
          PRIVACY_SNIPPET,
          'That is the difference versus upload compressors: the operator cannot see or recover your photos, because they never arrive.',
        ],
      },
    ],
    faq: DEFAULT_FAQ,
    keywords:
      'image compressor, image converter, browser, client-side, AVIF, WebP, HEIC, batch, free, TinyPNG alternative, compress JPEG',
  }
}

export function buildStudioSeoContent(search: StudioSearch = {}): StudioSeoContent {
  const mode = resolveStudioSeoMode(search)
  const canonicalPath = canonicalStudioPath(search)
  const intents = studioSearchIntents(search)

  if (mode.kind === 'pair') {
    const base = pairContent(mode.pair)
    return {
      ...base,
      mode,
      canonicalPath,
      indexable: true,
      related: buildRelated(mode.from, mode.to),
      dropHint: dropHintFor(search),
    }
  }

  if (mode.kind === 'target') {
    const base = targetContent(mode.to)
    return {
      ...base,
      mode,
      canonicalPath,
      indexable: true,
      related: buildRelated(undefined, mode.to),
      dropHint: dropHintFor(search),
    }
  }

  return {
    ...defaultContent(),
    mode,
    canonicalPath,
    indexable: mode.kind === 'default',
    related: buildRelated(intents.from, intents.to),
    dropHint: dropHintFor(search),
  }
}

export function buildStudioJsonLd(content: StudioSeoContent) {
  const url = `${SITE_URL}${content.canonicalPath}`
  const howToName =
    content.mode.kind === 'pair'
      ? `How to convert ${formatLabel(content.mode.from)} to ${formatLabel(content.mode.to)}`
      : content.mode.kind === 'target'
        ? `How to convert images to ${formatLabel(content.mode.to)}`
        : 'How to compress and convert images in Asset Melt Studio'

  const breadcrumbName =
    content.mode.kind === 'pair'
      ? `${formatLabel(content.mode.from)} to ${formatLabel(content.mode.to)}`
      : content.mode.kind === 'target'
        ? `Convert to ${formatLabel(content.mode.to)}`
        : 'Studio'

  const breadcrumbItems = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: SITE_URL,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Studio',
      item: `${SITE_URL}/studio`,
    },
    ...(content.mode.kind === 'default'
      ? []
      : [
          {
            '@type': 'ListItem',
            position: 3,
            name: breadcrumbName,
            item: url,
          },
        ]),
  ]

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': `${url}#app`,
        name:
          content.mode.kind === 'pair'
            ? `Asset Melt — ${formatLabel(content.mode.from)} to ${formatLabel(content.mode.to)}`
            : content.mode.kind === 'target'
              ? `Asset Melt — Convert to ${formatLabel(content.mode.to)}`
              : 'Asset Melt Studio',
        url,
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Any',
        description: content.description,
        isAccessibleForFree: true,
        keywords: content.keywords,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: content.title,
        description: content.description,
        isPartOf: { '@id': `${SITE_URL}/#website` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbItems,
      },
      {
        '@type': 'HowTo',
        '@id': `${url}#howto`,
        name: howToName,
        description: content.description,
        step: content.steps.map((step, index) => ({
          '@type': 'HowToStep',
          position: index + 1,
          name: step.title,
          text: step.description,
        })),
      },
      {
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        mainEntity: content.faq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      },
    ],
  }
}
