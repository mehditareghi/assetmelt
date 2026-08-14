import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  cancelWorkerPoolJobs,
  configureWorkerPoolFactory,
  isWorkerPoolCancelError,
  MAX_WORKER_POOL_SIZE,
  resetWorkerPoolForTests,
  resolveWorkerPoolSize,
  withPooledWorker,
} from './worker-pool'

function mockWorker() {
  return {
    terminate: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    postMessage: vi.fn(),
  } as unknown as Worker
}

describe('resolveWorkerPoolSize', () => {
  it('caps at MAX_WORKER_POOL_SIZE', () => {
    expect(resolveWorkerPoolSize(16)).toBe(MAX_WORKER_POOL_SIZE)
  })

  it('uses at least one worker', () => {
    expect(resolveWorkerPoolSize(0)).toBe(1)
    expect(resolveWorkerPoolSize(Number.NaN)).toBe(1)
  })

  it('follows hardware concurrency under the cap', () => {
    expect(resolveWorkerPoolSize(2)).toBe(2)
    expect(resolveWorkerPoolSize(4)).toBe(4)
  })
})

describe('worker pool concurrency', () => {
  afterEach(() => {
    resetWorkerPoolForTests()
  })

  it('runs up to pool-size jobs in parallel', async () => {
    vi.stubGlobal('navigator', { hardwareConcurrency: 4 })
    let created = 0
    configureWorkerPoolFactory(() => {
      created += 1
      return mockWorker()
    })

    let live = 0
    let peak = 0
    const job = () =>
      withPooledWorker(async () => {
        live += 1
        peak = Math.max(peak, live)
        await new Promise((resolve) => setTimeout(resolve, 30))
        live -= 1
        return true
      })

    await Promise.all([job(), job(), job(), job(), job()])
    expect(peak).toBe(4)
    expect(created).toBe(4)
    vi.unstubAllGlobals()
  })

  it('cancels waiters and in-flight work', async () => {
    vi.stubGlobal('navigator', { hardwareConcurrency: 1 })
    configureWorkerPoolFactory(() => mockWorker())

    const started = withPooledWorker(
      () =>
        new Promise<string>((_resolve, reject) => {
          // Stays pending until cancel rejects via rejectInFlight.
          void reject
        }),
    )

    await new Promise((resolve) => setTimeout(resolve, 0))
    cancelWorkerPoolJobs()

    await expect(started).rejects.toSatisfy(isWorkerPoolCancelError)
    vi.unstubAllGlobals()
  })
})
