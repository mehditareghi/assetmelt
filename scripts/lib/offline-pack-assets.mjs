import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ASSET_URL_PATTERN = /\/assets\/[A-Za-z0-9._-]+\.(?:js|wasm|woff2|css)/g

/** URLs that must never ship in the studio offline pack. */
export const OFFLINE_PACK_DENY_URLS = new Set([
  '/',
  '/index.html',
  '/og.png',
])

/** Path segments / filename hints for marketing-only assets. */
export const OFFLINE_PACK_DENY_PATTERNS = [
  /^\/blog/,
  /^\/privacy/,
  /^\/about/,
  /^\/author/,
  /^\/convert\//,
  /^\/tools\//,
  /^\/compress\//,
  /^\/squoosh-alternative/,
  /^\/crypto\//,
  /^\/llms/,
  /\/tool-landing-page-/,
  /\/landing-section-header-/,
  /\/routes-/,
  /\/squoosh-alternative-/,
  /\/heic-to-jpg-/,
  /\/batch-image-compressor-/,
  /\/avif-/,
]

export const OFFLINE_PACK_STATIC_URLS = [
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

export const OFFLINE_URL_ALIASES = {
  '/studio/index.html': '/studio',
}

function normalizePublicUrl(url) {
  const withoutHash = url.split('#')[0] ?? url
  const aliased = OFFLINE_URL_ALIASES[withoutHash] ?? withoutHash
  return aliased.startsWith('/') ? aliased : `/${aliased}`
}

function isPackAssetUrl(url) {
  if (!url.startsWith('/') || url.includes('#')) return false
  if (isDeniedUrl(url)) return false
  return true
}

function isDeniedUrl(url) {
  if (OFFLINE_PACK_DENY_URLS.has(url)) return true
  return OFFLINE_PACK_DENY_PATTERNS.some((pattern) => pattern.test(url))
}

function publicPathFromUrl(publicDir, url) {
  const normalized = url.startsWith('/') ? url.slice(1) : url
  if (normalized === 'studio' || normalized === 'studio/') {
    return join(publicDir, 'studio/index.html')
  }
  return join(publicDir, normalized)
}

function isReadablePackFile(publicDir, url) {
  const filePath = publicPathFromUrl(publicDir, url)
  if (!existsSync(filePath)) return false
  return statSync(filePath).isFile()
}

function extractAssetUrls(source) {
  const matches = source.match(ASSET_URL_PATTERN) ?? []
  return [...new Set(matches.map(normalizePublicUrl))]
}

function resolveRelativeAssetUrl(fromUrl, relativePath) {
  if (relativePath.startsWith('/assets/')) return normalizePublicUrl(relativePath)
  if (!relativePath.startsWith('./') && !relativePath.startsWith('../')) return null

  const baseParts = fromUrl.split('/').filter(Boolean)
  baseParts.pop()
  const relParts = relativePath.split('/')

  for (const part of relParts) {
    if (part === '.' || part === '') continue
    if (part === '..') baseParts.pop()
    else baseParts.push(part)
  }

  return normalizePublicUrl(`/${baseParts.join('/')}`)
}

function extractJsAssetUrls(source, fromUrl) {
  const urls = extractAssetUrls(source)

  for (const match of source.matchAll(/[`'"](\.\/[^`'"]+\.(?:js|wasm|css|woff2))[`'"]/g)) {
    const resolved = resolveRelativeAssetUrl(fromUrl, match[1])
    if (resolved && isPackAssetUrl(resolved)) urls.push(resolved)
  }

  return [...new Set(urls)]
}

function parseStudioHtml(html) {
  const urls = new Set()

  for (const match of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)) {
    const value = match[1]
    if (value.startsWith('/') && isPackAssetUrl(normalizePublicUrl(value))) {
      urls.add(normalizePublicUrl(value))
    }
  }

  for (const match of html.matchAll(/"(\/assets\/[^"#]+)"/g)) {
    const normalized = normalizePublicUrl(match[1])
    if (isPackAssetUrl(normalized)) urls.add(normalized)
  }

  return urls
}

function extractCssAssetUrls(source) {
  const urls = []
  for (const match of source.matchAll(/url\(["']?(\/assets\/[^"')]+)["']?\)/g)) {
    urls.push(normalizePublicUrl(match[1]))
  }
  return urls
}

function listWasmUrls(publicDir) {
  const assetsDir = join(publicDir, 'assets')
  if (!existsSync(assetsDir)) return []

  const urls = []
  for (const file of readdirSync(assetsDir)) {
    if (file.endsWith('.wasm')) urls.push(`/assets/${file}`)
  }
  return urls
}

function listWorkerUrls(publicDir) {
  const assetsDir = join(publicDir, 'assets')
  if (!existsSync(assetsDir)) return []

  const urls = []
  for (const file of readdirSync(assetsDir)) {
    if (file.includes('worker') && file.endsWith('.js')) {
      urls.push(`/assets/${file}`)
    }
  }
  return urls
}

function resolveAssetDependencies(publicDir, seedUrls) {
  const queue = [...seedUrls]
  const seen = new Set()

  while (queue.length > 0) {
    const url = queue.shift()
    if (
      !url ||
      seen.has(url) ||
      isDeniedUrl(url) ||
      !url.startsWith('/assets/') ||
      (!url.endsWith('.js') && !url.endsWith('.css'))
    ) {
      continue
    }

    seen.add(url)
    const filePath = publicPathFromUrl(publicDir, url)
    if (!existsSync(filePath)) continue

    const source = readFileSync(filePath, 'utf8')
    const nextUrls =
      url.endsWith('.css')
        ? extractCssAssetUrls(source)
        : extractJsAssetUrls(source, url)

    for (const nextUrl of nextUrls) {
      if (seen.has(nextUrl) || isDeniedUrl(nextUrl)) continue
      if (
        nextUrl.endsWith('.woff2') ||
        nextUrl.endsWith('.wasm') ||
        nextUrl.endsWith('.svg') ||
        nextUrl.endsWith('.png')
      ) {
        seen.add(nextUrl)
        continue
      }
      queue.push(nextUrl)
    }
  }

  return seen
}

/**
 * Collect the studio offline pack asset URLs from a Nitro public directory.
 */
export function collectOfflinePackAssets(publicDir) {
  const studioHtmlPath = join(publicDir, 'studio/index.html')
  if (!existsSync(studioHtmlPath)) {
    throw new Error(`Studio shell not found at ${studioHtmlPath}`)
  }

  const studioHtml = readFileSync(studioHtmlPath, 'utf8')
  const seedUrls = new Set([
    '/studio',
    '/studio/index.html',
    ...OFFLINE_PACK_STATIC_URLS,
    ...parseStudioHtml(studioHtml),
    ...listWasmUrls(publicDir),
    ...listWorkerUrls(publicDir),
  ])

  const dependencyUrls = resolveAssetDependencies(publicDir, [...seedUrls])
  for (const dependencyUrl of dependencyUrls) seedUrls.add(dependencyUrl)

  const assets = [
    ...new Set(
      [...seedUrls]
        .map(normalizePublicUrl)
        .filter(isPackAssetUrl)
        .filter((url) => isReadablePackFile(publicDir, url)),
    ),
  ].sort()

  const assetSizes = {}
  let totalBytes = 0

  for (const url of assets) {
    const filePath = publicPathFromUrl(publicDir, url)
    const size = statSync(filePath).size
    assetSizes[url] = size
    totalBytes += size
  }

  return { assets, assetSizes, totalBytes }
}

export function computeOfflinePackVersion(publicDir, assets) {
  const hash = createHash('sha256')

  for (const url of assets) {
    const filePath = publicPathFromUrl(publicDir, url)
    if (!isReadablePackFile(publicDir, url)) continue
    hash.update(url)
    hash.update(readFileSync(filePath))
  }

  return hash.digest('hex').slice(0, 16)
}

export function buildOfflineManifest(publicDir) {
  const { assets, assetSizes, totalBytes } = collectOfflinePackAssets(publicDir)
  const packVersion = computeOfflinePackVersion(publicDir, assets)

  return {
    packVersion,
    totalBytes,
    assets,
    assetSizes,
  }
}

export function summarizeOfflinePack(manifest) {
  const html = manifest.assets.filter((url) => url.endsWith('.html') || url === '/studio')
  const js = manifest.assets.filter((url) => url.endsWith('.js'))
  const wasm = manifest.assets.filter((url) => url.endsWith('.wasm'))

  return {
    assetCount: manifest.assets.length,
    totalMb: (manifest.totalBytes / (1024 * 1024)).toFixed(2),
    html,
    jsCount: js.length,
    wasmCount: wasm.length,
    deniedExamples: OFFLINE_PACK_DENY_PATTERNS.map(String),
  }
}
