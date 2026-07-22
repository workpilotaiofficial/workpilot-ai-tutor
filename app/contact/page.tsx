import type { Metadata } from "next";
import { Clock3, CreditCard, LifeBuoy, Mail, MessageSquareText } from "lucide-react";
import { SitePageShell, SUPPORT_EMAIL } from "@/components/site-page-shell";

export const metadata: Metadata = { title: "Contact Us | WorkPilot", description: "Contact WorkPilot for product, account, billing, or privacy support." };

const topics = [
  { icon: LifeBuoy, title: "Product support", text: "Questions about study sets, syllabus analysis, grading, or your account." },
  { icon: CreditCard, title: "Billing & refunds", text: "Include your invoice or payment reference—never your full card number." },
  { icon: MessageSquareText, title: "Privacy & legal", text: "Submit a data request or ask about our policies and terms." },
];

export default function ContactPage() {
  return (
    <SitePageShell eyebrow="Support" title="How can we help?" description="Tell us what you need and our team will point you in the right direction. Please include enough detail for us to investigate.">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.05)] sm:p-9">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Mail className="h-5 w-5" /></div>
          <h2 className="mt-6 text-2xl font-semibold tracking-tight text-slate-950">Email our support team</h2>
          <p className="mt-3 leading-7 text-slate-600">For the fastest help, email us from the address connected to your WorkPilot account and include the feature you were using, what happened, and any relevant error message.</p>
          <a href={`mailto:${SUPPORT_EMAIL}?subject=WorkPilot support request`} className="mt-7 inline-flex rounded-full bg-gradient-to-r from-button to-thirdary px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5">{SUPPORT_EMAIL}</a>
          <div className="mt-8 flex items-start gap-3 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p><strong className="text-slate-800">Typical response:</strong> within 2 business days. Complex billing, privacy, or technical investigations may take longer.</p>
          </div>
        </section>

        <aside className="space-y-4">
          {topics.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-thirdary/10 text-thirdary"><Icon className="h-5 w-5" /></div>
                <div><h2 className="font-semibold text-slate-900">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{text}</p></div>
              </div>
            </div>
          ))}
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
            <strong>Keep your account secure.</strong> WorkPilot support will never ask for your password, full payment-card number, or authentication code.
          </div>
        </aside>
      </div>
    </SitePageShell>
  );
}
