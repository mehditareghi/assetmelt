declare module '@squoosh-kit/imagequant-wasm' {
  interface ImagequantModule {
    quantize(
      data: Uint8Array,
      width: number,
      height: number,
      numColors: number,
      dither: number,
    ): Uint8ClampedArray
  }

  const factory: (opts?: Record<string, unknown>) => Promise<ImagequantModule>
  export default factory
}
