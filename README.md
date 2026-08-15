# Asset Melt

Client-side image compression, conversion, and transformation for developers. Zero uploads, free forever.

Built with Vite, React, shadcn/ui, and Squoosh-grade WASM codecs (@jsquash).

## Features

- **Format conversion** — JPEG (MozJPEG), WebP, AVIF, PNG (Oxipng), JPEG XL, QOI
- **Transforms** — Resize (Lanczos3, Mitchell, Magic Kernel, HQX…), crop, rotate, flip
- **Filters** — Brightness, contrast, saturation, grayscale, sharpen
- **Batch processing** — Drop files or a folder (recursive; non-images skipped), encode in parallel (worker pool up to 4), cancel mid-batch, ZIP export keeps relative paths
- **Presets + JSON config** — Web Optimized, Dev Assets, Lossless PNG, Thumbnail, custom presets; import/export pipeline as a JSON file
- **Keyboard shortcuts** — `?` cheatsheet in Studio; Cmd/Ctrl+Enter process, S download, K recipes
- **Filename tokens** — `{name}` `{ext}` `{width}` `{height}` `{quality}` `{date}` in the pattern field, ZIP, and favicon kits
- **Shareable recipes** — copy a `?recipe=` link (named preset or compact pipeline). Images never go in the URL
- **Multi-format one-run** — Also export AVIF / WebP / optional JPEG; ZIP download uses a folder per format (`avif/`, `webp/`, `jpeg/`)
- **Responsive export** — optional Studio kit: N widths × formats ZIP (folders named by width) + copy `<picture>` / next/image
- **Advanced mode** — Full codec parameter control
- **Privacy** — 100% client-side, no server, no accounts

## Supported input formats

JPEG, PNG, WebP, AVIF, GIF (first frame), TIFF (first page), BMP, SVG, HEIC/HEIF (JPEG intermediate), JXL, QOI

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

## Versioning & releases

