import { useRef } from 'react'
import { Input } from '@/components/ui/input'
import { SettingLabel } from '@/components/studio/setting-label'
import { SETTING_HELP } from '@/lib/setting-help'
import {
  FILENAME_TOKENS,
  encodeQualityForFilename,
  formatOutputFilename,
  insertFilenameToken,
} from '@/lib/filename-pattern'
import { cn } from '@/lib/utils'
import { useStudioStore } from '@/stores/studio-store'

export function FilenamePatternField() {
  const pipeline = useStudioStore((s) => s.pipeline)
  const files = useStudioStore((s) => s.files)
  const updatePipeline = useStudioStore((s) => s.updatePipeline)
  const inputRef = useRef<HTMLInputElement>(null)

  const sample = files[0]
  const example = formatOutputFilename(
    sample?.name ?? 'photo.jpg',
    pipeline.filenamePattern,
    pipeline.outputFormat,
    {
      width: sample?.stats?.outputWidth ?? sample?.originalWidth ?? 1200,
      height: sample?.stats?.outputHeight ?? sample?.originalHeight ?? 800,
      quality: encodeQualityForFilename(pipeline, sample?.stats?.sizeBudget?.appliedQuality),
    },
  )

  const insert = (token: string) => {
    const el = inputRef.current
    const start = el?.selectionStart ?? pipeline.filenamePattern.length
    const end = el?.selectionEnd ?? start
    const { next, cursor } = insertFilenameToken(pipeline.filenamePattern, token, start, end)
    updatePipeline({ filenamePattern: next })
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(cursor, cursor)
    })
  }

  return (
    <div className="space-y-2">
      <SettingLabel label="Filename pattern" help={SETTING_HELP.filenamePattern} />
      <Input
        ref={inputRef}
        id="filename-pattern"
        value={pipeline.filenamePattern}
        onChange={(e) => updatePipeline({ filenamePattern: e.target.value })}
        className="font-mono text-xs"
        placeholder="{name}-melted.{ext}"
        spellCheck={false}
        autoComplete="off"
        aria-describedby="filename-pattern-example"
      />
      <div className="flex flex-wrap gap-1">
        {FILENAME_TOKENS.map((item) => {
          const active = pipeline.filenamePattern.includes(item.token)
          return (
            <button
              key={item.token}
              type="button"
              title={item.hint}
              aria-label={`Insert ${item.token}`}
              onClick={() => insert(item.token)}
              className={cn(
                'rounded-full border px-2 py-0.5 font-mono text-[10px] transition-colors',
                active
                  ? 'border-primary/40 bg-primary/10 text-foreground'
                  : 'border-border/60 bg-background/40 text-muted-foreground hover:border-primary/30 hover:text-foreground',
              )}
            >
              {item.token}
            </button>
          )
        })}
      </div>
      <p id="filename-pattern-example" className="truncate font-mono text-[11px] text-muted-foreground">
        Example · {example}
      </p>
    </div>
  )
}
