import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { forwardRef } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchStudySetNotes,
  updateStudySetNotes,
} from '@/lib/api/study-sets.service'
import { NotesWorkspace } from './NotesWorkspace'

vi.mock('@/lib/api/study-sets.service', () => ({
  fetchStudySetNotes: vi.fn(),
  updateStudySetNotes: vi.fn(),
}))

vi.mock('@/lib/api/client', () => ({
  getApiClientErrorMessage: (_error: unknown, fallback: string) => fallback,
}))

vi.mock('./MDXNotesEditor', () => ({
  MDXNotesEditor: forwardRef(function FakeMDXEditor(
    props: {
      markdown: string
      onChange: (markdown: string) => void
      onBlur?: () => void
      readOnly?: boolean
    },
    _ref,
  ) {
    return (
      <textarea
        aria-label="MDX notes"
        defaultValue={props.markdown}
        disabled={props.readOnly}
        onBlur={props.onBlur}
        onChange={(event) => props.onChange(event.target.value)}
      />
    )
  }),
}))

vi.mock('./NotesEditor', () => ({
  NotesEditor: () => <div>Legacy notes editor</div>,
}))

const mockedFetchNotes = vi.mocked(fetchStudySetNotes)
const mockedUpdateNotes = vi.mocked(updateStudySetNotes)

describe('NotesWorkspace autosave', () => {
  beforeEach(() => {
    window.localStorage.clear()
    mockedFetchNotes.mockResolvedValue({
      studySetId: 'set-1',
      notes: {
        id: 'note-1',
        generationStatus: 'completed',
        isUserEdited: false,
        richTextContent: null,
        markdownContent: '# Initial',
        plainTextContent: 'Initial',
        updatedAt: '2026-07-27T00:00:00.000Z',
      },
    })
    mockedUpdateNotes.mockResolvedValue({
      studySetId: 'set-1',
      notes: {
        id: 'note-1',
        generationStatus: 'completed',
        isUserEdited: true,
        richTextContent: null,
        markdownContent: '# Updated',
        plainTextContent: 'Updated',
        updatedAt: '2026-07-27T00:00:01.000Z',
      },
    })
  })

  it('coalesces typing and persists canonical Markdown after the debounce', async () => {
    vi.useFakeTimers()
    render(<NotesWorkspace studySetId="set-1" fallbackMarkdown="# Fallback" />)

    await act(async () => {
      await Promise.resolve()
    })
    const editor = await screen.findByLabelText('MDX notes')

    fireEvent.change(editor, { target: { value: '# First edit' } })
    fireEvent.change(editor, { target: { value: '# Updated' } })

    expect(screen.getByText('Unsaved')).toBeInTheDocument()
    expect(mockedUpdateNotes).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(1000)
      await Promise.resolve()
    })

    await waitFor(() => expect(mockedUpdateNotes).toHaveBeenCalledTimes(1))
    expect(mockedUpdateNotes).toHaveBeenCalledWith('set-1', {
      markdownContent: '# Updated',
      plainTextContent: 'Updated',
      changeDescription: 'User edited study notes',
    })
    expect(await screen.findByText('Saved')).toBeInTheDocument()
    vi.useRealTimers()
  })
})

