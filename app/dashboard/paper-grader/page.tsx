'use client'

import { useState, useEffect } from 'react'
import { Upload, FileText, ArrowRight } from 'lucide-react'
import GraderUploadModal from '@/components/paper-grader/upload-modal'
import GradingResult from '@/components/paper-grader/grading-result'
import { formatUTCDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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
        <div className="min-h-screen bg-white dark:bg-background">
          {/* Hero Section */}
          <div className="border-b border-border bg-white dark:bg-background/50 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-8 py-12">
              <div className="space-y-4 mb-8">
                <h1 className="text-4xl md:text-5xl font-black bg-linear-to-r from-foreground to-primary bg-clip-text text-transparent">
                  Paper Grader
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
                  Upload your essays, assignments, or papers with grading rubrics to get instant AI-powered feedback and detailed assessments.
                </p>
              </div>

              {/* Action Button */}
              <Button
                onClick={() => setShowUploadModal(true)}
                className="btn-primary"
              >
                <Upload className="w-5 h-5" />
                Upload Assignment & Rubric
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-8 py-12">
            {isLoadingSubmissions ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-muted-foreground font-medium">
                    Loading submissions...
                  </p>
                </div>
              </div>
            ) : submissions.length > 0 ? (
              <div>
                <div className="mb-8">
                  <h2 className="text-2xl font-black text-foreground flex items-center gap-3 mb-6">
                    <div className="w-1 h-8 bg-linear-to-b from-primary to-thirdary rounded-full"></div>
                    Recent Submissions
                  </h2>
                </div>

                <div className="grid gap-4">
                  {submissions.map((submission) => (
                    <Button
                      key={submission.submission_id}
                      onClick={() => setActiveSubmission(submission)}
                      className="group p-6 bg-card dark:bg-card border border-border rounded-xl hover:border-primary/40 hover:shadow-lg dark:hover:shadow-primary/10 transition-all duration-300 text-left"
                    >
                      <div className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="p-3 bg-secondary dark:bg-secondary rounded-lg shrink-0 group-hover:shadow-md transition-all">
                            <FileText className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-foreground truncate group-hover:text-primary transition-colors">
                              {submission.title}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {formatUTCDate(submission.created_at)} •{' '}
                              {isProcessingStatus(submission.status) ? (
                                <span className="text-primary font-semibold">
                                  Processing...
                                </span>
                              ) : submission.result?.overall_score !== null &&
                                submission.result?.overall_score !== undefined ? (
                                <span className="font-semibold text-foreground/70">
                                  Score: {submission.result.overall_score}/{submission.result.max_score ?? 100}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">
                                  Grading completed
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        {submission.result?.overall_score !== null &&
                          submission.result?.overall_score !== undefined && (
                            <div className="text-right shrink-0">
                              <p className="text-4xl font-black bg-linear-to-r from-primary to-thirdary bg-clip-text text-transparent">
                                {submission.result.overall_score}
                                <span className="text-xl text-muted-foreground">
                                  /{submission.result.max_score ?? 100}
                                </span>
                              </p>
                              <p className="text-sm font-bold text-muted-foreground mt-1">
                                Grade:{' '}
                                <span className="text-lg text-foreground">
                                  {submission.result.overall_grade ?? '-'}
                                </span>
                              </p>
                            </div>
                          )}

                        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 px-6">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-linear-to-br from-primary/20 to-thirdary/20 rounded-3xl blur-2xl"></div>
                  <div className="relative w-24 h-24 bg-secondary dark:bg-secondary rounded-3xl flex items-center justify-center shadow-lg">
                    <FileText className="w-12 h-12 text-primary" />
                  </div>
                </div>
                <h2 className="text-3xl font-black text-foreground mb-3 text-center">
                  No submissions yet
                </h2>
                <p className="text-muted-foreground mb-10 max-w-sm text-center leading-relaxed font-medium">
                  Start by uploading your assignment along with the grading rubric to receive instant feedback and grading.
                </p>
                <Button
                  onClick={() => setShowUploadModal(true)}
                  className="btn-primary relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative">Upload Your First Assignment</span>
                </Button>
              </div>
            )}
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
