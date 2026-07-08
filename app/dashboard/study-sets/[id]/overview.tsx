'use client'

import { type StudySetUiSectionType, toUiSectionType, uiSectionTypeLabels } from '@/components/study-sets/generation-mapping'
import type { StudySet } from '@/components/study-sets/utils'
import { fetchStudySetProgress, type StudySetProgressResponse } from '@/lib/api/study-sets.service'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { StoredStudySetGenerationMeta } from '@/lib/api/study-sets.storage'
import { AlertCircle, BookOpen, CheckCircle2, ChevronRight, Edit3, FileText, GraduationCap, Headphones, Layers, ListChecks, LoaderCircle, PenSquare, RotateCw } from 'lucide-react'
import { useEffect, useState } from 'react'

type CardStatus = 'ready' | 'generating' | 'fetching' | 'failed'

function getCardStatus(
  sectionType: StudySetUiSectionType,
  studySet: StudySet | null,
  generationMeta: StoredStudySetGenerationMeta | null,
): CardStatus {
  if (!generationMeta) {
    if (studySet?.sections.some((section) => section.type === sectionType)) {
      return 'ready'
    }
    return 'generating'
  }

  const job = generationMeta.jobs.find((j) => {
    const uiType = toUiSectionType(j.type)
    return uiType === sectionType
  })

  if (!job) return 'generating'

  if (job.status === 'completed') {
    const fetchedOutput = generationMeta.fetchedOutputs[job.jobId]
    if (fetchedOutput?.fetched) return 'ready'
    if (fetchedOutput) return 'fetching'
    return 'fetching'
  }

  if (job.status === 'failed') return 'failed'

  return 'generating'
}

function getSectionIcon(sectionType: StudySetUiSectionType) {
  const iconMap: Record<StudySetUiSectionType, any> = {
    notes: FileText,
    multipleChoice: ListChecks,
    flashcards: Layers,
    podcast: Headphones,
    tutorLesson: GraduationCap,
    writtenTests: PenSquare,
    fillInTheBlanks: Edit3,
  }
  return iconMap[sectionType] || FileText
}

function getSectionDescription(sectionType: StudySetUiSectionType): string {
  const descriptions: Record<StudySetUiSectionType, string> = {
    notes: 'Structured summary + key terms',
    multipleChoice: 'Quiz yourself',
    flashcards: 'Active recall, two-sided',
    podcast: 'Audio-style talking points',
    tutorLesson: 'Guided explanation',
    writtenTests: 'Open-ended responses',
    fillInTheBlanks: 'Recall from memory',
  }
  return descriptions[sectionType] || ''
}

function getStepStatus(sectionType: StudySetUiSectionType, studySet: StudySet | null, generationMeta: StoredStudySetGenerationMeta | null) {
  const status = getCardStatus(sectionType, studySet, generationMeta)
  if (status === 'ready') return 'completed'
  if (status === 'failed') return 'failed'
  if (status === 'generating') return 'pending'
  return 'in-progress'
}

function getItemCount(sectionType: StudySetUiSectionType, studySet: StudySet | null): number {
  if (!studySet) return 0
  const section = studySet.sections.find((s) => s.type === sectionType)
  return section?.items?.length || 0
}

// Weighted mastery: unfamiliar counts 0, learning 1/3, familiar 2/3, mastered 1.
function calculateMasteryPercentage(progress: StudySetProgressResponse | null): number {
  const summary = progress?.summary
  if (!summary || summary.total_items <= 0) return 0

  const weighted =
    summary.learning * (1 / 3) +
    summary.familiar * (2 / 3) +
    summary.mastered * 1

  return Math.round((weighted / summary.total_items) * 100)
}

