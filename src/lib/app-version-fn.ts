import { createServerFn } from '@tanstack/react-start'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const getAppVersion = createServerFn({ method: 'GET' }).handler(() => {
  try {
    const root = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '../..',
    )
    const raw = readFileSync(path.join(root, 'public/version.json'), 'utf8')
    const data = JSON.parse(raw) as { version?: string }
    return data.version ?? 'dev'
  } catch {
    return 'dev'
  }
})
