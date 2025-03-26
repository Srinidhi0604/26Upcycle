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
      users: {
        Row: {
          id: string
          username: string
          full_name: string
          email: string
          user_type: 'seller' | 'collector' | 'both'
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          full_name: string
          email: string
          user_type: 'seller' | 'collector' | 'both'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          username?: string
          full_name?: string
          email?: string
          user_type?: 'seller' | 'collector' | 'both'
          avatar_url?: string | null
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          title: string
          description: string
          price: number
          category: string
          condition: string
          images: string[]
          seller_id: string
          sold: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          price: number
          category: string
          condition: string
          images: string[]
          seller_id: string
          sold?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string
          price?: number
          category?: string
          condition?: string
          images?: string[]
          sold?: boolean
          updated_at?: string
        }
      }
      chats: {
        Row: {
          id: string
          product_id: string
          seller_id: string
          collector_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          seller_id: string
          collector_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          chat_id: string
          sender_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          chat_id: string
          sender_id: string
          content: string
          created_at?: string
        }
        Update: {
          content?: string
        }
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