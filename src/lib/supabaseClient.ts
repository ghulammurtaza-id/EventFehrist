import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Database type definitions for Supabase
// Can be replaced or updated with generated types from Supabase CLI:
// npx supabase gen types typescript --project-id <your-project-id> > src/types/supabase.ts
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
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          event_date: string
          start_time: string | null
          end_time: string | null
          city: string
          category: string
          event_type: string
          location_details: string | null
          registration_url: string | null
          organizer_name: string
          is_verified: boolean
          status: string
          submitted_by_user_id: string | null
          fee: string | null
          eligibility: string | null
          team_size: string | null
          prizes: string | null
          certificate: boolean | null
          reg_deadline: string | null
          tags: string[] | null
          mode: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          event_date: string
          start_time?: string | null
          end_time?: string | null
          city: string
          category: string
          event_type: string
          location_details?: string | null
          registration_url?: string | null
          organizer_name: string
          is_verified?: boolean
          status?: string
          submitted_by_user_id?: string | null
          fee?: string | null
          eligibility?: string | null
          team_size?: string | null
          prizes?: string | null
          certificate?: boolean | null
          reg_deadline?: string | null
          tags?: string[] | null
          mode?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          event_date?: string
          start_time?: string | null
          end_time?: string | null
          city?: string
          category?: string
          event_type?: string
          location_details?: string | null
          registration_url?: string | null
          organizer_name?: string
          is_verified?: boolean
          status?: string
          submitted_by_user_id?: string | null
          fee?: string | null
          eligibility?: string | null
          team_size?: string | null
          prizes?: string | null
          certificate?: boolean | null
          reg_deadline?: string | null
          tags?: string[] | null
          mode?: string | null
          created_at?: string | null
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClientComponentClient({
  supabaseUrl,
  supabaseKey: supabaseAnonKey,
})
