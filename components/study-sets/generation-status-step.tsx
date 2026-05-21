'use client'

import type { StudySetUiSectionType } from './generation-mapping'
import { CheckCircle2, Clock3, LoaderCircle, Sparkles, TriangleAlert, WifiOff } from 'lucide-react'
import type { StoredStudySetGenerationMeta } from '@/lib/api/study-sets.storage'
import { getOpenUiSectionLabel, getTaskTypeLabel, toUiSectionType } from './generation-mapping'

function getConnectionLabel(status: StoredStudySetGenerationMeta['connectionStatus']) {
  switch (status) {
    case 'connecting':
      return 'Connecting'
    case 'connected':
      return 'Live'
    case 'polling':
      return 'Syncing'
    case 'completed':
      return 'Completed'
    case 'error':
      return 'Connection Error'
    case 'closed':
      return 'Stopped'
    default:
      return 'Idle'
  }
}

type GenerationStatusStepProps = {
  meta: StoredStudySetGenerationMeta | null
  onOpenSection?: (sectionType: StudySetUiSectionType) => void
}

export function GenerationStatusStep({ meta, onOpenSection }: GenerationStatusStepProps) {
  if (!meta) {
    return (
      <div className="rounded-2xl border border-border bg-secondary/20 p-6 text-sm text-muted-foreground">
        Preparing generation tracking...
      </div>
    )
  }

  const completedCount = meta.jobs.filter((job) => job.status === 'completed').length
  const failedCount = meta.jobs.filter((job) => job.status === 'failed').length
  const totalCount = meta.jobs.length || meta.batch.totalJobs

  const sectionCards = meta.jobs.map((job) => {
    const fetchedOutput = meta.fetchedOutputs[job.jobId]
    const sectionType = fetchedOutput?.sectionType ?? toUiSectionType(fetchedOutput?.taskType ?? job.type)
    const isReady = Boolean(fetchedOutput?.fetched && sectionType)
    const isFailed = job.status === 'failed'
    const isGenerating = !isReady && !isFailed && (job.status === 'pending' || job.status === 'started' || job.status === 'queued')
    const statusLabel = isReady ? 'Ready' : isFailed ? 'Failed' : isGenerating ? 'Generating' : 'Queued'
    const taskLabel = getTaskTypeLabel(job.type)

    return {
      jobId: job.jobId,
      taskLabel,
      sectionType,
      statusLabel,
      isReady,
      isFailed,
      canOpenSection: Boolean(isReady && sectionType && onOpenSection),
      error: job.error ?? fetchedOutput?.error ?? null,
    }
  })

  const firstReadySection = sectionCards.find((card) => card.isReady && card.sectionType)?.sectionType ?? null
  const notesSection = sectionCards.find((card) => card.isReady && card.sectionType === 'notes')?.sectionType ?? null
  const startSection: StudySetUiSectionType | null =
    (notesSection as StudySetUiSectionType | null) ?? (firstReadySection as StudySetUiSectionType | null)

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-background/80 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Live build room</p>
            <p className="text-xs text-muted-foreground">
              Selected sections are being generated and saved automatically.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-xs font-semibold text-foreground">
            {meta.connectionStatus === 'error' || meta.connectionStatus === 'closed' ? (
              <WifiOff className="h-3.5 w-3.5" />
            ) : meta.connectionStatus === 'completed' ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            )}
            {getConnectionLabel(meta.connectionStatus)}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Progress</p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {completedCount}/{totalCount}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Batch</p>
            <p className="mt-2 text-sm font-semibold text-foreground">{meta.batch.status || 'processing'}</p>
          </div>
          <div className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Failed</p>
            <p className="mt-2 text-sm font-semibold text-foreground">{failedCount}</p>
          </div>
        </div>

        {startSection && onOpenSection ? (
          <button
            type="button"
            onClick={() => onOpenSection(startSection)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <Sparkles className="h-4 w-4" />
            Start studying now
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {sectionCards.map((card) => (
          <div key={card.jobId} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">{card.taskLabel}</p>
              <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                {card.isReady ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                ) : card.isFailed ? (
                  <TriangleAlert className="h-3.5 w-3.5 text-red-600" />
                ) : card.statusLabel === 'Generating' ? (
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin text-amber-600" />
                ) : (
                  <Clock3 className="h-3.5 w-3.5" />
                )}
                {card.statusLabel}
              </span>
            </div>

            {card.error ? <p className="mt-2 text-xs text-red-600">{card.error}</p> : null}

            {card.canOpenSection ? (
              <button
                type="button"
                onClick={() => onOpenSection?.(card.sectionType as StudySetUiSectionType)}
                className="mt-3 inline-flex items-center justify-center rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary/40"
              >
                {getOpenUiSectionLabel(card.sectionType as StudySetUiSectionType)}
              </button>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">
                {card.isFailed ? 'Retry from dashboard later.' : 'This section will open when ready.'}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
