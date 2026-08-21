import type { StudioInputIntent, StudioOutputIntent } from '@/lib/studio-seo/formats'
import type { PairGuide } from '@/lib/studio-seo/types'
import { OPEN_LIMITATIONS, TIFF_FIRST_PAGE_COPY } from '@/lib/named-limitations'

type PairKey = `${StudioInputIntent}->${StudioOutputIntent}`

export const PAIR_GUIDES: Partial<Record<PairKey, PairGuide>> = {
  'png->webp': {
    hook: 'WebP usually beats PNG on photos and soft gradients while still supporting alpha — ideal for product cutouts, UI chrome, and screenshot-heavy docs.',
    why: [
      'PNG is a workhorse for graphics, but photographic PNG files balloon because every pixel is stored losslessly. Converting PNG to WebP keeps transparency and typically cuts weight for LCP heroes, cards, and marketing sites that already ship a WebP `<picture>` fallback.',
      'Use PNG to WebP when the destination is the web and you still need alpha. Keep a PNG master in git or Figma if you need a lossless original — WebP here is a delivery format, not an archive format.',
      'Asset Melt encodes PNG to WebP with the official WebP encoder in a worker. You can leave quality high for UI, or turn on a size budget when an upload form caps kilobytes.',
    ],
    howItWorks: [
      'Drop PNG files on this page. The pipeline is already set to WebP. Decode happens locally, then optional crop, resize, and filters run before the WebP encode.',
      'Transparency is preserved. If you flatten to JPEG later, that is a different conversion — PNG to WebP is the alpha-friendly path.',
      'Preview with the before/after scrubber. When the WebP looks right, download one file or a ZIP of the batch.',
    ],
    whenToUse: [
      'Product cutouts, app UI, and screenshots that must stay sharp on a transparent canvas.',
      'Replacing bulky PNG photos on a site that already accepts WebP.',
      'Skip PNG to WebP when a printer, CMS, or email client still rejects WebP — use JPEG or PNG instead.',
    ],
    qualityNote:
      'Start around quality 80–90 for photos and 90–100 for UI with text. Size budget (e.g. 100 KB) is available for WebP. If edges look soft, raise quality or skip extra resize.',
    settingsTips: [
      'Leave metadata strip on unless a CMS needs ICC for brand colors.',
      'Resize longest edge to 1600–2000px for most web photos before PNG to WebP.',
      'Also export AVIF in the same run if you want a modern `<picture>` kit.',
    ],
    comparisonRows: [
      ['Compression', 'Lossless (file stays large)', 'Lossy or near-lossless, usually much smaller'],
      ['Transparency', 'Yes (alpha)', 'Yes (alpha)'],
      ['Browser support', 'Universal', 'All modern browsers'],
      ['Size budget', 'Skipped', 'Supported'],
      ['Best for', 'Logos, icons, archival graphics', 'Web delivery with alpha'],
    ],
    typicalRows: [
      ['Ceramic mug product PNG', '1.6 MB PNG', '~210 KB WebP', 'Studio product still'],
      ['Logo / flat illustration', '86 KB PNG', '~40 KB WebP', 'Smaller win; PNG may already be tiny'],
      ['Photographic PNG', '4.2 MB PNG', '~380 KB WebP', 'Largest savings — prefer WebP or AVIF'],
    ],
    beforeAfter: {
      scene: 'graphic',
      scenario: 'A ceramic mug product photo exported as PNG for the web.',
      caption:
        'Illustrative PNG to WebP on a studio product shot — your savings will differ. Drop a PNG above to convert on this device.',
      before: { format: 'PNG', size: '1.6 MB', note: 'Lossless product still' },
      after: { format: 'WebP', size: '210 KB', note: 'Quality ~85' },
      savings: '~87% smaller',
    },
    extraFaq: [
      {
        question: 'Will PNG to WebP keep transparency?',
        answer:
          'Yes. PNG to WebP keeps the alpha channel. That is the usual reason to pick WebP over JPEG for cutouts and UI.',
      },
      {
        question: 'Is PNG to WebP lossless?',
        answer:
          'Default WebP encode is lossy. For a lossless-style WebP, raise quality to the top of the slider and inspect edges. If you need a guaranteed lossless file, stay on PNG (Oxipng) or try JPEG XL.',
      },
      {
        question: 'Should I still keep the original PNG after PNG to WebP?',
        answer:
          'Yes for design masters. Serve WebP (and optionally AVIF) on the site; keep PNG or a layered source in your repo.',
      },
    ],
  },

  'jpeg->webp': {
    hook: 'Most photo libraries are still JPEG. WebP typically trims another 25–35% at similar visual quality — enough to move LCP without recapturing anything.',
    why: [
      'JPEG is universal, but many camera and phone exports are not tuned for the web. JPG to WebP (JPEG to WebP) is the common next step after “upload the camera file.”',
      'Use JPG to WebP for blog heroes, Shopify product photos, and Open Graph images when the host accepts WebP. Keep a JPEG fallback via Also export if older in-app WebViews still appear in analytics.',
      'MozJPEG can also shrink a JPEG in place. Choose JPG to WebP when you want a modern codec, not just a smaller JPG.',
    ],
    howItWorks: [
      'This page pre-selects WebP. Drop JPG / JPEG files, optionally set a size budget, then encode locally with the official WebP encoder.',
      'JPEG has no alpha — JPG to WebP will not invent transparency. If you need a cutout, start from PNG or edit elsewhere first.',
      'Strip GPS if the photos are going public. The metadata inspector shows location tags before you encode.',
    ],
    whenToUse: [
      'Photo-heavy pages where JPEG is already “good enough” but still too heavy.',
      'CMS uploads that accept WebP and reward smaller bytes.',
      'Skip JPG to WebP when the destination only takes JPEG (email, some printers, some DAM tools).',
    ],
    qualityNote:
      'Quality 75–85 matches most “web photo” looks. Below ~70, watch for banding in skies. Size budget is the better control when the form says “max 200 KB.”',
    settingsTips: [
      'Enable size budget instead of guessing quality for upload caps.',
      'Resize to the displayed CSS width × 2 for retina before JPG to WebP.',
      'Progressive JPEG is irrelevant here — you are leaving JPEG.',
    ],
    comparisonRows: [
      ['Typical web photo', 'Baseline JPEG', 'Often 25–35% smaller WebP'],
      ['Transparency', 'No', 'No (source has none)'],
      ['Size budget', 'Supported', 'Supported'],
      ['Re-encoding risk', 'Generational JPEG loss if you keep editing JPG', 'Encode once from the original JPEG'],
      ['Fallback', 'Universal', 'Keep JPEG via Also export if needed'],
    ],
    typicalRows: [
      ['Phone photo ~4 MB', '4.0 MB JPEG', '~450 KB WebP', 'Quality ~80, longest edge 1920px'],
      ['DSLR export ~12 MB', '12 MB JPEG', '~900 KB WebP', 'Resize first or the WebP still stays large'],
      ['Already-optimized JPEG', '180 KB JPEG', '~140 KB WebP', 'Smaller win — do not expect TinyPNG-scale drops'],
    ],
    beforeAfter: {
      scene: 'photo',
      scenario: 'A mountain landscape destined for a blog hero.',
      caption:
        'Illustrative JPG to WebP at web quality — not a live encode of this sample. Drop a JPEG above to convert locally.',
      before: { format: 'JPEG', size: '3.2 MB', note: 'Camera / export JPEG' },
      after: { format: 'WebP', size: '390 KB', note: 'Quality ~80, ~1920px edge' },
      savings: '~88% smaller',
    },
    extraFaq: [
      {
        question: 'Is JPG to WebP the same as JPEG to WebP?',
        answer:
          'Yes. JPG and JPEG are the same format. This JPG to WebP page accepts both extensions and encodes WebP locally.',
      },
      {
        question: 'Will JPG to WebP look worse than the original JPEG?',
        answer:
          'At quality 80–90, most photos look the same at web sizes. Use the scrubber. If you see artifacts, raise quality or skip extra resize.',
      },
      {
        question: 'Can I keep a JPEG fallback while I convert JPG to WebP?',
        answer:
          'Yes. Format → Also export → JPEG fallback. Process once; download is a ZIP with webp/ and jpeg/ folders. JPEG fallback flattens transparency (not an issue for camera JPEGs).',
      },
    ],
  },

  'png->avif': {
    hook: 'AVIF often wins on screenshots and illustrations where PNG files balloon. Preview carefully around sharp text — AVIF can soften type at aggressive quality.',
    why: [
      'PNG to AVIF is the “smallest still that still looks like a screenshot” path for modern browsers. AVIF (AV1 stills) usually beats WebP on the same source when you can afford a slower encode.',
      'Use PNG to AVIF for LCP-critical graphics once your CDN or `<picture>` stack has a WebP or JPEG fallback. Do not replace a PNG icon set blindly — tiny logos sometimes stay smaller as Oxipng.',
      'Encoding uses libavif in WebAssembly on your machine. Slow AVIF speed settings produce smaller files; fast settings finish sooner.',
    ],
    howItWorks: [
      'Drop PNGs. Output is AVIF. Optional Reduce palette is a PNG-only trick — it does not apply to AVIF. Use AVIF quality/speed instead.',
      'Alpha is supported. Check hair, glass, and drop shadows in the preview; very low quality can posterize semi-transparent edges.',
      'Size budget works for AVIF. That is often easier than picking a quality number for PNG to AVIF.',
    ],
    whenToUse: [
      'Heavy PNG screenshots and product graphics on a site that already serves AVIF.',
      'When WebP is still larger than you want for a hero.',
      'Skip PNG to AVIF for email, older apps, or any host that cannot decode AVIF.',
    ],
    qualityNote:
      'Quality 45–60 is a common stills range in libavif-style sliders; trust the preview more than the number. Raise quality if text in a screenshot looks mushy.',
    settingsTips: [
      'Lower AVIF speed (more effort) when the file is a one-off hero.',
      'Keep a WebP sibling via Also export for broader reach.',
      'Do not enable PNG Reduce palette here — you are not emitting PNG.',
    ],
    comparisonRows: [
      ['Typical screenshot', 'Large lossless PNG', 'Often the smallest modern still'],
      ['Encode time', 'Fast (Oxipng)', 'Slower (AV1)'],
      ['Transparency', 'Yes', 'Yes'],
      ['Size budget', 'Skipped for PNG', 'Supported for AVIF'],
      ['Support', 'Universal', 'Modern browsers; keep a fallback'],
    ],
    typicalRows: [
      ['App screenshot', '2.1 MB PNG', '~140 KB AVIF', 'Watch small text'],
      ['Illustration with alpha', '900 KB PNG', '~95 KB AVIF', 'Check semi-transparent edges'],
      ['Tiny 32px icon', '3 KB PNG', '~2 KB AVIF', 'Not worth a format change'],
    ],
    beforeAfter: {
      scene: 'screenshot',
      scenario: 'A phone UI / app dashboard capture exported as PNG.',
      caption:
        'Illustrative PNG to AVIF on a UI screenshot. Preview text sharpness before you batch — AVIF encode is slower than WebP.',
      before: { format: 'PNG', size: '2.0 MB', note: 'Lossless UI capture' },
      after: { format: 'AVIF', size: '150 KB', note: 'Mid quality, balanced speed' },
      savings: '~93% smaller',
    },
    extraFaq: [
      {
        question: 'Is PNG to AVIF better than PNG to WebP?',
        answer:
          'Often on photos and complex screenshots, yes. On tiny flat icons, PNG or WebP can win. Compare with Also export if you need both.',
      },
      {
        question: 'Why is PNG to AVIF slower than PNG to WebP?',
        answer:
          'AVIF uses AV1 still encoding, which is heavier than WebP. Asset Melt runs it in a worker so the tab stays usable; Pause if you need to grab finished files mid-batch.',
      },
      {
        question: 'Does PNG to AVIF support transparency?',
        answer: 'Yes. AVIF can store alpha. Inspect edges at your chosen quality before you ship.',
      },
    ],
  },

  'jpeg->avif': {
    hook: 'AVIF is the strongest size win for photo heroes when your audience is on modern browsers. Keep WebP or JPEG as a fallback.',
    why: [
      'JPG to AVIF (JPEG to AVIF) is the usual “we already have photos, we need Core Web Vitals” conversion. AVIF often beats both JPEG and WebP on noisy camera images.',
      'Use JPG to AVIF for above-the-fold heroes and gallery thumbs if your CDN or build step can emit a fallback. Do not send AVIF-only to a random email list.',
      'libavif runs locally. Size budget is the practical control when a CMS says 200 KB.',
    ],
    howItWorks: [
      'Drop JPEGs. The pipeline is AVIF. Optional resize to the displayed width × 2, then encode.',
      'There is no alpha to preserve from JPEG. JPG to AVIF is a photo path, not a cutout path.',
      'Also export WebP if you want a two-format kit from one queue.',
    ],
    whenToUse: [
      'Marketing sites with a modern browser baseline.',
      'When JPG to WebP still leaves heroes too heavy.',
      'Skip JPG to AVIF for print PDFs, some social uploaders, and tools that only sniff JPEG magic bytes.',
    ],
    qualityNote:
      'Mid-range AVIF quality plus a size budget beats guessing. If skin tones band, raise quality or disable extra sharpen.',
    settingsTips: [
      'Strip GPS on people photos before you publish.',
      'Use Lanczos or Magic Kernel resize — do not upscale.',
      'AVIF lossless exists but will not beat a well-tuned lossy still for web photos.',
    ],
    comparisonRows: [
      ['Photo compression', 'Mature, universal JPEG', 'Usually smallest modern still'],
      ['Encode time', 'Fast (MozJPEG)', 'Slower (AV1)'],
      ['Size budget', 'Supported', 'Supported'],
      ['Transparency', 'No', 'No (JPEG source)'],
      ['Fallback plan', 'Not needed', 'Keep WebP or JPEG'],
    ],
    typicalRows: [
      ['Phone hero', '3.8 MB JPEG', '~180 KB AVIF', 'Strongest typical saving'],
      ['Studio JPEG', '8 MB JPEG', '~320 KB AVIF', 'Resize first for web'],
      ['Already 120 KB JPEG', '120 KB JPEG', '~70 KB AVIF', 'Diminishing returns'],
    ],
    beforeAfter: {
      scene: 'photo',
      scenario: 'A landscape hero for a landing page.',
      caption:
        'Illustrative JPG to AVIF. Encode is slower than JPEG — worth it for LCP if you ship a fallback.',
      before: { format: 'JPEG', size: '3.6 MB', note: 'Photo export' },
      after: { format: 'AVIF', size: '170 KB', note: 'Web hero, mid quality' },
      savings: '~95% smaller',
    },
    extraFaq: [
      {
        question: 'Should I convert JPG to AVIF or JPG to WebP?',
        answer:
          'AVIF usually wins on photos. WebP is faster to encode and slightly older in support. Many teams emit both (Also export) and let `<picture>` choose.',
      },
      {
        question: 'Can I hit a KB cap with JPG to AVIF?',
        answer:
          'Yes. Size budget searches quality (and optionally resize) until the AVIF fits. Dedicated pages exist at /compress/under-50kb, /compress/under-100kb, and /compress/under-200kb.',
      },
      {
        question: 'Will JPG to AVIF strip EXIF?',
        answer:
          'AVIF, JXL, and QOI always export pixels only in Asset Melt. GPS and camera tags will not be in the AVIF. Inspect the source JPEG first if you need to record capture data elsewhere.',
      },
    ],
  },

  'webp->avif': {
    hook: 'If you already ship WebP, AVIF is the next step for LCP-critical images — keep WebP as a fallback rather than deleting the library.',
    why: [
      'WebP to AVIF is an upgrade path, not a replacement for every asset. Re-encoding a lossy WebP into AVIF cannot recover detail the WebP already discarded.',
      'Prefer WebP to AVIF when the WebP is a high-quality intermediate or when you still have the original JPEG/PNG. If the WebP is already 40 KB, another codec will not magically restore texture.',
      'Use this page to standardize on AVIF for new deploys while Also export keeps WebP in the same ZIP.',
    ],
    howItWorks: [
      'Drop WebP files. Output is AVIF. Decode locally, then libavif encode.',
      'Animated WebP is not a first-class path here — Asset Melt is a stills studio. Treat this as still WebP to AVIF.',
      'Compare with the scrubber; if the AVIF looks softer, the source WebP may already be too aggressive.',
    ],
    whenToUse: [
      'Migrating a WebP CDN folder to AVIF + WebP `<picture>`.',
      'When analytics show modern Chrome/Safari share and you want smaller LCP.',
      'Skip WebP to AVIF if you still have the camera original — convert that instead.',
    ],
    qualityNote:
      'Do not stack heavy loss. If the WebP was saved at quality 60, AVIF cannot invent detail. Start from the original when you can.',
    settingsTips: [
      'Keep WebP via Also export so you are not AVIF-only.',
      'Avoid extra sharpen on already-compressed WebP.',
      'Size budget still works on the AVIF output.',
    ],
    comparisonRows: [
      ['Role', 'Current web delivery', 'Next-gen still'],
      ['Re-encode cost', 'Already lossy', 'Second generation unless source is high quality'],
      ['Size budget', 'Supported', 'Supported'],
      ['Alpha', 'Yes if present', 'Yes if present'],
      ['Support', 'Very wide', 'Modern; keep WebP'],
    ],
    typicalRows: [
      ['High-quality WebP photo', '420 KB WebP', '~210 KB AVIF', 'Worth it for heroes'],
      ['Already tiny WebP', '48 KB WebP', '~36 KB AVIF', 'Small win'],
      ['Transparent UI WebP', '160 KB WebP', '~90 KB AVIF', 'Check edges'],
    ],
    beforeAfter: {
      scene: 'photo',
      scenario: 'A landscape WebP hero upgraded to AVIF.',
      caption:
        'Illustrative WebP to AVIF. Best results start from a high-quality WebP or the original JPEG.',
      before: { format: 'WebP', size: '400 KB', note: 'Existing web delivery' },
      after: { format: 'AVIF', size: '200 KB', note: 'Same dimensions' },
      savings: '~50% smaller',
    },
    extraFaq: [
      {
        question: 'Is WebP to AVIF lossless?',
        answer:
          'No, unless you turn on AVIF lossless (larger files). Normal WebP to AVIF is lossy on top of whatever the WebP already discarded.',
      },
      {
        question: 'Should I delete WebP after WebP to AVIF?',
        answer:
          'Usually no. Keep WebP as a fallback after WebP to AVIF. Also export can write both from one run.',
      },
      {
        question: 'Can I convert animated WebP to AVIF?',
        answer:
          'Asset Melt is a stills pipeline. Drop a still WebP, or extract a frame elsewhere first. Animation is not encoded.',
      },
    ],
  },

  'heic->jpeg': {
    hook: 'iPhone Camera rolls default to HEIC; JPG remains the universal share and CMS upload format. HEIC is decoded through a JPEG intermediate (quality 0.92) before MozJPEG encode.',
    why: [
      'HEIC to JPG (HEIC to JPEG) is the conversion people search when an upload form rejects iPhone photos. Schools, insurers, CRMs, and many printers still want JPEG.',
      'HEIC / HEIF is decoded through JPEG at quality 0.92 before the rest of the pipeline, so this is a compatibility handoff — not a bit-perfect HEIC round-trip.',
      'Everything still runs in the browser. The photo is not uploaded; I cannot see it.',
    ],
    howItWorks: [
      'Drop .heic / .heif files. Output is JPEG via MozJPEG after the HEIC decode bounce.',
      'Preview, optionally resize for email, strip GPS if you are sending the file to a third party, then download.',
      'Batch a whole Camera roll folder if you need a ZIP of JPEGs for a trip or a client.',
    ],
    whenToUse: [
      'Any form that says “JPG only.”',
      'Sharing with Windows users who do not have HEIC codecs installed.',
      'Skip HEIC to JPG when the destination already accepts HEIC and you want to keep Apple’s smaller original.',
    ],
    qualityNote:
      'You cannot recover detail the 0.92 JPEG bounce already quantized. For web delivery after HEIC, consider HEIC to WebP or HEIC to AVIF on this same Studio instead of stacking another heavy JPEG.',
    settingsTips: [
      'Strip GPS before public posts.',
      'Use size budget if the form has a 2 MB or 200 KB cap.',
      'MozJPEG progressive helps web previews; leave it on for sites.',
    ],
    comparisonRows: [
      ['Phone original', 'HEIC / HEIF', 'JPEG everyone accepts'],
      ['Decode path', 'Native HEIC', 'HEIC → JPEG 0.92 → MozJPEG'],
      ['Lossless from HEIC?', 'N/A', 'No — bounce is lossy'],
      ['Size budget', 'N/A on input', 'Supported on JPEG out'],
      ['Metadata inspect', 'Read before bounce', 'Export follows Format → Metadata'],
    ],
    typicalRows: [
      ['iPhone photo', '~2.5 MB HEIC', '~900 KB JPEG', 'Quality ~85 after bounce'],
      ['Email-sized', '~2.5 MB HEIC', '~250 KB JPEG', 'Resize longest edge ~1280px'],
      ['Form with 100 KB cap', '~2.5 MB HEIC', '~95 KB JPEG', 'Size budget on'],
    ],
    beforeAfter: {
      scene: 'photo',
      scenario: 'An outdoor Camera roll photo a website will not accept as HEIC.',
      caption:
        'Illustrative HEIC to JPG. HEIC is decoded through JPEG at quality 0.92 — not lossless from the original HEIC.',
      before: { format: 'HEIC', size: '2.4 MB', note: 'iPhone Camera roll' },
      after: { format: 'JPEG', size: '860 KB', note: 'MozJPEG, shareable' },
      savings: 'Universal JPG, not always smaller',
    },
    extraFaq: [
      {
        question: 'Why is HEIC to JPG not lossless?',
        answer: OPEN_LIMITATIONS['4.3'].copy,
      },
      {
        question: 'Is HEIC to JPG the same as HEIC to JPEG?',
        answer:
          'Yes. This HEIC to JPG page is the JPEG path. JPG and JPEG are the same format on disk.',
      },
      {
        question: 'Can I convert HEIC to JPG on iPhone Safari?',
        answer:
          'Yes, in a modern browser with WebAssembly. Processing stays on the device. Very large batches still depend on RAM.',
      },
    ],
  },

  'heic->png': {
    hook: 'HEIC is decoded through a JPEG intermediate (quality 0.92), so HEIC to PNG is not lossless from the original HEIC — it is a portable handoff after that decode, useful for editors that want PNG.',
    why: [
      'Some tools ingest PNG more happily than JPEG (stickers, certain print queues, apps that expect alpha). HEIC to PNG gives them a file they understand.',
      'Do not expect a lossless HEIC archive. The JPEG bounce already quantized the photo. HEIC to PNG then stores that decode as Oxipng (lossless from the bounced bitmap, not from HEIC).',
      'If you needed true lossless from iPhone, you would have to capture in a lossless mode Apple does not use for Camera roll HEIC.',
    ],
    howItWorks: [
      'Drop HEIC. Decode bounce, then PNG encode with Oxipng. Reduce palette is optional if you want TinyPNG-style PNG-8 — usually wrong for photos.',
      'Size budget skips PNG. Use resize or switch to JPEG/WebP if you need a KB cap.',
      'Alpha: Camera HEIC photos are typically opaque. You will get an opaque PNG unless the HEIC actually had transparency.',
    ],
    whenToUse: [
      'An editor or printer that insists on PNG.',
      'A workflow that composites photos onto graphics and wants PNG intermediates.',
      'Skip HEIC to PNG for web photos — HEIC to WebP or HEIC to JPEG will be smaller.',
    ],
    qualityNote:
      'Leave Reduce palette off for photos. Palette PNG-8 banding on skin is ugly. Oxipng alone will be large compared with JPEG.',
    settingsTips: [
      'Resize before PNG if the PNG will only be a 800px web asset — full-resolution PNG from HEIC is huge.',
      'Inspect EXIF on the HEIC before bounce if you need capture data.',
      'Prefer HEIC to JPG when the goal is email or CMS upload.',
    ],
    comparisonRows: [
      ['From HEIC', 'Lossy camera format', 'PNG after JPEG 0.92 bounce'],
      ['File size', 'Small on disk', 'Often much larger PNG'],
      ['Lossless from HEIC?', 'N/A', 'No'],
      ['Size budget', 'N/A', 'Skipped for PNG'],
      ['Reduce palette', 'N/A', 'Optional; photos usually should not'],
    ],
    typicalRows: [
      ['iPhone still as PNG', '~2.5 MB HEIC', '~8 MB PNG', 'Lossless Oxipng of bounced pixels'],
      ['Resized 1200px PNG', '~2.5 MB HEIC', '~1.4 MB PNG', 'Still heavier than JPEG'],
      ['Palette PNG-8', '~2.5 MB HEIC', '~400 KB PNG', 'Banding risk — preview first'],
    ],
    beforeAfter: {
      scene: 'photo',
      scenario: 'An outdoor HEIC that must open in a PNG-only editor.',
      caption:
        'Illustrative HEIC to PNG. The PNG is Oxipng of a JPEG-bounced decode — not a lossless HEIC copy.',
      before: { format: 'HEIC', size: '2.4 MB', note: 'Camera original' },
      after: { format: 'PNG', size: '7.8 MB', note: 'Oxipng, full resolution' },
      savings: 'Larger file, more compatible',
    },
    extraFaq: [
      {
        question: 'Why is my HEIC to PNG file bigger than the HEIC?',
        answer:
          'HEIC is a lossy camera format. PNG stores the decoded pixels losslessly (after the JPEG 0.92 bounce), so HEIC to PNG often grows. That is expected.',
      },
      {
        question: 'Is HEIC to PNG lossless?',
        answer: OPEN_LIMITATIONS['4.3'].copy,
      },
      {
        question: 'Can size budget run on HEIC to PNG?',
        answer:
          'No. Size-budget encoding skips PNG. Resize, use Reduce palette (graphics only), or convert HEIC to JPEG / WebP / AVIF instead.',
      },
    ],
  },

  'heic->webp': {
    hook: 'HEIC is decoded through a JPEG intermediate first, then encoded to WebP locally — useful when the destination is a website rather than email or print.',
    why: [
      'HEIC to WebP is the “iPhone photo, web delivery” path. You avoid uploading Camera roll files to a random converter, and you get a format CDNs like.',
      'The HEIC JPEG bounce (quality 0.92) still applies. HEIC to WebP is not a lossless iPhone archive; it is a private, local publish step.',
      'Prefer this over HEIC to PNG for websites. Prefer HEIC to JPG when the host only takes JPEG.',
    ],
    howItWorks: [
      'Drop HEIC. Bounce, then WebP encode. Size budget works on the WebP.',
      'Strip GPS for public pages. Inspect tags on the HEIC before encode.',
      'Also export JPEG if you need a fallback folder in the ZIP.',
    ],
    whenToUse: [
      'Personal sites, docs, and shops that accept WebP.',
      'Shrinking a vacation folder for a gallery without a server.',
      'Skip HEIC to WebP for institutions that still demand JPG.',
    ],
    qualityNote:
      'Treat quality like a normal photo WebP (75–90). The bounce already set a ceiling; do not crush quality further unless you must hit a tiny budget.',
    settingsTips: [
      'Size budget is the right tool for “under 200 KB” forms that accept WebP.',
      'Resize to display size × 2.',
      'Also export AVIF for modern `<picture>` if encode time is OK.',
    ],
    comparisonRows: [
      ['Input', 'HEIC Camera roll', 'WebP for the web'],
      ['Decode', 'JPEG 0.92 bounce', 'Then official WebP encoder'],
      ['Size budget', 'N/A on HEIC', 'Supported on WebP'],
      ['Universal share', 'No (Windows often fails)', 'Better, not email-universal'],
      ['Lossless from HEIC?', 'No', 'No'],
    ],
    typicalRows: [
      ['iPhone → web card', '~2.5 MB HEIC', '~280 KB WebP', 'Quality ~80'],
      ['iPhone → 100 KB cap', '~2.5 MB HEIC', '~95 KB WebP', 'Size budget'],
      ['iPhone → AVIF instead', '~2.5 MB HEIC', 'Often smaller AVIF', 'See HEIC to AVIF'],
    ],
    beforeAfter: {
      scene: 'photo',
      scenario: 'An outdoor iPhone photo published on a marketing site.',
      caption:
        'Illustrative HEIC to WebP after the local JPEG bounce. Files never leave your device.',
      before: { format: 'HEIC', size: '2.4 MB', note: 'Camera roll' },
      after: { format: 'WebP', size: '270 KB', note: 'Web delivery' },
      savings: '~89% smaller',
    },
    extraFaq: [
      {
        question: 'Does HEIC to WebP upload to iCloud or a server?',
        answer:
          'No. HEIC to WebP runs in your browser. Photos are not uploaded, and I cannot see them.',
      },
      {
        question: 'Why mention a JPEG bounce on a HEIC to WebP page?',
        answer: OPEN_LIMITATIONS['4.3'].copy,
      },
      {
        question: 'HEIC to WebP vs HEIC to JPG — which should I pick?',
        answer:
          'WebP for websites that accept it. JPG for forms, email, and people who just need a photo that opens everywhere.',
      },
    ],
  },

  'heic->avif': {
    hook: 'HEIC is decoded through a JPEG intermediate first, then encoded to AVIF. Private, local, but not a lossless HEIC round-trip — and often the smallest web still you can get from an iPhone photo.',
    why: [
      'HEIC to AVIF is for teams that already ship AVIF and want Camera roll photos in the same pipeline without a desktop app.',
      'Because of the JPEG bounce, you are encoding AVIF from an already-quantized bitmap. It is still usually smaller than JPEG for heroes.',
      'Keep a WebP or JPEG fallback. AVIF-only iPhone galleries will fail in older browsers.',
    ],
    howItWorks: [
      'Drop HEIC. Bounce, then libavif. Encode is slower than HEIC to JPG — expected.',
      'Size budget works. Use it when LCP budgets are strict.',
      'Also export WebP for the ZIP kit.',
    ],
    whenToUse: [
      'Modern marketing sites with `<picture>`.',
      'When HEIC to WebP is still larger than you want.',
      'Skip HEIC to AVIF for “email this to grandma.” Use HEIC to JPG.',
    ],
    qualityNote:
      'Preview skin and sky. Low AVIF quality plus the bounce can look waxy. Size budget with a reasonable floor is safer than quality 20.',
    settingsTips: [
      'Strip GPS.',
      'Do not AVIF-lossless iPhone photos for the web — files get large.',
      'Pause long batches; AVIF is CPU-heavy.',
    ],
    comparisonRows: [
      ['Goal', 'iPhone original', 'Smallest common web still'],
      ['Decode', 'JPEG 0.92 bounce', 'Then libavif'],
      ['Encode time', 'Fast HEIC on device', 'Slower AVIF in WASM'],
      ['Size budget', 'N/A', 'Supported'],
      ['Fallback needed', 'N/A', 'Yes (WebP/JPEG)'],
    ],
    typicalRows: [
      ['iPhone hero', '~2.5 MB HEIC', '~160 KB AVIF', 'Modern browsers'],
      ['iPhone + fallback ZIP', '~2.5 MB HEIC', 'AVIF + WebP folders', 'Also export'],
      ['Tiny avatar', '~2.5 MB HEIC', '~25 KB AVIF', 'Resize to 256px first'],
    ],
    beforeAfter: {
      scene: 'photo',
      scenario: 'An outdoor iPhone photo used as an LCP hero.',
      caption:
        'Illustrative HEIC to AVIF. Not lossless from HEIC — the JPEG 0.92 bounce runs first.',
      before: { format: 'HEIC', size: '2.4 MB', note: 'Camera roll' },
      after: { format: 'AVIF', size: '155 KB', note: 'Hero still' },
      savings: '~94% smaller',
    },
    extraFaq: [
      {
        question: 'Is HEIC to AVIF lossless?',
        answer: OPEN_LIMITATIONS['4.3'].copy,
      },
      {
        question: 'Why is HEIC to AVIF slow?',
        answer:
          'AV1 still encoding is heavier than MozJPEG. Asset Melt uses a worker pool (up to 4). Pause to collect finished files.',
      },
      {
        question: 'Can I do HEIC to AVIF and WebP together?',
        answer:
          'Yes. Also export WebP (and optional JPEG). One process; ZIP with format folders.',
      },
    ],
  },

  'png->jpeg': {
    hook: 'Flatten graphics into smaller photo-style files when a host rejects PNG or when a screenshot is really a photo in disguise.',
    why: [
      'PNG to JPG (PNG to JPEG) discards alpha and uses MozJPEG. That is correct for photographs saved as PNG, and wrong for logos that need a crisp transparent edge.',
      'Many “PNG screenshots” of games or camera apps are photos. PNG to JPEG will shrink them with MozJPEG locally — no upload required.',
      'If you need transparency, do not convert PNG to JPEG — use WebP or stay on PNG.',
    ],
    howItWorks: [
      'Drop PNGs. Output JPEG. Transparent pixels flatten (typically against a background the encoder treats as opaque — preview the edges).',
      'Size budget works. Quality slider is MozJPEG.',
      'Reduce palette does not apply — you are leaving PNG.',
    ],
    whenToUse: [
      'Photographic PNGs and screenshots without important alpha.',
      'Upload forms that only allow JPG.',
      'Skip PNG to JPEG for logos, icons, and UI chrome with transparency.',
    ],
    qualityNote:
      'Quality 80–90 for screenshots with text; lower for pure photos. Watch color banding on UI gradients.',
    settingsTips: [
      'If edges look dirty, the PNG had alpha — pick WebP instead.',
      'Progressive JPEG on for web, off if a picky printer complains.',
      'Strip metadata unless you need ICC for print.',
    ],
    comparisonRows: [
      ['Alpha', 'Supported', 'Flattened'],
      ['Photos saved as PNG', 'Huge', 'Much smaller JPEG'],
      ['Logos', 'Correct format', 'Usually the wrong format'],
      ['Size budget', 'Skipped', 'Supported'],
      ['Codec', 'Oxipng / palette', 'MozJPEG'],
    ],
    typicalRows: [
      ['Photo exported PNG', '5.5 MB PNG', '~420 KB JPEG', 'Right conversion'],
      ['UI screenshot', '1.2 MB PNG', '~180 KB JPEG', 'Watch text'],
      ['Logo with alpha', '24 KB PNG', 'Avoid JPEG', 'Use WebP or PNG'],
    ],
    beforeAfter: {
      scene: 'photo',
      scenario: 'A landscape that was saved as PNG instead of JPEG.',
      caption:
        'Illustrative PNG to JPG. Transparency is flattened — do not use this path for logos that need alpha.',
      before: { format: 'PNG', size: '5.2 MB', note: 'Photographic PNG' },
      after: { format: 'JPEG', size: '400 KB', note: 'MozJPEG ~85' },
      savings: '~92% smaller',
    },
    extraFaq: [
      {
        question: 'Does PNG to JPG keep transparency?',
        answer:
          'No. JPEG has no alpha. PNG to JPEG flattens. Use PNG to WebP if you need a smaller file with transparency.',
      },
      {
        question: 'Is PNG to JPG the same as PNG to JPEG?',
        answer:
          'Yes. This PNG to JPG page writes JPEG files — JPG and JPEG are the same image format.',
      },
      {
        question: 'Should I Reduce palette before PNG to JPEG?',
        answer:
          'No. Reduce palette is a PNG output control. You are encoding JPEG, so the palette toggle does not apply.',
      },
    ],
  },

  'jpeg->png': {
    hook: 'Need a lossless intermediate from a photo — for example a paint tool that prefers PNG, or a composite that will be edited again.',
    why: [
      'JPG to PNG (JPEG to PNG) does not add detail. It stores the already-lossy JPEG pixels in a lossless container, so the PNG is usually larger.',
      'That is still useful: many editors, print kiosks, and “transparent PNG” workflows want PNG even when the source was a photo.',
      'Do not convert JPG to PNG to “improve quality.” You cannot. Convert JPG to PNG to change the container and optionally add edits (crop, resize) locally.',
    ],
    howItWorks: [
      'Drop JPEGs. Oxipng writes a lossless PNG of the decoded bitmap. Reduce palette can shrink logos-from-photos but will posterize real photographs.',
      'Size budget skips PNG.',
      'No alpha appears magically — JPEG had none.',
    ],
    whenToUse: [
      'An app that only imports PNG.',
      'A lossless checkpoint after crop/resize before more edits.',
      'Skip JPG to PNG for web delivery of photos — use WebP or AVIF.',
    ],
    qualityNote:
      'Leave Reduce palette off for photos. If the JPEG is a graphic (a poster saved as JPG), palette PNG-8 can be TinyPNG-small.',
    settingsTips: [
      'Crop and resize before PNG so you are not Oxipng-ing 24 MP for a 600px asset.',
      'Filename pattern `{name}.png` keeps names obvious in a ZIP.',
      'If you needed smaller files, you wanted JPG to WebP, not JPG to PNG.',
    ],
    comparisonRows: [
      ['Quality', 'Already lossy JPEG', 'Lossless copy of those pixels'],
      ['Typical size', 'Smaller', 'Larger PNG'],
      ['Alpha', 'No', 'No (unless you composite elsewhere)'],
      ['Size budget', 'Supported on JPEG', 'Skipped on PNG'],
      ['Web photos', 'Appropriate', 'Usually the wrong delivery format'],
    ],
    typicalRows: [
      ['Phone JPEG as PNG', '2.2 MB JPEG', '~9 MB PNG', 'Expected growth'],
      ['Cropped 800px PNG', '2.2 MB JPEG', '~900 KB PNG', 'Resize first'],
      ['Graphic JPEG + palette', '400 KB JPEG', '~80 KB PNG-8', 'Only if it is flat art'],
    ],
    beforeAfter: {
      scene: 'photo',
      scenario: 'A landscape JPEG that must import into a PNG-only editor.',
      caption:
        'Illustrative JPG to PNG. The PNG grows because it is lossless Oxipng of already-decoded JPEG pixels — quality does not go up.',
      before: { format: 'JPEG', size: '2.1 MB', note: 'Photo' },
      after: { format: 'PNG', size: '8.6 MB', note: 'Oxipng, full res' },
      savings: 'Larger, editable container',
    },
    extraFaq: [
      {
        question: 'Will JPG to PNG make the photo sharper?',
        answer:
          'No. JPG to PNG cannot recover JPEG artifacts. It only stores the current pixels losslessly.',
      },
      {
        question: 'Why is JPG to PNG bigger?',
        answer:
          'JPEG throws away data on purpose. PNG keeps every remaining pixel. Bigger is normal.',
      },
      {
        question: 'Can I get TinyPNG sizes from JPG to PNG?',
        answer:
          'Only with Reduce palette (lossy PNG-8), which is meant for graphics. Photos usually look worse. For small photos, encode WebP or AVIF instead.',
      },
    ],
  },

  'webp->jpeg': {
    hook: 'Compatibility when WebP is not accepted — email, some DAM tools, and older uploaders still want JPEG.',
    why: [
      'WebP to JPG (WebP to JPEG) is a fallback conversion. You give up WebP’s extra compression (and alpha) to get a file that opens everywhere.',
      'If the WebP had transparency, JPEG will flatten it. Preview edges.',
      'Re-encoding a lossy WebP to JPEG is a second generation of loss. Keep the original if you still have it.',
    ],
    howItWorks: [
      'Drop WebP. MozJPEG out. Size budget available.',
      'Animated WebP is not handled as animation — stills only.',
      'Also export is for extra modern formats; here the point is leaving WebP.',
    ],
    whenToUse: [
      'A client or CMS that rejects WebP.',
      'Attaching a WebP to an email thread.',
      'Skip WebP to JPEG if the host already accepts WebP.',
    ],
    qualityNote:
      'Quality 85–90 to avoid stacking artifacts. If it looks bad, the WebP was already too low — go back to the original.',
    settingsTips: [
      'Flatten awareness: put important content away from transparent edges.',
      'Progressive JPEG for web previews.',
      'Strip metadata if the WebP carried none you need (AVIF/JXL/QOI never keep it; WebP might depending on source).',
    ],
    comparisonRows: [
      ['Support', 'Modern web', 'Universal JPEG'],
      ['Alpha', 'Possible', 'Flattened'],
      ['Size', 'Usually smaller WebP', 'Usually larger JPEG'],
      ['Size budget', 'Supported', 'Supported'],
      ['Animation', 'Possible in WebP', 'Not encoded'],
    ],
    typicalRows: [
      ['Opaque WebP photo', '280 KB WebP', '~340 KB JPEG', 'Slightly larger, compatible'],
      ['Transparent WebP', '120 KB WebP', '~90 KB JPEG', 'Alpha flattened — check edges'],
      ['Tiny WebP icon', '8 KB WebP', '~12 KB JPEG', 'Prefer PNG if you needed alpha'],
    ],
    beforeAfter: {
      scene: 'photo',
      scenario: 'A landscape WebP that must be attached as JPEG.',
      caption:
        'Illustrative WebP to JPG. JPEG is for compatibility, not for beating WebP on size.',
      before: { format: 'WebP', size: '270 KB', note: 'Web original' },
      after: { format: 'JPEG', size: '330 KB', note: 'MozJPEG, universal' },
      savings: 'More compatible, often larger',
    },
    extraFaq: [
      {
        question: 'Will WebP to JPG keep transparency?',
        answer: 'No. JPEG flattens alpha. Use WebP to PNG if you need a lossless alpha-capable still.',
      },
      {
        question: 'Is WebP to JPG bigger than the WebP?',
        answer:
          'Often yes. You are choosing compatibility over compression when you convert WebP to JPG.',
      },
      {
        question: 'Can I convert animated WebP to JPEG?',
        answer:
          'Asset Melt processes stills. You will get a still JPEG of the decoded frame, not an animation.',
      },
    ],
  },

  'avif->jpeg': {
    hook: 'Fallback-friendly exports from AVIF sources when a partner, printer, or CMS cannot decode AVIF.',
    why: [
      'AVIF to JPG (AVIF to JPEG) exists because AVIF won the size war but not every inbox. You trade bytes for compatibility.',
      'This is a lossy-to-lossy conversion. If you still have the JPEG/PNG/HEIC original, convert that instead of AVIF to JPEG.',
      'Useful when a designer hands you AVIF masters and the brand guidelines still say “upload JPG.”',
    ],
    howItWorks: [
      'Drop AVIF. Decode locally, MozJPEG encode. Size budget on.',
      'Alpha in AVIF will flatten.',
      'Stills only — this is not an AVIF sequence player.',
    ],
    whenToUse: [
      'Handoffs to tools that reject AVIF.',
      'Print shops and email.',
      'Skip AVIF to JPEG for web if the site already serves AVIF.',
    ],
    qualityNote:
      'Stay at 85+ unless you must hit a tiny cap. Stacking AVIF + JPEG artifacts shows up in gradients.',
    settingsTips: [
      'Preview skin tones.',
      'Keep the AVIF as the archival web file; JPEG is the share copy.',
      'Also export is less relevant when JPEG is the whole point.',
    ],
    comparisonRows: [
      ['Web size', 'Usually smallest', 'Larger JPEG'],
      ['Compatibility', 'Modern browsers', 'Universal'],
      ['Alpha', 'Possible', 'Flattened'],
      ['Size budget', 'Supported', 'Supported'],
      ['Re-encode', 'Already lossy', 'Second generation'],
    ],
    typicalRows: [
      ['AVIF hero', '160 KB AVIF', '~240 KB JPEG', 'Compatibility tax'],
      ['AVIF with alpha', '90 KB AVIF', '~110 KB JPEG', 'Flattened'],
      ['From original instead', 'Better', 'Better', 'Prefer original → JPEG'],
    ],
    beforeAfter: {
      scene: 'photo',
      scenario: 'A landscape AVIF hero that must upload as JPEG.',
      caption:
        'Illustrative AVIF to JPG. Prefer converting the original camera file if you still have it.',
      before: { format: 'AVIF', size: '155 KB', note: 'Modern still' },
      after: { format: 'JPEG', size: '235 KB', note: 'Universal share' },
      savings: 'More compatible, usually larger',
    },
    extraFaq: [
      {
        question: 'Should I convert AVIF to JPG or keep AVIF?',
        answer:
          'Keep AVIF for the site. AVIF to JPEG is for destinations that cannot decode AVIF yet.',
      },
      {
        question: 'Does AVIF to JPG keep HDR?',
        answer:
          'Asset Melt’s still pipeline is a standard web encode, not an HDR mastering suite. Treat output as a conventional JPEG.',
      },
      {
        question: 'Can I batch AVIF to JPG?',
        answer:
          'Yes. Queue AVIF files, process in parallel (up to 4 workers), then download a ZIP of JPEGs.',
      },
    ],
  },

  'avif->webp': {
    hook: 'Wider WebP reach from AVIF masters when you need a fallback that is still smaller than JPEG.',
    why: [
      'AVIF to WebP is a fallback factory: AVIF for Chrome/Safari-new, WebP for everyone else modern.',
      'Again, second-generation loss if the AVIF was already aggressive. Best when the AVIF is a high-quality master.',
      'Also export can build the kit in one run if the queue source is PNG/JPEG instead — prefer originals when you have them.',
    ],
    howItWorks: [
      'Drop AVIF. WebP out. Size budget on. Alpha preserved if present.',
      'Compare edges; AVIF film grain can look different in WebP.',
      'ZIP the batch for a CDN folder named webp/.',
    ],
    whenToUse: [
      'Building `<picture>` fallbacks from AVIF-only folders.',
      'Partners that accept WebP but not AVIF.',
      'Skip AVIF to WebP if you still have PNG/JPEG masters.',
    ],
    qualityNote:
      'WebP quality 80–90. If both look mushy, the AVIF was too low.',
    settingsTips: [
      'Do not downsize twice — match the AVIF dimensions unless you need thumbs.',
      'Keep AVIF in the same ZIP via Also export only when AVIF is the primary output; here primary is WebP.',
      'Strip GPS if any tags survived (AVIF export from Asset Melt is pixels-only; incoming AVIF from elsewhere may vary).',
    ],
    comparisonRows: [
      ['Primary web', 'AVIF', 'WebP fallback'],
      ['Support', 'Newer', 'Wider than AVIF'],
      ['Alpha', 'Yes if present', 'Yes if present'],
      ['Size', 'Often smaller', 'Often between AVIF and JPEG'],
      ['Size budget', 'Supported', 'Supported'],
    ],
    typicalRows: [
      ['AVIF photo', '180 KB AVIF', '~260 KB WebP', 'Fallback weight'],
      ['AVIF UI', '70 KB AVIF', '~95 KB WebP', 'Alpha kept'],
      ['From JPEG original', 'Best AVIF', 'Best WebP', 'Prefer original'],
    ],
    beforeAfter: {
      scene: 'photo',
      scenario: 'A landscape AVIF turned into a WebP fallback.',
      caption:
        'Illustrative AVIF to WebP. Use originals when you can; this path is for AVIF-only folders.',
      before: { format: 'AVIF', size: '175 KB', note: 'Master still' },
      after: { format: 'WebP', size: '250 KB', note: 'Wider support' },
      savings: 'Fallback, not always smaller',
    },
    extraFaq: [
      {
        question: 'Is AVIF to WebP smaller?',
        answer:
          'Usually not — AVIF is the smaller format. AVIF to WebP is a compatibility fallback, not a size win.',
      },
      {
        question: 'Does AVIF to WebP keep transparency?',
        answer: 'Yes, if the AVIF had alpha. AVIF to WebP keeps that channel so UI cutouts stay cut out.',
      },
      {
        question: 'Can I emit AVIF and WebP without starting from AVIF?',
        answer:
          'Yes. On a JPEG/PNG page, use Also export. That avoids a generation of loss versus AVIF to WebP.',
      },
    ],
  },

  'gif->webp': {
    hook: 'Asset Melt processes the first GIF frame as a still — perfect for converting old meme stills or UI captures, not for keeping animation.',
    why: [
      'GIF to WebP as a still is how you retire 256-color GIFs on blogs without uploading them to a random “GIF converter.” The first frame becomes a modern still.',
      `${OPEN_LIMITATIONS['4.4'].copy} If you needed an animated WebP, this studio is the wrong tool — be honest with that search intent.`,
      'For a crisp still with fewer colors, GIF to PNG may look closer to the original palette. GIF to WebP usually wins on bytes for photographic GIF frames.',
    ],
    howItWorks: [
      'Drop GIFs. First frame decodes. WebP encodes. Animation is discarded.',
      'Size budget works on the WebP still.',
      'Preview the frame you actually got — it is always frame one.',
    ],
    whenToUse: [
      'Static GIF images (buttons, badges, old screenshots).',
      'Replacing a “GIF photo” that was never really animation.',
      'Skip GIF to WebP when you must keep the loop. We do not encode animation.',
    ],
    qualityNote:
      'GIF banding is already in the source. WebP will not restore colors. Raise quality to avoid extra mush on the first frame.',
    settingsTips: [
      'If the GIF is a UI graphic, try GIF to PNG instead.',
      'Resize only if the GIF is huge; many GIFs are already small canvases.',
      'Do not expect an animated WebP download.',
    ],
    comparisonRows: [
      ['Animation', 'Yes in the file', 'Not encoded — first frame only'],
      ['Colors', 'Typically 256', 'Truecolor WebP still'],
      ['Size budget', 'N/A on GIF', 'Supported on WebP'],
      ['Transparency', 'Index transparency', 'WebP alpha from that frame'],
      ['Best still alternative', 'GIF', 'PNG for crisp UI'],
    ],
    typicalRows: [
      ['Static GIF badge', '40 KB GIF', '~12 KB WebP', 'First frame still'],
      ['Photographic GIF', '1.2 MB GIF', '~90 KB WebP', 'Animation dropped'],
      ['UI GIF → PNG instead', '40 KB GIF', 'See GIF to PNG', 'Sharper type'],
    ],
    beforeAfter: {
      scene: 'icon',
      scenario: 'Colorful game-piece graphics saved as a static GIF, published as WebP.',
      caption:
        'Illustrative GIF to WebP still. GIF uses the first frame only — animation is not encoded.',
      before: { format: 'GIF', size: '240 KB', note: 'Indexed, first frame' },
      after: { format: 'WebP', size: '45 KB', note: 'Still, not animated' },
      savings: '~81% smaller still',
    },
    extraFaq: [
      {
        question: 'Does GIF to WebP keep animation?',
        answer: `${OPEN_LIMITATIONS['4.4'].copy} GIF to WebP writes a still of that frame, not an animated WebP.`,
      },
      {
        question: 'GIF to WebP vs GIF to PNG — which still looks better?',
        answer:
          'PNG (especially lossless Oxipng) is usually crisper for UI and text. WebP is usually smaller for photographic GIF frames. Compare both if it matters.',
      },
      {
        question: 'Can I pick which GIF frame to convert to WebP?',
        answer:
          'Not yet. Only the first frame is decoded. Export the frame you want as an image elsewhere if you need a later frame.',
      },
    ],
  },

  'gif->png': {
    hook: 'Preserve a crisp GIF frame without animation — the usual fix when a “GIF” is really a UI capture, a meme still, or a 256-color graphic you want as PNG.',
    why: [
      'GIF to PNG is the conversion people search when a site, print tool, or sticker pack wants PNG and they only have a GIF. You get a still PNG of the first frame, with Oxipng (and optional Reduce palette) instead of GIF’s 256-color ceiling as the output container.',
      'A GIF to PNG converter in the browser means the meme, Slack emoji source, or app capture never goes to a third-party upload form. GIF to PNG is still a stills pipeline: animation is not rebuilt as an APNG.',
      `${OPEN_LIMITATIONS['4.4'].copy} If the GIF is a real cartoon loop, GIF to PNG will not keep the loop — it will give you a sharp first frame you can ship as PNG.`,
    ],
    howItWorks: [
      'Open this GIF to PNG page so PNG is pre-selected. Drop one GIF or a folder of GIFs. Each GIF to PNG job decodes frame one, then runs Oxipng locally.',
      'For logos and icons, turn on Reduce palette to aim at TinyPNG-small PNG-8. For a GIF to PNG photo-style frame, leave palette off so you do not add extra banding.',
      'Download a single PNG or a ZIP. The GIF to PNG URL does not lock input — JPEG and PNG can join the same queue — but the page is written for people who came to convert GIF to PNG.',
    ],
    whenToUse: [
      'Static GIF images that should be PNG for the web, docs, or print.',
      'When you need a lossless-looking still and GIF banding is already acceptable.',
      'Do not use GIF to PNG to “save an animation as PNG.” We do not write animated PNG.',
    ],
    qualityNote:
      'GIF to PNG quality is about palette and Oxipng level, not a JPEG-style slider. Size budget skips PNG. If you need a KB cap after GIF to PNG, resize or switch the output to WebP.',
    settingsTips: [
      'GIF to PNG for UI: Reduce palette, 32–64 colors, dither 0 for hard edges.',
      'GIF to PNG for a photographic first frame: palette off, Oxipng level 4+.',
      'Filename `{name}.png` so a batch GIF to PNG ZIP is easy to scan.',
    ],
    comparisonRows: [
      ['Animation', 'Yes in GIF', 'Not encoded — first frame PNG'],
      ['Typical colors', '256 indexed', 'Truecolor PNG or PNG-8 palette'],
      ['Compression', 'LZW', 'Oxipng (± imagequant)'],
      ['Size budget', 'N/A', 'Skipped for PNG'],
      ['Transparency', 'Index transparency', 'PNG alpha from that frame'],
    ],
    typicalRows: [
      ['UI GIF still', '90 KB GIF', '~35 KB PNG', 'GIF to PNG with optional palette'],
      ['Meme still', '400 KB GIF', '~120 KB PNG', 'First frame only'],
      ['Need a KB cap', '90 KB GIF', 'Use GIF to WebP', 'Size budget skips PNG'],
    ],
    beforeAfter: {
      scene: 'screenshot',
      scenario: 'A phone UI capture saved as GIF, exported as a PNG still.',
      caption:
        'Illustrative GIF to PNG for a first-frame UI still — animation is not preserved. Drop a GIF above to convert on this device.',
      before: { format: 'GIF', size: '220 KB', note: 'Indexed UI frame' },
      after: { format: 'PNG', size: '95 KB', note: 'Oxipng still' },
      savings: '~57% smaller still',
    },
    extraFaq: [
      {
        question: 'Does GIF to PNG keep the animation?',
        answer: `${OPEN_LIMITATIONS['4.4'].copy} GIF to PNG writes a still PNG of that frame.`,
      },
      {
        question: 'Is GIF to PNG lossless?',
        answer:
          'The PNG is lossless Oxipng of the decoded first frame unless Reduce palette is on. The GIF itself was already indexed, so GIF to PNG cannot restore colors the GIF never stored. HEIC-style JPEG bounce does not apply here.',
      },
      {
        question: 'How do I batch GIF to PNG?',
        answer:
          'Drop a folder of GIFs on this GIF to PNG page, process, and download a ZIP. Nested images are queued; other files are skipped. Optional ZIP every 25 files eases memory on huge GIF to PNG jobs.',
      },
      {
        question: 'GIF to PNG vs GIF to WebP — which should I use?',
        answer:
          'GIF to PNG when you need a PNG (stickers, print, editors). GIF to WebP when the still is for a website and bytes matter more than a PNG container. Neither keeps GIF animation in Asset Melt.',
      },
    ],
  },

  'bmp->png': {
    hook: 'Replace huge BMP dumps with portable PNGs — BMP is uncompressed, so BMP to PNG is one of the most dramatic lossless-feeling wins in the studio.',
    why: [
      'Windows screenshots, old scanners, and some lab tools still emit BMP. Emailing a BMP is how you discover attachment limits. BMP to PNG is the portable fix.',
      'PNG is lossless Oxipng by default, so BMP to PNG keeps the bitmap. For simple logos, Reduce palette can go further (lossy PNG-8).',
      'Do not use BMP on the web. Convert BMP to PNG (or WebP) before you publish.',
    ],
    howItWorks: [
      'Drop BMP files. Oxipng out. Optional palette.',
      'Size budget skips PNG.',
      'Batch a folder of BMP exports from a device that only speaks BMP.',
    ],
    whenToUse: [
      'Any BMP that needs to be shared or archived.',
      'When a Windows tool saved a screenshot as BMP.',
      'Skip BMP to PNG only if you actually need BMP for a picky industrial importer.',
    ],
    qualityNote:
      'Lossless BMP to PNG should look identical. If you enable Reduce palette, you are choosing TinyPNG-style loss on purpose.',
    settingsTips: [
      'Leave palette off for photos and screenshots with gradients.',
      'Oxipng level 4 is a good default; 6 is slower/smaller.',
      'For web, consider BMP to WebP instead of BMP to PNG.',
    ],
    comparisonRows: [
      ['Compression', 'Uncompressed BMP', 'Lossless PNG (Oxipng)'],
      ['Typical size', 'Huge', 'Much smaller'],
      ['Alpha', 'Rare / limited', 'PNG alpha if present'],
      ['Size budget', 'N/A', 'Skipped'],
      ['Web use', 'Do not', 'OK for graphics'],
    ],
    typicalRows: [
      ['1920×1080 BMP', '~6 MB BMP', '~400 KB PNG', 'Screenshot-like'],
      ['Logo BMP', '~1 MB BMP', '~20 KB PNG', 'Flat colors compress well'],
      ['Photo BMP', '~20 MB BMP', '~8 MB PNG', 'Still large — prefer WebP'],
    ],
    beforeAfter: {
      scene: 'screenshot',
      scenario: 'A phone UI screenshot dumped as BMP.',
      caption:
        'Illustrative BMP to PNG. BMP is uncompressed; PNG is the portable lossless container.',
      before: { format: 'BMP', size: '5.8 MB', note: 'Uncompressed UI dump' },
      after: { format: 'PNG', size: '380 KB', note: 'Oxipng' },
      savings: '~93% smaller',
    },
    extraFaq: [
      {
        question: 'Is BMP to PNG lossless?',
        answer:
          'Yes, with Reduce palette off. Oxipng stores the BMP pixels losslessly. Palette mode is lossy PNG-8.',
      },
      {
        question: 'Why is BMP to PNG still large for photos?',
        answer:
          'Lossless photo PNG is large by design. Use BMP to WebP for web photos if bytes matter more than a lossless file.',
      },
      {
        question: 'Can I batch BMP to PNG from a folder?',
        answer: 'Yes. Folder drop queues nested BMP images and skips other files; download a ZIP of the PNGs.',
      },
    ],
  },

  'bmp->webp': {
    hook: 'Web-ready files from BMP exports — skip the PNG middleman when the BMP is going straight on a site.',
    why: [
      'BMP to WebP is for screenshots and photos that should never have been BMP. You get a web format in one local step.',
      'Compared with BMP to PNG, BMP to WebP is usually smaller for photos and still fine for many UI captures.',
      'Uncompressed BMP in git or Slack is a tax. Convert BMP to WebP before you share.',
    ],
    howItWorks: [
      'Drop BMP. WebP encode. Size budget on.',
      'Preview text in screenshots; raise quality if type looks soft.',
      'ZIP for a docs site image folder.',
    ],
    whenToUse: [
      'Publishing old BMP dumps on the web.',
      'When BMP to PNG is still too heavy.',
      'Skip BMP to WebP if the destination requires PNG or JPEG specifically.',
    ],
    qualityNote:
      'Quality 80–90 for screenshots. Size budget if a CMS caps KB.',
    settingsTips: [
      'Also export JPEG if a partner cannot take WebP.',
      'Resize 1080p BMPs if they will display at 640px.',
      'Strip metadata; BMP rarely has useful EXIF anyway.',
    ],
    comparisonRows: [
      ['BMP', 'Uncompressed', 'Do not ship'],
      ['WebP', 'Lossy/near-lossless', 'Web delivery'],
      ['vs PNG', 'Lossless, larger', 'Usually smaller WebP'],
      ['Size budget', 'N/A', 'Supported'],
      ['Alpha', 'Uncommon in BMP', 'Kept if present'],
    ],
    typicalRows: [
      ['1080p screenshot BMP', '6 MB BMP', '~180 KB WebP', 'Typical docs image'],
      ['Photo BMP', '20 MB BMP', '~500 KB WebP', 'Resize recommended'],
      ['Need PNG instead', '6 MB BMP', 'See BMP to PNG', 'Lossless path'],
    ],
    beforeAfter: {
      scene: 'screenshot',
      scenario: 'A phone UI BMP destined for a documentation site.',
      caption:
        'Illustrative BMP to WebP. One local step from an uncompressed dump to a web still.',
      before: { format: 'BMP', size: '5.8 MB', note: 'Uncompressed dump' },
      after: { format: 'WebP', size: '165 KB', note: 'Quality ~85' },
      savings: '~97% smaller',
    },
    extraFaq: [
      {
        question: 'BMP to WebP vs BMP to PNG — which is smaller?',
        answer:
          'WebP is usually smaller for photos and screenshots. PNG is the lossless container. Pick PNG if an editor requires it.',
      },
      {
        question: 'Is BMP to WebP lossless?',
        answer:
          'Default WebP is lossy. Raise quality and inspect. For guaranteed lossless, use BMP to PNG.',
      },
      {
        question: 'Can I set a 100 KB cap on BMP to WebP?',
        answer: 'Yes. Size budget is supported for WebP, so a 100 KB CMS cap can drive BMP to WebP automatically.',
      },
    ],
  },

  'svg->png': {
    hook: 'Rasterizing SVG is handy for email clients, app stores, and platforms that reject SVG uploads — you pick the pixel size, then Oxipng.',
    why: [
      'SVG to PNG is a rasterize-and-download step, not a vector editor. The PNG size follows the SVG’s rendered dimensions (and any resize you set).',
      'Email, Microsoft Office, and some CMS fields still choke on SVG. SVG to PNG is the compatibility export.',
      'Icons should be exported at 1×/2×/3× you actually need. A 16px SVG to PNG will look soft if you stretch it in CSS.',
    ],
    howItWorks: [
      'Drop SVG. The studio rasterizes, then PNG encode. Use resize if you need a specific pixel box (favicon kit is a different recipe).',
      'Complex filters or external fonts in SVG may not match a browser tab 1:1 — preview.',
      'Reduce palette helps flat icons; leave it off for detailed illustrations.',
    ],
    whenToUse: [
      'Email signatures, OG-adjacent rasters, and stores that ban SVG.',
      'When a developer needs a PNG fallback next to an SVG.',
      'Skip SVG to PNG when you can ship SVG — vectors stay sharp.',
    ],
    qualityNote:
      'Sharpness is about raster size, not PNG quality. Upscaling a tiny SVG to PNG cannot invent detail.',
    settingsTips: [
      'Set exact width/height for icon exports.',
      'Favicon kit recipe if you need 16/32/180/512 plus ICO.',
      'HQX resize is for pixel art, not for logos.',
    ],
    comparisonRows: [
      ['Format', 'Vector SVG', 'Raster PNG'],
      ['Scale', 'Infinite', 'Fixed pixels'],
      ['Email / Office', 'Often blocked', 'Usually accepted'],
      ['Size budget', 'N/A', 'Skipped for PNG'],
      ['Palette', 'N/A', 'Optional PNG-8'],
    ],
    typicalRows: [
      ['24px icon', '2 KB SVG', '~1 KB PNG', 'SVG to PNG at 24×24'],
      ['2× icon 48px', '2 KB SVG', '~2 KB PNG', 'Retina fallback'],
      ['Illustration 1200px', '18 KB SVG', '~180 KB PNG', 'Raster grows with pixels'],
    ],
    beforeAfter: {
      scene: 'icon',
      scenario: 'Flat colorful icon art rasterized for an email client that blocks SVG.',
      caption:
        'Illustrative SVG to PNG. Pixel size is your choice — this sample assumes a mid-size raster of icon-style art.',
      before: { format: 'SVG', size: '12 KB', note: 'Vector source' },
      after: { format: 'PNG', size: '48 KB', note: 'Oxipng raster' },
      savings: 'Raster fallback, not a shrink contest',
    },
    extraFaq: [
      {
        question: 'What resolution is SVG to PNG?',
        answer:
          'Whatever the SVG rasterizes to, then any resize you set. There is no single default “print DPI” export — set the pixel box you need.',
      },
      {
        question: 'Does SVG to PNG keep infinite scale?',
        answer:
          'No. PNG is pixels. Keep the SVG as the master if you still need infinite scale after SVG to PNG.',
      },
      {
        question: 'Can I batch SVG to PNG for an icon set?',
        answer:
          'Yes. Drop many SVGs, set a shared resize, download a ZIP. For Apple/favicon sizes, use the Favicon kit recipe instead.',
      },
    ],
  },

  'svg->webp': {
    hook: 'Lightweight raster fallbacks from SVG when you need a bitmap for CSS backgrounds, OG-adjacent art, or hosts that dislike SVG but accept WebP.',
    why: [
      'SVG to WebP is the same rasterize step as SVG to PNG, then WebP instead of Oxipng. Often smaller than PNG for illustrative SVGs.',
      'Do not replace every SVG on a site with WebP — vectors are still better for icons. Use SVG to WebP for fallbacks and for places SVG will not go.',
      'Size budget works on the WebP raster.',
    ],
    howItWorks: [
      'Drop SVG. Rasterize, WebP encode. Set resize to the CSS size × 2.',
      'Preview edges on transparent logos.',
      'Also export PNG if you need a second fallback.',
    ],
    whenToUse: [
      'Raster fallbacks next to SVG.',
      'When PNG from SVG is heavier than you want.',
      'Skip SVG to WebP if the platform requires PNG specifically.',
    ],
    qualityNote:
      'High WebP quality (90–100) for logos with type. Size budget if you must hit a cap.',
    settingsTips: [
      'Do not upscale a 16px SVG to a 1024px WebP and expect a crisp logo.',
      'Premultiply alpha on resize is usually left on.',
      'Favicon kit still wants PNG/ICO, not WebP, for classic favicons.',
    ],
    comparisonRows: [
      ['Master', 'SVG vector', 'Keep it'],
      ['Fallback', 'PNG or WebP', 'WebP usually smaller'],
      ['Size budget', 'N/A', 'Supported'],
      ['Email', 'SVG often blocked', 'WebP also often blocked — PNG may be safer'],
      ['Alpha', 'Yes', 'Yes'],
    ],
    typicalRows: [
      ['512px logo', '14 KB SVG', '~22 KB WebP', 'Raster fallback'],
      ['1200px illustration', '18 KB SVG', '~90 KB WebP', 'Depends on detail'],
      ['Need PNG', '14 KB SVG', 'See SVG to PNG', 'Email-safer'],
    ],
    beforeAfter: {
      scene: 'icon',
      scenario: 'Flat colorful icon art rasterized as WebP for a CSS background.',
      caption:
        'Illustrative SVG to WebP. Set the pixel size you will actually display.',
      before: { format: 'SVG', size: '16 KB', note: 'Vector' },
      after: { format: 'WebP', size: '36 KB', note: '~512–800px raster' },
      savings: 'Fallback bitmap, size depends on pixels',
    },
    extraFaq: [
      {
        question: 'Is SVG to WebP good for icons?',
        answer:
          'Only as a fallback. Prefer inline or file SVG for UI icons. SVG to WebP is for raster contexts.',
      },
      {
        question: 'Will email display SVG to WebP?',
        answer:
          'Many clients block WebP too. For email, SVG to PNG is usually safer than SVG to WebP.',
      },
      {
        question: 'Can I size-budget SVG to WebP?',
        answer: 'Yes. Size budget runs on WebP output, including SVG to WebP rasters, until the file fits your KB cap.',
      },
    ],
  },

  'tiff->jpeg': {
    hook: 'Scanned TIFF archives compress dramatically as JPG for sharing while originals stay offline. Multi-page TIFFs use the first page, same as GIF.',
    why: [
      'TIFF to JPG (TIFF to JPEG) is the scan-and-share path. A 40 MB TIFF from a scanner is not an email attachment. MozJPEG makes a shareable still of the first page.',
      `${TIFF_FIRST_PAGE_COPY} If the scan is a stack of pages, you will get page one only.`,
      'Keep the TIFF as the archival file. TIFF to JPEG is the derivative you send.',
    ],
    howItWorks: [
      'Drop TIFF / TIF. First page decodes. MozJPEG encodes. Size budget on.',
      'Preview for moiré on printed photos; a light resize can help.',
      'Strip metadata if the scan tagged a location you do not want to share.',
    ],
    whenToUse: [
      'Sending a scan to a human or a JPG-only portal.',
      'Web previews of print archives.',
      'Skip TIFF to JPEG when you need every page — we only decode the first page.',
    ],
    qualityNote:
      'Scans of text may look better as PNG (TIFF to PNG) or as a PDF elsewhere. JPEG is for photographic scans and “good enough” document previews.',
    settingsTips: [
      'Size budget for portal caps.',
      'Grayscale filter if the scan is a document and color noise is ugly.',
      'Do not expect OCR — this is an image studio.',
    ],
    comparisonRows: [
      ['Pages', 'Multi-page possible', 'First page only'],
      ['Archive', 'Keep TIFF', 'JPEG derivative'],
      ['Size', 'Huge', 'Much smaller'],
      ['Size budget', 'N/A', 'Supported'],
      ['Text scans', 'Sharp TIFF', 'JPEG may smudge type'],
    ],
    typicalRows: [
      ['Photo scan', '28 MB TIFF', '~1.1 MB JPEG', 'First page'],
      ['Document preview', '12 MB TIFF', '~400 KB JPEG', 'Type may soften'],
      ['Need lossless page', '28 MB TIFF', 'See TIFF to PNG', 'Larger share file'],
    ],
    beforeAfter: {
      scene: 'scan',
      scenario: 'A handwritten document page shared as JPEG.',
      caption:
        'Illustrative TIFF to JPG of a document page. TIFF uses the first page only.',
      before: { format: 'TIFF', size: '18 MB', note: 'Scan / archive, page one' },
      after: { format: 'JPEG', size: '420 KB', note: 'MozJPEG share' },
      savings: '~98% smaller',
    },
    extraFaq: [
      {
        question: 'Does TIFF to JPG convert every page?',
        answer: `${TIFF_FIRST_PAGE_COPY} TIFF to JPG writes a still of page one — split the stack elsewhere if you need every scan.`,
      },
      {
        question: 'Is TIFF to JPG the same as TIFF to JPEG?',
        answer: 'Yes. This TIFF to JPG page writes JPEG — JPG and JPEG are the same format, just a shorter extension.',
      },
      {
        question: 'Should text scans use TIFF to PNG instead?',
        answer:
          'Often yes if you need sharper type and can tolerate a larger file. JPEG is better for photo scans and strict KB caps.',
      },
    ],
  },

  'tiff->png': {
    hook: 'Archive TIFFs as portable PNGs when you need a lossless-feeling still of the first page that more tools can open than TIFF.',
    why: [
      'TIFF to PNG is the “I cannot send a TIFF” lossless-ish handoff. Oxipng stores the first page. It will not be small like JPEG.',
      `${TIFF_FIRST_PAGE_COPY}`,
      'Useful for graphics, line art, and documents where JPEG ringing would hurt.',
    ],
    howItWorks: [
      'Drop TIFF. First page, then Oxipng. Reduce palette optional for simple graphics.',
      'Size budget skips PNG.',
      'Preview; 16-bit TIFF may be flattened to the pipeline’s working bitmap.',
    ],
    whenToUse: [
      'Line art and diagrams in TIFF.',
      'When JPEG smudges type and WebP is not allowed.',
      'Skip TIFF to PNG for photo scans you will email — use TIFF to JPEG.',
    ],
    qualityNote:
      'Lossless Oxipng of the decoded page. Palette mode is a deliberate TinyPNG-style loss.',
    settingsTips: [
      'Resize huge scans before PNG or the file stays enormous.',
      'Palette off for photos.',
      'For web photos, TIFF to WebP is usually smarter.',
    ],
    comparisonRows: [
      ['Pages', 'Possibly many', 'First page PNG'],
      ['Size', 'Huge TIFF', 'Still large PNG'],
      ['Type / line art', 'Excellent', 'Better than JPEG'],
      ['Size budget', 'N/A', 'Skipped'],
      ['Portability', 'Specialized', 'PNG opens everywhere'],
    ],
    typicalRows: [
      ['Line-art TIFF', '15 MB TIFF', '~1.2 MB PNG', 'First page'],
      ['Photo TIFF', '40 MB TIFF', '~18 MB PNG', 'Prefer JPEG/WebP for share'],
      ['Palette diagram', '8 MB TIFF', '~200 KB PNG-8', 'Flat colors'],
    ],
    beforeAfter: {
      scene: 'scan',
      scenario: 'A handwritten page that must open as PNG.',
      caption:
        'Illustrative TIFF to PNG. First page only; PNG is portable, not tiny like JPEG.',
      before: { format: 'TIFF', size: '12 MB', note: 'Document page one' },
      after: { format: 'PNG', size: '980 KB', note: 'Oxipng' },
      savings: '~92% smaller, still lossless-style',
    },
    extraFaq: [
      {
        question: 'Does TIFF to PNG include all pages?',
        answer: `${TIFF_FIRST_PAGE_COPY} TIFF to PNG is page one only — it is not a multi-page document converter.`,
      },
      {
        question: 'Why is TIFF to PNG still big?',
        answer:
          'Lossless photo/diagram PNG is large. Use TIFF to JPEG or TIFF to WebP for small share files.',
      },
      {
        question: 'Is 16-bit TIFF preserved?',
        answer:
          'The studio pipeline is a web stills stack, not a 16-bit print RIP. Treat TIFF to PNG as an 8-bit-style web PNG of page one.',
      },
    ],
  },

  'tiff->webp': {
    hook: 'Web delivery from TIFF masters — first page only — when a scan or print file needs to live on a site without shipping a 40 MB original.',
    why: [
      'TIFF to WebP is the web derivative of a print/scan file. Smaller than PNG, more modern than JPEG for many photos, still a still of page one.',
      `${TIFF_FIRST_PAGE_COPY}`,
      'Keep TIFF offline. Publish WebP (and a JPEG fallback if needed).',
    ],
    howItWorks: [
      'Drop TIFF. First page, WebP encode, size budget available.',
      'Resize to the layout width × 2.',
      'Also export JPEG for stubborn browsers or social uploaders.',
    ],
    whenToUse: [
      'Museum/archive sites showing a scan preview.',
      'When TIFF to JPEG is too mushy on graphics but PNG is too heavy.',
      'Skip if you need multi-page — not supported.',
    ],
    qualityNote:
      'Photo scans: quality 75–85. Diagrams: higher, or use TIFF to PNG.',
    settingsTips: [
      'Size budget for LCP.',
      'Grayscale if the TIFF is a B&W document.',
      'Do not serve original TIFF on the web.',
    ],
    comparisonRows: [
      ['Master', 'TIFF', 'Keep offline'],
      ['Web still', 'WebP', 'First page'],
      ['vs JPEG', 'WebP often smaller', 'JPEG more compatible'],
      ['vs PNG', 'WebP much smaller for photos', 'PNG better for hard line art'],
      ['Size budget', 'N/A', 'Supported'],
    ],
    typicalRows: [
      ['Photo scan', '28 MB TIFF', '~420 KB WebP', 'First page, resized'],
      ['Diagram', '10 MB TIFF', '~150 KB WebP', 'Watch thin lines'],
      ['Need every page', 'Multi-page TIFF', 'Not in Studio', 'Split elsewhere'],
    ],
    beforeAfter: {
      scene: 'scan',
      scenario: 'A handwritten archive page previewed on a website as WebP.',
      caption:
        'Illustrative TIFF to WebP. TIFF uses the first page only.',
      before: { format: 'TIFF', size: '18 MB', note: 'Document master' },
      after: { format: 'WebP', size: '190 KB', note: 'Web preview' },
      savings: '~99% smaller preview',
    },
    extraFaq: [
      {
        question: 'Does TIFF to WebP keep all pages?',
        answer: `${TIFF_FIRST_PAGE_COPY} TIFF to WebP is a web preview of page one, not a multi-page export.`,
      },
      {
        question: 'TIFF to WebP vs TIFF to JPG?',
        answer:
          'WebP for sites that accept it. JPG for maximum compatibility. Both are first-page stills.',
      },
      {
        question: 'Can I size-budget TIFF to WebP?',
        answer: 'Yes. Size budget works on WebP, including first-page TIFF to WebP jobs with an optional resize.',
      },
    ],
  },

  'png->jxl': {
    hook: 'Next-gen lossless-friendly PNG successors — JPEG XL can be a smaller lossless still than PNG, with a lossy mode when you want it. Browser support is still the catch.',
    why: [
      'PNG to JPEG XL (PNG to JXL) is for experiments, future archives, and tooling that already reads JXL. It is not a drop-in for every `<img>` tag in 2026.',
      'Lossless JXL often beats PNG on the same bitmap. Lossy JXL competes with AVIF/WebP depending on the image.',
      'Asset Melt encodes via @jsquash/jxl in a worker. JXL export is pixels-only (no EXIF round-trip).',
    ],
    howItWorks: [
      'Drop PNG. JXL out. Effort slider trades time for bytes.',
      'Size budget works on JPEG XL.',
      'Keep PNG if you need universal support.',
    ],
    whenToUse: [
      'Archival experiments and JXL-aware pipelines.',
      'When you want smaller lossless than PNG.',
      'Skip PNG to JXL for general web until your audience can decode it (or you ship a fallback).',
    ],
    qualityNote:
      'For lossless-style, use high quality / lossless settings and inspect. For web-like lossy, compare against AVIF — support will be the deciding factor.',
    settingsTips: [
      'Higher JXL effort = slower, often smaller.',
      'Also export WebP/AVIF if this is a trial, not a cutover.',
      'Do not delete PNG masters.',
    ],
    comparisonRows: [
      ['Web support', 'PNG universal', 'JXL limited'],
      ['Lossless size', 'Oxipng', 'Often smaller JXL'],
      ['Size budget', 'Skipped', 'Supported'],
      ['Metadata out', 'Optional keep on PNG', 'Pixels only'],
      ['Fallback', 'Not needed', 'Keep PNG/WebP'],
    ],
    typicalRows: [
      ['UI PNG lossless', '220 KB PNG', '~160 KB JXL', 'Typical lossless win'],
      ['Photo PNG', '4 MB PNG', 'Lossy JXL much smaller', 'Or use AVIF'],
      ['Icon 16px', '1 KB PNG', '~1 KB JXL', 'Not worth a format fight'],
    ],
    beforeAfter: {
      scene: 'screenshot',
      scenario: 'A phone UI PNG archived as lossless-friendly JPEG XL.',
      caption:
        'Illustrative PNG to JPEG XL. JXL support is still limited — keep a PNG fallback for the public web.',
      before: { format: 'PNG', size: '380 KB', note: 'Oxipng UI still' },
      after: { format: 'JPEG XL', size: '250 KB', note: 'Lossless-style JXL' },
      savings: '~34% smaller lossless',
    },
    extraFaq: [
      {
        question: 'Can browsers display PNG to JXL output?',
        answer:
          'Some can, many still cannot. Treat PNG to JPEG XL as a next-gen or tooling format unless you control the decoder.',
      },
      {
        question: 'Is PNG to JXL lossless?',
        answer:
          'It can be, depending on encode settings. Lossy JXL is also available. Inspect the preview.',
      },
      {
        question: 'Does size budget work for PNG to JXL?',
        answer:
          'Yes. JPEG XL is included in size-budget encoding, so PNG to JXL can target a KB cap like AVIF or WebP.',
      },
    ],
  },

  'jpeg->jxl': {
    hook: 'JPEG XL trials from photo libraries — smaller or smarter than JPEG in many tests, but you still need a fallback plan for the public web.',
    why: [
      'JPG to JPEG XL (JPEG to JXL) is how you trial JXL on a real photo set without a CLI. Encode locally, compare with the scrubber, keep JPEG for shipping.',
      'JPEG XL can recompress JPEG in ways that aim to preserve the original — still treat this as a trial, not a promise of bit-identical reconstruction in every mode.',
      'Size budget works. Metadata: JXL export is pixels-only in Asset Melt.',
    ],
    howItWorks: [
      'Drop JPEGs. JXL encode in a worker. Effort vs time.',
      'Also export JPEG if you want both in one ZIP.',
      'Do not mass-replace a CDN with JXL-only.',
    ],
    whenToUse: [
      'Codec trials and internal archives.',
      'When you want to see JXL vs MozJPEG on your own photos.',
      'Skip JPG to JXL as the only public format in 2026 for general audiences.',
    ],
    qualityNote:
      'Compare at the same display size. If JXL looks like JPEG, the win is bytes and future-proofing, not a new aesthetic.',
    settingsTips: [
      'High effort for one-off heroes.',
      'Keep originals.',
      'Strip GPS on the source JPEG before you publish any derivative.',
    ],
    comparisonRows: [
      ['Public web', 'JPEG just works', 'JXL still niche'],
      ['Size', 'MozJPEG strong', 'JXL often competitive'],
      ['Size budget', 'Supported', 'Supported'],
      ['Encode time', 'Fast', 'Slower at high effort'],
      ['Metadata out', 'Optional keep', 'Pixels only'],
    ],
    typicalRows: [
      ['Phone JPEG', '3 MB JPEG', '~2.1 MB lossless-ish JXL', 'Varies widely'],
      ['Web-quality JXL', '3 MB JPEG', '~280 KB lossy JXL', 'Compare to AVIF'],
      ['Need compatibility', '3 MB JPEG', 'Stay JPEG/WebP', 'JXL as extra only'],
    ],
    beforeAfter: {
      scene: 'photo',
      scenario: 'A landscape JPEG trialed as JPEG XL.',
      caption:
        'Illustrative JPG to JPEG XL. Keep JPEG for compatibility; JXL is the experiment.',
      before: { format: 'JPEG', size: '2.8 MB', note: 'Photo library' },
      after: { format: 'JPEG XL', size: '260 KB', note: 'Lossy trial' },
      savings: '~91% at web-like quality',
    },
    extraFaq: [
      {
        question: 'Should I replace JPEG with JXL on my site?',
        answer:
          'Not as the only format for a general audience. JPG to JPEG XL is a trial path — ship JPEG/WebP/AVIF for users.',
      },
      {
        question: 'Does JPG to JXL keep EXIF?',
        answer:
          'Asset Melt JXL export is pixels only. Inspect the JPEG first if you need capture data.',
      },
      {
        question: 'Can I size-budget JPG to JXL?',
        answer: 'Yes. JPEG XL is included in size-budget encoding, so JPG to JXL can target a KB cap like AVIF or WebP.',
      },
    ],
  },

  'webp->png': {
    hook: 'Decode WebP back to editable PNG when a tool, printer, or teammate cannot open WebP but you still want a lossless-from-here still.',
    why: [
      'WebP to PNG is an escape hatch. The PNG cannot be sharper than the WebP. It can be opened in more editors.',
      'If the WebP had alpha, PNG keeps it. If it was a photo WebP, the PNG will be large — that is normal.',
      'Prefer going back to the original JPEG/PNG when you have it.',
    ],
    howItWorks: [
      'Drop WebP. Oxipng. Reduce palette only for graphics.',
      'Size budget skips PNG.',
      'Animated WebP: stills pipeline, not a sequence dump.',
    ],
    whenToUse: [
      'Editor/printer that rejects WebP.',
      'Need PNG alpha from a transparent WebP.',
      'Skip WebP to PNG for web delivery of photos.',
    ],
    qualityNote:
      'Lossless PNG of decoded WebP pixels. Palette is extra loss. Do not expect a quality upgrade.',
    settingsTips: [
      'Resize first if the PNG does not need full resolution.',
      'For compatibility without huge files, WebP to JPEG may be better for opaque photos.',
      'Keep the WebP as the small web file.',
    ],
    comparisonRows: [
      ['Web', 'WebP belongs here', 'PNG is usually heavier'],
      ['Editors', 'Some still fail', 'PNG just works'],
      ['Alpha', 'Yes if present', 'Kept'],
      ['Size budget', 'Supported on WebP', 'Skipped on PNG'],
      ['Animation', 'Possible', 'Not encoded'],
    ],
    typicalRows: [
      ['UI WebP', '40 KB WebP', '~55 KB PNG', 'Alpha kept'],
      ['Photo WebP', '300 KB WebP', '~2.4 MB PNG', 'Expected growth'],
      ['Need small compatible', '300 KB WebP', 'See WebP to JPEG', 'Opaque photos'],
    ],
    beforeAfter: {
      scene: 'graphic',
      scenario: 'A ceramic mug product WebP that must be edited as PNG.',
      caption:
        'Illustrative WebP to PNG. PNG is the editable container, not a smaller web file.',
      before: { format: 'WebP', size: '95 KB', note: 'Product web still' },
      after: { format: 'PNG', size: '520 KB', note: 'Oxipng' },
      savings: 'More editable, often larger',
    },
    extraFaq: [
      {
        question: 'Will WebP to PNG improve quality?',
        answer: 'No. WebP to PNG stores the decoded WebP pixels losslessly (unless Reduce palette is on) — it cannot restore detail the WebP already discarded.',
      },
      {
        question: 'Does WebP to PNG keep transparency?',
        answer: 'Yes, if the WebP had alpha. WebP to PNG keeps that channel for editors that still want PNG.',
      },
      {
        question: 'Can I convert animated WebP to PNG?',
        answer:
          'You get a still PNG of the decoded frame. Animation is not encoded when you convert WebP to PNG.',
      },
    ],
  },

  'jpeg->qoi': {
    hook: 'Fast lossless QOI for tooling pipelines — not a web format. QOI is simple and quick, which is the point.',
    why: [
      'JPG to QOI (JPEG to QOI) wraps decoded JPEG pixels in Quite OK Image. QOI is for tools, games, and pipelines that want lossless stills without PNG’s complexity.',
      'The QOI will usually be larger than the JPEG. You are not compressing for the web; you are changing container for speed of decode in specific software.',
      'Size budget skips QOI. Browsers will not display QOI in an `<img>` tag.',
    ],
    howItWorks: [
      'Drop JPEG. QOI encode locally. Fast.',
      'No quality slider in the JPEG sense — QOI is lossless from the decoded bitmap.',
      'Download for your tool chain, not for Shopify.',
    ],
    whenToUse: [
      'A pipeline that already speaks QOI.',
      'When PNG encode time is the bottleneck in a local tool (QOI is simpler).',
      'Skip JPG to QOI for websites and email.',
    ],
    qualityNote:
      'No extra quality to pick. If the JPEG was blocky, QOI stores that blockiness losslessly.',
    settingsTips: [
      'Resize before QOI if the tool wants small textures.',
      'Do not expect CMS support.',
      'Prefer PNG if humans need to open the file in Preview/Photoshop without plugins.',
    ],
    comparisonRows: [
      ['Web', 'JPEG yes', 'QOI no'],
      ['Lossless from pixels', 'No (JPEG)', 'Yes (from decoded JPEG)'],
      ['Typical size', 'Smaller JPEG', 'Larger QOI'],
      ['Size budget', 'Supported', 'Skipped'],
      ['Audience', 'Everyone', 'Tooling'],
    ],
    typicalRows: [
      ['Phone JPEG', '2 MB JPEG', '~9 MB QOI', 'Expected'],
      ['Resized texture', '2 MB JPEG', '~1.2 MB QOI', 'Resize first'],
      ['Need web', '2 MB JPEG', 'Use WebP/AVIF', 'Not QOI'],
    ],
    beforeAfter: {
      scene: 'photo',
      scenario: 'A landscape JPEG converted to QOI for a local tooling pipeline.',
      caption:
        'Illustrative JPG to QOI. QOI is a fast lossless container for tools — not a web compressor.',
      before: { format: 'JPEG', size: '1.9 MB', note: 'Photo' },
      after: { format: 'QOI', size: '8.8 MB', note: 'Lossless pixels' },
      savings: 'Larger, faster to decode in QOI tools',
    },
    extraFaq: [
      {
        question: 'Will JPG to QOI make a smaller file?',
        answer:
          'Usually no. QOI is lossless from decoded pixels. JPEG was smaller because it was lossy.',
      },
      {
        question: 'Can I put QOI on a website?',
        answer:
          'Not with normal `<img>` tags. JPG to QOI is for software that implements QOI, not for websites.',
      },
      {
        question: 'Does size budget work for JPG to QOI?',
        answer: 'No. Size budget skips QOI — resize the JPEG first if your tool needs a smaller lossless texture.',
      },
    ],
  },

  'png->qoi': {
    hook: 'Simple lossless QOI from PNG sources — a sibling container for tools that prefer QOI’s decode story over PNG.',
    why: [
      'PNG to QOI is a lossless-from-pixels container swap. Sizes are often similar; sometimes QOI wins, sometimes Oxipng wins.',
      'Use PNG to QOI when the next program in the chain wants QOI. Do not use it as a TinyPNG replacement.',
      'Size budget skips QOI. Reduce palette is PNG-output only — it does not apply to QOI.',
    ],
    howItWorks: [
      'Drop PNG. QOI encode. Alpha is supported by QOI.',
      'Preview should match the PNG pixels.',
      'ZIP for a texture pack if your engine wants QOI.',
    ],
    whenToUse: [
      'Game/tool pipelines with QOI loaders.',
      'Comparing decode speed in your own software.',
      'Skip PNG to QOI for public websites.',
    ],
    qualityNote:
      'Pixel-identical intent from the decoded PNG. If they differ, that is a bug — report it. There is no quality slider.',
    settingsTips: [
      'Resize if the engine wants a max texture size.',
      'Keep PNG for humans.',
      'Do not enable PNG palette controls expecting QOI-8 — not a thing here.',
    ],
    comparisonRows: [
      ['Web', 'PNG yes', 'QOI no'],
      ['Lossless', 'Oxipng', 'QOI from same pixels'],
      ['Size', 'Often similar', 'Often similar'],
      ['Size budget', 'Skipped', 'Skipped'],
      ['Palette preprocessor', 'Optional on PNG out', 'Not used for QOI'],
    ],
    typicalRows: [
      ['UI PNG', '80 KB PNG', '~90 KB QOI', 'Same pixels, different container'],
      ['Photo PNG', '4 MB PNG', '~4.2 MB QOI', 'Neither is a web photo format'],
      ['Need smaller web', '80 KB PNG', 'Use WebP/AVIF', 'Not QOI'],
    ],
    beforeAfter: {
      scene: 'graphic',
      scenario: 'A ceramic mug product PNG converted to QOI for an engine that loads QOI.',
      caption:
        'Illustrative PNG to QOI. Tooling container swap, not a web compressor.',
      before: { format: 'PNG', size: '480 KB', note: 'Product texture' },
      after: { format: 'QOI', size: '510 KB', note: 'Lossless QOI' },
      savings: 'Similar size, QOI decode path',
    },
    extraFaq: [
      {
        question: 'Is PNG to QOI smaller than PNG?',
        answer:
          'Sometimes slightly, sometimes not. It is not the goal. PNG to QOI is for QOI-aware tools.',
      },
      {
        question: 'Does PNG to QOI keep transparency?',
        answer: 'Yes. QOI supports alpha, so a transparent PNG to QOI texture keeps the cutout for engines that load QOI.',
      },
      {
        question: 'Can I TinyPNG-style palette a PNG to QOI job?',
        answer:
          'Reduce palette applies to PNG output, not QOI. Encode PNG with palette first if you need that look, or stay on PNG.',
      },
    ],
  },
}

export function getPairGuide(
  from: StudioInputIntent,
  to: StudioOutputIntent,
): PairGuide | undefined {
  return PAIR_GUIDES[`${from}->${to}`]
}
