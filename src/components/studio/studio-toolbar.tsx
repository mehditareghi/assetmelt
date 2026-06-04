import { Download, Play, Redo2, Settings, Trash2, Undo2, Upload, FileJson } from 'lucide-react'
import JSZip from 'jszip'
import { toast } from 'sonner'
import { useStudioStore } from '@/stores/studio-store'
import { PresetPicker } from '@/components/studio/preset-picker'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { pipelineSchema } from '@/lib/schemas/pipeline-schema'

export function StudioToolbar() {
  const files = useStudioStore((s) => s.files)
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

  const doneCount = files.filter((f) => f.status === 'done').length

  const handleExportAll = async () => {
    const done = files.filter((f) => f.status === 'done' && f.resultBlob)
    if (done.length === 0) {
      toast.error('No processed files to export')
      return
    }

    if (done.length === 1) {
      downloadBlob(done[0].resultBlob!, done[0].resultName ?? done[0].name)
      toast.success('Downloaded')
      return
    }

    const zip = new JSZip()
    for (const file of done) {
      zip.file(file.resultName ?? file.name, file.resultBlob!)
    }
    const blob = await zip.generateAsync({ type: 'blob' })
    downloadBlob(blob, 'assetmelt-batch.zip')
    toast.success(`Downloaded ${done.length} files as zip`)
  }

  const handleExportConfig = () => {
    const json = JSON.stringify(pipeline, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    downloadBlob(blob, 'assetmelt-pipeline.json')
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
    <div className="flex flex-col gap-4 border-b border-border/50 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <PresetPicker disabled={isCropEditing} />

        <div className="flex items-center gap-2">
          <Switch
            id="advanced"
            checked={isAdvancedMode}
            onCheckedChange={setAdvancedMode}
            disabled={isCropEditing}
          />
          <Label htmlFor="advanced" className="flex items-center gap-1.5 text-sm">
            <Settings className="size-3.5" />
            Advanced
          </Label>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
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
          <span className="hidden sm:inline">Import</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportConfig}
          disabled={isCropEditing}
          className="gap-1.5"
        >
          <FileJson className="size-3.5" />
          <span className="hidden sm:inline">Export JSON</span>
        </Button>
        {files.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFiles}
            disabled={isCropEditing}
            className="gap-1.5"
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
        <Button
          size="sm"
          onClick={() => processAll()}
          disabled={isCropEditing || isProcessing || files.length === 0}
          className="gap-1.5"
        >
          <Play className="size-3.5" />
          Process{files.length > 0 ? ` (${files.length})` : ''}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleExportAll}
          disabled={isCropEditing || doneCount === 0}
          className="gap-1.5"
        >
          <Download className="size-3.5" />
          Download{doneCount > 0 ? ` (${doneCount})` : ''}
        </Button>
      </div>
    </div>
  )
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
