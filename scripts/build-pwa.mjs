import { createHash } from 'node:crypto'
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import { getManifest } from 'workbox-build'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const srcSw = resolve(root, 'src/sw.ts')

function resolveNitroOutput() {
  /** Prefer the freshest Nitro output when both `.vercel/output` and `.output` exist locally. */
  let selected = null

  for (const nitroRoot of [
    resolve(root, '.vercel/output'),
    resolve(root, '.output'),
  ]) {
    const nitroJsonPath = join(nitroRoot, 'nitro.json')
    if (!existsSync(nitroJsonPath)) continue

    const nitro = JSON.parse(readFileSync(nitroJsonPath, 'utf8'))
    const publicDir = join(nitroRoot, nitro.publicDir ?? 'public')
    const serverEntry = join(nitroRoot, nitro.serverEntry ?? 'server/index.mjs')

    if (!existsSync(publicDir)) {
      console.error(`Error: Nitro public dir not found at ${publicDir}`)
      process.exit(1)
    }

    const builtAt = nitro.date ? Date.parse(nitro.date) : 0
    if (!selected || builtAt >= selected.builtAt) {
      selected = {
        nitroRoot,
        preset: nitro.preset,
        publicDir,
        serverEntry,
        builtAt,
      }
    }
  }

  if (!selected) {
    console.error(
      'Error: Nitro build output not found. Expected .vercel/output or .output after vite build.',
    )
    process.exit(1)
  }

  return selected
}

const { preset, publicDir, serverEntry } = resolveNitroOutput()
const swDest = join(publicDir, 'sw.js')
const offlineManifestDest = join(publicDir, 'offline-manifest.json')

console.log(`Building PWA for Nitro preset "${preset}" → ${publicDir}`)

console.log('Generating offline manifest...')
const { manifestEntries, warnings } = await getManifest({
  globDirectory: publicDir,
  globPatterns: ['**/*.{js,css,html,wasm,woff2,svg,png,webmanifest}'],
  globIgnores: ['sw.js', 'offline-manifest.json', '**/node_modules/**'],
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
})

if (warnings.length > 0) {
  console.warn('Workbox warnings:', warnings.join('\n'))
}

const version = JSON.parse(readFileSync(join(root, 'public/version.json'), 'utf8')).version

/** Safari rejects SW responses that were fetched through redirects — use canonical 200 URLs. */
const OFFLINE_URL_ALIASES = {
  '/studio/index.html': '/studio',
}

const assetMap = new Map()
for (const entry of manifestEntries) {
  const url = OFFLINE_URL_ALIASES[`/${entry.url}`] ?? `/${entry.url}`
  const filePath = join(publicDir, entry.url)
  const size = existsSync(filePath) ? statSync(filePath).size : 0
  assetMap.set(url, Math.max(assetMap.get(url) ?? 0, size))
}

const assets = [...assetMap.entries()].map(([url, size]) => ({ url, size }))
const totalBytes = assets.reduce((sum, asset) => sum + asset.size, 0)

writeFileSync(
  offlineManifestDest,
  `${JSON.stringify(
    {
      version,
      totalBytes,
      assets: assets.map((asset) => asset.url),
      assetSizes: Object.fromEntries(assets.map((asset) => [asset.url, asset.size])),
    },
    null,
    2,
  )}\n`,
)

console.log(
  `Offline manifest: ${assets.length} files, ${(totalBytes / 1024 / 1024).toFixed(1)} MB → offline-manifest.json`,
)

console.log('Transpiling service worker...')
const result = await build({
  entryPoints: [srcSw],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: 'es2020',
  outfile: swDest,
  minify: false,
  logLevel: 'warning',
})

if (result.errors.length > 0) {
  console.error('Failed to transpile service worker:', result.errors)
  process.exit(1)
}

console.log(`Service worker written → ${swDest}`)

if (!existsSync(serverEntry)) {
  console.log('No server bundle to patch (static hosting only).')
  process.exit(0)
}

const serverSource = readFileSync(serverEntry, 'utf8')
const marker = 'var public_assets_data_default = {'

if (!serverSource.includes(marker)) {
  console.log('Server bundle has no embedded public asset manifest; skipping Nitro patch.')
  process.exit(0)
}

const swContent = readFileSync(swDest)
const swStat = statSync(swDest)
const etag = `"${createHash('md5').update(swContent).digest('hex').slice(0, 16)}-${Buffer.from(String(swStat.size)).toString('base64url')}"`
const swRelativePath = relative(dirname(serverEntry), swDest).replace(/\\/g, '/')

const swEntry = `\t"/sw.js": {
\t\t"type": "text/javascript; charset=utf-8",
\t\t"etag": ${JSON.stringify(etag)},
\t\t"mtime": ${JSON.stringify(swStat.mtime.toISOString())},
\t\t"size": ${swStat.size},
\t\t"path": ${JSON.stringify(swRelativePath)}
\t},`

let patchedSource = serverSource

if (patchedSource.includes('"/sw.js"')) {
  patchedSource = patchedSource.replace(
    /\t"\/sw\.js": \{[\s\S]*?\n\t\},/,
    swEntry.trimEnd(),
  )
} else {
  patchedSource = patchedSource.replace(marker, `${marker}\n${swEntry}`)
}

writeFileSync(serverEntry, patchedSource)
console.log(`Patched Nitro public assets manifest in ${serverEntry}`)
