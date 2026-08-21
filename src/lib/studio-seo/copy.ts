import {
  formatLabel,
  formatLabelLong,
  INPUT_URL_SLUG,
  OUTPUT_URL_SLUG,
  type StudioInputIntent,
  type StudioOutputIntent,
} from '@/lib/studio-seo/formats'
import { OPEN_LIMITATIONS, TIFF_FIRST_PAGE_COPY } from '@/lib/named-limitations'
import type { StudioFaqItem, StudioSeoContent, StudioSeoSampleScene } from '@/lib/studio-seo/types'

export const PRIVACY_SNIPPET =
  'Image processing is 100% client-side in your browser with WebAssembly. Your photos are not uploaded, I cannot see or recover them, and sampled session replay is UI-only and does not include image pixels (media is blocked). The site still sends usage analytics and crash reports — details are on the privacy page.'

export function pairPhrase(from: StudioInputIntent, to: StudioOutputIntent): string {
  return `${formatLabel(from)} to ${formatLabel(to)}`
}

/** Search-style phrase using URL slugs (`gif to png`, `jpg to webp`). */
export function pairKeyword(from: StudioInputIntent, to: StudioOutputIntent): string {
  return `${INPUT_URL_SLUG[from]} to ${OUTPUT_URL_SLUG[to]}`
}

export function targetKeyword(to: StudioOutputIntent): string {
  return `convert to ${formatLabel(to)}`
}

