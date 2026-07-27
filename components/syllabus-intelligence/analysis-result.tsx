'use client'

import { useMemo } from 'react'
import {
  ArrowLeft,
  BookOpenCheck,
  Building2,
  CalendarClock,
  CalendarRange,
  CheckCircle2,
  Circle,
  ClipboardList,
  Clock3,
  FileText,
  Flame,
  GraduationCap,
  Layers3,
  ListChecks,
  Sparkles,
  Target,
  TrendingUp,
  User,
} from 'lucide-react'
import { formatUTCDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { type PriorityLevel, type SyllabusIntelligenceResult } from './utils'

interface SyllabusAnalysisResultProps {
  result: SyllabusIntelligenceResult
  onBack: () => void
}

const PRIORITY_ORDER: PriorityLevel[] = ['High', 'Medium', 'Low']

function priorityClass(priority: PriorityLevel) {
  if (priority === 'High') {
    return 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300'
  }

  if (priority === 'Low') {
    return 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
  }

  return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300'
}

function priorityDotClass(priority: PriorityLevel) {
  if (priority === 'High') return 'bg-red-500'
  if (priority === 'Low') return 'bg-slate-400'
  return 'bg-amber-500'
}

function priorityWeight(priority: PriorityLevel) {
  if (priority === 'High') return 0
  if (priority === 'Medium') return 1
  return 2
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
      <p className="font-medium text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
    </div>
  )
}

