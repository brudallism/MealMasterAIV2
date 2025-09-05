// src/utils/testAPIs.ts
import Constants from 'expo-constants';
import { spoonacularClient } from '@/services/api/spoonacular-client';
import { usdaClient } from '@/services/api/usda-client';

export async function testSpoonacularConnection() {
  try {
    console.log('Testing Spoonacular API...');
    
    // Test ingredient search with a simple ingredient
    const result = await spoonacularClient.searchIngredients('apple');
    
    if (result && result.results && result.results.length > 0) {
      console.log('✅ Spoonacular connection successful!');
      console.log(`Found ${result.results.length} ingredients for "apple"`);
      console.log('Sample result:', result.results[0].name);
      return true;
    } else {
      console.error('❌ Spoonacular returned empty results');
      return false;
    }
  } catch (error) {
    console.error('❌ Spoonacular test failed:', error);
    return false;
  }
}

export async function testUSDAConnection() {
  try {
    console.log('Testing USDA API...');
    
    // Test food search with a simple food
    const result = await usdaClient.searchFoods('banana');
    
    if (result && result.foods && result.foods.length > 0) {
      console.log('✅ USDA connection successful!');
      console.log(`Found ${result.foods.length} foods for "banana"`);
      console.log('Sample result:', result.foods[0].description);
      return true;
    } else {
      console.error('❌ USDA returned empty results');
      return false;
    }
  } catch (error) {
    console.error('❌ USDA test failed:', error);
    return false;
  }
}

export function testApiEnvironmentVariables() {
  const spoonacularKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_SPOONACULAR_API_KEY;
  const usdaKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_USDA_API_KEY;
  
  console.log('🔍 API Environment Variables Check:');
  console.log('Spoonacular key loaded:', !!spoonacularKey);
  console.log('USDA key loaded:', !!usdaKey);
  console.log('Spoonacular key starts with:', spoonacularKey?.substring(0, 8) + '...');
  console.log('USDA key starts with:', usdaKey?.substring(0, 8) + '...');
  
  return !!(spoonacularKey && usdaKey);
}