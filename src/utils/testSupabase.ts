// src/utils/testSupabase.ts
import Constants from 'expo-constants';
import { supabase } from '@/services/database/supabase';

export async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('foods_master')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    console.log('Database response:', data);
    return true;
  } catch (error) {
    console.error('❌ Supabase test failed:', error);
    return false;
  }
}

// Test environment variables are loaded
export function testEnvironmentVariables() {
  const url = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL;
  const key = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('🔍 Environment Variables Check:');
  console.log('URL loaded:', !!url);
  console.log('Key loaded:', !!key);
  console.log('URL value:', url?.substring(0, 30) + '...');
  console.log('Key starts with:', key?.substring(0, 20) + '...');
  
  return !!(url && key);
}