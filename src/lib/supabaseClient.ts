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
          is_banned: boolean
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
          is_banned?: boolean
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
          is_banned?: boolean
        }
        Relationships: []
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          event_id: string
          reason: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          event_id: string
          reason: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          event_id?: string
          reason?: string
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          }
        ]
      }
      announcements: {
        Row: {
          id: string
          text_content: string
          link_url: string | null
          link_text: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          text_content: string
          link_url?: string | null
          link_text?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          text_content?: string
          link_url?: string | null
          link_text?: string | null
          is_active?: boolean
          created_at?: string
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
