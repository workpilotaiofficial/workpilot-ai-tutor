import type { Metadata } from "next";
import Footer from "@/components/footer";
import PricingSection from "@/components/home/pricing";

export const metadata: Metadata = {
  title: "Pricing | Neurova",
  description:
    "Simple, transparent pricing for Neurova's AI study platform. Choose the perfect plan for your learning journey.",
};

export default function PricingPage() {
  return (
    <main className="min-w-0 overflow-x-clip bg-background text-foreground">
      <PricingSection />
      <Footer />
    </main>
  );
}
