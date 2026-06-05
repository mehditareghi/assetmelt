import { createHash } from 'node:crypto'
import { existsSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import { injectManifest } from 'workbox-build'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const srcSw = resolve(root, 'src/sw.ts')

function resolveNitroOutput() {
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

    return { nitroRoot, preset: nitro.preset, publicDir, serverEntry }
  }

  console.error(
    'Error: Nitro build output not found. Expected .vercel/output or .output after vite build.',
  )
  process.exit(1)
}

const { preset, publicDir, serverEntry } = resolveNitroOutput()
const tempSwPath = join(publicDir, 'sw-src.js')
const swDest = join(publicDir, 'sw.js')

console.log(`Building PWA for Nitro preset "${preset}" → ${publicDir}`)

console.log('Transpiling service worker...')
const result = await build({
  entryPoints: [srcSw],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2020',
  outfile: tempSwPath,
  minify: false,
  logLevel: 'warning',
})

if (result.errors.length > 0) {
  console.error('Failed to transpile service worker:', result.errors)
  process.exit(1)
}

console.log('Generating service worker with workbox injectManifest...')

try {
  const { count, size, warnings } = await injectManifest({
    swSrc: tempSwPath,
    swDest,
    globDirectory: publicDir,
    globPatterns: ['**/*.{js,css,html,wasm,woff2,svg,png,webmanifest}'],
    globIgnores: ['sw-src.js', 'sw.js', '**/node_modules/**'],
    maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
  })

  unlinkSync(tempSwPath)

  if (warnings.length > 0) {
    console.warn('Workbox warnings:', warnings.join('\n'))
  }

  console.log(
    `Service worker generated with ${count} files, totaling ${(size / 1024).toFixed(1)} KB`,
  )
} catch (error) {
  console.error('Error generating service worker:', error)
  process.exit(1)
}

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
