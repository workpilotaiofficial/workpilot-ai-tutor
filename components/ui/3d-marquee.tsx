"use client";

import { cn } from "@/lib/utils";

export type MarqueeCard = {
  eyebrow: string;
  title: string;
  description: string;
  metric: string;
  chip: string;
  progress: string;
  accentClassName?: string;
  progressClassName?: string;
};

type ThreeDMarqueeProps = {
  cards: MarqueeCard[];
  className?: string;
};

const ROW_COUNT = 4;
const CARDS_PER_ROW = 5;

export function ThreeDMarquee({ cards, className }: ThreeDMarqueeProps) {
  const rows = createRows(cards, ROW_COUNT);

  return (
    <div
      className={cn(
        "relative flex h-[360px] w-full  items-center justify-center overflow-hidden h-[950px] ",
        className,
      )}
    >
      <div className="absolute inset-0 rounded-[2.2rem] bg-[radial-gradient(circle_at_30%_25%,rgba(91,101,224,0.16),transparent_42%),radial-gradient(circle_at_78%_34%,rgba(52,103,57,0.1),transparent_32%)]" />
      <div className="absolute inset-0 rounded-[2.2rem] border border-white/60 bg-white/32 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur-[2px]" />
      <div className="hero-marquee-mask absolute inset-0 z-20 pointer-events-none" />
      <div className="absolute inset-y-0 left-0 z-20 w-20 bg-gradient-to-r from-background via-background/70 to-transparent" />
      <div className="absolute inset-y-0 right-0 z-20 w-20 bg-gradient-to-l from-background via-background/70 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 z-20 h-20 bg-gradient-to-t from-background via-background/65 to-transparent" />

      <div className=" absolute top-0 z-10 w-[820px] max-w-none [perspective:1800px]">
        <div className="[transform-style:preserve-3d] [transform:rotateX(87deg)_rotateZ(33deg)_scale(0.72)] sm:[transform:rotateX(57deg)_rotateZ(-33deg)_scale(0.82)] lg:[transform:rotateX(17deg)_rotateZ(123deg)_scale(0.87)]">
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(245,247,255,0.92))] p-3 shadow-[0_42px_110px_rgba(15,23,42,0.18)] sm:p-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.98),transparent_30%),linear-gradient(145deg,rgba(255,255,255,0.9),rgba(238,242,255,0.82)_50%,rgba(241,245,249,0.88))]" />
            <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />

            <div className="relative flex flex-col gap-3 sm:gap-4">
              {rows.map((row, rowIndex) => {
                const loop = [...row, ...row];
                const animationName =
                  rowIndex % 2 === 0 ? "marquee-left" : "marquee-right";

                return (
                  <div key={`row-${rowIndex}`} className="overflow-hidden">
                    <div
                      className="flex w-max gap-3 will-change-transform sm:gap-4 motion-reduce:animate-none"
                      style={{
                        animationName,
                        animationDuration: `${18 + rowIndex * 3}s`,
                        animationTimingFunction: "linear",
                        animationIterationCount: "infinite",
                      }}
                    >
                      {loop.map((card, cardIndex) => (
                        <MarqueeTile
                          key={`${rowIndex}-${card.title}-${cardIndex}`}
                          card={card}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarqueeTile({ card }: { card: MarqueeCard }) {
  return (
    <article className="group relative h-[162px] w-[238px] shrink-0 overflow-hidden rounded-[1.5rem] border border-slate-200/90 bg-white/95 p-4 shadow-[0_14px_32px_rgba(15,23,42,0.08)] transition-transform duration-300 hover:-translate-y-1">
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-100",
          card.accentClassName ?? "from-slate-300/25 via-slate-200/10 to-transparent",
        )}
      />
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/80 to-transparent" />

      <div className="relative flex h-full flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-500">
              {card.eyebrow}
            </p>
            <span className="rounded-full border border-slate-200/80 bg-white/85 px-2.5 py-1 text-[10px] font-medium text-slate-600">
              {card.chip}
            </span>
          </div>

          <h3 className="mt-3 text-base font-semibold leading-5 text-slate-950">
            {card.title}
          </h3>
          <p className="mt-2 text-[13px] leading-5 text-slate-600">{card.description}</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/72 p-3 shadow-inner shadow-slate-200/40">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
            <span>Learning impact</span>
            <span>{card.metric}</span>
          </div>

          <div className="mt-2.5 h-2 rounded-full bg-slate-200/80">
            <div
              className={cn(
                "h-full rounded-full bg-gradient-to-r",
                card.progressClassName ?? "from-slate-500 to-slate-700",
              )}
              style={{ width: card.progress }}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function createRows(cards: MarqueeCard[], rowCount: number) {
  const safeCards = cards.length > 0 ? cards : fallbackCards;

  return Array.from({ length: rowCount }, (_, rowIndex) =>
    Array.from({ length: Math.min(CARDS_PER_ROW, safeCards.length) }, (_, itemIndex) => {
      const cardIndex = (rowIndex * 2 + itemIndex) % safeCards.length;
      return safeCards[cardIndex];
    }),
  );
}

const fallbackCards: MarqueeCard[] = [
  {
    eyebrow: "Fallback",
    title: "Build your study system",
    description: "Add Neurova feature cards here.",
    metric: "Ready",
    chip: "Preview",
    progress: "70%",
  },
];
