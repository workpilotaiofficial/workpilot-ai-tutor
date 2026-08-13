type ExploreDifficulty = 'Beginner' | 'Intermediate' | 'Advanced'

type ExploreCatalogSection = {
  type:
    | 'notes'
    | 'flashcards'
    | 'multiple_choice'
    | 'fill_in_blanks'
    | 'written_test'
    | 'podcast'
    | 'tutor_lesson'
  label: string
  itemCount: number
}

type ExploreCatalogEntry = {
  id: string
  slug: string
  title: string
  subject: string
  description: string
  longDescription: string
  thumbnailUrl: string
  estimatedMinutes: number
  difficulty: ExploreDifficulty
  createdAt: string
  createdBy: string
  learningObjectives: string[]
  tags: string[]
  sections: ExploreCatalogSection[]
}

export type ExploreStudySetHistoryItem = {
  id: string
  slug: string
  title: string
  description: string | null
  item_count: number
  percentage_completed: number
  generation_progress_percentage: number
  items_left: number
  created_at: string
  subject: string
  thumbnail_url: string
  estimated_minutes: number
  difficulty: ExploreDifficulty
  tags: string[]
}

export type ExploreStudySetListResponse = {
  data: ExploreStudySetHistoryItem[]
  count: number
  filters: {
    subjects: string[]
    activeSubject: string
    search: string
  }
  pagination: {
    next_cursor: string | null
    has_more: boolean
    limit: number
  }
  next_cursor: string | null
}

export type ExploreStudySetDetailResponse = {
  studySet: Record<string, unknown>
  warning: string | null
}

type ListExploreStudySetsParams = {
  subject?: string | null
  search?: string | null
  limit?: number
  cursor?: string | null
}

