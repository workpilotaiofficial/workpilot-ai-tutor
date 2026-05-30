import { ApiClientError, apiClient } from '@/lib/api/client'

export type StudySetUploadDocument = {
  id: string
  userId: string
  title: string
  filename: string
  contentHash: string
  status: string
  embeddingJobId: string | null
  r2Path: string | null
  pageCount: number | null
  characterCount: number | null
  createdAt: string
  updatedAt: string
}

export type StudySetUploadResponse = {
  document: StudySetUploadDocument
  embedding_job_id: string | null
  message: string
}

export type StudySetGenerateType =
  | 'notes'
  | 'content'
  | 'tutor_lesson'
  | 'flashcards'
  | 'multiple_choice'
  | 'fill_in_blanks'
  | 'written_test'
  | 'podcast'
  | 'quiz'

export type StudySetGenerationBatch = {
  id: string
  document_id: string
  status: string
  total_jobs: number
  completed_jobs: number
  failed_jobs: number
  selected_types: StudySetGenerateType[]
  estimated_credits: number
  created_at: string
}

export type StudySetGenerationJob = {
  job_id: string
  type: StudySetGenerateType
  status: string
  estimated_credits: number
}

export type StudySetGenerationWebsocket = {
  url: string
  token: string
  expires_in: number
}

export type StudySetGenerateResponse = {
  study_set_id: string
  batch: StudySetGenerationBatch
  jobs: StudySetGenerationJob[]
  websocket: StudySetGenerationWebsocket
}

export type ConnectedEvent = {
  type: 'connected'
  batch_id: string
  subscribed_at: string
}

export type JobStartedEvent = {
  type: 'job_started'
  job_id: string
  task_type: string
  timestamp: string
}

export type JobCompletedEvent = {
  type: 'job_completed'
  job_id: string
  task_type: string
  output_id?: string
  credits_consumed?: number
  timestamp: string
}

export type JobFailedEvent = {
  type: 'job_failed'
  job_id: string
  task_type: string
  error?: string
  credits_released?: number
  timestamp: string
}

export type BatchCompletedEvent = {
  type: 'batch_completed'
  batch_id: string
  total_jobs: number
  completed_jobs: number
  failed_jobs: number
  total_credits_consumed?: number
  timestamp: string
}

export type StudySetGenerationSocketEvent =
  | ConnectedEvent
  | JobStartedEvent
  | JobCompletedEvent
  | JobFailedEvent
  | BatchCompletedEvent

export type StudySetBatchStatusJob = {
  job_id?: string
  jobId?: string
  type?: string
  task_type?: string
  status: string
  estimated_credits?: number
  estimatedCredits?: number
  output_id?: string | null
  outputId?: string | null
  error?: string | null
}

export type StudySetBatchStatusResponse = {
  batch: {
    id: string
    status: string
    total_jobs: number
    completed_jobs: number
    failed_jobs: number
  }
  jobs: StudySetBatchStatusJob[]
}

export type StudySetNotesResponse = {
  study_set_id: string
  notes: {
    id: string
    generation_status?: string
    is_user_edited?: boolean
    rich_text_content?: Record<string, unknown> | null
    markdown_content?: string | null
    plain_text_content?: string | null
    updated_at?: string
  }
}

export type StudySetTutorLessonResponse = {
  study_set_id: string
  tutor_lesson: Record<string, unknown>
}

export type MultipleChoiceOption = {
  id: string
  text: string
}

export type MultipleChoiceQuestion = {
  id: string
  studySetId: string
  userId: string
  typeJobId: string
  questionText: string
  options: MultipleChoiceOption[]
  correctOptionId: string
  explanation?: string
  topic?: string
  difficulty?: string | null
  position: number
  isDeleted: boolean
  isUserEdited: boolean
  createdAt: string
  updatedAt: string
}

export type StudySetMultipleChoiceResponse = {
  study_set_id: string
  total_questions: number
  questions: MultipleChoiceQuestion[]
}

export type StudySetFlashcardsResponse = {
  study_set_id: string
  total_cards: number
  cards: Array<Record<string, unknown>>
}

