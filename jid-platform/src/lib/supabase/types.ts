export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      _deprecated_commitment_scores: {
        Row: {
          archived_at: string
          commitment_score: number
          company_id: string
        }
        Insert: {
          archived_at?: string
          commitment_score: number
          company_id: string
        }
        Update: {
          archived_at?: string
          commitment_score?: number
          company_id?: string
        }
        Relationships: []
      }
      active_sessions: {
        Row: {
          created_at: string
          device_label: string | null
          expires_at: string
          id: string
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
          last_active_at?: string
          revoked_at?: string | null
          session_token_hash?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "active_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "active_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
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
            foreignKeyName: "application_intents_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_intents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_intents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
        ]
      }
      applications: {
        Row: {
          applicant_id: string | null
          company_id: string | null
          contact_email: string | null
          cover_letter: string | null
          created_at: string
          expires_at: string | null
          id: string
          job_id: string | null
          last_company_action_at: string | null
          last_seen_by_user_at: string | null
          resume_url: string | null
          status: string
          status_changed_at: string | null
          status_changed_by: string | null
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          applicant_id?: string | null
          company_id?: string | null
          contact_email?: string | null
          cover_letter?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          job_id?: string | null
          last_company_action_at?: string | null
          last_seen_by_user_at?: string | null
          resume_url?: string | null
          status?: string
          status_changed_at?: string | null
          status_changed_by?: string | null
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          applicant_id?: string | null
          company_id?: string | null
          contact_email?: string | null
          cover_letter?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          job_id?: string | null
          last_company_action_at?: string | null
          last_seen_by_user_at?: string | null
          resume_url?: string | null
          status?: string
          status_changed_at?: string | null
          status_changed_by?: string | null
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
          {
            foreignKeyName: "applications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_status_changed_by_fkey"
            columns: ["status_changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_status_changed_by_fkey"
            columns: ["status_changed_by"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
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
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
          metadata?: Json
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
        ]
      }
      badges_catalog: {
        Row: {
          category: Database["public"]["Enums"]["badge_category_enum"]
          created_at: string
          description_ar: string | null
          description_en: string | null
          icon_key: string | null
          id: string
          is_active: boolean
          is_auto_awarded: boolean
          name_ar: string
          name_en: string
          slug: string
          sort_order: number
        }
        Insert: {
          category: Database["public"]["Enums"]["badge_category_enum"]
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          icon_key?: string | null
          id?: string
          is_active?: boolean
          is_auto_awarded?: boolean
          name_ar: string
          name_en: string
          slug: string
          sort_order?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["badge_category_enum"]
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          icon_key?: string | null
          id?: string
          is_active?: boolean
          is_auto_awarded?: boolean
          name_ar?: string
          name_en?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      billing_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json | null
          subscription_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json | null
          subscription_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json | null
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_events_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      business_profiles: {
        Row: {
          about_ar: string | null
          about_en: string | null
          cover_image_url: string | null
          created_at: string
          directory_id: string
          display_name_ar: string
          display_name_en: string | null
          employee_count_range: string | null
          founded_year: number | null
          gallery: Json
          id: string
          owner_user_id: string
          published_at: string | null
          status: string
          tagline_ar: string | null
          updated_at: string
          verified_badge: boolean
          verified_domains: string[]
        }
        Insert: {
          about_ar?: string | null
          about_en?: string | null
          cover_image_url?: string | null
          created_at?: string
          directory_id: string
          display_name_ar: string
          display_name_en?: string | null
          employee_count_range?: string | null
          founded_year?: number | null
          gallery?: Json
          id?: string
          owner_user_id: string
          published_at?: string | null
          status?: string
          tagline_ar?: string | null
          updated_at?: string
          verified_badge?: boolean
          verified_domains?: string[]
        }
        Update: {
          about_ar?: string | null
          about_en?: string | null
          cover_image_url?: string | null
          created_at?: string
          directory_id?: string
          display_name_ar?: string
          display_name_en?: string | null
          employee_count_range?: string | null
          founded_year?: number | null
          gallery?: Json
          id?: string
          owner_user_id?: string
          published_at?: string | null
          status?: string
          tagline_ar?: string | null
          updated_at?: string
          verified_badge?: boolean
          verified_domains?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "business_profiles_directory_id_fkey"
            columns: ["directory_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      colleges: {
        Row: {
          created_at: string
          id: string
          name: string
          name_ar: string | null
          university_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          name_ar?: string | null
          university_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          name_ar?: string | null
          university_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "colleges_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      colleges_catalog: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name_ar: string
          name_en: string
          slug: string
          university_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name_ar: string
          name_en: string
          slug: string
          university_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string
          slug?: string
          university_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "colleges_catalog_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colleges_catalog_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "university_dashboard_snapshot"
            referencedColumns: ["university_id"]
          },
          {
            foreignKeyName: "colleges_catalog_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "university_dashboard_view"
            referencedColumns: ["university_id"]
          },
          {
            foreignKeyName: "colleges_catalog_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "university_dashboard_view_admin"
            referencedColumns: ["university_id"]
          },
        ]
      }
      communication_batches: {
        Row: {
          canceled_by: string | null
          company_id: string
          created_at: string
          created_by: string
          failed_count: number
          id: string
          job_id: string
          kind: Database["public"]["Enums"]["comm_kind_enum"]
          recipient_application_ids: string[]
          recipient_count: number
          scheduled_send_at: string | null
          sent_count: number
          status: Database["public"]["Enums"]["comm_batch_status_enum"]
          template_snapshot: Json
        }
        Insert: {
          canceled_by?: string | null
          company_id: string
          created_at?: string
          created_by: string
          failed_count?: number
          id?: string
          job_id: string
          kind: Database["public"]["Enums"]["comm_kind_enum"]
          recipient_application_ids: string[]
          recipient_count: number
          scheduled_send_at?: string | null
          sent_count?: number
          status?: Database["public"]["Enums"]["comm_batch_status_enum"]
          template_snapshot: Json
        }
        Update: {
          canceled_by?: string | null
          company_id?: string
          created_at?: string
          created_by?: string
          failed_count?: number
          id?: string
          job_id?: string
          kind?: Database["public"]["Enums"]["comm_kind_enum"]
          recipient_application_ids?: string[]
          recipient_count?: number
          scheduled_send_at?: string | null
          sent_count?: number
          status?: Database["public"]["Enums"]["comm_batch_status_enum"]
          template_snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "communication_batches_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_batches_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_log: {
        Row: {
          application_id: string
          batch_id: string | null
          channel: string
          id: string
          kind: Database["public"]["Enums"]["comm_kind_enum"]
          provider_message_id: string | null
          sent_at: string
          status: string
        }
        Insert: {
          application_id: string
          batch_id?: string | null
          channel?: string
          id?: string
          kind: Database["public"]["Enums"]["comm_kind_enum"]
          provider_message_id?: string | null
          sent_at?: string
          status: string
        }
        Update: {
          application_id?: string
          batch_id?: string | null
          channel?: string
          id?: string
          kind?: Database["public"]["Enums"]["comm_kind_enum"]
          provider_message_id?: string | null
          sent_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_log_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_log_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "radar_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_log_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "communication_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_templates: {
        Row: {
          body_ar: string
          company_id: string
          id: string
          is_locked: boolean
          kind: Database["public"]["Enums"]["comm_kind_enum"]
          subject_ar: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body_ar: string
          company_id: string
          id?: string
          is_locked?: boolean
          kind: Database["public"]["Enums"]["comm_kind_enum"]
          subject_ar: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body_ar?: string
          company_id?: string
          id?: string
          is_locked?: boolean
          kind?: Database["public"]["Enums"]["comm_kind_enum"]
          subject_ar?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communication_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
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
          cover_url: string | null
          created_at: string
          description_ar: string | null
          description_en: string | null
          domains: string[]
          employee_count_range: string | null
          entity_state: string
          entity_type: Database["public"]["Enums"]["entity_type_enum"]
          founded_year: number | null
          id: string
          is_active: boolean
          is_on_honor_roll: boolean
          is_verified: boolean
          last_activity_at: string | null
          last_audit_at: string | null
          link_status: Database["public"]["Enums"]["link_status_enum"]
          linkedin_url: string | null
          logo_url: string | null
          manual_order: number
          name: string
          name_ar: string | null
          office_locations: Json
          ownership_type: Database["public"]["Enums"]["ownership_enum"] | null
          region_id: string | null
          response_rate_pct: number | null
          search_vector: unknown
          sector_id: string | null
          slug: string | null
          subscription_tier: string
          tagline_ar: string | null
          tagline_en: string | null
          total_jobs_posted_12mo: number
          total_students_claimed: number
          twitter_url: string | null
          university_short_code: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          about_long_ar?: string | null
          about_long_en?: string | null
          avg_response_days?: number | null
          broken_since?: string | null
          career_portal_url?: string | null
          city?: string | null
          claim_requested_at?: string | null
          claimed_by?: string | null
          cover_url?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          domains?: string[]
          employee_count_range?: string | null
          entity_state?: string
          entity_type?: Database["public"]["Enums"]["entity_type_enum"]
          founded_year?: number | null
          id?: string
          is_active?: boolean
          is_on_honor_roll?: boolean
          is_verified?: boolean
          last_activity_at?: string | null
          last_audit_at?: string | null
          link_status?: Database["public"]["Enums"]["link_status_enum"]
          linkedin_url?: string | null
          logo_url?: string | null
          manual_order?: number
          name?: string
          name_ar?: string | null
          office_locations?: Json
          ownership_type?: Database["public"]["Enums"]["ownership_enum"] | null
          region_id?: string | null
          response_rate_pct?: number | null
          search_vector?: unknown
          sector_id?: string | null
          slug?: string | null
          subscription_tier?: string
          tagline_ar?: string | null
          tagline_en?: string | null
          total_jobs_posted_12mo?: number
          total_students_claimed?: number
          twitter_url?: string | null
          university_short_code?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          about_long_ar?: string | null
          about_long_en?: string | null
          avg_response_days?: number | null
          broken_since?: string | null
          career_portal_url?: string | null
          city?: string | null
          claim_requested_at?: string | null
          claimed_by?: string | null
          cover_url?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          domains?: string[]
          employee_count_range?: string | null
          entity_state?: string
          entity_type?: Database["public"]["Enums"]["entity_type_enum"]
          founded_year?: number | null
          id?: string
          is_active?: boolean
          is_on_honor_roll?: boolean
          is_verified?: boolean
          last_activity_at?: string | null
          last_audit_at?: string | null
          link_status?: Database["public"]["Enums"]["link_status_enum"]
          linkedin_url?: string | null
          logo_url?: string | null
          manual_order?: number
          name?: string
          name_ar?: string | null
          office_locations?: Json
          ownership_type?: Database["public"]["Enums"]["ownership_enum"] | null
          region_id?: string | null
          response_rate_pct?: number | null
          search_vector?: unknown
          sector_id?: string | null
          slug?: string | null
          subscription_tier?: string
          tagline_ar?: string | null
          tagline_en?: string | null
          total_jobs_posted_12mo?: number
          total_students_claimed?: number
          twitter_url?: string | null
          university_short_code?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
          {
            foreignKeyName: "companies_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sector_demand_snapshot"
            referencedColumns: ["sector_id"]
          },
          {
            foreignKeyName: "companies_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          body: string
          created_at: string
          email: string
          full_name: string
          id: string
          locale: string
          source: Database["public"]["Enums"]["contact_message_source_enum"]
          subject: string
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          locale?: string
          source?: Database["public"]["Enums"]["contact_message_source_enum"]
          subject: string
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          locale?: string
          source?: Database["public"]["Enums"]["contact_message_source_enum"]
          subject?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
        ]
      }
      content_flags: {
        Row: {
          assigned_staff_id: string | null
          created_at: string
          details: string | null
          id: string
          reason: Database["public"]["Enums"]["flag_reason_enum"]
          reporter_id: string
          resolution_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["flag_status_enum"]
          target_id: string
          target_type: Database["public"]["Enums"]["content_flag_target_type_enum"]
          updated_at: string
        }
        Insert: {
          assigned_staff_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason: Database["public"]["Enums"]["flag_reason_enum"]
          reporter_id: string
          resolution_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["flag_status_enum"]
          target_id: string
          target_type: Database["public"]["Enums"]["content_flag_target_type_enum"]
          updated_at?: string
        }
        Update: {
          assigned_staff_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason?: Database["public"]["Enums"]["flag_reason_enum"]
          reporter_id?: string
          resolution_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["flag_status_enum"]
          target_id?: string
          target_type?: Database["public"]["Enums"]["content_flag_target_type_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_flags_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_flags_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
          {
            foreignKeyName: "content_flags_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_flags_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
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
            foreignKeyName: "conversations_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
          {
            foreignKeyName: "conversations_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
          {
            foreignKeyName: "conversations_mentorship_request_id_fkey"
            columns: ["mentorship_request_id"]
            isOneToOne: true
            referencedRelation: "mentorship_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      cv_additional: {
        Row: {
          category: Database["public"]["Enums"]["additional_category_enum"]
          created_at: string
          cv_id: string
          description: string | null
          end_date: string | null
          id: string
          issuer: string | null
          sort_order: number
          start_date: string | null
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["additional_category_enum"]
          created_at?: string
          cv_id: string
          description?: string | null
          end_date?: string | null
          id?: string
          issuer?: string | null
          sort_order?: number
          start_date?: string | null
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["additional_category_enum"]
          created_at?: string
          cv_id?: string
          description?: string | null
          end_date?: string | null
          id?: string
          issuer?: string | null
          sort_order?: number
          start_date?: string | null
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cv_additional_cv_id_fkey"
            columns: ["cv_id"]
            isOneToOne: false
            referencedRelation: "cvs"
            referencedColumns: ["id"]
          },
        ]
      }
      cv_builder_prefs: {
        Row: {
          preferred_format: string
          preferred_language: string
          section_order: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          preferred_format?: string
          preferred_language?: string
          section_order?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          preferred_format?: string
          preferred_language?: string
          section_order?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cv_education: {
        Row: {
          created_at: string
          cv_id: string
          degree: string | null
          end_month: number | null
          end_year: number | null
          field_of_study: string | null
          gpa_scale: number | null
          gpa_value: number | null
          graduation_year: number | null
          honors: string | null
          id: string
          institution_city: string | null
          institution_country: string | null
          institution_name: string
          is_current: boolean
          relevant_coursework: string | null
          sort_order: number
          start_month: number | null
          start_year: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          cv_id: string
          degree?: string | null
          end_month?: number | null
          end_year?: number | null
          field_of_study?: string | null
          gpa_scale?: number | null
          gpa_value?: number | null
          graduation_year?: number | null
          honors?: string | null
          id?: string
          institution_city?: string | null
          institution_country?: string | null
          institution_name: string
          is_current?: boolean
          relevant_coursework?: string | null
          sort_order?: number
          start_month?: number | null
          start_year?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          cv_id?: string
          degree?: string | null
          end_month?: number | null
          end_year?: number | null
          field_of_study?: string | null
          gpa_scale?: number | null
          gpa_value?: number | null
          graduation_year?: number | null
          honors?: string | null
          id?: string
          institution_city?: string | null
          institution_country?: string | null
          institution_name?: string
          is_current?: boolean
          relevant_coursework?: string | null
          sort_order?: number
          start_month?: number | null
          start_year?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cv_education_cv_id_fkey"
            columns: ["cv_id"]
            isOneToOne: false
            referencedRelation: "cvs"
            referencedColumns: ["id"]
          },
        ]
      }
      cv_experience: {
        Row: {
          bullets: string[]
          company_city: string | null
          company_country: string | null
          company_name: string
          created_at: string
          cv_id: string
          employment_type: string | null
          end_month: number | null
          end_year: number | null
          id: string
          is_current: boolean
          job_title: string
          location: string | null
          sort_order: number
          start_month: number | null
          start_year: number | null
          updated_at: string
        }
        Insert: {
          bullets?: string[]
          company_city?: string | null
          company_country?: string | null
          company_name: string
          created_at?: string
          cv_id: string
          employment_type?: string | null
          end_month?: number | null
          end_year?: number | null
          id?: string
          is_current?: boolean
          job_title: string
          location?: string | null
          sort_order?: number
          start_month?: number | null
          start_year?: number | null
          updated_at?: string
        }
        Update: {
          bullets?: string[]
          company_city?: string | null
          company_country?: string | null
          company_name?: string
          created_at?: string
          cv_id?: string
          employment_type?: string | null
          end_month?: number | null
          end_year?: number | null
          id?: string
          is_current?: boolean
          job_title?: string
          location?: string | null
          sort_order?: number
          start_month?: number | null
          start_year?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cv_experience_cv_id_fkey"
            columns: ["cv_id"]
            isOneToOne: false
            referencedRelation: "cvs"
            referencedColumns: ["id"]
          },
        ]
      }
      cv_generations: {
        Row: {
          completed_at: string | null
          created_at: string
          cv_id: string
          error_message: string | null
          id: string
          input_snapshot: Json
          model: string | null
          output_snapshot: Json | null
          prompt: string | null
          section: string
          status: Database["public"]["Enums"]["cv_generation_status_enum"]
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          cv_id: string
          error_message?: string | null
          id?: string
          input_snapshot?: Json
          model?: string | null
          output_snapshot?: Json | null
          prompt?: string | null
          section: string
          status?: Database["public"]["Enums"]["cv_generation_status_enum"]
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          cv_id?: string
          error_message?: string | null
          id?: string
          input_snapshot?: Json
          model?: string | null
          output_snapshot?: Json | null
          prompt?: string | null
          section?: string
          status?: Database["public"]["Enums"]["cv_generation_status_enum"]
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cv_generations_cv_id_fkey"
            columns: ["cv_id"]
            isOneToOne: false
            referencedRelation: "cvs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cv_generations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cv_generations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
        ]
      }
      cv_skills: {
        Row: {
          created_at: string
          cv_id: string
          id: string
          proficiency: string | null
          skill_name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          cv_id: string
          id?: string
          proficiency?: string | null
          skill_name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          cv_id?: string
          id?: string
          proficiency?: string | null
          skill_name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cv_skills_cv_id_fkey"
            columns: ["cv_id"]
            isOneToOne: false
            referencedRelation: "cvs"
            referencedColumns: ["id"]
          },
        ]
      }
      cvs: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          custom_link_1_label: string | null
          custom_link_1_url: string | null
          custom_link_2_label: string | null
          custom_link_2_url: string | null
          email: string | null
          full_name: string | null
          github_url: string | null
          id: string
          is_primary: boolean
          languages: Json
          linkedin_url: string | null
          locale: string
          phone: string | null
          portfolio_url: string | null
          status: Database["public"]["Enums"]["cv_status_enum"]
          summary: string | null
          technical_skills: Json
          template_key: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          custom_link_1_label?: string | null
          custom_link_1_url?: string | null
          custom_link_2_label?: string | null
          custom_link_2_url?: string | null
          email?: string | null
          full_name?: string | null
          github_url?: string | null
          id?: string
          is_primary?: boolean
          languages?: Json
          linkedin_url?: string | null
          locale?: string
          phone?: string | null
          portfolio_url?: string | null
          status?: Database["public"]["Enums"]["cv_status_enum"]
          summary?: string | null
          technical_skills?: Json
          template_key?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          custom_link_1_label?: string | null
          custom_link_1_url?: string | null
          custom_link_2_label?: string | null
          custom_link_2_url?: string | null
          email?: string | null
          full_name?: string | null
          github_url?: string | null
          id?: string
          is_primary?: boolean
          languages?: Json
          linkedin_url?: string | null
          locale?: string
          phone?: string | null
          portfolio_url?: string | null
          status?: Database["public"]["Enums"]["cv_status_enum"]
          summary?: string | null
          technical_skills?: Json
          template_key?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cvs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cvs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
        ]
      }
      digest_batches: {
        Row: {
          created_at: string
          digest_date: string
          error_message: string | null
          id: string
          metadata: Json
          notification_count: number
          recipient_id: string
          sent_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          digest_date: string
          error_message?: string | null
          id?: string
          metadata?: Json
          notification_count?: number
          recipient_id: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          digest_date?: string
          error_message?: string | null
          id?: string
          metadata?: Json
          notification_count?: number
          recipient_id?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: []
      }
      directory_candidate_facts: {
        Row: {
          assist_results: Json
          authority_level: string
          candidate_id: string
          confidence: string
          confidence_reason: string
          created_at: string
          effective_at: string | null
          evidence_id: string
          fact_key: string
          id: string
          normalized_value: Json | null
          observed_at: string
          original_value: Json | null
          provenance_url: string | null
          reviewer_attestation: string | null
          reviewer_edit_state: string
          reviewer_id: string | null
          source_field: string
          source_id: string
          state: string
          transformation: string
          updated_at: string
        }
        Insert: {
          assist_results?: Json
          authority_level: string
          candidate_id: string
          confidence: string
          confidence_reason: string
          created_at?: string
          effective_at?: string | null
          evidence_id: string
          fact_key: string
          id?: string
          normalized_value?: Json | null
          observed_at: string
          original_value?: Json | null
          provenance_url?: string | null
          reviewer_attestation?: string | null
          reviewer_edit_state?: string
          reviewer_id?: string | null
          source_field: string
          source_id: string
          state?: string
          transformation?: string
          updated_at?: string
        }
        Update: {
          assist_results?: Json
          authority_level?: string
          candidate_id?: string
          confidence?: string
          confidence_reason?: string
          created_at?: string
          effective_at?: string | null
          evidence_id?: string
          fact_key?: string
          id?: string
          normalized_value?: Json | null
          observed_at?: string
          original_value?: Json | null
          provenance_url?: string | null
          reviewer_attestation?: string | null
          reviewer_edit_state?: string
          reviewer_id?: string | null
          source_field?: string
          source_id?: string
          state?: string
          transformation?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "directory_candidate_facts_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "directory_import_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directory_candidate_facts_evidence_id_fkey"
            columns: ["evidence_id"]
            isOneToOne: false
            referencedRelation: "directory_raw_evidence"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directory_candidate_facts_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directory_candidate_facts_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
          {
            foreignKeyName: "directory_candidate_facts_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "directory_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      directory_correction_suggestions: {
        Row: {
          created_at: string
          current_value: string | null
          directory_id: string
          field_name: string
          id: string
          reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          suggested_by: string
          suggested_value: string
        }
        Insert: {
          created_at?: string
          current_value?: string | null
          directory_id: string
          field_name: string
          id?: string
          reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          suggested_by: string
          suggested_value: string
        }
        Update: {
          created_at?: string
          current_value?: string | null
          directory_id?: string
          field_name?: string
          id?: string
          reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          suggested_by?: string
          suggested_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "directory_correction_suggestions_directory_id_fkey"
            columns: ["directory_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      directory_dead_letters: {
        Row: {
          attributed_worker_identity: string
          created_at: string
          error_class: string
          id: string
          idempotency_key: string | null
          last_retry_at: string | null
          retry_count: number
          retry_state: string
          run_id: string | null
          sanitized_details: Json
          source_id: string | null
          source_record_key: string | null
          updated_at: string
        }
        Insert: {
          attributed_worker_identity: string
          created_at?: string
          error_class: string
          id?: string
          idempotency_key?: string | null
          last_retry_at?: string | null
          retry_count?: number
          retry_state?: string
          run_id?: string | null
          sanitized_details?: Json
          source_id?: string | null
          source_record_key?: string | null
          updated_at?: string
        }
        Update: {
          attributed_worker_identity?: string
          created_at?: string
          error_class?: string
          id?: string
          idempotency_key?: string | null
          last_retry_at?: string | null
          retry_count?: number
          retry_state?: string
          run_id?: string | null
          sanitized_details?: Json
          source_id?: string | null
          source_record_key?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "directory_dead_letters_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "directory_sync_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directory_dead_letters_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "directory_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      directory_import_candidates: {
        Row: {
          checksum_sha256: string
          conflict_state: string
          created_at: string
          deterministic_match_target: string | null
          evidence_id: string
          id: string
          idempotency_key: string
          lei: string | null
          match_outcome: string
          match_reasons: Json
          normalized_identity: string
          organization_type: string
          published_at: string | null
          published_directory_id: string | null
          registration_authority: string | null
          registration_identifier: string | null
          review_flags: string[]
          run_id: string
          source_entity_status: string | null
          source_id: string
          source_record_key: string
          source_registration_status: string | null
          state: string
          terminal_reason: string | null
          updated_at: string
          version: number
        }
        Insert: {
          checksum_sha256: string
          conflict_state?: string
          created_at?: string
          deterministic_match_target?: string | null
          evidence_id: string
          id?: string
          idempotency_key: string
          lei?: string | null
          match_outcome?: string
          match_reasons?: Json
          normalized_identity: string
          organization_type: string
          published_at?: string | null
          published_directory_id?: string | null
          registration_authority?: string | null
          registration_identifier?: string | null
          review_flags?: string[]
          run_id: string
          source_entity_status?: string | null
          source_id: string
          source_record_key: string
          source_registration_status?: string | null
          state?: string
          terminal_reason?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          checksum_sha256?: string
          conflict_state?: string
          created_at?: string
          deterministic_match_target?: string | null
          evidence_id?: string
          id?: string
          idempotency_key?: string
          lei?: string | null
          match_outcome?: string
          match_reasons?: Json
          normalized_identity?: string
          organization_type?: string
          published_at?: string | null
          published_directory_id?: string | null
          registration_authority?: string | null
          registration_identifier?: string | null
          review_flags?: string[]
          run_id?: string
          source_entity_status?: string | null
          source_id?: string
          source_record_key?: string
          source_registration_status?: string | null
          state?: string
          terminal_reason?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "directory_import_candidates_deterministic_match_target_fkey"
            columns: ["deterministic_match_target"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directory_import_candidates_evidence_id_fkey"
            columns: ["evidence_id"]
            isOneToOne: true
            referencedRelation: "directory_raw_evidence"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directory_import_candidates_published_directory_id_fkey"
            columns: ["published_directory_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directory_import_candidates_run_source_fkey"
            columns: ["source_id", "run_id"]
            isOneToOne: false
            referencedRelation: "directory_sync_runs"
            referencedColumns: ["source_id", "id"]
          },
          {
            foreignKeyName: "directory_import_candidates_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "directory_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      directory_raw_evidence: {
        Row: {
          audit_investigation: boolean
          checksum_sha256: string
          content_size_bytes: number
          content_type: string
          created_at: string
          deletion_eligible_at: string | null
          id: string
          legal_hold: boolean
          legal_hold_reason: string | null
          licence_reference: string
          parser_version: string
          payload_captured_at: string | null
          payload_deleted_at: string | null
          payload_deletion_reason: string | null
          personal_data_dominated: boolean
          private_locator: string | null
          retention_state: string
          retrieved_at: string
          run_id: string
          source_id: string
          source_payload: Json | null
          source_record_key: string
          updated_at: string
        }
        Insert: {
          audit_investigation?: boolean
          checksum_sha256: string
          content_size_bytes: number
          content_type: string
          created_at?: string
          deletion_eligible_at?: string | null
          id?: string
          legal_hold?: boolean
          legal_hold_reason?: string | null
          licence_reference: string
          parser_version: string
          payload_captured_at?: string | null
          payload_deleted_at?: string | null
          payload_deletion_reason?: string | null
          personal_data_dominated?: boolean
          private_locator?: string | null
          retention_state?: string
          retrieved_at: string
          run_id: string
          source_id: string
          source_payload?: Json | null
          source_record_key: string
          updated_at?: string
        }
        Update: {
          audit_investigation?: boolean
          checksum_sha256?: string
          content_size_bytes?: number
          content_type?: string
          created_at?: string
          deletion_eligible_at?: string | null
          id?: string
          legal_hold?: boolean
          legal_hold_reason?: string | null
          licence_reference?: string
          parser_version?: string
          payload_captured_at?: string | null
          payload_deleted_at?: string | null
          payload_deletion_reason?: string | null
          personal_data_dominated?: boolean
          private_locator?: string | null
          retention_state?: string
          retrieved_at?: string
          run_id?: string
          source_id?: string
          source_payload?: Json | null
          source_record_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "directory_raw_evidence_run_source_fkey"
            columns: ["source_id", "run_id"]
            isOneToOne: false
            referencedRelation: "directory_sync_runs"
            referencedColumns: ["source_id", "id"]
          },
          {
            foreignKeyName: "directory_raw_evidence_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "directory_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      directory_review_queue: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          candidate_id: string
          created_at: string
          decided_at: string | null
          decision: string | null
          id: string
          publication_company_id: string | null
          published_at: string | null
          return_reason: string | null
          returned_at: string | null
          review_notes: string | null
          reviewer_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          candidate_id: string
          created_at?: string
          decided_at?: string | null
          decision?: string | null
          id?: string
          publication_company_id?: string | null
          published_at?: string | null
          return_reason?: string | null
          returned_at?: string | null
          review_notes?: string | null
          reviewer_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          candidate_id?: string
          created_at?: string
          decided_at?: string | null
          decision?: string | null
          id?: string
          publication_company_id?: string | null
          published_at?: string | null
          return_reason?: string | null
          returned_at?: string | null
          review_notes?: string | null
          reviewer_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "directory_review_queue_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directory_review_queue_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
          {
            foreignKeyName: "directory_review_queue_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: true
            referencedRelation: "directory_import_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directory_review_queue_publication_company_id_fkey"
            columns: ["publication_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directory_review_queue_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directory_review_queue_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
        ]
      }
      directory_sources: {
        Row: {
          activated_at: string | null
          api_base_url: string | null
          connector_enabled: boolean
          connector_kind: string
          consecutive_failure_count: number
          created_at: string
          display_name: string
          health_state: string
          id: string
          last_successful_sync: string | null
          licence_reference: string
          lifecycle_state: string
          max_pages_per_run: number
          page_size: number
          parser_name: string
          parser_version: string
          permitted_fields: string[]
          program_scope: string
          qualification_state: string
          reference_url: string | null
          responsible_staff_id: string | null
          retention_override_days: number | null
          schedule_cron: string
          source_key: string
          suspended_at: string | null
          suspension_reason: string | null
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          api_base_url?: string | null
          connector_enabled?: boolean
          connector_kind?: string
          consecutive_failure_count?: number
          created_at?: string
          display_name: string
          health_state?: string
          id?: string
          last_successful_sync?: string | null
          licence_reference: string
          lifecycle_state?: string
          max_pages_per_run?: number
          page_size?: number
          parser_name: string
          parser_version: string
          permitted_fields?: string[]
          program_scope?: string
          qualification_state?: string
          reference_url?: string | null
          responsible_staff_id?: string | null
          retention_override_days?: number | null
          schedule_cron?: string
          source_key: string
          suspended_at?: string | null
          suspension_reason?: string | null
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          api_base_url?: string | null
          connector_enabled?: boolean
          connector_kind?: string
          consecutive_failure_count?: number
          created_at?: string
          display_name?: string
          health_state?: string
          id?: string
          last_successful_sync?: string | null
          licence_reference?: string
          lifecycle_state?: string
          max_pages_per_run?: number
          page_size?: number
          parser_name?: string
          parser_version?: string
          permitted_fields?: string[]
          program_scope?: string
          qualification_state?: string
          reference_url?: string | null
          responsible_staff_id?: string | null
          retention_override_days?: number | null
          schedule_cron?: string
          source_key?: string
          suspended_at?: string | null
          suspension_reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "directory_sources_responsible_staff_id_fkey"
            columns: ["responsible_staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directory_sources_responsible_staff_id_fkey"
            columns: ["responsible_staff_id"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
        ]
      }
      directory_sync_runs: {
        Row: {
          accepted_count: number
          checkpoint: Json
          completed_at: string | null
          created_at: string
          dead_letter_count: number
          external_run_id: string | null
          failure_class: string | null
          failure_detail: string | null
          heartbeat_at: string | null
          id: string
          mode: string
          page_count: number
          parser_version: string
          rejected_count: number
          retrieved_count: number
          retry_count: number
          skipped_count: number
          source_id: string
          started_at: string
          status: string
          updated_at: string
          worker_identity: string
        }
        Insert: {
          accepted_count?: number
          checkpoint?: Json
          completed_at?: string | null
          created_at?: string
          dead_letter_count?: number
          external_run_id?: string | null
          failure_class?: string | null
          failure_detail?: string | null
          heartbeat_at?: string | null
          id?: string
          mode: string
          page_count?: number
          parser_version: string
          rejected_count?: number
          retrieved_count?: number
          retry_count?: number
          skipped_count?: number
          source_id: string
          started_at?: string
          status?: string
          updated_at?: string
          worker_identity: string
        }
        Update: {
          accepted_count?: number
          checkpoint?: Json
          completed_at?: string | null
          created_at?: string
          dead_letter_count?: number
          external_run_id?: string | null
          failure_class?: string | null
          failure_detail?: string | null
          heartbeat_at?: string | null
          id?: string
          mode?: string
          page_count?: number
          parser_version?: string
          rejected_count?: number
          retrieved_count?: number
          retry_count?: number
          skipped_count?: number
          source_id?: string
          started_at?: string
          status?: string
          updated_at?: string
          worker_identity?: string
        }
        Relationships: [
          {
            foreignKeyName: "directory_sync_runs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "directory_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      email_bounces: {
        Row: {
          bounce_count: number
          bounce_type: string
          email: string
          first_bounced_at: string
          id: string
          last_bounced_at: string
          metadata: Json
        }
        Insert: {
          bounce_count?: number
          bounce_type: string
          email: string
          first_bounced_at?: string
          id?: string
          last_bounced_at?: string
          metadata?: Json
        }
        Update: {
          bounce_count?: number
          bounce_type?: string
          email?: string
          first_bounced_at?: string
          id?: string
          last_bounced_at?: string
          metadata?: Json
        }
        Relationships: []
      }
      email_outbox: {
        Row: {
          attempts: number
          created_at: string
          id: string
          last_error: string | null
          payload: Json
          sent_at: string | null
          status: string
          template: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          id?: string
          last_error?: string | null
          payload?: Json
          sent_at?: string | null
          status?: string
          template: string
        }
        Update: {
          attempts?: number
          created_at?: string
          id?: string
          last_error?: string | null
          payload?: Json
          sent_at?: string | null
          status?: string
          template?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          attempted_at: string | null
          category:
            | Database["public"]["Enums"]["notification_category_enum"]
            | null
          created_at: string
          error_message: string | null
          id: string
          metadata: Json
          notification_id: string | null
          provider_message_id: string | null
          recipient_email: string
          recipient_id: string
          sent_at: string | null
          status: Database["public"]["Enums"]["email_send_status_enum"]
        }
        Insert: {
          attempted_at?: string | null
          category?:
            | Database["public"]["Enums"]["notification_category_enum"]
            | null
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json
          notification_id?: string | null
          provider_message_id?: string | null
          recipient_email: string
          recipient_id: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_send_status_enum"]
        }
        Update: {
          attempted_at?: string | null
          category?:
            | Database["public"]["Enums"]["notification_category_enum"]
            | null
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json
          notification_id?: string | null
          provider_message_id?: string | null
          recipient_email?: string
          recipient_id?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_send_status_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "email_send_log_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      email_verification_attempts: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          ip_address: unknown
          is_verified: boolean
          otp_hash: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          ip_address?: unknown
          is_verified?: boolean
          otp_hash: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          ip_address?: unknown
          is_verified?: boolean
          otp_hash?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_verification_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_verification_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
        ]
      }
      emergency_actions: {
        Row: {
          action_type: string
          activated_at: string
          activated_by: string
          deactivated_at: string | null
          deactivated_by: string | null
          id: string
          is_active: boolean
          payload: Json
          reason: string
          reverted_at: string | null
          reverted_by: string | null
        }
        Insert: {
          action_type: string
          activated_at?: string
          activated_by: string
          deactivated_at?: string | null
          deactivated_by?: string | null
          id?: string
          is_active?: boolean
          payload?: Json
          reason: string
          reverted_at?: string | null
          reverted_by?: string | null
        }
        Update: {
          action_type?: string
          activated_at?: string
          activated_by?: string
          deactivated_at?: string | null
          deactivated_by?: string | null
          id?: string
          is_active?: boolean
          payload?: Json
          reason?: string
          reverted_at?: string | null
          reverted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_actions_activated_by_fkey"
            columns: ["activated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_actions_activated_by_fkey"
            columns: ["activated_by"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
          {
            foreignKeyName: "emergency_actions_deactivated_by_fkey"
            columns: ["deactivated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_actions_deactivated_by_fkey"
            columns: ["deactivated_by"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
          {
            foreignKeyName: "emergency_actions_reverted_by_fkey"
            columns: ["reverted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_actions_reverted_by_fkey"
            columns: ["reverted_by"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
        ]
      }
      entity_badges: {
        Row: {
          awarded_at: string
          badge_id: string
          entity_id: string
          entity_type: string
          expires_at: string | null
          id: string
          metadata: Json
        }
        Insert: {
          awarded_at?: string
          badge_id: string
          entity_id: string
          entity_type: string
          expires_at?: string | null
          id?: string
          metadata?: Json
        }
        Update: {
          awarded_at?: string
          badge_id?: string
          entity_id?: string
          entity_type?: string
          expires_at?: string | null
          id?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "entity_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_team_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          company_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invite_token: string
          invited_by: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          company_id: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invite_token: string
          invited_by: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          company_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invite_token?: string
          invited_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_team_invitations_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_team_invitations_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
          {
            foreignKeyName: "entity_team_invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_team_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_team_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          category: string
          created_at: string
          description: string | null
          description_ar: string | null
          description_en: string | null
          enabled_for_roles: Database["public"]["Enums"]["user_role_enum"][]
          is_enabled: boolean
          key: string
          label_ar: string | null
          label_en: string | null
          min_role: Database["public"]["Enums"]["user_role_enum"]
          updated_at: string
          updated_by: string | null
          user_overrides: Json
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          description_en?: string | null
          enabled_for_roles?: Database["public"]["Enums"]["user_role_enum"][]
          is_enabled?: boolean
          key: string
          label_ar?: string | null
          label_en?: string | null
          min_role?: Database["public"]["Enums"]["user_role_enum"]
          updated_at?: string
          updated_by?: string | null
          user_overrides?: Json
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          description_en?: string | null
          enabled_for_roles?: Database["public"]["Enums"]["user_role_enum"][]
          is_enabled?: boolean
          key?: string
          label_ar?: string | null
          label_en?: string | null
          min_role?: Database["public"]["Enums"]["user_role_enum"]
          updated_at?: string
          updated_by?: string | null
          user_overrides?: Json
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_flags_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
        ]
      }
      job_boost_daily_stats: {
        Row: {
          card_opens: number
          declarations: number
          impressions: number
          intent_clicks: number
          job_id: string
          stat_date: string
        }
        Insert: {
          card_opens?: number
          declarations?: number
          impressions?: number
          intent_clicks?: number
          job_id: string
          stat_date: string
        }
        Update: {
          card_opens?: number
          declarations?: number
          impressions?: number
          intent_clicks?: number
          job_id?: string
          stat_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_boost_daily_stats_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          applicant_count: number
          application_deadline: string | null
          boost_ends_at: string | null
          boost_starts_at: string | null
          business_profile_id: string
          city: string | null
          closed_at: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          description_ar: string | null
          description_en: string | null
          experience_level: Database["public"]["Enums"]["experience_level_enum"]
          external_apply_url: string | null
          id: string
          is_boosted: boolean
          is_remote: boolean
          published_at: string | null
          region_id: string | null
          required_skills: string[]
          salary_currency: string
          salary_max: number | null
          salary_min: number | null
          sector_id: string | null
          slug: string | null
          status: string
          tier: Database["public"]["Enums"]["opportunity_tier_enum"]
          title_ar: string
          title_en: string | null
          updated_at: string
          view_count: number
        }
        Insert: {
          applicant_count?: number
          application_deadline?: string | null
          boost_ends_at?: string | null
          boost_starts_at?: string | null
          business_profile_id: string
          city?: string | null
          closed_at?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          experience_level?: Database["public"]["Enums"]["experience_level_enum"]
          external_apply_url?: string | null
          id?: string
          is_boosted?: boolean
          is_remote?: boolean
          published_at?: string | null
          region_id?: string | null
          required_skills?: string[]
          salary_currency?: string
          salary_max?: number | null
          salary_min?: number | null
          sector_id?: string | null
          slug?: string | null
          status?: string
          tier?: Database["public"]["Enums"]["opportunity_tier_enum"]
          title_ar?: string
          title_en?: string | null
          updated_at?: string
          view_count?: number
        }
        Update: {
          applicant_count?: number
          application_deadline?: string | null
          boost_ends_at?: string | null
          boost_starts_at?: string | null
          business_profile_id?: string
          city?: string | null
          closed_at?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          experience_level?: Database["public"]["Enums"]["experience_level_enum"]
          external_apply_url?: string | null
          id?: string
          is_boosted?: boolean
          is_remote?: boolean
          published_at?: string | null
          region_id?: string | null
          required_skills?: string[]
          salary_currency?: string
          salary_max?: number | null
          salary_min?: number | null
          sector_id?: string | null
          slug?: string | null
          status?: string
          tier?: Database["public"]["Enums"]["opportunity_tier_enum"]
          title_ar?: string
          title_en?: string | null
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "jobs_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
          {
            foreignKeyName: "jobs_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sector_demand_snapshot"
            referencedColumns: ["sector_id"]
          },
          {
            foreignKeyName: "jobs_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      lammah_candidate_facts: {
        Row: {
          active: boolean
          candidate_id: string
          confidence: number
          confidence_reason_ar: string
          confidence_reason_en: string
          created_at: string
          evidence_id: string
          extraction_method: string
          fact_key: string
          id: string
          normalized_value: Json | null
          original_value: Json
          parser_model_version: string
          retrieved_at: string
          review_state: string
          reviewed_at: string | null
          reviewer_edit: Json | null
          reviewer_id: string | null
          source_id: string
          source_record_id: string
          source_url: string
          transformation_history: Json
          updated_at: string
        }
        Insert: {
          active?: boolean
          candidate_id: string
          confidence: number
          confidence_reason_ar: string
          confidence_reason_en: string
          created_at?: string
          evidence_id: string
          extraction_method: string
          fact_key: string
          id?: string
          normalized_value?: Json | null
          original_value: Json
          parser_model_version: string
          retrieved_at: string
          review_state?: string
          reviewed_at?: string | null
          reviewer_edit?: Json | null
          reviewer_id?: string | null
          source_id: string
          source_record_id: string
          source_url: string
          transformation_history?: Json
          updated_at?: string
        }
        Update: {
          active?: boolean
          candidate_id?: string
          confidence?: number
          confidence_reason_ar?: string
          confidence_reason_en?: string
          created_at?: string
          evidence_id?: string
          extraction_method?: string
          fact_key?: string
          id?: string
          normalized_value?: Json | null
          original_value?: Json
          parser_model_version?: string
          retrieved_at?: string
          review_state?: string
          reviewed_at?: string | null
          reviewer_edit?: Json | null
          reviewer_id?: string | null
          source_id?: string
          source_record_id?: string
          source_url?: string
          transformation_history?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lammah_candidate_facts_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "lammah_import_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lammah_candidate_facts_evidence_id_fkey"
            columns: ["evidence_id"]
            isOneToOne: false
            referencedRelation: "lammah_raw_evidence"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lammah_candidate_facts_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lammah_candidate_facts_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
          {
            foreignKeyName: "lammah_candidate_facts_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "lammah_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      lammah_dead_letters: {
        Row: {
          attempts: number
          attributed_worker_identity: string
          closed_reason: string | null
          created_at: string
          error_class: string
          evidence_id: string | null
          id: string
          idempotency_key: string | null
          next_retry_at: string | null
          retry_state: string
          run_id: string | null
          sanitized_details: Json
          source_id: string
          source_record_id: string | null
          updated_at: string
        }
        Insert: {
          attempts?: number
          attributed_worker_identity: string
          closed_reason?: string | null
          created_at?: string
          error_class: string
          evidence_id?: string | null
          id?: string
          idempotency_key?: string | null
          next_retry_at?: string | null
          retry_state?: string
          run_id?: string | null
          sanitized_details?: Json
          source_id: string
          source_record_id?: string | null
          updated_at?: string
        }
        Update: {
          attempts?: number
          attributed_worker_identity?: string
          closed_reason?: string | null
          created_at?: string
          error_class?: string
          evidence_id?: string | null
          id?: string
          idempotency_key?: string | null
          next_retry_at?: string | null
          retry_state?: string
          run_id?: string | null
          sanitized_details?: Json
          source_id?: string
          source_record_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lammah_dead_letters_evidence_id_fkey"
            columns: ["evidence_id"]
            isOneToOne: false
            referencedRelation: "lammah_raw_evidence"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lammah_dead_letters_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "lammah_sync_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lammah_dead_letters_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "lammah_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      lammah_duplicate_candidates: {
        Row: {
          candidate_id: string
          created_at: string
          deterministic: boolean
          id: string
          outcome: string
          possible_candidate_id: string | null
          possible_opportunity_id: string | null
          reasons: Json
          resolved_at: string | null
          resolved_by: string | null
        }
        Insert: {
          candidate_id: string
          created_at?: string
          deterministic?: boolean
          id?: string
          outcome: string
          possible_candidate_id?: string | null
          possible_opportunity_id?: string | null
          reasons: Json
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Update: {
          candidate_id?: string
          created_at?: string
          deterministic?: boolean
          id?: string
          outcome?: string
          possible_candidate_id?: string | null
          possible_opportunity_id?: string | null
          reasons?: Json
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lammah_duplicate_candidates_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "lammah_import_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lammah_duplicate_candidates_possible_candidate_id_fkey"
            columns: ["possible_candidate_id"]
            isOneToOne: false
            referencedRelation: "lammah_import_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lammah_duplicate_candidates_possible_opportunity_id_fkey"
            columns: ["possible_opportunity_id"]
            isOneToOne: false
            referencedRelation: "lammah_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lammah_duplicate_candidates_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lammah_duplicate_candidates_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
        ]
      }
      lammah_import_candidates: {
        Row: {
          apply_url: string
          apply_url_validated_at: string | null
          assigned_at: string | null
          assigned_to: string | null
          auto_gate_checklist: Json | null
          checksum_sha256: string
          created_at: string
          decided_at: string | null
          decision_by: string | null
          decision_notes: string | null
          description_excerpt: string | null
          eligibility_summary: string | null
          evidence_id: string
          experience_level:
            | Database["public"]["Enums"]["experience_level_enum"]
            | null
          final_apply_url: string | null
          first_seen_at: string
          id: string
          idempotency_key: string
          last_seen_at: string
          location_city: string | null
          location_country: string | null
          location_region: string | null
          match_outcome: string
          match_reasons: Json
          normalized_organization: string | null
          normalized_title: string | null
          opportunity_type: Database["public"]["Enums"]["lammah_opportunity_type_enum"]
          organization_raw_name: string
          ownership_type: Database["public"]["Enums"]["ownership_enum"] | null
          predecessor_candidate_id: string | null
          published_opportunity_id: string | null
          resolved_company_id: string | null
          review_flags: string[]
          run_id: string
          sector: string | null
          source_deadline_at: string | null
          source_id: string
          source_opening_at: string | null
          source_page_url: string
          source_published_at: string | null
          source_record_id: string
          state: string
          title_ar: string | null
          title_en: string | null
          title_original: string
          updated_at: string
          url_validation_evidence: Json
          work_mode: string | null
        }
        Insert: {
          apply_url: string
          apply_url_validated_at?: string | null
          assigned_at?: string | null
          assigned_to?: string | null
          auto_gate_checklist?: Json | null
          checksum_sha256: string
          created_at?: string
          decided_at?: string | null
          decision_by?: string | null
          decision_notes?: string | null
          description_excerpt?: string | null
          eligibility_summary?: string | null
          evidence_id: string
          experience_level?:
            | Database["public"]["Enums"]["experience_level_enum"]
            | null
          final_apply_url?: string | null
          first_seen_at?: string
          id?: string
          idempotency_key: string
          last_seen_at?: string
          location_city?: string | null
          location_country?: string | null
          location_region?: string | null
          match_outcome?: string
          match_reasons?: Json
          normalized_organization?: string | null
          normalized_title?: string | null
          opportunity_type: Database["public"]["Enums"]["lammah_opportunity_type_enum"]
          organization_raw_name: string
          ownership_type?: Database["public"]["Enums"]["ownership_enum"] | null
          predecessor_candidate_id?: string | null
          published_opportunity_id?: string | null
          resolved_company_id?: string | null
          review_flags?: string[]
          run_id: string
          sector?: string | null
          source_deadline_at?: string | null
          source_id: string
          source_opening_at?: string | null
          source_page_url: string
          source_published_at?: string | null
          source_record_id: string
          state?: string
          title_ar?: string | null
          title_en?: string | null
          title_original: string
          updated_at?: string
          url_validation_evidence?: Json
          work_mode?: string | null
        }
        Update: {
          apply_url?: string
          apply_url_validated_at?: string | null
          assigned_at?: string | null
          assigned_to?: string | null
          auto_gate_checklist?: Json | null
          checksum_sha256?: string
          created_at?: string
          decided_at?: string | null
          decision_by?: string | null
          decision_notes?: string | null
          description_excerpt?: string | null
          eligibility_summary?: string | null
          evidence_id?: string
          experience_level?:
            | Database["public"]["Enums"]["experience_level_enum"]
            | null
          final_apply_url?: string | null
          first_seen_at?: string
          id?: string
          idempotency_key?: string
          last_seen_at?: string
          location_city?: string | null
          location_country?: string | null
          location_region?: string | null
          match_outcome?: string
          match_reasons?: Json
          normalized_organization?: string | null
          normalized_title?: string | null
          opportunity_type?: Database["public"]["Enums"]["lammah_opportunity_type_enum"]
          organization_raw_name?: string
          ownership_type?: Database["public"]["Enums"]["ownership_enum"] | null
          predecessor_candidate_id?: string | null
          published_opportunity_id?: string | null
          resolved_company_id?: string | null
          review_flags?: string[]
          run_id?: string
          sector?: string | null
          source_deadline_at?: string | null
          source_id?: string
          source_opening_at?: string | null
          source_page_url?: string
          source_published_at?: string | null
          source_record_id?: string
          state?: string
          title_ar?: string | null
          title_en?: string | null
          title_original?: string
          updated_at?: string
          url_validation_evidence?: Json
          work_mode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lammah_import_candidates_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lammah_import_candidates_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
          {
            foreignKeyName: "lammah_import_candidates_decision_by_fkey"
            columns: ["decision_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lammah_import_candidates_decision_by_fkey"
            columns: ["decision_by"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
          {
            foreignKeyName: "lammah_import_candidates_evidence_id_fkey"
            columns: ["evidence_id"]
            isOneToOne: false
            referencedRelation: "lammah_raw_evidence"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lammah_import_candidates_predecessor_candidate_id_fkey"
            columns: ["predecessor_candidate_id"]
            isOneToOne: false
            referencedRelation: "lammah_import_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lammah_import_candidates_published_opportunity_id_fkey"
            columns: ["published_opportunity_id"]
            isOneToOne: false
            referencedRelation: "lammah_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lammah_import_candidates_resolved_company_id_fkey"
            columns: ["resolved_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lammah_import_candidates_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "lammah_sync_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lammah_import_candidates_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "lammah_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      lammah_lifecycle_events: {
        Row: {
          actor_id: string | null
          actor_kind: string
          candidate_id: string | null
          created_at: string
          details: Json
          event_type: string
          id: string
          opportunity_id: string | null
          reason: string | null
          run_id: string | null
          source_id: string | null
        }
        Insert: {
          actor_id?: string | null
          actor_kind: string
          candidate_id?: string | null
          created_at?: string
          details?: Json
          event_type: string
          id?: string
          opportunity_id?: string | null
          reason?: string | null
          run_id?: string | null
          source_id?: string | null
        }
        Update: {
          actor_id?: string | null
          actor_kind?: string
          candidate_id?: string | null
          created_at?: string
          details?: Json
          event_type?: string
          id?: string
          opportunity_id?: string | null
          reason?: string | null
          run_id?: string | null
          source_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lammah_lifecycle_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lammah_lifecycle_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
          {
            foreignKeyName: "lammah_lifecycle_events_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "lammah_import_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lammah_lifecycle_events_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "lammah_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lammah_lifecycle_events_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "lammah_sync_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lammah_lifecycle_events_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "lammah_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      lammah_native_match_events: {
        Row: {
          candidate_id: string | null
          created_at: string
          deterministic: boolean
          id: string
          native_job_id: string
          opportunity_id: string | null
          outcome: string
          reasons: Json
        }
        Insert: {
          candidate_id?: string | null
          created_at?: string
          deterministic: boolean
          id?: string
          native_job_id: string
          opportunity_id?: string | null
          outcome: string
          reasons: Json
        }
        Update: {
          candidate_id?: string | null
          created_at?: string
          deterministic?: boolean
          id?: string
          native_job_id?: string
          opportunity_id?: string | null
          outcome?: string
          reasons?: Json
        }
        Relationships: [
          {
            foreignKeyName: "lammah_native_match_events_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "lammah_import_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lammah_native_match_events_native_job_id_fkey"
            columns: ["native_job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lammah_native_match_events_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "lammah_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      lammah_opportunities: {
        Row: {
          company_id: string | null
          company_name_raw: string
          created_at: string
          excerpt: string | null
          experience_level:
            | Database["public"]["Enums"]["experience_level_enum"]
            | null
          expires_at: string | null
          external_ref_hash: string
          external_url: string
          extraction_confidence: number
          first_retrieved_at: string
          hidden_by: string | null
          hidden_reason: string | null
          id: string
          last_confirmed_at: string
          location_city: string | null
          location_country: string | null
          opportunity_type: Database["public"]["Enums"]["lammah_opportunity_type_enum"]
          ownership_type: Database["public"]["Enums"]["ownership_enum"] | null
          publication_candidate_id: string | null
          region: string | null
          scraped_at: string
          sector: string | null
          source_id: string
          source_name: string
          source_published_at: string | null
          source_removed_scan_count: number
          status: Database["public"]["Enums"]["lammah_status_enum"]
          superseded_by_job_id: string | null
          title_ar: string | null
          title_en: string | null
          translation_attribution: string | null
        }
        Insert: {
          company_id?: string | null
          company_name_raw: string
          created_at?: string
          excerpt?: string | null
          experience_level?:
            | Database["public"]["Enums"]["experience_level_enum"]
            | null
          expires_at?: string | null
          external_ref_hash: string
          external_url: string
          extraction_confidence?: number
          first_retrieved_at?: string
          hidden_by?: string | null
          hidden_reason?: string | null
          id?: string
          last_confirmed_at?: string
          location_city?: string | null
          location_country?: string | null
          opportunity_type?: Database["public"]["Enums"]["lammah_opportunity_type_enum"]
          ownership_type?: Database["public"]["Enums"]["ownership_enum"] | null
          publication_candidate_id?: string | null
          region?: string | null
          scraped_at?: string
          sector?: string | null
          source_id: string
          source_name: string
          source_published_at?: string | null
          source_removed_scan_count?: number
          status?: Database["public"]["Enums"]["lammah_status_enum"]
          superseded_by_job_id?: string | null
          title_ar?: string | null
          title_en?: string | null
          translation_attribution?: string | null
        }
        Update: {
          company_id?: string | null
          company_name_raw?: string
          created_at?: string
          excerpt?: string | null
          experience_level?:
            | Database["public"]["Enums"]["experience_level_enum"]
            | null
          expires_at?: string | null
          external_ref_hash?: string
          external_url?: string
          extraction_confidence?: number
          first_retrieved_at?: string
          hidden_by?: string | null
          hidden_reason?: string | null
          id?: string
          last_confirmed_at?: string
          location_city?: string | null
          location_country?: string | null
          opportunity_type?: Database["public"]["Enums"]["lammah_opportunity_type_enum"]
          ownership_type?: Database["public"]["Enums"]["ownership_enum"] | null
          publication_candidate_id?: string | null
          region?: string | null
          scraped_at?: string
          sector?: string | null
          source_id?: string
          source_name?: string
          source_published_at?: string | null
          source_removed_scan_count?: number
          status?: Database["public"]["Enums"]["lammah_status_enum"]
          superseded_by_job_id?: string | null
          title_ar?: string | null
          title_en?: string | null
          translation_attribution?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lammah_opportunities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lammah_opportunities_publication_candidate_fkey"
            columns: ["publication_candidate_id"]
            isOneToOne: false
            referencedRelation: "lammah_import_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lammah_opportunities_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "lammah_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lammah_opportunities_superseded_by_job_id_fkey"
            columns: ["superseded_by_job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      lammah_opportunity_facts: {
        Row: {
          active: boolean
          candidate_fact_id: string
          candidate_id: string
          created_at: string
          fact_key: string
          id: string
          opportunity_id: string
          provenance_snapshot: Json
          published_value: Json
          superseded_at: string | null
        }
        Insert: {
          active?: boolean
          candidate_fact_id: string
          candidate_id: string
          created_at?: string
          fact_key: string
          id?: string
          opportunity_id: string
          provenance_snapshot: Json
          published_value: Json
          superseded_at?: string | null
        }
        Update: {
          active?: boolean
          candidate_fact_id?: string
          candidate_id?: string
          created_at?: string
          fact_key?: string
          id?: string
          opportunity_id?: string
          provenance_snapshot?: Json
          published_value?: Json
          superseded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lammah_opportunity_facts_candidate_fact_id_fkey"
            columns: ["candidate_fact_id"]
            isOneToOne: false
            referencedRelation: "lammah_candidate_facts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lammah_opportunity_facts_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "lammah_import_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lammah_opportunity_facts_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "lammah_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      lammah_org_mapping_queue: {
        Row: {
          candidate_id: string
          created_at: string
          id: string
          locality: string | null
          raw_name: string
          resolved_at: string | null
          resolved_by: string | null
          resolved_company_id: string | null
          state: string
          suggested_company_id: string | null
          suggestion_basis: Json
        }
        Insert: {
          candidate_id: string
          created_at?: string
          id?: string
          locality?: string | null
          raw_name: string
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_company_id?: string | null
          state?: string
          suggested_company_id?: string | null
          suggestion_basis?: Json
        }
        Update: {
          candidate_id?: string
          created_at?: string
          id?: string
          locality?: string | null
          raw_name?: string
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_company_id?: string | null
          state?: string
          suggested_company_id?: string | null
          suggestion_basis?: Json
        }
        Relationships: [
          {
            foreignKeyName: "lammah_org_mapping_queue_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: true
            referencedRelation: "lammah_import_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lammah_org_mapping_queue_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lammah_org_mapping_queue_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
          {
            foreignKeyName: "lammah_org_mapping_queue_resolved_company_id_fkey"
            columns: ["resolved_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lammah_org_mapping_queue_suggested_company_id_fkey"
            columns: ["suggested_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      lammah_radar_items: {
        Row: {
          created_at: string
          declared_at: string | null
          id: string
          lammah_id: string
          self_declared: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          declared_at?: string | null
          id?: string
          lammah_id: string
          self_declared?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          declared_at?: string | null
          id?: string
          lammah_id?: string
          self_declared?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lammah_radar_items_lammah_id_fkey"
            columns: ["lammah_id"]
            isOneToOne: false
            referencedRelation: "lammah_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      lammah_raw_evidence: {
        Row: {
          checksum_sha256: string
          content_size_bytes: number
          content_type: string
          created_at: string
          deletion_eligible_at: string | null
          final_destination: string | null
          id: string
          legal_hold: boolean
          legal_hold_reason: string | null
          parser_version: string
          payload_body: string | null
          payload_deleted_at: string | null
          payload_deletion_reason: string | null
          personal_data_dominated: boolean
          private_locator: string | null
          redirect_chain: Json
          request_identity: string
          retention_state: string
          retrieved_at: string
          run_id: string
          sanitized_projection: Json
          source_id: string
          source_record_id: string
          source_url: string
        }
        Insert: {
          checksum_sha256: string
          content_size_bytes: number
          content_type: string
          created_at?: string
          deletion_eligible_at?: string | null
          final_destination?: string | null
          id?: string
          legal_hold?: boolean
          legal_hold_reason?: string | null
          parser_version: string
          payload_body?: string | null
          payload_deleted_at?: string | null
          payload_deletion_reason?: string | null
          personal_data_dominated?: boolean
          private_locator?: string | null
          redirect_chain?: Json
          request_identity: string
          retention_state?: string
          retrieved_at: string
          run_id: string
          sanitized_projection?: Json
          source_id: string
          source_record_id: string
          source_url: string
        }
        Update: {
          checksum_sha256?: string
          content_size_bytes?: number
          content_type?: string
          created_at?: string
          deletion_eligible_at?: string | null
          final_destination?: string | null
          id?: string
          legal_hold?: boolean
          legal_hold_reason?: string | null
          parser_version?: string
          payload_body?: string | null
          payload_deleted_at?: string | null
          payload_deletion_reason?: string | null
          personal_data_dominated?: boolean
          private_locator?: string | null
          redirect_chain?: Json
          request_identity?: string
          retention_state?: string
          retrieved_at?: string
          run_id?: string
          sanitized_projection?: Json
          source_id?: string
          source_record_id?: string
          source_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "lammah_raw_evidence_run_source_fkey"
            columns: ["source_id", "run_id"]
            isOneToOne: false
            referencedRelation: "lammah_sync_runs"
            referencedColumns: ["source_id", "id"]
          },
          {
            foreignKeyName: "lammah_raw_evidence_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "lammah_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      lammah_review_queue: {
        Row: {
          assigned_to: string | null
          candidate_id: string
          closed_at: string | null
          created_at: string
          decision: string | null
          id: string
          priority: number
          queue_state: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          candidate_id: string
          closed_at?: string | null
          created_at?: string
          decision?: string | null
          id?: string
          priority?: number
          queue_state?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          candidate_id?: string
          closed_at?: string | null
          created_at?: string
          decision?: string | null
          id?: string
          priority?: number
          queue_state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lammah_review_queue_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lammah_review_queue_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
          {
            foreignKeyName: "lammah_review_queue_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: true
            referencedRelation: "lammah_import_candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      lammah_source_links: {
        Row: {
          active: boolean
          candidate_id: string
          created_at: string
          final_apply_url: string
          first_seen_at: string
          id: string
          last_seen_at: string
          opportunity_id: string
          source_id: string
          source_page_url: string
          source_record_id: string
        }
        Insert: {
          active?: boolean
          candidate_id: string
          created_at?: string
          final_apply_url: string
          first_seen_at: string
          id?: string
          last_seen_at: string
          opportunity_id: string
          source_id: string
          source_page_url: string
          source_record_id: string
        }
        Update: {
          active?: boolean
          candidate_id?: string
          created_at?: string
          final_apply_url?: string
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          opportunity_id?: string
          source_id?: string
          source_page_url?: string
          source_record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lammah_source_links_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "lammah_import_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lammah_source_links_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "lammah_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lammah_source_links_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "lammah_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      lammah_sources: {
        Row: {
          allowed_apply_hosts: string[]
          apply_url_pattern: string | null
          approval_state: string
          approved_at: string | null
          authoritative_fields: string[]
          auto_publication_enabled: boolean
          base_url: string
          company_id: string | null
          confidence_policy: Json
          consecutive_failures: number
          crawl_frequency_hours: number
          created_at: string
          created_by: string | null
          evidence_retention_terms: string | null
          health_state: string
          id: string
          is_active: boolean
          last_content_hash: string | null
          last_crawled_at: string | null
          last_failure_at: string | null
          last_success_at: string | null
          licence_basis: string | null
          name: string
          parser_name: string | null
          parser_version: string | null
          program_scope: string
          qualification_reviewer: string | null
          rate_limit_policy: Json
          record_identity_strategy: string | null
          robots_ok: boolean
          robots_review_result: string | null
          robots_reviewed_at: string | null
          robots_url: string | null
          source_key: string
          source_type: string
          staff_owner_id: string | null
          supported_opportunity_types: Database["public"]["Enums"]["lammah_opportunity_type_enum"][]
          suspended_at: string | null
          suspension_reason: string | null
          technical_format: string | null
          terms_reviewed_at: string | null
          terms_url: string | null
          trust_tier: number
          updated_at: string
        }
        Insert: {
          allowed_apply_hosts?: string[]
          apply_url_pattern?: string | null
          approval_state?: string
          approved_at?: string | null
          authoritative_fields?: string[]
          auto_publication_enabled?: boolean
          base_url: string
          company_id?: string | null
          confidence_policy?: Json
          consecutive_failures?: number
          crawl_frequency_hours?: number
          created_at?: string
          created_by?: string | null
          evidence_retention_terms?: string | null
          health_state?: string
          id?: string
          is_active?: boolean
          last_content_hash?: string | null
          last_crawled_at?: string | null
          last_failure_at?: string | null
          last_success_at?: string | null
          licence_basis?: string | null
          name: string
          parser_name?: string | null
          parser_version?: string | null
          program_scope?: string
          qualification_reviewer?: string | null
          rate_limit_policy?: Json
          record_identity_strategy?: string | null
          robots_ok?: boolean
          robots_review_result?: string | null
          robots_reviewed_at?: string | null
          robots_url?: string | null
          source_key: string
          source_type: string
          staff_owner_id?: string | null
          supported_opportunity_types?: Database["public"]["Enums"]["lammah_opportunity_type_enum"][]
          suspended_at?: string | null
          suspension_reason?: string | null
          technical_format?: string | null
          terms_reviewed_at?: string | null
          terms_url?: string | null
          trust_tier: number
          updated_at?: string
        }
        Update: {
          allowed_apply_hosts?: string[]
          apply_url_pattern?: string | null
          approval_state?: string
          approved_at?: string | null
          authoritative_fields?: string[]
          auto_publication_enabled?: boolean
          base_url?: string
          company_id?: string | null
          confidence_policy?: Json
          consecutive_failures?: number
          crawl_frequency_hours?: number
          created_at?: string
          created_by?: string | null
          evidence_retention_terms?: string | null
          health_state?: string
          id?: string
          is_active?: boolean
          last_content_hash?: string | null
          last_crawled_at?: string | null
          last_failure_at?: string | null
          last_success_at?: string | null
          licence_basis?: string | null
          name?: string
          parser_name?: string | null
          parser_version?: string | null
          program_scope?: string
          qualification_reviewer?: string | null
          rate_limit_policy?: Json
          record_identity_strategy?: string | null
          robots_ok?: boolean
          robots_review_result?: string | null
          robots_reviewed_at?: string | null
          robots_url?: string | null
          source_key?: string
          source_type?: string
          staff_owner_id?: string | null
          supported_opportunity_types?: Database["public"]["Enums"]["lammah_opportunity_type_enum"][]
          suspended_at?: string | null
          suspension_reason?: string | null
          technical_format?: string | null
          terms_reviewed_at?: string | null
          terms_url?: string | null
          trust_tier?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lammah_sources_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lammah_sources_staff_owner_id_fkey"
            columns: ["staff_owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lammah_sources_staff_owner_id_fkey"
            columns: ["staff_owner_id"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
        ]
      }
      lammah_sync_runs: {
        Row: {
          accepted_count: number
          checkpoint: Json
          completed_at: string | null
          created_at: string
          dead_letter_count: number
          external_run_id: string
          failure_class: string | null
          failure_detail: string | null
          heartbeat_at: string
          id: string
          mode: string
          page_count: number
          parser_version: string
          published_count: number
          rejected_count: number
          replayed_count: number
          retrieved_count: number
          retry_count: number
          review_count: number
          source_id: string
          started_at: string
          status: string
          updated_at: string
          worker_identity: string
        }
        Insert: {
          accepted_count?: number
          checkpoint?: Json
          completed_at?: string | null
          created_at?: string
          dead_letter_count?: number
          external_run_id: string
          failure_class?: string | null
          failure_detail?: string | null
          heartbeat_at?: string
          id?: string
          mode?: string
          page_count?: number
          parser_version: string
          published_count?: number
          rejected_count?: number
          replayed_count?: number
          retrieved_count?: number
          retry_count?: number
          review_count?: number
          source_id: string
          started_at?: string
          status?: string
          updated_at?: string
          worker_identity: string
        }
        Update: {
          accepted_count?: number
          checkpoint?: Json
          completed_at?: string | null
          created_at?: string
          dead_letter_count?: number
          external_run_id?: string
          failure_class?: string | null
          failure_detail?: string | null
          heartbeat_at?: string
          id?: string
          mode?: string
          page_count?: number
          parser_version?: string
          published_count?: number
          rejected_count?: number
          replayed_count?: number
          retrieved_count?: number
          retry_count?: number
          review_count?: number
          source_id?: string
          started_at?: string
          status?: string
          updated_at?: string
          worker_identity?: string
        }
        Relationships: [
          {
            foreignKeyName: "lammah_sync_runs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "lammah_sources"
            referencedColumns: ["id"]
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
          status: Database["public"]["Enums"]["link_status_enum"]
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
          status?: Database["public"]["Enums"]["link_status_enum"]
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
          status?: Database["public"]["Enums"]["link_status_enum"]
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "link_audit_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      majors_catalog: {
        Row: {
          cip_code: string | null
          college_id: string
          created_at: string
          id: string
          is_active: boolean
          name_ar: string
          name_en: string
          slug: string
          updated_at: string
        }
        Insert: {
          cip_code?: string | null
          college_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name_ar: string
          name_en: string
          slug: string
          updated_at?: string
        }
        Update: {
          cip_code?: string | null
          college_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "majors_catalog_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges_catalog"
            referencedColumns: ["id"]
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
          status: Database["public"]["Enums"]["mentor_notification_status_enum"]
        }
        Insert: {
          created_at?: string
          desired_filters?: Json | null
          id?: string
          mentor_id?: string | null
          notified_at?: string | null
          requester_id: string
          status?: Database["public"]["Enums"]["mentor_notification_status_enum"]
        }
        Update: {
          created_at?: string
          desired_filters?: Json | null
          id?: string
          mentor_id?: string | null
          notified_at?: string | null
          requester_id?: string
          status?: Database["public"]["Enums"]["mentor_notification_status_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "mentor_notification_requests_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_notification_requests_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
          {
            foreignKeyName: "mentor_notification_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_notification_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
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
          languages: string[]
          linkedin_url: string | null
          max_active_mentees: number
          mentor_score: number | null
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
          languages?: string[]
          linkedin_url?: string | null
          max_active_mentees?: number
          mentor_score?: number | null
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
          languages?: string[]
          linkedin_url?: string | null
          max_active_mentees?: number
          mentor_score?: number | null
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
            foreignKeyName: "mentor_profiles_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_profiles_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
          {
            foreignKeyName: "mentor_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
        ]
      }
      mentor_reviews: {
        Row: {
          created_at: string
          id: string
          meeting_id: string
          mentor_id: string
          rating: number
          review_text: string | null
          reviewer_id: string
          visibility: Database["public"]["Enums"]["review_visibility_enum"]
        }
        Insert: {
          created_at?: string
          id?: string
          meeting_id: string
          mentor_id: string
          rating: number
          review_text?: string | null
          reviewer_id: string
          visibility?: Database["public"]["Enums"]["review_visibility_enum"]
        }
        Update: {
          created_at?: string
          id?: string
          meeting_id?: string
          mentor_id?: string
          rating?: number
          review_text?: string | null
          reviewer_id?: string
          visibility?: Database["public"]["Enums"]["review_visibility_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "mentor_reviews_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "mentorship_meetings"
            referencedColumns: ["id"]
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
          status: Database["public"]["Enums"]["mentor_workshop_status_enum"]
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
          status?: Database["public"]["Enums"]["mentor_workshop_status_enum"]
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
          status?: Database["public"]["Enums"]["mentor_workshop_status_enum"]
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_workshops_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_workshops_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
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
          feedback_dismissed_at: string | null
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
          feedback_dismissed_at?: string | null
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
          feedback_dismissed_at?: string | null
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
            foreignKeyName: "mentorship_meetings_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentorship_meetings_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
          {
            foreignKeyName: "mentorship_meetings_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentorship_meetings_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
          {
            foreignKeyName: "mentorship_meetings_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "mentorship_requests"
            referencedColumns: ["id"]
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
          status: Database["public"]["Enums"]["mentorship_request_status_enum"]
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
          status?: Database["public"]["Enums"]["mentorship_request_status_enum"]
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
          status?: Database["public"]["Enums"]["mentorship_request_status_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentorship_requests_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentorship_requests_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentorship_requests_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
          {
            foreignKeyName: "mentorship_requests_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentorship_requests_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
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
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "mentorship_meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
        ]
      }
      metric_thresholds: {
        Row: {
          current_value: number
          is_met: boolean | null
          label_ar: string
          label_en: string
          metric_key: string
          min_value: number
          updated_at: string
        }
        Insert: {
          current_value?: number
          is_met?: boolean | null
          label_ar: string
          label_en: string
          metric_key: string
          min_value: number
          updated_at?: string
        }
        Update: {
          current_value?: number
          is_met?: boolean | null
          label_ar?: string
          label_en?: string
          metric_key?: string
          min_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          category: Database["public"]["Enums"]["notification_category_enum"]
          email_enabled: boolean
          in_app_enabled: boolean
          include_in_digest: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["notification_category_enum"]
          email_enabled?: boolean
          in_app_enabled?: boolean
          include_in_digest?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["notification_category_enum"]
          email_enabled?: boolean
          in_app_enabled?: boolean
          include_in_digest?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_label_ar: string | null
          action_label_en: string | null
          action_url: string | null
          archived_at: string | null
          body_ar: string
          body_en: string
          category: Database["public"]["Enums"]["notification_category_enum"]
          created_at: string
          delivered_via_email: boolean
          email_message_id: string | null
          email_sent_at: string | null
          id: string
          idempotency_key: string | null
          included_in_digest_id: string | null
          metadata: Json
          priority: Database["public"]["Enums"]["notification_priority_enum"]
          read_at: string | null
          recipient_id: string
          related_resource_id: string | null
          related_resource_type: string | null
          title_ar: string
          title_en: string
        }
        Insert: {
          action_label_ar?: string | null
          action_label_en?: string | null
          action_url?: string | null
          archived_at?: string | null
          body_ar: string
          body_en: string
          category: Database["public"]["Enums"]["notification_category_enum"]
          created_at?: string
          delivered_via_email?: boolean
          email_message_id?: string | null
          email_sent_at?: string | null
          id?: string
          idempotency_key?: string | null
          included_in_digest_id?: string | null
          metadata?: Json
          priority?: Database["public"]["Enums"]["notification_priority_enum"]
          read_at?: string | null
          recipient_id: string
          related_resource_id?: string | null
          related_resource_type?: string | null
          title_ar: string
          title_en: string
        }
        Update: {
          action_label_ar?: string | null
          action_label_en?: string | null
          action_url?: string | null
          archived_at?: string | null
          body_ar?: string
          body_en?: string
          category?: Database["public"]["Enums"]["notification_category_enum"]
          created_at?: string
          delivered_via_email?: boolean
          email_message_id?: string | null
          email_sent_at?: string | null
          id?: string
          idempotency_key?: string | null
          included_in_digest_id?: string | null
          metadata?: Json
          priority?: Database["public"]["Enums"]["notification_priority_enum"]
          read_at?: string | null
          recipient_id?: string
          related_resource_id?: string | null
          related_resource_type?: string | null
          title_ar?: string
          title_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_included_in_digest_id_fkey"
            columns: ["included_in_digest_id"]
            isOneToOne: false
            referencedRelation: "digest_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_verification_attempts: {
        Row: {
          attempt_number: number
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
          is_verified?: boolean
          otp_hash?: string
          phone?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "phone_verification_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phone_verification_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
        ]
      }
      plan_entitlements: {
        Row: {
          feature_key: string
          plan_id: string
          quota: number | null
        }
        Insert: {
          feature_key: string
          plan_id: string
          quota?: number | null
        }
        Update: {
          feature_key?: string
          plan_id?: string
          quota?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_entitlements_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          audience: Database["public"]["Enums"]["subscriber_type_enum"]
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          key: string
          name_ar: string
          name_en: string
          price_monthly_sar: number
          price_yearly_sar: number
        }
        Insert: {
          audience: Database["public"]["Enums"]["subscriber_type_enum"]
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          key: string
          name_ar: string
          name_en: string
          price_monthly_sar: number
          price_yearly_sar: number
        }
        Update: {
          audience?: Database["public"]["Enums"]["subscriber_type_enum"]
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          key?: string
          name_ar?: string
          name_en?: string
          price_monthly_sar?: number
          price_yearly_sar?: number
        }
        Relationships: []
      }
      platform_config: {
        Row: {
          category: string
          description: string | null
          is_secret: boolean
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
          value_type: string
        }
        Insert: {
          category?: string
          description?: string | null
          is_secret?: boolean
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
          value_type?: string
        }
        Update: {
          category?: string
          description?: string | null
          is_secret?: boolean
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
          value_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_config_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_config_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
        ]
      }
      profile_skills: {
        Row: {
          created_at: string
          profile_id: string
          skill_id: string
        }
        Insert: {
          created_at?: string
          profile_id: string
          skill_id: string
        }
        Update: {
          created_at?: string
          profile_id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_skills_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_skills_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
          {
            foreignKeyName: "profile_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_views: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          source: string | null
          viewed_at: string
          viewer_company_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          source?: string | null
          viewed_at?: string
          viewer_company_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          source?: string | null
          viewed_at?: string
          viewer_company_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_views_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_views_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
          {
            foreignKeyName: "profile_views_viewer_company_id_fkey"
            columns: ["viewer_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          about_me: string | null
          allow_company_direct_contact: boolean
          avatar_url: string | null
          college_id: string | null
          created_at: string
          deleted_at: string | null
          email_verified_at: string | null
          failed_login_count: number
          full_name: string | null
          graduation_year: number | null
          headline: string | null
          id: string
          last_login_at: string | null
          last_login_ip: unknown
          linkedin_url: string | null
          locale: string
          locked_until: string | null
          major_id: string | null
          mfa_enabled: boolean
          mfa_enforced: boolean
          onboarding_completed_at: string | null
          onboarding_skipped_at: string | null
          onboarding_started_at: string | null
          phone: string | null
          phone_verified_at: string | null
          profile_completion_pct: number
          profile_state: Database["public"]["Enums"]["profile_state_enum"]
          role: Database["public"]["Enums"]["user_role_enum"]
          show_application_history: boolean
          show_profile_in_university_stats: boolean
          show_profile_to_companies: boolean
          smart_links: Json
          student_status: string | null
          suspended_at: string | null
          suspended_reason: string | null
          target_program_types: string[]
          target_regions: string[]
          target_sectors: string[]
          university_id: string | null
          updated_at: string
          visibility: Database["public"]["Enums"]["profile_visibility_enum"]
        }
        Insert: {
          about_me?: string | null
          allow_company_direct_contact?: boolean
          avatar_url?: string | null
          college_id?: string | null
          created_at?: string
          deleted_at?: string | null
          email_verified_at?: string | null
          failed_login_count?: number
          full_name?: string | null
          graduation_year?: number | null
          headline?: string | null
          id: string
          last_login_at?: string | null
          last_login_ip?: unknown
          linkedin_url?: string | null
          locale?: string
          locked_until?: string | null
          major_id?: string | null
          mfa_enabled?: boolean
          mfa_enforced?: boolean
          onboarding_completed_at?: string | null
          onboarding_skipped_at?: string | null
          onboarding_started_at?: string | null
          phone?: string | null
          phone_verified_at?: string | null
          profile_completion_pct?: number
          profile_state?: Database["public"]["Enums"]["profile_state_enum"]
          role?: Database["public"]["Enums"]["user_role_enum"]
          show_application_history?: boolean
          show_profile_in_university_stats?: boolean
          show_profile_to_companies?: boolean
          smart_links?: Json
          student_status?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
          target_program_types?: string[]
          target_regions?: string[]
          target_sectors?: string[]
          university_id?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["profile_visibility_enum"]
        }
        Update: {
          about_me?: string | null
          allow_company_direct_contact?: boolean
          avatar_url?: string | null
          college_id?: string | null
          created_at?: string
          deleted_at?: string | null
          email_verified_at?: string | null
          failed_login_count?: number
          full_name?: string | null
          graduation_year?: number | null
          headline?: string | null
          id?: string
          last_login_at?: string | null
          last_login_ip?: unknown
          linkedin_url?: string | null
          locale?: string
          locked_until?: string | null
          major_id?: string | null
          mfa_enabled?: boolean
          mfa_enforced?: boolean
          onboarding_completed_at?: string | null
          onboarding_skipped_at?: string | null
          onboarding_started_at?: string | null
          phone?: string | null
          phone_verified_at?: string | null
          profile_completion_pct?: number
          profile_state?: Database["public"]["Enums"]["profile_state_enum"]
          role?: Database["public"]["Enums"]["user_role_enum"]
          show_application_history?: boolean
          show_profile_in_university_stats?: boolean
          show_profile_to_companies?: boolean
          smart_links?: Json
          student_status?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
          target_program_types?: string[]
          target_regions?: string[]
          target_sectors?: string[]
          university_id?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["profile_visibility_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_major_id_fkey"
            columns: ["major_id"]
            isOneToOne: false
            referencedRelation: "majors_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "university_dashboard_snapshot"
            referencedColumns: ["university_id"]
          },
          {
            foreignKeyName: "profiles_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "university_dashboard_view"
            referencedColumns: ["university_id"]
          },
          {
            foreignKeyName: "profiles_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "university_dashboard_view_admin"
            referencedColumns: ["university_id"]
          },
        ]
      }
      public_announcements: {
        Row: {
          body_ar: string | null
          category: Database["public"]["Enums"]["announcement_category_enum"]
          created_at: string
          created_by: string | null
          cta_label_ar: string | null
          cta_url: string | null
          expires_at: string
          id: string
          is_featured: boolean
          is_published: boolean
          starts_at: string
          title_ar: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body_ar?: string | null
          category: Database["public"]["Enums"]["announcement_category_enum"]
          created_at?: string
          created_by?: string | null
          cta_label_ar?: string | null
          cta_url?: string | null
          expires_at: string
          id?: string
          is_featured?: boolean
          is_published?: boolean
          starts_at?: string
          title_ar: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body_ar?: string | null
          category?: Database["public"]["Enums"]["announcement_category_enum"]
          created_at?: string
          created_by?: string | null
          cta_label_ar?: string | null
          cta_url?: string | null
          expires_at?: string
          id?: string
          is_featured?: boolean
          is_published?: boolean
          starts_at?: string
          title_ar?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
          {
            foreignKeyName: "public_announcements_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_announcements_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
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
      regions: {
        Row: {
          created_at: string
          id: string
          name_ar: string
          name_en: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name_ar: string
          name_en: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name_ar?: string
          name_en?: string
          slug?: string
        }
        Relationships: []
      }
      sectors: {
        Row: {
          created_at: string
          display_order: number
          id: string
          name_ar: string
          name_en: string
          slug: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          name_ar: string
          name_en: string
          slug: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          name_ar?: string
          name_en?: string
          slug?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          created_at: string
          id: string
          name: string
          name_ar: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          name_ar?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          name_ar?: string | null
        }
        Relationships: []
      }
      ssis_blocks: {
        Row: {
          ai_generated: boolean
          created_at: string
          display_order: number
          edited_by_human: boolean
          id: string
          kind: Database["public"]["Enums"]["ssis_block_kind_enum"]
          max_score: number
          prompt_ar: string
          rubric: Json
          screening_id: string
          updated_at: string
        }
        Insert: {
          ai_generated?: boolean
          created_at?: string
          display_order: number
          edited_by_human?: boolean
          id?: string
          kind: Database["public"]["Enums"]["ssis_block_kind_enum"]
          max_score?: number
          prompt_ar: string
          rubric: Json
          screening_id: string
          updated_at?: string
        }
        Update: {
          ai_generated?: boolean
          created_at?: string
          display_order?: number
          edited_by_human?: boolean
          id?: string
          kind?: Database["public"]["Enums"]["ssis_block_kind_enum"]
          max_score?: number
          prompt_ar?: string
          rubric?: Json
          screening_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ssis_blocks_screening_id_fkey"
            columns: ["screening_id"]
            isOneToOne: false
            referencedRelation: "ssis_screenings"
            referencedColumns: ["id"]
          },
        ]
      }
      ssis_evaluations: {
        Row: {
          composite_score: number
          evaluated_at: string
          id: string
          invitation_id: string
          model_version: string
          per_block: Json
          recommendation: Database["public"]["Enums"]["ssis_recommendation_enum"]
        }
        Insert: {
          composite_score: number
          evaluated_at?: string
          id?: string
          invitation_id: string
          model_version: string
          per_block: Json
          recommendation: Database["public"]["Enums"]["ssis_recommendation_enum"]
        }
        Update: {
          composite_score?: number
          evaluated_at?: string
          id?: string
          invitation_id?: string
          model_version?: string
          per_block?: Json
          recommendation?: Database["public"]["Enums"]["ssis_recommendation_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "ssis_evaluations_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: true
            referencedRelation: "ssis_invitations"
            referencedColumns: ["id"]
          },
        ]
      }
      ssis_invitations: {
        Row: {
          application_id: string
          completed_at: string | null
          consent_given_at: string | null
          created_at: string
          expires_at: string
          id: string
          screening_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["ssis_invitation_status_enum"]
        }
        Insert: {
          application_id: string
          completed_at?: string | null
          consent_given_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          screening_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["ssis_invitation_status_enum"]
        }
        Update: {
          application_id?: string
          completed_at?: string | null
          consent_given_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          screening_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["ssis_invitation_status_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "ssis_invitations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ssis_invitations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "radar_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ssis_invitations_screening_id_fkey"
            columns: ["screening_id"]
            isOneToOne: false
            referencedRelation: "ssis_screenings"
            referencedColumns: ["id"]
          },
        ]
      }
      ssis_responses: {
        Row: {
          answer_text: string
          block_id: string
          id: string
          invitation_id: string
          purge_after: string | null
          submitted_at: string
          updated_at: string
        }
        Insert: {
          answer_text: string
          block_id: string
          id?: string
          invitation_id: string
          purge_after?: string | null
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          answer_text?: string
          block_id?: string
          id?: string
          invitation_id?: string
          purge_after?: string | null
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ssis_responses_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "ssis_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ssis_responses_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "ssis_invitations"
            referencedColumns: ["id"]
          },
        ]
      }
      ssis_screenings: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_id: string
          created_at: string
          created_by: string | null
          generation_context: Json
          id: string
          invitation_validity_days: number
          job_id: string
          model_version: string | null
          pass_threshold: number
          preview_acknowledged_at: string | null
          preview_acknowledged_by: string | null
          status: Database["public"]["Enums"]["ssis_status_enum"]
          time_limit_minutes: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          generation_context: Json
          id?: string
          invitation_validity_days?: number
          job_id: string
          model_version?: string | null
          pass_threshold?: number
          preview_acknowledged_at?: string | null
          preview_acknowledged_by?: string | null
          status?: Database["public"]["Enums"]["ssis_status_enum"]
          time_limit_minutes?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          generation_context?: Json
          id?: string
          invitation_validity_days?: number
          job_id?: string
          model_version?: string | null
          pass_threshold?: number
          preview_acknowledged_at?: string | null
          preview_acknowledged_by?: string | null
          status?: Database["public"]["Enums"]["ssis_status_enum"]
          time_limit_minutes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ssis_screenings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ssis_screenings_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
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
          role: Database["public"]["Enums"]["user_role_enum"]
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
          role: Database["public"]["Enums"]["user_role_enum"]
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
          reason?: string
          role?: Database["public"]["Enums"]["user_role_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "staff_invitations_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_invitations_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
          {
            foreignKeyName: "staff_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          activated_by: string | null
          billing_cycle: Database["public"]["Enums"]["billing_cycle_enum"]
          cancel_at_period_end: boolean
          company_id: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          payment_provider: string | null
          plan_id: string
          provider_ref: string | null
          status: Database["public"]["Enums"]["subscription_status_enum"]
          subscriber_type: Database["public"]["Enums"]["subscriber_type_enum"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          activated_by?: string | null
          billing_cycle: Database["public"]["Enums"]["billing_cycle_enum"]
          cancel_at_period_end?: boolean
          company_id?: string | null
          created_at?: string
          current_period_end: string
          current_period_start?: string
          id?: string
          payment_provider?: string | null
          plan_id: string
          provider_ref?: string | null
          status?: Database["public"]["Enums"]["subscription_status_enum"]
          subscriber_type: Database["public"]["Enums"]["subscriber_type_enum"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          activated_by?: string | null
          billing_cycle?: Database["public"]["Enums"]["billing_cycle_enum"]
          cancel_at_period_end?: boolean
          company_id?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          payment_provider?: string | null
          plan_id?: string
          provider_ref?: string | null
          status?: Database["public"]["Enums"]["subscription_status_enum"]
          subscriber_type?: Database["public"]["Enums"]["subscriber_type_enum"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      universities: {
        Row: {
          created_at: string
          id: string
          name: string
          name_ar: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          name_ar?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          name_ar?: string | null
        }
        Relationships: []
      }
      universities_catalog: {
        Row: {
          city_ar: string | null
          city_en: string | null
          created_at: string
          established_year: number | null
          id: string
          is_active: boolean
          name_ar: string
          name_en: string
          short_code: string
          slug: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          city_ar?: string | null
          city_en?: string | null
          created_at?: string
          established_year?: number | null
          id?: string
          is_active?: boolean
          name_ar: string
          name_en: string
          short_code: string
          slug: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          city_ar?: string | null
          city_en?: string | null
          created_at?: string
          established_year?: number | null
          id?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string
          short_code?: string
          slug?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      university_profiles: {
        Row: {
          about_ar: string | null
          about_en: string | null
          accreditation_body: string | null
          cover_image_url: string | null
          created_at: string
          directory_id: string
          display_name_ar: string
          display_name_en: string | null
          established_year: number | null
          id: string
          owner_user_id: string
          partnership_highlights: string | null
          published_at: string | null
          status: string
          student_population: number | null
          university_type: string | null
          updated_at: string
          verified_badge: boolean
          verified_domains: string[]
        }
        Insert: {
          about_ar?: string | null
          about_en?: string | null
          accreditation_body?: string | null
          cover_image_url?: string | null
          created_at?: string
          directory_id: string
          display_name_ar: string
          display_name_en?: string | null
          established_year?: number | null
          id?: string
          owner_user_id: string
          partnership_highlights?: string | null
          published_at?: string | null
          status?: string
          student_population?: number | null
          university_type?: string | null
          updated_at?: string
          verified_badge?: boolean
          verified_domains?: string[]
        }
        Update: {
          about_ar?: string | null
          about_en?: string | null
          accreditation_body?: string | null
          cover_image_url?: string | null
          created_at?: string
          directory_id?: string
          display_name_ar?: string
          display_name_en?: string | null
          established_year?: number | null
          id?: string
          owner_user_id?: string
          partnership_highlights?: string | null
          published_at?: string | null
          status?: string
          student_population?: number | null
          university_type?: string | null
          updated_at?: string
          verified_badge?: boolean
          verified_domains?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "university_profiles_directory_id_fkey"
            columns: ["directory_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          awarded_at: string
          awarded_by: string | null
          badge_id: string
          id: string
          metadata: Json
          user_id: string
        }
        Insert: {
          awarded_at?: string
          awarded_by?: string | null
          badge_id: string
          id?: string
          metadata?: Json
          user_id: string
        }
        Update: {
          awarded_at?: string
          awarded_by?: string | null
          badge_id?: string
          id?: string
          metadata?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_awarded_by_fkey"
            columns: ["awarded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_awarded_by_fkey"
            columns: ["awarded_by"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
        ]
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
            foreignKeyName: "user_encryption_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_encryption_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
        ]
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
            foreignKeyName: "user_verified_emails_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_verified_emails_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
        ]
      }
      verification_requests: {
        Row: {
          applicant_user_id: string
          assigned_staff_id: string | null
          business_email: string
          can_reapply_after: string | null
          claimant_name: string
          claimant_title: string | null
          company_name: string
          created_at: string
          directory_id: string
          domain_verified: boolean
          evidence_urls: string[]
          first_viewed_at: string | null
          first_viewed_by: string | null
          id: string
          rejection_reason: string | null
          required_documents: string[]
          resulting_profile_id: string | null
          resulting_profile_type: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sla_due_at: string | null
          status: Database["public"]["Enums"]["claim_status_enum"]
          updated_at: string
          verification_type: Database["public"]["Enums"]["claim_type_enum"]
          verified_domains: string[]
        }
        Insert: {
          applicant_user_id: string
          assigned_staff_id?: string | null
          business_email: string
          can_reapply_after?: string | null
          claimant_name: string
          claimant_title?: string | null
          company_name: string
          created_at?: string
          directory_id: string
          domain_verified?: boolean
          evidence_urls?: string[]
          first_viewed_at?: string | null
          first_viewed_by?: string | null
          id?: string
          rejection_reason?: string | null
          required_documents?: string[]
          resulting_profile_id?: string | null
          resulting_profile_type?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sla_due_at?: string | null
          status?: Database["public"]["Enums"]["claim_status_enum"]
          updated_at?: string
          verification_type?: Database["public"]["Enums"]["claim_type_enum"]
          verified_domains?: string[]
        }
        Update: {
          applicant_user_id?: string
          assigned_staff_id?: string | null
          business_email?: string
          can_reapply_after?: string | null
          claimant_name?: string
          claimant_title?: string | null
          company_name?: string
          created_at?: string
          directory_id?: string
          domain_verified?: boolean
          evidence_urls?: string[]
          first_viewed_at?: string | null
          first_viewed_by?: string | null
          id?: string
          rejection_reason?: string | null
          required_documents?: string[]
          resulting_profile_id?: string | null
          resulting_profile_type?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sla_due_at?: string | null
          status?: Database["public"]["Enums"]["claim_status_enum"]
          updated_at?: string
          verification_type?: Database["public"]["Enums"]["claim_type_enum"]
          verified_domains?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "claim_requests_company_id_fkey"
            columns: ["directory_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
          {
            foreignKeyName: "claim_requests_user_id_fkey"
            columns: ["applicant_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_requests_user_id_fkey"
            columns: ["applicant_user_id"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
        ]
      }
    }
    Views: {
      mv_sys_dashboard_metrics: {
        Row: {
          active_sessions_now: number | null
          audit_events_24h: number | null
          id: number | null
          overdue_claims: number | null
          pending_claims: number | null
          pending_mentor_applications: number | null
          pending_staff_invites: number | null
          refreshed_at: string | null
          suspended_users: number | null
          total_users: number | null
        }
        Relationships: []
      }
      platform_metrics_snapshot: {
        Row: {
          active_jobs: number | null
          directory_coverage_count: number | null
          id: number | null
          jid_response_rate_pct: number | null
          refreshed_at: string | null
          total_candidates: number | null
          total_jobs_ever: number | null
          total_mentors: number | null
          total_sessions: number | null
          verified_business_profiles_count: number | null
          verified_profiles_count: number | null
          verified_university_profiles_count: number | null
        }
        Relationships: []
      }
      radar_cards: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string | null
          job_id: string | null
          status: string | null
          status_changed_at: string | null
          status_changed_by: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string | null
          job_id?: string | null
          status?: string | null
          status_changed_at?: string | null
          status_changed_by?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string | null
          job_id?: string | null
          status?: string | null
          status_changed_at?: string | null
          status_changed_by?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_applicant_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_applicant_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
          {
            foreignKeyName: "applications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_status_changed_by_fkey"
            columns: ["status_changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_status_changed_by_fkey"
            columns: ["status_changed_by"]
            isOneToOne: false
            referencedRelation: "v_staff_personal_metrics"
            referencedColumns: ["staff_user_id"]
          },
        ]
      }
      sector_demand_snapshot: {
        Row: {
          active_job_count: number | null
          application_count: number | null
          name_ar: string | null
          name_en: string | null
          refreshed_at: string | null
          sector_id: string | null
          sector_slug: string | null
        }
        Relationships: []
      }
      skills_demand_snapshot: {
        Row: {
          active_job_count: number | null
          application_count: number | null
          refreshed_at: string | null
          skill_name: string | null
        }
        Relationships: []
      }
      university_dashboard_snapshot: {
        Row: {
          college_distribution: Json | null
          cv_creation_pct: number | null
          job_applications: number | null
          mentorship_sessions: number | null
          profile_completion_pct: number | null
          refreshed_at: string | null
          status_breakdown: Json | null
          total_students: number | null
          university_id: string | null
        }
        Relationships: []
      }
      university_dashboard_view: {
        Row: {
          college_distribution: Json | null
          cv_creation_pct: number | null
          job_applications: number | null
          mentorship_sessions: number | null
          profile_completion_pct: number | null
          refreshed_at: string | null
          status_breakdown: Json | null
          total_students: number | null
          university_id: string | null
        }
        Relationships: []
      }
      university_dashboard_view_admin: {
        Row: {
          college_distribution: Json | null
          cv_creation_pct: number | null
          job_applications: number | null
          mentorship_sessions: number | null
          profile_completion_pct: number | null
          refreshed_at: string | null
          status_breakdown: Json | null
          total_students: number | null
          university_id: string | null
        }
        Relationships: []
      }
      v_staff_personal_metrics: {
        Row: {
          actions_today: number | null
          avg_review_hours_7d: number | null
          claims_approved_today: number | null
          claims_assigned_open: number | null
          claims_rejected_today: number | null
          claims_reviewed: number | null
          claims_reviewed_today: number | null
          flags_resolved: number | null
          flags_resolved_today: number | null
          staff_user_id: string | null
          total_actions: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      _catalog_authority_rank: {
        Args: { p_authority: string }
        Returns: number
      }
      _catalog_publication_denied: {
        Args: { p_actor_id: string; p_code: string; p_queue_id: string }
        Returns: Json
      }
      _catalog_reject_intake: {
        Args: {
          p_details: Json
          p_error_class: string
          p_idempotency_key: string
          p_retryable?: boolean
          p_run_id: string
          p_source_id: string
          p_source_record_key: string
          p_worker_identity: string
        }
        Returns: Json
      }
      _publish_lammah_candidate: {
        Args: {
          p_actor?: string
          p_auto: boolean
          p_candidate_id: string
          p_notes?: string
        }
        Returns: Json
      }
      _seed_local_auth_user: {
        Args: {
          p_email: string
          p_full_name: string
          p_id: string
          p_password?: string
        }
        Returns: undefined
      }
      _user_role_rank: {
        Args: { p_role: Database["public"]["Enums"]["user_role_enum"] }
        Returns: number
      }
      _write_audit_log: {
        Args: {
          p_action: string
          p_actor_id: string
          p_entity_id: string
          p_entity_type: string
          p_ip_address?: unknown
          p_metadata?: Json
          p_new_data?: Json
          p_old_data?: Json
          p_user_agent?: string
        }
        Returns: undefined
      }
      acknowledge_ssis_preview: {
        Args: { p_screening_id: string }
        Returns: {
          approved_at: string | null
          approved_by: string | null
          company_id: string
          created_at: string
          created_by: string | null
          generation_context: Json
          id: string
          invitation_validity_days: number
          job_id: string
          model_version: string | null
          pass_threshold: number
          preview_acknowledged_at: string | null
          preview_acknowledged_by: string | null
          status: Database["public"]["Enums"]["ssis_status_enum"]
          time_limit_minutes: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "ssis_screenings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      approve_correction_suggestion: {
        Args: { p_review_notes: string; p_suggestion_id: string }
        Returns: undefined
      }
      approve_ssis_screening: {
        Args: { p_screening_id: string }
        Returns: {
          approved_at: string | null
          approved_by: string | null
          company_id: string
          created_at: string
          created_by: string | null
          generation_context: Json
          id: string
          invitation_validity_days: number
          job_id: string
          model_version: string | null
          pass_threshold: number
          preview_acknowledged_at: string | null
          preview_acknowledged_by: string | null
          status: Database["public"]["Enums"]["ssis_status_enum"]
          time_limit_minutes: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "ssis_screenings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      approve_verification_request: {
        Args: {
          p_review_notes: string
          p_verification_id: string
          p_verified_domains?: string[]
        }
        Returns: undefined
      }
      approve_verification_request_override: {
        Args: {
          p_review_notes: string
          p_verification_id: string
          p_verified_domains?: string[]
        }
        Returns: undefined
      }
      assemble_ssis_generation_context: {
        Args: { p_job_id: string }
        Returns: Json
      }
      assign_claim_to_self: { Args: { p_claim_id: string }; Returns: undefined }
      award_entity_badge: {
        Args: {
          p_entity_id: string
          p_entity_type: string
          p_metadata?: Json
          p_slug: string
        }
        Returns: undefined
      }
      award_user_badge: {
        Args: { p_metadata?: Json; p_slug: string; p_user_id: string }
        Returns: undefined
      }
      backfill_lammah_native_conflicts: {
        Args: { p_apply?: boolean }
        Returns: number
      }
      build_daily_digests: { Args: never; Returns: number }
      cancel_communication_batch: {
        Args: { p_batch_id: string }
        Returns: boolean
      }
      catalog_begin_gleif_run: {
        Args: {
          p_external_run_id: string
          p_mode?: string
          p_worker_identity?: string
        }
        Returns: Json
      }
      catalog_capture_gleif_facts: {
        Args: { p_candidate_id: string; p_facts: Json }
        Returns: Json
      }
      catalog_capture_gleif_metadata: {
        Args: {
          p_candidate_id: string
          p_entity_status: string
          p_lei: string
          p_match_outcome: string
          p_match_reasons: Json
          p_registration_authority: string
          p_registration_identifier: string
          p_registration_status: string
          p_review_flags: string[]
          p_source_payload: Json
        }
        Returns: Json
      }
      catalog_finish_gleif_run: {
        Args: {
          p_checkpoint?: Json
          p_failure_class?: string
          p_failure_detail?: string
          p_page_count: number
          p_retrieved_count: number
          p_retry_count: number
          p_run_id: string
          p_skipped_count: number
          p_status: string
        }
        Returns: Json
      }
      check_email_otp_rate_limit: {
        Args: { p_email: string; p_user_id: string }
        Returns: undefined
      }
      check_otp_rate_limit: {
        Args: { p_phone: string; p_user_id: string }
        Returns: undefined
      }
      claim_directory_candidate: {
        Args: { p_review_queue_id: string }
        Returns: Json
      }
      claim_due_communication_batches: {
        Args: { p_limit?: number }
        Returns: {
          canceled_by: string | null
          company_id: string
          created_at: string
          created_by: string
          failed_count: number
          id: string
          job_id: string
          kind: Database["public"]["Enums"]["comm_kind_enum"]
          recipient_application_ids: string[]
          recipient_count: number
          scheduled_send_at: string | null
          sent_count: number
          status: Database["public"]["Enums"]["comm_batch_status_enum"]
          template_snapshot: Json
        }[]
        SetofOptions: {
          from: "*"
          to: "communication_batches"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      claim_lammah_candidate: {
        Args: { p_candidate_id: string }
        Returns: Json
      }
      classify_lammah_opportunity_type: {
        Args: { p_excerpt: string; p_title_ar: string; p_title_en: string }
        Returns: Database["public"]["Enums"]["lammah_opportunity_type_enum"]
      }
      close_lammah_dead_letter: {
        Args: { p_dead_letter_id: string; p_reason: string }
        Returns: Json
      }
      close_ssis_screening: {
        Args: { p_screening_id: string }
        Returns: {
          approved_at: string | null
          approved_by: string | null
          company_id: string
          created_at: string
          created_by: string | null
          generation_context: Json
          id: string
          invitation_validity_days: number
          job_id: string
          model_version: string | null
          pass_threshold: number
          preview_acknowledged_at: string | null
          preview_acknowledged_by: string | null
          status: Database["public"]["Enums"]["ssis_status_enum"]
          time_limit_minutes: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "ssis_screenings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      comm_excluded_application_ids: {
        Args: {
          p_job_id: string
          p_kind: Database["public"]["Enums"]["comm_kind_enum"]
        }
        Returns: string[]
      }
      company_has_entitlement: {
        Args: { p_company_id: string; p_feature: string }
        Returns: boolean
      }
      complete_ssis_invitation: {
        Args: { p_invitation_id: string }
        Returns: {
          application_id: string
          completed_at: string | null
          consent_given_at: string | null
          created_at: string
          expires_at: string
          id: string
          screening_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["ssis_invitation_status_enum"]
        }
        SetofOptions: {
          from: "*"
          to: "ssis_invitations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      complete_staff_invite_acceptance: {
        Args: { p_token: string }
        Returns: undefined
      }
      compute_cascade_suggestion: {
        Args: { p_job_id: string }
        Returns: {
          recipient_count: number
          recipient_ids: string[]
          suggestion_kind: Database["public"]["Enums"]["comm_kind_enum"]
          target_status: Database["public"]["Enums"]["application_status_enum"]
        }[]
      }
      compute_mentor_scores: { Args: never; Returns: number }
      configure_catalog_gleif: {
        Args: {
          p_connector_enabled: boolean
          p_ingestion_enabled: boolean
          p_max_pages?: number
          p_page_size?: number
        }
        Returns: Json
      }
      configure_lammah_phase1: {
        Args: {
          p_auto_publication_enabled: boolean
          p_connector_enabled: boolean
          p_ingestion_enabled: boolean
          p_reason: string
          p_source_auto_publication_enabled: boolean
          p_source_enabled: boolean
        }
        Returns: Json
      }
      consent_ssis_invitation: {
        Args: { p_invitation_id: string }
        Returns: {
          application_id: string
          completed_at: string | null
          consent_given_at: string | null
          created_at: string
          expires_at: string
          id: string
          screening_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["ssis_invitation_status_enum"]
        }
        SetofOptions: {
          from: "*"
          to: "ssis_invitations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_business_profile: {
        Args: {
          p_display_name_ar: string
          p_display_name_en?: string
          p_verification_id: string
        }
        Returns: string
      }
      create_communication_batch: {
        Args: {
          p_job_id: string
          p_kind: Database["public"]["Enums"]["comm_kind_enum"]
          p_recipient_ids: string[]
          p_template_snapshot?: Json
        }
        Returns: string
      }
      create_university_profile: {
        Args: {
          p_display_name_ar: string
          p_display_name_en?: string
          p_verification_id: string
        }
        Returns: string
      }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role_enum"]
      }
      dispatch_notification: {
        Args: {
          p_action_label_ar?: string
          p_action_label_en?: string
          p_action_url?: string
          p_body_ar: string
          p_body_en: string
          p_category: Database["public"]["Enums"]["notification_category_enum"]
          p_idempotency_key?: string
          p_metadata?: Json
          p_priority?: Database["public"]["Enums"]["notification_priority_enum"]
          p_recipient_id: string
          p_related_resource_id?: string
          p_related_resource_type?: string
          p_title_ar: string
          p_title_en: string
        }
        Returns: string
      }
      email_quota_status: {
        Args: never
        Returns: {
          circuit_open: boolean
          daily_limit: number
          monthly_limit: number
          monthly_remaining: number
          remaining: number
          sent_this_month: number
          sent_today: number
        }[]
      }
      enqueue_mentor_pending_request_radar: { Args: never; Returns: number }
      ensure_communication_templates: {
        Args: { p_company_id: string }
        Returns: undefined
      }
      execute_catalog_retention: { Args: never; Returns: Json }
      execute_lammah_retention: { Args: never; Returns: Json }
      expire_lapsed_subscriptions: { Args: never; Returns: undefined }
      expire_passed_jobs: { Args: never; Returns: number }
      expire_stale_applications: { Args: never; Returns: number }
      expire_stale_lammah_opportunities: { Args: never; Returns: Json }
      expire_stale_mentorship_requests: { Args: never; Returns: number }
      finalize_communication_batch: {
        Args: {
          p_batch_id: string
          p_failed_count: number
          p_sent_count: number
          p_status: Database["public"]["Enums"]["comm_batch_status_enum"]
        }
        Returns: undefined
      }
      find_native_job_conflict: {
        Args: {
          p_company_id: string
          p_experience_level: Database["public"]["Enums"]["experience_level_enum"]
          p_external_url: string
          p_opportunity_type: Database["public"]["Enums"]["lammah_opportunity_type_enum"]
          p_region: string
          p_title_ar: string
          p_title_en: string
        }
        Returns: string
      }
      get_company_boost_usage: {
        Args: { p_company_id: string }
        Returns: {
          active_count: number
          quota: number
        }[]
      }
      get_default_digest_pref: {
        Args: { cat: Database["public"]["Enums"]["notification_category_enum"] }
        Returns: boolean
      }
      get_default_email_pref: {
        Args: { cat: Database["public"]["Enums"]["notification_category_enum"] }
        Returns: boolean
      }
      get_mentor_response_stats: {
        Args: { p_mentor_id: string }
        Returns: Json
      }
      get_my_approved_verifications: {
        Args: never
        Returns: {
          applicant_user_id: string
          assigned_staff_id: string | null
          business_email: string
          can_reapply_after: string | null
          claimant_name: string
          claimant_title: string | null
          company_name: string
          created_at: string
          directory_id: string
          domain_verified: boolean
          evidence_urls: string[]
          first_viewed_at: string | null
          first_viewed_by: string | null
          id: string
          rejection_reason: string | null
          required_documents: string[]
          resulting_profile_id: string | null
          resulting_profile_type: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sla_due_at: string | null
          status: Database["public"]["Enums"]["claim_status_enum"]
          updated_at: string
          verification_type: Database["public"]["Enums"]["claim_type_enum"]
          verified_domains: string[]
        }[]
        SetofOptions: {
          from: "*"
          to: "verification_requests"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_my_entitlements: {
        Args: never
        Returns: {
          feature_key: string
          quota: number
        }[]
      }
      get_notification_preference: {
        Args: {
          p_category: Database["public"]["Enums"]["notification_category_enum"]
          p_user_id: string
        }
        Returns: {
          email_enabled: boolean
          in_app_enabled: boolean
          include_in_digest: boolean
          is_mandatory: boolean
          preference_source: string
        }[]
      }
      get_profile_view_stats: {
        Args: { p_profile_id: string }
        Returns: {
          distinct_companies_30d: number
          total_views: number
          unique_companies: number
          views_last_30_days: number
        }[]
      }
      get_staff_personal_metrics: {
        Args: never
        Returns: {
          actions_today: number | null
          avg_review_hours_7d: number | null
          claims_approved_today: number | null
          claims_assigned_open: number | null
          claims_rejected_today: number | null
          claims_reviewed: number | null
          claims_reviewed_today: number | null
          flags_resolved: number | null
          flags_resolved_today: number | null
          staff_user_id: string | null
          total_actions: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "v_staff_personal_metrics"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      has_entitlement: { Args: { p_feature: string }; Returns: boolean }
      hash_staff_invite_token: { Args: { p_token: string }; Returns: string }
      increment_job_boost_stat: {
        Args: { p_job_id: string; p_metric: string }
        Returns: undefined
      }
      ingest_directory_candidate: {
        Args: {
          p_candidate: Json
          p_checksum_sha256: string
          p_evidence_metadata: Json
          p_facts: Json
          p_idempotency_key: string
          p_run_id: string
          p_source_key: string
          p_source_record_key: string
        }
        Returns: Json
      }
      ingest_lammah_candidate: {
        Args: { p_record: Json; p_run_id: string }
        Returns: Json
      }
      ingest_lammah_opportunity: { Args: { p: Json }; Returns: string }
      invite_ssis_applicants: {
        Args: { p_application_ids: string[]; p_screening_id: string }
        Returns: number
      }
      is_admin_or_above: { Args: never; Returns: boolean }
      is_allowed_applicant_application_status_transition: {
        Args: {
          p_from: Database["public"]["Enums"]["application_status_enum"]
          p_to: Database["public"]["Enums"]["application_status_enum"]
        }
        Returns: boolean
      }
      is_category_mandatory: {
        Args: { cat: Database["public"]["Enums"]["notification_category_enum"] }
        Returns: boolean
      }
      is_feature_enabled: { Args: { p_flag_key: string }; Returns: boolean }
      is_mentorship_staff: { Args: never; Returns: boolean }
      is_privileged_staff: { Args: never; Returns: boolean }
      is_staff_or_super_admin: { Args: never; Returns: boolean }
      job_auto_reply_enabled: { Args: { p_job_id: string }; Returns: boolean }
      lammah_begin_run: {
        Args: {
          p_external_run_id: string
          p_mode?: string
          p_worker_identity?: string
        }
        Returns: Json
      }
      lammah_candidate_gate_checklist: {
        Args: { p_candidate_id: string }
        Returns: Json
      }
      lammah_finish_run: {
        Args: {
          p_checkpoint?: Json
          p_failure_class?: string
          p_failure_detail?: string
          p_page_count: number
          p_retrieved_count: number
          p_retry_count: number
          p_run_id: string
          p_status: string
        }
        Returns: Json
      }
      lammah_host_allowed: {
        Args: { p_allowed_hosts: string[]; p_url: string }
        Returns: boolean
      }
      lammah_native_opportunity_matches: {
        Args: {
          p_job_company_id: string
          p_job_experience: Database["public"]["Enums"]["experience_level_enum"]
          p_job_region: string
          p_job_title_ar: string
          p_job_title_en: string
          p_job_url: string
          p_lammah_company_id: string
          p_lammah_experience: Database["public"]["Enums"]["experience_level_enum"]
          p_lammah_region: string
          p_lammah_title_ar: string
          p_lammah_title_en: string
          p_lammah_type: Database["public"]["Enums"]["lammah_opportunity_type_enum"]
          p_lammah_url: string
        }
        Returns: boolean
      }
      lammah_staff_actor: { Args: never; Returns: string }
      lammah_try_auto_publish: {
        Args: { p_candidate_id: string }
        Returns: Json
      }
      lammah_url_host: { Args: { p_url: string }; Returns: string }
      lammah_weekly_active_count: { Args: never; Returns: number }
      lock_lammah_native_conflict: {
        Args: {
          p_company_id: string
          p_external_ref_hash?: string
          p_external_url: string
        }
        Returns: undefined
      }
      normalize_opportunity_title: { Args: { p_text: string }; Returns: string }
      normalize_opportunity_url: { Args: { p_url: string }; Returns: string }
      notify_claim_decision: {
        Args: { p_claim_id: string; p_decision: string; p_reason?: string }
        Returns: string
      }
      notify_radar_status_change: {
        Args: { p_card_id: string; p_new_status: string; p_old_status: string }
        Returns: string
      }
      opportunity_title_similarity: {
        Args: {
          p_left_ar: string
          p_left_en: string
          p_right_ar: string
          p_right_en: string
        }
        Returns: number
      }
      opportunity_titles_match_exactly: {
        Args: {
          p_left_ar: string
          p_left_en: string
          p_right_ar: string
          p_right_en: string
        }
        Returns: boolean
      }
      process_due_radar_items: { Args: never; Returns: number }
      publish_business_profile: {
        Args: { p_profile_id: string }
        Returns: Json
      }
      publish_directory_candidate: {
        Args: { p_review_queue_id: string }
        Returns: Json
      }
      publish_lammah_candidate: {
        Args: { p_candidate_id: string; p_notes: string }
        Returns: Json
      }
      publish_university_profile: {
        Args: { p_profile_id: string }
        Returns: Json
      }
      purge_expired_lammah: { Args: never; Returns: undefined }
      purge_expired_ssis_responses: { Args: never; Returns: number }
      radar_status_label_ar: { Args: { p_status: string }; Returns: string }
      radar_status_label_en: { Args: { p_status: string }; Returns: string }
      recalculate_profile_completion: {
        Args: { p_profile_id: string }
        Returns: number
      }
      record_active_session: {
        Args: {
          p_device_label?: string
          p_expires_at?: string
          p_ip_address?: unknown
          p_session_token_hash: string
          p_user_agent?: string
        }
        Returns: string
      }
      record_lammah_dead_letter: {
        Args: {
          p_error_class: string
          p_run_id: string
          p_sanitized_details: Json
          p_source_record_id: string
        }
        Returns: Json
      }
      record_ssis_outcome: {
        Args: { p_action: string; p_invitation_id: string }
        Returns: undefined
      }
      redrive_catalog_dead_letter: {
        Args: { p_dead_letter_id: string }
        Returns: Json
      }
      redrive_lammah_dead_letter: {
        Args: { p_dead_letter_id: string; p_reason: string }
        Returns: Json
      }
      refresh_company_badges: { Args: never; Returns: undefined }
      refresh_mentor_of_month: { Args: never; Returns: number }
      refresh_pulse_metrics: { Args: never; Returns: undefined }
      refresh_sector_demand: { Args: never; Returns: undefined }
      refresh_skills_demand: { Args: never; Returns: undefined }
      refresh_sys_metrics: { Args: never; Returns: undefined }
      refresh_university_dashboard_snapshot: { Args: never; Returns: undefined }
      reinstate_profile:
        | {
            Args: {
              p_profile_id: string
              p_profile_type: string
              p_reason?: string
              p_target_status?: string
            }
            Returns: undefined
          }
        | { Args: { p_target_user_id: string }; Returns: undefined }
      reject_correction_suggestion: {
        Args: { p_review_notes: string; p_suggestion_id: string }
        Returns: undefined
      }
      reject_verification_request: {
        Args: {
          p_rejection_reason?: string
          p_required_documents?: string[]
          p_review_notes: string
          p_verification_id: string
        }
        Returns: undefined
      }
      reject_verification_request_override: {
        Args: {
          p_rejection_reason?: string
          p_required_documents?: string[]
          p_review_notes: string
          p_verification_id: string
        }
        Returns: undefined
      }
      release_lammah_candidate: {
        Args: { p_candidate_id: string; p_reason: string }
        Returns: Json
      }
      remove_entity_badge: {
        Args: { p_entity_id: string; p_entity_type: string; p_slug: string }
        Returns: undefined
      }
      report_lammah_problem: {
        Args: { p_opportunity_id: string; p_reason: string }
        Returns: Json
      }
      review_claim: {
        Args: {
          p_claim_id: string
          p_decision: string
          p_reason: string
          p_required_documents?: string[]
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
      review_directory_candidate: {
        Args: {
          p_action: string
          p_domain?: string
          p_evidence_url?: string
          p_name_ar?: string
          p_notes: string
          p_review_queue_id: string
        }
        Returns: Json
      }
      review_lammah_candidate: {
        Args: {
          p_action: string
          p_candidate_id: string
          p_corrected_type?: Database["public"]["Enums"]["lammah_opportunity_type_enum"]
          p_notes: string
          p_resolved_company_id?: string
        }
        Returns: Json
      }
      review_lammah_fact: {
        Args: {
          p_action: string
          p_fact_id: string
          p_normalized_value?: Json
          p_notes_ar?: string
          p_notes_en?: string
        }
        Returns: Json
      }
      revoke_active_session: {
        Args: { p_session_id: string }
        Returns: undefined
      }
      run_lammah_retention_now: { Args: { p_reason: string }; Returns: Json }
      set_lammah_evidence_legal_hold: {
        Args: { p_enabled: boolean; p_evidence_id: string; p_reason: string }
        Returns: Json
      }
      set_user_role: {
        Args: {
          p_new_role: Database["public"]["Enums"]["user_role_enum"]
          p_target_user_id: string
        }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      staff_suspend_user: {
        Args: { p_reason: string; p_user_id: string }
        Returns: undefined
      }
      start_ssis_invitation: {
        Args: { p_invitation_id: string }
        Returns: {
          application_id: string
          completed_at: string | null
          consent_given_at: string | null
          created_at: string
          expires_at: string
          id: string
          screening_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["ssis_invitation_status_enum"]
        }
        SetofOptions: {
          from: "*"
          to: "ssis_invitations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_ssis_response: {
        Args: {
          p_answer_text: string
          p_block_id: string
          p_invitation_id: string
        }
        Returns: {
          answer_text: string
          block_id: string
          id: string
          invitation_id: string
          purge_after: string | null
          submitted_at: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "ssis_responses"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      suspend_profile: {
        Args: { p_profile_id: string; p_profile_type: string; p_reason: string }
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
      sweep_expired_boosts: { Args: never; Returns: number }
      sync_meeting_radar_on_confirm: {
        Args: { p_meeting_id: string }
        Returns: undefined
      }
      sync_mentor_active_workshop: {
        Args: { p_mentor_id: string }
        Returns: undefined
      }
      sync_thresholds_after_refresh: { Args: never; Returns: undefined }
      toggle_job_boost: {
        Args: { p_enable: boolean; p_job_id: string }
        Returns: undefined
      }
      transition_closing_soon: { Args: never; Returns: number }
      transition_lammah_opportunity: {
        Args: { p_action: string; p_opportunity_id: string; p_reason: string }
        Returns: Json
      }
      unpublish_business_profile: {
        Args: { p_profile_id: string }
        Returns: Json
      }
      unpublish_university_profile: {
        Args: { p_profile_id: string }
        Returns: Json
      }
      update_feedback_flags: { Args: never; Returns: undefined }
      user_can_manage_company_communication: {
        Args: { p_company_id: string }
        Returns: boolean
      }
      user_can_manage_ssis: { Args: { p_company_id: string }; Returns: boolean }
      user_owns_job_for_communication: {
        Args: { p_job_id: string }
        Returns: boolean
      }
      user_owns_ssis_job: { Args: { p_job_id: string }; Returns: boolean }
      validate_staff_invite_token: {
        Args: { p_token: string }
        Returns: {
          email: string
          invitation_id: string
          invite_role: Database["public"]["Enums"]["user_role_enum"]
        }[]
      }
      verify_phone_otp: {
        Args: { p_otp: string; p_phone: string; p_user_id: string }
        Returns: boolean
      }
      viewer_approved_company_id: { Args: never; Returns: string }
      viewer_approved_university_id: { Args: never; Returns: string }
      viewer_has_approved_company_claim: { Args: never; Returns: boolean }
    }
    Enums: {
      additional_category_enum:
        | "certification"
        | "language"
        | "project"
        | "award"
        | "volunteer"
        | "publication"
        | "other"
        | "leadership"
      announcement_category_enum:
        | "jobs"
        | "mentorship"
        | "events"
        | "platform"
        | "community"
      application_status_enum:
        | "draft"
        | "submitted"
        | "under_review"
        | "shortlisted"
        | "rejected"
        | "invited"
        | "withdrawn"
        | "expired"
        | "saved"
        | "pending"
      badge_category_enum: "individual" | "company" | "mentor" | "university"
      billing_cycle_enum: "monthly" | "yearly"
      claim_status_enum:
        | "pending"
        | "submitted"
        | "pending_review"
        | "under_review"
        | "needs_more_info"
        | "approved"
        | "rejected"
        | "cancelled"
      claim_type_enum: "business" | "university"
      comm_batch_status_enum:
        | "pending_confirmation"
        | "scheduled"
        | "sending"
        | "sent"
        | "canceled"
        | "failed"
      comm_kind_enum:
        | "received_ack"
        | "shortlisted"
        | "interview_invite"
        | "acceptance"
        | "rejection"
        | "holding_update"
      contact_message_source_enum: "onboarding" | "contact_page" | "claim_help"
      content_flag_target_type_enum:
        | "profile"
        | "job"
        | "company"
        | "mentor_profile"
        | "announcement"
        | "message"
      cv_generation_status_enum: "pending" | "completed" | "failed"
      cv_status_enum: "draft" | "published" | "archived"
      email_send_status_enum:
        | "queued"
        | "sent"
        | "failed"
        | "skipped_quota"
        | "skipped_prefs"
        | "skipped_bounced"
      entity_type_enum: "business" | "university"
      experience_level_enum:
        | "intern"
        | "entry"
        | "mid"
        | "senior"
        | "lead"
        | "executive"
      flag_reason_enum:
        | "spam"
        | "harassment"
        | "hate_speech"
        | "inappropriate_content"
        | "misinformation"
        | "impersonation"
        | "copyright_violation"
        | "privacy_violation"
        | "other"
      flag_status_enum: "pending" | "under_review" | "resolved" | "dismissed"
      job_status_enum:
        | "draft"
        | "published"
        | "closing_soon"
        | "closed"
        | "expired"
        | "pending_review"
      lammah_opportunity_type_enum:
        | "job"
        | "co_op"
        | "internship"
        | "fellowship"
        | "scholarship"
      lammah_status_enum: "active" | "hidden" | "superseded" | "expired"
      link_status_enum: "healthy" | "broken" | "pending"
      mentor_notification_status_enum: "pending" | "sent" | "dismissed"
      mentor_workshop_status_enum:
        | "draft"
        | "published"
        | "completed"
        | "cancelled"
      mentorship_request_status_enum:
        | "pending"
        | "accepted"
        | "declined"
        | "cancelled"
        | "expired"
      notification_category_enum:
        | "auth.email_verified"
        | "auth.mfa_disabled"
        | "auth.mfa_enabled"
        | "auth.new_device_login"
        | "auth.password_changed"
        | "auth.password_reset_requested"
        | "auth.phone_verified"
        | "auth.session_revoked"
        | "account.reinstated"
        | "account.suspended"
        | "claim.approved"
        | "claim.needs_more_info"
        | "claim.rejected"
        | "company.link_broken"
        | "job.application_expired"
        | "job.application_received"
        | "job.application_status_changed"
        | "job.expiring_soon"
        | "job.posted"
        | "legal.privacy_updated"
        | "legal.terms_updated"
        | "mentor.application_approved"
        | "mentor.application_rejected"
        | "mentorship.feedback_requested"
        | "mentorship.meeting_confirmed"
        | "mentorship.meeting_proposed"
        | "mentorship.meeting_reminder"
        | "mentorship.request_accepted"
        | "mentorship.request_declined"
        | "mentorship.request_received"
        | "staff.claim_assigned"
        | "digest.daily_summary"
        | "_retired_unused_category_a"
        | "ssis.invitation"
        | "ssis.evaluation_ready"
        | "directory.correction_approved"
        | "directory.correction_rejected"
      notification_priority_enum: "low" | "normal" | "high" | "critical"
      opportunity_tier_enum: "normal" | "plus"
      ownership_enum: "government" | "semi_government" | "private"
      profile_state_enum: "incomplete" | "active" | "suspended" | "deleted"
      profile_visibility_enum: "private" | "discoverable" | "public"
      review_visibility_enum: "private" | "public_named" | "public_anonymous"
      ssis_block_kind_enum: "text" | "scenario"
      ssis_invitation_status_enum: "sent" | "started" | "completed" | "expired"
      ssis_recommendation_enum: "advance" | "review" | "decline_recommend"
      ssis_status_enum: "draft" | "pending_approval" | "active" | "closed"
      subscriber_type_enum: "user" | "company"
      subscription_status_enum:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "expired"
      user_role_enum:
        | "individual"
        | "entity"
        | "staff"
        | "admin"
        | "super_admin"
        | "company_admin"
        | "university_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      additional_category_enum: [
        "certification",
        "language",
        "project",
        "award",
        "volunteer",
        "publication",
        "other",
        "leadership",
      ],
      announcement_category_enum: [
        "jobs",
        "mentorship",
        "events",
        "platform",
        "community",
      ],
      application_status_enum: [
        "draft",
        "submitted",
        "under_review",
        "shortlisted",
        "rejected",
        "invited",
        "withdrawn",
        "expired",
        "saved",
        "pending",
      ],
      badge_category_enum: ["individual", "company", "mentor", "university"],
      billing_cycle_enum: ["monthly", "yearly"],
      claim_status_enum: [
        "pending",
        "submitted",
        "pending_review",
        "under_review",
        "needs_more_info",
        "approved",
        "rejected",
        "cancelled",
      ],
      claim_type_enum: ["business", "university"],
      comm_batch_status_enum: [
        "pending_confirmation",
        "scheduled",
        "sending",
        "sent",
        "canceled",
        "failed",
      ],
      comm_kind_enum: [
        "received_ack",
        "shortlisted",
        "interview_invite",
        "acceptance",
        "rejection",
        "holding_update",
      ],
      contact_message_source_enum: ["onboarding", "contact_page", "claim_help"],
      content_flag_target_type_enum: [
        "profile",
        "job",
        "company",
        "mentor_profile",
        "announcement",
        "message",
      ],
      cv_generation_status_enum: ["pending", "completed", "failed"],
      cv_status_enum: ["draft", "published", "archived"],
      email_send_status_enum: [
        "queued",
        "sent",
        "failed",
        "skipped_quota",
        "skipped_prefs",
        "skipped_bounced",
      ],
      entity_type_enum: ["business", "university"],
      experience_level_enum: [
        "intern",
        "entry",
        "mid",
        "senior",
        "lead",
        "executive",
      ],
      flag_reason_enum: [
        "spam",
        "harassment",
        "hate_speech",
        "inappropriate_content",
        "misinformation",
        "impersonation",
        "copyright_violation",
        "privacy_violation",
        "other",
      ],
      flag_status_enum: ["pending", "under_review", "resolved", "dismissed"],
      job_status_enum: [
        "draft",
        "published",
        "closing_soon",
        "closed",
        "expired",
        "pending_review",
      ],
      lammah_opportunity_type_enum: [
        "job",
        "co_op",
        "internship",
        "fellowship",
        "scholarship",
      ],
      lammah_status_enum: ["active", "hidden", "superseded", "expired"],
      link_status_enum: ["healthy", "broken", "pending"],
      mentor_notification_status_enum: ["pending", "sent", "dismissed"],
      mentor_workshop_status_enum: [
        "draft",
        "published",
        "completed",
        "cancelled",
      ],
      mentorship_request_status_enum: [
        "pending",
        "accepted",
        "declined",
        "cancelled",
        "expired",
      ],
      notification_category_enum: [
        "auth.email_verified",
        "auth.mfa_disabled",
        "auth.mfa_enabled",
        "auth.new_device_login",
        "auth.password_changed",
        "auth.password_reset_requested",
        "auth.phone_verified",
        "auth.session_revoked",
        "account.reinstated",
        "account.suspended",
        "claim.approved",
        "claim.needs_more_info",
        "claim.rejected",
        "company.link_broken",
        "job.application_expired",
        "job.application_received",
        "job.application_status_changed",
        "job.expiring_soon",
        "job.posted",
        "legal.privacy_updated",
        "legal.terms_updated",
        "mentor.application_approved",
        "mentor.application_rejected",
        "mentorship.feedback_requested",
        "mentorship.meeting_confirmed",
        "mentorship.meeting_proposed",
        "mentorship.meeting_reminder",
        "mentorship.request_accepted",
        "mentorship.request_declined",
        "mentorship.request_received",
        "staff.claim_assigned",
        "digest.daily_summary",
        "_retired_unused_category_a",
        "ssis.invitation",
        "ssis.evaluation_ready",
        "directory.correction_approved",
        "directory.correction_rejected",
      ],
      notification_priority_enum: ["low", "normal", "high", "critical"],
      opportunity_tier_enum: ["normal", "plus"],
      ownership_enum: ["government", "semi_government", "private"],
      profile_state_enum: ["incomplete", "active", "suspended", "deleted"],
      profile_visibility_enum: ["private", "discoverable", "public"],
      review_visibility_enum: ["private", "public_named", "public_anonymous"],
      ssis_block_kind_enum: ["text", "scenario"],
      ssis_invitation_status_enum: ["sent", "started", "completed", "expired"],
      ssis_recommendation_enum: ["advance", "review", "decline_recommend"],
      ssis_status_enum: ["draft", "pending_approval", "active", "closed"],
      subscriber_type_enum: ["user", "company"],
      subscription_status_enum: [
        "trialing",
        "active",
        "past_due",
        "canceled",
        "expired",
      ],
      user_role_enum: [
        "individual",
        "entity",
        "staff",
        "admin",
        "super_admin",
        "company_admin",
        "university_admin",
      ],
    },
  },
} as const
