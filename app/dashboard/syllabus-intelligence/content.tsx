'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowUpRight, Upload, Trash2, Sparkles } from 'lucide-react'
import SyllabusUploadModal from '@/components/syllabus-intelligence/upload-modal'
import SyllabusAnalysisResult from '@/components/syllabus-intelligence/analysis-result'
import {
  getStoredSyllabusResults,
  deleteSyllabusResult,
  type SyllabusIntelligenceResult,
} from '@/components/syllabus-intelligence/utils'
import { formatUTCDate } from '@/lib/utils'

export default function SyllabusIntelligenceContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const resultIdParam = searchParams.get('id')

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
    <div className="w-full bg-linear-to-br from-white via-blue-50/30 to-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-10 relative overflow-hidden rounded-3xl bg-linear-to-br from-primary via-[#3825b4]/90 to-primary p-8 sm:p-10">
          {/* Decorative glow orbs */}
          <div className="pointer-events-none absolute -top-24 -right-16 w-72 h-72 bg-white/20 rounded-full blur-3xl"></div>
          <div className="pointer-events-none absolute -bottom-32 -left-20 w-80 h-80 bg-[#9FCB98]/20 rounded-full blur-3xl"></div>
          {/* Subtle dot grid */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:20px_20px]"></div>

          <div className="relative">
            <div className="mb-7 max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/25 backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 text-[#9FCB98]" />
                <span className="text-xs font-bold text-white tracking-wide">SYLLABUS INTELLIGENCE</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight tracking-tight">
                Turn your syllabus into an action plan
              </h2>
              <p className="text-indigo-100 text-base sm:text-lg max-w-xl leading-relaxed">
                Upload a syllabus and get AI-powered modules, learning objectives, timeline, and weekly priorities instantly.
              </p>
            </div>

            {/* Action button */}
            <button
              onClick={openUploadModal}
              className="group flex items-center gap-4 p-5 bg-white/95 backdrop-blur-sm rounded-2xl border border-white/40 hover:bg-white hover:shadow-2xl hover:shadow-black/20 transition-all duration-300 hover:-translate-y-1 text-left max-w-xs"
            >
              <div className="shrink-0 p-3.5 rounded-xl bg-linear-to-br from-[#5B65E0] to-[#5100a7] text-white group-hover:scale-110 transition-transform duration-300">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Analyze Syllabus</p>
                <p className="text-sm text-slate-500">PDF or plain text</p>
              </div>
            </button>
          </div>
        </div>

        {/* Content Area */}
        {sortedResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="p-6 bg-linear-to-br from-slate-100 to-slate-200 rounded-xl mb-6">
              <Sparkles className="w-12 h-12 text-slate-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">No syllabus analyzed yet</h2>
            <p className="text-slate-600 mb-6 max-w-sm text-center">Use the upload button above to analyze your first syllabus and generate your semester roadmap</p>
          </div>
        ) : (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-slate-900">Recent Analyses</h3>
            <ul className="space-y-3">
              {sortedResults.map((result) => (
                <li key={result.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveResult(result)
                      router.push(`?id=${result.id}`)
                    }}
                    aria-label={`Open analysis for ${result.title}`}
                    className="w-full rounded-2xl border border-slate-200/80 bg-white hover:border-[#5B65E0]/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-5 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-bold text-slate-900 truncate">{result.title}</p>
                          <ArrowUpRight className="w-4 h-4 text-slate-400 flex-shrink-0 group-hover:text-slate-600 transition-colors" />
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600 font-medium">
                            {result.modules.length} modules
                          </span>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600 font-medium">
                            {result.analysis?.overallLearningObjectives.length ?? 0} objectives
                          </span>
                        </div>
                        <p className="mt-3 line-clamp-2 text-sm text-slate-600">
                          {result.analysis?.courseSummary ?? 'No AI summary available yet.'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {formatUTCDate(result.createdAt)}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteResult(result.id, e)}
                          aria-label={`Delete analysis for ${result.title}`}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {showUploadModal && (
        <SyllabusUploadModal onClose={closeUploadModal} onSuccess={handleResultSuccess} />
      )}
    </div>
  )
}
