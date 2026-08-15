/** Accept attribute shared by DropZone, Add files, and paste handlers. */
export const STUDIO_IMAGE_ACCEPT = 'image/*,.heic,.heif,.jxl,.qoi,.tif,.tiff'

/**
 * Open a hidden file input and resolve with the selected image files.
 * Resolves to an empty array if the user cancels.
 * Folders are added by dropping them on Studio — a directory input triggers a
 * browser “upload this folder?” prompt and is easy to cancel by accident.
 */
export function pickImageFiles(): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.accept = STUDIO_IMAGE_ACCEPT
    input.className = 'sr-only'
    input.tabIndex = -1

    let settled = false
    const finish = (files: File[]) => {
      if (settled) return
      settled = true
      input.remove()
      resolve(files)
    }

    input.addEventListener('change', () => {
      finish(input.files ? Array.from(input.files) : [])
    })
    input.addEventListener('cancel', () => finish([]))

    window.addEventListener(
      'focus',
      () => {
        window.setTimeout(() => finish(input.files ? Array.from(input.files) : []), 400)
      },
      { once: true },
    )

    document.body.appendChild(input)
    input.click()
  })
}
