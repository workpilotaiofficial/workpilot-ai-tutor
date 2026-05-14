'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, CalendarCheck2, Sparkles, Upload } from 'lucide-react'
import SyllabusUploadModal from '@/components/syllabus-intelligence/upload-modal'
import SyllabusAnalysisResult from '@/components/syllabus-intelligence/analysis-result'
import {
  getStoredSyllabusResults,
  type SyllabusIntelligenceResult,
} from '@/components/syllabus-intelligence/utils'
import { formatUTCDate } from '@/lib/utils'

export default function SyllabusIntelligencePage() {
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [results, setResults] = useState<SyllabusIntelligenceResult[]>([])
  const [activeResult, setActiveResult] = useState<SyllabusIntelligenceResult | null>(null)

  const openUploadModal = useCallback(() => setShowUploadModal(true), [])
  const closeUploadModal = useCallback(() => setShowUploadModal(false), [])

  const sortedResults = useMemo(
    () => [...results].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [results],
  )

  const handleResultSuccess = useCallback((result: SyllabusIntelligenceResult) => {
    setResults((previous) => {
      const filtered = previous.filter((entry) => entry.id !== result.id)
      return [result, ...filtered]
    })
    setActiveResult(result)
    setShowUploadModal(false)
  }, [])

  useEffect(() => {
    setResults(getStoredSyllabusResults())
  }, [])

  if (activeResult) {
    return <SyllabusAnalysisResult result={activeResult} onBack={() => setActiveResult(null)} />
  }

  return (
    <div className="w-full">
      <div className="bg-gradient-to-br from-background to-secondary/30 px-8 py-12 border-b border-border">
        <h1 className="text-4xl font-bold text-foreground mb-3 text-pretty">Syllabus Intelligence</h1>
        <p className="text-muted-foreground text-lg mb-8 max-w-4xl">
          Turn your syllabus into an actionable game plan with AI-powered summaries, modules,
          objectives, and weekly execution guidance.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
          <button
            type="button"
            onClick={openUploadModal}
            className="flex flex-col items-center gap-3 p-6 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all group"
          >
            <Upload className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
            <div className="text-center">
              <p className="font-semibold text-foreground">Upload Syllabus</p>
              <p className="text-xs text-muted-foreground">PDF, DOC, DOCX, or text outline</p>
            </div>
          </button>

          <button
            type="button"
            onClick={openUploadModal}
            className="flex flex-col items-center gap-3 p-6 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all group"
          >
            <Sparkles className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
            <div className="text-center">
              <p className="font-semibold text-foreground">Generate Plan</p>
              <p className="text-xs text-muted-foreground">Modules, timeline, and priorities</p>
            </div>
          </button>
        </div>
      </div>

      <div className="px-8 py-8 space-y-8">
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">Recent Analyses</h2>

          {sortedResults.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center bg-secondary/20">
              <CalendarCheck2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                No syllabus analyzed yet. Upload your first syllabus to generate your semester
                roadmap.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {sortedResults.map((result) => (
                <li key={result.id}>
                  <button
                    type="button"
                    onClick={() => setActiveResult(result)}
                    aria-label={`Open analysis for ${result.title}`}
                    className="w-full rounded-xl border border-border/70 bg-card/90 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-semibold text-foreground truncate">{result.title}</p>
                          <ArrowUpRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                          <span className="rounded-full border border-border bg-secondary/50 px-2 py-1 text-muted-foreground">
                            {result.modules.length} modules
                          </span>
                          <span className="rounded-full border border-border bg-secondary/50 px-2 py-1 text-muted-foreground">
                            {result.analysis?.overallLearningObjectives.length ?? 0} objectives
                          </span>
                        </div>
                        <p className="mt-3 line-clamp-2 text-sm text-foreground/80">
                          {result.analysis?.courseSummary ?? 'No AI summary available yet.'}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatUTCDate(result.createdAt)}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {showUploadModal && (
        <SyllabusUploadModal onClose={closeUploadModal} onSuccess={handleResultSuccess} />
      )}
    </div>
  )
}
