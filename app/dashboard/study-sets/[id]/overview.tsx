'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  Edit3,
  FileCheck2,
  FileText,
  GraduationCap,
  Headphones,
  Layers3,
  Lightbulb,
  ListChecks,
  LoaderCircle,
  LockKeyhole,
  MessageCircleQuestion,
  MoreHorizontal,
  PenSquare,
  Play,
  RefreshCw,
  RotateCw,
  ShieldCheck,
  Sparkles,
  Target,
  TimerReset,
  TrendingUp,
} from 'lucide-react'

import type {
  AdaptiveJourneyDay,
  AdaptiveJourneyObjective,
  AdaptiveJourneyViewModel,
  ObjectiveStatus,
} from '@/components/study-sets/adaptive-study-journey.types'
import {
  type StudySetUiSectionType,
  toUiSectionType,
  uiSectionTypeLabels,
} from '@/components/study-sets/generation-mapping'
import type { StudySet } from '@/components/study-sets/utils'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import type { StoredStudySetGenerationMeta } from '@/lib/api/study-sets.storage'
import { fetchStudySetProgress, type StudySetProgressResponse } from '@/lib/api/study-sets.service'

type CardStatus = 'ready' | 'generating' | 'fetching' | 'failed'

interface StudySetOverviewProps {
  studySetId: string
  studySet: StudySet | null
  generationMeta: StoredStudySetGenerationMeta | null
  onOpenSection: (sectionType: StudySetUiSectionType) => void
  onRetrySection?: (sectionType: StudySetUiSectionType) => Promise<void>
}

const objectiveStatusMeta: Record<
  ObjectiveStatus,
  { label: string; text: string; dot: string; bar: string }
> = {
  not_started: {
    label: 'Not started',
    text: 'text-slate-500',
    dot: 'bg-slate-300',
    bar: 'bg-slate-300',
  },
  building: {
    label: 'Building',
    text: 'text-amber-700',
    dot: 'bg-amber-400',
    bar: 'bg-amber-400',
  },
  stable: {
    label: 'Stable',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
    bar: 'bg-blue-500',
  },
  transfer_ready: {
    label: 'Transfer-ready',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    bar: 'bg-emerald-500',
  },
}

const missionStepIcons = {
  recall: TimerReset,
  explain: BookOpen,
  guided_practice: MessageCircleQuestion,
  independent_check: Target,
  teach_back: GraduationCap,
}

function clamp(value: number, minimum = 0, maximum = 100) {
  return Math.min(maximum, Math.max(minimum, value))
}

function toPercent(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 0
  return clamp(Math.round(value <= 1 ? value * 100 : value))
}

function getCardStatus(
  sectionType: StudySetUiSectionType,
  studySet: StudySet | null,
  generationMeta: StoredStudySetGenerationMeta | null,
): CardStatus {
  const section = studySet?.sections.find((candidate) => candidate.type === sectionType)

  if (section?.status === 'failed') return 'failed'
  if (
    section?.status === 'processing' ||
    section?.status === 'pending' ||
    section?.status === 'in_progress' ||
    section?.status === 'generating' ||
    section?.status === 'queued'
  ) {
    return 'generating'
  }
  if (section && (!section.status || section.status === 'completed' || section.status === 'ready')) {
    return 'ready'
  }

  if (!generationMeta) return section ? 'ready' : 'generating'

  const job = generationMeta.jobs.find((candidate) => toUiSectionType(candidate.type) === sectionType)
  if (!job) return 'generating'
  if (job.status === 'failed') return 'failed'
  if (job.status === 'completed') {
    return generationMeta.fetchedOutputs[job.jobId]?.fetched ? 'ready' : 'fetching'
  }
  return 'generating'
}

function getSectionIcon(sectionType: StudySetUiSectionType) {
  const icons: Record<StudySetUiSectionType, typeof FileText> = {
    notes: FileText,
    multipleChoice: ListChecks,
    flashcards: Layers3,
    podcast: Headphones,
    tutorLesson: GraduationCap,
    writtenTests: PenSquare,
    fillInTheBlanks: Edit3,
  }
  return icons[sectionType]
}

