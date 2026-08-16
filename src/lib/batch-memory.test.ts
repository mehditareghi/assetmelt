import { afterEach, describe, expect, it } from 'vitest'
import {
  BATCH_CHUNK_SIZE,
  chunkZipFilename,
  nextWaveTakeCount,
  resolveBatchChunkSize,
  setBatchChunkSizeForTests,
  splitIntoChunks,
} from '@/lib/batch-memory'

describe('batch memory helpers', () => {
  afterEach(() => {
    setBatchChunkSizeForTests(null)
  })

  it('names numbered batch ZIP parts', () => {
    expect(chunkZipFilename(1)).toBe('assetmelt-batch-01.zip')
    expect(chunkZipFilename(12)).toBe('assetmelt-batch-12.zip')
  })

  it('takes the full queue when chunk ZIP is off', () => {
    expect(nextWaveTakeCount(80, false)).toBe(80)
    expect(nextWaveTakeCount(0, true)).toBe(0)
  })

  it('caps a wave at the chunk size when enabled', () => {
    expect(nextWaveTakeCount(80, true)).toBe(BATCH_CHUNK_SIZE)
    expect(nextWaveTakeCount(10, true)).toBe(10)
    setBatchChunkSizeForTests(2)
    expect(resolveBatchChunkSize()).toBe(2)
    expect(nextWaveTakeCount(10, true)).toBe(2)
  })

  it('splits a download list into numbered waves', () => {
    setBatchChunkSizeForTests(2)
    expect(splitIntoChunks(['a', 'b', 'c', 'd', 'e'])).toEqual([
      ['a', 'b'],
      ['c', 'd'],
      ['e'],
    ])
    expect(splitIntoChunks(['a'])).toEqual([['a']])
    expect(splitIntoChunks([])).toEqual([])
  })
})
