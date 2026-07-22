"use client";

import { motion, useMotionTemplate, useMotionValue } from "motion/react";
import { ArrowRight, Check, FileText, MessageSquareText, Sparkles } from "lucide-react";
import Link from "next/link";

const ease = [0.22, 1, 0.36, 1] as const;

export default function Hero() {
  const x = useMotionValue(50);
  const y = useMotionValue(35);
  const glow = useMotionTemplate`radial-gradient(520px circle at ${x}% ${y}%, rgba(91,101,224,.08), transparent 68%)`;

  return (
    <section
      onMouseMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        x.set(((event.clientX - bounds.left) / bounds.width) * 100);
        y.set(((event.clientY - bounds.top) / bounds.height) * 100);
      }}
      className="relative overflow-hidden border-b border-stone-200/80 bg-[#fcfaf8] px-4 pb-20 pt-32 sm:px-6 sm:pb-24 sm:pt-40 lg:px-8 lg:pb-28"
    >
      <motion.div style={{ background: glow }} className="pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 landing-grid opacity-70" />
      <div className="pointer-events-none absolute left-1/2 top-12 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-slate-200/35 blur-[110px]" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.02fr_.98fr] lg:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            One AI workspace for focused learning
          </div>

          <h1 className="mt-7 max-w-3xl text-[2.75rem] font-semibold leading-[1.02] tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-[4.25rem]">
            Turn study material into
            <span className="block text-slate-950">
              real understanding.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            WorkPilot transforms your notes and documents into clear summaries,
            practice quizzes, flashcards, and feedback—so every study session has a plan.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/signup" className="landing-primary group">
              Start learning free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/features" className="landing-secondary">
              Explore the workspace
            </Link>
          </div>

          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
            {["No card required", "Set up in minutes", "Built for every subject"].map((item) => (
              <span key={item} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" /> {item}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 28 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.15, ease }}
          className="relative mx-auto w-full max-w-xl"
        >
          <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-slate-200/60 via-primary/5 to-transparent blur-2xl" />
          <div className="relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/90 p-3 shadow-[0_35px_90px_-35px_rgba(49,46,129,.42)] backdrop-blur-xl">
            <div className="rounded-[1.35rem] border border-slate-200/70 bg-slate-50/80 p-4 sm:p-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white"><FileText className="h-4 w-4" /></div>
                  <div><p className="text-sm font-semibold text-slate-900">Biology — Cell Division</p><p className="text-xs text-slate-500">Study workspace</p></div>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Ready</span>
              </div>

              <div className="grid gap-3 pt-4 sm:grid-cols-[1.35fr_.65fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500"><Sparkles className="h-3.5 w-3.5 text-violet-500" /> SMART SUMMARY</div>
                  <h3 className="mt-4 text-lg font-semibold tracking-tight text-slate-900">Mitosis, made memorable</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">A focused explanation with the key stages, definitions, and common exam traps.</p>
                  <div className="mt-5 space-y-2.5">
                    {["Interphase prepares the cell", "Chromosomes align at metaphase", "Cytokinesis completes division"].map((line, i) => (
                      <motion.div key={line} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .65 + i * .12 }} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />{line}
                      </motion.div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="rounded-2xl bg-slate-900 p-4 text-white">
                    <p className="text-[11px] font-semibold text-slate-400">PRACTICE</p><p className="mt-2 text-2xl font-semibold">12</p><p className="text-xs text-slate-300">questions ready</p>
                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/20"><motion.div initial={{ width: 0 }} animate={{ width: "76%" }} transition={{ delay: .8, duration: 1, ease }} className="h-full rounded-full bg-white" /></div>
                  </div>
                  <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-4">
                    <MessageSquareText className="h-5 w-5 text-violet-600" />
                    <p className="mt-3 text-sm font-semibold text-slate-900">Ask your tutor</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">Get an explanation grounded in your material.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute -bottom-5 -left-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl sm:-left-8">
            <p className="text-[11px] font-semibold text-slate-400">NEXT REVIEW</p><p className="mt-0.5 text-sm font-semibold text-slate-800">Tomorrow · 10 min</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
