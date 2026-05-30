'use client'

import { AlertCircle, CheckCircle2, Edit3, FileText, GraduationCap, Headphones, Layers, ListChecks, LoaderCircle, PenSquare, Sparkles, RotateCw, ChevronRight, BookOpen } from 'lucide-react'
import type { StudySet } from '@/components/study-sets/utils'
import type { StoredStudySetGenerationMeta } from '@/lib/api/study-sets.storage'
import { type StudySetUiSectionType, toUiSectionType, uiSectionTypeLabels } from '@/components/study-sets/generation-mapping'

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

interface StudySetOverviewProps {
  studySet: StudySet | null
  generationMeta: StoredStudySetGenerationMeta | null
  onOpenSection: (sectionType: StudySetUiSectionType) => void
  onRetrySection?: (sectionType: StudySetUiSectionType) => Promise<void>
}

export function StudySetOverview({
  studySet,
  generationMeta,
  onOpenSection,
  onRetrySection,
}: StudySetOverviewProps) {
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-teal-100 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-teal-600 animate-pulse" />
          </div>
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
      <div className="rounded-3xl bg-linear-to-br from-primary/5 to-primary/10 border border-primary/20 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex-1">
            <div className="inline-block mb-4 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
              <p className="text-xs font-semibold text-primary">Generated Study Set</p>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">{studySet.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                <span>{selections.length} study formats</span>
              </div>
              <div className="flex items-center gap-1">
                <span>Created just now</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-secondary"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray={`${(0 / 100) * 282.7} 282.7`}
                    className="text-primary transition-all"
                    strokeLinecap="round"
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">0%</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">mastery</p>
            </div>
            <button
              onClick={() => {
                const firstSection = selections[0]
                if (firstSection) {
                  onOpenSection(firstSection)
                }
              }}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              Study now
            </button>
          </div>
        </div>
      </div>

      {/* Generated Sections */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Generated for this set
        </h2>

        <div className="space-y-3">
          {selections.map((sectionType) => {
            const status = getCardStatus(sectionType, studySet, generationMeta)
            const Icon = getSectionIcon(sectionType)
            const label = uiSectionTypeLabels[sectionType] || sectionType
            const description = getSectionDescription(sectionType)
            const itemCount = getItemCount(sectionType, studySet)
            const isReady = status === 'ready'
            const isFailed = status === 'failed'

            let cardClasses = 'rounded-2xl border p-6 transition-all duration-200 animate-in fade-in-0 zoom-in-95 relative'

            if (isReady) {
              cardClasses += ' border-primary/20 bg-primary/5 hover:border-primary/40 hover:shadow-md cursor-pointer'
            } else if (isFailed) {
              cardClasses += ' border-red-200 bg-red-50'
            } else {
              cardClasses += ' border-border bg-card cursor-not-allowed opacity-60'
            }

            return (
              <div key={sectionType} className={cardClasses}>
                <button
                  onClick={() => isReady && onOpenSection(sectionType)}
                  disabled={!isReady}
                  className="w-full text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={`rounded-xl p-3 w-fit ${isReady ? 'bg-primary/20 text-primary' : isFailed ? 'bg-red-100 text-red-600' : 'bg-secondary text-muted-foreground'}`}>
                      {isFailed ? (
                        <AlertCircle className="h-6 w-6" />
                      ) : (
                        <Icon className="h-6 w-6" />
                      )}
                    </div>

                    <div className="flex-1 text-left">
                      <p className="font-semibold text-foreground">{label}</p>
                      <p className="text-sm text-muted-foreground mt-1">{description}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      {itemCount > 0 && (
                        <div className="text-right">
                          <p className="text-lg font-semibold text-foreground">{itemCount}</p>
                          <p className="text-xs text-muted-foreground">
                            {sectionType === 'notes' ? 'page' : 'items'}
                          </p>
                        </div>
                      )}
                      {isReady && <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                    </div>
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
                    <RotateCw className="h-4 w-4" />
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
