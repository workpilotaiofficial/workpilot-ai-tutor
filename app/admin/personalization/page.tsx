'use client'

import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Archive, LoaderCircle, Pencil, Plus, RefreshCw, RotateCcw, Sparkles } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import {
  createAdminPersonalizationQuestion,
  deleteAdminPersonalizationQuestion,
  fetchAdminPersonalizationQuestions,
  getApiClientErrorMessage,
  updateAdminPersonalizationQuestion,
  type AdminPersonalizationQuestion,
  type CreateAdminPersonalizationQuestionPayload,
} from '@/lib/api'

type QuestionFormValues = {
  question: string
  description: string
  displayOrder: string
  isRequired: boolean
  isActive: boolean
}

function createDefaultValues(displayOrder = 0): QuestionFormValues {
  return {
    question: '',
    description: '',
    displayOrder: String(displayOrder),
    isRequired: true,
    isActive: true,
  }
}

function valuesFromQuestion(question: AdminPersonalizationQuestion): QuestionFormValues {
  return {
    question: question.question,
    description: question.description ?? '',
    displayOrder: String(question.displayOrder),
    isRequired: question.isRequired,
    isActive: question.isActive,
  }
}

function buildPayload(values: QuestionFormValues): CreateAdminPersonalizationQuestionPayload {
  const displayOrder = Number(values.displayOrder)

  if (!values.question.trim()) {
    throw new Error('Question is required.')
  }

  if (!Number.isInteger(displayOrder) || displayOrder < 0) {
    throw new Error('Display order must be a non-negative whole number.')
  }

  return {
    question: values.question.trim(),
    description: values.description.trim() || null,
    displayOrder,
    isRequired: values.isRequired,
    isActive: values.isActive,
  }
}

