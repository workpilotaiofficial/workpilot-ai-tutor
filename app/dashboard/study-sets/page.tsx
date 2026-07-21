'use client'

import { useCallback, useEffect, useState } from 'react'
import { Upload, Link as LinkIcon, Grid2X2, List, Mic } from 'lucide-react'
import UploadModal from '@/components/study-sets/upload-modal'
import PasteModal from '@/components/study-sets/paste-modal'
import StudySetCard from '@/components/study-sets/study-set-card'
import type { StudySetPreview } from '@/components/study-sets/utils'
import { fetchStudySetHistory, fetchStudySetProgress } from '@/lib/api/study-sets.service'
import { getApiClientErrorMessage } from '@/lib/api/client'
import { getStoredAuthObject } from '@/lib/api/session-storage'

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
      const history = Array.isArray(historyResponse.data) ? historyResponse.data : []
      const progressResults = await Promise.allSettled(
        history.map((studySet) => fetchStudySetProgress(studySet.id, signal)),
      )

      if (signal?.aborted) return

      setStudySets(
        history.map((studySet, index) => {
          const progressResult = progressResults[index]
          const summary = progressResult?.status === 'fulfilled' ? progressResult.value.summary : null

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
      setErrorMessage(getApiClientErrorMessage(error, 'Failed to load study sets. Please try again.'))
    } finally {
      if (!signal?.aborted) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const abortController = new AbortController()
    void loadStudySets(abortController.signal)

    const displayName = getStoredAuthObject()?.user_display_name?.trim()
    if (displayName) setFirstName(displayName.split(/\s+/)[0])

    return () => abortController.abort()
  }, [loadStudySets])

  const refreshStudySets = () => void loadStudySets()

  return (
    <div className="min-h-full w-full bg-background">
      <div className="mx-auto w-full px-6 pb-12 pt-24 sm:px-8 lg:px-10">
        <section className="mx-auto mb-28 max-w-4xl text-center sm:mb-32">
          <h1 className="text-balance text-3xl font-semibold tracking-[-0.025em] text-foreground sm:text-[40px] sm:leading-[1.15]">
            Hey {firstName}, what do you wanna master?
          </h1>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            Upload anything and get interactive notes, flashcards, quizzes, and more
          </p>

          <div className="mx-auto mt-10 grid max-w-[840px] grid-cols-1 gap-3 text-left sm:grid-cols-3">
              <button
                onClick={() => setShowUploadModal(true)}
                className="group flex min-h-36 flex-col justify-between rounded-[28px] border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md"
              >
                <Upload className="h-7 w-7 text-foreground/80" strokeWidth={2} />
                <div>
                  <p className="text-lg font-semibold text-foreground">Upload</p>
                  <p className="mt-1 text-sm text-muted-foreground">Image, file (Max-10mb)</p>
                </div>
              </button>

              <button
                id="paste-content-btn"
                onClick={() => setShowPasteModal(true)}
                className="group flex min-h-36 flex-col justify-between rounded-[28px] border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md"
              >
                <LinkIcon className="h-7 w-7 text-foreground/80" strokeWidth={2} />
                <div>
                  <p className="text-lg font-semibold text-foreground">Paste</p>
                  <p className="mt-1 text-sm text-muted-foreground">Upload your text</p>
                </div>
              </button>

              {/* <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="group flex min-h-36 flex-col justify-between rounded-[28px] border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md"
              >
                <Mic className="h-7 w-7 text-foreground/80" strokeWidth={2} />
                <div>
                  <p className="text-lg font-semibold text-foreground">Record</p>
                  <p className="mt-1 text-sm text-muted-foreground">Record live lecture</p>
                </div>
              </button> */}
          </div>
        </section>

        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="relative pl-5 text-xl font-semibold text-foreground before:absolute before:inset-y-0 before:left-0 before:w-1 before:rounded-full before:bg-foreground sm:text-2xl">
              All Study Sets
            </h2>
            <div className="flex items-center rounded-xl border border-border bg-card p-1">
              <button
                aria-label="Grid view"
                onClick={() => setViewMode('grid')}
                className={`rounded-lg p-2 transition-all ${viewMode === 'grid'
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <Grid2X2 className="h-4 w-4" />
              </button>
              <button
                aria-label="List view"
                onClick={() => setViewMode('list')}
                className={`rounded-lg p-2 transition-all ${viewMode === 'list'
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-3xl border border-border px-6 py-14 text-center">
              <p className="text-sm text-muted-foreground">Loading study sets...</p>
            </div>
          ) : errorMessage ? (
            <div className="rounded-3xl border border-destructive/30 px-6 py-14 text-center">
              <h3 className="text-lg font-semibold text-foreground">Couldn&apos;t load study sets</h3>
              <p className="mt-1 text-sm text-muted-foreground">{errorMessage}</p>
              <button
                type="button"
                onClick={refreshStudySets}
                className="mt-4 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
              >
                Try again
              </button>
            </div>
          ) : studySets.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border px-6 py-14 text-center">
              <h3 className="text-lg font-semibold text-foreground">No study sets yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">Upload or paste content above to create your first one.</p>
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid auto-rows-max grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3'
                  : 'space-y-4'
              }
            >
              {studySets.map((set) => (
                <StudySetCard
                  key={set.id}
                  set={set}
                  isListView={viewMode === 'list'}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Modals */}
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
    </div>
  )
}
