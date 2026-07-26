'use client'

import type { SolveGenericContent, SolveResult } from '@/lib/api/solve.service'
import SolveAnswerMeta from './solve-answer-meta'
import MarkdownMath from './markdown-math'

export default function GenericSolutionView({ result }: { result: SolveResult }) {
  const content = result.content as SolveGenericContent

  return (
    <div>
      <SolveAnswerMeta result={result} />
      <MarkdownMath content={content.markdown} className="text-sm leading-7 text-foreground/90" />
      {result.final_answer ? (
        <div className="mt-5 rounded-xl border-2 border-primary/30 bg-primary/5 p-5 text-center">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Final Answer</p>
          <p className="text-xl font-semibold text-foreground">{result.final_answer.value}</p>
        </div>
      ) : null}
    </div>
  )
}
