import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { HeroSection } from '@/components/landing/hero-section'
import { FeaturesSection } from '@/components/landing/features-section'
import { HowItWorksSection } from '@/components/landing/how-it-works-section'
import { TechStrip } from '@/components/landing/tech-strip'
import { SupportSection } from '@/components/landing/support-section'

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader variant="landing" />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TechStrip />
        <SupportSection />
      </main>
      <SiteFooter />
    </div>
  )
}
