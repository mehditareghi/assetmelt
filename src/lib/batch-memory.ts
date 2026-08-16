/** Files per auto-ZIP when “ZIP every N files” is on. */
export const BATCH_CHUNK_SIZE = 25

let chunkSizeForTests: number | null = null

export function resolveBatchChunkSize(): number {
  return chunkSizeForTests ?? BATCH_CHUNK_SIZE
}

/** Vitest only — restore with `null`. */
export function setBatchChunkSizeForTests(size: number | null): void {
  chunkSizeForTests = size
}

export function chunkZipFilename(part: number): string {
  return `assetmelt-batch-${String(part).padStart(2, '0')}.zip`
}

export function nextWaveTakeCount(queueLength: number, chunkEnabled: boolean): number {
  if (queueLength <= 0) return 0
  if (!chunkEnabled) return queueLength
  return Math.min(resolveBatchChunkSize(), queueLength)
}

export function splitIntoChunks<T>(items: T[], size = resolveBatchChunkSize()): T[][] {
  const chunkSize = Math.max(1, size)
  if (items.length === 0) return []
  const waves: T[][] = []
  for (let i = 0; i < items.length; i += chunkSize) {
    waves.push(items.slice(i, i + chunkSize))
  }
  return waves
}
