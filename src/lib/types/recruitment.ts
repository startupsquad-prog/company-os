// Recruitment ATS Types

// Candidate Types
export type CandidateStatus = 'new' | 'screening' | 'shortlisted' | 'interviewing' | 'offered' | 'hired' | 'rejected' | 'withdrawn'
export type CandidateSource = 'website' | 'referral' | 'linkedin' | 'indeed' | 'other'

export interface Candidate {
  id: string
  contact_id: string
  status: CandidateStatus
  source: CandidateSource | null
  recruiter_id: string | null
  resume_url: string | null
  cover_letter_url: string | null
  tags: string[]
  notes: string | null
  meta: Record<string, any> | null
  created_at: string
  updated_at: string
  created_by: string | null
  deleted_at: string | null
}

export interface CandidateFull extends Candidate {
  contact?: {
    id: string
    name: string
    email: string | null
    phone: string | null
  } | null
  recruiter?: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
  } | null
}

export interface CandidateFormData {
  contact_id?: string
  status: CandidateStatus
  source?: CandidateSource
  recruiter_id?: string
  resume_url?: string
  cover_letter_url?: string
  tags?: string[]
  notes?: string
}

// Application Types
export type ApplicationStatus = 'applied' | 'screening' | 'interview' | 'offer' | 'accepted' | 'rejected' | 'withdrawn'

export interface Application {
  id: string
  candidate_id: string
  job_id: string | null
  job_title: string | null
  status: ApplicationStatus
  source: string | null
  applied_at: string | null
  notes: string | null
  meta: Record<string, any> | null
  created_at: string
  updated_at: string
  created_by: string | null
  deleted_at: string | null
}

export interface ApplicationFull extends Application {
  candidate?: CandidateFull | null
}

export interface ApplicationFormData {
  candidate_id: string
  job_id?: string
  job_title?: string
  status: ApplicationStatus
  source?: string
  applied_at?: string
  notes?: string
}

// Interview Types
export type InterviewType = 'phone_screen' | 'technical' | 'behavioral' | 'panel' | 'final' | 'other'
export type InterviewStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'

export interface Interview {
  id: string
  application_id: string
  candidate_id: string
  interview_type: InterviewType
  status: InterviewStatus
  scheduled_at: string | null
  duration_minutes: number | null
  location: string | null
  interviewer_ids: string[]
  notes: string | null
  feedback_summary: string | null
  meta: Record<string, any> | null
  created_at: string
  updated_at: string
  created_by: string | null
  deleted_at: string | null
}

export interface InterviewFull extends Interview {
  candidate?: CandidateFull | null
  application?: ApplicationFull | null
  interviewers?: Array<{
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
  }> | null
}

export interface InterviewFormData {
  application_id: string
  candidate_id: string
  interview_type: InterviewType
  status: InterviewStatus
  scheduled_at?: string
  duration_minutes?: number
  location?: string
  interviewer_ids?: string[]
  notes?: string
  feedback_summary?: string
}

// Evaluation Types
export type EvaluationStatus = 'draft' | 'submitted' | 'approved'
export type Recommendation = 'strong_yes' | 'yes' | 'maybe' | 'no' | 'strong_no'

export interface Evaluation {
  id: string
  interview_id: string
  candidate_id: string
  evaluator_id: string
  status: EvaluationStatus
  overall_rating: number | null
  scores: Record<string, number> | null
  strengths: string[]
  weaknesses: string[]
  recommendation: Recommendation | null
  notes: string | null
  meta: Record<string, any> | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface EvaluationFull extends Evaluation {
  candidate?: CandidateFull | null
  interview?: InterviewFull | null
  evaluator?: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
  } | null
}

export interface EvaluationFormData {
  interview_id: string
  candidate_id: string
  evaluator_id: string
  status: EvaluationStatus
  overall_rating?: number
  scores?: Record<string, number>
  strengths?: string[]
  weaknesses?: string[]
  recommendation?: Recommendation
  notes?: string
}

// Recruitment Call Types
export type RecruitmentCallType = 'screening' | 'follow_up' | 'offer' | 'rejection' | 'other'
export type RecruitmentCallDirection = 'incoming' | 'outgoing'
export type RecruitmentCallStatus = 'completed' | 'no_answer' | 'busy' | 'failed' | 'cancelled'

export interface RecruitmentCall {
  id: string
  candidate_id: string
  application_id: string | null
  caller_id: string | null
  call_type: RecruitmentCallType
  direction: RecruitmentCallDirection | null
  phone_number: string | null
  duration_seconds: number | null
  status: RecruitmentCallStatus | null
  outcome: string | null
  subject: string | null
  notes: string | null
  recording_url: string | null
  scheduled_at: string | null
  started_at: string | null
  ended_at: string | null
  meta: Record<string, any> | null
  created_at: string
  updated_at: string
  created_by: string | null
  deleted_at: string | null
}

