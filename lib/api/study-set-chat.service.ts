'use client'

import { ApiClientError, apiClient } from '@/lib/api/client'
import type {
  ChatMessage,
  SendChatMessageRequest,
  SendChatMessageResponse,
  StudySetChatConversationResponse,
  StudySetChatSession,
  StudySetChatSessionsResponse,
} from '@/lib/chat/contracts'

const CHAT_REQUEST_TIMEOUT_MS = 60_000

function chatPath(studySetId: string) {
  return `/api/v1/study-sets/${encodeURIComponent(studySetId)}/chat`
}

function chatSessionsPath(studySetId: string) {
  return `${chatPath(studySetId)}/sessions`
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function readString(...values: unknown[]) {
  return values.find(
    (value): value is string =>
      typeof value === 'string' && value.trim().length > 0,
  )
}

function readNumber(...values: unknown[]) {
  return values.find(
    (value): value is number =>
      typeof value === 'number' && Number.isFinite(value),
  )
}

function normalizeChatMessage(
  value: unknown,
  fallbackSerialNumber: number,
): ChatMessage | null {
  const message = asRecord(value)
  if (!message) return null

  const id = readString(message.id, message.message_id, message.messageId)
  const role = readString(message.role)
  const text = readString(message.text, message.content)
  const createdAt = readString(message.created_at, message.createdAt)

  if (
    !id ||
    (role !== 'user' && role !== 'assistant') ||
    !text ||
    !createdAt
  ) {
    return null
  }

  return {
    id,
    serial_number:
      readNumber(message.serial_number, message.serialNumber) ??
      fallbackSerialNumber,
    role,
    text,
    created_at: createdAt,
  }
}

function normalizeRequiredChatMessage(
  value: unknown,
  label: string,
  fallbackSerialNumber: number,
) {
  const message = normalizeChatMessage(value, fallbackSerialNumber)

  if (!message) {
    throw new ApiClientError(
      `Chat response did not include a valid ${label} message.`,
    )
  }

  return message
}

function normalizeSendResponse(payload: unknown): SendChatMessageResponse {
  const envelope = asRecord(payload)
  const data = asRecord(envelope?.data)
  const conversationId = readString(
    data?.conversation_id,
    data?.conversationId,
  )

  if (!data || !conversationId) {
    throw new ApiClientError(
      'Chat response did not include a conversation id.',
    )
  }

  return {
    data: {
      conversation_id: conversationId,
      user_message: normalizeRequiredChatMessage(
        data.user_message ?? data.userMessage,
        'user',
        1,
      ),
      assistant_message: normalizeRequiredChatMessage(
        data.assistant_message ?? data.assistantMessage,
        'assistant',
        2,
      ),
    },
  }
}

function normalizeChatSession(value: unknown): StudySetChatSession | null {
  const session = asRecord(value)
  if (!session) return null

  const id = readString(session.id, session.conversation_id, session.conversationId)
  if (!id) return null

  const createdAt =
    readString(session.createdAt, session.created_at) ??
    new Date(0).toISOString()

  return {
    id,
    contextType:
      readString(
        session.contextType,
        session.context_type,
        session.section_type,
      ) ?? 'study_set',
    contextItemId:
      readString(
        session.contextItemId,
        session.context_item_id,
        session.item_id,
      ) ?? null,
    lastMessageAt:
      readString(session.lastMessageAt, session.last_message_at) ?? createdAt,
    createdAt,
  }
}

function normalizeSessionsResponse(
  payload: unknown,
): StudySetChatSessionsResponse {
  const envelope = asRecord(payload)
  const sessions = envelope?.data

  if (!Array.isArray(sessions)) {
    throw new ApiClientError(
      'Chat sessions response did not include a valid data list.',
    )
  }

  return {
    data: sessions
      .map(normalizeChatSession)
      .filter((session): session is StudySetChatSession => Boolean(session))
      .sort(
        (left, right) =>
          new Date(right.lastMessageAt).getTime() -
          new Date(left.lastMessageAt).getTime(),
      ),
  }
}

function normalizeConversationResponse(
  payload: unknown,
): StudySetChatConversationResponse {
  const envelope = asRecord(payload)
  const data = asRecord(envelope?.data)
  const messages = data?.messages

  if (!data || !Array.isArray(messages)) {
    throw new ApiClientError(
      'Chat conversation response did not include a valid message list.',
    )
  }

  return {
    data: {
      session: asRecord(data.session) ?? {},
      messages: messages
        .map((message, index) => normalizeChatMessage(message, index + 1))
        .filter((message): message is ChatMessage => Boolean(message)),
    },
  }
}

export async function sendStudySetChatMessage(
  studySetId: string,
  payload: SendChatMessageRequest,
  signal?: AbortSignal,
) {
  const response = await apiClient.request<unknown>(chatPath(studySetId), {
    method: 'POST',
    body: payload,
    signal,
    timeoutMs: CHAT_REQUEST_TIMEOUT_MS,
  })

  return normalizeSendResponse(response)
}

export async function fetchStudySetChatSessions(
  studySetId: string,
  signal?: AbortSignal,
) {
  const response = await apiClient.request<unknown>(
    chatSessionsPath(studySetId),
    {
      method: 'GET',
      signal,
    },
  )

  return normalizeSessionsResponse(response)
}

export async function fetchStudySetChatConversation(
  studySetId: string,
  conversationId: string,
  signal?: AbortSignal,
) {
  const response = await apiClient.request<unknown>(
    `${chatSessionsPath(studySetId)}/${encodeURIComponent(conversationId)}`,
    {
      method: 'GET',
      signal,
    },
  )

  return normalizeConversationResponse(response)
}

export function isChatConversationNotFound(error: unknown) {
  return error instanceof ApiClientError && error.status === 404
}
