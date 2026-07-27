import { z } from 'zod'

export const chatContextSchema = z.object({
  section_type: z.string().trim().min(1).max(64),
  item_id: z.string().trim().min(1).max(160).nullable().optional(),
  item_index: z.number().int().min(0).nullable().optional(),
})

export const sendChatMessageSchema = z.object({
  conversation_id: z.string().uuid().nullable(),
  client_message_id: z.string().uuid(),
  text: z.string().trim().min(1).max(4000),
  context: chatContextSchema.nullable(),
  language: z.enum(['auto', 'bn', 'en']).default('auto'),
})

export type ChatContext = z.infer<typeof chatContextSchema>
export type SendChatMessageRequest = z.infer<typeof sendChatMessageSchema>

export type ChatCitation = {
  source_type: 'study_item' | 'study_set'
  source_id: string
  label: string
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  created_at: string
  citations?: ChatCitation[]
}

export type ChatUsage = {
  credits_used: number
  input_tokens: number
  output_tokens: number
}

export type SendChatMessageResponse = {
  data: {
    conversation_id: string
    user_message: ChatMessage
    assistant_message: ChatMessage
    usage: ChatUsage
  }
  meta: {
    request_id: string
  }
}

export type ChatHistoryResponse = {
  data: {
    conversation_id: string
    messages: ChatMessage[]
    pagination: {
      next_cursor: string | null
      has_more: boolean
    }
  }
  meta: {
    request_id: string
  }
}

export type ChatApiErrorResponse = {
  error: {
    code: string
    message: string
    details?: unknown
  }
  request_id: string
}
