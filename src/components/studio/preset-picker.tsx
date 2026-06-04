import { useMemo, useState, type ReactNode } from 'react'
import {
  Bookmark,
  Check,
  LayoutGrid,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Save,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { useStudioStore } from '@/stores/studio-store'
import {
  BUILT_IN_PRESETS,
  GENERAL_BUILT_IN_PRESETS,
  findMatchingCustomPreset,
  getCustomPresetSummary,
  getPresetDisplayName,
  isCustomPresetId,
} from '@/lib/presets'
import {
  getPresetDimensionsLabel,
  getGeneralPresetIcon,
  getPlatformPresetIcon,
  getPresetIcon,
} from '@/lib/preset-icons'
import {
  PLATFORM_BUILT_IN_PRESETS,
  PLATFORM_PRESET_GROUPS,
  type PlatformPreset,
} from '@/lib/platform-presets'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

type PresetTab = 'platform' | 'optimize' | 'saved'

function resolveDefaultTab(activePresetId: string): PresetTab {
  if (isCustomPresetId(activePresetId)) return 'saved'
  if (PLATFORM_BUILT_IN_PRESETS.some((p) => p.id === activePresetId)) return 'platform'
  return 'optimize'
}

function matchesQuery(name: string, description: string | undefined, query: string): boolean {
  if (!query) return true
  const haystack = `${name} ${description ?? ''}`.toLowerCase()
  return haystack.includes(query.toLowerCase())
}

interface PresetCardProps {
  name: string
  description?: string
  dimensions?: string | null
  active: boolean
  onSelect: () => void
  icon: ReactNode
}

function PresetCard({
  name,
  description,
  dimensions,
  active,
  onSelect,
  icon,
}: PresetCardProps) {
  return (
    <div
      className={cn(
        'group relative flex flex-col rounded-lg border text-left transition-colors',
        active
          ? 'border-primary/50 bg-primary/10 ring-1 ring-primary/30'
          : 'border-border/60 bg-background/40 hover:border-border hover:bg-accent/40',
      )}
    >
      <button type="button" onClick={onSelect} className="flex flex-1 flex-col gap-2 p-3 text-left">
        <div className="flex items-start gap-2.5">
          <span
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-md border',
              active
                ? 'border-primary/30 bg-primary/15 text-primary'
                : 'border-border/50 bg-muted/50 text-muted-foreground',
            )}
          >
            {icon}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className={cn('truncate text-sm', active && 'font-medium')}>{name}</span>
              {active && <Check className="size-3.5 shrink-0 text-primary" />}
            </div>
            {dimensions && (
              <Badge variant="secondary" className="mt-1 h-5 px-1.5 font-mono text-[10px]">
                {dimensions}
              </Badge>
            )}
          </div>
        </div>
        {description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{description}</p>
        )}
      </button>
    </div>
  )
}

interface OptimizeRowProps {
  name: string
  description?: string
  dimensions?: string | null
  active: boolean
  onSelect: () => void
  icon: ReactNode
}

