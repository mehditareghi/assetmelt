export const SITE_URL = 'https://assetmelt.com'

export const SITE_NAME = 'Asset Melt'

export const SITE_AUTHOR = 'Mehdi Tareghi'

export const SITE_CONTACT_EMAIL = 'mehditareghi@gmail.com'

export const SITE_SOCIAL = {
  github: 'https://github.com/mehditareghi',
  linkedin: 'https://linkedin.com/in/mehditareghi',
} as const

export const DEFAULT_OG_IMAGE = `${SITE_URL}/og.png`

/** Trust / E-E-A-T pages included in sitemap generation. */
export const TRUST_PAGE_PATHS = ['/privacy', '/about', '/author'] as const

export type TrustPagePath = (typeof TRUST_PAGE_PATHS)[number]
