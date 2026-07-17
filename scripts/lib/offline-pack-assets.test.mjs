import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import {
  buildOfflineManifest,
  collectOfflinePackAssets,
  computeOfflinePackVersion,
  OFFLINE_PACK_DENY_PATTERNS,
} from './offline-pack-assets.mjs'

function writeFixture(publicDir) {
  mkdirSync(join(publicDir, 'studio'), { recursive: true })
  mkdirSync(join(publicDir, 'assets'), { recursive: true })
  mkdirSync(join(publicDir, 'icons'), { recursive: true })

  writeFileSync(
    join(publicDir, 'studio/index.html'),
    `<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="/assets/globals-abc.css" />
    <script type="module" src="/assets/index-main.js"></script>
  </head>
  <body>
    <script>window.__TSR__={"\\/studio":{"preloads":["/assets/studio-route.js","/assets/select-ui.js"]}}</script>
  </body>
</html>`,
  )

  writeFileSync(
    join(publicDir, 'assets/globals-abc.css'),
    `@font-face { src: url("/assets/inter-latin.woff2"); }`,
  )
  writeFileSync(join(publicDir, 'assets/inter-latin.woff2'), 'font-bytes')
  writeFileSync(
    join(publicDir, 'assets/index-main.js'),
    `import"/assets/studio-route.js";import"/assets/image-worker.js";`,
  )
  writeFileSync(
    join(publicDir, 'assets/studio-route.js'),
    `const wasm="/assets/codec.avif.wasm";import("./heic-to-test.js");`,
  )
  writeFileSync(join(publicDir, 'assets/heic-to-test.js'), 'export const isHeic=()=>false')
  writeFileSync(join(publicDir, 'assets/select-ui.js'), 'export {}')
  writeFileSync(join(publicDir, 'assets/image-worker.js'), 'const x="/assets/codec.avif.wasm"')
  writeFileSync(join(publicDir, 'assets/codec.avif.wasm'), 'wasm-bytes')
  writeFileSync(join(publicDir, 'assets/tool-landing-page-dead.js'), 'marketing')
  writeFileSync(join(publicDir, 'assets/squoosh-alternative-route.js'), 'marketing')
  writeFileSync(join(publicDir, 'index.html'), '<html>home</html>')
  writeFileSync(join(publicDir, 'og.png'), 'png')
  writeFileSync(join(publicDir, 'manifest.webmanifest'), '{}')
  writeFileSync(join(publicDir, 'favicon.svg'), '<svg></svg>')
  writeFileSync(join(publicDir, 'icons/icon-192.png'), 'png')
  writeFileSync(join(publicDir, 'icons/icon-512.png'), 'png')
}

test('collectOfflinePackAssets includes studio closure and excludes marketing assets', () => {
  const publicDir = mkdtempSync(join(tmpdir(), 'assetmelt-offline-pack-'))
  try {
    writeFixture(publicDir)
    const { assets, totalBytes } = collectOfflinePackAssets(publicDir)

    assert.ok(assets.includes('/studio'))
    assert.ok(assets.includes('/assets/index-main.js'))
    assert.ok(assets.includes('/assets/studio-route.js'))
    assert.ok(assets.includes('/assets/heic-to-test.js'))
    assert.ok(assets.includes('/assets/inter-latin.woff2'))
    assert.equal(assets.includes('/index.html'), false)
    assert.equal(assets.includes('/og.png'), false)
    assert.equal(assets.some((url) => url.includes('tool-landing-page')), false)
    assert.equal(assets.some((url) => url.includes('squoosh-alternative')), false)
    assert.ok(totalBytes > 0)
  } finally {
    rmSync(publicDir, { recursive: true, force: true })
  }
})

test('computeOfflinePackVersion changes when pack assets change', () => {
  const publicDir = mkdtempSync(join(tmpdir(), 'assetmelt-offline-pack-version-'))
  try {
    writeFixture(publicDir)
    const first = buildOfflineManifest(publicDir)

    writeFileSync(join(publicDir, 'assets/codec.avif.wasm'), 'wasm-bytes-v2')
    const second = buildOfflineManifest(publicDir)

    assert.notEqual(first.packVersion, second.packVersion)
    assert.match(first.packVersion, /^[a-f0-9]{16}$/)
    assert.match(second.packVersion, /^[a-f0-9]{16}$/)
  } finally {
    rmSync(publicDir, { recursive: true, force: true })
  }
})

test('buildOfflineManifest exposes packVersion instead of app version', () => {
  const publicDir = mkdtempSync(join(tmpdir(), 'assetmelt-offline-pack-manifest-'))
  try {
    writeFixture(publicDir)
    const manifest = buildOfflineManifest(publicDir)

    assert.ok(typeof manifest.packVersion === 'string')
    assert.equal('version' in manifest, false)
    assert.ok(Array.isArray(manifest.assets))
    assert.ok(typeof manifest.assetSizes === 'object')
  } finally {
    rmSync(publicDir, { recursive: true, force: true })
  }
})

test('deny patterns stay focused on marketing-only assets', () => {
  assert.ok(OFFLINE_PACK_DENY_PATTERNS.some((pattern) => pattern.test('/squoosh-alternative')))
  assert.ok(OFFLINE_PACK_DENY_PATTERNS.some((pattern) => pattern.test('/privacy')))
  assert.ok(OFFLINE_PACK_DENY_PATTERNS.some((pattern) => pattern.test('/about')))
  assert.ok(OFFLINE_PACK_DENY_PATTERNS.some((pattern) => pattern.test('/author')))
  assert.ok(OFFLINE_PACK_DENY_PATTERNS.some((pattern) => pattern.test('/assets/tool-landing-page-abc.js')))
  assert.ok(OFFLINE_PACK_DENY_PATTERNS.some((pattern) => pattern.test('/studio/png-to-webp')))
  assert.ok(OFFLINE_PACK_DENY_PATTERNS.some((pattern) => pattern.test('/studio/avif-to-jpg')))
  assert.equal(
    OFFLINE_PACK_DENY_PATTERNS.some((pattern) => pattern.test('/assets/studio-route.js')),
    false,
  )
  assert.equal(
    OFFLINE_PACK_DENY_PATTERNS.some((pattern) => pattern.test('/assets/avif_enc-abc.wasm')),
    false,
  )
  assert.equal(
    OFFLINE_PACK_DENY_PATTERNS.some((pattern) => pattern.test('/studio')),
    false,
  )
})
