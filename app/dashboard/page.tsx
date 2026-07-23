'use client'

import { getStoredAuthObject } from '@/lib/api/session-storage'
import {
  fetchDashboard,
  type DashboardResponse,
} from '@/lib/api/dashboard.service'
import {
  Brain,
  CalendarDays,
  Check,
  ChevronRight,
  CircleAlert,
  Flame,
  GraduationCap,
  Lightbulb,
  Target,
  FileCheck2,
  FileText,
  WalletCards,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const progressData = [
  { day: 'Mon', score: 58, minutes: 32 },
  { day: 'Tue', score: 63, minutes: 48 },
  { day: 'Wed', score: 61, minutes: 26 },
  { day: 'Thu', score: 70, minutes: 54 },
  { day: 'Fri', score: 73, minutes: 42 },
  { day: 'Sat', score: 78, minutes: 67 },
  { day: 'Sun', score: 82, minutes: 51 },
]

const masteryData = [
  { name: 'Mastered', value: 46, color: '#5B65E0' },
  { name: 'Learning', value: 34, color: '#9FCB98' },
  { name: 'Needs work', value: 20, color: '#F5B85A' },
]

const subjects = [
  { name: 'Biology', detail: 'Cell & Genetics', score: 86, change: '+8%', color: '#5B65E0' },
  { name: 'Mathematics', detail: 'Calculus', score: 72, change: '+3%', color: '#9FCB98' },
  { name: 'Chemistry', detail: 'Organic chemistry', score: 58, change: '-2%', color: '#F5B85A' },
]

const week = [
  { day: 'M', done: true },
  { day: 'T', done: true },
  { day: 'W', done: true },
  { day: 'T', done: true },
  { day: 'F', done: true },
  { day: 'S', done: false, today: true },
  { day: 'S', done: false },
]

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: typeof Target
  label: string
  value: string
  detail?: string
  tone: string
}) {
  return (
    <article className="group rounded-2xl border border-border/80 bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/[0.04]">
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="h-[19px] w-[19px]" />
        </div>
        {detail ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
            {detail}
          </span>
        ) : null}
      </div>
      <p className="mt-5 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p>
    </article>
  )
}

