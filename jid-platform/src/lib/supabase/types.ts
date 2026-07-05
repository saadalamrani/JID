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
      claim_requests: {
        Row: {
          business_email: string
          claimant_name: string
          claimant_title: string | null
          company_id: string
          company_name: string
          created_at: string
          evidence_urls: string[]
          id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database['public']['Enums']['claim_status_enum']
          updated_at: string
          user_id: string
        }
        Insert: {
          business_email: string
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
    }
    Views: Record<string, never>
    Functions: {
      check_otp_rate_limit: {
        Args: { p_phone: string; p_user_id: string }
        Returns: undefined
      }
      current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database['public']['Enums']['user_role_enum']
      }
      is_admin_or_above: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_privileged_staff: {
        Args: Record<PropertyKey, never>
        Returns: boolean
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
      verify_phone_otp: {
        Args: { p_otp: string; p_phone: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      claim_status_enum:
        | 'pending'
        | 'under_review'
        | 'approved'
        | 'rejected'
        | 'cancelled'
      user_role_enum:
        | 'individual'
        | 'entity'
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
