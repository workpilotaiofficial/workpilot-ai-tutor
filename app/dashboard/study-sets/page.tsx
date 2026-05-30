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
    <div className="w-full bg-gradient-to-br from-white via-blue-50/30 to-white min-h-screen">
      {/* Header Section */}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-8">
        {/* Hero Section - Always Show */}
        <div className="mb-10 relative overflow-hidden rounded-3xl bg-linear-to-br from-primary via-[#3825b4]/90 to-primary p-8 sm:p-10">
          {/* Decorative glow orbs */}
          <div className="pointer-events-none absolute -top-24 -right-16 w-72 h-72 bg-white/20 rounded-full blur-3xl"></div>
          <div className="pointer-events-none absolute -bottom-32 -left-20 w-80 h-80 bg-[#9FCB98]/20 rounded-full blur-3xl"></div>
          {/* Subtle dot grid */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:20px_20px]"></div>

          <div className="relative">
            <div className="mb-7 max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/25 backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 text-[#9FCB98]" />
                <span className="text-xs font-bold text-white tracking-wide">STUDY SETS</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight tracking-tight">
                What do you wanna master today?
              </h2>
              <p className="text-indigo-100 text-base sm:text-lg max-w-xl leading-relaxed">
                Upload notes, videos, or links and get interactive flashcards, quizzes &amp; study guides instantly.
              </p>
            </div>

            {/* Action cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
              <button
                onClick={() => setShowUploadModal(true)}
                className="group flex items-center gap-4 p-5 bg-white/95 backdrop-blur-sm rounded-2xl border border-white/40 hover:bg-white hover:shadow-2xl hover:shadow-black/20 transition-all duration-300 hover:-translate-y-1 text-left"
              >
                <div className="shrink-0 p-3.5 rounded-xl bg-linear-to-br from-[#5B65E0] to-[#5100a7] text-white group-hover:scale-110 transition-transform duration-300">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Upload File</p>
                  <p className="text-sm text-slate-500">PDF, image, video</p>
                </div>
              </button>

              <button
                onClick={() => setShowPasteModal(true)}
                className="group flex items-center gap-4 p-5 bg-white/95 backdrop-blur-sm rounded-2xl border border-white/40 hover:bg-white hover:shadow-2xl hover:shadow-black/20 transition-all duration-300 hover:-translate-y-1 text-left"
              >
                <div className="shrink-0 p-3.5 rounded-xl bg-linear-to-br from-[#5B65E0] to-[#5100a7] text-white group-hover:scale-110 transition-transform duration-300">
                  <LinkIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Paste Content</p>
                  <p className="text-sm text-slate-500">Paste you text here.</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {studySets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="p-6 bg-linear-to-br from-slate-100 to-slate-200 rounded-xl mb-6">
              <Sparkles className="w-12 h-12 text-slate-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">No study sets yet</h2>
            <p className="text-slate-600 mb-6 max-w-sm text-center">Use the upload or paste button above to create your first study set</p>
          </div>
        ) : (
          <>
          <div className="flex items-center justify-between mb-6">

            <h3 className="text-2xl font-bold text-slate-900 mb-6">Your study sets</h3>

                <div className="flex fit items-center gap-1.5 bg-slate-100/60 p-1.5 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'grid'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'list'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
          </div>
            {/* Section Title */}

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
