import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/analytics', () => ({
  trackFilesAdded: vi.fn(),
  trackFilesProcessed: vi.fn(),
}))

vi.mock('@/lib/image/worker-bridge', () => ({
  createWasmPreviewInWorker: vi.fn(),
  processImageInWorker: vi.fn(async () => ({
    buffer: new ArrayBuffer(8),
    mimeType: 'image/webp',
    outputName: 'out.webp',
    stats: {
      originalSize: 100,
      outputSize: 40,
      originalWidth: 10,
      originalHeight: 10,
      outputWidth: 10,
      outputHeight: 10,
      savingsPercent: 60,
    },
  })),
  cancelStudioWorkerJobs: vi.fn(),
}))

vi.mock('@/lib/image/dimensions', () => ({
  getImageDimensions: vi.fn(async () => ({ width: 10, height: 10 })),
}))

vi.mock('@/lib/image/heic', () => ({
  prepareFileForProcessing: vi.fn(async (file: File, inputFormat: string) => ({
    file,
    inputFormat,
  })),
  resolveHeicInputFormat: vi.fn(async (_file: File, inputFormat: string) => inputFormat),
}))

vi.mock('@/lib/image/format-detection', async () => {
  const actual = await vi.importActual<typeof import('@/lib/image/format-detection')>(
    '@/lib/image/format-detection',
  )
  return {
    ...actual,
    detectFormatFromBuffer: vi.fn(() => 'jpeg'),
    isImageFile: vi.fn(() => true),
  }
})

vi.mock('@/lib/image/browser-display', () => ({
  createPreviewObjectUrl: vi.fn(() => 'blob:preview'),
  needsWasmPreview: vi.fn(() => false),
}))

vi.mock('@/lib/platform-presets', async () => {
  const actual = await vi.importActual<typeof import('@/lib/platform-presets')>(
    '@/lib/platform-presets',
  )
  return {
    ...actual,
    getActivePlatformWorkflow: vi.fn(() => null),
  }
})

import { trackFilesProcessed } from '@/lib/analytics'
import { processImageInWorker } from '@/lib/image/worker-bridge'
import { useStudioStore } from '@/stores/studio-store'

function tinyJpegFile(name = 'photo.jpg') {
  return new File([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], name, {
    type: 'image/jpeg',
  })
}

