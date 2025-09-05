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
      // Add other table types as needed
    };
  };
};