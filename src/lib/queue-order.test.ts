import { describe, expect, it } from 'vitest'
import { applyIdOrder, idsInSameOrder, moveIdInOrder } from './queue-order'
import { fileHasDownloadableResult } from '@/lib/download-results'
import type { ProcessableFile } from '@/lib/image/types'

function file(id: string, status: ProcessableFile['status'] = 'done'): ProcessableFile {
  return {
    id,
    file: new File([], `${id}.jpg`),
    name: `${id}.jpg`,
    inputFormat: 'jpeg',
    status,
    progress: status === 'done' ? 100 : 0,
    resultBlob: status === 'done' ? new Blob(['x']) : undefined,
    resultName: status === 'done' ? `${id}.webp` : undefined,
  }
}

describe('queue order', () => {
  it('reorders known ids and appends any that were missing', () => {
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    expect(applyIdOrder(items, ['c', 'a', 'b']).map((item) => item.id)).toEqual(['c', 'a', 'b'])
    expect(applyIdOrder(items, ['b', 'ghost', 'a']).map((item) => item.id)).toEqual([
      'b',
      'a',
      'c',
    ])
  })

  it('moves an id by delta without wrapping', () => {
    expect(moveIdInOrder(['a', 'b', 'c'], 'b', -1)).toEqual(['b', 'a', 'c'])
    expect(moveIdInOrder(['a', 'b', 'c'], 'a', -1)).toEqual(['a', 'b', 'c'])
    expect(moveIdInOrder(['a', 'b', 'c'], 'c', 1)).toEqual(['a', 'b', 'c'])
    expect(moveIdInOrder(['a', 'b', 'c'], 'a', 2)).toEqual(['b', 'c', 'a'])
  })

  it('keeps downloadable ZIP members in queue order', () => {
    const queue = [file('hero', 'pending'), file('logo'), file('icon'), file('skip', 'error')]
    expect(queue.filter(fileHasDownloadableResult).map((item) => item.id)).toEqual([
      'logo',
      'icon',
    ])
    const reordered = applyIdOrder(queue, ['icon', 'hero', 'logo', 'skip'])
    expect(reordered.filter(fileHasDownloadableResult).map((item) => item.id)).toEqual([
      'icon',
      'logo',
    ])
  })

  it('compares id lists', () => {
    expect(idsInSameOrder(['a', 'b'], ['a', 'b'])).toBe(true)
    expect(idsInSameOrder(['a', 'b'], ['b', 'a'])).toBe(false)
  })
})
