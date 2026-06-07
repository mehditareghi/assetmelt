import interLatinWoff2 from '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url'
import jetbrainsLatinWoff2 from '@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2?url'
import bricolageLatinWoff2 from '@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-opsz-normal.woff2?url'

/** Preload hrefs — must match the woff2 files referenced in src/styles/fonts.css. */
export const fontPreloads = [
  {
    href: interLatinWoff2,
    type: 'font/woff2',
  },
  {
    href: jetbrainsLatinWoff2,
    type: 'font/woff2',
  },
  {
    href: bricolageLatinWoff2,
    type: 'font/woff2',
  },
] as const
