import { useDragControls, Reorder } from 'motion/react'
import {
  X,
  FileImage,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Folder,
  GripVertical,
  MapPin,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStudioStore } from '@/stores/studio-store'
import { sourceRelativeDir } from '@/lib/image/folder-drop'
import { moveIdInOrder } from '@/lib/queue-order'
import { AddImagesButton } from '@/components/studio/add-images-button'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { filesize } from 'filesize'
import type { ProcessableFile } from '@/lib/image/types'

export function FileQueue() {
  const files = useStudioStore((s) => s.files)
  const isCropEditing = useStudioStore((s) => s.isCropEditing)
  const reorderFiles = useStudioStore((s) => s.reorderFiles)

  if (files.length === 0) return null

  const ids = files.map((file) => file.id)
  const canReorder = files.length > 1 && !isCropEditing

  return (
    <div className="glass-surface flex min-w-0 flex-col gap-2 overflow-x-hidden rounded-2xl p-3 lg:p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Queue ({files.length})
        </h3>
        <AddImagesButton
          label="Add"
          variant="ghost"
          disabled={isCropEditing}
          className="h-7 shrink-0 px-2 font-mono text-[11px]"
        />
      </div>

      <div className="overflow-x-hidden lg:max-h-[calc(100vh-280px)] lg:overflow-y-auto">
        <Reorder.Group
          as="div"
          axis="y"
          values={ids}
          onReorder={canReorder ? reorderFiles : () => {}}
          className="flex min-w-0 flex-col gap-1.5"
        >
          {files.map((file) => (
            <QueueRow key={file.id} file={file} ids={ids} canReorder={canReorder} />
          ))}
        </Reorder.Group>
      </div>

      <p className="mt-1 flex min-w-0 items-start gap-1.5 rounded-lg border border-dashed border-border/60 px-2.5 py-2 font-mono text-[10px] leading-snug text-muted-foreground">
        <Folder className="mt-0.5 size-3 shrink-0 opacity-70" />
        <span className="min-w-0 text-pretty">
          {canReorder
            ? 'Drag to reorder · ZIP follows this list · drop anywhere to add'
            : 'Drop files or a folder anywhere to add'}
        </span>
      </p>
    </div>
  )
}

function QueueRow({
  file,
  ids,
  canReorder,
}: {
  file: ProcessableFile
  ids: string[]
  canReorder: boolean
}) {
  const controls = useDragControls()
  const files = useStudioStore((s) => s.files)
  const activeFileId = useStudioStore((s) => s.activeFileId)
  const isCropEditing = useStudioStore((s) => s.isCropEditing)
  const setActiveFile = useStudioStore((s) => s.setActiveFile)
  const removeFile = useStudioStore((s) => s.removeFile)
  const reorderFiles = useStudioStore((s) => s.reorderFiles)

  return (
    <Reorder.Item
      as="div"
      value={file.id}
      layout="position"
      drag={canReorder}
      dragListener={false}
      dragControls={controls}
      whileDrag={{
        zIndex: 20,
        scale: 1.015,
        boxShadow: '0 12px 28px -18px oklch(0.2 0.04 250 / 0.55)',
      }}
      className={cn(
        'group relative flex min-w-0 w-full items-start gap-2 overflow-hidden rounded-xl p-3 transition-colors',
        isCropEditing && activeFileId !== file.id && 'opacity-50',
        activeFileId === file.id
          ? 'bg-primary/10 ring-1 ring-primary/40'
          : 'hover:bg-background/50',
      )}
    >
      {canReorder ? (
        <button
          type="button"
          aria-label={`Reorder ${file.name}. Arrow keys move this file.`}
          className="mt-2 flex size-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground/70 hover:bg-background/70 hover:text-foreground active:cursor-grabbing"
          onPointerDown={(event) => controls.start(event)}
          onKeyDown={(event) => {
            if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
            event.preventDefault()
            reorderFiles(moveIdInOrder(ids, file.id, event.key === 'ArrowUp' ? -1 : 1))
          }}
        >
          <GripVertical className="size-3.5" />
        </button>
      ) : null}

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
            <img src={file.originalUrl} alt="" className="size-full object-cover" />
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
          <p className="truncate font-mono text-xs text-muted-foreground">
            {filesize(file.file.size)} · {file.inputFormat}
            {file.originalWidth != null && file.originalHeight != null && (
              <>
                {' '}
                · {file.originalWidth}×{file.originalHeight}
              </>
            )}
            {file.exif?.hasGps ? (
              <span
                className="ml-1 inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400"
                aria-label="Contains GPS"
              >
                <MapPin className="size-2.5" aria-hidden />
                GPS
              </span>
            ) : null}
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
          {file.status === 'done' && file.stats && !file.workflowResults?.length && (
            <p className="mt-1 font-mono text-xs text-primary">
              −{file.stats.savingsPercent.toFixed(1)}% · {filesize(file.stats.outputSize)}
            </p>
          )}
          {file.status === 'pending' && (
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {files.some((item) => item.status === 'done') ? 'Needs re-process' : 'Queued'}
            </p>
          )}
          {file.status === 'error' && (
            <p className="mt-1 break-words text-xs text-destructive">{file.error}</p>
          )}
        </div>
      </button>

      <div className="flex shrink-0 items-center gap-1">
        {file.status === 'processing' && (
          <Loader2 className="size-4 animate-spin text-primary" />
        )}
        {file.status === 'done' && <CheckCircle2 className="size-4 text-primary" />}
        {file.status === 'error' && <AlertCircle className="size-4 text-destructive" />}
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
    </Reorder.Item>
  )
}