export type FillInTheBlanksQuestion = {
  id: string
  studySetId: string
  userId: string
  typeJobId: string
  fullSentence: string
  displaySentence: string
  blanks: Array<{
    answer: string
    position: number
  }>
  topic?: string
  difficulty?: string | null
  position: number
  isDeleted: boolean
  isUserEdited: boolean
  createdAt: string
  updatedAt: string
}

export type StudySetFillInTheBlanksResponse = {
  study_set_id: string
  total_questions: number
  questions: FillInTheBlanksQuestion[]
}

export type StudySetWrittenTestResponse = {
  study_set_id: string
  total_questions: number
  questions: Array<Record<string, unknown>>
}

export type StudySetPodcastResponse = {
  study_set_id: string
  podcast: Record<string, unknown>
}

type UploadStudySetTextPayload = {
  title: string
  text: string
}

type UploadStudySetPdfPayload = {
  title: string
  file: File
}

type GenerateStudySetPayload = {
  documentId: string
  types: StudySetGenerateType[]
}

function normalizeUploadResponse(payload: unknown): StudySetUploadResponse {
  if (!payload || typeof payload !== 'object') {
    throw new ApiClientError('Upload failed: invalid response payload.')
  }

  const response = payload as Partial<StudySetUploadResponse> & {
    document?: Partial<StudySetUploadDocument>
  }

  if (!response.document?.id || typeof response.document.id !== 'string') {
    throw new ApiClientError('Upload failed: missing document id in response payload.')
  }

  if (!response.document.title || typeof response.document.title !== 'string') {
    throw new ApiClientError('Upload failed: missing document title in response payload.')
  }

  return {
    document: {
      id: response.document.id,
      userId: typeof response.document.userId === 'string' ? response.document.userId : '',
      title: response.document.title,
      filename: typeof response.document.filename === 'string' ? response.document.filename : '',
      contentHash: typeof response.document.contentHash === 'string' ? response.document.contentHash : '',
      status: typeof response.document.status === 'string' ? response.document.status : '',
      embeddingJobId:
        typeof response.document.embeddingJobId === 'string' ? response.document.embeddingJobId : null,
      r2Path: typeof response.document.r2Path === 'string' ? response.document.r2Path : null,
      pageCount: typeof response.document.pageCount === 'number' ? response.document.pageCount : null,
      characterCount:
        typeof response.document.characterCount === 'number' ? response.document.characterCount : null,
      createdAt:
        typeof response.document.createdAt === 'string'
          ? response.document.createdAt
          : new Date().toISOString(),
      updatedAt:
        typeof response.document.updatedAt === 'string'
          ? response.document.updatedAt
          : new Date().toISOString(),
    },
    embedding_job_id:
      typeof response.embedding_job_id === 'string'
        ? response.embedding_job_id
        : typeof response.document.embeddingJobId === 'string'
          ? response.document.embeddingJobId
          : null,
    message: typeof response.message === 'string' ? response.message : '',
  }
}

export async function uploadStudySetText(payload: UploadStudySetTextPayload) {
  const response = await apiClient.request<StudySetUploadResponse>('/api/v1/upload/text', {
    method: 'POST',
    body: {
      title: payload.title,
      text: payload.text,
    },
  })

  return normalizeUploadResponse(response)
}

export async function uploadStudySetPdf(payload: UploadStudySetPdfPayload) {
  const formData = new FormData()
  formData.set('title', payload.title)
  formData.set('file', payload.file)

  const response = await apiClient.request<StudySetUploadResponse>('/api/v1/upload/pdf', {
    method: 'POST',
    body: formData,
  })

  return normalizeUploadResponse(response)
}

