import { ApiClientError, apiClient } from '@/lib/api/client'

export type SyllabusUploadWebsocket = {
  url: string
  token: string
  expires_in: number
}

export type SyllabusUploadResponse = {
  syllabus_id: string
  job_id: string
  websocket: SyllabusUploadWebsocket
  stream_url: string
}

export type SyllabusSocketSnapshotPayload = {
  id: string
  processingStatus: string
}

export type SyllabusSocketSnapshotEvent = {
  type: string
  syllabus_id: string
  payload: SyllabusSocketSnapshotPayload
}

export type SyllabusAnalysisResponse = {
  id: string
  syllabusId: string
  courseSummary: string | null
  keyThemes: string[]
  overallLearningObjectives: string[]
  priorityTopics: Array<Record<string, unknown>>
  courseworkList: Array<Record<string, unknown>>
  totalModulesDetected: number
  modelName: string | null
  provider: string | null
  rawTokensUsed: number
  creditsConsumed: number
  status: string
  analysedAt: string | null
  createdAt: string | null
}

export type SyllabusDetailModule = {
  title?: string | null
  topics?: string[] | null
  estimatedWeeks?: number | null
  estimated_weeks?: number | null
  weeks?: number | null
}

export type SyllabusDetailTimelineItem = {
  weekRange?: string | null
  week_range?: string | null
  range?: string | null
  focus?: string | null
  title?: string | null
  outcomes?: string[] | null
}

export type SyllabusDetailPriorityTopic = {
  topic?: string | null
  title?: string | null
  name?: string | null
  reason?: string | null
  description?: string | null
  priority?: string | null
  level?: string | null
}

export type SyllabusDetailCourseworkItem = {
  task?: string | null
  title?: string | null
  name?: string | null
  when?: string | null
  timing?: string | null
  effort?: string | null
  load?: string | null
  tips?: string | null
  description?: string | null
}

export type SyllabusDetailResponse = {
  id: string
  userId: string
  title: string
  courseName: string | null
  courseCode: string | null
  institution: string | null
  instructorName: string | null
  sourceType: string
  originalFilename: string | null
  r2Path: string | null
  rawExtractedText: string
  contentHash: string
  processingStatus: string
  virusScanPassed: boolean
  semesterStartDate: string | null
  semesterEndDate: string | null
  semesterLabel: string | null
  totalWeeks: number | null
  createdAt: string
  updatedAt: string
  analysis: SyllabusAnalysisResponse | null
  modules: SyllabusDetailModule[]
  timeline: SyllabusDetailTimelineItem[]
  priority_topics: SyllabusDetailPriorityTopic[]
  coursework: SyllabusDetailCourseworkItem[]
}

type UploadSyllabusTextPayload = {
  title: string
  text: string
  semesterStartDate: string
  semesterEndDate: string
}

type UploadSyllabusPdfPayload = {
  title: string
  file: File
  semesterStartDate: string
  semesterEndDate: string
}

function normalizeUploadResponse(payload: unknown): SyllabusUploadResponse {
  if (!payload || typeof payload !== 'object') {
    throw new ApiClientError('Syllabus upload failed: invalid response payload.')
  }

  const response = payload as Partial<SyllabusUploadResponse>

  if (typeof response.syllabus_id !== 'string' || !response.syllabus_id.trim()) {
    throw new ApiClientError('Syllabus upload failed: missing syllabus id in response payload.')
  }

  if (typeof response.job_id !== 'string' || !response.job_id.trim()) {
    throw new ApiClientError('Syllabus upload failed: missing job id in response payload.')
  }

  if (!response.websocket || typeof response.websocket !== 'object') {
    throw new ApiClientError('Syllabus upload failed: missing websocket metadata.')
  }

  if (typeof response.websocket.url !== 'string' || !response.websocket.url.trim()) {
    throw new ApiClientError('Syllabus upload failed: missing websocket URL.')
  }

  if (typeof response.websocket.token !== 'string' || !response.websocket.token.trim()) {
    throw new ApiClientError('Syllabus upload failed: missing websocket token.')
  }

  return {
    syllabus_id: response.syllabus_id,
    job_id: response.job_id,
    websocket: {
      url: response.websocket.url,
      token: response.websocket.token,
      expires_in:
        typeof response.websocket.expires_in === 'number' ? response.websocket.expires_in : 0,
    },
    stream_url: typeof response.stream_url === 'string' ? response.stream_url : '',
  }
}

