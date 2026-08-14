import { createDefaultPipeline, type PipelineConfig } from '@/lib/schemas/pipeline-schema'
import { applyPreset, BUILT_IN_PRESETS, isCustomPresetId, mergePipelineWithPartial } from '@/lib/presets'
import { resolvePlatformPresetId } from '@/lib/platform-presets'
import { pipelinesEqual } from '@/lib/pipeline-history'

export const STUDIO_RECIPE_MAX_LENGTH = 2048
export const STUDIO_RECIPE_PREFIX = 'c1.'

const RECIPE_PARAM_RE = /^[A-Za-z0-9._~-]+$/

export type StudioRecipe =
  | { kind: 'preset'; id: string }
  | { kind: 'pipeline'; pipeline: PipelineConfig }

export function parseRecipeParam(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined
  const value = raw.trim()
  if (!value || value.length > STUDIO_RECIPE_MAX_LENGTH) return undefined
  if (!RECIPE_PARAM_RE.test(value)) return undefined
  return value
}

function compactPipeline(pipeline: PipelineConfig): Record<string, unknown> | null {
  const defaults = createDefaultPipeline()
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(defaults) as Array<keyof PipelineConfig>) {
    if (JSON.stringify(pipeline[key]) !== JSON.stringify(defaults[key])) {
      out[key] = pipeline[key]
    }
  }
  return Object.keys(out).length > 0 ? out : null
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
  const binary = atob(padded + pad)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

function looksLikeImagePayload(value: unknown): boolean {
  const text = JSON.stringify(value)
  return (
    text.includes('data:image') ||
    text.includes('"buffer"') ||
    text.includes('"files"') ||
    text.includes('ArrayBuffer')
  )
}

export function encodeStudioRecipe(pipeline: PipelineConfig): string | null {
  for (const preset of BUILT_IN_PRESETS) {
    if (pipelinesEqual(pipeline, applyPreset(preset))) {
      return preset.id === 'web-optimized' ? null : preset.id
    }
  }
  const compact = compactPipeline(pipeline)
  if (!compact) return null
  const encoded = `${STUDIO_RECIPE_PREFIX}${toBase64Url(JSON.stringify(compact))}`
  if (encoded.length > STUDIO_RECIPE_MAX_LENGTH) return null
  return encoded
}

export function decodeStudioRecipe(raw: string): StudioRecipe | null {
  const value = parseRecipeParam(raw)
  if (!value) return null

  if (value.startsWith(STUDIO_RECIPE_PREFIX)) {
    try {
      const parsed: unknown = JSON.parse(fromBase64Url(value.slice(STUDIO_RECIPE_PREFIX.length)))
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
      if (looksLikeImagePayload(parsed)) return null
      const pipeline = mergePipelineWithPartial(parsed as Partial<PipelineConfig>)
      return { kind: 'pipeline', pipeline }
    } catch {
      return null
    }
  }

  const id = resolvePlatformPresetId(value)
  if (isCustomPresetId(id)) return null
  const preset = BUILT_IN_PRESETS.find((item) => item.id === id)
  if (!preset) return null
  return { kind: 'preset', id: preset.id }
}

export function studioRecipeSearch(recipe: string | null | undefined): { recipe?: string } {
  return recipe ? { recipe } : {}
}
