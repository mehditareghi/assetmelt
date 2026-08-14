import { SITE_URL } from '@/lib/site'
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
  type StudioSeoMode,
} from '@/lib/studio-seo/search'

export interface StudioFaqItem {
  question: string
  answer: string
}

export interface StudioSeoContent {
  mode: StudioSeoMode
  title: string
  description: string
  h2: string
  paragraphs: string[]
  faq: StudioFaqItem[]
  keywords: string
  /** Canonical path including query string when indexable. */
  canonicalPath: string
  /** Whether this URL should be indexed (sitemap + robots index). */
  indexable: boolean
  related: Array<{ label: string; path: string }>
  dropHint: string | null
}

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
      'You can open JPEG, PNG, WebP, AVIF, GIF (first frame), TIFF (first page), BMP, SVG, HEIC/HEIF, JPEG XL, and QOI. For output you can choose JPEG (MozJPEG), PNG (Oxipng), WebP, AVIF, JPEG XL, or QOI. HEIC/HEIF is decoded through a high-quality JPEG (quality 0.92) before the rest of the pipeline, so HEIC→PNG is not a lossless round-trip from the original file.',
  },
  {
    question: 'Can I compress multiple images at once?',
    answer:
      'Yes. Drag and drop as many files as you like (or paste from clipboard). The Studio queues them and processes one file at a time on a single worker. You can download each result individually or grab a ZIP of everything.',
  },
  {
    question: 'What is "size budget" encoding?',
    answer:
      'Size budget lets you set a target file size (e.g. 100 KB) and the Studio automatically finds the highest quality that still fits within that limit. Useful when an upload form has a strict size cap.',
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
      'Yes. The filename pattern field accepts {name}, {ext}, {width}, {height}, {quality}, and {date} (local YYYY-MM-DD). The same tokens apply to ZIP downloads and favicon-kit files. {quality} is the encode quality used — including size-budget results — and stays blank for PNG and QOI.',
  },
  {
    question: 'Can I share my Studio settings?',
    answer:
      'Yes. Copy the recipe link from the Studio toolbar. It stores the pipeline (preset or compact settings) in ?recipe= — photos never go in the URL. Opening the link restores those settings on this device.',
  },
]

const PAIR_TIPS: Partial<
  Record<`${StudioInputIntent}->${StudioOutputIntent}`, string>
> = {
  'png->webp':
    'WebP usually beats PNG on photos and soft gradients while still supporting alpha — ideal for product cutouts and UI chrome.',
  'jpeg->webp':
    'WebP typically saves 25–35% versus MozJPEG at similar visual quality for photographs and blog hero images.',
  'png->avif':
    'AVIF often wins on screenshots and illustrations where PNG files balloon; preview carefully around sharp text.',
  'jpeg->avif':
    'AVIF is the strongest size win for photo heroes when your audience is on modern browsers.',
  'webp->avif':
    'If you already ship WebP, AVIF is the next step for LCP-critical images — keep WebP as a fallback.',
  'heic->jpeg':
    'iPhone Camera rolls default to HEIC; JPG remains the universal share and CMS upload format. HEIC is decoded through a JPEG intermediate (quality 0.92) before MozJPEG encode.',
  'heic->png':
    'HEIC is decoded through a JPEG intermediate (quality 0.92), so HEIC→PNG is not lossless from the original HEIC — it is a portable handoff after that decode.',
  'heic->webp':
    'HEIC is decoded through a JPEG intermediate first, then encoded to WebP locally — useful when the destination is a website rather than email or print.',
  'heic->avif':
    'HEIC is decoded through a JPEG intermediate first, then encoded to AVIF. Private, local, but not a lossless HEIC round-trip.',
  'gif->webp':
    'Asset Melt processes the first GIF frame as a still — perfect for converting old meme stills or UI captures.',
  'svg->png':
    'Rasterizing SVG is handy for email clients and platforms that reject SVG uploads.',
  'tiff->jpeg':
    'Scanned TIFF archives compress dramatically as JPG for sharing while originals stay offline. Multi-page TIFFs use the first page, same as GIF.',
}

