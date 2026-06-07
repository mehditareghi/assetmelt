import type { ReactNode } from 'react'
import {
  HeadContent,
  Scripts,
  createRootRoute,
  redirect,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { GoogleAnalytics } from 'tanstack-router-ga4'
import { GA_MEASUREMENT_ID, isGoogleAnalyticsEnabled } from '@/lib/analytics'
import { ThemeProvider } from '@/components/layout/theme-provider'
import { SiteLayout } from '@/components/layout/site-layout'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { PwaManager } from '@/components/pwa/pwa-manager'
import { documentBootstrapScript } from '@/lib/pwa/register-sw'
import { getAppVersion } from '@/lib/app-version-fn'
import { AppVersionProvider } from '@/lib/version'
import appCss from '@/styles/globals.css?url'
import { fontPreloads } from '@/lib/fonts'

export const Route = createRootRoute({
  beforeLoad: ({ location }) => {
    if (location.pathname === '/studio/index.html') {
      throw redirect({ to: '/studio', replace: true })
    }
  },
  loader: async () => ({
    appVersion: await getAppVersion(),
  }),
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Asset Melt' },
      { name: 'theme-color', content: '#1a1a1a' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-title', content: 'Asset Melt' },
    ],
    links: [
      ...fontPreloads.map(({ href, type }) => ({
        rel: 'preload' as const,
        href,
        as: 'font' as const,
        type,
        crossOrigin: 'anonymous' as const,
      })),
      { rel: 'stylesheet', href: appCss },
      { rel: 'manifest', href: '/manifest.webmanifest' },
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      { rel: 'apple-touch-icon', href: '/icons/icon-192.png' },
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
            <PwaManager />
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
        <script dangerouslySetInnerHTML={{ __html: documentBootstrapScript }} />
      </head>
      <body>
        {isGoogleAnalyticsEnabled && (
          <GoogleAnalytics measurementId={GA_MEASUREMENT_ID!} />
        )}
        {children}
        <Scripts />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
