'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  X,
  FileText,
  ListChecks,
  Layers,
  Headphones,
  GraduationCap,
  PenSquare,
  Edit3,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { getApiClientErrorMessage } from '@/lib/api/client'
import { saveStudySetGenerationMeta, saveStudySetUploadMeta, type StoredStudySetGenerationMeta } from '@/lib/api/study-sets.storage'
import { generateStudySet, type StudySetUploadResponse, uploadStudySetText } from '@/lib/api/study-sets.service'
import { ensureStudySetGenerationTracking, subscribeToStudySetGeneration } from './generation-tracker'
import { GenerationStatusStep } from './generation-status-step'
import { type StudySetUiSectionType, uiToBackendGenerationType } from './generation-mapping'
import { createUploadPlaceholderStudySet } from './upload-placeholder'
import { persistStudySet } from './utils'

type OutputType =
  | 'notes'
  | 'multipleChoice'
  | 'flashcards'
  | 'podcast'
  | 'tutorLesson'
  | 'writtenTests'
  | 'fillInTheBlanks'

const outputOptions: Array<{
  id: OutputType
  label: string
  description: string
  icon: LucideIcon
}> = [
  {
    id: 'notes',
    label: 'Notes',
    description: 'Organized study notes that capture the main ideas.',
    icon: FileText,
  },
  {
    id: 'multipleChoice',
    label: 'Multiple Choice',
    description: 'Auto-graded MCQs with explanations.',
    icon: ListChecks,
  },
  {
    id: 'flashcards',
    label: 'Flashcards',
    description: 'Front/back cards for rapid recall.',
    icon: Layers,
  },
  {
    id: 'podcast',
    label: 'Podcast',
    description: 'Audio-style talking points for listening practice.',
    icon: Headphones,
  },
  {
    id: 'tutorLesson',
    label: 'Tutor Lesson',
    description: 'Dialogue prompts for AI tutor mode.',
    icon: GraduationCap,
  },
  {
    id: 'writtenTests',
    label: 'Written Tests',
    description: 'Open-ended questions to mimic exams.',
    icon: PenSquare,
  },
  {
    id: 'fillInTheBlanks',
    label: 'Fill in the Blanks',
    description: 'Cloze statements that reinforce context clues.',
    icon: Edit3,
  },
]

const totalSteps = 3

interface PasteModalProps {
  onClose: () => void
}

