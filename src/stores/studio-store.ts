import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PipelineConfig, ResizeConfig } from '@/lib/schemas/pipeline-schema'
import {
  applyPreset,
  applyPlatformCropForPreset,
  BUILT_IN_PRESETS,
  mergePipelineWithPartial,
  type CustomPreset,
} from '@/lib/presets'
import { getActivePlatformWorkflow, resolvePlatformPresetId, type PlatformPreset } from '@/lib/platform-presets'
import {
  pickPrimaryWorkflowVariant,
  processPlatformWorkflowVariants,
} from '@/lib/platform-workflow-process'
import {
  buildMultiFormatWorkflow,
  multiFormatPrimaryVariantId,
} from '@/lib/multi-format'
import type { WorkflowVariantResult } from '@/lib/image/types'
import { detectFormatFromBuffer } from '@/lib/image/format-detection'
import {
  normalizeIncomingImages,
  type IncomingImage,
} from '@/lib/image/folder-drop'
import { applyIdOrder, idsInSameOrder } from '@/lib/queue-order'
import { createPreviewObjectUrl, needsWasmPreview } from '@/lib/image/browser-display'
import { getImageDimensions } from '@/lib/image/dimensions'
import { normalizeResizeConfig } from '@/lib/image/resize-compute'
import {
  cancelStudioWorkerJobs,
  createWasmPreviewInWorker,
  processImageInWorker,
} from '@/lib/image/worker-bridge'
import {
  isWorkerPoolCancelError,
  resolveWorkerPoolSize,
} from '@/lib/image/worker-pool'
import { normalizeMozJpegOptions } from '@/lib/image/jpeg-encode'
import { createFullImageCrop } from '@/lib/image/crop-math'
import { getCropSpaceDimensions } from '@/lib/image/transform-space'
import { inspectExif } from '@/lib/image/exif-inspect'
import { prepareFileForProcessing, resolveHeicInputFormat } from '@/lib/image/heic'
import type { ProcessableFile } from '@/lib/image/types'
import type { PipelineHistoryState } from '@/lib/pipeline-history'
import { pipelinesEqual } from '@/lib/pipeline-history'
import {
  applyRedo,
  applyUndo,
  clonePipeline,
  commitPipelineChange,
  initialPipelineHistory,
  normalizePipeline,
  type PipelineChangeOptions,
} from '@/stores/pipeline-change'
import { trackFilesAdded, trackFilesProcessed } from '@/lib/analytics'
import { packBatchChunk } from '@/lib/batch-export'
import { nextWaveTakeCount } from '@/lib/batch-memory'
import {
  fileHasDownloadableResult,
  type PackedBatchZip,
} from '@/lib/download-results'

const HISTORY_DEBOUNCE_MS = 400
const CROP_HISTORY_DEBOUNCE_MS = 300

let historyDebounceTimer: ReturnType<typeof setTimeout> | null = null
let historyDebounceSnapshot: PipelineConfig | null = null
/** Pipeline at crop-session start; committed on Done, restored on Cancel. */
let cropEditSessionSnapshot: PipelineConfig | null = null

function generateId(): string {
  return crypto.randomUUID()
}

type SetState = (
  partial:
    | Partial<StudioState>
    | ((state: StudioState) => Partial<StudioState>),
) => void

function flushDebouncedHistory(set: SetState) {
  const snapshot = historyDebounceSnapshot
  if (!snapshot) return
  historyDebounceSnapshot = null
  if (historyDebounceTimer) {
    clearTimeout(historyDebounceTimer)
    historyDebounceTimer = null
  }
  set((state) => ({
    pipelineHistory: commitPipelineChange(state.pipelineHistory, snapshot, state.pipeline),
  }))
}

function discardDebouncedHistory() {
  historyDebounceSnapshot = null
  if (historyDebounceTimer) {
    clearTimeout(historyDebounceTimer)
    historyDebounceTimer = null
  }
}

function endCropEditSession() {
  cropEditSessionSnapshot = null
}

function isCropOnlyPartial(partial: Partial<PipelineConfig>): boolean {
  const keys = Object.keys(partial) as (keyof PipelineConfig)[]
  return keys.length === 1 && keys[0] === 'crop'
}

function shouldExitCropEditing(partial: Partial<PipelineConfig>): boolean {
  return partial.rotate !== undefined || partial.flip !== undefined
}

function replacePipeline(
  set: SetState,
  get: () => StudioState,
  next: PipelineConfig,
  options?: PipelineChangeOptions & { historyDebounceMs?: number },
) {
  const previous = get().pipeline
  const normalized = normalizePipeline(next)

  set({
    pipeline: normalized,
    isPipelineModified: true,
    ...(options?.exitCropEditing ? { isCropEditing: false } : {}),
  })

  if (options?.recordHistory === false) return

  const debounceMs = options?.historyDebounceMs
  if (debounceMs != null && debounceMs > 0) {
    if (!historyDebounceSnapshot) {
      historyDebounceSnapshot = clonePipeline(previous)
    }
    if (historyDebounceTimer) clearTimeout(historyDebounceTimer)
    historyDebounceTimer = setTimeout(() => {
      historyDebounceTimer = null
      const snapshot = historyDebounceSnapshot
      historyDebounceSnapshot = null
      if (!snapshot) return
      set((state) => ({
        pipelineHistory: commitPipelineChange(state.pipelineHistory, snapshot, state.pipeline),
      }))
    }, debounceMs)
    return
  }

  flushDebouncedHistory(set)
  set((state) => ({
    pipelineHistory: commitPipelineChange(state.pipelineHistory, previous, normalized, options),
  }))
}

