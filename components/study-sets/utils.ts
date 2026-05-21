'use client'

export type StudySetSection = {
  type: string
  label: string
  items: any[]
  format?: string
  content?: string
}

export type StudySetNoteSection = {
  id: string
  title: string
  lead: string
  paragraphs: string[]
  callout?: string
  highlights: string[]
}

export type StudySetNoteDocument = {
  title: string
  subtitle: string
  introduction: string
  sections: StudySetNoteSection[]
  closing: string
}

export type StudySet = {
  id: string
  title: string
  items: number
  summary: string
  selections: string[]
  sections: StudySetSection[]
  sourceText?: string
  notesMarkdown?: string
  notesHtml?: string
  updatedAt?: string
  createdAt?: string
  stats: {
    unfamiliar: number
    learning: number
    familiar: number
    mastered: number
  }
}

export type StudySetPreview = Pick<StudySet, 'id' | 'title' | 'items' | 'stats'>

const STORAGE_KEY = 'Tutora-ai-study-sets'

const defaultStats = {
  unfamiliar: 0,
  learning: 0,
  familiar: 0,
  mastered: 0,
}

const defaultSections: StudySetSection[] = [
  {
    type: 'notes',
    label: 'Notes',
    items: ['Review your upload and highlight the most important takeaways.'],
    format: 'markdown',
    content:
      '# Learning Notes\n\n> A clear and readable explanation based on your uploaded material.\n\nThese notes organize the uploaded material into a clear explanation that is easier to review later.\n\n## Key Idea\n\nStart by identifying the central idea of the material.\n\n## Key Takeaway\n\nReturn to these notes after practice questions or flashcards to reinforce the story behind the facts.',
  },
]

const defaultNoteDocument: StudySetNoteDocument = {
  title: 'Learning Notes',
  subtitle: 'A clear and readable explanation based on your uploaded material.',
  introduction:
    'These notes organize the uploaded material into a clear explanation that is easier to review later.',
  sections: [
    {
      id: 'key-idea',
      title: 'Key Idea',
      lead: 'Start by identifying the central idea of the material.',
      paragraphs: [
        'Look for the main claim, theme, or process the source keeps returning to.',
        'Once the core idea is clear, supporting details become easier to organize and remember.',
      ],
      callout: 'Strong notes make the big idea easy to understand before diving into details.',
      highlights: ['Main idea', 'Supporting detail', 'Summary'],
    },
  ],
  closing:
    'Return to these notes after practice questions or flashcards to reinforce the story behind the facts.',
}

function generateFallbackId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2)
}

function parseSections(input: any): StudySetSection[] {
  if (!Array.isArray(input)) {
    return defaultSections
  }

  return input
    .map((section) => {
      if (!section || typeof section !== 'object') return null
      const type = String(section.type ?? section.id ?? 'notes')
      const items = Array.isArray(section.items) ? section.items : []
      const content =
        typeof section.content === 'string' && section.content.trim()
          ? section.content.trim()
          : typeof section.markdown === 'string' && section.markdown.trim()
            ? section.markdown.trim()
            : undefined

      return {
        type,
        label: String(section.label ?? section.type ?? 'Notes'),
        items,
        format:
          typeof section.format === 'string' && section.format.trim()
            ? section.format.trim()
            : content
              ? 'markdown'
              : undefined,
        content,
      }
    })
    .filter(Boolean) as StudySetSection[]
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function coerceStringArray(input: unknown) {
  if (!Array.isArray(input)) {
    return []
  }

  return input
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter(Boolean)
}

function stripMarkdownDecorators(value: string) {
  return value
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .trim()
}

function toMarkdownParagraphs(lines: string[]) {
  const paragraphs: string[] = []
  let buffer: string[] = []

  const flushBuffer = () => {
    if (!buffer.length) return
    paragraphs.push(stripMarkdownDecorators(buffer.join(' ').trim()))
    buffer = []
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      flushBuffer()
      continue
    }

    if (/^[-*]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
      flushBuffer()
      paragraphs.push(stripMarkdownDecorators(trimmed.replace(/^([-*]|\d+\.)\s+/, '')))
      continue
    }

    if (/^>\s+/.test(trimmed)) {
      flushBuffer()
      paragraphs.push(stripMarkdownDecorators(trimmed.replace(/^>\s+/, '')))
      continue
    }

    buffer.push(trimmed)
  }

  flushBuffer()
  return paragraphs.filter(Boolean)
}

function sectionHighlightsFromTitle(title: string) {
  return Array.from(
    new Set(
      title
        .split(/\W+/)
        .map((token) => token.trim())
        .filter((token) => token.length > 3)
    )
  ).slice(0, 4)
}

