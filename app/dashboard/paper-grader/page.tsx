'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  AnimatePresence,
  motion,
  MotionConfig,
  type Variants,
} from 'framer-motion'
import { Upload, FileText, ArrowUpRight } from 'lucide-react'
import GraderUploadModal from '@/components/paper-grader/upload-modal'
import GradingResult from '@/components/paper-grader/grading-result'
import { formatUTCDate } from '@/lib/utils'
import {
  fetchGraderHistory,
  fetchGraderResult,
  type GraderHistoryItem,
  type GraderResultResponse,
  type GraderSubmitResponse,
} from '@/lib/api'
import { getApiClientErrorMessage } from '@/lib/api/client'
import { subscribeToGraderSubmission } from '@/components/paper-grader/grader-tracker'

const smoothEase = [0.22, 1, 0.36, 1] as const

const pageVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.06,
    },
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
}

const heroVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
}

const headingVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 28,
    filter: 'blur(7px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.65,
      ease: smoothEase,
    },
  },
}

const subtitleVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 18,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: smoothEase,
    },
  },
}

const uploadContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.15,
    },
  },
}

const uploadCardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 26,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.55,
      ease: smoothEase,
    },
  },
}

const sectionVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: smoothEase,
    },
  },
}

const sectionHeadingVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -18,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: smoothEase,
    },
  },
}

const stateVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
    scale: 0.985,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: smoothEase,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.985,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
}

const submissionsContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
}

const submissionCardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
    scale: 0.97,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: smoothEase,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.97,
    transition: {
      duration: 0.18,
    },
  },
}

const resultPageVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 18,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: smoothEase,
    },
  },
  exit: {
    opacity: 0,
    y: -14,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
}

function isProcessingStatus(status: string) {
  return (
    status === 'processing' ||
    status === 'queued' ||
    status === 'pending'
  )
}

export type Submission = GraderHistoryItem

