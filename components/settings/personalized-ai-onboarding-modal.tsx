'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, CircleCheck, LoaderCircle, Sparkles, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { getApiClientErrorMessage } from '@/lib/api'
import {
  buildLearningPreferenceInstructions,
  emptyLearningPreferences,
  learningPreferenceQuestions,
  type LearningPreferences,
} from './personalized-ai-preferences'

export type PersonalizationOnboardingDraft = LearningPreferences

type PersonalizationOnboardingModalProps = {
  onClose: () => void
}

export default function PersonalizedAiOnboardingModal({ onClose }: PersonalizationOnboardingModalProps) {
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(0)
  const [draft, setDraft] = useState<PersonalizationOnboardingDraft>(emptyLearningPreferences)
  const [isSaving, setIsSaving] = useState(false)

  const step = learningPreferenceQuestions[currentStep]
  const selectedValue = draft[step.id]
  const isLastStep = currentStep === learningPreferenceQuestions.length - 1
  const canContinue = useMemo(() => Boolean(selectedValue), [selectedValue])

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

  const selectOption = (value: string) => {
    setDraft((current) => ({ ...current, [step.id]: value }))
  }

  const handleFinish = async () => {
    const instructions = buildLearningPreferenceInstructions(draft)
    if (!instructions) return

    setIsSaving(true)

    try {
      const { updatePersonalization } = await import('@/lib/api')
      await updatePersonalization({ instructions, ...draft })
      onClose()
    } catch (error) {
      toast({
        title: 'Unable to save learning preferences',
        description: getApiClientErrorMessage(error, 'Your Personalized AI profile could not be saved.'),
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
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                  Personalize your AI
                </p>
                <p className="shrink-0 text-xs font-medium text-muted-foreground">
                  {currentStep + 1} of {learningPreferenceQuestions.length}
                </p>
              </div>
              <div
                className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary"
                role="progressbar"
                aria-label="Personalization progress"
                aria-valuemin={1}
                aria-valuemax={learningPreferenceQuestions.length}
                aria-valuenow={currentStep + 1}
              >
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
                  style={{ width: `${((currentStep + 1) / learningPreferenceQuestions.length) * 100}%` }}
                />
              </div>
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
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">{step.eyebrow}</p>
            <h2 id="personalization-question" className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-[2rem] sm:leading-tight">
              {step.question}
            </h2>
            <p id="personalization-description" className="mt-2 text-sm leading-6 text-muted-foreground sm:text-[15px]">
              {step.description}
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {step.options.map((option) => {
              const Icon = option.icon
              const isSelected = option.label === selectedValue

              return (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => selectOption(option.label)}
                  className={`group flex min-h-20 w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-[border-color,background-color,box-shadow,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.99] ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary/20'
                      : 'border-border bg-card hover:border-primary/45 hover:bg-primary/5'
                  }`}
                  aria-pressed={isSelected}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground group-hover:text-primary'}`}>
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="flex-1 text-sm font-semibold leading-5 text-foreground sm:text-[15px]">{option.label}</span>
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background'}`}>
                    {isSelected && <CircleCheck className="h-3.5 w-3.5" strokeWidth={2.5} />}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

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
              onClick={() => setCurrentStep((current) => Math.min(learningPreferenceQuestions.length - 1, current + 1))}
              disabled={!canContinue || isSaving}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-45"
            >
              Continue
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
