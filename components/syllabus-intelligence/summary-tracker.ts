'use client'

import { ApiClientError } from '@/lib/api/client'
import { fetchSyllabusById, type SyllabusSocketSnapshotEvent, type SyllabusUploadWebsocket } from '@/lib/api'
import { mapSyllabusDetailToResult, type SyllabusIntelligenceResult } from './utils'

type WaitForSyllabusSummaryOptions = {
  syllabusId: string
  websocket: SyllabusUploadWebsocket
  onStageChange?: (stage: SyllabusTrackingStage) => void
}

export type SyllabusTrackingStage =
  | 'connecting'
  | 'processing'
  | 'fetching'
  | 'completed'

const SYLLABUS_SOCKET_TIMEOUT_MS = 5 * 60_000

function appendTokenToWebSocketUrl(url: string, token: string) {
  try {
    const nextUrl = new URL(url)

    if (!nextUrl.searchParams.has('token')) {
      nextUrl.searchParams.set('token', token)
    }

    return nextUrl.toString()
  } catch {
    const separator = url.includes('?') ? '&' : '?'
    return url.includes('token=') ? url : `${url}${separator}token=${encodeURIComponent(token)}`
  }
}

function parseSnapshotEvent(message: unknown): SyllabusSocketSnapshotEvent | null {
  if (!message || typeof message !== 'object') {
    return null
  }

  const event = message as Partial<SyllabusSocketSnapshotEvent> & { processingStatus?: string; job_id?: string; timestamp?: string }

  if (typeof event.type !== 'string' || typeof event.syllabus_id !== 'string') {
    return null
  }

  // Handle both payload-nested format and flat format
  let processingStatus: string | undefined
  let id: string | undefined

  if (event.payload && typeof event.payload === 'object') {
    const payload = event.payload as Partial<SyllabusSocketSnapshotEvent['payload']>
    processingStatus = typeof payload.processingStatus === 'string' ? payload.processingStatus : undefined
    id = typeof payload.id === 'string' ? payload.id : undefined
  } else {
    // Check for flat format (type, syllabus_id, timestamp) — "completed" type signals completion
    processingStatus = event.type === 'completed' ? 'completed' : undefined
  }

  if (!processingStatus) {
    return null
  }

  return {
    type: event.type,
    syllabus_id: event.syllabus_id,
    payload: {
      id: id || event.syllabus_id,
      processingStatus,
    },
  }
}

export function waitForSyllabusSummary({
  syllabusId,
  websocket,
  onStageChange,
}: WaitForSyllabusSummaryOptions) {
  return new Promise<SyllabusIntelligenceResult>((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new ApiClientError('Syllabus tracking is only available in the browser.'))
      return
    }

    if (!websocket.url || !websocket.token) {
      reject(new ApiClientError('Syllabus tracking metadata is missing.'))
      return
    }

    onStageChange?.('connecting')

    const socketUrl = appendTokenToWebSocketUrl(websocket.url, websocket.token)
    let socket: WebSocket | null = null
    let settled = false
    let finalFetchStarted = false

    const cleanup = () => {
      window.clearTimeout(timeoutId)

      if (socket) {
        socket.onopen = null
        socket.onmessage = null
        socket.onerror = null
        socket.onclose = null
        socket.close()
      }
    }

    const settleError = (message: string) => {
      if (settled) {
        return
      }

      settled = true
      cleanup()
      reject(new ApiClientError(message))
    }

    const settleSuccess = (result: SyllabusIntelligenceResult) => {
      if (settled) {
        return
      }

      settled = true
      cleanup()
      resolve(result)
    }

    const timeoutId = window.setTimeout(() => {
      settleError('Syllabus analysis timed out before a final result was received.')
    }, SYLLABUS_SOCKET_TIMEOUT_MS)

    try {
      socket = new window.WebSocket(socketUrl)
    } catch {
      settleError('Unable to start syllabus tracking.')
      return
    }

    socket.onopen = () => {
      onStageChange?.('processing')
    }

    socket.onmessage = async (event) => {
      if (settled || finalFetchStarted) {
        return
      }

      let parsedMessage: unknown = null

      try {
        parsedMessage = JSON.parse(String(event.data))
      } catch {
        return
      }

      const snapshot = parseSnapshotEvent(parsedMessage)

      if (!snapshot || snapshot.syllabus_id !== syllabusId) {
        return
      }

      if (snapshot.payload.processingStatus !== 'completed') {
        onStageChange?.('processing')
        return
      }

      finalFetchStarted = true
      onStageChange?.('fetching')

      try {
        const syllabus = await fetchSyllabusById(snapshot.syllabus_id)
        const normalized = mapSyllabusDetailToResult(syllabus)

        if (!normalized) {
          settleError('Final syllabus content could not be parsed.')
          return
        }

        settleSuccess(normalized)
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Final syllabus content could not be fetched.'
        settleError(message)
      }
    }

    socket.onerror = () => {
      settleError('Live syllabus analysis connection failed.')
    }

    socket.onclose = () => {
      if (!settled && !finalFetchStarted) {
        settleError('Syllabus analysis connection closed before processing completed.')
      }
    }
  })
}
