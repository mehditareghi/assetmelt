import type { PipelineConfig } from '@/lib/schemas/pipeline-schema'
import type { InputFormat } from '@/lib/image/format-detection'

export type ProcessableFileStatus = 'pending' | 'processing' | 'done' | 'error'

export interface SizeBudgetStats {
  targetBytes: number
  met: boolean
  appliedQuality: number
  appliedScale: number
}

export interface ProcessStats {
  originalSize: number
  outputSize: number
  originalWidth: number
  originalHeight: number
  outputWidth: number
  outputHeight: number
  savingsPercent: number
  sizeBudget?: SizeBudgetStats
}

export interface ProcessableFile {
  id: string
  file: File
  name: string
  inputFormat: InputFormat
  status: ProcessableFileStatus
  progress: number
  error?: string
  originalUrl?: string
  originalWidth?: number
  originalHeight?: number
  /** Browser-displayable preview (PNG for JXL/QOI; same as resultUrl otherwise). */
  previewUrl?: string
  resultUrl?: string
  resultBlob?: Blob
  resultName?: string
  stats?: ProcessStats
}

export interface WorkerProcessRequest {
  type: 'process'
  id: string
  buffer: ArrayBuffer
  fileName: string
  inputFormat: InputFormat
  pipeline: PipelineConfig
}

export interface WorkerPreviewRequest {
  type: 'preview'
  id: string
  buffer: ArrayBuffer
  format: InputFormat
}

export interface WorkerPreviewResponse {
  type: 'preview-result'
  id: string
  previewBuffer: ArrayBuffer
  width: number
  height: number
}

export type WorkerInboundMessage = WorkerProcessRequest | WorkerPreviewRequest

export interface WorkerProcessResponse {
  type: 'result'
  id: string
  buffer: ArrayBuffer
  mimeType: string
  outputName: string
  stats: ProcessStats
  /** PNG preview for formats browsers cannot render in <img> (JXL, QOI). */
  previewBuffer?: ArrayBuffer
  previewMimeType?: string
}

export interface WorkerErrorResponse {
  type: 'error'
  id: string
  message: string
}

export interface WorkerProgressResponse {
  type: 'progress'
  id: string
  progress: number
  stage: string
}

export type WorkerResponse =
  | WorkerProcessResponse
  | WorkerPreviewResponse
  | WorkerErrorResponse
  | WorkerProgressResponse
