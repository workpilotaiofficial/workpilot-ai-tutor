"use client";

import { motion, useMotionTemplate, useMotionValue } from "motion/react";
import { ArrowRight, Check, FileText, MessageSquareText, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

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
      className="relative overflow-hidden border-b border-stone-200/80 bg-[#fcfaf8] px-4 pb-20 pt-10 sm:px-6 sm:pb-24 sm:pt-20 lg:px-8 lg:pb-28"
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
           AI-Powered Learning
          </div>

          <h1 className="mt-7 max-w-3xl text-[2.65rem] font-bold leading-[1.04] tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-[4.35rem]">
            <span className="block">Meet your AI tutor.</span>
            <span className="landing-type-line landing-type-line-one mt-2 text-[44px] text-primary leading-[1.12] tracking-[-0.025em] sm:mt-3">
              <span className="landing-editorial italic font-medium">Every Lesson. Made Simpler.</span>
            </span>
    
          
        
          </h1>

          {/* <div className="mt-4 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            <span className="h-px w-8 bg-gradient-to-r from-primary to-thirdary" />
            Learn with direction
          </div> */}

          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            Study smarter with WorkPilot—an AI tutor that helps you understand,
            not just memorize.
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
          

            <Image alt="portal" src="/portal.png" width={400} height={400} className="w-full" />
        
        
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute -bottom-5 -left-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl sm:-left-8">
            <p className="text-[11px] font-semibold text-slate-400">NEXT REVIEW</p><p className="mt-0.5 text-sm font-semibold text-slate-800">Tomorrow · 10 min</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
