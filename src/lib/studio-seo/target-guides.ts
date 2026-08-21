import type { StudioOutputIntent } from '@/lib/studio-seo/formats'
import type { TargetGuide } from '@/lib/studio-seo/types'

export const TARGET_GUIDES: Record<StudioOutputIntent, TargetGuide> = {
  webp: {
    hook: 'WebP is the default “smaller than JPEG/PNG, works in every modern browser” still. This page pre-selects WebP so mixed batches convert to WebP without hunting through Format settings.',
    why: [
      'Convert to WebP when the destination is a website, a CDN, or a CMS that already understands WebP. You keep alpha from PNG/GIF/SVG rasters, and you usually beat JPEG on photos.',
      'Convert to WebP from HEIC, TIFF, BMP, or JPEG in the same queue — input is not locked. The convert-to-WebP URL only locks the encoder.',
      'If you need maximum compatibility, Also export a JPEG fallback in the same run. If you need maximum compression on modern browsers, consider convert to AVIF instead (or both).',
    ],
    howItWorks: [
      'Drop any supported still. The official WebP encoder runs in a worker. Size budget is available when you convert to WebP.',
      'GIF uses the first frame only; TIFF uses the first page only; HEIC is decoded through JPEG at quality 0.92, then you still convert to WebP locally.',
      'Preview with the scrubber, then download one WebP or a ZIP.',
    ],
    whenToUse: [
      'Almost every public web still that is not a tiny lossless icon.',
      'When convert to PNG would be huge (photos) and convert to JPEG would flatten alpha.',
      'Skip convert to WebP for email-heavy workflows that still block WebP — convert to JPEG or PNG instead.',
    ],
    qualityNote:
      'Quality 75–90 covers most convert-to-WebP jobs. Size budget is better than guessing when a form has a KB cap.',
    settingsTips: [
      'Also export AVIF + JPEG for a full `<picture>` kit.',
      'Resize to displayed CSS width × 2 before you convert to WebP.',
      'Strip GPS on people photos.',
    ],
    comparisonRows: [
      ['vs JPEG', 'Usually smaller', 'Keeps alpha; slightly newer'],
      ['vs PNG', 'Much smaller on photos', 'PNG stays better for tiny lossless logos'],
      ['vs AVIF', 'Faster encode, wider support', 'AVIF often smaller'],
      ['Size budget', 'Supported', 'When you convert to WebP'],
      ['Animation', 'Not encoded here', 'Stills studio'],
    ],
    typicalRows: [
      ['JPEG photo', '3 MB JPEG', '~400 KB WebP', 'Convert to WebP at q80'],
      ['PNG screenshot', '1.8 MB PNG', '~220 KB WebP', 'Alpha kept'],
      ['HEIC iPhone', '2.5 MB HEIC', '~280 KB WebP', 'After JPEG bounce'],
    ],
    beforeAfter: {
      scene: 'photo',
      scenario: 'A landscape photo converting to WebP for the web.',
      caption:
        'Illustrative convert to WebP. Drop your own files above; processing stays on this device.',
      before: { format: 'JPEG', size: '3.2 MB', note: 'Typical photo source' },
      after: { format: 'WebP', size: '390 KB', note: 'Quality ~80' },
      savings: 'Often 70–90% on photos',
    },
    extraFaq: [
      {
        question: 'Does convert to WebP keep transparency?',
        answer:
          'Yes, when the source has alpha (PNG, some GIF frames, SVG rasters). JPEG sources have no alpha to keep when you convert to WebP.',
      },
      {
        question: 'Is convert to WebP lossless?',
        answer:
          'Default WebP is lossy. Raise quality and inspect. For guaranteed lossless graphics, convert to PNG (Oxipng) instead.',
      },
      {
        question: 'Can I convert to WebP and AVIF in one run?',
        answer:
          'Yes. Keep WebP as the primary preview and enable Also export AVIF. Download is a ZIP with format folders.',
      },
    ],
  },

  avif: {
    hook: 'Convert to AVIF when LCP stills need the smallest modern file and you can ship a WebP or JPEG fallback. libavif runs locally — slower encode, smaller heroes.',
    why: [
      'Convert to AVIF from JPEG, PNG, WebP, or HEIC in one queue. AVIF (AV1 stills) often wins on photos and busy screenshots.',
      'Convert to AVIF is not the email format. It is the above-the-fold format for sites that already have `<picture>` fallbacks.',
      'Size budget works when you convert to AVIF, which is usually easier than picking a quality number.',
    ],
    howItWorks: [
      'Drop mixed inputs. libavif encodes in a worker. Pause long batches — AVIF is CPU-heavy.',
      'GIF first frame, TIFF first page, HEIC JPEG bounce still apply, then you convert to AVIF.',
      'Also export WebP so you are not AVIF-only.',
    ],
    whenToUse: [
      'Hero images and galleries on modern stacks.',
      'When convert to WebP still leaves files too heavy.',
      'Skip convert to AVIF for partners who cannot decode it.',
    ],
    qualityNote:
      'Trust the preview. Low quality plus sharp UI text is the usual AVIF footgun. Size budget with a sane floor is safer.',
    settingsTips: [
      'Lower speed (more effort) for one-off heroes when you convert to AVIF.',
      'Do not AVIF-lossless camera photos for the web.',
      'Strip GPS; AVIF export is pixels only.',
    ],
    comparisonRows: [
      ['vs WebP', 'Often smaller', 'Slower encode, keep fallback'],
      ['vs JPEG', 'Much smaller heroes', 'JPEG still wins compatibility'],
      ['Size budget', 'Supported', 'When you convert to AVIF'],
      ['Alpha', 'Yes if source has it', 'Inspect edges'],
      ['Metadata out', 'Pixels only', 'Inspect source first'],
    ],
    typicalRows: [
      ['JPEG hero', '3.8 MB JPEG', '~180 KB AVIF', 'Convert to AVIF'],
      ['PNG screenshot', '2.1 MB PNG', '~140 KB AVIF', 'Watch text'],
      ['HEIC photo', '2.5 MB HEIC', '~160 KB AVIF', 'After bounce'],
    ],
    beforeAfter: {
      scene: 'photo',
      scenario: 'A landscape hero converting to AVIF for LCP.',
      caption:
        'Illustrative convert to AVIF. Encode is slower than WebP — worth it for heroes with a fallback.',
      before: { format: 'JPEG', size: '3.6 MB', note: 'Photo export' },
      after: { format: 'AVIF', size: '170 KB', note: 'Mid quality' },
      savings: '~95% smaller',
    },
    extraFaq: [
      {
        question: 'Should I convert to AVIF or convert to WebP?',
        answer:
          'AVIF usually wins on photos. WebP encodes faster and is slightly older in support. Many teams convert to AVIF and Also export WebP.',
      },
      {
        question: 'Why is convert to AVIF slow?',
        answer:
          'AV1 still encoding is heavier than MozJPEG or WebP. Workers keep the tab usable; Pause to collect finished files.',
      },
      {
        question: 'Does convert to AVIF keep EXIF?',
        answer:
          'No. AVIF, JXL, and QOI always export pixels only in Asset Melt.',
      },
    ],
  },

  jpeg: {
    hook: 'Convert to JPEG (JPG) when the world still wants a universal photo file — forms, email, print kiosks, and Windows users without extra codecs.',
    why: [
      'Convert to JPEG with MozJPEG, the same family of encoder Squoosh popularized. It is still the compatibility king.',
      'Convert to JPEG from HEIC when iPhone photos fail an upload. Convert to JPEG from PNG when a photo was saved as PNG. Convert to JPEG from WebP/AVIF when a partner cannot decode them.',
      'JPEG has no alpha. Convert to JPEG will flatten transparency — preview edges.',
    ],
    howItWorks: [
      'Drop any supported still. MozJPEG encodes. Size budget is available when you convert to JPEG.',
      'Progressive JPEG helps web previews. Turn it off if a picky RIP complains.',
      'HEIC still bounces through JPEG 0.92 before MozJPEG; GIF first frame; TIFF first page.',
    ],
    whenToUse: [
      'Any “JPG only” requirement.',
      'Email and conservative CMS fields.',
      'Skip convert to JPEG for logos that need alpha — convert to PNG or WebP.',
    ],
    qualityNote:
      'Quality 80–90 for most convert-to-JPEG jobs. Size budget when the form has a cap. Avoid re-saving the same JPEG over and over — start from the original.',
    settingsTips: [
      'Strip GPS before public posts.',
      'Resize for email (longest edge ~1280).',
      'Also export WebP if the same batch will also go on a site.',
    ],
    comparisonRows: [
      ['Compatibility', 'Best', 'Why people convert to JPEG'],
      ['Alpha', 'None', 'Flattened'],
      ['vs WebP', 'Larger photos usually', 'WebP needs modern support'],
      ['Size budget', 'Supported', 'When you convert to JPEG'],
      ['Codec', 'MozJPEG', 'WASM worker'],
    ],
    typicalRows: [
      ['HEIC iPhone', '2.5 MB HEIC', '~890 KB JPEG', 'Convert to JPEG for forms'],
      ['PNG photo', '5.5 MB PNG', '~420 KB JPEG', 'Flattened'],
      ['WebP fallback', '280 KB WebP', '~340 KB JPEG', 'Compatibility tax'],
    ],
    beforeAfter: {
      scene: 'photo',
      scenario: 'An outdoor HEIC converted to JPEG for a JPG-only upload form.',
      caption:
        'Illustrative convert to JPEG. MozJPEG, local, no upload.',
      before: { format: 'HEIC', size: '2.4 MB', note: 'Camera roll' },
      after: { format: 'JPEG', size: '860 KB', note: 'Universal JPG' },
      savings: 'Compatible, not always smaller than HEIC',
    },
    extraFaq: [
      {
        question: 'Is convert to JPEG the same as convert to JPG?',
        answer:
          'Yes. Convert to JPEG writes .jpg files. JPG and JPEG are the same format.',
      },
      {
        question: 'Does convert to JPEG keep transparency?',
        answer: 'No. JPEG flattens alpha. Convert to PNG or WebP if you need it.',
      },
      {
        question: 'Can I hit 100 KB when I convert to JPEG?',
        answer:
          'Yes. Size budget searches quality (and optionally resize). Or use /compress/under-100kb.',
      },
    ],
  },

  png: {
    hook: 'Convert to PNG when you need a portable lossless still — icons, UI, documents, and editors that still think in PNG. Oxipng by default; optional Reduce palette (lossy PNG-8) for TinyPNG-style graphics.',
    why: [
      'Convert to PNG from SVG when email blocks vectors. Convert to PNG from GIF for a crisp first-frame still. Convert to PNG from JPEG when a tool refuses JPEG (the PNG will be larger).',
      'Convert to PNG is not the smallest web photo format. Photos should convert to WebP or AVIF unless a human or printer demanded PNG.',
      'Size budget skips PNG. Reduce palette plus color count is the knob for small graphics when you convert to PNG.',
    ],
    howItWorks: [
      'Drop mixed inputs. Oxipng encodes. Turn on Reduce palette only for logos/icons.',
      'GIF first frame, TIFF first page, HEIC JPEG bounce — then convert to PNG from that bitmap (HEIC to PNG is not lossless from HEIC).',
      'Download PNG or a ZIP. Folder trees keep relative paths.',
    ],
    whenToUse: [
      'Graphics, stickers, print-adjacent stills, PNG-only importers.',
      'When convert to JPEG would flatten needed alpha.',
      'Skip convert to PNG for camera photos destined for a website.',
    ],
    qualityNote:
      'Lossless Oxipng looks identical to the decoded bitmap. Palette mode is lossy on purpose — same idea as TinyPNG / Squoosh Reduce Palette.',
    settingsTips: [
      'Icons: 32–64 colors, dither 0.',
      'Photos accidentally as PNG: consider switching output to WebP.',
      'Oxipng level 4 default; 6 for one-off masters.',
    ],
    comparisonRows: [
      ['Photos', 'PNG is huge', 'Prefer convert to WebP/AVIF'],
      ['Logos', 'Correct', 'Optional palette'],
      ['Alpha', 'Yes', 'Why people convert to PNG'],
      ['Size budget', 'Skipped', 'Use palette or resize'],
      ['Codec', 'Oxipng ± imagequant', 'WASM'],
    ],
    typicalRows: [
      ['SVG icon', '2 KB SVG', '~1 KB PNG', 'Convert to PNG at 24px'],
      ['GIF still', '90 KB GIF', '~35 KB PNG', 'First frame'],
      ['JPEG photo', '2 MB JPEG', '~9 MB PNG', 'Larger — expected'],
    ],
    beforeAfter: {
      scene: 'screenshot',
      scenario: 'A phone UI still converting to PNG.',
      caption:
        'Illustrative convert to PNG (Oxipng). Photos will not shrink like UI graphics — PNG is lossless unless Reduce palette is on.',
      before: { format: 'GIF', size: '220 KB', note: 'First UI frame' },
      after: { format: 'PNG', size: '95 KB', note: 'Oxipng still' },
      savings: 'Graphics shrink; photos often grow',
    },
    extraFaq: [
      {
        question: 'Can convert to PNG match TinyPNG?',
        answer:
          'For logos and icons, yes — Reduce palette (imagequant) then Oxipng. Photos should not use palette; convert to WebP or AVIF instead. Size budget still skips PNG.',
      },
      {
        question: 'Why did convert to PNG make my photo bigger?',
        answer:
          'JPEG/HEIC/WebP were lossy. PNG stores leftover pixels losslessly. Bigger is normal. Convert to WebP for a small photo.',
      },
      {
        question: 'Does convert to PNG keep animation from GIF?',
        answer:
          'No. GIF uses the first frame only — animation is not encoded.',
      },
    ],
  },

  jxl: {
    hook: 'Convert to JPEG XL when you are trialing a next-gen still, not when you need a public `<img>` that works for everyone. Size budget is supported; browser support is not universal.',
    why: [
      'Convert to JXL (JPEG XL) from PNG for smaller lossless-friendly archives, or from JPEG to see if JXL beats MozJPEG on your photos.',
      'Convert to JPEG XL is a studio experiment you can run privately. Do not delete JPEG/WebP masters.',
      'JXL export is pixels only — no EXIF round-trip.',
    ],
    howItWorks: [
      'Drop mixed inputs. @jsquash/jxl encodes. Effort costs time.',
      'Size budget works when you convert to JPEG XL.',
      'Also export WebP/JPEG so the ZIP still has shippable files.',
    ],
    whenToUse: [
      'Codec trials and JXL-aware tools.',
      'When convert to PNG lossless is still heavy and you control the decoder.',
      'Skip convert to JXL as the only format on a public marketing site in 2026.',
    ],
    qualityNote:
      'Inspect lossless vs lossy modes in preview. Support, not a 2% size win, should decide whether you ship JXL.',
    settingsTips: [
      'High effort for one-off tests when you convert to JXL.',
      'Keep originals.',
      'Do not expect Instagram to accept JXL.',
    ],
    comparisonRows: [
      ['Public web', 'Limited', 'Keep fallbacks'],
      ['Lossless vs PNG', 'Often smaller JXL', 'Why people convert to JXL'],
      ['Size budget', 'Supported', 'When you convert to JPEG XL'],
      ['Metadata', 'Pixels only', 'Inspect source'],
      ['Encode time', 'Rises with effort', 'Workers help'],
    ],
    typicalRows: [
      ['UI PNG', '220 KB PNG', '~160 KB JXL', 'Lossless-style'],
      ['JPEG photo', '3 MB JPEG', '~280 KB lossy JXL', 'Trial vs AVIF'],
      ['Need compatibility', 'Any', 'Also export JPEG/WebP', 'Do not JXL-only'],
    ],
    beforeAfter: {
      scene: 'screenshot',
      scenario: 'A phone UI PNG converting to JPEG XL for an archive trial.',
      caption:
        'Illustrative convert to JPEG XL. Keep PNG/WebP for the public web.',
      before: { format: 'PNG', size: '380 KB', note: 'Oxipng UI' },
      after: { format: 'JPEG XL', size: '250 KB', note: 'Lossless-style' },
      savings: '~34% in this lossless-style example',
    },
    extraFaq: [
      {
        question: 'Can users view files when I convert to JXL?',
        answer:
          'Only where JPEG XL is supported. Convert to JPEG XL for trials and tools; ship JPEG/WebP/AVIF to humans.',
      },
      {
        question: 'Does convert to JXL keep EXIF?',
        answer: 'No. JXL export is pixels only in Asset Melt.',
      },
      {
        question: 'Does size budget work when I convert to JXL?',
        answer: 'Yes. JPEG XL is included in size-budget encoding when you convert to JXL from this page.',
      },
    ],
  },

  qoi: {
    hook: 'Convert to QOI for tooling — a simple lossless still for engines and pipelines, not for `<img>` tags or CMS uploads.',
    why: [
      'Convert to QOI from PNG when a game engine or internal tool wants Quite OK Image. Convert to QOI from JPEG stores decoded JPEG pixels losslessly (the QOI will usually be larger than the JPEG).',
      'Convert to QOI is not TinyPNG. It is not a web performance trick. Size budget skips QOI.',
      'Keep PNG/JPEG for humans. Convert to QOI for software that implements the codec.',
    ],
    howItWorks: [
      'Drop mixed inputs. QOI encodes quickly in a worker.',
      'No JPEG-style quality slider — lossless from the working bitmap.',
      'GIF first frame / TIFF first page / HEIC bounce still apply before you convert to QOI.',
    ],
    whenToUse: [
      'QOI-aware tools and texture pipelines.',
      'When convert to PNG encode time is the bottleneck in your own software (QOI is simpler to decode).',
      'Skip convert to QOI for websites, email, and app stores.',
    ],
    qualityNote:
      'There is no quality trade-off. If the source was lossy, QOI stores those artifacts losslessly.',
    settingsTips: [
      'Resize to the texture size the engine wants before you convert to QOI.',
      'Do not enable PNG Reduce palette expecting it to affect QOI output.',
      'Keep a PNG sibling for preview in normal apps.',
    ],
    comparisonRows: [
      ['Web', 'No', 'Do not convert to QOI for sites'],
      ['Lossless pixels', 'Yes', 'From decoded bitmap'],
      ['vs PNG', 'Similar size often', 'Different decode story'],
      ['Size budget', 'Skipped', 'When you convert to QOI'],
      ['Alpha', 'Yes', 'Supported'],
    ],
    typicalRows: [
      ['PNG UI', '80 KB PNG', '~90 KB QOI', 'Container swap'],
      ['JPEG photo', '2 MB JPEG', '~9 MB QOI', 'Larger — expected'],
      ['Need web', 'Any', 'Convert to WebP', 'Not QOI'],
    ],
    beforeAfter: {
      scene: 'graphic',
      scenario: 'A ceramic mug product PNG converting to QOI for a local engine.',
      caption:
        'Illustrative convert to QOI. Tooling container, not a web compressor.',
      before: { format: 'PNG', size: '480 KB', note: 'Product texture' },
      after: { format: 'QOI', size: '510 KB', note: 'Lossless QOI' },
      savings: 'Similar size, QOI decode path',
    },
    extraFaq: [
      {
        question: 'Will convert to QOI shrink my JPEGs?',
        answer:
          'Usually the opposite. Convert to QOI stores decoded pixels losslessly. Use convert to WebP for smaller photos.',
      },
      {
        question: 'Can I convert to QOI for a website?',
        answer:
          'Not with normal HTML images. Convert to QOI only for software that loads QOI.',
      },
      {
        question: 'Does size budget work when I convert to QOI?',
        answer: 'No. Size budget skips QOI. Resize before you convert to QOI if the engine wants a smaller texture.',
      },
    ],
  },
}
