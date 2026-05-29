import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/layout/theme-provider'
import { LandingPage } from '@/routes/LandingPage'
import { StudioPage } from '@/routes/StudioPage'

export default function App() {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/studio" element={<StudioPage />} />
          </Routes>
        </BrowserRouter>
        <Toaster richColors position="bottom-right" />
      </TooltipProvider>
    </ThemeProvider>
  )
}
