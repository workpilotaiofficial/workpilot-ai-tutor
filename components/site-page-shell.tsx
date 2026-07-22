import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

type SitePageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export const SUPPORT_EMAIL = "support@workpilot.ai";

export function SitePageShell({ eyebrow, title, description, children }: SitePageShellProps) {
  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <div className="relative overflow-hidden border-b border-slate-200/70 bg-white">
        <div className="pointer-events-none absolute -left-24 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-thirdary/10 blur-3xl" />
        <header className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
          <Link href="/" className="inline-flex items-center gap-3" aria-label="WorkPilot home">
            <Image src="/icon.png" alt="" width={34} height={34} />
            <span className="text-lg font-semibold tracking-tight">WorkPilot</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
        </header>

        <section className="relative mx-auto max-w-4xl px-5 pb-16 pt-12 text-center sm:px-8 sm:pb-20 sm:pt-16">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-primary">{eyebrow}</p>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-6xl">{title}</h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">{description}</p>
        </section>
      </div>

      <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">{children}</div>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© {new Date().getFullYear()} WorkPilot. All rights reserved.</p>
          <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Legal">
            <Link className="hover:text-slate-950" href="/privacy-policy">Privacy</Link>
            <Link className="hover:text-slate-950" href="/terms-of-service">Terms</Link>
            <Link className="hover:text-slate-950" href="/refund-policy">Refunds</Link>
            <Link className="hover:text-slate-950" href="/contact">Contact</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}

export function PolicyContent({ children }: { children: ReactNode }) {
  return <article className="space-y-10 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.05)] sm:p-10">{children}</article>;
}

export function PolicySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="scroll-mt-24">
      <h2 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">{title}</h2>
      <div className="mt-4 space-y-4 text-[15px] leading-7 text-slate-600 [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-slate-800 [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-2">
        {children}
      </div>
    </section>
  );
}

export function EffectiveDate() {
  return <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500"><strong className="text-slate-700">Effective date:</strong> July 22, 2026</p>;
}
