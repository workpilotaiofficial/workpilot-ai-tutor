'use client'

import Image from 'next/image'
import { AlertTriangle, Paperclip } from 'lucide-react'
import type { SolveChatMessage } from '@/lib/api/solve.service'
import SolveAnswerContent from '@/components/solve/renderers/solve-answer-content'

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-2">
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60"
          style={{ animationDelay: `${dot * 0.15}s` }}
        />
      ))}
    </div>
  )
}

export default function ChatMessageBubble({ message }: { message: SolveChatMessage }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-primary-foreground">
          {message.image_url ? (
            <div className="mb-2 overflow-hidden rounded-xl">
              <Image
                src={message.image_url}
                alt="Uploaded question"
                width={480}
                height={360}
                className="h-auto w-full max-w-xs object-contain"
                unoptimized
              />
            </div>
          ) : message.file_name ? (
            <div className="mb-2 flex items-center gap-2 rounded-xl bg-primary-foreground/10 px-3 py-2">
              <Paperclip className="h-4 w-4 shrink-0" />
              <span className="truncate text-sm font-medium">{message.file_name}</span>
            </div>
          ) : null}
          {message.text ? <p className="whitespace-pre-wrap text-sm leading-6">{message.text}</p> : null}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className="w-full max-w-[85%] rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3">
        {message.status === 'pending' ? (
          <TypingIndicator />
        ) : message.status === 'failed' ? (
          <div className="flex gap-2 text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-sm">{message.error_message ?? "Couldn't solve this question."}</p>
          </div>
        ) : message.result ? (
          <SolveAnswerContent result={message.result} />
        ) : message.text ? (
          <p className="whitespace-pre-wrap text-sm leading-6 text-foreground/90">{message.text}</p>
        ) : null}
      </div>
    </div>
  )
}
