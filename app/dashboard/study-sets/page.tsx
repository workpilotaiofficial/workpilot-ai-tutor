'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  AnimatePresence,
  motion,
  MotionConfig,
  type Variants,
} from 'framer-motion'
import { Upload, Link as LinkIcon, Grid2X2, List } from 'lucide-react'
import UploadModal from '@/components/study-sets/upload-modal'
import PasteModal from '@/components/study-sets/paste-modal'
import StudySetCard from '@/components/study-sets/study-set-card'
import type { StudySetPreview } from '@/components/study-sets/utils'
import {
  fetchStudySetHistory,
  fetchStudySetProgress,
} from '@/lib/api/study-sets.service'
import { getApiClientErrorMessage } from '@/lib/api/client'
import { getStoredAuthObject } from '@/lib/api/session-storage'

const easing = [0.22, 1, 0.36, 1] as const

const pageVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
}

const fadeUpVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: easing,
    },
  },
}

const heroContentVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.08,
    },
  },
}

const uploadOptionsVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.18,
    },
  },
}

const uploadOptionVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 18,
    scale: 0.97,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: easing,
    },
  },
}

const contentStateVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: easing,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.18,
      ease: 'easeIn',
    },
  },
}

const cardsContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.055,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.025,
      staggerDirection: -1,
    },
  },
}

const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 18,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: easing,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.98,
    transition: {
      duration: 0.18,
    },
  },
}

