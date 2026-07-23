export type ObjectiveStatus = 'not_started' | 'building' | 'stable' | 'transfer_ready'

export type AdaptiveJourneyObjective = {
  id: string
  title: string
  status: ObjectiveStatus
  masteryPercent: number
  evidenceLabel: string
  sourceLabel: string
  reviewLabel?: string
}

export type AdaptiveJourneyMissionStep = {
  id: string
  label: string
  type: 'recall' | 'explain' | 'guided_practice' | 'independent_check' | 'teach_back'
  minutes: number
}

export type AdaptiveJourneyMission = {
  id: string
  eyebrow: string
  title: string
  objectiveTitle: string
  reason: string
  estimatedMinutes: number
  completedSteps: number
  steps: AdaptiveJourneyMissionStep[]
}

export type AdaptiveJourneyReview = {
  id: string
  title: string
  dueLabel: string
  minutes: number
  urgency: 'due' | 'soon' | 'scheduled'
}

export type AdaptiveJourneyDay = {
  id: string
  shortLabel: string
  dateLabel: string
  minutes: number
  status: 'completed' | 'today' | 'planned' | 'rest'
  focus: string
}

export type AdaptiveJourneyViewModel = {
  studySetId: string
  course: {
    title: string
    code: string
    assessmentLabel: string
    daysRemaining: number | null
    dailyMinutes: number
  }
  readiness: {
    percent: number
    changeThisWeek: number
    readyObjectives: number
    totalObjectives: number
    label: string
  }
  mission: AdaptiveJourneyMission
  coachInsight: {
    eyebrow: string
    title: string
    body: string
    actionLabel: string
  }
  reviews: AdaptiveJourneyReview[]
  objectives: AdaptiveJourneyObjective[]
  week: AdaptiveJourneyDay[]
  sourceHealth: {
    ready: number
    total: number
    label: string
  }
}

