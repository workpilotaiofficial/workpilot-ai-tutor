'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, Youtube } from 'lucide-react'
import { getApiClientErrorMessage } from '@/lib/api/client'
import { saveStudySetUploadMeta, type StoredStudySetGenerationMeta } from '@/lib/api/study-sets.storage'
import {
  generateStudySet,
  type StudySetUploadResponse,
  uploadStudySetPdf,
  uploadStudySetText,
  uploadStudySetYoutube,
} from '@/lib/api/study-sets.service'
import { startStudySetGenerationTracking } from './generation-tracker'
import { type StudySetUiSectionType, uiToBackendGenerationType, uiSectionTypeLabels } from './generation-mapping'
import { studySetFormatOptions } from './format-catalog'
import { createUploadPlaceholderStudySet } from './upload-placeholder'
import { persistStudySet } from './utils'

type SourceType = 'pdf' | 'text' | 'youtube'
type OutputType = StudySetUiSectionType

const acceptedUploadTypes = '.pdf,application/pdf,image/*'

const outputOptions = studySetFormatOptions

const presets: Array<{ id: string; label: string; outputs: OutputType[] }> = [
  { id: 'quick', label: 'Quick Review', outputs: ['notes', 'flashcards'] },
  { id: 'exam', label: 'Exam Prep', outputs: ['notes', 'multipleChoice', 'writtenTests', 'fillInTheBlanks'] },
  { id: 'full', label: 'Full Set', outputs: outputOptions.map((option) => option.id) },
]

function isValidYoutubeVideoUrl(value: string) {
  try {
    const url = new URL(value.trim())
    const hostname = url.hostname.toLowerCase().replace(/^www\./, '')

    if (!['http:', 'https:'].includes(url.protocol)) return false
    if (hostname === 'youtu.be') return url.pathname.slice(1).length > 0
    if (hostname !== 'youtube.com' && !hostname.endsWith('.youtube.com')) return false

    if (url.pathname === '/watch') return Boolean(url.searchParams.get('v'))
    return /^\/(embed|live|shorts)\/[^/]+/.test(url.pathname)
  } catch {
    return false
  }
}

interface CreateStudySetModalProps {
  onClose: () => void
  initialSource?: SourceType
}

