'use client'

import { useRef, useState } from 'react'
import { CheckCircle, FileText, Upload, X } from 'lucide-react'
import {
  persistSyllabusResult,
  type SyllabusIntelligenceResult,
} from './utils'
import { waitForSyllabusSummary, type SyllabusTrackingStage } from './summary-tracker'
import { getApiClientErrorMessage, uploadSyllabusPdf, uploadSyllabusText } from '@/lib/api'

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024

function isPdfFile(file: File) {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
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
  const parsedWeeks = Number.parseInt(semesterWeeksValue, 10)
  const weeks = Number.isFinite(parsedWeeks) ? Math.max(8, Math.min(24, parsedWeeks)) : 16
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
  onSuccess: (result: SyllabusIntelligenceResult) => void
}

export default function SyllabusUploadModal({ onClose, onSuccess }: SyllabusUploadModalProps) {
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file')
  const [files, setFiles] = useState<File[]>([])
  const [text, setText] = useState('')
  const [title, setTitle] = useState('')
  const [semesterWeeks, setSemesterWeeks] = useState('16')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStage, setLoadingStage] = useState<'uploading' | SyllabusTrackingStage | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || [])
    const valid = selected.filter((file) => file.size <= MAX_FILE_SIZE_BYTES)
    setFiles(valid)
    setErrorMessage('')
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const dropped = Array.from(event.dataTransfer.files || [])
    const valid = dropped.filter((file) => file.size <= MAX_FILE_SIZE_BYTES)
    setFiles(valid)
    setErrorMessage('')
  }

  const resolveSelectedFile = () => {
    const supportedFile = files.find((file) => !isUnsupportedSyllabusFile(file))

    if (!supportedFile) {
      throw new Error('Only PDF and TXT files are supported for syllabus analysis.')
    }

    return supportedFile
  }

  const canSubmit =
    !isLoading &&
    ((inputMode === 'file' && files.length > 0) || (inputMode === 'text' && text.trim().length > 0))

  const handleAnalyze = async () => {
    if (!canSubmit) return

    setIsLoading(true)
    setLoadingStage('uploading')
    setErrorMessage('')
    try {
      const resolvedTitle = title.trim() || 'Untitled Syllabus'
      const { semesterStartDate, semesterEndDate } = deriveSemesterDates(semesterWeeks)

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
          const fileText = await selectedFile.text()

          if (!fileText.trim()) {
            throw new Error('The selected text file is empty.')
          }

          uploadResponse = await uploadSyllabusText({
            title: resolvedTitle,
            text: fileText,
            semesterStartDate,
            semesterEndDate,
          })
        } else {
          throw new Error('Only PDF and TXT files are supported for syllabus analysis.')
        }
      } else {
        uploadResponse = await uploadSyllabusText({
          title: resolvedTitle,
          text,
          semesterStartDate,
          semesterEndDate,
        })
      }

      const normalized = await waitForSyllabusSummary({
        syllabusId: uploadResponse.syllabus_id,
        websocket: uploadResponse.websocket,
        onStageChange: setLoadingStage,
      })

      persistSyllabusResult(normalized)
      onSuccess(normalized)
    } catch (error) {
      console.error('Error analyzing syllabus:', error)
      setErrorMessage(getApiClientErrorMessage(error, 'Failed to analyze syllabus.'))
    } finally {
      setIsLoading(false)
      setLoadingStage(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
      <div className="w-full max-w-3xl max-h-screen overflow-y-auto rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Syllabus Intelligence</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-border">
          <button
            onClick={() => setInputMode('file')}
            className={`flex-1 px-4 py-3 font-medium transition-colors ${
              inputMode === 'file'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Upload Syllabus
          </button>
          <button
            onClick={() => setInputMode('text')}
            className={`flex-1 px-4 py-3 font-medium transition-colors ${
              inputMode === 'text'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Paste Course Outline
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Course Title</label>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g., Data Structures and Algorithms"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Semester Length (weeks)</label>
              <input
                type="number"
                min={8}
                max={24}
                value={semesterWeeks}
                onChange={(event) => setSemesterWeeks(event.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {inputMode === 'file' ? (
            <>
              <p className="text-sm text-muted-foreground">
                Upload syllabus files, course outlines, assignment sheets, or instructor notes.
              </p>
              <div
                onDrop={handleDrop}
                onDragOver={(event) => event.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-8 text-center bg-secondary/30 cursor-pointer hover:border-primary/50 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                />
                <Upload className="w-12 h-12 text-primary mx-auto mb-3" />
                <p className="font-semibold text-foreground">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX, TXT up to 20MB</p>
              </div>

              {files.length > 0 && (
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {files.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="rounded-lg bg-secondary/40 p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <CheckCircle
                          className={`w-5 h-5 flex-shrink-0 ${
                            isUnsupportedSyllabusFile(file) ? 'text-amber-500' : 'text-green-500'
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          {isUnsupportedSyllabusFile(file) ? (
                            <p className="text-xs text-amber-600">
                              Unsupported for backend analysis. Use PDF or TXT.
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Paste your complete syllabus or weekly course outline for deeper AI planning.
              </p>
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Paste full syllabus, weekly schedule, grading breakdown, and assignment details..."
                className="w-full h-64 px-3 py-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
              <p className="text-xs text-muted-foreground">{text.length} characters</p>
            </>
          )}

          {isLoading ? (
            <div className="rounded-xl border border-border/70 bg-secondary/20 px-4 py-3">
              <p className="text-sm font-medium text-foreground">{loadingLabel || 'Processing syllabus'}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Keep this window open while the syllabus is processed and the final content is fetched.
              </p>
            </div>
          ) : null}

          {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
        </div>

        <div className="p-6 border-t border-border flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 border border-border rounded-lg hover:bg-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAnalyze}
            disabled={!canSubmit}
            className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
          >
            {isLoading ? (
              loadingLabel || 'Analyzing...'
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Generate Intelligence
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
