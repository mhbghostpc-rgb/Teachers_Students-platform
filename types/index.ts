export interface User {
  id: string
  email: string
  role_id: string | null
  role_name: string
  status: 'active' | 'suspended' | 'banned'
  created_at: string
}

export interface EducationalStage {
  id: string
  name: string
  is_active: boolean
}

export interface Subject {
  id: string
  name: string
  is_active: boolean
}

export interface Teacher {
  id: string
  user_id: string
  display_name: string
  profile_image: string | null
  city: string | null
  area: string | null
  teaching_type: 'online' | 'offline' | 'both' | 'center' | 'home_visit' | null
  phone: string | null
  whatsapp: string | null
  about: string | null
  experience_years: number
  qualification: string | null
  university: string | null
  video_url: string | null
  booking_url: string | null
  price_per_session: number | null
  session_duration: number | null
  is_trial_available: boolean
  average_rating: number
  reviews_count: number
  profile_completion_score: number
  priority_score: number
  is_featured: boolean
  is_sponsored: boolean
  status: 'pending' | 'approved' | 'rejected' | 'suspended' | 'banned' | 'hidden'
  created_at: string
  updated_at: string
  
  // Relations
  teacher_stages?: { stage: EducationalStage }[]
  teacher_subjects?: { subject: Subject }[]
}

export interface Student {
  id: string
  user_id: string
  display_name: string
  phone: string | null
  parent_phone: string | null
  city: string | null
  stage_id: string | null
  grade: string | null
  created_at: string
  
  // Relation
  stage?: EducationalStage
}

export interface Review {
  id: string
  teacher_id: string
  student_id: string
  rating: number
  comment: string | null
  status: 'pending' | 'published' | 'hidden' | 'rejected' | 'deleted' | 'flagged'
  rejection_reason: string | null
  reviewer_name?: string | null
  created_at: string
  
  // Relations
  student?: Student
  teacher?: Teacher
}

export interface SearchFilters {
  system_type?: string
  stage_id?: string
  subject_id?: string
  stage?: string
  subject?: string
  city?: string
  teaching_type?: 'online' | 'offline' | 'both' | 'center' | 'home_visit'
  min_rating?: number
}

export interface AdminStats {
  total_teachers: number
  total_students: number
  total_reviews: number
  pending_reviews: number
}

export interface ProfileClaim {
  id: string
  teacher_profile_id: string
  user_id: string
  provided_phone: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  
  user?: User
}

export interface SupportTicket {
  id: string
  user_id: string
  status: 'open' | 'closed'
  created_at: string
  updated_at: string
  
  // Relations
  user?: User
  messages?: SupportMessage[]
}

export interface SupportMessage {
  id: string
  ticket_id: string
  sender_id: string
  content: string | null
  audio_url: string | null
  created_at: string
  
  // Relations
  sender?: User
}
