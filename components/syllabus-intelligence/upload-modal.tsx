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
  FileText,
  LoaderCircle,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import type { SyllabusIntelligenceResult } from './utils'
import {
  waitForSyllabusSummary,
  type SyllabusTrackingStage,
} from './summary-tracker'
import {
  getApiClientErrorMessage,
  uploadSyllabusPdf,
  uploadSyllabusText,
} from '@/lib/api'

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024
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
    y: 34,
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
      staggerChildren: 0.07,
      delayChildren: 0.08,
    },
  },
  exit: {
    opacity: 0,
    y: 26,
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

const modeContentVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 14,
    y: 6,
  },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: {
      duration: 0.35,
      ease: smoothEase,
    },
  },
  exit: {
    opacity: 0,
    x: -14,
    y: -4,
    transition: {
      duration: 0.18,
      ease: 'easeIn',
    },
  },
}

const fileListVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
}

const fileItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
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
    x: 12,
    scale: 0.98,
    transition: {
      duration: 0.18,
    },
  },
}

const feedbackVariants: Variants = {
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

function isPdfFile(file: File) {
  return (
    file.type === 'application/pdf' ||
    /\.pdf$/i.test(file.name)
  )
}

function isTextLikeFile(file: File) {
  return (
    file.type.startsWith('text/') ||
    /\.(txt|md|markdown)$/i.test(file.name)
  )
}

function isUnsupportedSyllabusFile(file: File) {
  return !isPdfFile(file) && !isTextLikeFile(file)
}

function toDateInputValue(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function deriveSemesterDates(semesterWeeksValue: string) {
  const parsedWeeks = Number.parseInt(
    semesterWeeksValue,
    10,
  )

  const weeks = Number.isFinite(parsedWeeks)
    ? Math.max(8, Math.min(24, parsedWeeks))
    : 16

  const startDate = new Date()
  const endDate = new Date(startDate)

  endDate.setDate(endDate.getDate() + weeks * 7 - 1)

  return {
    semesterStartDate: toDateInputValue(startDate),
    semesterEndDate: toDateInputValue(endDate),
  }
}

interface SyllabusUploadModalProps {
  onClose: () => void
  onSuccess: (
    result: SyllabusIntelligenceResult,
  ) => void
  initialMode?: 'file' | 'text'
}

export default function SyllabusUploadModal({
  onClose,
  onSuccess,
  initialMode = 'file',
}: SyllabusUploadModalProps) {
  const [inputMode, setInputMode] = useState<
    'file' | 'text'
  >(initialMode)

  const [files, setFiles] = useState<File[]>([])
  const [text, setText] = useState('')
  const [title, setTitle] = useState('')
  const [semesterWeeks, setSemesterWeeks] =
    useState('16')
  const [isLoading, setIsLoading] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [loadingStage, setLoadingStage] = useState<
    'uploading' | SyllabusTrackingStage | null
  >(null)
  const [errorMessage, setErrorMessage] =
    useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  const requestClose = () => {
    if (isLoading) return
    setIsVisible(false)
  }

  /*
   * Browser paint হওয়ার আগেই page scroll lock করে।
   * এর ফলে modal open হওয়ার সময় scrollbar flash করে না।
   */
  useLayoutEffect(() => {
    const html = document.documentElement
    const body = document.body

    const previousHtmlOverflow = html.style.overflow
    const previousBodyOverflow = body.style.overflow
    const previousBodyPaddingRight =
      body.style.paddingRight

    const scrollbarWidth =
      window.innerWidth - html.clientWidth

    const currentBodyPaddingRight =
      Number.parseFloat(
        window.getComputedStyle(body).paddingRight,
      ) || 0

    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${currentBodyPaddingRight + scrollbarWidth
        }px`
    }

    return () => {
      html.style.overflow = previousHtmlOverflow
      body.style.overflow = previousBodyOverflow
      body.style.paddingRight =
        previousBodyPaddingRight
    }
  }, [])

  useEffect(() => {
    const handleEscape = (
      event: globalThis.KeyboardEvent,
    ) => {
      if (event.key === 'Escape' && !isLoading) {
        requestClose()
      }
    }

    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener(
        'keydown',
        handleEscape,
      )
    }
  }, [isLoading])

  const loadingLabel =
    loadingStage === 'uploading'
      ? 'Uploading syllabus'
      : loadingStage === 'connecting'
        ? 'Connecting to live updates'
        : loadingStage === 'processing'
          ? 'Processing syllabus'
          : loadingStage === 'fetching'
            ? 'Fetching final content'
            : loadingStage === 'completed'
              ? 'Completed'
              : ''

  const stageProgressPercent =
    loadingStage === 'uploading'
      ? 25
      : loadingStage === 'connecting'
        ? 50
        : loadingStage === 'processing'
          ? 75
          : loadingStage === 'fetching'
            ? 90
            : loadingStage === 'completed'
              ? 100
              : 0

  const validateFiles = (selectedFiles: File[]) => {
    const oversizedFiles = selectedFiles.filter(
      (file) => file.size > MAX_FILE_SIZE_BYTES,
    )

    if (oversizedFiles.length > 0) {
      setErrorMessage(
        'Each file must be smaller than 20MB.',
      )
    } else {
      setErrorMessage('')
    }

    return selectedFiles.filter(
      (file) => file.size <= MAX_FILE_SIZE_BYTES,
    )
  }

  const handleFileSelect = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const selected = Array.from(
      event.target.files || [],
    )

    setFiles(validateFiles(selected))
  }

  const handleDrop = (
    event: DragEvent<HTMLDivElement>,
  ) => {
    event.preventDefault()
    event.stopPropagation()

    setIsDragging(false)

    const dropped = Array.from(
      event.dataTransfer.files || [],
    )

    setFiles(validateFiles(dropped))
  }

  const handleDropzoneKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
  ) => {
    if (
      event.key !== 'Enter' &&
      event.key !== ' '
    ) {
      return
    }

    event.preventDefault()

    if (!isLoading) {
      fileInputRef.current?.click()
    }
  }

  const removeFile = (fileIndex: number) => {
    setFiles((previousFiles) =>
      previousFiles.filter(
        (_, index) => index !== fileIndex,
      ),
    )

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const resolveSelectedFile = () => {
    const supportedFile = files.find(
      (file) => !isUnsupportedSyllabusFile(file),
    )

    if (!supportedFile) {
      throw new Error(
        'Only PDF and TXT files are supported for syllabus analysis.',
      )
    }

    return supportedFile
  }

  const canSubmit =
    !isLoading &&
    ((inputMode === 'file' && files.length > 0) ||
      (inputMode === 'text' &&
        text.trim().length > 0))

  const handleAnalyze = async () => {
    if (!canSubmit) return

    setIsLoading(true)
    setLoadingStage('uploading')
    setErrorMessage('')

    try {
      const resolvedTitle =
        title.trim() || 'Untitled Syllabus'

      const {
        semesterStartDate,
        semesterEndDate,
      } = deriveSemesterDates(semesterWeeks)

      let uploadResponse

      if (inputMode === 'file') {
        const selectedFile = resolveSelectedFile()

        if (isPdfFile(selectedFile)) {
          uploadResponse = await uploadSyllabusPdf({
            title: resolvedTitle,
            file: selectedFile,
            semesterStartDate,
            semesterEndDate,
          })
        } else if (isTextLikeFile(selectedFile)) {
          const fileText =
            await selectedFile.text()

          if (!fileText.trim()) {
            throw new Error(
              'The selected text file is empty.',
            )
          }

          uploadResponse = await uploadSyllabusText({
            title: resolvedTitle,
            text: fileText,
            semesterStartDate,
            semesterEndDate,
          })
        } else {
          throw new Error(
            'Only PDF and TXT files are supported for syllabus analysis.',
          )
        }
      } else {
        uploadResponse = await uploadSyllabusText({
          title: resolvedTitle,
          text,
          semesterStartDate,
          semesterEndDate,
        })
      }

      const normalized =
        await waitForSyllabusSummary({
          syllabusId:
            uploadResponse.syllabus_id,
          websocket: uploadResponse.websocket,
          onStageChange: setLoadingStage,
        })

      setLoadingStage('completed')

      await new Promise((resolve) =>
        setTimeout(resolve, 400),
      )

      onSuccess(normalized)
    } catch (error) {
      console.error(
        'Error analyzing syllabus:',
        error,
      )

      setErrorMessage(
        getApiClientErrorMessage(
          error,
          'Failed to analyze syllabus.',
        ),
      )
    } finally {
      setIsLoading(false)
      setLoadingStage(null)
    }
  }

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
              if (
                event.target === event.currentTarget
              ) {
                requestClose()
              }
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="syllabus-modal-title"
              className="max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-2xl border border-border bg-card text-card-foreground shadow-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >
              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    className="h-1.5 w-full overflow-hidden bg-muted"
                    initial={{
                      opacity: 0,
                      scaleX: 0,
                    }}
                    animate={{
                      opacity: 1,
                      scaleX: 1,
                    }}
                    exit={{
                      opacity: 0,
                    }}
                    style={{
                      transformOrigin: 'left',
                    }}
                  >
                    <motion.div
                      className="h-full bg-primary"
                      initial={{
                        width: '0%',
                      }}
                      animate={{
                        width: `${stageProgressPercent}%`,
                      }}
                      transition={{
                        duration: 0.45,
                        ease: smoothEase,
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Header */}
              <motion.div
                className="flex items-center justify-between border-b border-border p-6"
                variants={contentItemVariants}
              >
                <div>
                  <motion.h2
                    id="syllabus-modal-title"
                    className="text-lg font-bold text-foreground"
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
                      delay: 0.14,
                      ease: smoothEase,
                    }}
                  >
                    Analyze Syllabus
                  </motion.h2>

                  <motion.p
                    className="mt-1 text-xs text-muted-foreground"
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
                      delay: 0.2,
                      ease: smoothEase,
                    }}
                  >
                    Upload a PDF or paste a course
                    outline to get started
                  </motion.p>
                </div>

                <motion.button
                  type="button"
                  onClick={requestClose}
                  disabled={isLoading}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Close syllabus upload"
                  whileHover={
                    isLoading
                      ? undefined
                      : {
                        scale: 1.1,
                        rotate: 6,
                      }
                  }
                  whileTap={
                    isLoading
                      ? undefined
                      : {
                        scale: 0.9,
                      }
                  }
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 20,
                  }}
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </motion.div>

              {/* Tabs */}
              <motion.div
                className="flex border-b border-border"
                variants={contentItemVariants}
              >
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    setInputMode('file')
                    setErrorMessage('')
                  }}
                  className={`relative flex-1 px-4 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${inputMode === 'file'
                      ? 'text-primary'
                      : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                    }`}
                >
                  Upload File

                  {inputMode === 'file' && (
                    <motion.span
                      className="absolute inset-x-0 bottom-0 h-0.5 bg-primary"
                      layoutId="syllabus-upload-mode"
                      transition={{
                        type: 'spring',
                        stiffness: 420,
                        damping: 32,
                      }}
                    />
                  )}
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    setInputMode('text')
                    setErrorMessage('')
                  }}
                  className={`relative flex-1 px-4 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${inputMode === 'text'
                      ? 'text-primary'
                      : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                    }`}
                >
                  Paste Text

                  {inputMode === 'text' && (
                    <motion.span
                      className="absolute inset-x-0 bottom-0 h-0.5 bg-primary"
                      layoutId="syllabus-upload-mode"
                      transition={{
                        type: 'spring',
                        stiffness: 420,
                        damping: 32,
                      }}
                    />
                  )}
                </button>
              </motion.div>

              {/* Content */}
              <div className="space-y-5 p-6">
                <motion.div
                  className="grid grid-cols-1 gap-4 md:grid-cols-2"
                  variants={contentItemVariants}
                >
                  <div>
                    <label
                      htmlFor="syllabus-course-title"
                      className="mb-2 block text-sm font-semibold text-foreground"
                    >
                      Course Title
                    </label>

                    <motion.input
                      id="syllabus-course-title"
                      type="text"
                      value={title}
                      disabled={isLoading}
                      onChange={(event) => {
                        setTitle(event.target.value)

                        if (errorMessage) {
                          setErrorMessage('')
                        }
                      }}
                      placeholder="e.g., Data Structures and Algorithms"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
                      whileFocus={{
                        scale: 1.005,
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 28,
                      }}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="syllabus-semester-weeks"
                      className="mb-2 block text-sm font-semibold text-foreground"
                    >
                      Semester Length (weeks)
                    </label>

                    <motion.input
                      id="syllabus-semester-weeks"
                      type="number"
                      min={8}
                      max={24}
                      value={semesterWeeks}
                      disabled={isLoading}
                      onChange={(event) =>
                        setSemesterWeeks(
                          event.target.value,
                        )
                      }
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground outline-none transition-[border-color,box-shadow] focus:ring-2 focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
                      whileFocus={{
                        scale: 1.005,
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 28,
                      }}
                    />
                  </div>
                </motion.div>

                <AnimatePresence
                  mode="wait"
                  initial={false}
                >
                  {inputMode === 'file' ? (
                    <motion.div
                      key="file-mode"
                      className="space-y-5"
                      variants={modeContentVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <p className="text-sm text-muted-foreground">
                        Upload syllabus files, course
                        outlines, assignment sheets, or
                        instructor notes.
                      </p>

                      <motion.div
                        role="button"
                        tabIndex={isLoading ? -1 : 0}
                        aria-label="Upload syllabus file"
                        onDrop={handleDrop}
                        onDragEnter={(event) => {
                          event.preventDefault()
                          setIsDragging(true)
                        }}
                        onDragOver={(event) => {
                          event.preventDefault()
                          setIsDragging(true)
                        }}
                        onDragLeave={(event) => {
                          if (
                            !event.currentTarget.contains(
                              event.relatedTarget as Node,
                            )
                          ) {
                            setIsDragging(false)
                          }
                        }}
                        onClick={() => {
                          if (!isLoading) {
                            fileInputRef.current?.click()
                          }
                        }}
                        onKeyDown={
                          handleDropzoneKeyDown
                        }
                        className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${isDragging
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-secondary/20 hover:border-primary/50 hover:bg-secondary/50'
                          }`}
                        animate={
                          isDragging
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
                          ref={fileInputRef}
                          type="file"
                          multiple
                          disabled={isLoading}
                          onChange={handleFileSelect}
                          accept=".pdf,.txt,.md,.markdown"
                          className="hidden"
                        />

                        <motion.div
                          animate={
                            isDragging
                              ? {
                                y: [-2, -9, -2],
                                scale: [
                                  1,
                                  1.12,
                                  1,
                                ],
                              }
                              : {
                                y: 0,
                                scale: 1,
                              }
                          }
                          transition={
                            isDragging
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
                          <Upload className="mx-auto mb-3 h-12 w-12 text-primary" />
                        </motion.div>

                        <p className="font-semibold text-foreground">
                          Click to upload or drag and
                          drop
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          PDF or plain text (.txt, .md)
                          up to 20MB
                        </p>
                      </motion.div>

                      <AnimatePresence>
                        {files.length > 0 && (
                          <motion.div
                            className="max-h-44 space-y-2 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                            variants={fileListVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                          >
                            <AnimatePresence>
                              {files.map(
                                (file, index) => {
                                  const isUnsupported =
                                    isUnsupportedSyllabusFile(
                                      file,
                                    )

                                  return (
                                    <motion.div
                                      key={`${file.name}-${file.size}-${index}`}
                                      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/20 p-3"
                                      variants={
                                        fileItemVariants
                                      }
                                      initial="hidden"
                                      animate="visible"
                                      exit="exit"
                                      layout
                                    >
                                      <div className="flex min-w-0 items-center gap-3">
                                        <motion.div
                                          initial={{
                                            scale: 0,
                                            rotate: -18,
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
                                          <CheckCircle
                                            className={`h-5 w-5 flex-shrink-0 ${isUnsupported
                                                ? 'text-amber-500'
                                                : 'text-green-600'
                                              }`}
                                          />
                                        </motion.div>

                                        <div className="min-w-0">
                                          <p className="truncate text-sm font-medium text-foreground">
                                            {file.name}
                                          </p>

                                          <p className="text-xs text-muted-foreground">
                                            {(
                                              file.size /
                                              1024 /
                                              1024
                                            ).toFixed(
                                              2,
                                            )}{' '}
                                            MB
                                          </p>

                                          {isUnsupported && (
                                            <p className="text-xs text-amber-600">
                                              Unsupported.
                                              Use PDF or TXT.
                                            </p>
                                          )}
                                        </div>
                                      </div>

                                      <motion.button
                                        type="button"
                                        aria-label={`Remove ${file.name}`}
                                        disabled={isLoading}
                                        onClick={() =>
                                          removeFile(
                                            index,
                                          )
                                        }
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
                                  )
                                },
                              )}
                            </AnimatePresence>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="text-mode"
                      className="space-y-4"
                      variants={modeContentVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <p className="text-sm text-muted-foreground">
                        Paste your complete syllabus or
                        weekly course outline for deeper AI
                        planning.
                      </p>

                      <motion.textarea
                        value={text}
                        disabled={isLoading}
                        onChange={(event) => {
                          setText(event.target.value)

                          if (errorMessage) {
                            setErrorMessage('')
                          }
                        }}
                        placeholder="Paste full syllabus, weekly schedule, grading breakdown, and assignment details..."
                        className="h-64 w-full resize-none rounded-lg border border-input bg-background px-3 py-3 text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
                        whileFocus={{
                          scale: 1.003,
                        }}
                        transition={{
                          type: 'spring',
                          stiffness: 400,
                          damping: 28,
                        }}
                      />

                      <motion.p
                        className="text-xs text-muted-foreground"
                        key={text.length}
                        initial={{
                          opacity: 0.6,
                          y: 2,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                      >
                        {text.length} characters
                      </motion.p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {isLoading && (
                    <motion.div
                      key="loading-status"
                      className="rounded-lg border border-primary/25 bg-primary/10 px-4 py-3"
                      variants={feedbackVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <div className="flex items-start gap-3">
                        <motion.span
                          animate={
                            loadingStage ===
                              'completed'
                              ? {
                                scale: [
                                  1,
                                  1.2,
                                  1,
                                ],
                              }
                              : {
                                rotate: 360,
                              }
                          }
                          transition={
                            loadingStage ===
                              'completed'
                              ? {
                                duration: 0.4,
                              }
                              : {
                                duration: 0.8,
                                repeat: Infinity,
                                ease: 'linear',
                              }
                          }
                        >
                          {loadingStage ===
                            'completed' ? (
                            <CheckCircle className="mt-0.5 h-5 w-5 text-primary" />
                          ) : (
                            <LoaderCircle className="mt-0.5 h-5 w-5 text-primary" />
                          )}
                        </motion.span>

                        <div>
                          <AnimatePresence
                            mode="wait"
                          >
                            <motion.p
                              key={
                                loadingLabel ||
                                'processing'
                              }
                              className="text-sm font-semibold text-foreground"
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
                              {loadingLabel ||
                                'Processing syllabus'}
                            </motion.p>
                          </AnimatePresence>

                          <p className="mt-1 text-xs text-muted-foreground">
                            Keep this window open while
                            processing.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {!isLoading &&
                    errorMessage && (
                      <motion.div
                        key="error-status"
                        role="alert"
                        className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3"
                        variants={
                          feedbackVariants
                        }
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

                        <p className="text-sm text-destructive">
                          {errorMessage}
                        </p>
                      </motion.div>
                    )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <motion.div
                className="flex gap-3 border-t border-border p-6"
                variants={contentItemVariants}
              >
                <motion.button
                  type="button"
                  onClick={requestClose}
                  disabled={isLoading}
                  className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 font-semibold text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
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
                  onClick={() =>
                    void handleAnalyze()
                  }
                  disabled={!canSubmit}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  whileHover={
                    canSubmit
                      ? {
                        y: -2,
                        scale: 1.015,
                      }
                      : undefined
                  }
                  whileTap={
                    canSubmit
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
                  <AnimatePresence
                    mode="wait"
                    initial={false}
                  >
                    {isLoading ? (
                      <motion.span
                        key="analyzing"
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

                        {loadingLabel ||
                          'Analyzing...'}
                      </motion.span>
                    ) : (
                      <motion.span
                        key="analyze"
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
                        <FileText className="h-4 w-4" />
                        Analyze
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