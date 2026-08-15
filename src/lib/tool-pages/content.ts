import type { ToolPageContent, ToolPageId } from '@/lib/tool-pages/types'
import { SIZE_BUDGET_TOOL_PAGES } from '@/lib/tool-pages/size-budget-pages'

export const TOOL_PAGES: Record<ToolPageId, ToolPageContent> = {
  ...SIZE_BUDGET_TOOL_PAGES,
  'squoosh-alternative': {
    id: 'squoosh-alternative',
    path: '/squoosh-alternative',
    title: 'Best Squoosh Alternative — Free Client-Side Image Compressor | Asset Melt',
    metaDescription:
      'Looking for a Squoosh alternative? Asset Melt uses the same WASM codecs as Google Squoosh, plus batch processing, size-budget encoding, HEIC support, and zero uploads.',
    eyebrow: 'Squoosh alternative',
    heroBadge: 'Same codecs · More features',
    h1: 'The Squoosh alternative',
    h1Accent: 'built for real workflows',
    heroDescription:
      'Google Squoosh proved that browser-based WASM compression works. Asset Melt keeps the same @jsquash codec stack — MozJPEG, AVIF, WebP, Oxipng — and adds batch queues, size-budget encoding, platform presets, and a full transform pipeline. Still 100% client-side.',
    benefits: [
      {
        icon: 'zap',
        title: 'Same WASM engines',
        description:
          'MozJPEG, AVIF, WebP, Oxipng, JXL, and QOI — the exact @jsquash codecs that powered Squoosh, running locally in your browser.',
      },
      {
        icon: 'layers',
        title: 'Batch processing',
        description:
          'Queue dozens of files — or drop a folder — apply one pipeline, and export as a ZIP that keeps relative paths. Squoosh handled one image at a time.',
      },
      {
        icon: 'target',
        title: 'Size-budget encoding',
        description:
          'Set a target file size (e.g. 200 KB) and Asset Melt finds the highest quality that fits — adjusting quality and resize automatically.',
      },
      {
        icon: 'shield',
        title: 'Zero uploads',
        description:
          'Like Squoosh, image processing is 100% client-side. Your photos stay on your device — they are not uploaded, I cannot see them, and session replay does not include image pixels. Site telemetry is listed on the privacy policy.',
      },
    ],
    steps: [
      {
        title: 'Open the studio',
        description:
          'Go to Asset Melt Studio — no install, no signup. Works in Chrome, Firefox, Safari, and Edge with WebAssembly support.',
      },
      {
        title: 'Drop your images',
        description:
          'Add JPEG, PNG, WebP, AVIF, HEIC, GIF, SVG, or more. Each file decodes in a Web Worker on your machine.',
      },
      {
        title: 'Pick a codec & export',
        description:
          'Choose MozJPEG, AVIF, or WebP, tune quality or set a size budget, then download individually or as a batch ZIP.',
      },
    ],
    contentSections: [
      {
        heading: 'Why people search for a Squoosh alternative',
        paragraphs: [
          'Google Squoosh was a breakthrough: it showed that professional-grade image compression could run entirely in the browser using WebAssembly. Developers, designers, and photographers used it daily to squeeze JPEGs, convert to WebP, and preview AVIF — all without uploading sensitive files to a server.',
          'Squoosh is no longer actively maintained. The app still works, but it lacks batch processing, size-budget encoding, HEIC input, platform presets, and the workflow features that teams need when optimizing more than one image at a time.',
        ],
      },
      {
        heading: 'What Asset Melt adds on top of Squoosh',
        paragraphs: [
          'Asset Melt was built as a spiritual successor: same codec foundation, modern workflow. You get undo/redo, live before/after compare, shareable recipe URLs, JSON pipeline file import/export, custom presets, and an optional offline pack (not automatic after the first visit).',
          'Whether you are shrinking hero images for a landing page, converting a folder of HEIC photos, or generating favicon kits at exact dimensions — Asset Melt handles it in one client-side session.',
        ],
      },
    ],
    comparison: {
      competitorName: 'Google Squoosh',
      rows: [
        { feature: 'Client-side (no uploads)', assetMelt: 'Yes', competitor: 'Yes' },
        { feature: 'WASM codecs (MozJPEG, AVIF, WebP)', assetMelt: 'Yes', competitor: 'Yes' },
        { feature: 'Batch processing + ZIP export', assetMelt: 'Yes (folder drop)', competitor: 'No' },
        { feature: 'Size-budget encoding', assetMelt: 'Yes', competitor: 'No' },
        { feature: 'HEIC / HEIF input', assetMelt: 'Yes', competitor: 'No' },
        { feature: 'Platform presets (OG, favicon)', assetMelt: 'Yes (+ favicon.ico)', competitor: 'No' },
        { feature: 'Shareable recipe URL', assetMelt: 'Yes (?recipe=)', competitor: '#settings hash' },
        { feature: 'Multi-format one-run ZIP', assetMelt: 'Yes (Also export)', competitor: 'No' },
        { feature: 'Responsive export + snippets', assetMelt: 'Yes (widths ZIP + code)', competitor: 'No' },
        { feature: 'Lossy PNG / Reduce palette', assetMelt: 'Yes (imagequant + Oxipng)', competitor: 'Yes' },
        { feature: 'Transform pipeline (crop, resize, filters)', assetMelt: 'Full pipeline', competitor: 'Basic' },
        { feature: 'Actively maintained', assetMelt: 'Yes', competitor: 'Unmaintained' },
        { feature: 'Price', assetMelt: 'Free', competitor: 'Free' },
      ],
    },
    faq: [
      {
        question: 'Is Asset Melt a good Squoosh replacement?',
        answer:
          'Yes. Asset Melt uses the same @jsquash WASM codec stack as Squoosh and adds batch processing, size-budget encoding, HEIC support, and platform presets — all still 100% client-side. PNG Reduce palette (imagequant + Oxipng) matches Squoosh’s palette preprocessor.',
      },
      {
        question: 'Does Asset Melt upload my images?',
        answer:
          'No. Like Squoosh, decoding and encoding happen locally in Web Workers. Image files are not uploaded.',
      },
      {
        question: 'Can I use Asset Melt for batch compression?',
        answer:
          'Yes. Drop multiple files, apply one pipeline to the entire queue, drag rows to reorder, compare results, and download as a ZIP that follows queue order — a major advantage over Squoosh.',
      },
      {
        question: 'Is Asset Melt free?',
        answer:
          'Yes. Asset Melt is free forever with no accounts, subscriptions, or usage limits.',
      },
    ],
    relatedTools: ['heic-to-jpg', 'batch-image-compressor', 'avif-compressor'],
    keywords:
      'squoosh alternative, squoosh replacement, client-side image compressor, wasm image compression, free image optimizer',
    breadcrumbLabel: 'Squoosh Alternative',
  },

  'heic-to-jpg': {
    id: 'heic-to-jpg',
    path: '/convert/heic-to-jpg',
    title: 'Convert HEIC to JPG Online — Free, Private, No Upload | Asset Melt',
    metaDescription:
      'Convert HEIC and HEIF photos to JPG in your browser. Free, no upload, no account. iPhone photos stay on your device — client-side HEIC to JPEG conversion with MozJPEG.',
    eyebrow: 'Format conversion',
    heroBadge: 'HEIC · HEIF · JPG',
    h1: 'Convert HEIC to JPG',
    h1Accent: 'without uploading your photos',
    heroDescription:
      'iPhone and iPad save photos as HEIC by default. Asset Melt converts HEIC and HEIF to high-quality JPEG entirely in your browser — your photos never touch a server. Batch-convert a whole album and download as ZIP.',
    benefits: [
      {
        icon: 'smartphone',
        title: 'Built for iPhone photos',
        description:
          'Drop .heic or .heif files straight from your camera roll, AirDrop, or iCloud export. No desktop app required.',
      },
      {
        icon: 'lock',
        title: 'Private by design',
        description:
          'Cloud converters upload your personal photos to unknown servers. Asset Melt decodes and encodes locally — ideal for family photos and sensitive images.',
      },
      {
        icon: 'layers',
        title: 'Batch convert',
        description:
          'Convert dozens of HEIC files in one session. Apply the same quality settings to every photo and export as a ZIP archive.',
      },
      {
        icon: 'gauge',
        title: 'Quality control',
        description:
          'Use MozJPEG with adjustable quality, progressive encoding, and optional resize. Hit an exact file size with size-budget mode.',
      },
    ],
    steps: [
      {
        title: 'Drop HEIC files',
        description:
          'Open Asset Melt Studio and add your .heic or .heif files. You can select multiple files or an entire folder at once.',
      },
      {
        title: 'Set output to JPEG',
        description:
          'Choose JPEG (MozJPEG) as the output format. Adjust quality (80–90 is great for photos) or enable size-budget encoding.',
      },
      {
        title: 'Download JPG files',
        description:
          'Preview the conversion, check file sizes, then download individually or grab the whole batch as a ZIP.',
      },
    ],
    contentSections: [
      {
        heading: 'Why convert HEIC to JPG?',
        paragraphs: [
          'HEIC (High Efficiency Image Container) produces smaller files than JPEG at the same visual quality — that is why Apple uses it by default. But HEIC is not universally supported. Many websites, older apps, Windows versions, and email clients expect JPG.',
          'Converting HEIC to JPG makes your photos compatible everywhere: WordPress uploads, Slack attachments, print services, and legacy software.',
        ],
      },
      {
        heading: 'Why use a client-side converter?',
        paragraphs: [
          'Most "free HEIC to JPG" tools upload your photos to a remote server, process them in the cloud, and send back a download link. That means your personal images pass through someone else\'s infrastructure.',
          'Asset Melt converts HEIC to JPG using WebAssembly on your own device. Image files are not uploaded or stored. The conversion happens in a Web Worker and the result downloads directly from your browser.',
        ],
      },
    ],
    faq: [
      {
        question: 'Can I convert HEIC to JPG without uploading?',
        answer:
          'Yes. Asset Melt converts HEIC to JPG entirely in your browser. Photos are decoded locally — they are not uploaded.',
      },
      {
        question: 'Does Asset Melt support batch HEIC conversion?',
        answer:
          'Yes. Add multiple HEIC files, set JPEG output once, and download all converted images as a ZIP.',
      },
      {
        question: 'Will I lose quality converting HEIC to JPG?',
        answer:
          'HEIC is first decoded to JPEG at quality 0.92, then MozJPEG encodes that bitmap at your chosen quality. That is two lossy JPEG steps — expected for HEIC→JPG, and it also means HEIC→PNG is not lossless from the original HEIC.',
      },
      {
        question: 'Does this work on Windows and Mac?',
        answer:
          'Yes. Asset Melt runs in any modern browser (Chrome, Firefox, Safari, Edge) on Windows, macOS, Linux, and mobile.',
      },
    ],
    relatedTools: ['squoosh-alternative', 'batch-image-compressor', 'avif-compressor'],
    studioSearch: { from: 'heic', to: 'jpg' },
    keywords:
      'heic to jpg, convert heic to jpeg, heic converter online, heif to jpg, iphone photo converter, free heic converter',
    breadcrumbLabel: 'HEIC to JPG',
  },

  'batch-image-compressor': {
    id: 'batch-image-compressor',
    path: '/tools/batch-image-compressor',
    title: 'Batch Image Compressor — Compress Multiple Images Online Free | Asset Melt',
    metaDescription:
      'Compress multiple images at once in your browser. Free batch image compression with ZIP export, before/after compare, and size-budget encoding. No uploads.',
    eyebrow: 'Batch processing',
    heroBadge: 'Multi-file · ZIP export',
    h1: 'Batch image compressor',
    h1Accent: 'for your whole folder',
    heroDescription:
      'Drop a folder of JPEGs, PNGs, or WebPs and compress them all in one pass. Apply a single pipeline — format, quality, resize — to every file, compare savings, and download as a ZIP. 100% client-side.',
    benefits: [
      {
        icon: 'folder',
        title: 'Folder-scale workflows',
        description:
          'Add 10, 50, or 100+ images to the queue. Asset Melt processes each file with the same settings and tracks per-file byte savings.',
      },
      {
        icon: 'refresh',
        title: 'One pipeline, every file',
        description:
          'Set output format, quality, resize, and crop once. The entire batch inherits the same pipeline — no repetitive manual work.',
      },
      {
        icon: 'target',
        title: 'Size-budget per file',
        description:
          'Need every image under 200 KB? Open the under-200 KB page, or enable size-budget mode in Studio — Asset Melt optimizes each file individually to hit your target.',
      },
      {
        icon: 'shield',
        title: 'No cloud uploads',
        description:
          'Unlike server-based batch compressors, your files stay on your device. Ideal for client work, internal assets, and private photos.',
      },
    ],
    steps: [
      {
        title: 'Queue your images',
        description:
          'Open Studio and drop multiple files or a folder. Asset Melt accepts JPEG, PNG, WebP, AVIF, HEIC, GIF, SVG, and more.',
      },
      {
        title: 'Configure the pipeline',
        description:
          'Pick a preset like Web Optimized, or set format (WebP/AVIF/JPEG), quality, max dimensions, and metadata stripping.',
      },
      {
        title: 'Export the batch',
        description:
          'Review before/after for any file, check total savings, then download all compressed images as a single ZIP. Folder drops keep paths like products/a/hero.webp.',
      },
    ],
    contentSections: [
      {
        heading: 'When batch compression saves hours',
        paragraphs: [
          'Optimizing images one at a time does not scale. Blog migrations, e-commerce catalog updates, app asset exports, and client deliverables often involve dozens or hundreds of files that need the same treatment.',
          'A batch image compressor lets you define the rules once — output format, max width, quality floor — and apply them consistently across the entire set.',
        ],
      },
      {
        heading: 'Why client-side batch beats cloud tools',
        paragraphs: [
          'Server-based batch compressors require uploading every file, waiting in a queue, and trusting a third party with your assets. For NDA work, unreleased products, or personal photos, that is a non-starter.',
          'Asset Melt runs the full batch locally. Each image is decoded, transformed, and encoded in Web Workers on your machine. The ZIP is assembled in-browser and downloaded directly — no server ever sees your files.',
        ],
      },
    ],
    faq: [
      {
        question: 'How many images can I compress at once?',
        answer:
          'There is no hard limit. Asset Melt queues files and encodes them in parallel on a worker pool sized to your CPU (capped at 4). Cancel anytime. Very large batches still depend on device memory and browser capabilities.',
      },
      {
        question: 'Can I download all compressed images as one ZIP?',
        answer:
          'Yes. After processing, export the entire batch as a ZIP archive with all optimized files inside.',
      },
      {
        question: 'Can I use different settings per file?',
        answer:
          'The pipeline applies uniformly to the batch. You can adjust individual files after processing, or split into multiple batches with different settings.',
      },
      {
        question: 'Is batch compression free?',
        answer:
          'Yes. Asset Melt batch compression is free with no account required and no usage limits.',
      },
    ],
    relatedTools: ['compress-under-100kb', 'avif-compressor', 'squoosh-alternative'],
    studioSearch: { to: 'webp' },
    keywords:
      'batch image compressor, compress multiple images, bulk image compression, batch photo optimizer, zip export',
    breadcrumbLabel: 'Batch Compressor',
  },

  'avif-compressor': {
    id: 'avif-compressor',
    path: '/compress/avif',
    title: 'Compress AVIF Online — Free Client-Side AVIF Optimizer | Asset Melt',
    metaDescription:
      'Compress and optimize AVIF images in your browser. Free client-side AVIF compression with quality control, size-budget encoding, and batch export. No uploads.',
    eyebrow: 'AVIF optimization',
    heroBadge: 'AVIF encode · decode',
    h1: 'Compress AVIF images',
    h1Accent: 'in your browser',
    heroDescription:
      'AVIF delivers the smallest file sizes for the web, but tuning quality is tricky. Asset Melt compresses AVIF files client-side with full codec control, size-budget encoding, and batch support — convert to AVIF or re-compress existing AVIF files.',
    benefits: [
      {
        icon: 'gauge',
        title: 'Fine-tuned quality',
        description:
          'Adjust AVIF quality, speed, and lossless mode. Preview before/after with a live compare scrubber to find the sweet spot.',
      },
      {
        icon: 'target',
        title: 'Size-budget mode',
        description:
          'Set a max file size and Asset Melt searches for the highest AVIF quality that fits — no guesswork.',
      },
      {
        icon: 'refresh',
        title: 'Convert & re-compress',
        description:
          'Encode JPEG/PNG/WebP to AVIF, or re-compress existing AVIF files that are larger than they need to be.',
      },
      {
        icon: 'layers',
        title: 'Batch AVIF export',
        description:
          'Convert an entire folder to AVIF in one session. Download all optimized files as a ZIP.',
      },
    ],
    steps: [
      {
        title: 'Add your images',
        description:
          'Drop AVIF files to re-compress, or add JPEG/PNG/WebP sources to convert to AVIF. Multiple files supported.',
      },
      {
        title: 'Configure AVIF encoding',
        description:
          'Select AVIF output, set quality (50–65 is typical for web), adjust speed, or enable size-budget encoding for a target KB.',
      },
      {
        title: 'Compare and download',
        description:
          'Use the before/after compare to verify visual quality, check byte savings, and export individually or as ZIP.',
      },
    ],
    contentSections: [
      {
        heading: 'Why compress to AVIF?',
        paragraphs: [
          'AVIF (AV1 Image File Format) typically produces files 30–50% smaller than WebP and 50–70% smaller than JPEG at equivalent visual quality. That means faster page loads, lower bandwidth bills, and better Core Web Vitals scores.',
          'Major browsers support AVIF natively. It is the best choice for hero images, product photos, and any asset where file size directly impacts performance.',
        ],
      },
      {
        heading: 'Why use a browser-based AVIF compressor?',
        paragraphs: [
          'Desktop AVIF encoders exist, but they require installation and CLI knowledge. Cloud compressors upload your files to remote servers.',
          'Asset Melt encodes AVIF using the @jsquash/avif WASM codec — the same engine family as Google Squoosh — running entirely in your browser. You get a visual interface, live preview, and batch export without installing anything or uploading anything.',
        ],
      },
    ],
    faq: [
      {
        question: 'Can I compress AVIF without uploading?',
        answer:
          'Yes. Asset Melt encodes and re-compresses AVIF entirely client-side using WebAssembly. Image files are not uploaded.',
      },
      {
        question: 'What quality should I use for AVIF?',
        answer:
          'For web photos, AVIF quality 50–65 usually matches JPEG 80–85 visually at half the file size. Use the before/after compare to verify.',
      },
      {
        question: 'Can I convert JPEG or PNG to AVIF?',
        answer:
          'Yes. Add JPEG, PNG, WebP, or other supported formats and set AVIF as the output format in the studio pipeline.',
      },
      {
        question: 'Does Asset Melt support batch AVIF compression?',
        answer:
          'Yes. Queue multiple files, set AVIF output once, and download the entire batch as a ZIP.',
      },
    ],
    relatedTools: ['squoosh-alternative', 'batch-image-compressor', 'heic-to-jpg'],
    studioSearch: { to: 'avif' },
    keywords:
      'compress avif, avif compressor, avif optimizer, convert to avif, avif compression online, free avif tool',
    breadcrumbLabel: 'AVIF Compressor',
  },

  'privacy-first-image-compression': {
    id: 'privacy-first-image-compression',
    path: '/privacy-first-image-compression',
    title: 'Privacy-First Image Compression — No Upload, No Server | Asset Melt',
    metaDescription:
      'Compress and convert images without uploading them anywhere. Asset Melt processes image files in your browser using WebAssembly — they are not sent to an image server.',
    eyebrow: 'Privacy-first',
    heroBadge: 'Zero uploads · 100% local',
    h1: 'Image compression that respects your privacy',
    h1Accent: 'your files never leave your device',
    heroDescription:
      'Most online image tools upload your files to a server. Asset Melt is different — compression, conversion, resizing, and cropping all run locally in your browser using WebAssembly. No upload. No server. No account. Just results.',
    benefits: [
      {
        icon: 'lock',
        title: 'No upload — ever',
        description:
          'There is no server endpoint that receives your images. The app has no upload mechanism by design, not policy.',
      },
      {
        icon: 'shield',
        title: 'Processed on your device',
        description:
          'WebAssembly codec modules run in your browser\'s Web Workers. Your CPU does the work locally. Offline use needs the optional offline pack — it is not automatic.',
      },
      {
        icon: 'globe',
        title: 'No account required',
        description:
          'No email, no sign-up, no login. Open the Studio and start compressing immediately. There is nothing to register for.',
      },
      {
        icon: 'zap',
        title: 'Professional-grade codecs',
        description:
          'MozJPEG, AVIF (rav1e), WebP, Oxipng, and JXL — the same @jsquash WASM engines that powered Google Squoosh.',
      },
    ],
    steps: [
      {
        title: 'Open the Studio',
        description:
          'Go to assetmelt.com/studio — no install, no account, no permission to access your camera roll. Works in any modern browser.',
      },
      {
        title: 'Drop your images',
        description:
          'Add images by drag-and-drop (files or a folder), click-to-browse, or paste from the clipboard. Image files are not sent anywhere at this step or during encode.',
      },
      {
        title: 'Compress and download',
        description:
          'Choose your format and quality, preview the result, and download directly to your device. The browser never contacts a remote server for image data.',
      },
    ],
    contentSections: [
      {
        heading: 'Why most image compressors are a privacy risk',
        paragraphs: [
          'Upload-based tools are convenient, but they create a problem: your images pass through infrastructure you do not control. Even "reputable" services retain files for minutes or hours, may log filenames and metadata, and are subject to data breaches, government requests, or unexpected policy changes.',
          'For personal photos, design mockups, client documents, or any image containing sensitive information, that trade-off is not worth it — especially when a browser-based alternative exists that delivers the same quality.',
        ],
      },
      {
        heading: 'How browser-based compression protects you',
        paragraphs: [
          'Asset Melt is a static web application. When you open it, your browser downloads the app code and WebAssembly codec modules from a CDN — the same way it downloads any website. After that, everything runs locally.',
          'When you add an image, it is decoded in a Web Worker on your CPU. Resizing, colour-space conversion, and re-encoding all happen in the same sandboxed thread. The output file is generated in memory and downloaded directly to your device. At no point does the image data travel over the network.',
          'This is not a soft privacy policy — it is a technical constraint. The app has no upload endpoint. If you inspect the network requests in your browser\'s DevTools while processing images, you will see none related to your files.',
        ],
      },
      {
        heading: 'Who needs privacy-first image compression',
        paragraphs: [
          'Medical and legal professionals handling sensitive document scans. Designers working under NDA. Photographers protecting client work before delivery. Developers compressing internal screenshots. Anyone who has ever paused before clicking "upload" and wondered where their file actually goes.',
          'Asset Melt is also practical for everyday use: it supports batch processing, HEIC conversion, AVIF and WebP output, size-budget encoding, and platform presets — not just a privacy checkbox, but a fully-featured studio that happens to keep your files private.',
        ],
      },
    ],
    comparison: {
      competitorName: 'Upload-based tools',
      rows: [
        { feature: 'Images stay on your device', assetMelt: 'Yes — always', competitor: 'No — server upload' },
        { feature: 'Works offline', assetMelt: 'Optional pack (not automatic)', competitor: 'No' },
        { feature: 'Account required', assetMelt: 'No', competitor: 'Often yes' },
        { feature: 'File size limits', assetMelt: 'None', competitor: 'Usually yes' },
        { feature: 'Batch processing', assetMelt: 'Yes + ZIP export', competitor: 'Varies' },
        { feature: 'Professional codecs', assetMelt: 'MozJPEG, AVIF, WebP', competitor: 'Varies' },
        { feature: 'Free', assetMelt: 'Yes, no paywalls', competitor: 'Freemium tiers' },
      ],
    },
    faq: [
      {
        question: 'How can I verify that my images are not being uploaded?',
        answer:
          'Open your browser\'s DevTools (F12), go to the Network tab, and filter by "Fetch/XHR" or "Img". Add an image to Asset Melt Studio and process it. You will see no outbound requests carrying your image data — only the initial load of app code and codec bundles.',
      },
      {
        question: 'Does "no upload" mean the tool works offline?',
        answer:
          'Not by itself. Image processing is local, but Studio is not cached for offline until you download the optional offline pack while you are online. Installing as a PWA is separate and optional.',
      },
      {
        question: 'What formats does the privacy-first studio support?',
        answer:
          'Input: JPEG, PNG, WebP, AVIF, HEIC/HEIF, GIF (first frame), TIFF (first page), BMP, SVG, JXL, QOI. Output: JPEG (MozJPEG), PNG (Oxipng; optional palette), WebP, AVIF, JXL, QOI. All conversions happen locally.',
      },
      {
        question: 'Is there any analytics or tracking?',
        answer:
          'The site uses Google Analytics, Vercel Analytics, and Sentry (errors, performance traces, and sampled session replay of the website UI). Those tools do not receive your photos: image files are not uploaded, I cannot see them, and replay blocks media so image pixels are not recorded. Details are on the privacy policy.',
      },
      {
        question: 'Can I use this for confidential or sensitive images?',
        answer:
          'Yes. Image processing is 100% client-side: nothing is uploaded, I cannot see your files, and session replay does not record photo pixels. That is why Asset Melt is suitable for medical scans, legal documents, client work under NDA, or any image you would not want on a third-party server.',
      },
    ],
    relatedTools: ['squoosh-alternative', 'batch-image-compressor', 'heic-to-jpg'],
    studioSearch: { to: 'webp' },
    keywords:
      'privacy-first image compression, compress images without uploading, private image compressor, no upload image tool, client-side image compression',
    breadcrumbLabel: 'Privacy-First Compression',
    ctaLabel: 'Try it — no upload, no account',
  },
}

export const TOOL_PAGE_LIST = Object.values(TOOL_PAGES)

export function getToolPage(id: ToolPageId): ToolPageContent {
  return TOOL_PAGES[id]
}

export function getToolPageByPath(path: string): ToolPageContent | undefined {
  return TOOL_PAGE_LIST.find((page) => page.path === path)
}

export function getRelatedToolPages(ids: ToolPageId[]): ToolPageContent[] {
  return ids.map((id) => TOOL_PAGES[id])
}
