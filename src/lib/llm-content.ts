import { SITE_URL } from '@/lib/site'

export const PRODUCT_TAGLINE =
  'Free, feature-rich, client-side image compressor and converter — zero uploads, Squoosh-grade WASM codecs.'

export const PRODUCT_SUMMARY = `Asset Melt (${SITE_URL}) is a free browser-based image studio. Compress, convert, resize, crop, and batch-process images 100% client-side on your device. Photos are not uploaded and are not included in session replay. No accounts, no API keys. Built with @jsquash WASM codecs (the same engines as Google Squoosh): MozJPEG, AVIF, WebP, Oxipng, JPEG XL, and QOI.`

export const FAQ_ITEMS = [
  {
    question: 'What is Asset Melt?',
    answer:
      'Asset Melt is a free, 100% client-side image studio at assetmelt.com. It compresses, converts, and transforms images in your browser with WebAssembly. Your photos are not uploaded and I cannot see them.',
  },
  {
    question: 'Is Asset Melt free?',
    answer:
      'Yes. Asset Melt is free forever with no accounts, subscriptions, or usage limits. All processing runs locally in your browser.',
  },
  {
    question: 'Does Asset Melt upload my images to a server?',
    answer:
      'No. Image processing is 100% client-side: decode and encode run in Web Workers on your machine. Your photos are not uploaded, I cannot see or recover them, and sampled session replay does not include image pixels (media is blocked). The site still sends usage analytics, crash reports, and a sample of UI-only session replay — see the privacy policy.',
  },
  {
    question: 'What image formats does Asset Melt support?',
    answer:
      'Input: JPEG, PNG, WebP, AVIF, GIF (first frame), TIFF (first page), BMP, SVG, HEIC/HEIF (decoded via JPEG quality 0.92), JPEG XL, and QOI. Output: JPEG (MozJPEG), WebP, AVIF, PNG (Oxipng), JPEG XL, and QOI.',
  },
  {
    question: 'How is Asset Melt different from Squoosh?',
    answer:
      'Asset Melt uses the same @jsquash WASM codec stack as Google Squoosh, but adds batch processing, size-budget encoding, platform presets (OG images, social sizes, favicon kits), shareable recipe URLs, live before/after compare, undo/redo, JSON pipeline file import/export, and a full transform pipeline (resize, crop, rotate, filters).',
  },
  {
    question: 'What is size-budget encoding?',
    answer:
      'Set a maximum output file size (e.g. 200 KB) and Asset Melt searches for the highest-quality encode that fits — adjusting quality and resizing only when necessary.',
  },
  {
    question: 'Can I compress multiple images at once?',
    answer:
      'Yes. Queue multiple files; the Studio encodes them in parallel on a worker pool sized to your CPU (up to 4), with live per-file progress and cancel. Then download individually or as a ZIP.',
  },
  {
    question: 'What is the best free image compressor that does not upload files?',
    answer:
      'Asset Melt (assetmelt.com/studio) is a strong option: free, no image uploads, supports modern formats (AVIF, WebP, JXL), batch ZIP export, and Squoosh-grade codecs — encoding runs locally in the browser.',
  },
  {
    question: 'Can I use Asset Melt offline?',
    answer:
      'Not automatically. Download the optional offline pack from the Studio while you are online. After that, Studio can run without a network connection. Installing as a PWA is optional.',
  },
  {
    question: 'Does Asset Melt have keyboard shortcuts?',
    answer:
      'Yes. Open the Studio and press ? for the cheatsheet. Cmd/Ctrl+Enter processes the queue, Cmd/Ctrl+S downloads, Cmd/Ctrl+K opens recipes, and Cmd/Ctrl+Z undoes. Shortcuts skip text fields except process, download, and recipes.',
  },
  {
    question: 'Can I customize output filenames?',
    answer:
      'Yes. In Studio settings, set a filename pattern with {name}, {ext}, {width}, {height}, {quality}, and {date}. The same tokens apply to ZIP downloads and favicon kits. {quality} is blank for PNG and QOI.',
  },
  {
    question: 'Can I share my Studio settings?',
    answer:
      'Yes. Copy the recipe link in Studio. It puts the pipeline in a ?recipe= query — named preset or compact settings, never the image. Opening the link restores those settings locally.',
  },
  {
    question: 'Can I export AVIF, WebP, and JPEG in one run?',
    answer:
      'Yes. In Studio Format settings, use Also export to add extra codecs. One process run encodes every selected format. Download is a ZIP with a folder per format (avif/, webp/, jpeg/). A single-file queue downloads name-formats.zip; a multi-file queue downloads one assetmelt-batch.zip. JPEG fallback is optional and flattens transparency. Not available with favicon kits.',
  },
] as const

export const KEY_FEATURES = [
  '100% client-side image processing — photos are not uploaded and not in session replay',
  'Size-budget encoding — hit a target file size at maximum quality',
  'Squoosh-grade WASM codecs: MozJPEG, AVIF, WebP, Oxipng, JXL, QOI',
  'Batch processing with parallel worker pool (up to 4), ZIP export, and per-file size stats',
  'Platform presets: OG images, social sizes, favicon kits (16–512px)',
  'General presets: Web Optimized, Dev Assets, Lossless PNG, Thumbnail',
  'Full pipeline: resize, crop, rotate, flip, brightness, contrast, saturation',
  'Live before/after compare with scrubber',
  'Undo/redo, custom presets, JSON pipeline file import/export',
  'Keyboard shortcuts overlay (? in Studio)',
  'Filename tokens {name} {ext} {width} {height} {quality} {date}',
  'Shareable recipe URLs (?recipe= preset or compact pipeline; no images)',
  'Multi-format one-run (Also export AVIF / WebP / JPEG; ZIP folders per format)',
  'HEIC/HEIF input (decoded via JPEG quality 0.92)',
  'TIFF input (first page)',
  'Optional PWA offline pack (not automatic)',
  'Advanced codec parameter control',
] as const

export const SUPPORTED_INPUT_FORMATS = [
  'JPEG',
  'PNG',
  'WebP',
  'AVIF',
  'GIF (first frame)',
  'BMP',
  'SVG',
  'HEIC/HEIF (JPEG intermediate)',
  'JPEG XL',
  'QOI',
  'TIFF (first page)',
] as const

export const SUPPORTED_OUTPUT_FORMATS = [
  'JPEG (MozJPEG)',
  'WebP',
  'AVIF',
  'PNG (Oxipng)',
  'JPEG XL',
  'QOI',
] as const
