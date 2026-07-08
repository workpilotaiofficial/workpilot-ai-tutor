import { ApiClientError, apiClient } from '@/lib/api/client'

export const PERSONALIZATION_INSTRUCTIONS_MAX_LENGTH = 2500

export type UpdatePersonalizationPayload = {
  instructions: string
}

export type PersonalizationProfile = {
  id: string | null
  instructions: string
  isActive: boolean
  moderationStatus: string | null
  moderationReason: string | null
}

export type PersonalizationSettings = {
  profile: PersonalizationProfile | null
  examples: string[]
  instructions: string
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null
}

function normalizeProfile(value: unknown): PersonalizationProfile | null {
  const record = asRecord(value)

  if (!record) {
    return null
  }

  return {
    id: typeof record.id === 'string' ? record.id : null,
    instructions: typeof record.instructions === 'string' ? record.instructions : '',
    isActive: record.is_active === true,
    moderationStatus: typeof record.moderation_status === 'string' ? record.moderation_status : null,
    moderationReason: typeof record.moderation_reason === 'string' ? record.moderation_reason : null,
  }
}

function normalizePersonalizationSettings(payload: unknown): PersonalizationSettings {
  const record = asRecord(payload)
  const profile = normalizeProfile(record?.profile ?? payload)
  const examples = Array.isArray(record?.examples)
    ? record.examples.filter((item): item is string => typeof item === 'string')
    : []

  return {
    profile,
    examples,
    instructions: profile?.instructions ?? '',
  }
}

export async function fetchPersonalization(signal?: AbortSignal) {
  const response = await apiClient.request<unknown>('/api/v1/personalization', { signal })

  return normalizePersonalizationSettings(response)
}

export async function updatePersonalization(
  payload: UpdatePersonalizationPayload,
  signal?: AbortSignal,
) {
  const instructions = payload.instructions.trim()

  if (instructions.length > PERSONALIZATION_INSTRUCTIONS_MAX_LENGTH) {
    throw new ApiClientError(
      `Instructions must be ${PERSONALIZATION_INSTRUCTIONS_MAX_LENGTH} characters or fewer.`,
    )
  }

  const response = await apiClient.request<unknown>('/api/v1/personalization', {
    method: 'PUT',
    body: { instructions },
    signal,
  })

  return normalizePersonalizationSettings(response)
}
