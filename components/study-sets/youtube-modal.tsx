'use client'

import CreateStudySetModal from './create-study-set-modal'

interface YoutubeModalProps {
  onClose: () => void
}

export default function YoutubeModal({ onClose }: YoutubeModalProps) {
  return <CreateStudySetModal initialSource="youtube" onClose={onClose} />
}