export function codecBlurb(to: StudioOutputIntent): string {
  switch (to) {
    case 'jpeg':
      return 'MozJPEG'
    case 'png':
      return 'Oxipng (optional imagequant palette)'
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

export function sceneFor(from: StudioInputIntent): StudioSeoSampleScene {
  switch (from) {
    case 'jpeg':
    case 'heic':
    case 'webp':
    case 'avif':
    case 'jxl':
      return 'photo'
    case 'tiff':
      return 'scan'
    case 'svg':
      return 'icon'
    case 'png':
    case 'gif':
    case 'bmp':
    case 'qoi':
      return 'graphic'
  }
}

export function inputCaveat(from: StudioInputIntent): string | null {
  if (from === 'gif') return OPEN_LIMITATIONS['4.4'].copy
  if (from === 'tiff') return TIFF_FIRST_PAGE_COPY
  if (from === 'heic') return OPEN_LIMITATIONS['4.3'].copy
  return null
}

export function flattenStudioSeoText(content: StudioSeoContent): string {
  const parts: string[] = [
    content.title,
    content.description,
    content.h2,
    content.keywords,
    ...content.paragraphs,
    ...content.steps.flatMap((step) => [step.title, step.description]),
    content.beforeAfter.heading,
    content.beforeAfter.scenario,
    content.beforeAfter.caption,
    content.beforeAfter.before.format,
    content.beforeAfter.before.size,
    content.beforeAfter.before.note,
    content.beforeAfter.after.format,
    content.beforeAfter.after.size,
    content.beforeAfter.after.note,
    content.beforeAfter.savings,
    ...content.tables.flatMap((table) => [
      table.caption,
      ...table.headers,
      ...table.rows.flat(),
    ]),
    ...content.sections.flatMap((section) => [section.heading, ...section.paragraphs]),
    ...content.faq.flatMap((item) => [item.question, item.answer]),
  ]
  return parts.join('\n')
}

export function countPhrase(haystack: string, phrase: string): number {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return haystack.match(new RegExp(escaped, 'gi'))?.length ?? 0
}

export function sharedPairFaq(
  from: StudioInputIntent,
  to: StudioOutputIntent,
): StudioFaqItem[] {
  const phrase = pairPhrase(from, to)
  const fromLabel = formatLabel(from)
  const toLabel = formatLabel(to)
  const fromLong = formatLabelLong(from)
  const toLong = formatLabelLong(to)
  const caveat = inputCaveat(from)

  const items: StudioFaqItem[] = [
    {
      question: `Can I convert ${phrase} without uploading?`,
      answer: `Yes. This ${phrase} converter runs entirely in your browser. ${PRIVACY_SNIPPET}`,
    },
    {
      question: `Does this ${phrase} page only accept ${fromLabel} files?`,
      answer: `No. The Studio still opens JPEG, PNG, WebP, AVIF, HEIC, GIF, TIFF, BMP, SVG, JPEG XL, and QOI. The ${phrase} URL pre-selects ${toLong} output for the common ${fromLong} workflow, but mixed batches are fine — only the output codec is locked to ${toLabel} until you change Format settings.`,
    },
    {
      question: `Can I batch convert ${phrase}?`,
      answer: `Yes. Queue many ${fromLabel} files (or a folder), keep ${toLabel} as the output, and the Studio encodes in parallel on a worker pool sized to your CPU (up to 4) with live per-file progress, Pause, and Cancel. Pause lets in-flight files finish so you can download what is ready. Optional “ZIP every 25 files” packs numbered ZIPs during encode. There is no 20-image cap; very large ${phrase} batches depend on device RAM.`,
    },
    {
      question: `Which codec does Asset Melt use for ${phrase}?`,
      answer: `${phrase} output uses ${codecBlurb(to)} via the same Squoosh-grade @jsquash WebAssembly stack, running locally in a Web Worker. You can still crop, resize, filter, and (for lossy ${toLabel}) set a size budget before download.`,
    },
    {
      question: `Is this ${phrase} converter free?`,
      answer: `Yes. ${phrase} conversion is free: no account, no watermark, and no file-count limit. Download one file or a ZIP of the whole queue.`,
    },
  ]

  if (caveat) {
    items.push({
      question: `Are there limits when I convert ${phrase}?`,
      answer: `${caveat} ${
        to === 'png' || to === 'qoi'
          ? 'Size-budget encoding also skips PNG and QOI — use quality, palette, or resize instead.'
          : 'Size-budget encoding works on JPEG, WebP, AVIF, and JPEG XL if you need a KB cap.'
      }`,
    })
  }

  return items
}

export function sharedTargetFaq(to: StudioOutputIntent): StudioFaqItem[] {
  const toLabel = formatLabel(to)
  const toLong = formatLabelLong(to)
  const keyword = targetKeyword(to)

  return [
    {
      question: `Can I ${keyword} from any image?`,
      answer: `Yes. Drop JPEG, PNG, WebP, AVIF, HEIC, GIF (first frame), TIFF (first page), BMP, SVG, JPEG XL, or QOI and Asset Melt will ${keyword} locally. Mixed batches are fine.`,
    },
    {
      question: `Is it private to ${keyword} in Asset Melt?`,
      answer: `Yes. When you ${keyword}, decoding and encoding stay on your device. ${PRIVACY_SNIPPET}`,
    },
    {
      question: `Does size-budget work when I ${keyword}?`,
      answer:
        to === 'png'
          ? `Size-budget encoding targets lossy codecs (WebP, AVIF, JPEG, JXL). If you ${keyword} as PNG, turn on Reduce palette and lower the color count, or resize — binary-search-to-bytes is not wired for PNG yet.`
          : to === 'qoi'
            ? `Size-budget encoding targets lossy codecs (WebP, AVIF, JPEG, JXL). If you ${keyword} as QOI, use resize instead of a byte cap — QOI is a simple lossless codec, not a quality slider.`
            : `Yes. Set a target KB and Asset Melt searches for the highest ${toLabel} quality that fits when you ${keyword}.`,
    },
    {
      question: `Can I download a ZIP after I ${keyword}?`,
      answer: `Yes. Process the queue, then export every ${toLong} result as a ZIP. Optional ZIP every 25 files (Pipeline options) makes Download save numbered parts with progress on the button.`,
    },
    {
      question: `Which encoder runs when I ${keyword}?`,
      answer: `Output uses ${codecBlurb(to)} in a Web Worker — the same Squoosh-grade stack, with no upload.`,
    },
  ]
}
