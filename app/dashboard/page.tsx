'use client'

import Link from 'next/link'
import { type ComponentType } from 'react'
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flame,
  LineChart,
  Medal,
  PenTool,
  PlayCircle,
  Sparkles,
  Target,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

type CourseCard = {
  title: string
  watched: string
  icon: ComponentType<{ className?: string }>
  tint: string
}

type CalendarDay = {
  day: string
  active?: boolean
}

type MiniBar = {
  label: string
  value: number
}

const courseCards: CourseCard[] = [
  {
    title: 'Study Sets',
    watched: '2/8 active',
    icon: BookOpen,
    tint: 'rgba(91,101,224,0.12)',
  },
  {
    title: 'Paper Grader',
    watched: '4 reviews',
    icon: PenTool,
    tint: 'rgba(159,203,152,0.18)',
  },
  {
    title: 'Syllabus Plan',
    watched: '10/25 done',
    icon: Sparkles,
    tint: 'rgba(81,0,167,0.10)',
  },
]

const calendarDays: CalendarDay[] = [
  { day: '01' },
  { day: '02', active: true },
  { day: '03' },
  { day: '04' },
  { day: '05' },
  { day: '06' },
  { day: '07' },
  { day: '08' },
  { day: '09' },
  { day: '10' },
  { day: '11' },
  { day: '12' },
  { day: '13' },
  { day: '14' },
  { day: '15' },
  { day: '16' },
  { day: '17' },
  { day: '18' },
  { day: '19' },
  { day: '20' },
  { day: '21' },
  { day: '22' },
  { day: '23' },
  { day: '24' },
  { day: '25' },
  { day: '26' },
  { day: '27' },
  { day: '28' },
  { day: '29' },
  { day: '30' },
]

const barData: MiniBar[] = [
  { label: 'Mon', value: 36 },
  { label: 'Tue', value: 24 },
  { label: 'Wed', value: 49 },
  { label: 'Thu', value: 67 },
  { label: 'Fri', value: 40 },
  { label: 'Sat', value: 82 },
  { label: 'Sun', value: 59 },
]

const linePoints = '8,88 56,86 84,74 120,92 158,48 196,55 232,34 268,42 304,18 342,46 378,40'