export interface RecruitmentCallFull extends RecruitmentCall {
  candidate?: CandidateFull | null
  application?: ApplicationFull | null
  caller?: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
    phone: string | null
    avatar_url: string | null
  } | null
  meta?: {
    transcription?: {
      raw?: string
      conversational?: string
    }
    ai_feedback?: {
      sentiment?: string
      key_points?: string[]
      action_items?: string[]
      satisfaction_rating?: number
      professionalism_rating?: number
      responsiveness_rating?: number
      overall_rating?: number
      call_quality?: string
      customer_interest?: string
      next_steps?: string
    }
  } | null
}

export interface RecruitmentCallFormData {
  candidate_id: string
  application_id?: string
  caller_id?: string
  call_type: RecruitmentCallType
  direction?: RecruitmentCallDirection
  phone_number?: string
  duration_seconds?: number
  status?: RecruitmentCallStatus
  outcome?: string
  subject?: string
  notes?: string
  scheduled_at?: string
  started_at?: string
  ended_at?: string
}

// Filter Types
export interface CandidateFilters {
  status?: CandidateStatus[]
  source?: CandidateSource[]
  recruiter_id?: string[]
}

export interface ApplicationFilters {
  status?: ApplicationStatus[]
  candidate_id?: string[]
}

export interface InterviewFilters {
  type?: InterviewType[]
  status?: InterviewStatus[]
  interviewer_id?: string[]
  date_from?: string
  date_to?: string
}

export interface EvaluationFilters {
  recommendation?: Recommendation[]
  status?: EvaluationStatus[]
  evaluator_id?: string[]
}

export interface RecruitmentCallFilters {
  call_type?: RecruitmentCallType[]
  status?: RecruitmentCallStatus[]
  caller_id?: string[]
  date_from?: string
  date_to?: string
}

// Job Portal Types
export type JobPortalStatus = 'active' | 'inactive' | 'expired'
export type JobPortalType = 'job_board' | 'linkedin' | 'indeed' | 'naukri' | 'monster' | 'glassdoor' | 'other'

export interface JobPortal {
  id: string
  name: string
  url: string | null
  subscription_id: string | null
  status: JobPortalStatus
  portal_type: JobPortalType | null
  api_key: string | null
  api_secret: string | null
  credentials_jsonb: Record<string, any> | null
  notes: string | null
  meta: Record<string, any> | null
  created_at: string
  updated_at: string
  created_by: string | null
  deleted_at: string | null
}

export interface JobPortalFull extends JobPortal {
  subscription?: {
    id: string
    name: string
    status: string
  } | null
}

export interface JobPortalFormData {
  name: string
  url?: string
  subscription_id?: string
  status: JobPortalStatus
  portal_type?: JobPortalType
  api_key?: string
  api_secret?: string
  notes?: string
}

// Job Role Types
export type JobRoleStatus = 'active' | 'inactive' | 'archived'
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance'

export interface JobRole {
  id: string
  title: string
  department: string | null
  location: string | null
  employment_type: EmploymentType | null
  status: JobRoleStatus
  description: string | null
  requirements: string | null
  responsibilities: string | null
  salary_range_min: number | null
  salary_range_max: number | null
  currency: string | null
  experience_required_years: number | null
  tags: string[]
  notes: string | null
  meta: Record<string, any> | null
  created_at: string
  updated_at: string
  created_by: string | null
  deleted_at: string | null
}

export interface JobRoleFull extends JobRole {
  active_listings_count?: number
  total_applications_count?: number
}

export interface JobRoleFormData {
  title: string
  department?: string
  location?: string
  employment_type?: EmploymentType
  status: JobRoleStatus
  description?: string
  requirements?: string
  responsibilities?: string
  salary_range_min?: number
  salary_range_max?: number
  currency?: string
  experience_required_years?: number
  tags?: string[]
  notes?: string
}

// Job Listing Types
export type JobListingStatus = 'draft' | 'active' | 'paused' | 'closed' | 'expired'

export interface JobListing {
  id: string
  job_role_id: string
  job_portal_id: string
  external_job_id: string | null
  listing_url: string | null
  status: JobListingStatus
  posted_at: string | null
  expires_at: string | null
  views_count: number
  applications_count: number
  custom_description: string | null
  notes: string | null
  meta: Record<string, any> | null
  created_at: string
  updated_at: string
  created_by: string | null
  deleted_at: string | null
}

export interface JobListingFull extends JobListing {
  job_role?: JobRoleFull | null
  job_portal?: JobPortalFull | null
}

export interface JobListingFormData {
  job_role_id: string
  job_portal_id: string
  external_job_id?: string
  listing_url?: string
  status: JobListingStatus
  posted_at?: string
  expires_at?: string
  custom_description?: string
  notes?: string
}

// Filter Types
export interface JobPortalFilters {
  status?: JobPortalStatus[]
  portal_type?: JobPortalType[]
  subscription_id?: string[]
}

export interface JobRoleFilters {
  status?: JobRoleStatus[]
  department?: string[]
  location?: string[]
  employment_type?: EmploymentType[]
}

export interface JobListingFilters {
  status?: JobListingStatus[]
  job_role_id?: string[]
  job_portal_id?: string[]
  date_from?: string
  date_to?: string
}

