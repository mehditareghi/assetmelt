import type { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface LandingSectionHeaderProps {
  id?: string
  eyebrow: string
  icon?: LucideIcon
  title: string
  titleAccent?: string
  description?: string
  align?: 'center' | 'left'
  className?: string
}

export function LandingSectionHeader({
  id,
  eyebrow,
  icon: Icon,
  title,
  titleAccent,
  description,
  align = 'center',
  className,
}: LandingSectionHeaderProps) {
  return (
    <header
      className={cn(
        'mb-12',
        align === 'center' && 'mx-auto max-w-2xl text-center',
        align === 'left' && 'max-w-lg',
        className,
      )}
    >
      <Badge variant="glass" className="mb-4 gap-1.5 px-3 py-1 font-mono text-xs">
        {Icon && <Icon className="size-3" aria-hidden />}
        {eyebrow}
      </Badge>
      <h2 id={id} className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
        {title}
        {titleAccent && (
          <span className="landing-gradient-text mt-1 block">{titleAccent}</span>
        )}
      </h2>
      {description && (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {description}
        </p>
      )}
    </header>
  )
}
