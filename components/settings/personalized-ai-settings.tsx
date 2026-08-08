'use client'

import { useEffect, useMemo, useState } from 'react'
import { LoaderCircle, RefreshCw, Save, Sparkles } from 'lucide-react'

import { Textarea } from '@/components/ui/textarea'
import {
  PERSONALIZATION_ANSWER_MAX_LENGTH,
  type PersonalizationAnswerInput,
  type PersonalizationQuestionWithAnswer,
} from '@/lib/api'

type PersonalizedAiSettingsProps = {
  questions: PersonalizationQuestionWithAnswer[]
  isLoading: boolean
  isSaving: boolean
  status: string | null
  loadError: string | null
  onSave: (answers: PersonalizationAnswerInput[]) => Promise<void>
  onRetry: () => void
  onStatusChange: (status: string | null) => void
}

function answersFromQuestions(questions: PersonalizationQuestionWithAnswer[]) {
  return Object.fromEntries(questions.map((question) => [question.id, question.answer?.answer ?? '']))
}

export default function PersonalizedAiSettings({
  questions,
  isLoading,
  isSaving,
  status,
  loadError,
  onSave,
  onRetry,
  onStatusChange,
}: PersonalizedAiSettingsProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({})

  useEffect(() => {
    setAnswers(answersFromQuestions(questions))
  }, [questions])

  const hasMissingRequiredAnswer = useMemo(
    () => questions.some((question) => question.isRequired && !answers[question.id]?.trim()),
    [answers, questions],
  )

  const isDirty = useMemo(
    () => questions.some((question) => (answers[question.id] ?? '') !== (question.answer?.answer ?? '')),
    [answers, questions],
  )

  const answerInputs = questions.map((question) => ({
    questionId: question.id,
    answer: answers[question.id] ?? '',
  }))

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Personalized AI</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell your AI tutor how you learn. These answers are used across notes, quizzes, and tutor lessons.
        </p>
      </div>

      {isLoading ? (
        <div className="flex min-h-40 items-center justify-center gap-2 rounded-xl border border-border bg-secondary/10 text-sm text-muted-foreground">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading your personalization questions...
        </div>
      ) : loadError ? (
        <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-xl border border-destructive/25 bg-destructive/5 px-6 text-center">
          <p className="text-sm text-destructive">{loadError}</p>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      ) : questions.length === 0 ? (
        <div className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-secondary/10 px-6 text-center">
          <Sparkles className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">No personalization questions are available.</p>
          <p className="text-xs text-muted-foreground">An administrator can add questions from the Admin Portal.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) => {
            const value = answers[question.id] ?? ''
            const moderationRejected = question.answer?.moderationStatus === 'rejected'

            return (
              <div key={question.id} className="space-y-3 rounded-xl border border-border bg-secondary/20 p-4">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm font-semibold leading-6 text-foreground">
                      <span className="mr-2 text-primary">{index + 1}.</span>
                      {question.question}
                    </p>
                    <span className="shrink-0 rounded-full bg-background px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      {question.isRequired ? 'Required' : 'Optional'}
                    </span>
                  </div>
                  {question.description ? (
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{question.description}</p>
                  ) : null}
                </div>

                <Textarea
                  value={value}
                  onChange={(event) => {
                    setAnswers((current) => ({ ...current, [question.id]: event.target.value }))
                    onStatusChange(null)
                  }}
                  rows={4}
                  maxLength={PERSONALIZATION_ANSWER_MAX_LENGTH}
                  disabled={isSaving}
                  required={question.isRequired}
                  aria-label={`Answer: ${question.question}`}
                  aria-invalid={question.isRequired && !value.trim()}
                  placeholder="Write your answer here..."
                  className="resize-y bg-background"
                />

                {/* <div className="flex items-start justify-between gap-4 text-xs">
                  <div>
                    {moderationRejected ? (
                      <p className="text-destructive">
                        {question.answer?.moderationReason || 'This answer needs to be revised before it can personalize your AI.'}
                      </p>
                    ) : question.isRequired && !value.trim() ? (
                      <p className="text-muted-foreground">An answer is required.</p>
                    ) : null}
                  </div>
                  <p className="shrink-0 text-muted-foreground">{value.length}/{PERSONALIZATION_ANSWER_MAX_LENGTH}</p>
                </div> */}
              </div>
            )
          })}
        </div>
      )}

      {status ? <p className="text-sm text-primary">{status}</p> : null}

      {questions.length > 0 ? (
        <button
          type="button"
          onClick={() => void onSave(answerInputs)}
          disabled={!isDirty || hasMissingRequiredAnswer || isSaving || isLoading}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isSaving ? 'Saving...' : 'Save Answers'}
        </button>
      ) : null}
    </div>
  )
}
