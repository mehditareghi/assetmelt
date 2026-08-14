import type { InputFormat } from '@/lib/image/format-detection'
import type { OutputFormat } from '@/lib/schemas/pipeline-schema'

/** Formats that browsers cannot render in <img>; preview via WASM decode → PNG. */
export const WASM_PREVIEW_FORMATS = new Set<InputFormat | OutputFormat>(['jxl', 'qoi', 'tiff'])

export const PREVIEW_MIME_TYPE = 'image/png'

export function needsWasmPreview(format: InputFormat | OutputFormat): boolean {
  return WASM_PREVIEW_FORMATS.has(format)
}

export function createPreviewObjectUrl(previewBuffer: ArrayBuffer): string {
  return URL.createObjectURL(new Blob([previewBuffer], { type: PREVIEW_MIME_TYPE }))
}
