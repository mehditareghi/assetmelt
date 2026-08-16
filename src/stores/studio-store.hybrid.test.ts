import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/analytics', () => ({
  trackFilesAdded: vi.fn(),
  trackFilesProcessed: vi.fn(),
  trackExportCompleted: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    message: vi.fn(),
  },
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

vi.mock('@/lib/batch-export', () => ({
  packBatchChunk: vi.fn(async (files: { id: string }[], part: number) => ({
    name: `assetmelt-batch-${String(part).padStart(2, '0')}.zip`,
    blob: new Blob(['zip']),
    count: files.length,
    fileIds: files.map((file) => file.id),
  })),
}))

vi.mock('@/lib/download-results', async () => {
  const actual = await vi.importActual<typeof import('@/lib/download-results')>(
    '@/lib/download-results',
  )
  return {
    ...actual,
    downloadProcessedFiles: vi.fn(async (files: { id: string }[]) => ({
      kind: 'zip' as const,
      count: files.length,
    })),
    downloadNamedBlob: vi.fn(),
  }
})

if (typeof URL.createObjectURL !== 'function') {
  let blobUrlN = 0
  URL.createObjectURL = () => `blob:mock-${++blobUrlN}`
  URL.revokeObjectURL = () => {}
}

import { trackFilesProcessed } from '@/lib/analytics'
import { packBatchChunk } from '@/lib/batch-export'
import { setBatchChunkSizeForTests } from '@/lib/batch-memory'
import { downloadNamedBlob, downloadProcessedFiles } from '@/lib/download-results'
import { processImageInWorker } from '@/lib/image/worker-bridge'
import { exportStudioResults } from '@/lib/studio-actions'
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
      isPaused: false,
      chunkZipEnabled: false,
      chunkZipParts: [],
      isExporting: false,
      exportProgress: null,
      isPipelineModified: false,
    })
  })

  afterEach(() => {
    setBatchChunkSizeForTests(null)
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

  it('processes files added while a batch is already running', async () => {
    let releaseFirst!: () => void
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve
    })
    let started = 0
    vi.mocked(processImageInWorker).mockImplementation(async () => {
      started += 1
      if (started === 1) await firstGate
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

    void useStudioStore.getState().addFiles([tinyJpegFile('first.jpg')])
    await vi.waitFor(() => {
      expect(useStudioStore.getState().isProcessing).toBe(true)
    })

    await useStudioStore.getState().addFiles([tinyJpegFile('second.jpg')])
    expect(useStudioStore.getState().files.map((file) => file.name)).toEqual([
      'first.jpg',
      'second.jpg',
    ])

    releaseFirst()
    await vi.waitFor(() => {
      expect(useStudioStore.getState().files.every((file) => file.status === 'done')).toBe(true)
      expect(useStudioStore.getState().isProcessing).toBe(false)
    })
    expect(processImageInWorker).toHaveBeenCalledTimes(2)
  })

  it('reorderFiles permutes the session queue and ZIP filter order', () => {
    useStudioStore.setState({
      files: [
        {
          id: 'a',
          file: tinyJpegFile('a.jpg'),
          name: 'a.jpg',
          inputFormat: 'jpeg',
          status: 'done',
          progress: 100,
          resultBlob: new Blob(['a']),
          resultName: 'a.webp',
        },
        {
          id: 'b',
          file: tinyJpegFile('b.jpg'),
          name: 'b.jpg',
          inputFormat: 'jpeg',
          status: 'done',
          progress: 100,
          resultBlob: new Blob(['b']),
          resultName: 'b.webp',
        },
      ],
      isCropEditing: false,
    })

    useStudioStore.getState().reorderFiles(['b', 'a'])
    expect(useStudioStore.getState().files.map((file) => file.id)).toEqual(['b', 'a'])

    useStudioStore.setState({ isCropEditing: true })
    useStudioStore.getState().reorderFiles(['a', 'b'])
    expect(useStudioStore.getState().files.map((file) => file.id)).toEqual(['b', 'a'])
  })

  it('creates an original preview only for the active file', async () => {
    await useStudioStore.getState().addFiles([tinyJpegFile('a.jpg'), tinyJpegFile('b.jpg')])
    await vi.waitFor(() => {
      expect(useStudioStore.getState().files.every((f) => f.status === 'done')).toBe(true)
    })

    const afterAdd = useStudioStore.getState()
    const active = afterAdd.files.find((f) => f.id === afterAdd.activeFileId)
    const inactive = afterAdd.files.filter((f) => f.id !== afterAdd.activeFileId)
    expect(active?.originalUrl).toBeTruthy()
    expect(inactive.every((f) => !f.originalUrl)).toBe(true)

    const nextId = inactive[0]?.id
    expect(nextId).toBeTruthy()
    useStudioStore.getState().setActiveFile(nextId!)
    await vi.waitFor(() => {
      const state = useStudioStore.getState()
      const nowActive = state.files.find((f) => f.id === nextId)
      const nowInactive = state.files.filter((f) => f.id !== nextId)
      expect(nowActive?.originalUrl).toBeTruthy()
      expect(nowInactive.every((f) => !f.originalUrl)).toBe(true)
    })
  })

  it('pauseProcessing stops taking new files and resumeProcessing continues', async () => {
    vi.stubGlobal('navigator', { hardwareConcurrency: 1 })
    let releaseFirst!: () => void
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve
    })
    let started = 0
    vi.mocked(processImageInWorker).mockImplementation(async () => {
      started += 1
      if (started === 1) await firstGate
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

    void useStudioStore.getState().addFiles([
      tinyJpegFile('a.jpg'),
      tinyJpegFile('b.jpg'),
      tinyJpegFile('c.jpg'),
    ])
    await vi.waitFor(() => {
      expect(useStudioStore.getState().isProcessing).toBe(true)
      expect(useStudioStore.getState().files.some((f) => f.status === 'processing')).toBe(true)
    })

    useStudioStore.getState().pauseProcessing()
    expect(useStudioStore.getState().isPaused).toBe(true)
    releaseFirst()

    await vi.waitFor(() => {
      expect(useStudioStore.getState().isProcessing).toBe(false)
    })
    expect(useStudioStore.getState().files.filter((f) => f.status === 'done')).toHaveLength(1)
    expect(
      useStudioStore.getState().files.filter((f) => f.status === 'pending' || f.status === 'error')
        .length,
    ).toBeGreaterThan(0)

    useStudioStore.getState().resumeProcessing()
    await vi.waitFor(() => {
      expect(useStudioStore.getState().files.every((f) => f.status === 'done')).toBe(true)
      expect(useStudioStore.getState().isProcessing).toBe(false)
      expect(useStudioStore.getState().isPaused).toBe(false)
    })
    vi.unstubAllGlobals()
  })

  it('chunk ZIP packs each wave without downloading until Download', async () => {
    setBatchChunkSizeForTests(2)
    useStudioStore.setState({ chunkZipEnabled: true, isPaused: false, processingToken: 0 })

    await useStudioStore.getState().addFiles([
      tinyJpegFile('a.jpg'),
      tinyJpegFile('b.jpg'),
      tinyJpegFile('c.jpg'),
    ])
    await vi.waitFor(() => {
      expect(useStudioStore.getState().files.every((f) => f.status === 'done')).toBe(true)
      expect(useStudioStore.getState().isProcessing).toBe(false)
    })

    expect(packBatchChunk).toHaveBeenCalledTimes(2)
    expect(downloadNamedBlob).not.toHaveBeenCalled()
    const firstWave = vi.mocked(packBatchChunk).mock.calls[0]?.[0] ?? []
    const secondWave = vi.mocked(packBatchChunk).mock.calls[1]?.[0] ?? []
    expect(firstWave).toHaveLength(2)
    expect(secondWave).toHaveLength(1)

    const packed = useStudioStore.getState()
    expect(packed.chunkZipParts).toHaveLength(2)
    const active = packed.files.find((f) => f.id === packed.activeFileId)
    const released = packed.files.filter((f) => f.id !== packed.activeFileId)
    expect(active?.resultBlob).toBeTruthy()
    expect(released.every((f) => !f.resultBlob && !f.workflowResults?.length)).toBe(true)
    expect(released.every((f) => f.status === 'done' && f.stats)).toBe(true)

    await exportStudioResults()
    expect(downloadNamedBlob).toHaveBeenCalledTimes(2)
    expect(vi.mocked(downloadNamedBlob).mock.calls[0]?.[1]).toBe('assetmelt-batch-01.zip')
    expect(vi.mocked(downloadNamedBlob).mock.calls[1]?.[1]).toBe('assetmelt-batch-02.zip')
    expect(useStudioStore.getState().chunkZipParts).toHaveLength(0)
    expect(useStudioStore.getState().isExporting).toBe(false)
  })

  it('Download splits into numbered ZIPs when chunk ZIP is on', async () => {
    setBatchChunkSizeForTests(2)
    useStudioStore.setState({
      chunkZipEnabled: true,
      isProcessing: false,
      isCropEditing: false,
      isPaused: false,
      activeFileId: 'a',
      files: [
        {
          id: 'a',
          file: tinyJpegFile('a.jpg'),
          name: 'a.jpg',
          inputFormat: 'jpeg',
          status: 'done',
          progress: 100,
          resultBlob: new Blob(['a']),
          resultName: 'a.webp',
        },
        {
          id: 'b',
          file: tinyJpegFile('b.jpg'),
          name: 'b.jpg',
          inputFormat: 'jpeg',
          status: 'done',
          progress: 100,
          resultBlob: new Blob(['b']),
          resultName: 'b.webp',
        },
        {
          id: 'c',
          file: tinyJpegFile('c.jpg'),
          name: 'c.jpg',
          inputFormat: 'jpeg',
          status: 'done',
          progress: 100,
          resultBlob: new Blob(['c']),
          resultName: 'c.webp',
        },
      ],
    })

    await exportStudioResults()

    expect(downloadProcessedFiles).toHaveBeenCalledTimes(2)
    expect(vi.mocked(downloadProcessedFiles).mock.calls[0]?.[0]).toHaveLength(2)
    expect(vi.mocked(downloadProcessedFiles).mock.calls[0]?.[2]).toEqual({
      zipName: 'assetmelt-batch-01.zip',
    })
    expect(vi.mocked(downloadProcessedFiles).mock.calls[1]?.[0]).toHaveLength(1)
    expect(vi.mocked(downloadProcessedFiles).mock.calls[1]?.[2]).toEqual({
      zipName: 'assetmelt-batch-02.zip',
    })

    const state = useStudioStore.getState()
    expect(state.files.find((f) => f.id === 'a')?.resultBlob).toBeTruthy()
    expect(state.files.find((f) => f.id === 'b')?.resultBlob).toBeUndefined()
    expect(state.files.find((f) => f.id === 'c')?.resultBlob).toBeUndefined()
  })

  it('Download stays a single ZIP when chunk ZIP is off', async () => {
    useStudioStore.setState({
      chunkZipEnabled: false,
      isProcessing: false,
      isCropEditing: false,
      files: [
        {
          id: 'a',
          file: tinyJpegFile('a.jpg'),
          name: 'a.jpg',
          inputFormat: 'jpeg',
          status: 'done',
          progress: 100,
          resultBlob: new Blob(['a']),
          resultName: 'a.webp',
        },
        {
          id: 'b',
          file: tinyJpegFile('b.jpg'),
          name: 'b.jpg',
          inputFormat: 'jpeg',
          status: 'done',
          progress: 100,
          resultBlob: new Blob(['b']),
          resultName: 'b.webp',
        },
      ],
    })

    await exportStudioResults()

    expect(downloadProcessedFiles).toHaveBeenCalledTimes(1)
    expect(vi.mocked(downloadProcessedFiles).mock.calls[0]?.[2]).toBeUndefined()
    expect(vi.mocked(downloadProcessedFiles).mock.calls[0]?.[0]).toHaveLength(2)
    expect(useStudioStore.getState().files.every((f) => f.resultBlob)).toBe(true)
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
    expect(
      studioQueueStatus([{ status: 'done' }, { status: 'pending' }], { isPaused: true }),
    ).toBe('Paused · 1 ready · 1 waiting')
    expect(
      studioQueueStatus([{ status: 'processing' }, { status: 'pending' }], { isPaused: true }),
    ).toBe('Pausing · 1 finishing · 0 ready')
  })
})
