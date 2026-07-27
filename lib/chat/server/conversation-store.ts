import { createHash, randomUUID } from 'node:crypto'
import type {
  ChatMessage,
  SendChatMessageResponse,
} from '@/lib/chat/contracts'

const CONVERSATION_TTL_MS = 24 * 60 * 60 * 1000
const RATE_LIMIT_WINDOW_MS = 60 * 1000
const RATE_LIMIT_MAX_REQUESTS = 20

export type ChatConversation = {
  id: string
  ownerKey: string
  studySetId: string
  latestGeminiInteractionId: string | null
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}

type RateLimitEntry = {
  count: number
  resetAt: number
}

type ChatStore = {
  conversations: Map<string, ChatConversation>
  idempotentResponses: Map<string, {
    response: SendChatMessageResponse
    expiresAt: number
  }>
  rateLimits: Map<string, RateLimitEntry>
}

const globalChatStore = globalThis as typeof globalThis & {
  __neurovaChatStore?: ChatStore
}

function getStore(): ChatStore {
  if (!globalChatStore.__neurovaChatStore) {
    globalChatStore.__neurovaChatStore = {
      conversations: new Map(),
      idempotentResponses: new Map(),
      rateLimits: new Map(),
    }
  }

  return globalChatStore.__neurovaChatStore
}

function cleanupExpiredEntries(now = Date.now()) {
  const store = getStore()

  for (const [id, conversation] of store.conversations) {
    if (now - conversation.updatedAt > CONVERSATION_TTL_MS) {
      store.conversations.delete(id)
    }
  }

  for (const [key, entry] of store.idempotentResponses) {
    if (entry.expiresAt <= now) {
      store.idempotentResponses.delete(key)
    }
  }

  for (const [key, entry] of store.rateLimits) {
    if (entry.resetAt <= now) {
      store.rateLimits.delete(key)
    }
  }
}

function decodeJwtSubject(authorization: string): string | null {
  const token = authorization.replace(/^Bearer\s+/i, '').trim()
  const parts = token.split('.')
  if (parts.length !== 3) return null

  try {
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf8'),
    ) as Record<string, unknown>
    const subject = payload.sub ?? payload.user_id ?? payload.uid
    return typeof subject === 'string' && subject.trim() ? subject.trim() : null
  } catch {
    return null
  }
}

export function resolveChatOwnerKey(authorization: string) {
  const subject = decodeJwtSubject(authorization)
  if (subject) return `subject:${subject}`

  return `token:${createHash('sha256').update(authorization).digest('hex')}`
}

export function createConversation(ownerKey: string, studySetId: string) {
  cleanupExpiredEntries()

  const now = Date.now()
  const conversation: ChatConversation = {
    id: randomUUID(),
    ownerKey,
    studySetId,
    latestGeminiInteractionId: null,
    messages: [],
    createdAt: now,
    updatedAt: now,
  }

  getStore().conversations.set(conversation.id, conversation)
  return conversation
}

export function getConversation(
  conversationId: string,
  ownerKey: string,
  studySetId: string,
) {
  cleanupExpiredEntries()
  const conversation = getStore().conversations.get(conversationId)

  if (
    !conversation ||
    conversation.ownerKey !== ownerKey ||
    conversation.studySetId !== studySetId
  ) {
    return null
  }

  conversation.updatedAt = Date.now()
  return conversation
}

export function appendConversationTurn(
  conversation: ChatConversation,
  userMessage: ChatMessage,
  assistantMessage: ChatMessage,
  geminiInteractionId: string,
) {
  conversation.messages.push(userMessage, assistantMessage)
  conversation.latestGeminiInteractionId = geminiInteractionId
  conversation.updatedAt = Date.now()

  // The temporary adapter is intentionally bounded. A durable backend can
  // replace this store without changing the public route contract.
  if (conversation.messages.length > 160) {
    conversation.messages.splice(0, conversation.messages.length - 160)
  }
}

function idempotencyKey(
  ownerKey: string,
  studySetId: string,
  clientMessageId: string,
) {
  return `${ownerKey}:${studySetId}:${clientMessageId}`
}

export function getIdempotentResponse(
  ownerKey: string,
  studySetId: string,
  clientMessageId: string,
) {
  cleanupExpiredEntries()
  return getStore().idempotentResponses.get(
    idempotencyKey(ownerKey, studySetId, clientMessageId),
  )?.response ?? null
}

export function saveIdempotentResponse(
  ownerKey: string,
  studySetId: string,
  clientMessageId: string,
  response: SendChatMessageResponse,
) {
  getStore().idempotentResponses.set(
    idempotencyKey(ownerKey, studySetId, clientMessageId),
    {
      response,
      expiresAt: Date.now() + CONVERSATION_TTL_MS,
    },
  )
}

export function consumeChatRateLimit(ownerKey: string) {
  cleanupExpiredEntries()
  const store = getStore()
  const now = Date.now()
  const current = store.rateLimits.get(ownerKey)

  if (!current || current.resetAt <= now) {
    store.rateLimits.set(ownerKey, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    })
    return { allowed: true, retryAfterSeconds: 0 }
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((current.resetAt - now) / 1000),
      ),
    }
  }

  current.count += 1
  return { allowed: true, retryAfterSeconds: 0 }
}

export function paginateConversationMessages(
  conversation: ChatConversation,
  limit: number,
  cursor: string | null,
) {
  let end = conversation.messages.length

  if (cursor) {
    try {
      const decoded = Number.parseInt(
        Buffer.from(cursor, 'base64url').toString('utf8'),
        10,
      )
      if (Number.isFinite(decoded) && decoded >= 0) {
        end = Math.min(decoded, conversation.messages.length)
      }
    } catch {
      // Invalid cursors fall back to the latest page.
    }
  }

  const start = Math.max(0, end - limit)
  return {
    messages: conversation.messages.slice(start, end),
    nextCursor:
      start > 0
        ? Buffer.from(String(start), 'utf8').toString('base64url')
        : null,
  }
}
