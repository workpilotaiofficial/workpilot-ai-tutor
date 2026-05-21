'use client'

import { getApiClientErrorMessage } from '@/lib/api/client'
import {
  fetchCompletedStudySetOutput,
  fetchStudySetGenerationBatchStatus,
  type StudySetBatchStatusJob,
  type StudySetBatchStatusResponse,
  type StudySetGenerationSocketEvent,
} from '@/lib/api/study-sets.service'
import {
  getStudySetGenerationMeta,
  saveStudySetGenerationMeta,
  updateStudySetGenerationMeta,
  type StoredStudySetGenerationJob,
  type StoredStudySetGenerationMeta,
} from '@/lib/api/study-sets.storage'
import { normalizeBackendTaskType, toUiSectionType } from './generation-mapping'
import { mergeGeneratedOutputIntoStudySet } from './generated-output'

type GenerationListener = (meta: StoredStudySetGenerationMeta) => void

const POLL_INTERVAL_MS = 30_000
const POLL_DURATION_MS = 10 * 60_000
const WS_LOG_PREFIX = '[study-set-ws]'

function logWebSocketEvent(message: string, details?: Record<string, unknown>) {
  if (typeof window === 'undefined') {
    return
  }

  if (details) {
    console.log(WS_LOG_PREFIX, message, details)
    return
  }

  console.log(WS_LOG_PREFIX, message)
}

