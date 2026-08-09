'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Download,
  ExternalLink,
  File,
  FileImage,
  FileText,
  LoaderCircle,
  Plus,
  Send,
  Sparkles,
} from 'lucide-react'
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
import {
  fetchStudySetSourceDocument,
  type StudySetSourceDocument,
} from '@/lib/api/study-sets.service'
import { getApiClientErrorMessage } from '@/lib/api/client'
import {
  getCachedStudySetSource,
  type CachedStudySetSource,
} from '@/lib/study-set-source-cache'

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

type SourceKind = 'pdf' | 'image' | 'youtube' | 'text' | 'file'

function getSourceKind(sourceType?: string | null, mimeType?: string | null, filename?: string | null): SourceKind {
  const normalizedType = sourceType?.toLowerCase() ?? ''
  const normalizedMime = mimeType?.toLowerCase() ?? ''
  const normalizedFilename = filename?.toLowerCase() ?? ''

  if (normalizedType.includes('pdf') || normalizedMime.includes('pdf') || normalizedFilename.endsWith('.pdf')) {
    return 'pdf'
  }
  if (normalizedType.includes('image') || normalizedMime.startsWith('image/')) return 'image'
  if (normalizedType.includes('youtube') || normalizedType.includes('video')) return 'youtube'
  if (normalizedType.includes('text') || normalizedMime.startsWith('text/')) return 'text'
  return 'file'
}

function getSafeSourceUrl(...values: Array<string | null | undefined>) {
  const value = values.find((candidate) => typeof candidate === 'string' && Boolean(candidate.trim()))?.trim()
  if (!value) return null

  if (
    value.startsWith('/') ||
    value.startsWith('blob:') ||
    value.startsWith('https://') ||
    value.startsWith('http://')
  ) {
    return value
  }

  return null
}

function getYoutubeEmbedUrl(value: string | null) {
  if (!value) return null

  try {
    const url = new URL(value, window.location.origin)
    const hostname = url.hostname.toLowerCase().replace(/^www\./, '')
    let videoId = ''

    if (hostname === 'youtu.be') videoId = url.pathname.split('/').filter(Boolean)[0] ?? ''
    if (hostname === 'youtube.com' || hostname.endsWith('.youtube.com')) {
      videoId = url.searchParams.get('v') ?? ''
      if (!videoId && url.pathname.startsWith('/shorts/')) {
        videoId = url.pathname.split('/').filter(Boolean)[1] ?? ''
      }
      if (!videoId && url.pathname.startsWith('/embed/')) {
        videoId = url.pathname.split('/').filter(Boolean)[1] ?? ''
      }
    }

    return /^[a-zA-Z0-9_-]{6,}$/.test(videoId)
      ? `https://www.youtube.com/embed/${videoId}`
      : null
  } catch {
    return null
  }
}