const exploreStudySets: ExploreCatalogEntry[] = [
  {
    id: 'bio-cell-energy',
    slug: 'cellular-energy-and-respiration',
    title: 'Cellular Energy and Respiration',
    subject: 'Biology',
    description: 'ATP, glycolysis, Krebs cycle, and oxidative phosphorylation in one guided set.',
    longDescription:
      'Review how cells produce and store energy, connect each stage of respiration, and practise the high-yield comparisons that usually appear in biology exams.',
    thumbnailUrl: '/placeholder.jpg',
    estimatedMinutes: 24,
    difficulty: 'Intermediate',
    createdAt: '2026-07-21T10:30:00.000Z',
    createdBy: 'Neurova Explore',
    learningObjectives: [
      'Explain the role of ATP in cellular work.',
      'Compare glycolysis, the Krebs cycle, and the electron transport chain.',
      'Identify how aerobic and anaerobic respiration differ.',
    ],
    tags: ['Cells', 'Respiration', 'ATP'],
    sections: [
      { type: 'notes', label: 'Notes', itemCount: 1 },
      { type: 'flashcards', label: 'Flashcards', itemCount: 4 },
      { type: 'multiple_choice', label: 'MCQ', itemCount: 3 },
      { type: 'fill_in_blanks', label: 'Fill in the blanks', itemCount: 2 },
      { type: 'podcast', label: 'Podcast', itemCount: 1 },
      { type: 'tutor_lesson', label: 'Tutor lesson', itemCount: 1 },
    ],
  },
  {
    id: 'math-vector-span',
    slug: 'vector-span-and-linear-combinations',
    title: 'Vector Span and Linear Combinations',
    subject: 'Mathematics',
    description: 'Build geometric intuition for span, basis, and linear dependence.',
    longDescription:
      'This set focuses on interpreting vectors visually before moving into algebraic tests for span, basis, and independence.',
    thumbnailUrl: '/hero-2.png',
    estimatedMinutes: 22,
    difficulty: 'Intermediate',
    createdAt: '2026-07-14T08:15:00.000Z',
    createdBy: 'Neurova Explore',
    learningObjectives: [
      'Define span in geometric and algebraic terms.',
      'Test whether vectors are linearly independent.',
      'Solve basis-selection questions quickly.',
    ],
    tags: ['Vectors', 'Linear Algebra', 'Span'],
    sections: [
      { type: 'notes', label: 'Notes', itemCount: 1 },
      { type: 'flashcards', label: 'Flashcards', itemCount: 4 },
      { type: 'multiple_choice', label: 'MCQ', itemCount: 3 },
      { type: 'written_test', label: 'Written test', itemCount: 2 },
      { type: 'tutor_lesson', label: 'Tutor lesson', itemCount: 1 },
    ],
  },
  {
    id: 'econ-gdp-limitations',
    slug: 'limitations-of-gdp',
    title: 'Limitations of GDP',
    subject: 'Economics',
    description: 'Know when GDP works, where it fails, and what alternatives matter.',
    longDescription:
      'A compact explore set on GDP as a measurement tool, its blind spots, and the standard arguments used in policy and exam writing.',
    thumbnailUrl: '/bg-4.png',
    estimatedMinutes: 18,
    difficulty: 'Beginner',
    createdAt: '2026-06-30T14:45:00.000Z',
    createdBy: 'Neurova Explore',
    learningObjectives: [
      'State what GDP measures accurately.',
      'Describe why GDP misses welfare and inequality.',
      'Use examples to critique GDP in written answers.',
    ],
    tags: ['GDP', 'Macroeconomics', 'Welfare'],
    sections: [
      { type: 'notes', label: 'Notes', itemCount: 1 },
      { type: 'flashcards', label: 'Flashcards', itemCount: 4 },
      { type: 'multiple_choice', label: 'MCQ', itemCount: 3 },
      { type: 'podcast', label: 'Podcast', itemCount: 1 },
      { type: 'written_test', label: 'Written test', itemCount: 2 },
    ],
  },
  {
    id: 'history-imperialism',
    slug: 'nineteenth-century-imperialism',
    title: '19th Century Imperialism',
    subject: 'History',
    description: 'Causes, rivalries, and consequences of imperial expansion.',
    longDescription:
      'Explore the political, economic, and ideological reasons behind imperialism and connect them to map-based and essay-style exam questions.',
    thumbnailUrl: '/bg-hero.png',
    estimatedMinutes: 21,
    difficulty: 'Intermediate',
    createdAt: '2026-07-03T09:00:00.000Z',
    createdBy: 'Neurova Explore',
    learningObjectives: [
      'Identify major causes of imperialism.',
      'Explain how imperialism changed global power balances.',
      'Write evidence-backed comparisons between empires.',
    ],
    tags: ['Empire', 'Colonialism', 'Modern History'],
    sections: [
      { type: 'notes', label: 'Notes', itemCount: 1 },
      { type: 'flashcards', label: 'Flashcards', itemCount: 4 },
      { type: 'multiple_choice', label: 'MCQ', itemCount: 3 },
      { type: 'written_test', label: 'Written test', itemCount: 2 },
      { type: 'tutor_lesson', label: 'Tutor lesson', itemCount: 1 },
    ],
  },
  {
    id: 'cs-big-o',
    slug: 'big-o-and-algorithm-analysis',
    title: 'Big O and Algorithm Analysis',
    subject: 'Computer Science',
    description: 'Time complexity patterns for loops, recursion, and common data structures.',
    longDescription:
      'Designed for quick revision of asymptotic notation, common complexity classes, and the logic behind algorithm tradeoffs.',
    thumbnailUrl: '/laptop.png',
    estimatedMinutes: 23,
    difficulty: 'Intermediate',
    createdAt: '2026-07-18T12:20:00.000Z',
    createdBy: 'Neurova Explore',
    learningObjectives: [
      'Interpret Big O, Big Theta, and Big Omega.',
      'Estimate time complexity from code patterns.',
      'Compare performance tradeoffs among common approaches.',
    ],
    tags: ['Algorithms', 'Complexity', 'Data Structures'],
    sections: [
      { type: 'notes', label: 'Notes', itemCount: 1 },
      { type: 'flashcards', label: 'Flashcards', itemCount: 4 },
      { type: 'multiple_choice', label: 'MCQ', itemCount: 3 },
      { type: 'fill_in_blanks', label: 'Fill in the blanks', itemCount: 2 },
      { type: 'tutor_lesson', label: 'Tutor lesson', itemCount: 1 },
    ],
  },
  {
    id: 'physics-newton-laws',
    slug: 'newtons-laws-of-motion',
    title: "Newton's Laws of Motion",
    subject: 'Physics',
    description: 'Force diagrams, net force reasoning, and motion problem setup.',
    longDescription:
      'A practical motion set that helps students move from formula memorization to reliable free-body-diagram reasoning.',
    thumbnailUrl: '/demo-1.png',
    estimatedMinutes: 20,
    difficulty: 'Beginner',
    createdAt: '2026-07-09T16:05:00.000Z',
    createdBy: 'Neurova Explore',
    learningObjectives: [
      'Interpret all three Newtonian laws in context.',
      'Construct free-body diagrams correctly.',
      'Solve basic force and acceleration questions.',
    ],
    tags: ['Mechanics', 'Force', 'Motion'],
    sections: [
      { type: 'notes', label: 'Notes', itemCount: 1 },
      { type: 'flashcards', label: 'Flashcards', itemCount: 4 },
      { type: 'multiple_choice', label: 'MCQ', itemCount: 3 },
      { type: 'podcast', label: 'Podcast', itemCount: 1 },
      { type: 'tutor_lesson', label: 'Tutor lesson', itemCount: 1 },
    ],
  },
  {
    id: 'med-drug-distribution',
    slug: 'drug-distribution-basics',
    title: 'Drug Distribution Basics',
    subject: 'Medicine',
    description: 'Protein binding, tissue perfusion, and volume of distribution essentials.',
    longDescription:
      'A concise pharmacology overview for understanding how drugs move through the body and why those differences matter clinically.',
    thumbnailUrl: '/portal.png',
    estimatedMinutes: 19,
    difficulty: 'Advanced',
    createdAt: '2026-07-24T07:40:00.000Z',
    createdBy: 'Neurova Explore',
    learningObjectives: [
      'Define volume of distribution accurately.',
      'Explain how protein binding changes free drug availability.',
      'Connect pharmacokinetics to simple clinical decisions.',
    ],
    tags: ['Pharmacology', 'Distribution', 'Clinical Basics'],
    sections: [
      { type: 'notes', label: 'Notes', itemCount: 1 },
      { type: 'flashcards', label: 'Flashcards', itemCount: 4 },
      { type: 'multiple_choice', label: 'MCQ', itemCount: 3 },
      { type: 'written_test', label: 'Written test', itemCount: 2 },
      { type: 'tutor_lesson', label: 'Tutor lesson', itemCount: 1 },
    ],
  },
  {
    id: 'philosophy-plato-forms',
    slug: 'platos-theory-of-forms',
    title: "Plato's Theory of Forms",
    subject: 'Philosophy',
    description: 'Understand the Forms, the cave analogy, and common objections.',
    longDescription:
      'A concept-first study set that breaks Plato down into exam-ready language without losing the philosophical depth.',
    thumbnailUrl: '/placeholder-user.jpg',
    estimatedMinutes: 17,
    difficulty: 'Intermediate',
    createdAt: '2026-07-27T11:50:00.000Z',
    createdBy: 'Neurova Explore',
    learningObjectives: [
      'Define what Plato means by Forms.',
      'Relate the allegory of the cave to epistemology.',
      'Evaluate classic objections to Plato.',
    ],
    tags: ['Plato', 'Metaphysics', 'Epistemology'],
    sections: [
      { type: 'notes', label: 'Notes', itemCount: 1 },
      { type: 'flashcards', label: 'Flashcards', itemCount: 4 },
      { type: 'multiple_choice', label: 'MCQ', itemCount: 3 },
      { type: 'written_test', label: 'Written test', itemCount: 2 },
      { type: 'tutor_lesson', label: 'Tutor lesson', itemCount: 1 },
    ],
  },
]

function slugToLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase())
}

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase()
}

function normalizeLimit(limit?: number) {
  if (!Number.isFinite(limit) || !limit) {
    return 12
  }

  return Math.min(24, Math.max(1, Math.trunc(limit)))
}

function decodeCursor(cursor?: string | null) {
  if (!cursor) {
    return 0
  }

  const offset = Number.parseInt(cursor, 10)
  return Number.isFinite(offset) && offset >= 0 ? offset : 0
}

function getSectionItemCount(section: Record<string, unknown>) {
  const items = section.items
  if (Array.isArray(items) && items.length > 0) {
    return items.length
  }

  return typeof section.content === 'string' && section.content.trim() ? 1 : 0
}

function getTotalItems(sections: Array<Record<string, unknown>>) {
  return sections.reduce((total, section) => total + getSectionItemCount(section), 0)
}

function getSelectionKeys(item: ExploreCatalogEntry) {
  return item.sections.map((section) => section.type)
}

function buildNotesMarkdown(item: ExploreCatalogEntry) {
  const lines = [
    `# ${item.title}`,
    '',
    `> ${item.description}`,
    '',
    item.longDescription,
  ]

  item.learningObjectives.forEach((objective, index) => {
    lines.push('', `## Key Insight ${index + 1}`, '', objective)
  })

  lines.push('', '## Key Takeaway', '', `Focus on ${item.tags.join(', ')} when reviewing this topic again.`)
  return lines.join('\n')
}

