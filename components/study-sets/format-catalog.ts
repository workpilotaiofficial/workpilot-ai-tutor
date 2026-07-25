import {
  Edit3,
  FileText,
  GraduationCap,
  Layers,
  ListChecks,
  PenSquare,
  type LucideIcon,
} from 'lucide-react'
import type { StudySetUiSectionType } from './generation-mapping'

export type StudySetFormatOption = {
  id: StudySetUiSectionType
  label: string
  description: string
  icon: LucideIcon
}

export const studySetFormatOptions: StudySetFormatOption[] = [
  {
    id: 'notes',
    label: 'Notes',
    description: 'Structured notes that capture the main ideas.',
    icon: FileText,
  },
  {
    id: 'multipleChoice',
    label: 'Multiple Choice',
    description: 'Auto-checked MCQ practice with explanations.',
    icon: ListChecks,
  },
  {
    id: 'flashcards',
    label: 'Flashcards',
    description: 'Front-and-back cards for active recall.',
    icon: Layers,
  },
  {
    id: 'tutorLesson',
    label: 'Tutor Lesson',
    description: 'A guided explanation of the material.',
    icon: GraduationCap,
  },
  {
    id: 'writtenTests',
    label: 'Written Tests',
    description: 'Open-ended questions for exam practice.',
    icon: PenSquare,
  },
  {
    id: 'fillInTheBlanks',
    label: 'Fill in the Blanks',
    description: 'Context-based recall from memory.',
    icon: Edit3,
  },
]

export const studySetFormatOptionMap = Object.fromEntries(
  studySetFormatOptions.map((option) => [option.id, option]),
) as Partial<Record<StudySetUiSectionType, StudySetFormatOption>>