function tipFor(from: StudioInputIntent, to: StudioOutputIntent): string {
  return (
    PAIR_TIPS[`${from}->${to}`] ??
    `${formatLabelLong(from)} sources convert cleanly to ${formatLabelLong(to)} with live before/after compare so you can stop when quality looks right.`
  )
}

function codecBlurb(to: StudioOutputIntent): string {
  switch (to) {
    case 'jpeg':
      return 'MozJPEG'
    case 'png':
      return 'Oxipng'
    case 'webp':
      return 'the official WebP encoder'
    case 'avif':
      return 'libavif / AV1 stills'
    case 'jxl':
      return 'JPEG XL via @jsquash/jxl'
    case 'qoi':
      return 'QOI for fast lossless tooling'
  }
}

function buildRelated(from?: StudioInputIntent, to?: StudioOutputIntent) {
  return relatedPairsFor(from, to, 6).map((pair) => ({
    label: pairLinkLabel(pair),
    path: buildStudioPath(studioSearchFromPair(pair)),
  }))
}

function pairContent(pair: StudioFormatPair): Omit<
  StudioSeoContent,
  'mode' | 'canonicalPath' | 'indexable' | 'related' | 'dropHint'
> {
  const fromLabel = formatLabel(pair.from)
  const toLabel = formatLabel(pair.to)
  const fromLong = formatLabelLong(pair.from)
  const toLong = formatLabelLong(pair.to)

  return {
    title: `Convert ${fromLabel} to ${toLabel} Online — Free, No Upload | Asset Melt`,
    description: `Convert ${fromLong} to ${toLong} in your browser. ${pair.angle[0].toUpperCase()}${pair.angle.slice(1)}. Free, private, batch ZIP export — files never leave your device.`,
    h2: `Free ${fromLabel} to ${toLabel} converter in your browser`,
    paragraphs: [
      `Asset Melt Studio is ready to convert ${fromLong} files to ${toLong} entirely on your device. ${tipFor(pair.from, pair.to)}`,
      `Drop one file or a whole folder — the pipeline is already set to ${toLabel} output using ${codecBlurb(pair.to)}. Adjust quality, enable size-budget encoding, resize, or crop without uploading anything.`,
      `Input is not locked to ${fromLabel}: you can still open JPEG, PNG, WebP, AVIF, HEIC, GIF, and more in the same session. The ${fromLabel}→${toLabel} URL simply pre-selects the conversion people search for most.`,
    ],
    faq: [
      {
        question: `Can I convert ${fromLabel} to ${toLabel} without uploading?`,
        answer: `Yes. Conversion is 100% client-side with WebAssembly in your browser. Your photos are not uploaded, I cannot see them, and session replay does not include image pixels.`,
      },
      {
        question: `Does this only accept ${fromLabel} files?`,
        answer: `No. The Studio accepts every supported input format. This page pre-selects ${toLabel} output for the common ${fromLabel}→${toLabel} workflow, but you can drop mixed batches anytime.`,
      },
      {
        question: `Can I batch convert ${fromLabel} to ${toLabel}?`,
        answer: `Yes. Queue many files, keep ${toLabel} as the output format, and the Studio processes them one at a time. Preview savings, then download individually or as a ZIP.`,
      },
      {
        question: `Which codec does Asset Melt use for ${toLabel}?`,
        answer: `Output uses ${codecBlurb(pair.to)} via the same Squoosh-grade @jsquash WASM stack, running locally in a Web Worker.`,
      },
      {
        question: 'Is the converter free?',
        answer:
          'Yes. Asset Melt is free with no accounts, watermarks, or file-count limits.',
      },
    ],
    keywords: `${fromLabel.toLowerCase()} to ${toLabel.toLowerCase()}, convert ${fromLabel.toLowerCase()} to ${toLabel.toLowerCase()}, ${fromLabel.toLowerCase()} to ${toLabel.toLowerCase()} converter, free ${fromLabel.toLowerCase()} converter, no upload`,
  }
}

