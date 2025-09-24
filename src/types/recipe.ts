// src/types/recipe.ts

/**
 * Spoonacular Recipe types for API integration
 * These types match the Spoonacular API response structure
 */

export interface RecipeNutrition {
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
  // Spoonacular nutrition data structure
  nutrients?: SpoonacularNutrient[];
}

export interface SpoonacularNutrient {
  name: string;
  amount: number;
  unit: string;
  percentOfDailyNeeds?: number;
}

export interface Recipe {
  // Core identification
  id: number; // Spoonacular uses numeric IDs
  title: string;
  image?: string;

  // Recipe metadata
  readyInMinutes?: number;
  preparationMinutes?: number;
  cookingMinutes?: number;
  servings?: number;
  summary?: string;
  instructions?: string;

  // Source and URL information
  sourceUrl?: string;
  spoonacularSourceUrl?: string;

  // Complexity and equipment
  complexity?: number; // 1-5 scale
  creditsText?: string;
  license?: string;

  // Dietary properties
  vegan?: boolean;
  vegetarian?: boolean;
  glutenFree?: boolean;
  dairyFree?: boolean;
  ketogenic?: boolean;
  lowFodmap?: boolean;
  whole30?: boolean;
  sustainable?: boolean;

  // Categories and tags
  diets?: string[];
  dishTypes?: string[];
  cuisines?: string[];
  occasions?: string[];

  // Meal context
  mealTypes?: string[]; // breakfast, lunch, dinner, snack, dessert

  // Scoring and popularity
  healthScore?: number;
  spoonacularScore?: number;
  aggregateLikes?: number;
  veryHealthy?: boolean;
  cheap?: boolean;
  veryPopular?: boolean;

  // Price and budget
  pricePerServing?: number;

  // Additional properties for filtering
  gaps?: string; // GAPS diet compliance
  weightWatcherSmartPoints?: number;

  // Nutrition information
  nutrition?: RecipeNutrition;

  // Ingredients and instructions (for detailed views)
  extendedIngredients?: RecipeIngredient[];
  analyzedInstructions?: RecipeInstructionSet[];
}

export interface RecipeIngredient {
  id: number;
  name: string;
  original: string;
  originalName?: string;
  amount: number;
  unit: string;
  unitLong?: string;
  unitShort?: string;
  image?: string;
  consistency?: string;
  aisle?: string;
  measures?: {
    us?: {
      amount: number;
      unitShort: string;
      unitLong: string;
    };
    metric?: {
      amount: number;
      unitShort: string;
      unitLong: string;
    };
  };
}

export interface RecipeInstructionSet {
  name?: string;
  steps: RecipeInstruction[];
}

export interface RecipeInstruction {
  number: number;
  step: string;
  ingredients?: {
    id: number;
    name: string;
    localizedName?: string;
    image?: string;
  }[];
  equipment?: {
    id: number;
    name: string;
    localizedName?: string;
    image?: string;
  }[];
  length?: {
    number: number;
    unit: string;
  };
}

// Search result types
export interface RecipeSearchResult {
  results: Recipe[];
  offset: number;
  number: number;
  totalResults: number;
}