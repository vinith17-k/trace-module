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
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          record_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          record_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          record_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      escalation_log: {
        Row: {
          action_taken: string
          actor: string
          created_at: string
          id: string
          notes: string | null
          recommendation_id: string
        }
        Insert: {
          action_taken: string
          actor?: string
          created_at?: string
          id?: string
          notes?: string | null
          recommendation_id: string
        }
        Update: {
          action_taken?: string
          actor?: string
          created_at?: string
          id?: string
          notes?: string | null
          recommendation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "escalation_log_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "recommendations"
            referencedColumns: ["id"]
          },
        ]
      }
      interactions: {
        Row: {
          anonymized_ref_hash: string | null
          anonymized_ref_id: string
          audio_url: string | null
          channel: Database["public"]["Enums"]["channel_type"]
          consent_given: boolean
          consent_pending: boolean
          consent_timestamp: string | null
          created_at: string
          deleted_at: string | null
          id: string
          identity_ref: string | null
          idempotency_key: string | null
          language_code: string
          last_error: string | null
          pipeline_attempts: number
          pipeline_status: string
          raw_text: string | null
        }
        Insert: {
          anonymized_ref_hash?: string | null
          anonymized_ref_id?: string
          audio_url?: string | null
          channel: Database["public"]["Enums"]["channel_type"]
          consent_given?: boolean
          consent_pending?: boolean
          consent_timestamp?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          identity_ref?: string | null
          idempotency_key?: string | null
          language_code?: string
          last_error?: string | null
          pipeline_attempts?: number
          pipeline_status?: string
          raw_text?: string | null
        }
        Update: {
          anonymized_ref_hash?: string | null
          anonymized_ref_id?: string
          audio_url?: string | null
          channel?: Database["public"]["Enums"]["channel_type"]
          consent_given?: boolean
          consent_pending?: boolean
          consent_timestamp?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          identity_ref?: string | null
          idempotency_key?: string | null
          language_code?: string
          last_error?: string | null
          pipeline_attempts?: number
          pipeline_status?: string
          raw_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interactions_identity_ref_fkey"
            columns: ["identity_ref"]
            isOneToOne: false
            referencedRelation: "victim_identity"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_outbox: {
        Row: {
          channel: string
          created_at: string
          error_message: string | null
          id: string
          next_retry_at: string | null
          payload: Json
          recommendation_id: string | null
          retry_count: number
          sent_at: string | null
          status: string
          target: string | null
        }
        Insert: {
          channel?: string
          created_at?: string
          error_message?: string | null
          id?: string
          next_retry_at?: string | null
          payload?: Json
          recommendation_id?: string | null
          retry_count?: number
          sent_at?: string | null
          status?: string
          target?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          error_message?: string | null
          id?: string
          next_retry_at?: string | null
          payload?: Json
          recommendation_id?: string | null
          retry_count?: number
          sent_at?: string | null
          status?: string
          target?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_outbox_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "recommendations"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendation_rules: {
        Row: {
          action_type: Database["public"]["Enums"]["action_type"]
          active: boolean
          assigned_authority: string | null
          auto_escalate: boolean
          id: string
          priority: Database["public"]["Enums"]["priority_level"]
          required_indicator: string | null
          risk_category: Database["public"]["Enums"]["risk_category"]
          rule_order: number
        }
        Insert: {
          action_type: Database["public"]["Enums"]["action_type"]
          active?: boolean
          assigned_authority?: string | null
          auto_escalate?: boolean
          id?: string
          priority: Database["public"]["Enums"]["priority_level"]
          required_indicator?: string | null
          risk_category: Database["public"]["Enums"]["risk_category"]
          rule_order?: number
        }
        Update: {
          action_type?: Database["public"]["Enums"]["action_type"]
          active?: boolean
          assigned_authority?: string | null
          auto_escalate?: boolean
          id?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          required_indicator?: string | null
          risk_category?: Database["public"]["Enums"]["risk_category"]
          rule_order?: number
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          action_type: Database["public"]["Enums"]["action_type"]
          assigned_authority: string | null
          created_at: string
          deleted_at: string | null
          dispatched_at: string | null
          id: string
          priority: Database["public"]["Enums"]["priority_level"]
          status: Database["public"]["Enums"]["recommendation_status"]
          svi_assessment_id: string
        }
        Insert: {
          action_type: Database["public"]["Enums"]["action_type"]
          assigned_authority?: string | null
          created_at?: string
          deleted_at?: string | null
          dispatched_at?: string | null
          id?: string
          priority: Database["public"]["Enums"]["priority_level"]
          status?: Database["public"]["Enums"]["recommendation_status"]
          svi_assessment_id: string
        }
        Update: {
          action_type?: Database["public"]["Enums"]["action_type"]
          assigned_authority?: string | null
          created_at?: string
          deleted_at?: string | null
          dispatched_at?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          status?: Database["public"]["Enums"]["recommendation_status"]
          svi_assessment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_svi_assessment_id_fkey"
            columns: ["svi_assessment_id"]
            isOneToOne: false
            referencedRelation: "svi_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_lexicon: {
        Row: {
          active: boolean
          id: string
          indicator: string
          language_code: string
          phrase: string
          severity: number
        }
        Insert: {
          active?: boolean
          id?: string
          indicator: string
          language_code: string
          phrase: string
          severity?: number
        }
        Update: {
          active?: boolean
          id?: string
          indicator?: string
          language_code?: string
          phrase?: string
          severity?: number
        }
        Relationships: []
      }
      assessment_outcomes: {
        Row: {
          actual_outcome: string
          created_at: string
          id: string
          initial_risk_category: Database["public"]["Enums"]["risk_category"]
          notes: string | null
          outcome_status: string
          reviewer_id: string | null
          svi_assessment_id: string
        }
        Insert: {
          actual_outcome: string
          created_at?: string
          id?: string
          initial_risk_category: Database["public"]["Enums"]["risk_category"]
          notes?: string | null
          outcome_status: string
          reviewer_id?: string | null
          svi_assessment_id: string
        }
        Update: {
          actual_outcome?: string
          created_at?: string
          id?: string
          initial_risk_category?: Database["public"]["Enums"]["risk_category"]
          notes?: string | null
          outcome_status?: string
          reviewer_id?: string | null
          svi_assessment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_outcomes_svi_assessment_id_fkey"
            columns: ["svi_assessment_id"]
            isOneToOne: false
            referencedRelation: "svi_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          id: string
          interaction_id: string
          model_name: string | null
          started_at: string
          status: string
          tokens_used: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          interaction_id: string
          model_name?: string | null
          started_at?: string
          status: string
          tokens_used?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          interaction_id?: string
          model_name?: string | null
          started_at?: string
          status?: string
          tokens_used?: number
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_runs_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "interactions"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_thresholds: {
        Row: {
          config_version: number
          id: string
          max_score: number
          min_score: number
          risk_category: Database["public"]["Enums"]["risk_category"]
        }
        Insert: {
          config_version?: number
          id?: string
          max_score: number
          min_score: number
          risk_category: Database["public"]["Enums"]["risk_category"]
        }
        Update: {
          config_version?: number
          id?: string
          max_score?: number
          min_score?: number
          risk_category?: Database["public"]["Enums"]["risk_category"]
        }
        Relationships: []
      }
      stress_signals: {
        Row: {
          confidence: number
          created_at: string
          deleted_at: string | null
          id: string
          interaction_id: string
          language_code: string | null
          model_version: string
          numeric_value: number | null
          signal_type: Database["public"]["Enums"]["signal_type"]
          value: Json
        }
        Insert: {
          confidence?: number
          created_at?: string
          deleted_at?: string | null
          id?: string
          interaction_id: string
          language_code?: string | null
          model_version?: string
          numeric_value?: number | null
          signal_type: Database["public"]["Enums"]["signal_type"]
          value?: Json
        }
        Update: {
          confidence?: number
          created_at?: string
          deleted_at?: string | null
          id?: string
          interaction_id?: string
          language_code?: string | null
          model_version?: string
          numeric_value?: number | null
          signal_type?: Database["public"]["Enums"]["signal_type"]
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "stress_signals_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "interactions"
            referencedColumns: ["id"]
          },
        ]
      }
      svi_assessments: {
        Row: {
          computed_at: string
          config_version: string
          deleted_at: string | null
          id: string
          interaction_id: string
          model_version: string
          partial: boolean
          risk_category: Database["public"]["Enums"]["risk_category"]
          svi_score: number
          trauma_indicators: Json
        }
        Insert: {
          computed_at?: string
          config_version?: string
          deleted_at?: string | null
          id?: string
          interaction_id: string
          model_version?: string
          partial?: boolean
          risk_category: Database["public"]["Enums"]["risk_category"]
          svi_score: number
          trauma_indicators?: Json
        }
        Update: {
          computed_at?: string
          config_version?: string
          deleted_at?: string | null
          id?: string
          interaction_id?: string
          model_version?: string
          partial?: boolean
          risk_category?: Database["public"]["Enums"]["risk_category"]
          svi_score?: number
          trauma_indicators?: Json
        }
        Relationships: [
          {
            foreignKeyName: "svi_assessments_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "interactions"
            referencedColumns: ["id"]
          },
        ]
      }
      svi_weights: {
        Row: {
          active: boolean
          config_version: number
          id: string
          max_contribution: number
          notes: string | null
          signal_key: string
          signal_type: Database["public"]["Enums"]["signal_type"]
          weight: number
        }
        Insert: {
          active?: boolean
          config_version?: number
          id?: string
          max_contribution?: number
          notes?: string | null
          signal_key?: string
          signal_type: Database["public"]["Enums"]["signal_type"]
          weight: number
        }
        Update: {
          active?: boolean
          config_version?: number
          id?: string
          max_contribution?: number
          notes?: string | null
          signal_key?: string
          signal_type?: Database["public"]["Enums"]["signal_type"]
          weight?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      victim_identity: {
        Row: {
          address: string | null
          assigned_counsellor_id: string | null
          contact_number: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          address?: string | null
          assigned_counsellor_id?: string | null
          contact_number?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Update: {
          address?: string | null
          assigned_counsellor_id?: string | null
          contact_number?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      action_type:
        | "counselling"
        | "legal_aid"
        | "medical_assistance"
        | "police_intervention"
        | "witness_protection"
        | "emergency_support"
        | "none"
      app_role:
        | "counsellor"
        | "law_enforcement"
        | "admin"
        | "district_officer"
        | "welfare_authority"
      channel_type: "voice" | "chatbot" | "ivrs" | "webform" | "app"
      priority_level: "routine" | "urgent" | "immediate"
      recommendation_status:
        | "pending"
        | "dispatched"
        | "acknowledged"
        | "resolved"
      risk_category: "low" | "moderate" | "high" | "critical"
      signal_type:
        | "lexical"
        | "acoustic_pitch"
        | "acoustic_pause"
        | "speech_rate"
        | "sentiment"
        | "keyword_flag"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      action_type: [
        "counselling",
        "legal_aid",
        "medical_assistance",
        "police_intervention",
        "witness_protection",
        "emergency_support",
        "none",
      ],
      app_role: [
        "counsellor",
        "law_enforcement",
        "admin",
        "district_officer",
        "welfare_authority",
      ],
      channel_type: ["voice", "chatbot", "ivrs", "webform", "app"],
      priority_level: ["routine", "urgent", "immediate"],
      recommendation_status: [
        "pending",
        "dispatched",
        "acknowledged",
        "resolved",
      ],
      risk_category: ["low", "moderate", "high", "critical"],
      signal_type: [
        "lexical",
        "acoustic_pitch",
        "acoustic_pause",
        "speech_rate",
        "sentiment",
        "keyword_flag",
      ],
    },
  },
} as const
