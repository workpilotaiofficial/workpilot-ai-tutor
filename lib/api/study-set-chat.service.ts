'use client'

import { ApiClientError, apiClient } from '@/lib/api/client'
import type {
  ChatHistoryResponse,
  SendChatMessageRequest,
  SendChatMessageResponse,
} from '@/lib/chat/contracts'

const CHAT_API_BASE_URL = (
  process.env.NEXT_PUBLIC_CHAT_API_BASE_URL ?? ''
).replace(/\/+$/, '')
const CHAT_REQUEST_TIMEOUT_MS = 60_000

function chatMessagesPath(studySetId: string) {
  return `/api/v1/study-sets/${encodeURIComponent(studySetId)}/chat/messages`
}

function getResponseErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object') return fallback

  if (
    'error' in payload &&
    payload.error &&
    typeof payload.error === 'object' &&
    'message' in payload.error &&
    typeof payload.error.message === 'string'
  ) {
    return payload.error.message
  }

  if ('message' in payload && typeof payload.message === 'string') {
    return payload.message
  }

  return fallback
}

async function requestChatApi<TResponse>(
  path: string,
  options: {
    method?: 'GET' | 'POST'
    body?: unknown
    headers?: HeadersInit
    signal?: AbortSignal
  } = {},
) {
  const accessToken = await apiClient.ensureValidAccessToken()
  if (!accessToken) {
    throw new ApiClientError(
      'Your session has expired. Please sign in again.',
      401,
    )
  }

  const timeoutController = new AbortController()
  const timeout = window.setTimeout(
    () => timeoutController.abort(),
    CHAT_REQUEST_TIMEOUT_MS,
  )
  const abortFromCaller = () => timeoutController.abort()
  options.signal?.addEventListener('abort', abortFromCaller, { once: true })

  try {
    const headers = new Headers(options.headers)
    headers.set('accept', 'application/json')
    headers.set('authorization', `Bearer ${accessToken}`)

    let body: BodyInit | undefined
    if (typeof options.body !== 'undefined') {
      headers.set('content-type', 'application/json')
      body = JSON.stringify(options.body)
    }

    const response = await fetch(`${CHAT_API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body,
      signal: timeoutController.signal,
      credentials: 'same-origin',
    })
    const responseText = await response.text()
    let payload: unknown = null

    if (responseText) {
      try {
        payload = JSON.parse(responseText)
      } catch {
        payload = responseText
      }
    }

    if (!response.ok) {
      throw new ApiClientError(
        getResponseErrorMessage(
          payload,
          `Chat request failed (${response.status}).`,
        ),
        response.status,
        payload,
      )
    }

    return payload as TResponse
  } catch (error) {
    if (error instanceof ApiClientError) throw error

    if (
      error instanceof DOMException &&
      error.name === 'AbortError'
    ) {
      throw new ApiClientError(
        'The chat request took too long. Please try again.',
        408,
      )
    }

    throw new ApiClientError(
      'Could not connect to chat. Please check your connection and try again.',
      0,
    )
  } finally {
    window.clearTimeout(timeout)
    options.signal?.removeEventListener('abort', abortFromCaller)
  }
}

export function sendStudySetChatMessage(
  studySetId: string,
  payload: SendChatMessageRequest,
  signal?: AbortSignal,
) {
  return requestChatApi<SendChatMessageResponse>(
    chatMessagesPath(studySetId),
    {
      method: 'POST',
      body: payload,
      headers: {
        'idempotency-key': payload.client_message_id,
      },
      signal,
    },
  )
}

export function fetchStudySetChatHistory(
  studySetId: string,
  conversationId: string,
  signal?: AbortSignal,
) {
  const searchParams = new URLSearchParams({
    conversation_id: conversationId,
    limit: '100',
  })

  return requestChatApi<ChatHistoryResponse>(
    `${chatMessagesPath(studySetId)}?${searchParams.toString()}`,
    { signal },
  )
}

export function isChatConversationNotFound(error: unknown) {
  if (!(error instanceof ApiClientError) || error.status !== 404) {
    return false
  }

  const data = error.data
  return Boolean(
    data &&
    typeof data === 'object' &&
    'error' in data &&
    data.error &&
    typeof data.error === 'object' &&
    'code' in data.error &&
    data.error.code === 'CONVERSATION_NOT_FOUND',
  )
}
