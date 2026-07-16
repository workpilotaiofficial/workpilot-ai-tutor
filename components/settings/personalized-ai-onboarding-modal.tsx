'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, FileUp, LoaderCircle, Sparkles, Trash2, UploadCloud, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { getApiClientErrorMessage } from '@/lib/api'

export type PersonalizationOnboardingDraft = {
  origin: string
  interests: string
  hobby: string
  sports: string
  experience: string
  careerGoal: string
  connections: string
}

type WritingSample = {
  id: string
  name: string
  typeLabel: string
  content: string
}

type PersonalizationOnboardingModalProps = {
  onClose: () => void
}

const steps = [
  { id: 'about', label: 'About you', description: 'Tell the AI who you are.' },
  { id: 'writing', label: 'Past writing', description: 'Upload your previous writing samples.' },
  { id: 'style', label: 'Response style', description: 'Add final guidance for tone and structure.' },
] as const

const createEmptyDraft = (): PersonalizationOnboardingDraft => ({
  origin: '',
  interests: '',
  hobby: '',
  sports: '',
  experience: '',
  careerGoal: '',
  connections: '',
})

const fieldDefinitions = [
  { key: 'origin', label: 'Where are you from?', placeholder: 'e.g. Dhaka, Bangladesh' },
  { key: 'interests', label: 'What are your interests?', placeholder: 'e.g. AI, writing, product design, startups' },
  { key: 'hobby', label: 'What are your hobbies?', placeholder: 'e.g. Reading, journaling, football, photography' },
  { key: 'sports', label: 'Do you play or follow sports?', placeholder: 'e.g. I enjoy football and cricket on weekends' },
  { key: 'experience', label: 'What experience should the AI know about?', placeholder: 'e.g. I have worked on content writing, tutoring, and student projects' },
  { key: 'careerGoal', label: 'What is your career goal?', placeholder: 'e.g. I want to become a product manager and grow into leadership' },
  { key: 'connections', label: 'Any important connections or context?', placeholder: 'e.g. I love collaborating with founders, tutors, and researchers' },
] as const

const inferWritingTypeLabel = (fileName: string) => {
  const normalized = fileName.toLowerCase()

  if (/essay|assignment|report/.test(normalized)) return 'Assignment / Essay'
  if (/email/.test(normalized)) return 'Email'
  if (/research|paper/.test(normalized)) return 'Research Paper'
  if (/journal|blog|personal|story/.test(normalized)) return 'Personal Writing'
  return 'Writing Sample'
}

const buildInstructionText = (
  draft: PersonalizationOnboardingDraft,
  writingSamples: WritingSample[],
  optionalInstructions: string,
) => {
  const sections: string[] = []

  sections.push('AI Identity Profile:')
  fieldDefinitions.forEach((field) => {
    const value = draft[field.key].trim()
    if (value) {
      sections.push(`${field.label} ${value}`)
    }
  })

  if (optionalInstructions.trim()) {
    sections.push('Additional response style guidance:')
    sections.push(optionalInstructions.trim())
  }

  if (writingSamples.length > 0) {
    sections.push('Past writing samples for style cloning:')
    writingSamples.forEach((sample) => {
      const content = sample.content.trim()
      if (!content) {
        sections.push(`Sample: ${sample.name} (${sample.typeLabel})`)
        return
      }

      sections.push(`Sample: ${sample.name} (${sample.typeLabel})\n${content}`)
    })
  }

  return sections.join('\n\n')
}