// Fixed stage order and colors: identity is carried by the legend labels + counts,
// color is a secondary cue with distinct lightness per stage.
const masteryStages = [
  { key: 'unfamiliar', label: 'Unfamiliar', color: '#cbd5e1' },
  { key: 'learning', label: 'Learning', color: '#fbbf24' },
  { key: 'familiar', label: 'Familiar', color: '#3b82f6' },
  { key: 'mastered', label: 'Mastered', color: '#059669' },
] as const

type MasteryStageCounts = Record<(typeof masteryStages)[number]['key'], number>

// Accuracy may arrive as a 0–1 fraction; normalize to a 0–100 percent.
function toPercent(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0
  return Math.round(value <= 1 ? value * 100 : value)
}

function formatItemTypeLabel(itemType: string): string {
  const labels: Record<string, string> = {
    mcq: 'Multiple Choice',
    multiple_choice: 'Multiple Choice',
    flashcard: 'Flashcards',
    flashcards: 'Flashcards',
    fill_blank: 'Fill in the Blanks',
    fill_in_blanks: 'Fill in the Blanks',
    written_test: 'Written Test',
  }
  return labels[itemType] || itemType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function MasteryStackedBar({ counts, total }: { counts: MasteryStageCounts; total: number }) {
  if (total <= 0) return null
  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100" role="img" aria-label={masteryStages.map((s) => `${s.label}: ${counts[s.key]}`).join(', ')}>
      {masteryStages.map((stage) => {
        const count = counts[stage.key]
        if (count <= 0) return null
        return (
          <div
            key={stage.key}
            className="h-full border-r-2 border-white last:border-r-0"
            style={{ width: `${(count / total) * 100}%`, backgroundColor: stage.color }}
            title={`${stage.label}: ${count}`}
          />
        )
      })}
    </div>
  )
}

interface StudySetOverviewProps {
  studySetId: string
  studySet: StudySet | null
  generationMeta: StoredStudySetGenerationMeta | null
  onOpenSection: (sectionType: StudySetUiSectionType) => void
  onRetrySection?: (sectionType: StudySetUiSectionType) => Promise<void>
}