interface StudioState {
  files: ProcessableFile[]
  activeFileId: string | null
  pipeline: PipelineConfig
  pipelineHistory: PipelineHistoryState
  isCropEditing: boolean
  activePresetId: string
  isPipelineModified: boolean
  isAdvancedMode: boolean
  isProcessing: boolean
  /** Stop taking new queue IDs; in-flight jobs finish. Distinct from cancel. */
  isPaused: boolean
  /** ZIP every N files: pack numbered ZIPs during encode; Download saves every part. */
  chunkZipEnabled: boolean
  chunkZipParts: PackedBatchZip[]
  isExporting: boolean
  exportProgress: { current: number; total: number } | null
  /** Bumped when a batch starts or is cancelled so in-flight jobs can discard results. */
  processingToken: number
  customPresets: CustomPreset[]

  addFiles: (files: FileList | File[] | IncomingImage[]) => Promise<void>
  removeFile: (id: string) => void
  reorderFiles: (orderedIds: string[]) => void
  clearFiles: () => void
  setActiveFile: (id: string | null) => void
  syncResizeFromActiveFile: () => void
  syncCropFromActiveFile: () => void
  beginCropEdit: () => void
  cancelCropEdit: () => void
  setPipeline: (pipeline: PipelineConfig, options?: PipelineChangeOptions) => void
  updatePipeline: (
    partial: Partial<PipelineConfig>,
    options?: PipelineChangeOptions & { historyDebounceMs?: number },
  ) => void
  commitCropEdit: () => void
  flushPipelineHistory: () => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  applyPresetById: (presetId: string) => void
  resetActivePreset: () => void
  setAdvancedMode: (enabled: boolean) => void
  processFile: (id: string) => Promise<void>
  processAll: () => Promise<void>
  pauseProcessing: () => void
  resumeProcessing: () => void
  cancelProcessing: () => void
  setChunkZipEnabled: (enabled: boolean) => void
  releaseResultOutputsExceptActive: (ids: string[]) => void
  beginExport: (total: number) => void
  setExportProgress: (current: number) => void
  endExport: () => void
  clearChunkZipParts: () => void
  saveCustomPreset: (name: string) => string
  updateCustomPreset: (
    id: string,
    patch: { name?: string; config?: Partial<PipelineConfig> },
  ) => void
  deleteCustomPreset: (id: string) => void
  importPipelineConfig: (config: PipelineConfig) => void
}

function revokeUrl(url?: string) {
  if (url) URL.revokeObjectURL(url)
}

function revokePreviewUrl(previewUrl?: string, resultUrl?: string) {
  if (previewUrl && previewUrl !== resultUrl) revokeUrl(previewUrl)
}

function revokeWorkflowResults(results?: WorkflowVariantResult[]) {
  if (!results) return
  for (const variant of results) {
    revokePreviewUrl(variant.previewUrl, variant.resultUrl)
    revokeUrl(variant.resultUrl)
  }
}

function revokeFileResults(file: ProcessableFile) {
  revokePreviewUrl(file.previewUrl, file.resultUrl)
  revokeUrl(file.resultUrl)
  revokeWorkflowResults(file.workflowResults)
}

function releaseFileOutputs(file: ProcessableFile): ProcessableFile {
  revokeFileResults(file)
  return {
    ...file,
    previewUrl: undefined,
    resultUrl: undefined,
    resultBlob: undefined,
    workflowResults: undefined,
  }
}

function releaseOutputsExceptActive(set: SetState, get: () => StudioState, ids: string[]) {
  const activeId = get().activeFileId
  const idSet = new Set(ids)
  set((state) => ({
    files: state.files.map((file) => {
      if (!idSet.has(file.id) || file.id === activeId) return file
      return releaseFileOutputs(file)
    }),
  }))
}

async function createOriginalPreview(
  file: ProcessableFile,
): Promise<{ url: string; width?: number; height?: number }> {
  if (needsWasmPreview(file.inputFormat)) {
    const buffer = await file.file.arrayBuffer()
    const preview = await createWasmPreviewInWorker(buffer, file.inputFormat)
    return {
      url: createPreviewObjectUrl(preview.previewBuffer),
      width: preview.width,
      height: preview.height,
    }
  }
  let width = file.originalWidth
  let height = file.originalHeight
  if (width == null || height == null) {
    try {
      const dims = await getImageDimensions(file.file)
      width = dims.width
      height = dims.height
    } catch {
      // dimensions optional — worker decodes at process time
    }
  }
  return { url: URL.createObjectURL(file.file), width, height }
}

