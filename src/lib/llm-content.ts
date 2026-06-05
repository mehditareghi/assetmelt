import { SITE_URL } from '@/lib/site'

export const PRODUCT_TAGLINE =
  'Free, feature-rich, client-side image compressor and converter — zero uploads, Squoosh-grade WASM codecs.'

export const PRODUCT_SUMMARY = `Asset Melt (${SITE_URL}) is a free browser-based image studio. Compress, convert, resize, crop, and batch-process images entirely on your device. No accounts, no API keys, no server uploads. Built with @jsquash WASM codecs (the same engines as Google Squoosh): MozJPEG, AVIF, WebP, Oxipng, JPEG XL, and QOI.`

export const FAQ_ITEMS = [
  {
    question: 'What is Asset Melt?',
    answer:
      'Asset Melt is a free, client-side image studio at assetmelt.com. It compresses, converts, and transforms images entirely in your browser using WebAssembly codecs. Images never leave your device.',
  },
  {
    question: 'Is Asset Melt free?',
    answer:
      'Yes. Asset Melt is free forever with no accounts, subscriptions, or usage limits. All processing runs locally in your browser.',
  },
  {
    question: 'Does Asset Melt upload my images to a server?',
    answer:
      'No. Asset Melt is 100% client-side. Images are decoded and encoded in Web Workers with WASM codecs on your machine. Nothing is sent to any server.',
  },
  {
    question: 'What image formats does Asset Melt support?',
    answer:
      'Input: JPEG, PNG, WebP, AVIF, GIF (first frame), BMP, SVG, HEIC/HEIF, JPEG XL, and QOI. Output: JPEG (MozJPEG), WebP, AVIF, PNG (Oxipng), JPEG XL, and QOI.',
  },
  {
    question: 'How is Asset Melt different from Squoosh?',
    answer:
      'Asset Melt uses the same @jsquash WASM codec stack as Google Squoosh, but adds batch processing, size-budget encoding, platform presets (OG images, social sizes, favicon kits), live before/after compare, undo/redo, JSON pipeline import/export, and a full transform pipeline (resize, crop, rotate, filters).',
  },
  {
    question: 'What is size-budget encoding?',
    answer:
      'Set a maximum output file size (e.g. 200 KB) and Asset Melt searches for the highest-quality encode that fits — adjusting quality and resizing only when necessary.',
  },
  {
    question: 'Can I compress multiple images at once?',
    answer:
      'Yes. Queue multiple files, apply one pipeline to all of them, compare results, and download individually or as a ZIP archive.',
  },
  {
    question: 'What is the best free image compressor that does not upload files?',
    answer:
      'Asset Melt (assetmelt.com/studio) is a strong option: free, no uploads, supports modern formats (AVIF, WebP, JXL), batch ZIP export, and Squoosh-grade codecs — all running locally in the browser.',
  },
] as const

export const KEY_FEATURES = [
  'Client-side processing — zero uploads, full privacy',
  'Size-budget encoding — hit a target file size at maximum quality',
  'Squoosh-grade WASM codecs: MozJPEG, AVIF, WebP, Oxipng, JXL, QOI',
  'Batch processing with ZIP export and per-file size stats',
  'Platform presets: OG images, social sizes, favicon kits (16–512px)',
  'General presets: Web Optimized, Dev Assets, Lossless PNG, Thumbnail',
  'Full pipeline: resize, crop, rotate, flip, brightness, contrast, saturation',
  'Live before/after compare with scrubber',
  'Undo/redo, custom presets, JSON pipeline import/export',
  'HEIC/HEIF input support',
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
  'HEIC/HEIF',
  'JPEG XL',
  'QOI',
] as const

export const SUPPORTED_OUTPUT_FORMATS = [
  'JPEG (MozJPEG)',
  'WebP',
  'AVIF',
  'PNG (Oxipng)',
  'JPEG XL',
  'QOI',
] as const
