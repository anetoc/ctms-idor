// User types
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  department: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type UserRole = "admin" | "coordinator" | "monitor" | "investigator" | "regulatory" | "viewer"

// Study types
export interface Study {
  id: string
  protocol_number: string
  short_title: string
  full_title: string
  sponsor: string
  phase: StudyPhase
  therapeutic_area: string
  status: StudyStatus
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
}

export type StudyPhase = "I" | "II" | "III" | "IV" | "NA"
export type StudyStatus = "in_development" | "active" | "enrolling" | "closed_to_enrollment" | "completed" | "terminated" | "suspended"

// Action Item types
export interface ActionItem {
  id: string
  study_id: string
  study?: Study
  title: string
  description: string | null
  category: ActionItemCategory
  severity: ActionItemSeverity
  status: ActionItemStatus
  assigned_to_id: string | null
  assigned_to?: User
  created_by_id: string
  created_by?: User
  due_date: string | null
  completed_at: string | null
  sla_days: number | null
  days_remaining?: number
  is_overdue?: boolean
  source_type: string | null
  source_id: string | null
  created_at: string
  updated_at: string
}

export type ActionItemCategory =
  | "regulatory_finding"
  | "protocol_deviation"
  | "safety_report"
  | "document_pending"
  | "training_required"
  | "site_issue"
  | "sponsor_request"
  | "internal_task"
  | "other"

export type ActionItemSeverity = "critical" | "major" | "minor" | "info"

export type ActionItemStatus = "new" | "in_progress" | "waiting_external" | "done" | "cancelled"

// API Response types
export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// Auth types
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

// Dashboard types
export interface DashboardStats {
  total_action_items: number
  overdue_count: number
  aging_p90_days: number
  sla_compliance_percent: number
  by_status: Record<ActionItemStatus, number>
  by_category: Record<ActionItemCategory, number>
  by_severity: Record<ActionItemSeverity, number>
}

// Filter types
export interface ActionItemFilters {
  category?: ActionItemCategory[]
  severity?: ActionItemSeverity[]
  status?: ActionItemStatus[]
  study_id?: string
  assigned_to_id?: string
  is_overdue?: boolean
}