export function StudySetOverview({
  studySetId,
  studySet,
  generationMeta,
  onOpenSection,
  onRetrySection,
}: StudySetOverviewProps) {
  const [progress, setProgress] = useState<StudySetProgressResponse | null>(null)
  const [showProgressModal, setShowProgressModal] = useState(false)

  useEffect(() => {
    if (!studySetId) return
    let cancelled = false

    fetchStudySetProgress(studySetId)
      .then((response) => {
        if (!cancelled) setProgress(response)
      })
      .catch((error) => {
        console.error('Error fetching study set progress:', error)
      })

    return () => {
      cancelled = true
    }
  }, [studySetId])

  const masteryPercentage = calculateMasteryPercentage(progress)

  if (!studySet) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Study set not found
      </div>
    )
  }

  const selections = (studySet.selections || []) as StudySetUiSectionType[]
  const completedCount = generationMeta
    ? generationMeta.jobs.filter((j) => j.status === 'completed').length
    : 0
  const failedCount = generationMeta
    ? generationMeta.jobs.filter((j) => j.status === 'failed').length
    : 0

  // Generation is done when all jobs are in terminal state (completed or failed)
  const totalJobs = selections.length
  const doneJobs = completedCount + failedCount
  const isGenerating = doneJobs < totalJobs

  if (isGenerating) {
    return (
      <div className="flex  flex-col items-center justify-center min-h-[60vh] space-y-8">
        <div className="flex flex-col items-center space-y-4">
    
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground">Building your study set</h2>
            <p className="text-muted-foreground mt-2">This usually takes a few seconds.</p>
          </div>
        </div>

        <div className="w-full max-w-md space-y-3">
          {selections.map((sectionType) => {
            const stepStatus = getStepStatus(sectionType, studySet, generationMeta)
            const label = uiSectionTypeLabels[sectionType] || sectionType

            return (
              <div key={sectionType} className="flex items-center justify-between gap-3 py-2">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-5 h-5 flex items-center justify-center">
                    {stepStatus === 'completed' && (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    )}
                    {stepStatus === 'in-progress' && (
                      <LoaderCircle className="w-5 h-5 text-primary animate-spin" />
                    )}
                    {stepStatus === 'failed' && (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    {stepStatus === 'pending' && (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                    )}
                  </div>
                  <p className={stepStatus === 'completed' || stepStatus === 'in-progress' ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                    {label}
                  </p>
                </div>

                {stepStatus === 'failed' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onRetrySection?.(sectionType)
                    }}
                    className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Retry"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>
            <span className="font-semibold text-foreground">{completedCount}</span> of{' '}
            <span className="font-semibold text-foreground">{selections.length}</span> sections ready
          </p>
          {failedCount > 0 && (
            <p className="text-red-600 mt-1">
              <span className="font-semibold">{failedCount}</span> failed
            </p>
          )}
        </div>
      </div>
    )
  }

  // Show overview with header and cards when generation is complete
  return (
    <div className="space-y-8">
      {/* Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-white  backdrop:blur-lg shadow-2xl shadow-primary/30 to-primary/10 border border-primary/20 p-8 sm:p-10">
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute -top-40 right-0 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8">
          <div className="flex-1">
            <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-linear-to-r from-blue-100/60 to-purple-100/60 border border-blue-200/40 backdrop-blur-sm">
              <span className="text-xs font-bold text-blue-700 tracking-wide">GENERATED STUDY SET</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 leading-tight">{studySet.title}</h1>
            <div className="flex flex-wrap gap-6 text-sm text-slate-600">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100/60 rounded-lg">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                </div>
                <span className="font-semibold">{selections.length} study formats</span>
              </div>
              <div className="flex items-center gap-3">
               
                <span className="font-semibold">Ready to learn</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-8 shrink-0">
            <div className="flex flex-col items-center gap-3">
              <div className="relative w-28 h-28">
                <svg className="w-28 h-28" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-slate-200"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#5B65E0"
                    strokeWidth="3"
                    strokeDasharray={`${(masteryPercentage / 100) * 282.7} 282.7`}
                    className="transition-all"
                    strokeLinecap="round"
                    style={{
                      transform: 'rotate(-90deg)',
                      transformOrigin: '50% 50%'
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-3xl font-black text-blue-700">{masteryPercentage}%</span>
                  <span className="text-xs text-slate-600 font-bold mt-1">MASTERY</span>
                </div>
              </div>
              <button
                onClick={() => setShowProgressModal(true)}
                className="px-4 py-2 text-sm font-bold text-blue-700 bg-blue-100/60 hover:bg-blue-100 border border-blue-200/40 rounded-xl transition-colors"
              >
                View progress
              </button>
            </div>

            <button
              onClick={() => {
                const firstSection = selections[0]
                if (firstSection) {
                  onOpenSection(firstSection)
                }
              }}
              className="px-8 py-4 bg-linear-to-r from-[#5B65E0] to-[#5100a7] text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-600/40 transition-all duration-300 whitespace-nowrap hover:scale-105 active:scale-95"
            >
              Start Learning
            </button>
          </div>
        </div>
      </div>

      {/* Progress Details Modal */}
      <Dialog open={showProgressModal} onOpenChange={setShowProgressModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Your progress</DialogTitle>
          </DialogHeader>

          {progress && progress.summary.total_items > 0 ? (
            <div className="space-y-8">
            {/* Summary stat tiles */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">Overall accuracy</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{toPercent(progress.summary.overall_accuracy)}%</p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">Items tracked</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{progress.summary.total_items}</p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">Total attempts</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{progress.summary.total_attempts}</p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">Correct answers</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{progress.summary.total_correct}</p>
              </div>
            </div>

            {/* Overall mastery distribution */}
            <div>
              <p className="text-sm font-bold text-slate-700 mb-3">Mastery distribution</p>
              <MasteryStackedBar counts={progress.summary} total={progress.summary.total_items} />
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                {masteryStages.map((stage) => (
                  <div key={stage.key} className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                    <span>{stage.label}</span>
                    <span className="font-bold text-slate-900">{progress.summary[stage.key]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Per-type breakdown */}
            {progress.by_type.length > 0 && (
              <div>
                <p className="text-sm font-bold text-slate-700 mb-3">By study format</p>
                <div className="space-y-4">
                  {progress.by_type.map((typeProgress) => (
                    <div key={typeProgress.item_type} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <p className="w-full sm:w-40 shrink-0 text-sm font-semibold text-slate-900">
                        {formatItemTypeLabel(typeProgress.item_type)}
                      </p>
                      <div className="flex-1 min-w-0">
                        <MasteryStackedBar counts={typeProgress} total={typeProgress.total} />
                      </div>
                      <p className="w-full sm:w-44 shrink-0 text-xs text-slate-500 sm:text-right">
                        {toPercent(typeProgress.accuracy)}% accuracy · {typeProgress.total_attempts}{' '}
                        {typeProgress.total_attempts === 1 ? 'attempt' : 'attempts'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">
              No progress yet. Start answering questions to see your progress report here.
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Generated Sections - 3 Column Grid */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
  
          Generated content
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {selections.map((sectionType) => {
            const status = getCardStatus(sectionType, studySet, generationMeta)
            const Icon = getSectionIcon(sectionType)
            const label = uiSectionTypeLabels[sectionType] || sectionType
            const description = getSectionDescription(sectionType)
            const itemCount = getItemCount(sectionType, studySet)
            const isReady = status === 'ready'
            const isFailed = status === 'failed'

            let cardClasses = 'rounded-2xl border p-6 transition-all duration-300 animate-in fade-in-0 zoom-in-95 relative group'

            if (isReady) {
              cardClasses += ' border-blue-200/40 bg-white hover:border-blue-300/60 hover:shadow-lg hover:shadow-blue-200/20 hover:bg-blue-50/20 cursor-pointer'
            } else if (isFailed) {
              cardClasses += ' border-red-200/60 bg-white'
            } else {
              cardClasses += ' border-slate-200 bg-slate-50 cursor-not-allowed opacity-60'
            }

            return (
              <div key={sectionType} className={cardClasses}>
                <button
                  onClick={() => isReady && onOpenSection(sectionType)}
                  disabled={!isReady}
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left side: Icon + Text */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`rounded-xl p-3 w-fit shrink-0 flex items-center justify-center ${
                        isReady
                          ? 'bg-blue-100/60 text-blue-600'
                          : isFailed
                            ? 'bg-red-100 text-red-600'
                            : 'bg-slate-100 text-slate-600'
                      }`}>
                        {isFailed ? (
                          <AlertCircle className="h-6 w-6" />
                        ) : (
                          <Icon className="h-6 w-6" />
                        )}
                      </div>

                      <div className="text-left">
                        <p className={`font-bold text-base transition-colors ${isReady ? 'text-slate-900 group-hover:text-blue-600' : 'text-slate-700'}`}>{label}</p>
                        <p className="text-sm text-slate-600 mt-1">{description}</p>
                        {itemCount > 0 && (
                          <p className={`text-xs font-bold mt-2 tracking-wide ${isReady ? 'text-blue-600' : 'text-slate-500'}`}>
                            {itemCount} {itemCount === 1 ? 'ITEM' : 'ITEMS'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right side: Arrow */}
                    {isReady && (
                      <div className="shrink-0 text-blue-400 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1">
                        <ChevronRight className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                </button>

                {isFailed && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onRetrySection?.(sectionType)
                    }}
                    className="absolute top-4 right-4 p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    title="Retry generation for this section"
                  >
                    <RotateCw className="h-5 w-5" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
