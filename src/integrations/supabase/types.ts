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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bolinha_match_context: {
        Row: {
          away_team_id: number | null
          away_team_name: string | null
          context_summary: string | null
          created_at: string | null
          events_data: Json | null
          fixture_data: Json | null
          fixture_id: number
          h2h_data: Json | null
          home_team_id: number | null
          home_team_name: string | null
          id: string
          injuries_data: Json | null
          is_active: boolean | null
          last_synced_at: string | null
          league_name: string | null
          league_round: string | null
          lineups_data: Json | null
          live_summary: string | null
          match_date: string | null
          pre_match_summary: string | null
          predictions_data: Json | null
          statistics_data: Json | null
          venue_name: string | null
        }
        Insert: {
          away_team_id?: number | null
          away_team_name?: string | null
          context_summary?: string | null
          created_at?: string | null
          events_data?: Json | null
          fixture_data?: Json | null
          fixture_id: number
          h2h_data?: Json | null
          home_team_id?: number | null
          home_team_name?: string | null
          id?: string
          injuries_data?: Json | null
          is_active?: boolean | null
          last_synced_at?: string | null
          league_name?: string | null
          league_round?: string | null
          lineups_data?: Json | null
          live_summary?: string | null
          match_date?: string | null
          pre_match_summary?: string | null
          predictions_data?: Json | null
          statistics_data?: Json | null
          venue_name?: string | null
        }
        Update: {
          away_team_id?: number | null
          away_team_name?: string | null
          context_summary?: string | null
          created_at?: string | null
          events_data?: Json | null
          fixture_data?: Json | null
          fixture_id?: number
          h2h_data?: Json | null
          home_team_id?: number | null
          home_team_name?: string | null
          id?: string
          injuries_data?: Json | null
          is_active?: boolean | null
          last_synced_at?: string | null
          league_name?: string | null
          league_round?: string | null
          lineups_data?: Json | null
          live_summary?: string | null
          match_date?: string | null
          pre_match_summary?: string | null
          predictions_data?: Json | null
          statistics_data?: Json | null
          venue_name?: string | null
        }
        Relationships: []
      }
      bolinha_messages: {
        Row: {
          audio_url: string | null
          created_at: string | null
          emotion: string
          event_type: string | null
          fixture_id: number | null
          id: string
          team_id: number | null
          text: string
        }
        Insert: {
          audio_url?: string | null
          created_at?: string | null
          emotion?: string
          event_type?: string | null
          fixture_id?: number | null
          id?: string
          team_id?: number | null
          text: string
        }
        Update: {
          audio_url?: string | null
          created_at?: string | null
          emotion?: string
          event_type?: string | null
          fixture_id?: number | null
          id?: string
          team_id?: number | null
          text?: string
        }
        Relationships: []
      }
      community_members: {
        Row: {
          country: string
          created_at: string
          email: string
          favorite_team_id: number | null
          favorite_team_name: string | null
          id: string
          message: string | null
          name: string
        }
        Insert: {
          country: string
          created_at?: string
          email: string
          favorite_team_id?: number | null
          favorite_team_name?: string | null
          id?: string
          message?: string | null
          name: string
        }
        Update: {
          country?: string
          created_at?: string
          email?: string
          favorite_team_id?: number | null
          favorite_team_name?: string | null
          id?: string
          message?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_favorite_team_id_fkey"
            columns: ["favorite_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      monitored_leagues: {
        Row: {
          country: string
          country_flag: string | null
          coverage: Json | null
          created_at: string | null
          id: number
          is_active: boolean | null
          logo: string | null
          name: string
          priority: number | null
          season: number
          updated_at: string | null
        }
        Insert: {
          country: string
          country_flag?: string | null
          coverage?: Json | null
          created_at?: string | null
          id: number
          is_active?: boolean | null
          logo?: string | null
          name: string
          priority?: number | null
          season: number
          updated_at?: string | null
        }
        Update: {
          country?: string
          country_flag?: string | null
          coverage?: Json | null
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          logo?: string | null
          name?: string
          priority?: number | null
          season?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      standings_cache: {
        Row: {
          data: Json
          fetched_at: string | null
          league_id: number
          season: number
        }
        Insert: {
          data: Json
          fetched_at?: string | null
          league_id: number
          season: number
        }
        Update: {
          data?: Json
          fetched_at?: string | null
          league_id?: number
          season?: number
        }
        Relationships: []
      }
      teams: {
        Row: {
          country: string
          country_name: string | null
          created_at: string
          id: number
          logo: string | null
          name: string
        }
        Insert: {
          country: string
          country_name?: string | null
          created_at?: string
          id: number
          logo?: string | null
          name: string
        }
        Update: {
          country?: string
          country_name?: string | null
          created_at?: string
          id?: number
          logo?: string | null
          name?: string
        }
        Relationships: []
      }
      top_scorers_cache: {
        Row: {
          data: Json
          fetched_at: string | null
          league_id: number
          season: number
          type: string
        }
        Insert: {
          data: Json
          fetched_at?: string | null
          league_id: number
          season: number
          type?: string
        }
        Update: {
          data?: Json
          fetched_at?: string | null
          league_id?: number
          season?: number
          type?: string
        }
        Relationships: []
      }
      upcoming_fixtures_cache: {
        Row: {
          away_team_id: number | null
          data: Json
          fetched_at: string | null
          fixture_id: number
          home_team_id: number | null
          league_id: number
          match_date: string
        }
        Insert: {
          away_team_id?: number | null
          data: Json
          fetched_at?: string | null
          fixture_id: number
          home_team_id?: number | null
          league_id: number
          match_date: string
        }
        Update: {
          away_team_id?: number | null
          data?: Json
          fetched_at?: string | null
          fixture_id?: number
          home_team_id?: number | null
          league_id?: number
          match_date?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clean_old_bolinha_messages: { Args: never; Returns: undefined }
      clean_old_fixtures: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
