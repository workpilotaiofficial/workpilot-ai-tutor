export type StoredStudySetUploadMeta = {
  documentId: string
  embeddingJobId: string | null
  title: string
  filename: string | null
  sourceType: 'text' | 'pdf'
  status: string
  createdAt: string
  updatedAt: string
}

export type StoredStudySetGenerationMeta = {
  documentId: string
  studySetId: string
  batch: {
    id: string
    status: string
    totalJobs: number
    completedJobs: number
    failedJobs: number
    selectedTypes: string[]
    estimatedCredits: number
    createdAt: string
    lastError?: string | null
  }
  jobs: StoredStudySetGenerationJob[]
  websocket: {
    url: string
    token: string
    expiresIn: number
  }
  connectionStatus: 'idle' | 'connecting' | 'connected' | 'polling' | 'completed' | 'closed' | 'error'
  startedAt: string
  lastEventAt?: string
  completedAt?: string
  fetchedOutputs: Record<
    string,
    {
      fetched: boolean
      fetchedAt?: string
      taskType: string
      sectionType?: string
      error?: string
    }
  >
}

export type StoredStudySetGenerationJob = {
  jobId: string
  type: string
  status: string
  estimatedCredits: number
  outputId?: string | null
  error?: string | null
  startedAt?: string | null
  completedAt?: string | null
}

const LATEST_STUDY_SET_UPLOAD_KEY = 'ai_tutora_latest_study_set_upload'
const STUDY_SET_UPLOAD_MAP_KEY = 'ai_tutora_study_set_upload_meta'
const LATEST_STUDY_SET_GENERATION_KEY = 'ai_tutora_latest_study_set_generation'
const STUDY_SET_GENERATION_MAP_KEY = 'ai_tutora_study_set_generation_meta'

function isBrowser() {
  return typeof window !== 'undefined'
}

function readUploadMetaMap() {
  if (!isBrowser()) {
    return {} as Record<string, StoredStudySetUploadMeta>
  }

  try {
    const rawValue = window.localStorage.getItem(STUDY_SET_UPLOAD_MAP_KEY)
    if (!rawValue) {
      return {} as Record<string, StoredStudySetUploadMeta>
    }

    const parsedValue = JSON.parse(rawValue)
    return parsedValue && typeof parsedValue === 'object'
      ? (parsedValue as Record<string, StoredStudySetUploadMeta>)
      : {}
  } catch {
    return {} as Record<string, StoredStudySetUploadMeta>
  }
}

function writeUploadMetaMap(value: Record<string, StoredStudySetUploadMeta>) {
  if (!isBrowser()) {
    return
  }

  window.localStorage.setItem(STUDY_SET_UPLOAD_MAP_KEY, JSON.stringify(value))
}

function readGenerationMetaMap() {
  if (!isBrowser()) {
    return {} as Record<string, StoredStudySetGenerationMeta>
  }

  try {
    const rawValue = window.localStorage.getItem(STUDY_SET_GENERATION_MAP_KEY)
    if (!rawValue) {
      return {} as Record<string, StoredStudySetGenerationMeta>
    }

    const parsedValue = JSON.parse(rawValue)
    return parsedValue && typeof parsedValue === 'object'
      ? (parsedValue as Record<string, StoredStudySetGenerationMeta>)
      : {}
  } catch {
    return {} as Record<string, StoredStudySetGenerationMeta>
  }
}

function writeGenerationMetaMap(value: Record<string, StoredStudySetGenerationMeta>) {
  if (!isBrowser()) {
    return
  }

  window.localStorage.setItem(STUDY_SET_GENERATION_MAP_KEY, JSON.stringify(value))
}

export function saveStudySetUploadMeta(meta: StoredStudySetUploadMeta) {
  if (!isBrowser()) {
    return
  }

  const currentMap = readUploadMetaMap()
  const nextMap = {
    ...currentMap,
    [meta.documentId]: meta,
  }

  writeUploadMetaMap(nextMap)
  window.localStorage.setItem(LATEST_STUDY_SET_UPLOAD_KEY, JSON.stringify(meta))
}

export function getStudySetUploadMeta(documentId: string) {
  return readUploadMetaMap()[documentId] ?? null
}

export function getLatestStudySetUploadMeta() {
  if (!isBrowser()) {
    return null
  }

  try {
    const rawValue = window.localStorage.getItem(LATEST_STUDY_SET_UPLOAD_KEY)
    return rawValue ? (JSON.parse(rawValue) as StoredStudySetUploadMeta) : null
  } catch {
    return null
  }
}

export function saveStudySetGenerationMeta(meta: StoredStudySetGenerationMeta) {
  if (!isBrowser()) {
    return
  }

  const currentMap = readGenerationMetaMap()
  const nextMap = {
    ...currentMap,
    [meta.documentId]: meta,
  }

  writeGenerationMetaMap(nextMap)
  window.localStorage.setItem(LATEST_STUDY_SET_GENERATION_KEY, JSON.stringify(meta))
}

export function getStudySetGenerationMeta(documentId: string) {
  return readGenerationMetaMap()[documentId] ?? null
}

export function getLatestStudySetGenerationMeta() {
  if (!isBrowser()) {
    return null
  }

  try {
    const rawValue = window.localStorage.getItem(LATEST_STUDY_SET_GENERATION_KEY)
    return rawValue ? (JSON.parse(rawValue) as StoredStudySetGenerationMeta) : null
  } catch {
    return null
  }
}

export function updateStudySetGenerationMeta(
  documentId: string,
  updater: (current: StoredStudySetGenerationMeta) => StoredStudySetGenerationMeta
) {
  const currentValue = getStudySetGenerationMeta(documentId)

  if (!currentValue) {
    return null
  }

  const nextValue = updater(currentValue)
  saveStudySetGenerationMeta(nextValue)
  return nextValue
}
