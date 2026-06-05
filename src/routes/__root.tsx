import type { ReactNode } from 'react'
import {
  HeadContent,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { ThemeProvider } from '@/components/layout/theme-provider'
import { SiteLayout } from '@/components/layout/site-layout'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { getAppVersion } from '@/lib/app-version-fn'
import { AppVersionProvider } from '@/lib/version'
import appCss from '@/styles/globals.css?url'

const googleFontsHref =
  'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap'

export const Route = createRootRoute({
  loader: async () => ({
    appVersion: await getAppVersion(),
  }),
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Asset Melt' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      { rel: 'stylesheet', href: googleFontsHref },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  const { appVersion } = Route.useLoaderData()

  return (
    <RootDocument>
      <AppVersionProvider version={appVersion}>
        <ThemeProvider>
          <TooltipProvider>
            <SiteLayout />
            <Toaster richColors position="bottom-right" />
            {import.meta.env.DEV && <TanStackRouterDevtools />}
          </TooltipProvider>
        </ThemeProvider>
      </AppVersionProvider>
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
