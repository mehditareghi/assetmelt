import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { APP_VERSION } from '@/lib/version'
import { Shield } from 'lucide-react'

const YEAR = new Date().getFullYear()

export function SiteFooter() {
  return (
    <footer className="border-t border-border/50">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-12 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-2 sm:items-start">
          <Link to="/" className="font-display text-lg font-bold tracking-tight">
            Asset<span className="text-primary">Melt</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            Client-side image studio for compression, conversion, and transforms.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="gap-1.5 font-mono text-xs">
            <Shield className="size-3" />
            100% client-side
          </Badge>
          <span className="font-mono text-xs text-muted-foreground">v{APP_VERSION}</span>
        </div>
      </div>

      <div className="border-t border-border/40 bg-muted/10">
        <div className="mx-auto max-w-7xl px-4 py-4 text-center sm:px-6 lg:px-8">
          <p className="font-mono text-xs text-muted-foreground">
            © {YEAR}{' '}
            <span className="text-foreground/90">Mehdi Tareghi</span>
            <span className="mx-2 text-border/80">·</span>
            <span className="text-muted-foreground/70">/* shipped without a backend */</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
