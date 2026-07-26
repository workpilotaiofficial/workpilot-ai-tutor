'use client'

import { useEffect, useRef, useState } from 'react'
import { History, Plus } from 'lucide-react'
import StartComposer, { type StartComposerSubmitPayload } from '@/components/solve/chat/start-composer'
import FollowupComposer from '@/components/solve/chat/followup-composer'
import ChatMessageBubble from '@/components/solve/chat/chat-message-bubble'
import SolveHistoryModal from '@/components/solve/history-modal'
import { getApiClientErrorMessage } from '@/lib/api/client'
import {
  fetchSolveSession,
  sendSolveMessage,
  startSolveSession,
  type SolveChatMessage,
} from '@/lib/api/solve.service'
import { subscribeToSolveSession } from '@/components/solve/solve-tracker'

export default function SolvePage() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionTitle, setSessionTitle] = useState('')
  const [messages, setMessages] = useState<SolveChatMessage[]>([])
  const [isStarting, setIsStarting] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [startError, setStartError] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const scrollAnchorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const trackPendingMessage = (
    nextSessionId: string,
    pendingMessageId: string,
    websocket: { url: string; token: string; expires_in: number },
  ) => {
    subscribeToSolveSession({ sessionId: nextSessionId, pendingMessageId, websocket }, (detail) => {
      setMessages(detail.messages)
    })
  }

  const makePendingAssistantMessage = (id: string): SolveChatMessage => ({
    id,
    role: 'assistant',
    status: 'pending',
    created_at: new Date().toISOString(),
    text: null,
    image_url: null,
    file_name: null,
    result: null,
    error_message: null,
  })

  const handleStart = async (payload: StartComposerSubmitPayload) => {
    setIsStarting(true)
    setStartError('')

    try {
      const response = await startSolveSession({
        subjectHint: payload.subjectHint,
        image: payload.image,
        pdf: payload.pdf,
        document: payload.document,
        questionText: payload.questionText,
      })

      setSessionId(response.session.id)
      setSessionTitle(response.session.title)

      const assistantPlaceholder = makePendingAssistantMessage(response.job_id || `${response.session.id}-assistant`)
      setMessages([response.message, assistantPlaceholder])

      trackPendingMessage(response.session.id, assistantPlaceholder.id, response.websocket)
    } catch (error) {
      console.error('Error starting solve session:', error)
      setStartError(getApiClientErrorMessage(error, 'Failed to submit your question.'))
    } finally {
      setIsStarting(false)
    }
  }

  const handleSendFollowup = async (text: string) => {
    if (!sessionId) return
    setIsSending(true)

    const userMessage: SolveChatMessage = {
      id: `local-${Date.now()}`,
      role: 'user',
      status: 'completed',
      created_at: new Date().toISOString(),
      text,
      image_url: null,
      file_name: null,
      result: null,
      error_message: null,
    }
    setMessages((previous) => [...previous, userMessage])

    try {
      const response = await sendSolveMessage(sessionId, text)
      const assistantPlaceholder = makePendingAssistantMessage(response.job_id || `${sessionId}-assistant-${Date.now()}`)
      setMessages((previous) => [...previous, assistantPlaceholder])

      trackPendingMessage(sessionId, assistantPlaceholder.id, response.websocket)
    } catch (error) {
      console.error('Error sending follow-up message:', error)
      setMessages((previous) => [
        ...previous,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          status: 'failed',
          created_at: new Date().toISOString(),
          text: null,
          image_url: null,
          file_name: null,
          result: null,
          error_message: getApiClientErrorMessage(error, 'Failed to send your message.'),
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  const handleSelectHistorySession = async (selectedSessionId: string) => {
    setShowHistory(false)

    try {
      const detail = await fetchSolveSession(selectedSessionId)
      setSessionId(detail.session.id)
      setSessionTitle(detail.session.title)
      setMessages(detail.messages)
    } catch (error) {
      console.error('Error loading solve session:', error)
    }
  }

  const startNewChat = () => {
    setSessionId(null)
    setSessionTitle('')
    setMessages([])
    setStartError('')
  }

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <header className="flex min-h-16 items-center justify-between border-b border-border px-4 sm:px-7 lg:px-9">
        <h1 className="truncate text-base font-semibold text-foreground sm:text-lg">{sessionTitle || 'Solve'}</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <History className="h-3.5 w-3.5" />
            History
          </button>
          {sessionId ? (
            <button
              type="button"
              onClick={startNewChat}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              New question
            </button>
          ) : null}
        </div>
      </header>

      {!sessionId ? (
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
          <h2 className="mb-2 text-balance text-center text-2xl font-semibold tracking-[-0.02em] text-foreground sm:text-3xl">
            Solve any question, step by step
          </h2>
          <p className="mb-8 text-center text-sm text-muted-foreground sm:text-base">
            Attach a photo, PDF, or doc — and add a question alongside it if you like
          </p>
          <StartComposer onSubmit={(payload) => void handleStart(payload)} isSubmitting={isStarting} errorMessage={startError} />
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-7 lg:px-9">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
              {messages.map((message) => (
                <ChatMessageBubble key={message.id} message={message} />
              ))}
              <div ref={scrollAnchorRef} />
            </div>
          </div>

          <div className="border-t border-border px-4 py-4 sm:px-7 lg:px-9">
            <FollowupComposer onSend={(text) => void handleSendFollowup(text)} isSending={isSending} />
          </div>
        </>
      )}

      <SolveHistoryModal open={showHistory} onClose={() => setShowHistory(false)} onSelect={(id) => void handleSelectHistorySession(id)} />
    </div>
  )
}
