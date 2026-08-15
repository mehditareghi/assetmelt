import type { OxipngOptions } from '@/lib/schemas/pipeline-schema'

type ImagequantModule = {
  quantize: (
    data: Uint8Array,
    width: number,
    height: number,
    numColors: number,
    dither: number,
  ) => Uint8ClampedArray
}

let modulePromise: Promise<ImagequantModule> | null = null

async function loadImagequant(): Promise<ImagequantModule> {
  if (!modulePromise) {
    const { default: factory } = await import('@squoosh-kit/imagequant-wasm')
    modulePromise = factory()
  }
  return modulePromise
}

/** Reduce unique colors (lossy). Copy pixels off the WASM heap before returning. */
export async function quantizeImageData(
  imageData: ImageData,
  options: Pick<OxipngOptions, 'numColors' | 'dither'>,
): Promise<ImageData> {
  const module = await loadImagequant()
  const input = Uint8Array.from(imageData.data)
  const result = module.quantize(
    input,
    imageData.width,
    imageData.height,
    options.numColors,
    options.dither,
  )
  if (!result) {
    throw new Error('Palette quantization failed')
  }
  return new ImageData(new Uint8ClampedArray(result), imageData.width, imageData.height)
}
