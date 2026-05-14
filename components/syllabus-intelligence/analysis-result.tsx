'use client'

import { useMemo } from 'react'
import {
  ArrowLeft,
  BookOpenCheck,
  CalendarRange,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  Flame,
  Layers3,
  Target,
} from 'lucide-react'
import { formatUTCDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { type PriorityLevel, type SyllabusIntelligenceResult } from './utils'

interface SyllabusAnalysisResultProps {
  result: SyllabusIntelligenceResult
  onBack: () => void
}

function priorityClass(priority: PriorityLevel) {
  if (priority === 'High') {
    return 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300'
  }

  if (priority === 'Low') {
    return 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
  }

  return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300'
}

function priorityWeight(priority: PriorityLevel) {
  if (priority === 'High') return 0
  if (priority === 'Medium') return 1
  return 2
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border/70 bg-secondary/15 p-6 text-center">
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

export default function SyllabusAnalysisResult({ result, onBack }: SyllabusAnalysisResultProps) {
  const totalModuleWeeks = useMemo(
    () => result.modules.reduce((total, module) => total + (module.estimatedWeeks ?? 0), 0),
    [result.modules],
  )

  const sortedPriorityTopics = useMemo(
    () => [...result.priorityTopics].sort((a, b) => priorityWeight(a.priority) - priorityWeight(b.priority)),
    [result.priorityTopics],
  )

  const overviewStats = useMemo(
    () => [
      { label: 'Modules', value: result.modules.length, icon: Layers3 },
      {
        label: 'Objectives',
        value: result.analysis?.overallLearningObjectives.length ?? 0,
        icon: Target,
      },
      { label: 'Study Weeks', value: totalModuleWeeks, icon: Clock3 },
      { label: 'Timeline Blocks', value: result.timeline.length, icon: CalendarRange },
    ],
    [result.analysis?.overallLearningObjectives.length, result.modules.length, result.timeline.length, totalModuleWeeks],
  )

  const summary = result.analysis?.courseSummary ?? 'No AI summary available yet.'
  const sourceName = result.originalFilename ?? result.sourceType.toUpperCase()

  return (
    <div className="h-full w-full overflow-y-auto bg-background">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="mx-auto w-full max-w-7xl px-4 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" size="sm" onClick={onBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold text-foreground md:text-lg">{result.title}</p>
              <p className="truncate text-xs text-muted-foreground md:text-sm">
                Updated on {formatUTCDate(result.updatedAt)} • {result.sourceLength.toLocaleString()} characters analyzed
              </p>
            </div>

            <Badge variant="outline" className="hidden rounded-full md:inline-flex">
              {result.processingStatus}
            </Badge>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">
        <Tabs defaultValue="overview" className="gap-4">
          <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl border border-border/70 bg-card p-1">
            <TabsTrigger
              value="overview"
              className="rounded-lg px-3 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="modules"
              className="rounded-lg px-3 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Modules
            </TabsTrigger>
            <TabsTrigger
              value="timeline"
              className="rounded-lg px-3 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Timeline
            </TabsTrigger>
            <TabsTrigger
              value="priorities"
              className="rounded-lg px-3 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Priority
            </TabsTrigger>
            <TabsTrigger
              value="planning"
              className="rounded-lg px-3 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Coursework
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card className="overflow-hidden border-border/80 shadow-sm">
              <div className="h-1 bg-gradient-to-r from-primary/90 via-primary/40 to-transparent" />
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">Course Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/90 leading-relaxed">{summary}</p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {overviewStats.map((item) => {
                const Icon = item.icon
                return (
                  <Card key={item.label} className="gap-3 border-border/70 py-4 shadow-sm">
                    <CardContent className="px-4">
                      <div className="mb-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Icon className="h-3.5 w-3.5" />
                        <span>{item.label}</span>
                      </div>
                      <p className="text-2xl font-bold text-foreground">{item.value}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <Card className="border-border/80 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
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
                          className="rounded-lg border border-border/70 bg-secondary/25 px-3 py-2.5 text-sm"
                        >
                          <span className="mr-2 font-semibold text-primary">{index + 1}.</span>
                          <span className="text-foreground/90">{objective}</span>
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

              <Card className="border-border/80 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-primary" />
                    Source Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-foreground/90">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Source</span>
                    <span className="truncate text-right">{sourceName}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Type</span>
                    <span>{result.sourceType}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Created</span>
                    <span>{formatUTCDate(result.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Model</span>
                    <span>{result.analysis?.modelName ?? 'Unknown'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Provider</span>
                    <span>{result.analysis?.provider ?? 'Unknown'}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/80 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Flame className="h-5 w-5 text-primary" />
                  Highest Priority Topics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sortedPriorityTopics.length ? (
                  sortedPriorityTopics.slice(0, 3).map((item, index) => (
                    <div key={`${item.topic}-${index}`} className="rounded-xl border border-border/70 bg-secondary/25 p-3.5">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="font-semibold text-foreground">{item.topic}</p>
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${priorityClass(item.priority)}`}>
                          {item.priority}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/90">
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

          <TabsContent value="modules" className="space-y-4">
            <Card className="border-border/80 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpenCheck className="h-5 w-5 text-primary" />
                  Structured Modules
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.modules.length ? (
                  <Accordion type="multiple" className="w-full">
                    {result.modules.map((module, index) => (
                      <AccordionItem value={`module-${index}`} key={`${module.title}-${index}`}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex w-full items-center justify-between gap-3 pr-2">
                            <span className="text-left font-semibold text-foreground">{module.title}</span>
                            {module.estimatedWeeks ? (
                              <Badge variant="outline" className="rounded-full gap-1.5">
                                <Clock3 className="h-3.5 w-3.5" />
                                {module.estimatedWeeks} week{module.estimatedWeeks === 1 ? '' : 's'}
                              </Badge>
                            ) : null}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          {module.topics.length ? (
                            <div className="grid gap-2 md:grid-cols-2">
                              {module.topics.map((topic, topicIndex) => (
                                <div key={`${topic}-${topicIndex}`} className="flex items-start gap-2 rounded-lg border border-border/70 bg-secondary/20 p-3">
                                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary/85" />
                                  <span className="text-sm text-foreground/90">{topic}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <EmptyState
                              title="No module topics available"
                              description="This module was returned without topic details."
                            />
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

          <TabsContent value="timeline" className="space-y-4">
            <Card className="border-border/80 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarRange className="h-5 w-5 text-primary" />
                  Semester Study Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.timeline.length ? (
                  <div className="relative space-y-3 pl-6">
                    <div className="absolute left-[10px] top-1 bottom-1 w-px bg-border" />
                    {result.timeline.map((item, index) => (
                      <div key={`${item.weekRange}-${index}`} className="relative rounded-xl border border-border/70 bg-secondary/20 p-4">
                        <span className="absolute -left-[21px] top-6 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                        <Badge variant="secondary" className="mb-2 rounded-full">
                          {item.weekRange}
                        </Badge>
                        <p className="mb-2 font-semibold text-foreground">{item.focus}</p>
                        {item.outcomes.length ? (
                          <ul className="space-y-1.5">
                            {item.outcomes.map((outcome, outcomeIndex) => (
                              <li key={`${outcome}-${outcomeIndex}`} className="flex items-start gap-2 text-sm">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary/85" />
                                <span className="text-foreground/90">{outcome}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">No outcomes were provided for this timeline item.</p>
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

          <TabsContent value="priorities" className="space-y-4">
            <Card className="border-border/80 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Flame className="h-5 w-5 text-primary" />
                  Priority Topic Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {sortedPriorityTopics.length ? (
                  sortedPriorityTopics.map((item, index) => (
                    <div key={`${item.topic}-${index}`} className="rounded-xl border border-border/70 bg-secondary/25 p-4">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <p className="font-semibold text-foreground">{item.topic}</p>
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${priorityClass(item.priority)}`}>
                          {item.priority}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/90">
                        {item.reason || 'No recommendation details were provided.'}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="md:col-span-2">
                    <EmptyState
                      title="No priority topics available"
                      description="The completed syllabus did not include priority recommendations."
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="planning" className="space-y-4">
            <Card className="border-border/80 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  Coursework Planning Assistance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.coursework.length ? (
                  result.coursework.map((item, index) => (
                    <div key={`${item.task}-${index}`} className="rounded-xl border border-border/70 bg-secondary/25 p-4">
                      <p className="font-semibold text-foreground">{item.task}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.when ? <Badge variant="outline" className="rounded-full">{item.when}</Badge> : null}
                        {item.effort ? <Badge variant="outline" className="rounded-full">{item.effort}</Badge> : null}
                      </div>
                      {item.tips ? <p className="mt-3 text-sm text-foreground/90">{item.tips}</p> : null}
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
      </main>
    </div>
  )
}
