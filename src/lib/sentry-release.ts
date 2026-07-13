import { SENTRY_RELEASE } from '@/generated/sentry-release'

export { SENTRY_RELEASE }

/** Semantic version for Sentry release, or undefined in local dev. */
export function getSentryRelease(): string | undefined {
  return SENTRY_RELEASE === 'dev' ? undefined : SENTRY_RELEASE
}
