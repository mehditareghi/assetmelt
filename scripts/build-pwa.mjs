import { createHash } from 'node:crypto'
import { existsSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import { injectManifest } from 'workbox-build'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distClient = resolve(root, '.output/public')
const srcSw = resolve(root, 'src/sw.ts')
const tempSwPath = resolve(distClient, 'sw-src.js')
const swDest = resolve(distClient, 'sw.js')
const serverEntry = resolve(root, '.output/server/index.mjs')

if (!existsSync(distClient)) {
  console.error('Error: .output/public does not exist. Run vite build first.')
  process.exit(1)
}

if (!existsSync(serverEntry)) {
  console.error('Error: .output/server/index.mjs not found. Run vite build first.')
  process.exit(1)
}

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
    globDirectory: distClient,
    globPatterns: ['**/*.{js,css,wasm,woff2,svg,png,webmanifest}'],
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

const swContent = readFileSync(swDest)
const swStat = statSync(swDest)
const etag = `"${createHash('md5').update(swContent).digest('hex').slice(0, 16)}-${Buffer.from(String(swStat.size)).toString('base64url')}"`

const swEntry = `\t"/sw.js": {
\t\t"type": "text/javascript; charset=utf-8",
\t\t"etag": ${JSON.stringify(etag)},
\t\t"mtime": ${JSON.stringify(swStat.mtime.toISOString())},
\t\t"size": ${swStat.size},
\t\t"path": "../public/sw.js"
\t},`

let serverSource = readFileSync(serverEntry, 'utf8')

if (serverSource.includes('"/sw.js"')) {
  serverSource = serverSource.replace(
    /\t"\/sw\.js": \{[\s\S]*?\n\t\},/,
    swEntry.trimEnd(),
  )
} else {
  const marker = 'var public_assets_data_default = {'
  if (!serverSource.includes(marker)) {
    console.error('Error: could not find Nitro public assets manifest in server bundle.')
    process.exit(1)
  }
  serverSource = serverSource.replace(marker, `${marker}\n${swEntry}`)
}

writeFileSync(serverEntry, serverSource)
console.log('Patched Nitro public assets manifest with /sw.js')
