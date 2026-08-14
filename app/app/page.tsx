import type { Metadata } from "next";
import Footer from "@/components/footer";
import AppPromotionSection from "@/components/home/app-promotion-section";

export const metadata: Metadata = {
  title: "Mobile App | Neurova",
  description:
    "Take your AI study companion with you. Snap a difficult question, review a study set, or squeeze in a quick quiz between classes.",
};
// / cmt
export default function AppPage() {
  return (
    <main className="min-w-0 overflow-x-clip bg-background text-foreground">
      <AppPromotionSection />
      <Footer />
    </main>
  );
}
