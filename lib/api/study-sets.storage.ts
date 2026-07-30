import { getStoredAuthObject } from '@/lib/api/session-storage'
import type {
  FetchStudySetHistoryParams,
  StudySetHistoryResponse,
} from '@/lib/api/study-sets.service'

export type StoredStudySetUploadMeta = {
  documentId: string
  embeddingJobId: string | null
  title: string
  filename: string | null
  sourceType: 'text' | 'pdf' | 'image' | 'youtube'
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
const STUDY_SET_HISTORY_CACHE_PREFIX =
  'ai_tutora_study_set_history_cache:v1:'
const STUDY_SET_HISTORY_CACHE_TTL_MS = 5 * 60 * 1000

type StudySetHistoryCacheEntry = {
  cachedAt: number
  response: StudySetHistoryResponse
}

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

export function getStudySetGenerationMetaByStudySetId(studySetId: string) {
  if (!studySetId) {
    return null
  }

  return (
    Object.values(readGenerationMetaMap()).find(
      (meta) => meta.studySetId === studySetId,
    ) ?? null
  )
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

function hashToken(value: string) {
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0).toString(36)
}

function decodeTokenSubject(accessToken: string) {
  const encodedPayload = accessToken.split('.')[1]

  if (!encodedPayload) {
    return null
  }

  try {
    const normalizedPayload = encodedPayload
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(encodedPayload.length / 4) * 4, '=')
    const payload = JSON.parse(window.atob(normalizedPayload)) as Record<
      string,
      unknown
    >
    const subject = payload.sub ?? payload.user_id ?? payload.uid

    return typeof subject === 'string' && subject.trim()
      ? subject.trim()
      : null
  } catch {
    return null
  }
}

function getHistoryCacheSessionScope() {
  const accessToken = getStoredAuthObject()?.access_token

  if (!accessToken) {
    return null
  }

  const subject = decodeTokenSubject(accessToken)
  return subject ? `user:${subject}` : `token:${hashToken(accessToken)}`
}

function getHistoryCacheKey(params: FetchStudySetHistoryParams) {
  const cursor = params.cursor?.trim() || 'first'
  const limit =
    typeof params.limit === 'number' ? String(params.limit) : 'default'
  const requestKey = encodeURIComponent(`${cursor}:${limit}`)
  const sessionScope = getHistoryCacheSessionScope()

  return sessionScope
    ? `${STUDY_SET_HISTORY_CACHE_PREFIX}${encodeURIComponent(sessionScope)}:${requestKey}`
    : null
}

function isStudySetHistoryResponse(
  value: unknown,
): value is StudySetHistoryResponse {
  if (!value || typeof value !== 'object') {
    return false
  }

  const response = value as Partial<StudySetHistoryResponse>

  return (
    Array.isArray(response.data) &&
    typeof response.count === 'number' &&
    Boolean(response.pagination) &&
    typeof response.pagination?.has_more === 'boolean'
  )
}

export function getCachedStudySetHistory(
  params: FetchStudySetHistoryParams,
) {
  if (!isBrowser()) {
    return null
  }

  try {
    const cacheKey = getHistoryCacheKey(params)

    if (!cacheKey) {
      return null
    }

    const rawEntry = window.sessionStorage.getItem(cacheKey)

    if (!rawEntry) {
      return null
    }

    const entry = JSON.parse(rawEntry) as Partial<StudySetHistoryCacheEntry>
    const isFresh =
      typeof entry.cachedAt === 'number' &&
      Date.now() - entry.cachedAt < STUDY_SET_HISTORY_CACHE_TTL_MS

    if (!isFresh || !isStudySetHistoryResponse(entry.response)) {
      window.sessionStorage.removeItem(cacheKey)
      return null
    }

    return entry.response
  } catch {
    return null
  }
}

export function cacheStudySetHistory(
  params: FetchStudySetHistoryParams,
  response: StudySetHistoryResponse,
) {
  if (!isBrowser()) {
    return
  }

  try {
    const cacheKey = getHistoryCacheKey(params)

    if (!cacheKey) {
      return
    }

    window.sessionStorage.setItem(
      cacheKey,
      JSON.stringify({
        cachedAt: Date.now(),
        response,
      } satisfies StudySetHistoryCacheEntry),
    )
  } catch {
    // Storage can be unavailable or full; the API response is still usable.
  }
}

export function invalidateStudySetHistoryCache() {
  if (!isBrowser()) {
    return
  }

  try {
    const cacheKeys: string[] = []

    for (let index = 0; index < window.sessionStorage.length; index += 1) {
      const key = window.sessionStorage.key(index)

      if (key?.startsWith(STUDY_SET_HISTORY_CACHE_PREFIX)) {
        cacheKeys.push(key)
      }
    }

    cacheKeys.forEach((key) => window.sessionStorage.removeItem(key))
  } catch {
    // Cache invalidation must never make a successful API mutation look failed.
  }
}
