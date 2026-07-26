'use client'

import type { SolveResult } from '@/lib/api/solve.service'

export default function SolveAnswerMeta({ result }: { result: SolveResult }) {
  const confidencePercent =
    typeof result.detected_confidence === 'number' ? Math.round(result.detected_confidence * 100) : null

  if (!result.subject_label && confidencePercent === null) {
    return null
  }

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      {result.subject_label ? (
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {result.subject_label}
        </span>
      ) : null}
      {confidencePercent !== null ? (
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
          {confidencePercent}% confident
        </span>
      ) : null}
    </div>
  )
}
