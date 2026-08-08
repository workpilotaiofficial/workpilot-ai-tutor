'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, LoaderCircle, RefreshCw, Sparkles, X } from 'lucide-react'

import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import {
  PERSONALIZATION_ANSWER_MAX_LENGTH,
  fetchPersonalizationQuestions,
  getApiClientErrorMessage,
  updateOnboarding,
  updatePersonalizationAnswers,
  type PersonalizationQuestionWithAnswer,
} from '@/lib/api'

type PersonalizationOnboardingModalProps = {
  onClose: () => void
  onOnboardingComplete: () => void
}

function answersFromQuestions(questions: PersonalizationQuestionWithAnswer[]) {
  return Object.fromEntries(questions.map((question) => [question.id, question.answer?.answer ?? '']))
}

export default function PersonalizedAiOnboardingModal({
  onClose,
  onOnboardingComplete,
}: PersonalizationOnboardingModalProps) {
  const { toast } = useToast()
  const [questions, setQuestions] = useState<PersonalizationQuestionWithAnswer[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const onCloseRef = useRef(onClose)
  const onOnboardingCompleteRef = useRef(onOnboardingComplete)

  const step = questions[currentStep] ?? null
  const selectedValue = step ? answers[step.id] ?? '' : ''
  const isLastStep = currentStep === questions.length - 1
  const canContinue = useMemo(
    () => Boolean(step && (!step.isRequired || selectedValue.trim())),
    [selectedValue, step],
  )

  useEffect(() => {
    onCloseRef.current = onClose
    onOnboardingCompleteRef.current = onOnboardingComplete
  }, [onClose, onOnboardingComplete])

  useEffect(() => {
    const abortController = new AbortController()

    async function loadQuestions() {
      setIsLoading(true)
      setLoadError('')

      try {
        const result = await fetchPersonalizationQuestions(abortController.signal)

        if (abortController.signal.aborted) return

        if (result.questions.length === 0) {
          await updateOnboarding(true, abortController.signal)
          onOnboardingCompleteRef.current()
          onCloseRef.current()
          return
        }

        setQuestions(result.questions)
        setAnswers(answersFromQuestions(result.questions))
        setCurrentStep(0)
      } catch (error) {
        if (!abortController.signal.aborted) {
          setLoadError(getApiClientErrorMessage(error, 'Your personalization questions could not be loaded.'))
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadQuestions()
    return () => abortController.abort()
  }, [reloadKey])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSaving) onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSaving, onClose])

  const handleFinish = async () => {
    if (!canContinue || isSaving) return

    const hasMissingRequiredAnswer = questions.some(
      (question) => question.isRequired && !answers[question.id]?.trim(),
    )

    if (hasMissingRequiredAnswer) {
      toast({
        title: 'Complete the required questions',
        description: 'Please answer every required question before finishing onboarding.',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)

    try {
      await updatePersonalizationAnswers({
        answers: questions.map((question) => ({
          questionId: question.id,
          answer: answers[question.id] ?? '',
        })),
      })
      await updateOnboarding(true)
      onOnboardingComplete()
      onClose()
    } catch (error) {
      toast({
        title: 'Unable to save personalization answers',
        description: getApiClientErrorMessage(error, 'Your Personalized AI answers could not be saved.'),
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/35 p-0 backdrop-blur-sm sm:p-6 dark:bg-black/65"
      onClick={() => !isSaving && onClose()}
      role="presentation"
    >
      <div
        className="relative flex h-full w-full max-w-3xl flex-col overflow-hidden bg-background shadow-2xl sm:h-auto sm:max-h-[min(90vh,720px)] sm:rounded-[calc(var(--radius)+12px)] sm:border sm:border-border"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="personalization-question"
        aria-describedby="personalization-description"
      >
        <div className="border-b border-border bg-card px-5 pb-4 pt-5 sm:px-8 sm:pb-5 sm:pt-6">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Personalize your AI</p>
                {questions.length > 0 ? (
                  <p className="shrink-0 text-xs font-medium text-muted-foreground">
                    {currentStep + 1} of {questions.length}
                  </p>
                ) : null}
              </div>
              {questions.length > 0 ? (
                <div
                  className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary"
                  role="progressbar"
                  aria-label="Personalization progress"
                  aria-valuemin={1}
                  aria-valuemax={questions.length}
                  aria-valuenow={currentStep + 1}
                >
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
                    style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
                  />
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="-mr-2 -mt-2 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              aria-label="Close onboarding modal"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-7">
          {isLoading ? (
            <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-muted-foreground">
              <LoaderCircle className="h-5 w-5 animate-spin" />
              Loading your questions...
            </div>
          ) : loadError ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-4 text-center">
              <div>
                <h2 id="personalization-question" className="text-xl font-semibold text-foreground">Questions could not be loaded</h2>
                <p id="personalization-description" className="mt-2 max-w-md text-sm text-muted-foreground">{loadError}</p>
              </div>
              <button
                type="button"
                onClick={() => setReloadKey((current) => current + 1)}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
            </div>
          ) : step ? (
            <>
              <div className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                  {step.isRequired ? 'Required question' : 'Optional question'}
                </p>
                <h2 id="personalization-question" className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-[2rem] sm:leading-tight">
                  {step.question}
                </h2>
                {/* <p id="personalization-description" className="mt-2 text-sm leading-6 text-muted-foreground sm:text-[15px]">
                  {step.description || 'Write an answer that will help your AI tutor understand how to support you.'}
                </p> */}
              </div>

              <div className="mt-6 space-y-2">
                <Textarea
                  value={selectedValue}
                  onChange={(event) => setAnswers((current) => ({ ...current, [step.id]: event.target.value }))}
                  rows={7}
                  maxLength={PERSONALIZATION_ANSWER_MAX_LENGTH}
                  disabled={isSaving}
                  required={step.isRequired}
                  autoFocus
                  placeholder="Write your answer here..."
                  className="min-h-44 resize-y bg-card text-[15px] leading-6"
                />
                <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
                  <p>{step.isRequired && !selectedValue.trim() ? 'An answer is required to continue.' : 'Your answer can be updated later in Settings.'}</p>
                  <p className="shrink-0">{selectedValue.length}/{PERSONALIZATION_ANSWER_MAX_LENGTH}</p>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {!isLoading && !loadError && step ? (
          <div className="flex items-center justify-between gap-3 border-t border-border bg-card px-5 py-4 sm:px-8">
            <button
              type="button"
              onClick={() => setCurrentStep((current) => Math.max(0, current - 1))}
              disabled={currentStep === 0 || isSaving}
              className="inline-flex min-h-10 items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>

            {isLastStep ? (
              <button
                type="button"
                onClick={() => void handleFinish()}
                disabled={!canContinue || isSaving}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isSaving ? 'Saving...' : 'Set up my AI'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentStep((current) => Math.min(questions.length - 1, current + 1))}
                disabled={!canContinue || isSaving}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-45"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
