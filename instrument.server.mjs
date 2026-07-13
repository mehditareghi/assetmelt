import * as Sentry from '@sentry/tanstackstart-react'
import { getSentryRelease } from './sentry-release.mjs'

Sentry.init({
  dsn: 'https://ca3764d71c925704d9c8cbdc3fba63b4@o4511508417478656.ingest.us.sentry.io/4511727559442432',
  release: getSentryRelease(),
  environment:
    process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production'
      ? 'production'
      : 'development',

  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/tanstackstart-react/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },

  enableLogs: true,

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for tracing.
  // We recommend adjusting this value in production.
  tracesSampleRate: 1.0,
})
