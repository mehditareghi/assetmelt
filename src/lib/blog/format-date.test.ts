import { describe, it, expect } from 'vitest'
import { formatBlogDate } from './format-date'

describe('formatDate', () => {
  it('formats YYYY-MM-DD in UTC', () => {
    expect(formatBlogDate('2026-06-01')).toBe('June 1, 2026')
  })
  it('supports short month', () => {
    expect(formatBlogDate('2026-06-01', { month: 'short' })).toBe('Jun 1, 2026')
  })
  it('does not roll back a day in western timezones', () => {
    expect(formatBlogDate('2026-06-01T00:00:00.000Z')).toBe('June 1, 2026')
  })
})
