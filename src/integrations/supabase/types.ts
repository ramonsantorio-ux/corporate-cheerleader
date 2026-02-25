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
      absences: {
        Row: {
          created_at: string
          employee_id: string
          end_date: string
          id: string
          reason: string | null
          start_date: string
          status: string
          type: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          end_date: string
          id?: string
          reason?: string | null
          start_date: string
          status?: string
          type?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          end_date?: string
          id?: string
          reason?: string | null
          start_date?: string
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "absences_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      climate_responses: {
        Row: {
          comment: string | null
          created_at: string
          employee_id: string
          id: string
          score: number
          survey_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          employee_id: string
          id?: string
          score: number
          survey_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          score?: number
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "climate_responses_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "climate_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "climate_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      climate_surveys: {
        Row: {
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      competencies: {
        Row: {
          created_at: string
          cycle_id: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          cycle_id?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          cycle_id?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "competencies_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "evaluation_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_cycles: {
        Row: {
          created_at: string
          end_date: string
          id: string
          name: string
          start_date: string
          status: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          name: string
          start_date: string
          status?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          name?: string
          start_date?: string
          status?: string
        }
        Relationships: []
      }
      evaluation_responses: {
        Row: {
          comment: string | null
          competency_id: string
          created_at: string
          evaluation_id: string
          id: string
          score: number
        }
        Insert: {
          comment?: string | null
          competency_id: string
          created_at?: string
          evaluation_id: string
          id?: string
          score: number
        }
        Update: {
          comment?: string | null
          competency_id?: string
          created_at?: string
          evaluation_id?: string
          id?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_responses_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_responses_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "evaluations"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluations: {
        Row: {
          completed_at: string | null
          created_at: string
          cycle_id: string
          evaluated_name: string
          evaluator_name: string
          evaluator_role: string
          id: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          cycle_id: string
          evaluated_name: string
          evaluator_name: string
          evaluator_role: string
          id?: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          cycle_id?: string
          evaluated_name?: string
          evaluator_name?: string
          evaluator_role?: string
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "evaluation_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      feedbacks: {
        Row: {
          atualizado_em: string
          autor: string
          comentarios: number
          criado_em: string
          departamento: string
          descricao: string
          gestor: string | null
          id: string
          observacoes: string | null
          pontos_melhoria: string | null
          pontos_positivos: string | null
          prioridade: string
          setor: string
          status: string
          titulo: string
          votos: number
        }
        Insert: {
          atualizado_em?: string
          autor: string
          comentarios?: number
          criado_em?: string
          departamento?: string
          descricao: string
          gestor?: string | null
          id?: string
          observacoes?: string | null
          pontos_melhoria?: string | null
          pontos_positivos?: string | null
          prioridade?: string
          setor: string
          status?: string
          titulo: string
          votos?: number
        }
        Update: {
          atualizado_em?: string
          autor?: string
          comentarios?: number
          criado_em?: string
          departamento?: string
          descricao?: string
          gestor?: string | null
          id?: string
          observacoes?: string | null
          pontos_melhoria?: string | null
          pontos_positivos?: string | null
          prioridade?: string
          setor?: string
          status?: string
          titulo?: string
          votos?: number
        }
        Relationships: []
      }
      funcionarios: {
        Row: {
          cargo: string
          created_at: string
          data_admissao: string
          departamento: string
          email: string | null
          feedbacks_recebidos: number
          feedbacks_resolvidos: number
          foto_url: string | null
          id: string
          nome: string
        }
        Insert: {
          cargo: string
          created_at?: string
          data_admissao?: string
          departamento: string
          email?: string | null
          feedbacks_recebidos?: number
          feedbacks_resolvidos?: number
          foto_url?: string | null
          id?: string
          nome: string
        }
        Update: {
          cargo?: string
          created_at?: string
          data_admissao?: string
          departamento?: string
          email?: string | null
          feedbacks_recebidos?: number
          feedbacks_resolvidos?: number
          foto_url?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          abaixo: string
          acima: string
          cargo: string
          created_at: string
          dentro: string
          descricao: string
          id: string
          muito_abaixo: string
          muito_acima: string
          peso: number
          resultado: number | null
        }
        Insert: {
          abaixo?: string
          acima?: string
          cargo: string
          created_at?: string
          dentro?: string
          descricao: string
          id?: string
          muito_abaixo?: string
          muito_acima?: string
          peso: number
          resultado?: number | null
        }
        Update: {
          abaixo?: string
          acima?: string
          cargo?: string
          created_at?: string
          dentro?: string
          descricao?: string
          id?: string
          muito_abaixo?: string
          muito_acima?: string
          peso?: number
          resultado?: number | null
        }
        Relationships: []
      }
      meetings: {
        Row: {
          action_items: string | null
          created_at: string
          employee_id: string
          id: string
          manager_name: string
          meeting_date: string
          notes: string | null
          status: string
        }
        Insert: {
          action_items?: string | null
          created_at?: string
          employee_id: string
          id?: string
          manager_name: string
          meeting_date?: string
          notes?: string | null
          status?: string
        }
        Update: {
          action_items?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          manager_name?: string
          meeting_date?: string
          notes?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      pdi_actions: {
        Row: {
          competency_id: string | null
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          pdi_id: string
          progress: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          competency_id?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          pdi_id: string
          progress?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          competency_id?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          pdi_id?: string
          progress?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdi_actions_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdi_actions_pdi_id_fkey"
            columns: ["pdi_id"]
            isOneToOne: false
            referencedRelation: "pdis"
            referencedColumns: ["id"]
          },
        ]
      }
      pdis: {
        Row: {
          created_at: string
          cycle_id: string
          employee_name: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cycle_id: string
          employee_name: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cycle_id?: string
          employee_name?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdis_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "evaluation_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string
          full_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          can_edit: boolean
          can_view: boolean
          id: string
          page: string
          user_id: string
        }
        Insert: {
          can_edit?: boolean
          can_view?: boolean
          id?: string
          page: string
          user_id: string
        }
        Update: {
          can_edit?: boolean
          can_view?: boolean
          id?: string
          page?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
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
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
