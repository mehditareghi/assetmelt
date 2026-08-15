import { Plus } from 'lucide-react'
import { pickImageFiles } from '@/lib/image/pick-image-files'
import { ingestIncomingImages } from '@/lib/studio-ingest'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

async function pickAndIngest() {
  const picked = await pickImageFiles()
  if (picked.length === 0) return
  await ingestIncomingImages(picked)
}

export function AddImagesButton({
  label,
  disabled,
  className,
  size = 'sm',
  variant = 'outline',
  expand,
}: {
  label: string
  disabled?: boolean
  className?: string
  size?: 'sm' | 'default'
  variant?: 'outline' | 'ghost'
  expand?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size={size}
          disabled={disabled}
          className={cn('gap-1.5', expand && 'flex-1', className)}
          aria-label={`${label}. Or drop files or a folder anywhere to add.`}
          onClick={() => void pickAndIngest()}
        >
          <Plus className="size-3.5" />
          {label}
        </Button>
      </TooltipTrigger>
      <TooltipContent>Or drop files or a folder anywhere</TooltipContent>
    </Tooltip>
  )
}
