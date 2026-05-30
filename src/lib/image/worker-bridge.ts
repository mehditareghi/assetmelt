import type {
  WorkerInboundMessage,
  WorkerPreviewRequest,
  WorkerProcessRequest,
  WorkerResponse,
} from '@/lib/image/types'
import type { InputFormat } from '@/lib/image/format-detection'

type ProgressCallback = (progress: number, stage: string) => void

let worker: Worker | null = null
let workerReady = false

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(
      new URL('../../workers/image-processor.worker.ts', import.meta.url),
      { type: 'module' },
    )
  }
  return worker
}

function waitForWorkerResponse<T extends WorkerResponse['type']>(
  requestId: string,
  expectedType: T,
): Promise<Extract<WorkerResponse, { type: T }>> {
  return new Promise((resolve, reject) => {
    const w = getWorker()

    const handler = (event: MessageEvent<WorkerResponse>) => {
      const data = event.data
      if (data.id !== requestId) return

      if (data.type === 'progress') return

      w.removeEventListener('message', handler)
      w.removeEventListener('error', errorHandler)

      if (data.type === 'error') {
        reject(new Error(data.message))
      } else if (data.type === expectedType) {
        resolve(data as Extract<WorkerResponse, { type: T }>)
      } else {
        reject(new Error(`Unexpected worker response: ${data.type}`))
      }
    }

    const errorHandler = (event: ErrorEvent) => {
      w.removeEventListener('message', handler)
      w.removeEventListener('error', errorHandler)
      reject(new Error(event.message || 'Worker error'))
    }

    w.addEventListener('message', handler)
    w.addEventListener('error', errorHandler)
  })
}

export function processImageInWorker(
  request: Omit<WorkerProcessRequest, 'type'>,
  onProgress?: ProgressCallback,
): Promise<WorkerResponse & { type: 'result' }> {
  const w = getWorker()
  const responsePromise = waitForWorkerResponse(request.id, 'result')

  if (onProgress) {
    const progressHandler = (event: MessageEvent<WorkerResponse>) => {
      const data = event.data
      if (data.id !== request.id || data.type !== 'progress') return
      onProgress(data.progress, data.stage)
    }
    w.addEventListener('message', progressHandler)
    responsePromise.finally(() => w.removeEventListener('message', progressHandler))
  }

  const message: WorkerProcessRequest = { type: 'process', ...request }
  w.postMessage(message, [request.buffer])
  return responsePromise
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
  const responsePromise = waitForWorkerResponse(id, 'preview-result')
  const message: WorkerPreviewRequest = { type: 'preview', id, buffer, format }
  getWorker().postMessage(message satisfies WorkerInboundMessage, [buffer])
  return responsePromise
}

export async function warmUpWorker(): Promise<void> {
  if (workerReady) return
  getWorker()
  workerReady = true
}

export function terminateWorker(): void {
  worker?.terminate()
  worker = null
  workerReady = false
}
