/**
 * Apple Liquid Glass material tokens (reverse-engineered).
 *
 * Apple does not publish exact CSS values. Two tiers appear in apple.com DOM
 * inspection (sohumsuthar/liquid-glass, MIT):
 *
 * - **navigation** — `.lg-navbar` Dynamic Island / floating nav pills
 * - **panel** — `.liquid-glass-tint` inner cards & Control Center wrappers
 *
 * WWDC 2025: small nav chrome uses thinner material than large panels.
 *
 * @see https://github.com/sohumsuthar/liquid-glass/blob/main/css/liquid-glass-nav.css
 * @see https://github.com/sohumsuthar/liquid-glass/blob/main/css/liquid-glass-core.css
 */

/** Floating nav pill — matches `.lg-navbar` (NOT the 40%/30% panel fills). */
export const LIQUID_GLASS_NAV = {
  tint: {
    /** Same #FFFFFF base as `.lg-navbar`, boosted for nav label legibility */
    light: 'rgba(255, 255, 255, 0.60)',
    /** Same #1C1C1E base as `.lg-navbar`, boosted for nav label legibility */
    dark: 'rgba(28, 28, 30, 0.70)',
  },
  border: {
    light: '0.5px solid rgba(0, 0, 0, 0.06)',
    dark: '0.5px solid rgba(255, 255, 255, 0.08)',
  },
  shadow: {
    light: '0 0 0 0.5px rgba(0, 0, 0, 0.04), 0 10px 32px rgba(0, 0, 0, 0.06)',
    dark: '0 0 0 0.5px rgba(0, 0, 0, 0.3), 0 10px 32px rgba(0, 0, 0, 0.25)',
  },
  /** Inset "lit bezel" — `.liquid-glass-shine` convex rim from liquid-glass-core.css */
  shine: {
    light:
      'inset 0 0 0 1px rgba(255, 255, 255, 0.6), inset 0 0 6px 0 rgba(255, 255, 255, 0.3), inset 0 2px 4px -2px rgba(255, 255, 255, 0.9), inset 0 -2px 4px -2px rgba(0, 0, 0, 0.06)',
    dark:
      'inset 0 0 0 1px rgba(255, 255, 255, 0.06), inset 0 0 6px 0 rgba(255, 255, 255, 0.04), inset 0 2px 4px -2px rgba(255, 255, 255, 0.18), inset 0 -2px 4px -2px rgba(0, 0, 0, 0.25)',
  },
  /** Chrome — refraction from SVG filter; minimal blur in the stack. */
  frost: {
    blur: '2px',
    saturate: 1.8,
    brightness: 1.06,
    contrast: 1.04,
  },
  /**
   * Safari / Firefox — SVG `url(#filter)` in backdrop-filter is unsupported
   * (WebKit #245510). Heavy frost approximates the frosted-glass read.
   */
  frostFallback: {
    blur: '20px',
    saturate: 1.8,
    brightness: { light: 1.08, dark: 1.15 },
    contrast: 1.04,
  },
} as const

/** Larger glass panels — Control Center cards, macro wrappers. */
export const LIQUID_GLASS_PANEL = {
  tint: {
    light: 'rgba(255, 255, 255, 0.40)',
    dark: 'rgba(28, 28, 32, 0.30)',
  },
} as const

export type LiquidGlassMaterial = 'navigation'

export function liquidGlassFrostFilter(frost: typeof LIQUID_GLASS_NAV.frost) {
  return `blur(${frost.blur}) saturate(${frost.saturate}) brightness(${frost.brightness}) contrast(${frost.contrast})`
}

export function liquidGlassSafariFrostFilter(
  frost: typeof LIQUID_GLASS_NAV.frostFallback,
  theme: 'light' | 'dark',
) {
  return `blur(${frost.blur}) saturate(${frost.saturate}) brightness(${frost.brightness[theme]}) contrast(${frost.contrast})`
}

export function liquidGlassSvgBackdropFilter(
  filterId: string,
  frost: typeof LIQUID_GLASS_NAV.frost,
) {
  return `url(#${filterId}) saturate(${frost.saturate}) brightness(${frost.brightness}) contrast(${frost.contrast})`
}
