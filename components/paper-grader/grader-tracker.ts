'use client'

import { getApiClientErrorMessage } from '@/lib/api/client'
import {
  fetchGraderResult,
  type GraderResultResponse,
  type GraderWebsocket,
} from '@/lib/api/paper-grader.service'

type GraderTrackingListener = (result: GraderResultResponse) => void

export type GraderTrackingOptions = {
  submissionId: string
  websocket?: GraderWebsocket | null
}

const POLL_INTERVAL_MS = 5_000
const POLL_DURATION_MS = 5 * 60_000
const WS_LOG_PREFIX = '[grader-ws]'

const TERMINAL_STATUSES = new Set(['completed', 'graded', 'done', 'failed', 'error', 'cancelled'])

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

function isTerminalStatus(status: string) {
  return TERMINAL_STATUSES.has(status.trim().toLowerCase())
}

class GraderSubmissionTracker {
  private readonly submissionId: string
  private readonly websocket: GraderWebsocket | null
  private readonly listeners = new Set<GraderTrackingListener>()
  private socket: WebSocket | null = null
  private pollTimer: ReturnType<typeof setTimeout> | null = null
  private pollStartedAt: number | null = null
  private inflightFetch = false
  private hasStarted = false
  private finished = false

  constructor(options: GraderTrackingOptions) {
    this.submissionId = options.submissionId
    this.websocket = options.websocket ?? null
  }

  subscribe(listener: GraderTrackingListener) {
    this.listeners.add(listener)
    this.ensureStarted()

    return () => {
      this.listeners.delete(listener)
    }
  }

  ensureStarted() {
    if (this.hasStarted || this.finished || typeof window === 'undefined') {
      return
    }

    this.hasStarted = true
    this.openWebSocket()
  }

  private emit(result: GraderResultResponse) {
    for (const listener of this.listeners) {
      listener(result)
    }
  }

  private finish() {
    this.finished = true

    if (this.socket) {
      this.socket.close()
      this.socket = null
    }

    if (this.pollTimer) {
      clearTimeout(this.pollTimer)
      this.pollTimer = null
    }

    trackerRegistry.delete(this.submissionId)
  }

  private openWebSocket() {
    if (typeof window === 'undefined' || this.socket || !this.websocket?.url || !this.websocket.token) {
      logWebSocketEvent('websocket metadata missing, switching to polling', {
        submissionId: this.submissionId,
      })
      this.startPolling()
      return
    }

    try {
      const webSocketUrl = appendTokenToWebSocketUrl(this.websocket.url, this.websocket.token)
      logWebSocketEvent('connecting', { submissionId: this.submissionId, websocketUrl: webSocketUrl })

      const socket = new window.WebSocket(webSocketUrl)
      this.socket = socket

      socket.onopen = () => {
        logWebSocketEvent('connected', { submissionId: this.submissionId })
      }

      socket.onmessage = (event) => {
        logWebSocketEvent('message received', { submissionId: this.submissionId, payload: event.data })
        void this.refreshResult()
      }

      socket.onerror = () => {
        logWebSocketEvent('connection error', { submissionId: this.submissionId })
      }

      socket.onclose = () => {
        logWebSocketEvent('connection closed', { submissionId: this.submissionId })
        this.socket = null
        if (!this.finished) {
          this.startPolling()
        }
      }
    } catch {
      logWebSocketEvent('connection setup failed, switching to polling', { submissionId: this.submissionId })
      this.startPolling()
    }
  }

  private async refreshResult() {
    if (this.finished || this.inflightFetch) {
      return
    }

    this.inflightFetch = true

    try {
      const result = await fetchGraderResult(this.submissionId)
      this.emit(result)

      if (isTerminalStatus(result.submission.status)) {
        logWebSocketEvent('submission reached terminal status', {
          submissionId: this.submissionId,
          status: result.submission.status,
        })
        this.finish()
      }
    } catch (error) {
      logWebSocketEvent('failed to fetch grader result', {
        submissionId: this.submissionId,
        error: getApiClientErrorMessage(error, 'Failed to fetch grading result.'),
      })
    } finally {
      this.inflightFetch = false
    }
  }

  private startPolling() {
    if (this.pollTimer || this.finished || typeof window === 'undefined') {
      return
    }

    if (!this.pollStartedAt) {
      this.pollStartedAt = Date.now()
    }

    logWebSocketEvent('polling fallback started', {
      submissionId: this.submissionId,
      intervalMs: POLL_INTERVAL_MS,
    })

    const runPoll = async () => {
      await this.refreshResult()

      if (this.finished) {
        return
      }

      if (this.pollStartedAt && Date.now() - this.pollStartedAt >= POLL_DURATION_MS) {
        logWebSocketEvent('polling fallback stopped after timeout', { submissionId: this.submissionId })
        return
      }

      this.pollTimer = setTimeout(() => {
        this.pollTimer = null
        void runPoll()
      }, POLL_INTERVAL_MS)
    }

    void runPoll()
  }
}

const trackerRegistry = new Map<string, GraderSubmissionTracker>()

export function subscribeToGraderSubmission(
  options: GraderTrackingOptions,
  listener: GraderTrackingListener
) {
  let tracker = trackerRegistry.get(options.submissionId)

  if (!tracker) {
    tracker = new GraderSubmissionTracker(options)
    trackerRegistry.set(options.submissionId, tracker)
  }

  return tracker.subscribe(listener)
}