function appendTokenToWebSocketUrl(url: string, token: string) {
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}token=${encodeURIComponent(token)}`
}

function isBatchDone(meta: StoredStudySetGenerationMeta) {
  return meta.batch.status === 'completed' || meta.jobs.every((job) => job.status === 'completed' || job.status === 'failed')
}

function normalizeTrackedJob(job: Partial<StoredStudySetGenerationJob> & { jobId: string; type: string; status: string }) {
  return {
    jobId: job.jobId,
    type: job.type,
    status: job.status,
    estimatedCredits: typeof job.estimatedCredits === 'number' ? job.estimatedCredits : 0,
    outputId: typeof job.outputId === 'string' ? job.outputId : null,
    error: typeof job.error === 'string' ? job.error : null,
    startedAt: typeof job.startedAt === 'string' ? job.startedAt : null,
    completedAt: typeof job.completedAt === 'string' ? job.completedAt : null,
  } satisfies StoredStudySetGenerationJob
}

function mapBatchStatusJob(job: StudySetBatchStatusJob): StoredStudySetGenerationJob | null {
  const jobId = typeof job.job_id === 'string' ? job.job_id : typeof job.jobId === 'string' ? job.jobId : ''
  const type =
    typeof job.type === 'string'
      ? job.type
      : typeof job.task_type === 'string'
        ? job.task_type
        : ''
  const status = typeof job.status === 'string' ? job.status : ''

  if (!jobId || !type || !status) {
    return null
  }

  return normalizeTrackedJob({
    jobId,
    type,
    status,
    estimatedCredits:
      typeof job.estimated_credits === 'number'
        ? job.estimated_credits
        : typeof job.estimatedCredits === 'number'
          ? job.estimatedCredits
          : 0,
    outputId:
      typeof job.output_id === 'string'
        ? job.output_id
        : typeof job.outputId === 'string'
          ? job.outputId
          : null,
    error: typeof job.error === 'string' ? job.error : null,
  })
}

class StudySetGenerationTracker {
  private meta: StoredStudySetGenerationMeta
  private readonly listeners = new Set<GenerationListener>()
  private readonly inflightFetches = new Set<string>()
  private socket: WebSocket | null = null
  private pollTimer: ReturnType<typeof setTimeout> | null = null
  private pollStartedAt: number | null = null
  private hasStarted = false

  constructor(meta: StoredStudySetGenerationMeta) {
    this.meta = meta
  }

  subscribe(listener: GenerationListener) {
    this.listeners.add(listener)
    listener(this.meta)
    this.ensureStarted()

    return () => {
      this.listeners.delete(listener)
    }
  }

  ensureStarted() {
    if (this.hasStarted || typeof window === 'undefined') {
      return
    }

    this.hasStarted = true

    if (isBatchDone(this.meta)) {
      logWebSocketEvent('batch already completed, tracker will not reconnect', {
        documentId: this.meta.documentId,
        studySetId: this.meta.studySetId,
        batchId: this.meta.batch.id,
      })
      return
    }

    logWebSocketEvent('starting realtime tracking', {
      documentId: this.meta.documentId,
      studySetId: this.meta.studySetId,
      batchId: this.meta.batch.id,
      websocketUrl: this.meta.websocket.url,
    })
    this.openWebSocket()
  }

  private emit() {
    for (const listener of this.listeners) {
      listener(this.meta)
    }
  }

  private syncMeta(updater: (current: StoredStudySetGenerationMeta) => StoredStudySetGenerationMeta) {
    const updatedMeta = updateStudySetGenerationMeta(this.meta.documentId, updater)

    if (updatedMeta) {
      this.meta = updatedMeta
    } else {
      this.meta = updater(this.meta)
      saveStudySetGenerationMeta(this.meta)
    }

    this.emit()
    return this.meta
  }

  private updateJob(jobId: string, updater: (job: StoredStudySetGenerationJob) => StoredStudySetGenerationJob) {
    this.syncMeta((current) => {
      const jobs = current.jobs.map((job) => (job.jobId === jobId ? updater(job) : job))
      return {
        ...current,
        jobs,
        lastEventAt: new Date().toISOString(),
      }
    })
  }

  private upsertJobs(nextJobs: StoredStudySetGenerationJob[]) {
    this.syncMeta((current) => {
      const jobMap = new Map(current.jobs.map((job) => [job.jobId, job]))

      for (const nextJob of nextJobs) {
        const currentJob = jobMap.get(nextJob.jobId)
        jobMap.set(
          nextJob.jobId,
          currentJob
            ? normalizeTrackedJob({
                ...currentJob,
                ...nextJob,
                outputId: nextJob.outputId ?? currentJob.outputId,
                error: nextJob.error ?? currentJob.error,
                startedAt: nextJob.startedAt ?? currentJob.startedAt,
                completedAt: nextJob.completedAt ?? currentJob.completedAt,
              })
            : normalizeTrackedJob(nextJob)
        )
      }

      return {
        ...current,
        jobs: Array.from(jobMap.values()),
        lastEventAt: new Date().toISOString(),
      }
    })
  }

  private openWebSocket() {
    if (typeof window === 'undefined' || this.socket || !this.meta.websocket.url || !this.meta.websocket.token) {
      logWebSocketEvent('websocket metadata missing, switching to polling', {
        documentId: this.meta.documentId,
        studySetId: this.meta.studySetId,
        batchId: this.meta.batch.id,
      })
      this.startPolling()
      return
    }

    try {
      const webSocketUrl = appendTokenToWebSocketUrl(this.meta.websocket.url, this.meta.websocket.token)
      logWebSocketEvent('connecting', {
        documentId: this.meta.documentId,
        studySetId: this.meta.studySetId,
        batchId: this.meta.batch.id,
        websocketUrl: webSocketUrl,
      })

      this.syncMeta((current) => ({
        ...current,
        connectionStatus: 'connecting',
      }))

      const socket = new window.WebSocket(webSocketUrl)
      this.socket = socket

      socket.onopen = () => {
        logWebSocketEvent('connected', {
          documentId: this.meta.documentId,
          studySetId: this.meta.studySetId,
          batchId: this.meta.batch.id,
        })
      }

      socket.onmessage = (event) => {
        logWebSocketEvent('message received', {
          documentId: this.meta.documentId,
          studySetId: this.meta.studySetId,
          batchId: this.meta.batch.id,
          payload: event.data,
        })
        void this.handleSocketMessage(event.data)
      }

      socket.onerror = () => {
        logWebSocketEvent('connection error', {
          documentId: this.meta.documentId,
          studySetId: this.meta.studySetId,
          batchId: this.meta.batch.id,
        })
        this.syncMeta((current) => ({
          ...current,
          connectionStatus: 'error',
        }))
      }

      socket.onclose = () => {
        logWebSocketEvent('connection closed', {
          documentId: this.meta.documentId,
          studySetId: this.meta.studySetId,
          batchId: this.meta.batch.id,
          batchStatus: this.meta.batch.status,
        })
        this.socket = null
        if (!isBatchDone(this.meta)) {
          logWebSocketEvent('batch still active, switching to polling fallback', {
            documentId: this.meta.documentId,
            studySetId: this.meta.studySetId,
            batchId: this.meta.batch.id,
          })
          this.startPolling()
        } else {
          this.syncMeta((current) => ({
            ...current,
            connectionStatus: 'completed',
          }))
        }
      }
    } catch {
      logWebSocketEvent('connection setup failed, switching to polling', {
        documentId: this.meta.documentId,
        studySetId: this.meta.studySetId,
        batchId: this.meta.batch.id,
      })
      this.startPolling()
    }
  }

  private async handleSocketMessage(rawMessage: string) {
    let parsedMessage: StudySetGenerationSocketEvent | null = null

    try {
      const candidate = JSON.parse(rawMessage) as StudySetGenerationSocketEvent
      if (candidate && typeof candidate === 'object' && typeof candidate.type === 'string') {
        parsedMessage = candidate
      }
    } catch {
      parsedMessage = null
    }

    if (!parsedMessage) {
      logWebSocketEvent('ignored invalid websocket payload', {
        documentId: this.meta.documentId,
        studySetId: this.meta.studySetId,
        batchId: this.meta.batch.id,
        rawMessage,
      })
      return
    }

    const timestamp =
      'timestamp' in parsedMessage && typeof parsedMessage.timestamp === 'string'
        ? parsedMessage.timestamp
        : 'subscribed_at' in parsedMessage && typeof parsedMessage.subscribed_at === 'string'
          ? parsedMessage.subscribed_at
          : new Date().toISOString()

    switch (parsedMessage.type) {
      case 'connected':
        logWebSocketEvent('subscription confirmed', {
          documentId: this.meta.documentId,
          studySetId: this.meta.studySetId,
          batchId: parsedMessage.batch_id,
          subscribedAt: parsedMessage.subscribed_at,
        })
        this.syncMeta((current) => ({
          ...current,
          connectionStatus: 'connected',
          lastEventAt: timestamp,
        }))
        break
      case 'job_started':
        logWebSocketEvent('job started', {
          documentId: this.meta.documentId,
          studySetId: this.meta.studySetId,
          batchId: this.meta.batch.id,
          jobId: parsedMessage.job_id,
          taskType: parsedMessage.task_type,
        })
        this.updateJob(parsedMessage.job_id, (job) =>
          normalizeTrackedJob({
            ...job,
            type: parsedMessage.task_type,
            status: 'pending',
            startedAt: timestamp,
          })
        )
        break
      case 'job_completed':
        logWebSocketEvent('job completed', {
          documentId: this.meta.documentId,
          studySetId: this.meta.studySetId,
          batchId: this.meta.batch.id,
          jobId: parsedMessage.job_id,
          taskType: parsedMessage.task_type,
          outputId: parsedMessage.output_id ?? null,
        })
        this.updateJob(parsedMessage.job_id, (job) =>
          normalizeTrackedJob({
            ...job,
            type: parsedMessage.task_type,
            status: 'completed',
            outputId: parsedMessage.output_id ?? null,
            completedAt: timestamp,
          })
        )
        await this.fetchOutputForJob(parsedMessage.job_id, parsedMessage.task_type)
        break
      case 'job_failed':
        logWebSocketEvent('job failed', {
          documentId: this.meta.documentId,
          studySetId: this.meta.studySetId,
          batchId: this.meta.batch.id,
          jobId: parsedMessage.job_id,
          taskType: parsedMessage.task_type,
          error: parsedMessage.error ?? null,
        })
        this.updateJob(parsedMessage.job_id, (job) =>
          normalizeTrackedJob({
            ...job,
            type: parsedMessage.task_type,
            status: 'failed',
            error: parsedMessage.error ?? 'Job failed',
            completedAt: timestamp,
          })
        )
        break
      case 'batch_completed':
        logWebSocketEvent('batch completed', {
          documentId: this.meta.documentId,
          studySetId: this.meta.studySetId,
          batchId: parsedMessage.batch_id,
          totalJobs: parsedMessage.total_jobs,
          completedJobs: parsedMessage.completed_jobs,
          failedJobs: parsedMessage.failed_jobs,
        })
        this.syncMeta((current) => ({
          ...current,
          batch: {
            ...current.batch,
            status: 'completed',
            totalJobs: parsedMessage.total_jobs,
            completedJobs: parsedMessage.completed_jobs,
            failedJobs: parsedMessage.failed_jobs,
          },
          connectionStatus: 'completed',
          lastEventAt: timestamp,
          completedAt: timestamp,
        }))
        if (this.socket) {
          this.socket.close()
          this.socket = null
        }
        await this.pollOnce()
        break
      default:
        break
    }
  }

  private async fetchOutputForJob(jobId: string, rawTaskType: string) {
    const taskType = normalizeBackendTaskType(rawTaskType)
    const targetStudySetId =
      typeof this.meta.studySetId === 'string' && this.meta.studySetId.trim()
        ? this.meta.studySetId
        : jobId

    if (!taskType || taskType === 'content' || this.inflightFetches.has(jobId)) {
      if (!taskType || taskType === 'content') {
        logWebSocketEvent('skipping output fetch for unsupported task type', {
          documentId: this.meta.documentId,
          studySetId: this.meta.studySetId,
          batchId: this.meta.batch.id,
          jobId,
          taskType: rawTaskType,
        })
      }
      return
    }

    const alreadyFetched = Boolean(this.meta.fetchedOutputs[jobId]?.fetched)
    if (alreadyFetched) {
      return
    }

    this.inflightFetches.add(jobId)
    logWebSocketEvent('fetching completed output', {
      documentId: this.meta.documentId,
      studySetId: this.meta.studySetId,
      targetStudySetId,
      batchId: this.meta.batch.id,
      jobId,
      taskType,
    })

    try {
      const outputPayload = await fetchCompletedStudySetOutput(targetStudySetId, taskType)
      mergeGeneratedOutputIntoStudySet(this.meta.documentId, taskType, outputPayload)
      const sectionType = toUiSectionType(taskType)
      logWebSocketEvent('completed output saved locally', {
        documentId: this.meta.documentId,
        studySetId: this.meta.studySetId,
        batchId: this.meta.batch.id,
        jobId,
        taskType,
      })

      this.syncMeta((current) => ({
        ...current,
        fetchedOutputs: {
          ...current.fetchedOutputs,
          [jobId]: {
            fetched: true,
            fetchedAt: new Date().toISOString(),
            taskType,
            sectionType: sectionType ?? undefined,
          },
        },
      }))
    } catch (error) {
      const message = getApiClientErrorMessage(error, 'Failed to fetch generated output.')
      logWebSocketEvent('completed output fetch failed', {
        documentId: this.meta.documentId,
        studySetId: this.meta.studySetId,
        batchId: this.meta.batch.id,
        jobId,
        taskType,
        error: message,
      })
      this.syncMeta((current) => ({
        ...current,
        fetchedOutputs: {
          ...current.fetchedOutputs,
          [jobId]: {
            fetched: false,
            taskType,
            sectionType: toUiSectionType(taskType) ?? undefined,
            error: message,
          },
        },
      }))
    } finally {
      this.inflightFetches.delete(jobId)
    }
  }

  private startPolling() {
    if (this.pollTimer || isBatchDone(this.meta) || typeof window === 'undefined') {
      return
    }

    if (!this.pollStartedAt) {
      this.pollStartedAt = Date.now()
    }

    this.syncMeta((current) => ({
      ...current,
      connectionStatus: 'polling',
    }))
    logWebSocketEvent('polling fallback started', {
      documentId: this.meta.documentId,
      studySetId: this.meta.studySetId,
      batchId: this.meta.batch.id,
      intervalMs: POLL_INTERVAL_MS,
    })

    const runPoll = async () => {
      await this.pollOnce()

      if (isBatchDone(this.meta)) {
        return
      }

      if (this.pollStartedAt && Date.now() - this.pollStartedAt >= POLL_DURATION_MS) {
        logWebSocketEvent('polling fallback stopped after timeout', {
          documentId: this.meta.documentId,
          studySetId: this.meta.studySetId,
          batchId: this.meta.batch.id,
        })
        this.syncMeta((current) => ({
          ...current,
          connectionStatus: 'closed',
        }))
        return
      }

      this.pollTimer = setTimeout(() => {
        this.pollTimer = null
        void runPoll()
      }, POLL_INTERVAL_MS)
    }

    void runPoll()
  }

  private async pollOnce() {
    try {
      logWebSocketEvent('refreshing batch status via polling', {
        documentId: this.meta.documentId,
        studySetId: this.meta.studySetId,
        batchId: this.meta.batch.id,
      })
      const batchSnapshot = await fetchStudySetGenerationBatchStatus(this.meta.batch.id)
      this.reconcileBatchSnapshot(batchSnapshot)

      const completedJobs = this.meta.jobs.filter((job) => job.status === 'completed')
      await Promise.all(completedJobs.map((job) => this.fetchOutputForJob(job.jobId, job.type)))

      if (isBatchDone(this.meta)) {
        if (this.pollTimer) {
          clearTimeout(this.pollTimer)
          this.pollTimer = null
        }
        logWebSocketEvent('polling detected completed batch', {
          documentId: this.meta.documentId,
          studySetId: this.meta.studySetId,
          batchId: this.meta.batch.id,
        })

        this.syncMeta((current) => ({
          ...current,
          connectionStatus: 'completed',
          completedAt: current.completedAt ?? new Date().toISOString(),
        }))
      }
    } catch (error) {
      logWebSocketEvent('batch polling failed', {
        documentId: this.meta.documentId,
        studySetId: this.meta.studySetId,
        batchId: this.meta.batch.id,
        error: getApiClientErrorMessage(error, 'Failed to refresh batch status.'),
      })
      this.syncMeta((current) => ({
        ...current,
        connectionStatus: 'error',
        lastEventAt: new Date().toISOString(),
        batch: {
          ...current.batch,
          lastError: getApiClientErrorMessage(error, 'Failed to refresh batch status.'),
        },
      }))
    }
  }

  private reconcileBatchSnapshot(snapshot: StudySetBatchStatusResponse) {
    const mappedJobs = Array.isArray(snapshot.jobs)
      ? snapshot.jobs.map(mapBatchStatusJob).filter((job): job is StoredStudySetGenerationJob => Boolean(job))
      : []

    this.upsertJobs(mappedJobs)

    this.syncMeta((current) => ({
      ...current,
      batch: {
        ...current.batch,
        id: snapshot.batch.id,
        status: snapshot.batch.status,
        totalJobs: snapshot.batch.total_jobs,
        completedJobs: snapshot.batch.completed_jobs,
        failedJobs: snapshot.batch.failed_jobs,
      },
      lastEventAt: new Date().toISOString(),
    }))
  }
}
//co

const trackerRegistry = new Map<string, StudySetGenerationTracker>()

export function ensureStudySetGenerationTracking(documentId: string) {
  const existingTracker = trackerRegistry.get(documentId)
  if (existingTracker) {
    existingTracker.ensureStarted()
    return existingTracker
  }

  const storedMeta = getStudySetGenerationMeta(documentId)
  if (!storedMeta) {
    return null
  }

  const tracker = new StudySetGenerationTracker(storedMeta)
  trackerRegistry.set(documentId, tracker)
  tracker.ensureStarted()
  return tracker
}

export function subscribeToStudySetGeneration(
  documentId: string,
  listener: (meta: StoredStudySetGenerationMeta) => void
) {
  const tracker = ensureStudySetGenerationTracking(documentId)

  if (!tracker) {
    return () => undefined
  }

  return tracker.subscribe(listener)
}
