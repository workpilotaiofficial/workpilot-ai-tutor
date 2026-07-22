import Footer from "@/components/footer";
import Hero from "@/components/hero-section-demo-1";
import BrandScrollVelocitySection from "@/components/home/brand-scroll-section";
import FeaturesSection from "@/components/home/features-section";
import PricingSection from "@/components/home/pricing";
import Nav from "@/components/resizable-navbar";
import SmoothScroll from "@/components/smooth-scroll";

export default function LandingPage() {
  return (
    <SmoothScroll>
      <main className="min-h-screen bg-background text-foreground">
        <Nav>
          <div className="relative flex min-h-screen w-full flex-col items-start justify-start">
            <div className=" w-full">
              <Hero />
              <FeaturesSection />
              <PricingSection />
              <BrandScrollVelocitySection />
              <Footer />
            </div>
          </div>
        </Nav>
      </main>
    </SmoothScroll>
  );
}
