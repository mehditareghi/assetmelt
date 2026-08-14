import { Keyboard } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  STUDIO_SHORTCUTS,
  shortcutKeycaps,
  useAppleModifier,
  type KeyCombo,
  type StudioShortcut,
} from '@/lib/studio-shortcuts'
import { useStudioChromeStore } from '@/stores/studio-chrome-store'

export function ShortcutKeycaps({
  combo,
  apple,
  compact = false,
}: {
  combo: KeyCombo
  apple: boolean
  compact?: boolean
}) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {shortcutKeycaps(combo, apple).map((cap, index) => (
        <kbd
          key={`${cap}-${index}`}
          className={cn(
            'inline-flex items-center justify-center rounded-md border border-border/70 bg-background/90 font-mono font-medium text-foreground',
            'shadow-[inset_0_-1px_0_hsl(var(--border))]',
            compact ? 'h-5 min-w-[1.25rem] px-1 text-[10px]' : 'h-6 min-w-[1.4rem] px-1.5 text-[11px]',
          )}
        >
          {cap}
        </kbd>
      ))}
    </span>
  )
}

function ShortcutCombos({
  combos,
  apple,
  compact = false,
}: {
  combos: KeyCombo[]
  apple: boolean
  compact?: boolean
}) {
  return (
    <span className="inline-flex flex-wrap items-center justify-end gap-1.5">
      {combos.map((combo, index) => (
        <span key={index} className="inline-flex items-center gap-1.5">
          {index > 0 ? (
            <span className="font-mono text-[10px] text-muted-foreground">or</span>
          ) : null}
          <ShortcutKeycaps combo={combo} apple={apple} compact={compact} />
        </span>
      ))}
    </span>
  )
}

function ShortcutRow({
  item,
  apple,
}: {
  item: StudioShortcut
  apple: boolean
}) {
  return (
    <li className="flex items-start justify-between gap-4 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-muted/50">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{item.label}</p>
        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{item.hint}</p>
      </div>
      <ShortcutCombos combos={item.combos} apple={apple} />
    </li>
  )
}

function ShortcutColumn({
  title,
  items,
  apple,
  className,
}: {
  title: string
  items: StudioShortcut[]
  apple: boolean
  className?: string
}) {
  return (
    <section className={className}>
      <h3 className="mb-1.5 px-2.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <ShortcutRow key={item.id} item={item} apple={apple} />
        ))}
      </ul>
    </section>
  )
}

export function ShortcutCheatsheet() {
  const open = useStudioChromeStore((s) => s.shortcutsOpen)
  const setOpen = useStudioChromeStore((s) => s.setShortcutsOpen)
  const apple = useAppleModifier()
  const queue = STUDIO_SHORTCUTS.filter((item) => item.group === 'queue')
  const pipeline = STUDIO_SHORTCUTS.filter((item) => item.group === 'pipeline')
  const help = STUDIO_SHORTCUTS.filter((item) => item.group === 'help')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        id="studio-shortcut-cheatsheet"
        className="flex max-h-[min(90vh,42rem)] flex-col gap-0 overflow-hidden border-border/50 bg-background/95 p-0 backdrop-blur-xl sm:max-w-2xl"
        aria-describedby="shortcut-cheatsheet-desc"
      >
        <DialogHeader className="shrink-0 border-b border-border/40 px-6 py-5 text-left">
          <div className="flex items-start gap-3 pr-8">
            <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <Keyboard className="size-5" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <DialogTitle className="font-display text-xl tracking-tight">
                Keyboard shortcuts
              </DialogTitle>
              <DialogDescription id="shortcut-cheatsheet-desc" className="mt-1 text-sm">
                Keys stay on this device — same as your images. Press{' '}
                <ShortcutKeycaps combo={{ key: '?' }} apple={apple} compact /> or Esc to close.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="grid gap-6 px-4 py-5 sm:grid-cols-2 sm:gap-x-4 sm:px-5">
            <ShortcutColumn title="Queue" items={queue} apple={apple} />
            <ShortcutColumn
              title="Pipeline"
              items={pipeline}
              apple={apple}
              className="sm:border-l sm:border-border/40 sm:pl-4"
            />
          </div>

          <div className="border-t border-border/40 bg-muted/20 px-4 py-3 sm:px-5">
            <ul>
              {help.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-4 rounded-xl px-2.5 py-1.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.hint}</p>
                  </div>
                  <ShortcutCombos combos={item.combos} apple={apple} />
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="shrink-0 border-t border-border/40 px-6 py-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
          {apple ? '⌘ is Command' : 'Ctrl is Control'}
          {' · '}
          Process, download, and recipes still fire while you type.
        </p>
      </DialogContent>
    </Dialog>
  )
}

export function ShortcutHint({
  shortcutId,
  label,
}: {
  shortcutId: string
  label: string
}) {
  const apple = useAppleModifier()
  const shortcut = STUDIO_SHORTCUTS.find((item) => item.id === shortcutId)
  if (!shortcut) return label
  return (
    <span className="inline-flex items-center gap-2">
      <span>{label}</span>
      <ShortcutCombos combos={shortcut.combos} apple={apple} compact />
    </span>
  )
}
