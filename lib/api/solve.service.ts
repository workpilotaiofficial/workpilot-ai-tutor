import { ApiClientError, apiClient } from '@/lib/api/client'

export type SolveSubjectCategory = 'math' | 'science' | 'quantitative' | 'narrative' | 'general'

export type SolveInputType = 'image' | 'text' | 'pdf' | 'document'

export type SolveStep = {
  step_number: number
  explanation: string
  expression: string | null
  format: 'latex' | 'plain'
}

export type SolveMathContent = {
  kind: 'math'
  steps: SolveStep[]
  formulas_used: string[]
  check_work: string | null
}

export type SolveScienceContent = {
  kind: 'science'
  steps: SolveStep[]
  key_concepts: string[]
  diagram_url: string | null
}

export type SolveNarrativeSection = {
  heading: string
  body: string
}

export type SolveKeyTerm = {
  term: string
  definition: string
}

export type SolveCitation = {
  source: string
  note: string | null
}

export type SolveNarrativeContent = {
  kind: 'narrative'
  sections: SolveNarrativeSection[]
  key_terms: SolveKeyTerm[]
  citations: SolveCitation[]
}

export type SolveGenericContent = {
  kind: 'general'
  markdown: string
}

export type SolveContent = SolveMathContent | SolveScienceContent | SolveNarrativeContent | SolveGenericContent

export type SolveFinalAnswer = {
  value: string
  format: 'latex' | 'plain'
} | null

export type SolveResult = {
  subject_category: SolveSubjectCategory
  subject_label: string | null
  detected_confidence: number | null
  final_answer: SolveFinalAnswer
  content: SolveContent
}

export type SolveMessageRole = 'user' | 'assistant'
export type SolveMessageStatus = 'pending' | 'completed' | 'failed'

export type SolveChatMessage = {
  id: string
  role: SolveMessageRole
  status: SolveMessageStatus
  created_at: string
  text: string | null
  image_url: string | null
  file_name: string | null
  result: SolveResult | null
  error_message: string | null
}

