import { cn } from '@/lib/utils'

export interface ResponsivePictureProps {
  avif: string | null
  webp: string
  jpeg: string
  alt: string
  width?: number
  height?: number
  className?: string
  imgClassName?: string
  fetchPriority?: 'high' | 'low' | 'auto'
  loading?: 'lazy' | 'eager'
  decoding?: 'async' | 'sync' | 'auto'
}

/**
 * AVIF primary, WebP fallback, JPEG img src — the pattern we recommend in every guide.
 */
export function ResponsivePicture({
  avif,
  webp,
  jpeg,
  alt,
  width,
  height,
  className,
  imgClassName,
  fetchPriority,
  loading,
  decoding = 'async',
}: ResponsivePictureProps) {
  return (
    <picture className={className}>
      {avif ? <source srcSet={avif} type="image/avif" /> : null}
      <source srcSet={webp} type="image/webp" />
      <img
        src={jpeg}
        alt={alt}
        width={width}
        height={height}
        className={cn('h-auto w-full', imgClassName)}
        fetchPriority={fetchPriority}
        loading={loading}
        decoding={decoding}
      />
    </picture>
  )
}
