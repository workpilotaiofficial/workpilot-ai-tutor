import { apiClient } from '@/lib/api/client'

export type DashboardStats = {
  study_sets_count: number
  syllabi_count: number
  grading_count: number
  credits_available: number
  plan: string
  plan_name: string
  tools_available: string[]
}

export type DashboardStudySet = {
  id: string
  title: string
  status: string
  section_count: number
  selected_types: string[]
  completed_types: string[]
  item_count: number
  percentage_completed: number
  generation_progress_percentage: number
  created_at: string
}

export type DashboardSyllabus = {
  id: string
  title: string
  description: string | null
  status: string
  module_count: number
  percentage_completed: number
  created_at: string
}

export type DashboardGrading = {
  id: string
  title: string
  status: string
  max_score: number
  score_percentage: number
  created_at: string
}

export type DashboardResponse = {
  stats: DashboardStats
  recent_study_sets: DashboardStudySet[]
  recent_syllabi: DashboardSyllabus[]
  recent_grading: DashboardGrading[]
}

type DashboardEnvelope = DashboardResponse | { data: DashboardResponse }

export async function fetchDashboard(signal?: AbortSignal): Promise<DashboardResponse> {
  const response = await apiClient.request<DashboardEnvelope>('/api/v1/dashboard', { signal })
  return 'data' in response ? response.data : response
}