export type SolveSession = {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export type SolveSessionDetail = {
  session: SolveSession
  messages: SolveChatMessage[]
}

export type SolveSessionSummary = {
  id: string
  title: string
  subject_label: string | null
  last_message_preview: string | null
  created_at: string
  updated_at: string
}

export type SolveSessionHistoryResponse = {
  data: SolveSessionSummary[]
}

export type SolveWebsocket = {
  url: string
  token: string
  expires_in: number
}

export type StartSolveSessionResponse = {
  session: SolveSession
  message: SolveChatMessage
  job_id: string
  websocket: SolveWebsocket
}

export type SendSolveMessageResponse = {
  message: SolveChatMessage
  job_id: string
  websocket: SolveWebsocket
}

type StartSolveSessionPayload = {
  title?: string
  subjectHint?: SolveSubjectCategory | 'auto'
  image?: File
  pdf?: File
  document?: File
  questionText?: string
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function normalizeStep(payload: unknown): SolveStep | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const step = payload as Record<string, unknown>
  const explanation = typeof step.explanation === 'string' ? step.explanation : ''

  if (!explanation.trim()) {
    return null
  }

  const format = step.format === 'latex' ? 'latex' : 'plain'
  const expression = typeof step.expression === 'string' && step.expression.trim() ? step.expression : null

  return {
    step_number:
      typeof step.step_number === 'number' ? step.step_number : typeof step.stepNumber === 'number' ? step.stepNumber : 0,
    explanation,
    expression,
    format,
  }
}

function normalizeSteps(payload: unknown): SolveStep[] {
  return Array.isArray(payload) ? payload.map(normalizeStep).filter((step): step is SolveStep => step !== null) : []
}

function normalizeContent(subjectCategory: SolveSubjectCategory, payload: unknown): SolveContent {
  const content = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>

  switch (subjectCategory) {
    case 'math':
    case 'quantitative':
      return {
        kind: 'math',
        steps: normalizeSteps(content.steps),
        formulas_used: toStringArray(content.formulas_used ?? content.formulasUsed),
        check_work:
          typeof content.check_work === 'string'
            ? content.check_work
            : typeof content.checkWork === 'string'
              ? content.checkWork
              : null,
      }
    case 'science':
      return {
        kind: 'science',
        steps: normalizeSteps(content.steps),
        key_concepts: toStringArray(content.key_concepts ?? content.keyConcepts),
        diagram_url:
          typeof content.diagram_url === 'string'
            ? content.diagram_url
            : typeof content.diagramUrl === 'string'
              ? content.diagramUrl
              : null,
      }
    case 'narrative': {
      const sections = Array.isArray(content.sections)
        ? content.sections
            .map((section: unknown) => {
              if (!section || typeof section !== 'object') return null
              const heading = (section as Record<string, unknown>).heading
              const body = (section as Record<string, unknown>).body
              if (typeof heading !== 'string' || typeof body !== 'string') return null
              return { heading, body }
            })
            .filter((section): section is SolveNarrativeSection => section !== null)
        : []

      const keyTerms = Array.isArray(content.key_terms ?? content.keyTerms)
        ? ((content.key_terms ?? content.keyTerms) as unknown[])
            .map((term) => {
              if (!term || typeof term !== 'object') return null
              const t = (term as Record<string, unknown>).term
              const definition = (term as Record<string, unknown>).definition
              if (typeof t !== 'string' || typeof definition !== 'string') return null
              return { term: t, definition }
            })
            .filter((term): term is SolveKeyTerm => term !== null)
        : []

      const citations = Array.isArray(content.citations)
        ? content.citations
            .map((citation: unknown) => {
              if (!citation || typeof citation !== 'object') return null
              const source = (citation as Record<string, unknown>).source
              if (typeof source !== 'string') return null
              const note = (citation as Record<string, unknown>).note
              return { source, note: typeof note === 'string' ? note : null }
            })
            .filter((citation): citation is SolveCitation => citation !== null)
        : []

      return { kind: 'narrative', sections, key_terms: keyTerms, citations }
    }
    default:
      return {
        kind: 'general',
        markdown: typeof content.markdown === 'string' ? content.markdown : typeof payload === 'string' ? payload : '',
      }
  }
}

function normalizeSolveResult(payload: unknown): SolveResult | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const result = payload as Record<string, unknown>
  const rawCategory = typeof result.subject_category === 'string' ? result.subject_category : 'general'
  const subjectCategory: SolveSubjectCategory =
    rawCategory === 'math' || rawCategory === 'science' || rawCategory === 'quantitative' || rawCategory === 'narrative'
      ? rawCategory
      : 'general'

  const finalAnswerPayload = result.final_answer as Record<string, unknown> | undefined
  const finalAnswer: SolveFinalAnswer =
    finalAnswerPayload && typeof finalAnswerPayload.value === 'string'
      ? { value: finalAnswerPayload.value, format: finalAnswerPayload.format === 'latex' ? 'latex' : 'plain' }
      : null

  return {
    subject_category: subjectCategory,
    subject_label: typeof result.subject_label === 'string' ? result.subject_label : null,
    detected_confidence: typeof result.detected_confidence === 'number' ? result.detected_confidence : null,
    final_answer: finalAnswer,
    content: normalizeContent(subjectCategory, result.content),
  }
}

function normalizeChatMessage(payload: unknown): SolveChatMessage | null {
  if (!payload || typeof payload !== 'object') return null

  const message = payload as Record<string, unknown>
  const id = message.id

  if (typeof id !== 'string' || !id.trim()) return null

  const role = message.role === 'assistant' ? 'assistant' : 'user'
  const rawStatus = typeof message.status === 'string' ? message.status : 'completed'
  const status: SolveMessageStatus =
    rawStatus === 'pending' || rawStatus === 'processing' || rawStatus === 'queued'
      ? 'pending'
      : rawStatus === 'failed' || rawStatus === 'error'
        ? 'failed'
        : 'completed'

  return {
    id,
    role,
    status,
    created_at: typeof message.created_at === 'string' ? message.created_at : new Date().toISOString(),
    text: typeof message.text === 'string' ? message.text : null,
    image_url: typeof message.image_url === 'string' ? message.image_url : null,
    file_name:
      typeof message.file_name === 'string'
        ? message.file_name
        : typeof message.fileName === 'string'
          ? message.fileName
          : null,
    result: normalizeSolveResult(message.result),
    error_message:
      typeof message.error_message === 'string'
        ? message.error_message
        : typeof message.errorMessage === 'string'
          ? message.errorMessage
          : null,
  }
}

function normalizeSession(payload: unknown): SolveSession {
  if (!payload || typeof payload !== 'object') {
    throw new ApiClientError('Invalid solve session payload.')
  }

  const session = payload as Record<string, unknown>

  if (typeof session.id !== 'string' || !session.id.trim()) {
    throw new ApiClientError('Solve session is missing an id.')
  }

  return {
    id: session.id,
    title: typeof session.title === 'string' ? session.title : 'Untitled question',
    created_at: typeof session.created_at === 'string' ? session.created_at : new Date().toISOString(),
    updated_at: typeof session.updated_at === 'string' ? session.updated_at : new Date().toISOString(),
  }
}

