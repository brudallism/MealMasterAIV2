// src/services/database/supabase.ts
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

// Export types for TypeScript
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          updated_at: string;
          subscription_status: string;
          onboarding_completed: boolean;
        };
      };
      daily_meals: {
        Row: {
          id: string;
          user_id: string;
          food_id: string | null;
          meal_type: string;
          quantity_grams: number;
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          meal_date: string;
          logged_at: string;
          ai_confidence: number;
          user_confirmed: boolean;
          notes: string | null;
          created_at: string;
        };
      };
      foods_master: {
        Row: {
          id: string;
          spoonacular_id: string | null;
          usda_id: string | null;
          food_name: string;
          brand_name: string | null;
          food_category: string | null;
          calories_per_100g: number | null;
          protein_per_100g: number | null;
          carbs_per_100g: number | null;
          fat_per_100g: number | null;
          fiber_per_100g: number | null;
          common_portion_name: string | null;
          common_portion_grams: number | null;
          allergens: string[] | null;
          data_source: string;
          created_at: string;
          updated_at: string;
        };
      };
      food_recognition_cache: {
        Row: {
          id: string;
          food_key: string;
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          fiber: number;
          sugar: number;
          sodium: number;
          data_source: string;
          confidence: number;
          usage_count: number;
          created_at: string;
          last_used: string;
        };
      };
      audit_trails: {
        Row: {
          id: string;
          operation_id: string;
          timestamp: string;
          user_id: string | null;
          system_name: string;
          operation_type: string;
          table_name: string;
          before_state: any | null;
          after_state: any | null;
          changed_fields: string[] | null;
          validation_status: string;
          validation_tier: number | null;
          execution_time_ms: number | null;
          integrity_hash: string | null;
          ip_address: string | null;
          user_agent: string | null;
          error_details: any | null;
          business_context: any | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          operation_id?: string;
          timestamp?: string;
          user_id?: string | null;
          system_name: string;
          operation_type: string;
          table_name: string;
          before_state?: any | null;
          after_state?: any | null;
          changed_fields?: string[] | null;
          validation_status: string;
          validation_tier?: number | null;
          execution_time_ms?: number | null;
          integrity_hash?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          error_details?: any | null;
          business_context?: any | null;
          created_at?: string;
        };
      };
      data_validation_logs: {
        Row: {
          id: string;
          operation_id: string;
          audit_trail_id: string;
          validation_tier: number;
          validation_type: string;
          validation_result: string;
          confidence_score: number | null;
          processing_time_ms: number | null;
          validation_details: any | null;
          error_messages: string[] | null;
          warnings: string[] | null;
          recommendations: string[] | null;
          ai_model_used: string | null;
          tokens_used: number | null;
          api_cost_usd: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          operation_id: string;
          audit_trail_id: string;
          validation_tier: number;
          validation_type: string;
          validation_result: string;
          confidence_score?: number | null;
          processing_time_ms?: number | null;
          validation_details?: any | null;
          error_messages?: string[] | null;
          warnings?: string[] | null;
          recommendations?: string[] | null;
          ai_model_used?: string | null;
          tokens_used?: number | null;
          api_cost_usd?: number | null;
          created_at?: string;
        };
      };
      system_integrity_checks: {
        Row: {
          id: string;
          check_type: string;
          check_timestamp: string;
          scope_description: string | null;
          status: string;
          issues_found: number | null;
          issues_details: any | null;
          check_duration_ms: number | null;
          records_checked: number | null;
          auto_remediation_attempted: boolean | null;
          manual_intervention_required: boolean | null;
          escalation_triggered: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          check_type: string;
          check_timestamp?: string;
          scope_description?: string | null;
          status: string;
          issues_found?: number | null;
          issues_details?: any | null;
          check_duration_ms?: number | null;
          records_checked?: number | null;
          auto_remediation_attempted?: boolean | null;
          manual_intervention_required?: boolean | null;
          escalation_triggered?: boolean | null;
          created_at?: string;
        };
      };
    };
  };
};