function SourceToolbar({ filename, sourceUrl }: { filename: string; sourceUrl: string }) {
  return (
    <div className="flex min-w-0 shrink-0 items-center gap-2 border-b border-border bg-muted/30 px-3 py-2">
      <FileText className="h-4 w-4 shrink-0 text-primary" />
      <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground" title={filename}>
        {filename}
      </span>
      <a
        href={sourceUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={`Open ${filename} in a new tab`}
        title="Open in a new tab"
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ExternalLink className="h-4 w-4" />
      </a>
      <a
        href={sourceUrl}
        download={filename}
        aria-label={`Download ${filename}`}
        title="Download file"
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Download className="h-4 w-4" />
      </a>
    </div>
  )
}

function ContentTab({ studySet, documentId }: { studySet: StudySet; documentId?: string | null }) {
  const effectiveDocumentId = documentId || studySet.documentId
  const [sourceDocument, setSourceDocument] = useState<StudySetSourceDocument | null>(null)
  const [cachedSource, setCachedSource] = useState<CachedStudySetSource | null>(null)
  const [cachedSourceUrl, setCachedSourceUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(effectiveDocumentId))
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (!effectiveDocumentId) {
      setIsLoading(false)
      return
    }

    const abortController = new AbortController()
    let documentError = ''

    setIsLoading(true)
    setLoadError('')

    Promise.all([
      fetchStudySetSourceDocument(effectiveDocumentId, abortController.signal).catch((error) => {
        documentError = getApiClientErrorMessage(error, 'The source document could not be loaded.')
        return null
      }),
      getCachedStudySetSource(effectiveDocumentId).catch(() => null),
    ]).then(([documentResult, cachedResult]) => {
      if (abortController.signal.aborted) return
      setSourceDocument(documentResult)
      setCachedSource(cachedResult)
      setLoadError(documentResult || cachedResult ? '' : documentError)
      setIsLoading(false)
    })

    return () => abortController.abort()
  }, [effectiveDocumentId])

  useEffect(() => {
    if (!cachedSource?.file) {
      setCachedSourceUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(cachedSource.file)
    setCachedSourceUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [cachedSource])

  const filename =
    cachedSource?.filename || sourceDocument?.filename || studySet.sourceFilename || sourceDocument?.title || studySet.title
  const mimeType = cachedSource?.mimeType || sourceDocument?.mimeType || studySet.sourceMimeType
  const sourceType = sourceDocument?.sourceType || studySet.sourceType
  const remoteR2Url = sourceDocument?.r2Path?.startsWith('http') ? sourceDocument.r2Path : null
  const sourceUrl = getSafeSourceUrl(
    cachedSourceUrl,
    sourceDocument?.sourceUrl,
    studySet.sourceUrl,
    remoteR2Url,
  )
  const sourceText = studySet.sourceText || sourceDocument?.rawExtractedText
  const sourceKind = getSourceKind(sourceType, mimeType, filename)
  const youtubeEmbedUrl = sourceKind === 'youtube' ? getYoutubeEmbedUrl(sourceUrl) : null

  if (isLoading && !sourceText && !sourceUrl) {
    return (
      <div className="flex h-full items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
        <LoaderCircle className="h-4 w-4 animate-spin" />
        Loading source content...
      </div>
    )
  }

  if (sourceKind === 'pdf' && sourceUrl) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-muted/20">
        <SourceToolbar filename={filename} sourceUrl={sourceUrl} />
        <iframe
          src={`${sourceUrl}#toolbar=1&navpanes=0&view=FitH`}
          title={filename}
          className="min-h-0 w-full flex-1 border-0 bg-white"
        />
      </div>
    )
  }

  if (sourceKind === 'image' && sourceUrl) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-muted/20">
        <SourceToolbar filename={filename} sourceUrl={sourceUrl} />
        <div className="min-h-0 flex-1 overflow-auto p-3 sm:p-4">
          {/* The source may be an authenticated blob URL or any supported image host. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={sourceUrl} alt={filename} className="mx-auto h-auto max-h-full max-w-full rounded-lg object-contain" />
        </div>
      </div>
    )
  }

  if (sourceKind === 'youtube' && youtubeEmbedUrl) {
    return (
      <div className="h-full overflow-y-auto p-3 sm:p-4">
        <div className="aspect-video overflow-hidden rounded-xl border border-border bg-black">
          <iframe
            src={youtubeEmbedUrl}
            title={filename}
            className="h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    )
  }

  if (sourceKind === 'file' && sourceUrl) {
    return (
      <div className="flex h-full items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-sm rounded-xl border border-border bg-muted/20 p-5 text-center">
          <File className="mx-auto h-9 w-9 text-primary" />
          <p className="mt-3 truncate text-sm font-semibold" title={filename}>{filename}</p>
          <a
            href={sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            <ExternalLink className="h-4 w-4" />
            Open file
          </a>
        </div>
      </div>
    )
  }

  if (sourceText) {
    return (
      <div className="h-full overflow-y-auto p-4">
        {(sourceKind === 'pdf' || sourceKind === 'image') && !sourceUrl ? (
          <div className="mb-4 flex gap-3 rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            {sourceKind === 'image' ? <FileImage className="h-5 w-5 shrink-0" /> : <FileText className="h-5 w-5 shrink-0" />}
            <p>The original {sourceKind} preview is unavailable, so the extracted content is shown below.</p>
          </div>
        ) : null}
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/80">{sourceText}</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
        {loadError}
      </div>
    )
  }

  return (
    <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
      No source content available for this study set.
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
  documentId,
}: {
  studySet: StudySet
  studySetId: string
  activeSectionType: string | null
  activeItem: unknown
  activeItemIndex: number
  documentId?: string | null
}) {
  return (
    <Tabs defaultValue="chat" className="h-full min-h-0 gap-0 bg-card">
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
        <ContentTab studySet={studySet} documentId={documentId} />
      </TabsContent>
      <TabsContent value="notes" className="min-h-0">
        <NotesTab notesMarkdown={studySet.notesMarkdown} />
      </TabsContent>
    </Tabs>
  )
}