function targetContent(to: StudioOutputIntent): Omit<
  StudioSeoContent,
  'mode' | 'canonicalPath' | 'indexable' | 'related' | 'dropHint'
> {
  const toLabel = formatLabel(to)
  const toLong = formatLabelLong(to)

  return {
    title: `Convert Images to ${toLabel} Online — Free Browser Converter | Asset Melt`,
    description: `Compress and convert any supported image to ${toLong} in your browser. Free, no uploads, batch ZIP export, size-budget encoding, and Squoosh-grade WASM codecs.`,
    h2: `Free convert-to-${toLabel} studio — any input welcome`,
    paragraphs: [
      `This Studio link pre-selects ${toLong} as the output format so you can start converting immediately. Bring JPEG, PNG, WebP, AVIF, HEIC, GIF, SVG, and more — input format is never blocked.`,
      `Encoding uses ${codecBlurb(to)}. Tune quality, hit a size budget, resize for Core Web Vitals, then export one file or a full ZIP — all on your device.`,
      `Looking for a specific source format? Use deep links like PNG→${toLabel} or HEIC→${toLabel} for conversion-focused copy, or stay here when your batch is mixed.`,
    ],
    faq: [
      {
        question: `Can I convert any image to ${toLabel}?`,
        answer: `Yes. Drop any supported input and Asset Melt encodes to ${toLong} locally. Mixed batches are fine.`,
      },
      {
        question: `Is convert-to-${toLabel} private?`,
        answer:
          'Yes. Decoding and encoding are 100% client-side in Web Workers. Your photos are not uploaded, I cannot see them, and sampled session replay does not include image pixels. Usage analytics and UI-only replay are described on the privacy page.',
      },
      {
        question: `Does size-budget work with ${toLabel}?`,
        answer:
          to === 'png' || to === 'qoi'
            ? `Size-budget encoding targets lossy codecs (WebP, AVIF, JPEG, JXL). For ${toLabel}, use quality/effort controls and resize instead.`
            : `Yes. Set a target KB and Asset Melt searches for the highest ${toLabel} quality that fits.`,
      },
      {
        question: 'Can I download a ZIP of converted files?',
        answer:
          'Yes. Process the queue, then export every result as a single ZIP archive.',
      },
    ],
    keywords: `convert to ${toLabel.toLowerCase()}, ${toLabel.toLowerCase()} converter, compress to ${toLabel.toLowerCase()}, free ${toLabel.toLowerCase()} encoder, no upload`,
  }
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
    mode,
    title: 'Studio — Compress & Convert Images in Your Browser | Asset Melt',
    description: DEFAULT_DESCRIPTION,
    h2: 'Free image compressor & converter — right in your browser',
    paragraphs: [
      'Asset Melt Studio is a client-side image processing tool that runs entirely in your browser. There are no uploads, no accounts, and no file-size limits imposed by a server — just drag in your images and get optimised results in seconds.',
      'The Studio supports all common formats including JPEG, PNG, WebP, AVIF, HEIC, TIFF, JPEG XL, and QOI. You can compress images to a specific quality level or target file size, convert between formats, resize to exact pixel dimensions, and crop non-destructively. Batch processing means you can handle dozens of images in a single session.',
      'Under the hood the Studio uses the same codec libraries as Google\'s Squoosh — MozJPEG, libavif, and the official WebP encoder — compiled to WebAssembly so they run at near-native speed without any server involvement. Your files stay on your device at all times.',
    ],
    faq: DEFAULT_FAQ,
    keywords:
      'image compressor, image converter, browser, client-side, AVIF, WebP, HEIC, batch, free',
    canonicalPath,
    indexable: mode.kind === 'default',
    related: buildRelated(intents.from, intents.to),
    dropHint: dropHintFor(search),
  }
}

export function buildStudioJsonLd(content: StudioSeoContent) {
  const url = `${SITE_URL}${content.canonicalPath}`
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
