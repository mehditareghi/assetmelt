import { describe, test, expect } from 'vitest'
import { isHeicFormat } from './heic'
import type { InputFormat } from '@/lib/image/format-detection'

describe('isHeicFormat', () => {
  test('returns true for HEIC format', () => {
    expect(isHeicFormat('heic' as InputFormat)).toBe(true)
  })
  test('returns false for non-HEIC format', () => {
    expect(isHeicFormat('jpeg' as InputFormat)).toBe(false)
  })
})