export default function SyllabusAnalysisResult({ result, onBack }: SyllabusAnalysisResultProps) {
  const completedModuleCount = useMemo(
    () => result.modules.filter((module) => module.isCompleted).length,
    [result.modules],
  )

  const moduleProgressPercent = result.modules.length
    ? Math.round((completedModuleCount / result.modules.length) * 100)
    : 0

  const sortedPriorityTopics = useMemo(
    () => [...result.priorityTopics].sort((a, b) => priorityWeight(a.priority) - priorityWeight(b.priority)),
    [result.priorityTopics],
  )

  const priorityGroups = useMemo(
    () =>
      PRIORITY_ORDER.map((level) => ({
        level,
        items: sortedPriorityTopics.filter((item) => item.priority === level),
      })).filter((group) => group.items.length > 0),
    [sortedPriorityTopics],
  )

  const totalCourseworkWeight = useMemo(
    () =>
      result.coursework.reduce(
        (total, item) => total + (typeof item.weightPercentage === 'number' ? item.weightPercentage : 0),
        0,
      ),
    [result.coursework],
  )

  const currentTimelineWeek = useMemo(
    () => result.timeline.find((item) => item.isCurrentWeek) ?? null,
    [result.timeline],
  )

  const overviewStats = useMemo(
    () => [
      { label: 'Modules', value: result.modules.length, icon: Layers3 },
      { label: 'Study Weeks', value: result.totalWeeks ?? result.timeline.length, icon: Clock3 },
      {
        label: 'Objectives',
        value: result.analysis?.overallLearningObjectives.length ?? 0,
        icon: Target,
      },
      { label: 'Priority Topics', value: result.priorityTopics.length, icon: Flame },
      { label: 'Coursework', value: result.coursework.length, icon: ClipboardList },
    ],
    [
      result.analysis?.overallLearningObjectives.length,
      result.coursework.length,
      result.modules.length,
      result.priorityTopics.length,
      result.timeline.length,
      result.totalWeeks,
    ],
  )

  const summary = result.analysis?.courseSummary ?? 'No AI summary available yet.'
  const sourceName = result.originalFilename ?? result.sourceType.toUpperCase()
  const displayTitle = result.courseName ?? result.title

  const metaLine = [result.courseCode, result.institution, result.instructorName].filter(Boolean).join(' • ')

  const semesterLine = (() => {
    if (result.semesterLabel) return result.semesterLabel
    if (result.semesterStartDate && result.semesterEndDate) {
      return `${formatUTCDate(result.semesterStartDate)} – ${formatUTCDate(result.semesterEndDate)}`
    }
    return null
  })()

  return (
    <div className="h-full w-full overflow-y-auto bg-white">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 px-5 py-3 backdrop-blur-sm lg:px-8">
        <div className="flex items-start gap-4">
          <button
            onClick={onBack}
            className="mt-0.5 inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 transition-colors hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5 text-slate-700" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-lg font-bold text-slate-900">{displayTitle}</h1>
              {result.processingStatus === 'completed' ? (
                <Badge className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                  Analysis complete
                </Badge>
              ) : (
                <Badge variant="outline" className="rounded-full capitalize">
                  {result.processingStatus}
                </Badge>
              )}
            </div>

            <p className="mt-0.5 truncate text-xs text-slate-500">
              {metaLine || `${result.sourceLength.toLocaleString()} characters • ${formatUTCDate(result.updatedAt)}`}
            </p>
          </div>

          {semesterLine && (
            <Badge variant="outline" className="hidden flex-shrink-0 items-center gap-1.5 rounded-full py-1.5 sm:inline-flex">
              <CalendarRange className="h-3.5 w-3.5" />
              {semesterLine}
            </Badge>
          )}
        </div>
      </header>

      <main className="w-full px-5 py-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
        <Tabs defaultValue="overview" className="gap-4">
          <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl border border-slate-200/80 bg-white p-1">
            <TabsTrigger
              value="overview"
              className="rounded-lg px-3 py-1.5 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="modules"
              className="rounded-lg px-3 py-1.5 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Modules
            </TabsTrigger>
            <TabsTrigger
              value="timeline"
              className="rounded-lg px-3 py-1.5 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Timeline
            </TabsTrigger>
            <TabsTrigger
              value="priorities"
              className="rounded-lg px-3 py-1.5 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Priority
            </TabsTrigger>
            <TabsTrigger
              value="planning"
              className="rounded-lg px-3 py-1.5 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Coursework
            </TabsTrigger>
          </TabsList>

          {/* ---------------- OVERVIEW ---------------- */}
          <TabsContent value="overview" className="space-y-4">
            <Card className="overflow-hidden border-slate-200/80 shadow-sm">
              <div className="h-1 bg-gradient-to-r from-primary/90 via-primary/40 to-transparent" />
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-xl text-slate-900">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Course Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="leading-relaxed text-slate-700">{summary}</p>

                {currentTimelineWeek && (
                  <div className="mt-4 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <CalendarClock className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <p className="text-sm text-slate-700">
                      You&apos;re currently in <span className="font-semibold">{currentTimelineWeek.weekRange}</span>
                      {currentTimelineWeek.focus ? ` — focused on ${currentTimelineWeek.focus}` : ''}.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {overviewStats.map((item) => {
                const Icon = item.icon
                return (
                  <Card key={item.label} className="gap-3 border-slate-200/80 py-4 shadow-sm">
                    <CardContent className="px-4">
                      <div className="mb-2 inline-flex items-center gap-1.5 text-xs text-slate-600">
                        <Icon className="h-3.5 w-3.5" />
                        <span>{item.label}</span>
                      </div>
                      <p className="text-2xl font-bold text-slate-900">{item.value}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {result.analysis?.keyThemes && result.analysis.keyThemes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {result.analysis.keyThemes.map((theme) => (
                  <Badge key={theme} variant="secondary" className="text-xs">
                    {theme}
                  </Badge>
                ))}
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <Card className="border-slate-200/80 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                    <Target className="h-5 w-5 text-primary" />
                    Learning Objectives
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {result.analysis?.overallLearningObjectives.length ? (
                    <div className="grid gap-2 md:grid-cols-2">
                      {result.analysis.overallLearningObjectives.map((objective, index) => (
                        <div
                          key={`${objective}-${index}`}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
                        >
                          <span className="mr-2 font-semibold text-primary">{index + 1}.</span>
                          <span className="text-slate-700">{objective}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="No learning objectives available"
                      description="The completed syllabus did not include overall learning objectives."
                    />
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200/80 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                    <FileText className="h-5 w-5 text-primary" />
                    Course Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-700">
                  {result.institution && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1.5 text-slate-600">
                        <Building2 className="h-3.5 w-3.5" /> Institution
                      </span>
                      <span className="truncate text-right text-slate-900">{result.institution}</span>
                    </div>
                  )}
                  {result.instructorName && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1.5 text-slate-600">
                        <User className="h-3.5 w-3.5" /> Instructor
                      </span>
                      <span className="truncate text-right text-slate-900">{result.instructorName}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-600">Source</span>
                    <span className="truncate text-right text-slate-900">{sourceName}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-600">Created</span>
                    <span className="text-slate-900">{formatUTCDate(result.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-600">Model</span>
                    <span className="text-slate-900">{result.analysis?.modelName ?? 'Unknown'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-600">Provider</span>
                    <span className="text-slate-900">{result.analysis?.provider ?? 'Unknown'}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-slate-200/80 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                  <Flame className="h-5 w-5 text-primary" />
                  Highest Priority Topics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sortedPriorityTopics.length ? (
                  sortedPriorityTopics.slice(0, 3).map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-200/80 bg-slate-50 p-3.5">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="font-semibold text-slate-900">{item.topic}</p>
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${priorityClass(item.priority)}`}>
                          {item.priority}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700">
                        {item.reason || 'No recommendation details were provided.'}
                      </p>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    title="No priority topics available"
                    description="The completed syllabus did not include priority recommendations."
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------- MODULES ---------------- */}
          <TabsContent value="modules" className="space-y-4">
            <Card className="border-slate-200/80 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                    <BookOpenCheck className="h-5 w-5 text-primary" />
                    Structured Modules
                  </CardTitle>
                  {result.modules.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-600">
                        {completedModuleCount}/{result.modules.length} completed
                      </span>
                      <Progress value={moduleProgressPercent} className="h-2 w-24" />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {result.modules.length ? (
                  <Accordion type="multiple" className="w-full">
                    {result.modules.map((module, index) => (
                      <AccordionItem value={module.id} key={module.id}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex w-full items-center gap-3 pr-2">
                            {module.isCompleted ? (
                              <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                            ) : (
                              <Circle className="h-4 w-4 flex-shrink-0 text-slate-300" />
                            )}
                            <span className="flex-shrink-0 text-xs font-semibold text-slate-400">
                              {String(module.moduleNumber ?? index + 1).padStart(2, '0')}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-left font-semibold text-slate-900">
                              {module.title}
                            </span>
                            <div className="flex flex-shrink-0 items-center gap-1.5">
                              <span
                                className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${priorityClass(module.priority)}`}
                              >
                                {module.priority}
                              </span>
                              {module.weekNumber ? (
                                <Badge variant="outline" className="rounded-full gap-1.5">
                                  Week {module.weekNumber}
                                </Badge>
                              ) : module.estimatedWeeks ? (
                                <Badge variant="outline" className="rounded-full gap-1.5">
                                  <Clock3 className="h-3.5 w-3.5" />
                                  {module.estimatedWeeks} week{module.estimatedWeeks === 1 ? '' : 's'}
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4">
                          {module.description && (
                            <p className="text-sm leading-relaxed text-slate-700">{module.description}</p>
                          )}

                          {module.topics.length ? (
                            <div>
                              <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                <ListChecks className="h-3.5 w-3.5" /> Key Topics
                              </p>
                              <div className="grid gap-2 md:grid-cols-2">
                                {module.topics.map((topic, topicIndex) => (
                                  <div
                                    key={`${topic}-${topicIndex}`}
                                    className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3"
                                  >
                                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary/85" />
                                    <span className="text-sm text-slate-700">{topic}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <EmptyState
                              title="No module topics available"
                              description="This module was returned without topic details."
                            />
                          )}

                          {module.deliverables.length > 0 && (
                            <div>
                              <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                <ClipboardList className="h-3.5 w-3.5" /> Deliverables
                              </p>
                              <ul className="space-y-1.5">
                                {module.deliverables.map((deliverable, deliverableIndex) => (
                                  <li
                                    key={`${deliverable}-${deliverableIndex}`}
                                    className="flex items-start gap-2 text-sm text-slate-700"
                                  >
                                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary/70" />
                                    {deliverable}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <EmptyState
                    title="No modules available"
                    description="The completed syllabus did not include a module breakdown."
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------- TIMELINE ---------------- */}
          <TabsContent value="timeline" className="space-y-4">
            <Card className="border-slate-200/80 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                  <CalendarRange className="h-5 w-5 text-primary" />
                  Semester Study Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.timeline.length ? (
                  <div className="relative space-y-3 pl-6">
                    <div className="absolute left-[10px] top-1 bottom-1 w-px bg-slate-300" />
                    {result.timeline.map((item) => (
                      <div
                        key={item.id}
                        className={`relative rounded-xl border p-4 ${
                          item.isCurrentWeek
                            ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
                            : 'border-slate-200 bg-slate-50'
                        }`}
                      >
                        <span
                          className={`absolute -left-[21px] top-6 h-3 w-3 rounded-full ring-4 ring-white ${
                            item.isCurrentWeek ? 'bg-primary' : 'bg-slate-400'
                          }`}
                        />
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={`rounded-full ${item.isCurrentWeek ? 'bg-primary/15 text-primary' : ''}`}
                          >
                            {item.weekRange}
                          </Badge>
                          {item.isCurrentWeek && (
                            <Badge className="rounded-full border-primary/30 bg-primary text-white hover:bg-primary">
                              Current week
                            </Badge>
                          )}
                          {(item.weekStartDate || item.weekEndDate) && (
                            <span className="text-xs text-slate-500">
                              {item.weekStartDate ? formatUTCDate(item.weekStartDate) : ''}
                              {item.weekStartDate && item.weekEndDate ? ' – ' : ''}
                              {item.weekEndDate ? formatUTCDate(item.weekEndDate) : ''}
                            </span>
                          )}
                          {item.estimatedStudyHours ? (
                            <Badge variant="outline" className="ml-auto rounded-full gap-1.5">
                              <Clock3 className="h-3.5 w-3.5" />
                              {item.estimatedStudyHours}h study
                            </Badge>
                          ) : null}
                        </div>

                        <p className="mb-2 font-semibold text-slate-900">{item.focus}</p>

                        {item.scheduledModules.length > 0 && (
                          <div className="mb-3 flex flex-wrap gap-1.5">
                            {item.scheduledModules.map((moduleName, moduleIndex) => (
                              <Badge key={`${moduleName}-${moduleIndex}`} variant="outline" className="rounded-full text-xs">
                                {moduleName}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {item.outcomes.length ? (
                          <ul className="space-y-1.5">
                            {item.outcomes.map((outcome, outcomeIndex) => (
                              <li key={`${outcome}-${outcomeIndex}`} className="flex items-start gap-2 text-sm">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary/85" />
                                <span className="text-slate-700">{outcome}</span>
                              </li>
                            ))}
                          </ul>
                        ) : null}

                        {item.studyRecommendations.length > 0 && (
                          <div className="mt-3 rounded-lg border border-slate-200 bg-white p-2.5">
                            <p className="mb-1 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                              <TrendingUp className="h-3.5 w-3.5" /> Study tips
                            </p>
                            <ul className="space-y-1 text-sm text-slate-700">
                              {item.studyRecommendations.map((tip, tipIndex) => (
                                <li key={`${tip}-${tipIndex}`}>{tip}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No timeline available"
                    description="The completed syllabus did not include a semester timeline."
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------- PRIORITIES ---------------- */}
          <TabsContent value="priorities" className="space-y-4">
            {priorityGroups.length ? (
              priorityGroups.map((group) => (
                <Card key={group.level} className="border-slate-200/80 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                      <span className={`h-2.5 w-2.5 rounded-full ${priorityDotClass(group.level)}`} />
                      {group.level} Priority
                      <span className="text-sm font-normal text-slate-500">({group.items.length})</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-2">
                    {group.items.map((item) => (
                      <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <p className="font-semibold text-slate-900">{item.topic}</p>
                          <span className={`inline-flex flex-shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${priorityClass(item.priority)}`}>
                            {item.priority}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700">
                          {item.reason || 'No recommendation details were provided.'}
                        </p>
                        {typeof item.examFrequencyScore === 'number' && (
                          <p className="mt-2 text-xs text-slate-500">
                            Exam frequency score: <span className="font-medium text-slate-700">{item.examFrequencyScore}</span>
                          </p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-slate-200/80 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                    <Flame className="h-5 w-5 text-primary" />
                    Priority Topic Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EmptyState
                    title="No priority topics available"
                    description="The completed syllabus did not include priority recommendations."
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ---------------- COURSEWORK ---------------- */}
          <TabsContent value="planning" className="space-y-4">
            <Card className="border-slate-200/80 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    Coursework Planning Assistance
                  </CardTitle>
                  {totalCourseworkWeight > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-600">{totalCourseworkWeight}% of grade</span>
                      <Progress value={Math.min(totalCourseworkWeight, 100)} className="h-2 w-24" />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.coursework.length ? (
                  result.coursework.map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="font-semibold text-slate-900">{item.task}</p>
                        {typeof item.weightPercentage === 'number' && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                            <GraduationCap className="h-3.5 w-3.5" />
                            {item.weightPercentage}%
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.type ? (
                          <Badge variant="outline" className="rounded-full capitalize">
                            {item.type}
                          </Badge>
                        ) : null}
                        {item.when ? <Badge variant="outline" className="rounded-full">{item.when}</Badge> : null}
                        {item.dueDate ? (
                          <Badge variant="outline" className="rounded-full gap-1.5">
                            <CalendarClock className="h-3.5 w-3.5" />
                            {formatUTCDate(item.dueDate)}
                          </Badge>
                        ) : null}
                        {item.effort ? <Badge variant="outline" className="rounded-full">{item.effort}</Badge> : null}
                      </div>
                      {item.tips ? <p className="mt-3 text-sm text-slate-700">{item.tips}</p> : null}
                    </div>
                  ))
                ) : (
                  <EmptyState
                    title="No coursework guidance available"
                    description="The completed syllabus did not include coursework planning details."
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </main>
    </div>
  )
}
