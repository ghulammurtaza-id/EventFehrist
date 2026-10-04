import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Database type definitions for Supabase matching the Postgres schema
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
          organizer_id: string | null
          event_name: string
          organizer_name: string
          category: string
          event_type: string
          event_date: string
          start_time: string | null
          end_time: string | null
          registration_opens: string | null
          registration_deadline: string | null
          city: string
          venue_location: string
          description: string
          registration_url: string | null
          website_social: string | null
          fee: string
          status: string | null
          audience: string[] | null
          level: string[] | null
          highlights: string[] | null
          created_at: string
          review_notes: string | null
        }
        Insert: {
          id?: string
          organizer_id?: string | null
          event_name: string
          organizer_name: string
          category: string
          event_type: string
          event_date: string
          start_time?: string | null
          end_time?: string | null
          registration_opens?: string | null
          registration_deadline?: string | null
          city: string
          venue_location: string
          description: string
          registration_url?: string | null
          website_social?: string | null
          fee: string
          status?: string | null
          audience?: string[] | null
          level?: string[] | null
          highlights?: string[] | null
          created_at?: string
          review_notes?: string | null
        }
        Update: {
          id?: string
          organizer_id?: string | null
          event_name?: string
          organizer_name?: string
          category?: string
          event_type?: string
          event_date?: string
          start_time?: string | null
          end_time?: string | null
          registration_opens?: string | null
          registration_deadline?: string | null
          city?: string
          venue_location?: string
          description?: string
          registration_url?: string | null
          website_social?: string | null
          fee?: string
          status?: string | null
          audience?: string[] | null
          level?: string[] | null
          highlights?: string[] | null
          created_at?: string
          review_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          role: string | null
          created_at: string | null
          updated_at: string | null
          full_name: string | null
          primary_city: string | null
          avatar_url: string | null
        }
        Insert: {
          id: string
          email?: string | null
          role?: string | null
          created_at?: string | null
          updated_at?: string | null
          full_name?: string | null
          primary_city?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          role?: string | null
          created_at?: string | null
          updated_at?: string | null
          full_name?: string | null
          primary_city?: string | null
          avatar_url?: string | null
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
