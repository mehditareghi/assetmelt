import { isSizeBudgetSupported } from '@/lib/image/size-budget-encode'
import {
  getDefaultEncodeOptions,
  type PipelineConfig,
} from '@/lib/schemas/pipeline-schema'

export const SIZE_BUDGET_LANDING_KB = [50, 100, 200] as const

export type SizeBudgetLandingKb = (typeof SIZE_BUDGET_LANDING_KB)[number]

const BUDGET_PARAM_RE = /^(\d{2,3})kb$/i

export function sizeBudgetBytes(kb: SizeBudgetLandingKb): number {
  return kb * 1024
}

export function canonicalBudgetParam(kb: SizeBudgetLandingKb): `${SizeBudgetLandingKb}kb` {
  return `${kb}kb`
}

export function sizeBudgetLandingPath(
  kb: SizeBudgetLandingKb,
): `/compress/under-${SizeBudgetLandingKb}kb` {
  return `/compress/under-${kb}kb`
}

export function parseBudgetParam(raw: unknown): SizeBudgetLandingKb | undefined {
  if (typeof raw !== 'string') return undefined
  const match = BUDGET_PARAM_RE.exec(raw.trim())
  if (!match) return undefined
  const kb = Number(match[1])
  if (kb === 50 || kb === 100 || kb === 200) return kb
  return undefined
}

export function studioBudgetSearch(
  budget: string | null | undefined,
): { budget?: `${SizeBudgetLandingKb}kb` } {
  const kb = parseBudgetParam(budget)
  return kb ? { budget: canonicalBudgetParam(kb) } : {}
}

/** Enable size budget for a landing-page / `?budget=` intent. */
export function pipelinePatchForSizeBudget(
  pipeline: PipelineConfig,
  kb: SizeBudgetLandingKb,
): Pick<PipelineConfig, 'sizeBudget' | 'outputFormat' | 'encode'> {
  const sizeBudget = {
    enabled: true as const,
    targetBytes: sizeBudgetBytes(kb),
    allowResize: true,
  }

  let outputFormat = pipeline.outputFormat
  let encode = pipeline.encode

  const withBudget = { ...pipeline, sizeBudget, outputFormat, encode }
  if (!isSizeBudgetSupported(withBudget)) {
    if (encode.format === 'avif' && encode.options.lossless) {
      encode = { format: 'avif', options: { ...encode.options, lossless: false } }
    } else if (encode.format === 'jxl' && encode.options.lossless) {
      encode = { format: 'jxl', options: { ...encode.options, lossless: false } }
    }

    const afterLossless = { ...pipeline, sizeBudget, outputFormat, encode }
    if (!isSizeBudgetSupported(afterLossless)) {
      outputFormat = 'webp'
      encode = getDefaultEncodeOptions('webp')
    }
  }

  return { sizeBudget, outputFormat, encode }
}
