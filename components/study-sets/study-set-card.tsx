'use client'

import Link from 'next/link'
import {
  AlertCircle,
  BookMarked,
  Clock3,
  MoreVertical,
  Sparkles,
  Trophy,
} from 'lucide-react'
import type { StudySet } from './utils'

interface StudySetCardProps {
  set: StudySet
  isListView?: boolean
}

export default function StudySetCard({ set, isListView }: StudySetCardProps) {
  const masteryProgress = set.items > 0 ? Math.round((set.stats.mastered / set.items) * 100) : 0

  const stats = [
    {
      label: 'Unfamiliar',
      value: set.stats.unfamiliar,
      icon: AlertCircle,
      containerClass: 'bg-red-50/80 dark:bg-red-950/30 border-red-200/70 dark:border-red-900/40',
      textClass: 'text-red-600 dark:text-red-300',
      subTextClass: 'text-red-600/80 dark:text-red-300/80',
    },
    {
      label: 'Learning',
      value: set.stats.learning,
      icon: Clock3,
      containerClass:
        'bg-orange-50/80 dark:bg-orange-950/30 border-orange-200/70 dark:border-orange-900/40',
      textClass: 'text-orange-600 dark:text-orange-300',
      subTextClass: 'text-orange-600/80 dark:text-orange-300/80',
    },
    {
      label: 'Familiar',
      value: set.stats.familiar,
      icon: BookMarked,
      containerClass: 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-200/70 dark:border-blue-900/40',
      textClass: 'text-blue-600 dark:text-blue-300',
      subTextClass: 'text-blue-600/80 dark:text-blue-300/80',
    },
    {
      label: 'Mastered',
      value: set.stats.mastered,
      icon: Trophy,
      containerClass:
        'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200/70 dark:border-emerald-900/40',
      textClass: 'text-emerald-600 dark:text-emerald-300',
      subTextClass: 'text-emerald-600/80 dark:text-emerald-300/80',
    },
  ]

  if (isListView) {
    return (
      <Link
        href={`/dashboard/study-sets/${set.id}`}
        className="group block rounded-xl border border-border/70 bg-card/90 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-md bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">
                {set.items} items
              </span>
              <span className="rounded-md bg-secondary px-2 py-1 text-[11px] font-medium text-muted-foreground">
                Mastery {masteryProgress}%
              </span>
            </div>

            <h3 className="truncate text-base font-semibold text-foreground group-hover:text-primary transition-colors">
              {set.title}
            </h3>

            <div className="mt-3 flex flex-wrap gap-2">
              {stats.map((item) => (
                <span
                  key={item.label}
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium ${item.containerClass} ${item.subTextClass}`}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.value} {item.label}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            className="ml-1 flex-shrink-0 rounded-lg p-2 transition-colors hover:bg-secondary"
          >
            <MoreVertical className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/dashboard/study-sets/${set.id}`}
      className="group relative block overflow-hidden rounded-2xl border border-border/70 bg-card/90 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-primary/10 via-purple-500/5 to-cyan-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Study Set
          </div>
          <h3 className="truncate text-xl font-semibold text-foreground transition-colors group-hover:text-primary">
            {set.title}
          </h3>
        </div>

        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          className="flex-shrink-0 rounded-lg p-2 transition-colors hover:bg-secondary"
        >
          <MoreVertical className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="relative space-y-4">
        <div className="grid grid-cols-2 gap-2.5 text-sm pt-4">
          {stats.map((item) => (
            <div key={item.label} className={`rounded-xl border p-3 ${item.containerClass}`}>
              <div className="mb-1 flex items-center justify-between">
                <p className={`text-lg font-bold leading-none ${item.textClass}`}>{item.value}</p>
                <item.icon className={`h-4 w-4 ${item.subTextClass}`} />
              </div>
              <p className={`text-xs font-medium ${item.subTextClass}`}>{item.label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border/70 bg-background/70 p-3">
          <div className="mb-2 flex items-center justify-between text-xs font-medium">
            <p className="text-muted-foreground">Mastery Progress</p>
            <p className="text-foreground">{masteryProgress}%</p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-500 transition-all"
              style={{ width: `${masteryProgress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Total items: {set.items}</p>
        </div>
      </div>
    </Link>
  )
}


