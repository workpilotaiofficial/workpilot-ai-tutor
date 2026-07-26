'use client'

export type PriorityLevel = 'High' | 'Medium' | 'Low'

export type SyllabusModule = {
  id: string
  moduleNumber: number | null
  weekNumber: number | null
  title: string
  description: string | null
  priority: PriorityLevel
  topics: string[]
  readings: string[]
  deliverables: string[]
  isCompleted: boolean
  estimatedWeeks: number | null
}

export type SemesterTimelineItem = {
  id: string
  weekNumber: number | null
  weekStartDate: string | null
  weekEndDate: string | null
  weekRange: string
  focus: string
  scheduledModules: string[]
  outcomes: string[]
  studyRecommendations: string[]
  estimatedStudyHours: number | null
  isCurrentWeek: boolean
}

export type PriorityTopic = {
  id: string
  topic: string
  reason: string
  priority: PriorityLevel
  examFrequencyScore: number | null
}

export type CourseworkPlanItem = {
  id: string
  task: string
  type: string | null
  when: string
  effort: string
  tips: string
  weightPercentage: number | null
  dueDate: string | null
}

export type SyllabusAnalysisSummary = {
  id: string
  courseSummary: string | null
  keyThemes: string[]
  overallLearningObjectives: string[]
  totalModulesDetected: number
  modelName: string | null
  provider: string | null
  status: string
  analysedAt: string | null
  createdAt: string | null
}

export type SyllabusIntelligenceResult = {
  id: string
  title: string
  courseName: string | null
  description:string | null
  courseCode: string | null
  institution: string | null
  instructorName: string | null
  semesterLabel: string | null
  semesterStartDate: string | null
  semesterEndDate: string | null
  totalWeeks: number | null
  sourceType: string
  originalFilename: string | null
  rawExtractedText: string
  sourceLength: number
  processingStatus: string
  createdAt: string
  updatedAt: string
  analysis: SyllabusAnalysisSummary | null
  modules: SyllabusModule[]
  timeline: SemesterTimelineItem[]
  priorityTopics: PriorityTopic[]
  coursework: CourseworkPlanItem[]
}

type NormalizedAnalysisPayload = {
  id?: unknown
  courseSummary?: unknown
  keyThemes?: unknown
  overallLearningObjectives?: unknown
  totalModulesDetected?: unknown
  modelName?: unknown
  provider?: unknown
  status?: unknown
  analysedAt?: unknown
  createdAt?: unknown
}

type NormalizedSyllabusPayload = {
  id?: unknown
  title?: unknown
  courseName?: unknown
  course_name?: unknown
  courseCode?: unknown
  course_code?: unknown
  institution?: unknown
  instructorName?: unknown
  instructor_name?: unknown
  semesterLabel?: unknown
  semester_label?: unknown
  semesterStartDate?: unknown
  semester_start_date?: unknown
  semesterEndDate?: unknown
  semester_end_date?: unknown
  totalWeeks?: unknown
  total_weeks?: unknown
  sourceType?: unknown
  originalFilename?: unknown
  rawExtractedText?: unknown
  processingStatus?: unknown
  createdAt?: unknown
  updatedAt?: unknown
  analysis?: NormalizedAnalysisPayload | null
  modules?: unknown
  timeline?: unknown
  priority_topics?: unknown
  priorityTopics?: unknown
  coursework?: unknown
}

const STORAGE_KEY = 'Tutora-syllabus-intelligence-results'

function normalizeText(value: unknown, fallback = '') {
  if (typeof value !== 'string') return fallback
  const text = value.trim()
  return text || fallback
}

function normalizeNullableText(value: unknown) {
  if (typeof value !== 'string') return null
  const text = value.trim()
  return text || null
}

function normalizeNumber(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.round(value)
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function normalizeNullableNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function normalizeBoolean(value: unknown) {
  return value === true
}

function normalizeStringList(value: unknown) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => normalizeText(item))
    .filter((item): item is string => Boolean(item))
}

function normalizePriority(value: unknown): PriorityLevel {
  const normalized = normalizeText(value).toLowerCase()
  if (normalized === 'high') return 'High'
  if (normalized === 'low') return 'Low'
  return 'Medium'
}

