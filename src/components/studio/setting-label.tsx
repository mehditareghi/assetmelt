import { Info } from 'lucide-react'
import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface SettingLabelProps {
  htmlFor?: string
  label: string
  help: string
  className?: string
}

export function SettingLabel({ htmlFor, label, help, className }: SettingLabelProps) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <Label htmlFor={htmlFor} className="cursor-default">
        {label}
      </Label>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
            aria-label={`About ${label}`}
          >
            <Info className="size-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-64 text-xs leading-relaxed">
          {help}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

interface SettingRowProps {
  label: string
  help: string
  htmlFor?: string
  children: ReactNode
}

export function SettingRow({ label, help, htmlFor, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <SettingLabel htmlFor={htmlFor} label={label} help={help} />
      {children}
    </div>
  )
}
