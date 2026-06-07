import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = dirname(fileURLToPath(import.meta.url))

for (const script of ['generate-blog-heroes.mjs', 'compile-blog.mjs', 'generate-sitemap.mjs']) {
  const result = spawnSync(process.execPath, [join(root, script)], {
    stdio: 'inherit',
  })
  if (result.status !== 0) process.exit(result.status ?? 1)
}
