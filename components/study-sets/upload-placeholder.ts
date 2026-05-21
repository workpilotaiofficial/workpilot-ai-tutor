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
  void title
  void type
  return []
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
    summary: 'Generation in progress. Study materials will appear as each section becomes ready.',
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
    generation: {
      status: 'generating',
      total: selections.length,
      completed: 0,
      failed: 0,
      updatedAt: new Date().toISOString(),
    },
  })

  if (!studySet) {
    throw new Error('Failed to create a local study set placeholder from upload metadata.')
  }

  return studySet
}
