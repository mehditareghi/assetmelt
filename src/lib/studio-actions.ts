import { toast } from 'sonner'
import { trackExportCompleted } from '@/lib/analytics'
import { chunkZipFilename, resolveBatchChunkSize, splitIntoChunks } from '@/lib/batch-memory'
import {
  downloadNamedBlob,
  downloadProcessedFiles,
  leftoverDownloadableFiles,
} from '@/lib/download-results'
import { encodeStudioRecipe } from '@/lib/studio-recipe'
import { formatShortcutLabel } from '@/lib/studio-shortcuts'
import { useStudioStore } from '@/stores/studio-store'

const DOWNLOAD_GAP_MS = import.meta.env.MODE === 'test' ? 0 : 150

function yieldToPaint(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, DOWNLOAD_GAP_MS)
  })
}

export async function exportStudioResults(): Promise<boolean> {
  const state = useStudioStore.getState()
  if (state.isCropEditing || state.isProcessing || state.isExporting) return false

  const packed = state.chunkZipParts
  const leftover = leftoverDownloadableFiles(state.files, packed)
  const chunkSize = resolveBatchChunkSize()
  const chunkLeftover =
    state.chunkZipEnabled && leftover.length > chunkSize
      ? splitIntoChunks(leftover, chunkSize)
      : leftover.length > 0
        ? [leftover]
        : []
  const totalParts = packed.length + chunkLeftover.length

  if (totalParts === 0) {
    toast.error('Process images first')
    return false
  }

  const { activePresetId, pipeline, chunkZipEnabled } = state
  const useNumberedParts = packed.length > 0 || (chunkZipEnabled && leftover.length > chunkSize)

  state.beginExport(totalParts)

  try {
    let kind: 'single' | 'zip' = 'zip'
    let count = 0
    let step = 0

    for (const part of packed) {
      step += 1
      useStudioStore.getState().setExportProgress(step)
      downloadNamedBlob(part.blob, part.name)
      count += part.count
      await yieldToPaint()
    }

    let nextPart = packed.length
    for (const wave of chunkLeftover) {
      step += 1
      useStudioStore.getState().setExportProgress(step)
      if (useNumberedParts) {
        nextPart += 1
        const result = await downloadProcessedFiles(wave, activePresetId, {
          zipName: chunkZipFilename(nextPart),
        })
        kind = 'zip'
        count += result.count
      } else {
        const result = await downloadProcessedFiles(wave, activePresetId)
        kind = result.kind
        count += result.count
      }
      await yieldToPaint()
    }

    trackExportCompleted({
      file_count: count,
      export_type: kind,
      preset_id: activePresetId,
      output_format: pipeline.encode.format,
    })

    useStudioStore.getState().clearChunkZipParts()
    if (chunkZipEnabled) {
      useStudioStore.getState().releaseResultOutputsExceptActive(
        leftover.map((file) => file.id),
      )
    }

    if (totalParts > 1) {
      toast.success(`Downloaded ${totalParts} ZIPs (${count} files)`)
    } else if (kind === 'zip') {
      toast.success(
        leftover.length === 1 && packed.length === 0
          ? `Downloaded kit (${count} files)`
          : `Downloaded ${count} files as zip`,
      )
    } else {
      toast.success('Downloaded')
    }
    return true
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Download failed'
    toast.error(message)
    return false
  } finally {
    useStudioStore.getState().endExport()
  }
}

export function runStudioProcess(): boolean {
  const { files, isCropEditing, isProcessing, isPaused, processAll, resumeProcessing } =
    useStudioStore.getState()
  if (isCropEditing) return false
  if (isPaused) {
    resumeProcessing()
    return true
  }
  if (isProcessing || useStudioStore.getState().isExporting) return false
  if (files.length === 0) {
    toast.error('Drop images first')
    return false
  }
  const pending = files.filter((file) => file.status === 'pending' || file.status === 'error')
  if (pending.length === 0) {
    toast.message('Already processed', {
      description: `Download with ${formatShortcutLabel('download')}`,
    })
    return false
  }
  void processAll()
  return true
}

export function studioQueueStatus(
  files: { status: string }[],
  options?: { isPaused?: boolean },
): string | null {
  if (files.length === 0) return null
  const done = files.filter((f) => f.status === 'done').length
  const processing = files.filter((f) => f.status === 'processing').length
  const pending = files.filter(
    (f) => f.status === 'pending' || f.status === 'error',
  ).length
  if (options?.isPaused) {
    if (processing > 0) {
      return `Pausing · ${processing} finishing · ${done} ready`
    }
    return `Paused · ${done} ready · ${pending} waiting`
  }
  if (processing > 0) {
    return `Encoding ${processing} · ${done} ready · ${pending} waiting`
  }
  if (pending > 0 && done > 0) {
    return `Settings changed — re-process to update`
  }
  if (pending > 0) {
    return `${files.length} file${files.length === 1 ? '' : 's'} · waiting`
  }
  return `${files.length} file${files.length === 1 ? '' : 's'} · ${done} ready`
}

export async function copyStudioRecipeLink(): Promise<boolean> {
  const encoded = encodeStudioRecipe(useStudioStore.getState().pipeline)
  const url = new URL(window.location.href)
  if (encoded) url.searchParams.set('recipe', encoded)
  else url.searchParams.delete('recipe')
  try {
    await navigator.clipboard.writeText(url.toString())
    toast.success('Recipe link copied', {
      description: 'Settings only — photos are not in the URL.',
    })
    return true
  } catch {
    toast.error('Could not copy link')
    return false
  }
}
