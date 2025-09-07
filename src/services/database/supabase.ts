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
    };
  };
};