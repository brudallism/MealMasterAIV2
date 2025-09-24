// src/types/unified-meal-item.ts

/**
 * Unified data interface that can represent items from both USDA and Spoonacular APIs
 * This eliminates the data structure mismatch between different API sources
 */

import { Recipe, RecipeNutrition } from './recipe';

// Source API identifier for traceability
export type APISource = 'usda' | 'spoonacular';

// Unified item types
export type UnifiedItemType = 'food' | 'product' | 'ingredient' | 'recipe';

// Unified nutrition information (compatible with both APIs)
export interface UnifiedNutrition {
  per_serving: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar?: number;
    sodium?: number;
  };
  total_recipe?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  // Micronutrients mapped to USDA FDC nutrient IDs for consistency
  micronutrients?: Record<number, number>;
}

// Core unified interface that works with both USDA and Spoonacular data
export interface UnifiedMealItem {
  // Standardized ID (always string for consistency)
  id: string;

  // Source tracking
  source: APISource;
  originalId: string | number; // Preserve original ID for API calls

  // Core properties
  title: string;
  type: UnifiedItemType;

  // Display information
  image?: string;
  description?: string;

  // Recipe-specific properties (for Spoonacular items)
  readyInMinutes?: number;
  servings?: number;
  healthScore?: number;
  spoonacularScore?: number;

  // Food-specific properties (for USDA items)
  brandOwner?: string;
  ingredients?: string;

  // Nutrition (unified format)
  nutrition?: UnifiedNutrition;

  // Dietary information (unified format)
  dietary?: {
    diets?: string[];
    allergens?: string[];
    isVegan?: boolean;
    isVegetarian?: boolean;
    isGlutenFree?: boolean;
    isDairyFree?: boolean;
  };

  // Additional metadata
  metadata?: {
    searchRelevance?: number;
    popularity?: number;
    lastUpdated?: string;
    tags?: string[];
  };
}

// Type guards for runtime checking
export function isRecipeItem(item: UnifiedMealItem): item is UnifiedMealItem & {
  type: 'recipe';
  readyInMinutes: number;
  servings: number;
} {
  return item.type === 'recipe' && item.source === 'spoonacular';
}

export function isFoodItem(item: UnifiedMealItem): item is UnifiedMealItem & {
  type: 'food' | 'product' | 'ingredient';
} {
  return ['food', 'product', 'ingredient'].includes(item.type) && item.source === 'usda';
}

// Helper type for favorites/starred system compatibility
export interface UnifiedFavoriteItem {
  id: string;
  type: 'recipe' | 'food';
  item: UnifiedMealItem;
  addedAt: string;
  category: 'favorite' | 'starred';
  notes?: string;
}

// Search result wrapper for unified responses
export interface UnifiedSearchResult {
  total: number;
  items: UnifiedMealItem[];
  source: APISource | 'mixed';
  query: string;
  filters?: Record<string, any>;
}

// Transformation interface - deprecated in favor of BaseTransformer
// Kept for backward compatibility during migration
export interface APITransformer<T> {
  transform(apiResponse: T): UnifiedMealItem;
  transformBatch(apiResponses: T[]): UnifiedMealItem[];
}