function getSectionDescription(sectionType: StudySetUiSectionType) {
  const descriptions: Record<StudySetUiSectionType, string> = {
    notes: 'Source-grounded notes',
    multipleChoice: 'Recognition practice',
    flashcards: 'Quick active recall',
    podcast: 'Listen and review',
    tutorLesson: 'Guided explanation',
    writtenTests: 'Written response practice',
    fillInTheBlanks: 'Memory checks',
  }
  return descriptions[sectionType]
}

function extractTopics(studySet: StudySet) {
  const topics = studySet.sections
    .flatMap((section) => section.items)
    .map((item) => (item && typeof item === 'object' && typeof item.topic === 'string' ? item.topic.trim() : ''))
    .filter(Boolean)

  return Array.from(new Set(topics)).slice(0, 5)
}

function buildObjectives(studySet: StudySet, progress: StudySetProgressResponse | null): AdaptiveJourneyObjective[] {
  const topics = extractTopics(studySet)
  const titles = topics.length
    ? topics
    : [
        `Core ideas in ${studySet.title}`,
        'Connect the key concepts',
        'Apply ideas to a new example',
        'Explain the topic in your own words',
        'Exam-style mixed practice',
      ]

  const counts = progress?.summary ?? studySet.stats
  const totalEvidence =
    progress?.summary.total_items ||
    counts.unfamiliar + counts.learning + counts.familiar + counts.mastered
  const objectiveCount = titles.length
  const transferReadyCount = totalEvidence > 0 ? Math.round((counts.mastered / totalEvidence) * objectiveCount) : 0
  const stableCount = totalEvidence > 0 ? Math.round((counts.familiar / totalEvidence) * objectiveCount) : 0
  const buildingCount = totalEvidence > 0 ? Math.round((counts.learning / totalEvidence) * objectiveCount) : 0

  return titles.map((title, index) => {
    let status: ObjectiveStatus = 'not_started'
    let masteryPercent = 0
    let evidenceLabel = 'No evidence yet'

    if (totalEvidence > 0) {
      if (index < transferReadyCount) {
        status = 'transfer_ready'
        masteryPercent = 90
        evidenceLabel = 'Strong evidence collected'
      } else if (index < transferReadyCount + stableCount) {
        status = 'stable'
        masteryPercent = 76
        evidenceLabel = 'Recall is holding'
      } else if (index < transferReadyCount + stableCount + buildingCount) {
        status = 'building'
        masteryPercent = 48
        evidenceLabel = 'Needs another check'
      }
    } else if (index === 0) {
      status = 'building'
      masteryPercent = 24
      evidenceLabel = 'Diagnostic recommended'
    }

    return {
      id: `objective-${index + 1}`,
      title,
      status,
      masteryPercent,
      evidenceLabel,
      sourceLabel: index === 0 ? 'Primary source · key section' : `Source group · ${index + 1}`,
      reviewLabel: status === 'building' ? 'Review due soon' : undefined,
    }
  })
}

function buildWeek(dailyMinutes: number): AdaptiveJourneyDay[] {
  return [
    { id: 'mon', shortLabel: 'MON', dateLabel: '20', minutes: 18, status: 'completed', focus: 'Diagnostic' },
    { id: 'tue', shortLabel: 'TUE', dateLabel: '21', minutes: 22, status: 'completed', focus: 'Core concepts' },
    { id: 'wed', shortLabel: 'WED', dateLabel: '22', minutes: 0, status: 'rest', focus: 'Rest day' },
    { id: 'thu', shortLabel: 'THU', dateLabel: '23', minutes: dailyMinutes, status: 'today', focus: 'Misconception repair' },
    { id: 'fri', shortLabel: 'FRI', dateLabel: '24', minutes: 16, status: 'planned', focus: 'Application' },
    { id: 'sat', shortLabel: 'SAT', dateLabel: '25', minutes: 12, status: 'planned', focus: 'Delayed review' },
    { id: 'sun', shortLabel: 'SUN', dateLabel: '26', minutes: 20, status: 'planned', focus: 'Mixed practice' },
  ]
}

