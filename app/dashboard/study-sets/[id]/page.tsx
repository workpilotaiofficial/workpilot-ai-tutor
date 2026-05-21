'use client'

import { use, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  Bold,
  ChevronLeft,
  ChevronRight,
  Heading1,
  Highlighter,
  Italic,
  List,
  ListOrdered,
  MessageSquare,
  NotebookPen,
  Paintbrush,
  Quote,
  Redo2,
  Underline,
  Undo2,
} from 'lucide-react'
import {
  getStoredStudySetById,
  getStoredStudySets,
  persistStudySet,
  type StudySet,
} from '@/components/study-sets/utils'
import { NotesEditor } from '@/components/study-sets/NotesEditor'

const editorTools = [
  Undo2,
  Redo2,
  Heading1,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Highlighter,
  Paintbrush,
]

function formatUpdatedAt(value?: string) {
  if (!value) return 'Just now'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Just now'

  const diffMs = Date.now() - parsed.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) return 'Today'
  if (diffDays === 1) return '1 day ago'
  if (diffDays < 7) return `${diffDays} days ago`

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function normalizeAnswerValue(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function isCorrectMultipleChoiceOption(item: any, option: string, optionIndex: number) {
  if (!item) return false

  if (typeof item.answer === 'number') {
    return optionIndex === item.answer
  }

  const normalizedAnswer = normalizeAnswerValue(item.answer)
  if (!normalizedAnswer) return false

  const normalizedOption = normalizeAnswerValue(option)
  if (normalizedAnswer === normalizedOption) return true

  const optionLetter = String.fromCharCode(97 + optionIndex)
  if (normalizedAnswer === optionLetter || normalizedAnswer === `${optionLetter}.`) {
    return true
  }

  if (normalizedAnswer === `${optionIndex + 1}`) {
    return true
  }

  return false
}

function normalizeComparableText(value: unknown) {
  if (typeof value !== 'string' && typeof value !== 'number') return ''

  return String(value)
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractKeywords(value: string) {
  return Array.from(
    new Set(
      normalizeComparableText(value)
        .split(' ')
        .filter((token) => token.length > 2),
    ),
  )
}

function isFillAnswerCorrect(item: any, userInput: string) {
  const normalizedExpected = normalizeComparableText(item?.answer)
  const normalizedInput = normalizeComparableText(userInput)

  if (!normalizedExpected || !normalizedInput) return false
  if (normalizedExpected === normalizedInput) return true

  const alternatives = normalizedExpected
    .split(/\s*\|\s*|\s*\/\s*/)
    .map((entry) => entry.trim())
    .filter(Boolean)

  if (alternatives.includes(normalizedInput)) return true

  if (
    normalizedExpected.length > 4 &&
    (normalizedInput.includes(normalizedExpected) || normalizedExpected.includes(normalizedInput))
  ) {
    return true
  }

  return false
}

function evaluateWrittenResponse(item: any, response: string) {
  const cleanedResponse = normalizeComparableText(response)
  const responseKeywords = extractKeywords(cleanedResponse)

  if (!cleanedResponse) {
    return {
      score: 0,
      matchedKeywords: [] as string[],
      missingKeywords: [] as string[],
      feedback: 'Write your response first, then evaluate to get feedback.',
    }
  }

  const idealResponse = typeof item?.idealResponse === 'string' ? item.idealResponse : ''
  const idealKeywords = extractKeywords(idealResponse).slice(0, 14)

  if (!idealKeywords.length) {
    const score = Math.max(35, Math.min(85, responseKeywords.length * 4))
    return {
      score,
      matchedKeywords: responseKeywords.slice(0, 4),
      missingKeywords: [] as string[],
      feedback:
        score >= 70
          ? 'Strong attempt. Your response covers the prompt with good detail.'
          : 'Decent start. Add clearer explanation and one concrete example for a stronger answer.',
    }
  }

  const matchedKeywords = idealKeywords.filter(
    (keyword) => responseKeywords.includes(keyword) || cleanedResponse.includes(keyword),
  )
  const missingKeywords = idealKeywords
    .filter((keyword) => !matchedKeywords.includes(keyword))
    .slice(0, 4)

  const keywordCoverage = matchedKeywords.length / idealKeywords.length
  const lengthScore = Math.min(1, responseKeywords.length / Math.max(idealKeywords.length, 10))
  const score = Math.min(100, Math.round(keywordCoverage * 75 + lengthScore * 25))

  const feedback =
    score >= 80
      ? 'Excellent structure and concept coverage.'
      : score >= 60
        ? `Good effort. Improve by including: ${missingKeywords.join(', ') || 'more key concepts'}.`
        : `Needs improvement. Focus on core points first: ${missingKeywords.join(', ') || 'key definitions'}.`

  return {
    score,
    matchedKeywords,
    missingKeywords,
    feedback,
  }
}

function getAssessmentImprovementTip(scorePercent: number, wrongCount: number) {
  if (wrongCount === 0 && scorePercent >= 90) {
    return 'Excellent work. Keep this momentum by attempting another set at a higher difficulty.'
  }

  if (scorePercent >= 80) {
    return 'Great job. Review the few missed explanations once, then re-attempt those concepts tomorrow.'
  }

  if (scorePercent >= 50) {
    return 'Good effort. Revisit your notes for weak topics, then practice similar MCQs to improve speed and accuracy.'
  }

  return 'Start with the notes section to rebuild fundamentals, then retry this quiz after a short focused review.'
}

async function syncStudySetStatsToDatabase(
  studySetId: string,
  stats: { unfamiliar: number; learning: number; familiar: number; mastered: number },
  updatedAt: string,
) {
  try {
    await fetch('/api/study-sets/stats', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        studySetId,
        stats,
        updatedAt,
      }),
    })
  } catch {
    // Intentionally silent: local progress should still persist offline.
  }
}

