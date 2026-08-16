import JSZip from 'jszip'
import type { ProcessableFile } from '@/lib/image/types'
import { joinSourceRelativePath, uniqueZipPath } from '@/lib/image/folder-drop'
import {
  isMultiFormatVariantId,
  MULTI_FORMAT_KIT_ID,
  workflowZipEntryPath,
} from '@/lib/multi-format'
import { getActivePlatformWorkflow } from '@/lib/platform-presets'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadNamedBlob(blob: Blob, filename: string) {
  downloadBlob(blob, filename)
}

function baseNameFromFile(file: ProcessableFile): string {
  return file.name.replace(/\.[^.]+$/, '') || 'images'
}

function kitZipSuffix(activePresetId: string, file: ProcessableFile): string {
  const platform = getActivePlatformWorkflow(activePresetId)
  if (platform) return platform.id
  const multi = file.workflowResults?.some((v) => isMultiFormatVariantId(v.variantId))
  return multi ? MULTI_FORMAT_KIT_ID : 'kit'
}

function addWorkflowVariantsToZip(
  zip: JSZip,
  file: ProcessableFile,
  usedPaths: Set<string>,
): number {
  const variants = file.workflowResults
  if (!variants?.length) return 0

  const sourceBase = file.name.replace(/\.[^.]+$/, '') || 'image'
  let count = 0
  for (const variant of variants) {
    const raw = workflowZipEntryPath(variant, { sourceBase })
    const path = uniqueZipPath(joinSourceRelativePath(file.relativePath, raw), usedPaths)
    zip.file(path, variant.blob)
    count += 1
  }
  return count
}

export type DownloadProcessedOptions = {
  /** When set, always ZIP (even a single file) and use this filename. */
  zipName?: string
}

export type PackedBatchZip = {
  name: string
  blob: Blob
  count: number
  fileIds: string[]
}

export async function buildProcessedZip(
  done: ProcessableFile[],
  _activePresetId: string,
): Promise<{ blob: Blob; count: number }> {
  if (done.length === 0) {
    throw new Error('No processed files to export')
  }

  const zip = new JSZip()
  const usedPaths = new Set<string>()
  let fileCount = 0
  for (const file of done) {
    if (file.workflowResults && file.workflowResults.length > 0) {
      fileCount += addWorkflowVariantsToZip(zip, file, usedPaths)
    } else if (file.resultBlob) {
      const raw = file.resultName ?? file.name
      const path = uniqueZipPath(joinSourceRelativePath(file.relativePath, raw), usedPaths)
      zip.file(path, file.resultBlob)
      fileCount += 1
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  return { blob, count: fileCount }
}

/** Download processed files — single blobs or workflow variant zips. ZIP member order follows `done` (queue order). */
export async function downloadProcessedFiles(
  done: ProcessableFile[],
  activePresetId: string,
  options?: DownloadProcessedOptions,
): Promise<{ kind: 'single' | 'zip'; count: number }> {
  if (done.length === 0) {
    throw new Error('No processed files to export')
  }

  const forceZipName = options?.zipName

  if (done.length === 1 && !forceZipName) {
    const file = done[0]
    if (file.workflowResults && file.workflowResults.length > 0) {
      const zip = new JSZip()
      const usedPaths = new Set<string>()
      const count = addWorkflowVariantsToZip(zip, file, usedPaths)
      const blob = await zip.generateAsync({ type: 'blob' })
      downloadBlob(blob, `${baseNameFromFile(file)}-${kitZipSuffix(activePresetId, file)}.zip`)
      return { kind: 'zip', count }
    }
    if (file.resultBlob) {
      downloadBlob(file.resultBlob, file.resultName ?? file.name)
      return { kind: 'single', count: 1 }
    }
    throw new Error('No processed files to export')
  }

  const { blob, count } = await buildProcessedZip(done, activePresetId)
  downloadBlob(blob, forceZipName ?? 'assetmelt-batch.zip')
  return { kind: 'zip', count }
}

export function fileHasDownloadableResult(file: ProcessableFile): boolean {
  return Boolean(
    file.status === 'done' &&
      (file.resultBlob || (file.workflowResults && file.workflowResults.length > 0)),
  )
}

export function leftoverDownloadableFiles(
  files: ProcessableFile[],
  packedZips: PackedBatchZip[],
): ProcessableFile[] {
  const packedIds = new Set(packedZips.flatMap((part) => part.fileIds))
  return files.filter((file) => fileHasDownloadableResult(file) && !packedIds.has(file.id))
}

export function exportableResultCount(
  files: ProcessableFile[],
  packedZips: PackedBatchZip[] = [],
): number {
  const packedIds = new Set(packedZips.flatMap((part) => part.fileIds))
  let n = packedIds.size
  for (const file of files) {
    if (packedIds.has(file.id)) continue
    if (fileHasDownloadableResult(file)) n += 1
  }
  return n
}