function normalizeModuleList(value: unknown): SyllabusModule[] {
  if (!Array.isArray(value)) return []

  return value
    .map((entry, index) => {
      if (!entry || typeof entry !== 'object') return null
      const item = entry as Record<string, unknown>
      const title = normalizeText(item.title, `Module ${index + 1}`)
      const readings = normalizeStringList(item.readings)
      const learningObjectives = normalizeStringList(item.learningObjectives ?? item.learning_objectives)
      const topics =
        (Array.isArray(item.topics) && item.topics.length ? normalizeStringList(item.topics) : null) ??
        (learningObjectives.length ? learningObjectives : readings)
      const estimatedWeeks = normalizeNumber(item.estimatedWeeks ?? item.estimated_weeks ?? item.weeks, 0)
      const moduleNumber = normalizeNullableNumber(item.moduleNumber ?? item.module_number ?? index + 1)
      const weekNumber = normalizeNullableNumber(item.weekNumber ?? item.week_number)

      return {
        id: normalizeText(item.id, `module-${index}`),
        moduleNumber,
        weekNumber,
        title,
        description: normalizeNullableText(item.description),
        priority: normalizePriority(item.priorityLevel ?? item.priority_level ?? item.priority),
        topics,
        readings,
        deliverables: normalizeStringList(item.deliverables),
        isCompleted: normalizeBoolean(item.isCompleted ?? item.is_completed),
        estimatedWeeks: estimatedWeeks > 0 ? estimatedWeeks : null,
      }
    })
    .filter((entry): entry is SyllabusModule => Boolean(entry))
}

function normalizeTimelineList(value: unknown): SemesterTimelineItem[] {
  if (!Array.isArray(value)) return []

  return value
    .map((entry, index) => {
      if (!entry || typeof entry !== 'object') return null
      const item = entry as Record<string, unknown>
      const weekNumber = normalizeNullableNumber(item.weekNumber ?? item.week_number)
      const weekRange = normalizeText(
        item.weekRange ?? item.week_range ?? item.range ?? (weekNumber !== null ? `Week ${weekNumber}` : ''),
      )
      const scheduledModules = normalizeStringList(item.scheduledModules ?? item.scheduled_modules)
      const focus = normalizeText(
        item.focus ?? item.title ?? (scheduledModules.length ? scheduledModules.join(', ') : ''),
      )

      if (!weekRange && !focus) {
        return null
      }

      const studyRecommendationsRaw = item.studyRecommendations ?? item.study_recommendations
      const studyRecommendations = Array.isArray(studyRecommendationsRaw)
        ? normalizeStringList(studyRecommendationsRaw)
        : normalizeStringList(
            typeof studyRecommendationsRaw === 'string' && studyRecommendationsRaw.trim()
              ? [studyRecommendationsRaw]
              : [],
          )

      return {
        id: normalizeText(item.id, `timeline-${index}`),
        weekNumber,
        weekStartDate: normalizeNullableText(item.weekStartDate ?? item.week_start_date),
        weekEndDate: normalizeNullableText(item.weekEndDate ?? item.week_end_date),
        weekRange: weekRange || 'Timeline item',
        focus: focus || 'No focus provided',
        scheduledModules,
        outcomes: normalizeStringList(item.outcomes ?? item.scheduledDeliverables ?? item.scheduled_deliverables),
        studyRecommendations,
        estimatedStudyHours: normalizeNullableNumber(item.estimatedStudyHours ?? item.estimated_study_hours),
        isCurrentWeek: normalizeBoolean(item.isCurrentWeek ?? item.is_current_week),
      }
    })
    .filter((entry): entry is SemesterTimelineItem => Boolean(entry))
}

function normalizePriorityList(value: unknown): PriorityTopic[] {
  if (!Array.isArray(value)) return []

  return value
    .map((entry, index) => {
      if (!entry || typeof entry !== 'object') return null
      const item = entry as Record<string, unknown>
      const topic = normalizeText(item.topic ?? item.title ?? item.name ?? item.topicName ?? item.topic_name)

      if (!topic) {
        return null
      }

      return {
        id: normalizeText(item.id, `priority-${index}`),
        topic,
        reason: normalizeText(item.reason ?? item.description),
        priority: normalizePriority(item.priority ?? item.level ?? item.priorityLevel ?? item.priority_level),
        examFrequencyScore: normalizeNullableNumber(item.examFrequencyScore ?? item.exam_frequency_score),
      }
    })
    .filter((entry): entry is PriorityTopic => Boolean(entry))
}