function buildFlashcards(item: ExploreCatalogEntry) {
  return item.learningObjectives.map((objective, index) => ({
    id: `${item.id}-flashcard-${index + 1}`,
    prompt: `${item.subject} concept ${index + 1}`,
    answer: objective,
  }))
}

function buildMultipleChoice(item: ExploreCatalogEntry) {
  return item.learningObjectives.map((objective, index) => {
    const optionIds = [
      `${item.id}-mcq-${index + 1}-a`,
      `${item.id}-mcq-${index + 1}-b`,
      `${item.id}-mcq-${index + 1}-c`,
      `${item.id}-mcq-${index + 1}-d`,
    ]

    const distractors = [
      `Only memorizing a definition of ${item.tags[0] ?? item.subject}.`,
      `Ignoring connections between ${item.tags[1] ?? item.subject} and the wider topic.`,
      `Focusing only on isolated facts instead of reasoning through examples.`,
    ]

    return {
      id: `${item.id}-mcq-${index + 1}`,
      question: `Which statement best matches this study objective: ${objective}`,
      options: [objective, ...distractors],
      optionIds,
      correctOptionId: optionIds[0],
      answer: objective,
      explanation: `This directly restates the learning target for ${item.title}.`,
    }
  })
}

function buildFillInTheBlanks(item: ExploreCatalogEntry) {
  return item.tags.slice(0, 2).map((tag, index) => ({
    id: `${item.id}-fill-${index + 1}`,
    sentence: `${item.title} requires a clear understanding of ____ when solving exam-style questions.`,
    answer: tag,
    blanks: [
      {
        answer: tag,
        position: 0,
      },
    ],
  }))
}

function buildWrittenTests(item: ExploreCatalogEntry) {
  return item.learningObjectives.slice(0, 2).map((objective, index) => ({
    id: `${item.id}-written-${index + 1}`,
    question: `Write a short answer explaining how this objective applies in practice: ${objective}`,
    idealResponse: `${objective} Use at least one example involving ${item.tags.join(', ')}.`,
  }))
}

function buildPodcastItems(item: ExploreCatalogEntry) {
  return [
    {
      id: `${item.id}-podcast-1`,
      title: `${item.title} audio recap`,
      summary: item.description,
      duration: `${item.estimatedMinutes} minutes`,
      talkingPoints: item.learningObjectives,
    },
  ]
}

function buildTutorLessonMarkdown(item: ExploreCatalogEntry) {
  return [
    `# ${item.title} Tutor Lesson`,
    '',
    `This guided lesson focuses on ${item.subject.toLowerCase()} reasoning, not just memorization.`,
    '',
    '## What To Focus On',
    '',
    ...item.learningObjectives.flatMap((objective) => [`- ${objective}`]),
    '',
    '## Exam Strategy',
    '',
    `Use ${item.tags.join(', ')} as anchor concepts when explaining your answer.`,
  ].join('\n')
}

function buildStudySetSections(item: ExploreCatalogEntry) {
  return item.sections.map((section) => {
    switch (section.type) {
      case 'notes':
        return {
          type: 'notes',
          label: section.label,
          format: 'markdown',
          content: buildNotesMarkdown(item),
          items: [],
          status: 'completed',
        }
      case 'flashcards':
        return {
          type: 'flashcards',
          label: section.label,
          items: buildFlashcards(item),
          status: 'completed',
        }
      case 'multiple_choice':
        return {
          type: 'multiple_choice',
          label: section.label,
          items: buildMultipleChoice(item),
          status: 'completed',
        }
      case 'fill_in_blanks':
        return {
          type: 'fill_in_blanks',
          label: section.label,
          items: buildFillInTheBlanks(item),
          status: 'completed',
        }
      case 'written_test':
        return {
          type: 'written_test',
          label: section.label,
          items: buildWrittenTests(item),
          status: 'completed',
        }
      case 'podcast':
        return {
          type: 'podcast',
          label: section.label,
          items: buildPodcastItems(item),
          status: 'completed',
        }
      case 'tutor_lesson':
        return {
          type: 'tutor_lesson',
          label: section.label,
          format: 'markdown',
          content: buildTutorLessonMarkdown(item),
          items: [
            {
              id: `${item.id}-lesson-1`,
              title: `${item.title} guided lesson`,
              text: item.longDescription,
            },
          ],
          status: 'completed',
        }
      default:
        return {
          type: section.type,
          label: slugToLabel(section.type),
          items: [],
          status: 'completed',
        }
    }
  })
}

