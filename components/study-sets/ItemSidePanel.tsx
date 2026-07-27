'use client'

import { useState } from 'react'
import { Send, Sparkles } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NotesEditor } from '@/components/study-sets/NotesEditor'
import type { StudySet } from '@/components/study-sets/utils'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
}

async function getAssistantReply(_message: string): Promise<string> {
  // TODO: replace with a real backend call once the chat API is wired up.
  return "Chat isn't connected yet — this is a UI preview."
}

function ChatTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [isSending, setIsSending] = useState(false)

  const handleSend = async () => {
    const text = draft.trim()
    if (!text || isSending) return

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', text }
    setMessages((prev) => [...prev, userMessage])
    setDraft('')
    setIsSending(true)

    try {
      const reply = await getAssistantReply(text)
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', text: reply }])
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
            <Sparkles className="h-5 w-5" />
            <p>Ask a question about this item to get started.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                message.role === 'user'
                  ? 'ml-auto bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground'
              }`}
            >
              {message.text}
            </div>
          ))
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-border p-3">
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
          disabled={!draft.trim() || isSending}
          aria-label="Send message"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
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

export function ItemSidePanel({ studySet }: { studySet: StudySet }) {
  return (
    <Tabs defaultValue="chat" className="h-[calc(100vh-70px)] gap-0 bg-card ">
      <TabsList className="m-3 mb-0 !w-full !m-0 !rounded-0">
        <TabsTrigger value="chat">Chat</TabsTrigger>
        <TabsTrigger value="content">Content</TabsTrigger>
        <TabsTrigger value="notes">Notes</TabsTrigger>
      </TabsList>

      <TabsContent value="chat" className="min-h-0">
        <ChatTab />
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
