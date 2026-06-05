export const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID

export const isGoogleAnalyticsEnabled =
  Boolean(GA_MEASUREMENT_ID) && !import.meta.env.DEV
