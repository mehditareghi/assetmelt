import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { resolveLastmod } from './lib/git-lastmod.mjs'

test('resolveLastmod prefers explicit frontmatter date', () => {
  const result = resolveLastmod('/does/not/matter.mdx', '2026-03-15T10:00:00Z')
  assert.equal(result, '2026-03-15')
})

test('compile-blog outputs repo artifacts', () => {
  const result = spawnSync(process.execPath, ['scripts/compile-blog.mjs'], {
    encoding: 'utf8',
  })
  assert.equal(result.status, 0, result.stderr || result.stdout)

  const indexPath = 'src/generated/blog-index.ts'
  const pathsPath = 'src/generated/blog-prerender-paths.json'
  assert.equal(existsSync(indexPath), true)
  assert.equal(existsSync(pathsPath), true)

  const paths = JSON.parse(readFileSync(pathsPath, 'utf8'))
  assert.ok(Array.isArray(paths))
  assert.ok(paths.length >= 4)
  assert.ok(paths.every((path) => path.startsWith('/blog/')))

  const index = readFileSync(indexPath, 'utf8')
  assert.match(index, /BLOG_POST_CONTENT/)
  assert.match(index, /export function getBlogPostContent/)
  assert.match(index, /^import Post/m)
})

test('generate-sitemap writes blog urls', () => {
  const result = spawnSync(process.execPath, ['scripts/generate-sitemap.mjs'], {
    encoding: 'utf8',
  })
  assert.equal(result.status, 0, result.stderr || result.stdout)

  const sitemap = readFileSync('public/sitemap.xml', 'utf8')
  assert.match(sitemap, /\/blog<\/loc>/)
  assert.match(sitemap, /compress-images-in-browser/)
  assert.match(sitemap, /\/privacy<\/loc>/)
  assert.match(sitemap, /\/about<\/loc>/)
  assert.match(sitemap, /\/author<\/loc>/)
  assert.match(sitemap, /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/)

  const rss = readFileSync('public/rss.xml', 'utf8')
  assert.match(rss, /<rss version="2.0"/)
  assert.match(rss, /compress-images-in-browser/)
})
