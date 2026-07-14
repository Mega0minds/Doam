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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      energy_profiles: {
        Row: {
          chronotype: string
          created_at: string
          high_focus_end: string | null
          high_focus_start: string | null
          id: string
          low_energy_end: string | null
          low_energy_start: string | null
          sleep_time: string
          updated_at: string
          user_id: string
          wake_time: string
        }
        Insert: {
          chronotype?: string
          created_at?: string
          high_focus_end?: string | null
          high_focus_start?: string | null
          id?: string
          low_energy_end?: string | null
          low_energy_start?: string | null
          sleep_time?: string
          updated_at?: string
          user_id: string
          wake_time?: string
        }
        Update: {
          chronotype?: string
          created_at?: string
          high_focus_end?: string | null
          high_focus_start?: string | null
          id?: string
          low_energy_end?: string | null
          low_energy_start?: string | null
          sleep_time?: string
          updated_at?: string
          user_id?: string
          wake_time?: string
        }
        Relationships: []
      }
      fixed_commitments: {
        Row: {
          category: string | null
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_locked: boolean
          start_time: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_locked?: boolean
          start_time: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_locked?: boolean
          start_time?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      goal_actions: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number
          effort_level: string
          frequency: string
          goal_id: string
          id: string
          is_active: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          effort_level?: string
          frequency?: string
          goal_id: string
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          effort_level?: string
          frequency?: string
          goal_id?: string
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_actions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_history: {
        Row: {
          action_type: string
          created_at: string
          goal_category: string
          goal_id: string | null
          goal_title: string
          id: string
          new_state: Json | null
          notes: string | null
          previous_state: Json | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          goal_category: string
          goal_id?: string | null
          goal_title: string
          id?: string
          new_state?: Json | null
          notes?: string | null
          previous_state?: Json | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          goal_category?: string
          goal_id?: string | null
          goal_title?: string
          id?: string
          new_state?: Json | null
          notes?: string | null
          previous_state?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_history_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          category: Database["public"]["Enums"]["goal_category"]
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          priority_rank: number
          target_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["goal_category"]
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          priority_rank: number
          target_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["goal_category"]
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          priority_rank?: number
          target_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          language: string
          last_active_date: string | null
          last_intelligent_sent_date: string | null
          last_message_index: number
          last_sent_at: string | null
          morning_motivation: boolean
          preferred_time: string
          sleep_alarm: boolean
          sleep_time: string
          task_reminders: boolean
          timezone: string
          updated_at: string
          user_id: string
          wake_alarm: boolean
          wake_time: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          language?: string
          last_active_date?: string | null
          last_intelligent_sent_date?: string | null
          last_message_index?: number
          last_sent_at?: string | null
          morning_motivation?: boolean
          preferred_time?: string
          sleep_alarm?: boolean
          sleep_time?: string
          task_reminders?: boolean
          timezone?: string
          updated_at?: string
          user_id: string
          wake_alarm?: boolean
          wake_time?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          language?: string
          last_active_date?: string | null
          last_intelligent_sent_date?: string | null
          last_message_index?: number
          last_sent_at?: string | null
          morning_motivation?: boolean
          preferred_time?: string
          sleep_alarm?: boolean
          sleep_time?: string
          task_reminders?: boolean
          timezone?: string
          updated_at?: string
          user_id?: string
          wake_alarm?: boolean
          wake_time?: string
        }
        Relationships: []
      }
      onboarding_status: {
        Row: {
          commitments_completed: boolean
          created_at: string
          energy_completed: boolean
          goals_completed: boolean
          id: string
          onboarding_completed: boolean
          progress_data: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          commitments_completed?: boolean
          created_at?: string
          energy_completed?: boolean
          goals_completed?: boolean
          id?: string
          onboarding_completed?: boolean
          progress_data?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          commitments_completed?: boolean
          created_at?: string
          energy_completed?: boolean
          goals_completed?: boolean
          id?: string
          onboarding_completed?: boolean
          progress_data?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      schedule_slots: {
        Row: {
          created_at: string | null
          end_time: string
          id: string
          justification: string | null
          start_time: string
          task_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_time: string
          id?: string
          justification?: string | null
          start_time: string
          task_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_time?: string
          id?: string
          justification?: string | null
          start_time?: string
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_slots_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_feedback: {
        Row: {
          actual_duration_minutes: number | null
          completed_at: string
          created_at: string
          id: string
          schedule_slot_id: string | null
          skipped_reason: string | null
          status: string
          task_id: string | null
          user_id: string
        }
        Insert: {
          actual_duration_minutes?: number | null
          completed_at?: string
          created_at?: string
          id?: string
          schedule_slot_id?: string | null
          skipped_reason?: string | null
          status?: string
          task_id?: string | null
          user_id: string
        }
        Update: {
          actual_duration_minutes?: number | null
          completed_at?: string
          created_at?: string
          id?: string
          schedule_slot_id?: string | null
          skipped_reason?: string | null
          status?: string
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_feedback_schedule_slot_id_fkey"
            columns: ["schedule_slot_id"]
            isOneToOne: false
            referencedRelation: "schedule_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_feedback_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string | null
          due_date: string | null
          due_time: string | null
          estimated_duration_min: number
          id: string
          notes: string | null
          overdue_reminder_sent_at: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          reminder_enabled: boolean
          reminder_sent_at: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          type: Database["public"]["Enums"]["task_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          due_date?: string | null
          due_time?: string | null
          estimated_duration_min: number
          id?: string
          notes?: string | null
          overdue_reminder_sent_at?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          reminder_enabled?: boolean
          reminder_sent_at?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          type: Database["public"]["Enums"]["task_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          due_date?: string | null
          due_time?: string | null
          estimated_duration_min?: number
          id?: string
          notes?: string | null
          overdue_reminder_sent_at?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          reminder_enabled?: boolean
          reminder_sent_at?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          type?: Database["public"]["Enums"]["task_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_patterns: {
        Row: {
          confidence: number
          detected_at: string
          id: string
          is_active: boolean
          pattern_data: Json
          pattern_type: string
          user_id: string
        }
        Insert: {
          confidence?: number
          detected_at?: string
          id?: string
          is_active?: boolean
          pattern_data: Json
          pattern_type: string
          user_id: string
        }
        Update: {
          confidence?: number
          detected_at?: string
          id?: string
          is_active?: boolean
          pattern_data?: Json
          pattern_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          academic_level: string | null
          ai_biography: string | null
          ai_biography_updated_at: string | null
          consistency_level: string | null
          created_at: string
          field_of_study: string | null
          goal_deepdive_completed: boolean
          goal_deepdive_data: Json | null
          id: string
          long_term_aspirations: string | null
          nickname: string | null
          preferred_work_style: string | null
          self_described_strengths: string[] | null
          self_described_struggles: string[] | null
          stress_periods: string[] | null
          study_habits: string | null
          typical_blockers: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          academic_level?: string | null
          ai_biography?: string | null
          ai_biography_updated_at?: string | null
          consistency_level?: string | null
          created_at?: string
          field_of_study?: string | null
          goal_deepdive_completed?: boolean
          goal_deepdive_data?: Json | null
          id?: string
          long_term_aspirations?: string | null
          nickname?: string | null
          preferred_work_style?: string | null
          self_described_strengths?: string[] | null
          self_described_struggles?: string[] | null
          stress_periods?: string[] | null
          study_habits?: string | null
          typical_blockers?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          academic_level?: string | null
          ai_biography?: string | null
          ai_biography_updated_at?: string | null
          consistency_level?: string | null
          created_at?: string
          field_of_study?: string | null
          goal_deepdive_completed?: boolean
          goal_deepdive_data?: Json | null
          id?: string
          long_term_aspirations?: string | null
          nickname?: string | null
          preferred_work_style?: string | null
          self_described_strengths?: string[] | null
          self_described_struggles?: string[] | null
          stress_periods?: string[] | null
          study_habits?: string | null
          typical_blockers?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_rhythms: {
        Row: {
          created_at: string | null
          id: string
          low_energy_end: string
          low_energy_start: string
          peak_focus_end: string
          peak_focus_start: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          low_energy_end: string
          low_energy_start: string
          peak_focus_end: string
          peak_focus_start: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          low_energy_end?: string
          low_energy_start?: string
          peak_focus_end?: string
          peak_focus_start?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      goal_category:
        | "academic_career"
        | "health"
        | "personal_growth"
        | "social"
        | "spiritual_mental"
        | "rest_recreation"
      task_priority: "HIGH" | "MEDIUM" | "LOW"
      task_status: "To Do" | "Scheduled" | "Complete"
      task_type: "Deep Work" | "Shallow Work" | "Creative"
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
      goal_category: [
        "academic_career",
        "health",
        "personal_growth",
        "social",
        "spiritual_mental",
        "rest_recreation",
      ],
      task_priority: ["HIGH", "MEDIUM", "LOW"],
      task_status: ["To Do", "Scheduled", "Complete"],
      task_type: ["Deep Work", "Shallow Work", "Creative"],
    },
  },
} as const
