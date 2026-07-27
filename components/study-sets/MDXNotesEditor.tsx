'use client'

import dynamic from 'next/dynamic'
import {
  forwardRef,
  useImperativeHandle,
  useRef,
} from 'react'
import type { MDXEditorMethods } from '@mdxeditor/editor'
import type { InitializedMDXNotesEditorProps } from './InitializedMDXNotesEditor'

export type NotesEditorError = {
  error: string
  source: string
}

export type MDXNotesEditorProps = {
  markdown: string
  baselineMarkdown: string
  readOnly?: boolean
  onChange: (markdown: string) => void
  onBlur?: () => void
  onError?: (error: NotesEditorError) => void
}

export type MDXNotesEditorRef = {
  getMarkdown(): string
  setMarkdown(markdown: string): void
  insertMarkdown(markdown: string): void
  focus(): void
}

const ClientEditor = dynamic<InitializedMDXNotesEditorProps>(
  () => import('./InitializedMDXNotesEditor'),
  {
    ssr: false,
    loading: () => (
      <div
        className="mx-auto min-h-[700px] w-full max-w-[820px] animate-pulse px-5 py-12 text-sm text-muted-foreground"
        role="status"
      >
        Loading notes editor…
      </div>
    ),
  },
)

export const MDXNotesEditor = forwardRef<
  MDXNotesEditorRef,
  MDXNotesEditorProps
>(function MDXNotesEditor(
  {
    markdown,
    baselineMarkdown,
    readOnly = false,
    onChange,
    onBlur,
    onError,
  },
  ref,
) {
  const editorRef = useRef<MDXEditorMethods>(null)

  useImperativeHandle(
    ref,
    () => ({
      getMarkdown: () => editorRef.current?.getMarkdown() ?? '',
      setMarkdown: (value) => editorRef.current?.setMarkdown(value),
      insertMarkdown: (value) => editorRef.current?.insertMarkdown(value),
      focus: () => editorRef.current?.focus(),
    }),
    [],
  )

  return (
    <ClientEditor
      editorRef={editorRef}
      markdown={markdown}
      baselineMarkdown={baselineMarkdown}
      readOnly={readOnly}
      spellCheck
      trim={false}
      className="neurova-mdx-editor"
      contentEditableClassName="neurova-mdx-content"
      placeholder="Start writing your notes…"
      onBlur={onBlur}
      onError={onError}
      onChange={(value, initialMarkdownNormalize) => {
        if (!initialMarkdownNormalize) onChange(value)
      }}
    />
  )
})