async function hydrateActiveOriginalPreview(
  get: () => StudioState,
  set: SetState,
  activeId: string | null,
) {
  set((state) => ({
    files: state.files.map((file) => {
      if (file.id === activeId || !file.originalUrl) return file
      revokeUrl(file.originalUrl)
      return { ...file, originalUrl: undefined }
    }),
  }))

  if (!activeId) return
  const file = get().files.find((item) => item.id === activeId)
  if (!file || file.originalUrl) return

  try {
    const preview = await createOriginalPreview(file)
    if (get().activeFileId !== activeId) {
      revokeUrl(preview.url)
      return
    }
    set((state) => ({
      files: state.files.map((item) =>
        item.id === activeId
          ? {
              ...item,
              originalUrl: preview.url,
              originalWidth: preview.width ?? item.originalWidth,
              originalHeight: preview.height ?? item.originalHeight,
            }
          : item,
      ),
    }))
  } catch {
    // preview optional — queue falls back to the file icon
  }
}

/** Clear processed outputs so the next Process/Re-process run uses the current pipeline. */
function invalidateDoneResults(set: SetState, get: () => StudioState) {
  const hasDone = get().files.some((f) => f.status === 'done')
  const hasPacked = get().chunkZipParts.length > 0
  if (!hasDone && !hasPacked) return
  set((state) => ({
    chunkZipParts: [],
    files: state.files.map((f) => {
      if (f.status !== 'done') return f
      revokeFileResults(f)
      return {
        ...f,
        status: 'pending' as const,
        progress: 0,
        error: undefined,
        previewUrl: undefined,
        resultUrl: undefined,
        resultBlob: undefined,
        resultName: undefined,
        stats: undefined,
        workflowResults: undefined,
      }
    }),
  }))
}

/** Live encode queue so files added mid-batch join the current worker pool. */
const processIdQueue: string[] = []
let processPumpRunning = false
let chunkZipPart = 0
let chunkZipSession = false

function resetChunkZipSession() {
  chunkZipPart = 0
  chunkZipSession = false
}

function enqueueProcessIds(ids: string[]): void {
  const queued = new Set(processIdQueue)
  for (const id of ids) {
    if (queued.has(id)) continue
    processIdQueue.push(id)
    queued.add(id)
  }
}

function clearProcessIdQueue(): void {
  processIdQueue.length = 0
}

async function processPendingByIds(
  get: () => StudioState,
  set: SetState,
  ids: string[],
): Promise<void> {
  if (get().isCropEditing || ids.length === 0) return
  enqueueProcessIds(ids)
  await pumpProcessQueue(get, set)
}

async function pumpProcessQueue(get: () => StudioState, set: SetState): Promise<void> {
  if (processPumpRunning) return
  if (get().isCropEditing) {
    clearProcessIdQueue()
    return
  }
  if (get().isPaused) return
  if (processIdQueue.length === 0) return

  if (!chunkZipSession) {
    chunkZipPart = get().chunkZipParts.length
    chunkZipSession = true
  }

  processPumpRunning = true
  const token = get().processingToken + 1
  set({ isProcessing: true, processingToken: token })

  let succeeded = 0
  let failed = 0
  let attempted = 0
  const concurrency = resolveWorkerPoolSize()

  const runOne = async (id: string) => {
    if (get().processingToken !== token || get().isCropEditing) return
    const file = get().files.find((f) => f.id === id)
    if (!file || (file.status !== 'pending' && file.status !== 'error')) return
    attempted += 1
    await get().processFile(id)
    if (get().processingToken !== token) return
    const updated = get().files.find((f) => f.id === id)
    if (updated?.status === 'done') succeeded += 1
    else if (updated?.status === 'error') failed += 1
  }

  const exportWave = async (waveIds: string[]) => {
    if (!get().chunkZipEnabled || get().processingToken !== token || get().isCropEditing) {
      return
    }
    const toZip = get().files.filter(
      (file) => waveIds.includes(file.id) && fileHasDownloadableResult(file),
    )
    if (toZip.length === 0) return
    chunkZipPart += 1
    try {
      const packed = await packBatchChunk(toZip, chunkZipPart, get().activePresetId)
      if (get().processingToken !== token) return
      set((state) => ({
        chunkZipParts: [...state.chunkZipParts, packed],
      }))
      releaseOutputsExceptActive(
        set,
        get,
        toZip.map((file) => file.id),
      )
    } catch {
      // Keep blobs so the user can download manually.
    }
  }

  try {
    do {
      if (get().processingToken !== token || get().isCropEditing || get().isPaused) break

      const chunkEnabled = get().chunkZipEnabled
      let remainingInWave = chunkEnabled
        ? nextWaveTakeCount(processIdQueue.length, true)
        : Number.POSITIVE_INFINITY
      const waveCompleted: string[] = []

      const drain = async () => {
        while (
          remainingInWave > 0 &&
          get().processingToken === token &&
          !get().isCropEditing &&
          !get().isPaused
        ) {
          const id = processIdQueue.shift()
          if (!id) return
          remainingInWave -= 1
          await runOne(id)
          waveCompleted.push(id)
        }
      }

      await Promise.all(Array.from({ length: concurrency }, () => drain()))
      await exportWave(waveCompleted)
    } while (
      processIdQueue.length > 0 &&
      get().processingToken === token &&
      !get().isCropEditing &&
      !get().isPaused
    )
  } finally {
    if (get().processingToken === token) {
      processPumpRunning = false
      set({ isProcessing: false })
    }
  }

  if (processIdQueue.length === 0 && !get().isPaused) {
    chunkZipSession = false
  }

  if (
    processIdQueue.length > 0 &&
    get().processingToken === token &&
    !get().isCropEditing &&
    !get().isPaused
  ) {
    await pumpProcessQueue(get, set)
    return
  }

  if (attempted === 0) return

  const { pipeline, activePresetId } = get()
  trackFilesProcessed({
    file_count: attempted,
    succeeded,
    failed,
    output_format: pipeline.encode.format,
    preset_id: activePresetId,
  })
}

