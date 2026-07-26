'use client'

import { useRef, useState, type ChangeEvent } from 'react'
import { File as FileIcon, FileText, Image as ImageIcon, LoaderCircle, Upload, X } from 'lucide-react'
import type { SolveSubjectCategory } from '@/lib/api/solve.service'

export type StartComposerAttachmentKind = 'image' | 'pdf' | 'document'

export type StartComposerSubmitPayload = {
  subjectHint: SolveSubjectCategory | 'auto'
  image?: File
  pdf?: File
  document?: File
  questionText?: string
}

interface StartComposerProps {
  onSubmit: (payload: StartComposerSubmitPayload) => void
  isSubmitting: boolean
  errorMessage: string
}

const subjectOptions: Array<{ id: SolveSubjectCategory | 'auto'; label: string }> = [
  { id: 'auto', label: 'Auto-detect' },
  { id: 'math', label: 'Math' },
  { id: 'science', label: 'Science' },
  { id: 'quantitative', label: 'Economics / Business' },
  { id: 'narrative', label: 'History / Language' },
]

export default function StartComposer({ onSubmit, isSubmitting, errorMessage }: StartComposerProps) {
  const [subjectHint, setSubjectHint] = useState<SolveSubjectCategory | 'auto'>('auto')
  const [attachment, setAttachment] = useState<{ kind: StartComposerAttachmentKind; file: File } | null>(null)
  const [questionText, setQuestionText] = useState('')

  const imageInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)

  const handleAttach = (kind: StartComposerAttachmentKind) => (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setAttachment({ kind, file })
    }
  }

  const clearAttachment = () => {
    setAttachment(null)
    if (imageInputRef.current) imageInputRef.current.value = ''
    if (pdfInputRef.current) pdfInputRef.current.value = ''
    if (docInputRef.current) docInputRef.current.value = ''
  }

  const canSubmit = Boolean(attachment) || questionText.trim().length >= 5

  const handleSubmit = () => {
    if (!canSubmit || isSubmitting) return

    onSubmit({
      subjectHint,
      image: attachment?.kind === 'image' ? attachment.file : undefined,
      pdf: attachment?.kind === 'pdf' ? attachment.file : undefined,
      document: attachment?.kind === 'document' ? attachment.file : undefined,
      questionText: questionText.trim() || undefined,
    })
  }

  return (
    <div className="mx-auto w-full max-w-2xl rounded-[28px] border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap gap-2">
        {subjectOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setSubjectHint(option.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              subjectHint === option.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background text-muted-foreground hover:border-primary/40'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {attachment ? (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/40 px-4 py-2.5">
          <span className="truncate text-sm font-medium text-foreground">{attachment.file.name}</span>
          <button
            type="button"
            onClick={clearAttachment}
            className="shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <textarea
        value={questionText}
        onChange={(event) => setQuestionText(event.target.value)}
        placeholder={
          attachment
            ? 'Add a question about this file (optional)...'
            : 'Type your question, or attach a photo/PDF/doc below...'
        }
        className="mb-3 h-24 w-full resize-none rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />

      {errorMessage ? <p className="mb-3 text-sm text-destructive">{errorMessage}</p> : null}

      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
          <input ref={imageInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleAttach('image')} />
          <input ref={pdfInputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleAttach('pdf')} />
          <input
            ref={docInputRef}
            type="file"
            accept=".doc,.docx,.txt,.md,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            className="hidden"
            onChange={handleAttach('document')}
          />

          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <ImageIcon className="h-3.5 w-3.5" />
            Photo
          </button>
          <button
            type="button"
            onClick={() => pdfInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <FileText className="h-3.5 w-3.5" />
            PDF
          </button>
          <button
            type="button"
            onClick={() => docInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <FileIcon className="h-3.5 w-3.5" />
            Docs
          </button>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-shadow hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none"
        >
          {isSubmitting ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Solving...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Solve
            </>
          )}
        </button>
      </div>
    </div>
  )
}
