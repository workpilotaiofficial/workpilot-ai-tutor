'use client'

import { useState, useEffect } from 'react'
import { Upload, FileText, ArrowUpRight } from 'lucide-react'
import GraderUploadModal from '@/components/paper-grader/upload-modal'
import GradingResult from '@/components/paper-grader/grading-result'
import { formatUTCDate } from '@/lib/utils'
import type { GraderResult, GraderResultResponse, GraderSubmitResponse } from '@/lib/api'
import { subscribeToGraderSubmission } from '@/components/paper-grader/grader-tracker'

const STORAGE_KEY = 'paper_grader_submissions'

function isProcessingStatus(status: string) {
  return status === 'processing' || status === 'queued' || status === 'pending'
}

export interface Submission {
  submission_id: string
  title: string
  status: string
  created_at: string
  completed_at: string | null
  result: GraderResult | null
}

export default function PaperGraderPage() {
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [activeSubmission, setActiveSubmission] = useState<Submission | null>(null)
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false)

  useEffect(() => {
    loadSubmissions()
  }, [])

  const loadSubmissions = () => {
    setIsLoadingSubmissions(true)
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Submission[]
        setSubmissions(parsed)

        // Resume tracking for any submission still in progress (websocket token has
        // expired by now, so the tracker falls back to polling the result endpoint).
        parsed
          .filter((sub) => isProcessingStatus(sub.status))
          .forEach((sub) => {
            subscribeToGraderSubmission({ submissionId: sub.submission_id }, applyGraderResult)
          })
      }
    } catch (error) {
      console.error('Error loading submissions:', error)
    } finally {
      setIsLoadingSubmissions(false)
    }
  }

  // Merge a grading result emitted by the tracker into local state + storage.
  const applyGraderResult = (response: GraderResultResponse) => {
    const { submission, result } = response

    setSubmissions((prev) => {
      const next = prev.map((sub) =>
        sub.submission_id === submission.id
          ? { ...sub, status: submission.status, completed_at: submission.completed_at, result }
          : sub
      )
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })

    setActiveSubmission((prev) =>
      prev && prev.submission_id === submission.id
        ? { ...prev, status: submission.status, completed_at: submission.completed_at, result }
        : prev
    )
  }

  const handleUploadSuccess = (response: GraderSubmitResponse) => {
    const { submission, websocket } = response

    const newSubmission: Submission = {
      submission_id: submission.id,
      title: submission.title,
      status: isProcessingStatus(submission.status) ? submission.status : 'processing',
      created_at: submission.created_at,
      completed_at: null,
      result: null,
    }

    setSubmissions((prev) => {
      const next = [newSubmission, ...prev]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
    setActiveSubmission(newSubmission)
    setShowUploadModal(false)

    // Connect to the grading websocket; once the job completes the tracker fetches
    // the submission by id and emits it through applyGraderResult.
    subscribeToGraderSubmission({ submissionId: submission.id, websocket }, applyGraderResult)
  }

  return (
    <div className="w-full">
      {activeSubmission ? (
        <GradingResult result={activeSubmission} onBack={() => setActiveSubmission(null)} />
      ) : (
        <div className="min-h-full w-full bg-background">
          <div className="mx-auto w-full px-6 pb-12 pt-24 sm:px-8 lg:px-10">
            <section className="mx-auto mb-28 max-w-4xl text-center sm:mb-32">
              <h1 className="text-balance text-3xl font-semibold tracking-[-0.025em] text-foreground sm:text-[40px] sm:leading-[1.15]">
                Get thoughtful feedback on every paper
              </h1>
              <p className="mt-3 text-base text-muted-foreground sm:text-lg">
                Upload an assignment with its rubric for an instant AI-powered grade and detailed feedback
              </p>

              <div className="mx-auto mt-10 max-w-[280px] text-left">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="group flex min-h-36 w-full flex-col justify-between rounded-[28px] border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md"
                >
                  <Upload className="h-7 w-7 text-foreground/80" strokeWidth={2} />
                  <div>
                    <p className="text-lg font-semibold text-foreground">Upload</p>
                    <p className="mt-1 text-sm text-muted-foreground">Assignment and rubric</p>
                  </div>
                </button>
              </div>
            </section>

            <section>
              <div className="mb-5">
                <h2 className="relative pl-5 text-xl font-semibold text-foreground before:absolute before:inset-y-0 before:left-0 before:w-1 before:rounded-full before:bg-foreground sm:text-2xl">
                  Recent Submissions
                </h2>
                <p className="mt-1 pl-5 text-xs text-muted-foreground">Saved on this device</p>
              </div>
            {isLoadingSubmissions ? (
              <div className="rounded-3xl border border-border px-6 py-14 text-center">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
                <p className="text-sm text-muted-foreground">Loading submissions...</p>
              </div>
            ) : submissions.length > 0 ? (
                <div className="grid auto-rows-max grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {submissions.map((submission) => (
                    <button
                      type="button"
                      key={submission.submission_id}
                      onClick={() => setActiveSubmission(submission)}
                      className="group flex min-h-48 flex-col rounded-[30px] border border-border bg-card p-6 text-left transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-foreground">
                          <FileText className="h-5 w-5" />
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                      </div>
                      <div className="mt-6 flex flex-1 flex-col justify-end">
                        <p className="truncate text-lg font-semibold text-foreground">{submission.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{formatUTCDate(submission.created_at)}</p>
                        <div className="mt-4 flex items-end justify-between gap-4 border-t border-border pt-4">
                          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
                            {isProcessingStatus(submission.status) ? 'Processing...' : 'Grading completed'}
                          </span>
                        {submission.result?.overall_score !== null &&
                          submission.result?.overall_score !== undefined && (
                            <div className="shrink-0 text-right">
                              <p className="text-2xl font-semibold text-foreground">
                                {submission.result.overall_score}
                                <span className="text-sm font-normal text-muted-foreground">
                                  /{submission.result.max_score ?? 100}
                                </span>
                              </p>
                              <p className="text-xs text-muted-foreground">Grade {submission.result.overall_grade ?? '-'}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-border px-6 py-14 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-foreground">
                  <FileText className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">No submissions yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">Upload an assignment and rubric above to grade your first paper.</p>
              </div>
            )}
            </section>
          </div>

          {/* Upload Modal */}
          {showUploadModal && (
            <GraderUploadModal
              onClose={() => setShowUploadModal(false)}
              onSuccess={handleUploadSuccess}
            />
          )}
        </div>
      )}
    </div>
  )
}
