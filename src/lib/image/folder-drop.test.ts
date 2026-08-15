import { describe, expect, it } from 'vitest'
import {
  joinSourceRelativePath,
  sanitizeRelativePath,
  shouldSkipDirectoryName,
  sourceRelativeDir,
  uniqueZipPath,
  normalizeIncomingImages,
} from '@/lib/image/folder-drop'

describe('sanitizeRelativePath', () => {
  it('keeps nested POSIX paths and strips traversal', () => {
    expect(sanitizeRelativePath('products/a/hero.jpg', 'x.png')).toBe('products/a/hero.jpg')
    expect(sanitizeRelativePath('/products/../a/./hero.jpg', 'x.png')).toBe('products/a/hero.jpg')
    expect(sanitizeRelativePath('..\\secret\\hero.jpg', 'x.png')).toBe('secret/hero.jpg')
  })

  it('falls back to the file name when empty', () => {
    expect(sanitizeRelativePath('', 'hero.jpg')).toBe('hero.jpg')
    expect(sanitizeRelativePath(undefined, 'hero.jpg')).toBe('hero.jpg')
  })
})

describe('source tree zip paths', () => {
  it('prefixes the source directory onto output names', () => {
    expect(joinSourceRelativePath('products/a/hero.jpg', 'hero-melted.webp')).toBe(
      'products/a/hero-melted.webp',
    )
    expect(joinSourceRelativePath('products/a/hero.jpg', 'webp/hero-melted.webp')).toBe(
      'products/a/webp/hero-melted.webp',
    )
    expect(joinSourceRelativePath('hero.jpg', 'hero-melted.webp')).toBe('hero-melted.webp')
  })

  it('exposes the directory for queue chrome', () => {
    expect(sourceRelativeDir('products/a/hero.jpg')).toBe('products/a')
    expect(sourceRelativeDir('hero.jpg')).toBe('')
  })

  it('dedupes colliding zip entries inside a folder', () => {
    const used = new Set<string>()
    expect(uniqueZipPath('products/a/hero.webp', used)).toBe('products/a/hero.webp')
    expect(uniqueZipPath('products/a/hero.webp', used)).toBe('products/a/hero-2.webp')
  })
})

describe('shouldSkipDirectoryName', () => {
  it('skips VCS and junk folders', () => {
    expect(shouldSkipDirectoryName('.git')).toBe(true)
    expect(shouldSkipDirectoryName('__MACOSX')).toBe(true)
    expect(shouldSkipDirectoryName('products')).toBe(false)
  })
})

describe('normalizeIncomingImages', () => {
  it('keeps webkitRelativePath from a FileList-style pick', () => {
    const file = new File(['x'], 'hero.jpg', { type: 'image/jpeg' })
    Object.defineProperty(file, 'webkitRelativePath', {
      value: 'photos/vacation/hero.jpg',
    })
    const [incoming] = normalizeIncomingImages([file])
    expect(incoming?.relativePath).toBe('photos/vacation/hero.jpg')
  })

  it('drops non-images', () => {
    const img = new File(['x'], 'hero.jpg', { type: 'image/jpeg' })
    const txt = new File(['x'], 'notes.txt', { type: 'text/plain' })
    expect(normalizeIncomingImages([img, txt])).toHaveLength(1)
  })
})
