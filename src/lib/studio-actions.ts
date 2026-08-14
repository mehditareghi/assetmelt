import { toast } from 'sonner'
import { trackExportCompleted } from '@/lib/analytics'
import { downloadProcessedFiles, fileHasDownloadableResult } from '@/lib/download-results'
import { formatShortcutLabel } from '@/lib/studio-shortcuts'
import { useStudioStore } from '@/stores/studio-store'

export async function exportStudioResults(): Promise<boolean> {
  const { files, activePresetId, pipeline, isCropEditing, isProcessing } = useStudioStore.getState()
  if (isCropEditing || isProcessing) return false

  const done = files.filter(fileHasDownloadableResult)
  if (done.length === 0) {
    toast.error('Process images first')
    return false
  }

  try {
    const { kind, count } = await downloadProcessedFiles(done, activePresetId)
    trackExportCompleted({
      file_count: count,
      export_type: kind,
      preset_id: activePresetId,
      output_format: pipeline.encode.format,
    })
    if (kind === 'zip') {
      toast.success(
        done.length === 1
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
  }
}

export function runStudioProcess(): boolean {
  const { files, isCropEditing, isProcessing, processAll } = useStudioStore.getState()
  if (isCropEditing || isProcessing) return false
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

export function studioQueueStatus(files: { status: string }[]): string | null {
  if (files.length === 0) return null
  const done = files.filter((f) => f.status === 'done').length
  const processing = files.filter((f) => f.status === 'processing').length
  const pending = files.filter(
    (f) => f.status === 'pending' || f.status === 'error',
  ).length
  if (processing > 0) {
    const index = done + 1
    return `Processing ${Math.min(index, files.length)} of ${files.length}…`
  }
  if (pending > 0 && done > 0) {
    return `Settings changed — re-process to update`
  }
  if (pending > 0) {
    return `${files.length} file${files.length === 1 ? '' : 's'} · waiting`
  }
  return `${files.length} file${files.length === 1 ? '' : 's'} · ${done} ready`
}
