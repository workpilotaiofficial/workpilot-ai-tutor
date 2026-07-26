'use client'

import type { SolveResult } from '@/lib/api/solve.service'
import MathSolutionView from './math-solution-view'
import ScienceSolutionView from './science-solution-view'
import NarrativeSolutionView from './narrative-solution-view'
import GenericSolutionView from './generic-solution-view'

export default function SolveAnswerContent({ result }: { result: SolveResult }) {
  switch (result.subject_category) {
    case 'math':
    case 'quantitative':
      return <MathSolutionView result={result} />
    case 'science':
      return <ScienceSolutionView result={result} />
    case 'narrative':
      return <NarrativeSolutionView result={result} />
    default:
      return <GenericSolutionView result={result} />
  }
}
