import { chunkZipFilename } from '@/lib/batch-memory'
import { buildProcessedZip, type PackedBatchZip } from '@/lib/download-results'
import type { ProcessableFile } from '@/lib/image/types'

export async function packBatchChunk(
  files: ProcessableFile[],
  part: number,
  activePresetId: string,
): Promise<PackedBatchZip> {
  const { blob, count } = await buildProcessedZip(files, activePresetId)
  return {
    name: chunkZipFilename(part),
    blob,
    count,
    fileIds: files.map((file) => file.id),
  }
}
