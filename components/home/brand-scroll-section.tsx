"use client";

import { motion } from "motion/react";
import { ArrowRight, Brain, FileUp, Route, WandSparkles } from "lucide-react";
import Link from "next/link";

const steps = [
  { number: "01", title: "Bring your material", text: "Upload notes, slides, or a paper you want to understand.", icon: FileUp },
  { number: "02", title: "AI organizes the work", text: "Get a summary, questions, and recall tools built around your content.", icon: WandSparkles },
  { number: "03", title: "Learn with direction", text: "Practice weak areas and keep moving through a focused study path.", icon: Brain },
];

export default function BrandScrollVelocitySection() {
  return (
    <section className="relative overflow-hidden bg-slate-950 px-4 py-24 text-white sm:px-6 sm:py-28 lg:px-8">
      <div className="absolute inset-0 landing-dark-grid" />
      <div className="absolute left-1/2 top-0 h-80 w-[50rem] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
      <div className="relative mx-auto max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[.24em] text-slate-400">A calmer way to study</span>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-.04em] sm:text-5xl">From upload to clarity in one flow.</h2>
          </div>
          <p className="max-w-xl text-base leading-7 text-slate-400 lg:justify-self-end">Less time switching between disconnected tools. More time understanding, practising, and making measurable progress.</p>
        </motion.div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 lg:grid-cols-3">
          {steps.map(({ number, title, text, icon: Icon }, index) => (
            <motion.div key={number} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .12 }} className="group relative bg-slate-950/90 p-7 sm:p-9">
              <div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-600">{number}</span><Icon className="h-5 w-5 text-primary transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110" /></div>
              <h3 className="mt-12 text-xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-400">{text}</p>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, scale: .98 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="mt-16 flex flex-col items-start justify-between gap-7 rounded-3xl border border-white/10 bg-white/[.06] p-7 sm:flex-row sm:items-center sm:p-10">
          <div><div className="flex items-center gap-2 text-sm font-semibold text-slate-400"><Route className="h-4 w-4 text-primary" /> Your next study session starts here</div><h3 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Make your material work harder for you.</h3></div>
          <Link href="/signup" className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5">Start for free <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
        </motion.div>
      </div>
    </section>
  );
}
