import { pipelineSchema, type PipelineConfig } from '@/lib/schemas/pipeline-schema'

export const MAX_PIPELINE_HISTORY = 50

export function clonePipeline(pipeline: PipelineConfig): PipelineConfig {
  return pipelineSchema.parse(JSON.parse(JSON.stringify(pipeline)))
}

export function pipelinesEqual(a: PipelineConfig, b: PipelineConfig): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export interface PipelineHistoryState {
  past: PipelineConfig[]
  future: PipelineConfig[]
}

export function createEmptyHistory(): PipelineHistoryState {
  return { past: [], future: [] }
}

export function pushHistory(
  history: PipelineHistoryState,
  snapshot: PipelineConfig,
): PipelineHistoryState {
  const entry = clonePipeline(snapshot)
  const past = [...history.past, entry]
  if (past.length > MAX_PIPELINE_HISTORY) {
    past.shift()
  }
  return { past, future: [] }
}

export function undoHistory(
  history: PipelineHistoryState,
  current: PipelineConfig,
): { history: PipelineHistoryState; pipeline: PipelineConfig | null } {
  if (history.past.length === 0) return { history, pipeline: null }
  const past = [...history.past]
  const previous = past.pop()!
  const future = [clonePipeline(current), ...history.future]
  return { history: { past, future }, pipeline: previous }
}

export function redoHistory(
  history: PipelineHistoryState,
  current: PipelineConfig,
): { history: PipelineHistoryState; pipeline: PipelineConfig | null } {
  if (history.future.length === 0) return { history, pipeline: null }
  const future = [...history.future]
  const next = future.shift()!
  const past = [...history.past, clonePipeline(current)]
  return { history: { past, future }, pipeline: next }
}