function OptimizeRow({ name, description, dimensions, active, onSelect, icon }: OptimizeRowProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
        active
          ? 'border-primary/50 bg-primary/10'
          : 'border-transparent hover:border-border/60 hover:bg-accent/40',
      )}
    >
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-md',
          active ? 'bg-primary/15 text-primary' : 'bg-muted/60 text-muted-foreground',
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={cn('text-sm', active && 'font-medium')}>{name}</span>
          {dimensions && (
            <Badge variant="outline" className="h-5 font-mono text-[10px]">
              {dimensions}
            </Badge>
          )}
          {active && <Check className="ml-auto size-3.5 shrink-0 text-primary" />}
        </div>
        {description && (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </button>
  )
}

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
  const [tab, setTab] = useState<PresetTab>('platform')
  const [query, setQuery] = useState('')
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

  const ActiveIcon = getPresetIcon(activePresetId)

  const filteredPlatform = useMemo(
    () =>
      PLATFORM_BUILT_IN_PRESETS.filter((preset) =>
        matchesQuery(preset.name, preset.description, query),
      ),
    [query],
  )

  const filteredOptimize = useMemo(
    () =>
      GENERAL_BUILT_IN_PRESETS.filter((preset) =>
        matchesQuery(preset.name, preset.description, query),
      ),
    [query],
  )

  const filteredCustom = useMemo(
    () =>
      customPresets.filter((preset) =>
        matchesQuery(preset.name, getCustomPresetSummary(preset.config), query),
      ),
    [customPresets, query],
  )

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) {
      setTab(resolveDefaultTab(activePresetId))
      setQuery('')
    }
  }

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
    setTab('saved')
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

  const renderPlatformIcon = (preset: PlatformPreset) => {
    const Icon = getPlatformPresetIcon(preset)
    return <Icon className="size-4" strokeWidth={1.75} />
  }

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className="h-9 min-w-[10rem] justify-between gap-2 px-3 font-normal"
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
            <LayoutGrid className="size-4 shrink-0 opacity-50" />
          </Button>
        </SheetTrigger>

        <SheetContent
          side="right"
          className="flex w-full max-w-[100vw] flex-col gap-0 overflow-x-hidden p-0 sm:max-w-md"
          showCloseButton
        >
          <SheetHeader className="shrink-0 border-b border-border/50 px-4 pt-4 pb-3">
            <SheetTitle className="font-display text-lg">Presets</SheetTitle>
            <SheetDescription>
              Platform sizes, optimization profiles, and your saved settings.
            </SheetDescription>
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search presets…"
                className="h-8 pl-8"
              />
            </div>
          </SheetHeader>

          {isPipelineModified && (
            <div className="shrink-0 space-y-2 border-b border-border/50 bg-muted/30 px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Tweaked from{' '}
                <span className="font-medium text-foreground">{presetName}</span>
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
                    setTab('saved')
                  }}
                >
                  <Save className="size-3" />
                  Save as new
                </Button>
              </div>
            </div>
          )}

          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as PresetTab)}
            className="flex min-h-0 min-w-0 flex-1 flex-col"
          >
            <div className="shrink-0 px-4 pt-3">
              <TabsList
                variant="default"
                className="!grid h-auto w-full max-w-full grid-cols-3 gap-0.5 p-1"
              >
                <TabsTrigger
                  value="platform"
                  className="min-w-0 gap-1 px-1.5 text-xs sm:gap-1.5 sm:px-2 sm:text-sm"
                >
                  <LayoutGrid className="size-3.5 shrink-0" />
                  <span className="truncate">Platform</span>
                </TabsTrigger>
                <TabsTrigger
                  value="optimize"
                  className="min-w-0 gap-1 px-1.5 text-xs sm:gap-1.5 sm:px-2 sm:text-sm"
                >
                  <SlidersHorizontal className="size-3.5 shrink-0" />
                  <span className="truncate">Optimize</span>
                </TabsTrigger>
                <TabsTrigger
                  value="saved"
                  className="min-w-0 gap-1 px-1.5 text-xs sm:gap-1.5 sm:px-2 sm:text-sm"
                >
                  <Bookmark className="size-3.5 shrink-0" />
                  <span className="truncate">Saved</span>
                  {customPresets.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="h-4 min-w-4 shrink-0 px-1 text-[10px]"
                    >
                      {customPresets.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              <TabsContent value="platform" className="mt-0 space-y-5">
                {filteredPlatform.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No platform presets match your search.
                  </p>
                ) : (
                  PLATFORM_PRESET_GROUPS.map((group) => {
                    const presets = filteredPlatform.filter((p) => p.group === group.id)
                    if (presets.length === 0) return null

                    return (
                      <section key={group.id}>
                        <h3 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                          {group.label}
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                          {presets.map((preset) => (
                            <PresetCard
                              key={preset.id}
                              name={preset.name}
                              description={preset.description}
                              dimensions={getPresetDimensionsLabel(preset)}
                              active={
                                activePresetId === preset.id && !isPipelineModified
                              }
                              onSelect={() => handleSelect(preset.id)}
                              icon={renderPlatformIcon(preset)}
                            />
                          ))}
                        </div>
                      </section>
                    )
                  })
                )}
              </TabsContent>

              <TabsContent value="optimize" className="mt-0 space-y-1">
                {filteredOptimize.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No optimization presets match your search.
                  </p>
                ) : (
                  filteredOptimize.map((preset) => {
                    const Icon = getGeneralPresetIcon(preset)
                    return (
                      <OptimizeRow
                        key={preset.id}
                        name={preset.name}
                        description={preset.description}
                        dimensions={getPresetDimensionsLabel(preset)}
                        active={activePresetId === preset.id && !isPipelineModified}
                        onSelect={() => handleSelect(preset.id)}
                        icon={<Icon className="size-4" strokeWidth={1.75} />}
                      />
                    )
                  })
                )}
              </TabsContent>

              <TabsContent value="saved" className="mt-0 space-y-2">
                {saveOpen && (
                  <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3">
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
                )}

                {filteredCustom.length === 0 && !saveOpen ? (
                  <div className="rounded-lg border border-dashed border-border/60 px-4 py-10 text-center">
                    <Bookmark className="mx-auto size-8 text-muted-foreground/50" />
                    <p className="mt-3 text-sm text-muted-foreground">
                      No saved presets yet. Tune your pipeline, then save it here.
                    </p>
                    {canSaveCurrentSettings && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="mt-4 gap-1.5"
                        onClick={() => setSaveOpen(true)}
                      >
                        <Save className="size-3.5" />
                        Save current settings
                      </Button>
                    )}
                  </div>
                ) : (
                  filteredCustom.map((preset) => {
                    const isEditing = editingId === preset.id
                    const isActive = activePresetId === preset.id && !isPipelineModified
                    const Icon = getPresetIcon('custom')

                    if (isEditing) {
                      return (
                        <div key={preset.id} className="flex items-center gap-1">
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
                        className="group flex items-center gap-1 rounded-lg border border-transparent hover:border-border/60 hover:bg-accent/30"
                      >
                        <button
                          type="button"
                          onClick={() => handleSelect(preset.id)}
                          className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left"
                        >
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted/60 text-muted-foreground">
                            <Icon className="size-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className={cn('text-sm', isActive && 'font-medium')}>
                              {preset.name}
                            </span>
                            <p className="line-clamp-1 text-xs text-muted-foreground">
                              {getCustomPresetSummary(preset.config)}
                            </p>
                          </div>
                          {isActive && <Check className="size-3.5 shrink-0 text-primary" />}
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              className="mr-2 shrink-0 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                              aria-label={`Actions for ${preset.name}`}
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
                      </div>
                    )
                  })
                )}
              </TabsContent>
            </div>
          </Tabs>

          <SheetFooter className="shrink-0 border-t border-border/50 px-4 py-3">
            {!saveOpen && canSaveCurrentSettings && tab !== 'saved' && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-muted-foreground"
                onClick={() => {
                  setSaveOpen(true)
                  setSaveName('')
                  setTab('saved')
                }}
              >
                <Save className="size-3.5" />
                Save current settings
              </Button>
            )}
            {!canSaveCurrentSettings && (
              <p className="w-full text-center text-xs text-muted-foreground">
                {BUILT_IN_PRESETS.length} built-in presets
              </p>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

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
