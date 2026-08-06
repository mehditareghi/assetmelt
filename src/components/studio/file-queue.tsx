import { X, FileImage, AlertCircle, CheckCircle2, Loader2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStudioStore } from '@/stores/studio-store'
import { pickImageFiles } from '@/lib/image/pick-image-files'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { filesize } from 'filesize'

export function FileQueue() {
  const files = useStudioStore((s) => s.files)
  const activeFileId = useStudioStore((s) => s.activeFileId)
  const isCropEditing = useStudioStore((s) => s.isCropEditing)
  const isProcessing = useStudioStore((s) => s.isProcessing)
  const setActiveFile = useStudioStore((s) => s.setActiveFile)
  const removeFile = useStudioStore((s) => s.removeFile)
  const addFiles = useStudioStore((s) => s.addFiles)

  if (files.length === 0) return null

  const handleAddFiles = async () => {
    if (isCropEditing || isProcessing) return
    const picked = await pickImageFiles()
    if (picked.length === 0) return
    await addFiles(picked)
  }

  return (
    <div className="glass-surface flex flex-col gap-2 rounded-2xl p-3 lg:p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Queue ({files.length})
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 font-mono text-[11px]"
          onClick={() => void handleAddFiles()}
          disabled={isCropEditing || isProcessing}
        >
          <Plus className="size-3" />
          Add
        </Button>
      </div>

      <div className="flex flex-col gap-1.5 lg:max-h-[calc(100vh-280px)] lg:overflow-y-auto">
        {files.map((file) => (
          <button
            key={file.id}
            type="button"
            onClick={() => setActiveFile(file.id)}
            disabled={isCropEditing && activeFileId !== file.id}
            className={cn(
              'group flex items-start gap-3 rounded-xl p-3 text-left transition-colors',
              isCropEditing && activeFileId !== file.id && 'cursor-not-allowed opacity-50',
              activeFileId === file.id
                ? 'bg-primary/10 ring-1 ring-primary/40'
                : 'hover:bg-background/50',
            )}
          >
            <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
              {file.originalUrl ? (
                <img
                  src={file.originalUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <FileImage className="m-2 size-6 text-muted-foreground" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="font-mono text-xs text-muted-foreground">
                {filesize(file.file.size)} · {file.inputFormat}
                {file.originalWidth != null && file.originalHeight != null && (
                  <> · {file.originalWidth}×{file.originalHeight}</>
                )}
              </p>
              {file.status === 'processing' && (
                <Progress value={file.progress} className="mt-2 h-1" />
              )}
              {file.status === 'done' && file.workflowResults && file.workflowResults.length > 0 && (
                <p className="mt-1 font-mono text-xs text-primary">
                  {file.workflowResults.length} sizes ready
                </p>
              )}
              {file.status === 'done' &&
                file.stats &&
                !file.workflowResults?.length && (
                  <p className="mt-1 font-mono text-xs text-primary">
                    −{file.stats.savingsPercent.toFixed(1)}% · {filesize(file.stats.outputSize)}
                  </p>
                )}
              {file.status === 'pending' && (
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {files.some((f) => f.status === 'done') ? 'Needs re-process' : 'Queued'}
                </p>
              )}
              {file.status === 'error' && (
                <p className="mt-1 text-xs text-destructive">{file.error}</p>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {file.status === 'processing' && (
                <Loader2 className="size-4 animate-spin text-primary" />
              )}
              {file.status === 'done' && (
                <CheckCircle2 className="size-4 text-primary" />
              )}
              {file.status === 'error' && (
                <AlertCircle className="size-4 text-destructive" />
              )}
              <Button
                variant="ghost"
                size="icon-xs"
                disabled={isCropEditing}
                className="opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  removeFile(file.id)
                }}
              >
                <X className="size-3" />
              </Button>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