function normalizeSyllabusDetailResponse(payload: unknown): SyllabusDetailResponse {
  if (!payload || typeof payload !== 'object') {
    throw new ApiClientError('Syllabus detail fetch failed: invalid response payload.')
  }

  const response = payload as Partial<SyllabusDetailResponse>

  if (typeof response.id !== 'string' || !response.id.trim()) {
    throw new ApiClientError('Syllabus detail fetch failed: missing syllabus id.')
  }

  if (typeof response.title !== 'string') {
    throw new ApiClientError('Syllabus detail fetch failed: missing syllabus title.')
  }

  if (typeof response.sourceType !== 'string') {
    throw new ApiClientError('Syllabus detail fetch failed: missing source type.')
  }

  if (typeof response.rawExtractedText !== 'string') {
    throw new ApiClientError('Syllabus detail fetch failed: missing extracted text.')
  }

  if (typeof response.processingStatus !== 'string') {
    throw new ApiClientError('Syllabus detail fetch failed: missing processing status.')
  }

  if (typeof response.createdAt !== 'string' || typeof response.updatedAt !== 'string') {
    throw new ApiClientError('Syllabus detail fetch failed: missing timestamps.')
  }

  return {
    id: response.id,
    userId: typeof response.userId === 'string' ? response.userId : '',
    title: response.title,
    courseName: typeof response.courseName === 'string' ? response.courseName : null,
    courseCode: typeof response.courseCode === 'string' ? response.courseCode : null,
    institution: typeof response.institution === 'string' ? response.institution : null,
    instructorName: typeof response.instructorName === 'string' ? response.instructorName : null,
    sourceType: response.sourceType,
    originalFilename:
      typeof response.originalFilename === 'string' ? response.originalFilename : null,
    r2Path: typeof response.r2Path === 'string' ? response.r2Path : null,
    rawExtractedText: response.rawExtractedText,
    contentHash: typeof response.contentHash === 'string' ? response.contentHash : '',
    processingStatus: response.processingStatus,
    virusScanPassed: typeof response.virusScanPassed === 'boolean' ? response.virusScanPassed : false,
    semesterStartDate:
      typeof response.semesterStartDate === 'string' ? response.semesterStartDate : null,
    semesterEndDate: typeof response.semesterEndDate === 'string' ? response.semesterEndDate : null,
    semesterLabel: typeof response.semesterLabel === 'string' ? response.semesterLabel : null,
    totalWeeks: typeof response.totalWeeks === 'number' ? response.totalWeeks : null,
    createdAt: response.createdAt,
    updatedAt: response.updatedAt,
    analysis: response.analysis ?? null,
    modules: Array.isArray(response.modules) ? response.modules : [],
    timeline: Array.isArray(response.timeline) ? response.timeline : [],
    priority_topics: Array.isArray(response.priority_topics) ? response.priority_topics : [],
    coursework: Array.isArray(response.coursework) ? response.coursework : [],
  }
}

export async function uploadSyllabusText(payload: UploadSyllabusTextPayload) {
  const formData = new FormData()
  formData.set('title', payload.title)
  formData.set('text', payload.text)
  formData.set('semester_start_date', payload.semesterStartDate)
  formData.set('semester_end_date', payload.semesterEndDate)

  const response = await apiClient.request<SyllabusUploadResponse>('/api/v1/syllabus/upload/text', {
    method: 'POST',
    body: formData,
  })

  return normalizeUploadResponse(response)
}

export async function uploadSyllabusPdf(payload: UploadSyllabusPdfPayload) {
  const formData = new FormData()
  formData.set('title', payload.title)
  formData.set('file', payload.file)
  formData.set('semester_start_date', payload.semesterStartDate)
  formData.set('semester_end_date', payload.semesterEndDate)

  const response = await apiClient.request<SyllabusUploadResponse>('/api/v1/syllabus/upload/pdf', {
    method: 'POST',
    body: formData,
  })

  return normalizeUploadResponse(response)
}

export async function fetchSyllabusById(id: string) {
  const response = await apiClient.request<SyllabusDetailResponse>(`/api/v1/syllabus/${encodeURIComponent(id)}`)
  return normalizeSyllabusDetailResponse(response)
}
