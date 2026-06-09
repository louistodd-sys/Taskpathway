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
  companies?: Company
}

export interface Annotation {
  id: string
  x: number
  y: number
  text: string
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
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  company_id: string
  department_id: string | null
  folder_id: string | null
  document_code: string | null
  title: string
  document_type: DocumentType
  purpose: string | null
  scope: string | null
  critical_safety_info: string | null
  estimated_time: string | null
  required_tools: string[]
  owner_user_id: string | null
  reviewer_user_id: string | null
  status: DocumentStatus
  current_version_number: string
  tags: string[] | null
  active: boolean
  created_at: string
  updated_at: string
  steps?: Step[]
}

export interface TaskFormData {
  title: string
  document_type: DocumentType
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
}
