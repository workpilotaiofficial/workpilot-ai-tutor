'use client'

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from 'react'
import {
  AnimatePresence,
  motion,
  MotionConfig,
  type Variants,
} from 'framer-motion'
import {
  AlertCircle,
  CheckCircle,
  LoaderCircle,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import {
  getApiClientErrorMessage,
  submitGraderAssignment,
  type GraderSubmitResponse,
} from '@/lib/api'

interface GraderUploadModalProps {
  onClose: () => void
  onSuccess: (response: GraderSubmitResponse) => void
}

type UploadZone = 'assignment' | 'rubric'

const smoothEase = [0.22, 1, 0.36, 1] as const

const backdropVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.25,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
}

const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 32,
    scale: 0.96,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 26,
      mass: 0.8,
      staggerChildren: 0.08,
      delayChildren: 0.08,
    },
  },
  exit: {
    opacity: 0,
    y: 24,
    scale: 0.97,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
}

const contentItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 14,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.42,
      ease: smoothEase,
    },
  },
}

const fileContentVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 8,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: smoothEase,
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    scale: 0.98,
    transition: {
      duration: 0.16,
    },
  },
}

const errorVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -8,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 340,
      damping: 24,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.98,
    transition: {
      duration: 0.16,
    },
  },
}

export default function GraderUploadModal({
  onClose,
  onSuccess,
}: GraderUploadModalProps) {
  const [assignmentFile, setAssignmentFile] = useState<File | null>(
    null,
  )
  const [rubricFile, setRubricFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [error, setError] = useState('')
  const [draggingZone, setDraggingZone] =
    useState<UploadZone | null>(null)

  const assignmentInputRef = useRef<HTMLInputElement>(null)
  const rubricInputRef = useRef<HTMLInputElement>(null)

  const requestClose = () => {
    if (isLoading) return
    setIsVisible(false)
  }

  useLayoutEffect(() => {
    const body = document.body
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth

    const previousOverflow = body.style.overflow
    const previousPaddingRight = body.style.paddingRight

    body.style.overflow = 'hidden'

    // Scrollbar সরানোর কারণে page যেন horizontally shift না করে
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`
    }

    return () => {
      body.style.overflow = previousOverflow
      body.style.paddingRight = previousPaddingRight
    }
  }, [])



  const validateFile = (file?: File) => {
    if (!file) {
      setError('Please select a file')
      return false
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('File must be less than 50MB')
      return false
    }

    return true
  }

  const handleAssignmentSelect = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]

    if (!validateFile(file)) {
      event.target.value = ''
      return
    }

    setAssignmentFile(file ?? null)
    setError('')
  }

  const handleRubricSelect = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]

    if (!validateFile(file)) {
      event.target.value = ''
      return
    }

    setRubricFile(file ?? null)
    setError('')
  }

  const handleDrop = (
    event: DragEvent<HTMLDivElement>,
    type: UploadZone,
  ) => {
    event.preventDefault()
    event.stopPropagation()
    setDraggingZone(null)

    const file = event.dataTransfer.files?.[0]

    if (!validateFile(file)) return

    if (type === 'assignment') {
      setAssignmentFile(file ?? null)
    } else {
      setRubricFile(file ?? null)
    }

    setError('')
  }

  const handleDropzoneKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    type: UploadZone,
  ) => {
    if (event.key !== 'Enter' && event.key !== ' ') return

    event.preventDefault()

    if (type === 'assignment') {
      assignmentInputRef.current?.click()
    } else {
      rubricInputRef.current?.click()
    }
  }

  const removeAssignmentFile = () => {
    setAssignmentFile(null)

    if (assignmentInputRef.current) {
      assignmentInputRef.current.value = ''
    }
  }

  const removeRubricFile = () => {
    setRubricFile(null)

    if (rubricInputRef.current) {
      rubricInputRef.current.value = ''
    }
  }

  const handleSubmit = async () => {
    if (!assignmentFile || !rubricFile || !title.trim()) {
      setError('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const data = await submitGraderAssignment({
        title: title.trim(),
        assignmentFile,
        rubricFile,
      })

      onSuccess(data)
    } catch (err) {
      console.error('Error submitting assignment:', err)

      setError(
        getApiClientErrorMessage(
          err,
          'Failed to submit assignment',
        ),
      )
    } finally {
      setIsLoading(false)
    }
  }

  const isValid = Boolean(
    assignmentFile &&
    rubricFile &&
    title.trim().length > 0,
  )

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence onExitComplete={onClose}>
        {isVisible && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden overscroll-contain bg-black/50 p-4 backdrop-blur-[2px]"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                requestClose()
              }
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="grader-upload-title"
              className="max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-2xl bg-card shadow-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onMouseDown={(event) => event.stopPropagation()}
            >
              {/* Header */}
              <motion.div
                className="flex items-center justify-between border-b border-border p-6"
                variants={contentItemVariants}
              >
                <div>
                  <motion.h2
                    id="grader-upload-title"
                    className="text-xl font-bold text-foreground"
                    initial={{
                      opacity: 0,
                      x: -12,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    transition={{
                      duration: 0.4,
                      delay: 0.15,
                      ease: smoothEase,
                    }}
                  >
                    Submit Assignment for Grading
                  </motion.h2>

                  <motion.p
                    className="mt-1 text-sm text-muted-foreground"
                    initial={{
                      opacity: 0,
                      x: -12,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    transition={{
                      duration: 0.4,
                      delay: 0.22,
                      ease: smoothEase,
                    }}
                  >
                    Add your assignment and grading rubric
                  </motion.p>
                </div>

                <motion.button
                  type="button"
                  aria-label="Close upload modal"
                  onClick={requestClose}
                  disabled={isLoading}
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  whileHover={{
                    scale: 1.08,
                    rotate: 5,
                  }}
                  whileTap={{
                    scale: 0.92,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 20,
                  }}
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </motion.div>

              {/* Content */}
              <div className="space-y-6 p-6">
                {/* Title input */}
                <motion.div variants={contentItemVariants}>
                  <label
                    htmlFor="submission-title"
                    className="mb-2 block text-sm font-semibold text-foreground"
                  >
                    Submission Title{' '}
                    <span className="text-destructive">*</span>
                  </label>

                  <motion.input
                    id="submission-title"
                    type="text"
                    value={title}
                    disabled={isLoading}
                    onChange={(event) => {
                      setTitle(event.target.value)

                      if (error) {
                        setError('')
                      }
                    }}
                    placeholder="e.g., Psychology Essay Assignment 1"
                    className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                    whileFocus={{
                      scale: 1.005,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 28,
                    }}
                  />
                </motion.div>

                {/* Assignment file */}
                <motion.div variants={contentItemVariants}>
                  <label className="mb-2 block text-sm font-semibold text-foreground">
                    Assignment File{' '}
                    <span className="text-destructive">*</span>
                  </label>

                  <motion.div
                    role="button"
                    tabIndex={isLoading ? -1 : 0}
                    aria-label="Upload assignment file"
                    onDrop={(event) =>
                      handleDrop(event, 'assignment')
                    }
                    onDragEnter={(event) => {
                      event.preventDefault()
                      setDraggingZone('assignment')
                    }}
                    onDragOver={(event) => {
                      event.preventDefault()
                      setDraggingZone('assignment')
                    }}
                    onDragLeave={(event) => {
                      if (
                        !event.currentTarget.contains(
                          event.relatedTarget as Node,
                        )
                      ) {
                        setDraggingZone(null)
                      }
                    }}
                    onClick={() => {
                      if (!isLoading) {
                        assignmentInputRef.current?.click()
                      }
                    }}
                    onKeyDown={(event) =>
                      handleDropzoneKeyDown(
                        event,
                        'assignment',
                      )
                    }
                    className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary ${draggingZone === 'assignment'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary hover:bg-primary/5'
                      }`}
                    animate={
                      draggingZone === 'assignment'
                        ? {
                          scale: 1.015,
                          y: -2,
                        }
                        : {
                          scale: 1,
                          y: 0,
                        }
                    }
                    whileHover={
                      isLoading
                        ? undefined
                        : {
                          scale: 1.01,
                          y: -2,
                        }
                    }
                    transition={{
                      type: 'spring',
                      stiffness: 350,
                      damping: 24,
                    }}
                  >
                    <input
                      ref={assignmentInputRef}
                      type="file"
                      disabled={isLoading}
                      onChange={handleAssignmentSelect}
                      accept=".pdf,.txt,.doc,.docx,.md"
                      className="hidden"
                    />

                    <AnimatePresence mode="wait" initial={false}>
                      {assignmentFile ? (
                        <motion.div
                          key="assignment-selected"
                          className="flex items-center justify-between gap-4"
                          variants={fileContentVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <motion.div
                              initial={{
                                scale: 0,
                                rotate: -20,
                              }}
                              animate={{
                                scale: 1,
                                rotate: 0,
                              }}
                              transition={{
                                type: 'spring',
                                stiffness: 350,
                                damping: 18,
                              }}
                            >
                              <CheckCircle className="h-6 w-6 shrink-0 text-emerald-500" />
                            </motion.div>

                            <div className="min-w-0 text-left">
                              <p className="truncate font-semibold text-foreground">
                                {assignmentFile.name}
                              </p>

                              <p className="text-xs text-muted-foreground">
                                {(
                                  assignmentFile.size /
                                  1024 /
                                  1024
                                ).toFixed(2)}{' '}
                                MB
                              </p>
                            </div>
                          </div>

                          <motion.button
                            type="button"
                            aria-label="Remove assignment file"
                            disabled={isLoading}
                            onClick={(event) => {
                              event.stopPropagation()
                              removeAssignmentFile()
                            }}
                            className="shrink-0 rounded-lg p-2 text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
                            whileHover={{
                              scale: 1.08,
                              rotate: -5,
                            }}
                            whileTap={{
                              scale: 0.9,
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </motion.button>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="assignment-empty"
                          variants={fileContentVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                        >
                          <motion.div
                            animate={
                              draggingZone === 'assignment'
                                ? {
                                  y: [-2, -8, -2],
                                  scale: [1, 1.12, 1],
                                }
                                : {
                                  y: 0,
                                  scale: 1,
                                }
                            }
                            transition={
                              draggingZone === 'assignment'
                                ? {
                                  duration: 0.8,
                                  repeat: Infinity,
                                  ease: 'easeInOut',
                                }
                                : {
                                  type: 'spring',
                                  stiffness: 350,
                                  damping: 20,
                                }
                            }
                          >
                            <Upload className="mx-auto mb-2 h-10 w-10 text-primary" />
                          </motion.div>

                          <p className="mb-1 font-semibold text-foreground">
                            Click to upload or drag and drop
                          </p>

                          <p className="text-xs text-muted-foreground">
                            PDF, Word, or Text files (Max 50MB)
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>

                {/* Rubric file */}
                <motion.div variants={contentItemVariants}>
                  <label className="mb-2 block text-sm font-semibold text-foreground">
                    Grading Rubric File{' '}
                    <span className="text-destructive">*</span>
                  </label>

                  <motion.div
                    role="button"
                    tabIndex={isLoading ? -1 : 0}
                    aria-label="Upload grading rubric file"
                    onDrop={(event) =>
                      handleDrop(event, 'rubric')
                    }
                    onDragEnter={(event) => {
                      event.preventDefault()
                      setDraggingZone('rubric')
                    }}
                    onDragOver={(event) => {
                      event.preventDefault()
                      setDraggingZone('rubric')
                    }}
                    onDragLeave={(event) => {
                      if (
                        !event.currentTarget.contains(
                          event.relatedTarget as Node,
                        )
                      ) {
                        setDraggingZone(null)
                      }
                    }}
                    onClick={() => {
                      if (!isLoading) {
                        rubricInputRef.current?.click()
                      }
                    }}
                    onKeyDown={(event) =>
                      handleDropzoneKeyDown(event, 'rubric')
                    }
                    className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-thirdary ${draggingZone === 'rubric'
                        ? 'border-thirdary bg-thirdary/10'
                        : 'border-border hover:border-thirdary hover:bg-thirdary/5'
                      }`}
                    animate={
                      draggingZone === 'rubric'
                        ? {
                          scale: 1.015,
                          y: -2,
                        }
                        : {
                          scale: 1,
                          y: 0,
                        }
                    }
                    whileHover={
                      isLoading
                        ? undefined
                        : {
                          scale: 1.01,
                          y: -2,
                        }
                    }
                    transition={{
                      type: 'spring',
                      stiffness: 350,
                      damping: 24,
                    }}
                  >
                    <input
                      ref={rubricInputRef}
                      type="file"
                      disabled={isLoading}
                      onChange={handleRubricSelect}
                      accept=".pdf,.txt,.doc,.docx,.md"
                      className="hidden"
                    />

                    <AnimatePresence mode="wait" initial={false}>
                      {rubricFile ? (
                        <motion.div
                          key="rubric-selected"
                          className="flex items-center justify-between gap-4"
                          variants={fileContentVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <motion.div
                              initial={{
                                scale: 0,
                                rotate: -20,
                              }}
                              animate={{
                                scale: 1,
                                rotate: 0,
                              }}
                              transition={{
                                type: 'spring',
                                stiffness: 350,
                                damping: 18,
                              }}
                            >
                              <CheckCircle className="h-6 w-6 shrink-0 text-emerald-500" />
                            </motion.div>

                            <div className="min-w-0 text-left">
                              <p className="truncate font-semibold text-foreground">
                                {rubricFile.name}
                              </p>

                              <p className="text-xs text-muted-foreground">
                                {(
                                  rubricFile.size /
                                  1024 /
                                  1024
                                ).toFixed(2)}{' '}
                                MB
                              </p>
                            </div>
                          </div>

                          <motion.button
                            type="button"
                            aria-label="Remove grading rubric file"
                            disabled={isLoading}
                            onClick={(event) => {
                              event.stopPropagation()
                              removeRubricFile()
                            }}
                            className="shrink-0 rounded-lg p-2 text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
                            whileHover={{
                              scale: 1.08,
                              rotate: -5,
                            }}
                            whileTap={{
                              scale: 0.9,
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </motion.button>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="rubric-empty"
                          variants={fileContentVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                        >
                          <motion.div
                            animate={
                              draggingZone === 'rubric'
                                ? {
                                  y: [-2, -8, -2],
                                  scale: [1, 1.12, 1],
                                }
                                : {
                                  y: 0,
                                  scale: 1,
                                }
                            }
                            transition={
                              draggingZone === 'rubric'
                                ? {
                                  duration: 0.8,
                                  repeat: Infinity,
                                  ease: 'easeInOut',
                                }
                                : {
                                  type: 'spring',
                                  stiffness: 350,
                                  damping: 20,
                                }
                            }
                          >
                            <Upload className="mx-auto mb-2 h-10 w-10 text-thirdary" />
                          </motion.div>

                          <p className="mb-1 font-semibold text-foreground">
                            Click to upload or drag and drop
                          </p>

                          <p className="text-xs text-muted-foreground">
                            PDF, Word, or Text files (Max 50MB)
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>

                {/* Error message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      role="alert"
                      className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4"
                      variants={errorVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <motion.div
                        initial={{
                          scale: 0.7,
                          rotate: -10,
                        }}
                        animate={{
                          scale: 1,
                          rotate: 0,
                        }}
                        transition={{
                          type: 'spring',
                          stiffness: 350,
                          damping: 18,
                        }}
                      >
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                      </motion.div>

                      <p className="text-sm text-destructive/80">
                        {error}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <motion.div
                className="flex gap-3 border-t border-border bg-secondary p-6"
                variants={contentItemVariants}
              >
                <motion.button
                  type="button"
                  disabled={isLoading}
                  onClick={requestClose}
                  className="flex-1 rounded-lg border border-border px-4 py-2.5 font-medium text-foreground transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
                  whileHover={
                    isLoading
                      ? undefined
                      : {
                        y: -2,
                        scale: 1.015,
                      }
                  }
                  whileTap={
                    isLoading
                      ? undefined
                      : {
                        scale: 0.97,
                      }
                  }
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 24,
                  }}
                >
                  Cancel
                </motion.button>

                <motion.button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={!isValid || isLoading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-linear-to-r from-primary to-thirdary px-4 py-2.5 font-medium text-white transition-shadow hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none"
                  whileHover={
                    isValid && !isLoading
                      ? {
                        y: -2,
                        scale: 1.015,
                      }
                      : undefined
                  }
                  whileTap={
                    isValid && !isLoading
                      ? {
                        scale: 0.97,
                      }
                      : undefined
                  }
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 24,
                  }}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {isLoading ? (
                      <motion.span
                        key="submitting"
                        className="flex items-center gap-2"
                        initial={{
                          opacity: 0,
                          y: 5,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        exit={{
                          opacity: 0,
                          y: -5,
                        }}
                      >
                        <motion.span
                          animate={{
                            rotate: 360,
                          }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            ease: 'linear',
                          }}
                        >
                          <LoaderCircle className="h-4 w-4" />
                        </motion.span>

                        Submitting...
                      </motion.span>
                    ) : (
                      <motion.span
                        key="submit"
                        initial={{
                          opacity: 0,
                          y: 5,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        exit={{
                          opacity: 0,
                          y: -5,
                        }}
                      >
                        Submit for Grading
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  )
}