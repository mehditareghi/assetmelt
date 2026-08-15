import { isImageFile } from '@/lib/image/format-detection'

export type IncomingImage = {
  file: File
  /** POSIX path relative to the dropped root, e.g. `products/a/hero.jpg`. */
  relativePath: string
}

const SKIP_DIR_NAMES = new Set([
  '.git',
  '.svn',
  '.hg',
  'node_modules',
  '__macosx',
  '.ds_store',
])

const MAX_WALK_DEPTH = 24

export function shouldSkipDirectoryName(name: string): boolean {
  return SKIP_DIR_NAMES.has(name.trim().toLowerCase())
}

/** Strip `..`, empty segments, and leading slashes. Always ends with a filename. */
export function sanitizeRelativePath(path: string | undefined, fallbackName: string): string {
  const fallback = fallbackName.replace(/^.*[/\\]/, '').trim() || 'image'
  const parts = (path ?? '')
    .replace(/\\/g, '/')
    .split('/')
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && part !== '.' && part !== '..')
  if (parts.length === 0) return fallback
  const last = parts[parts.length - 1]
  if (!last) return fallback
  return parts.join('/')
}

export function sourceRelativeDir(relativePath?: string): string {
  if (!relativePath) return ''
  const normalized = sanitizeRelativePath(relativePath, '')
  const slash = normalized.lastIndexOf('/')
  return slash >= 0 ? normalized.slice(0, slash) : ''
}

/** Prefix a ZIP entry with the source folder tree when the file came from a drop. */
export function joinSourceRelativePath(relativePath: string | undefined, entryPath: string): string {
  const dir = sourceRelativeDir(relativePath)
  const clean = entryPath.replace(/\\/g, '/').replace(/^\/+/, '')
  if (!clean) return dir
  return dir ? `${dir}/${clean}` : clean
}

export function uniqueZipPath(path: string, used: Set<string>): string {
  if (!used.has(path)) {
    used.add(path)
    return path
  }
  const slash = path.lastIndexOf('/')
  const dir = slash >= 0 ? path.slice(0, slash + 1) : ''
  const name = slash >= 0 ? path.slice(slash + 1) : path
  const dot = name.lastIndexOf('.')
  const stem = dot >= 0 ? name.slice(0, dot) : name
  const ext = dot >= 0 ? name.slice(dot) : ''
  let n = 2
  while (used.has(`${dir}${stem}-${n}${ext}`)) n += 1
  const next = `${dir}${stem}-${n}${ext}`
  used.add(next)
  return next
}

function isIncomingImage(value: unknown): value is IncomingImage {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'file' in value &&
      (value as IncomingImage).file instanceof File,
  )
}

export function normalizeIncomingImages(
  files: FileList | File[] | IncomingImage[],
): IncomingImage[] {
  const arr = Array.from(files as ArrayLike<File | IncomingImage>)
  if (arr.length > 0 && isIncomingImage(arr[0])) {
    return (arr as IncomingImage[])
      .filter((item) => isImageFile(item.file))
      .map((item) => ({
        file: item.file,
        relativePath: sanitizeRelativePath(
          item.relativePath || item.file.webkitRelativePath,
          item.file.name,
        ),
      }))
  }
  return (arr as File[]).filter(isImageFile).map((file) => ({
    file,
    relativePath: sanitizeRelativePath(file.webkitRelativePath, file.name),
  }))
}

function getFileFromEntry(entry: FileSystemFileEntry): Promise<File> {
  return new Promise((resolve, reject) => {
    entry.file(resolve, reject)
  })
}

function readAllDirectoryEntries(dir: FileSystemDirectoryEntry): Promise<FileSystemEntry[]> {
  const reader = dir.createReader()
  return new Promise((resolve, reject) => {
    const all: FileSystemEntry[] = []
    const readBatch = () => {
      reader.readEntries((batch) => {
        if (batch.length === 0) {
          resolve(all)
          return
        }
        all.push(...batch)
        readBatch()
      }, reject)
    }
    readBatch()
  })
}

async function walkEntry(
  entry: FileSystemEntry,
  out: IncomingImage[],
  skipped: { count: number },
  depth: number,
): Promise<void> {
  if (depth > MAX_WALK_DEPTH) return

  if (entry.isFile) {
    const file = await getFileFromEntry(entry as FileSystemFileEntry)
    if (!isImageFile(file)) {
      skipped.count += 1
      return
    }
    out.push({
      file,
      relativePath: sanitizeRelativePath(
        file.webkitRelativePath || entry.fullPath,
        file.name,
      ),
    })
    return
  }

  if (entry.isDirectory) {
    if (shouldSkipDirectoryName(entry.name)) return
    const children = await readAllDirectoryEntries(entry as FileSystemDirectoryEntry)
    for (const child of children) {
      await walkEntry(child, out, skipped, depth + 1)
    }
  }
}

export async function collectDroppedImages(dataTransfer: DataTransfer): Promise<{
  images: IncomingImage[]
  skipped: number
}> {
  const items = dataTransfer.items
  if (items && items.length > 0) {
    const entries: FileSystemEntry[] = []
    for (let i = 0; i < items.length; i++) {
      const entry = items[i]?.webkitGetAsEntry?.() ?? null
      if (entry) entries.push(entry)
    }
    if (entries.length > 0) {
      const images: IncomingImage[] = []
      const skipped = { count: 0 }
      for (const entry of entries) {
        await walkEntry(entry, images, skipped, 0)
      }
      return { images, skipped: skipped.count }
    }
  }

  const images = normalizeIncomingImages(dataTransfer.files)
  const total = dataTransfer.files?.length ?? 0
  return { images, skipped: Math.max(0, total - images.length) }
}
