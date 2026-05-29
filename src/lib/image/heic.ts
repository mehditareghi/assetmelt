export async function convertHeicToJpeg(file: File): Promise<{ blob: Blob; name: string }> {
  const heic2any = (await import('heic2any')).default
  const result = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.92,
  })
  const blob = Array.isArray(result) ? result[0] : result
  const name = file.name.replace(/\.(heic|heif)$/i, '.jpg')
  return { blob: blob as Blob, name }
}

export async function prepareFileForProcessing(
  file: File,
  inputFormat: string,
): Promise<{ file: File; inputFormat: string }> {
  if (inputFormat === 'heic') {
    const { blob, name } = await convertHeicToJpeg(file)
    return {
      file: new File([blob], name, { type: 'image/jpeg' }),
      inputFormat: 'jpeg',
    }
  }
  return { file, inputFormat }
}
