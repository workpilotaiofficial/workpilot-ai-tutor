import { ApiClientError, apiClient } from '@/lib/api/client'

export const PERSONALIZATION_QUESTION_MAX_LENGTH = 500
export const PERSONALIZATION_QUESTION_DESCRIPTION_MAX_LENGTH = 1000
export const PERSONALIZATION_ANSWER_MAX_LENGTH = 2500

type ApiRecord = Record<string, unknown>

export type PersonalizationAnswer = {
  id: string | null
  questionId: string
  answer: string
  moderationStatus: string | null
  moderationReason: string | null
  createdAt: string | null
  updatedAt: string | null
}

export type PersonalizationQuestion = {
  id: string
  question: string
  description: string | null
  isRequired: boolean
  isActive: boolean
  displayOrder: number
  createdAt: string | null
  updatedAt: string | null
  archivedAt: string | null
}

export type PersonalizationQuestionWithAnswer = PersonalizationQuestion & {
  answer: PersonalizationAnswer | null
}

export type PersonalizationQuestionsResponse = {
  questions: PersonalizationQuestionWithAnswer[]
}

export type PersonalizationAnswerInput = {
  questionId: string
  answer: string
}

export type UpdatePersonalizationAnswersPayload = {
  answers: PersonalizationAnswerInput[]
}

function asRecord(value: unknown): ApiRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as ApiRecord) : null
}

function readString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export function normalizePersonalizationAnswer(
  value: unknown,
  fallbackQuestionId?: string,
): PersonalizationAnswer | null {
  const record = asRecord(value)

  if (!record) {
    return null
  }

  const questionId = readString(record.question_id) ?? fallbackQuestionId ?? null
  const answer = readString(record.answer)

  if (!questionId || answer === null) {
    return null
  }

  return {
    id: readString(record.id),
    questionId,
    answer,
    moderationStatus: readString(record.moderation_status),
    moderationReason: readString(record.moderation_reason),
    createdAt: readString(record.created_at),
    updatedAt: readString(record.updated_at),
  }
}

export function normalizePersonalizationQuestion(
  value: unknown,
): PersonalizationQuestionWithAnswer | null {
  const record = asRecord(value)

  if (!record) {
    return null
  }

  const id = readString(record.id)
  const question = readString(record.question)

  if (!id || !question?.trim()) {
    return null
  }

  return {
    id,
    question,
    description: readString(record.description),
    isRequired: record.is_required !== false,
    isActive: record.is_active !== false,
    displayOrder: readNumber(record.display_order) ?? 0,
    createdAt: readString(record.created_at),
    updatedAt: readString(record.updated_at),
    archivedAt: readString(record.archived_at),
    answer: normalizePersonalizationAnswer(record.answer, id),
  }
}

function extractQuestionItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload
  }

  const record = asRecord(payload)

  if (!record) {
    return []
  }

  if (Array.isArray(record.questions)) {
    return record.questions
  }

  if (Array.isArray(record.data)) {
    return record.data
  }

  const data = asRecord(record.data)
  return Array.isArray(data?.questions) ? data.questions : []
}

function extractAnswerItems(payload: unknown): unknown[] {
  const record = asRecord(payload)

  if (!record) {
    return []
  }

  if (Array.isArray(record.answers)) {
    return record.answers
  }

  const data = asRecord(record.data)
  return Array.isArray(data?.answers) ? data.answers : []
}

function normalizeQuestionsResponse(payload: unknown): PersonalizationQuestionsResponse {
  const questions = extractQuestionItems(payload)
    .map(normalizePersonalizationQuestion)
    .filter((question): question is PersonalizationQuestionWithAnswer => Boolean(question))

  const answersByQuestionId = new Map(
    extractAnswerItems(payload)
      .map((value) => normalizePersonalizationAnswer(value))
      .filter((answer): answer is PersonalizationAnswer => Boolean(answer))
      .map((answer) => [answer.questionId, answer] as const),
  )

  const mergedQuestions = questions
    .map((question) => ({
      ...question,
      answer: question.answer ?? answersByQuestionId.get(question.id) ?? null,
    }))
    .sort((left, right) => left.displayOrder - right.displayOrder || left.id.localeCompare(right.id))

  console.log(mergedQuestions)

  return { questions: mergedQuestions }
}

function validateAnswers(payload: UpdatePersonalizationAnswersPayload) {
  const questionIds = new Set<string>()

  for (const item of payload.answers) {
    if (!item.questionId.trim()) {
      throw new ApiClientError('Every answer must include a question ID.')
    }

    if (questionIds.has(item.questionId)) {
      throw new ApiClientError('Each question can only be answered once per request.')
    }

    if (item.answer.trim().length > PERSONALIZATION_ANSWER_MAX_LENGTH) {
      throw new ApiClientError(
        `Each answer must be ${PERSONALIZATION_ANSWER_MAX_LENGTH} characters or fewer.`,
      )
    }

    questionIds.add(item.questionId)
  }
}

export async function fetchPersonalizationQuestions(signal?: AbortSignal) {
  const response = await apiClient.request<unknown>('/api/v1/personalization/questions', { signal })
  console.log(response);
  
  return normalizeQuestionsResponse(response)
}

export async function updatePersonalizationAnswers(
  payload: UpdatePersonalizationAnswersPayload,
  signal?: AbortSignal,
) {
  validateAnswers(payload)

  const response = await apiClient.request<unknown>('/api/v1/personalization/answers', {
    method: 'PUT',
    body: {
      answers: payload.answers.map((item) => ({
        question_id: item.questionId,
        answer: item.answer.trim(),
      })),
    },
    signal,
  })

  return normalizeQuestionsResponse(response)
}
