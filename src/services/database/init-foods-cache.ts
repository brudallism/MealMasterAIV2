// src/services/database/init-foods-cache.ts
import { supabase } from './supabase';

export async function initializeFoodsCacheTable(): Promise<void> {
  try {
    console.log('[Database] Initializing foods_master table for cache system...');
    
    // SQL to create the foods_master table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS foods_master (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        food_key text UNIQUE NOT NULL,
        calories numeric NOT NULL,
        protein numeric NOT NULL,
        carbs numeric NOT NULL,
        fat numeric NOT NULL,
        fiber numeric DEFAULT 0,
        sugar numeric DEFAULT 0,
        sodium numeric DEFAULT 0,
        data_source text NOT NULL CHECK (data_source IN ('spoonacular', 'usda', 'gpt_generated')),
        confidence numeric NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
        usage_count integer DEFAULT 1,
        created_at timestamptz DEFAULT now(),
        last_used timestamptz DEFAULT now()
      );
    `;
    
    const { error: createError } = await supabase.rpc('create_foods_master_table', {});
    
    if (createError) {
      // Try direct SQL execution if RPC doesn't work
      console.log('[Database] RPC failed, trying direct SQL execution...');
      
      const { error: sqlError } = await supabase
        .from('foods_master')
        .select('id')
        .limit(1);
        
      if (sqlError && sqlError.code === '42P01') { // Table doesn't exist
        console.error('[Database] foods_master table does not exist and cannot be created via client.');
        console.error('[Database] Please create the table manually in your Supabase dashboard:');
        console.log('\n--- SQL to run in Supabase SQL Editor ---');
        console.log(createTableSQL);
        console.log('--- End SQL ---\n');
        
        throw new Error('foods_master table missing - please create manually in Supabase dashboard');
      }
    }
    
    // Test if table exists and is accessible
    const { data, error: testError } = await supabase
      .from('foods_master')
      .select('id')
      .limit(1);
      
    if (testError) {
      console.error('[Database] Table exists but has access issues:', testError);
      throw testError;
    }
    
    console.log('[Database] foods_master table is ready for caching system');
    
  } catch (error) {
    console.error('[Database] Failed to initialize foods_master table:', error);
    throw error;
  }
}

// Test database connection and table access
export async function testFoodsCacheDatabase(): Promise<{
  connected: boolean;
  tableExists: boolean;
  canRead: boolean;
  canWrite: boolean;
  error?: string;
}> {
  try {
    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
      
    if (connectionError) {
      return {
        connected: false,
        tableExists: false,
        canRead: false,
        canWrite: false,
        error: `Connection failed: ${connectionError.message}`
      };
    }
    
    // Test table existence and read access
    const { data: readTest, error: readError } = await supabase
      .from('food_recognition_cache')
      .select('id')
      .limit(1);
      
    if (readError) {
      return {
        connected: true,
        tableExists: false,
        canRead: false,
        canWrite: false,
        error: `Table read failed: ${readError.message}`
      };
    }
    
    // Test write access with a test entry
    const testKey = `test_${Date.now()}`;
    const { error: writeError } = await supabase
      .from('food_recognition_cache')
      .insert({
        food_key: testKey,
        calories: 100,
        protein: 5,
        carbs: 15,
        fat: 3,
        data_source: 'gpt_generated',
        confidence: 0.8
      });
      
    if (writeError) {
      return {
        connected: true,
        tableExists: true,
        canRead: true,
        canWrite: false,
        error: `Write test failed: ${writeError.message}`
      };
    }
    
    // Clean up test entry
    await supabase
      .from('food_recognition_cache')
      .delete()
      .eq('food_key', testKey);
    
    return {
      connected: true,
      tableExists: true,
      canRead: true,
      canWrite: true
    };
    
  } catch (error) {
    return {
      connected: false,
      tableExists: false,
      canRead: false,
      canWrite: false,
      error: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Get cache statistics from database
export async function getFoodsCacheStats(): Promise<{
  totalEntries: number;
  byDataSource: Record<string, number>;
  topFoods: Array<{ food_key: string; usage_count: number }>;
}> {
  try {
    // Get total count
    const { count: totalEntries } = await supabase
      .from('food_recognition_cache')
      .select('*', { count: 'exact', head: true });
      
    // Get breakdown by data source
    const { data: sourceData } = await supabase
      .from('food_recognition_cache')
      .select('data_source')
      .not('data_source', 'is', null);
      
    const byDataSource: Record<string, number> = {};
    sourceData?.forEach(row => {
      byDataSource[row.data_source] = (byDataSource[row.data_source] || 0) + 1;
    });
    
    // Get top foods by usage
    const { data: topFoodsData } = await supabase
      .from('food_recognition_cache')
      .select('food_key, usage_count')
      .order('usage_count', { ascending: false })
      .limit(10);
      
    return {
      totalEntries: totalEntries || 0,
      byDataSource,
      topFoods: topFoodsData || []
    };
    
  } catch (error) {
    console.error('[Database] Error getting cache stats:', error);
    return {
      totalEntries: 0,
      byDataSource: {},
      topFoods: []
    };
  }
}