import Footer from "@/components/footer";
import Hero from "@/components/hero-section-demo-1";
import BrandScrollVelocitySection from "@/components/home/brand-scroll-section";
import AppPromotionSection from "@/components/home/app-promotion-section";
import FeaturesSection from "@/components/home/features-section";
import PricingSection from "@/components/home/pricing";
import Nav from "@/components/resizable-navbar";
import SmoothScroll from "@/components/smooth-scroll";

export default function LandingPage() {
  return (
    <SmoothScroll>
      <main className="min-w-0 overflow-x-clip bg-background text-foreground">
   
          <div className="relative flex  w-full flex-col items-start justify-start">
            <div className=" w-full">
              <Hero />
              <AppPromotionSection />
              <FeaturesSection />
              <PricingSection />
              <BrandScrollVelocitySection />
              <Footer />
            </div>
          </div>
       
      </main>
    </SmoothScroll>
  );
}


