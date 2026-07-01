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
      cco_fleet: {
        Row: {
          categoria: string
          created_at: string
          equipamento: string
          id: string
          local: string
          operador_turno_a: string
          operador_turno_b: string
          placa: string
          tipo: string
          updated_at: string
        }
        Insert: {
          categoria?: string
          created_at?: string
          equipamento: string
          id?: string
          local?: string
          operador_turno_a?: string
          operador_turno_b?: string
          placa?: string
          tipo?: string
          updated_at?: string
        }
        Update: {
          categoria?: string
          created_at?: string
          equipamento?: string
          id?: string
          local?: string
          operador_turno_a?: string
          operador_turno_b?: string
          placa?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      cco_maintenance: {
        Row: {
          area: string
          created_at: string
          data: string
          horas_perdidas: string
          id: string
          inicio: string | null
          letra: string
          liberacao: string | null
          motorista: string
          observacao: string | null
          placa: string
          servico: string
          status: string
          tipo_equipamento: string
          tipo_manutencao: string
        }
        Insert: {
          area?: string
          created_at?: string
          data?: string
          horas_perdidas?: string
          id?: string
          inicio?: string | null
          letra?: string
          liberacao?: string | null
          motorista?: string
          observacao?: string | null
          placa?: string
          servico?: string
          status?: string
          tipo_equipamento?: string
          tipo_manutencao?: string
        }
        Update: {
          area?: string
          created_at?: string
          data?: string
          horas_perdidas?: string
          id?: string
          inicio?: string | null
          letra?: string
          liberacao?: string | null
          motorista?: string
          observacao?: string | null
          placa?: string
          servico?: string
          status?: string
          tipo_equipamento?: string
          tipo_manutencao?: string
        }
        Relationships: []
      }
      cco_third_party: {
        Row: {
          aderencia: number | null
          atendimento: string
          created_at: string
          data: string
          desvio: string
          df_percent: number | null
          dono: string
          hora_prog_final: string
          hora_prog_inicio: string
          hora_real_final: string
          hora_real_inicio: string
          id: string
          justificativa: string
          os: string
          status: string
          tag: string
          tipo_equipamento: string
          total_hora_prog: number | null
          total_hora_real: number | null
        }
        Insert: {
          aderencia?: number | null
          atendimento?: string
          created_at?: string
          data?: string
          desvio?: string
          df_percent?: number | null
          dono?: string
          hora_prog_final?: string
          hora_prog_inicio?: string
          hora_real_final?: string
          hora_real_inicio?: string
          id?: string
          justificativa?: string
          os?: string
          status?: string
          tag?: string
          tipo_equipamento?: string
          total_hora_prog?: number | null
          total_hora_real?: number | null
        }
        Update: {
          aderencia?: number | null
          atendimento?: string
          created_at?: string
          data?: string
          desvio?: string
          df_percent?: number | null
          dono?: string
          hora_prog_final?: string
          hora_prog_inicio?: string
          hora_real_final?: string
          hora_real_inicio?: string
          id?: string
          justificativa?: string
          os?: string
          status?: string
          tag?: string
          tipo_equipamento?: string
          total_hora_prog?: number | null
          total_hora_real?: number | null
        }
        Relationships: []
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
      daily_attendance: {
        Row: {
          created_at: string
          date: string
          employee_id: string
          id: string
          observation: string | null
          status: string
        }
        Insert: {
          created_at?: string
          date?: string
          employee_id: string
          id?: string
          observation?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          date?: string
          employee_id?: string
          id?: string
          observation?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_documents: {
        Row: {
          created_at: string
          document_type: string
          employee_id: string
          file_name: string
          file_url: string
          id: string
        }
        Insert: {
          created_at?: string
          document_type?: string
          employee_id: string
          file_name?: string
          file_url: string
          id?: string
        }
        Update: {
          created_at?: string
          document_type?: string
          employee_id?: string
          file_name?: string
          file_url?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_warnings: {
        Row: {
          applied: boolean
          created_at: string
          date: string
          employee_id: string
          id: string
          observation: string | null
          reason: string
          updated_at: string
        }
        Insert: {
          applied?: boolean
          created_at?: string
          date?: string
          employee_id: string
          id?: string
          observation?: string | null
          reason?: string
          updated_at?: string
        }
        Update: {
          applied?: boolean
          created_at?: string
          date?: string
          employee_id?: string
          id?: string
          observation?: string | null
          reason?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_warnings_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
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
      events: {
        Row: {
          contract: string | null
          created_at: string
          day_of_week: string | null
          description: string
          equipment: string | null
          event_date: string
          event_time: string | null
          id: string
          involved_name: string
          location: string | null
          plate_tag: string | null
          shift: string | null
          supervisor: string | null
          updated_at: string
        }
        Insert: {
          contract?: string | null
          created_at?: string
          day_of_week?: string | null
          description?: string
          equipment?: string | null
          event_date: string
          event_time?: string | null
          id?: string
          involved_name?: string
          location?: string | null
          plate_tag?: string | null
          shift?: string | null
          supervisor?: string | null
          updated_at?: string
        }
        Update: {
          contract?: string | null
          created_at?: string
          day_of_week?: string | null
          description?: string
          equipment?: string | null
          event_date?: string
          event_time?: string | null
          id?: string
          involved_name?: string
          location?: string | null
          plate_tag?: string | null
          shift?: string | null
          supervisor?: string | null
          updated_at?: string
        }
        Relationships: []
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
      nine_box_historico: {
        Row: {
          id: string
          employee_id: string
          desempenho: string
          potencial: string
          cycle: string
          observacao: string | null
          created_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          desempenho: string
          potencial: string
          cycle: string
          observacao?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          desempenho?: string
          potencial?: string
          cycle?: string
          observacao?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nine_box_historico_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          }
        ]
      }
      fit_cultural: {
        Row: {
          created_at: string
          criteria: string
          employee_id: string
          id: string
          score: number | null
          stage: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          criteria: string
          employee_id: string
          id?: string
          score?: number | null
          stage?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          criteria?: string
          employee_id?: string
          id?: string
          score?: number | null
          stage?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fit_cultural_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      funcionarios: {
        Row: {
          cargo: string
          created_at: string
          data_admissao: string
          departamento: string
          email: string | null
          encarregado_id: string | null
          escolaridade: string
          feedbacks_recebidos: number
          feedbacks_resolvidos: number
          foto_url: string | null
          graduacao: string
          id: string
          letra: string
          nome: string
          pos_graduacao: boolean
          pos_graduacao_tipo: string
          turno: string
          nine_box_desempenho: string | null
          nine_box_potencial: string | null
          fit_cultural: number | null
        }
        Insert: {
          cargo: string
          created_at?: string
          data_admissao?: string
          departamento: string
          email?: string | null
          encarregado_id?: string | null
          escolaridade?: string
          feedbacks_recebidos?: number
          feedbacks_resolvidos?: number
          foto_url?: string | null
          graduacao?: string
          id?: string
          letra?: string
          nome: string
          pos_graduacao?: boolean
          pos_graduacao_tipo?: string
          turno?: string
          nine_box_desempenho?: string | null
          nine_box_potencial?: string | null
          fit_cultural?: number | null
        }
        Update: {
          cargo?: string
          created_at?: string
          data_admissao?: string
          departamento?: string
          email?: string | null
          encarregado_id?: string | null
          escolaridade?: string
          feedbacks_recebidos?: number
          feedbacks_resolvidos?: number
          foto_url?: string | null
          graduacao?: string
          id?: string
          letra?: string
          nome?: string
          pos_graduacao?: boolean
          pos_graduacao_tipo?: string
          turno?: string
          nine_box_desempenho?: string | null
          nine_box_potencial?: string | null
          fit_cultural?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "funcionarios_encarregado_id_fkey"
            columns: ["encarregado_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
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
      meeting_action_items: {
        Row: {
          completed_at: string | null
          created_at: string
          how: string | null
          how_much: string | null
          id: string
          meeting_id: string
          status: string
          updated_at: string
          what: string
          when: string | null
          where_location: string | null
          who: string
          why: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          how?: string | null
          how_much?: string | null
          id?: string
          meeting_id: string
          status?: string
          updated_at?: string
          what?: string
          when?: string | null
          where_location?: string | null
          who?: string
          why?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          how?: string | null
          how_much?: string | null
          id?: string
          meeting_id?: string
          status?: string
          updated_at?: string
          what?: string
          when?: string | null
          where_location?: string | null
          who?: string
          why?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_action_items_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_attendees: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          meeting_id: string
          present: boolean
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          meeting_id: string
          present?: boolean
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          meeting_id?: string
          present?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "meeting_attendees_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_attendees_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_documents: {
        Row: {
          created_at: string
          document_type: string
          file_name: string
          file_url: string
          id: string
          meeting_id: string
        }
        Insert: {
          created_at?: string
          document_type?: string
          file_name?: string
          file_url: string
          id?: string
          meeting_id: string
        }
        Update: {
          created_at?: string
          document_type?: string
          file_name?: string
          file_url?: string
          id?: string
          meeting_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_documents_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          action_items: string | null
          created_at: string
          employee_id: string
          id: string
          manager_name: string
          material_url: string | null
          meeting_date: string
          meeting_type: string
          notes: string | null
          status: string
          title: string | null
        }
        Insert: {
          action_items?: string | null
          created_at?: string
          employee_id: string
          id?: string
          manager_name: string
          material_url?: string | null
          meeting_date?: string
          meeting_type?: string
          notes?: string | null
          status?: string
          title?: string | null
        }
        Update: {
          action_items?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          manager_name?: string
          material_url?: string | null
          meeting_date?: string
          meeting_type?: string
          notes?: string | null
          status?: string
          title?: string | null
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
      overtime_control: {
        Row: {
          created_at: string
          employee_id: string
          extras_count: number
          id: string
          max_extras: number
          period_end: string
          period_start: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          extras_count?: number
          id?: string
          max_extras?: number
          period_end: string
          period_start: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          extras_count?: number
          id?: string
          max_extras?: number
          period_end?: string
          period_start?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "overtime_control_employee_id_fkey"
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
      vacation_control: {
        Row: {
          created_at: string
          days_count: number | null
          employee_id: string
          end_date: string | null
          id: string
          last_vacation_year1: string | null
          last_vacation_year2: string | null
          observation: string | null
          remaining_days: number | null
          scheduled_month: string | null
          start_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          days_count?: number | null
          employee_id: string
          end_date?: string | null
          id?: string
          last_vacation_year1?: string | null
          last_vacation_year2?: string | null
          observation?: string | null
          remaining_days?: number | null
          scheduled_month?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          days_count?: number | null
          employee_id?: string
          end_date?: string | null
          id?: string
          last_vacation_year1?: string | null
          last_vacation_year2?: string | null
          observation?: string | null
          remaining_days?: number | null
          scheduled_month?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vacation_control_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
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
