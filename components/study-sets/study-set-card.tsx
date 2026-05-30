'use client'

import Link from 'next/link'
import {
  AlertCircle,
  BookMarked,
  Clock3,
  MoreVertical,
  Sparkles,
  Trophy,
  ChevronRight,
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
        className="group flex items-center gap-4 p-4 bg-white border border-slate-200/80 rounded-xl hover:border-[#5B65E0]/40 hover:shadow-lg hover:shadow-[#5B65E0]/10 transition-all duration-300"
      >
        {/* Branded icon tile */}
        <div className="shrink-0 w-12 h-12 rounded-xl bg-linear-to-br from-[#5B65E0]/70 to-[#5100a7]/70 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-slate-900 group-hover:text-[#5B65E0] transition-colors truncate">
            {set.title}
          </h3>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs font-medium text-slate-500">{set.items} items</span>
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
              <circle cx="22" cy="22" r="18" fill="none" stroke="#e2e8f0" strokeWidth="4" />
              <circle
                cx="22"
                cy="22"
                r="18"
                fill="none"
                stroke="#5B65E0"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 18}
                strokeDashoffset={2 * Math.PI * 18 - (masteryProgress / 100) * 2 * Math.PI * 18}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-black text-slate-700">{masteryProgress}%</span>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#5B65E0] group-hover:translate-x-0.5 transition-all" />
        </div>
      </Link>
    )
  }

  const ringCircumference = 2 * Math.PI * 18

  return (
    <Link
      href={`/dashboard/study-sets/${set.id}`}
      className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white hover:border-[#5B65E0]/40 shadow-xl shadow-[#5B65E0]/10 transition-all duration-300 hover:-translate-y-1 h-full flex flex-col"
    >
      {/* Branded cover header */}
      <div className="relative  overflow-hidden  p-5">
  

        <div className="relative flex items-start justify-between">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/15 border border-primary/25 rounded-full backdrop-blur-sm">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-[11px] font-bold text-primary tracking-wide">Study Set</span>
          </div>

          {/* Mastery ring */}
     
        </div>

        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          className="absolute bottom-3 right-3 p-1.5 text-white/60 hover:text-white hover:bg-white/15 rounded-lg transition-colors"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="relative p-5 flex flex-col flex-1">
        <h3 className="text-base font-bold text-slate-900 group-hover:text-[#5B65E0] transition-colors line-clamp-2 mb-4 min-h-10">
          {set.title}
        </h3>

        {/* Stats Grid - 4 columns */}
        {/* <div className="grid grid-cols-2 gap-2 mb-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`${stat.bg} rounded-xl py-2.5 flex flex-col items-center gap-1`}
            >
              <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
              <p className={`text-base font-black leading-none ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div> */}

        {/* Progress bar */}
        <div className="mt-auto pt-3 border-t border-slate-100">
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-linear-to-r from-[#5B65E0] to-[#5100a7] transition-all duration-700 rounded-full"
              style={{ width: `${masteryProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">{set.items} items</span>
            <span className="font-bold text-slate-600">
              {masteryProgress === 100 ? '✨ Mastered' : `${100 - masteryProgress}% to go`}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
