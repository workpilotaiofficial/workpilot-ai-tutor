export const studySetChatSectionTypes = [
  'multiple_choice',
  'flashcards',
  'written_test',
  'fill_in_the_blanks',
  'notes',
  'tutor_lesson',
] as const

export type StudySetChatSectionType =
  (typeof studySetChatSectionTypes)[number]

export type ChatContext = {
  section_type: StudySetChatSectionType
  item_id?: string
  item_index?: number
}

export type SendChatMessageRequest = {
  context: ChatContext
  text: string
  client_message_id: string | null
  conversation_id: string | null
  language?: string
}

export type ChatMessage = {
  id: string
  serial_number: number
  role: 'user' | 'assistant'
  text: string
  created_at: string
}

export type SendChatMessageResponse = {
  data: {
    conversation_id: string
    user_message: ChatMessage
    assistant_message: ChatMessage
  }
}

export type StudySetChatSession = {
  id: string
  contextType: string
  contextItemId: string | null
  lastMessageAt: string
  createdAt: string
}

export type StudySetChatSessionsResponse = {
  data: StudySetChatSession[]
}

export type StudySetChatConversationResponse = {
  data: {
    session: Record<string, unknown>
    messages: ChatMessage[]
  }
}
