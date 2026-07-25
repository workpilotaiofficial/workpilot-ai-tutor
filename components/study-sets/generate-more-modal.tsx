'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, LoaderCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { getApiClientErrorMessage } from '@/lib/api/client'
import { studySetFormatOptions } from './format-catalog'
import type { StudySetUiSectionType } from './generation-mapping'

type GenerateMoreModalProps = {
  open: boolean
  studySetTitle: string
  generatedTypes: StudySetUiSectionType[]
  activeTypes: StudySetUiSectionType[]
  unavailableReason?: string | null
  onOpenChange: (open: boolean) => void
  onGenerate: (types: StudySetUiSectionType[]) => Promise<void>
}

export function GenerateMoreModal({
  open,
  studySetTitle,
  generatedTypes,
  activeTypes,
  unavailableReason,
  onOpenChange,
  onGenerate,
}: GenerateMoreModalProps) {
  const [selectedTypes, setSelectedTypes] = useState<StudySetUiSectionType[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!open) {
      setSelectedTypes([])
      setErrorMessage('')
      setIsSubmitting(false)
    }
  }, [open])

  const generatedSet = useMemo(() => new Set(generatedTypes), [generatedTypes])
  const activeSet = useMemo(() => new Set(activeTypes), [activeTypes])
  const availableOptions = studySetFormatOptions.filter(
    (option) => !generatedSet.has(option.id) && !activeSet.has(option.id),
  )

  const toggleType = (type: StudySetUiSectionType) => {
    setSelectedTypes((current) =>
      current.includes(type)
        ? current.filter((candidate) => candidate !== type)
        : [...current, type],
    )
    setErrorMessage('')
  }

  const handleGenerate = async () => {
    if (!selectedTypes.length || unavailableReason) return

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      await onGenerate(selectedTypes)
      onOpenChange(false)
    } catch (error) {
      setErrorMessage(
        getApiClientErrorMessage(error, 'Failed to start generation. Please try again.'),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isSubmitting && onOpenChange(nextOpen)}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate more study material</DialogTitle>
          <DialogDescription>
            Add new formats to “{studySetTitle}”. Your existing content and progress will stay unchanged.
          </DialogDescription>
        </DialogHeader>

        {unavailableReason ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {unavailableReason}
          </div>
        ) : (
          <div className="space-y-5">
            {availableOptions.length > 0 ? (
              <>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-foreground">Choose new formats</p>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedTypes(
                        selectedTypes.length === availableOptions.length
                          ? []
                          : availableOptions.map((option) => option.id),
                      )
                    }
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    {selectedTypes.length === availableOptions.length ? 'Clear all' : 'Select all'}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {studySetFormatOptions.map((option) => {
                    const Icon = option.icon
                    const isGenerated = generatedSet.has(option.id)
                    const isActive = activeSet.has(option.id)
                    const isSelected = selectedTypes.includes(option.id)
                    const isDisabled = isGenerated || isActive

                    return (
                      <button
                        key={option.id}
                        type="button"
                        disabled={isDisabled || isSubmitting}
                        onClick={() => toggleType(option.id)}
                        className={`relative rounded-2xl border p-4 text-left transition-colors ${
                          isDisabled
                            ? 'cursor-not-allowed border-border bg-secondary/30 opacity-65'
                            : isSelected
                              ? 'border-primary bg-primary/5'
                              : 'border-border bg-card hover:border-primary/40'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`rounded-xl p-2.5 ${
                              isSelected
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary text-foreground'
                            }`}
                          >
                            {isActive ? (
                              <LoaderCircle className="h-5 w-5 animate-spin" />
                            ) : isSelected ? (
                              <Check className="h-5 w-5" />
                            ) : (
                              <Icon className="h-5 w-5" />
                            )}
                          </span>
                          <span>
                            <span className="block text-sm font-semibold text-foreground">
                              {option.label}
                            </span>
                            <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                              {option.description}
                            </span>
                            {isGenerated ? (
                              <span className="mt-2 block text-xs font-semibold text-emerald-700">
                                Already generated
                              </span>
                            ) : isActive ? (
                              <span className="mt-2 block text-xs font-semibold text-primary">
                                Generating…
                              </span>
                            ) : null}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                All supported study formats have already been generated.
              </div>
            )}

            {errorMessage ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {errorMessage}
              </div>
            ) : null}
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary disabled:opacity-50"
          >
            Close
          </button>
          {!unavailableReason && availableOptions.length > 0 ? (
            <button
              type="button"
              disabled={!selectedTypes.length || isSubmitting}
              onClick={() => void handleGenerate()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              {isSubmitting
                ? 'Starting generation…'
                : `Generate selected (${selectedTypes.length})`}
            </button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
