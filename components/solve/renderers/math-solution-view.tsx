'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { SolveMathContent, SolveResult } from '@/lib/api/solve.service'
import SolveAnswerMeta from './solve-answer-meta'
import MarkdownMath from './markdown-math'

export default function MathSolutionView({ result }: { result: SolveResult }) {
  const content = result.content as SolveMathContent
  const [showCheckWork, setShowCheckWork] = useState(false)

  return (
    <div>
      <SolveAnswerMeta result={result} />

      {content.formulas_used.length > 0 ? (
        <div className="mb-5 flex flex-wrap gap-2">
          {content.formulas_used.map((formula, index) => (
            <span
              key={`${formula}-${index}`}
              className="rounded-lg bg-secondary px-3 py-1.5 text-sm font-medium text-foreground"
            >
              <MarkdownMath content={`$${formula}$`} className="inline" />
            </span>
          ))}
        </div>
      ) : null}

      <div className="space-y-3">
        {content.steps.map((step) => (
          <div key={step.step_number} className="rounded-xl border border-border bg-card p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {step.step_number}
              </span>
              <p className="text-sm font-medium text-foreground">{step.explanation}</p>
            </div>
            {step.expression ? (
              <div className="ml-8 rounded-lg bg-secondary/50 px-4 py-3">
                {step.format === 'latex' ? (
                  <MarkdownMath content={`$$${step.expression}$$`} />
                ) : (
                  <code className="text-sm text-foreground">{step.expression}</code>
                )}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {result.final_answer ? (
        <div className="mt-5 rounded-xl border-2 border-primary/30 bg-primary/5 p-5 text-center">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Final Answer</p>
          {result.final_answer.format === 'latex' ? (
            <MarkdownMath content={`$${result.final_answer.value}$`} className="text-xl font-semibold text-foreground" />
          ) : (
            <p className="text-xl font-semibold text-foreground">{result.final_answer.value}</p>
          )}
        </div>
      ) : null}

      {content.check_work ? (
        <div className="mt-4 rounded-xl border border-border">
          <button
            type="button"
            onClick={() => setShowCheckWork((prev) => !prev)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-foreground"
          >
            Check your work
            <ChevronDown className={`h-4 w-4 transition-transform ${showCheckWork ? 'rotate-180' : ''}`} />
          </button>
          {showCheckWork ? (
            <div className="border-t border-border px-4 py-3">
              <MarkdownMath content={content.check_work} className="text-sm text-muted-foreground" />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
