'use client'

import { useEffect, useState } from 'react'
import { Upload, Link as LinkIcon, Grid3x3, List } from 'lucide-react'
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
    <div className="w-full">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-background to-secondary/30 px-8 py-12 border-b border-border">
        <h1 className="text-4xl font-bold text-foreground mb-3 text-pretty">
          Hey Muntasir, what do you wanna master?
        </h1>
        <p className="text-muted-foreground text-lg mb-8">
          Upload anything and get interactive notes, flashcards, quizzes, and more
        </p>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex flex-col items-center gap-3 p-6 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all group"
          >
            <Upload className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
            <div className="text-center">
              <p className="font-semibold text-foreground">Upload</p>
              <p className="text-xs text-muted-foreground">Image, file, audio, video</p>
            </div>
          </button>

          <button
            onClick={() => setShowPasteModal(true)}
            className="flex flex-col items-center gap-3 p-6 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all group"
          >
            <LinkIcon className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
            <div className="text-center">
              <p className="font-semibold text-foreground">Paste</p>
              <p className="text-xs text-muted-foreground">YouTube, website, text</p>
            </div>
          </button>

          {/* <button className="flex flex-col items-center gap-3 p-6 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all group">
            <Mic className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
            <div className="text-center">
              <p className="font-semibold text-foreground">Record</p>
              <p className="text-xs text-muted-foreground">Record live lecture</p>
            </div>
          </button> */}
        </div>
      </div>

      {/* Study Sets Section */}
      <div className="px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">All Study Sets</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Study Sets Grid */}
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
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