function normalizeWebsocket(payload: unknown): SolveWebsocket {
  if (
    !payload ||
    typeof payload !== 'object' ||
    typeof (payload as Record<string, unknown>).url !== 'string' ||
    typeof (payload as Record<string, unknown>).token !== 'string'
  ) {
    throw new ApiClientError('Solve request failed: missing websocket metadata.')
  }

  const websocket = payload as Record<string, unknown>

  return {
    url: websocket.url as string,
    token: websocket.token as string,
    expires_in: typeof websocket.expires_in === 'number' ? websocket.expires_in : 0,
  }
}

export async function startSolveSession(payload: StartSolveSessionPayload) {
  const formData = new FormData()

  if (payload.title) {
    formData.set('title', payload.title)
  }

  formData.set('subject_hint', payload.subjectHint ?? 'auto')

  // Attachment and typed text are independent — a photo/PDF/doc can be
  // submitted together with an accompanying question, not just one or the other.
  const primaryInputType: SolveInputType = payload.image
    ? 'image'
    : payload.pdf
      ? 'pdf'
      : payload.document
        ? 'document'
        : 'text'
  formData.set('input_type', primaryInputType)

  if (payload.image) {
    formData.set('image', payload.image)
  }
  if (payload.pdf) {
    formData.set('pdf', payload.pdf)
  }
  if (payload.document) {
    formData.set('document', payload.document)
  }
  if (payload.questionText?.trim()) {
    formData.set('question_text', payload.questionText.trim())
  }

  const response = await apiClient.request<Record<string, unknown>>('/api/v1/solve/sessions', {
    method: 'POST',
    body: formData,
  })

  const message = normalizeChatMessage(response.message)

  if (!message) {
    throw new ApiClientError('Solve session failed: missing initial message in response payload.')
  }

  return {
    session: normalizeSession(response.session),
    message,
    job_id: typeof response.job_id === 'string' ? response.job_id : '',
    websocket: normalizeWebsocket(response.websocket),
  } satisfies StartSolveSessionResponse
}

export async function sendSolveMessage(sessionId: string, text: string) {
  const response = await apiClient.request<Record<string, unknown>>(
    `/api/v1/solve/sessions/${encodeURIComponent(sessionId)}/messages`,
    {
      method: 'POST',
      body: { text },
    },
  )

  const message = normalizeChatMessage(response.message)

  if (!message) {
    throw new ApiClientError('Sending your message failed: invalid response payload.')
  }

  return {
    message,
    job_id: typeof response.job_id === 'string' ? response.job_id : '',
    websocket: normalizeWebsocket(response.websocket),
  } satisfies SendSolveMessageResponse
}

export async function fetchSolveSession(sessionId: string) {
  const response = await apiClient.request<Record<string, unknown>>(
    `/api/v1/solve/sessions/${encodeURIComponent(sessionId)}`,
  )

  const messages = Array.isArray(response.messages)
    ? response.messages.map(normalizeChatMessage).filter((message): message is SolveChatMessage => message !== null)
    : []

  return {
    session: normalizeSession(response.session),
    messages,
  } satisfies SolveSessionDetail
}

function normalizeSessionSummary(payload: unknown): SolveSessionSummary | null {
  if (!payload || typeof payload !== 'object') return null

  const summary = payload as Record<string, unknown>

  if (typeof summary.id !== 'string' || !summary.id.trim()) return null

  return {
    id: summary.id,
    title: typeof summary.title === 'string' ? summary.title : 'Untitled question',
    subject_label: typeof summary.subject_label === 'string' ? summary.subject_label : null,
    last_message_preview: typeof summary.last_message_preview === 'string' ? summary.last_message_preview : null,
    created_at: typeof summary.created_at === 'string' ? summary.created_at : new Date().toISOString(),
    updated_at: typeof summary.updated_at === 'string' ? summary.updated_at : new Date().toISOString(),
  }
}

export async function fetchSolveSessionHistory(signal?: AbortSignal) {
  const response = await apiClient.request<unknown>('/api/v1/solve/sessions', {
    method: 'GET',
    signal,
  })

  const entries = Array.isArray(response)
    ? response
    : response && typeof response === 'object' && Array.isArray((response as { data?: unknown }).data)
      ? (response as { data: unknown[] }).data
      : null

  if (!entries) {
    throw new ApiClientError('Solve history fetch failed: invalid response payload.')
  }

  return {
    data: entries.map(normalizeSessionSummary).filter((entry): entry is SolveSessionSummary => entry !== null),
  } satisfies SolveSessionHistoryResponse
}