function buildStudySetStats(sections: Array<Record<string, unknown>>) {
  const totalItems = getTotalItems(sections)
  const mastered = Math.max(1, Math.floor(totalItems * 0.18))
  const familiar = Math.max(1, Math.floor(totalItems * 0.24))
  const learning = Math.max(1, Math.floor(totalItems * 0.29))
  const unfamiliar = Math.max(0, totalItems - mastered - familiar - learning)

  return {
    unfamiliar,
    learning,
    familiar,
    mastered,
  }
}

function buildStudySetPayload(item: ExploreCatalogEntry) {
  const sections = buildStudySetSections(item)
  const items = getTotalItems(sections)
  const stats = buildStudySetStats(sections)

  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    summary: item.description,
    items,
    selections: getSelectionKeys(item),
    sections,
    document: {
      id: `doc-${item.id}`,
      title: `${item.title} source`,
      filename: `${item.slug}.md`,
      source_type: 'text',
      mime_type: 'text/markdown',
      raw_extracted_text: item.longDescription,
      source_url: null,
    },
    source_type: 'text',
    source_text: item.longDescription,
    source_filename: `${item.slug}.md`,
    source_mime_type: 'text/markdown',
    notes_markdown: buildNotesMarkdown(item),
    created_at: item.createdAt,
    updated_at: item.createdAt,
    stats,
    subject: item.subject,
    thumbnail_url: item.thumbnailUrl,
    estimated_minutes: item.estimatedMinutes,
    difficulty: item.difficulty,
    tags: item.tags,
    created_by: item.createdBy,
    learning_objectives: item.learningObjectives,
  }
}

function toHistoryItem(item: ExploreCatalogEntry): ExploreStudySetHistoryItem {
  const studySet = buildStudySetPayload(item)
  const totalItems = Number(studySet.items) || 0
  const mastered = Number((studySet.stats as Record<string, number>).mastered) || 0
  const familiar = Number((studySet.stats as Record<string, number>).familiar) || 0
  const completedItems = mastered + familiar
  const percentageCompleted =
    totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    description: item.description,
    item_count: totalItems,
    percentage_completed: percentageCompleted,
    generation_progress_percentage: 100,
    items_left: Math.max(0, totalItems - completedItems),
    created_at: item.createdAt,
    subject: item.subject,
    thumbnail_url: item.thumbnailUrl,
    estimated_minutes: item.estimatedMinutes,
    difficulty: item.difficulty,
    tags: item.tags,
  }
}

export function getExploreSubjects() {
  return ['All', ...new Set(exploreStudySets.map((item) => item.subject))]
}

export function listExploreStudySets({
  subject,
  search,
  limit,
  cursor,
}: ListExploreStudySetsParams = {}): ExploreStudySetListResponse {
  const normalizedSearch = normalizeSearchValue(search ?? '')
  const activeSubject = subject?.trim() ? subject.trim() : 'All'
  const pageLimit = normalizeLimit(limit)
  const offset = decodeCursor(cursor)

  const filtered = exploreStudySets.filter((item) => {
    const matchesSubject = activeSubject === 'All' || item.subject === activeSubject

    if (!matchesSubject) {
      return false
    }

    if (!normalizedSearch) {
      return true
    }

    const haystack = [
      item.title,
      item.subject,
      item.description,
      item.longDescription,
      item.tags.join(' '),
      item.learningObjectives.join(' '),
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(normalizedSearch)
  })

  const paginated = filtered.slice(offset, offset + pageLimit)
  const nextOffset = offset + paginated.length
  const nextCursor = nextOffset < filtered.length ? String(nextOffset) : null

  return {
    data: paginated.map(toHistoryItem),
    count: filtered.length,
    filters: {
      subjects: getExploreSubjects(),
      activeSubject,
      search: search?.trim() ?? '',
    },
    pagination: {
      next_cursor: nextCursor,
      has_more: nextCursor !== null,
      limit: pageLimit,
    },
    next_cursor: nextCursor,
  }
}

export function getExploreStudySetById(idOrSlug: string) {
  const entry =
    exploreStudySets.find((item) => item.id === idOrSlug) ??
    exploreStudySets.find((item) => item.slug === idOrSlug) ??
    null

  if (!entry) {
    return null
  }

  return {
    studySet: buildStudySetPayload(entry),
    warning: null,
  } satisfies ExploreStudySetDetailResponse
}
