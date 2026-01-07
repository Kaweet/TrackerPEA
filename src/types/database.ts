export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      config: {
        Row: {
          id: string
          user_id: string
          start_date: string
          start_capital: number
          start_deposited: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          start_date: string
          start_capital: number
          start_deposited: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          start_date?: string
          start_capital?: number
          start_deposited?: number
          updated_at?: string
        }
        Relationships: []
      }
      entries: {
        Row: {
          id: string
          user_id: string
          date: string
          capital: number
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          capital: number
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          capital?: number
          note?: string | null
        }
        Relationships: []
      }
      deposits: {
        Row: {
          id: string
          user_id: string
          date: string
          amount: number
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          amount: number
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          amount?: number
          note?: string | null
        }
        Relationships: []
      }
      dca_config: {
        Row: {
          id: string
          user_id: string
          enabled: boolean
          amount: number
          day_of_month_1: number
          day_of_month_2: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          enabled?: boolean
          amount?: number
          day_of_month_1?: number
          day_of_month_2?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          enabled?: boolean
          amount?: number
          day_of_month_1?: number
          day_of_month_2?: number | null
          updated_at?: string
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
      [_ in never]: never
    }
  }
}

// Types utilitaires
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
