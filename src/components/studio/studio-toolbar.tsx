import {
  Download,
  MoreHorizontal,
  Play,
  Redo2,
  Settings,
  Trash2,
  Undo2,
  Upload,
  FileJson,
} from 'lucide-react'
import { toast } from 'sonner'
import { OfflinePrepRestoreLink } from '@/components/pwa/offline-prep-restore-link'
import { useStudioStore } from '@/stores/studio-store'
import { downloadProcessedFiles, fileHasDownloadableResult } from '@/lib/download-results'
import { PresetPicker } from '@/components/studio/preset-picker'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { pipelineSchema } from '@/lib/schemas/pipeline-schema'

export function StudioToolbar() {
  const files = useStudioStore((s) => s.files)
  const activePresetId = useStudioStore((s) => s.activePresetId)
  const isAdvancedMode = useStudioStore((s) => s.isAdvancedMode)
  const isProcessing = useStudioStore((s) => s.isProcessing)
  const pipeline = useStudioStore((s) => s.pipeline)
  const setAdvancedMode = useStudioStore((s) => s.setAdvancedMode)
  const processAll = useStudioStore((s) => s.processAll)
  const clearFiles = useStudioStore((s) => s.clearFiles)
  const importPipelineConfig = useStudioStore((s) => s.importPipelineConfig)
  const undo = useStudioStore((s) => s.undo)
  const redo = useStudioStore((s) => s.redo)
  const isCropEditing = useStudioStore((s) => s.isCropEditing)
  const canUndo = useStudioStore((s) => s.canUndo)
  const canRedo = useStudioStore((s) => s.canRedo)

  const doneCount = files.filter(fileHasDownloadableResult).length
  const hasFiles = files.length > 0
  const canProcess = hasFiles && !isCropEditing && !isProcessing
  const canDownload = doneCount > 0 && !isCropEditing && !isProcessing

  const handleExportAll = async () => {
    const done = files.filter(fileHasDownloadableResult)
    if (done.length === 0) {
      toast.error('No processed files to export')
      return
    }

    try {
      const { kind, count } = await downloadProcessedFiles(done, activePresetId)
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

  return (
    <div className="flex w-full min-w-0 flex-col gap-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="min-w-0 flex-1">
            <PresetPicker disabled={isCropEditing} />
          </div>

          <OfflinePrepRestoreLink variant="toolbar" />

          <div className="flex shrink-0 items-center gap-2">
            <Switch
              id="advanced"
              checked={isAdvancedMode}
              onCheckedChange={setAdvancedMode}
              disabled={isCropEditing}
            />
            <Label
              htmlFor="advanced"
              className="hidden items-center gap-1.5 text-sm lg:flex"
            >
              <Settings className="size-3.5" />
              Advanced
            </Label>
          </div>
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleImportConfig}
            disabled={isCropEditing}
            className="gap-1.5"
          >
            <Upload className="size-3.5" />
            Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportConfig}
            disabled={isCropEditing}
            className="gap-1.5"
          >
            <FileJson className="size-3.5" />
            Export JSON
          </Button>
          {hasFiles && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFiles}
              disabled={isCropEditing || isProcessing}
              className="gap-1.5"
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => processAll()}
            disabled={!canProcess}
            className="gap-1.5"
          >
            <Play className="size-3.5" />
            Process{hasFiles ? ` (${files.length})` : ''}
          </Button>
          {doneCount > 0 && (
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
          )}
        </div>
      </div>

      {/* Phone / tablet / PWA: stacked primary actions — nothing clipped */}
      {hasFiles && (
        <div className="flex flex-col gap-2 lg:hidden">
          <Button
            size="sm"
            className="h-10 w-full min-w-0 justify-center gap-2"
            onClick={() => processAll()}
            disabled={!canProcess}
          >
            <Play className="size-4 shrink-0" />
            <span className="truncate">
              Process{files.length > 0 ? ` · ${files.length} file${files.length === 1 ? '' : 's'}` : ''}
            </span>
          </Button>
          {doneCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              className="h-10 w-full min-w-0 justify-center gap-2"
              onClick={() => void handleExportAll()}
              disabled={!canDownload}
            >
              <Download className="size-4 shrink-0" />
              <span className="truncate">
                Download{doneCount > 0 ? ` · ${doneCount} ready` : ''}
              </span>
            </Button>
          )}
        </div>
      )}

      {/* Phone / tablet / PWA: utility strip */}
      <div className="flex items-center gap-1 lg:hidden">
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
        {hasFiles && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={clearFiles}
            disabled={isCropEditing || isProcessing}
            aria-label="Clear queue"
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon-sm" aria-label="More actions">
                <MoreHorizontal className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleImportConfig} disabled={isCropEditing}>
                <Upload className="size-3.5" />
                Import pipeline
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportConfig} disabled={isCropEditing}>
                <FileJson className="size-3.5" />
                Export pipeline JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
