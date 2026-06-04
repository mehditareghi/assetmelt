import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/layout/theme-toggle'

interface SiteHeaderProps {
  variant?: 'landing' | 'studio'
}

export function SiteHeader({ variant = 'landing' }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="font-display text-lg font-bold tracking-tight">
          Asset<span className="text-primary">Melt</span>
        </Link>

        <nav className="flex items-center gap-2">
          {variant === 'landing' && (
            <>
              <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                <a href="#features">Features</a>
              </Button>
              <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
                <a href="#how-it-works">How it works</a>
              </Button>
              <Button variant="ghost" size="sm" asChild className="hidden lg:inline-flex">
                <a href="#support">Support</a>
              </Button>
            </>
          )}
          <ThemeToggle />
          {variant === 'landing' ? (
            <Button size="sm" asChild>
              <Link to="/studio">Open Studio</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link to="/">Home</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  )
}
