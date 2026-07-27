'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import type { JSONContent } from '@tiptap/core'
import {
  fetchStudySetNotes,
  updateStudySetNotes,
} from '@/lib/api/study-sets.service'
import { getApiClientErrorMessage } from '@/lib/api/client'
import { NotesEditor, type NotesEditorContent } from './NotesEditor'
import { MDXNotesEditor, type NotesEditorError } from './MDXNotesEditor'
import { markdownToPlainText } from './notes-content'

type SaveState = 'saved' | 'unsaved' | 'saving' | 'error'

type PendingSave = {
  revision: number
  markdown: string
  plainText: string
  richTextContent?: Record<string, unknown>
}

type LoadedNotesDocument = {
  mode: 'mdx' | 'tiptap'
  markdown: string
  baselineMarkdown: string
  legacyHtml?: string
  legacyJSON?: Record<string, unknown> | null
}

type StoredNotesDraft = {
  studySetId: string
  markdown: string
  updatedAt: number
}

type NotesWorkspaceProps = {
  studySetId: string
  fallbackMarkdown?: string
  fallbackHtml?: string
  onSaved?: (markdown: string, updatedAt: string | null) => void
}

const DRAFT_STORAGE_PREFIX = 'neurova-notes-draft:'
const TAB_CHANNEL_NAME = 'neurova-notes-editors'

function getDraftStorageKey(studySetId: string) {
  return `${DRAFT_STORAGE_PREFIX}${studySetId}`
}

function readDraft(studySetId: string): StoredNotesDraft | null {
  try {
    const raw = window.localStorage.getItem(getDraftStorageKey(studySetId))
    if (!raw) return null
    const value = JSON.parse(raw) as Partial<StoredNotesDraft>

    if (
      value.studySetId !== studySetId ||
      typeof value.markdown !== 'string' ||
      typeof value.updatedAt !== 'number'
    ) {
      return null
    }

    return value as StoredNotesDraft
  } catch {
    return null
  }
}

function writeDraft(studySetId: string, markdown: string) {
  try {
    window.localStorage.setItem(
      getDraftStorageKey(studySetId),
      JSON.stringify({
        studySetId,
        markdown,
        updatedAt: Date.now(),
      } satisfies StoredNotesDraft),
    )
  } catch {
    // The API save remains the source of truth when storage is unavailable.
  }
}

function clearDraft(studySetId: string, expectedMarkdown?: string) {
  try {
    if (expectedMarkdown !== undefined) {
      const current = readDraft(studySetId)
      if (current && current.markdown !== expectedMarkdown) return
    }
    window.localStorage.removeItem(getDraftStorageKey(studySetId))
  } catch {
    // Ignore unavailable storage.
  }
}

