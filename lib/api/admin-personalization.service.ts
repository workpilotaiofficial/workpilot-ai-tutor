import { ApiClientError, apiClient } from '@/lib/api/client'
import {
  PERSONALIZATION_QUESTION_DESCRIPTION_MAX_LENGTH,
  PERSONALIZATION_QUESTION_MAX_LENGTH,
  normalizePersonalizationQuestion,
  type PersonalizationQuestion,
} from '@/lib/api/user-settings.service'

type ApiRecord = Record<string, unknown>

export type AdminPersonalizationQuestion = PersonalizationQuestion

export type CreateAdminPersonalizationQuestionPayload = {
  question: string
  description?: string | null
  isRequired?: boolean
  isActive?: boolean
  displayOrder?: number
}

export type UpdateAdminPersonalizationQuestionPayload =
  Partial<CreateAdminPersonalizationQuestionPayload>

function asRecord(value: unknown): ApiRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as ApiRecord) : null
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

function validatePayload(payload: UpdateAdminPersonalizationQuestionPayload, isCreate = false) {
  if (isCreate && typeof payload.question !== 'string') {
    throw new ApiClientError('Question is required.')
  }

  if (typeof payload.question === 'string') {
    const question = payload.question.trim()

    if (!question) {
      throw new ApiClientError('Question is required.')
    }

    if (question.length > PERSONALIZATION_QUESTION_MAX_LENGTH) {
      throw new ApiClientError(
        `Question must be ${PERSONALIZATION_QUESTION_MAX_LENGTH} characters or fewer.`,
      )
    }
  }

  if (
    typeof payload.description === 'string' &&
    payload.description.trim().length > PERSONALIZATION_QUESTION_DESCRIPTION_MAX_LENGTH
  ) {
    throw new ApiClientError(
      `Helper text must be ${PERSONALIZATION_QUESTION_DESCRIPTION_MAX_LENGTH} characters or fewer.`,
    )
  }

  if (
    typeof payload.displayOrder !== 'undefined' &&
    (!Number.isInteger(payload.displayOrder) || payload.displayOrder < 0)
  ) {
    throw new ApiClientError('Display order must be a non-negative whole number.')
  }
}

function toApiBody(payload: UpdateAdminPersonalizationQuestionPayload) {
  return {
    ...(typeof payload.question === 'string' ? { question: payload.question.trim() } : {}),
    ...(typeof payload.description !== 'undefined'
      ? { description: payload.description?.trim() || null }
      : {}),
    ...(typeof payload.isRequired === 'boolean' ? { is_required: payload.isRequired } : {}),
    ...(typeof payload.isActive === 'boolean' ? { is_active: payload.isActive } : {}),
    ...(typeof payload.displayOrder === 'number' ? { display_order: payload.displayOrder } : {}),
  }
}

export async function fetchAdminPersonalizationQuestions(signal?: AbortSignal) {
  const response = await apiClient.request<unknown>(
    '/api/v1/admin/personalization/questions?include_archived=true',
    { signal },
  )

  return extractQuestionItems(response)
    .map(normalizePersonalizationQuestion)
    .filter((question): question is NonNullable<typeof question> => Boolean(question))
    .map((question) => ({
      id: question.id,
      question: question.question,
      description: question.description,
      isRequired: question.isRequired,
      isActive: question.isActive,
      displayOrder: question.displayOrder,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
      archivedAt: question.archivedAt,
    }))
    .sort((left, right) => left.displayOrder - right.displayOrder || left.id.localeCompare(right.id))
}

export async function createAdminPersonalizationQuestion(
  payload: CreateAdminPersonalizationQuestionPayload,
  signal?: AbortSignal,
) {
  validatePayload(payload, true)

  return apiClient.request<unknown>('/api/v1/admin/personalization/questions', {
    method: 'POST',
    body: toApiBody(payload),
    signal,
  })
}

export async function updateAdminPersonalizationQuestion(
  questionId: string,
  payload: UpdateAdminPersonalizationQuestionPayload,
  signal?: AbortSignal,
) {
  validatePayload(payload)

  return apiClient.request<unknown>(`/api/v1/admin/personalization/questions/${questionId}`, {
    method: 'PATCH',
    body: toApiBody(payload),
    signal,
  })
}

export async function deleteAdminPersonalizationQuestion(
  questionId: string,
  signal?: AbortSignal,
) {
  return apiClient.request<unknown>(`/api/v1/admin/personalization/questions/${questionId}`, {
    method: 'DELETE',
    signal,
  })
}