describe('studio hybrid processing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useStudioStore.setState({
      files: [],
      activeFileId: null,
      isCropEditing: false,
      isProcessing: false,
      isPipelineModified: false,
    })
  })

  afterEach(() => {
    useStudioStore.getState().clearFiles()
  })

  it('auto-processes newly added files', async () => {
    await useStudioStore.getState().addFiles([tinyJpegFile()])

    await vi.waitFor(() => {
      expect(useStudioStore.getState().files[0]?.status).toBe('done')
    })

    expect(processImageInWorker).toHaveBeenCalled()
    expect(trackFilesProcessed).toHaveBeenCalledWith(
      expect.objectContaining({
        file_count: 1,
        succeeded: 1,
        failed: 0,
      }),
    )
  })

  it('skips auto-process while crop editing', async () => {
    useStudioStore.setState({ isCropEditing: true })
    await useStudioStore.getState().addFiles([tinyJpegFile()])

    expect(useStudioStore.getState().files[0]?.status).toBe('pending')
    expect(processImageInWorker).not.toHaveBeenCalled()
  })

  it('marks done results pending when pipeline settings change', async () => {
    await useStudioStore.getState().addFiles([tinyJpegFile()])
    await vi.waitFor(() => {
      expect(useStudioStore.getState().files[0]?.status).toBe('done')
    })

    useStudioStore.getState().updatePipeline({
      metadataMode:
        useStudioStore.getState().pipeline.metadataMode === 'strip' ? 'keep' : 'strip',
    })

    expect(useStudioStore.getState().files[0]?.status).toBe('pending')
    expect(useStudioStore.getState().files[0]?.resultBlob).toBeUndefined()
  })

  it('marks done results pending when applying a preset', async () => {
    await useStudioStore.getState().addFiles([tinyJpegFile()])
    await vi.waitFor(() => {
      expect(useStudioStore.getState().files[0]?.status).toBe('done')
    })

    useStudioStore.getState().applyPresetById('thumbnail')

    expect(useStudioStore.getState().files[0]?.status).toBe('pending')
  })

  it('processAll only runs pending and error files', async () => {
    await useStudioStore.getState().addFiles([tinyJpegFile('a.jpg')])
    await vi.waitFor(() => {
      expect(useStudioStore.getState().files[0]?.status).toBe('done')
    })

    const callsAfterAuto = vi.mocked(processImageInWorker).mock.calls.length
    await useStudioStore.getState().processAll()
    expect(vi.mocked(processImageInWorker).mock.calls.length).toBe(callsAfterAuto)

    useStudioStore.getState().updatePipeline({
      metadataMode:
        useStudioStore.getState().pipeline.metadataMode === 'strip' ? 'keep' : 'strip',
    })
    await useStudioStore.getState().processAll()
    await vi.waitFor(() => {
      expect(useStudioStore.getState().files[0]?.status).toBe('done')
    })
    expect(vi.mocked(processImageInWorker).mock.calls.length).toBeGreaterThan(callsAfterAuto)
  })

  it('processes multiple pending files concurrently', async () => {
    vi.stubGlobal('navigator', { hardwareConcurrency: 4 })
    let live = 0
    let peak = 0
    vi.mocked(processImageInWorker).mockImplementation(async () => {
      live += 1
      peak = Math.max(peak, live)
      await new Promise((resolve) => setTimeout(resolve, 40))
      live -= 1
      return {
        type: 'result' as const,
        id: 'mock',
        buffer: new ArrayBuffer(8),
        mimeType: 'image/webp',
        outputName: 'out.webp',
        stats: {
          originalSize: 100,
          outputSize: 40,
          originalWidth: 10,
          originalHeight: 10,
          outputWidth: 10,
          outputHeight: 10,
          savingsPercent: 60,
        },
      }
    })

    useStudioStore.setState({ isProcessing: false, processingToken: 0, files: [] })
    await useStudioStore.getState().addFiles([
      tinyJpegFile('a.jpg'),
      tinyJpegFile('b.jpg'),
      tinyJpegFile('c.jpg'),
      tinyJpegFile('d.jpg'),
    ])

    await vi.waitFor(() => {
      expect(useStudioStore.getState().files.every((f) => f.status === 'done')).toBe(true)
    })
    expect(peak).toBeGreaterThan(1)
    vi.unstubAllGlobals()
  })

  it('cancelProcessing returns in-flight files to pending', async () => {
    vi.mocked(processImageInWorker).mockImplementation(
      () =>
        new Promise(() => {
          // never resolves
        }),
    )

    useStudioStore.setState({ isProcessing: false, processingToken: 0, files: [] })
    const addPromise = useStudioStore.getState().addFiles([tinyJpegFile('slow.jpg')])

    await vi.waitFor(() => {
      expect(useStudioStore.getState().isProcessing).toBe(true)
      expect(useStudioStore.getState().files[0]?.status).toBe('processing')
    })

    useStudioStore.getState().cancelProcessing()
    expect(useStudioStore.getState().isProcessing).toBe(false)
    expect(useStudioStore.getState().files[0]?.status).toBe('pending')

    await Promise.race([addPromise, new Promise((resolve) => setTimeout(resolve, 50))])
  })
})

describe('studioQueueStatus', () => {
  it('describes processing, stale, and ready states', async () => {
    const { studioQueueStatus } = await import('@/lib/studio-actions')
    expect(studioQueueStatus([])).toBeNull()
    expect(
      studioQueueStatus([{ status: 'processing' }, { status: 'pending' }, { status: 'done' }]),
    ).toBe('Encoding 1 · 1 ready · 1 waiting')
    expect(
      studioQueueStatus([{ status: 'done' }, { status: 'pending' }]),
    ).toBe('Settings changed — re-process to update')
    expect(studioQueueStatus([{ status: 'done' }, { status: 'done' }])).toBe(
      '2 files · 2 ready',
    )
  })
})
