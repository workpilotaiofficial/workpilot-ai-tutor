import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  BrainCircuit,
  CalendarRange,
  Check,
  ClipboardCheck,
  FileAudio,
  FileText,
  GraduationCap,
  Headphones,
  Layers3,
  ListChecks,
  PenLine,
  Route,
  SlidersHorizontal,
  Sparkles,
  Target,
  Upload,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Features | Neurova AI Study Platform",
  description:
    "Turn source material into complete study systems with AI study sets, syllabus intelligence, paper grading, personalized learning, and mastery tracking.",
};

const studyModes = [
  { name: "Structured notes", icon: FileText, color: "bg-blue-50 text-blue-600" },
  { name: "Multiple choice", icon: ListChecks, color: "bg-violet-50 text-violet-600" },
  { name: "Flashcards", icon: Layers3, color: "bg-amber-50 text-amber-600" },
  { name: "Tutor lesson", icon: GraduationCap, color: "bg-emerald-50 text-emerald-600" },
  { name: "Written tests", icon: PenLine, color: "bg-rose-50 text-rose-600" },
  { name: "Fill in the blanks", icon: BookOpenCheck, color: "bg-cyan-50 text-cyan-600" },
  // { name: "Podcast", icon: Headphones, color: "bg-fuchsia-50 text-fuchsia-600" },
];

const featureGroups = [
  {
    eyebrow: "Study sets",
    title: "One source. Seven ways to learn.",
    description:
      "Upload a document or paste text once, then choose exactly the formats you need. Every output stays together in one study set instead of becoming another pile of disconnected AI responses.",
    icon: BrainCircuit,
    gradient: "from-[#5B65E0] to-[#5100A7]",
    points: [
      "Generate only the formats that fit your goal",
      "Review each format from a unified overview",
      "Retry an individual output without restarting everything",
      "Move from understanding to active recall in the same workspace",
    ],
    visual: "modes" as const,
  },
  {
    eyebrow: "Syllabus intelligence",
    title: "Turn a syllabus into an action plan.",
    description:
      "Neurova reads a pasted or uploaded syllabus and organizes it into useful modules, priorities, and a timeline—so a long course document becomes a plan you can actually follow.",
    icon: Route,
    gradient: "from-[#0EA5E9] to-[#5B65E0]",
    points: [
      "Upload PDF syllabi or paste syllabus text",
      "See course structure broken into clear modules",
      "Surface priorities and important learning areas",
      "Return to previous analyses from your history",
    ],
    visual: "timeline" as const,
  },
  {
    eyebrow: "AI paper grader",
    title: "Feedback grounded in the actual rubric.",
    description:
      "Submit an assignment with its marking rubric and get structured feedback tied to the material provided. It is a focused review workflow—not a vague, one-prompt score.",
    icon: ClipboardCheck,
    gradient: "from-[#10B981] to-[#0F766E]",
    points: [
      "Upload PDF, Word, or text documents up to 50 MB",
      "Grade against an accompanying rubric",
      "Receive structured strengths and improvement feedback",
      "Keep results available for later review",
    ],
    visual: "grade" as const,
  },
];

const supportingFeatures = [
  {
    icon: Target,
    title: "Mastery tracking",
    text: "Track material from unfamiliar to learning, familiar, and mastered, with progress across practice formats.",
  },
  {
    icon: SlidersHorizontal,
    title: "Personalized AI",
    text: "Tune explanation depth, note format, study pace, practice style, tutor approach, tone, and learning goals.",
  },
  {
    icon: BarChart3,
    title: "Transparent usage",
    text: "See your credit balance, plan allotment, period usage, invoices, and optional top-up packs in one place.",
  },
  {
    icon: CalendarRange,
    title: "Built for continuity",
    text: "Reopen generated work, revisit syllabus analyses, and continue studying instead of losing useful output in a chat thread.",
  },
];