export default function PasteModal({ onClose }: PasteModalProps) {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [selectedOutputs, setSelectedOutputs] = useState<OutputType[]>([])
  const [studySetName, setStudySetName] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [uploadedResponse, setUploadedResponse] = useState<StudySetUploadResponse | null>(null)
  const [generationMeta, setGenerationMeta] = useState<StoredStudySetGenerationMeta | null>(null)
  const [step, setStep] = useState<1 | 2 | 3>(1)

  const progressPercent = (step / totalSteps) * 100
  const hasContent = content.trim().length > 0
  const hasSelections = selectedOutputs.length > 0
  const selectedLabels = outputOptions
    .filter((option) => selectedOutputs.includes(option.id))
    .map((option) => option.label)

  const toggleOutput = (id: OutputType) => {
    setSelectedOutputs((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const uploadAndContinue = async () => {
    if (!hasContent) return

    setIsUploading(true)
    setErrorMessage('')
    try {
      const resolvedTitle = studySetName.trim() || 'Untitled Study Set'
      const response = await uploadStudySetText({
        title: resolvedTitle,
        text: content,
      })

      saveStudySetUploadMeta({
        documentId: response.document.id,
        embeddingJobId: response.embedding_job_id,
        title: response.document.title,
        filename: response.document.filename || null,
        sourceType: 'text',
        status: response.document.status,
        createdAt: response.document.createdAt,
        updatedAt: response.document.updatedAt,
      })
      setUploadedResponse(response)
      setStep(2)
    } catch (error) {
      console.error('Error creating study set:', error)
      setErrorMessage(getApiClientErrorMessage(error, 'Failed to upload study set. Please try again.'))
    } finally {
      setIsUploading(false)
    }
  }

  const handleGenerate = async () => {
    if (!hasSelections) return

    if (!uploadedResponse) {
      setErrorMessage('Upload the content first before continuing.')
      return
    }

    setIsGenerating(true)
    setErrorMessage('')

    try {
      const response = await generateStudySet({
        documentId: uploadedResponse.document.id,
        types: selectedOutputs.map((output) => uiToBackendGenerationType[output]),
      })

      const trackingStartedAt = new Date().toISOString()
      const nextGenerationMeta = {
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
        connectionStatus: 'idle' as const,
        startedAt: trackingStartedAt,
        lastEventAt: trackingStartedAt,
        fetchedOutputs: {},
      }

      saveStudySetGenerationMeta(nextGenerationMeta)

      const normalizedSet = createUploadPlaceholderStudySet({
        documentId: uploadedResponse.document.id,
        title: uploadedResponse.document.title || studySetName.trim() || 'Untitled Study Set',
        selections: selectedOutputs,
        sourceType: 'text',
        sourceText: content,
        createdAt: uploadedResponse.document.createdAt,
        updatedAt: uploadedResponse.document.updatedAt,
      })

      persistStudySet(normalizedSet)
      setGenerationMeta(nextGenerationMeta)
      setStep(3)
      ensureStudySetGenerationTracking(uploadedResponse.document.id)
    } catch (error) {
      console.error('Error generating study set:', error)
      setErrorMessage(getApiClientErrorMessage(error, 'Failed to generate study set. Please try again.'))
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePrimaryAction = () => {
    if (step === 1) {
      void uploadAndContinue()
      return
    }

    if (step === 3) {
      onClose()
      return
    }

    void handleGenerate()
  }

  const handleSecondaryAction = () => {
    if (step === 2) {
      setStep(1)
      return
    }
    onClose()
  }

  useEffect(() => {
    if (step !== 3 || !uploadedResponse?.document.id) {
      return
    }

    const unsubscribe = subscribeToStudySetGeneration(uploadedResponse.document.id, (nextMeta) => {
      setGenerationMeta(nextMeta)
    })

    return unsubscribe
  }, [step, uploadedResponse?.document.id])

  const handleOpenGeneratedSection = (sectionType: StudySetUiSectionType) => {
    const documentId = generationMeta?.documentId ?? uploadedResponse?.document.id
    if (!documentId) {
      return
    }

    onClose()
    router.push(`/dashboard/study-sets/${documentId}?mode=${sectionType}`)
  }

  const renderContentStep = () => (
    <div className="space-y-6">
      

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Your Content
        </label>
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value)
            setUploadedResponse(null)
            setErrorMessage('')
          }}
          placeholder="Paste your essay, notes, URL, or any content here..."
          className="w-full h-64 px-3 py-3 border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground mt-1">{content.length} characters</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Study Set Name (optional)
        </label>
        <input
          type="text"
          value={studySetName}
          onChange={(e) => {
            setStudySetName(e.target.value)
            setUploadedResponse(null)
            setErrorMessage('')
          }}
          placeholder="e.g., Chemistry Notes"
          className="w-full px-3 py-2 border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
    </div>
  )

  const renderSelectionStep = () => (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-background/60 p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Pasted content</p>
          <p className="text-xs text-muted-foreground">
            {content.length} character{content.length > 1 ? 's' : ''} ready
          </p>
        </div>
        <button
          onClick={() => setStep(1)}
          className="text-xs text-primary font-medium hover:underline"
        >
          Edit content
        </button>
      </div>

      <div>
        <p className="text-lg font-semibold text-foreground mb-2">What would you like to include?</p>
       
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {outputOptions.map((option) => {
          const Icon = option.icon
          const isSelected = selectedOutputs.includes(option.id)
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => toggleOutput(option.id)}
              className={`flex items-start gap-4 rounded-2xl border p-4 text-left transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:border-primary/40 hover:bg-secondary/30'
              }`}
            >
              <span
                className={`p-3 rounded-xl ${
                  isSelected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground/80'
                }`}
              >
                <Icon className="w-5 h-5" />
              </span>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">{option.label}</p>
                <p className="text-xs text-muted-foreground">{option.description}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* <div className="rounded-2xl border border-border bg-secondary/30 p-4">
        <p className="text-sm font-semibold text-foreground">Selected ({selectedOutputs.length})</p>
        {selectedOutputs.length > 0 ? (
          <div className="flex flex-wrap gap-2 mt-3">
            {selectedLabels.map((label) => (
              <span
                key={label}
                className="px-3 py-1 rounded-full bg-background border border-border text-xs text-foreground"
              >
                {label}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mt-2">Pick at least one method to continue.</p>
        )}
        <p className="text-xs text-muted-foreground mt-3">
          You can adjust or regenerate any section later from the Study Set dashboard.
        </p>
      </div> */}
    </div>
  )

  const renderGenerationStep = () => (
    <GenerationStatusStep meta={generationMeta} onOpenSection={handleOpenGeneratedSection} />
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="flex items-start justify-between p-6 border-b border-border gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
              Step {step} of {totalSteps}
            </p>
            <h2 className="text-2xl font-bold text-foreground">
              {step === 1
                ? 'Paste your content'
                : step === 2
                  ? 'Choose your study experiences'
                  : 'Generating your study set'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {step === 1
                ? 'Add your text or notes first.'
                : step === 2
                  ? 'Select formats like flashcards, notes, MCQs, and more before generating.'
                  : 'Realtime status of each requested job is shown below.'}
            </p>
            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {step === 1 ? renderContentStep() : step === 2 ? renderSelectionStep() : renderGenerationStep()}
        </div>

        {errorMessage ? (
          <div className="px-6 pb-1">
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          </div>
        ) : null}

        <div className="flex gap-3 p-6 border-t border-border">
          <button
            onClick={handleSecondaryAction}
            className="flex-1 px-4 py-2.5 border border-border rounded-lg text-foreground hover:bg-secondary transition-colors font-medium"
          >
            {step === 2 ? 'Back' : step === 3 ? 'Close' : 'Cancel'}
          </button>
          <button
            onClick={handlePrimaryAction}
            disabled={
              step === 1
                ? !hasContent || isUploading
                : step === 2
                  ? !hasSelections || isGenerating
                  : !(generationMeta?.batch.status === 'completed')
            }
            className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity font-medium"
          >
            {step === 1
              ? isUploading
                ? 'Uploading...'
                : 'Next'
              : step === 2
                ? isGenerating
                  ? 'Generating...'
                  : 'Generate'
                : generationMeta?.batch.status === 'completed'
                  ? 'Done'
                  : 'Tracking...'}
          </button>
        </div>
      </div>
    </div>
  )
}
