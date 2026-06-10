export type AppRole = 'owner' | 'admin' | 'author' | 'reviewer' | 'viewer'
export type DocumentStatus = 'Draft' | 'In Review' | 'Approved' | 'Rejected' | 'Archived'
export type DocumentType = 'Task' | 'Work Instruction'

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  onboarding_complete: boolean
  created_at: string
}

export interface Company {
  id: string
  name: string
  slug: string | null
  logo: string | null
  industry_type: string | null
  site_name: string | null
  plan_type: string
  task_limit: number
  active: boolean
}

export interface Membership {
  id: string
  company_id: string
  user_id: string
  app_role: AppRole
  active: boolean
  user_email: string | null
  user_name: string | null
  created_at?: string
  companies?: Company
}

export interface Annotation {
  id: string
  x: number
  y: number
  text: string
}

export interface VideoCaption {
  id: string
  time: number
  duration: number
  text: string
  position: { x: number; y: number }
}

export interface Step {
  id: string
  company_id: string
  document_id: string
  step_number: number
  step_title: string | null
  instruction_text: string
  warning_text: string | null
  image_url: string | null
  video_url: string | null
  estimated_time: string | null
  requires_acknowledgement: boolean
  sort_order: number
  annotations: Annotation[]
  video_captions: VideoCaption[]
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  company_id: string
  department_id: string | null
  department: string | null
  folder_id: string | null
  document_code: string | null
  title: string
  document_type: DocumentType
  purpose: string | null
  scope: string | null
  critical_safety_info: string | null
  estimated_time: string | null
  required_tools: string[]
  applicable_machines: string[]
  notification_emails: string[]
  owner_user_id: string | null
  reviewer_user_id: string | null
  approver_user_id: string | null
  status: DocumentStatus
  current_version_number: string
  reviewer_note: string | null
  reviewed_at: string | null
  submitted_at: string | null
  effective_date: string | null
  review_due_date: string | null
  tags: string[] | null
  active: boolean
  created_at: string
  updated_at: string
  steps?: Step[]
}

export interface TaskFormData {
  title: string
  document_type: DocumentType
  department: string
  critical_safety_info: string
  estimated_time: string
  required_tools: string[]
  status: DocumentStatus
}

export interface StepFormData {
  id: string
  step_title: string
  instruction_text: string
  warning_text: string
  image_url: string
  video_url: string
  requires_acknowledgement: boolean
  sort_order: number
  annotations: Annotation[]
  video_captions: VideoCaption[]
}

export interface AuditLogEntry {
  id: string
  company_id: string
  user_id: string | null
  entity: string
  entity_id: string | null
  action_type: string
  summary: string
  created_at: string
}

export interface TpInvitation {
  id: string
  company_id: string
  email: string
  app_role: AppRole
  token: string
  accepted: boolean
  invited_by: string | null
  invited_by_name: string | null
  expires_at: string
  created_at: string
}
