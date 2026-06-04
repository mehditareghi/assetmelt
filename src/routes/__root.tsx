import { createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { ThemeProvider } from '@/components/layout/theme-provider'
import { SiteLayout } from '@/components/layout/site-layout'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'

function RootLayout() {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <SiteLayout />
        <Toaster richColors position="bottom-right" />
        {import.meta.env.DEV && <TanStackRouterDevtools />}
      </TooltipProvider>
    </ThemeProvider>
  )
}

export const Route = createRootRoute({
  component: RootLayout,
})
