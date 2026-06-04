import type { PipelineConfig } from '@/lib/schemas/pipeline-schema'
import { normalizeResizeConfig } from '@/lib/image/resize-compute'
import type { ResizeConfig } from '@/lib/schemas/pipeline-schema'
import {
  clonePipeline,
  createEmptyHistory,
  pipelinesEqual,
  pushHistory,
  redoHistory,
  undoHistory,
  type PipelineHistoryState,
} from '@/lib/pipeline-history'

export type PipelineChangeOptions = {
  /** Push the previous pipeline onto the undo stack (default true). */
  recordHistory?: boolean
  /** Leave crop editing mode (e.g. when adjusting rotate/flip). */
  exitCropEditing?: boolean
}

export function normalizePipeline(pipeline: PipelineConfig): PipelineConfig {
  return {
    ...pipeline,
    resize: normalizeResizeConfig(pipeline.resize as ResizeConfig & Record<string, unknown>),
  }
}

export function commitPipelineChange(
  history: PipelineHistoryState,
  previous: PipelineConfig,
  next: PipelineConfig,
  options?: PipelineChangeOptions,
): PipelineHistoryState {
  if (options?.recordHistory === false) return history
  if (pipelinesEqual(previous, next)) return history
  return pushHistory(history, previous)
}

export function applyUndo(
  history: PipelineHistoryState,
  current: PipelineConfig,
): { history: PipelineHistoryState; pipeline: PipelineConfig | null } {
  return undoHistory(history, current)
}

export function applyRedo(
  history: PipelineHistoryState,
  current: PipelineConfig,
): { history: PipelineHistoryState; pipeline: PipelineConfig | null } {
  return redoHistory(history, current)
}

export function initialPipelineHistory(): PipelineHistoryState {
  return createEmptyHistory()
}

export { clonePipeline }
