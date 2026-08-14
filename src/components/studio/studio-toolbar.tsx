import {
  Download,
  FileJson,
  Keyboard,
  Link2,
  Loader2,
  MoreHorizontal,
  Play,
  Plus,
  Redo2,
  Trash2,
  Undo2,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import { OfflinePrepRestoreLink } from '@/components/pwa/offline-prep-restore-link'
import { useOptionalOfflinePrepContext } from '@/lib/pwa/offline-prep-context'
import { useStudioStore } from '@/stores/studio-store'
import { fileHasDownloadableResult } from '@/lib/download-results'
import { pickImageFiles } from '@/lib/image/pick-image-files'
import { PresetPicker } from '@/components/studio/preset-picker'
import { ShortcutHint } from '@/components/studio/shortcut-cheatsheet'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { pipelineSchema } from '@/lib/schemas/pipeline-schema'
import { copyStudioRecipeLink, exportStudioResults } from '@/lib/studio-actions'
import { useStudioChromeStore } from '@/stores/studio-chrome-store'

export function StudioToolbar() {
  const offlinePrep = useOptionalOfflinePrepContext()
  const hideOfflineChrome = offlinePrep?.offlineStudioChrome ?? false
  const files = useStudioStore((s) => s.files)
  const pipeline = useStudioStore((s) => s.pipeline)
  const isProcessing = useStudioStore((s) => s.isProcessing)
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

  const handleExportAll = () => {
    void exportStudioResults()
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
    toast.success('Pipeline JSON exported')
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
        toast.success('Pipeline JSON imported')
      } catch {
        toast.error('Invalid pipeline JSON')
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
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              onClick={() => void processAll()}
              disabled={!canProcess}
              className="gap-1.5"
              aria-keyshortcuts="Meta+Enter Control+Enter"
            >
              <Play className="size-3.5" />
              Re-process ({pendingCount})
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <ShortcutHint shortcutId="process" label="Process queue" />
          </TooltipContent>
        </Tooltip>
      )
    }
    if (canDownload) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              onClick={() => void handleExportAll()}
              disabled={!canDownload}
              className="gap-1.5"
              aria-keyshortcuts="Meta+S Control+S"
            >
              <Download className="size-3.5" />
              Download ({doneCount})
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <ShortcutHint shortcutId="download" label="Download" />
          </TooltipContent>
        </Tooltip>
      )
    }
    return null
  })()

  const secondaryDownload =
    needsReprocess && canDownload ? (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void handleExportAll()}
            disabled={!canDownload}
            className="gap-1.5"
            aria-keyshortcuts="Meta+S Control+S"
          >
            <Download className="size-3.5" />
            Download ({doneCount})
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <ShortcutHint shortcutId="download" label="Download" />
        </TooltipContent>
      </Tooltip>
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
          <HistoryButtons canUndo={canUndo()} canRedo={canRedo()} onUndo={undo} onRedo={redo} />
          <ShortcutsButton />
          <CopyRecipeButton />
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
          <HistoryButtons canUndo={canUndo()} canRedo={canRedo()} onUndo={undo} onRedo={redo} />
          <ShortcutsButton />
          <CopyRecipeButton />
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
          <HistoryButtons canUndo={canUndo()} canRedo={canRedo()} onUndo={undo} onRedo={redo} />
          <ShortcutsButton />
          <CopyRecipeButton />
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

function HistoryButtons({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: {
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
}) {
  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="Undo"
            aria-keyshortcuts="Meta+Z Control+Z"
          >
            <Undo2 className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <ShortcutHint shortcutId="undo" label="Undo" />
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={onRedo}
            disabled={!canRedo}
            aria-label="Redo"
            aria-keyshortcuts="Meta+Shift+Z Control+Shift+Z Control+Y"
          >
            <Redo2 className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <ShortcutHint shortcutId="redo" label="Redo" />
        </TooltipContent>
      </Tooltip>
    </>
  )
}

function ShortcutsButton() {
  const open = useStudioChromeStore((s) => s.shortcutsOpen)
  const toggle = useStudioChromeStore((s) => s.toggleShortcuts)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={open ? 'secondary' : 'outline'}
          size="icon-sm"
          onClick={toggle}
          aria-label="Keyboard shortcuts"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls="studio-shortcut-cheatsheet"
        >
          <Keyboard className="size-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <ShortcutHint shortcutId="cheatsheet" label="Shortcuts" />
      </TooltipContent>
    </Tooltip>
  )
}

function CopyRecipeButton() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => void copyStudioRecipeLink()}
          aria-label="Copy recipe link"
        >
          <Link2 className="size-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Copy recipe link</TooltipContent>
    </Tooltip>
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
        <DropdownMenuItem onClick={() => void copyStudioRecipeLink()}>
          <Link2 className="size-3.5" />
          Copy recipe link
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onImport} disabled={disabled}>
          <Upload className="size-3.5" />
          Import pipeline JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExport} disabled={disabled}>
          <FileJson className="size-3.5" />
          Export pipeline JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
