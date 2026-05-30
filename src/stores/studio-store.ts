import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PipelineConfig, ResizeConfig } from '@/lib/schemas/pipeline-schema'
import { createDefaultPipeline } from '@/lib/schemas/pipeline-schema'
import { applyPreset, BUILT_IN_PRESETS, type CustomPreset } from '@/lib/presets'
import { detectFormatFromBuffer, isImageFile } from '@/lib/image/format-detection'
import { createPreviewObjectUrl, needsWasmPreview } from '@/lib/image/browser-display'
import { getImageDimensions } from '@/lib/image/dimensions'
import { normalizeResizeConfig } from '@/lib/image/resize-compute'
import { createWasmPreviewInWorker, processImageInWorker } from '@/lib/image/worker-bridge'
import { normalizeMozJpegOptions } from '@/lib/image/jpeg-encode'
import { createFullImageCrop } from '@/lib/image/crop-math'
import { prepareFileForProcessing } from '@/lib/image/heic'
import type { ProcessableFile } from '@/lib/image/types'

function generateId(): string {
  return crypto.randomUUID()
}

interface StudioState {
  files: ProcessableFile[]
  activeFileId: string | null
  pipeline: PipelineConfig
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
  setPipeline: (pipeline: PipelineConfig) => void
  updatePipeline: (partial: Partial<PipelineConfig>) => void
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

export const useStudioStore = create<StudioState>()(
  persist(
    (set, get) => ({
      files: [],
      activeFileId: null,
      pipeline: applyPreset(BUILT_IN_PRESETS[0]),
      activePresetId: 'web-optimized',
      isPipelineModified: false,
      isAdvancedMode: false,
      isProcessing: false,
      customPresets: [],

      addFiles: async (fileList) => {
        const incoming = Array.from(fileList).filter(isImageFile)
        const newFiles: ProcessableFile[] = []

        for (const file of incoming) {
          const buffer = await file.arrayBuffer()
          const inputFormat = detectFormatFromBuffer(buffer, file.name)
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
              originalUrl = URL.createObjectURL(file)
            }
          } else {
            originalUrl = URL.createObjectURL(file)
            try {
              const dims = await getImageDimensions(file)
              originalWidth = dims.width
              originalHeight = dims.height
            } catch {
              // dimensions optional — worker decodes at process time
            }
          }

          newFiles.push({
            id: generateId(),
            file,
            name: file.name,
            inputFormat,
            status: 'pending',
            progress: 0,
            originalUrl,
            originalWidth,
            originalHeight,
          })
        }

        set((prev) => ({
          files: [...prev.files, ...newFiles],
          activeFileId: prev.activeFileId ?? newFiles[0]?.id ?? null,
        }))
      },

      removeFile: (id) => {
        set((state) => {
          const file = state.files.find((f) => f.id === id)
          revokeUrl(file?.originalUrl)
          revokePreviewUrl(file?.previewUrl, file?.resultUrl)
          revokeUrl(file?.resultUrl)
          const files = state.files.filter((f) => f.id !== id)
          return {
            files,
            activeFileId:
              state.activeFileId === id ? (files[0]?.id ?? null) : state.activeFileId,
          }
        })
      },

      clearFiles: () => {
        get().files.forEach((f) => {
          revokeUrl(f.originalUrl)
          revokePreviewUrl(f.previewUrl, f.resultUrl)
          revokeUrl(f.resultUrl)
        })
        set({ files: [], activeFileId: null })
      },

      setActiveFile: (id) => {
        const file = get().files.find((f) => f.id === id)
        set((state) => {
          if (!file?.originalWidth || !file.originalHeight) {
            return { activeFileId: id }
          }

          const resizePatch: Partial<ResizeConfig> = {}
          if (state.pipeline.resize.mode === 'exact') {
            resizePatch.width = file.originalWidth
            resizePatch.height = file.originalHeight
          }

          return {
            activeFileId: id,
            pipeline: {
              ...state.pipeline,
              resize: { ...state.pipeline.resize, ...resizePatch },
              crop: state.pipeline.crop.enabled
                ? createFullImageCrop(file.originalWidth, file.originalHeight)
                : state.pipeline.crop,
            },
          }
        })
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
      },

      syncCropFromActiveFile: () => {
        const file = get().files.find((f) => f.id === get().activeFileId)
        if (!file?.originalWidth || !file.originalHeight) return
        set((state) => ({
          pipeline: {
            ...state.pipeline,
            crop: createFullImageCrop(file.originalWidth!, file.originalHeight!),
          },
          isPipelineModified: true,
        }))
      },

      setPipeline: (pipeline) =>
        set({
          pipeline: {
            ...pipeline,
            resize: normalizeResizeConfig(pipeline.resize as ResizeConfig & Record<string, unknown>),
          },
          isPipelineModified: true,
        }),

      updatePipeline: (partial) =>
        set((state) => ({
          pipeline: { ...state.pipeline, ...partial },
          isPipelineModified: true,
        })),

      applyPresetById: (presetId) => {
        const builtIn = BUILT_IN_PRESETS.find((p) => p.id === presetId)
        if (builtIn) {
          set({
            pipeline: applyPreset(builtIn),
            activePresetId: presetId,
            isPipelineModified: false,
          })
          return
        }
        const custom = get().customPresets.find((p) => p.id === presetId)
        if (custom) {
          const base = createDefaultPipeline()
          set({
            pipeline: {
              ...base,
              ...custom.config,
              resize: { ...base.resize, ...custom.config.resize },
              crop: { ...base.crop, ...custom.config.crop },
              flip: { ...base.flip, ...custom.config.flip },
              filters: { ...base.filters, ...custom.config.filters },
              sizeBudget: { ...base.sizeBudget, ...custom.config.sizeBudget },
              encode: custom.config.encode ?? base.encode,
            } as PipelineConfig,
            activePresetId: presetId,
            isPipelineModified: false,
          })
        }
      },

      resetActivePreset: () => {
        get().applyPresetById(get().activePresetId)
      },

      setAdvancedMode: (enabled) => set({ isAdvancedMode: enabled }),

      processFile: async (id) => {
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
          const { file: processFile, inputFormat: processFormat } =
            await prepareFileForProcessing(fileEntry.file, fileEntry.inputFormat)
          const buffer = await processFile.arrayBuffer()
          const result = await processImageInWorker(
            {
              id,
              buffer,
              fileName: processFile.name,
              inputFormat: processFormat as ProcessableFile['inputFormat'],
              pipeline: get().pipeline,
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

          set((s) => ({
            files: s.files.map((f) => {
              if (f.id !== id) return f
              revokePreviewUrl(f.previewUrl, f.resultUrl)
              revokeUrl(f.resultUrl)
              return {
                ...f,
                status: 'done' as const,
                progress: 100,
                resultBlob: blob,
                previewUrl,
                resultUrl,
                resultName: result.outputName,
                stats: result.stats,
              }
            }),
            isProcessing: false,
          }))
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
        const { files, processFile } = get()
        const pending = files.filter((f) => f.status !== 'processing')
        for (const file of pending) {
          await processFile(file.id)
        }
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
        set({
          pipeline: config,
          activePresetId: 'web-optimized',
          isPipelineModified: true,
        })
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
        state.pipeline = {
          ...state.pipeline,
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
