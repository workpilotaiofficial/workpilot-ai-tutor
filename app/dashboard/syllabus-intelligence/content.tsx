'use client'

import SyllabusAnalysisResult from '@/components/syllabus-intelligence/analysis-result'
import SyllabusUploadModal from '@/components/syllabus-intelligence/upload-modal'
import {
  mapSyllabusDetailToResult,
  type SyllabusIntelligenceResult,
} from '@/components/syllabus-intelligence/utils'
import { getApiClientErrorMessage } from '@/lib/api/client'
import {
  fetchSyllabusById,
  fetchSyllabusHistory,
} from '@/lib/api/syllabus.service'
import { formatUTCDate } from '@/lib/utils'
import {
  AnimatePresence,
  motion,
  MotionConfig,
  type Variants,
} from 'framer-motion'
import {
  ArrowUpRight,
  FileText,
  Link as LinkIcon,
  Upload,
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

const smoothEase = [0.22, 1, 0.36, 1] as const

const pageVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.25,
      staggerChildren: 0.14,
      delayChildren: 0.08,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
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
    filter: 'blur(6px)',
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

const actionContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.18,
    },
  },
}

const actionCardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 28,
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

const resultsContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
}

const resultCardVariants: Variants = {
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
    y: -12,
    scale: 0.97,
    transition: {
      duration: 0.2,
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

export default function SyllabusIntelligenceContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const resultIdParam = searchParams.get('id')

  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadMode, setUploadMode] = useState<'file' | 'text'>(
    'file',
  )
  const [results, setResults] = useState<
    SyllabusIntelligenceResult[]
  >([])
  const [activeResult, setActiveResult] =
    useState<SyllabusIntelligenceResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const openUploadModal = useCallback(
    (mode: 'file' | 'text' = 'file') => {
      setUploadMode(mode)
      setShowUploadModal(true)
    },
    [],
  )

  const closeUploadModal = useCallback(() => {
    setShowUploadModal(false)
  }, [])

  const sortedResults = useMemo(
    () =>
      [...results].sort(
        (a, b) =>
          +new Date(b.createdAt) - +new Date(a.createdAt),
      ),
    [results],
  )

  const loadHistory = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const response = await fetchSyllabusHistory(signal)

      if (signal?.aborted) return

      setResults(
        response.data
          .map((entry) => mapSyllabusDetailToResult(entry))
          .filter(
            (
              entry,
            ): entry is SyllabusIntelligenceResult =>
              Boolean(entry),
          ),
      )
    } catch (error) {
      if (signal?.aborted) return

      console.error(
        'Error fetching syllabus history:',
        error,
      )

      setResults([])

      setErrorMessage(
        getApiClientErrorMessage(
          error,
          'Failed to load syllabus history. Please try again.',
        ),
      )
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false)
      }
    }
  }, [])

  const openResult = useCallback(
    async (resultId: string) => {
      setErrorMessage('')

      try {
        const detail = await fetchSyllabusById(resultId)
        const normalized =
          mapSyllabusDetailToResult(detail)

        if (!normalized) {
          throw new Error(
            'Syllabus detail could not be parsed.',
          )
        }

        setActiveResult(normalized)
        router.push(`?id=${resultId}`)
      } catch (error) {
        console.error(
          'Error fetching syllabus detail:',
          error,
        )

        setErrorMessage(
          getApiClientErrorMessage(
            error,
            'Failed to open this syllabus analysis.',
          ),
        )
      }
    },
    [router],
  )

  const handleResultSuccess = useCallback(
    (result: SyllabusIntelligenceResult) => {
      setActiveResult(result)
      router.push(`?id=${result.id}`)
      setShowUploadModal(false)
      void loadHistory()
    },
    [loadHistory, router],
  )

  const handleBack = useCallback(() => {
    setActiveResult(null)
    router.push('?')
  }, [router])

  useEffect(() => {
    const abortController = new AbortController()

    void loadHistory(abortController.signal)

    return () => {
      abortController.abort()
    }
  }, [loadHistory])

  useEffect(() => {
    if (!resultIdParam) {
      if (activeResult) {
        setActiveResult(null)
      }

      return
    }

    if (activeResult?.id !== resultIdParam) {
      void openResult(resultIdParam)
    }
  }, [activeResult, openResult, resultIdParam])

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait">
        {activeResult ? (
          <motion.div
            key={`result-${activeResult.id}`}
            className="min-h-full w-full"
            variants={resultPageVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <SyllabusAnalysisResult
              result={activeResult}
              onBack={handleBack}
            />
          </motion.div>
        ) : (
          <motion.div
            key="syllabus-overview"
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
                  Turn your syllabus into an action plan
                </motion.h1>

                <motion.p
                  className="mt-3 text-base text-muted-foreground sm:text-lg"
                  variants={subtitleVariants}
                >
                  Get AI-powered modules, learning objectives,
                  timelines, and weekly priorities
                </motion.p>

                <motion.div
                  className="mx-auto mt-10 grid max-w-[560px] grid-cols-1 gap-3 text-left sm:grid-cols-2"
                  variants={actionContainerVariants}
                >
                  <motion.button
                    type="button"
                    onClick={() => openUploadModal('file')}
                    className="group flex min-h-36 flex-col justify-between rounded-[28px] border border-border bg-card p-5 text-left shadow-sm transition-colors hover:border-foreground/20 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    variants={actionCardVariants}
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
                      initial={{
                        rotate: 0,
                        scale: 1,
                      }}
                      whileHover={{
                        rotate: -8,
                        scale: 1.12,
                        y: -2,
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
                        delay: 0.55,
                        ease: smoothEase,
                      }}
                    >
                      <p className="text-lg font-semibold text-foreground">
                        Upload
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        PDF or text file (Max 20MB)
                      </p>
                    </motion.div>
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={() => openUploadModal('text')}
                    className="group flex min-h-36 flex-col justify-between rounded-[28px] border border-border bg-card p-5 text-left shadow-sm transition-colors hover:border-foreground/20 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    variants={actionCardVariants}
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
                      initial={{
                        rotate: 0,
                        scale: 1,
                      }}
                      whileHover={{
                        rotate: 8,
                        scale: 1.12,
                        y: -2,
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 18,
                      }}
                    >
                      <LinkIcon
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
                        delay: 0.65,
                        ease: smoothEase,
                      }}
                    >
                      <p className="text-lg font-semibold text-foreground">
                        Paste
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Paste your course outline
                      </p>
                    </motion.div>
                  </motion.button>
                </motion.div>
              </motion.section>

              <motion.section variants={sectionVariants}>
                <motion.div
                  className="mb-5"
                  variants={sectionHeadingVariants}
                >
                  <h2 className="relative pl-5 text-xl font-semibold text-foreground before:absolute before:inset-y-0 before:left-0 before:w-1 before:rounded-full before:bg-foreground sm:text-2xl">
                    Recent Analyses
                  </h2>

                  <p className="mt-1 pl-5 text-xs text-muted-foreground">
                    Saved on this device
                  </p>
                </motion.div>

                <AnimatePresence mode="wait" initial={false}>
                  {isLoading ? (
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
                        Loading syllabus history...
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
                        className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10"
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
                        <FileText className="h-6 w-6 text-destructive" />
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
                          delay: 0.1,
                          duration: 0.35,
                        }}
                      >
                        Couldn&apos;t load syllabus history
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
                          delay: 0.16,
                          duration: 0.35,
                        }}
                      >
                        {errorMessage}
                      </motion.p>

                      <motion.button
                        type="button"
                        onClick={() => void loadHistory()}
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
                          delay: 0.22,
                          duration: 0.35,
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
                  ) : sortedResults.length === 0 ? (
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
                        No syllabus analyzed yet
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
                        Upload or paste a syllabus above to
                        generate your first roadmap.
                      </motion.p>
                    </motion.div>
                  ) : (
                    <motion.ul
                      key="results"
                      className="grid auto-rows-max grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
                      variants={resultsContainerVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                    >
                      {sortedResults.map((result) => (
                        <motion.li
                          key={result.id}
                          variants={resultCardVariants}
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
                              void openResult(result.id)
                            }
                            aria-label={`Open analysis for ${result.title}`}
                            className="group h-full w-full rounded-[30px] border border-border bg-card p-6 text-left shadow-sm transition-colors hover:border-foreground/20 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <p className="truncate text-lg font-semibold text-foreground">
                                    {result.title}
                                  </p>

                                  <motion.span
                                    className="flex-shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
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
                                  </motion.span>
                                </div>

                                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                  <motion.span
                                    className="rounded-full border border-border bg-background px-2.5 py-1 font-medium text-muted-foreground"
                                    whileHover={{
                                      y: -2,
                                    }}
                                  >
                                    {result.modules.length}{' '}
                                    modules
                                  </motion.span>

                                  <motion.span
                                    className="rounded-full border border-border bg-background px-2.5 py-1 font-medium text-muted-foreground"
                                    whileHover={{
                                      y: -2,
                                    }}
                                  >
                                    {result.analysis
                                      ?.overallLearningObjectives
                                      .length ?? 0}{' '}
                                    objectives
                                  </motion.span>
                                </div>

                                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                                  {result.analysis?.courseSummary ??
                                    'No AI summary available yet.'}
                                </p>
                              </div>

                              <div className="flex flex-shrink-0 items-center gap-2">
                                <span className="whitespace-nowrap text-xs text-muted-foreground">
                                  {formatUTCDate(
                                    result.createdAt,
                                  )}
                                </span>
                              </div>
                            </div>
                          </motion.button>
                        </motion.li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </motion.section>
            </div>

            {showUploadModal && (
              <SyllabusUploadModal
                initialMode={uploadMode}
                onClose={closeUploadModal}
                onSuccess={handleResultSuccess}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  )
}