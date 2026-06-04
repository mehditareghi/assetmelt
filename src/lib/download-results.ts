import JSZip from 'jszip'
import type { ProcessableFile } from '@/lib/image/types'
import { getActivePlatformWorkflow } from '@/lib/platform-presets'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function baseNameFromFile(file: ProcessableFile): string {
  return (file.resultName ?? file.name).replace(/\.[^.]+$/, '')
}

/** Download processed files — single blobs or workflow variant zips. */
export async function downloadProcessedFiles(
  done: ProcessableFile[],
  activePresetId: string,
): Promise<{ kind: 'single' | 'zip'; count: number }> {
  if (done.length === 0) {
    throw new Error('No processed files to export')
  }

  const workflow = getActivePlatformWorkflow(activePresetId)

  if (done.length === 1) {
    const file = done[0]
    if (file.workflowResults && file.workflowResults.length > 0) {
      const zip = new JSZip()
      for (const variant of file.workflowResults) {
        zip.file(variant.outputName, variant.blob)
      }
      const blob = await zip.generateAsync({ type: 'blob' })
      const kitName = workflow?.id ?? 'kit'
      downloadBlob(blob, `${baseNameFromFile(file)}-${kitName}.zip`)
      return { kind: 'zip', count: file.workflowResults.length }
    }
    if (file.resultBlob) {
      downloadBlob(file.resultBlob, file.resultName ?? file.name)
      return { kind: 'single', count: 1 }
    }
    throw new Error('No processed files to export')
  }

  const zip = new JSZip()
  let fileCount = 0
  for (const file of done) {
    if (file.workflowResults && file.workflowResults.length > 0) {
      for (const variant of file.workflowResults) {
        zip.file(variant.outputName, variant.blob)
        fileCount += 1
      }
    } else if (file.resultBlob) {
      zip.file(file.resultName ?? file.name, file.resultBlob)
      fileCount += 1
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  downloadBlob(blob, 'assetmelt-batch.zip')
  return { kind: 'zip', count: fileCount }
}

export function fileHasDownloadableResult(file: ProcessableFile): boolean {
  return Boolean(
    file.status === 'done' &&
      (file.resultBlob || (file.workflowResults && file.workflowResults.length > 0)),
  )
}
