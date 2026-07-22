'use client'

import { AlertTriangle, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { formatUTCDate } from '@/lib/utils'
import type { GraderResult } from '@/lib/api'

interface GradingResultProps {
  result: {
    submission_id: string
    title: string
    status: string
    created_at: string
    completed_at: string | null
    result: GraderResult | null
  }
  onBack: () => void
}

function getScoreBarColor(ratio: number) {
  if (ratio >= 0.8) return 'bg-emerald-500'
  if (ratio >= 0.6) return 'bg-primary'
  if (ratio >= 0.4) return 'bg-amber-500'
  return 'bg-red-500'
}

function NumberedFeedback({ items }: { items: string[] }) {
  return (
    <ol className="space-y-5">
      {items.map((item, index) => (
        <li key={`${index}-${item}`} className="flex gap-3 text-[15px] leading-7 text-foreground/80 sm:text-base">
          <span className="min-w-5 font-semibold text-foreground">{index + 1}.</span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  )
}

export default function GradingResult({ result, onBack }: GradingResultProps) {
  const grading = result.result
  const isProcessing =
    result.status === 'processing' ||
    result.status === 'queued' ||
    result.status === 'pending' ||
    !grading

  const overallScore = grading?.overall_score ?? null
  const maxScore = grading?.max_score ?? 100
  const overallRatio = overallScore !== null && maxScore > 0 ? overallScore / maxScore : 0
  const scorePercentage = Math.min(100, Math.max(0, Math.round(overallRatio * 100)))

  return (
    <div className="flex min-h-full w-full flex-col bg-background">
      <header className="flex min-h-[76px] items-center gap-3 border-b border-border bg-background px-4 sm:px-7 lg:px-9">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to submissions"
          className="-ml-2 rounded-full p-2.5 text-foreground transition-colors hover:bg-secondary"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            {result.title}
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground sm:hidden">
            {formatUTCDate(result.completed_at ?? result.created_at)}
          </p>
        </div>
        <p className="hidden text-sm text-muted-foreground sm:block">
          {formatUTCDate(result.completed_at ?? result.created_at)}
        </p>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {isProcessing ? (
          <div className="flex min-h-[480px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-11 w-11 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary" />
              <p className="font-medium text-foreground">Your assignment is being graded...</p>
              <p className="mt-1 text-sm text-muted-foreground">This may take a few moments</p>
            </div>
          </div>
        ) : grading?.error ? (
          <div className="mx-auto flex max-w-3xl gap-3 rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-800/50 dark:bg-red-950/30">
            <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />
            <div>
              <h2 className="text-lg font-semibold text-red-900 dark:text-red-100">Grading failed</h2>
              <p className="mt-1 leading-relaxed text-red-800 dark:text-red-200">{grading.error}</p>
            </div>
          </div>
        ) : grading ? (
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(280px,360px)_minmax(0,1fr)] xl:gap-7">
            <aside className="space-y-5 xl:sticky xl:top-0">
              <section className="flex min-h-52 flex-col items-center justify-center rounded-[22px] bg-[#fff0e8] px-6 py-8 text-center dark:bg-orange-950/35">
                <p className="text-6xl font-semibold tracking-[-0.06em] text-foreground sm:text-7xl">
                  {scorePercentage}%
                </p>
                <p className="mt-3 text-base font-medium text-foreground/75">Overall Grade</p>
                {grading.overall_grade ? (
                  <span className="mt-4 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-foreground/70 dark:bg-white/10">
                    Grade {grading.overall_grade}
                  </span>
                ) : null}
              </section>

              {grading.criteria.length > 0 ? (
                <section className="rounded-[22px] border border-border bg-card p-5 sm:p-6">
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">Grading Breakdown</h2>
                  <div className="mt-6 space-y-6">
                    {grading.criteria.map((criterion, index) => {
                      const ratio = criterion.max_score > 0 ? criterion.score / criterion.max_score : 0
                      const percentage = Math.min(100, Math.max(0, Math.round(ratio * 100)))

                      return (
                        <div key={`${criterion.criterion}-${index}`}>
                          <div className="mb-2.5 flex items-start justify-between gap-4">
                            <p className="text-sm leading-5 text-foreground/75">{criterion.criterion}</p>
                            <div className="flex shrink-0 items-baseline gap-1.5">
                              <span className="text-xs text-muted-foreground">
                                {criterion.score}/{criterion.max_score}
                              </span>
                              <span className="text-sm font-semibold text-foreground">{percentage}%</span>
                            </div>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-secondary">
                            <div
                              className={`h-full rounded-full transition-[width] duration-500 ${getScoreBarColor(ratio)}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          {criterion.feedback ? (
                            <p className="mt-2 text-xs leading-5 text-muted-foreground">{criterion.feedback}</p>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                </section>
              ) : null}
            </aside>

            <section className="rounded-[22px] border border-border bg-card px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Detailed Feedback</h2>

              <div className="mt-8 space-y-10">
                {grading.strengths.length > 0 ? (
                  <section>
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-sm font-medium text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <CheckCircle2 className="h-4 w-4" />
                      Key Strengths
                    </div>
                    <NumberedFeedback items={grading.strengths} />
                  </section>
                ) : null}

                {grading.improvement_areas.length > 0 ? (
                  <section>
                    <div className="mb-5 inline-flex rounded-full border border-orange-200 bg-orange-50 px-3.5 py-1.5 text-sm font-medium text-orange-700 dark:border-orange-800/60 dark:bg-orange-950/40 dark:text-orange-300">
                      Areas for Improvement
                    </div>
                    <NumberedFeedback items={grading.improvement_areas} />
                  </section>
                ) : null}

                {grading.missing_requirements.length > 0 ? (
                  <section>
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3.5 py-1.5 text-sm font-medium text-red-700 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-300">
                      <AlertTriangle className="h-4 w-4" />
                      Missing Requirements
                    </div>
                    <NumberedFeedback items={grading.missing_requirements} />
                  </section>
                ) : null}
              </div>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  )
}
