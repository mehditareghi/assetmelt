import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

/** Latest release version from git tag, with Vercel/env fallbacks. */
export function getVersionFromGitTag() {
  if (process.env.APP_VERSION) return process.env.APP_VERSION

  const ref = process.env.VERCEL_GIT_COMMIT_REF ?? ''
  if (/^v?\d+\.\d+\.\d+$/.test(ref)) {
    return ref.replace(/^v/, '')
  }

  try {
    return execSync('git describe --tags --abbrev=0', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .trim()
      .replace(/^v/, '')
  } catch {
    return null
  }
}

/** Fallback when git tags are unavailable (e.g. Vercel shallow clone). */
export function getVersionFromPackageJson() {
  try {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
    if (pkg.version && pkg.version !== '0.0.0') return pkg.version
  } catch {
    // ignore
  }
  return null
}

export function resolveAppVersion() {
  return getVersionFromGitTag() ?? getVersionFromPackageJson() ?? 'dev'
}
