// src/types/dietary.ts

/**
 * Comprehensive dietary preferences system for MealMasterAI v2
 * Based on Diet-Allergies-Spec.md v1 - single-profile, single-diet implementation
 * Compatible with Spoonacular API and unified transformation layer
 */

export type DietType =
  | "vegan" | "vegetarian" | "pescatarian"
  | "ketogenic" | "paleo" | "primal"
  | "low-fodmap" | "whole30" | "none";

export type Intolerance =
  | "dairy" | "egg" | "gluten" | "grain" | "peanut" | "seafood"
  | "sesame" | "shellfish" | "soy" | "sulfite" | "tree nut" | "wheat";

export interface DietaryPreferences {
  version: 1;
  diet: DietType;
  allergies: Intolerance[]; // strict - never relaxed
  excludeIngredients: string[]; // soft - can be relaxed for zero-results
  includeIngredients: string[]; // optional likes/preferences
  cuisines: { include: string[]; exclude: string[] };
  maxReadyTime?: number;
  maxIngredients?: number;
  calorieWindow?: { min?: number; max?: number };
  presets: { glutenFree: boolean; lowFodmapStrict: boolean };
  dietImpliedExclusions: string[]; // auto-managed from diet, user-editable
  updatedAt: string; // ISO timestamp
}

export interface DietaryCompatibility {
  isCompatible: boolean;
  violations: {
    allergies: string[]; // Strict violations - never ignore
    diet: string[]; // Can be overridden with confirmation
    excludes: string[]; // Can be relaxed or overridden
  };
  warnings: string[];
  confidence: number; // 0-1 confidence in compatibility assessment
}

// Zero-results relaxation order (from spec)
export type RelaxationStep =
  | 'time' | 'cuisine' | 'excludes' | 'calories' | 'diet';

export interface RelaxationOptions {
  step: RelaxationStep;
  description: string;
  action: string;
  impact: 'low' | 'medium' | 'high';
}

// Default preferences (following spec)
export const DEFAULT_DIETARY_PREFERENCES: DietaryPreferences = {
  version: 1,
  diet: "none",
  allergies: [],
  excludeIngredients: [],
  includeIngredients: [],
  cuisines: { include: [], exclude: [] },
  presets: { glutenFree: false, lowFodmapStrict: false },
  dietImpliedExclusions: [],
  updatedAt: new Date().toISOString(),
};

/**
 * Create dietary preferences with defaults and validation
 */
export function createDietaryPreferences(overrides: Partial<DietaryPreferences> = {}): DietaryPreferences {
  return {
    ...DEFAULT_DIETARY_PREFERENCES,
    ...overrides,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Legacy compatibility - convert old format to new format
 */
export function migrateLegacyPreferences(legacy: any): DietaryPreferences {
  const preferences = createDietaryPreferences();

  // Map legacy diet types to new format
  if (legacy.diets?.length > 0) {
    const firstDiet = legacy.diets[0];
    switch (firstDiet) {
      case 'keto':
        preferences.diet = 'ketogenic';
        break;
      case 'pescetarian':
        preferences.diet = 'pescatarian';
        break;
      default:
        preferences.diet = firstDiet as DietType;
    }
  }

  // Map legacy allergens
  if (legacy.allergens?.length > 0) {
    preferences.allergies = legacy.allergens.map((allergen: string) => {
      switch (allergen) {
        case 'eggs': return 'egg';
        case 'tree-nuts': return 'tree nut';
        case 'peanuts': return 'peanut';
        default: return allergen;
      }
    }).filter((a: string) => a !== 'gluten'); // gluten handled by preset
  }

  // Map legacy dietary flags to presets
  if (legacy.isGlutenFree) {
    preferences.presets.glutenFree = true;
  }

  // Map legacy constraints
  if (legacy.maxReadyTime) {
    preferences.maxReadyTime = legacy.maxReadyTime;
  }

  if (legacy.maxCalories || legacy.minProtein) {
    preferences.calorieWindow = {
      max: legacy.maxCalories,
      min: undefined // Legacy didn't have min calories, only min protein
    };
  }

  return preferences;
}

/**
 * Validate dietary preferences for consistency
 */
export function validateDietaryPreferences(prefs: DietaryPreferences): string[] {
  const errors: string[] = [];

  // Check for conflicting diet settings
  if (prefs.diet === 'vegan' && prefs.allergies.includes('dairy')) {
    // This is actually redundant but not an error
  }

  if (prefs.diet === 'ketogenic' && prefs.calorieWindow?.min && prefs.calorieWindow.min > 2000) {
    errors.push('High minimum calories may conflict with ketogenic diet');
  }

  // Validate time constraints
  if (prefs.maxReadyTime && prefs.maxReadyTime < 5) {
    errors.push('Maximum ready time too low (minimum 5 minutes recommended)');
  }

  if (prefs.maxIngredients && prefs.maxIngredients < 3) {
    errors.push('Maximum ingredients too low (minimum 3 recommended)');
  }

  return errors;
}