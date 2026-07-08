'use client'

import { useState, useRef } from 'react'
import { X, Upload, Trash2, CheckCircle, AlertCircle } from 'lucide-react'
import { getApiClientErrorMessage, submitGraderAssignment, type GraderSubmitResponse } from '@/lib/api'

interface GraderUploadModalProps {
  onClose: () => void
  onSuccess: (response: GraderSubmitResponse) => void
}

export default function GraderUploadModal({
  onClose,
  onSuccess,
}: GraderUploadModalProps) {
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null)
  const [rubricFile, setRubricFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const assignmentInputRef = useRef<HTMLInputElement>(null)
  const rubricInputRef = useRef<HTMLInputElement>(null)

  const handleAssignmentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.size <= 50 * 1024 * 1024) {
      setAssignmentFile(file)
      setError('')
    } else {
      setError('File must be less than 50MB')
    }
  }

  const handleRubricSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.size <= 50 * 1024 * 1024) {
      setRubricFile(file)
      setError('')
    } else {
      setError('File must be less than 50MB')
    }
  }

  const handleDrop = (e: React.DragEvent, type: 'assignment' | 'rubric') => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.size <= 50 * 1024 * 1024) {
      if (type === 'assignment') {
        setAssignmentFile(file)
      } else {
        setRubricFile(file)
      }
      setError('')
    } else {
      setError('File must be less than 50MB')
    }
  }

  const handleSubmit = async () => {
    if (!assignmentFile || !rubricFile || !title.trim()) {
      setError('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const data = await submitGraderAssignment({
        title: title.trim(),
        assignmentFile,
        rubricFile,
      })

      onSuccess(data)
    } catch (err) {
      console.error('Error submitting assignment:', err)
      setError(getApiClientErrorMessage(err, 'Failed to submit assignment'))
    } finally {
      setIsLoading(false)
    }
  }

  const isValid = assignmentFile && rubricFile && title.trim().length > 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl max-w-2xl w-full max-h-screen overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Submit Assignment for Grading</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title Input */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Submission Title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (error) setError('')
              }}
              placeholder="e.g., Psychology Essay Assignment 1"
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>

          {/* Assignment File */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Assignment File <span className="text-destructive">*</span>
            </label>
            <div
              onDrop={(e) => handleDrop(e, 'assignment')}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => assignmentInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
            >
              <input
                ref={assignmentInputRef}
                type="file"
                onChange={handleAssignmentSelect}
                accept=".pdf,.txt,.doc,.docx,.md"
                className="hidden"
              />
              {assignmentFile ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />
                    <div className="text-left">
                      <p className="font-semibold text-foreground">
                        {assignmentFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(assignmentFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setAssignmentFile(null)
                    }}
                    className="p-1 hover:bg-destructive/20 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              ) : (
                <div>
                  <Upload className="w-10 h-10 text-primary mx-auto mb-2" />
                  <p className="font-semibold text-foreground mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, Word, or Text files (Max 50MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Rubric File */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Grading Rubric File <span className="text-destructive">*</span>
            </label>
            <div
              onDrop={(e) => handleDrop(e, 'rubric')}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => rubricInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-thirdary hover:bg-thirdary/5 transition-all"
            >
              <input
                ref={rubricInputRef}
                type="file"
                onChange={handleRubricSelect}
                accept=".pdf,.txt,.doc,.docx,.md"
                className="hidden"
              />
              {rubricFile ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />
                    <div className="text-left">
                      <p className="font-semibold text-foreground">
                        {rubricFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(rubricFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setRubricFile(null)
                    }}
                    className="p-1 hover:bg-destructive/20 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              ) : (
                <div>
                  <Upload className="w-10 h-10 text-thirdary mx-auto mb-2" />
                  <p className="font-semibold text-foreground mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, Word, or Text files (Max 50MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-gap-3 gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive/80">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-border bg-secondary">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-border rounded-lg text-foreground hover:bg-background transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || isLoading}
            className="flex-1 px-4 py-2.5 bg-linear-to-r from-primary to-thirdary text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium disabled:hover:shadow-none"
          >
            {isLoading ? 'Submitting...' : 'Submit for Grading'}
          </button>
        </div>
      </div>
    </div>
  )
}
