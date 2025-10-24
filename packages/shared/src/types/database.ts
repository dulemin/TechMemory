// Database Types based on Supabase Schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          host_user_id: string;
          title: string;
          description: string | null;
          event_date: string;
          event_code: string;
          qr_code_url: string | null;
          hero_image_url: string | null;
          settings: EventSettings;
          status: 'draft' | 'active' | 'archived';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          host_user_id: string;
          title: string;
          description?: string | null;
          event_date: string;
          event_code?: string;
          qr_code_url?: string | null;
          hero_image_url?: string | null;
          settings?: EventSettings;
          status?: 'draft' | 'active' | 'archived';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          host_user_id?: string;
          title?: string;
          description?: string | null;
          event_date?: string;
          event_code?: string;
          qr_code_url?: string | null;
          hero_image_url?: string | null;
          settings?: EventSettings;
          status?: 'draft' | 'active' | 'archived';
          created_at?: string;
          updated_at?: string;
        };
      };
      contributions: {
        Row: {
          id: string;
          event_id: string;
          guest_name: string;
          type: 'video' | 'photo' | 'text';
          content_url: string | null;
          text_content: string | null;
          thumbnail_url: string | null;
          question_answered: string | null;
          status: 'pending' | 'approved' | 'rejected';
          duration_seconds: number | null;
          file_size_bytes: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          guest_name: string;
          type: 'video' | 'photo' | 'text';
          content_url?: string | null;
          text_content?: string | null;
          thumbnail_url?: string | null;
          question_answered?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          duration_seconds?: number | null;
          file_size_bytes?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          guest_name?: string;
          type?: 'video' | 'photo' | 'text';
          content_url?: string | null;
          text_content?: string | null;
          thumbnail_url?: string | null;
          question_answered?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          duration_seconds?: number | null;
          file_size_bytes?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          tier: 'free' | 'premium';
          status: 'active' | 'canceled' | 'past_due';
          current_period_start: string | null;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          tier?: 'free' | 'premium';
          status?: 'active' | 'canceled' | 'past_due';
          current_period_start?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          tier?: 'free' | 'premium';
          status?: 'active' | 'canceled' | 'past_due';
          current_period_start?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Event Settings Type
export interface EventSettings {
  maxGuests: number;
  maxStorageGB: number;
  autoApprove: boolean;
  allowVideo: boolean;
  allowPhoto: boolean;
  allowText: boolean;
  maxVideoDuration: number; // seconds
  maxPhotoSizeMB: number;
  shareExpireDays: number;
  customQuestions?: string[]; // Optional custom questions for guests to answer
}

// Helper Types
export type Event = Database['public']['Tables']['events']['Row'];
export type EventInsert = Database['public']['Tables']['events']['Insert'];
export type EventUpdate = Database['public']['Tables']['events']['Update'];

export type Contribution = Database['public']['Tables']['contributions']['Row'];
export type ContributionInsert = Database['public']['Tables']['contributions']['Insert'];
export type ContributionUpdate = Database['public']['Tables']['contributions']['Update'];

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type Subscription = Database['public']['Tables']['subscriptions']['Row'];
export type SubscriptionInsert = Database['public']['Tables']['subscriptions']['Insert'];
export type SubscriptionUpdate = Database['public']['Tables']['subscriptions']['Update'];
