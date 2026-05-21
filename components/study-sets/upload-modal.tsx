'use client'

import CreateStudySetModal from './create-study-set-modal'

interface UploadModalProps {
  onClose: () => void
}

export default function UploadModal({ onClose }: UploadModalProps) {
  return <CreateStudySetModal onClose={onClose} initialSource="pdf" />
}