export default function PaperGraderPage() {
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [activeSubmission, setActiveSubmission] =
    useState<Submission | null>(null)
  const [isLoadingSubmissions, setIsLoadingSubmissions] =
    useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const applyGraderResult = useCallback(
    (response: GraderResultResponse) => {
      const { submission, result } = response

      setSubmissions((previous) =>
        previous.map((item) =>
          item.submission_id === submission.id
            ? {
              ...item,
              title: submission.title || item.title,
              status: submission.status,
              completed_at: submission.completed_at,
              max_score:
                result?.max_score ?? item.max_score,
              score_percentage:
                result?.overall_score ??
                item.score_percentage,
              result,
            }
            : item,
        ),
      )

      setActiveSubmission((previous) =>
        previous?.submission_id === submission.id
          ? {
            ...previous,
            title:
              submission.title || previous.title,
            status: submission.status,
            completed_at: submission.completed_at,
            result,
          }
          : previous,
      )
    },
    [],
  )

  const loadSubmissions = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoadingSubmissions(true)
      setErrorMessage('')

      try {
        const response = await fetchGraderHistory(signal)

        if (signal?.aborted) return

        setSubmissions(response.data)

        response.data
          .filter((submission) =>
            isProcessingStatus(submission.status),
          )
          .forEach((submission) => {
            subscribeToGraderSubmission(
              {
                submissionId: submission.submission_id,
              },
              applyGraderResult,
            )
          })
      } catch (error) {
        if (signal?.aborted) return

        console.error(
          'Error loading submissions:',
          error,
        )

        setSubmissions([])

        setErrorMessage(
          getApiClientErrorMessage(
            error,
            'Failed to load grading history. Please try again.',
          ),
        )
      } finally {
        if (!signal?.aborted) {
          setIsLoadingSubmissions(false)
        }
      }
    },
    [applyGraderResult],
  )

  useEffect(() => {
    const abortController = new AbortController()

    void loadSubmissions(abortController.signal)

    return () => {
      abortController.abort()
    }
  }, [loadSubmissions])

  const openSubmission = useCallback(
    async (submission: Submission) => {
      setErrorMessage('')

      try {
        const response = await fetchGraderResult(
          submission.submission_id,
        )

        const detailedSubmission: Submission = {
          ...submission,
          title:
            response.submission.title ||
            submission.title,
          status: response.submission.status,
          completed_at:
            response.submission.completed_at,
          result: response.result,
        }

        setActiveSubmission(detailedSubmission)

        if (
          isProcessingStatus(
            detailedSubmission.status,
          )
        ) {
          subscribeToGraderSubmission(
            {
              submissionId:
                submission.submission_id,
            },
            applyGraderResult,
          )
        }
      } catch (error) {
        console.error(
          'Error opening grader submission:',
          error,
        )

        setErrorMessage(
          getApiClientErrorMessage(
            error,
            'Failed to open this grading result.',
          ),
        )
      }
    },
    [applyGraderResult],
  )

  const handleUploadSuccess = (
    response: GraderSubmitResponse,
  ) => {
    const { submission, websocket } = response

    const newSubmission: Submission = {
      submission_id: submission.id,
      title: submission.title,
      description: null,
      status: isProcessingStatus(submission.status)
        ? submission.status
        : 'processing',
      max_score: null,
      score_percentage: null,
      points_lost: null,
      created_at: submission.created_at,
      completed_at: null,
      result: null,
    }

    setSubmissions((previous) => [
      newSubmission,
      ...previous.filter(
        (item) =>
          item.submission_id !==
          newSubmission.submission_id,
      ),
    ])

    setActiveSubmission(newSubmission)
    setShowUploadModal(false)

    subscribeToGraderSubmission(
      {
        submissionId: submission.id,
        websocket,
      },
      applyGraderResult,
    )
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="w-full">
        <AnimatePresence mode="wait">
          {activeSubmission ? (
            <motion.div
              key={`grading-result-${activeSubmission.submission_id}`}
              className="min-h-full w-full"
              variants={resultPageVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <GradingResult
                result={activeSubmission}
                onBack={() =>
                  setActiveSubmission(null)
                }
              />
            </motion.div>
          ) : (
            <motion.div
              key="paper-grader-overview"
              className="min-h-full w-full bg-background"
              variants={pageVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="mx-auto w-full px-6 pb-12 pt-24 sm:px-8 lg:px-10">
                <motion.section
                  className="mx-auto mb-28 max-w-4xl text-center sm:mb-32"
                  variants={heroVariants}
                >
                  <motion.h1
                    className="text-balance text-3xl font-semibold tracking-[-0.025em] text-foreground sm:text-[40px] sm:leading-[1.15]"
                    variants={headingVariants}
                  >
                    Get thoughtful feedback on every
                    paper
                  </motion.h1>

                  <motion.p
                    className="mt-3 text-base text-muted-foreground sm:text-lg"
                    variants={subtitleVariants}
                  >
                    Upload an assignment with its
                    rubric for an instant AI-powered
                    grade and detailed feedback
                  </motion.p>

                  <motion.div
                    className="mx-auto mt-10 max-w-[280px] text-left"
                    variants={uploadContainerVariants}
                  >
                    <motion.button
                      type="button"
                      onClick={() =>
                        setShowUploadModal(true)
                      }
                      className="group flex min-h-36 w-full flex-col justify-between rounded-[28px] border border-border bg-card p-5 text-left shadow-sm transition-colors hover:border-foreground/20 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      variants={uploadCardVariants}
                      whileHover={{
                        y: -7,
                        scale: 1.02,
                      }}
                      whileTap={{
                        y: -2,
                        scale: 0.98,
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 350,
                        damping: 24,
                      }}
                    >
                      <motion.div
                        whileHover={{
                          y: -2,
                          rotate: -8,
                          scale: 1.12,
                        }}
                        transition={{
                          type: 'spring',
                          stiffness: 400,
                          damping: 18,
                        }}
                      >
                        <Upload
                          className="h-7 w-7 text-foreground/80"
                          strokeWidth={2}
                        />
                      </motion.div>

                      <motion.div
                        initial={{
                          opacity: 0,
                          y: 8,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        transition={{
                          duration: 0.4,
                          delay: 0.6,
                          ease: smoothEase,
                        }}
                      >
                        <p className="text-lg font-semibold text-foreground">
                          Upload
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                          Assignment and rubric
                        </p>
                      </motion.div>
                    </motion.button>
                  </motion.div>
                </motion.section>

                <motion.section
                  variants={sectionVariants}
                >
                  <motion.div
                    className="mb-5"
                    variants={sectionHeadingVariants}
                  >
                    <h2 className="relative pl-5 text-xl font-semibold text-foreground before:absolute before:inset-y-0 before:left-0 before:w-1 before:rounded-full before:bg-foreground sm:text-2xl">
                      Recent Submissions
                    </h2>

                    <p className="mt-1 pl-5 text-xs text-muted-foreground">
                      Synced with your account
                    </p>
                  </motion.div>

                  <AnimatePresence
                    mode="wait"
                    initial={false}
                  >
                    {isLoadingSubmissions ? (
                      <motion.div
                        key="loading"
                        className="rounded-3xl border border-border px-6 py-14 text-center"
                        variants={stateVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                      >
                        <motion.div
                          className="mx-auto mb-4 h-8 w-8 rounded-full border-2 border-muted border-t-foreground"
                          animate={{
                            rotate: 360,
                          }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            ease: 'linear',
                          }}
                        />

                        <motion.p
                          className="text-sm text-muted-foreground"
                          animate={{
                            opacity: [0.5, 1, 0.5],
                          }}
                          transition={{
                            duration: 1.4,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                        >
                          Loading submissions...
                        </motion.p>
                      </motion.div>
                    ) : errorMessage ? (
                      <motion.div
                        key="error"
                        className="rounded-3xl border border-destructive/30 px-6 py-14 text-center"
                        variants={stateVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                      >
                        <motion.div
                          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive"
                          initial={{
                            opacity: 0,
                            scale: 0.7,
                            rotate: -10,
                          }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            rotate: 0,
                          }}
                          transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 18,
                          }}
                        >
                          <FileText className="h-6 w-6" />
                        </motion.div>

                        <motion.h3
                          className="text-lg font-semibold text-foreground"
                          initial={{
                            opacity: 0,
                            y: 8,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          transition={{
                            duration: 0.35,
                            delay: 0.1,
                          }}
                        >
                          Couldn&apos;t load grading
                          history
                        </motion.h3>

                        <motion.p
                          className="mt-1 text-sm text-muted-foreground"
                          initial={{
                            opacity: 0,
                            y: 8,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          transition={{
                            duration: 0.35,
                            delay: 0.16,
                          }}
                        >
                          {errorMessage}
                        </motion.p>

                        <motion.button
                          type="button"
                          onClick={() =>
                            void loadSubmissions()
                          }
                          className="mt-4 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          initial={{
                            opacity: 0,
                            y: 8,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          transition={{
                            duration: 0.35,
                            delay: 0.22,
                          }}
                          whileHover={{
                            y: -2,
                            scale: 1.04,
                          }}
                          whileTap={{
                            scale: 0.96,
                          }}
                        >
                          Try again
                        </motion.button>
                      </motion.div>
                    ) : submissions.length > 0 ? (
                      <motion.div
                        key="submissions"
                        className="grid auto-rows-max grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
                        variants={
                          submissionsContainerVariants
                        }
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout
                      >
                        {submissions.map(
                          (submission) => {
                            const isProcessing =
                              isProcessingStatus(
                                submission.status,
                              )

                            const hasScore =
                              (submission.result
                                ?.overall_score !==
                                null &&
                                submission.result
                                  ?.overall_score !==
                                undefined) ||
                              submission.score_percentage !==
                              null

                            return (
                              <motion.div
                                key={
                                  submission.submission_id
                                }
                                variants={
                                  submissionCardVariants
                                }
                                layout
                                transition={{
                                  layout: {
                                    type: 'spring',
                                    stiffness: 280,
                                    damping: 28,
                                  },
                                }}
                              >
                                <motion.button
                                  type="button"
                                  onClick={() =>
                                    void openSubmission(
                                      submission,
                                    )
                                  }
                                  className="group flex min-h-48 w-full flex-col rounded-[30px] border border-border bg-card p-6 text-left shadow-sm transition-colors hover:border-foreground/20 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                  whileHover={{
                                    y: -6,
                                    scale: 1.015,
                                  }}
                                  whileTap={{
                                    y: -2,
                                    scale: 0.985,
                                  }}
                                  transition={{
                                    type: 'spring',
                                    stiffness: 350,
                                    damping: 24,
                                  }}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <motion.div
                                      className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-foreground"
                                      whileHover={{
                                        rotate: -6,
                                        scale: 1.08,
                                      }}
                                      transition={{
                                        type: 'spring',
                                        stiffness: 350,
                                        damping: 20,
                                      }}
                                    >
                                      <FileText className="h-5 w-5" />
                                    </motion.div>

                                    <motion.div
                                      className="text-muted-foreground transition-colors group-hover:text-foreground"
                                      whileHover={{
                                        x: 3,
                                        y: -3,
                                      }}
                                      transition={{
                                        type: 'spring',
                                        stiffness: 400,
                                        damping: 20,
                                      }}
                                    >
                                      <ArrowUpRight className="h-4 w-4" />
                                    </motion.div>
                                  </div>

                                  <div className="mt-6 flex flex-1 flex-col justify-end">
                                    <p className="truncate text-lg font-semibold text-foreground">
                                      {submission.title}
                                    </p>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                      {formatUTCDate(
                                        submission.created_at,
                                      )}
                                    </p>

                                    <div className="mt-4 flex items-end justify-between gap-4 border-t border-border pt-4">
                                      <motion.span
                                        className="relative rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground"
                                        animate={
                                          isProcessing
                                            ? {
                                              opacity: [
                                                0.55,
                                                1,
                                                0.55,
                                              ],
                                            }
                                            : {
                                              opacity: 1,
                                            }
                                        }
                                        transition={
                                          isProcessing
                                            ? {
                                              duration: 1.4,
                                              repeat:
                                                Infinity,
                                              ease: 'easeInOut',
                                            }
                                            : undefined
                                        }
                                      >
                                        {isProcessing
                                          ? 'Processing...'
                                          : 'Grading completed'}
                                      </motion.span>

                                      {hasScore ? (
                                        <motion.div
                                          className="shrink-0 text-right"
                                          initial={{
                                            opacity: 0,
                                            scale: 0.85,
                                            y: 6,
                                          }}
                                          animate={{
                                            opacity: 1,
                                            scale: 1,
                                            y: 0,
                                          }}
                                          transition={{
                                            type: 'spring',
                                            stiffness: 300,
                                            damping: 20,
                                            delay: 0.12,
                                          }}
                                        >
                                          <p className="text-2xl font-semibold text-foreground">
                                            {submission
                                              .result
                                              ?.overall_score ??
                                              submission.score_percentage}

                                            <span className="text-sm font-normal text-muted-foreground">
                                              {submission
                                                .result
                                                ?.overall_score !==
                                                null &&
                                                submission
                                                  .result
                                                  ?.overall_score !==
                                                undefined
                                                ? `/${submission
                                                  .result
                                                  .max_score ??
                                                submission.max_score ??
                                                100
                                                }`
                                                : '%'}
                                            </span>
                                          </p>

                                          <p className="text-xs text-muted-foreground">
                                            {submission
                                              .result
                                              ?.overall_grade
                                              ? `Grade ${submission.result.overall_grade}`
                                              : submission.points_lost !==
                                                null
                                                ? `${submission.points_lost} points lost`
                                                : 'Score'}
                                          </p>
                                        </motion.div>
                                      ) : null}
                                    </div>
                                  </div>
                                </motion.button>
                              </motion.div>
                            )
                          },
                        )}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="empty"
                        className="rounded-3xl border border-dashed border-border px-6 py-14 text-center"
                        variants={stateVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                      >
                        <motion.div
                          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-foreground"
                          initial={{
                            opacity: 0,
                            scale: 0.7,
                            rotate: -12,
                          }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            rotate: 0,
                          }}
                          transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 18,
                            delay: 0.05,
                          }}
                        >
                          <FileText className="h-7 w-7" />
                        </motion.div>

                        <motion.h3
                          className="text-lg font-semibold text-foreground"
                          initial={{
                            opacity: 0,
                            y: 10,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          transition={{
                            duration: 0.4,
                            delay: 0.12,
                            ease: smoothEase,
                          }}
                        >
                          No submissions yet
                        </motion.h3>

                        <motion.p
                          className="mt-1 text-sm text-muted-foreground"
                          initial={{
                            opacity: 0,
                            y: 10,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          transition={{
                            duration: 0.4,
                            delay: 0.18,
                            ease: smoothEase,
                          }}
                        >
                          Upload an assignment and rubric
                          above to grade your first paper.
                        </motion.p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.section>
              </div>

              {showUploadModal && (
                <GraderUploadModal
                  onClose={() =>
                    setShowUploadModal(false)
                  }
                  onSuccess={handleUploadSuccess}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  )
}