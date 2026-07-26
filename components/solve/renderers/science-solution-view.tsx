'use client'

import Image from 'next/image'
import type { SolveResult, SolveScienceContent } from '@/lib/api/solve.service'
import SolveAnswerMeta from './solve-answer-meta'
import MarkdownMath from './markdown-math'

export default function ScienceSolutionView({ result }: { result: SolveResult }) {
  const content = result.content as SolveScienceContent

  return (
    <div>
      <SolveAnswerMeta result={result} />

      {content.key_concepts.length > 0 ? (
        <div className="mb-5 flex flex-wrap gap-2">
          {content.key_concepts.map((concept) => (
            <span key={concept} className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-foreground">
              {concept}
            </span>
          ))}
        </div>
      ) : null}

      {content.diagram_url ? (
        <div className="mb-5 overflow-hidden rounded-xl border border-border">
          <Image
            src={content.diagram_url}
            alt="Supporting diagram"
            width={800}
            height={600}
            className="h-auto w-full object-contain"
            unoptimized
          />
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
          <p className="text-xl font-semibold text-foreground">{result.final_answer.value}</p>
        </div>
      ) : null}
    </div>
  )
}
