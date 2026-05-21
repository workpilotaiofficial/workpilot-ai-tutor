'use client'

import CreateStudySetModal from './create-study-set-modal'

interface PasteModalProps {
  onClose: () => void
}

export default function PasteModal({ onClose }: PasteModalProps) {
  return <CreateStudySetModal onClose={onClose} initialSource="text" />
}
