import {
  Download,
  MoreHorizontal,
  Play,
  Plus,
  Redo2,
  Trash2,
  Undo2,
  Upload,
  FileJson,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { OfflinePrepRestoreLink } from '@/components/pwa/offline-prep-restore-link'
import { useOptionalOfflinePrepContext } from '@/lib/pwa/offline-prep-context'
import { useStudioStore } from '@/stores/studio-store'
import { downloadProcessedFiles, fileHasDownloadableResult } from '@/lib/download-results'
import { pickImageFiles } from '@/lib/image/pick-image-files'
import { PresetPicker } from '@/components/studio/preset-picker'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { pipelineSchema } from '@/lib/schemas/pipeline-schema'
import { trackExportCompleted } from '@/lib/analytics'

export function StudioToolbar() {
  const offlinePrep = useOptionalOfflinePrepContext()
  const hideOfflineChrome = offlinePrep?.offlineStudioChrome ?? false
  const files = useStudioStore((s) => s.files)
  const activePresetId = useStudioStore((s) => s.activePresetId)
  const isProcessing = useStudioStore((s) => s.isProcessing)
  const pipeline = useStudioStore((s) => s.pipeline)
  const processAll = useStudioStore((s) => s.processAll)
  const clearFiles = useStudioStore((s) => s.clearFiles)
  const addFiles = useStudioStore((s) => s.addFiles)
  const importPipelineConfig = useStudioStore((s) => s.importPipelineConfig)
  const undo = useStudioStore((s) => s.undo)
  const redo = useStudioStore((s) => s.redo)
  const isCropEditing = useStudioStore((s) => s.isCropEditing)
  const canUndo = useStudioStore((s) => s.canUndo)
  const canRedo = useStudioStore((s) => s.canRedo)

  const doneCount = files.filter(fileHasDownloadableResult).length
  const pendingCount = files.filter(
    (f) => f.status === 'pending' || f.status === 'error',
  ).length
  const processingCount = files.filter((f) => f.status === 'processing').length
  const hasFiles = files.length > 0
  const needsReprocess = pendingCount > 0
  const canProcess = hasFiles && needsReprocess && !isCropEditing && !isProcessing
  const canDownload = doneCount > 0 && !isCropEditing && !isProcessing

  const handleAddFiles = async () => {
    if (isCropEditing || isProcessing) return
    const picked = await pickImageFiles()
    if (picked.length === 0) return
    await addFiles(picked)
  }

  const handleExportAll = async () => {
    const done = files.filter(fileHasDownloadableResult)
    if (done.length === 0) {
      toast.error('No processed files to export')
      return
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Download failed'
      toast.error(message)
    }
  }

  const handleExportConfig = () => {
    const json = JSON.stringify(pipeline, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'assetmelt-pipeline.json'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Pipeline config exported')
  }

  const handleImportConfig = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json,.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const parsed = pipelineSchema.parse(JSON.parse(text))
        importPipelineConfig(parsed)
        toast.success('Pipeline config imported')
      } catch {
        toast.error('Invalid pipeline config')
      }
    }
    input.click()
  }

  const primaryAction = (() => {
    if (isProcessing || processingCount > 0) {
      return (
        <Button size="sm" disabled className="gap-1.5">
          <Loader2 className="size-3.5 animate-spin" />
          Processing…
        </Button>
      )
    }
    if (needsReprocess) {
      return (
        <Button
          size="sm"
          onClick={() => void processAll()}
          disabled={!canProcess}
          className="gap-1.5"
        >
          <Play className="size-3.5" />
          Re-process ({pendingCount})
        </Button>
      )
    }
    if (canDownload) {
      return (
        <Button
          size="sm"
          onClick={() => void handleExportAll()}
          disabled={!canDownload}
          className="gap-1.5"
        >
          <Download className="size-3.5" />
          Download ({doneCount})
        </Button>
      )
    }
    return null
  })()

  const secondaryDownload =
    needsReprocess && canDownload ? (
      <Button
        variant="secondary"
        size="sm"
        onClick={() => void handleExportAll()}
        disabled={!canDownload}
        className="gap-1.5"
      >
        <Download className="size-3.5" />
        Download ({doneCount})
      </Button>
    ) : null

  return (
    <div className="flex w-full min-w-0 flex-col gap-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="min-w-0 flex-1">
            <PresetPicker disabled={isCropEditing} />
          </div>

          {!hideOfflineChrome ? <OfflinePrepRestoreLink variant="toolbar" /> : null}

          {hasFiles ? (
            <Button
              variant="outline"
              size="sm"
              className="hidden shrink-0 gap-1.5 lg:inline-flex"
              onClick={() => void handleAddFiles()}
              disabled={isCropEditing || isProcessing}
            >
              <Plus className="size-3.5" />
              Add files
            </Button>
          ) : null}
        </div>

        <div className="hidden shrink-0 flex-wrap items-center justify-end gap-2 lg:flex">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => undo()}
            disabled={!canUndo()}
            title="Undo (⌘Z)"
            aria-label="Undo"
          >
            <Undo2 className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => redo()}
            disabled={!canRedo()}
            title="Redo (⌘⇧Z)"
            aria-label="Redo"
          >
            <Redo2 className="size-3.5" />
          </Button>
          <PipelineOverflowMenu
            disabled={isCropEditing}
            onImport={handleImportConfig}
            onExport={handleExportConfig}
          />
          {hasFiles && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFiles}
              disabled={isCropEditing || isProcessing}
              className="gap-1.5"
              aria-label="Clear queue"
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
          {secondaryDownload}
          {hasFiles ? primaryAction : null}
        </div>
      </div>

      {/* Phone / tablet: Add files when queue has items (sticky bar owns primary CTAs) */}
      {hasFiles ? (
        <div className="flex items-center gap-2 lg:hidden">
          <Button
            variant="outline"
            size="sm"
            className="h-9 flex-1 gap-1.5"
            onClick={() => void handleAddFiles()}
            disabled={isCropEditing || isProcessing}
          >
            <Plus className="size-3.5" />
            Add files
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => undo()}
            disabled={!canUndo()}
            aria-label="Undo"
          >
            <Undo2 className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => redo()}
            disabled={!canRedo()}
            aria-label="Redo"
          >
            <Redo2 className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={clearFiles}
            disabled={isCropEditing || isProcessing}
            aria-label="Clear queue"
          >
            <Trash2 className="size-3.5" />
          </Button>
          <PipelineOverflowMenu
            disabled={isCropEditing}
            onImport={handleImportConfig}
            onExport={handleExportConfig}
          />
        </div>
      ) : (
        <div className="flex items-center justify-end gap-1 lg:hidden">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => undo()}
            disabled={!canUndo()}
            aria-label="Undo"
          >
            <Undo2 className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => redo()}
            disabled={!canRedo()}
            aria-label="Redo"
          >
            <Redo2 className="size-3.5" />
          </Button>
          <PipelineOverflowMenu
            disabled={isCropEditing}
            onImport={handleImportConfig}
            onExport={handleExportConfig}
          />
        </div>
      )}
    </div>
  )
}

function PipelineOverflowMenu({
  disabled,
  onImport,
  onExport,
}: {
  disabled: boolean
  onImport: () => void
  onExport: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon-sm"
          title="Pipeline options"
          aria-label="Pipeline options"
        >
          <MoreHorizontal className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onImport} disabled={disabled}>
          <Upload className="size-3.5" />
          Import pipeline
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExport} disabled={disabled}>
          <FileJson className="size-3.5" />
          Export pipeline
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Shared status copy for toolbar / preview chrome. */
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
