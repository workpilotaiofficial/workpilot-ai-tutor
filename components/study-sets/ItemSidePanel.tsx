'use client'

import { useEffect, useMemo, useState } from 'react'
import { LoaderCircle, Send, Sparkles } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NotesEditor } from '@/components/study-sets/NotesEditor'
import type { StudySet } from '@/components/study-sets/utils'
import type {
  ChatContext,
  ChatMessage,
  SendChatMessageResponse,
} from '@/lib/chat/contracts'
import {
  fetchStudySetChatHistory,
  isChatConversationNotFound,
  sendStudySetChatMessage,
} from '@/lib/api/study-set-chat.service'
import { getApiClientErrorMessage } from '@/lib/api/client'

function getConversationStorageKey(studySetId: string) {
  return `neurova:study-set-chat:${studySetId}`
}

function ChatTab({
  studySetId,
  sectionType,
  activeItem,
  activeItemIndex,
}: {
  studySetId: string
  sectionType: string | null
  activeItem: unknown
  activeItemIndex: number
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const chatContext = useMemo<ChatContext | null>(() => {
    if (!sectionType) return null

    const itemId =
      activeItem &&
      typeof activeItem === 'object' &&
      'id' in activeItem &&
      typeof activeItem.id === 'string'
        ? activeItem.id
        : null

    return {
      section_type: sectionType,
      item_id: itemId,
      item_index: activeItemIndex,
    }
  }, [activeItem, activeItemIndex, sectionType])

  useEffect(() => {
    const abortController = new AbortController()
    const storageKey = getConversationStorageKey(studySetId)
    const storedConversationId = window.localStorage.getItem(storageKey)

    if (!storedConversationId) {
      setConversationId(null)
      setMessages([])
      setIsLoadingHistory(false)
      return () => abortController.abort()
    }

    setConversationId(storedConversationId)
    setIsLoadingHistory(true)
    setErrorMessage('')

    fetchStudySetChatHistory(
      studySetId,
      storedConversationId,
      abortController.signal,
    )
      .then((response) => {
        if (!abortController.signal.aborted) {
          setMessages(response.data.messages)
        }
      })
      .catch((error) => {
        if (abortController.signal.aborted) return

        if (isChatConversationNotFound(error)) {
          window.localStorage.removeItem(storageKey)
          setConversationId(null)
          setMessages([])
          return
        }

        setErrorMessage(
          getApiClientErrorMessage(
            error,
            'Could not load the chat history.',
          ),
        )
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setIsLoadingHistory(false)
        }
      })

    return () => abortController.abort()
  }, [studySetId])

  const handleSend = async () => {
    const text = draft.trim()
    if (!text || isSending) return

    const clientMessageId = crypto.randomUUID()
    const userMessage: ChatMessage = {
      id: clientMessageId,
      role: 'user',
      text,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMessage])
    setDraft('')
    setIsSending(true)
    setErrorMessage('')

    try {
      const payload = {
        conversation_id: conversationId,
        client_message_id: clientMessageId,
        text,
        context: chatContext,
        language: 'auto' as const,
      }

      let response: SendChatMessageResponse
      try {
        response = await sendStudySetChatMessage(studySetId, payload)
      } catch (error) {
        if (!conversationId || !isChatConversationNotFound(error)) {
          throw error
        }

        // The temporary Next.js store can be cleared by a process restart.
        // Transparently start a fresh provider conversation in that case.
        window.localStorage.removeItem(
          getConversationStorageKey(studySetId),
        )
        setConversationId(null)
        response = await sendStudySetChatMessage(studySetId, {
          ...payload,
          conversation_id: null,
        })
      }

      const nextConversationId = response.data.conversation_id
      setConversationId(nextConversationId)
      window.localStorage.setItem(
        getConversationStorageKey(studySetId),
        nextConversationId,
      )
      setMessages((prev) => [
        ...prev.filter((message) => message.id !== clientMessageId),
        response.data.user_message,
        response.data.assistant_message,
      ])
    } catch (error) {
      setMessages((prev) =>
        prev.filter((message) => message.id !== clientMessageId),
      )
      setDraft((current) => current || text)
      setErrorMessage(
        getApiClientErrorMessage(
          error,
          'Could not send your message. Please try again.',
        ),
      )
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {isLoadingHistory ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <LoaderCircle className="h-5 w-5 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
            <Sparkles className="h-5 w-5" />
            <p>Ask a question about this item to get started.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={` w-fit max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                message.role === 'user'
                  ? 'ml-auto bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground'
              } whitespace-pre-wrap`}
            >
              {message.text}
            </div>
          ))
        )}
        {isSending && (
          <div className="w-fit flex max-w-[85%] items-center gap-2 rounded-2xl bg-secondary px-3 py-2 text-sm text-muted-foreground">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Thinking…
          </div>
        )}
      </div>

      <div className="border-t border-border p-3">
        {errorMessage && (
          <p className="mb-2 text-xs text-destructive">{errorMessage}</p>
        )}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                void handleSend()
              }
            }}
            placeholder="Ask about this item..."
            className="h-10 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!draft.trim() || isSending || isLoadingHistory}
            aria-label="Send message"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function ContentTab({ sourceText }: { sourceText?: string }) {
  if (!sourceText) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
        No source content available for this study set.
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">{sourceText}</p>
    </div>
  )
}

function NotesTab({ notesMarkdown }: { notesMarkdown?: string }) {
  if (!notesMarkdown) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
        No generated notes available for this study set.
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <NotesEditor
        notesMarkdown={notesMarkdown}
        editable={false}
        showToolbar={false}
        showBubbleMenu={false}
      />
    </div>
  )
}

export function ItemSidePanel({
  studySet,
  studySetId,
  activeSectionType,
  activeItem,
  activeItemIndex,
}: {
  studySet: StudySet
  studySetId: string
  activeSectionType: string | null
  activeItem: unknown
  activeItemIndex: number
}) {
  return (
    <Tabs defaultValue="chat" className="h-[calc(100vh-70px)] gap-0 bg-card ">
      <TabsList className="m-3 mb-0 !w-full !m-0 !rounded-0">
        <TabsTrigger value="chat">Chat</TabsTrigger>
        <TabsTrigger value="content">Content</TabsTrigger>
        <TabsTrigger value="notes">Notes</TabsTrigger>
      </TabsList>

      <TabsContent value="chat" className="min-h-0">
        <ChatTab
          studySetId={studySetId}
          sectionType={activeSectionType}
          activeItem={activeItem}
          activeItemIndex={activeItemIndex}
        />
      </TabsContent>
      <TabsContent value="content" className="min-h-0">
        <ContentTab sourceText={studySet.sourceText} />
      </TabsContent>
      <TabsContent value="notes" className="min-h-0">
        <NotesTab notesMarkdown={studySet.notesMarkdown} />
      </TabsContent>
    </Tabs>
  )
}
