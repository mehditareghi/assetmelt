import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'

/** ISO date (YYYY-MM-DD) from git last commit touching a file, or null. */
export function gitLastCommitDate(filePath) {
  if (!existsSync(filePath)) return null

  try {
    const iso = execSync(`git log -1 --format=%cI -- "${filePath}"`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()

    if (!iso) return null
    return iso.slice(0, 10)
  } catch {
    return null
  }
}

/** Prefer explicit ISO date from frontmatter, else git last commit on source file. */
export function resolveLastmod(sourceFile, explicitDate) {
  if (explicitDate) {
    const normalized = String(explicitDate).slice(0, 10)
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized
  }
  return gitLastCommitDate(sourceFile)
}
