import { create } from 'zustand'

type StudioChromeState = {
  recipePickerOpen: boolean
  shortcutsOpen: boolean
  responsiveExportOpen: boolean
  setRecipePickerOpen: (open: boolean) => void
  setShortcutsOpen: (open: boolean) => void
  setResponsiveExportOpen: (open: boolean) => void
  toggleShortcuts: () => void
  toggleRecipePicker: () => void
}

export const useStudioChromeStore = create<StudioChromeState>((set, get) => ({
  recipePickerOpen: false,
  shortcutsOpen: false,
  responsiveExportOpen: false,
  setRecipePickerOpen: (open) =>
    set({
      recipePickerOpen: open,
      shortcutsOpen: open ? false : get().shortcutsOpen,
      responsiveExportOpen: open ? false : get().responsiveExportOpen,
    }),
  setShortcutsOpen: (open) =>
    set({
      shortcutsOpen: open,
      recipePickerOpen: open ? false : get().recipePickerOpen,
      responsiveExportOpen: open ? false : get().responsiveExportOpen,
    }),
  setResponsiveExportOpen: (open) =>
    set({
      responsiveExportOpen: open,
      recipePickerOpen: open ? false : get().recipePickerOpen,
      shortcutsOpen: open ? false : get().shortcutsOpen,
    }),
  toggleShortcuts: () => {
    const next = !get().shortcutsOpen
    set({
      shortcutsOpen: next,
      recipePickerOpen: next ? false : get().recipePickerOpen,
      responsiveExportOpen: next ? false : get().responsiveExportOpen,
    })
  },
  toggleRecipePicker: () => {
    const next = !get().recipePickerOpen
    set({
      recipePickerOpen: next,
      shortcutsOpen: next ? false : get().shortcutsOpen,
      responsiveExportOpen: next ? false : get().responsiveExportOpen,
    })
  },
}))