function RadialStat({
  title,
  subtitle,
  value,
  progress,
}: {
  title: string
  subtitle: string
  value: string
  progress: number
}) {
  return (
    <div className="rounded-[24px] bg-[rgba(255,255,255,0.78)] p-4">
      <p className="text-center text-base font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-center text-xs text-muted-foreground">{subtitle}</p>
      <div className="mt-4 flex justify-center">
        <div
          className="relative flex h-24 w-24 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(var(--primary) 0 ${progress}%, rgba(91,101,224,0.12) ${progress}% 100%)`,
          }}
        >
          <div className="flex h-17 w-17 items-center justify-center rounded-full bg-white text-2xl font-semibold text-foreground">
            {value}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardIndexPage() {
  return (
    <section className="min-h-full bg-[linear-gradient(180deg,rgba(245,230,224,0.22)_0%,rgba(255,255,255,1)_24%)] p-4 md:p-5">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.9fr)_340px]">
          <div className="space-y-5">
            <Card className="overflow-hidden border-white/70 bg-white/94 py-0 shadow-[0_18px_48px_rgba(28,35,52,0.06)]">
              <CardContent className="grid gap-4 p-3 md:grid-cols-[minmax(0,1.65fr)_220px] md:p-4">
                <div
                  className="relative overflow-hidden rounded-[24px] p-6 text-white"
                  style={{
                    background:
                      'linear-gradient(100deg, rgba(91,101,224,1) 0%, rgba(81,0,167,0.88) 60%, rgba(91,101,224,0.82) 100%)',
                  }}
                >
                  <div className="absolute inset-y-0 right-0 w-[40%] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.18),transparent_70%)]" />

                  <div className="relative z-10 max-w-xl">
                    <Badge className="rounded-full bg-white/14 px-2.5 py-0.5 text-[11px] text-white hover:bg-white/14">
                      <Sparkles className="h-3.5 w-3.5" />
                      Personalized workspace
                    </Badge>
                    <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-[42px]">
                      Good Evening,
                      <br />
                      Keep Learning.
                    </h1>
                    <p className="mt-2.5 max-w-md text-sm leading-6 text-white/80">
                      Continue the subjects already in motion and finish tonight&apos;s highest-value tasks first.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2.5">
                      <Button asChild className="h-10 rounded-full bg-white px-4 text-primary hover:bg-white/92">
                        <Link href="/dashboard/study-sets">
                          Continue Learning
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="h-10 rounded-full border-white/18 bg-white/8 px-4 text-white hover:bg-white/14 hover:text-white">
                        <Link href="/dashboard/paper-grader">Open Feedback</Link>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex h-full flex-col rounded-[24px] bg-[rgba(245,245,245,0.82)] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">This week</p>
                      <h2 className="mt-1 text-lg font-semibold text-foreground">Study Pulse</h2>
                    </div>
                    <div className="rounded-xl bg-white p-2.5 text-primary shadow-sm">
                      <Flame className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-1 flex-col justify-between space-y-3">
                    <div className="rounded-[18px] bg-white p-3.5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Current streak</p>
                          <p className="mt-1 text-lg font-semibold text-foreground">18 days</p>
                        </div>
                        <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                      </div>
                    </div>
                    <div className="rounded-[18px] bg-white p-3.5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Weekly goal</p>
                          <p className="mt-1 text-lg font-semibold text-foreground">6.5 / 8 hrs</p>
                        </div>
                        <Target className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="rounded-[18px] bg-white p-3.5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Best study time</p>
                          <p className="mt-1 text-lg font-semibold text-foreground">8 PM</p>
                        </div>
                        <Clock3 className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div>
              <h2 className="text-[20px] font-semibold tracking-tight text-foreground">New Courses</h2>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                {courseCards.map((course) => {
                  const Icon = course.icon

                  return (
                    <Card key={course.title} className="border-white/70 bg-white/94 py-0 shadow-[0_14px_36px_rgba(28,35,52,0.05)]">
                      <CardContent className="flex min-h-[104px] items-center gap-3 p-4">
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-[16px]"
                          style={{ backgroundColor: course.tint }}
                        >
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{course.watched}</p>
                          <p className="mt-1 text-lg font-semibold tracking-tight text-foreground">{course.title}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            <div>
              <h2 className="text-[20px] font-semibold tracking-tight text-foreground">Course Statistics</h2>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <Card className="border-white/70 bg-white/94 py-0 shadow-[0_14px_36px_rgba(28,35,52,0.05)]">
                  <CardContent className="flex min-h-[230px] flex-col p-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold text-foreground">Course Overview</p>
                        <p className="mt-3 text-[30px] font-semibold tracking-tight text-foreground">
                          Spoken English For Beginners
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Continue your course and keep rocking with daily focused sessions.
                        </p>
                      </div>
                      <Badge variant="outline" className="rounded-full border-border bg-secondary px-3 py-1 text-xs text-foreground">
                        Spoken English
                      </Badge>
                    </div>

                    <div className="mt-auto pt-6">
                      <div className="flex flex-wrap items-end gap-2">
                      <span className="text-5xl font-semibold tracking-tight text-foreground">81%</span>
                      <span className="pb-1 text-sm text-muted-foreground">(completed)</span>
                      </div>

                      <Progress value={81} className="mt-4 h-2.5 bg-secondary" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-white/70 bg-white/94 py-0 shadow-[0_14px_36px_rgba(28,35,52,0.05)]">
                  <CardContent className="flex min-h-[230px] flex-col p-5">
                    <p className="text-lg font-semibold text-foreground">Word Usage</p>
                    <div className="mt-4 flex flex-1 items-center justify-center">
                      <div
                        className="relative flex h-36 w-36 items-center justify-center rounded-full"
                        style={{
                          background:
                            'conic-gradient(var(--primary) 0 36%, rgba(159,203,152,0.95) 36% 61%, rgba(81,0,167,0.45) 61% 100%)',
                        }}
                      >
                        <div className="flex h-22 w-22 flex-col items-center justify-center rounded-full bg-white">
                          <span className="text-4xl font-semibold tracking-tight text-foreground">527</span>
                          <span className="mt-1 text-xs text-muted-foreground">words</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-primary" />
                        Grammar
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-accent" />
                        Idiom
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-thirdary" />
                        Vocabulary
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-white/70 bg-white/94 py-0 shadow-[0_14px_36px_rgba(28,35,52,0.05)]">
                  <CardContent className="flex min-h-[256px] flex-col p-5">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-lg font-semibold text-foreground">Hours Spend Each Week</p>
                      <Badge variant="outline" className="rounded-full border-border bg-secondary px-3 py-1 text-xs text-foreground">
                        This Week
                      </Badge>
                    </div>

                    <div className="mt-6 flex flex-1 items-end justify-between gap-3">
                      {barData.map((item) => (
                        <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
                          <div className="flex h-46 w-full items-end">
                            <div
                              className="w-full rounded-t-[10px]"
                              style={{
                                height: `${item.value}%`,
                                background:
                                  'linear-gradient(180deg, rgba(91,101,224,0.95) 0%, rgba(81,0,167,0.85) 100%)',
                              }}
                            />
                          </div>
                          <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-white/70 bg-white/94 py-0 shadow-[0_14px_36px_rgba(28,35,52,0.05)]">
                  <CardContent className="flex min-h-[256px] flex-col p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold text-foreground">Language Fluency Score</p>
                        <p className="mt-1 text-xs text-muted-foreground">Word usage and speaking confidence</p>
                      </div>
                      <LineChart className="h-4 w-4 text-primary" />
                    </div>

                    <div className="mt-6 flex flex-1 items-center">
                      <svg viewBox="0 0 390 110" className="h-28 w-full">
                        <polyline
                          fill="none"
                          stroke="rgba(91,101,224,0.95)"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={linePoints}
                        />
                        <polyline
                          fill="none"
                          stroke="rgba(159,203,152,0.95)"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points="8,96 46,94 84,88 120,91 158,74 196,71 232,84 268,76 304,58 342,65 378,61"
                        />
                      </svg>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <Card className="border-white/70 bg-white/94 py-0 shadow-[0_14px_36px_rgba(28,35,52,0.05)]">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-[20px] font-semibold tracking-tight text-foreground">Calendar</p>
                  <CalendarDays className="h-4 w-4 text-primary" />
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <button type="button" className="rounded-full bg-secondary p-2 text-foreground">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <p className="text-base font-medium text-foreground">November 2023</p>
                  <button type="button" className="rounded-full bg-secondary p-2 text-foreground">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-7 gap-y-3 text-center">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label) => (
                    <span key={label} className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      {label}
                    </span>
                  ))}

                  {calendarDays.map((item) => (
                    <div key={item.day} className="flex justify-center">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-medium ${
                          item.active ? 'bg-primary text-white shadow-md' : 'text-foreground hover:bg-secondary'
                        }`}
                      >
                        {item.day}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/70 bg-white/94 py-0 shadow-[0_14px_36px_rgba(28,35,52,0.05)]">
              <CardContent className="p-5">
                <p className="text-[20px] font-semibold tracking-tight text-foreground">My Schedule</p>
                <div className="mt-5 flex items-center justify-between text-base font-medium text-foreground">
                  <span>02 November 2023</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">All Days</p>

                <div className="mt-5 space-y-4">
                  <div className="flex gap-4">
                    <div className="w-11 pt-2 text-xs font-medium text-muted-foreground">11 am</div>
                    <div
                      className="flex-1 rounded-[20px] p-4"
                      style={{
                        background:
                          'linear-gradient(180deg, rgba(91,101,224,0.16) 0%, rgba(159,203,152,0.16) 100%)',
                      }}
                    >
                      <Badge className="rounded-full bg-primary px-3 py-1 text-[11px] text-white hover:bg-primary">Spoken English</Badge>
                      <p className="mt-3 text-lg font-semibold text-foreground">Basic Grammar With Vocabulary</p>
                      <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                        Continue your course and keep rocking with active practice.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-11 pt-2 text-xs font-medium text-muted-foreground">1 pm</div>
                    <div className="flex-1 rounded-[20px] border border-dashed border-border p-4 text-xs text-muted-foreground">
                      Open revision slot
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="overflow-hidden border-white/70 py-0 shadow-[0_14px_36px_rgba(28,35,52,0.05)]"
              style={{
                background: 'linear-gradient(180deg, rgba(245,230,224,0.48) 0%, rgba(255,255,255,0.94) 100%)',
              }}
            >
              <CardContent className="p-5">
                <div className="text-center">
                  <p className="text-[20px] font-semibold tracking-tight text-foreground">
                    Achievements and Areas
                    <br />
                    For Improvement.
                  </p>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  <RadialStat title="Your Goals" subtitle="Achieved your goals" value="75%" progress={75} />
                  <RadialStat title="Improvement" subtitle="Areas of improvement" value="25%" progress={25} />
                </div>
              </CardContent>
            </Card>

            <Card
              className="overflow-hidden border-0 py-0 text-white shadow-[0_14px_36px_rgba(28,35,52,0.08)]"
              style={{
                background: 'linear-gradient(140deg, rgba(91,101,224,1) 0%, rgba(81,0,167,0.92) 100%)',
              }}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-white/80">Your Credit Left</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight">90</p>
                  </div>
                  <div className="rounded-full border border-white/26 px-3 py-1.5 text-sm font-semibold">90</div>
                </div>

                <div className="mt-6">
                  <div className="flex items-center gap-3">
                    <Medal className="h-4 w-4" />
                    <span className="text-base font-medium">Upgrade to Pro</span>
                  </div>
                  <p className="mt-2 max-w-xs text-xs leading-5 text-white/82">
                    Get more credits, longer revision memory, and faster study set generation.
                  </p>
                  <Button asChild className="mt-5 h-10 rounded-full bg-white px-4 text-primary hover:bg-white/92">
                    <Link href="/dashboard?billing=true">
                      Upgrade Plan
                      <PlayCircle className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