function deriveNoteDocumentFromMarkdown(markdown: string, title: string, summary: string) {
  const normalized = markdown.replace(/\r\n/g, '\n').trim()
  if (!normalized) return null

  const lines = normalized.split('\n')
  const firstHeading = lines.find((line) => /^#\s+/.test(line.trim()))
  const firstQuote = lines.find((line) => /^>\s+/.test(line.trim()))

  const parsedTitle =
    typeof firstHeading === 'string' ? stripMarkdownDecorators(firstHeading.trim().replace(/^#\s+/, '')) : ''
  const parsedSubtitle =
    typeof firstQuote === 'string' ? stripMarkdownDecorators(firstQuote.trim().replace(/^>\s+/, '')) : ''

  let currentSection: { title: string; lines: string[] } | null = null
  const markdownSections: Array<{ title: string; lines: string[] }> = []
  const introLines: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (/^#\s+/.test(trimmed)) {
      continue
    }

    if (/^>\s+/.test(trimmed)) {
      if (!parsedSubtitle && !currentSection) {
        introLines.push(trimmed.replace(/^>\s+/, ''))
      }
      continue
    }

    if (/^##\s+/.test(trimmed)) {
      if (currentSection) {
        markdownSections.push(currentSection)
      }
      currentSection = {
        title: stripMarkdownDecorators(trimmed.replace(/^##\s+/, '')),
        lines: [],
      }
      continue
    }

    if (currentSection) {
      currentSection.lines.push(line)
      continue
    }

    introLines.push(line)
  }

  if (currentSection) {
    markdownSections.push(currentSection)
  }

  const sections = markdownSections
    .map((section, idx) => {
      const paragraphs = toMarkdownParagraphs(section.lines)
      if (!paragraphs.length) return null

      const rawTitle = section.title || `Key Insight ${idx + 1}`
      return {
        id: slugify(rawTitle) || `section-${idx + 1}`,
        title: rawTitle,
        lead: paragraphs[0],
        paragraphs: paragraphs.slice(0, 3),
        callout: undefined,
        highlights: sectionHighlightsFromTitle(rawTitle),
      }
    })
    .filter(Boolean) as StudySetNoteSection[]

  if (!sections.length) {
    return null
  }

  const introParagraphs = toMarkdownParagraphs(introLines)
  const closing =
    sections[sections.length - 1]?.paragraphs[sections[sections.length - 1].paragraphs.length - 1] ||
    defaultNoteDocument.closing

  return {
    title: parsedTitle || title,
    subtitle: parsedSubtitle || summary,
    introduction: introParagraphs[0] || parsedSubtitle || summary,
    sections,
    closing,
  }
}

function stringifySectionItem(item: unknown) {
  if (typeof item === 'string') return item.trim()
  if (item && typeof item === 'object') {
    const source = item as any
    const prioritized =
      source.text ??
      source.lead ??
      source.prompt ??
      source.question ??
      source.answer ??
      source.response ??
      source.sentence
    if (typeof prioritized === 'string') {
      return prioritized.trim()
    }
  }

  if (item === null || item === undefined) return ''
  return String(item).trim()
}

function normalizeNoteLine(value: unknown) {
  if (typeof value !== 'string') return ''
  return value
    .replace(/^\s*[-*•]\s+/, '')
    .replace(/^\s*\d+[\)\.]\s+/, '')
    .replace(/^\s*[A-Ha-h][\)\.]\s+/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function isMeaningfulNoteLine(value: string) {
  if (!value) return false
  if (value.length < 4) return false
  if (/^[A-Ha-h]$/.test(value)) return false
  return true
}

function uniqueMeaningfulLines(values: string[]) {
  const seen = new Set<string>()
  const lines: string[] = []

  for (const raw of values) {
    const normalized = normalizeNoteLine(raw)
    if (!isMeaningfulNoteLine(normalized)) continue
    const key = normalized.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    lines.push(normalized)
  }

  return lines
}

function noteItemsToMarkdown(items: any[], title: string, summary: string) {
  const lines = uniqueMeaningfulLines(items.map((item) => stringifySectionItem(item))).slice(0, 10)
  const intro = lines[0] || summary
  const middle = lines.slice(1, 6)
  const markdownLines: string[] = [`# ${title}`, '', `> ${summary}`, '', intro]

  for (let index = 0; index < middle.length; index += 1) {
    markdownLines.push('', `## Key Insight ${index + 1}`, '', middle[index])
  }

  markdownLines.push('', '## Key Takeaway', '', defaultNoteDocument.closing)
  return markdownLines.join('\n').trim()
}

function noteDocumentToMarkdown(noteDocument: StudySetNoteDocument) {
  const lines: string[] = []
  lines.push(`# ${noteDocument.title}`)
  if (noteDocument.subtitle?.trim()) {
    lines.push('', `> ${noteDocument.subtitle.trim()}`)
  }

  if (noteDocument.introduction?.trim()) {
    lines.push('', noteDocument.introduction.trim())
  }

  for (const section of noteDocument.sections) {
    lines.push('', `## ${section.title}`)
    if (section.lead?.trim()) {
      lines.push('', section.lead.trim())
    }
    for (const paragraph of section.paragraphs) {
      if (paragraph?.trim()) {
        lines.push('', paragraph.trim())
      }
    }
    if (section.callout?.trim()) {
      lines.push('', `> ${section.callout.trim()}`)
    }
  }

  if (noteDocument.closing?.trim()) {
    lines.push('', '## Key Takeaway', '', noteDocument.closing.trim())
  }

  return lines.join('\n').trim()
}

function deriveNotesMarkdownFromSections(
  sections: StudySetSection[],
  title: string,
  summary: string
) {
  const notesSection = sections.find((section) => section.type === 'notes')
  if (!notesSection) return ''

  if (typeof notesSection.content === 'string' && notesSection.content.trim()) {
    return notesSection.content.trim()
  }

  if (Array.isArray(notesSection.items) && notesSection.items.length > 0) {
    return noteItemsToMarkdown(notesSection.items, title, summary)
  }

  return ''
}

function applyNotesMarkdownToSections(
  sections: StudySetSection[],
  notesMarkdown: string,
  shouldAddNotesSection: boolean
) {
  if (!notesMarkdown.trim()) {
    return sections
  }

  const nextSections = sections.map((section) => {
    if (section.type !== 'notes') return section
    return {
      ...section,
      format: 'markdown',
      content: notesMarkdown,
    }
  })

  if (!nextSections.some((section) => section.type === 'notes') && shouldAddNotesSection) {
    nextSections.unshift({
      type: 'notes',
      label: 'Notes',
      items: [],
      format: 'markdown',
      content: notesMarkdown,
    })
  }

  return nextSections
}

function deriveNoteDocument(
  title: string,
  summary: string,
  sections: StudySetSection[],
  input?: any,
  notesMarkdown?: string
): StudySetNoteDocument {
  if (typeof notesMarkdown === 'string' && notesMarkdown.trim()) {
    const parsed = deriveNoteDocumentFromMarkdown(notesMarkdown, title, summary)
    if (parsed) {
      return parsed
    }
  }

  const sourceSections = Array.isArray(input?.sections) ? input.sections : []
  const parsedSections = sourceSections
    .map((section: any, idx: number) => {
      const rawTitle =
        typeof section?.title === 'string' && section.title.trim()
          ? section.title.trim()
          : `Section ${idx + 1}`
      const paragraphs = coerceStringArray(section?.paragraphs)
      const lead =
        typeof section?.lead === 'string' && section.lead.trim()
          ? section.lead.trim()
          : paragraphs[0] ?? `Understand the key lesson in ${rawTitle.toLowerCase()}.`

      return {
        id: slugify(rawTitle) || `section-${idx + 1}`,
        title: rawTitle,
        lead,
        paragraphs: paragraphs.length ? paragraphs : [lead],
        callout:
          typeof section?.callout === 'string' && section.callout.trim()
            ? section.callout.trim()
            : undefined,
        highlights: coerceStringArray(section?.highlights).slice(0, 5),
      }
    })
    .filter((section: StudySetNoteSection) => section.paragraphs.length > 0)

  if (parsedSections.length > 0) {
    return {
      title:
        typeof input?.title === 'string' && input.title.trim()
          ? input.title.trim()
          : title,
      subtitle:
        typeof input?.subtitle === 'string' && input.subtitle.trim()
          ? input.subtitle.trim()
          : summary,
      introduction:
        typeof input?.introduction === 'string' && input.introduction.trim()
          ? input.introduction.trim()
          : summary,
      sections: parsedSections,
      closing:
        typeof input?.closing === 'string' && input.closing.trim()
          ? input.closing.trim()
          : 'Review these sections with flashcards and questions to lock in the concepts.',
    }
  }

  const notesSection =
    sections.find((section) => section.type === 'notes') ?? defaultSections[0]
  const sourceItems = notesSection.items.length ? notesSection.items : defaultSections[0].items
  const normalizedItems = uniqueMeaningfulLines(sourceItems.map((item) => stringifySectionItem(item))).slice(0, 4)
  const derivedSections = normalizedItems.map((text, idx) => {
      return {
        id: `insight-${idx + 1}`,
        title: `Key Insight ${idx + 1}`,
        lead: text,
        paragraphs: [text],
        callout: idx === 0 ? summary : undefined,
        highlights: [`Insight ${idx + 1}`],
      }
    })

  return {
    title,
    subtitle: summary,
    introduction: summary,
    sections: derivedSections.length ? derivedSections : defaultNoteDocument.sections,
    closing: defaultNoteDocument.closing,
  }
}

export function normalizeStudySetPayload(payload: any, fallbackTitle?: string): StudySet | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const statsSource = payload.stats
  const stats =
    statsSource && typeof statsSource === 'object'
      ? {
          unfamiliar: Number(statsSource.unfamiliar) || 0,
          learning: Number(statsSource.learning) || 0,
          familiar: Number(statsSource.familiar) || 0,
          mastered: Number(statsSource.mastered) || 0,
        }
      : defaultStats

  const idSource = payload.id ?? payload.setId ?? payload.uuid
  const titleSource =
    payload.title ?? payload.name ?? payload.summary ?? fallbackTitle ?? 'Untitled Study Set'
  const itemSource = payload.items ?? payload.itemCount ?? payload.totalItems ?? 0
  const selections = Array.isArray(payload.selections)
    ? payload.selections.map((entry: unknown) => String(entry))
    : []
  const title = String(titleSource).trim() || 'Untitled Study Set'
  const summary = String(payload.summary ?? fallbackTitle ?? 'A focused study experience from your material')
  const parsedSections = parseSections(payload.sections)
  const explicitNotesMarkdown =
    typeof payload.notesMarkdown === 'string' && payload.notesMarkdown.trim()
      ? payload.notesMarkdown.trim()
      : typeof payload.notes_markdown === 'string' && payload.notes_markdown.trim()
        ? payload.notes_markdown.trim()
        : ''
  const explicitNotesHtml =
    typeof payload.notesHtml === 'string' && payload.notesHtml.trim()
      ? payload.notesHtml.trim()
      : typeof payload.notes_html === 'string' && payload.notes_html.trim()
        ? payload.notes_html.trim()
        : ''
  const hasNotesSelection = selections.includes('notes')
  const notesMarkdownFromSections = deriveNotesMarkdownFromSections(parsedSections, title, summary)
  const shouldUseNoteDocumentMarkdown = hasNotesSelection || parsedSections.some((section) => section.type === 'notes')

  const provisionalNoteDocument = deriveNoteDocument(
    title,
    summary,
    parsedSections,
    payload.noteDocument,
    explicitNotesMarkdown || notesMarkdownFromSections
  )

  const notesMarkdown =
    explicitNotesMarkdown ||
    notesMarkdownFromSections ||
    (shouldUseNoteDocumentMarkdown ? noteDocumentToMarkdown(provisionalNoteDocument) : '')

  const normalizedSections = applyNotesMarkdownToSections(
    parsedSections,
    notesMarkdown,
    shouldUseNoteDocumentMarkdown
  )

  return {
    id: String(idSource ?? generateFallbackId()),
    title,
    items: Number(itemSource) || 0,
    summary,
    selections,
    sections: normalizedSections,
    sourceText:
      typeof payload.sourceText === 'string' && payload.sourceText.trim()
        ? payload.sourceText.trim()
        : undefined,
    notesMarkdown: notesMarkdown || undefined,
    notesHtml: explicitNotesHtml || undefined,
    updatedAt:
      typeof payload.updatedAt === 'string' && payload.updatedAt.trim()
        ? payload.updatedAt
        : typeof payload.updated_at === 'string' && payload.updated_at.trim()
          ? payload.updated_at
          : undefined,
    createdAt: payload.createdAt ?? payload.created_at ?? new Date().toISOString(),
    stats,
  }
}

export const normalizeStudySetResponse = normalizeStudySetPayload

function readStoredStudySets(): StudySet[] {
  if (typeof window === 'undefined') return seededStudySets
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seededStudySets))
      return seededStudySets
    }
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length) {
      const normalized = parsed
        .map((entry) => normalizeStudySetPayload(entry))
        .filter((entry): entry is StudySet => Boolean(entry))

      if (normalized.length) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
        return normalized
      }
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seededStudySets))
    return seededStudySets
  } catch {
    return seededStudySets
  }
}

