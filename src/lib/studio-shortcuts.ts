import { useSyncExternalStore } from 'react'

export type ShortcutGroup = 'queue' | 'pipeline' | 'help'

export type KeyCombo = {
  key: string
  meta?: boolean
  shift?: boolean
}

export type StudioShortcut = {
  id: string
  group: ShortcutGroup
  label: string
  hint: string
  combos: KeyCombo[]
  /** Fire even when focus is in an input (save / process / recipes). */
  global?: boolean
  /** Shown in the cheatsheet only — handled elsewhere (e.g. paste). */
  documentOnly?: boolean
}

export const STUDIO_SHORTCUTS: StudioShortcut[] = [
  {
    id: 'paste',
    group: 'queue',
    label: 'Paste images',
    hint: 'Drop from the clipboard when you are not typing',
    combos: [{ key: 'v', meta: true }],
    documentOnly: true,
  },
  {
    id: 'process',
    group: 'queue',
    label: 'Process queue',
    hint: 'Encode pending files with the current recipe',
    combos: [{ key: 'Enter', meta: true }],
    global: true,
  },
  {
    id: 'download',
    group: 'queue',
    label: 'Download results',
    hint: 'Save processed files or a ZIP',
    combos: [{ key: 's', meta: true }],
    global: true,
  },
  {
    id: 'undo',
    group: 'pipeline',
    label: 'Undo',
    hint: 'Step back one pipeline change',
    combos: [{ key: 'z', meta: true }],
  },
  {
    id: 'redo',
    group: 'pipeline',
    label: 'Redo',
    hint: 'Re-apply the last undone change',
    combos: [
      { key: 'z', meta: true, shift: true },
      { key: 'y', meta: true },
    ],
  },
  {
    id: 'recipes',
    group: 'pipeline',
    label: 'Open recipes',
    hint: 'Switch presets and Fit to size',
    combos: [{ key: 'k', meta: true }],
    global: true,
  },
  {
    id: 'cheatsheet',
    group: 'help',
    label: 'Keyboard cheatsheet',
    hint: 'Show or hide this overlay',
    combos: [{ key: '?' }],
  },
]

export function usesAppleModifier(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform) || /Mac OS X/i.test(navigator.userAgent)
}

export function useAppleModifier(): boolean {
  return useSyncExternalStore(
    () => () => {},
    usesAppleModifier,
    () => false,
  )
}

function normalizeKey(key: string): string {
  if (key === 'Enter' || key === 'Escape') return key
  return key.length === 1 ? key.toLowerCase() : key
}

export function comboMatchesEvent(event: KeyboardEvent, combo: KeyCombo): boolean {
  const wantMeta = Boolean(combo.meta)
  const hasMeta = event.metaKey || event.ctrlKey
  if (event.altKey) return false
  if (hasMeta !== wantMeta) return false

  const key = normalizeKey(event.key)
  const want = normalizeKey(combo.key)
  if (want === '?') {
    return key === '?' || (event.shiftKey && key === '/')
  }

  const wantShift = Boolean(combo.shift)
  if (event.shiftKey !== wantShift) return false
  return key === want
}

export function matchStudioShortcut(event: KeyboardEvent): StudioShortcut | undefined {
  return STUDIO_SHORTCUTS.find(
    (shortcut) =>
      !shortcut.documentOnly && shortcut.combos.some((combo) => comboMatchesEvent(event, combo)),
  )
}

export function shortcutKeycaps(combo: KeyCombo, apple = usesAppleModifier()): string[] {
  const caps: string[] = []
  if (combo.meta) caps.push(apple ? '⌘' : 'Ctrl')
  if (combo.shift) caps.push(apple ? '⇧' : 'Shift')
  if (combo.key === 'Enter') caps.push(apple ? '↵' : 'Enter')
  else if (combo.key === '?') caps.push('?')
  else caps.push(combo.key.toUpperCase())
  return caps
}

export function formatShortcutLabel(id: string, apple = usesAppleModifier()): string {
  const shortcut = STUDIO_SHORTCUTS.find((item) => item.id === id)
  if (!shortcut) return id
  return shortcutKeycaps(shortcut.combos[0], apple).join(apple ? '' : '+')
}
