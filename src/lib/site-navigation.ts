/** Landing-page section anchors used by header and footer hash links. */
export const LANDING_SECTION_IDS = {
  features: 'features',
  howItWorks: 'how-it-works',
  faq: 'faq',
  support: 'support',
} as const

export function scrollToLandingSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  window.history.pushState(null, '', `#${id}`)
}

/** Primary header nav — identical on every page. */
export const SITE_HEADER_LINKS = [
  { kind: 'hash', id: LANDING_SECTION_IDS.features, label: 'Features', minWidth: 'md' },
  { kind: 'hash', id: LANDING_SECTION_IDS.howItWorks, label: 'How it works', minWidth: 'lg' },
  { kind: 'route', to: '/blog', label: 'Blog', minWidth: 'sm' },
] as const

export type SiteHeaderLink = (typeof SITE_HEADER_LINKS)[number]

export function headerLinkVisibility(minWidth: SiteHeaderLink['minWidth']) {
  switch (minWidth) {
    case 'sm':
      return 'hidden sm:inline-flex'
    case 'md':
      return 'hidden md:inline-flex'
    case 'lg':
      return 'hidden lg:inline-flex'
  }
}