Releases are fully automated with [semantic-release](https://semantic-release.gitbook.io/) on every push to `main`.

**Commit format** (enforced by commitlint + husky):

```
type(scope): subject

feat: add AVIF size budget presets
fix: correct MozJPEG color_space encoding
perf: speed up batch zip export
feat!: remove legacy preset format   # breaking change → major bump
```

| Commit type | Version bump |
|-------------|--------------|
| `fix:` / `perf:` | patch — third number (`0.1.0` → `0.1.1`) |
| `feat:` | minor — middle number (`0.1.3` → `0.2.0`) |
| `BREAKING CHANGE` / `feat!:` | major — first number (`0.1.0` → `1.0.0`) |

`feat` bumps minor even on `0.x`. Commits like `chore:`, `docs:`, and `ci:` do **not** trigger a release.

### What happens on push to `main`

The [Release workflow](.github/workflows/release.yml) runs four jobs:

1. **release** — analyzes commits since the last tag, creates a GitHub Release + git tag when needed
2. **deploy** — runs only when a new version was published; builds and deploys to Vercel production
3. **no-deploy** — runs when there was nothing to release; writes a workflow summary explaining that build/deploy were skipped
4. **notify** — always runs at the end; sends a Telegram message with release notes, contributors, or a no-release summary

There is no local `pnpm release` command. Merge conventional commits to `main` and CI handles the rest.

### Version at build time

There is no `version` field in `package.json`. At build time, `prebuild` writes `public/version.json` from the release tag (or `APP_VERSION` in CI). The root route loader reads that file on the server so the version appears on first paint without embedding it in JS bundles.

Git-triggered **production** builds on Vercel are disabled (`scripts/vercel-should-build.sh`). Production deploys come from GitHub Actions only. **Preview** deployments (pull requests) still build on Vercel as usual.

### One-time setup (outside the repo)

Complete these steps once before the release pipeline can run end-to-end.

#### 1. GitHub secret — `SEMANTIC_RELEASE_TOKEN`

semantic-release needs a token that can create releases and push tags.

1. Open [GitHub → Settings → Developer settings → Fine-grained tokens](https://github.com/settings/tokens?type=beta)
2. **Generate new token**
3. **Repository access:** Only select repositories → `assetmelt`
4. **Permissions:**
   - **Contents:** Read and write (tags + GitHub Releases)
   - **Metadata:** Read-only (required)
5. Copy the token
6. In the repo: **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `SEMANTIC_RELEASE_TOKEN`
   - Value: the token

If branch protection on `main` blocks the default `GITHUB_TOKEN`, this PAT is required. If you skip it, the workflow falls back to `GITHUB_TOKEN`.

#### 2. GitHub secrets — Vercel deploy

The deploy job uses the Vercel CLI. Add three repository secrets:

| Secret | Where to find it |
|--------|------------------|
| `VERCEL_TOKEN` | [Vercel → Account Settings → Tokens](https://vercel.com/account/tokens) — create a token with deploy scope |
| `VERCEL_ORG_ID` | Run `npx vercel link` locally, then read `.vercel/project.json` → `orgId` |
| `VERCEL_PROJECT_ID` | Same file → `projectId` |

#### 3. GitHub environment — `Production`

The deploy job targets the **Production** environment so deployment history is visible under **Actions → Environments**.

If your repo is connected to Vercel, GitHub usually already has a **Production** environment — no need to create one. (Lowercase `production` is treated as the same name.)

Optionally open **Settings → Environments → Production** to add protection rules (required reviewers, wait timer). No extra secrets needed if they are already repository secrets.

#### 4. Vercel — confirm ignore command is active

`vercel.json` sets `"ignoreCommand": "bash scripts/vercel-should-build.sh"`, which skips git-triggered production builds. After merging, confirm in the Vercel dashboard that production deploys on `main` pushes are skipped and only the GitHub Actions deploy job promotes production.

No manual Ignored Build Step entry is needed in the Vercel UI when `ignoreCommand` is in `vercel.json`.

#### 5. GitHub secrets — Telegram notifications

The **notify** job posts to Telegram after every pipeline run.

1. Open Telegram and message [@BotFather](https://t.me/BotFather)
2. Send `/newbot`, follow prompts, copy the **bot token**
3. Add the bot to your channel or group
4. Get the **chat ID** (see troubleshooting below if `getUpdates` returns `[]`)
5. Add GitHub repository secrets:
   - `TELEGRAM_BOT_TOKEN` — bot token from BotFather
   - `TELEGRAM_CHAT_ID` — group chat ID (negative number like `-1001234567890`)
   - `TELEGRAM_MESSAGE_THREAD_ID` — optional; required for forum **topics** (the topic ID number)

**Getting chat ID when `getUpdates` returns `[]`**

Run the helper script locally (it also clears a blocking webhook automatically):

```bash
TELEGRAM_BOT_TOKEN=your_token node scripts/telegram-get-chat-id.mjs
```

Then trigger an update and run again:

1. **BotFather:** `/setprivacy` → your bot → **Disable**
2. **Option A — DM (easiest test):** open `t.me/YourBotName` → send `/start` → re-run script (confirms token works; gives your user chat ID, not the group)
3. **Option B — group topic:** send `/start@YourBotName` inside your topic → re-run script
4. **Option C — re-add bot:** remove bot from group → add back → send any message → re-run script

**Why `getUpdates` stays empty**

- A **webhook** is set on the bot (polling returns `[]`) — the helper script deletes it, or open:  
  `https://api.telegram.org/bot<TOKEN>/deleteWebhook?drop_pending_updates=true`
- **Privacy mode** is on — bot only sees `/commands` and `@mentions`
- No message was sent **after** the bot was added

**RawDataBot alternative (no need to add it to the group)**

Forward any message **from your group topic** to [@RawDataBot](https://t.me/RawDataBot) in a **private chat**. It replies with JSON containing the group `chat.id`. For forum topics, still use the helper script after messaging in the topic to get `message_thread_id`.

If these secrets are missing, the notify job skips sending (the pipeline still succeeds).

**Example messages:**

| Outcome | Telegram message includes |
|---------|---------------------------|
| New release + deploy | Version, release notes, contributors, links to GitHub Release + live site |
| No release | Reason, recent non-releasable commits, workflow link |
| Deploy failed | Version + tag published, failure notice, workflow link |
| Release failed | Failure notice, workflow link |

## Tech stack

- **Vite** + React 19 + TypeScript
- **shadcn/ui** (new-york) + Motion animations
- **Radix colors** — dark default, light mode ready
- **react-hook-form** + **zod** — pipeline validation
- **zustand** — studio state + localStorage persistence
- **@jsquash/** — browser WASM codecs from Google Squoosh

## Privacy

Your image files never leave the browser. Encode and decode are 100% client-side via Web Workers and WebAssembly — I cannot see or recover your photos. The hosted site still uses analytics and Sentry sampled session replay of the website UI only (image pixels are not recorded; media is blocked). See `/privacy`.

## License

MIT
