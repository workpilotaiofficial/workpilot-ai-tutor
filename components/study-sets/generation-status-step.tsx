'use client'

import type { StudySetUiSectionType } from './generation-mapping'
import { AlertCircle, CheckCircle2, Clock3, LoaderCircle, Radio, WifiOff } from 'lucide-react'
import type { StoredStudySetGenerationMeta } from '@/lib/api/study-sets.storage'
import { getOpenUiSectionLabel, getTaskTypeLabel, toUiSectionType } from './generation-mapping'

function getConnectionLabel(status: StoredStudySetGenerationMeta['connectionStatus']) {
  switch (status) {
    case 'connecting':
      return 'Connecting'
    case 'connected':
      return 'Live'
    case 'polling':
      return 'Async Refresh'
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

function getConnectionIcon(status: StoredStudySetGenerationMeta['connectionStatus']) {
  switch (status) {
    case 'connecting':
      return LoaderCircle
    case 'connected':
      return Radio
    case 'polling':
      return Clock3
    case 'completed':
      return CheckCircle2
    case 'error':
    case 'closed':
      return WifiOff
    default:
      return Clock3
  }
}

function getJobStatusMeta(status: string) {
  switch (status) {
    case 'completed':
      return {
        label: 'Completed',
        icon: CheckCircle2,
        className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      }
    case 'failed':
      return {
        label: 'Failed',
        icon: AlertCircle,
        className: 'border-red-200 bg-red-50 text-red-700',
      }
    case 'pending':
    case 'started':
      return {
        label: 'Pending',
        icon: LoaderCircle,
        className: 'border-amber-200 bg-amber-50 text-amber-700',
      }
    default:
      return {
        label: 'Queued',
        icon: Clock3,
        className: 'border-slate-200 bg-slate-50 text-slate-700',
      }
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
        Preparing realtime generation tracking...
      </div>
    )
  }

  const ConnectionIcon = getConnectionIcon(meta.connectionStatus)
  const completedCount = meta.jobs.filter((job) => job.status === 'completed').length
  const failedCount = meta.jobs.filter((job) => job.status === 'failed').length

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-background/70 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Generation in progress</p>
            <p className="mt-1 text-xs text-muted-foreground">
              We are tracking each selected job in real time. You can close this modal and come back later.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-xs font-semibold text-foreground">
            <ConnectionIcon className={`h-3.5 w-3.5 ${meta.connectionStatus === 'connecting' ? 'animate-spin' : ''}`} />
            {getConnectionLabel(meta.connectionStatus)}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Batch</p>
            <p className="mt-2 text-sm font-semibold text-foreground">{meta.batch.status || 'processing'}</p>
          </div>
          <div className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Completed</p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {completedCount}/{meta.jobs.length}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Failed</p>
            <p className="mt-2 text-sm font-semibold text-foreground">{failedCount}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {meta.jobs.map((job) => {
          const statusMeta = getJobStatusMeta(job.status)
          const StatusIcon = statusMeta.icon
          const fetchedOutput = meta.fetchedOutputs[job.jobId]
          const sectionType = fetchedOutput?.sectionType ?? toUiSectionType(fetchedOutput?.taskType ?? job.type)
          const canOpenSection = Boolean(fetchedOutput?.fetched && sectionType && onOpenSection)

          return (
            <div
              key={job.jobId}
              className="rounded-2xl border border-border bg-card/90 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{getTaskTypeLabel(job.type)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Job ID: {job.jobId}</p>
                </div>

                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${statusMeta.className}`}>
                  <StatusIcon className={`h-3.5 w-3.5 ${job.status === 'pending' || job.status === 'started' ? 'animate-spin' : ''}`} />
                  {statusMeta.label}
                </span>
              </div>

              {job.error ? (
                <p className="mt-3 text-xs text-red-600">{job.error}</p>
              ) : null}

              {fetchedOutput?.fetched ? (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-emerald-600">Generated output fetched and saved locally.</p>
                  {canOpenSection ? (
                    <button
                      type="button"
                      onClick={() => onOpenSection?.(sectionType as StudySetUiSectionType)}
                      className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                    >
                      {getOpenUiSectionLabel(sectionType as StudySetUiSectionType)}
                    </button>
                  ) : null}
                </div>
              ) : fetchedOutput?.error ? (
                <p className="mt-3 text-xs text-red-600">{fetchedOutput.error}</p>
              ) : job.status === 'completed' ? (
                <p className="mt-3 text-xs text-muted-foreground">Completion received. Fetching generated output.</p>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">
                  {job.status === 'failed'
                    ? 'This job failed on the server.'
                    : 'Waiting for server updates.'}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
