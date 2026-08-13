import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BookOpenCheck,
  Check,
  CheckCircle2,
  ChevronRight,
  FileCheck2,
  FileText,
  Flame,
  Layers3,
  ListChecks,
  MessageSquareText,
  Sparkles,
  Target,
  Upload,
} from "lucide-react";
import Link from "next/link";
import Footer from "@/components/footer";

export type FeaturePreview = "study-sets" | "syllabus" | "grader";

export type FeatureDetailConfig = {
  preview: FeaturePreview;
  eyebrow: string;
  title: string;
  highlightedTitle: string;
  description: string;
  icon: LucideIcon;
  dashboardHref: string;
  primaryCta: string;
  stats: { value: string; label: string }[];
  steps: { title: string; description: string }[];
  capabilities: { icon: LucideIcon; title: string; description: string }[];
  detail: {
    eyebrow: string;
    title: string;
    description: string;
    points: string[];
  };
};

const featureLinks = [
  {
    name: "Study Sets",
    description: "Create a complete learning workspace",
    href: "/features/study-sets",
    icon: Layers3,
  },
  {
    name: "Syllabus Intelligence",
    description: "Turn a syllabus into a clear plan",
    href: "/features/syllabus-intelligence",
    icon: BookOpenCheck,
  },
  {
    name: "Paper Grader",
    description: "Get rubric-grounded feedback",
    href: "/features/paper-grader",
    icon: FileCheck2,
  },
];

