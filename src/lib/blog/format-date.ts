/**
 * Format blog calendar dates for display.
 * Always use UTC so SSR (typically UTC) and clients in any timezone agree —
 * date-only values like 2026-06-01 are UTC midnight and would otherwise
 * render as the previous day west of UTC (hydration mismatch).
 */
export function formatBlogDate(
  iso: string,
  options?: { month?: 'long' | 'short' },
): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: options?.month ?? 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}
