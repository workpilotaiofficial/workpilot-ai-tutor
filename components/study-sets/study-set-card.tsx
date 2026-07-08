'use client'

import {
  AlertCircle,
  BookMarked,
  ChevronRight,
  Clock3,
  MoreVertical,
  Trophy
} from 'lucide-react'
import Link from 'next/link'
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
      color: 'text-red-600',
      bg: 'bg-red-100',
    },
    {
      label: 'Learning',
      value: set.stats.learning,
      icon: Clock3,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
    },
    {
      label: 'Familiar',
      value: set.stats.familiar,
      icon: BookMarked,
      color: 'text-cyan-600',
      bg: 'bg-cyan-100',
    },
    {
      label: 'Mastered',
      value: set.stats.mastered,
      icon: Trophy,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
  ]

  if (isListView) {
    return (
      <Link
        href={`/dashboard/study-sets/${set.id}`}
        className="group flex items-center gap-4 p-4 bg-card border border-border/50 rounded-xl hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300"
      >
        {/* Branded icon tile */}


        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors truncate">
            {set.title}
          </h3>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs font-medium text-muted-foreground">{set.items} items</span>
            <div className="flex gap-1.5">
              {stats.map((stat) => (
                <span key={stat.label} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${stat.bg}`}>
                  <span className={`text-xs font-bold ${stat.color}`}>{stat.value}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {/* Mastery ring */}
          <div className="relative w-12 h-12">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
              <circle cx="22" cy="22" r="18" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.1" />
              <circle
                cx="22"
                cy="22"
                r="18"
                fill="none"
                stroke="rgb(91, 101, 224)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 18}
                strokeDashoffset={2 * Math.PI * 18 - (masteryProgress / 100) * 2 * Math.PI * 18}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-black text-foreground/60">{masteryProgress}%</span>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </div>
      </Link>
    )
  }

  const ringCircumference = 2 * Math.PI * 18

  return (
    <Link
      href={`/dashboard/study-sets/${set.id}`}
      className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card hover:border-primary/40 shadow-xl hover:shadow-primary/15 transition-all duration-300 hover:-translate-y-1 h-full flex flex-col"
    >
      {/* Branded cover header */}
      <div className="relative bg-linear-to-br from-primary/10 to-thirdary/10 overflow-hidden p-5">
        <div className="relative flex items-start justify-between">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/15 border border-primary/25 rounded-full backdrop-blur-sm">
            <span className="text-[11px] font-bold text-primary tracking-wide">Study Set</span>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          className="absolute bottom-3 right-3 p-1.5 text-primary/60 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="relative p-5 flex flex-col flex-1">
        <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-4 min-h-10">
          {set.title}
        </h3>

        {/* Progress bar */}
        <div className="mt-auto pt-3 border-t border-border">
          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-linear-to-r from-primary to-thirdary transition-all duration-700 rounded-full"
              style={{ width: `${masteryProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">{set.items} items</span>
            <span className="font-bold text-foreground/70">
              {masteryProgress === 100 ? '✨ Mastered' : `${100 - masteryProgress}% to go`}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
