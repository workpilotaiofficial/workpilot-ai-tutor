'use client'

import { useState } from 'react'
import {
  ChevronRight,
  Loader2,
  MoreVertical,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { StudySetPreview } from './utils'

interface StudySetCardProps {
  set: StudySetPreview
  isListView?: boolean
  onDelete?: (studySetId: string) => Promise<void>
}

export default function StudySetCard({ set, isListView, onDelete }: StudySetCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const completionProgress = Math.min(100, Math.max(0, Math.round(set.percentageCompleted)))

  const handleDelete = async () => {
    if (!onDelete || isDeleting) return

    setIsDeleting(true)
    try {
      await onDelete(set.id)
      setShowDeleteDialog(false)
    } finally {
      setIsDeleting(false)
    }
  }

  const optionsMenu = (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
            }}
            aria-label={`More options for ${set.title}`}
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete study set?</AlertDialogTitle>
            <AlertDialogDescription>
              “{set.title}” and its generated study materials will be permanently deleted.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={isDeleting}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-destructive/90 disabled:pointer-events-none disabled:opacity-50"
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )

  const stats = [
    {
      label: 'Unfamiliar',
      value: set.stats.unfamiliar,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-950/30',
    },
    {
      label: 'Learning',
      value: set.stats.learning,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-950/30',
    },
    {
      label: 'Familiar',
      value: set.stats.familiar,
      color: 'text-sky-600 dark:text-sky-400',
      bg: 'bg-sky-50 dark:bg-sky-950/30',
    },
    {
      label: 'Mastered',
      value: set.stats.mastered,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
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
                strokeDashoffset={2 * Math.PI * 18 - (completionProgress / 100) * 2 * Math.PI * 18}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-black text-foreground/60">{completionProgress}%</span>
            </div>
          </div>

          {optionsMenu}

          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/dashboard/study-sets/${set.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-[30px] border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md"
    >
      <div className="flex items-center justify-between border-b border-border px-6 py-5">
        <h3 className="min-w-0 truncate text-lg font-semibold text-foreground group-hover:text-primary">
          {set.title}
        </h3>
        <div className="ml-3">{optionsMenu}</div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 px-5 py-4">
        {stats.map((stat) => (
          <div key={stat.label} className="grid grid-cols-[54px_1fr] items-center gap-3">
            <span className="rounded-xl border border-border bg-background px-3 py-2 text-center text-sm font-semibold text-foreground">
              {stat.value}
            </span>
            <span className={`rounded-xl px-3 py-2 text-sm font-medium ${stat.bg} ${stat.color}`}>
              {stat.label}
            </span>
          </div>
        ))}
        <div className="mt-1 flex items-center justify-between px-1 text-xs text-muted-foreground">
          <span>{set.items} items</span>
          <span>{completionProgress}% completed</span>
        </div>
      </div>
    </Link>
  )
}