function buildJourneyViewModel(
  studySet: StudySet,
  progress: StudySetProgressResponse | null,
  dailyMinutes: number,
): AdaptiveJourneyViewModel {
  const objectives = buildObjectives(studySet, progress)
  const summary = progress?.summary
  const weightedMastery = summary?.total_items
    ? Math.round(
        ((summary.learning * 0.3 + summary.familiar * 0.68 + summary.mastered) / summary.total_items) * 100,
      )
    : 0
  const totalAttempts = summary?.total_attempts ?? 0
  const focusObjective = objectives.find((objective) => objective.status === 'building') ?? objectives[0]
  const selections = (studySet.selections || []) as StudySetUiSectionType[]
  const readySources = studySet.sections.filter(
    (section) => !section.status || section.status === 'completed' || section.status === 'ready',
  ).length

  return {
    studySetId: studySet.id,
    course: {
      title: studySet.title,
      code: 'COURSE',
      assessmentLabel: 'Exam date not set',
      daysRemaining: null,
      dailyMinutes,
    },
    readiness: {
      percent: weightedMastery,
      changeThisWeek: totalAttempts > 0 ? 9 : 0,
      readyObjectives: objectives.filter(
        (objective) => objective.status === 'stable' || objective.status === 'transfer_ready',
      ).length,
      totalObjectives: objectives.length,
      label: totalAttempts > 0 ? 'Building' : 'Start with a diagnostic',
    },
    mission: {
      id: 'mission-preview',
      eyebrow: totalAttempts > 0 ? "TODAY'S BEST NEXT STEP" : 'YOUR FIRST BEST STEP',
      title: totalAttempts > 0 ? `Strengthen ${focusObjective.title}` : 'Build your learning baseline',
      objectiveTitle: focusObjective.title,
      reason:
        totalAttempts > 0
          ? 'This area has the weakest evidence and will unlock the most progress next.'
          : 'A short diagnostic lets your coach skip what you know and focus on what needs work.',
      estimatedMinutes: Math.min(dailyMinutes, totalAttempts > 0 ? 14 : 8),
      completedSteps: 0,
      steps: [
        { id: 'step-1', label: 'Quick recall', type: 'recall', minutes: 1 },
        { id: 'step-2', label: 'Focused explanation', type: 'explain', minutes: 3 },
        { id: 'step-3', label: 'Guided practice', type: 'guided_practice', minutes: 4 },
        { id: 'step-4', label: 'Independent check', type: 'independent_check', minutes: 4 },
        { id: 'step-5', label: 'Teach it back', type: 'teach_back', minutes: 2 },
      ],
    },
    coachInsight: {
      eyebrow: 'COACH INSIGHT',
      title: totalAttempts > 0 ? 'Your next gain will come from application' : 'Let’s remove the guesswork',
      body:
        totalAttempts > 0
          ? 'Recognition looks stronger than independent explanation. Today’s mission closes that gap.'
          : 'Once the diagnostic is complete, every lesson and review will be chosen from your own evidence.',
      actionLabel: totalAttempts > 0 ? 'See the evidence' : 'How adaptation works',
    },
    reviews:
      totalAttempts > 0
        ? [
            {
              id: 'review-1',
              title: objectives[1]?.title ?? focusObjective.title,
              dueLabel: 'Due now',
              minutes: 2,
              urgency: 'due',
            },
            {
              id: 'review-2',
              title: objectives[2]?.title ?? focusObjective.title,
              dueLabel: 'Later today',
              minutes: 3,
              urgency: 'soon',
            },
          ]
        : [],
    objectives,
    week: buildWeek(dailyMinutes),
    sourceHealth: {
      ready: readySources,
      total: Math.max(selections.length, studySet.sections.length),
      label:
        readySources >= Math.max(selections.length, studySet.sections.length)
          ? 'All sources are ready'
          : 'Some learning tools are still generating',
    },
  }
}

function ReadinessRing({ value }: { value: number }) {
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const dash = (clamp(value) / 100) * circumference

  return (
    <div className="relative h-32 w-32 shrink-0" role="img" aria-label={`Readiness ${value}%`}>
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#ffffff"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          strokeWidth="8"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <span className="text-3xl font-bold tracking-tight">{value}%</span>
        <span className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-100">
          readiness
        </span>
      </div>
    </div>
  )
}

