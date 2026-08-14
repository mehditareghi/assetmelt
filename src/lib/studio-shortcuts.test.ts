import { describe, expect, it } from 'vitest'
import {
  comboMatchesEvent,
  formatShortcutLabel,
  matchStudioShortcut,
  shortcutKeycaps,
} from './studio-shortcuts'

function keyEvent(init: {
  key: string
  metaKey?: boolean
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
}): KeyboardEvent {
  return {
    key: init.key,
    metaKey: init.metaKey ?? false,
    ctrlKey: init.ctrlKey ?? false,
    shiftKey: init.shiftKey ?? false,
    altKey: init.altKey ?? false,
  } as KeyboardEvent
}

describe('studio shortcuts', () => {
  it('matches process, download, recipes, and cheatsheet', () => {
    expect(matchStudioShortcut(keyEvent({ key: 'Enter', metaKey: true }))?.id).toBe('process')
    expect(matchStudioShortcut(keyEvent({ key: 's', ctrlKey: true }))?.id).toBe('download')
    expect(matchStudioShortcut(keyEvent({ key: 'k', metaKey: true }))?.id).toBe('recipes')
    expect(matchStudioShortcut(keyEvent({ key: '?' }))?.id).toBe('cheatsheet')
    expect(matchStudioShortcut(keyEvent({ key: '?', shiftKey: true }))?.id).toBe('cheatsheet')
    expect(matchStudioShortcut(keyEvent({ key: '/', shiftKey: true }))?.id).toBe('cheatsheet')
    expect(matchStudioShortcut(keyEvent({ key: '/' }))).toBeUndefined()
  })

  it('does not treat ? as a cheatsheet when a modifier is held', () => {
    expect(matchStudioShortcut(keyEvent({ key: '?', metaKey: true }))).toBeUndefined()
    expect(matchStudioShortcut(keyEvent({ key: '?', altKey: true }))).toBeUndefined()
  })

  it('maps undo and redo without colliding', () => {
    expect(matchStudioShortcut(keyEvent({ key: 'z', metaKey: true }))?.id).toBe('undo')
    expect(matchStudioShortcut(keyEvent({ key: 'z', metaKey: true, shiftKey: true }))?.id).toBe(
      'redo',
    )
    expect(matchStudioShortcut(keyEvent({ key: 'y', ctrlKey: true }))?.id).toBe('redo')
  })

  it('does not match document-only paste as a handler', () => {
    expect(matchStudioShortcut(keyEvent({ key: 'v', metaKey: true }))).toBeUndefined()
  })

  it('formats Apple and Windows keycaps', () => {
    expect(shortcutKeycaps({ key: 's', meta: true }, true)).toEqual(['⌘', 'S'])
    expect(shortcutKeycaps({ key: 's', meta: true }, false)).toEqual(['Ctrl', 'S'])
    expect(shortcutKeycaps({ key: 'z', meta: true, shift: true }, true)).toEqual(['⌘', '⇧', 'Z'])
    expect(formatShortcutLabel('cheatsheet', true)).toBe('?')
  })

  it('rejects alt-modified combos', () => {
    expect(
      comboMatchesEvent(keyEvent({ key: 's', metaKey: true, altKey: true }), {
        key: 's',
        meta: true,
      }),
    ).toBe(false)
  })
})
