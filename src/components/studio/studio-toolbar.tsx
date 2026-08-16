import {
  FileJson,
  Images,
  Keyboard,
  Link2,
  MoreHorizontal,
  Pause,
  Play,
  Redo2,
  Square,
  Trash2,
  Undo2,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import { OfflinePrepRestoreLink } from '@/components/pwa/offline-prep-restore-link'
import { useOptionalOfflinePrepContext } from '@/lib/pwa/offline-prep-context'
import { useStudioStore } from '@/stores/studio-store'
import { exportableResultCount } from '@/lib/download-results'
import { PresetPicker } from '@/components/studio/preset-picker'
import { AddImagesButton } from '@/components/studio/add-images-button'
import { ShortcutHint } from '@/components/studio/shortcut-cheatsheet'
import { StudioDownloadButton } from '@/components/studio/studio-download-button'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { pipelineSchema } from '@/lib/schemas/pipeline-schema'
import { copyStudioRecipeLink } from '@/lib/studio-actions'
import { BATCH_CHUNK_SIZE } from '@/lib/batch-memory'
import { useStudioChromeStore } from '@/stores/studio-chrome-store'

export function StudioToolbar() {
  const offlinePrep = useOptionalOfflinePrepContext()
  const hideOfflineChrome = offlinePrep?.offlineStudioChrome ?? false
  const files = useStudioStore((s) => s.files)
  const pipeline = useStudioStore((s) => s.pipeline)
  const isProcessing = useStudioStore((s) => s.isProcessing)
  const isPaused = useStudioStore((s) => s.isPaused)
  const isExporting = useStudioStore((s) => s.isExporting)
  const chunkZipParts = useStudioStore((s) => s.chunkZipParts)
  const processAll = useStudioStore((s) => s.processAll)
  const pauseProcessing = useStudioStore((s) => s.pauseProcessing)
  const resumeProcessing = useStudioStore((s) => s.resumeProcessing)
  const cancelProcessing = useStudioStore((s) => s.cancelProcessing)
  const clearFiles = useStudioStore((s) => s.clearFiles)
  const importPipelineConfig = useStudioStore((s) => s.importPipelineConfig)
  const undo = useStudioStore((s) => s.undo)
  const redo = useStudioStore((s) => s.redo)
  const isCropEditing = useStudioStore((s) => s.isCropEditing)
  const canUndo = useStudioStore((s) => s.canUndo)
  const canRedo = useStudioStore((s) => s.canRedo)
  const setResponsiveExportOpen = useStudioChromeStore((s) => s.setResponsiveExportOpen)

  const doneCount = exportableResultCount(files, chunkZipParts)
  const pendingCount = files.filter(
    (f) => f.status === 'pending' || f.status === 'error',
  ).length
  const processingCount = files.filter((f) => f.status === 'processing').length
  const hasFiles = files.length > 0
  const needsReprocess = pendingCount > 0
  const canProcess = hasFiles && needsReprocess && !isCropEditing && !isProcessing && !isPaused
  const canDownload = doneCount > 0 && !isCropEditing && !isProcessing && !isExporting
  const canResponsiveExport = hasFiles && !isCropEditing && !isProcessing && !isExporting

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
    if (isExporting) {
      return <StudioDownloadButton count={doneCount} />
    }
    if (isPaused) {
      return (
        <>
          {isProcessing ? (
            <Button size="sm" variant="outline" disabled className="gap-1.5">
              <Pause className="size-3.5" />
              Pausing…
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => resumeProcessing()}
              className="gap-1.5"
            >
              <Play className="size-3.5" />
              Resume
            </Button>
          )}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => cancelProcessing()}
            className="gap-1.5"
          >
            <Square className="size-3.5 fill-current" />
            Cancel
          </Button>
        </>
      )
    }
    if (isProcessing || processingCount > 0) {
      return (
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={() => pauseProcessing()}
            className="gap-1.5"
          >
            <Pause className="size-3.5" />
            Pause
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => cancelProcessing()}
            className="gap-1.5"
          >
            <Square className="size-3.5 fill-current" />
            Cancel
          </Button>
        </>
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
      return <StudioDownloadButton count={doneCount} />
    }
    return null
  })()

  const secondaryDownload =
    needsReprocess && canDownload ? (
      <StudioDownloadButton count={doneCount} variant="secondary" />
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
            <AddImagesButton
              label="Add images"
              disabled={isCropEditing}
              className="hidden shrink-0 lg:inline-flex"
            />
          ) : null}
        </div>

        <div className="hidden shrink-0 flex-wrap items-center justify-end gap-2 lg:flex">
          <HistoryButtons canUndo={canUndo()} canRedo={canRedo()} onUndo={undo} onRedo={redo} />
          <ShortcutsButton />
          <CopyRecipeButton />
          <PipelineOverflowMenu
            disabled={isCropEditing}
            responsiveDisabled={!canResponsiveExport}
            onImport={handleImportConfig}
            onExport={handleExportConfig}
            onResponsiveExport={() => setResponsiveExportOpen(true)}
          />
          {hasFiles && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFiles}
              disabled={isCropEditing || isProcessing || isExporting}
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
          <AddImagesButton
            label="Add images"
            disabled={isCropEditing}
            expand
            className="h-9"
          />
          <HistoryButtons canUndo={canUndo()} canRedo={canRedo()} onUndo={undo} onRedo={redo} />
          <ShortcutsButton />
          <CopyRecipeButton />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={clearFiles}
            disabled={isCropEditing || isProcessing || isExporting}
            aria-label="Clear queue"
          >
            <Trash2 className="size-3.5" />
          </Button>
          <PipelineOverflowMenu
            disabled={isCropEditing}
            responsiveDisabled={!canResponsiveExport}
            onImport={handleImportConfig}
            onExport={handleExportConfig}
            onResponsiveExport={() => setResponsiveExportOpen(true)}
          />
        </div>
      ) : (
        <div className="flex items-center justify-end gap-1 lg:hidden">
          <HistoryButtons canUndo={canUndo()} canRedo={canRedo()} onUndo={undo} onRedo={redo} />
          <ShortcutsButton />
          <CopyRecipeButton />
          <PipelineOverflowMenu
            disabled={isCropEditing}
            responsiveDisabled={!canResponsiveExport}
            onImport={handleImportConfig}
            onExport={handleExportConfig}
            onResponsiveExport={() => setResponsiveExportOpen(true)}
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
  responsiveDisabled,
  onImport,
  onExport,
  onResponsiveExport,
}: {
  disabled: boolean
  responsiveDisabled: boolean
  onImport: () => void
  onExport: () => void
  onResponsiveExport: () => void
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
        <DropdownMenuItem onClick={onResponsiveExport} disabled={responsiveDisabled}>
          <Images className="size-3.5" />
          Responsive export…
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onImport} disabled={disabled}>
          <Upload className="size-3.5" />
          Import pipeline JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExport} disabled={disabled}>
          <FileJson className="size-3.5" />
          Export pipeline JSON
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <ChunkZipMenuItem />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ChunkZipMenuItem() {
  const chunkZipEnabled = useStudioStore((s) => s.chunkZipEnabled)
  const setChunkZipEnabled = useStudioStore((s) => s.setChunkZipEnabled)
  return (
    <DropdownMenuCheckboxItem
      checked={chunkZipEnabled}
      onCheckedChange={(checked) => setChunkZipEnabled(checked === true)}
    >
      ZIP every {BATCH_CHUNK_SIZE} files
    </DropdownMenuCheckboxItem>
  )
}
