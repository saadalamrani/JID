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
            foreignKeyName: 'billing_events_subscription_id_fkey'
            columns: ['subscription_id']
            isOneToOne: false
            referencedRelation: 'subscriptions'
            referencedColumns: ['id']
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
            foreignKeyName: 'plan_entitlements_plan_id_fkey'
            columns: ['plan_id']
            isOneToOne: false
            referencedRelation: 'plans'
            referencedColumns: ['id']
          },
        ]
      }
      plans: {
        Row: {
          audience: Database['public']['Enums']['subscriber_type_enum']
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
          audience: Database['public']['Enums']['subscriber_type_enum']
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
          audience?: Database['public']['Enums']['subscriber_type_enum']
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
      subscriptions: {
        Row: {
          activated_by: string | null
          billing_cycle: Database['public']['Enums']['billing_cycle_enum']
          cancel_at_period_end: boolean
          company_id: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          payment_provider: string | null
          plan_id: string
          provider_ref: string | null
          status: Database['public']['Enums']['subscription_status_enum']
          subscriber_type: Database['public']['Enums']['subscriber_type_enum']
          updated_at: string
          user_id: string | null
        }
        Insert: {
          activated_by?: string | null
          billing_cycle: Database['public']['Enums']['billing_cycle_enum']
          cancel_at_period_end?: boolean
          company_id?: string | null
          created_at?: string
          current_period_end: string
          current_period_start?: string
          id?: string
          payment_provider?: string | null
          plan_id: string
          provider_ref?: string | null
          status?: Database['public']['Enums']['subscription_status_enum']
          subscriber_type: Database['public']['Enums']['subscriber_type_enum']
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          activated_by?: string | null
          billing_cycle?: Database['public']['Enums']['billing_cycle_enum']
          cancel_at_period_end?: boolean
          company_id?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          payment_provider?: string | null
          plan_id?: string
          provider_ref?: string | null
          status?: Database['public']['Enums']['subscription_status_enum']
          subscriber_type?: Database['public']['Enums']['subscriber_type_enum']
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'subscriptions_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'subscriptions_plan_id_fkey'
            columns: ['plan_id']
            isOneToOne: false
            referencedRelation: 'plans'
            referencedColumns: ['id']
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
          kind: Database['public']['Enums']['comm_kind_enum']
          recipient_application_ids: string[]
          recipient_count: number
          scheduled_send_at: string | null
          sent_count: number
          status: Database['public']['Enums']['comm_batch_status_enum']
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
          kind: Database['public']['Enums']['comm_kind_enum']
          recipient_application_ids: string[]
          recipient_count: number
          scheduled_send_at?: string | null
          sent_count?: number
          status?: Database['public']['Enums']['comm_batch_status_enum']
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
          kind?: Database['public']['Enums']['comm_kind_enum']
          recipient_application_ids?: string[]
          recipient_count?: number
          scheduled_send_at?: string | null
          sent_count?: number
          status?: Database['public']['Enums']['comm_batch_status_enum']
          template_snapshot?: Json
        }
        Relationships: []
      }
      communication_log: {
        Row: {
          application_id: string
          batch_id: string | null
          channel: string
          id: string
          kind: Database['public']['Enums']['comm_kind_enum']
          provider_message_id: string | null
          sent_at: string
          status: string
        }
        Insert: {
          application_id: string
          batch_id?: string | null
          channel?: string
          id?: string
          kind: Database['public']['Enums']['comm_kind_enum']
          provider_message_id?: string | null
          sent_at?: string
          status: string
        }
        Update: {
          application_id?: string
          batch_id?: string | null
          channel?: string
          id?: string
          kind?: Database['public']['Enums']['comm_kind_enum']
          provider_message_id?: string | null
          sent_at?: string
          status?: string
        }
        Relationships: []
      }
      communication_templates: {
        Row: {
          body_ar: string
          company_id: string
          id: string
          is_locked: boolean
          kind: Database['public']['Enums']['comm_kind_enum']
          subject_ar: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body_ar: string
          company_id: string
          id?: string
          is_locked?: boolean
          kind: Database['public']['Enums']['comm_kind_enum']
          subject_ar: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body_ar?: string
          company_id?: string
          id?: string
          is_locked?: boolean
          kind?: Database['public']['Enums']['comm_kind_enum']
          subject_ar?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
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
          assigned_staff_id: string | null
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
          first_viewed_at: string | null
          first_viewed_by: string | null
          id: string
          rejection_reason: string | null
          required_documents: string[]
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sla_due_at: string | null
          status: Database['public']['Enums']['claim_status_enum']
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_staff_id?: string | null
          business_email: string
          can_reapply_after?: string | null
          claim_type?: Database['public']['Enums']['claim_type_enum']
          claimant_name: string
          claimant_title?: string | null
          company_id: string
          company_name: string
          created_at?: string
          evidence_urls?: string[]
          first_viewed_at?: string | null
          first_viewed_by?: string | null
          id?: string
          rejection_reason?: string | null
          required_documents?: string[]
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sla_due_at?: string | null
          status?: Database['public']['Enums']['claim_status_enum']
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_staff_id?: string | null
          business_email?: string
          can_reapply_after?: string | null
          claim_type?: Database['public']['Enums']['claim_type_enum']
          claimant_name?: string
          claimant_title?: string | null
          company_id?: string
          company_name?: string
          created_at?: string
          domain_verified?: boolean
          evidence_urls?: string[]
          first_viewed_at?: string | null
          first_viewed_by?: string | null
          id?: string
          rejection_reason?: string | null
          required_documents?: string[]
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sla_due_at?: string | null
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
      content_flags: {
        Row: {
          assigned_staff_id: string | null
          created_at: string
          details: string | null
          id: string
          reason: Database['public']['Enums']['flag_reason_enum']
          reporter_id: string
          resolution_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database['public']['Enums']['flag_status_enum']
          target_id: string
          target_type: Database['public']['Enums']['content_flag_target_type_enum']
          updated_at: string
        }
        Insert: {
          assigned_staff_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason: Database['public']['Enums']['flag_reason_enum']
          reporter_id: string
          resolution_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database['public']['Enums']['flag_status_enum']
          target_id: string
          target_type: Database['public']['Enums']['content_flag_target_type_enum']
          updated_at?: string
        }
        Update: {
          assigned_staff_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason?: Database['public']['Enums']['flag_reason_enum']
          reporter_id?: string
          resolution_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database['public']['Enums']['flag_status_enum']
          target_id?: string
          target_type?: Database['public']['Enums']['content_flag_target_type_enum']
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'content_flags_reporter_id_fkey'
            columns: ['reporter_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'content_flags_reviewed_by_fkey'
            columns: ['reviewed_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
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
          source: Database['public']['Enums']['contact_message_source_enum']
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
          source?: Database['public']['Enums']['contact_message_source_enum']
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
          source?: Database['public']['Enums']['contact_message_source_enum']
          subject?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'contact_messages_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
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
      email_send_log: {
        Row: {
          attempted_at: string | null
          category: Database['public']['Enums']['notification_category_enum'] | null
          created_at: string
          error_message: string | null
          id: string
          metadata: Json
          notification_id: string | null
          provider_message_id: string | null
          recipient_email: string
          recipient_id: string
          sent_at: string | null
          status: Database['public']['Enums']['email_send_status_enum']
        }
        Insert: {
          attempted_at?: string | null
          category?: Database['public']['Enums']['notification_category_enum'] | null
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json
          notification_id?: string | null
          provider_message_id?: string | null
          recipient_email: string
          recipient_id: string
          sent_at?: string | null
          status?: Database['public']['Enums']['email_send_status_enum']
        }
        Update: {
          attempted_at?: string | null
          category?: Database['public']['Enums']['notification_category_enum'] | null
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json
          notification_id?: string | null
          provider_message_id?: string | null
          recipient_email?: string
          recipient_id?: string
          sent_at?: string | null
          status?: Database['public']['Enums']['email_send_status_enum']
        }
        Relationships: [
          {
            foreignKeyName: 'email_send_log_notification_id_fkey'
            columns: ['notification_id']
            isOneToOne: false
            referencedRelation: 'notifications'
            referencedColumns: ['id']
          },
        ]
      }
      notification_preferences: {
        Row: {
          category: Database['public']['Enums']['notification_category_enum']
          email_enabled: boolean
          in_app_enabled: boolean
          include_in_digest: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          category: Database['public']['Enums']['notification_category_enum']
          email_enabled?: boolean
          in_app_enabled?: boolean
          include_in_digest?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: Database['public']['Enums']['notification_category_enum']
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
          category: Database['public']['Enums']['notification_category_enum']
          created_at: string
          delivered_via_email: boolean
          email_message_id: string | null
          email_sent_at: string | null
          id: string
          included_in_digest_id: string | null
          idempotency_key: string | null
          metadata: Json
          priority: Database['public']['Enums']['notification_priority_enum']
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
          category: Database['public']['Enums']['notification_category_enum']
          created_at?: string
          delivered_via_email?: boolean
          email_message_id?: string | null
          email_sent_at?: string | null
          id?: string
          included_in_digest_id?: string | null
          idempotency_key?: string | null
          metadata?: Json
          priority?: Database['public']['Enums']['notification_priority_enum']
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
          category?: Database['public']['Enums']['notification_category_enum']
          created_at?: string
          delivered_via_email?: boolean
          email_message_id?: string | null
          email_sent_at?: string | null
          id?: string
          included_in_digest_id?: string | null
          idempotency_key?: string | null
          metadata?: Json
          priority?: Database['public']['Enums']['notification_priority_enum']
          read_at?: string | null
          recipient_id?: string
          related_resource_id?: string | null
          related_resource_type?: string | null
          title_ar?: string
          title_en?: string
        }
        Relationships: []
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
          onboarding_completed_at: string | null
          onboarding_skipped_at: string | null
          onboarding_started_at: string | null
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
          onboarding_completed_at?: string | null
          onboarding_skipped_at?: string | null
          onboarding_started_at?: string | null
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
          onboarding_completed_at?: string | null
          onboarding_skipped_at?: string | null
          onboarding_started_at?: string | null
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
          tier: Database['public']['Enums']['opportunity_tier_enum']
          title_ar: string
          title_en: string | null
          updated_at: string
          view_count: number
          is_boosted: boolean
          boost_starts_at: string | null
          boost_ends_at: string | null
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
          tier?: Database['public']['Enums']['opportunity_tier_enum']
          title_ar: string
          title_en?: string | null
          updated_at?: string
          view_count?: number
          is_boosted?: boolean
          boost_starts_at?: string | null
          boost_ends_at?: string | null
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
          tier?: Database['public']['Enums']['opportunity_tier_enum']
          title_ar?: string
          title_en?: string | null
          updated_at?: string
          view_count?: number
          is_boosted?: boolean
          boost_starts_at?: string | null
          boost_ends_at?: string | null
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
      job_boost_daily_stats: {
        Row: {
          job_id: string
          stat_date: string
          impressions: number
          card_opens: number
          intent_clicks: number
          declarations: number
        }
        Insert: {
          job_id: string
          stat_date: string
          impressions?: number
          card_opens?: number
          intent_clicks?: number
          declarations?: number
        }
        Update: {
          job_id?: string
          stat_date?: string
          impressions?: number
          card_opens?: number
          intent_clicks?: number
          declarations?: number
        }
        Relationships: [
          {
            foreignKeyName: 'job_boost_daily_stats_job_id_fkey'
            columns: ['job_id']
            isOneToOne: false
            referencedRelation: 'jobs'
            referencedColumns: ['id']
          },
        ]
      }
      ssis_screenings: {
        Row: {
          id: string
          job_id: string
          company_id: string
          status: Database['public']['Enums']['ssis_status_enum']
          generation_context: Json
          model_version: string | null
          pass_threshold: number
          time_limit_minutes: number
          invitation_validity_days: number
          preview_acknowledged_at: string | null
          preview_acknowledged_by: string | null
          created_by: string | null
          approved_by: string | null
          approved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          company_id: string
          status?: Database['public']['Enums']['ssis_status_enum']
          generation_context: Json
          model_version?: string | null
          pass_threshold?: number
          time_limit_minutes?: number
          invitation_validity_days?: number
          preview_acknowledged_at?: string | null
          preview_acknowledged_by?: string | null
          created_by?: string | null
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          company_id?: string
          status?: Database['public']['Enums']['ssis_status_enum']
          generation_context?: Json
          model_version?: string | null
          pass_threshold?: number
          time_limit_minutes?: number
          invitation_validity_days?: number
          preview_acknowledged_at?: string | null
          preview_acknowledged_by?: string | null
          created_by?: string | null
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ssis_blocks: {
        Row: {
          id: string
          screening_id: string
          kind: Database['public']['Enums']['ssis_block_kind_enum']
          display_order: number
          prompt_ar: string
          rubric: Json
          ai_generated: boolean
          edited_by_human: boolean
          max_score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          screening_id: string
          kind: Database['public']['Enums']['ssis_block_kind_enum']
          display_order: number
          prompt_ar: string
          rubric: Json
          ai_generated?: boolean
          edited_by_human?: boolean
          max_score?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          screening_id?: string
          kind?: Database['public']['Enums']['ssis_block_kind_enum']
          display_order?: number
          prompt_ar?: string
          rubric?: Json
          ai_generated?: boolean
          edited_by_human?: boolean
          max_score?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ssis_invitations: {
        Row: {
          id: string
          screening_id: string
          application_id: string
          consent_given_at: string | null
          expires_at: string
          started_at: string | null
          completed_at: string | null
          status: Database['public']['Enums']['ssis_invitation_status_enum']
          created_at: string
        }
        Insert: {
          id?: string
          screening_id: string
          application_id: string
          consent_given_at?: string | null
          expires_at: string
          started_at?: string | null
          completed_at?: string | null
          status?: Database['public']['Enums']['ssis_invitation_status_enum']
          created_at?: string
        }
        Update: {
          id?: string
          screening_id?: string
          application_id?: string
          consent_given_at?: string | null
          expires_at?: string
          started_at?: string | null
          completed_at?: string | null
          status?: Database['public']['Enums']['ssis_invitation_status_enum']
          created_at?: string
        }
        Relationships: []
      }
      ssis_responses: {
        Row: {
          id: string
          invitation_id: string
          block_id: string
          answer_text: string
          submitted_at: string
          updated_at: string
          purge_after: string | null
        }
        Insert: {
          id?: string
          invitation_id: string
          block_id: string
          answer_text: string
          submitted_at?: string
          updated_at?: string
          purge_after?: string | null
        }
        Update: {
          id?: string
          invitation_id?: string
          block_id?: string
          answer_text?: string
          submitted_at?: string
          updated_at?: string
          purge_after?: string | null
        }
        Relationships: []
      }
      ssis_evaluations: {
        Row: {
          id: string
          invitation_id: string
          composite_score: number
          per_block: Json
          recommendation: Database['public']['Enums']['ssis_recommendation_enum']
          model_version: string
          evaluated_at: string
        }
        Insert: {
          id?: string
          invitation_id: string
          composite_score: number
          per_block: Json
          recommendation: Database['public']['Enums']['ssis_recommendation_enum']
          model_version: string
          evaluated_at?: string
        }
        Update: {
          id?: string
          invitation_id?: string
          composite_score?: number
          per_block?: Json
          recommendation?: Database['public']['Enums']['ssis_recommendation_enum']
          model_version?: string
          evaluated_at?: string
        }
        Relationships: []
      }
      mandate_matches: {
        Row: {
          id: string
          mandate_id: string
          job_id: string | null
          lammah_id: string | null
          score: number
          match_reasons: Json
          matched_at: string
          seen_at: string | null
          dismissed_at: string | null
          dismissed_reason: string | null
        }
        Insert: {
          id?: string
          mandate_id: string
          job_id?: string | null
          lammah_id?: string | null
          score: number
          match_reasons?: Json
          matched_at?: string
          seen_at?: string | null
          dismissed_at?: string | null
          dismissed_reason?: string | null
        }
        Update: {
          id?: string
          mandate_id?: string
          job_id?: string | null
          lammah_id?: string | null
          score?: number
          match_reasons?: Json
          matched_at?: string
          seen_at?: string | null
          dismissed_at?: string | null
          dismissed_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'mandate_matches_mandate_id_fkey'
            columns: ['mandate_id']
            isOneToOne: false
            referencedRelation: 'search_mandates'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'mandate_matches_job_id_fkey'
            columns: ['job_id']
            isOneToOne: false
            referencedRelation: 'jobs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'mandate_matches_lammah_id_fkey'
            columns: ['lammah_id']
            isOneToOne: false
            referencedRelation: 'lammah_opportunities'
            referencedColumns: ['id']
          },
        ]
      }
      search_mandates: {
        Row: {
          id: string
          user_id: string
          name: string
          is_active: boolean
          sectors: string[]
          regions: string[]
          ownership_types: Database['public']['Enums']['ownership_enum'][]
          experience_levels: Database['public']['Enums']['experience_level_enum'][]
          keywords: string[]
          include_lammah: boolean
          digest_frequency: string
          weight_overrides: Json
          created_at: string
          updated_at: string
          last_run_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          is_active?: boolean
          sectors?: string[]
          regions?: string[]
          ownership_types?: Database['public']['Enums']['ownership_enum'][]
          experience_levels?: Database['public']['Enums']['experience_level_enum'][]
          keywords?: string[]
          include_lammah?: boolean
          digest_frequency?: string
          weight_overrides?: Json
          created_at?: string
          updated_at?: string
          last_run_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          is_active?: boolean
          sectors?: string[]
          regions?: string[]
          ownership_types?: Database['public']['Enums']['ownership_enum'][]
          experience_levels?: Database['public']['Enums']['experience_level_enum'][]
          keywords?: string[]
          include_lammah?: boolean
          digest_frequency?: string
          weight_overrides?: Json
          created_at?: string
          updated_at?: string
          last_run_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'search_mandates_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      lammah_opportunities: {
        Row: {
          id: string
          source_id: string
          company_id: string | null
          company_name_raw: string
          title_ar: string | null
          title_en: string | null
          excerpt: string | null
          sector: string
          region: string
          ownership_type: Database['public']['Enums']['ownership_enum'] | null
          experience_level: Database['public']['Enums']['experience_level_enum'] | null
          external_url: string
          external_ref_hash: string
          source_published_at: string
          scraped_at: string
          expires_at: string
          status: Database['public']['Enums']['lammah_status_enum']
          superseded_by_job_id: string | null
          extraction_confidence: number
          hidden_by: string | null
          hidden_reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          source_id: string
          company_id?: string | null
          company_name_raw: string
          title_ar?: string | null
          title_en?: string | null
          excerpt?: string | null
          sector: string
          region: string
          ownership_type?: Database['public']['Enums']['ownership_enum'] | null
          experience_level?: Database['public']['Enums']['experience_level_enum'] | null
          external_url: string
          external_ref_hash: string
          source_published_at: string
          scraped_at?: string
          status?: Database['public']['Enums']['lammah_status_enum']
          superseded_by_job_id?: string | null
          extraction_confidence?: number
          hidden_by?: string | null
          hidden_reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          source_id?: string
          company_id?: string | null
          company_name_raw?: string
          title_ar?: string | null
          title_en?: string | null
          excerpt?: string | null
          sector?: string
          region?: string
          ownership_type?: Database['public']['Enums']['ownership_enum'] | null
          experience_level?: Database['public']['Enums']['experience_level_enum'] | null
          external_url?: string
          external_ref_hash?: string
          source_published_at?: string
          scraped_at?: string
          status?: Database['public']['Enums']['lammah_status_enum']
          superseded_by_job_id?: string | null
          extraction_confidence?: number
          hidden_by?: string | null
          hidden_reason?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'lammah_opportunities_source_id_fkey'
            columns: ['source_id']
            isOneToOne: false
            referencedRelation: 'lammah_sources'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lammah_opportunities_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lammah_opportunities_superseded_by_job_id_fkey'
            columns: ['superseded_by_job_id']
            isOneToOne: false
            referencedRelation: 'jobs'
            referencedColumns: ['id']
          },
        ]
      }
      lammah_radar_items: {
        Row: {
          id: string
          user_id: string
          lammah_id: string
          self_declared: boolean
          declared_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lammah_id: string
          self_declared?: boolean
          declared_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          lammah_id?: string
          self_declared?: boolean
          declared_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'lammah_radar_items_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lammah_radar_items_lammah_id_fkey'
            columns: ['lammah_id']
            isOneToOne: false
            referencedRelation: 'lammah_opportunities'
            referencedColumns: ['id']
          },
        ]
      }
      lammah_sources: {
        Row: {
          id: string
          name: string
          company_id: string | null
          base_url: string
          source_type: string
          trust_tier: number
          is_active: boolean
          robots_ok: boolean
          crawl_frequency_hours: number
          last_crawled_at: string | null
          last_content_hash: string | null
          consecutive_failures: number
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          company_id?: string | null
          base_url: string
          source_type: string
          trust_tier: number
          is_active?: boolean
          robots_ok?: boolean
          crawl_frequency_hours?: number
          last_crawled_at?: string | null
          last_content_hash?: string | null
          consecutive_failures?: number
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          company_id?: string | null
          base_url?: string
          source_type?: string
          trust_tier?: number
          is_active?: boolean
          robots_ok?: boolean
          crawl_frequency_hours?: number
          last_crawled_at?: string | null
          last_content_hash?: string | null
          consecutive_failures?: number
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'lammah_sources_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lammah_sources_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      cv_additional: {
        Row: {
          category: Database['public']['Enums']['additional_category_enum']
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
          category: Database['public']['Enums']['additional_category_enum']
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
          category?: Database['public']['Enums']['additional_category_enum']
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
            foreignKeyName: 'cv_additional_cv_id_fkey'
            columns: ['cv_id']
            isOneToOne: false
            referencedRelation: 'cvs'
            referencedColumns: ['id']
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
            foreignKeyName: 'cv_education_cv_id_fkey'
            columns: ['cv_id']
            isOneToOne: false
            referencedRelation: 'cvs'
            referencedColumns: ['id']
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
            foreignKeyName: 'cv_experience_cv_id_fkey'
            columns: ['cv_id']
            isOneToOne: false
            referencedRelation: 'cvs'
            referencedColumns: ['id']
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
          status: Database['public']['Enums']['cv_generation_status_enum']
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
          status?: Database['public']['Enums']['cv_generation_status_enum']
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
          status?: Database['public']['Enums']['cv_generation_status_enum']
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'cv_generations_cv_id_fkey'
            columns: ['cv_id']
            isOneToOne: false
            referencedRelation: 'cvs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'cv_generations_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
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
            foreignKeyName: 'cv_skills_cv_id_fkey'
            columns: ['cv_id']
            isOneToOne: false
            referencedRelation: 'cvs'
            referencedColumns: ['id']
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
          linkedin_url: string | null
          locale: string
          phone: string | null
          portfolio_url: string | null
          status: Database['public']['Enums']['cv_status_enum']
          summary: string | null
          technical_skills: Json
          languages: Json
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
          linkedin_url?: string | null
          locale?: string
          phone?: string | null
          portfolio_url?: string | null
          status?: Database['public']['Enums']['cv_status_enum']
          summary?: string | null
          technical_skills?: Json
          languages?: Json
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
          linkedin_url?: string | null
          locale?: string
          phone?: string | null
          portfolio_url?: string | null
          status?: Database['public']['Enums']['cv_status_enum']
          summary?: string | null
          technical_skills?: Json
          languages?: Json
          template_key?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'cvs_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
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
            foreignKeyName: 'emergency_actions_activated_by_fkey'
            columns: ['activated_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'emergency_actions_deactivated_by_fkey'
            columns: ['deactivated_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      feature_flags: {
        Row: {
          category: string
          created_at: string
          description_ar: string | null
          description_en: string | null
          enabled_for_roles: Database['public']['Enums']['user_role_enum'][]
          is_enabled: boolean
          key: string
          label_ar: string
          label_en: string
          min_role: Database['public']['Enums']['user_role_enum']
          updated_at: string
          updated_by: string | null
          user_overrides: Json
        }
        Insert: {
          category?: string
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          enabled_for_roles?: Database['public']['Enums']['user_role_enum'][]
          is_enabled?: boolean
          key: string
          label_ar: string
          label_en: string
          min_role?: Database['public']['Enums']['user_role_enum']
          updated_at?: string
          updated_by?: string | null
          user_overrides?: Json
        }
        Update: {
          category?: string
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          enabled_for_roles?: Database['public']['Enums']['user_role_enum'][]
          is_enabled?: boolean
          key?: string
          label_ar?: string
          label_en?: string
          min_role?: Database['public']['Enums']['user_role_enum']
          updated_at?: string
          updated_by?: string | null
          user_overrides?: Json
        }
        Relationships: [
          {
            foreignKeyName: 'feature_flags_updated_by_fkey'
            columns: ['updated_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      metric_thresholds: {
        Row: {
          current_value: number
          is_met: boolean
          label_ar: string
          label_en: string
          metric_key: string
          min_value: number
          updated_at: string
        }
        Insert: {
          current_value?: number
          label_ar: string
          label_en: string
          metric_key: string
          min_value: number
          updated_at?: string
        }
        Update: {
          current_value?: number
          label_ar?: string
          label_en?: string
          metric_key?: string
          min_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      platform_config: {
        Row: {
          description: string | null
          is_secret: boolean
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          is_secret?: boolean
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          description?: string | null
          is_secret?: boolean
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: 'platform_config_updated_by_fkey'
            columns: ['updated_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      public_announcements: {
        Row: {
          body_ar: string | null
          category: Database['public']['Enums']['announcement_category_enum']
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
          category: Database['public']['Enums']['announcement_category_enum']
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
          category?: Database['public']['Enums']['announcement_category_enum']
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
            foreignKeyName: 'public_announcements_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'public_announcements_updated_by_fkey'
            columns: ['updated_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
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
          active_jobs: number
          id: number
          jid_response_rate_pct: number
          refreshed_at: string
          total_candidates: number
          total_companies: number
          total_jobs_ever: number
          total_mentors: number
          total_sessions: number
        }
        Relationships: []
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
      assign_claim_to_self: {
        Args: { p_claim_id: string }
        Returns: undefined
      }
      check_email_otp_rate_limit: {
        Args: { p_email: string; p_user_id: string }
        Returns: undefined
      }
      check_otp_rate_limit: {
        Args: { p_phone: string; p_user_id: string }
        Returns: undefined
      }
      build_daily_digests: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      complete_staff_invite_acceptance: {
        Args: { p_token: string }
        Returns: undefined
      }
      current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database['public']['Enums']['user_role_enum']
      }
      dispatch_notification: {
        Args: {
          p_action_label_ar?: string | null
          p_action_label_en?: string | null
          p_action_url?: string | null
          p_body_ar: string
          p_body_en: string
          p_category: Database['public']['Enums']['notification_category_enum']
          p_idempotency_key?: string | null
          p_metadata?: Json
          p_priority?: Database['public']['Enums']['notification_priority_enum']
          p_recipient_id: string
          p_related_resource_id?: string | null
          p_related_resource_type?: string | null
          p_title_ar: string
          p_title_en: string
        }
        Returns: string | null
      }
      get_default_digest_pref: {
        Args: { cat: Database['public']['Enums']['notification_category_enum'] }
        Returns: boolean
      }
      get_default_email_pref: {
        Args: { cat: Database['public']['Enums']['notification_category_enum'] }
        Returns: boolean
      }
      get_notification_preference: {
        Args: {
          p_category: Database['public']['Enums']['notification_category_enum']
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
      is_category_mandatory: {
        Args: { cat: Database['public']['Enums']['notification_category_enum'] }
        Returns: boolean
      }
      get_my_entitlements: {
        Args: Record<PropertyKey, never>
        Returns: {
          feature_key: string
          quota: number | null
        }[]
      }
      has_entitlement: {
        Args: { p_feature: string }
        Returns: boolean
      }
      company_has_entitlement: {
        Args: { p_company_id: string; p_feature: string }
        Returns: boolean
      }
      compute_cascade_suggestion: {
        Args: { p_job_id: string }
        Returns: {
          suggestion_kind: Database['public']['Enums']['comm_kind_enum']
          target_status: Database['public']['Enums']['application_status_enum']
          recipient_ids: string[]
          recipient_count: number
        }[]
      }
      create_communication_batch: {
        Args: {
          p_job_id: string
          p_kind: Database['public']['Enums']['comm_kind_enum']
          p_recipient_ids: string[]
          p_template_snapshot?: Json | null
        }
        Returns: string
      }
      cancel_communication_batch: {
        Args: { p_batch_id: string }
        Returns: boolean
      }
      claim_due_communication_batches: {
        Args: { p_limit?: number }
        Returns: Database['public']['Tables']['communication_batches']['Row'][]
      }
      finalize_communication_batch: {
        Args: {
          p_batch_id: string
          p_sent_count: number
          p_failed_count: number
          p_status: Database['public']['Enums']['comm_batch_status_enum']
        }
        Returns: undefined
      }
      ensure_communication_templates: {
        Args: { p_company_id: string }
        Returns: undefined
      }
      job_auto_reply_enabled: {
        Args: { p_job_id: string }
        Returns: boolean
      }
      ingest_lammah_opportunity: {
        Args: { p: Json }
        Returns: string | null
      }
      lammah_weekly_active_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_search_mandate: {
        Args: { p: Json }
        Returns: string
      }
      update_search_mandate: {
        Args: { p_id: string; p: Json }
        Returns: boolean
      }
      dismiss_mandate_match: {
        Args: { p_match_id: string; p_reason: string }
        Returns: boolean
      }
      mark_mandate_matches_seen: {
        Args: { p_mandate_id?: string | null }
        Returns: number
      }
      abhathli_unseen_match_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      toggle_job_boost: {
        Args: { p_job_id: string; p_enable: boolean }
        Returns: undefined
      }
      sweep_expired_boosts: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_company_boost_usage: {
        Args: { p_company_id: string }
        Returns: { quota: number | null; active_count: number | null }[]
      }
      increment_job_boost_stat: {
        Args: { p_job_id: string; p_metric: string }
        Returns: undefined
      }
      assemble_ssis_generation_context: {
        Args: { p_job_id: string }
        Returns: Json
      }
      consent_ssis_invitation: {
        Args: { p_invitation_id: string }
        Returns: Database['public']['Tables']['ssis_invitations']['Row']
      }
      start_ssis_invitation: {
        Args: { p_invitation_id: string }
        Returns: Database['public']['Tables']['ssis_invitations']['Row']
      }
      submit_ssis_response: {
        Args: {
          p_invitation_id: string
          p_block_id: string
          p_answer_text: string
        }
        Returns: Database['public']['Tables']['ssis_responses']['Row']
      }
      complete_ssis_invitation: {
        Args: { p_invitation_id: string }
        Returns: Database['public']['Tables']['ssis_invitations']['Row']
      }
      acknowledge_ssis_preview: {
        Args: { p_screening_id: string }
        Returns: Database['public']['Tables']['ssis_screenings']['Row']
      }
      approve_ssis_screening: {
        Args: { p_screening_id: string }
        Returns: Database['public']['Tables']['ssis_screenings']['Row']
      }
      invite_ssis_applicants: {
        Args: { p_screening_id: string; p_application_ids: string[] }
        Returns: number
      }
      record_ssis_outcome: {
        Args: { p_invitation_id: string; p_action: string }
        Returns: undefined
      }
      user_owns_ssis_job: {
        Args: { p_job_id: string }
        Returns: boolean
      }
      purge_expired_lammah: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      notify_claim_decision: {
        Args: {
          p_claim_id: string
          p_decision: string
          p_reason?: string | null
        }
        Returns: string | null
      }
      notify_radar_status_change: {
        Args: {
          p_card_id: string
          p_new_status: string
          p_old_status: string
        }
        Returns: string | null
      }
      email_quota_status: {
        Args: Record<PropertyKey, never>
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
      expire_lapsed_subscriptions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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
      get_staff_personal_metrics: {
        Args: Record<PropertyKey, never>
        Returns: Database['public']['Views']['v_staff_personal_metrics']['Row'][]
      }
      is_feature_enabled: {
        Args: { p_flag_key: string }
        Returns: boolean
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
      refresh_sys_metrics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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
      staff_suspend_user: {
        Args: { p_reason: string; p_user_id: string }
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
      comm_kind_enum:
        | 'received_ack'
        | 'shortlisted'
        | 'interview_invite'
        | 'acceptance'
        | 'rejection'
        | 'holding_update'
      comm_batch_status_enum:
        | 'pending_confirmation'
        | 'scheduled'
        | 'sending'
        | 'sent'
        | 'canceled'
        | 'failed'
      billing_cycle_enum: 'monthly' | 'yearly'
      subscription_status_enum: 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired'
      subscriber_type_enum: 'user' | 'company'
      opportunity_tier_enum: 'normal' | 'plus'
      additional_category_enum:
        | 'certification'
        | 'award'
        | 'leadership'
        | 'volunteer'
        | 'project'
        | 'publication'
        | 'language'
        | 'other'
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
      announcement_category_enum:
        | 'jobs'
        | 'mentorship'
        | 'events'
        | 'platform'
        | 'community'
      claim_status_enum:
        | 'pending'
        | 'pending_review'
        | 'under_review'
        | 'approved'
        | 'rejected'
        | 'cancelled'
        | 'submitted'
        | 'needs_more_info'
      claim_type_enum: 'company' | 'university'
      contact_message_source_enum: 'onboarding' | 'contact_page' | 'claim_help'
      content_flag_target_type_enum:
        | 'profile'
        | 'job'
        | 'company'
        | 'mentor_profile'
        | 'announcement'
        | 'message'
      cv_generation_status_enum: 'pending' | 'completed' | 'failed'
      cv_status_enum: 'draft' | 'published' | 'archived'
      email_send_status_enum:
        | 'queued'
        | 'sent'
        | 'failed'
        | 'skipped_quota'
        | 'skipped_prefs'
        | 'skipped_bounced'
      experience_level_enum: 'intern' | 'entry' | 'mid' | 'senior' | 'lead' | 'executive'
      flag_reason_enum:
        | 'spam'
        | 'harassment'
        | 'hate_speech'
        | 'inappropriate_content'
        | 'misinformation'
        | 'impersonation'
        | 'copyright_violation'
        | 'privacy_violation'
        | 'other'
      flag_status_enum: 'pending' | 'under_review' | 'resolved' | 'dismissed'
      job_status_enum:
        | 'draft'
        | 'published'
        | 'closing_soon'
        | 'closed'
        | 'expired'
        | 'pending_review'
      lammah_status_enum: 'active' | 'hidden' | 'superseded' | 'expired'
      ssis_status_enum: 'draft' | 'pending_approval' | 'active' | 'closed'
      ssis_block_kind_enum: 'text' | 'scenario'
      ssis_invitation_status_enum: 'sent' | 'started' | 'completed' | 'expired'
      ssis_recommendation_enum: 'advance' | 'review' | 'decline_recommend'
      link_status_enum: 'healthy' | 'broken' | 'pending'
      mentor_notification_status_enum: 'pending' | 'sent' | 'dismissed'
      mentor_workshop_status_enum: 'draft' | 'published' | 'completed' | 'cancelled'
      notification_category_enum:
        | 'auth.email_verified'
        | 'auth.mfa_disabled'
        | 'auth.mfa_enabled'
        | 'auth.new_device_login'
        | 'auth.password_changed'
        | 'auth.password_reset_requested'
        | 'auth.phone_verified'
        | 'auth.session_revoked'
        | 'account.reinstated'
        | 'account.suspended'
        | 'claim.approved'
        | 'claim.needs_more_info'
        | 'claim.rejected'
        | 'company.link_broken'
        | 'job.application_expired'
        | 'job.application_received'
        | 'job.application_status_changed'
        | 'job.expiring_soon'
        | 'job.posted'
        | 'search.mandate_match'
        | 'ssis.invitation'
        | 'ssis.evaluation_ready'
        | 'legal.privacy_updated'
        | 'legal.terms_updated'
        | 'mentor.application_approved'
        | 'mentor.application_rejected'
        | 'mentorship.feedback_requested'
        | 'mentorship.meeting_confirmed'
        | 'mentorship.meeting_proposed'
        | 'mentorship.meeting_reminder'
        | 'mentorship.request_accepted'
        | 'mentorship.request_declined'
        | 'mentorship.request_received'
        | 'staff.claim_assigned'
        | 'digest.daily_summary'
      notification_priority_enum: 'low' | 'normal' | 'high' | 'critical'
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
