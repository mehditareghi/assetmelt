import { describe, test, expect } from 'vitest'
import { isVersionNewer } from './version-check'

describe('isVersionNewer', () => {
  test('returns true if the new version is newer', () => {
    expect(isVersionNewer('2.0.0', '1.0.0')).toBe(true)
  })
  test('returns false if the new version is older', () => {
    expect(isVersionNewer('1.0.0', '2.0.0')).toBe(false)
  })
  test('returns false if the versions are equal', () => {
    expect(isVersionNewer('1.0.0', '1.0.0')).toBe(false)
  })
  test('non-semver compares trimmed strings for inequality', () => {
    expect(isVersionNewer('abc', 'def')).toBe(true)
    expect(isVersionNewer('abc', 'abc')).toBe(false)
  })

})