export const useStudioStore = create<StudioState>()(
  persist(
    (set, get) => ({
      files: [],
      activeFileId: null,
      pipeline: applyPreset(BUILT_IN_PRESETS[0]),
      pipelineHistory: initialPipelineHistory(),
      isCropEditing: false,
      activePresetId: 'web-optimized',
      isPipelineModified: false,
      isAdvancedMode: false,
      isProcessing: false,
      isPaused: false,
      chunkZipEnabled: false,
      chunkZipParts: [],
      isExporting: false,
      exportProgress: null,
      processingToken: 0,
      customPresets: [],

      addFiles: async (fileList) => {
        const incoming = normalizeIncomingImages(fileList)
        const newFiles: ProcessableFile[] = []

        for (const item of incoming) {
          const file = item.file
          let workingFile = file
          let buffer = await file.arrayBuffer()
          let inputFormat = detectFormatFromBuffer(buffer, file.name)
          inputFormat = await resolveHeicInputFormat(file, inputFormat)
          let sourceByteSize: number | undefined
          const exif = inspectExif(buffer)

          if (inputFormat === 'heic') {
            try {
              const prepared = await prepareFileForProcessing(file, inputFormat)
              workingFile = prepared.file
              inputFormat = prepared.inputFormat
              sourceByteSize = prepared.sourceByteSize
              buffer = await workingFile.arrayBuffer()
            } catch (error) {
              const message =
                error instanceof Error ? error.message : 'Could not decode HEIC image'
              newFiles.push({
                id: generateId(),
                file,
                name: file.name,
                relativePath: item.relativePath,
                inputFormat: 'heic',
                status: 'error',
                progress: 0,
                error: message,
                exif,
              })
              continue
            }
          }

          let originalUrl: string | undefined
          let originalWidth: number | undefined
          let originalHeight: number | undefined
          const willBeActive = !get().activeFileId && newFiles.length === 0

          if (needsWasmPreview(inputFormat)) {
            try {
              const preview = await createWasmPreviewInWorker(buffer, inputFormat)
              originalWidth = preview.width
              originalHeight = preview.height
              if (willBeActive) {
                originalUrl = createPreviewObjectUrl(preview.previewBuffer)
              }
            } catch {
              // Fallback: file still processable; preview may be blank until output is ready
              if (willBeActive) {
                originalUrl = URL.createObjectURL(workingFile)
              }
            }
          } else {
            if (willBeActive) {
              originalUrl = URL.createObjectURL(workingFile)
            }
            try {
              const dims = await getImageDimensions(workingFile)
              originalWidth = dims.width
              originalHeight = dims.height
            } catch {
              // dimensions optional — worker decodes at process time
            }
          }

          newFiles.push({
            id: generateId(),
            file: workingFile,
            name: workingFile.name,
            relativePath: item.relativePath,
            inputFormat,
            sourceByteSize,
            status: 'pending',
            progress: 0,
            originalUrl,
            originalWidth,
            originalHeight,
            exif,
          })
        }

        set((prev) => {
          const activeFileId = prev.activeFileId ?? newFiles[0]?.id ?? null
          const activeFile = [...prev.files, ...newFiles].find((f) => f.id === activeFileId)
          const shouldSyncCrop =
            prev.pipeline.crop.enabled &&
            !prev.activeFileId &&
            activeFile?.originalWidth != null &&
            activeFile.originalHeight != null
          const cropSpace =
            activeFile?.originalWidth != null && activeFile.originalHeight != null
              ? getCropSpaceDimensions(
                  activeFile.originalWidth,
                  activeFile.originalHeight,
                  prev.pipeline.rotate,
                )
              : null

          return {
            files: [...prev.files, ...newFiles],
            activeFileId,
            ...(shouldSyncCrop && cropSpace
              ? {
                  pipeline: {
                    ...prev.pipeline,
                    crop: createFullImageCrop(cropSpace.width, cropSpace.height),
                  },
                }
              : {}),
          }
        })

        void hydrateActiveOriginalPreview(get, set, get().activeFileId)

        const added = newFiles.filter((file) => file.status !== 'error')
        if (added.length > 0) {
          trackFilesAdded({
            file_count: added.length,
            has_heic: added.some((file) => file.inputFormat === 'heic'),
          })
        }

        // Hybrid: auto-process newly added files with the active preset.
        if (!get().isCropEditing) {
          const autoIds = added
            .filter((file) => file.status === 'pending')
            .map((file) => file.id)
          if (autoIds.length > 0) {
            void processPendingByIds(get, set, autoIds)
          }
        }
      },

      removeFile: (id) => {
        if (get().isCropEditing) return
        const wasActive = get().activeFileId === id
        set((state) => {
          const file = state.files.find((f) => f.id === id)
          revokeUrl(file?.originalUrl)
          if (file) revokeFileResults(file)
          const files = state.files.filter((f) => f.id !== id)
          return {
            files,
            activeFileId:
              state.activeFileId === id ? (files[0]?.id ?? null) : state.activeFileId,
          }
        })
        if (wasActive) {
          void hydrateActiveOriginalPreview(get, set, get().activeFileId)
        }
      },

      reorderFiles: (orderedIds) => {
        if (get().isCropEditing) return
        set((state) => {
          const files = applyIdOrder(state.files, orderedIds)
          if (idsInSameOrder(state.files.map((file) => file.id), files.map((file) => file.id))) {
            return state
          }
          return { files }
        })
      },

      clearFiles: () => {
        endCropEditSession()
        discardDebouncedHistory()
        clearProcessIdQueue()
        processPumpRunning = false
        resetChunkZipSession()
        if (get().isProcessing) {
          cancelStudioWorkerJobs()
        }
        get().files.forEach((f) => {
          revokeUrl(f.originalUrl)
          revokeFileResults(f)
        })
        set({
          files: [],
          activeFileId: null,
          isCropEditing: false,
          isProcessing: false,
          isPaused: false,
          isExporting: false,
          exportProgress: null,
          chunkZipParts: [],
          processingToken: get().processingToken + 1,
        })
      },

      setActiveFile: (id) => {
        if (get().isCropEditing && id !== get().activeFileId) return
        const file = get().files.find((f) => f.id === id)
        set({ activeFileId: id })
        void hydrateActiveOriginalPreview(get, set, id)

        if (!file?.originalWidth || !file.originalHeight) return

        const resizePatch: Partial<ResizeConfig> = {}
        if (
          get().pipeline.resize.mode === 'exact' &&
          !get().pipeline.resize.lockTargetDimensions
        ) {
          resizePatch.width = file.originalWidth
          resizePatch.height = file.originalHeight
        }

        const cropSpace = getCropSpaceDimensions(
          file.originalWidth,
          file.originalHeight,
          get().pipeline.rotate,
        )
        replacePipeline(
          set,
          get,
          {
            ...get().pipeline,
            resize: { ...get().pipeline.resize, ...resizePatch },
            crop: get().pipeline.crop.enabled
              ? createFullImageCrop(cropSpace.width, cropSpace.height)
              : get().pipeline.crop,
          },
          { recordHistory: false },
        )
      },

      syncResizeFromActiveFile: () => {
        const file = get().files.find((f) => f.id === get().activeFileId)
        if (!file?.originalWidth || !file.originalHeight) return
        set((state) => ({
          pipeline: {
            ...state.pipeline,
            resize: {
              ...state.pipeline.resize,
              enabled: true,
              width: file.originalWidth!,
              height: file.originalHeight!,
              percentage: 100,
            },
          },
          isPipelineModified: true,
        }))
        if (!get().isCropEditing) {
          invalidateDoneResults(set, get)
        }
      },

      syncCropFromActiveFile: () => {
        const file = get().files.find((f) => f.id === get().activeFileId)
        if (!file?.originalWidth || !file.originalHeight) return
        const cropSpace = getCropSpaceDimensions(
          file.originalWidth,
          file.originalHeight,
          get().pipeline.rotate,
        )
        replacePipeline(set, get, {
          ...get().pipeline,
          crop: createFullImageCrop(cropSpace.width, cropSpace.height),
        })
        if (!get().isCropEditing) {
          invalidateDoneResults(set, get)
        }
      },

      beginCropEdit: () => {
        if (get().isCropEditing) return
        flushDebouncedHistory(set)
        cropEditSessionSnapshot = clonePipeline(get().pipeline)
        set({ isCropEditing: true })
      },

      cancelCropEdit: () => {
        if (!get().isCropEditing) return
        discardDebouncedHistory()
        const snapshot = cropEditSessionSnapshot
        endCropEditSession()
        if (snapshot) {
          set({
            pipeline: normalizePipeline(snapshot),
            isCropEditing: false,
            isPipelineModified: true,
          })
          return
        }
        set({ isCropEditing: false })
      },

      setPipeline: (pipeline, options) => {
        if (get().isCropEditing) return
        replacePipeline(set, get, pipeline, options)
        invalidateDoneResults(set, get)
      },

      updatePipeline: (partial, options) => {
        const state = get()
        if (state.isCropEditing) {
          if (!isCropOnlyPartial(partial)) return
          options = { ...options, recordHistory: false, historyDebounceMs: undefined }
        }
        let next: PipelineConfig = { ...state.pipeline, ...partial }

        if (
          partial.rotate !== undefined &&
          partial.rotate !== state.pipeline.rotate &&
          next.crop.enabled
        ) {
          const file = state.files.find((f) => f.id === state.activeFileId)
          if (file?.originalWidth != null && file.originalHeight != null) {
            const cropSpace = getCropSpaceDimensions(
              file.originalWidth,
              file.originalHeight,
              partial.rotate,
            )
            next = {
              ...next,
              crop: createFullImageCrop(cropSpace.width, cropSpace.height),
            }
          }
        }

        const exitCrop =
          options?.exitCropEditing ?? shouldExitCropEditing(partial)
        replacePipeline(set, get, next, {
          ...options,
          exitCropEditing: exitCrop,
          historyDebounceMs: state.isCropEditing
            ? undefined
            : (options?.historyDebounceMs ??
              (partial.crop !== undefined ? CROP_HISTORY_DEBOUNCE_MS : undefined) ??
              (partial.filters !== undefined ? HISTORY_DEBOUNCE_MS : undefined)),
        })
        // Crop-session edits stay live until Done; don't invalidate mid-edit.
        if (!get().isCropEditing) {
          invalidateDoneResults(set, get)
        }
      },

      flushPipelineHistory: () => {
        if (get().isCropEditing) return
        flushDebouncedHistory(set)
      },

      commitCropEdit: () => {
        if (!get().isCropEditing) return
        discardDebouncedHistory()
        const sessionStart = cropEditSessionSnapshot
        const current = get().pipeline
        endCropEditSession()
        if (sessionStart && !pipelinesEqual(sessionStart, current)) {
          set((state) => ({
            pipelineHistory: commitPipelineChange(
              state.pipelineHistory,
              sessionStart,
              current,
            ),
            isCropEditing: false,
            isPipelineModified: true,
          }))
          invalidateDoneResults(set, get)
          return
        }
        set({ isCropEditing: false })
      },

      undo: () => {
        if (get().isCropEditing) return
        flushDebouncedHistory(set)
        const { pipelineHistory, pipeline } = get()
        const result = applyUndo(pipelineHistory, pipeline)
        if (!result.pipeline) return
        set({
          pipelineHistory: result.history,
          pipeline: normalizePipeline(result.pipeline),
          isPipelineModified: true,
          isCropEditing: false,
        })
        invalidateDoneResults(set, get)
      },

      redo: () => {
        if (get().isCropEditing) return
        flushDebouncedHistory(set)
        const { pipelineHistory, pipeline } = get()
        const result = applyRedo(pipelineHistory, pipeline)
        if (!result.pipeline) return
        set({
          pipelineHistory: result.history,
          pipeline: normalizePipeline(result.pipeline),
          isPipelineModified: true,
          isCropEditing: false,
        })
        invalidateDoneResults(set, get)
      },

      canUndo: () => {
        if (get().isCropEditing) return false
        return (
          get().pipelineHistory.past.length > 0 || historyDebounceSnapshot != null
        )
      },

      canRedo: () => {
        if (get().isCropEditing) return false
        return get().pipelineHistory.future.length > 0
      },

      applyPresetById: (presetId) => {
        if (get().isCropEditing) return
        flushDebouncedHistory(set)
        const resolvedId = resolvePlatformPresetId(presetId)
        const builtIn = BUILT_IN_PRESETS.find((p) => p.id === resolvedId)
        if (builtIn) {
          const prev = get().pipeline
          let next = applyPreset(builtIn)
          const platformPreset = builtIn as PlatformPreset
          const activeFile = get().files.find((f) => f.id === get().activeFileId)
          if (
            platformPreset.category === 'platform' &&
            platformPreset.platform?.autoCrop &&
            activeFile?.originalWidth != null &&
            activeFile.originalHeight != null
          ) {
            next = applyPlatformCropForPreset(
              next,
              platformPreset,
              activeFile.originalWidth,
              activeFile.originalHeight,
              next.rotate,
            )
          }
          const history = get().pipelineHistory
          set({
            pipeline: next,
            pipelineHistory: commitPipelineChange(history, prev, next),
            activePresetId: resolvedId,
            isPipelineModified: false,
            isCropEditing: false,
          })
          invalidateDoneResults(set, get)
          return
        }
        const custom = get().customPresets.find((p) => p.id === presetId)
        if (custom) {
          const prev = get().pipeline
          const history = get().pipelineHistory
          const next = mergePipelineWithPartial(custom.config)
          set({
            pipeline: next,
            pipelineHistory: commitPipelineChange(history, prev, next),
            activePresetId: presetId,
            isPipelineModified: false,
            isCropEditing: false,
          })
          invalidateDoneResults(set, get)
        }
      },

      resetActivePreset: () => {
        get().applyPresetById(get().activePresetId)
      },

      setAdvancedMode: (enabled) => set({ isAdvancedMode: enabled }),

      processFile: async (id) => {
        if (get().isCropEditing) return
        const state = get()
        const fileEntry = state.files.find((f) => f.id === id)
        if (!fileEntry) return
        const token = state.processingToken

        set({
          files: state.files.map((f) =>
            f.id === id ? { ...f, status: 'processing' as const, progress: 0, error: undefined } : f,
          ),
        })

        const discardIfStale = () => get().processingToken !== token

        try {
          const { file: processFile, inputFormat: processFormat, sourceByteSize } =
            await prepareFileForProcessing(fileEntry.file, fileEntry.inputFormat)
          if (discardIfStale()) return

          const buffer = await processFile.arrayBuffer()
          if (discardIfStale()) return

          const originalByteSize =
            fileEntry.sourceByteSize ?? sourceByteSize ?? buffer.byteLength
          const pipeline = get().pipeline
          const platformWorkflow = getActivePlatformWorkflow(get().activePresetId)
          const multiFormatWorkflow = platformWorkflow
            ? null
            : buildMultiFormatWorkflow(pipeline)
          const workflow = platformWorkflow ?? multiFormatWorkflow

          if (workflow) {
            const workflowResults = await processPlatformWorkflowVariants({
              fileId: id,
              buffer,
              fileName: processFile.name,
              inputFormat: processFormat as ProcessableFile['inputFormat'],
              originalByteSize,
              sourceWidth: fileEntry.originalWidth,
              sourceHeight: fileEntry.originalHeight,
              basePipeline: pipeline,
              workflow,
              onProgress: (progress) => {
                if (discardIfStale()) return
                set((s) => ({
                  files: s.files.map((f) => (f.id === id ? { ...f, progress } : f)),
                }))
              },
            })

            if (discardIfStale()) {
              revokeWorkflowResults(workflowResults)
              return
            }

            const primary = pickPrimaryWorkflowVariant(
              workflowResults,
              multiFormatWorkflow
                ? multiFormatPrimaryVariantId(pipeline.outputFormat)
                : platformWorkflow?.previewVariantId,
            )

            set((s) => ({
              files: s.files.map((f) => {
                if (f.id !== id) return f
                revokeFileResults(f)
                return {
                  ...f,
                  status: 'done' as const,
                  progress: 100,
                  workflowResults,
                  resultBlob: primary.blob,
                  previewUrl: primary.previewUrl,
                  resultUrl: primary.resultUrl,
                  resultName: primary.outputName,
                  stats: primary.stats,
                  sourceByteSize: f.sourceByteSize ?? sourceByteSize,
                }
              }),
            }))
          } else {
            const result = await processImageInWorker(
              {
                id,
                buffer,
                fileName: processFile.name,
                inputFormat: processFormat as ProcessableFile['inputFormat'],
                pipeline,
              },
              (progress) => {
                if (discardIfStale()) return
                set((s) => ({
                  files: s.files.map((f) => (f.id === id ? { ...f, progress } : f)),
                }))
              },
            )

            if (discardIfStale()) return

            const blob = new Blob([result.buffer], { type: result.mimeType })
            const resultUrl = URL.createObjectURL(blob)
            const previewUrl = result.previewBuffer
              ? createPreviewObjectUrl(result.previewBuffer)
              : resultUrl
            const stats = {
              ...result.stats,
              originalSize: originalByteSize,
              savingsPercent:
                originalByteSize > 0
                  ? ((originalByteSize - result.stats.outputSize) / originalByteSize) * 100
                  : result.stats.savingsPercent,
            }

            if (discardIfStale()) {
              revokePreviewUrl(previewUrl, resultUrl)
              revokeUrl(resultUrl)
              return
            }

            set((s) => ({
              files: s.files.map((f) => {
                if (f.id !== id) return f
                revokeFileResults(f)
                return {
                  ...f,
                  status: 'done' as const,
                  progress: 100,
                  workflowResults: undefined,
                  resultBlob: blob,
                  previewUrl,
                  resultUrl,
                  resultName: result.outputName,
                  stats,
                  sourceByteSize: f.sourceByteSize ?? sourceByteSize,
                }
              }),
            }))
          }
        } catch (error) {
          if (discardIfStale() || isWorkerPoolCancelError(error)) {
            set((s) => ({
              files: s.files.map((f) =>
                f.id === id && f.status === 'processing'
                  ? { ...f, status: 'pending' as const, progress: 0, error: undefined }
                  : f,
              ),
            }))
            return
          }
          const message = error instanceof Error ? error.message : 'Processing failed'
          set((s) => ({
            files: s.files.map((f) =>
              f.id === id ? { ...f, status: 'error' as const, error: message } : f,
            ),
          }))
        }
      },

      processAll: async () => {
        if (get().isCropEditing) return
        if (get().isPaused) set({ isPaused: false })
        const pendingIds = get()
          .files.filter((f) => f.status === 'pending' || f.status === 'error')
          .map((f) => f.id)
        await processPendingByIds(get, set, pendingIds)
      },

      pauseProcessing: () => {
        if (!get().isProcessing || get().isPaused) return
        set({ isPaused: true })
      },

      resumeProcessing: () => {
        if (!get().isPaused) return
        set({ isPaused: false })
        void pumpProcessQueue(get, set)
      },

      cancelProcessing: () => {
        if (!get().isProcessing && !get().isPaused) return
        clearProcessIdQueue()
        processPumpRunning = false
        chunkZipSession = false
        chunkZipPart = get().chunkZipParts.length
        cancelStudioWorkerJobs()
        set((s) => ({
          processingToken: s.processingToken + 1,
          isProcessing: false,
          isPaused: false,
          files: s.files.map((f) =>
            f.status === 'processing'
              ? { ...f, status: 'pending' as const, progress: 0, error: undefined }
              : f,
          ),
        }))
      },

      setChunkZipEnabled: (enabled) => {
        set({ chunkZipEnabled: enabled })
      },

      releaseResultOutputsExceptActive: (ids) => {
        releaseOutputsExceptActive(set, get, ids)
      },

      beginExport: (total) => {
        set({ isExporting: true, exportProgress: { current: 0, total } })
      },

      setExportProgress: (current) => {
        set((state) => ({
          exportProgress: {
            current,
            total: state.exportProgress?.total ?? current,
          },
        }))
      },

      endExport: () => {
        set({ isExporting: false, exportProgress: null })
      },

      clearChunkZipParts: () => {
        set({ chunkZipParts: [] })
      },

      saveCustomPreset: (name) => {
        const id = `custom-${generateId()}`
        set((state) => ({
          customPresets: [
            ...state.customPresets,
            { id, name: name.trim(), config: state.pipeline },
          ],
          activePresetId: id,
          isPipelineModified: false,
        }))
        return id
      },

      updateCustomPreset: (id, patch) => {
        set((state) => ({
          customPresets: state.customPresets.map((preset) => {
            if (preset.id !== id) return preset
            return {
              ...preset,
              ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
              ...(patch.config !== undefined ? { config: patch.config } : {}),
            }
          }),
          isPipelineModified:
            patch.config !== undefined && state.activePresetId === id
              ? false
              : state.isPipelineModified,
        }))
      },

      deleteCustomPreset: (id) => {
        set((state) => ({
          customPresets: state.customPresets.filter((preset) => preset.id !== id),
          activePresetId:
            state.activePresetId === id ? 'web-optimized' : state.activePresetId,
          isPipelineModified:
            state.activePresetId === id ? true : state.isPipelineModified,
        }))
      },

      importPipelineConfig: (config) => {
        if (get().isCropEditing) return
        flushDebouncedHistory(set)
        const prev = get().pipeline
        const next = normalizePipeline(config)
        set({
          pipeline: next,
          pipelineHistory: commitPipelineChange(get().pipelineHistory, prev, next),
          activePresetId: 'web-optimized',
          isPipelineModified: true,
          isCropEditing: false,
        })
        invalidateDoneResults(set, get)
      },
    }),
    {
      name: 'assetmelt-studio',
      partialize: (state) => ({
        pipeline: state.pipeline,
        activePresetId: state.activePresetId,
        isPipelineModified: state.isPipelineModified,
        isAdvancedMode: state.isAdvancedMode,
        customPresets: state.customPresets,
        chunkZipEnabled: state.chunkZipEnabled,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        const persisted = state.pipeline as PipelineConfig & {
          stripMetadata?: boolean
          metadataMode?: string
        }
        const metadataMode =
          persisted.metadataMode === 'strip' ||
          persisted.metadataMode === 'strip-gps' ||
          persisted.metadataMode === 'keep'
            ? persisted.metadataMode
            : persisted.stripMetadata === false
              ? 'keep'
              : 'strip'
        state.pipeline = {
          ...state.pipeline,
          metadataMode,
          alsoExportFormats: Array.isArray(state.pipeline.alsoExportFormats)
            ? state.pipeline.alsoExportFormats.filter(
                (fmt): fmt is 'avif' | 'webp' | 'jpeg' =>
                  fmt === 'avif' || fmt === 'webp' || fmt === 'jpeg',
              )
            : [],
          resize: normalizeResizeConfig(
            state.pipeline.resize as ResizeConfig & Record<string, unknown>,
          ),
          sizeBudget: {
            ...{
              enabled: false,
              targetBytes: 102_400,
              allowResize: true,
            },
            ...state.pipeline.sizeBudget,
          },
          crop: {
            ...{
              aspectRatio: 'free' as const,
              enabled: false,
              x: 0,
              y: 0,
              width: 100,
              height: 100,
            },
            ...state.pipeline.crop,
          },
        }
        if (
          state.pipeline.encode.format === 'jpeg' &&
          typeof state.pipeline.encode.options.color_space === 'string'
        ) {
          state.pipeline = {
            ...state.pipeline,
            encode: {
              format: 'jpeg',
              options: normalizeMozJpegOptions(
                state.pipeline.encode.options as Record<string, unknown>,
              ),
            },
          }
        }
        if (state.activePresetId === 'custom') {
          state.activePresetId = 'web-optimized'
          state.isPipelineModified = true
        }
        state.activePresetId = resolvePlatformPresetId(state.activePresetId)
        const presetExists =
          BUILT_IN_PRESETS.some((preset) => preset.id === state.activePresetId) ||
          state.customPresets.some((preset) => preset.id === state.activePresetId)
        if (!presetExists) {
          state.activePresetId = 'web-optimized'
        }
        if (typeof state.chunkZipEnabled !== 'boolean') {
          state.chunkZipEnabled = false
        }
      },
    },
  ),
)
