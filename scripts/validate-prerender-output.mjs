import { existsSync, readFileSync, statSync, unlinkSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')

const MIN_HTML_BYTES = 1024

function resolveNitroOutput() {
  let selected = null

  for (const nitroRoot of [
    join(root, '.vercel/output'),
    join(root, '.output'),
  ]) {
    const nitroJsonPath = join(nitroRoot, 'nitro.json')
    if (!existsSync(nitroJsonPath)) continue

    const nitro = JSON.parse(readFileSync(nitroJsonPath, 'utf8'))
    const publicDir = join(nitroRoot, nitro.publicDir ?? 'public')
    if (!existsSync(publicDir)) continue

    const builtAt = nitro.date ? Date.parse(nitro.date) : 0
    if (!selected || builtAt >= selected.builtAt) {
      selected = { nitro, publicDir, builtAt }
    }
  }

  return selected
}

function checkHtml(relativePath, { required = false } = {}) {
  const filePath = join(publicDir, relativePath)
  if (!existsSync(filePath)) {
    if (required) return `${relativePath} is missing`
    return null
  }

  const size = statSync(filePath).size
  if (size < MIN_HTML_BYTES) {
    if (relativePath === 'index.html' && nitro.preset === 'vercel') {
      unlinkSync(filePath)
      console.warn(`validate-prerender-output: removed corrupt ${relativePath} (${size} bytes)`)
      return null
    }
    return `${relativePath} is only ${size} bytes`
  }

  return null
}

const output = resolveNitroOutput()
if (!output) {
  console.log('validate-prerender-output: no Nitro public dir found, skipping.')
  process.exit(0)
}

const { nitro, publicDir } = output
const failures = []

if (nitro.preset === 'vercel') {
  // Studio shell is required for the offline pack; homepage is SSR on Vercel.
  const studioFailure = checkHtml('studio/index.html', { required: true })
  if (studioFailure) failures.push(studioFailure)

  const homepageFailure = checkHtml('index.html')
  if (homepageFailure) failures.push(homepageFailure)
} else {
  for (const relativePath of ['index.html', 'blog/index.html', 'studio/index.html']) {
    const failure = checkHtml(relativePath)
    if (failure) failures.push(failure)
  }
}

if (failures.length > 0) {
  console.error('validate-prerender-output: invalid prerender artifacts:')
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

console.log(`validate-prerender-output: OK (${publicDir})`)
