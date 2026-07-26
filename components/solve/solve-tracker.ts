'use client'

import { getApiClientErrorMessage } from '@/lib/api/client'
import { toast } from '@/hooks/use-toast'
import {
  fetchSolveSession,
  type SolveSessionDetail,
  type SolveWebsocket,
} from '@/lib/api/solve.service'

type SolveTrackingListener = (detail: SolveSessionDetail) => void

export type SolveTrackingOptions = {
  sessionId: string
  pendingMessageId: string
  websocket?: SolveWebsocket | null
}

const POLL_INTERVAL_MS = 3_000
const POLL_DURATION_MS = 3 * 60_000
const MAX_CONSECUTIVE_FETCH_FAILURES = 3
const WS_LOG_PREFIX = '[solve-ws]'

function logWebSocketEvent(message: string, details?: Record<string, unknown>) {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
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

class SolveMessageTracker {
  private readonly sessionId: string
  private readonly pendingMessageId: string
  private readonly websocket: SolveWebsocket | null
  private readonly listeners = new Set<SolveTrackingListener>()
  private socket: WebSocket | null = null
  private pollTimer: ReturnType<typeof setTimeout> | null = null
  private pollStartedAt: number | null = null
  private inflightFetch = false
  private hasStarted = false
  private finished = false
  private consecutiveFetchFailures = 0

  constructor(options: SolveTrackingOptions) {
    this.sessionId = options.sessionId
    this.pendingMessageId = options.pendingMessageId
    this.websocket = options.websocket ?? null
  }

  subscribe(listener: SolveTrackingListener) {
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

  private emit(detail: SolveSessionDetail) {
    for (const listener of this.listeners) {
      listener(detail)
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

    trackerRegistry.delete(this.registryKey())
  }

  private registryKey() {
    return `${this.sessionId}:${this.pendingMessageId}`
  }

  private openWebSocket() {
    if (typeof window === 'undefined' || this.socket || !this.websocket?.url || !this.websocket.token) {
      logWebSocketEvent('websocket metadata missing, switching to polling', {
        sessionId: this.sessionId,
        pendingMessageId: this.pendingMessageId,
      })
      this.startPolling()
      return
    }

    try {
      const webSocketUrl = appendTokenToWebSocketUrl(this.websocket.url, this.websocket.token)
      logWebSocketEvent('connecting', { sessionId: this.sessionId, websocketUrl: webSocketUrl })

      const socket = new window.WebSocket(webSocketUrl)
      this.socket = socket

      socket.onopen = () => {
        logWebSocketEvent('connected', { sessionId: this.sessionId })
      }

      socket.onmessage = (event) => {
        logWebSocketEvent('message received', { sessionId: this.sessionId, payload: event.data })
        void this.refreshSession()
      }

      socket.onerror = () => {
        logWebSocketEvent('connection error', { sessionId: this.sessionId })
      }

      socket.onclose = () => {
        logWebSocketEvent('connection closed', { sessionId: this.sessionId })
        this.socket = null
        if (!this.finished) {
          this.startPolling()
        }
      }
    } catch {
      logWebSocketEvent('connection setup failed, switching to polling', { sessionId: this.sessionId })
      this.startPolling()
    }
  }

  private async refreshSession() {
    if (this.finished || this.inflightFetch) {
      return
    }

    this.inflightFetch = true

    try {
      const detail = await fetchSolveSession(this.sessionId)
      this.consecutiveFetchFailures = 0
      this.emit(detail)

      const pendingMessage = detail.messages.find((message) => message.id === this.pendingMessageId)

      if (!pendingMessage || pendingMessage.status !== 'pending') {
        logWebSocketEvent('pending message reached a terminal status', {
          sessionId: this.sessionId,
          pendingMessageId: this.pendingMessageId,
          status: pendingMessage?.status,
        })
        this.finish()
      }
    } catch (error) {
      this.consecutiveFetchFailures += 1
      const message = getApiClientErrorMessage(error, 'Failed to fetch the solve result.')
      logWebSocketEvent('failed to fetch solve session', {
        sessionId: this.sessionId,
        attempt: this.consecutiveFetchFailures,
        error: message,
      })

      if (this.consecutiveFetchFailures >= MAX_CONSECUTIVE_FETCH_FAILURES) {
        toast({
          title: 'Solve status unavailable',
          description: `${message} Reopen this page to check the result again.`,
          variant: 'destructive',
        })
        this.finish()
      }
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
      sessionId: this.sessionId,
      intervalMs: POLL_INTERVAL_MS,
    })

    const runPoll = async () => {
      await this.refreshSession()

      if (this.finished) {
        return
      }

      if (this.pollStartedAt && Date.now() - this.pollStartedAt >= POLL_DURATION_MS) {
        logWebSocketEvent('polling fallback stopped after timeout', { sessionId: this.sessionId })
        toast({
          title: 'Solving is taking longer than expected',
          description: 'We stopped checking automatically. Reopen this page later to see the result.',
        })
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

const trackerRegistry = new Map<string, SolveMessageTracker>()

export function subscribeToSolveSession(options: SolveTrackingOptions, listener: SolveTrackingListener) {
  const key = `${options.sessionId}:${options.pendingMessageId}`
  let tracker = trackerRegistry.get(key)

  if (!tracker) {
    tracker = new SolveMessageTracker(options)
    trackerRegistry.set(key, tracker)
  }

  return tracker.subscribe(listener)
}