function normalizeGenerateResponse(payload: unknown): StudySetGenerateResponse {
  if (!payload || typeof payload !== 'object') {
    throw new ApiClientError('Generate failed: invalid response payload.')
  }

  const response = payload as Partial<StudySetGenerateResponse>
  const batch = response.batch
  const websocket = response.websocket

  if (typeof response.study_set_id !== 'string' || !response.study_set_id.trim()) {
    throw new ApiClientError('Generate failed: missing study set id in response payload.')
  }

  if (!batch || typeof batch !== 'object' || typeof batch.id !== 'string' || typeof batch.document_id !== 'string') {
    throw new ApiClientError('Generate failed: missing batch metadata in response payload.')
  }

  if (
    !websocket ||
    typeof websocket !== 'object' ||
    typeof websocket.url !== 'string' ||
    typeof websocket.token !== 'string'
  ) {
    throw new ApiClientError('Generate failed: missing websocket metadata in response payload.')
  }

  const jobs = Array.isArray(response.jobs)
    ? response.jobs
        .filter((job): job is StudySetGenerationJob => {
          return Boolean(
            job &&
              typeof job === 'object' &&
              typeof job.job_id === 'string' &&
              typeof job.type === 'string' &&
              typeof job.status === 'string'
          )
        })
        .map((job) => ({
          ...job,
          estimated_credits: typeof job.estimated_credits === 'number' ? job.estimated_credits : 0,
        }))
    : []

  return {
    study_set_id: response.study_set_id,
    batch: {
      id: batch.id,
      document_id: batch.document_id,
      status: typeof batch.status === 'string' ? batch.status : '',
      total_jobs: typeof batch.total_jobs === 'number' ? batch.total_jobs : jobs.length,
      completed_jobs: typeof batch.completed_jobs === 'number' ? batch.completed_jobs : 0,
      failed_jobs: typeof batch.failed_jobs === 'number' ? batch.failed_jobs : 0,
      selected_types: Array.isArray(batch.selected_types)
        ? batch.selected_types.filter((type): type is StudySetGenerateType => typeof type === 'string')
        : [],
      estimated_credits: typeof batch.estimated_credits === 'number' ? batch.estimated_credits : 0,
      created_at: typeof batch.created_at === 'string' ? batch.created_at : new Date().toISOString(),
    },
    jobs,
    websocket: {
      url: websocket.url,
      token: websocket.token,
      expires_in: typeof websocket.expires_in === 'number' ? websocket.expires_in : 0,
    },
  }
}

export async function generateStudySet(payload: GenerateStudySetPayload) {
  const dedupedTypes = Array.from(new Set(payload.types))

  const response = await apiClient.request<StudySetGenerateResponse>('/api/v1/study-sets/generate', {
    method: 'POST',
    body: {
      document_id: payload.documentId,
      types: dedupedTypes,
    },
  })

  return normalizeGenerateResponse(response)
}

function normalizeFillInTheBlanksQuestion(question: FillInTheBlanksQuestion): Record<string, unknown> {
  const blanksArray = Array.isArray(question.blanks) ? question.blanks : []
  const firstBlank = blanksArray[0]
  const answer = firstBlank?.answer ?? ''

  return {
    id: question.id,
    sentence: question.displaySentence || question.fullSentence,
    answer,
    topic: question.topic,
    difficulty: question.difficulty,
    position: question.position,
    isDeleted: question.isDeleted,
    isUserEdited: question.isUserEdited,
    createdAt: question.createdAt,
    updatedAt: question.updatedAt,
    blanks: blanksArray,
  }
}

function normalizeFillInTheBlanksResponse(payload: unknown): StudySetFillInTheBlanksResponse {
  if (!payload || typeof payload !== 'object') {
    throw new ApiClientError('Fill in the blanks response failed: invalid response payload.')
  }

  const response = payload as Partial<StudySetFillInTheBlanksResponse>

  if (typeof response.study_set_id !== 'string' || !response.study_set_id.trim()) {
    throw new ApiClientError('Fill in the blanks response failed: missing study set id.')
  }

  const questions = Array.isArray(response.questions)
    ? response.questions
        .filter((q): q is FillInTheBlanksQuestion => {
          return Boolean(
            q &&
              typeof q === 'object' &&
              typeof (q as FillInTheBlanksQuestion).id === 'string' &&
              (typeof (q as FillInTheBlanksQuestion).fullSentence === 'string' ||
                typeof (q as FillInTheBlanksQuestion).displaySentence === 'string')
          )
        })
    : []

  return {
    study_set_id: response.study_set_id,
    total_questions: typeof response.total_questions === 'number' ? response.total_questions : questions.length,
    questions,
  }
}

