import { normalizeStudySetPayload, type StudySet, type StudySetSection } from './utils'

type OutputType =
  | 'notes'
  | 'multipleChoice'
  | 'flashcards'
  | 'podcast'
  | 'tutorLesson'
  | 'writtenTests'
  | 'fillInTheBlanks'

type CreateUploadPlaceholderStudySetParams = {
  documentId: string
  title: string
  selections: string[]
  sourceType: 'text' | 'pdf'
  sourceText?: string
  createdAt?: string
  updatedAt?: string
}

const fallbackSelections: OutputType[] = ['notes', 'multipleChoice', 'flashcards']

const sectionLabels: Record<OutputType, string> = {
  notes: 'Notes',
  multipleChoice: 'Multiple Choice',
  flashcards: 'Flashcards',
  podcast: 'Podcast',
  tutorLesson: 'Tutor Lesson',
  writtenTests: 'Written Tests',
  fillInTheBlanks: 'Fill in the Blanks',
}

function normalizeSelections(values: string[]) {
  const normalized = values.filter((value): value is OutputType =>
    Object.prototype.hasOwnProperty.call(sectionLabels, value),
  )

  return normalized.length > 0 ? normalized : fallbackSelections
}

function createNotesMarkdown(title: string, sourceType: 'text' | 'pdf', sourceText?: string) {
  const intro =
    typeof sourceText === 'string' && sourceText.trim()
      ? sourceText.trim().slice(0, 220)
      : sourceType === 'pdf'
        ? 'Your PDF has been uploaded successfully. The next backend processing steps will populate the final study materials.'
        : 'Your text has been uploaded successfully. The next backend processing steps will populate the final study materials.'

  return [
    `# ${title}`,
    '',
    '> Your upload is saved and ready for the next processing step.',
    '',
    intro,
    '',
    '## What Happens Next',
    '',
    'The upload step is complete. Additional backend APIs will populate richer study material in the next phase.',
    '',
    '## Current Workspace',
    '',
    'This placeholder keeps the study set flow and UI intact so you can continue through the same screens for now.',
    '',
    '## Key Takeaway',
    '',
    'Upload successful. Document id and embedding job metadata have been stored locally for the next integration step.',
  ].join('\n')
}

function createSectionItems(type: OutputType, title: string) {
  switch (type) {
    case 'multipleChoice':
      return [
        {
          question: `What is the current state of "${title}"?`,
          options: [
            'The upload step is complete',
            'The upload has failed',
            'The study set was deleted',
            'The backend is fully finished',
          ],
          answer: 'The upload step is complete',
          explanation: 'This phase only integrates the initial upload/create API step.',
        },
        {
          question: 'What was stored locally after the upload response?',
          options: [
            'Only the title',
            'Document id and embedding job id',
            'Nothing was stored',
            'Only generated quiz scores',
          ],
          answer: 'Document id and embedding job id',
          explanation: 'The backend response metadata is stored for the next API integration steps.',
        },
        {
          question: 'What remains unchanged in this phase?',
          options: [
            'The upload API contract',
            'The current study-set UI flow',
            'The auth session format',
            'The backend response shape',
          ],
          answer: 'The current study-set UI flow',
          explanation: 'Only the first upload/create step was switched to real backend APIs.',
        },
      ]
    case 'flashcards':
      return [
        {
          prompt: 'What completes in Phase 1?',
          answer: 'Only the first upload/create API step.',
        },
        {
          prompt: 'Which identifiers are stored locally?',
          answer: 'The backend document id and embedding job id.',
        },
        {
          prompt: 'What stays the same after upload?',
          answer: 'The downstream study-set UI flow.',
        },
      ]
    case 'podcast':
      return [
        {
          title: 'Upload Complete',
          duration: '02:00',
          talkingPoints: [
            'The file or text has been sent to the real backend upload API.',
            'The backend document metadata is now available locally.',
            'Future processing APIs will fill in the final study material.',
          ],
        },
      ]
    case 'tutorLesson':
      return [
        {
          prompt: 'What has already happened after the upload?',
          response:
            'The upload request succeeded, and the response metadata was stored locally for the next backend steps.',
          followUp: 'Which two response values are important for the next phase?',
        },
        {
          prompt: 'Why does the UI still look the same?',
          response:
            'This phase intentionally keeps the downstream study-set experience unchanged while only replacing the initial upload step.',
        },
      ]
    case 'writtenTests':
      return [
        {
          prompt: 'Explain what Phase 1 changes in the study-set flow.',
          idealResponse:
            'Phase 1 replaces only the upload/create step with real backend APIs and stores the returned document id plus embedding job id locally.',
          rubric: [
            'Mentions real backend upload APIs',
            'Mentions document id storage',
            'Mentions embedding job id storage',
            'Notes that downstream UI remains unchanged',
          ],
        },
      ]
    case 'fillInTheBlanks':
      return [
        {
          sentence: 'After upload, the backend _____ id is stored locally.',
          answer: 'document',
          explanation: 'The document id comes from the upload response payload.',
        },
        {
          sentence: 'Phase 1 keeps the downstream study-set _____ unchanged.',
          answer: 'ui flow',
          explanation: 'Only the initial upload step changes in this phase.',
        },
      ]
    case 'notes':
      return []
  }
}

function buildSections(title: string, selections: OutputType[], sourceType: 'text' | 'pdf', sourceText?: string) {
  return selections.map<StudySetSection>((selection) => {
    if (selection === 'notes') {
      return {
        type: 'notes',
        label: sectionLabels.notes,
        items: [],
        format: 'markdown',
        content: createNotesMarkdown(title, sourceType, sourceText),
      }
    }

    return {
      type: selection,
      label: sectionLabels[selection],
      items: createSectionItems(selection, title),
    }
  })
}

function countItems(sections: StudySetSection[]) {
  return sections.reduce((total, section) => total + (Array.isArray(section.items) ? section.items.length : 0), 0)
}

export function createUploadPlaceholderStudySet(params: CreateUploadPlaceholderStudySetParams): StudySet {
  const selections = normalizeSelections(params.selections)
  const sections = buildSections(params.title, selections, params.sourceType, params.sourceText)

  const studySet = normalizeStudySetPayload({
    id: params.documentId,
    title: params.title,
    summary: 'Upload complete. The next backend integration step will populate final study materials.',
    items: countItems(sections),
    selections,
    sections,
    sourceText: params.sourceText,
    notesMarkdown: createNotesMarkdown(params.title, params.sourceType, params.sourceText),
    createdAt: params.createdAt ?? new Date().toISOString(),
    updatedAt: params.updatedAt ?? new Date().toISOString(),
    stats: {
      unfamiliar: 0,
      learning: 0,
      familiar: 0,
      mastered: 0,
    },
  })

  if (!studySet) {
    throw new Error('Failed to create a local study set placeholder from upload metadata.')
  }

  return studySet
}
