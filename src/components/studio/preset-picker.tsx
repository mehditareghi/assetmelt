import { useState } from 'react'
import {
  Check,
  ChevronRight,
  Pencil,
  Ratio,
  RotateCcw,
  Save,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { useStudioStore } from '@/stores/studio-store'
import {
  GENERAL_BUILT_IN_PRESETS,
  getCustomPresetSummary,
  getPresetDisplayName,
  isCustomPresetId,
} from '@/lib/presets'
import {
  getGeneralPresetIcon,
  getPresetDimensionsLabel,
  getPresetIcon,
} from '@/lib/preset-icons'
import {
  PLATFORM_BUILT_IN_PRESETS,
  resolvePlatformPresetId,
} from '@/lib/platform-presets'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FitToSizeSheet } from '@/components/studio/fit-to-size-sheet'

export function PresetPicker({ disabled = false }: { disabled?: boolean }) {
  const activePresetId = useStudioStore((s) => s.activePresetId)
  const isPipelineModified = useStudioStore((s) => s.isPipelineModified)
  const customPresets = useStudioStore((s) => s.customPresets)
  const pipeline = useStudioStore((s) => s.pipeline)
  const applyPresetById = useStudioStore((s) => s.applyPresetById)
  const resetActivePreset = useStudioStore((s) => s.resetActivePreset)
  const saveCustomPreset = useStudioStore((s) => s.saveCustomPreset)
  const updateCustomPreset = useStudioStore((s) => s.updateCustomPreset)
  const deleteCustomPreset = useStudioStore((s) => s.deleteCustomPreset)

  const [open, setOpen] = useState(false)
  const [fitOpen, setFitOpen] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(
    null,
  )

  const resolvedActive = resolvePlatformPresetId(activePresetId)
  const presetName = getPresetDisplayName(activePresetId, customPresets)
  const isActiveCustom = isCustomPresetId(activePresetId)
  const isActivePlatform = PLATFORM_BUILT_IN_PRESETS.some((p) => p.id === resolvedActive)
  const summary = getCustomPresetSummary(pipeline)
  const ActiveIcon = getPresetIcon(resolvedActive)

  const handleSelect = (presetId: string) => {
    if (presetId === resolvedActive && !isPipelineModified && !isActiveCustom) {
      setOpen(false)
      return
    }
    if (presetId === activePresetId && !isPipelineModified && isActiveCustom) {
      setOpen(false)
      return
    }
    applyPresetById(presetId)
    setOpen(false)
    toast.success(`Applied "${getPresetDisplayName(presetId, customPresets)}"`)
  }

  const handleRevert = () => {
    resetActivePreset()
    toast.success(`Reverted to "${presetName}"`)
  }

  const handleUpdateActive = () => {
    if (!isActiveCustom) return
    updateCustomPreset(activePresetId, { config: pipeline })
    toast.success(`Updated "${presetName}"`)
  }

  const handleSaveAsNew = () => {
    const trimmed = saveName.trim()
    if (!trimmed) {
      toast.error('Enter a recipe name')
      return
    }
    if (
      customPresets.some(
        (preset) => preset.name.toLowerCase() === trimmed.toLowerCase(),
      )
    ) {
      toast.error('A recipe with this name already exists')
      return
    }
    saveCustomPreset(trimmed)
    setSaveName('')
    setSaveOpen(false)
    toast.success(`Saved "${trimmed}"`)
  }

  const startRename = (id: string, name: string) => {
    setEditingId(id)
    setEditingName(name)
  }

  const commitRename = (id: string) => {
    const trimmed = editingName.trim()
    if (!trimmed) {
      toast.error('Enter a recipe name')
      return
    }
    if (
      customPresets.some(
        (preset) =>
          preset.id !== id && preset.name.toLowerCase() === trimmed.toLowerCase(),
      )
    ) {
      toast.error('A recipe with this name already exists')
      return
    }
    updateCustomPreset(id, { name: trimmed })
    setEditingId(null)
    toast.success('Recipe renamed')
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteCustomPreset(deleteTarget.id)
    toast.success(`Deleted "${deleteTarget.name}"`)
    setDeleteTarget(null)
  }

  const openFitToSize = () => {
    setOpen(false)
    setFitOpen(true)
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className="h-9 min-w-[10rem] justify-between gap-2 px-3 font-normal"
            aria-label={`Recipe: ${presetName}`}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-md border border-border/50 bg-muted/40',
                  isPipelineModified && 'text-primary',
                )}
              >
                <ActiveIcon className="size-3.5" strokeWidth={1.75} />
              </span>
              {isPipelineModified && (
                <span
                  className="size-1.5 shrink-0 rounded-full bg-primary"
                  aria-label="Unsaved changes"
                />
              )}
              <span className="truncate">{presetName}</span>
            </span>
            <Ratio className="size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="flex w-[min(100vw-2rem,22rem)] flex-col gap-0 overflow-hidden p-0"
        >
          <div className="border-b border-border/50 px-3 py-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Recipe
            </p>
            <p className="mt-0.5 truncate text-sm font-medium">{presetName}</p>
            <p className="truncate font-mono text-[11px] text-muted-foreground">{summary}</p>
          </div>

          {isPipelineModified && (
            <div className="space-y-2 border-b border-border/50 bg-muted/30 px-3 py-2.5">
              <p className="text-xs text-muted-foreground">
                Tweaked from <span className="font-medium text-foreground">{presetName}</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  className="gap-1"
                  onClick={handleRevert}
                >
                  <RotateCcw className="size-3" />
                  Revert
                </Button>
                {isActiveCustom && (
                  <Button
                    type="button"
                    size="xs"
                    className="gap-1"
                    onClick={handleUpdateActive}
                  >
                    <Save className="size-3" />
                    Update
                  </Button>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  size="xs"
                  className="gap-1"
                  onClick={() => {
                    setSaveName('')
                    setSaveOpen(true)
                  }}
                >
                  <Save className="size-3" />
                  Save as…
                </Button>
              </div>
            </div>
          )}

          <div className="max-h-[min(70vh,28rem)] overflow-y-auto">
            <div className="px-2 py-2">
              <p className="px-1.5 pb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Recipes
              </p>
              <div className="space-y-0.5">
                {GENERAL_BUILT_IN_PRESETS.map((preset) => {
                  const Icon = getGeneralPresetIcon(preset)
                  const dimensions = getPresetDimensionsLabel(preset)
                  const active =
                    resolvedActive === preset.id &&
                    !isPipelineModified &&
                    !isActiveCustom &&
                    !isActivePlatform

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelect(preset.id)}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors',
                        active
                          ? 'bg-primary/10 text-foreground'
                          : 'hover:bg-accent/50',
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-8 shrink-0 items-center justify-center rounded-md',
                          active
                            ? 'bg-primary/15 text-primary'
                            : 'bg-muted/60 text-muted-foreground',
                        )}
                      >
                        <Icon className="size-3.5" strokeWidth={1.75} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={cn('truncate text-sm', active && 'font-medium')}>
                            {preset.name}
                          </span>
                          {dimensions && (
                            <Badge
                              variant="outline"
                              className="h-4 shrink-0 px-1 font-mono text-[10px]"
                            >
                              {dimensions}
                            </Badge>
                          )}
                          {active && (
                            <Check className="ml-auto size-3.5 shrink-0 text-primary" />
                          )}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {preset.description}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {customPresets.length > 0 && (
              <div className="border-t border-border/40 px-2 py-2">
                <p className="px-1.5 pb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Yours
                </p>
                <div className="space-y-0.5">
                  {customPresets.map((preset) => {
                    const isEditing = editingId === preset.id
                    const isActive =
                      activePresetId === preset.id && !isPipelineModified
                    const Icon = getPresetIcon('custom')

                    if (isEditing) {
                      return (
                        <div key={preset.id} className="flex items-center gap-1 px-1 py-1">
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="h-8 flex-1"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitRename(preset.id)
                              if (e.key === 'Escape') setEditingId(null)
                            }}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            aria-label="Confirm rename"
                            onClick={() => commitRename(preset.id)}
                          >
                            <Check className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            aria-label="Cancel rename"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="size-3.5" />
                          </Button>
                        </div>
                      )
                    }

                    return (
                      <div
                        key={preset.id}
                        className={cn(
                          'flex items-center gap-0.5 rounded-lg',
                          isActive && 'bg-primary/10',
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelect(preset.id)}
                          className="flex min-w-0 flex-1 items-center gap-2.5 px-2 py-2 text-left"
                        >
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted/60 text-muted-foreground">
                            <Icon className="size-3.5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <span
                              className={cn('block truncate text-sm', isActive && 'font-medium')}
                            >
                              {preset.name}
                            </span>
                            <p className="truncate text-xs text-muted-foreground">
                              {getCustomPresetSummary(preset.config)}
                            </p>
                          </div>
                          {isActive && (
                            <Check className="size-3.5 shrink-0 text-primary" />
                          )}
                        </button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          className="shrink-0"
                          aria-label={`Rename ${preset.name}`}
                          onClick={() => startRename(preset.id, preset.name)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          className="mr-1 shrink-0 text-destructive hover:text-destructive"
                          aria-label={`Delete ${preset.name}`}
                          onClick={() =>
                            setDeleteTarget({ id: preset.id, name: preset.name })
                          }
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border/50 p-2">
            <button
              type="button"
              onClick={openFitToSize}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-accent/50"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted/60 text-muted-foreground">
                <Ratio className="size-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">Fit to size</span>
                <span className="block text-xs text-muted-foreground">
                  Instagram, YouTube, link previews…
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <FitToSizeSheet open={fitOpen} onOpenChange={setFitOpen} />

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="sm:max-w-sm" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Save recipe</DialogTitle>
            <DialogDescription>
              Store your current settings for one-click reuse later.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="Recipe name"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveAsNew()
            }}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSaveOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveAsNew}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget != null} onOpenChange={(next) => !next && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete recipe?</DialogTitle>
            <DialogDescription>
              &ldquo;{deleteTarget?.name}&rdquo; will be removed. Your current settings stay as
              they are.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