export default function PersonalizedAiOnboardingModal({ onClose }: PersonalizationOnboardingModalProps) {
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(0)
  const [draft, setDraft] = useState<PersonalizationOnboardingDraft>(createEmptyDraft())
  const [writingSamples, setWritingSamples] = useState<WritingSample[]>([])
  const [optionalInstructions, setOptionalInstructions] = useState('')
  const [isReadingFiles, setIsReadingFiles] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const canContinue = useMemo(() => {
    if (currentStep === 0) {
      return fieldDefinitions.some((field) => draft[field.key].trim().length > 0)
    }

    if (currentStep === 1) {
      return true
    }

    return optionalInstructions.trim().length > 0 || writingSamples.length > 0
  }, [currentStep, draft, optionalInstructions, writingSamples])

  const updateField = (key: keyof PersonalizationOnboardingDraft, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) {
      return
    }

    setIsReadingFiles(true)

    try {
      const nextSamples = await Promise.all(
        files.map(async (file) => {
          let content = ''

          try {
            content = await file.text()
          } catch {
            content = ''
          }

          return {
            id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
            name: file.name,
            typeLabel: inferWritingTypeLabel(file.name),
            content,
          }
        }),
      )

      setWritingSamples((current) => [...nextSamples, ...current])
    } catch {
      toast({
        title: 'Unable to read writing samples',
        description: 'Please try text-based files like .txt, .md, or .rtf.',
        variant: 'destructive',
      })
    } finally {
      setIsReadingFiles(false)
      event.target.value = ''
    }
  }

  const removeWritingSample = (id: string) => {
    setWritingSamples((current) => current.filter((sample) => sample.id !== id))
  }

  const handleFinish = async () => {
    const combinedInstructions = buildInstructionText(draft, writingSamples, optionalInstructions)
    if (!combinedInstructions.trim()) {
      return
    }

    setIsSaving(true)

    try {
      const { updatePersonalization } = await import('@/lib/api')
      await updatePersonalization({ instructions: combinedInstructions })
      onClose()
    } catch (error) {
      toast({
        title: 'Unable to save profile',
        description: getApiClientErrorMessage(error, 'Your Personalized AI profile could not be saved.'),
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const isLastStep = currentStep === steps.length - 1

  return (
    <div className="fixed inset-0 z-60 bg-black/55 p-4 md:p-8" onClick={onClose} role="presentation">
      <div
        className="mx-auto flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Personalized AI onboarding"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Set up your Personalized AI</h2>
            <p className="mt-1 text-sm text-muted-foreground">Tell us how the AI should understand you and write like you.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-secondary" aria-label="Close onboarding modal">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-border px-5 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              {steps.map((step, index) => {
                const isActive = index === currentStep
                const isComplete = index < currentStep

                return (
                  <div key={step.id} className="flex items-center gap-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold ${
                        isActive
                          ? 'border-primary bg-primary text-primary-foreground'
                          : isComplete
                            ? 'border-primary/60 bg-primary/10 text-primary'
                            : 'border-border bg-secondary text-muted-foreground'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="hidden md:block">
                      <p className="text-xs font-medium text-foreground">{step.label}</p>
                      <p className="text-[11px] text-muted-foreground">{step.description}</p>
                    </div>
                    {index < steps.length - 1 && <div className="hidden h-px w-6 bg-border md:block" />}
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground">Step {currentStep + 1} of {steps.length}</p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-5 py-5">
          {currentStep === 0 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">About your profile</h3>
                <p className="mt-1 text-sm text-muted-foreground">These answers help the AI understand the person behind the prompt.</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {fieldDefinitions.map((field) => (
                  <label key={field.key} className="space-y-2 rounded-xl border border-border bg-secondary/20 p-4">
                    <span className="text-sm font-medium text-foreground">{field.label}</span>
                    <textarea
                      value={draft[field.key]}
                      onChange={(event) => updateField(field.key, event.target.value)}
                      rows={3}
                      placeholder={field.placeholder}
                      className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Upload your past writing</h3>
                <p className="mt-1 text-sm text-muted-foreground">Use your past assignment, essay, email, research, or personal writing to help the AI mimic your style.</p>
              </div>

              <div className="rounded-2xl border border-dashed border-border bg-secondary/20 p-4">
                <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-border bg-background px-4 py-6 text-center">
                  <UploadCloud className="h-8 w-8 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Upload writing samples</span>
                  <span className="text-xs text-muted-foreground">TXT, MD, RTF, PDF, DOC, or DOCX</span>
                  <input type="file" multiple className="hidden" accept=".txt,.md,.rtf,.pdf,.doc,.docx" onChange={handleFileUpload} />
                </label>
                {isReadingFiles && (
                  <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Reading selected writing samples...
                  </p>
                )}
              </div>

              {writingSamples.length > 0 && (
                <div className="space-y-2">
                  {writingSamples.map((sample) => (
                    <div key={sample.id} className="flex items-start justify-between gap-3 rounded-xl border border-border bg-secondary/20 px-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{sample.name}</p>
                        <p className="text-xs text-muted-foreground">{sample.typeLabel}</p>
                      </div>
                      <button type="button" onClick={() => removeWritingSample(sample.id)} className="rounded-md p-1 text-muted-foreground hover:bg-background hover:text-foreground" aria-label={`Remove ${sample.name}`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Add final response style guidance</h3>
                <p className="mt-1 text-sm text-muted-foreground">This last field helps the AI shape tone, pacing, and formatting in a way that feels natural for you.</p>
              </div>

              <div className="rounded-2xl border border-border bg-secondary/20 p-4">
                <label htmlFor="enhanced-style-guidance" className="text-sm font-medium text-foreground">Optional guidance</label>
                <textarea
                  id="enhanced-style-guidance"
                  value={optionalInstructions}
                  onChange={(event) => setOptionalInstructions(event.target.value)}
                  rows={7}
                  placeholder="e.g. Explain step by step, use a friendly tone, and keep answers concise."
                  className="mt-2 w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="rounded-2xl border border-border bg-secondary/20 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Preview summary
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  The AI will use your profile answers, uploaded writing samples, and any style guidance you add here to better match your voice.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={() => setCurrentStep((current) => Math.max(0, current - 1))}
            disabled={currentStep === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex items-center gap-2">
            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((current) => Math.min(steps.length - 1, current + 1))}
                disabled={!canContinue}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleFinish()}
                disabled={!canContinue || isSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isSaving ? 'Saving...' : 'Save profile'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
