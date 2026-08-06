/** Accept attribute shared by DropZone, Add files, and paste handlers. */
export const STUDIO_IMAGE_ACCEPT = 'image/*,.heic,.heif,.jxl,.qoi'

/**
 * Open a hidden file input and resolve with the selected image files.
 * Resolves to an empty array if the user cancels.
 */
export function pickImageFiles(): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.accept = STUDIO_IMAGE_ACCEPT

    let settled = false
    const finish = (files: File[]) => {
      if (settled) return
      settled = true
      resolve(files)
    }

    input.addEventListener('change', () => {
      finish(input.files ? Array.from(input.files) : [])
    })
    // Chromium: cancel event when the picker is dismissed without a selection.
    input.addEventListener('cancel', () => finish([]))

    // Fallback for browsers without `cancel`: after the window regains focus,
    // wait briefly for a possible `change` before treating it as cancel.
    window.addEventListener(
      'focus',
      () => {
        window.setTimeout(() => finish([]), 400)
      },
      { once: true },
    )

    input.click()
  })
}
