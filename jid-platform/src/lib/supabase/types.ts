export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      active_sessions: {
        Row: {
          created_at: string
          device_label: string | null
          expires_at: string
          id: string
          ip_address: unknown | null
          last_active_at: string
          revoked_at: string | null
          session_token_hash: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_label?: string | null
          expires_at: string
          id?: string
          ip_address?: unknown | null
          last_active_at?: string
          revoked_at?: string | null
          session_token_hash: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_label?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          last_active_at?: string
          revoked_at?: string | null
          session_token_hash?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'active_sessions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      application_intents: {
        Row: {
          created_at: string
          id: string
          job_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'application_intents_job_id_fkey'
            columns: ['job_id']
            isOneToOne: false
            referencedRelation: 'jobs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'application_intents_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      applications: {
        Row: {
          applicant_id: string
          company_id: string
          contact_email: string | null
          cover_letter: string | null
          created_at: string
          expires_at: string | null
          id: string
          job_id: string
          last_company_action_at: string | null
          last_seen_by_user_at: string | null
          status_changed_at: string | null
          status_changed_by: string | null
          resume_url: string | null
          status: Database['public']['Enums']['application_status_enum']
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          applicant_id: string
          company_id?: string
          contact_email?: string | null
          cover_letter?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          job_id: string
          last_company_action_at?: string | null
          last_seen_by_user_at?: string | null
          status_changed_at?: string | null
          status_changed_by?: string | null
          resume_url?: string | null
          status?: Database['public']['Enums']['application_status_enum']
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          company_id?: string
          contact_email?: string | null
          cover_letter?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          job_id?: string
          last_company_action_at?: string | null
          last_seen_by_user_at?: string | null
          status_changed_at?: string | null
          status_changed_by?: string | null
          resume_url?: string | null
          status?: Database['public']['Enums']['application_status_enum']
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'applications_applicant_id_fkey'
            columns: ['applicant_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'applications_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'applications_job_id_fkey'
            columns: ['job_id']
            isOneToOne: false
            referencedRelation: 'jobs'
            referencedColumns: ['id']
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown | null
          metadata: Json
          new_data: Json | null
          old_data: Json | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'audit_logs_actor_id_fkey'
            columns: ['actor_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      companies: {
        Row: {
          about_long_ar: string | null
          about_long_en: string | null
          avg_response_days: number | null
          broken_since: string | null
          career_portal_url: string | null
          city: string | null
          claim_requested_at: string | null
          claimed_by: string | null
          commitment_score: number
          cover_url: string | null
          created_at: string
          description_ar: string | null
          description_en: string | null
          domains: string[]
          employee_count_range: string | null
          entity_state: string
          entity_type: string
          founded_year: number | null
          id: string
          is_active: boolean
          is_on_honor_roll: boolean
          is_verified: boolean
          last_activity_at: string | null
          last_audit_at: string | null
          link_status: Database['public']['Enums']['link_status_enum']
          linkedin_url: string | null
          logo_url: string | null
          manual_order: number
          name: string
          name_ar: string | null
          office_locations: Json
          ownership_type: Database['public']['Enums']['ownership_enum'] | null
          region_id: string | null
          response_rate_pct: number | null
          sector_id: string | null
          slug: string | null
          tagline_ar: string | null
          tagline_en: string | null
          total_jobs_posted_12mo: number
          twitter_url: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          about_long_ar?: string | null
          about_long_en?: string | null
          avg_response_days?: number | null
          commitment_score?: number
          created_at?: string
          domains?: string[]
          employee_count_range?: string | null
          entity_state?: string
          entity_type?: string
          founded_year?: number | null
          id?: string
          is_on_honor_roll?: boolean
          is_verified?: boolean
          last_activity_at?: string | null
          name: string
          name_ar?: string | null
          office_locations?: Json
          response_rate_pct?: number | null
          tagline_ar?: string | null
          tagline_en?: string | null
          total_jobs_posted_12mo?: number
        }
        Update: {
          about_long_ar?: string | null
          about_long_en?: string | null
          avg_response_days?: number | null
          commitment_score?: number
          created_at?: string
          domains?: string[]
          employee_count_range?: string | null
          entity_state?: string
          entity_type?: string
          founded_year?: number | null
          id?: string
          is_on_honor_roll?: boolean
          is_verified?: boolean
          last_activity_at?: string | null
          name?: string
          name_ar?: string | null
          office_locations?: Json
          response_rate_pct?: number | null
          tagline_ar?: string | null
          tagline_en?: string | null
          total_jobs_posted_12mo?: number
        }
        Relationships: []
      }
      claim_requests: {
        Row: {
          business_email: string
          can_reapply_after: string | null
          claim_type: Database['public']['Enums']['claim_type_enum']
          claimant_name: string
          claimant_title: string | null
          company_id: string
          company_name: string
          created_at: string
          domain_verified: boolean
          evidence_urls: string[]
          id: string
          rejection_reason: string | null
          required_documents: string[]
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database['public']['Enums']['claim_status_enum']
          updated_at: string
          user_id: string
        }
        Insert: {
          business_email: string
          can_reapply_after?: string | null
          claim_type?: Database['public']['Enums']['claim_type_enum']
          claimant_name: string
          claimant_title?: string | null
          company_id: string
          company_name: string
          created_at?: string
          evidence_urls?: string[]
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database['public']['Enums']['claim_status_enum']
          updated_at?: string
          user_id: string
        }
        Update: {
          business_email?: string
          can_reapply_after?: string | null
          claim_type?: Database['public']['Enums']['claim_type_enum']
          claimant_name?: string
          claimant_title?: string | null
          company_id?: string
          company_name?: string
          created_at?: string
          evidence_urls?: string[]
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database['public']['Enums']['claim_status_enum']
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'claim_requests_reviewed_by_fkey'
            columns: ['reviewed_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'claim_requests_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      phone_verification_attempts: {
        Row: {
          attempt_number: number
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown | null
          is_verified: boolean
          otp_hash: string
          phone: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          attempt_number?: number
          created_at?: string
          expires_at: string
          id?: string
          ip_address?: unknown | null
          is_verified?: boolean
          otp_hash: string
          phone: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          attempt_number?: number
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          is_verified?: boolean
          otp_hash?: string
          phone?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'phone_verification_attempts_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email_verified_at: string | null
          failed_login_count: number
          full_name: string | null
          id: string
          last_login_at: string | null
          last_login_ip: unknown | null
          locale: string
          locked_until: string | null
          mfa_enabled: boolean
          mfa_enforced: boolean
          phone: string | null
          phone_verified_at: string | null
          role: Database['public']['Enums']['user_role_enum']
          suspended_at: string | null
          suspended_reason: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email_verified_at?: string | null
          failed_login_count?: number
          full_name?: string | null
          id: string
          last_login_at?: string | null
          last_login_ip?: unknown | null
          locale?: string
          locked_until?: string | null
          mfa_enabled?: boolean
          mfa_enforced?: boolean
          phone?: string | null
          phone_verified_at?: string | null
          role?: Database['public']['Enums']['user_role_enum']
          suspended_at?: string | null
          suspended_reason?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email_verified_at?: string | null
          failed_login_count?: number
          full_name?: string | null
          id?: string
          last_login_at?: string | null
          last_login_ip?: unknown | null
          locale?: string
          locked_until?: string | null
          mfa_enabled?: boolean
          mfa_enforced?: boolean
          phone?: string | null
          phone_verified_at?: string | null
          role?: Database['public']['Enums']['user_role_enum']
          suspended_at?: string | null
          suspended_reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      staff_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invite_token: string
          invited_by: string
          reason: string
          role: Database['public']['Enums']['user_role_enum']
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invite_token: string
          invited_by: string
          reason: string
          role: Database['public']['Enums']['user_role_enum']
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invite_token?: string
          invited_by?: string
          role?: Database['public']['Enums']['user_role_enum']
        }
        Relationships: [
          {
            foreignKeyName: 'staff_invitations_accepted_by_fkey'
            columns: ['accepted_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'staff_invitations_invited_by_fkey'
            columns: ['invited_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      link_audit_log: {
        Row: {
          checked_at: string
          company_id: string
          created_at: string
          error_message: string | null
          http_status: number | null
          id: string
          link_type: string | null
          status: Database['public']['Enums']['link_status_enum']
          url: string
        }
        Insert: {
          checked_at?: string
          company_id: string
          created_at?: string
          error_message?: string | null
          http_status?: number | null
          id?: string
          link_type?: string | null
          status?: Database['public']['Enums']['link_status_enum']
          url: string
        }
        Update: {
          checked_at?: string
          company_id?: string
          created_at?: string
          error_message?: string | null
          http_status?: number | null
          id?: string
          link_type?: string | null
          status?: Database['public']['Enums']['link_status_enum']
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: 'link_audit_log_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
        ]
      }
      jobs: {
        Row: {
          applicant_count: number
          application_deadline: string
          city: string | null
          closed_at: string | null
          company_id: string
          created_at: string
          created_by: string | null
          description_ar: string | null
          description_en: string | null
          experience_level: Database['public']['Enums']['experience_level_enum']
          id: string
          is_remote: boolean
          published_at: string | null
          region_id: string | null
          salary_currency: string
          salary_max: number | null
          salary_min: number | null
          sector_id: string | null
          slug: string | null
          status: Database['public']['Enums']['job_status_enum']
          title_ar: string
          title_en: string | null
          updated_at: string
          view_count: number
        }
        Insert: {
          applicant_count?: number
          application_deadline: string
          city?: string | null
          closed_at?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          experience_level?: Database['public']['Enums']['experience_level_enum']
          id?: string
          is_remote?: boolean
          published_at?: string | null
          region_id?: string | null
          salary_currency?: string
          salary_max?: number | null
          salary_min?: number | null
          sector_id?: string | null
          slug?: string | null
          status?: Database['public']['Enums']['job_status_enum']
          title_ar: string
          title_en?: string | null
          updated_at?: string
          view_count?: number
        }
        Update: {
          applicant_count?: number
          application_deadline?: string
          city?: string | null
          closed_at?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          experience_level?: Database['public']['Enums']['experience_level_enum']
          id?: string
          is_remote?: boolean
          published_at?: string | null
          region_id?: string | null
          salary_currency?: string
          salary_max?: number | null
          salary_min?: number | null
          sector_id?: string | null
          slug?: string | null
          status?: Database['public']['Enums']['job_status_enum']
          title_ar?: string
          title_en?: string | null
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: 'jobs_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'jobs_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'jobs_region_id_fkey'
            columns: ['region_id']
            isOneToOne: false
            referencedRelation: 'regions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'jobs_sector_id_fkey'
            columns: ['sector_id']
            isOneToOne: false
            referencedRelation: 'sectors'
            referencedColumns: ['id']
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          mentee_id: string
          mentor_id: string
          mentorship_request_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          mentee_id: string
          mentor_id: string
          mentorship_request_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          mentee_id?: string
          mentor_id?: string
          mentorship_request_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'conversations_mentee_id_fkey'
            columns: ['mentee_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'conversations_mentor_id_fkey'
            columns: ['mentor_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'conversations_mentorship_request_id_fkey'
            columns: ['mentorship_request_id']
            isOneToOne: true
            referencedRelation: 'mentorship_requests'
            referencedColumns: ['id']
          },
        ]
      }
      mentor_notification_requests: {
        Row: {
          created_at: string
          desired_filters: Json | null
          id: string
          mentor_id: string | null
          notified_at: string | null
          requester_id: string
          status: Database['public']['Enums']['mentor_notification_status_enum']
        }
        Insert: {
          created_at?: string
          desired_filters?: Json | null
          id?: string
          mentor_id?: string | null
          notified_at?: string | null
          requester_id: string
          status?: Database['public']['Enums']['mentor_notification_status_enum']
        }
        Update: {
          created_at?: string
          desired_filters?: Json | null
          id?: string
          mentor_id?: string | null
          notified_at?: string | null
          requester_id?: string
          status?: Database['public']['Enums']['mentor_notification_status_enum']
        }
        Relationships: [
          {
            foreignKeyName: 'mentor_notification_requests_mentor_id_fkey'
            columns: ['mentor_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'mentor_notification_requests_requester_id_fkey'
            columns: ['requester_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      mentor_profiles: {
        Row: {
          active_workshop: Json | null
          application_message: string | null
          application_submitted_at: string | null
          avg_response_hours: number | null
          bio_long: string | null
          bio_short: string | null
          career_history: Json
          created_at: string
          declined_requests_count: number
          expertise_areas: string[]
          expertise_sectors: string[]
          headline: string | null
          is_accepting_requests: boolean
          is_mentor_of_month: boolean
          mentor_score: number | null
          languages: string[]
          linkedin_url: string | null
          max_active_mentees: number
          nationality: string | null
          preferred_mediums: string[]
          rating_avg: number | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sessions_count: number
          slug: string | null
          specializations: string[]
          status: string
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          active_workshop?: Json | null
          application_message?: string | null
          application_submitted_at?: string | null
          avg_response_hours?: number | null
          bio_long?: string | null
          bio_short?: string | null
          career_history?: Json
          created_at?: string
          declined_requests_count?: number
          expertise_areas?: string[]
          expertise_sectors?: string[]
          headline?: string | null
          is_accepting_requests?: boolean
          is_mentor_of_month?: boolean
          mentor_score?: number | null
          languages?: string[]
          linkedin_url?: string | null
          max_active_mentees?: number
          nationality?: string | null
          preferred_mediums?: string[]
          rating_avg?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sessions_count?: number
          slug?: string | null
          specializations?: string[]
          status?: string
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          active_workshop?: Json | null
          application_message?: string | null
          application_submitted_at?: string | null
          avg_response_hours?: number | null
          bio_long?: string | null
          bio_short?: string | null
          career_history?: Json
          created_at?: string
          declined_requests_count?: number
          expertise_areas?: string[]
          expertise_sectors?: string[]
          headline?: string | null
          is_accepting_requests?: boolean
          is_mentor_of_month?: boolean
          mentor_score?: number | null
          languages?: string[]
          linkedin_url?: string | null
          max_active_mentees?: number
          nationality?: string | null
          preferred_mediums?: string[]
          rating_avg?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sessions_count?: number
          slug?: string | null
          specializations?: string[]
          status?: string
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'mentor_profiles_reviewed_by_fkey'
            columns: ['reviewed_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'mentor_profiles_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      mentor_workshops: {
        Row: {
          capacity: number
          created_at: string
          description: string | null
          external_url: string | null
          id: string
          mentor_id: string
          scheduled_at: string | null
          spots_remaining: number
          status: Database['public']['Enums']['mentor_workshop_status_enum']
          title: string
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          description?: string | null
          external_url?: string | null
          id?: string
          mentor_id: string
          scheduled_at?: string | null
          spots_remaining?: number
          status?: Database['public']['Enums']['mentor_workshop_status_enum']
          title: string
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          description?: string | null
          external_url?: string | null
          id?: string
          mentor_id?: string
          scheduled_at?: string | null
          spots_remaining?: number
          status?: Database['public']['Enums']['mentor_workshop_status_enum']
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'mentor_workshops_mentor_id_fkey'
            columns: ['mentor_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      mentorship_meetings: {
        Row: {
          completed_at: string | null
          created_at: string
          duration_minutes: number | null
          expected_end_at: string | null
          feedback_comment: string | null
          feedback_rating: number | null
          feedback_submitted_at: string | null
          id: string
          medium: string | null
          meeting_url: string | null
          mentee_id: string
          mentor_id: string
          notes: string | null
          request_id: string | null
          scheduled_at: string | null
          should_show_feedback: boolean
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number | null
          expected_end_at?: string | null
          feedback_comment?: string | null
          feedback_rating?: number | null
          feedback_submitted_at?: string | null
          id?: string
          medium?: string | null
          meeting_url?: string | null
          mentee_id: string
          mentor_id: string
          notes?: string | null
          request_id?: string | null
          scheduled_at?: string | null
          should_show_feedback?: boolean
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number | null
          expected_end_at?: string | null
          feedback_comment?: string | null
          feedback_rating?: number | null
          feedback_submitted_at?: string | null
          id?: string
          medium?: string | null
          meeting_url?: string | null
          mentee_id?: string
          mentor_id?: string
          notes?: string | null
          request_id?: string | null
          scheduled_at?: string | null
          should_show_feedback?: boolean
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'mentorship_meetings_mentee_id_fkey'
            columns: ['mentee_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'mentorship_meetings_mentor_id_fkey'
            columns: ['mentor_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'mentorship_meetings_request_id_fkey'
            columns: ['request_id']
            isOneToOne: false
            referencedRelation: 'mentorship_requests'
            referencedColumns: ['id']
          },
        ]
      }
      mentorship_requests: {
        Row: {
          conversation_id: string | null
          created_at: string
          decline_reason: string | null
          expires_at: string | null
          focus_area: string | null
          id: string
          intent_statement: string | null
          mentee_id: string
          mentee_snapshot: Json | null
          mentor_id: string
          message: string | null
          preferred_medium: string | null
          responded_at: string | null
          status: Database['public']['Enums']['mentorship_request_status_enum']
          updated_at: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          decline_reason?: string | null
          expires_at?: string | null
          focus_area?: string | null
          id?: string
          intent_statement?: string | null
          mentee_id: string
          mentee_snapshot?: Json | null
          mentor_id: string
          message?: string | null
          preferred_medium?: string | null
          responded_at?: string | null
          status?: Database['public']['Enums']['mentorship_request_status_enum']
          updated_at?: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          decline_reason?: string | null
          expires_at?: string | null
          focus_area?: string | null
          id?: string
          intent_statement?: string | null
          mentee_id?: string
          mentee_snapshot?: Json | null
          mentor_id?: string
          message?: string | null
          preferred_medium?: string | null
          responded_at?: string | null
          status?: Database['public']['Enums']['mentorship_request_status_enum']
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'mentorship_requests_conversation_id_fkey'
            columns: ['conversation_id']
            isOneToOne: false
            referencedRelation: 'conversations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'mentorship_requests_mentee_id_fkey'
            columns: ['mentee_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'mentorship_requests_mentor_id_fkey'
            columns: ['mentor_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      messages: {
        Row: {
          ciphertext: string | null
          conversation_id: string
          created_at: string
          id: string
          meeting_id: string | null
          message_type: string
          nonce: string | null
          sender_id: string
        }
        Insert: {
          ciphertext?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          meeting_id?: string | null
          message_type?: string
          nonce?: string | null
          sender_id: string
        }
        Update: {
          ciphertext?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          meeting_id?: string | null
          message_type?: string
          nonce?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'messages_conversation_id_fkey'
            columns: ['conversation_id']
            isOneToOne: false
            referencedRelation: 'conversations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'messages_meeting_id_fkey'
            columns: ['meeting_id']
            isOneToOne: false
            referencedRelation: 'mentorship_meetings'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'messages_sender_id_fkey'
            columns: ['sender_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      radar_items: {
        Row: {
          column_name: string | null
          created_at: string | null
          id: string
          reference_id: string | null
          scheduled_for: string | null
          status: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          column_name?: string | null
          created_at?: string | null
          id?: string
          reference_id?: string | null
          scheduled_for?: string | null
          status?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          column_name?: string | null
          created_at?: string | null
          id?: string
          reference_id?: string | null
          scheduled_for?: string | null
          status?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_encryption_keys: {
        Row: {
          created_at: string
          key_version: number
          public_key: string
          rotated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          key_version?: number
          public_key: string
          rotated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          key_version?: number
          public_key?: string
          rotated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_encryption_keys_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      regions: {
        Row: {
          created_at: string
          id: string
          name_ar: string | null
          name_en: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name_ar?: string | null
          name_en: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name_ar?: string | null
          name_en?: string
          slug?: string
        }
        Relationships: []
      }
      sectors: {
        Row: {
          created_at: string
          id: string
          name_ar: string | null
          name_en: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name_ar?: string | null
          name_en: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name_ar?: string | null
          name_en?: string
          slug?: string
        }
        Relationships: []
      }
      user_verified_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          is_primary: boolean
          user_id: string
          verified_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_primary?: boolean
          user_id: string
          verified_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_primary?: boolean
          user_id?: string
          verified_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_verified_emails_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      check_email_otp_rate_limit: {
        Args: { p_email: string; p_user_id: string }
        Returns: undefined
      }
      check_otp_rate_limit: {
        Args: { p_phone: string; p_user_id: string }
        Returns: undefined
      }
      complete_staff_invite_acceptance: {
        Args: { p_token: string }
        Returns: undefined
      }
      current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database['public']['Enums']['user_role_enum']
      }
      expire_passed_jobs: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      expire_stale_applications: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      expire_stale_mentorship_requests: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      enqueue_mentor_pending_request_radar: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      is_mentorship_staff: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      process_due_radar_items: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      sync_meeting_radar_on_confirm: {
        Args: { p_meeting_id: string }
        Returns: undefined
      }
      update_feedback_flags: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      is_admin_or_above: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_privileged_staff: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      record_active_session: {
        Args: {
          p_device_label?: string
          p_expires_at?: string
          p_ip_address?: unknown
          p_session_token_hash: string
          p_user_agent?: string
        }
        Returns: undefined
      }
      review_claim_request: {
        Args: {
          p_claim_id: string
          p_decision: string
          p_rejection_reason?: string
          p_review_notes: string
        }
        Returns: undefined
      }
      revoke_active_session: {
        Args: { p_session_id: string }
        Returns: undefined
      }
      set_user_role: {
        Args: {
          p_new_role: Database['public']['Enums']['user_role_enum']
          p_target_user_id: string
        }
        Returns: undefined
      }
      suspend_user: {
        Args: {
          p_locked_until: string
          p_reason?: string
          p_target_user_id: string
        }
        Returns: undefined
      }
      transition_closing_soon: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      validate_staff_invite_token: {
        Args: { p_token: string }
        Returns: {
          email: string
          invitation_id: string
          invite_role: Database['public']['Enums']['user_role_enum']
        }[]
      }
      verify_phone_otp: {
        Args: { p_otp: string; p_phone: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      application_status_enum:
        | 'draft'
        | 'saved'
        | 'pending'
        | 'submitted'
        | 'under_review'
        | 'shortlisted'
        | 'rejected'
        | 'invited'
        | 'withdrawn'
        | 'expired'
      claim_status_enum:
        | 'pending'
        | 'pending_review'
        | 'under_review'
        | 'approved'
        | 'rejected'
        | 'cancelled'
      claim_type_enum: 'company' | 'university'
      experience_level_enum: 'intern' | 'entry' | 'mid' | 'senior' | 'lead' | 'executive'
      job_status_enum:
        | 'draft'
        | 'published'
        | 'closing_soon'
        | 'closed'
        | 'expired'
        | 'pending_review'
      link_status_enum: 'healthy' | 'broken' | 'pending'
      mentor_notification_status_enum: 'pending' | 'sent' | 'dismissed'
      mentor_workshop_status_enum: 'draft' | 'published' | 'completed' | 'cancelled'
      mentorship_request_status_enum:
        | 'pending'
        | 'accepted'
        | 'declined'
        | 'cancelled'
        | 'expired'
      ownership_enum: 'government' | 'semi_government' | 'private'
      user_role_enum:
        | 'individual'
        | 'entity'
        | 'company_admin'
        | 'university_admin'
        | 'staff'
        | 'admin'
        | 'super_admin'
    }
    CompositeTypes: Record<string, never>
  }
}

type DefaultSchema = Database[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never
