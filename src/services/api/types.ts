// src/services/api/types.ts
// API response types for food search and nutrition data

export interface FoodNutrition {
  per100g: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  servingSize: string;
  // Optional micronutrients - may not be available for all foods
  micronutrients?: {
    [nutrientId: number]: {
      amount: number;
      unit: string;
    };
  };
}

export interface FoodSource {
  api: 'usda' | 'spoonacular' | 'edamam' | 'off';
  id: string;
  dataType?: string;
  lastUpdated: string;
}

export interface FoodMetadata {
  confidence: number;
  warnings: string[];
  foodIcon?: string;
}

export interface FoodLookupResult {
  id: string;
  name: string;
  brand?: string;
  category: string;
  nutrition: FoodNutrition;
  source: FoodSource;
  metadata: FoodMetadata;
}

export interface SearchResults {
  ingredients: FoodLookupResult[];
  products: FoodLookupResult[];
  recipes: FoodLookupResult[];
  total: number;
  fromCache: boolean;
  searchTime: number;
}

// USDA API specific types
export interface USDANutrient {
  id: number;
  amount: number;
  unit: string;
}

export interface USDAFood {
  fdcId: number;
  description: string;
  dataType: string;
  brandOwner?: string;
  foodCategory?: string;
  foodNutrients: USDANutrient[];
}

export interface USDASearchResponse {
  foods: USDAFood[];
  totalHits: number;
  currentPage: number;
  totalPages: number;
}

// Spoonacular API specific types
export interface SpoonacularIngredient {
  id: number;
  name: string;
  image: string;
  nutrition: {
    nutrients: Array<{
      name: string;
      amount: number;
      unit: string;
    }>;
  };
}

// Cart/Meal types
export interface CartItem {
  food: MealItem;
  quantity: number;
  unit: string;
  addedAt: string;
}

export interface MealItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  serving_size: string;
  source: string;
  category: string;
  confidence: number;
}

// Search history types
export interface SearchHistoryItem {
  query: string;
  timestamp: string;
  resultCount: number;
}

export interface RecentFood {
  food: MealItem;
  lastAccessed: string;
  accessCount: number;
}

export interface StarredFood {
  food: MealItem;
  category: string;
  starredAt: string;
}

// Extended for recipes - unified favorites interface
export interface FavoriteItem {
  id: string;
  type: 'food' | 'recipe';
  item: MealItem | import('../types/recipe').Recipe;
  category: string;
  starredAt: string;
  notes?: string;
}