function normalizeCourseworkList(value: unknown): CourseworkPlanItem[] {
  if (!Array.isArray(value)) return []

  return value
    .map((entry, index) => {
      if (!entry || typeof entry !== 'object') return null
      const item = entry as Record<string, unknown>
      const task = normalizeText(item.task ?? item.title ?? item.name)

      if (!task) {
        return null
      }

      return {
        id: normalizeText(item.id, `coursework-${index}`),
        task,
        type: normalizeNullableText(item.courseworkType ?? item.coursework_type),
        when: normalizeText(item.when ?? item.timing ?? item.weekDue ?? item.week_due),
        effort: normalizeText(item.effort ?? item.load),
        tips: normalizeText(item.tips ?? item.description),
        weightPercentage: normalizeNullableNumber(item.weightPercentage ?? item.weight_percentage),
        dueDate: normalizeNullableText(item.dueDate ?? item.due_date),
      }
    })
    .filter((entry): entry is CourseworkPlanItem => Boolean(entry))
}

function normalizeAnalysis(value: unknown): SyllabusAnalysisSummary | null {
  if (!value || typeof value !== 'object') return null

  const analysis = value as NormalizedAnalysisPayload
  const status = normalizeText(analysis.status)

  return {
    id: normalizeText(analysis.id),
    courseSummary: normalizeNullableText(analysis.courseSummary),
    keyThemes: normalizeStringList(analysis.keyThemes),
    overallLearningObjectives: normalizeStringList(analysis.overallLearningObjectives),
    totalModulesDetected: normalizeNumber(analysis.totalModulesDetected, 0),
    modelName: normalizeNullableText(analysis.modelName),
    provider: normalizeNullableText(analysis.provider),
    status,
    analysedAt: normalizeNullableText(analysis.analysedAt),
    createdAt: normalizeNullableText(analysis.createdAt),
  }
}

export function mapSyllabusDetailToResult(payload: unknown): SyllabusIntelligenceResult | null {
  if (!payload || typeof payload !== 'object') return null

  const source = payload as NormalizedSyllabusPayload
  const id = normalizeText(source.id)

  if (!id) {
    return null
  }

  const rawExtractedText = normalizeText(source.rawExtractedText)

  return {
    id,
    title: normalizeText(source.title, 'Untitled Syllabus'),
    courseName: normalizeNullableText(source.courseName ?? source.course_name),
    courseCode: normalizeNullableText(source.courseCode ?? source.course_code),
    institution: normalizeNullableText(source.institution),
    instructorName: normalizeNullableText(source.instructorName ?? source.instructor_name),
    semesterLabel: normalizeNullableText(source.semesterLabel ?? source.semester_label),
    semesterStartDate: normalizeNullableText(source.semesterStartDate ?? source.semester_start_date),
    semesterEndDate: normalizeNullableText(source.semesterEndDate ?? source.semester_end_date),
    totalWeeks: normalizeNullableNumber(source.totalWeeks ?? source.total_weeks),
    sourceType: normalizeText(source.sourceType, 'unknown'),
    originalFilename: normalizeNullableText(source.originalFilename),
    rawExtractedText,
    sourceLength: rawExtractedText.length,
    processingStatus: normalizeText(source.processingStatus, 'unknown'),
    createdAt: normalizeText(source.createdAt, new Date().toISOString()),
    updatedAt: normalizeText(source.updatedAt, new Date().toISOString()),
    analysis: normalizeAnalysis(source.analysis),
    modules: normalizeModuleList(source.modules),
    timeline: normalizeTimelineList(source.timeline),
    priorityTopics: normalizePriorityList(source.priority_topics ?? source.priorityTopics),
    coursework: normalizeCourseworkList(source.coursework),
  }
}

function readStoredResults(): SyllabusIntelligenceResult[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed
      .map((entry) => mapSyllabusDetailToResult(entry))
      .filter((entry): entry is SyllabusIntelligenceResult => Boolean(entry))
  } catch {
    return []
  }
}

function writeStoredResults(results: SyllabusIntelligenceResult[]) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(results))
  } catch {
    // ignore local storage write errors
  }
}

export function getStoredSyllabusResults() {
  return readStoredResults()
}

export function persistSyllabusResult(result: SyllabusIntelligenceResult) {
  if (typeof window === 'undefined') return []

  const current = readStoredResults()
  const index = current.findIndex((entry) => entry.id === result.id)

  // Exclude rawExtractedText to save localStorage space
  const { rawExtractedText: _, ...toStore } = result

  if (index >= 0) {
    current[index] = { ...toStore, rawExtractedText: '' }
  } else {
    current.unshift({ ...toStore, rawExtractedText: '' })
  }

  // Cap at 20 most recent results
  const pruned = current.slice(0, 20)
  writeStoredResults(pruned)
  return pruned
}

export function deleteSyllabusResult(resultId: string) {
  if (typeof window === 'undefined') return

  const current = readStoredResults()
  const filtered = current.filter((entry) => entry.id !== resultId)
  writeStoredResults(filtered)
}
