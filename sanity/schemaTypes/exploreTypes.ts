import { defineArrayMember, defineField, defineType } from 'sanity'

const requiredText = (name: string, title: string) => defineField({ name, title, type: 'string', validation: (r) => r.required() })
const portable = defineArrayMember({ type: 'block' })

export const exploreSubjectType = defineType({ name: 'exploreSubject', title: 'Explore subject', type: 'document', fields: [
  requiredText('title', 'Title'),
  defineField({ name: 'slug', type: 'slug', options: { source: 'title', isUnique: (value, context) => context.defaultIsUnique(value, context) }, validation: (r) => r.required() }),
  defineField({ name: 'description', type: 'text' }), defineField({ name: 'sortOrder', type: 'number', initialValue: 0 }),
] })

const sections = [
  defineArrayMember({ name: 'notes', title: 'Notes', type: 'object', fields: [defineField({ name: 'title', type: 'string' }), defineField({ name: 'content', type: 'array', of: [portable], validation: (r) => r.required() })] }),
  defineArrayMember({ name: 'flashcards', title: 'Flashcards', type: 'object', fields: [defineField({ name: 'items', type: 'array', of: [{ type: 'object', fields: [requiredText('prompt', 'Prompt'), requiredText('answer', 'Answer')] }], validation: (r) => r.required().min(1) })] }),
  defineArrayMember({ name: 'mcq', title: 'Multiple choice', type: 'object', fields: [requiredText('question', 'Question'), defineField({ name: 'options', type: 'array', of: [{ type: 'object', fields: [requiredText('text', 'Text'), defineField({ name: 'correct', type: 'boolean', initialValue: false })] }], validation: (r) => r.required().min(2).custom((items) => Array.isArray(items) && items.filter((item) => Boolean((item as { correct?: boolean }).correct)).length === 1 ? true : 'Exactly one option must be correct') }), defineField({ name: 'explanation', type: 'text' })] }),
  defineArrayMember({ name: 'fillBlank', title: 'Fill in the blank', type: 'object', fields: [requiredText('prompt', 'Prompt'), requiredText('answer', 'Completed answer'), defineField({ name: 'explanation', type: 'text' })] }),
  defineArrayMember({ name: 'writtenTest', title: 'Written test', type: 'object', fields: [requiredText('question', 'Question'), defineField({ name: 'modelAnswer', type: 'text', validation: (r) => r.required() }), defineField({ name: 'markingPoints', type: 'array', of: [{ type: 'string' }] })] }),
  defineArrayMember({ name: 'tutorLesson', title: 'Tutor lesson', type: 'object', fields: [requiredText('title', 'Title'), defineField({ name: 'content', type: 'array', of: [portable], validation: (r) => r.required() })] }),
  defineArrayMember({ name: 'media', title: 'Podcast / video', type: 'object', fields: [requiredText('title', 'Title'), defineField({ name: 'url', type: 'url', validation: (r) => r.required().uri({ scheme: ['https'] }).custom((url) => !url || /^https:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com|spotify\.com|soundcloud\.com)\//i.test(url) ? true : 'Use YouTube, Vimeo, Spotify, or SoundCloud') }), defineField({ name: 'transcript', type: 'array', of: [portable] })] }),
]

export const exploreStudySetType = defineType({ name: 'exploreStudySet', title: 'Explore study set', type: 'document', fields: [
  requiredText('title', 'Title'), defineField({ name: 'slug', type: 'slug', options: { source: 'title', isUnique: (value, context) => context.defaultIsUnique(value, context) }, validation: (r) => r.required() }),
  defineField({ name: 'subject', type: 'reference', to: [{ type: 'exploreSubject' }], validation: (r) => r.required() }),
  defineField({ name: 'coverImage', type: 'image', options: { hotspot: true }, fields: [defineField({ name: 'alt', type: 'string', validation: (r) => r.required() })], validation: (r) => r.required() }),
  defineField({ name: 'summary', type: 'text', validation: (r) => r.required().max(260) }), defineField({ name: 'difficulty', type: 'string', options: { list: ['Beginner', 'Intermediate', 'Advanced'] }, validation: (r) => r.required() }),
  defineField({ name: 'estimatedMinutes', type: 'number', validation: (r) => r.required().positive().integer() }), defineField({ name: 'tags', type: 'array', of: [{ type: 'string' }] }), defineField({ name: 'learningObjectives', type: 'array', of: [{ type: 'string' }] }),
  defineField({ name: 'featured', type: 'boolean', initialValue: false }), defineField({ name: 'sortOrder', type: 'number', initialValue: 0 }), defineField({ name: 'sections', type: 'array', of: sections, validation: (r) => r.required().min(1) }),
  defineField({ name: 'publicContent', title: 'Public content panel', type: 'object', description: 'Shown in the public guide right sidebar.', fields: [defineField({ name: 'title', type: 'string' }), defineField({ name: 'videoUrl', title: 'YouTube video URL', type: 'url', validation: (r) => r.uri({ scheme: ['https'] }).custom((url) => !url || /^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(url) ? true : 'Use a YouTube URL') }), defineField({ name: 'transcript', title: 'Video transcript', type: 'array', of: [portable] })] }),
  defineField({ name: 'sidebarNotes', title: 'Public sidebar notes', type: 'array', of: [portable], description: 'Short notes shown in the right-side Notes tab.' }),
  defineField({ name: 'seo', type: 'seo' }),
] })