export default function FeatureDetailPage({ config }: { config: FeatureDetailConfig }) {
  const Icon = config.icon;

  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-950">
      <section className="relative border-b border-slate-200/70 bg-[#f8faff] px-5 pb-20 pt-12 sm:px-8 sm:pb-28 sm:pt-16">
        <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(21,101,247,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(21,101,247,.045)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        <div className="pointer-events-none absolute left-1/2 top-[-20rem] h-[42rem] w-[70rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(21,101,247,.16),transparent_68%)]" />

        <div className="relative mx-auto max-w-7xl">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/features" className="transition hover:text-primary">Features</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-medium text-slate-800">{config.eyebrow}</span>
          </nav>

          <div className="mt-12 grid items-center gap-14 lg:grid-cols-[.9fr_1.1fr] lg:gap-20">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white px-3.5 py-2 text-xs font-semibold text-primary shadow-sm">
                <Icon className="h-3.5 w-3.5" /> {config.eyebrow}
              </div>
              <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-[1.02] tracking-[-0.055em] sm:text-6xl lg:text-[4.25rem]">
                {config.title}{" "}
                <span className="text-primary">{config.highlightedTitle}</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
                {config.description}
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href={config.dashboardHref} className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_35px_rgba(21,101,247,.25)] transition hover:-translate-y-0.5 hover:brightness-95">
                  {config.primaryCta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="#how-it-works" className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950">
                  See how it works
                </Link>
              </div>
              <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-xs font-medium text-slate-500">
                {["Start free", "No credit card required", "Your work stays organized"].map((item) => (
                  <span key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" /> {item}
                  </span>
                ))}
              </div>
            </div>

            <ProductPreview type={config.preview} />
          </div>

          <div className="mt-16 grid overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm sm:grid-cols-3">
            {config.stats.map((stat, index) => (
              <div key={stat.label} className={`px-6 py-6 text-center ${index ? "border-t border-slate-200 sm:border-l sm:border-t-0" : ""}`}>
                <p className="text-2xl font-semibold tracking-tight text-slate-950">{stat.value}</p>
                <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Simple from the first step</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">From source to next action</h2>
            <p className="mx-auto mt-5 max-w-2xl leading-7 text-slate-600">A focused workflow that removes setup work and keeps the useful output in one place.</p>
          </div>
          <div className="relative mt-14 grid gap-4 md:grid-cols-3">
            <div className="pointer-events-none absolute left-[16%] right-[16%] top-10 hidden h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent md:block" />
            {config.steps.map((step, index) => (
              <article key={step.title} className="relative rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_15px_45px_rgba(15,23,42,.045)] sm:p-8">
                <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-white shadow-lg shadow-primary/20">0{index + 1}</span>
                <h3 className="mt-6 text-xl font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200/70 bg-[#f8faff] px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">What you get</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Everything you need to move forward</h2>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {config.capabilities.map(({ icon: CapabilityIcon, title, description }) => (
              <article key={title} className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,.04)]">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/[.08] text-primary"><CapabilityIcon className="h-5 w-5" /></div>
                <h3 className="mt-5 font-semibold tracking-tight">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <DetailVisual type={config.preview} />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">{config.detail.eyebrow}</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">{config.detail.title}</h2>
            <p className="mt-5 text-base leading-8 text-slate-600">{config.detail.description}</p>
            <ul className="mt-7 space-y-3">
              {config.detail.points.map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm leading-6 text-slate-700">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Check className="h-3 w-3 stroke-[3]" /></span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200/70 bg-[#f8faff] px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Explore Neurova</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">One feature, connected to the rest</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {featureLinks.map(({ name, description, href, icon: LinkIcon }) => {
              const active = href.endsWith(config.preview === "syllabus" ? "syllabus-intelligence" : config.preview === "grader" ? "paper-grader" : "study-sets");
              return (
                <Link key={name} href={href} aria-current={active ? "page" : undefined} className={`group rounded-2xl border p-5 transition ${active ? "border-primary/25 bg-primary/[.06]" : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"}`}>
                  <div className="flex items-center gap-4">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${active ? "bg-primary text-white" : "bg-slate-100 text-slate-600 group-hover:bg-primary/10 group-hover:text-primary"}`}><LinkIcon className="h-5 w-5" /></span>
                    <div className="flex-1">
                      <p className="font-semibold">{name}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
                    </div>
                    {!active && <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-primary" />}
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="relative mt-16 overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-14 text-center text-white sm:px-12 sm:py-16">
            <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(#60a5fa_1px,transparent_1px)] [background-size:22px_22px]" />
            <div className="pointer-events-none absolute left-1/2 top-0 h-60 w-96 -translate-x-1/2 rounded-full bg-primary/30 blur-[90px]" />
            <div className="relative">
              <Sparkles className="mx-auto h-7 w-7 text-blue-300" />
              <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Make your next study session count.</h2>
              <p className="mx-auto mt-5 max-w-xl leading-7 text-slate-300">Bring the material you already have. Neurova helps turn it into a clear next step.</p>
              <Link href={config.dashboardHref} className="group mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5">
                {config.primaryCta}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function WindowFrame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-2 shadow-[0_30px_80px_rgba(30,64,175,.15)] sm:p-3">
      <div className="flex items-center gap-1.5 px-3 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-300" /><span className="h-2.5 w-2.5 rounded-full bg-amber-300" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        <span className="ml-3 text-[10px] font-medium uppercase tracking-[.16em] text-slate-400">{label}</span>
      </div>
      <div className="rounded-[1.25rem] border border-slate-100 bg-[#f8faff] p-4 sm:p-6">{children}</div>
    </div>
  );
}

function ProductPreview({ type }: { type: FeaturePreview }) {
  if (type === "study-sets") {
    const formats = [
      ["Smart notes", FileText, "bg-blue-50 text-blue-600"],
      ["Flashcards", Layers3, "bg-violet-50 text-violet-600"],
      ["Practice quiz", ListChecks, "bg-emerald-50 text-emerald-600"],
      ["AI tutor", MessageSquareText, "bg-amber-50 text-amber-600"],
    ] as const;
    return <WindowFrame label="Study set workspace"><div className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Upload className="h-4 w-4" /></span><div className="flex-1"><p className="text-xs font-semibold">Cell biology — Chapter 4.pdf</p><div className="mt-2 h-1.5 rounded-full bg-slate-100"><div className="h-full w-full rounded-full bg-primary" /></div></div><span className="text-[10px] font-semibold text-primary">Ready</span></div></div><div className="mt-3 grid grid-cols-2 gap-3">{formats.map(([label, FormatIcon, style]) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4"><span className={`flex h-8 w-8 items-center justify-center rounded-lg ${style}`}><FormatIcon className="h-3.5 w-3.5" /></span><p className="mt-3 text-xs font-semibold">{label}</p><div className="mt-2 h-1 w-2/3 rounded-full bg-slate-100" /></div>)}</div></WindowFrame>;
  }

  if (type === "syllabus") {
    return <WindowFrame label="Syllabus analysis"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-primary">Course overview</p><p className="mt-1 text-sm font-semibold">Introduction to Psychology</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-semibold text-emerald-600">12 weeks</span></div><div className="mt-5 grid grid-cols-3 gap-2">{[["8", "Modules"], ["12", "Weeks"], ["6", "Priorities"]].map(([value,label]) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-3 text-center"><p className="font-semibold">{value}</p><p className="mt-1 text-[9px] text-slate-500">{label}</p></div>)}</div><div className="mt-5 space-y-0">{["Foundations & methods", "Memory and cognition", "Development & behavior"].map((item,index) => <div key={item} className="relative flex gap-3 pb-5 last:pb-0"><span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">{index + 1}</span>{index < 2 && <span className="absolute bottom-0 left-[13px] top-7 w-px bg-primary/20" />}<div><p className="text-xs font-semibold">{item}</p><p className="mt-1 text-[10px] text-slate-500">Week {index * 2 + 1} · {index < 2 ? "High" : "Medium"} priority</p></div></div>)}</div></WindowFrame>;
  }

  return <WindowFrame label="Rubric-based grading"><div className="flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-emerald-600">Grading complete</p><p className="mt-1 text-sm font-semibold">Research essay</p></div><p className="text-3xl font-semibold text-emerald-600">84%</p></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-[84%] rounded-full bg-emerald-500" /></div><div className="mt-5 space-y-2">{[["Argument & evidence", "22/25"], ["Critical analysis", "24/30"], ["Structure & clarity", "21/25"]].map(([label,score]) => <div key={label} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2.5 text-xs"><span className="text-slate-600">{label}</span><span className="font-semibold">{score}</span></div>)}</div><div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Key strength</p><p className="mt-1 text-[10px] leading-4 text-emerald-900/70">Clear evidence and a well-supported central argument.</p></div></WindowFrame>;
}

function DetailVisual({ type }: { type: FeaturePreview }) {
  if (type === "study-sets") {
    return <div className="rounded-[2rem] border border-slate-200 bg-[#f8faff] p-5 shadow-[0_24px_60px_rgba(15,23,42,.08)] sm:p-8"><div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-primary">Mastery overview</p><p className="mt-1 font-semibold">Cell biology</p></div><Target className="h-5 w-5 text-primary" /></div><div className="mt-6 grid grid-cols-4 gap-2">{[["8", "New", "bg-slate-100"], ["14", "Learning", "bg-amber-100"], ["21", "Familiar", "bg-blue-100"], ["32", "Mastered", "bg-emerald-100"]].map(([value,label,color]) => <div key={label} className={`rounded-xl p-3 text-center ${color}`}><p className="font-semibold">{value}</p><p className="mt-1 text-[9px] text-slate-600">{label}</p></div>)}</div><div className="mt-6 space-y-3">{["Cell membrane", "Mitosis and meiosis", "Protein synthesis"].map((label,index) => <div key={label}><div className="flex justify-between text-[11px]"><span className="font-medium">{label}</span><span className="text-slate-400">{[92,76,61][index]}%</span></div><div className="mt-1.5 h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-primary" style={{width: `${[92,76,61][index]}%`}} /></div></div>)}</div></div></div>;
  }
  if (type === "syllabus") {
    return <div className="rounded-[2rem] border border-slate-200 bg-[#f8faff] p-5 shadow-[0_24px_60px_rgba(15,23,42,.08)] sm:p-8"><div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-primary">Priority topics</p><p className="mt-1 font-semibold">Know where to focus</p></div><Flame className="h-5 w-5 text-orange-500" /></div><div className="mt-6 space-y-3">{[["Cognitive processes", "High", "bg-red-500"], ["Research methods", "High", "bg-red-500"], ["Social development", "Medium", "bg-amber-400"], ["Historical foundations", "Low", "bg-slate-400"]].map(([topic,priority,dot]) => <div key={topic} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3"><span className={`h-2.5 w-2.5 rounded-full ${dot}`} /><span className="flex-1 text-xs font-medium">{topic}</span><span className="text-[10px] text-slate-500">{priority}</span></div>)}</div></div></div>;
  }
  return <div className="rounded-[2rem] border border-slate-200 bg-[#f8faff] p-5 shadow-[0_24px_60px_rgba(15,23,42,.08)] sm:p-8"><div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-bold uppercase tracking-wider text-primary">Actionable feedback</p><p className="mt-1 font-semibold">What to keep. What to improve.</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4"><CheckCircle2 className="h-4 w-4 text-emerald-600" /><p className="mt-3 text-xs font-semibold text-emerald-900">Strengths</p><p className="mt-2 text-[11px] leading-5 text-emerald-900/65">Strong thesis, relevant evidence, and a logical flow between sections.</p></div><div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4"><Target className="h-4 w-4 text-amber-600" /><p className="mt-3 text-xs font-semibold text-amber-900">Next improvements</p><p className="mt-2 text-[11px] leading-5 text-amber-900/65">Deepen counter-analysis and make the final paragraph more conclusive.</p></div></div><div className="mt-3 rounded-xl bg-slate-950 p-4 text-white"><p className="text-[10px] font-semibold uppercase tracking-wider text-blue-300">Overall feedback</p><p className="mt-2 text-[11px] leading-5 text-slate-300">A clear, evidence-led submission with specific opportunities to strengthen critical depth.</p></div></div></div>;
}
