import { writeFileSync } from 'node:fs'
import { getVersionFromGitTag } from './lib/app-version.mjs'

const version = getVersionFromGitTag() ?? 'dev'
const payload = { version, builtAt: new Date().toISOString() }

writeFileSync('public/version.json', `${JSON.stringify(payload)}\n`)
console.log(`Wrote public/version.json → ${version}`)
