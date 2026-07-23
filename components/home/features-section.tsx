"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  type Variants,
} from "motion/react";
import {
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  Check,
  FileText,
  Layers3,
  ListChecks,
  MessageSquareText,
  Sparkles,
  Target,
  Upload,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

const gridVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.09, delayChildren: 0.08 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease } },
};

function FeatureCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const spotlight = useMotionTemplate`radial-gradient(420px circle at ${x}px ${y}px, rgba(21,101,247,.11), transparent 68%)`;

  return (
    <motion.article
      variants={cardVariants}
      onMouseMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        x.set(event.clientX - bounds.left);
        y.set(event.clientY - bounds.top);
      }}
      className={`group relative overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_18px_60px_rgba(30,64,175,.06)] transition duration-500 hover:-translate-y-1 hover:border-primary/20 hover:shadow-[0_28px_80px_rgba(30,64,175,.12)] ${className}`}
    >
      <motion.div
        style={{ background: spotlight }}
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />
      {children}
    </motion.article>
  );
}

function FeatureHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof BrainCircuit;
  title: string;
  description: string;
}) {
  return (
    <div className="relative z-10 p-6 sm:p-8">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/10 bg-primary/[0.07] text-primary shadow-sm">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-5 text-xl font-semibold tracking-[-0.025em] text-slate-950">
        {title}
      </h3>
      <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">
        {description}
      </p>
    </div>
  );
}

function StudySetPreview() {
  const modes = [
    { label: "Smart notes", icon: FileText },
    { label: "Practice quiz", icon: ListChecks },
    { label: "Flashcards", icon: Layers3 },
    { label: "Tutor lesson", icon: MessageSquareText },
  ];

  return (
    <div className="relative mx-6 mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-[#f8faff] p-4 sm:mx-8 sm:mb-8 sm:p-5">
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Upload className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-slate-800">
            Cognitive psychology.pdf
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: "82%" }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, delay: 0.35, ease }}
              className="h-full rounded-full bg-gradient-to-r from-primary to-blue-400"
            />
          </div>
        </div>
        <span className="text-[10px] font-semibold text-primary">Ready</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {modes.map(({ label, icon: Icon }, index) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 + index * 0.08 }}
            className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-3 text-xs font-medium text-slate-700"
          >
            <Icon className="h-3.5 w-3.5 text-primary" />
            {label}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function TutorPreview() {
  return (
    <div className="relative mx-6 mb-6 space-y-3 sm:mx-8 sm:mb-8">
      <div className="ml-auto max-w-[82%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-xs leading-5 text-white shadow-lg shadow-primary/15">
        Explain active recall like I&apos;m new to it.
      </div>
      <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
        Think of it as a workout for memory: you close the book and try to
        retrieve the answer yourself.
        <span className="mt-2 flex items-center gap-1.5 font-semibold text-primary">
          <Sparkles className="h-3 w-3" /> Want a quick practice question?
        </span>
      </div>
    </div>
  );
}

function ProgressPreview() {
  return (
    <div className="relative mx-6 mb-6 rounded-2xl bg-slate-950 p-5 text-white sm:mx-8 sm:mb-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-300">
            Weekly mastery
          </p>
          <p className="mt-1 text-2xl font-semibold">78%</p>
        </div>
        <Target className="h-6 w-6 text-blue-300" />
      </div>
      <div className="mt-5 grid h-16 grid-cols-7 items-end gap-2">
        {[38, 55, 47, 68, 58, 82, 78].map((height, index) => (
          <motion.div
            key={index}
            initial={{ height: 0 }}
            whileInView={{ height: `${height}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, delay: 0.25 + index * 0.06, ease }}
            className="rounded-t-sm bg-gradient-to-t from-primary to-blue-300"
          />
        ))}
      </div>
    </div>
  );
}

function QuizPreview() {
  return (
    <div className="relative mx-6 mb-6 sm:mx-8 sm:mb-8">
      <div className="rounded-2xl border border-slate-200 bg-[#f8faff] p-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
            Question 04
          </span>
          <span className="text-[10px] font-medium text-slate-400">4 of 10</span>
        </div>
        <p className="mt-3 text-xs font-semibold leading-5 text-slate-800">
          Which method best strengthens long-term recall?
        </p>
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-primary/25 bg-white p-3 text-xs font-medium text-slate-700 shadow-sm">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
            <Check className="h-3 w-3" />
          </span>
          Spaced repetition
        </div>
      </div>
    </div>
  );
}

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative overflow-hidden bg-[#fbfcff] px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
    >
      <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(21,101,247,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(21,101,247,.035)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)]" />
      <div className="pointer-events-none absolute left-1/2 top-10 h-72 w-[48rem] -translate-x-1/2 rounded-full bg-primary/[0.07] blur-[110px]" />

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white px-3.5 py-1.5 text-xs font-semibold text-primary shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            One intelligent learning space
          </span>
          <h2 className="mt-6 text-3xl font-semibold leading-[1.08] tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-[3.5rem]">
            From course material to{" "}
            <span className="text-primary">real understanding.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Neurova brings every step of learning into one focused workflow—so
            you can understand, practise, and remember more.
          </p>
        </motion.div>

        <motion.div
          variants={gridVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
          className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-6"
        >
          <FeatureCard className="lg:col-span-4">
            <FeatureHeading
              icon={BrainCircuit}
              title="One upload. A complete study set."
              description="Turn your notes or documents into structured summaries, quizzes, flashcards, and guided lessons—without switching tools."
            />
            <StudySetPreview />
          </FeatureCard>

          <FeatureCard className="lg:col-span-2">
            <FeatureHeading
              icon={MessageSquareText}
              title="A tutor that meets you where you are"
              description="Ask follow-up questions and get clear, context-aware explanations."
            />
            <TutorPreview />
          </FeatureCard>

          <FeatureCard className="lg:col-span-2">
            <FeatureHeading
              icon={ListChecks}
              title="Practise with purpose"
              description="Generate targeted questions and get instant feedback as you learn."
            />
            <QuizPreview />
          </FeatureCard>

          <FeatureCard className="lg:col-span-2">
            <FeatureHeading
              icon={Target}
              title="See progress, not just activity"
              description="Know what is unfamiliar, improving, and ready for the exam."
            />
            <ProgressPreview />
          </FeatureCard>

          <FeatureCard className="lg:col-span-2">
            <FeatureHeading
              icon={BookOpenCheck}
              title="Built around how you learn"
              description="Personalise depth, pace, tone, and practice style for every subject."
            />
            <div className="relative mx-6 mb-6 flex flex-wrap gap-2 sm:mx-8 sm:mb-8">
              {["Your pace", "Your level", "Your goals", "Your learning style"].map(
                (label) => (
                  <span
                    key={label}
                    className="rounded-full border border-primary/10 bg-primary/[0.055] px-3 py-2 text-xs font-medium text-primary"
                  >
                    {label}
                  </span>
                ),
              )}
            </div>
          </FeatureCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, delay: 0.15, ease }}
          className="mt-10 flex flex-col items-center justify-between gap-5 rounded-[1.75rem] border border-primary/10 bg-gradient-to-r from-primary/[0.07] via-white to-blue-50 px-6 py-6 sm:flex-row sm:px-8"
        >
          <div>
            <p className="font-semibold text-slate-950">
              Ready to make learning feel simpler?
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Start free and turn your next document into a smarter study plan.
            </p>
          </div>
          <Link
            href="/signup"
            className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(21,101,247,.25)] transition hover:-translate-y-0.5 hover:brightness-95"
          >
            Start learning free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
