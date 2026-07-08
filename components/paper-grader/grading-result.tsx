'use client'

import { ArrowLeft, CheckCircle2, AlertTriangle, ListChecks, Sparkles } from 'lucide-react'
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

function getGradeColor(grade: string | null) {
  switch ((grade ?? '').toUpperCase()) {
    case 'A':
      return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30'
    case 'B':
      return 'text-blue-600 bg-blue-50 dark:bg-blue-950/30'
    case 'C':
      return 'text-amber-600 bg-amber-50 dark:bg-amber-950/30'
    case 'D':
      return 'text-orange-600 bg-orange-50 dark:bg-orange-950/30'
    case 'F':
      return 'text-red-600 bg-red-50 dark:bg-red-950/30'
    default:
      return 'text-slate-600 bg-slate-50 dark:bg-slate-900/30'
  }
}

function getScoreBarColor(ratio: number) {
  if (ratio >= 0.8) return 'bg-emerald-500'
  if (ratio >= 0.6) return 'bg-blue-500'
  if (ratio >= 0.4) return 'bg-amber-500'
  return 'bg-red-500'
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

  return (
    <div className="w-full h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border px-8 py-6 bg-card flex items-center gap-4 shadow-sm">
        <button onClick={onBack} className="p-2 hover:bg-secondary rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{result.title}</h1>
          <p className="text-sm text-muted-foreground">
            {formatUTCDate(result.completed_at ?? result.created_at)}
          </p>
        </div>
        <div className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold capitalize">
          {isProcessing ? 'Processing...' : result.status || 'Completed'}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        {isProcessing ? (
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground font-medium">Your assignment is being graded...</p>
              <p className="text-sm text-muted-foreground/70 mt-2">This may take a few moments</p>
            </div>
          </div>
        ) : grading?.error ? (
          <div className="max-w-3xl mx-auto bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-2xl p-6 flex gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-bold text-red-900 dark:text-red-100 mb-1">Grading failed</h2>
              <p className="text-red-800 dark:text-red-200 leading-relaxed">{grading.error}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8 max-w-4xl mx-auto">
            {/* Score Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div
                className={`md:col-span-2 p-8 rounded-2xl border border-border shadow-lg ${getGradeColor(
                  grading?.overall_grade ?? null
                )}`}
              >
                <p className="text-sm font-semibold opacity-75 mb-3">Overall Score</p>
                <p className="text-6xl font-black">
                  {overallScore ?? '-'}
                  <span className="text-2xl opacity-60"> / {maxScore}</span>
                </p>
                <div className="mt-5 h-2.5 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${getScoreBarColor(overallRatio)}`}
                    style={{ width: `${Math.min(100, Math.round(overallRatio * 100))}%` }}
                  />
                </div>
              </div>
              <div
                className={`p-8 rounded-2xl border border-border shadow-lg ${getGradeColor(
                  grading?.overall_grade ?? null
                )} flex items-center justify-center`}
              >
                <div className="text-center">
                  <p className="text-sm font-semibold opacity-75 mb-3">Final Grade</p>
                  <p className="text-6xl font-black">{grading?.overall_grade || '-'}</p>
                </div>
              </div>
            </div>

            {/* Criteria Breakdown */}
            {grading && grading.criteria.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-6 shadow-md">
                <h2 className="text-lg font-bold text-foreground mb-5 flex items-center gap-2">
                  <ListChecks className="w-5 h-5 text-primary" /> Criteria Breakdown
                </h2>
                <div className="space-y-5">
                  {grading.criteria.map((criterion, idx) => {
                    const ratio = criterion.max_score > 0 ? criterion.score / criterion.max_score : 0
                    return (
                      <div key={`${criterion.criterion}-${idx}`} className="space-y-2">
                        <div className="flex items-center justify-between gap-4">
                          <p className="font-semibold text-foreground">{criterion.criterion}</p>
                          <p className="text-sm font-bold text-foreground/80 shrink-0">
                            {criterion.score}
                            <span className="text-muted-foreground"> / {criterion.max_score}</span>
                          </p>
                        </div>
                        <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getScoreBarColor(ratio)}`}
                            style={{ width: `${Math.min(100, Math.round(ratio * 100))}%` }}
                          />
                        </div>
                        {criterion.feedback && (
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {criterion.feedback}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Strengths */}
            {grading && grading.strengths.length > 0 && (
              <div className="bg-linear-to-br from-emerald-50 to-emerald-50/50 dark:from-emerald-950/30 dark:to-emerald-950/10 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-6 shadow-md">
                <h2 className="text-lg font-bold text-emerald-900 dark:text-emerald-100 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> Strengths
                </h2>
                <ul className="space-y-3">
                  {grading.strengths.map((strength, idx) => (
                    <li key={idx} className="text-emerald-800 dark:text-emerald-200 flex gap-3">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0 mt-0.5">•</span>
                      <span className="leading-relaxed">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Improvement Areas */}
            {grading && grading.improvement_areas.length > 0 && (
              <div className="bg-linear-to-br from-amber-50 to-amber-50/50 dark:from-amber-950/30 dark:to-amber-950/10 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-6 shadow-md">
                <h2 className="text-lg font-bold text-amber-900 dark:text-amber-100 mb-4 flex items-center gap-2">
                  Areas for Improvement
                </h2>
                <ul className="space-y-3">
                  {grading.improvement_areas.map((area, idx) => (
                    <li key={idx} className="text-amber-800 dark:text-amber-200 flex gap-3">
                      <span className="text-amber-600 dark:text-amber-400 font-bold shrink-0 mt-0.5">•</span>
                      <span className="leading-relaxed">{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Missing Requirements */}
            {grading && grading.missing_requirements.length > 0 && (
              <div className="bg-linear-to-br from-red-50 to-red-50/50 dark:from-red-950/30 dark:to-red-950/10 border border-red-200 dark:border-red-800/50 rounded-2xl p-6 shadow-md">
                <h2 className="text-lg font-bold text-red-900 dark:text-red-100 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> Missing Requirements
                </h2>
                <ul className="space-y-3">
                  {grading.missing_requirements.map((requirement, idx) => (
                    <li key={idx} className="text-red-800 dark:text-red-200 flex gap-3">
                      <span className="text-red-600 dark:text-red-400 font-bold shrink-0 mt-0.5">•</span>
                      <span className="leading-relaxed">{requirement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
