import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))

const RELEASABLE_TYPES = new Set(['feat', 'feature', 'fix', 'perf'])

function getCommitsSinceLastTag() {
  let range = 'HEAD'
  try {
    const tag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim()
    range = `${tag}..HEAD`
  } catch {
    // first release — no tags yet
  }

  const log = execSync(`git log ${range} --pretty=format:%s%n%b%x00`, {
    encoding: 'utf8',
  })

  return log
    .split('\0')
    .filter((entry) => entry.trim().length > 0)
    .map((entry) => {
      const lines = entry.trim().split('\n')
      const subject = lines[0] ?? ''
      const body = lines.slice(1).join('\n')
      const typeMatch = subject.match(/^(\w+)(?:\([^)]+\))?!?:/)
      const type = typeMatch?.[1] ?? ''
      const breaking =
        /!\:/.test(subject) ||
        /BREAKING CHANGE:/i.test(body) ||
        /BREAKING-CHANGE:/i.test(body)

      return { type, breaking }
    })
}

/** Conventional bump with preMajor: false (feat → minor even on 0.x). */
function getReleaseType(commits) {
  let level = 2
  let hasReleasable = false

  for (const { type, breaking } of commits) {
    if (breaking) {
      level = 0
      hasReleasable = true
      continue
    }

    if (type === 'feat' || type === 'feature') {
      level = Math.min(level, 1)
      hasReleasable = true
    } else if (RELEASABLE_TYPES.has(type)) {
      hasReleasable = true
    }
  }

  if (!hasReleasable) return null
  return ['major', 'minor', 'patch'][level]
}

function incVersion(version, releaseType) {
  const [major, minor, patch] = version.split('.').map(Number)

  switch (releaseType) {
    case 'major':
      return `${major + 1}.0.0`
    case 'minor':
      return `${major}.${minor + 1}.0`
    case 'patch':
      return `${major}.${minor}.${patch + 1}`
    default:
      throw new Error(`Unknown release type: ${releaseType}`)
  }
}

const commits = getCommitsSinceLastTag()
const releaseType = getReleaseType(commits)

if (!releaseType) {
  console.error('No commits found that require a release.')
  process.exit(1)
}

const nextVersion = incVersion(pkg.version, releaseType)
console.log(`Releasing ${pkg.version} → ${nextVersion} (${releaseType})`)

execSync(`commit-and-tag-version --release-as ${nextVersion}`, { stdio: 'inherit' })
