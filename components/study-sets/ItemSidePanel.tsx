'use client'

import { useEffect, useMemo, useState } from 'react'
import { LoaderCircle, Plus, Send, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NotesEditor } from '@/components/study-sets/NotesEditor'
import type { StudySet } from '@/components/study-sets/utils'
import type {
  ChatContext,
  ChatMessage,
  SendChatMessageResponse,
  StudySetChatSectionType,
  StudySetChatSession,
} from '@/lib/chat/contracts'
import {
  fetchStudySetChatConversation,
  fetchStudySetChatSessions,
  isChatConversationNotFound,
  sendStudySetChatMessage,
} from '@/lib/api/study-set-chat.service'
import { getApiClientErrorMessage } from '@/lib/api/client'

const uiToChatSectionType: Record<string, StudySetChatSectionType> = {
  multipleChoice: 'multiple_choice',
  flashcards: 'flashcards',
  writtenTests: 'written_test',
  fillInTheBlanks: 'fill_in_the_blanks',
  notes: 'notes',
  tutorLesson: 'tutor_lesson',
}

function getConversationStorageKey(studySetId: string) {
  return `neurova:study-set-chat:${studySetId}`
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
}

function formatSessionLabel(session: StudySetChatSession) {
  const contextLabel = session.contextType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
  const timestamp = new Date(session.lastMessageAt)
  const dateLabel = Number.isNaN(timestamp.getTime())
    ? ''
    : timestamp.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })

  return dateLabel ? `${contextLabel} · ${dateLabel}` : contextLabel
}

function AssistantMessageContent({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => (
          <p className="mb-2 whitespace-pre-wrap last:mb-0">{children}</p>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        ul: ({ children }) => (
          <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>
        ),
        li: ({ children }) => <li>{children}</li>,
        code: ({ children }) => (
          <code className="rounded bg-background/70 px-1 py-0.5 text-[0.85em]">
            {children}
          </code>
        ),
        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="font-medium underline underline-offset-2"
          >
            {children}
          </a>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  )
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
  const [sessions, setSessions] = useState<StudySetChatSession[]>([])
  const [draft, setDraft] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const chatContext = useMemo<ChatContext | null>(() => {
    const backendSectionType = sectionType
      ? uiToChatSectionType[sectionType]
      : null
    if (!backendSectionType) return null

    const itemId =
      activeItem &&
      typeof activeItem === 'object' &&
      'id' in activeItem &&
      typeof activeItem.id === 'string' &&
      isUuid(activeItem.id)
        ? activeItem.id
        : undefined

    return {
      section_type: backendSectionType,
      ...(itemId ? { item_id: itemId } : {}),
      item_index: activeItemIndex,
    }
  }, [activeItem, activeItemIndex, sectionType])

  useEffect(() => {
    const abortController = new AbortController()
    const storageKey = getConversationStorageKey(studySetId)
    const storedConversationId = window.localStorage.getItem(storageKey)

    setSessions([])
    setMessages([])
    setConversationId(null)
    setIsLoadingSessions(true)
    setErrorMessage('')

    fetchStudySetChatSessions(studySetId, abortController.signal)
      .then((response) => {
        if (abortController.signal.aborted) return

        const nextSessions = response.data
        const storedSession = storedConversationId
          ? nextSessions.find((session) => session.id === storedConversationId)
          : null
        const nextConversationId = storedSession?.id ?? nextSessions[0]?.id ?? null

        setSessions(nextSessions)
        setConversationId(nextConversationId)

        if (nextConversationId) {
          window.localStorage.setItem(storageKey, nextConversationId)
        } else {
          window.localStorage.removeItem(storageKey)
        }
      })
      .catch((error) => {
        if (abortController.signal.aborted) return

        setErrorMessage(
          getApiClientErrorMessage(
            error,
            'Could not load chat sessions.',
          ),
        )
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setIsLoadingSessions(false)
        }
      })

    return () => abortController.abort()
  }, [studySetId])

  useEffect(() => {
    if (!conversationId) {
      setMessages([])
      setIsLoadingHistory(false)
      return
    }

    const abortController = new AbortController()
    const storageKey = getConversationStorageKey(studySetId)

    setIsLoadingHistory(true)
    setErrorMessage('')
    window.localStorage.setItem(storageKey, conversationId)

    fetchStudySetChatConversation(
      studySetId,
      conversationId,
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
          setSessions((current) =>
            current.filter((session) => session.id !== conversationId),
          )
          setConversationId(null)
          setMessages([])
          return
        }

        setErrorMessage(
          getApiClientErrorMessage(
            error,
            'Could not load the chat conversation.',
          ),
        )
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setIsLoadingHistory(false)
        }
      })

    return () => abortController.abort()
  }, [conversationId, studySetId])

  const handleNewConversation = () => {
    window.localStorage.removeItem(getConversationStorageKey(studySetId))
    setConversationId(null)
    setMessages([])
    setErrorMessage('')
  }

  const handleSend = async () => {
    const text = draft.trim()
    if (!text || isSending || !chatContext) return

    const clientMessageId = crypto.randomUUID()
    const userMessage: ChatMessage = {
      id: clientMessageId,
      serial_number: messages.length + 1,
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
        language: 'auto',
      }

      let response: SendChatMessageResponse
      try {
        response = await sendStudySetChatMessage(studySetId, payload)
      } catch (error) {
        if (!conversationId || !isChatConversationNotFound(error)) {
          throw error
        }

        // A saved session can be removed or become unavailable on the backend.
        // Recover by starting a new persisted conversation with the same message.
        window.localStorage.removeItem(
          getConversationStorageKey(studySetId),
        )
        setSessions((current) =>
          current.filter((session) => session.id !== conversationId),
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
      const lastMessageAt = response.data.assistant_message.created_at
      setSessions((current) => {
        const existingSession = current.find(
          (session) => session.id === nextConversationId,
        )
        const nextSession: StudySetChatSession = {
          id: nextConversationId,
          contextType: chatContext.section_type,
          contextItemId: chatContext.item_id ?? null,
          lastMessageAt,
          createdAt: existingSession?.createdAt ?? lastMessageAt,
        }

        return [
          nextSession,
          ...current.filter(
            (session) => session.id !== nextConversationId,
          ),
        ]
      })
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
      <div className="flex items-center gap-2 border-b border-border p-2">
        <select
          value={conversationId ?? ''}
          onChange={(event) => {
            const nextConversationId = event.target.value || null
            setConversationId(nextConversationId)
            setMessages([])
            setErrorMessage('')
          }}
          disabled={isLoadingSessions || isSending}
          aria-label="Chat conversation"
          className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-background px-2 text-xs outline-none focus:border-primary"
        >
          <option value="">New conversation</option>
          {sessions.map((session) => (
            <option key={session.id} value={session.id}>
              {formatSessionLabel(session)}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleNewConversation}
          disabled={isLoadingSessions || isSending}
          aria-label="Start a new conversation"
          title="New conversation"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {isLoadingSessions || isLoadingHistory ? (
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
              }`}
            >
              {message.role === 'assistant' ? (
                <AssistantMessageContent text={message.text} />
              ) : (
                <span className="whitespace-pre-wrap">{message.text}</span>
              )}
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
            disabled={
              !draft.trim() ||
              isSending ||
              isLoadingSessions ||
              isLoadingHistory ||
              !chatContext
            }
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
