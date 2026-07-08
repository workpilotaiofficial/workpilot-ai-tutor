import { ApiClientError, apiClient } from '@/lib/api/client'

export type GraderCriterion = {
  criterion: string
  score: number
  max_score: number
  feedback: string
}

export type GraderResult = {
  error: string | null
  overall_score: number | null
  overall_grade: string | null
  max_score: number | null
  criteria: GraderCriterion[]
  strengths: string[]
  improvement_areas: string[]
  missing_requirements: string[]
}

export type GraderResultSubmission = {
  id: string
  title: string
  status: string
  credits_consumed: number
  error_message: string | null
  completed_at: string | null
}

export type GraderSubmission = {
  id: string
  title: string
  status: string
  estimated_credits: number
  created_at: string
}

export type GraderWebsocket = {
  url: string
  token: string
  expires_in: number
}

export type GraderSubmitResponse = {
  submission: GraderSubmission
  job_id: string
  websocket: GraderWebsocket
}

export type GraderResultResponse = {
  submission: GraderResultSubmission
  result: GraderResult | null
}

type SubmitGraderAssignmentPayload = {
  title: string
  assignmentFile: File
  rubricFile: File
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function normalizeCriterion(payload: unknown): GraderCriterion | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const criterion = payload as Partial<GraderCriterion>

  if (typeof criterion.criterion !== 'string' || !criterion.criterion.trim()) {
    return null
  }

  return {
    criterion: criterion.criterion,
    score: typeof criterion.score === 'number' ? criterion.score : 0,
    max_score: typeof criterion.max_score === 'number' ? criterion.max_score : 0,
    feedback: typeof criterion.feedback === 'string' ? criterion.feedback : '',
  }
}

function normalizeResult(payload: unknown): GraderResult | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const result = payload as Partial<GraderResult>

  return {
    error: typeof result.error === 'string' ? result.error : null,
    overall_score: typeof result.overall_score === 'number' ? result.overall_score : null,
    overall_grade: typeof result.overall_grade === 'string' ? result.overall_grade : null,
    max_score: typeof result.max_score === 'number' ? result.max_score : null,
    criteria: Array.isArray(result.criteria)
      ? result.criteria.map(normalizeCriterion).filter((item): item is GraderCriterion => item !== null)
      : [],
    strengths: toStringArray(result.strengths),
    improvement_areas: toStringArray(result.improvement_areas),
    missing_requirements: toStringArray(result.missing_requirements),
  }
}

function normalizeSubmitResponse(payload: unknown): GraderSubmitResponse {
  if (!payload || typeof payload !== 'object') {
    throw new ApiClientError('Grader submission failed: invalid response payload.')
  }

  const response = payload as Partial<GraderSubmitResponse>
  const submission = response.submission

  if (!submission || typeof submission !== 'object') {
    throw new ApiClientError('Grader submission failed: missing submission metadata.')
  }

  if (typeof submission.id !== 'string' || !submission.id.trim()) {
    throw new ApiClientError('Grader submission failed: missing submission id in response payload.')
  }

  if (!response.websocket || typeof response.websocket !== 'object') {
    throw new ApiClientError('Grader submission failed: missing websocket metadata.')
  }

  if (typeof response.websocket.url !== 'string' || !response.websocket.url.trim()) {
    throw new ApiClientError('Grader submission failed: missing websocket URL.')
  }

  if (typeof response.websocket.token !== 'string' || !response.websocket.token.trim()) {
    throw new ApiClientError('Grader submission failed: missing websocket token.')
  }

  return {
    submission: {
      id: submission.id,
      title: typeof submission.title === 'string' ? submission.title : '',
      status: typeof submission.status === 'string' ? submission.status : '',
      estimated_credits:
        typeof submission.estimated_credits === 'number' ? submission.estimated_credits : 0,
      created_at:
        typeof submission.created_at === 'string' ? submission.created_at : new Date().toISOString(),
    },
    job_id: typeof response.job_id === 'string' ? response.job_id : '',
    websocket: {
      url: response.websocket.url,
      token: response.websocket.token,
      expires_in: typeof response.websocket.expires_in === 'number' ? response.websocket.expires_in : 0,
    },
  }
}

function normalizeResultResponse(payload: unknown): GraderResultResponse {
  if (!payload || typeof payload !== 'object') {
    throw new ApiClientError('Grader result fetch failed: invalid response payload.')
  }

  const response = payload as { submission?: Record<string, unknown>; result?: unknown }
  const submission = response.submission

  if (!submission || typeof submission !== 'object') {
    throw new ApiClientError('Grader result fetch failed: missing submission metadata.')
  }

  if (typeof submission.id !== 'string' || !submission.id.trim()) {
    throw new ApiClientError('Grader result fetch failed: missing submission id.')
  }

  const errorMessage =
    typeof submission.error_message === 'string'
      ? submission.error_message
      : typeof submission.errorMessage === 'string'
        ? submission.errorMessage
        : null

  return {
    submission: {
      id: submission.id,
      title: typeof submission.title === 'string' ? submission.title : '',
      status: typeof submission.status === 'string' ? submission.status : '',
      credits_consumed:
        typeof submission.credits_consumed === 'number' ? submission.credits_consumed : 0,
      error_message: errorMessage,
      completed_at: typeof submission.completed_at === 'string' ? submission.completed_at : null,
    },
    result: normalizeResult(response.result),
  }
}

export async function submitGraderAssignment(payload: SubmitGraderAssignmentPayload) {
  const formData = new FormData()
  formData.set('title', payload.title)
  formData.set('assignment_file', payload.assignmentFile)
  formData.set('rubric_file', payload.rubricFile)

  const response = await apiClient.request<GraderSubmitResponse>('/api/v1/grader/submit', {
    method: 'POST',
    body: formData,
  })

  return normalizeSubmitResponse(response)
}

export async function fetchGraderResult(submissionId: string) {
  const response = await apiClient.request<GraderResultResponse>(
    `/api/v1/grader/result/${encodeURIComponent(submissionId)}`,
  )

  return normalizeResultResponse(response)
}
