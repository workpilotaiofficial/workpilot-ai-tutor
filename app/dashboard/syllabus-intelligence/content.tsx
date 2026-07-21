'use client'

import SyllabusAnalysisResult from '@/components/syllabus-intelligence/analysis-result'
import SyllabusUploadModal from '@/components/syllabus-intelligence/upload-modal'
import {
  deleteSyllabusResult,
  getStoredSyllabusResults,
  type SyllabusIntelligenceResult,
} from '@/components/syllabus-intelligence/utils'
import { formatUTCDate } from '@/lib/utils'
import { ArrowUpRight, FileText, Link as LinkIcon, Trash2, Upload } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

export default function SyllabusIntelligenceContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const resultIdParam = searchParams.get('id')

  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadMode, setUploadMode] = useState<'file' | 'text'>('file')
  const [results, setResults] = useState<SyllabusIntelligenceResult[]>([])
  const [activeResult, setActiveResult] = useState<SyllabusIntelligenceResult | null>(null)

  const openUploadModal = useCallback((mode: 'file' | 'text' = 'file') => {
    setUploadMode(mode)
    setShowUploadModal(true)
  }, [])
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
    router.push(`?id=${result.id}`)
    setShowUploadModal(false)
  }, [router])

  const handleDeleteResult = useCallback((resultId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    if (window.confirm('Are you sure you want to delete this analysis?')) {
      deleteSyllabusResult(resultId)
      setResults((previous) => previous.filter((entry) => entry.id !== resultId))
      if (activeResult?.id === resultId) {
        setActiveResult(null)
        router.push('?')
      }
    }
  }, [activeResult, router])

  const handleBack = useCallback(() => {
    setActiveResult(null)
    router.push('?')
  }, [router])

  useEffect(() => {
    const stored = getStoredSyllabusResults()
    setResults(stored)

    if (resultIdParam) {
      const found = stored.find((r) => r.id === resultIdParam)
      if (found) {
        setActiveResult(found)
      }
    }
  }, [resultIdParam])

  if (activeResult) {
    return <SyllabusAnalysisResult result={activeResult} onBack={handleBack} />
  }

  return (
    <div className="min-h-full w-full bg-background">
      <div className="mx-auto w-full px-6 pb-12 pt-24 sm:px-8 lg:px-10">
        <section className="mx-auto mb-28 max-w-4xl text-center sm:mb-32">
          <h1 className="text-balance text-3xl font-semibold tracking-[-0.025em] text-foreground sm:text-[40px] sm:leading-[1.15]">
            Turn your syllabus into an action plan
          </h1>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            Get AI-powered modules, learning objectives, timelines, and weekly priorities
          </p>

          <div className="mx-auto mt-10 grid max-w-[560px] grid-cols-1 gap-3 text-left sm:grid-cols-2">
            <button
              type="button"
              onClick={() => openUploadModal('file')}
              className="group flex min-h-36 flex-col justify-between rounded-[28px] border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md"
            >
              <Upload className="h-7 w-7 text-foreground/80" strokeWidth={2} />
              <div>
                <p className="text-lg font-semibold text-foreground">Upload</p>
                <p className="mt-1 text-sm text-muted-foreground">PDF or text file (Max 20MB)</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => openUploadModal('text')}
              className="group flex min-h-36 flex-col justify-between rounded-[28px] border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md"
            >
              <LinkIcon className="h-7 w-7 text-foreground/80" strokeWidth={2} />
              <div>
                <p className="text-lg font-semibold text-foreground">Paste</p>
                <p className="mt-1 text-sm text-muted-foreground">Paste your course outline</p>
              </div>
            </button>
          </div>
        </section>

        <section>
          <div className="mb-5">
            <h2 className="relative pl-5 text-xl font-semibold text-foreground before:absolute before:inset-y-0 before:left-0 before:w-1 before:rounded-full before:bg-foreground sm:text-2xl">
              Recent Analyses
            </h2>
            <p className="mt-1 pl-5 text-xs text-muted-foreground">Saved on this device</p>
          </div>
        {sortedResults.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-foreground">
              <FileText className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No syllabus analyzed yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Upload or paste a syllabus above to generate your first roadmap.</p>
          </div>
        ) : (
            <ul className="grid auto-rows-max grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {sortedResults.map((result) => (
                <li key={result.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveResult(result)
                      router.push(`?id=${result.id}`)
                    }}
                    aria-label={`Open analysis for ${result.title}`}
                    className="group h-full w-full rounded-[30px] border border-border bg-card p-6 text-left transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="truncate text-lg font-semibold text-foreground">{result.title}</p>
                          <ArrowUpRight className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                          <span className="rounded-full border border-border bg-background px-2.5 py-1 font-medium text-muted-foreground">
                            {result.modules.length} modules
                          </span>
                          <span className="rounded-full border border-border bg-background px-2.5 py-1 font-medium text-muted-foreground">
                            {result.analysis?.overallLearningObjectives.length ?? 0} objectives
                          </span>
                        </div>
                        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                          {result.analysis?.courseSummary ?? 'No AI summary available yet.'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="whitespace-nowrap text-xs text-muted-foreground">
                          {formatUTCDate(result.createdAt)}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteResult(result.id, e)}
                          aria-label={`Delete analysis for ${result.title}`}
                          className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
        )}
        </section>
      </div>

      {showUploadModal && (
        <SyllabusUploadModal initialMode={uploadMode} onClose={closeUploadModal} onSuccess={handleResultSuccess} />
      )}
    </div>
  )
}
