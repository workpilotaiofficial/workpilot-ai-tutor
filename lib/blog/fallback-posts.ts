import type { BlogPost } from '@/lib/blog/types'

const defaultCta = {
  label: 'Try Neurova free',
  url: '/signup',
}

export const fallbackBlogPosts: BlogPost[] = [
  {
    id: 'fallback-ai-study-routine',
    title: 'How To Build An AI Study Routine That Actually Sticks',
    slug: 'how-to-build-an-ai-study-routine',
    excerpt:
      'A practical framework for turning class notes, assignments, and revision sessions into a repeatable AI-powered study system.',
    coverImage: {
      url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80',
      alt: 'Students planning an AI-assisted study routine together.',
    },
    publishedAt: '2026-08-01T09:00:00.000Z',
    featured: true,
    readingTime: 6,
    author: {
      name: 'Neurova Editorial',
      role: 'Learning Systems Team',
      bio: 'The Neurova team writes about AI workflows that help students turn raw material into consistent progress.',
    },
    category: {
      title: 'Study Strategy',
      slug: 'study-strategy',
      description: 'Frameworks for better revision, time management, and learning design.',
    },
    cta: defaultCta,
    seo: {
      title: 'How To Build An AI Study Routine That Actually Sticks',
      description:
        'Learn how to design an AI-assisted study workflow that turns notes, quizzes, and deadlines into a sustainable routine.',
      canonicalUrl: null,
      ogImage: null,
      noIndex: false,
      noFollow: false,
      focusKeyword: 'ai study routine',
    },
    body: [
      {
        _type: 'block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: 'Students usually fail at consistency because their study workflow depends on motivation. A better system depends on clear inputs, fast feedback, and repeatable outputs.',
          },
        ],
      },
      {
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: 'Start with one weekly source of truth' }],
      },
      {
        _type: 'block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: 'Use one place for syllabus dates, one place for notes, and one place for active practice. AI helps only after your source material is organized.',
          },
        ],
      },
      {
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: 'Convert passive material into active outputs' }],
      },
      {
        _type: 'block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: 'Every lecture summary should become questions, flashcards, and a short explanation in your own words. That conversion step is where retention compounds.',
          },
        ],
      },
      {
        _type: 'block',
        style: 'h3',
        children: [{ _type: 'span', text: 'Use AI for speed, not for skipping understanding' }],
      },
      {
        _type: 'block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: 'Ask AI to structure content, generate drills, and surface gaps. Do not outsource the reasoning you need for the exam.',
          },
        ],
      },
    ],
  },
  {
    id: 'fallback-exam-week',
    title: 'What Top Students Automate During Exam Week',
    slug: 'what-top-students-automate-during-exam-week',
    excerpt:
      'Exam-week leverage comes from removing repetitive work: organizing topics, extracting key questions, and tracking what still feels weak.',
    coverImage: {
      url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1400&q=80',
      alt: 'Desk setup with laptop and notebooks during exam preparation.',
    },
    publishedAt: '2026-07-18T09:00:00.000Z',
    featured: false,
    readingTime: 5,
    author: {
      name: 'Neurova Editorial',
      role: 'Learning Systems Team',
    },
    category: {
      title: 'Exam Prep',
      slug: 'exam-prep',
      description: 'Tactics for high-pressure revision cycles.',
    },
    cta: defaultCta,
    seo: {
      title: 'What Top Students Automate During Exam Week',
      description:
        'See what high-performing students automate during exam week to focus on recall, writing, and weak-topic repair.',
      canonicalUrl: null,
      ogImage: null,
      noIndex: false,
      noFollow: false,
      focusKeyword: 'exam week study automation',
    },
    body: [
      {
        _type: 'block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: 'Students do not need more resources during exam week. They need fewer decisions and tighter feedback loops.',
          },
        ],
      },
      {
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: 'Automate the triage layer' }],
      },
      {
        _type: 'block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: 'Group topics into confident, shaky, and urgent. Then spend your best hours on the shaky and urgent buckets first.',
          },
        ],
      },
      {
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: 'Generate practice in the exact exam format' }],
      },
      {
        _type: 'block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: 'Multiple-choice students should drill elimination and pacing. Essay students should practice outlines and timed written responses.',
          },
        ],
      },
    ],
  },
  {
    id: 'fallback-syllabus',
    title: 'From Syllabus To Study Plan In 20 Minutes',
    slug: 'from-syllabus-to-study-plan-in-20-minutes',
    excerpt:
      'A fast workflow for converting course outlines into deadlines, topic clusters, revision checkpoints, and next actions.',
    coverImage: {
      url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80',
      alt: 'Student reviewing a course syllabus on a laptop.',
    },
    publishedAt: '2026-06-28T09:00:00.000Z',
    featured: false,
    readingTime: 4,
    author: {
      name: 'Neurova Editorial',
      role: 'Learning Systems Team',
    },
    category: {
      title: 'Planning',
      slug: 'planning',
      description: 'Workflows for turning syllabi into execution-ready plans.',
    },
    cta: defaultCta,
    seo: {
      title: 'From Syllabus To Study Plan In 20 Minutes',
      description:
        'Turn a raw course syllabus into a practical study plan with milestones, topic clusters, and revision checkpoints.',
      canonicalUrl: null,
      ogImage: null,
      noIndex: false,
      noFollow: false,
      focusKeyword: 'syllabus to study plan',
    },
    body: [
      {
        _type: 'block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: 'Most students read a syllabus once, then forget it exists until deadlines hurt. That is avoidable.',
          },
        ],
      },
      {
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: 'Extract dates, weights, and topic order first' }],
      },
      {
        _type: 'block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: 'Once those three things are visible, you can decide where to front-load work and where to leave recovery time.',
          },
        ],
      },
      {
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: 'Build checkpoints before deadlines' }],
      },
      {
        _type: 'block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: 'One week before each major due date, schedule a progress check and a problem list. That single habit prevents last-minute confusion.',
          },
        ],
      },
    ],
  },
]