export default function CreateStudySetModal({ onClose, initialSource = 'pdf' }: CreateStudySetModalProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [sourceType, setSourceType] = useState<SourceType>(initialSource)
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [content, setContent] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [studySetName, setStudySetName] = useState('')
  const [selectedOutputs, setSelectedOutputs] = useState<OutputType[]>(['notes', 'flashcards'])
  const [isUploading, setIsUploading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [uploadedResponse, setUploadedResponse] = useState<StudySetUploadResponse | null>(null)

  const hasValidFile = Boolean(
    selectedFile &&
    (selectedFile.type === 'application/pdf' || selectedFile.type.startsWith('image/')) &&
    selectedFile.size <= 10 * 1024 * 1024,
  )
  const hasValidText = content.trim().length >= 50
  const hasValidYoutubeUrl = isValidYoutubeVideoUrl(youtubeUrl)
  const canContinueSource =
    sourceType === 'pdf'
      ? hasValidFile
      : sourceType === 'text'
        ? hasValidText
        : hasValidYoutubeUrl

  const resolvedTitle = () => {
    const byInput = studySetName.trim()
    if (byInput) return byInput
    if (sourceType === 'pdf') return selectedFile?.name.replace(/\.[^/.]+$/, '') || 'Untitled Study Set'
    if (sourceType === 'youtube') return uploadedResponse?.document.title || 'YouTube Study Set'
    const firstLine = content.split('\n').find((line) => line.trim().length > 0)?.trim() || ''
    return firstLine.slice(0, 60) || 'Untitled Study Set'
  }

  const handleFilePick = (file: File | null) => {
    if (!file) return
    if (
      (file.type !== 'application/pdf' && !file.type.startsWith('image/')) ||
      file.size > 10 * 1024 * 1024
    ) {
      setErrorMessage('Upload one PDF or image file only (max 10MB).')
      return
    }
    setSelectedFile(file)
    setErrorMessage('')
    setUploadedResponse(null)
  }

  const uploadSource = async () => {
    setIsUploading(true)
    setErrorMessage('')
    try {
      const title = studySetName.trim()
      const resolvedSourceType =
        sourceType === 'pdf' && selectedFile?.type.startsWith('image/')
          ? 'image'
          : sourceType
      const response =
        sourceType === 'pdf'
          ? await uploadStudySetPdf({ title: resolvedTitle(), file: selectedFile as File })
          : sourceType === 'text'
            ? await uploadStudySetText({ title: resolvedTitle(), text: content })
            : await uploadStudySetYoutube({
                youtubeUrl: youtubeUrl.trim(),
                title: title || null,
              })
      saveStudySetUploadMeta({
        documentId: response.document.id,
        embeddingJobId: response.embedding_job_id,
        title: response.document.title,
        filename: response.document.filename || (selectedFile?.name ?? null),
        sourceType: resolvedSourceType,
        status: response.document.status,
        createdAt: response.document.createdAt,
        updatedAt: response.document.updatedAt,
      })
      setUploadedResponse(response)
      setStep(2)
    } catch (error) {
      setErrorMessage(getApiClientErrorMessage(error, 'Failed to upload source.'))
    } finally {
      setIsUploading(false)
    }
  }

  const startGeneration = async () => {
    if (!uploadedResponse || !selectedOutputs.length) return
    setIsGenerating(true)
    setErrorMessage('')
    try {
      const resolvedSourceType =
        sourceType === 'pdf' && selectedFile?.type.startsWith('image/')
          ? 'image'
          : sourceType
      const response = await generateStudySet({
        documentId: uploadedResponse.document.id,
        types: selectedOutputs.map((output) => uiToBackendGenerationType[output]),
      })
      const startedAt = new Date().toISOString()
      const nextMeta: StoredStudySetGenerationMeta = {
        documentId: uploadedResponse.document.id,
        studySetId: response.study_set_id,
        batch: {
          id: response.batch.id,
          status: response.batch.status,
          totalJobs: response.batch.total_jobs,
          completedJobs: response.batch.completed_jobs,
          failedJobs: response.batch.failed_jobs,
          selectedTypes: response.batch.selected_types,
          estimatedCredits: response.batch.estimated_credits,
          createdAt: response.batch.created_at,
        },
        jobs: response.jobs.map((job) => ({
          jobId: job.job_id,
          type: job.type,
          status: job.status,
          estimatedCredits: job.estimated_credits,
        })),
        websocket: {
          url: response.websocket.url,
          token: response.websocket.token,
          expiresIn: response.websocket.expires_in,
        },
        connectionStatus: 'idle',
        startedAt,
        lastEventAt: startedAt,
        fetchedOutputs: {},
      }
      persistStudySet(
        createUploadPlaceholderStudySet({
          documentId: uploadedResponse.document.id,
          title: uploadedResponse.document.title || resolvedTitle(),
          selections: selectedOutputs,
          sourceType: resolvedSourceType,
          sourceText: sourceType === 'text' ? content : undefined,
          createdAt: uploadedResponse.document.createdAt,
          updatedAt: uploadedResponse.document.updatedAt,
        }),
      )
      startStudySetGenerationTracking(nextMeta)
      onClose()
      router.push(`/dashboard/study-sets/${response.study_set_id}?autoOpenFirst=1`)
    } catch (error) {
      setErrorMessage(getApiClientErrorMessage(error, 'Failed to start generation.'))
    } finally {
      setIsGenerating(false)
    }
  }


  const applyPreset = (outputs: OutputType[]) => setSelectedOutputs(outputs)
  const toggleOutput = (id: OutputType) =>
    setSelectedOutputs((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))

  const primaryAction = async () => {
    if (step === 1) return uploadSource()
    if (step === 2) return startGeneration()
    return onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-screen w-full max-w-3xl overflow-y-auto rounded-2xl bg-card shadow-2xl">
        <div className="flex items-start justify-between border-b border-border p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Step {step} of 2</p>
            <h2 className="text-2xl font-bold text-foreground">Create Study Set</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-secondary">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {step === 1 ? (
            <div className="space-y-5">
              <div className="inline-flex rounded-xl border border-border bg-secondary/30 p-1">
                <button
                  type="button"
                  onClick={() => setSourceType('pdf')}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold ${sourceType === 'pdf' ? 'bg-card' : 'text-muted-foreground'}`}
                >
                  Upload PDF / Image
                </button>
                <button
                  type="button"
                  onClick={() => setSourceType('text')}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold ${sourceType === 'text' ? 'bg-card' : 'text-muted-foreground'}`}
                >
                  Paste Text
                </button>
                <button
                  type="button"
                  onClick={() => setSourceType('youtube')}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold ${sourceType === 'youtube' ? 'bg-card' : 'text-muted-foreground'}`}
                >
                  YouTube
                </button>
              </div>

              {sourceType === 'pdf' ? (
                <div
                  onDrop={(event) => {
                    event.preventDefault()
                    handleFilePick(event.dataTransfer.files?.[0] ?? null)
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer rounded-2xl border-2 border-dashed border-border bg-secondary/20 p-8 text-center hover:border-primary/50"
                >
                  <input ref={fileInputRef} type="file" accept={acceptedUploadTypes} className="hidden" onChange={(event) => handleFilePick(event.target.files?.[0] ?? null)} />
                  <Upload className="mx-auto mb-2 h-10 w-10 text-primary" />
                  <p className="text-sm font-semibold">Upload one PDF or image (max 10MB)</p>
                  {selectedFile ? <p className="mt-2 text-xs text-muted-foreground">{selectedFile.name}</p> : null}
                </div>
              ) : sourceType === 'text' ? (
                <div>
                  <textarea
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    className="h-64 w-full rounded-xl border border-border bg-background p-3 text-sm"
                    placeholder="Paste your notes or study material..."
                  />
                  <p className="mt-2 text-xs text-muted-foreground">Minimum 50 characters</p>
                </div>
              ) : (
                <div className="space-y-3 rounded-2xl border border-border bg-secondary/20 p-5">
                  <div className="flex items-center gap-3">
                    <span className="rounded-xl bg-red-500/10 p-2.5 text-red-600 dark:text-red-400">
                      <Youtube className="h-6 w-6" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Import a YouTube video</p>
                      <p className="text-xs text-muted-foreground">Paste the full link to turn the video into study materials.</p>
                    </div>
                  </div>
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(event) => {
                      setYoutubeUrl(event.target.value)
                      setErrorMessage('')
                      setUploadedResponse(null)
                    }}
                    placeholder="https://www.youtube.com/watch?v=..."
                    aria-label="YouTube video URL"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                  />
                  <p className={`text-xs ${youtubeUrl.trim() && !hasValidYoutubeUrl ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {youtubeUrl.trim() && !hasValidYoutubeUrl
                      ? 'Enter a valid YouTube video link.'
                      : 'Supports youtube.com and youtu.be video links.'}
                  </p>
                </div>
              )}

              <input
                type="text"
                value={studySetName}
                onChange={(event) => setStudySetName(event.target.value)}
                placeholder="Study set title (optional)"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Choose a preset</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {presets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset.outputs)}
                      className="rounded-xl border border-border bg-secondary/20 px-3 py-2 text-left text-sm font-semibold hover:border-primary/40"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {outputOptions.map((option) => {
                  const Icon = option.icon
                  const active = selectedOutputs.includes(option.id)
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleOutput(option.id)}
                      className={`rounded-2xl border p-4 text-left ${active ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/40'}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`rounded-lg p-2 ${active ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold">{uiSectionTypeLabels[option.id]}</p>
                          <p className="text-xs text-muted-foreground">{option.description}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

        </div>

        {errorMessage ? (
          <div className="px-6 pb-1">
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{errorMessage}</div>
          </div>
        ) : null}

        <div className="flex gap-3 border-t border-border p-6">
          <button
            type="button"
            onClick={() => {
              if (step === 2) setStep(1)
              else onClose()
            }}
            className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold"
          >
            {step === 2 ? 'Back' : 'Close'}
          </button>
          <button
            type="button"
            onClick={() => void primaryAction()}
            disabled={step === 1 ? !canContinueSource || isUploading : !selectedOutputs.length || isGenerating}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {step === 1 ? (isUploading ? 'Uploading...' : 'Next') : (isGenerating ? 'Generating...' : 'Generate')}
          </button>
        </div>
      </div>
    </div>
  )
}
