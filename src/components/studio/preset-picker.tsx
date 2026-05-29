import { useState, type ReactNode } from 'react'
import {
  Check,
  ChevronDown,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Save,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { useStudioStore } from '@/stores/studio-store'
import {
  BUILT_IN_PRESETS,
  findMatchingCustomPreset,
  getCustomPresetSummary,
  getPresetDisplayName,
  isCustomPresetId,
} from '@/lib/presets'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface PresetRowProps {
  name: string
  description?: string
  active: boolean
  onSelect: () => void
  menu?: ReactNode
}

function PresetRow({ name, description, active, onSelect, menu }: PresetRowProps) {
  return (
    <div className="group flex items-start gap-1 rounded-md pr-1 hover:bg-accent/50">
      <button
        type="button"
        onClick={onSelect}
        className="min-w-0 flex-1 rounded-md px-2 py-2 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="flex size-3.5 shrink-0 items-center justify-center">
            {active && <Check className="size-3.5 text-primary" />}
          </span>
          <span className={cn('truncate text-sm', active && 'font-medium')}>{name}</span>
        </div>
        {description && (
          <p className="mt-0.5 ml-5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </button>
      {menu}
    </div>
  )
}

export function PresetPicker() {
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
  const [saveOpen, setSaveOpen] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(
    null,
  )

  const presetName = getPresetDisplayName(activePresetId, customPresets)
  const isActiveCustom = isCustomPresetId(activePresetId)
  const matchingSavedPreset = findMatchingCustomPreset(pipeline, customPresets)
  const canSaveCurrentSettings = !matchingSavedPreset

  const handleSelect = (presetId: string) => {
    if (presetId === activePresetId && !isPipelineModified) {
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
      toast.error('Enter a preset name')
      return
    }
    if (
      customPresets.some(
        (preset) => preset.name.toLowerCase() === trimmed.toLowerCase(),
      )
    ) {
      toast.error('A preset with this name already exists')
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
      toast.error('Enter a preset name')
      return
    }
    if (
      customPresets.some(
        (preset) =>
          preset.id !== id && preset.name.toLowerCase() === trimmed.toLowerCase(),
      )
    ) {
      toast.error('A preset with this name already exists')
      return
    }
    updateCustomPreset(id, { name: trimmed })
    setEditingId(null)
    toast.success('Preset renamed')
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteCustomPreset(deleteTarget.id)
    toast.success(`Deleted "${deleteTarget.name}"`)
    setDeleteTarget(null)
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="h-9 min-w-[11rem] justify-between gap-2 px-3 font-normal"
          >
            <span className="flex min-w-0 items-center gap-2">
              {isPipelineModified && (
                <span
                  className="size-1.5 shrink-0 rounded-full bg-primary"
                  aria-label="Unsaved changes"
                />
              )}
              <span className="truncate">{presetName}</span>
            </span>
            <ChevronDown className="size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent align="start" className="w-80 p-0">
          {isPipelineModified && (
            <div className="space-y-2 border-b border-border/50 bg-muted/30 px-3 py-3">
              <p className="text-xs text-muted-foreground">
                Settings differ from <span className="font-medium text-foreground">{presetName}</span>
              </p>
              <div className="flex flex-wrap gap-2">
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
                    setSaveOpen(true)
                    setSaveName('')
                  }}
                >
                  <Save className="size-3" />
                  Save as new
                </Button>
              </div>
            </div>
          )}

          <div className="max-h-64 overflow-y-auto p-2">
            <p className="px-2 py-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Built-in
            </p>
            {BUILT_IN_PRESETS.map((preset) => (
              <PresetRow
                key={preset.id}
                name={preset.name}
                description={preset.description}
                active={activePresetId === preset.id && !isPipelineModified}
                onSelect={() => handleSelect(preset.id)}
              />
            ))}

            <p className="mt-2 px-2 py-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Your presets
            </p>
            {customPresets.length === 0 ? (
              <p className="px-2 py-3 text-xs text-muted-foreground">
                Save your current settings to reuse them later.
              </p>
            ) : (
              customPresets.map((preset) => {
                const isEditing = editingId === preset.id
                const isActive = activePresetId === preset.id && !isPipelineModified

                if (isEditing) {
                  return (
                    <div key={preset.id} className="flex items-center gap-1 px-2 py-1.5">
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
                  <PresetRow
                    key={preset.id}
                    name={preset.name}
                    description={getCustomPresetSummary(preset.config)}
                    active={isActive}
                    onSelect={() => handleSelect(preset.id)}
                    menu={
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            className="mt-1.5 shrink-0 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                            aria-label={`Actions for ${preset.name}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => startRename(preset.id, preset.name)}>
                            <Pencil className="size-3.5" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              updateCustomPreset(preset.id, { config: pipeline })
                              if (activePresetId === preset.id) {
                                toast.success(`Updated "${preset.name}"`)
                              } else {
                                applyPresetById(preset.id)
                                toast.success(`Updated and applied "${preset.name}"`)
                              }
                            }}
                          >
                            <Save className="size-3.5" />
                            Update from current
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() =>
                              setDeleteTarget({ id: preset.id, name: preset.name })
                            }
                          >
                            <Trash2 className="size-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    }
                  />
                )
              })
            )}
          </div>

          {(saveOpen || (!isPipelineModified && canSaveCurrentSettings)) && (
            <div className="border-t border-border/50 p-2">
              {saveOpen ? (
                <div className="space-y-2 px-1 py-1">
                  <Input
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="Preset name"
                    className="h-8"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveAsNew()
                      if (e.key === 'Escape') setSaveOpen(false)
                    }}
                  />
                  <div className="flex gap-2">
                    <Button type="button" size="xs" className="flex-1" onClick={handleSaveAsNew}>
                      Save
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => setSaveOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 text-muted-foreground"
                  onClick={() => {
                    setSaveOpen(true)
                    setSaveName('')
                  }}
                >
                  <Save className="size-3.5" />
                  Save current settings as preset
                </Button>
              )}
            </div>
          )}
        </PopoverContent>
      </Popover>

      <Dialog open={deleteTarget != null} onOpenChange={(next) => !next && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete preset?</DialogTitle>
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