function QuestionForm({
  values,
  onChange,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel,
}: {
  values: QuestionFormValues
  onChange: (values: QuestionFormValues) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
  isSubmitting: boolean
  submitLabel: string
}) {
  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="personalization-question">Question</Label>
        <Textarea
          id="personalization-question"
          value={values.question}
          onChange={(event) => onChange({ ...values, question: event.target.value })}
          rows={3}
          maxLength={500}
          placeholder="What should the AI know about the student's learning preferences?"
          disabled={isSubmitting}
          required
        />
        <p className="text-right text-xs text-muted-foreground">{values.question.length}/500</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="personalization-description">Helper text</Label>
        <Textarea
          id="personalization-description"
          value={values.description}
          onChange={(event) => onChange({ ...values, description: event.target.value })}
          rows={3}
          maxLength={1000}
          placeholder="Optional guidance shown below the question."
          disabled={isSubmitting}
        />
        <p className="text-right text-xs text-muted-foreground">{values.description.length}/1000</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="personalization-display-order">Display order</Label>
        <Input
          id="personalization-display-order"
          type="number"
          min={0}
          step={1}
          value={values.displayOrder}
          onChange={(event) => onChange({ ...values, displayOrder: event.target.value })}
          disabled={isSubmitting}
          required
        />
        <p className="text-xs text-muted-foreground">Lower numbers appear first.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-center justify-between rounded-2xl border border-border px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">Required</p>
            <p className="text-xs text-muted-foreground">Students must answer before finishing onboarding.</p>
          </div>
          <Switch
            checked={values.isRequired}
            onCheckedChange={(checked) => onChange({ ...values, isRequired: checked })}
            disabled={isSubmitting}
          />
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-border px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">Active</p>
            <p className="text-xs text-muted-foreground">Only active questions are shown to students.</p>
          </div>
          <Switch
            checked={values.isActive}
            onCheckedChange={(checked) => onChange({ ...values, isActive: checked })}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="rounded-xl border border-amber-300/50 bg-amber-500/10 px-4 py-3 text-xs leading-5 text-amber-800 dark:text-amber-200">
        Editing wording keeps existing student answers linked to this question. For a meaning change, archive this question and create a new one.
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

export default function AdminPersonalizationPage() {
  const [questions, setQuestions] = useState<AdminPersonalizationQuestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createValues, setCreateValues] = useState<QuestionFormValues>(() => createDefaultValues())
  const [isCreating, setIsCreating] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<AdminPersonalizationQuestion | null>(null)
  const [editValues, setEditValues] = useState<QuestionFormValues>(() => createDefaultValues())
  const [isUpdating, setIsUpdating] = useState(false)
  const [archivingQuestion, setArchivingQuestion] = useState<AdminPersonalizationQuestion | null>(null)
  const [isArchiving, setIsArchiving] = useState(false)
  const [restoringId, setRestoringId] = useState<string | null>(null)

  useEffect(() => {
    const abortController = new AbortController()

    async function loadQuestions() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        setQuestions(await fetchAdminPersonalizationQuestions(abortController.signal))
      } catch (error) {
        if (!abortController.signal.aborted) {
          setQuestions([])
          setErrorMessage(getApiClientErrorMessage(error, 'Failed to load personalization questions.'))
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false)
          setIsRefreshing(false)
        }
      }
    }

    void loadQuestions()
    return () => abortController.abort()
  }, [reloadKey])

  const activeCount = useMemo(
    () => questions.filter((question) => question.isActive && !question.archivedAt).length,
    [questions],
  )

  const nextDisplayOrder = useMemo(
    () => questions.reduce((highest, question) => Math.max(highest, question.displayOrder), -1) + 1,
    [questions],
  )

  const refresh = () => {
    setSuccessMessage('')
    setIsRefreshing(true)
    setReloadKey((current) => current + 1)
  }

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    let payload: CreateAdminPersonalizationQuestionPayload

    try {
      payload = buildPayload(createValues)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Invalid question.')
      return
    }

    setIsCreating(true)

    try {
      await createAdminPersonalizationQuestion(payload)
      setSuccessMessage('Personalization question created.')
      setIsCreateOpen(false)
      setReloadKey((current) => current + 1)
    } catch (error) {
      setErrorMessage(getApiClientErrorMessage(error, 'Failed to create personalization question.'))
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!editingQuestion) return

    setErrorMessage('')
    setSuccessMessage('')

    let payload: CreateAdminPersonalizationQuestionPayload

    try {
      payload = buildPayload(editValues)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Invalid question.')
      return
    }

    setIsUpdating(true)

    try {
      await updateAdminPersonalizationQuestion(editingQuestion.id, payload)
      setSuccessMessage('Personalization question updated.')
      setEditingQuestion(null)
      setReloadKey((current) => current + 1)
    } catch (error) {
      setErrorMessage(getApiClientErrorMessage(error, 'Failed to update personalization question.'))
    } finally {
      setIsUpdating(false)
    }
  }

  const handleArchive = async () => {
    if (!archivingQuestion) return

    setIsArchiving(true)
    setErrorMessage('')

    try {
      await deleteAdminPersonalizationQuestion(archivingQuestion.id)
      setSuccessMessage('Question archived. Existing student answers were preserved.')
      setArchivingQuestion(null)
      setReloadKey((current) => current + 1)
    } catch (error) {
      setErrorMessage(getApiClientErrorMessage(error, 'Failed to archive personalization question.'))
    } finally {
      setIsArchiving(false)
    }
  }

  const handleRestore = async (question: AdminPersonalizationQuestion) => {
    setRestoringId(question.id)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      await updateAdminPersonalizationQuestion(question.id, { isActive: true })
      setSuccessMessage('Question restored and activated.')
      setReloadKey((current) => current + 1)
    } catch (error) {
      setErrorMessage(getApiClientErrorMessage(error, 'Failed to restore personalization question.'))
    } finally {
      setRestoringId(null)
    }
  }

  return (
    <section className="p-4 md:p-6">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Personalized AI</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {questions.length} total questions, {activeCount} active for students.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              onClick={() => {
                setErrorMessage('')
                setSuccessMessage('')
                setCreateValues(createDefaultValues(nextDisplayOrder))
                setIsCreateOpen(true)
              }}
            >
              <Plus className="h-4 w-4" />
              Create Question
            </Button>
            <Button type="button" variant="outline" onClick={refresh} disabled={isLoading || isRefreshing}>
              {isRefreshing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </Button>
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-2xl border border-emerald-300/50 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
            {successMessage}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto p-5">
            {isLoading ? (
              <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-muted-foreground">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Loading personalization questions...
              </div>
            ) : questions.length === 0 ? (
              <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
                <Sparkles className="h-7 w-7 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No personalization questions have been created.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Order</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions.map((question) => {
                    const isArchived = Boolean(question.archivedAt)

                    return (
                      <TableRow key={question.id}>
                        <TableCell className="font-mono text-xs">{question.displayOrder}</TableCell>
                        <TableCell className="max-w-xl">
                          <p className="font-medium text-foreground">{question.question}</p>
                          {question.description ? (
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{question.description}</p>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <Badge variant={question.isRequired ? 'default' : 'secondary'}>
                            {question.isRequired ? 'Required' : 'Optional'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={question.isActive && !isArchived ? 'default' : 'secondary'}>
                            {isArchived ? 'Archived' : question.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setErrorMessage('')
                                setSuccessMessage('')
                                setEditingQuestion(question)
                                setEditValues(valuesFromQuestion(question))
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Button>
                            {isArchived ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => void handleRestore(question)}
                                disabled={restoringId === question.id}
                              >
                                {restoringId === question.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                                Restore
                              </Button>
                            ) : (
                              <Button type="button" variant="destructive" size="sm" onClick={() => setArchivingQuestion(question)}>
                                <Archive className="h-4 w-4" />
                                Archive
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Personalization Question</DialogTitle>
            <DialogDescription>This question will be shown in onboarding and student settings when active.</DialogDescription>
          </DialogHeader>
          <QuestionForm
            values={createValues}
            onChange={setCreateValues}
            onSubmit={handleCreate}
            onCancel={() => setIsCreateOpen(false)}
            isSubmitting={isCreating}
            submitLabel="Create Question"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingQuestion)} onOpenChange={(open) => !open && setEditingQuestion(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Personalization Question</DialogTitle>
            <DialogDescription>Changes apply anywhere this question is shown.</DialogDescription>
          </DialogHeader>
          <QuestionForm
            values={editValues}
            onChange={setEditValues}
            onSubmit={handleUpdate}
            onCancel={() => setEditingQuestion(null)}
            isSubmitting={isUpdating}
            submitLabel="Save Changes"
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(archivingQuestion)} onOpenChange={(open) => !open && setArchivingQuestion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this question?</AlertDialogTitle>
            <AlertDialogDescription>
              Students will no longer see it and it will be excluded from AI personalization. Existing student answers will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isArchiving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isArchiving}
              onClick={(event) => {
                event.preventDefault()
                void handleArchive()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isArchiving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
              Archive Question
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
