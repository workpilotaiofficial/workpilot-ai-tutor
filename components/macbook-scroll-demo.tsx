"use client";

import { MacbookScroll } from "@/components/ui/macbook-scroll";
import { motion } from "framer-motion";
import Image from "next/image";

export default function MacbookScrollDemo() {
  return (
    <section className="relative w-full overflow-hidden bg-background pt-16 pb-0 sm:pt-20">
      {/* Soft ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[-5rem] top-24 h-72 w-72 rounded-full bg-thirdary/10 blur-3xl" />
        <div className="absolute right-[-4rem] top-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      </div>

      {/* Section heading */}
      <motion.div
        className="relative z-10 mx-auto mb-2 max-w-2xl px-4 text-center"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.span
          className="inline-flex items-center gap-2 rounded-full border border-thirdary/15 bg-white/85 px-4 py-1.5 text-xs font-medium text-thirdary shadow-[0_10px_35px_rgba(15,23,42,0.06)] backdrop-blur sm:text-sm"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Powerful Dashboard
        </motion.span>

        <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
          Everything you study lives in one focused workspace — summaries, quizzes,
          and feedback, all a scroll away.
        </p>
      </motion.div>

      <MacbookScroll
        title={
          <span className="text-3xl font-semibold tracking-[-0.03em] text-red-500 sm:text-4xl md:text-5xl dark:text-white">
            Master your learning with an{" "}
            <span className="bg-gradient-to-r from-button via-thirdary to-primary bg-clip-text text-transparent">
              intuitive dashboard
            </span>
          </span>
        }
        badge={<BrandBadge />}
        src="/demo-1.png"
        showGradient={false}
      />
    </section>
  );
}

// WorkPilot brand mark shown on the laptop base
const BrandBadge = () => {
  return (
    <div className="flex h-9 w-9 -rotate-12 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-black/5">
      <Image src="/logo.svg" alt="WorkPilot" width={20} height={20} className="h-5 w-5" />
    </div>
  );
};
