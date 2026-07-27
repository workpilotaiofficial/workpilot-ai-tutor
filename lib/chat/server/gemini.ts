const GEMINI_INTERACTIONS_URL =
  'https://generativelanguage.googleapis.com/v1beta/interactions'
const DEFAULT_GEMINI_MODEL = 'gemini-3.6-flash'

type GeminiInteractionResponse = {
  id?: string
  steps?: Array<{
    type?: string
    content?: Array<{
      type?: string
      text?: string
    }>
  }>
  usage?: Record<string, unknown>
  error?: {
    message?: string
    status?: string
  }
}

export class GeminiChatError extends Error {
  status: number
  code: string
  details: unknown

  constructor(
    message: string,
    status = 502,
    code = 'GEMINI_REQUEST_FAILED',
    details: unknown = null,
  ) {
    super(message)
    this.name = 'GeminiChatError'
    this.status = status
    this.code = code
    this.details = details
  }
}

function getOutputText(response: GeminiInteractionResponse) {
  return (response.steps ?? [])
    .filter((step) => step.type === 'model_output')
    .flatMap((step) => step.content ?? [])
    .filter((part) => part.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text?.trim() ?? '')
    .filter(Boolean)
    .join('\n\n')
}

function getUsageNumber(
  usage: Record<string, unknown> | undefined,
  keys: string[],
) {
  if (!usage) return 0

  for (const key of keys) {
    const value = usage[key]
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }
  }

  return 0
}

export async function generateGeminiChatReply({
  text,
  language,
  systemInstruction,
  previousInteractionId,
}: {
  text: string
  language: 'auto' | 'bn' | 'en'
  systemInstruction: string
  previousInteractionId: string | null
}) {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) {
    throw new GeminiChatError(
      'Gemini chat is not configured. Add GEMINI_API_KEY to the server environment.',
      503,
      'CHAT_NOT_CONFIGURED',
    )
  }

  const abortController = new AbortController()
  const timeout = setTimeout(() => abortController.abort(), 45_000)
  const languageInstruction =
    language === 'bn'
      ? '\nRespond in Bangla.'
      : language === 'en'
        ? '\nRespond in English.'
        : ''

  try {
    const response = await fetch(GEMINI_INTERACTIONS_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        model: process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL,
        input: text,
        system_instruction: `${systemInstruction}${languageInstruction}`,
        previous_interaction_id: previousInteractionId || undefined,
        store: true,
        generation_config: {
          thinking_level: 'low',
        },
      }),
      signal: abortController.signal,
      cache: 'no-store',
    })

    const responseText = await response.text()
    let payload: GeminiInteractionResponse = {}

    if (responseText) {
      try {
        payload = JSON.parse(responseText) as GeminiInteractionResponse
      } catch {
        throw new GeminiChatError(
          'Gemini returned an invalid response.',
          502,
          'GEMINI_INVALID_RESPONSE',
        )
      }
    }

    if (!response.ok) {
      const status = response.status === 429 ? 429 : 502
      throw new GeminiChatError(
        payload.error?.message ?? 'Gemini could not generate a reply.',
        status,
        response.status === 429
          ? 'CHAT_RATE_LIMITED'
          : 'GEMINI_REQUEST_FAILED',
        payload,
      )
    }

    const replyText = getOutputText(payload)
    if (!payload.id || !replyText) {
      throw new GeminiChatError(
        'Gemini did not return a text reply.',
        502,
        'GEMINI_EMPTY_RESPONSE',
        payload,
      )
    }

    return {
      interactionId: payload.id,
      text: replyText,
      inputTokens: getUsageNumber(payload.usage, [
        'input_tokens',
        'inputTokenCount',
        'prompt_token_count',
      ]),
      outputTokens: getUsageNumber(payload.usage, [
        'output_tokens',
        'outputTokenCount',
        'candidates_token_count',
      ]),
    }
  } catch (error) {
    if (
      error instanceof DOMException &&
      error.name === 'AbortError'
    ) {
      throw new GeminiChatError(
        'Gemini took too long to respond. Please try again.',
        504,
        'GEMINI_TIMEOUT',
      )
    }

    if (error instanceof GeminiChatError) throw error

    throw new GeminiChatError(
      'Could not connect to Gemini. Please try again.',
      502,
      'GEMINI_NETWORK_ERROR',
    )
  } finally {
    clearTimeout(timeout)
  }
}
