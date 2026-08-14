import { useEffect } from 'react'
import { isEditablePasteTarget } from '@/lib/image/clipboard-paste'
import { exportStudioResults, runStudioProcess } from '@/lib/studio-actions'
import { matchStudioShortcut } from '@/lib/studio-shortcuts'
import { useStudioChromeStore } from '@/stores/studio-chrome-store'
import { useStudioStore } from '@/stores/studio-store'

export function useStudioShortcuts() {
  const undo = useStudioStore((s) => s.undo)
  const redo = useStudioStore((s) => s.redo)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const shortcut = matchStudioShortcut(event)
      if (!shortcut) return

      const typing = isEditablePasteTarget(event.target)
      if (typing && !shortcut.global) return

      const { isCropEditing } = useStudioStore.getState()
      const chrome = useStudioChromeStore.getState()

      switch (shortcut.id) {
        case 'cheatsheet':
          event.preventDefault()
          chrome.toggleShortcuts()
          return
        case 'recipes':
          event.preventDefault()
          if (isCropEditing) return
          chrome.toggleRecipePicker()
          return
        case 'download':
          event.preventDefault()
          void exportStudioResults()
          return
        case 'process':
          event.preventDefault()
          runStudioProcess()
          return
        case 'undo':
          event.preventDefault()
          undo()
          return
        case 'redo':
          event.preventDefault()
          redo()
          return
        default:
          return
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [undo, redo])
}
