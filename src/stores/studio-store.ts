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
  cancelProcessing: () => void
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

/** Clear processed outputs so the next Process/Re-process run uses the current pipeline. */
function invalidateDoneResults(set: SetState, get: () => StudioState) {
  const hasDone = get().files.some((f) => f.status === 'done')
  if (!hasDone) return
  set((state) => ({
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
  if (processIdQueue.length === 0) return

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

  const drain = async () => {
    while (get().processingToken === token && !get().isCropEditing) {
      const id = processIdQueue.shift()
      if (!id) return
      await runOne(id)
    }
  }

  try {
    do {
      if (get().processingToken !== token || get().isCropEditing) break
      await Promise.all(Array.from({ length: concurrency }, () => drain()))
    } while (
      processIdQueue.length > 0 &&
      get().processingToken === token &&
      !get().isCropEditing
    )
  } finally {
    if (get().processingToken === token) {
      processPumpRunning = false
      set({ isProcessing: false })
    }
  }

  if (
    processIdQueue.length > 0 &&
    get().processingToken === token &&
    !get().isCropEditing
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

          let originalUrl: string
          let originalWidth: number | undefined
          let originalHeight: number | undefined

          if (needsWasmPreview(inputFormat)) {
            try {
              const preview = await createWasmPreviewInWorker(buffer, inputFormat)
              originalUrl = createPreviewObjectUrl(preview.previewBuffer)
              originalWidth = preview.width
              originalHeight = preview.height
            } catch {
              // Fallback: file still processable; preview may be blank until output is ready
              originalUrl = URL.createObjectURL(workingFile)
            }
          } else {
            originalUrl = URL.createObjectURL(workingFile)
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
          processingToken: get().processingToken + 1,
        })
      },

      setActiveFile: (id) => {
        if (get().isCropEditing && id !== get().activeFileId) return
        const file = get().files.find((f) => f.id === id)
        set({ activeFileId: id })

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
        const pendingIds = get()
          .files.filter((f) => f.status === 'pending' || f.status === 'error')
          .map((f) => f.id)
        await processPendingByIds(get, set, pendingIds)
      },

      cancelProcessing: () => {
        if (!get().isProcessing) return
        clearProcessIdQueue()
        processPumpRunning = false
        cancelStudioWorkerJobs()
        set((s) => ({
          processingToken: s.processingToken + 1,
          isProcessing: false,
          files: s.files.map((f) =>
            f.status === 'processing'
              ? { ...f, status: 'pending' as const, progress: 0, error: undefined }
              : f,
          ),
        }))
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
      },
    },
  ),
)