export default function DashboardIndexPage() {
  const [firstName, setFirstName] = useState('Student')
  const [now, setNow] = useState<Date | null>(null)
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
  const [dashboardError, setDashboardError] = useState<string | null>(null)

  useEffect(() => {
    const displayName = getStoredAuthObject()?.user_display_name?.trim()
    if (displayName) setFirstName(displayName.split(/\s+/)[0])

    const updateClock = () => setNow(new Date())
    updateClock()
    const clockInterval = window.setInterval(updateClock, 1000)
    const abortController = new AbortController()
    let isActive = true

    fetchDashboard(abortController.signal)
      .then((response) => {
        if (isActive) setDashboard(response)
      })
      .catch((error: unknown) => {
        if (!isActive || (error instanceof DOMException && error.name === 'AbortError')) return
        setDashboardError(error instanceof Error ? error.message : 'Unable to load dashboard data.')
      })

    return () => {
      isActive = false
      window.clearInterval(clockInterval)
      abortController.abort()
    }
  }, [])

  const currentDate = now
    ? new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(now)
    : 'Today'
  const hourRotation = now ? ((now.getHours() % 12) + now.getMinutes() / 60) * 30 : 0
  const minuteRotation = now ? (now.getMinutes() + now.getSeconds() / 60) * 6 : 0
  const secondRotation = now ? now.getSeconds() * 6 : 0

  return (
    <div className="min-h-full bg-[#fbfbfd] text-foreground dark:bg-background">
      <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-7 lg:px-9 lg:py-9">
        <header className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
               Your learning overview
            </div>
            <h1 className="text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
              Good morning, {firstName} <span aria-hidden></span>
            </h1>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-medium text-muted-foreground shadow-sm">
            <CalendarDays className="h-4 w-4 text-primary" />
            <span>{currentDate}</span>
          </div>
        </header>

        <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={Brain} label="Study sets" value={dashboard ? String(dashboard.stats.study_sets_count) : '—'} tone="bg-indigo-50 text-primary dark:bg-primary/10" />
          <StatCard icon={FileText} label="Syllabi" value={dashboard ? String(dashboard.stats.syllabi_count) : '—'} tone="bg-sky-50 text-sky-600 dark:bg-sky-500/10" />
          <StatCard icon={FileCheck2} label="Gradings" value={dashboard ? String(dashboard.stats.grading_count) : '—'} tone="bg-orange-50 text-orange-600 dark:bg-orange-500/10" />
          <StatCard icon={WalletCards} label="Credits available" value={dashboard ? String(dashboard.stats.credits_available) : '—'} detail={dashboard?.stats.plan_name || dashboard?.stats.plan} tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10" />
        </section>

        {dashboardError ? (
          <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {dashboardError}
          </div>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,.75fr)]">
          <div className="space-y-6">
            <article className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm">
              <div className="flex flex-col justify-between gap-4 border-b border-border/70 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
                <div>
                  <h2 className="text-base font-semibold">Learning progress</h2>
                  <p className="mt-1 text-xs text-muted-foreground">Your mastery score over the last 7 days</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold">82%</span>
                  <span className="text-xs font-semibold text-emerald-600">+12% this week</span>
                </div>
              </div>
              <div className="h-[270px] px-2 pb-4 pt-5 sm:px-5">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={progressData} margin={{ top: 10, right: 12, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 5" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} dy={10} />
                    <YAxis domain={[40, 100]} axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} tickFormatter={(value) => `${value}%`} />
                    <Tooltip
                      cursor={{ stroke: 'var(--border)', strokeDasharray: '4 4' }}
                      contentStyle={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--card)', fontSize: 12 }}
                      formatter={(value) => [`${value}%`, 'Mastery']}
                    />
                    <Area type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={3} fill="url(#scoreFill)" activeDot={{ r: 5, fill: 'var(--primary)', stroke: 'var(--card)', strokeWidth: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm sm:p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold">Subject performance</h2>
                  <p className="mt-1 text-xs text-muted-foreground">See what&apos;s strong and what needs attention</p>
                </div>
                <button className="text-xs font-semibold text-primary hover:underline">View report</button>
              </div>
              <div className="space-y-5">
                {subjects.map((subject) => (
                  <div key={subject.name} className="grid items-center gap-3 sm:grid-cols-[155px_1fr_78px]">
                    <div>
                      <p className="text-sm font-semibold">{subject.name}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{subject.detail}</p>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full" style={{ width: `${subject.score}%`, backgroundColor: subject.color }} />
                    </div>
                    <div className="flex items-center justify-between sm:justify-end sm:gap-2">
                      <span className="text-sm font-semibold">{subject.score}%</span>
                      <span className={`text-[11px] font-semibold ${subject.change.startsWith('-') ? 'text-orange-600' : 'text-emerald-600'}`}>{subject.change}</span>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold">Recent activity</h2>
                  <p className="mt-1 text-xs text-muted-foreground">Your latest study sets, syllabi, and gradings</p>
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                {[
                  {
                    label: 'Study sets',
                    href: '/dashboard/study-sets',
                    icon: Brain,
                    items: dashboard?.recent_study_sets.map((item) => ({
                      id: item.id,
                      title: item.title,
                      meta: `${item.item_count} items · ${item.percentage_completed}% complete`,
                      href: `/dashboard/study-sets/${item.id}`,
                    })) ?? [],
                  },
                  {
                    label: 'Syllabi',
                    href: '/dashboard/syllabus-intelligence',
                    icon: FileText,
                    items: dashboard?.recent_syllabi.map((item) => ({
                      id: item.id,
                      title: item.title,
                      meta: `${item.module_count} modules · ${item.percentage_completed}% complete`,
                      href: '/dashboard/syllabus-intelligence',
                    })) ?? [],
                  },
                  {
                    label: 'Gradings',
                    href: '/dashboard/paper-grader',
                    icon: FileCheck2,
                    items: dashboard?.recent_grading.map((item) => ({
                      id: item.id,
                      title: item.title,
                      meta: `${item.score_percentage}% · Max score ${item.max_score}`,
                      href: '/dashboard/paper-grader',
                    })) ?? [],
                  },
                ].map((group) => (
                  <div key={group.label} className="rounded-2xl border border-border bg-background p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <group.icon className="h-4 w-4 text-primary" />
                        {group.label}
                      </div>
                      <Link href={group.href} className="text-muted-foreground hover:text-primary" aria-label={`View all ${group.label}`}>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                    <div className="space-y-2">
                      {!dashboard ? (
                        <p className="py-3 text-xs text-muted-foreground">Loading…</p>
                      ) : group.items.length === 0 ? (
                        <p className="py-3 text-xs text-muted-foreground">No recent {group.label.toLowerCase()}.</p>
                      ) : (
                        group.items.map((item) => (
                          <Link key={item.id} href={item.href} className="block rounded-xl p-2 transition hover:bg-secondary">
                            <p className="truncate text-xs font-semibold">{item.title}</p>
                            <p className="mt-1 truncate text-[10px] text-muted-foreground">{item.meta}</p>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <aside className="space-y-6">
            <article
              aria-label={now ? `Current time ${now.toLocaleTimeString()}` : 'Current time'}
              className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold">Study clock</h2>
                  <p className="mt-1 text-xs text-muted-foreground">Stay on track with your day</p>
                </div>
                <div className="rounded-xl bg-primary/10 px-3 py-2 text-right text-primary">
                  <p className="text-sm font-semibold tabular-nums">
                    {now ? now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </p>
                  <p className="text-[9px] font-semibold uppercase tracking-wider opacity-70">Local time</p>
                </div>
              </div>

              <div className="relative mx-auto h-[200px] w-[200px] rounded-full bg-gradient-to-br from-primary/20 via-transparent to-sky-400/20 p-[5px] shadow-[0_14px_35px_rgba(91,101,224,0.16)]">
                <svg viewBox="0 0 200 200" className="h-full w-full rounded-full" role="img" aria-hidden="true">
                  <defs>
                    <radialGradient id="watchFace" cx="35%" cy="25%" r="85%">
                      <stop offset="0%" stopColor="var(--card)" />
                      <stop offset="100%" stopColor="var(--secondary)" />
                    </radialGradient>
                    <filter id="handShadow" x="-30%" y="-30%" width="160%" height="160%">
                      <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.18" />
                    </filter>
                  </defs>

                  <circle cx="100" cy="100" r="94" fill="url(#watchFace)" stroke="var(--border)" strokeWidth="1" />
                  <circle cx="100" cy="100" r="87" fill="none" stroke="var(--border)" strokeWidth="0.6" opacity="0.65" />

                  {[...Array(60)].map((_, index) => {
                    const isHour = index % 5 === 0
                    return (
                      <line
                        key={index}
                        x1="100"
                        y1={isHour ? 17 : 19}
                        x2="100"
                        y2={isHour ? 24 : 22}
                        stroke={isHour ? 'var(--primary)' : 'var(--muted-foreground)'}
                        strokeWidth={isHour ? 2 : 0.75}
                        strokeLinecap="round"
                        opacity={isHour ? 0.8 : 0.3}
                        transform={`rotate(${index * 6} 100 100)`}
                      />
                    )
                  })}

                  <g fill="var(--foreground)" fontSize="11" fontWeight="650" textAnchor="middle" dominantBaseline="middle">
                    <text x="100" y="34">12</text>
                    <text x="166" y="101">3</text>
                    <text x="100" y="167">6</text>
                    <text x="34" y="101">9</text>
                  </g>

                  <g filter="url(#handShadow)" transform={`rotate(${hourRotation} 100 100)`}>
                    <line x1="100" y1="105" x2="100" y2="62" stroke="var(--foreground)" strokeWidth="5.5" strokeLinecap="round" />
                  </g>
                  <g filter="url(#handShadow)" transform={`rotate(${minuteRotation} 100 100)`}>
                    <line x1="100" y1="106" x2="100" y2="48" stroke="var(--primary)" strokeWidth="3.5" strokeLinecap="round" />
                  </g>
                  <g transform={`rotate(${secondRotation} 100 100)`}>
                    <line x1="100" y1="113" x2="100" y2="42" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
                  </g>
                  <circle cx="100" cy="100" r="7" fill="var(--card)" stroke="var(--primary)" strokeWidth="3" />
                  <circle cx="100" cy="100" r="2" fill="#f59e0b" />

                  <g>
                    <rect x="76" y="128" width="48" height="19" rx="9.5" fill="var(--primary)" opacity="0.1" />
                    <text x="100" y="138" fill="var(--primary)" fontSize="8.5" fontWeight="700" textAnchor="middle" dominantBaseline="middle" letterSpacing="0.7">
                      {now ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(now).toUpperCase() : 'TODAY'}
                    </text>
                  </g>
                </svg>
              </div>
            </article>

            <article className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div><h2 className="text-base font-semibold">Weekly goal</h2><p className="mt-1 text-xs text-muted-foreground">5 of 7 active days</p></div>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-50 text-orange-600 dark:bg-orange-500/10"><Flame className="h-5 w-5 fill-current" /></div>
              </div>
              <div className="mt-5 grid grid-cols-7 gap-2">
                {week.map((item, index) => <div key={`${item.day}-${index}`} className="text-center"><div className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${item.done ? 'bg-primary text-primary-foreground' : item.today ? 'border-2 border-primary text-primary' : 'bg-secondary text-muted-foreground'}`}>{item.done ? <Check className="h-4 w-4" /> : item.day}</div><p className="mt-2 text-[10px] text-muted-foreground">{item.day}</p></div>)}
              </div>
              <div className="mt-5 rounded-xl bg-secondary/70 px-3 py-2.5 text-center text-xs text-muted-foreground"><strong className="text-foreground">2 more days</strong> to complete this week&apos;s goal</div>
            </article>

            <article className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
              <div className="mb-2 flex items-center justify-between"><div><h2 className="text-base font-semibold">Knowledge mastery</h2><p className="mt-1 text-xs text-muted-foreground">126 total concepts</p></div><GraduationCap className="h-5 w-5 text-primary" /></div>
              <div className="relative mx-auto h-[170px] max-w-[260px]">
                <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={masteryData} dataKey="value" innerRadius={57} outerRadius={75} paddingAngle={3} cornerRadius={5}>{masteryData.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip contentStyle={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--card)', fontSize: 12 }} formatter={(value) => [`${value}%`]} /></PieChart></ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-2xl font-semibold">74%</span><span className="text-[10px] text-muted-foreground">mastered</span></div>
              </div>
              <div className="grid grid-cols-3 gap-2">{masteryData.map((item) => <div key={item.name} className="text-center"><div className="mx-auto mb-1.5 h-2 w-2 rounded-full" style={{ background: item.color }} /><p className="text-sm font-semibold">{item.value}%</p><p className="text-[10px] text-muted-foreground">{item.name}</p></div>)}</div>
            </article>

            <article className="rounded-3xl border border-amber-200 bg-amber-50/70 p-5 dark:border-amber-500/20 dark:bg-amber-500/5">
              <div className="flex gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"><Lightbulb className="h-4 w-4" /></div><div><h3 className="text-sm font-semibold">AI study insight</h3><p className="mt-1.5 text-xs leading-5 text-muted-foreground">You retain <strong className="text-foreground">18% more</strong> when studying before 8 PM. Try scheduling Chemistry at 7:00 PM today.</p></div></div>
              <button className="mt-4 flex w-full items-center justify-between border-t border-amber-200/70 pt-3 text-xs font-semibold text-amber-800 dark:border-amber-500/20 dark:text-amber-400">Add to my plan <ChevronRight className="h-4 w-4" /></button>
            </article>

            <article className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
              <h2 className="text-base font-semibold">Upcoming</h2>
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3"><div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-500/10"><span className="text-[8px] font-bold">MAY</span><span className="text-sm font-bold leading-none">28</span></div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">Chemistry mock test</p><p className="mt-0.5 text-[10px] text-muted-foreground">2 days left</p></div><CircleAlert className="h-4 w-4 text-rose-500" /></div>
                <div className="flex items-center gap-3"><div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-indigo-50 text-primary dark:bg-primary/10"><span className="text-[8px] font-bold">JUN</span><span className="text-sm font-bold leading-none">02</span></div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">Biology assignment</p><p className="mt-0.5 text-[10px] text-muted-foreground">7 days left</p></div></div>
              </div>
            </article>
          </aside>
        </section>
      </div>
    </div>
  )
}
