import { HeroSection } from '@/components/landing/hero-section'
import { FeaturesSection } from '@/components/landing/features-section'
import { HowItWorksSection } from '@/components/landing/how-it-works-section'
import { TechStrip } from '@/components/landing/tech-strip'
import { SupportSection } from '@/components/landing/support-section'

export function LandingPage() {
  return (
    <main className="flex-1">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TechStrip />
      <SupportSection />
    </main>
  )
}
