import type { OutputFormat } from '@/lib/schemas/pipeline-schema'

export const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID

export const isGoogleAnalyticsEnabled =
  Boolean(GA_MEASUREMENT_ID) && !import.meta.env.DEV

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

type AnalyticsParam = string | number | boolean

function trackEvent(
  eventName: string,
  params?: Record<string, AnalyticsParam>,
): void {
  if (!isGoogleAnalyticsEnabled || typeof window === 'undefined') return
  window.gtag?.('event', eventName, params)
}

export function trackFilesAdded(params: {
  file_count: number
  has_heic: boolean
}): void {
  trackEvent('files_added', params)
}

export function trackFilesProcessed(params: {
  file_count: number
  succeeded: number
  failed: number
  output_format: OutputFormat
  preset_id: string
}): void {
  trackEvent('files_processed', params)
}

export function trackExportCompleted(params: {
  file_count: number
  export_type: 'single' | 'zip'
  preset_id: string
  output_format: OutputFormat
}): void {
  trackEvent('export_completed', params)
}
