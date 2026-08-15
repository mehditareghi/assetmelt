import { X, FileImage, AlertCircle, CheckCircle2, Loader2, Folder } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStudioStore } from '@/stores/studio-store'
import { sourceRelativeDir } from '@/lib/image/folder-drop'
import { AddImagesButton } from '@/components/studio/add-images-button'
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

  if (files.length === 0) return null

  return (
    <div className="glass-surface flex flex-col gap-2 rounded-2xl p-3 lg:p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Queue ({files.length})
        </h3>
        <AddImagesButton
          label="Add"
          variant="ghost"
          disabled={isCropEditing || isProcessing}
          className="h-7 px-2 font-mono text-[11px]"
        />
      </div>

      <div className="flex flex-col gap-1.5 lg:max-h-[calc(100vh-280px)] lg:overflow-y-auto">
        {files.map((file) => (
          <div
            key={file.id}
            className={cn(
              'group flex items-start gap-3 rounded-xl p-3 transition-colors',
              isCropEditing && activeFileId !== file.id && 'opacity-50',
              activeFileId === file.id
                ? 'bg-primary/10 ring-1 ring-primary/40'
                : 'hover:bg-background/50',
            )}
          >
            <button
              type="button"
              onClick={() => setActiveFile(file.id)}
              disabled={isCropEditing && activeFileId !== file.id}
              className={cn(
                'flex min-w-0 flex-1 items-start gap-3 text-left',
                isCropEditing && activeFileId !== file.id && 'cursor-not-allowed',
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
                {sourceRelativeDir(file.relativePath) ? (
                  <p className="truncate font-mono text-[10px] text-muted-foreground/80">
                    {sourceRelativeDir(file.relativePath)}
                  </p>
                ) : null}
                <p className="font-mono text-xs text-muted-foreground">
                  {filesize(file.file.size)} · {file.inputFormat}
                  {file.originalWidth != null && file.originalHeight != null && (
                    <> · {file.originalWidth}×{file.originalHeight}</>
                  )}
                </p>
                {file.status === 'processing' && (
                  <>
                    <Progress value={file.progress} className="mt-2 h-1" />
                    <p className="mt-1 font-mono text-xs text-primary">
                      Encoding… {Math.round(file.progress)}%
                    </p>
                  </>
                )}
                {file.status === 'done' && file.workflowResults && file.workflowResults.length > 0 && (
                  <p className="mt-1 font-mono text-xs text-primary">
                    {file.workflowResults.length} outputs ready
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
            </button>

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
                type="button"
                variant="ghost"
                size="icon-xs"
                disabled={isCropEditing}
                className="opacity-0 group-hover:opacity-100"
                aria-label={`Remove ${file.name}`}
                onClick={() => removeFile(file.id)}
              >
                <X className="size-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-1 flex items-center gap-1.5 rounded-lg border border-dashed border-border/60 px-2.5 py-2 font-mono text-[10px] leading-snug text-muted-foreground">
        <Folder className="size-3 shrink-0 opacity-70" />
        Drop files or a folder anywhere to add
      </p>
    </div>
  )
}
