/** Soft cap so batch encode does not thrash low-memory devices. */
export const MAX_WORKER_POOL_SIZE = 4

export function resolveWorkerPoolSize(hardwareConcurrency?: number): number {
  const raw =
    hardwareConcurrency !== undefined
      ? hardwareConcurrency
      : typeof navigator !== 'undefined'
        ? navigator.hardwareConcurrency
        : 1
  const cores =
    typeof raw === 'number' && Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1
  return Math.max(1, Math.min(MAX_WORKER_POOL_SIZE, cores))
}

type WorkerFactory = () => Worker

type PoolSlot = {
  worker: Worker
  /** Rejects the in-flight job when the pool is cancelled / torn down. */
  rejectInFlight: ((error: Error) => void) | null
}

let factory: WorkerFactory | null = null
let slots: PoolSlot[] = []
let idle: PoolSlot[] = []
let waitQueue: Array<{
  resolve: (slot: PoolSlot) => void
  reject: (error: Error) => void
}> = []
let generation = 0

export function configureWorkerPoolFactory(createWorker: WorkerFactory): void {
  factory = createWorker
}

function ensureFactory(): WorkerFactory {
  if (!factory) {
    throw new Error('Worker pool factory is not configured')
  }
  return factory
}

function ensurePoolSized(): void {
  const create = ensureFactory()
  const target = resolveWorkerPoolSize()
  while (slots.length < target) {
    const slot: PoolSlot = { worker: create(), rejectInFlight: null }
    slots.push(slot)
    idle.push(slot)
  }
}

function acquireSlot(): Promise<PoolSlot> {
  ensurePoolSized()
  const free = idle.pop()
  if (free) return Promise.resolve(free)

  return new Promise((resolve, reject) => {
    waitQueue.push({ resolve, reject })
  })
}

function releaseSlot(slot: PoolSlot): void {
  slot.rejectInFlight = null
  if (!slots.includes(slot)) return

  const waiter = waitQueue.shift()
  if (waiter) {
    waiter.resolve(slot)
    return
  }
  idle.push(slot)
}

/**
 * Run work on a pooled Web Worker. Concurrent callers share up to
 * `resolveWorkerPoolSize()` workers.
 */
export async function withPooledWorker<T>(
  run: (worker: Worker) => Promise<T>,
): Promise<T> {
  const gen = generation
  const slot = await acquireSlot()
  if (gen !== generation) {
    releaseSlot(slot)
    throw cancelError()
  }

  try {
    const result = await new Promise<T>((resolve, reject) => {
      slot.rejectInFlight = reject
      void run(slot.worker).then(
        (value) => {
          slot.rejectInFlight = null
          resolve(value)
        },
        (error) => {
          slot.rejectInFlight = null
          reject(error)
        },
      )
    })
    if (gen !== generation) throw cancelError()
    return result
  } finally {
    releaseSlot(slot)
  }
}

export function cancelWorkerPoolJobs(message = 'Cancelled'): void {
  generation += 1
  const error = cancelError(message)

  for (const waiter of waitQueue) waiter.reject(error)
  waitQueue = []

  for (const slot of slots) {
    slot.rejectInFlight?.(error)
    slot.rejectInFlight = null
    slot.worker.terminate()
  }

  slots = []
  idle = []
}

export function warmWorkerPool(): void {
  ensurePoolSized()
}

export function terminateWorkerPool(): void {
  cancelWorkerPoolJobs('Worker pool terminated')
}

export function cancelError(message = 'Cancelled'): Error {
  const error = new Error(message)
  error.name = 'AbortError'
  return error
}

export function isWorkerPoolCancelError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}

/** Test helper — resets module pool state. */
export function resetWorkerPoolForTests(): void {
  for (const slot of slots) {
    try {
      slot.worker.terminate()
    } catch {
      // ignore
    }
  }
  slots = []
  idle = []
  waitQueue = []
  generation = 0
  factory = null
}
