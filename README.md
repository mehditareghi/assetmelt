# Asset Melt

Client-side image compression, conversion, and transformation for developers. Zero uploads, free forever.

Built with Vite, React, shadcn/ui, and Squoosh-grade WASM codecs (@jsquash).

## Features

- **Format conversion** — JPEG (MozJPEG), WebP, AVIF, PNG (Oxipng), JPEG XL, QOI
- **Transforms** — Resize (Lanczos3, Mitchell, Magic Kernel, HQX…), crop, rotate, flip
- **Filters** — Brightness, contrast, saturation, grayscale, sharpen
- **Batch processing** — Queue multiple files, export as zip
- **Presets + JSON config** — Web Optimized, Dev Assets, Lossless PNG, Thumbnail, custom presets
- **Advanced mode** — Full codec parameter control
- **Privacy** — 100% client-side, no server, no accounts

## Supported input formats

JPEG, PNG, WebP, AVIF, GIF (first frame), BMP, SVG, HEIC/HEIF, JXL, QOI

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) for the landing page, or go directly to `/studio`.

## Build

```bash
pnpm build
pnpm preview
```

## Versioning

This project uses [Conventional Commits](https://www.conventionalcommits.org/) and [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) (semantic versioning from git history).

**Commit format:**

```
type(scope): subject

feat: add AVIF size budget presets
fix: correct MozJPEG color_space encoding
feat!: remove legacy preset format   # breaking change → major bump
```

| Commit type | Version bump |
|-------------|--------------|
| `fix:` | patch — third number (`0.1.0` → `0.1.1`) |
| `feat:` | minor — middle number (`0.1.3` → `0.2.0`) |
| `BREAKING CHANGE` / `feat!:` | major — first number (`0.1.0` → `1.0.0`) |

`pnpm release` uses `preMajor: false`, so `feat` bumps the minor segment even while the project is on `0.x`.

Commit messages are validated on commit via commitlint + husky.

**Cut a release** (bumps `package.json`, updates `CHANGELOG.md`, tags):

```bash
pnpm release
```

The footer reads its version from `package.json` at build time.

## Tech stack

- **Vite** + React 19 + TypeScript
- **shadcn/ui** (new-york) + Motion animations
- **Radix colors** — dark default, light mode ready
- **react-hook-form** + **zod** — pipeline validation
- **zustand** — studio state + localStorage persistence
- **@jsquash/** — browser WASM codecs from Google Squoosh

## Privacy

Your images never leave your browser. All processing happens locally via Web Workers and WebAssembly.

## License

MIT
