import type {
  WorkerProcessRequest,
  WorkerResponse,
} from '@/lib/image/types'

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

export function processImageInWorker(
  request: Omit<WorkerProcessRequest, 'type'>,
  onProgress?: ProgressCallback,
): Promise<WorkerResponse & { type: 'result' }> {
  return new Promise((resolve, reject) => {
    const w = getWorker()

    const handler = (event: MessageEvent<WorkerResponse>) => {
      const data = event.data
      if (data.id !== request.id) return

      if (data.type === 'progress') {
        onProgress?.(data.progress, data.stage)
        return
      }

      w.removeEventListener('message', handler)
      w.removeEventListener('error', errorHandler)

      if (data.type === 'error') {
        reject(new Error(data.message))
      } else {
        resolve(data)
      }
    }

    const errorHandler = (event: ErrorEvent) => {
      w.removeEventListener('message', handler)
      w.removeEventListener('error', errorHandler)
      reject(new Error(event.message || 'Worker error'))
    }

    w.addEventListener('message', handler)
    w.addEventListener('error', errorHandler)

    const message: WorkerProcessRequest = { type: 'process', ...request }
    w.postMessage(message, [request.buffer])
  })
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