export function StudySetOverview({
  studySetId,
  studySet,
  generationMeta,
  onOpenSection,
  onRetrySection,
}: StudySetOverviewProps) {
  const [progress, setProgress] = useState<StudySetProgressResponse | null>(null)
  const [dailyMinutes, setDailyMinutes] = useState(20)
  const [showMission, setShowMission] = useState(false)
  const [showReviews, setShowReviews] = useState(false)
  const [showPlan, setShowPlan] = useState(false)
  const [showInsight, setShowInsight] = useState(false)
  const [showProgress, setShowProgress] = useState(false)
  const [missionStep, setMissionStep] = useState(0)
  const [missionComplete, setMissionComplete] = useState(false)
  const [selectedDayId, setSelectedDayId] = useState('thu')
  const [reviewedIds, setReviewedIds] = useState<string[]>([])

  useEffect(() => {
    if (!studySetId) return
    const controller = new AbortController()

    fetchStudySetProgress(studySetId, controller.signal)
      .then(setProgress)
      .catch((error) => {
        if (error instanceof Error && error.name === 'AbortError') return
        console.error('Error fetching study set progress:', error)
      })

    return () => controller.abort()
  }, [studySetId])

  const journey = useMemo(
    () => (studySet ? buildJourneyViewModel(studySet, progress, dailyMinutes) : null),
    [dailyMinutes, progress, studySet],
  )

  if (!studySet || !journey) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
        Study set not found.
      </div>
    )
  }

  const selections = (studySet.selections || []) as StudySetUiSectionType[]
  const selectedDay = journey.week.find((day) => day.id === selectedDayId) ?? journey.week[3]
  const completedReviews = reviewedIds.length
  const currentStep = journey.mission.steps[missionStep]
  const missionStepCount = journey.mission.steps.length

  function advanceMission() {
    if (missionStep >= missionStepCount - 1) {
      setMissionComplete(true)
      return
    }
    setMissionStep((current) => current + 1)
  }

  function closeMission(open: boolean) {
    setShowMission(open)
    if (!open && missionComplete) {
      setMissionStep(0)
    }
  }

  return (
    <div className="mx-auto max-w-[1280px] space-y-5 pb-12">
      <section className="relative overflow-hidden rounded-[30px] border border-blue-300/20 bg-[#0d3f9a] px-6 py-7 text-white shadow-[0_24px_80px_-38px_rgba(13,63,154,.85)] sm:px-8 sm:py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_15%,rgba(96,165,250,.5),transparent_28%),radial-gradient(circle_at_12%_120%,rgba(45,212,191,.22),transparent_38%)]" />
        <div className="absolute inset-y-0 right-[29%] hidden w-px bg-white/10 lg:block" />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_360px] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-50">
                Adaptive journey
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-300/15 px-3 py-1 text-[11px] font-semibold text-emerald-100">
                <ShieldCheck className="h-3.5 w-3.5" />
                Source grounded
              </span>
            </div>

            <p className="mt-5 text-sm font-medium text-blue-100">
              {journey.course.code} · {journey.course.assessmentLabel}
            </p>
            <h1 className="mt-1 max-w-3xl text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
              {journey.course.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
              Your plan changes with every answer. You focus on the next best step; your coach handles the
              sequence.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setShowMission(true)}
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-5 text-sm font-bold text-[#0d3f9a] shadow-lg shadow-blue-950/20 transition hover:-translate-y-0.5 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
              >
                <Play className="h-4 w-4 fill-current" />
                {missionComplete ? 'Review today’s lesson' : 'Start today’s lesson'}
              </button>
              <button
                type="button"
                onClick={() => setShowPlan(true)}
                className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-5 text-sm font-semibold text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20"
              >
                <CalendarDays className="h-4 w-4" />
                Set exam & study time
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-5 rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
            <ReadinessRing value={missionComplete ? clamp(journey.readiness.percent + 4) : journey.readiness.percent} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.17em] text-blue-200">Exam readiness</p>
              <p className="mt-2 text-lg font-semibold">{journey.readiness.label}</p>
              <p className="mt-1 text-sm leading-5 text-blue-100">
                {journey.readiness.readyObjectives} of {journey.readiness.totalObjectives} objectives have
                strong evidence.
              </p>
              <button
                type="button"
                onClick={() => setShowProgress(true)}
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-white hover:text-blue-100"
              >
                View evidence <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,.85fr)]">
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_16px_45px_-34px_rgba(15,23,42,.45)]">
          <div className="border-b border-slate-100 px-6 py-5 sm:px-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700">
                  <Sparkles className="h-4 w-4" />
                  {journey.mission.eyebrow}
                </div>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  {journey.mission.title}
                </h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                <Clock3 className="h-3.5 w-3.5" />
                {journey.mission.estimatedMinutes} min
              </div>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{journey.mission.objectiveTitle}</p>
          </div>

          <div className="p-6 sm:p-7">
            <div className="grid gap-2 sm:grid-cols-5">
              {journey.mission.steps.map((step, index) => {
                const Icon = missionStepIcons[step.type]
                const done = missionComplete || index < missionStep
                const active = !missionComplete && index === missionStep

                return (
                  <div
                    key={step.id}
                    className={`relative rounded-2xl border p-3 transition ${
                      done
                        ? 'border-emerald-200 bg-emerald-50'
                        : active
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-slate-200 bg-slate-50/70'
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                        done
                          ? 'bg-emerald-600 text-white'
                          : active
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-slate-500'
                      }`}
                    >
                      {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <p className="mt-3 text-xs font-semibold leading-4 text-slate-800">{step.label}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{step.minutes} min</p>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 flex flex-col gap-4 rounded-2xl bg-[#f7f9fc] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Why this next?</p>
                  <p className="mt-1 max-w-xl text-sm leading-5 text-slate-700">{journey.mission.reason}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMission(true)}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                {missionComplete ? 'Review lesson' : 'Begin'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        <div className="space-y-5">
          <section className="rounded-[28px] border border-amber-200/80 bg-[#fffaf0] p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <Lightbulb className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700 shadow-sm">
                Personal
              </span>
            </div>
            <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700">
              {journey.coachInsight.eyebrow}
            </p>
            <h3 className="mt-2 text-xl font-semibold leading-6 text-slate-950">{journey.coachInsight.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{journey.coachInsight.body}</p>
            <button
              type="button"
              onClick={() => setShowInsight(true)}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-amber-800 hover:text-amber-950"
            >
              {journey.coachInsight.actionLabel}
              <ChevronRight className="h-4 w-4" />
            </button>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Review queue</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-950">
                  {journey.reviews.length ? `${journey.reviews.length - completedReviews} items due` : 'Nothing due yet'}
                </h3>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <RefreshCw className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-sm leading-5 text-slate-600">
              {journey.reviews.length
                ? 'A quick delayed check keeps today’s learning available on exam day.'
                : 'Your first reviews will appear after the diagnostic and learning session.'}
            </p>
            <button
              type="button"
              disabled={!journey.reviews.length || completedReviews === journey.reviews.length}
              onClick={() => setShowReviews(true)}
              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-800 transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <TimerReset className="h-4 w-4" />
              {completedReviews === journey.reviews.length && journey.reviews.length
                ? 'Reviews complete'
                : journey.reviews.length
                  ? `Start ${journey.reviews.reduce((total, item) => total + item.minutes, 0)}-min review`
                  : 'No review needed'}
            </button>
          </section>
        </div>
      </div>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_45px_-36px_rgba(15,23,42,.4)] sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">Your study rhythm</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">This week’s path</h2>
            <p className="mt-1 text-sm text-slate-600">One focused goal a day. The plan reshuffles when evidence changes.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowPlan(true)}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50"
          >
            <Edit3 className="h-4 w-4" />
            Adjust plan
          </button>
        </div>

        <div className="mt-6 grid grid-cols-4 gap-2 sm:grid-cols-7">
          {journey.week.map((day) => {
            const selected = selectedDayId === day.id
            return (
              <button
                type="button"
                key={day.id}
                onClick={() => setSelectedDayId(day.id)}
                aria-pressed={selected}
                className={`group rounded-2xl border px-2 py-3 text-center transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${
                  selected
                    ? 'border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-200'
                    : day.status === 'completed'
                      ? 'border-emerald-200 bg-emerald-50 text-slate-800'
                      : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:border-blue-200 hover:bg-blue-50'
                }`}
              >
                <span className={`text-[9px] font-bold tracking-[0.12em] ${selected ? 'text-blue-100' : 'text-slate-500'}`}>
                  {day.shortLabel}
                </span>
                <span className="mt-1 block text-lg font-semibold">{day.dateLabel}</span>
                <span className="mt-2 flex justify-center">
                  {day.status === 'completed' ? (
                    <CheckCircle2 className={`h-4 w-4 ${selected ? 'text-white' : 'text-emerald-600'}`} />
                  ) : day.status === 'rest' ? (
                    <MoreHorizontal className="h-4 w-4" />
                  ) : (
                    <Circle className={`h-3.5 w-3.5 ${selected ? 'fill-white text-white' : 'text-slate-300'}`} />
                  )}
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-sm font-bold text-slate-900">{selectedDay.focus}</span>
            <span className="ml-2 text-sm text-slate-500">
              {selectedDay.minutes ? `${selectedDay.minutes} min` : 'Recovery day'}
            </span>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {selectedDay.status === 'today'
              ? 'Today · adapts after each response'
              : selectedDay.status === 'completed'
                ? 'Completed'
                : selectedDay.status === 'rest'
                  ? 'No session planned'
                  : 'Planned'}
          </span>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">Knowledge map</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">What the evidence says</h2>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
              <LockKeyhole className="h-3.5 w-3.5" />
              Private to you
            </div>
          </div>

          <div className="mt-6 divide-y divide-slate-100">
            {journey.objectives.map((objective) => {
              const status = objectiveStatusMeta[objective.status]
              return (
                <button
                  key={objective.id}
                  type="button"
                  onClick={() => setShowProgress(true)}
                  className="group grid w-full gap-3 py-4 text-left sm:grid-cols-[minmax(0,1fr)_170px_24px] sm:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${status.dot}`} />
                      <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-blue-700">
                        {objective.title}
                      </p>
                    </div>
                    <p className="mt-1 pl-[18px] text-xs text-slate-500">{objective.evidenceLabel}</p>
                  </div>
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold">
                      <span className={status.text}>{status.label}</span>
                      <span className="text-slate-500">{objective.masteryPercent}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all ${status.bar}`}
                        style={{ width: `${objective.masteryPercent}%` }}
                      />
                    </div>
                  </div>
                  <ChevronRight className="hidden h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-500 sm:block" />
                </button>
              )
            })}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-[28px] border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <FileCheck2 className="h-5 w-5" />
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Synced
              </span>
            </div>
            <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Source health</p>
            <h3 className="mt-1 text-xl font-semibold text-slate-950">{journey.sourceHealth.label}</h3>
            <p className="mt-2 text-sm leading-5 text-slate-600">
              {journey.sourceHealth.ready} of {journey.sourceHealth.total} learning resources are available.
            </p>
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-800">
              <ShieldCheck className="h-4 w-4" />
              Generated explanations stay linked to your material.
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-[#101828] p-6 text-white">
            <div className="flex items-center gap-2 text-emerald-300">
              <TrendingUp className="h-4 w-4" />
              <span className="text-[11px] font-bold uppercase tracking-[0.16em]">Weekly signal</span>
            </div>
            <p className="mt-4 text-3xl font-semibold tracking-tight">
              {journey.readiness.changeThisWeek ? `+${journey.readiness.changeThisWeek}%` : 'Ready'}
            </p>
            <p className="mt-2 text-sm leading-5 text-slate-300">
              {journey.readiness.changeThisWeek
                ? 'Readiness gained from verified practice this week.'
                : 'Complete the diagnostic to establish your first learning signal.'}
            </p>
          </section>
        </aside>
      </div>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Study tools</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Explore on your own</h2>
            <p className="mt-1 text-sm text-slate-600">Optional tools stay available without competing with your next step.</p>
          </div>
          <span className="text-xs font-semibold text-slate-500">{selections.length} tools</span>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {selections.map((sectionType) => {
            const status = getCardStatus(sectionType, studySet, generationMeta)
            const Icon = getSectionIcon(sectionType)
            const ready = status === 'ready'
            const failed = status === 'failed'
            const section = studySet.sections.find((candidate) => candidate.type === sectionType)
            const count = section?.items?.length ?? 0

            return (
              <div
                key={sectionType}
                className={`relative rounded-2xl border p-4 transition ${
                  ready
                    ? 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'
                    : failed
                      ? 'border-red-200 bg-red-50/40'
                      : 'border-slate-200 bg-slate-50'
                }`}
              >
                <button
                  type="button"
                  disabled={!ready}
                  onClick={() => onOpenSection(sectionType)}
                  className="flex w-full items-center gap-3 text-left disabled:cursor-not-allowed"
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                      ready ? 'bg-blue-50 text-blue-700' : failed ? 'bg-red-100 text-red-700' : 'bg-white text-slate-500'
                    }`}
                  >
                    {status === 'generating' || status === 'fetching' ? (
                      <LoaderCircle className="h-5 w-5 animate-spin" />
                    ) : failed ? (
                      <RotateCw className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-slate-900">
                      {uiSectionTypeLabels[sectionType] ?? sectionType}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-slate-500">
                      {failed
                        ? 'Generation failed'
                        : ready
                          ? `${getSectionDescription(sectionType)}${count ? ` · ${count}` : ''}`
                          : 'Generating…'}
                    </span>
                  </span>
                  {ready && <ChevronRight className="h-4 w-4 text-slate-300" />}
                </button>
                {failed && (
                  <button
                    type="button"
                    onClick={() => onRetrySection?.(sectionType)}
                    className="absolute inset-y-0 right-3 my-auto h-8 rounded-lg px-2 text-xs font-bold text-red-700 hover:bg-red-100"
                  >
                    Retry
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <Dialog open={showMission} onOpenChange={closeMission}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[26px] border-0 p-0 sm:max-w-2xl">
          <div className="rounded-t-[26px] bg-[#0d3f9a] px-6 py-6 text-white">
            <DialogHeader>
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.17em] text-blue-200">
                <Sparkles className="h-4 w-4" />
                Adaptive lesson preview
              </div>
              <DialogTitle className="mt-2 text-2xl leading-tight text-white">
                {missionComplete ? 'Today’s learning is complete' : currentStep.label}
              </DialogTitle>
              <DialogDescription className="text-blue-100">
                {missionComplete
                  ? 'The API will update objective evidence, readiness and the next review.'
                  : `${missionStep + 1} of ${journey.mission.steps.length} · ${currentStep.minutes} min`}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6">
            {missionComplete ? (
              <div className="py-4 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-slate-950">Evidence collected</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                  This UI state is ready for the mission-complete API response: readiness change, repaired
                  misconception and scheduled review.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {[
                    ['+1', 'objective improved'],
                    ['1', 'review scheduled'],
                    ['+4%', 'readiness preview'],
                  ].map(([value, label]) => (
                    <div key={label} className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xl font-bold text-slate-950">{value}</p>
                      <p className="mt-1 text-xs text-slate-500">{label}</p>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setShowMission(false)}
                  className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700"
                >
                  Back to journey
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-1.5" aria-label={`Mission progress: step ${missionStep + 1} of ${journey.mission.steps.length}`}>
                  {journey.mission.steps.map((step, index) => (
                    <span
                      key={step.id}
                      className={`h-1.5 flex-1 rounded-full ${index <= missionStep ? 'bg-blue-600' : 'bg-slate-200'}`}
                    />
                  ))}
                </div>

                <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm">
                    {(() => {
                      const Icon = missionStepIcons[currentStep.type]
                      return <Icon className="h-5 w-5" />
                    })()}
                  </div>
                  <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    UI placeholder
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-950">{journey.mission.objectiveTitle}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    The backend will provide a semantic content block, input type, citations, hints and evaluation
                    rules for this step.
                  </p>
                  <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
                    {currentStep.type === 'recall' && 'Student response area · answer before reveal'}
                    {currentStep.type === 'explain' && 'Short source-cited explanation · layered detail'}
                    {currentStep.type === 'guided_practice' && 'Guided item · hint ladder available'}
                    {currentStep.type === 'independent_check' && 'Fresh transfer question · no hints by default'}
                    {currentStep.type === 'teach_back' && '30–60 second text or voice teach-back'}
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    disabled={missionStep === 0}
                    onClick={() => setMissionStep((current) => Math.max(0, current - 1))}
                    className="h-11 rounded-xl px-4 text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={advanceMission}
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700"
                  >
                    {missionStep === journey.mission.steps.length - 1 ? 'Complete lesson' : 'Continue'}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showReviews} onOpenChange={setShowReviews}>
        <DialogContent className="rounded-[26px] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Due reviews</DialogTitle>
            <DialogDescription>Short delayed checks, selected by forgetting risk.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {journey.reviews.map((review) => {
              const done = reviewedIds.includes(review.id)
              return (
                <button
                  key={review.id}
                  type="button"
                  onClick={() =>
                    setReviewedIds((current) =>
                      current.includes(review.id) ? current : [...current, review.id],
                    )
                  }
                  className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${
                    done ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      done ? 'bg-emerald-600 text-white' : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {done ? <Check className="h-4 w-4" /> : <TimerReset className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-slate-900">{review.title}</span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {done ? 'Review complete' : `${review.dueLabel} · ${review.minutes} min`}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPlan} onOpenChange={setShowPlan}>
        <DialogContent className="rounded-[26px] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Adjust your study plan</DialogTitle>
            <DialogDescription>The backend will recalculate plan feasibility and the weekly path.</DialogDescription>
          </DialogHeader>
          <div>
            <label htmlFor="exam-date" className="text-sm font-bold text-slate-800">
              Exam date
            </label>
            <input
              id="exam-date"
              type="date"
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>
          <fieldset>
            <legend className="text-sm font-bold text-slate-800">Daily study time</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[15, 20, 30].map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => setDailyMinutes(minutes)}
                  className={`h-11 rounded-xl border text-sm font-bold transition ${
                    dailyMinutes === minutes
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300'
                  }`}
                >
                  {minutes} min
                </button>
              ))}
            </div>
          </fieldset>
          <div className="rounded-2xl bg-blue-50 p-4 text-sm leading-5 text-blue-900">
            At {dailyMinutes} minutes a day, the UI will request a recalculated plan from
            <code className="mx-1 rounded bg-white px-1.5 py-0.5 text-xs">PATCH /plan</code>.
          </div>
          <button
            type="button"
            onClick={() => setShowPlan(false)}
            className="h-11 rounded-xl bg-blue-600 text-sm font-bold text-white hover:bg-blue-700"
          >
            Save preview
          </button>
        </DialogContent>
      </Dialog>

      <Dialog open={showInsight} onOpenChange={setShowInsight}>
        <DialogContent className="rounded-[26px] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Why your coach noticed this</DialogTitle>
            <DialogDescription>Every insight will be backed by attempt evidence—not a personality label.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {[
              'Independent explanation is weaker than recognition.',
              'One recent answer was submitted with high confidence.',
              'The objective appears in your highest-priority source group.',
            ].map((item, index) => (
              <div key={item} className="flex gap-3 rounded-2xl bg-slate-50 p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                  {index + 1}
                </span>
                <p className="text-sm leading-5 text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showProgress} onOpenChange={setShowProgress}>
        <DialogContent className="max-h-[88vh] overflow-y-auto rounded-[26px] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Learning evidence</DialogTitle>
            <DialogDescription>
              Mastery becomes stable only after independent and delayed evidence.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['Readiness', `${journey.readiness.percent}%`],
              ['Ready', `${journey.readiness.readyObjectives}/${journey.readiness.totalObjectives}`],
              ['Attempts', String(progress?.summary.total_attempts ?? 0)],
              ['Accuracy', `${toPercent(progress?.summary.overall_accuracy ?? 0)}%`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {journey.objectives.map((objective) => {
              const meta = objectiveStatusMeta[objective.status]
              return (
                <div key={objective.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{objective.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{objective.sourceLabel}</p>
                    </div>
                    <span className={`text-xs font-bold ${meta.text}`}>{meta.label}</span>
                  </div>
                  <Progress value={objective.masteryPercent} className="mt-4 h-1.5" />
                  <p className="mt-2 text-xs text-slate-500">{objective.evidenceLabel}</p>
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
