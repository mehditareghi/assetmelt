import { FeaturesSection } from "@/components/landing/features-section";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { SupportSection } from "@/components/landing/support-section";
import { TechStrip } from "@/components/landing/tech-strip";
import { buildLandingJsonLd, buildSeoHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";

const LANDING_DESCRIPTION =
  "Free client-side image compressor and converter. Compress, convert, and transform JPEG, PNG, WebP, AVIF, HEIC, and more in your browser — zero uploads, Squoosh-grade WASM codecs.";

export const Route = createFileRoute("/")({
  head: () =>
    buildSeoHead({
      title: "Asset Melt — Free Client-Side Image Compressor & Converter",
      description: LANDING_DESCRIPTION,
      path: "/",
      jsonLd: buildLandingJsonLd(LANDING_DESCRIPTION),
    }),
  component: Index,
});

function Index() {
  return (
    <main className="flex-1">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TechStrip />
      <SupportSection />
    </main>
  );
}
