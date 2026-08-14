import type {
  WorkerInboundMessage,
  WorkerPreviewRequest,
  WorkerProcessRequest,
  WorkerResponse,
} from '@/lib/image/types'
import type { InputFormat } from '@/lib/image/format-detection'
import {
  cancelWorkerPoolJobs,
  configureWorkerPoolFactory,
  terminateWorkerPool,
  warmWorkerPool,
  withPooledWorker,
} from '@/lib/image/worker-pool'

type ProgressCallback = (progress: number, stage: string) => void

function createImageWorker(): Worker {
  return new Worker(new URL('../../workers/image-processor.worker.ts', import.meta.url), {
    type: 'module',
  })
}

configureWorkerPoolFactory(createImageWorker)

function waitForWorkerResponse<T extends WorkerResponse['type']>(
  worker: Worker,
  requestId: string,
  expectedType: T,
): Promise<Extract<WorkerResponse, { type: T }>> {
  return new Promise((resolve, reject) => {
    const handler = (event: MessageEvent<WorkerResponse>) => {
      const data = event.data
      if (data.id !== requestId) return

      if (data.type === 'progress') return

      worker.removeEventListener('message', handler)
      worker.removeEventListener('error', errorHandler)

      if (data.type === 'error') {
        reject(new Error(data.message))
      } else if (data.type === expectedType) {
        resolve(data as Extract<WorkerResponse, { type: T }>)
      } else {
        reject(new Error(`Unexpected worker response: ${data.type}`))
      }
    }

    const errorHandler = (event: ErrorEvent) => {
      worker.removeEventListener('message', handler)
      worker.removeEventListener('error', errorHandler)
      reject(new Error(event.message || 'Worker error'))
    }

    worker.addEventListener('message', handler)
    worker.addEventListener('error', errorHandler)
  })
}

export function processImageInWorker(
  request: Omit<WorkerProcessRequest, 'type'>,
  onProgress?: ProgressCallback,
): Promise<WorkerResponse & { type: 'result' }> {
  return withPooledWorker(async (worker) => {
    const responsePromise = waitForWorkerResponse(worker, request.id, 'result')

    let progressHandler: ((event: MessageEvent<WorkerResponse>) => void) | undefined
    if (onProgress) {
      progressHandler = (event: MessageEvent<WorkerResponse>) => {
        const data = event.data
        if (data.id !== request.id || data.type !== 'progress') return
        onProgress(data.progress, data.stage)
      }
      worker.addEventListener('message', progressHandler)
    }

    try {
      const message: WorkerProcessRequest = { type: 'process', ...request }
      worker.postMessage(message, [request.buffer])
      return await responsePromise
    } finally {
      if (progressHandler) worker.removeEventListener('message', progressHandler)
    }
  })
}

export interface WasmPreviewResult {
  previewBuffer: ArrayBuffer
  width: number
  height: number
}

export function createWasmPreviewInWorker(
  buffer: ArrayBuffer,
  format: InputFormat,
): Promise<WasmPreviewResult> {
  const id = crypto.randomUUID()
  return withPooledWorker(async (worker) => {
    const responsePromise = waitForWorkerResponse(worker, id, 'preview-result')
    const message: WorkerPreviewRequest = { type: 'preview', id, buffer, format }
    worker.postMessage(message satisfies WorkerInboundMessage, [buffer])
    return responsePromise
  })
}

export async function warmUpWorker(): Promise<void> {
  warmWorkerPool()
}

export function terminateWorker(): void {
  terminateWorkerPool()
}

export function cancelStudioWorkerJobs(): void {
  cancelWorkerPoolJobs()
}
