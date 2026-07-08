"use client";

import { FlipWords } from "@/components/ui/flip-words";
import { ArrowRight, Play } from "lucide-react";
import type { Variants } from "motion/react";
import { motion, useMotionTemplate, useMotionValue } from "motion/react";
import Image from "next/image";

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function Hero() {
  // Pointer-tracking spotlight that follows the cursor across the hero.
  const mouseX = useMotionValue(50);
  const mouseY = useMotionValue(50);
  const spotlight = useMotionTemplate`radial-gradient(550px circle at ${mouseX}% ${mouseY}%, rgba(91,101,224,0.18), transparent 70%)`;

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(((e.clientX - rect.left) / rect.width) * 100);
    mouseY.set(((e.clientY - rect.top) / rect.height) * 100);
  };

  return (
    <section
      onMouseMove={handleMouseMove}
      className="relative overflow-hidden px-4 py-24 sm:px-6 sm:py-28 lg:px-8 lg:py-12"
    >
      {/* Animated decorative background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* Moving grid */}
        <div className="hero-grid absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />

        {/* Cursor spotlight */}
        <motion.div className="absolute inset-0" style={{ background: spotlight }} />

        {/* Glow orbs */}
        <div className="hero-animate-blob absolute left-[-6rem] top-16 h-52 w-52 rounded-full bg-thirdary/25 blur-3xl sm:h-64 sm:w-64 xl:left-[-4rem] xl:h-72 xl:w-72" />
        <div className="hero-animate-blob absolute right-[-3rem] top-10 h-60 w-60 rounded-full bg-primary/25 blur-3xl [animation-delay:-6s] sm:h-72 sm:w-72 xl:right-0 xl:top-16 xl:h-80 xl:w-80" />
        <div className="hero-animate-spotlight absolute left-1/2 top-[-8rem] h-72 w-[36rem] -translate-x-1/2 rounded-full bg-[conic-gradient(from_180deg_at_50%_50%,rgba(91,101,224,0.18),rgba(81,0,167,0.16),rgba(91,101,224,0.18))] blur-3xl" />

        {/* Floating sharp shapes */}
        <motion.div
          aria-hidden
          className="hero-animate-float absolute left-[8%] top-[22%] h-16 w-16 rotate-12 rounded-2xl border border-primary/30 bg-white/40 shadow-[0_18px_40px_rgba(91,101,224,0.18)] backdrop-blur-sm [animation-delay:-2s]"
        />
        <motion.div
          aria-hidden
          className="hero-animate-float absolute right-[14%] top-[14%] h-10 w-10 rounded-full border border-thirdary/30 bg-thirdary/10 [animation-delay:-4s]"
        />
        <motion.div
          aria-hidden
          className="hero-animate-float absolute bottom-[18%] left-[18%] h-8 w-8 rotate-45 border border-primary/40 bg-gradient-to-br from-primary/30 to-thirdary/30 [animation-delay:-1s]"
        />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100svh-6rem)] w-full max-w-7xl flex-col justify-center gap-14 lg:min-h-[calc(100svh-7rem)] lg:flex-row lg:items-center lg:gap-10 xl:max-w-[82rem] xl:gap-14">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex-1"
        >
          <motion.div
            variants={fadeUp}
            className="group inline-flex max-w-full items-center gap-2 rounded-full border border-thirdary/15 bg-white/85 px-3 py-2 text-xs font-medium text-slate-700 shadow-[0_10px_35px_rgba(15,23,42,0.06)] backdrop-blur transition-all duration-300 hover:border-thirdary/40 hover:shadow-[0_14px_45px_rgba(81,0,167,0.18)] sm:px-4 sm:text-sm"
          >
            {/* <span className="relative flex h-4 w-4 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-thirdary/40" />
              <Dot className="relative h-2 w-2 text-thirdary" />
            </span> */}
            Personalized study workflows for modern students
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="mt-6 text-4xl font-semibold leading-[1.08] tracking-[-0.05em] text-slate-950 sm:text-5xl lg:text-5xl xl:text-6xl"
          >
            Learn{" "}
            <span className="hero-gradient-text mr-2 bg-gradient-to-r from-button via-thirdary to-primary bg-clip-text text-transparent sm:mr-3">
              Smarter
            </span>
            with
            <br />
            your personal{" "}
            <FlipWords
              words={["AI Tutor", "Study Buddy", "Exam Coach", "Quiz Maker"]}
              duration={2500}
              className="hero-gradient-text bg-gradient-to-r font-extrabold from-primary via-thirdary to-button bg-clip-text !text-transparent"
            />
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-6 max-w-xl text-sm leading-7 text-slate-600 sm:text-base sm:leading-8 lg:text-lg xl:max-w-2xl"
          >
            WorkPilot combines smart summaries, guided quizzes, paper feedback, and
            real-time explanations into one focused workspace built to improve how
            students actually study.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-10">
            <div className="grid max-w-2xl grid-cols-1 gap-4 rounded-[2rem] border border-slate-200/70 bg-white/80 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center sm:gap-0 sm:p-5">
              {/* Item 1 */}
              <div className="flex items-center gap-3 sm:pr-5 xl:pr-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef2ff]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5 text-[#3b4a8a]"
                  >
                    <rect x="7" y="3" width="10" height="18" rx="2" />
                    <path d="M9.5 7h5M9.5 10h5M9.5 13h3" />
                  </svg>
                </div>
                <div className="leading-tight">
                  <p className="text-[13px] font-medium text-[#3b4a8a]">Trusted by</p>
                  <p className="text-[13px] font-semibold text-[#1f2a44]">50k+ Students</p>
                </div>
              </div>

              {/* Divider */}
              <div className="hidden h-10 w-px bg-[#d9def0] sm:block" />

              {/* Item 2 */}
              <div className="flex items-center gap-3 sm:justify-center sm:px-5 xl:px-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef2ff]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-5 w-5 text-[#3b4a8a]"
                  >
                    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm6.93 9h-2.95a15.7 15.7 0 0 0-1.38-5.02A8.03 8.03 0 0 1 18.93 11ZM12 4.07A13.7 13.7 0 0 1 13.96 11h-3.92A13.7 13.7 0 0 1 12 4.07ZM9.4 5.98A15.7 15.7 0 0 0 8.02 11H5.07A8.03 8.03 0 0 1 9.4 5.98ZM5.07 13h2.95a15.7 15.7 0 0 0 1.38 5.02A8.03 8.03 0 0 1 5.07 13ZM12 19.93A13.7 13.7 0 0 1 10.04 13h3.92A13.7 13.7 0 0 1 12 19.93Zm2.6-1.91A15.7 15.7 0 0 0 15.98 13h2.95a8.03 8.03 0 0 1-4.33 5.02Z" />
                  </svg>
                </div>
                <div className="leading-tight">
                  <p className="text-[13px] font-semibold text-[#1f2a44]">4.9/5</p>
                  <p className="text-[13px] font-medium text-[#3b4a8a]">Rating</p>
                </div>
              </div>

              {/* Divider */}
              <div className="hidden h-10 w-px bg-[#d9def0] sm:block" />

              {/* Item 3 */}
              <div className="flex items-center gap-3 sm:justify-end sm:pl-5 xl:pl-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef2ff]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-5 w-5 text-[#3b4a8a]"
                  >
                    <path d="M12 2l2.4 2.2 3.2-.4 1.4 2.9 2.9 1.4-.4 3.2L22 14l-2.2 2.4.4 3.2-2.9 1.4-1.4 2.9-3.2-.4L12 22l-2.4 2.2-3.2.4-1.4-2.9-2.9-1.4.4-3.2L2 14l2.2-2.4-.4-3.2 2.9-1.4 1.4-2.9 3.2.4L12 2Zm-1 14 5-5-1.4-1.4L11 13.2l-1.6-1.6L8 13l3 3Z" />
                  </svg>
                </div>
                <div className="leading-tight">
                  <p className="text-[13px] font-semibold text-[#1f2a44]">98% Exam</p>
                  <p className="text-[13px] font-medium text-[#3b4a8a]">Success Rate</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap"
          >
            <button className="btn-primary group relative w-full overflow-hidden bg-gradient-to-r from-button to-thirdary py-3 transition-transform duration-300 hover:-translate-y-1 sm:w-auto sm:px-7">
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative flex items-center gap-2">
                Start Free
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </button>

            <button className="inline-flex w-full items-center justify-center gap-3 rounded-full border border-slate-200 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-700 shadow-[0_12px_32px_rgba(15,23,42,0.06)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-thirdary/30 hover:bg-slate-50 sm:w-auto sm:pl-3 sm:pr-6">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-thirdary/10 text-thirdary">
                <Play className="ml-0.5 h-4 w-4 fill-current" />
              </span>
              Watch Demo
            </button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="w-full flex-1 lg:max-w-[34rem] xl:max-w-[40rem] 2xl:max-w-[46rem]"
        >
          <div className="hero-animate-float relative mx-auto aspect-[29/26] w-full max-w-[24rem] sm:max-w-[28rem] lg:max-w-none">
            {/* <div className="absolute inset-6 -z-10 rounded-[3rem] bg-gradient-to-tr from-primary/30 via-thirdary/20 to-primary/30 blur-3xl" /> */}
            <Image
              src="/demo-1.png"
              fill
              priority
              sizes="(max-width: 600px) 92vw, (max-width: 1023px) 78vw, (max-width: 1279px) 42vw, 46vw"
              className="object-contain "
              alt="WorkPilot dashboard preview"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