export default function StudySetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { id } = use(params)

  const [studySet, setStudySet] = useState<StudySet | null>(null)
  const [activeSectionType, setActiveSectionType] = useState<string | null>(null)
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [flashcardFlipped, setFlashcardFlipped] = useState(false)
  const [mcqSelections, setMcqSelections] = useState<Record<number, number>>({})
  const [fillAnswers, setFillAnswers] = useState<Record<number, string>>({})
  const [fillSubmitted, setFillSubmitted] = useState<Record<number, boolean>>({})
  const [writtenAnswers, setWrittenAnswers] = useState<Record<number, string>>({})
  const [writtenEvaluations, setWrittenEvaluations] = useState<
    Record<number, { submitted: boolean; score: number; feedback: string; missingKeywords: string[] }>
  >({})
  const lastSyncedStatsKeyRef = useRef('')
  const [rightPaneTab, setRightPaneTab] = useState<'personal' | 'chat'>('personal')
  const activeModeFromQuery = searchParams.get('mode')

  useEffect(() => {
    if (!id) return

    const stored = getStoredStudySetById(id)
    if (stored) {
      setStudySet(stored)
      return
    }

    const fallback = getStoredStudySets().find((set) => set.id === id) || null
    if (fallback) {
      setStudySet(fallback)
      return
    }

    setStudySet(null)
  }, [id])

  useEffect(() => {
    if (!studySet) {
      setActiveSectionType(null)
      return
    }

    const requestedType = activeModeFromQuery?.trim()
    const hasRequestedSection =
      Boolean(requestedType) && studySet.sections.some((section) => section.type === requestedType)

    const nextSectionType =
      (hasRequestedSection ? requestedType : null) ??
      studySet.sections.find((section) => section.type === 'notes')?.type ??
      studySet.sections[0]?.type ??
      null

    setActiveSectionType((current) => (current === nextSectionType ? current : nextSectionType))
  }, [activeModeFromQuery, studySet])

  useEffect(() => {
    setCurrentItemIndex(0)
    setFlashcardFlipped(false)
  }, [activeSectionType])

  const activeSection = useMemo(
    () => studySet?.sections.find((section) => section.type === activeSectionType) ?? null,
    [studySet, activeSectionType],
  )

  const activeItem =
    activeSection && Array.isArray(activeSection.items)
      ? activeSection.items[currentItemIndex] ?? activeSection.items[0]
      : null

  const totalItems = activeSection?.items?.length ?? 0

  const multipleChoiceItems = useMemo(
    () => (activeSection?.type === 'multipleChoice' && Array.isArray(activeSection.items) ? activeSection.items : []),
    [activeSection],
  )

  const mcqAnsweredCount = useMemo(
    () => Object.keys(mcqSelections).length,
    [mcqSelections],
  )

  const mcqCorrectCount = useMemo(() => {
    return multipleChoiceItems.reduce((totalCorrect: number, item: any, itemIndex: number) => {
      const selectedOptionIndex = mcqSelections[itemIndex]
      if (selectedOptionIndex === undefined) return totalCorrect

      const selectedOption = item?.options?.[selectedOptionIndex]
      if (typeof selectedOption !== 'string') return totalCorrect

      return isCorrectMultipleChoiceOption(item, selectedOption, selectedOptionIndex)
        ? totalCorrect + 1
        : totalCorrect
    }, 0)
  }, [multipleChoiceItems, mcqSelections])

  const mcqWrongCount = Math.max(0, mcqAnsweredCount - mcqCorrectCount)
  const mcqTotalCount = multipleChoiceItems.length
  const mcqScorePercent = mcqTotalCount ? Math.round((mcqCorrectCount / mcqTotalCount) * 100) : 0
  const isMcqComplete = Boolean(mcqTotalCount) && mcqAnsweredCount === mcqTotalCount
  const isShowingMcqFinalScreen = activeSection?.type === 'multipleChoice' && isMcqComplete
  const mcqImprovementTip = getAssessmentImprovementTip(mcqScorePercent, mcqWrongCount)

  const fillInBlankItems = useMemo(
    () => (activeSection?.type === 'fillInTheBlanks' && Array.isArray(activeSection.items) ? activeSection.items : []),
    [activeSection],
  )

  const fillAnsweredCount = useMemo(
    () => fillInBlankItems.reduce((count: number, _: any, idx: number) => (fillSubmitted[idx] ? count + 1 : count), 0),
    [fillInBlankItems, fillSubmitted],
  )

  const fillCorrectCount = useMemo(
    () =>
      fillInBlankItems.reduce((count: number, item: any, idx: number) => {
        if (!fillSubmitted[idx]) return count
        return isFillAnswerCorrect(item, fillAnswers[idx] ?? '') ? count + 1 : count
      }, 0),
    [fillInBlankItems, fillAnswers, fillSubmitted],
  )

  const fillTotalCount = fillInBlankItems.length
  const fillScorePercent = fillTotalCount ? Math.round((fillCorrectCount / fillTotalCount) * 100) : 0
  const isFillComplete = Boolean(fillTotalCount) && fillAnsweredCount === fillTotalCount
  const isShowingFillFinalScreen = activeSection?.type === 'fillInTheBlanks' && isFillComplete
  const isShowingAssessmentFinalScreen = isShowingMcqFinalScreen || isShowingFillFinalScreen
  const fillImprovementTip = getAssessmentImprovementTip(fillScorePercent, fillAnsweredCount - fillCorrectCount)

  const writtenTestItems = useMemo(
    () => (activeSection?.type === 'writtenTests' && Array.isArray(activeSection.items) ? activeSection.items : []),
    [activeSection],
  )

  const writtenAnsweredCount = useMemo(
    () =>
      writtenTestItems.reduce(
        (count: number, _: any, idx: number) => (writtenEvaluations[idx]?.submitted ? count + 1 : count),
        0,
      ),
    [writtenTestItems, writtenEvaluations],
  )

  const writtenScoreTotal = useMemo(
    () =>
      writtenTestItems.reduce(
        (totalScore: number, _: any, idx: number) => totalScore + (writtenEvaluations[idx]?.score ?? 0),
        0,
      ),
    [writtenTestItems, writtenEvaluations],
  )

  const writtenTotalCount = writtenTestItems.length
  const writtenScorePercent = writtenTotalCount ? Math.round(writtenScoreTotal / writtenTotalCount) : 0
  const isWrittenComplete = Boolean(writtenTotalCount) && writtenAnsweredCount === writtenTotalCount
  const writtenHighScoreCount = writtenTestItems.reduce(
    (count: number, _: any, idx: number) => ((writtenEvaluations[idx]?.score ?? 0) >= 80 ? count + 1 : count),
    0,
  )
  const writtenImprovementTip = getAssessmentImprovementTip(
    writtenScorePercent,
    writtenAnsweredCount - writtenHighScoreCount,
  )

  const allMultipleChoiceItems = useMemo(() => {
    if (!studySet) return []
    return studySet.sections
      .filter((section) => section.type === 'multipleChoice')
      .flatMap((section) => section.items ?? [])
  }, [studySet])

  const allFillItems = useMemo(() => {
    if (!studySet) return []
    return studySet.sections
      .filter((section) => section.type === 'fillInTheBlanks')
      .flatMap((section) => section.items ?? [])
  }, [studySet])

  const allWrittenItems = useMemo(() => {
    if (!studySet) return []
    return studySet.sections
      .filter((section) => section.type === 'writtenTests')
      .flatMap((section) => section.items ?? [])
  }, [studySet])

  const performanceStats = useMemo(() => {
    let unfamiliar = 0
    let learning = 0
    let familiar = 0
    let mastered = 0

    allMultipleChoiceItems.forEach((item: any, idx: number) => {
      const selectedIdx = mcqSelections[idx]
      if (selectedIdx === undefined) {
        unfamiliar += 1
        return
      }
      const selectedOption = item?.options?.[selectedIdx]
      if (typeof selectedOption === 'string' && isCorrectMultipleChoiceOption(item, selectedOption, selectedIdx)) {
        mastered += 1
      } else {
        learning += 1
      }
    })

    allFillItems.forEach((item: any, idx: number) => {
      if (!fillSubmitted[idx]) {
        unfamiliar += 1
        return
      }
      if (isFillAnswerCorrect(item, fillAnswers[idx] ?? '')) {
        mastered += 1
      } else {
        learning += 1
      }
    })

    allWrittenItems.forEach((_: any, idx: number) => {
      const evaluation = writtenEvaluations[idx]
      if (!evaluation?.submitted) {
        unfamiliar += 1
        return
      }

      if (evaluation.score >= 80) {
        mastered += 1
      } else if (evaluation.score >= 60) {
        familiar += 1
      } else {
        learning += 1
      }
    })

    return {
      unfamiliar,
      learning,
      familiar,
      mastered,
      total: unfamiliar + learning + familiar + mastered,
    }
  }, [allFillItems, allMultipleChoiceItems, allWrittenItems, fillAnswers, fillSubmitted, mcqSelections, writtenEvaluations])

  const hasAnyInteractiveSubmission = useMemo(
    () =>
      Object.keys(mcqSelections).length > 0 ||
      Object.values(fillSubmitted).some(Boolean) ||
      Object.values(writtenEvaluations).some((entry) => Boolean(entry?.submitted)),
    [fillSubmitted, mcqSelections, writtenEvaluations],
  )

  useEffect(() => {
    if (!studySet || !performanceStats.total || !hasAnyInteractiveSubmission) return

    const currentStats = studySet.stats ?? { unfamiliar: 0, learning: 0, familiar: 0, mastered: 0 }
    const nextStats = {
      unfamiliar: performanceStats.unfamiliar,
      learning: performanceStats.learning,
      familiar: performanceStats.familiar,
      mastered: performanceStats.mastered,
    }

    const isSameStats =
      currentStats.unfamiliar === nextStats.unfamiliar &&
      currentStats.learning === nextStats.learning &&
      currentStats.familiar === nextStats.familiar &&
      currentStats.mastered === nextStats.mastered

    if (isSameStats) return

    const updatedAt = new Date().toISOString()
    const updatedSet = {
      ...studySet,
      stats: nextStats,
      updatedAt,
    }

    const nextStatsKey = `${studySet.id}:${nextStats.unfamiliar}:${nextStats.learning}:${nextStats.familiar}:${nextStats.mastered}`

    setStudySet(updatedSet)
    persistStudySet(updatedSet)

    if (lastSyncedStatsKeyRef.current === nextStatsKey) {
      return
    }

    lastSyncedStatsKeyRef.current = nextStatsKey
    void syncStudySetStatsToDatabase(studySet.id, nextStats, updatedAt)
  }, [
    hasAnyInteractiveSubmission,
    performanceStats.familiar,
    performanceStats.learning,
    performanceStats.mastered,
    performanceStats.total,
    performanceStats.unfamiliar,
    studySet,
  ])

  const isCurrentMcqAnswered =
    activeSection?.type !== 'multipleChoice' || mcqSelections[currentItemIndex] !== undefined
  const isCurrentFillAnswered =
    activeSection?.type !== 'fillInTheBlanks' || Boolean(fillSubmitted[currentItemIndex])
  const isCurrentWrittenAnswered =
    activeSection?.type !== 'writtenTests' || Boolean(writtenEvaluations[currentItemIndex]?.submitted)
  const isCurrentInteractiveAnswered =
    isCurrentMcqAnswered && isCurrentFillAnswered && isCurrentWrittenAnswered
  const isNextDisabled =
    currentItemIndex === totalItems - 1 ||
    !isCurrentInteractiveAnswered

  const handlePrev = () => {
    setCurrentItemIndex((prev) => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    if (!activeSection) return
    setCurrentItemIndex((prev) => Math.min(activeSection.items.length - 1, prev + 1))
  }

  const handleNotesChange = (html: string) => {
    setStudySet((current) => {
      if (!current) return current
      if ((current.notesHtml ?? '') === html) return current

      const updatedSet = {
        ...current,
        notesHtml: html,
        updatedAt: new Date().toISOString(),
      }

      persistStudySet(updatedSet)
      return updatedSet
    })
  }

  const renderMultipleChoice = (item: any) => {
    if (isMcqComplete) {
      return (
        <div className="flex min-h-[500px] items-center justify-center animate-in fade-in-0 zoom-in-95 duration-500">
          <div className="w-full space-y-4 rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/5 via-white to-primary/10 p-6 text-center shadow-sm sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">
              Final Result
            </p>
            <p className="animate-in fade-in-0 slide-in-from-bottom-3 text-4xl font-bold text-foreground duration-500 sm:text-5xl">
              {mcqCorrectCount}/{mcqTotalCount}
            </p>
            <p className="text-lg font-semibold text-primary">{mcqScorePercent}% Score</p>
            <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">{mcqImprovementTip}</p>
            <button
              type="button"
              onClick={() => {
                setMcqSelections({})
                setCurrentItemIndex(0)
              }}
              className="rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-secondary/60"
            >
              Retry MCQ
            </button>
          </div>
        </div>
      )
    }

    const selectedOptionIndex = mcqSelections[currentItemIndex]
    const hasSelectedOption = selectedOptionIndex !== undefined
    const selectedOption =
      hasSelectedOption && typeof item?.options?.[selectedOptionIndex] === 'string'
        ? item.options[selectedOptionIndex]
        : null

    const isSelectedAnswerCorrect =
      selectedOption !== null &&
      isCorrectMultipleChoiceOption(item, selectedOption, selectedOptionIndex)

    return (
      <div
        key={`mcq-item-${currentItemIndex}`}
        className="space-y-6 animate-in fade-in-0 slide-in-from-right-2 duration-300"
      >
        <div>
          <p className="mb-2 text-sm uppercase tracking-wide text-muted-foreground">
            Multiple Choice
          </p>
          <h2 className="text-2xl font-semibold text-foreground">
            {item?.question ?? 'Practice question'}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(item?.options ?? []).map((option: string, idx: number) => {
            const isCorrectOption = isCorrectMultipleChoiceOption(item, option, idx)
            const isSelectedOption = selectedOptionIndex === idx
            const showCorrectState = hasSelectedOption && isCorrectOption
            const showIncorrectState = hasSelectedOption && isSelectedOption && !isCorrectOption

            const optionStyle = showCorrectState
              ? 'border-green-500 bg-green-50'
              : showIncorrectState
                ? 'border-red-500 bg-red-50'
                : isSelectedOption
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-primary/40 hover:bg-secondary/40'

            const badgeStyle = showCorrectState
              ? 'bg-green-600 text-white'
              : showIncorrectState
                ? 'bg-red-600 text-white'
                : isSelectedOption
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground'

            return (
              <button
                type="button"
                key={`${option}-${idx}`}
                onClick={() =>
                  setMcqSelections((prev) => ({
                    ...prev,
                    [currentItemIndex]: idx,
                  }))
                }
                className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-200 ease-out hover:-translate-y-0.5 ${optionStyle}`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${badgeStyle}`}
                >
                  {idx + 1}
                </span>
                <div className="space-y-1">
                  <p className="text-sm leading-relaxed text-foreground">{option}</p>
                  {showCorrectState && (
                    <p className="text-xs font-semibold text-green-700">Correct answer</p>
                  )}
                  {showIncorrectState && (
                    <p className="text-xs font-semibold text-red-700">Your answer (incorrect)</p>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {!hasSelectedOption && (
          <p className="text-sm text-muted-foreground">
            Select an option to reveal whether your answer is correct.
          </p>
        )}

        {hasSelectedOption && (
          <div
            className={`rounded-2xl border p-4 text-sm ${isSelectedAnswerCorrect
              ? 'border-green-300 bg-green-50 text-green-800'
              : 'border-red-300 bg-red-50 text-red-800'
              } animate-in fade-in-0 slide-in-from-bottom-2 duration-300`}
          >
            <p className="mb-1 font-semibold text-foreground">
              {isSelectedAnswerCorrect ? 'Nice! You got it right.' : 'Not quite. Keep going!'}
            </p>
            {item?.explanation && <p>{item.explanation}</p>}
          </div>
        )}

        <div className="rounded-2xl border border-border bg-secondary/20 p-4 text-sm">
          <p className="font-semibold text-foreground">
            Progress: {mcqAnsweredCount}/{mcqTotalCount} answered
          </p>
          <p className="text-muted-foreground">
            Score so far: {mcqCorrectCount}/{mcqTotalCount}
          </p>
        </div>
      </div>
    )
  }

  const renderFlashcard = (item: any) => (
    <div className="space-y-4">
      <p className="text-sm uppercase tracking-wide text-muted-foreground">Flashcard</p>

      <div className="min-h-[280px]" style={{ perspective: '1200px' }}>
        <button
          type="button"
          onClick={() => setFlashcardFlipped((prev) => !prev)}
          className="group relative h-[320px] w-full rounded-3xl text-left transition-transform duration-300 hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={flashcardFlipped ? 'Show prompt side of flashcard' : 'Show answer side of flashcard'}
        >
          <div
            className="relative h-full w-full rounded-3xl border-2 border-primary/40 bg-gradient-to-br from-primary/5 to-primary/10 shadow-sm transition-transform duration-500 [transform-style:preserve-3d]"
            style={{ transform: flashcardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center [backface-visibility:hidden]">
              <p className="mb-4 text-xs uppercase tracking-widest text-primary/60">Prompt</p>
              <p className="text-2xl font-semibold leading-snug text-foreground">
                {item?.prompt ?? 'Prompt unavailable'}
              </p>
              {item?.clue && <p className="mt-4 text-xs text-muted-foreground">{item.clue}</p>}
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center [transform:rotateY(180deg)] [backface-visibility:hidden]">
              <p className="mb-4 text-xs uppercase tracking-widest text-primary/60">Answer</p>
              <p className="text-2xl font-semibold leading-snug text-foreground">
                {item?.answer ?? 'Answer unavailable'}
              </p>
            </div>
          </div>
        </button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Click card to {flashcardFlipped ? 'see prompt again' : 'reveal answer'}
      </p>
    </div>
  )

  const renderFillInBlank = (item: any) => {
    if (isFillComplete) {
      return (
        <div className="flex min-h-[500px] items-center justify-center animate-in fade-in-0 zoom-in-95 duration-500">
          <div className="w-full space-y-4 rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/5 via-white to-primary/10 p-6 text-center shadow-sm sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">Final Result</p>
            <p className="animate-in fade-in-0 slide-in-from-bottom-3 text-4xl font-bold text-foreground duration-500 sm:text-5xl">
              {fillCorrectCount}/{fillTotalCount}
            </p>
            <p className="text-lg font-semibold text-primary">{fillScorePercent}% Score</p>
            <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">{fillImprovementTip}</p>
            <button
              type="button"
              onClick={() => {
                setFillAnswers({})
                setFillSubmitted({})
                setCurrentItemIndex(0)
              }}
              className="rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-secondary/60"
            >
              Retry Fill in the Blanks
            </button>
          </div>
        </div>
      )
    }

    const currentAnswer = fillAnswers[currentItemIndex] ?? ''
    const hasSubmitted = Boolean(fillSubmitted[currentItemIndex])
    const isCorrect = hasSubmitted && isFillAnswerCorrect(item, currentAnswer)

    return (
      <div key={`fill-item-${currentItemIndex}`} className="space-y-4 animate-in fade-in-0 slide-in-from-right-2 duration-300">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Fill in the Blank</p>

        <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <p className="text-lg text-foreground">
            {item?.sentence ?? 'Complete the sentence using the source material.'}
          </p>

          <div className="space-y-3">
            <label className="text-xs uppercase tracking-wide text-muted-foreground">Your answer</label>
            <input
              value={currentAnswer}
              onChange={(event) =>
                setFillAnswers((prev) => ({
                  ...prev,
                  [currentItemIndex]: event.target.value,
                }))
              }
              placeholder="Type your answer here"
              className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
            />

            <button
              type="button"
              disabled={!currentAnswer.trim()}
              onClick={() =>
                setFillSubmitted((prev) => ({
                  ...prev,
                  [currentItemIndex]: true,
                }))
              }
              className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              {hasSubmitted ? 'Re-check answer' : 'Check answer'}
            </button>
          </div>

          {!hasSubmitted && (
            <p className="text-sm text-muted-foreground">
              Enter your answer to reveal correctness and explanation.
            </p>
          )}

          {hasSubmitted && (
            <div
              className={`rounded-xl border p-4 text-sm ${isCorrect
                ? 'border-green-300 bg-green-50 text-green-800'
                : 'border-red-300 bg-red-50 text-red-800'
                } animate-in fade-in-0 slide-in-from-bottom-2 duration-300`}
            >
              <p className="mb-1 font-semibold text-foreground">
                {isCorrect ? 'Correct answer. Well done!' : 'Incorrect answer. Review this concept.'}
              </p>

              {!isCorrect && (
                <p>
                  Correct answer: <span className="font-semibold">{item?.answer ?? 'N/A'}</span>
                </p>
              )}

              {item?.explanation && <p className="mt-2">{item.explanation}</p>}
            </div>
          )}

          <div className="rounded-2xl border border-border bg-secondary/20 p-4 text-sm">
            <p className="font-semibold text-foreground">
              Progress: {fillAnsweredCount}/{fillTotalCount} answered
            </p>
            <p className="text-muted-foreground">
              Score so far: {fillCorrectCount}/{fillTotalCount}
            </p>
          </div>

        </div>
      </div>
    )
  }

  const renderTutorLesson = (item: any) => (
    <div className="space-y-6">
      <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <p className="text-xs uppercase text-muted-foreground">Tutor Prompt</p>
        <p className="text-lg font-semibold text-foreground">{item?.prompt ?? 'Tutor question'}</p>
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <p className="text-xs uppercase text-muted-foreground">Suggested Response</p>
        <p className="text-sm leading-relaxed text-foreground">
          {item?.response ?? 'Use the uploaded content to craft a thoughtful response.'}
        </p>
      </div>

      {item?.followUp && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-4">
          <p className="mb-1 text-xs uppercase text-muted-foreground">Follow-up</p>
          <p className="text-sm text-foreground">{item.followUp}</p>
        </div>
      )}
    </div>
  )

  const renderWrittenTest = (item: any) => {
    const currentResponse = writtenAnswers[currentItemIndex] ?? ''
    const currentEvaluation = writtenEvaluations[currentItemIndex]
    const hasSubmitted = Boolean(currentEvaluation?.submitted)

    return (
      <div className="space-y-4">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Written Test</p>

        <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <div>
            <p className="mb-1 text-xs uppercase text-muted-foreground">Prompt</p>
            <p className="text-lg font-semibold text-foreground">
              {item?.prompt ?? 'Respond to the uploaded concept.'}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Your response</p>
            <textarea
              value={currentResponse}
              onChange={(event) =>
                setWrittenAnswers((prev) => ({
                  ...prev,
                  [currentItemIndex]: event.target.value,
                }))
              }
              placeholder="Write your answer here"
              className="min-h-[160px] w-full rounded-xl border border-border bg-white p-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
            />

            <button
              type="button"
              disabled={!currentResponse.trim()}
              onClick={() => {
                const evaluation = evaluateWrittenResponse(item, currentResponse)
                setWrittenEvaluations((prev) => ({
                  ...prev,
                  [currentItemIndex]: {
                    submitted: true,
                    score: evaluation.score,
                    feedback: evaluation.feedback,
                    missingKeywords: evaluation.missingKeywords,
                  },
                }))
              }}
              className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              {hasSubmitted ? 'Evaluate again' : 'Evaluate answer'}
            </button>
          </div>

          {!hasSubmitted && (
            <p className="text-sm text-muted-foreground">
              Submit your response to reveal score and ideal answer.
            </p>
          )}

          {hasSubmitted && currentEvaluation && (
            <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <p className="text-sm font-semibold text-foreground">
                Score: {currentEvaluation.score}/100
              </p>
              <p className="text-sm text-muted-foreground">{currentEvaluation.feedback}</p>
              {currentEvaluation.missingKeywords.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Missing key points: {currentEvaluation.missingKeywords.join(', ')}
                </p>
              )}
            </div>
          )}

          {hasSubmitted && item?.idealResponse && (
            <div className="rounded-xl border border-border bg-secondary/40 p-4">
              <p className="mb-1 text-xs uppercase text-muted-foreground">Ideal Response</p>
              <p className="text-sm leading-relaxed text-foreground">{item.idealResponse}</p>
            </div>
          )}

          {Array.isArray(item?.rubric) && (
            <div>
              <p className="mb-2 text-xs uppercase text-muted-foreground">Scoring Rubric</p>
              <ul className="space-y-1 text-sm text-foreground">
                {item.rubric.map((criterion: string, idx: number) => (
                  <li key={`${criterion}-${idx}`} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                    {criterion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-secondary/20 p-4 text-sm">
            <p className="font-semibold text-foreground">
              Progress: {writtenAnsweredCount}/{writtenTotalCount} evaluated
            </p>
            <p className="text-muted-foreground">Average score: {writtenScorePercent}%</p>
          </div>

          {isWrittenComplete && (
            <div className="space-y-2 rounded-2xl border border-primary/30 bg-primary/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary/80">Final Result</p>
              <p className="text-2xl font-bold text-foreground">{writtenScorePercent}%</p>
              <p className="text-sm text-muted-foreground">{writtenImprovementTip}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderPodcast = (item: any) => (
    <div className="space-y-4">
      <p className="text-sm uppercase tracking-wide text-muted-foreground">Podcast Segment</p>

      <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-foreground">
              {item?.title ?? 'Segment title'}
            </h3>
            {item?.duration && (
              <p className="text-xs text-muted-foreground">Duration: {item.duration}</p>
            )}
          </div>

          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Conversational
          </span>
        </div>

        {Array.isArray(item?.talkingPoints) && (
          <ul className="space-y-2 text-sm text-foreground">
            {item.talkingPoints.map((point: string, idx: number) => (
              <li key={`${point}-${idx}`} className="flex items-start gap-2">
                <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                {point}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )

  const renderNotesWorkspace = () => {
    return (
      <div className="flex h-full flex-col overflow-hidden  bg-[#fcfbf8] shadow-sm">
        <div className="flex flex-col gap-4 h-[calc(100vh-70px)] overflow-y-scroll  ">
          <NotesEditor
            value={studySet?.notesHtml}
            notesMarkdown={studySet?.notesMarkdown}
            onChange={handleNotesChange}
          />
        </div>
      </div>
    )
  }

  const renderActiveContent = () => {
    if (activeSection?.type === 'notes') {
      return renderNotesWorkspace()
    }

    if (!activeSection || !activeItem) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Select a study method to view generated content.
        </div>
      )
    }

    const content = (() => {
      switch (activeSection.type) {
        case 'multipleChoice':
          return renderMultipleChoice(activeItem)
        case 'flashcards':
          return renderFlashcard(activeItem)
        case 'fillInTheBlanks':
          return renderFillInBlank(activeItem)
        case 'tutorLesson':
          return renderTutorLesson(activeItem)
        case 'writtenTests':
          return renderWrittenTest(activeItem)
        case 'podcast':
          return renderPodcast(activeItem)
        default:
          return (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                AI content for{' '}
                <span className="font-semibold text-foreground">{activeSection.label}</span>
              </p>
              <pre className="whitespace-pre-wrap rounded-xl border border-border bg-secondary/30 p-4 text-xs">
                {JSON.stringify(activeItem, null, 2)}
              </pre>
            </div>
          )
      }
    })()

    return (
      <div
        className={`h-full rounded-[28px] border border-border bg-card shadow-sm ${isShowingAssessmentFinalScreen ? 'p-4 sm:p-8' : 'p-6'
          }`}
      >
        {content}
      </div>
    )
  }

  if (!studySet) {
    return (
      <div className="flex h-screen flex-col items-center justify-center space-y-4 text-center">
        <p className="text-xl font-semibold text-foreground">Study set not found</p>
        <button
          onClick={() => router.push('/dashboard/study-sets')}
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"
        >
          Back to Study Sets
        </button>
      </div>
    )
  }

  const stats = studySet.stats ?? {
    unfamiliar: 0,
    learning: 0,
    familiar: 0,
    mastered: 0,
  }

  return (
    <div className="flex min-h-screen bg-[#fffaf5]">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-border bg-white/80 px-5 py-3 h-[70px] sticky top-0 z-50 backdrop-blur-sm lg:px-8">

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => router.push('/dashboard/study-sets')}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-background transition-colors hover:bg-secondary"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-bold text-foreground ">
                {studySet.title}
              </h1>
            </div>

            <div className="ml-auto flex items-center gap-6 text-sm text-muted-foreground">
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.2em]">Last updated</p>
                <p className="mt-1 text-base text-foreground">
                  {formatUpdatedAt(studySet.updatedAt ?? studySet.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          <div className="flex h-full flex-col lg:flex-row">
            <section className={`min-w-0 flex-1 ${isShowingAssessmentFinalScreen ? 'max-w-none' : 'max-w-[850px]'}`}>
              <div className=" flex flex-wrap items-center justify-between gap-3">
                {/* <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                    Study Mode
                  </p>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {activeSection?.label ?? 'Select a method'}
                  </p>
                </div> */}

                {activeSection?.type !== 'notes' && Boolean(totalItems) && !isShowingAssessmentFinalScreen && (
                  <span className="rounded-full mb-3 border border-border bg-white px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                    Item {currentItemIndex + 1} of {totalItems}
                  </span>
                )}
              </div>

              <div >{renderActiveContent()}</div>

              {activeSection?.type !== 'notes' && Boolean(totalItems) && !isShowingAssessmentFinalScreen && (
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={handlePrev}
                    disabled={currentItemIndex === 0}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-white px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>

                  <button
                    onClick={handleNext}
                    disabled={isNextDisabled}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {activeSection?.type === 'multipleChoice' && !isCurrentMcqAnswered && !isShowingAssessmentFinalScreen && (
                <p className="mt-2 text-center text-xs font-medium text-muted-foreground">
                  Select an option to unlock the next question.
                </p>
              )}

              {activeSection?.type === 'fillInTheBlanks' && !isCurrentFillAnswered && !isShowingAssessmentFinalScreen && (
                <p className="mt-2 text-center text-xs font-medium text-muted-foreground">
                  Submit your blank answer to unlock the next question.
                </p>
              )}

              {activeSection?.type === 'writtenTests' && !isCurrentWrittenAnswered && (
                <p className="mt-2 text-center text-xs font-medium text-muted-foreground">
                  Evaluate your written response to unlock the next question.
                </p>
              )}
            </section>

            {/* <aside className="w-full h-fit shrink-0 border-t border-border bg-[#fbfbf8] lg:w-[360px] lg:border-l lg:border-t-0 xl:w-[390px]">
              <div className="border-b border-border px-4 py-4">
                <div className="grid grid-cols-2 gap-2 rounded-2xl bg-secondary/50 p-1">
                  {([
                    { id: 'personal', label: 'My Notes' },
                    { id: 'chat', label: 'Chat' },
                  ] as const).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setRightPaneTab(tab.id)}
                      className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${rightPaneTab === tab.id
                          ? 'bg-white text-foreground shadow-sm'
                          : 'text-muted-foreground'
                        }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex h-[calc(100%-81px)] flex-col p-4">
                <div className="rounded-[30px] border border-dashed border-border bg-white px-6 py-8 text-center shadow-sm">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                    {rightPaneTab === 'personal' ? (
                      <NotebookPen className="h-7 w-7" />
                    ) : (
                      <MessageSquare className="h-7 w-7" />
                    )}
                  </div>

                  <h3 className="mt-5 text-xl font-semibold text-foreground">
                    {rightPaneTab === 'personal' ? 'Personal note pad' : 'Tutor chat'}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {rightPaneTab === 'personal'
                      ? 'This side panel is reserved for your own handwritten or typed notes. The workspace is shown now so the final layout matches the product direction, but editing comes later.'
                      : 'The AI chat rail is intentionally left as a placeholder for now. You can plug in tutor chat later without redesigning the notes workspace.'}
                  </p>

                  <div className="mt-6 inline-flex rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Coming soon
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-[#f3dddd] bg-[#fff5f5] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-600/80">
                      Unfamiliar
                    </p>
                    <p className="mt-3 text-2xl font-bold text-red-600">{stats.unfamiliar}</p>
                  </div>

                  <div className="rounded-2xl border border-[#f8e2c7] bg-[#fff8ef] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600/80">
                      Learning
                    </p>
                    <p className="mt-3 text-2xl font-bold text-orange-600">{stats.learning}</p>
                  </div>

                  <div className="rounded-2xl border border-[#d8e9fb] bg-[#f4faff] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600/80">
                      Familiar
                    </p>
                    <p className="mt-3 text-2xl font-bold text-blue-600">{stats.familiar}</p>
                  </div>

                  <div className="rounded-2xl border border-[#dcf1df] bg-[#f3fbf4] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-600/80">
                      Mastered
                    </p>
                    <p className="mt-3 text-2xl font-bold text-green-600">{stats.mastered}</p>
                  </div>
                </div>

            
              </div>
            </aside> */}
          </div>
        </div>
      </div>
    </div>
  )
}
