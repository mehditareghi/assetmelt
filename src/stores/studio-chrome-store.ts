import { create } from 'zustand'

type StudioChromeState = {
  recipePickerOpen: boolean
  shortcutsOpen: boolean
  setRecipePickerOpen: (open: boolean) => void
  setShortcutsOpen: (open: boolean) => void
  toggleShortcuts: () => void
  toggleRecipePicker: () => void
}

export const useStudioChromeStore = create<StudioChromeState>((set, get) => ({
  recipePickerOpen: false,
  shortcutsOpen: false,
  setRecipePickerOpen: (open) =>
    set({ recipePickerOpen: open, shortcutsOpen: open ? false : get().shortcutsOpen }),
  setShortcutsOpen: (open) =>
    set({ shortcutsOpen: open, recipePickerOpen: open ? false : get().recipePickerOpen }),
  toggleShortcuts: () => {
    const next = !get().shortcutsOpen
    set({ shortcutsOpen: next, recipePickerOpen: next ? false : get().recipePickerOpen })
  },
  toggleRecipePicker: () => {
    const next = !get().recipePickerOpen
    set({ recipePickerOpen: next, shortcutsOpen: next ? false : get().shortcutsOpen })
  },
}))
