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
      setLoadingStage('completed')
      await new Promise(r => setTimeout(r, 400))
      onSuccess(normalized)
    } catch (error) {
      console.error('Error analyzing syllabus:', error)
      setErrorMessage(getApiClientErrorMessage(error, 'Failed to analyze syllabus.'))
    } finally {
      setIsLoading(false)
      setLoadingStage(null)
    }
  }

  const stageProgressPercent =
    loadingStage === 'uploading' ? 25 :
    loadingStage === 'connecting' ? 50 :
    loadingStage === 'processing' ? 75 :
    loadingStage === 'fetching' ? 90 :
    loadingStage === 'completed' ? 100 : 0

  return (
    <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
      <div className="w-full max-w-2xl max-h-screen overflow-y-auto rounded-2xl border border-slate-200/80 bg-white shadow-2xl">
        {isLoading && (
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#5B65E0] transition-all duration-300" style={{ width: `${stageProgressPercent}%` }} />
          </div>
        )}
        <div className="flex items-center justify-between p-6 border-b border-slate-200/80">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Analyze Syllabus</h2>
            <p className="text-xs text-slate-500 mt-1">Upload a PDF or paste a course outline to get started</p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-slate-200/80">
          <button
            onClick={() => setInputMode('file')}
            className={`flex-1 px-4 py-3 font-semibold transition-colors text-sm ${
              inputMode === 'file'
                ? 'text-[#5B65E0] border-b-2 border-[#5B65E0]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Upload File
          </button>
          <button
            onClick={() => setInputMode('text')}
            className={`flex-1 px-4 py-3 font-semibold transition-colors text-sm ${
              inputMode === 'text'
                ? 'text-[#5B65E0] border-b-2 border-[#5B65E0]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Paste Text
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Course Title</label>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g., Data Structures and Algorithms"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B65E0]/50"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Semester Length (weeks)</label>
              <input
                type="number"
                min={8}
                max={24}
                value={semesterWeeks}
                onChange={(event) => setSemesterWeeks(event.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#5B65E0]/50"
              />
            </div>
          </div>

          {inputMode === 'file' ? (
            <>
              <p className="text-sm text-slate-600">
                Upload syllabus files, course outlines, assignment sheets, or instructor notes.
              </p>
              <div
                onDrop={handleDrop}
                onDragOver={(event) => event.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50 cursor-pointer hover:border-[#5B65E0]/50 hover:bg-slate-100 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  accept=".pdf,.txt,.md,.markdown"
                  className="hidden"
                />
                <Upload className="w-12 h-12 text-[#5B65E0] mx-auto mb-3" />
                <p className="font-semibold text-slate-900">Click to upload or drag and drop</p>
                <p className="text-xs text-slate-500 mt-1">PDF or plain text (.txt, .md) up to 20MB</p>
              </div>

              {files.length > 0 && (
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {files.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="rounded-lg bg-slate-50 p-3 flex items-center justify-between border border-slate-200"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <CheckCircle
                          className={`w-5 h-5 flex-shrink-0 ${
                            isUnsupportedSyllabusFile(file) ? 'text-amber-500' : 'text-green-600'
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                          <p className="text-xs text-slate-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          {isUnsupportedSyllabusFile(file) ? (
                            <p className="text-xs text-amber-600">
                              Unsupported. Use PDF or TXT.
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
              <p className="text-sm text-slate-600">
                Paste your complete syllabus or weekly course outline for deeper AI planning.
              </p>
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Paste full syllabus, weekly schedule, grading breakdown, and assignment details..."
                className="w-full h-64 px-3 py-3 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B65E0]/50 resize-none"
              />
              <p className="text-xs text-slate-500">{text.length} characters</p>
            </>
          )}

          {isLoading ? (
            <div className="rounded-lg border border-slate-200 bg-blue-50 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">{loadingLabel || 'Processing syllabus'}</p>
              <p className="mt-1 text-xs text-slate-600">
                Keep this window open while processing.
              </p>
            </div>
          ) : null}

          {errorMessage ? (
            <div className="rounded-lg border border-red-200/80 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          ) : null}
        </div>

        <div className="p-6 border-t border-slate-200/80 flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleAnalyze}
            disabled={!canSubmit}
            className="flex-1 px-4 py-2.5 rounded-lg bg-[#5B65E0] text-white hover:bg-[#4950c9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-semibold"
          >
            {isLoading ? (
              loadingLabel || 'Analyzing...'
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Analyze
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
