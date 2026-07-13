import * as Sentry from '@sentry/tanstackstart-react'
import { Button } from '@/components/ui/button'

export function SentryVerifyPanel() {
  if (!import.meta.env.DEV) {
    return null
  }

  return (
    <div className="fixed right-4 top-20 z-[100] flex max-w-xs flex-col gap-2 rounded-lg border border-border/60 bg-background/95 p-3 shadow-lg backdrop-blur">
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        Sentry verify (dev only)
      </p>
      <Button
        type="button"
        size="sm"
        variant="destructive"
        onClick={() => {
          throw new Error('Sentry Test Error')
        }}
      >
        Break the world
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={async () => {
          await Sentry.startSpan(
            { name: 'Example Frontend Span', op: 'test' },
            async () => {
              const res = await fetch('/api/sentry-example')
              if (!res.ok) {
                throw new Error('Sentry Example Frontend Error')
              }
            },
          )
        }}
      >
        Test trace + API error
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => {
          Sentry.logger.info('User example action completed')
          Sentry.logger.warn('Slow operation detected', {
            operation: 'data_fetch',
            duration: 3500,
          })
          Sentry.logger.error('Validation failed', {
            field: 'email',
            reason: 'Invalid email',
          })
        }}
      >
        Send test logs
      </Button>
    </div>
  )
}
