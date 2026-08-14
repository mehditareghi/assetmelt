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
import type { WorkflowVariantResult } from '@/lib/image/types'
import { detectFormatFromBuffer, isImageFile } from '@/lib/image/format-detection'
import { createPreviewObjectUrl, needsWasmPreview } from '@/lib/image/browser-display'
import { getImageDimensions } from '@/lib/image/dimensions'
import { normalizeResizeConfig } from '@/lib/image/resize-compute'
import { createWasmPreviewInWorker, processImageInWorker } from '@/lib/image/worker-bridge'
import { normalizeMozJpegOptions } from '@/lib/image/jpeg-encode'
import { createFullImageCrop } from '@/lib/image/crop-math'
import { getCropSpaceDimensions } from '@/lib/image/transform-space'
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
  customPresets: CustomPreset[]

  addFiles: (files: FileList | File[]) => Promise<void>
  removeFile: (id: string) => void
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

async function processPendingByIds(
  get: () => StudioState,
  ids: string[],
): Promise<void> {
  if (get().isCropEditing || ids.length === 0) return

  let succeeded = 0
  let failed = 0
  let attempted = 0

  for (const id of ids) {
    if (get().isCropEditing) break
    const file = get().files.find((f) => f.id === id)
    if (!file || (file.status !== 'pending' && file.status !== 'error')) continue
    attempted += 1
    await get().processFile(id)
    const updated = get().files.find((f) => f.id === id)
    if (updated?.status === 'done') succeeded += 1
    else if (updated?.status === 'error') failed += 1
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
      customPresets: [],

      addFiles: async (fileList) => {
        const incoming = Array.from(fileList).filter(isImageFile)
        const newFiles: ProcessableFile[] = []

        for (const file of incoming) {
          let workingFile = file
          let buffer = await file.arrayBuffer()
          let inputFormat = detectFormatFromBuffer(buffer, file.name)
          inputFormat = await resolveHeicInputFormat(file, inputFormat)
          let sourceByteSize: number | undefined

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
                inputFormat: 'heic',
                status: 'error',
                progress: 0,
                error: message,
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
            inputFormat,
            sourceByteSize,
            status: 'pending',
            progress: 0,
            originalUrl,
            originalWidth,
            originalHeight,
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
            void processPendingByIds(get, autoIds)
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

      clearFiles: () => {
        endCropEditSession()
        discardDebouncedHistory()
        get().files.forEach((f) => {
          revokeUrl(f.originalUrl)
          revokeFileResults(f)
        })
        set({ files: [], activeFileId: null, isCropEditing: false, isProcessing: false })
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

        set({
          isProcessing: true,
          files: state.files.map((f) =>
            f.id === id ? { ...f, status: 'processing' as const, progress: 0, error: undefined } : f,
          ),
        })

        try {
          const { file: processFile, inputFormat: processFormat, sourceByteSize } =
            await prepareFileForProcessing(fileEntry.file, fileEntry.inputFormat)
          const buffer = await processFile.arrayBuffer()
          const originalByteSize =
            fileEntry.sourceByteSize ?? sourceByteSize ?? buffer.byteLength
          const pipeline = get().pipeline
          const workflow = getActivePlatformWorkflow(get().activePresetId)

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
                set((s) => ({
                  files: s.files.map((f) => (f.id === id ? { ...f, progress } : f)),
                }))
              },
            })

            const primary = pickPrimaryWorkflowVariant(workflowResults)

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
              isProcessing: false,
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
                set((s) => ({
                  files: s.files.map((f) => (f.id === id ? { ...f, progress } : f)),
                }))
              },
            )

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
              isProcessing: false,
            }))
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Processing failed'
          set((s) => ({
            files: s.files.map((f) =>
              f.id === id ? { ...f, status: 'error' as const, error: message } : f,
            ),
            isProcessing: false,
          }))
        }
      },

      processAll: async () => {
        if (get().isCropEditing) return
        const pendingIds = get()
          .files.filter((f) => f.status === 'pending' || f.status === 'error')
          .map((f) => f.id)
        await processPendingByIds(get, pendingIds)
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