function useNotesTabLock(studySetId: string, enabled: boolean) {
  const [lockOwner, setLockOwner] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || typeof BroadcastChannel === 'undefined') return

    const channel = new BroadcastChannel(TAB_CHANNEL_NAME)
    const instanceId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`
    const openedAt = Date.now()

    type ChannelMessage = {
      type: 'hello' | 'presence' | 'close'
      studySetId: string
      instanceId: string
      openedAt: number
    }

    const send = (type: ChannelMessage['type']) => {
      channel.postMessage({ type, studySetId, instanceId, openedAt } satisfies ChannelMessage)
    }

    const isEarlierEditor = (message: ChannelMessage) =>
      message.openedAt < openedAt ||
      (message.openedAt === openedAt && message.instanceId < instanceId)

    channel.onmessage = (event: MessageEvent<ChannelMessage>) => {
      const message = event.data
      if (
        !message ||
        message.studySetId !== studySetId ||
        message.instanceId === instanceId
      ) {
        return
      }

      if (message.type === 'close') {
        setLockOwner((current) => (current === message.instanceId ? null : current))
        return
      }

      if (isEarlierEditor(message)) {
        setLockOwner(message.instanceId)
      } else if (message.type === 'hello') {
        send('presence')
      }
    }

    send('hello')

    return () => {
      send('close')
      channel.close()
    }
  }, [enabled, studySetId])

  return lockOwner
}

export function NotesWorkspace({
  studySetId,
  fallbackMarkdown = '',
  fallbackHtml,
  onSaved,
}: NotesWorkspaceProps) {
  const [document, setDocument] = useState<LoadedNotesDocument | null>(null)
  const [loadWarning, setLoadWarning] = useState('')
  const [parserError, setParserError] = useState<NotesEditorError | null>(null)
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const [saveError, setSaveError] = useState('')
  const fallbackMarkdownRef = useRef(fallbackMarkdown)
  const fallbackHtmlRef = useRef(fallbackHtml)
  const onSavedRef = useRef(onSaved)
  const pendingSaveRef = useRef<PendingSave | null>(null)
  const lastSavedRevisionRef = useRef(0)
  const revisionRef = useRef(0)
  const savePromiseRef = useRef<Promise<void> | null>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const draftTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    onSavedRef.current = onSaved
  }, [onSaved])

  const drainSaves = useCallback(() => {
    if (savePromiseRef.current) return savePromiseRef.current

    const savePromise = (async () => {
      while (true) {
        const snapshot = pendingSaveRef.current
        if (!snapshot || snapshot.revision <= lastSavedRevisionRef.current) break

        setSaveState('saving')
        setSaveError('')

        try {
          const response = await updateStudySetNotes(studySetId, {
            markdownContent: snapshot.markdown,
            plainTextContent: snapshot.plainText,
            ...(snapshot.richTextContent
              ? { richTextContent: snapshot.richTextContent }
              : {}),
            changeDescription: 'User edited study notes',
          })

          lastSavedRevisionRef.current = snapshot.revision
          onSavedRef.current?.(
            response.notes.markdownContent ?? snapshot.markdown,
            response.notes.updatedAt,
          )

          if (pendingSaveRef.current?.revision === snapshot.revision) {
            pendingSaveRef.current = null
            clearDraft(studySetId, snapshot.markdown)
            setSaveState('saved')
          }
        } catch (error) {
          setSaveState('error')
          setSaveError(
            getApiClientErrorMessage(
              error,
              'Your latest edits are safe on this device but could not be synced.',
            ),
          )
          break
        }
      }
    })().finally(() => {
      savePromiseRef.current = null
    })

    savePromiseRef.current = savePromise
    return savePromise
  }, [studySetId])

  const flushSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }
    void drainSaves()
  }, [drainSaves])

  const queueSave = useCallback(
    (content: Omit<PendingSave, 'revision'>) => {
      const revision = revisionRef.current + 1
      revisionRef.current = revision
      pendingSaveRef.current = { ...content, revision }
      setSaveState('unsaved')
      setSaveError('')

      if (draftTimeoutRef.current) clearTimeout(draftTimeoutRef.current)
      draftTimeoutRef.current = setTimeout(() => {
        writeDraft(studySetId, content.markdown)
      }, 250)

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(() => {
        saveTimeoutRef.current = null
        void drainSaves()
      }, 1000)
    },
    [drainSaves, studySetId],
  )

  useEffect(() => {
    let cancelled = false
    const forceTipTap = process.env.NEXT_PUBLIC_NOTES_EDITOR === 'tiptap'

    const loadNotes = async () => {
      let markdown = fallbackMarkdownRef.current
      let updatedAt: string | null = null
      let legacyJSON: Record<string, unknown> | null = null
      let isUserEdited = false

      try {
        const response = await fetchStudySetNotes(studySetId)
        markdown =
          response.notes.markdownContent ??
          response.notes.plainTextContent ??
          fallbackMarkdownRef.current
        updatedAt = response.notes.updatedAt
        legacyJSON = response.notes.richTextContent
        isUserEdited = response.notes.isUserEdited
      } catch (error) {
        if (cancelled) return
        setLoadWarning(
          getApiClientErrorMessage(
            error,
            'The latest server copy could not be loaded. Showing the available generated notes.',
          ),
        )
      }

      if (cancelled) return

      if (!forceTipTap && isUserEdited && legacyJSON) {
        try {
          const { convertLegacyTipTapToMarkdown } = await import(
            './legacy-notes-migration'
          )
          const migrated = await convertLegacyTipTapToMarkdown(legacyJSON)
          const response = await updateStudySetNotes(studySetId, {
            markdownContent: migrated.markdown,
            plainTextContent: migrated.plainText,
            richTextContent: null,
            changeDescription: 'Migrated study notes to canonical Markdown',
          })
          markdown = response.notes.markdownContent ?? migrated.markdown
          updatedAt = response.notes.updatedAt ?? updatedAt
          legacyJSON = null
        } catch (error) {
          if (cancelled) return
          setLoadWarning(
            'This note contains legacy formatting that could not be migrated safely. It remains editable in the compatibility editor.',
          )
          setDocument({
            mode: 'tiptap',
            markdown,
            baselineMarkdown: markdown,
            legacyHtml: fallbackHtmlRef.current,
            legacyJSON,
          })
          return
        }
      }

      const draft = readDraft(studySetId)
      const serverUpdatedAt = updatedAt ? new Date(updatedAt).getTime() : 0
      if (
        !forceTipTap &&
        draft &&
        draft.markdown !== markdown &&
        (!serverUpdatedAt || draft.updatedAt > serverUpdatedAt)
      ) {
        if (
          window.confirm(
            'A newer unsaved notes draft was found on this device. Restore it?',
          )
        ) {
          markdown = draft.markdown
          queueSave({
            markdown,
            plainText: markdownToPlainText(markdown),
          })
        } else {
          clearDraft(studySetId)
        }
      }

      if (!cancelled) {
        setDocument({
          mode: forceTipTap ? 'tiptap' : 'mdx',
          markdown,
          baselineMarkdown: markdown,
          legacyHtml: fallbackHtmlRef.current,
          legacyJSON,
        })
      }
    }

    void loadNotes()
    return () => {
      cancelled = true
    }
  }, [queueSave, studySetId])

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!pendingSaveRef.current) return
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      if (draftTimeoutRef.current) {
        clearTimeout(draftTimeoutRef.current)
        const pending = pendingSaveRef.current
        if (pending) writeDraft(studySetId, pending.markdown)
      }
      if (pendingSaveRef.current) void drainSaves()
    }
  }, [drainSaves, studySetId])

  const lockOwner = useNotesTabLock(studySetId, Boolean(document))
  const isLockedByAnotherTab = Boolean(lockOwner)

  const handleLegacyChange = (content: NotesEditorContent) => {
    queueSave({
      markdown: content.markdown,
      plainText: content.plainText,
      richTextContent: content.json as Record<string, unknown>,
    })
  }

  const handleMdxChange = (markdown: string) => {
    setParserError(null)
    queueSave({
      markdown,
      plainText: markdownToPlainText(markdown),
    })
  }

  if (!document) {
    return (
      <div
        className="mx-auto min-h-[700px] w-full max-w-[820px] animate-pulse px-5 py-12 text-sm text-muted-foreground"
        role="status"
      >
        Loading your notes…
      </div>
    )
  }

  const statusLabel =
    saveState === 'saving'
      ? 'Saving…'
      : saveState === 'unsaved'
        ? 'Unsaved'
        : saveState === 'error'
          ? 'Save failed'
          : 'Saved'

  return (
    <div className="relative min-h-full">
      <div className="sticky top-2 z-30 mx-3 flex flex-col gap-2 sm:mx-5">
        <div className="ml-auto flex items-center gap-2 rounded-full border border-border bg-card/95 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
          <span
            className={`h-2 w-2 rounded-full ${
              saveState === 'error'
                ? 'bg-destructive'
                : saveState === 'saved'
                  ? 'bg-emerald-500'
                  : 'bg-amber-500'
            }`}
          />
          {statusLabel}
          {saveState === 'error' ? (
            <button
              type="button"
              className="font-semibold text-primary hover:underline"
              onClick={flushSave}
            >
              Retry
            </button>
          ) : null}
        </div>

        {loadWarning ? (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs text-amber-900">
            {loadWarning}
          </div>
        ) : null}

        {saveError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2 text-xs text-destructive">
            {saveError}
          </div>
        ) : null}

        {isLockedByAnotherTab ? (
          <div className="rounded-xl border border-blue-300 bg-blue-50 px-4 py-2 text-xs text-blue-900">
            These notes are open in an earlier tab. This copy is read-only to prevent conflicting saves.
          </div>
        ) : null}

        {parserError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2 text-xs text-destructive">
            Rich-text parsing failed: {parserError.error}. Use Source mode to repair the Markdown.
          </div>
        ) : null}
      </div>

      {document.mode === 'mdx' ? (
        <MDXNotesEditor
          markdown={document.markdown}
          baselineMarkdown={document.baselineMarkdown}
          readOnly={isLockedByAnotherTab}
          onChange={handleMdxChange}
          onBlur={flushSave}
          onError={setParserError}
        />
      ) : (
        <NotesEditor
          initialJSON={document.legacyJSON as JSONContent | null}
          value={document.legacyJSON ? undefined : document.legacyHtml}
          notesMarkdown={document.markdown}
          editable={!isLockedByAnotherTab}
          onContentChange={handleLegacyChange}
        />
      )}
    </div>
  )
}