export default function FeaturesPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f8f9fd] text-slate-950">


      <section className="relative px-5 pb-24 pt-20 sm:px-8 sm:pb-32 sm:pt-28">
        <div className="pointer-events-none absolute left-1/2 top-[-18rem] h-[38rem] w-[64rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(91,101,224,0.18),rgba(81,0,167,0.08)_45%,transparent_72%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(#5B65E0_0.7px,transparent_0.7px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-4 py-2 text-xs font-semibold text-primary shadow-sm backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> One intelligent learning workspace
          </div>
          <h1 className="mx-auto mt-7 max-w-4xl text-4xl font-semibold leading-[1.04] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
            Your course material becomes a complete{" "}
            <span className="bg-gradient-to-r from-button via-thirdary to-primary bg-clip-text text-transparent">study system.</span>
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            Neurova connects content creation, practice, planning, feedback, and progress—so you can spend less time organizing tools and more time learning.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/login" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-button to-thirdary px-7 py-3.5 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(81,0,167,0.25)] transition hover:-translate-y-1">
              Open your workspace <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/pricing" className="rounded-full border border-slate-200 bg-white px-7 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950">
              View pricing
            </Link>
          </div>
        </div>

        <div className="relative mx-auto mt-16 max-w-6xl rounded-[2rem] border border-white bg-white/75 p-4 shadow-[0_35px_100px_rgba(44,50,110,0.14)] backdrop-blur sm:p-7">
          <div className="grid items-center gap-5 lg:grid-cols-[0.8fr_auto_1.5fr]">
            <div className="rounded-2xl border border-dashed border-primary/25 bg-primary/[0.035] p-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-primary shadow-md"><Upload className="h-6 w-6" /></div>
              <p className="mt-4 font-semibold">Your source material</p>
              <p className="mt-1 text-sm text-slate-500">Upload a file or paste text</p>
            </div>
            <ArrowRight className="mx-auto h-6 w-6 rotate-90 text-slate-300 lg:rotate-0" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {studyModes.map(({ name, icon: Icon, color }) => (
                <div key={name} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm last:sm:col-start-2">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${color}`}><Icon className="h-4 w-4" /></div>
                  <p className="mt-3 text-sm font-semibold text-slate-800">{name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200/70 bg-white px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-7xl space-y-24 sm:space-y-32">
          {featureGroups.map((feature, index) => (
            <div key={feature.title} className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
              <div className={index % 2 ? "lg:order-2" : ""}>
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg`}><feature.icon className="h-6 w-6" /></div>
                <p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-primary">{feature.eyebrow}</p>
                <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">{feature.title}</h2>
                <p className="mt-5 text-base leading-8 text-slate-600">{feature.description}</p>
                <ul className="mt-7 space-y-3">
                  {feature.points.map((point) => (
                    <li key={point} className="flex items-start gap-3 text-sm leading-6 text-slate-700"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Check className="h-3 w-3 stroke-[3]" /></span>{point}</li>
                  ))}
                </ul>
              </div>
              <FeatureVisual type={feature.visual} className={index % 2 ? "lg:order-1" : ""} />
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Designed around how you learn</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">More than generation</h2>
            <p className="mt-5 text-base leading-8 text-slate-600">Neurova helps you turn generated material into an ongoing learning process.</p>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {supportingFeatures.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.04)]">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-thirdary/10 text-thirdary"><Icon className="h-5 w-5" /></div>
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-24 sm:px-8 sm:pb-32">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-button via-thirdary to-primary px-6 py-16 text-center text-white shadow-[0_35px_90px_rgba(81,0,167,0.28)] sm:px-12 sm:py-20">
          <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:22px_22px]" />
          <div className="relative">
            <FileAudio className="mx-auto h-9 w-9 text-white/80" />
            <h2 className="mx-auto mt-6 max-w-3xl text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Start with the material you already have.</h2>
            <p className="mx-auto mt-5 max-w-xl leading-7 text-white/75">Turn it into the notes, practice, plan, and feedback you need next.</p>
            <Link href="/login" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-thirdary shadow-lg transition hover:-translate-y-1">Log in to Neurova <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© {new Date().getFullYear()} Neurova. AI-powered study tools.</p>
          <div className="flex flex-wrap gap-5"><Link href="/privacy-policy">Privacy</Link><Link href="/terms-of-service">Terms</Link><Link href="/refund-policy">Refunds</Link><Link href="/contact">Contact</Link></div>
        </div>
      </footer>
    </main>
  );
}

function FeatureVisual({ type, className = "" }: { type: "modes" | "timeline" | "grade"; className?: string }) {
  return (
    <div className={`relative rounded-[2rem] border border-slate-200 bg-[#f8f9fd] p-5 shadow-[0_25px_70px_rgba(15,23,42,0.08)] sm:p-8 ${className}`}>
      {type === "modes" && (
        <div className="grid grid-cols-2 gap-3">
          {studyModes.slice(0, 6).map(({ name, icon: Icon, color }) => <div key={name} className="rounded-2xl border border-slate-200 bg-white p-4"><div className={`flex h-9 w-9 items-center justify-center rounded-xl ${color}`}><Icon className="h-4 w-4" /></div><p className="mt-3 text-sm font-semibold">{name}</p><div className="mt-3 h-1.5 w-3/4 rounded-full bg-slate-100" /></div>)}
        </div>
      )}
      {type === "timeline" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Course plan</p><h3 className="mt-1 font-semibold">Introduction to Psychology</h3></div><CalendarRange className="h-5 w-5 text-primary" /></div>
          <div className="mt-7 space-y-0">{["Foundations & methods", "Memory and cognition", "Development & behavior", "Exam review"].map((item, i) => <div key={item} className="relative flex gap-4 pb-7 last:pb-0"><div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">{i + 1}</div>{i < 3 && <div className="absolute bottom-0 left-[15px] top-8 w-px bg-primary/20" />}<div><p className="text-sm font-semibold">{item}</p><p className="mt-1 text-xs text-slate-500">Priority {i < 2 ? "high" : "medium"} · Week {i * 2 + 1}</p></div></div>)}</div>
        </div>
      )}
      {type === "grade" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-end justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Rubric-based review</p><h3 className="mt-1 font-semibold">Assignment feedback</h3></div><span className="text-3xl font-semibold text-emerald-600">84%</span></div>
          <div className="mt-7 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-[84%] rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600" /></div>
          <div className="mt-7 space-y-3">{[{ label: "Argument & evidence", score: "22/25" }, { label: "Structure", score: "17/20" }, { label: "Critical analysis", score: "24/30" }, { label: "Clarity & citations", score: "21/25" }].map((row) => <div key={row.label} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm"><span className="text-slate-600">{row.label}</span><span className="font-semibold">{row.score}</span></div>)}</div>
        </div>
      )}
    </div>
  );
}
