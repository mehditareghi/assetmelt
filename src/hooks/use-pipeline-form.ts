import { useEffect } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { pipelineSchema, type PipelineConfig } from '@/lib/schemas/pipeline-schema'
import { useStudioStore } from '@/stores/studio-store'

/** Syncs react-hook-form + zod validation with the zustand pipeline store. */
export function usePipelineForm() {
  const pipeline = useStudioStore((s) => s.pipeline)
  const setPipeline = useStudioStore((s) => s.setPipeline)

  const form = useForm<PipelineConfig>({
    resolver: zodResolver(pipelineSchema) as Resolver<PipelineConfig>,
    defaultValues: pipeline,
    mode: 'onChange',
  })

  useEffect(() => {
    form.reset(pipeline)
  }, [pipeline, form])

  const commit = form.handleSubmit((values) => {
    setPipeline(pipelineSchema.parse(values))
  })

  return { form, commit }
}
