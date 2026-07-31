import { describe, it, expect } from 'vitest'
import { isVersionNewer } from './version-check'

describe('isVersionNewer', () => {
  it('returns true if the new version is newer', () => {
    expect(isVersionNewer('2.0.0', '1.0.0')).toBe(true)
  })
  it('returns false if the new version is older', () => {
    expect(isVersionNewer('1.0.0', '2.0.0')).toBe(false)
  })
  it('returns false if the versions are equal', () => {
    expect(isVersionNewer('1.0.0', '1.0.0')).toBe(false)
  })
  it('non-semver compares trimmed strings for inequality', () => {
    expect(isVersionNewer('abc', 'def')).toBe(true)
    expect(isVersionNewer('abc', 'abc')).toBe(false)
  })

})
