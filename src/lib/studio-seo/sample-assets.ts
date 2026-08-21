/**
 * Free stock samples for studio conversion SEO before/after blocks.
 * Licenses: Unsplash License / Pexels License (free commercial use).
 * See public/studio-seo/CREDITS.txt
 */
export const STUDIO_SEO_SAMPLE_SRC = {
  photo: '/studio-seo/photo.jpg',
  graphic: '/studio-seo/graphic.jpg',
  icon: '/studio-seo/icon.jpg',
  scan: '/studio-seo/scan.jpg',
  screenshot: '/studio-seo/screenshot.jpg',
} as const

export const STUDIO_SEO_SAMPLE_ALT: Record<keyof typeof STUDIO_SEO_SAMPLE_SRC, string> = {
  photo: 'Mountain landscape photograph used as a typical photo compression sample',
  graphic: 'Ceramic mug product photo on a white backdrop',
  icon: 'Colorful geometric game pieces used as an icon-style still',
  scan: 'Close-up of a handwritten document page',
  screenshot: 'Smartphone showing an app dashboard in a workspace',
}
