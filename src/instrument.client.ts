import * as Sentry from '@sentry/tanstackstart-react'
import { getSentryRelease } from '@/lib/sentry-release'

Sentry.init({
  dsn: 'https://ca3764d71c925704d9c8cbdc3fba63b4@o4511508417478656.ingest.us.sentry.io/4511727559442432',
  release: getSentryRelease(),
  environment: import.meta.env.PROD ? 'production' : 'development',

  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/tanstackstart-react/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },

  integrations: [Sentry.replayIntegration()],

  enableLogs: true,

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for tracing.
  // We recommend adjusting this value in production.
  tracesSampleRate: 1.0,

  // Capture Replay for 10% of all sessions, plus for 100% of sessions with an error.
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
})