function writeStoredStudySets(sets: StudySet[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sets))
  } catch {
    // ignore storage errors
  }
}

export function persistStudySet(studySet: StudySet) {
  if (typeof window === 'undefined') return
  const current = readStoredStudySets()
  const idx = current.findIndex((set) => set.id === studySet.id)
  const updated = [...current]
  if (idx >= 0) {
    updated[idx] = studySet
  } else {
    updated.unshift(studySet)
  }
  writeStoredStudySets(updated)
  return updated
}

export function getStoredStudySets() {
  return readStoredStudySets()
}

export function getStoredStudySetById(id: string) {
  return readStoredStudySets().find((set) => set.id === id) ?? null
}

const seededStudySets: StudySet[] = [
  {
    id: 'work-defines-a-person',
    title: 'Work Defines a Person',
    items: 18,
    summary:
      'A philosophical exploration of how actions, not birth status, determine identity and legacy.',
    selections: ['notes', 'multipleChoice', 'flashcards', 'fillInTheBlanks', 'tutorLesson'],
    sections: [
      {
        type: 'notes',
        label: 'Notes',
        items: [
          'Deeds are the ultimate determinant of status; lineage alone cannot build legacy.',
          'Positive contributions build admiration that outlasts material wealth or family prestige.',
          'Ethical lapses erase respect quickly; accountability is central to reputation.',
        ],
      },
      {
        type: 'multipleChoice',
        label: 'Multiple Choice',
        items: [
          {
            question: "Which factor primarily shapes a person's standing?",
            options: [
              'Specific lineage or birth family',
              'The type of actions and deeds performed',
              'Financial wealth accumulated',
              'Immediate family status',
            ],
            answer: 'The type of actions and deeds performed',
            explanation:
              'The lesson emphasizes deeds and contributions as the lasting measure of character.',
          },
          {
            question: 'What remains after a person passes away according to the text?',
            options: [
              'Their possessions and property',
              'The memory of their deeds',
              'Their physical appearance',
              'Their hereditary title',
            ],
            answer: 'The memory of their deeds',
            explanation: 'Legacy is built through meaningful contributions that people remember.',
          },
        ],
      },
      {
        type: 'flashcards',
        label: 'Flashcards',
        items: [
          {
            prompt: 'Core idea behind "Let Birth Be Anywhere, Let Deeds Be Good"',
            answer: 'Actions define respect and honor, regardless of birthplace or status.',
          },
          {
            prompt: 'Long-term effect of commendable actions',
            answer: 'They inspire admiration and set a precedent for others.',
          },
        ],
      },
      {
        type: 'fillInTheBlanks',
        label: 'Fill in the Blanks',
        items: [
          {
            sentence: 'True reputation is earned through consistent _____ behavior.',
            answer: 'ethical',
            explanation: 'Ethical behavior builds trust and honor.',
          },
          {
            sentence: 'Legacy is not dependent on social origin but on meaningful _____.',
            answer: 'contributions',
            explanation: 'Contributions determine long-term remembrance.',
          },
        ],
      },
      {
        type: 'tutorLesson',
        label: 'Tutor Lesson',
        items: [
          {
            prompt: 'Why are deeds more important than lineage?',
            response:
              'Because deeds show personal agency and character, while lineage is accidental.',
            followUp: 'Provide an example from history where action trumped lineage.',
          },
        ],
      },
    ],
    notesMarkdown: `# Work Defines a Person

> Why actions shape identity more strongly than inheritance.

This note reframes identity as something earned through daily conduct. It argues that a person becomes memorable not by origin, but by the quality of work, ethics, and contribution they leave behind.

## Deeds Over Lineage

The text places action above ancestry as the true measure of a human being.

Birth may explain where a person comes from, but it does not prove their worth. Worth becomes visible through decisions, effort, and the benefit those actions bring to others.

Because of this, respect is not inherited permanently. It must be renewed through conduct that others can witness and trust.

> A name may be given at birth, but character is written through work.

## Legacy and Memory

What remains after a person is gone is the memory of what they did.

The lesson suggests that good work gives a person a second life in memory. Communities continue to tell stories about service, courage, discipline, and generosity.

Bad actions do the opposite. They reduce trust and can turn a family name into a warning rather than a source of honor.

> Legacy is the long shadow cast by repeated action.

## Key Takeaway

The practical lesson is simple: if identity is built through action, then each decision becomes part of the story others will remember.`,
    sourceText:
      'Work defines character more than birth. A person is remembered for good deeds, responsibility, and the example they set for others.',
    stats: {
      unfamiliar: 9,
      learning: 4,
      familiar: 3,
      mastered: 2,
    },
    createdAt: new Date().toISOString(),
  },
]

export function ensureSeededStudySets() {
  const sets = readStoredStudySets()
  if (typeof window !== 'undefined') {
    writeStoredStudySets(sets)
  }
  return sets
}
