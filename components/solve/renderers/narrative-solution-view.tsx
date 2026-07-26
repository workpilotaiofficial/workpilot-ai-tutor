'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { SolveNarrativeContent, SolveResult } from '@/lib/api/solve.service'
import SolveAnswerMeta from './solve-answer-meta'
import MarkdownMath from './markdown-math'

export default function NarrativeSolutionView({ result }: { result: SolveResult }) {
  const content = result.content as SolveNarrativeContent
  const [showGlossary, setShowGlossary] = useState(false)

  return (
    <div>
      <SolveAnswerMeta result={result} />

      <div className="space-y-6">
        {content.sections.map((section) => (
          <div key={section.heading}>
            <h3 className="mb-2 text-base font-semibold text-foreground">{section.heading}</h3>
            <MarkdownMath content={section.body} className="text-sm leading-7 text-foreground/90" />
          </div>
        ))}
      </div>

      {result.final_answer ? (
        <div className="mt-6 rounded-xl border-2 border-primary/30 bg-primary/5 p-5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Summary</p>
          <p className="text-base font-medium text-foreground">{result.final_answer.value}</p>
        </div>
      ) : null}

      {content.key_terms.length > 0 ? (
        <div className="mt-4 rounded-xl border border-border">
          <button
            type="button"
            onClick={() => setShowGlossary((prev) => !prev)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-foreground"
          >
            Key terms
            <ChevronDown className={`h-4 w-4 transition-transform ${showGlossary ? 'rotate-180' : ''}`} />
          </button>
          {showGlossary ? (
            <dl className="space-y-3 border-t border-border px-4 py-3">
              {content.key_terms.map((term) => (
                <div key={term.term}>
                  <dt className="text-sm font-semibold text-foreground">{term.term}</dt>
                  <dd className="text-sm text-muted-foreground">{term.definition}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      ) : null}

      {content.citations.length > 0 ? (
        <div className="mt-4 border-t border-border pt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sources</p>
          <ol className="space-y-1">
            {content.citations.map((citation, index) => (
              <li key={`${citation.source}-${index}`} className="text-xs text-muted-foreground">
                {index + 1}. {citation.source}
                {citation.note ? ` — ${citation.note}` : ''}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  )
}