function normalizeBatchStatusResponse(payload: unknown): StudySetBatchStatusResponse {
  if (!payload || typeof payload !== 'object') {
    throw new ApiClientError('Batch refresh failed: invalid response payload.')
  }

  const response = payload as {
    batch?: Partial<StudySetBatchStatusResponse['batch']>
    jobs?: StudySetBatchStatusJob[]
    id?: string
    status?: string
    total_jobs?: number
    completed_jobs?: number
    failed_jobs?: number
  }

  const sourceBatch = response.batch && typeof response.batch === 'object'
    ? response.batch
    : {
        id: response.id,
        status: response.status,
        total_jobs: response.total_jobs,
        completed_jobs: response.completed_jobs,
        failed_jobs: response.failed_jobs,
      }

  if (typeof sourceBatch.id !== 'string' || !sourceBatch.id.trim()) {
    throw new ApiClientError('Batch refresh failed: missing batch id.')
  }

  return {
    batch: {
      id: sourceBatch.id,
      status: typeof sourceBatch.status === 'string' ? sourceBatch.status : '',
      total_jobs: typeof sourceBatch.total_jobs === 'number' ? sourceBatch.total_jobs : 0,
      completed_jobs: typeof sourceBatch.completed_jobs === 'number' ? sourceBatch.completed_jobs : 0,
      failed_jobs: typeof sourceBatch.failed_jobs === 'number' ? sourceBatch.failed_jobs : 0,
    },
    jobs: Array.isArray(response.jobs) ? response.jobs : [],
  }
}

export async function fetchStudySetGenerationBatchStatus(batchId: string) {
  const response = await apiClient.request<StudySetBatchStatusResponse>(`/api/v1/study-sets/batch/${batchId}`, {
    method: 'GET',
  })

  return normalizeBatchStatusResponse(response)
}

async function fetchStudySetOutput<TResponse>(studySetId: string, endpoint: string) {
  return apiClient.request<TResponse>(`/api/v1/study-sets/${studySetId}/${endpoint}`, {
    method: 'GET',
  })
}

export function fetchStudySetNotes(studySetId: string) {
  return fetchStudySetOutput<StudySetNotesResponse>(studySetId, 'notes')
}

export function fetchStudySetTutorLesson(studySetId: string) {
  return fetchStudySetOutput<StudySetTutorLessonResponse>(studySetId, 'tutor_lesson')
}

export function fetchStudySetMultipleChoice(studySetId: string) {
  return fetchStudySetOutput<StudySetMultipleChoiceResponse>(studySetId, 'multiple_choice')
}

export function fetchStudySetFlashcards(studySetId: string) {
  return fetchStudySetOutput<StudySetFlashcardsResponse>(studySetId, 'flashcards')
}

export function fetchStudySetFillInTheBlanks(studySetId: string) {
  return fetchStudySetOutput<StudySetFillInTheBlanksResponse>(studySetId, 'fill_in_blanks')
}

export function fetchStudySetWrittenTest(studySetId: string) {
  return fetchStudySetOutput<StudySetWrittenTestResponse>(studySetId, 'written_test')
}

export function fetchStudySetPodcast(studySetId: string) {
  return fetchStudySetOutput<StudySetPodcastResponse>(studySetId, 'podcast')
}

export function fetchCompletedStudySetOutput(studySetId: string, type: StudySetGenerateType) {
  switch (type) {
    case 'notes':
      return fetchStudySetNotes(studySetId)
    case 'tutor_lesson':
      return fetchStudySetTutorLesson(studySetId)
    case 'multiple_choice':
    case 'quiz':
      return fetchStudySetMultipleChoice(studySetId)
    case 'flashcards':
      return fetchStudySetFlashcards(studySetId)
    case 'fill_in_blanks':
      return fetchStudySetFillInTheBlanks(studySetId)
    case 'written_test':
      return fetchStudySetWrittenTest(studySetId)
    case 'podcast':
      return fetchStudySetPodcast(studySetId)
    case 'content':
      throw new ApiClientError('Content output is not supported in the current UI flow.')
  }
}
