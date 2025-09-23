// src/types/recipe.ts

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
  total_recipe: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}

export interface RecipeIngredient {
  id: number;
  name: string;
  amount: number;
  unit: string;
  original: string; // "2 cups diced tomatoes"
  image?: string;
}

export interface RecipeInstruction {
  number: number;
  step: string;
  ingredients?: RecipeIngredient[];
  equipment?: Array<{
    id: number;
    name: string;
    image?: string;
  }>;
  length?: {
    number: number;
    unit: string;
  };
}

export interface Recipe {
  id: number;
  title: string;
  image?: string;
  imageType?: string;
  readyInMinutes: number;
  preparationMinutes?: number;
  cookingMinutes?: number;
  servings: number;
  pricePerServing?: number;
  spoonacularScore?: number;
  healthScore?: number;

  // Spoonacular top-level dietary properties
  dishTypes?: string[];
  diets?: string[];
  cuisines?: string[];
  occasions?: string[];

  // Spoonacular boolean dietary flags
  cheap?: boolean;
  dairyFree?: boolean;
  glutenFree?: boolean;
  ketogenic?: boolean;
  lowFodmap?: boolean;
  sustainable?: boolean;
  vegan?: boolean;
  vegetarian?: boolean;
  veryHealthy?: boolean;
  veryPopular?: boolean;
  whole30?: boolean;
  gaps?: string;

  // Recipe content and instructions
  instructions?: string | RecipeInstruction[];
  summary?: string;
  license?: string;
  sourceName?: string;
  sourceUrl?: string;
  spoonacularSourceUrl?: string;
  creditsText?: string;
  weightWatcherSmartPoints?: number;

  // Ingredients (both formats from Spoonacular)
  ingredients?: RecipeIngredient[];
  extendedIngredients?: RecipeIngredient[];

  // Structured instructions
  analyzedInstructions?: Array<{
    name: string;
    steps: RecipeInstruction[];
  }>;

  // Nutrition data (optional since it might not always be included)
  nutrition?: RecipeNutrition;

  // Additional metadata for our internal use
  metadata?: {
    difficulty?: 'easy' | 'medium' | 'hard';
    popularity?: number;
    likes?: number;
    aggregateLikes?: number;
    addedAt?: string;
    lastViewed?: string;
  };
}

export interface RecipeSearchResult {
  results: Recipe[];
  offset: number;
  number: number;
  totalResults: number;
}

export interface RecipeScaling {
  originalServings: number;
  targetServings: number;
  scalingFactor: number;
  scaledIngredients: RecipeIngredient[];
  scaledNutrition: RecipeNutrition;
}

// For meal planning system
export interface MealPlanEntry {
  id: string;
  type: 'recipe' | 'food';
  content: Recipe | any; // TODO: Import MealItem properly
  scheduledTime?: string;
  servings?: number;
  notes?: string;
  addedAt: string;
}

export interface MealPlan {
  id: string;
  date: string; // YYYY-MM-DD
  meals: {
    breakfast?: MealPlanEntry;
    lunch?: MealPlanEntry;
    dinner?: MealPlanEntry;
    snacks: MealPlanEntry[];
  };
  createdAt: string;
  updatedAt: string;
}

// For shopping list generation
export interface ShoppingListItem {
  ingredient: string;
  amount: number;
  unit: string;
  category: string; // "produce", "dairy", etc.
  recipes: string[]; // which recipes need this
  purchased: boolean;
  notes?: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  mealPlanIds: string[];
  items: ShoppingListItem[];
  generatedAt: string;
  completedAt?: string;
}

// For cooking session management
export interface CookingTimer {
  id: string;
  name: string; // "Bake chicken"
  duration: number; // minutes
  startedAt?: string;
  remainingTime?: number;
}

export interface CookingSession {
  recipeId: number;
  startedAt: string;
  currentStep: number;
  timers: CookingTimer[];
  notes: string[];
  completedSteps: number[];
  estimatedFinishTime?: string;
}