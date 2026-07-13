import { useEffect } from 'react'
import { Link, type ErrorComponentProps } from '@tanstack/react-router'
import * as Sentry from '@sentry/tanstackstart-react'
import { Home, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function RouteError({ error, reset }: ErrorComponentProps) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  const message =
    error instanceof Error ? error.message : 'An unexpected error occurred.'

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 sm:px-6">
      <div className="mx-auto flex w-full max-w-md flex-col items-center text-center">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Something went wrong
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {message}
        </p>
        <div className="mt-10 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Button size="lg" onClick={reset} className="h-11 px-7">
            <RotateCcw className="size-4" />
            Try again
          </Button>
          <Button size="lg" variant="outline" asChild className="h-11 px-7">
            <Link to="/">
              <Home className="size-4" />
              Go home
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