export default function StudySetsPage() {
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showPasteModal, setShowPasteModal] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [studySets, setStudySets] = useState<StudySetPreview[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [firstName, setFirstName] = useState('there')

  const loadStudySets = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const historyResponse = await fetchStudySetHistory(signal)
      const history = Array.isArray(historyResponse.data)
        ? historyResponse.data
        : []

      const progressResults = await Promise.allSettled(
        history.map((studySet) =>
          fetchStudySetProgress(studySet.id, signal),
        ),
      )

      if (signal?.aborted) return

      setStudySets(
        history.map((studySet, index) => {
          const progressResult = progressResults[index]
          const summary =
            progressResult?.status === 'fulfilled'
              ? progressResult.value.summary
              : null

          return {
            id: studySet.id,
            title: studySet.title,
            items: studySet.item_count,
            percentageCompleted: studySet.percentage_completed,
            stats: {
              unfamiliar: summary?.unfamiliar ?? 0,
              learning: summary?.learning ?? 0,
              familiar: summary?.familiar ?? 0,
              mastered: summary?.mastered ?? 0,
            },
          }
        }),
      )
    } catch (error) {
      if (signal?.aborted) return

      console.error('Error fetching study set history:', error)
      setStudySets([])
      setErrorMessage(
        getApiClientErrorMessage(
          error,
          'Failed to load study sets. Please try again.',
        ),
      )
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    const abortController = new AbortController()

    void loadStudySets(abortController.signal)

    const displayName =
      getStoredAuthObject()?.user_display_name?.trim()

    if (displayName) {
      setFirstName(displayName.split(/\s+/)[0])
    }

    return () => abortController.abort()
  }, [loadStudySets])

  const refreshStudySets = () => {
    void loadStudySets()
  }

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        className="min-h-full w-full bg-background"
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="mx-auto w-full px-6 pb-12 pt-24 sm:px-8 lg:px-10">
          <motion.section
            className="mx-auto mb-28 max-w-4xl text-center sm:mb-32"
            variants={heroContentVariants}
          >
            <motion.h1
              className="text-balance text-3xl font-semibold tracking-[-0.025em] text-foreground sm:text-[40px] sm:leading-[1.15]"
              variants={fadeUpVariants}
            >
              Hey {firstName}, what do you wanna master?
            </motion.h1>

            <motion.p
              className="mt-3 text-base text-muted-foreground sm:text-lg"
              variants={fadeUpVariants}
            >
              Upload anything and get interactive notes, flashcards,
              quizzes, and more
            </motion.p>

            <motion.div
              className="mx-auto mt-10 grid max-w-[540px] grid-cols-1 gap-8 text-left sm:grid-cols-2"
              variants={uploadOptionsVariants}
            >
              <motion.button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="group flex min-h-36 flex-col justify-between rounded-[15px] border border-border bg-card p-5 text-left transition-colors hover:border-foreground/20 hover:shadow-md"
                variants={uploadOptionVariants}
                whileHover={{
                  y: -5,
                  scale: 1.015,
                }}
                whileTap={{
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
                    rotate: -6,
                    scale: 1.08,
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

                <div>
                  <p className="text-xl font-semibold text-foreground">
                    Upload
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Image, file (Max-10mb)
                  </p>
                </div>
              </motion.button>

              <motion.button
                id="paste-content-btn"
                type="button"
                onClick={() => setShowPasteModal(true)}
                className="group flex min-h-36 flex-col justify-between rounded-[15px] border border-border bg-card p-5 text-left transition-colors hover:border-foreground/20 hover:shadow-md"
                variants={uploadOptionVariants}
                whileHover={{
                  y: -5,
                  scale: 1.015,
                }}
                whileTap={{
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
                    rotate: 6,
                    scale: 1.08,
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

                <div>
                  <p className="text-xl font-semibold text-foreground">
                    Paste
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Upload your text
                  </p>
                </div>
              </motion.button>
            </motion.div>
          </motion.section>

          <motion.section variants={fadeUpVariants}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="relative pl-5 text-xl font-semibold text-foreground before:absolute before:inset-y-0 before:left-0 before:w-1 before:rounded-full before:bg-foreground sm:text-2xl">
                All Study Sets
              </h2>

              <div className="flex items-center rounded-xl border border-border bg-card p-1">
                <button
                  type="button"
                  aria-label="Grid view"
                  aria-pressed={viewMode === 'grid'}
                  onClick={() => setViewMode('grid')}
                  className={`relative rounded-lg p-2 transition-colors ${viewMode === 'grid'
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  {viewMode === 'grid' && (
                    <motion.span
                      className="absolute inset-0 rounded-lg bg-secondary"
                      layoutId="active-view-mode"
                      transition={{
                        type: 'spring',
                        stiffness: 450,
                        damping: 32,
                      }}
                    />
                  )}

                  <Grid2X2 className="relative z-10 h-4 w-4" />
                </button>

                <button
                  type="button"
                  aria-label="List view"
                  aria-pressed={viewMode === 'list'}
                  onClick={() => setViewMode('list')}
                  className={`relative rounded-lg p-2 transition-colors ${viewMode === 'list'
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  {viewMode === 'list' && (
                    <motion.span
                      className="absolute inset-0 rounded-lg bg-secondary"
                      layoutId="active-view-mode"
                      transition={{
                        type: 'spring',
                        stiffness: 450,
                        damping: 32,
                      }}
                    />
                  )}

                  <List className="relative z-10 h-4 w-4" />
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {isLoading ? (
                <motion.div
                  key="loading"
                  className="rounded-3xl border border-border px-6 py-14 text-center"
                  variants={contentStateVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <motion.div
                    className="mx-auto mb-4 h-7 w-7 rounded-full border-2 border-muted border-t-foreground"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 0.8,
                      ease: 'linear',
                      repeat: Infinity,
                    }}
                  />

                  <p className="text-sm text-muted-foreground">
                    Loading study sets...
                  </p>
                </motion.div>
              ) : errorMessage ? (
                <motion.div
                  key="error"
                  className="rounded-3xl border border-destructive/30 px-6 py-14 text-center"
                  variants={contentStateVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <h3 className="text-lg font-semibold text-foreground">
                    Couldn&apos;t load study sets
                  </h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {errorMessage}
                  </p>

                  <motion.button
                    type="button"
                    onClick={refreshStudySets}
                    className="mt-4 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Try again
                  </motion.button>
                </motion.div>
              ) : studySets.length === 0 ? (
                <motion.div
                  key="empty"
                  className="rounded-3xl border border-dashed border-border px-6 py-14 text-center"
                  variants={contentStateVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <motion.div
                    className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary"
                    initial={{ scale: 0.8, rotate: -8 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 20,
                      delay: 0.08,
                    }}
                  >
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  </motion.div>

                  <h3 className="text-lg font-semibold text-foreground">
                    No study sets yet
                  </h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Upload or paste content above to create your first
                    one.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key={viewMode}
                  className={
                    viewMode === 'grid'
                      ? 'grid auto-rows-max grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3'
                      : 'space-y-4'
                  }
                  variants={cardsContainerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                >
                  {studySets.map((set) => (
                    <motion.div
                      key={set.id}
                      variants={cardVariants}
                      layout
                      transition={{
                        layout: {
                          type: 'spring',
                          stiffness: 280,
                          damping: 28,
                        },
                      }}
                    >
                      <StudySetCard
                        set={set}
                        isListView={viewMode === 'list'}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        </div>

        {showUploadModal && (
          <UploadModal
            onClose={() => {
              setShowUploadModal(false)
              refreshStudySets()
            }}
          />
        )}

        {showPasteModal && (
          <PasteModal
            onClose={() => {
              setShowPasteModal(false)
              refreshStudySets()
            }}
          />
        )}
      </motion.div>
    </MotionConfig>
  )
}