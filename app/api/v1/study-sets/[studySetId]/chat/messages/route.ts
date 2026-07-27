import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import {
  sendChatMessageSchema,
  type ChatApiErrorResponse,
  type ChatHistoryResponse,
  type ChatMessage,
  type SendChatMessageResponse,
} from '@/lib/chat/contracts'
import {
  appendConversationTurn,
  consumeChatRateLimit,
  createConversation,
  getConversation,
  getIdempotentResponse,
  paginateConversationMessages,
  resolveChatOwnerKey,
  saveIdempotentResponse,
} from '@/lib/chat/server/conversation-store'
import {
  GeminiChatError,
  generateGeminiChatReply,
} from '@/lib/chat/server/gemini'
import {
  resolveStudySetChatContext,
  StudySetContextError,
} from '@/lib/chat/server/study-set-context'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{
    studySetId: string
  }>
}

function errorResponse(
  status: number,
  code: string,
  message: string,
  details?: unknown,
  headers?: HeadersInit,
) {
  const body: ChatApiErrorResponse = {
    error: {
      code,
      message,
      ...(typeof details === 'undefined' ? {} : { details }),
    },
    request_id: randomUUID(),
  }

  return NextResponse.json(body, { status, headers })
}

function getAuthorization(request: NextRequest) {
  const authorization = request.headers.get('authorization')?.trim() ?? ''
  return /^Bearer\s+\S+/i.test(authorization) ? authorization : null
}

export async function POST(request: NextRequest, context: RouteContext) {
  const requestId = randomUUID()
  const authorization = getAuthorization(request)

  if (!authorization) {
    return errorResponse(
      401,
      'UNAUTHENTICATED',
      'A valid bearer token is required.',
    )
  }

  const { studySetId: rawStudySetId } = await context.params
  const studySetId = rawStudySetId.trim()
  if (!studySetId) {
    return errorResponse(404, 'STUDY_SET_NOT_FOUND', 'Study set not found.')
  }

  let requestPayload: unknown
  try {
    requestPayload = await request.json()
  } catch {
    return errorResponse(
      400,
      'INVALID_JSON',
      'The request body must be valid JSON.',
    )
  }

  const parsed = sendChatMessageSchema.safeParse(requestPayload)
  if (!parsed.success) {
    return errorResponse(
      422,
      'CHAT_MESSAGE_INVALID',
      'Some submitted chat fields are invalid.',
      parsed.error.flatten(),
    )
  }

  const ownerKey = resolveChatOwnerKey(authorization)
  const existingResponse = getIdempotentResponse(
    ownerKey,
    studySetId,
    parsed.data.client_message_id,
  )
  if (existingResponse) {
    return NextResponse.json(existingResponse)
  }

  const rateLimit = consumeChatRateLimit(ownerKey)
  if (!rateLimit.allowed) {
    return errorResponse(
      429,
      'CHAT_RATE_LIMITED',
      'Too many chat requests. Please wait a moment and try again.',
      undefined,
      {
        'retry-after': String(rateLimit.retryAfterSeconds),
      },
    )
  }

  const conversation = parsed.data.conversation_id
    ? getConversation(parsed.data.conversation_id, ownerKey, studySetId)
    : createConversation(ownerKey, studySetId)

  if (!conversation) {
    return errorResponse(
      404,
      'CONVERSATION_NOT_FOUND',
      'The conversation could not be found. Start a new conversation.',
    )
  }

  try {
    const groundedContext = await resolveStudySetChatContext({
      studySetId,
      context: parsed.data.context,
      authorization,
      requestOrigin: request.nextUrl.origin,
    })
    const geminiReply = await generateGeminiChatReply({
      text: parsed.data.text,
      language: parsed.data.language,
      systemInstruction: groundedContext.systemInstruction,
      previousInteractionId: conversation.latestGeminiInteractionId,
    })

    const userMessage: ChatMessage = {
      id: randomUUID(),
      role: 'user',
      text: parsed.data.text,
      created_at: new Date().toISOString(),
    }
    const assistantMessage: ChatMessage = {
      id: randomUUID(),
      role: 'assistant',
      text: geminiReply.text,
      created_at: new Date().toISOString(),
      citations: groundedContext.citations,
    }

    appendConversationTurn(
      conversation,
      userMessage,
      assistantMessage,
      geminiReply.interactionId,
    )

    const response: SendChatMessageResponse = {
      data: {
        conversation_id: conversation.id,
        user_message: userMessage,
        assistant_message: assistantMessage,
        usage: {
          credits_used: 0,
          input_tokens: geminiReply.inputTokens,
          output_tokens: geminiReply.outputTokens,
        },
      },
      meta: {
        request_id: requestId,
      },
    }

    saveIdempotentResponse(
      ownerKey,
      studySetId,
      parsed.data.client_message_id,
      response,
    )

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    if (error instanceof StudySetContextError) {
      const status = [401, 402, 403, 404].includes(error.status)
        ? error.status
        : 502
      return errorResponse(
        status,
        status === 404 ? 'STUDY_SET_NOT_FOUND' : 'STUDY_CONTEXT_UNAVAILABLE',
        error.message,
        error.details,
      )
    }

    if (error instanceof GeminiChatError) {
      return errorResponse(
        error.status,
        error.code,
        error.message,
        error.details,
      )
    }

    return errorResponse(
      500,
      'CHAT_INTERNAL_ERROR',
      'The chat request could not be completed.',
    )
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  const authorization = getAuthorization(request)
  if (!authorization) {
    return errorResponse(
      401,
      'UNAUTHENTICATED',
      'A valid bearer token is required.',
    )
  }

  const { studySetId: rawStudySetId } = await context.params
  const studySetId = rawStudySetId.trim()
  const conversationId =
    request.nextUrl.searchParams.get('conversation_id')?.trim() ?? ''

  if (!conversationId) {
    return errorResponse(
      422,
      'CONVERSATION_ID_REQUIRED',
      'conversation_id is required.',
    )
  }

  const ownerKey = resolveChatOwnerKey(authorization)
  const conversation = getConversation(
    conversationId,
    ownerKey,
    studySetId,
  )
  if (!conversation) {
    return errorResponse(
      404,
      'CONVERSATION_NOT_FOUND',
      'The conversation could not be found.',
    )
  }

  const requestedLimit = Number.parseInt(
    request.nextUrl.searchParams.get('limit') ?? '30',
    10,
  )
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(100, Math.max(1, requestedLimit))
    : 30
  const cursor = request.nextUrl.searchParams.get('cursor')
  const page = paginateConversationMessages(conversation, limit, cursor)

  const response: ChatHistoryResponse = {
    data: {
      conversation_id: conversation.id,
      messages: page.messages,
      pagination: {
        next_cursor: page.nextCursor,
        has_more: Boolean(page.nextCursor),
      },
    },
    meta: {
      request_id: randomUUID(),
    },
  }

  return NextResponse.json(response)
}
