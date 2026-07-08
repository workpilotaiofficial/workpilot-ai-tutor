'use client'

import { useEffect, useState } from 'react'
import { Upload, Link as LinkIcon, Grid3x3, List, Plus, Sparkles } from 'lucide-react'
import UploadModal from '@/components/study-sets/upload-modal'
import PasteModal from '@/components/study-sets/paste-modal'
import StudySetCard from '@/components/study-sets/study-set-card'
import { getStoredStudySets, type StudySet } from '@/components/study-sets/utils'

export default function StudySetsPage() {
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showPasteModal, setShowPasteModal] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [studySets, setStudySets] = useState<StudySet[]>([])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setStudySets(getStoredStudySets())
    }
  }, [])

  const refreshFromStorage = () => {
    if (typeof window === 'undefined') return
    setStudySets(getStoredStudySets())
  }

  return (
    <div className="w-full bg-background min-h-screen">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-8">
        {/* Hero Section - Always Show */}
        <div className="mb-10 relative overflow-hidden rounded-3xl bg-linear-to-br from-primary via-primary to-thirdary p-8 sm:p-10">
          {/* Decorative glow orbs */}
          <div className="pointer-events-none absolute -top-24 -right-16 w-72 h-72 bg-white/20 rounded-full blur-3xl"></div>
          <div className="pointer-events-none absolute -bottom-32 -left-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl"></div>
          {/* Subtle dot grid */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:20px_20px]"></div>

          <div className="relative">
            <div className="mb-7 max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/25 backdrop-blur-sm">
                <span className="text-xs font-bold text-white tracking-wide">STUDY SETS</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight tracking-tight">
                What do you wanna master today?
              </h2>
              <p className="text-white/80 text-base sm:text-lg max-w-xl leading-relaxed">
                Upload notes, videos, or links and get interactive flashcards, quizzes &amp; study guides instantly.
              </p>
            </div>

            {/* Action cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
              <button
                onClick={() => setShowUploadModal(true)}
                className="group flex items-center gap-4 p-5 bg-white/95 backdrop-blur-sm rounded-2xl border border-white/40 hover:bg-white hover:shadow-2xl hover:shadow-black/20 transition-all duration-300 hover:-translate-y-1 text-left"
              >
                <div className="shrink-0 p-3.5 rounded-xl bg-linear-to-br from-primary to-thirdary text-white group-hover:scale-110 transition-transform duration-300">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-foreground">Upload File</p>
                  <p className="text-sm text-muted-foreground">PDF, image, video</p>
                </div>
              </button>

              <button
                onClick={() => setShowPasteModal(true)}
                className="group flex items-center gap-4 p-5 bg-white/95 backdrop-blur-sm rounded-2xl border border-white/40 hover:bg-white hover:shadow-2xl hover:shadow-black/20 transition-all duration-300 hover:-translate-y-1 text-left"
              >
                <div className="shrink-0 p-3.5 rounded-xl bg-linear-to-br from-primary to-thirdary text-white group-hover:scale-110 transition-transform duration-300">
                  <LinkIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-foreground">Paste Content</p>
                  <p className="text-sm text-muted-foreground">Paste your text here.</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {studySets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
        
            <h2 className="text-2xl font-bold text-foreground mb-2">No study sets yet</h2>
            <p className="text-muted-foreground mb-6 max-w-sm text-center">Use the upload or paste button above to create your first study set</p>
          </div>
        ) : (
          <>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-foreground">Your study sets</h3>
            <div className="flex fit items-center gap-1.5 bg-secondary p-1.5 rounded-lg border border-border">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all ${viewMode === 'grid'
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${viewMode === 'list'
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

            {/* Study Sets Grid */}
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max'
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
          </>
        )}
      </div>

      {/* Modals */}
      {showUploadModal && (
        <UploadModal
          onClose={() => {
            setShowUploadModal(false)
            refreshFromStorage()
          }}
        />
      )}

      {showPasteModal && (
        <PasteModal
          onClose={() => {
            setShowPasteModal(false)
            refreshFromStorage()
          }}
        />
      )}
    </div>
  )
}
// aa