// src/services/api/types.ts
// Basic API types for food search functionality

export interface FoodLookupResult {
  fdcId: number;
  description: string;
  dataType: string;
  foodCategory?: string;
  publicationDate?: string;
  brandOwner?: string;
  ingredients?: string;

  // Nutritional information
  foodNutrients: Array<{
    nutrientId: number;
    nutrientName: string;
    nutrientNumber: string;
    unitName: string;
    value: number;
  }>;

  // Additional metadata
  score?: number;
  servingSize?: number;
  servingSizeUnit?: string;
  householdServingFullText?: string;

  // For display purposes
  brandName?: string;
  commonNames?: string[];
  isFoundationFood?: boolean;
  isCooked?: boolean;
}

export interface SearchResponse {
  foods: FoodLookupResult[];
  totalHits: number;
  currentPage: number;
  totalPages: number;
}

export interface NutrientInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface FoodSearchParams {
  query: string;
  pageSize?: number;
  pageNumber?: number;
  dataType?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Basic food item for cart/basket
export interface BasketItem {
  food: FoodLookupResult;
  quantity: number;
  unit: string;
  notes?: string;
  nutrition: NutrientInfo;
}