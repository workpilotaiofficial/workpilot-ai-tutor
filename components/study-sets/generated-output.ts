'use client'

import type { StudySetGenerateType } from '@/lib/api/study-sets.service'
import { getTaskTypeLabel, toUiSectionType } from './generation-mapping'
import { getStoredStudySetById, normalizeStudySetPayload, persistStudySet, type StudySetSection } from './utils'

function ensureStudySet(documentId: string) {
  const existing = getStoredStudySetById(documentId)
  if (existing) {
    return existing
  }

  const fallbackStudySet = normalizeStudySetPayload({
    id: documentId,
    title: 'Untitled Study Set',
    summary: 'Generated study material is being prepared.',
    selections: [],
    sections: [],
    stats: {
      unfamiliar: 0,
      learning: 0,
      familiar: 0,
      mastered: 0,
    },
  })

  if (!fallbackStudySet) {
    throw new Error('Failed to initialize a study set shell for generated output.')
  }

  return fallbackStudySet
}

function countItems(sections: StudySetSection[]) {
  return sections.reduce((total, section) => total + (Array.isArray(section.items) ? section.items.length : 0), 0)
}

function extractMarkdownHeading(markdown: string) {
  const firstHeadingLine = markdown
    .replace(/\r\n/g, '\n')
    .split('\n')
    .find((line) => /^#\s+/.test(line.trim()))

  if (!firstHeadingLine) {
    return null
  }

  const heading = firstHeadingLine.replace(/^#\s+/, '').trim()
  return heading || null
}

function buildNotesMarkdownFromResponse(payload: any, title: string) {
  const directMarkdown =
    payload?.notes?.markdown_content ??
    payload?.notes?.plain_text_content ??
    payload?.notesMarkdown ??
    payload?.notes_markdown ??
    payload?.markdown ??
    payload?.content ??
    payload?.body ??
    payload?.notes?.markdown ??
    payload?.notes?.content ??
    payload?.note?.markdown ??
    payload?.note?.content

  if (typeof directMarkdown === 'string' && directMarkdown.trim()) {
    return directMarkdown.trim()
  }

  const sourceSections = Array.isArray(payload?.sections)
    ? payload.sections
    : Array.isArray(payload?.notes?.sections)
      ? payload.notes.sections
      : Array.isArray(payload?.note?.sections)
        ? payload.note.sections
        : []

  const markdownLines: string[] = [`# ${title}`, '', '> Generated notes are ready to review.']

  for (const section of sourceSections) {
    if (!section || typeof section !== 'object') {
      continue
    }

    const heading =
      typeof section.heading === 'string' && section.heading.trim()
        ? section.heading.trim()
        : typeof section.title === 'string' && section.title.trim()
          ? section.title.trim()
          : null

    if (heading) {
      markdownLines.push('', `## ${heading}`)
    }

    if (typeof section.body === 'string' && section.body.trim()) {
      markdownLines.push('', section.body.trim())
    }

    const paragraphs = Array.isArray(section.paragraphs)
      ? section.paragraphs.filter((paragraph: unknown): paragraph is string => typeof paragraph === 'string' && paragraph.trim().length > 0)
      : []

    for (const paragraph of paragraphs) {
      markdownLines.push('', paragraph.trim())
    }
  }

  return markdownLines.join('\n').trim()
}

function normalizeNotesSection(payload: any, title: string): { section: StudySetSection; notesMarkdown: string } {
  const notesMarkdown = buildNotesMarkdownFromResponse(payload, title)

  return {
    section: {
      type: 'notes',
      label: 'Notes',
      items: [],
      format: 'markdown',
      content: notesMarkdown,
    },
    notesMarkdown,
  }
}

function normalizeTutorLessonSection(payload: any): StudySetSection {
  const sourceSections = Array.isArray(payload?.tutor_lesson?.sections) ? payload.tutor_lesson.sections : []

  return {
    type: 'tutorLesson',
    label: 'Tutor Lesson',
    items: sourceSections.map((section: any, index: number) => {
      const comprehensionQuestion = Array.isArray(section?.comprehension_questions)
        ? section.comprehension_questions.find(
            (item: any) => item && typeof item === 'object' && typeof item.question === 'string'
          )
        : null

      const bodySegments = [
        typeof section?.body === 'string' ? section.body : '',
        ...(Array.isArray(section?.solution_steps)
          ? section.solution_steps.filter((step: unknown): step is string => typeof step === 'string' && step.trim().length > 0)
          : []),
        typeof section?.answer === 'string' ? section.answer : '',
      ].filter((value) => typeof value === 'string' && value.trim().length > 0)

      return {
        prompt:
          (typeof section?.heading === 'string' && section.heading.trim()) ||
          (typeof section?.problem_statement === 'string' && section.problem_statement.trim()) ||
          `Lesson ${index + 1}`,
        response: bodySegments.join('\n\n') || 'Generated tutor lesson content is available.',
        followUp:
          comprehensionQuestion && typeof comprehensionQuestion.question === 'string'
            ? comprehensionQuestion.question
            : undefined,
      }
    }),
  }
}

function normalizeMultipleChoiceSection(payload: any): StudySetSection {
  const questions = Array.isArray(payload?.questions) ? payload.questions : []

  return {
    type: 'multipleChoice',
    label: 'Multiple Choice',
    items: questions.map((question: any) => {
      const options = Array.isArray(question?.options) ? question.options : []
      const matchingOption = options.find((option: any) => option?.id === question?.correct_option_id)

      return {
        question: question?.question_text ?? 'Question unavailable',
        options: options.map((option: any) => option?.text ?? '').filter(Boolean),
        answer: typeof matchingOption?.text === 'string' ? matchingOption.text : null,
        explanation: typeof question?.explanation === 'string' ? question.explanation : null,
      }
    }),
  }
}

function normalizeFlashcardsSection(payload: any): StudySetSection {
  const cards = Array.isArray(payload?.cards) ? payload.cards : []

  return {
    type: 'flashcards',
    label: 'Flashcards',
    items: cards.map((card: any) => ({
      prompt: card?.term ?? 'Card',
      answer: card?.definition ?? '',
    })),
  }
}

function normalizeFillInTheBlanksSection(payload: any): StudySetSection {
  const questions = Array.isArray(payload?.questions) ? payload.questions : []

  return {
    type: 'fillInTheBlanks',
    label: 'Fill in the Blanks',
    items: questions.map((question: any) => {
      const firstBlank =
        Array.isArray(question?.blanks) && question.blanks.length > 0 ? question.blanks[0] : null

      return {
        sentence: question?.display_sentence ?? question?.full_sentence ?? 'Generated blank question',
        answer: typeof firstBlank?.answer === 'string' ? firstBlank.answer : '',
        explanation: typeof firstBlank?.hint === 'string' ? firstBlank.hint : null,
      }
    }),
  }
}

function normalizeWrittenTestSection(payload: any): StudySetSection {
  const questions = Array.isArray(payload?.questions) ? payload.questions : []

  return {
    type: 'writtenTests',
    label: 'Written Tests',
    items: questions.map((question: any) => ({
      prompt: question?.question_text ?? 'Generated written question',
      idealResponse: typeof question?.model_answer === 'string' ? question.model_answer : null,
      rubric: Array.isArray(question?.key_points)
        ? question.key_points.filter((point: unknown): point is string => typeof point === 'string' && point.trim().length > 0)
        : [],
    })),
  }
}

function normalizePodcastSection(payload: any): StudySetSection {
  const podcast = payload?.podcast && typeof payload.podcast === 'object' ? payload.podcast : {}
  const talkingPoints = Array.isArray(podcast?.talking_points)
    ? podcast.talking_points.filter((point: unknown): point is string => typeof point === 'string' && point.trim().length > 0)
    : Array.isArray(podcast?.segments)
      ? podcast.segments
          .map((segment: any) =>
            typeof segment?.title === 'string' && segment.title.trim()
              ? segment.title.trim()
              : typeof segment?.body === 'string'
                ? segment.body.trim()
                : ''
          )
          .filter(Boolean)
      : []

  return {
    type: 'podcast',
    label: 'Podcast',
    items: [
      {
        title: typeof podcast?.title === 'string' && podcast.title.trim() ? podcast.title.trim() : 'Podcast',
        duration:
          typeof podcast?.estimated_duration_minutes === 'number'
            ? `${podcast.estimated_duration_minutes} minutes`
            : typeof podcast?.duration === 'string'
              ? podcast.duration
              : undefined,
        talkingPoints,
      },
    ],
  }
}

function buildSectionFromGeneratedOutput(taskType: StudySetGenerateType, payload: any, title: string) {
  switch (taskType) {
    case 'notes':
      return normalizeNotesSection(payload, title)
    case 'tutor_lesson':
      return { section: normalizeTutorLessonSection(payload) }
    case 'multiple_choice':
    case 'quiz':
      return { section: normalizeMultipleChoiceSection(payload) }
    case 'flashcards':
      return { section: normalizeFlashcardsSection(payload) }
    case 'fill_in_blanks':
      return { section: normalizeFillInTheBlanksSection(payload) }
    case 'written_test':
      return { section: normalizeWrittenTestSection(payload) }
    case 'podcast':
      return { section: normalizePodcastSection(payload) }
    default:
      throw new Error(`Unsupported generated output type: ${taskType}`)
  }
}

export function mergeGeneratedOutputIntoStudySet(
  documentId: string,
  taskType: StudySetGenerateType,
  payload: unknown
) {
  const uiSectionType = toUiSectionType(taskType)

  if (!uiSectionType) {
    return null
  }

  const currentStudySet = ensureStudySet(documentId)
  const notesMarkdown =
    taskType === 'notes' ? buildNotesMarkdownFromResponse(payload as any, currentStudySet.title) : null
  const nextTitle =
    (typeof (payload as any)?.title === 'string' && (payload as any).title.trim()) ||
    (typeof (payload as any)?.tutor_lesson?.title === 'string' && (payload as any).tutor_lesson.title.trim()) ||
    (notesMarkdown ? extractMarkdownHeading(notesMarkdown) : null) ||
    currentStudySet.title

  const normalizedOutput = buildSectionFromGeneratedOutput(taskType, payload, nextTitle)
  const nextSections = [...currentStudySet.sections]
  const targetIndex = nextSections.findIndex((section) => section.type === uiSectionType)

  if (targetIndex >= 0) {
    nextSections[targetIndex] = normalizedOutput.section
  } else {
    nextSections.push(normalizedOutput.section)
  }

  const nextSelections = currentStudySet.selections.includes(uiSectionType)
    ? currentStudySet.selections
    : [...currentStudySet.selections, uiSectionType]

  const nextStudySet = {
    ...currentStudySet,
    title: nextTitle,
    summary: `Generated ${getTaskTypeLabel(taskType)} is ready.`,
    selections: nextSelections,
    sections: nextSections,
    items: countItems(nextSections),
    notesMarkdown: normalizedOutput.notesMarkdown ?? currentStudySet.notesMarkdown,
    notesHtml: uiSectionType === 'notes' ? undefined : currentStudySet.notesHtml,
    updatedAt: new Date().toISOString(),
  }

  persistStudySet(nextStudySet)
  return nextStudySet
}
