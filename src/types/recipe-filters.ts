// src/types/recipe-filters.ts

/**
 * Comprehensive recipe filtering types supporting all Spoonacular capabilities
 * Maps to the extensive filter list provided by the user
 */

// Base filter interface
export interface RecipeFilters {
  // Search and pagination
  query?: string;
  number?: number;
  offset?: number;

  // Preparation & Cooking
  preparation?: PreparationFilters;

  // Nutritional & Health
  nutrition?: NutritionFilters;

  // Meal Context
  context?: MealContextFilters;

  // Flavor & Style
  style?: StyleFilters;

  // Practical Considerations
  practical?: PracticalFilters;

  // Special Categories
  special?: SpecialFilters;

  // Dietary restrictions (from existing DietaryPreferences)
  dietary?: DietaryFilters;

  // Sorting and advanced options
  sorting?: SortingOptions;
}

// Preparation & Cooking Filters
export interface PreparationFilters {
  // Time constraints
  maxReadyTime?: number; // total time
  minReadyTime?: number;
  maxPrepTime?: number;
  minPrepTime?: number;
  maxCookTime?: number;
  minCookTime?: number;

  // Complexity and ingredients
  maxIngredients?: number;
  minIngredients?: number;
  complexity?: ComplexityLevel; // 1-5 scale

  // Cooking methods
  cookingMethods?: CookingMethod[];

  // Equipment required
  equipment?: Equipment[];
  excludeEquipment?: Equipment[];
}

// Nutritional & Health Filters
export interface NutritionFilters {
  // Calorie range
  minCalories?: number;
  maxCalories?: number;

  // Macronutrients
  minProtein?: number;
  maxProtein?: number;
  minCarbs?: number;
  maxCarbs?: number;
  minFat?: number;
  maxFat?: number;
  minFiber?: number;
  maxFiber?: number;

  // Other nutrients
  minSugar?: number;
  maxSugar?: number;
  minSodium?: number;
  maxSodium?: number;

  // Health scoring
  minHealthScore?: number;
  maxHealthScore?: number;
  veryHealthy?: boolean;
}

// Meal Context Filters
export interface MealContextFilters {
  // Meal types
  mealTypes?: MealType[];

  // Occasions
  occasions?: Occasion[];

  // Seasonality
  seasons?: Season[];

  // Weather/mood
  weather?: WeatherType[];

  // Budget considerations
  budgetLevel?: BudgetLevel;
  maxPrice?: number;
  minPrice?: number;
  cheap?: boolean;
}

// Flavor & Style Filters
export interface StyleFilters {
  // Cuisine types
  cuisines?: string[];

  // Flavor profiles
  flavorProfiles?: FlavorProfile[];

  // Temperature preference
  temperature?: TemperaturePreference[];

  // Texture preferences
  textures?: TextureType[];
}

// Practical Considerations
export interface PracticalFilters {
  // Batch cooking and meal prep
  batchFriendly?: boolean;
  makeAhead?: boolean;
  freezerFriendly?: boolean;

  // Cooking style
  onePot?: boolean;
  onePan?: boolean;
  noOven?: boolean;

  // Family considerations
  kidFriendly?: boolean;
  crowdSize?: CrowdSize;

  // Skill level
  skillLevel?: SkillLevel;

  // Cleanup
  minimalCleanup?: boolean;
}

// Special Categories
export interface SpecialFilters {
  // Quick categories
  quickFixes?: boolean; // under 15 min
  fastMeals?: boolean; // under 30 min

  // Meal style
  comfortFood?: boolean;
  lightMeals?: boolean;
  heartyFilling?: boolean;

  // Ingredient sourcing
  freshSeasonal?: boolean;
  pantryStaples?: boolean;

  // Popularity and trends
  veryPopular?: boolean;
  trending?: boolean;
}

// Dietary Filters (extends existing DietaryPreferences)
export interface DietaryFilters {
  diets?: string[];
  intolerances?: string[];
  allergens?: string[];

  // Specific dietary flags
  vegan?: boolean;
  vegetarian?: boolean;
  glutenFree?: boolean;
  dairyFree?: boolean;
  ketogenic?: boolean;
  paleo?: boolean;
  whole30?: boolean;
  lowFodmap?: boolean;
}

// Sorting Options
export interface SortingOptions {
  sort?: SortType;
  sortDirection?: 'asc' | 'desc';
}

// Enums and Type Definitions

export type ComplexityLevel = 1 | 2 | 3 | 4 | 5;

export type CookingMethod =
  | 'baking' | 'grilling' | 'stovetop' | 'slow-cooker' | 'pressure-cooker'
  | 'steaming' | 'roasting' | 'frying' | 'sauteing' | 'boiling'
  | 'raw' | 'no-cook' | 'microwave' | 'air-fryer';

export type Equipment =
  | 'oven' | 'grill' | 'food-processor' | 'blender' | 'stand-mixer'
  | 'slow-cooker' | 'pressure-cooker' | 'air-fryer' | 'dehydrator'
  | 'ice-cream-maker' | 'pasta-machine' | 'mandoline' | 'mortar-pestle';

export type MealType =
  | 'breakfast' | 'brunch' | 'lunch' | 'dinner' | 'snack'
  | 'dessert' | 'appetizer' | 'side-dish' | 'beverage';

export type Occasion =
  | 'weeknight' | 'weekend' | 'holiday' | 'party' | 'date-night'
  | 'potluck' | 'picnic' | 'bbq' | 'game-day' | 'brunch-party';

export type Season = 'spring' | 'summer' | 'fall' | 'winter';

export type WeatherType =
  | 'comfort-food' | 'cold-day' | 'hot-day' | 'rainy-day' | 'cozy';

export type BudgetLevel = 'budget' | 'moderate' | 'splurge';

export type FlavorProfile =
  | 'spicy' | 'sweet' | 'savory' | 'tangy' | 'mild' | 'umami'
  | 'smoky' | 'fresh' | 'rich' | 'bold' | 'subtle';

export type TemperaturePreference = 'hot' | 'cold' | 'room-temperature';

export type TextureType =
  | 'creamy' | 'crunchy' | 'smooth' | 'chewy' | 'crispy'
  | 'tender' | 'flaky' | 'moist' | 'dense' | 'light';

export type CrowdSize = 'individual' | 'family' | 'party' | 'large-group';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type SortType =
  | 'popularity' | 'healthiness' | 'price' | 'time' | 'random'
  | 'calories' | 'rating' | 'trending';

// Helper functions for filter conversion

/**
 * Convert RecipeFilters to Spoonacular API parameters
 */
export function convertFiltersToSpoonacularParams(filters: RecipeFilters): Record<string, string> {
  const params: Record<string, string> = {};

  // Basic search
  if (filters.query) params.query = filters.query;
  if (filters.number) params.number = filters.number.toString();
  if (filters.offset) params.offset = filters.offset.toString();

  // Preparation filters
  if (filters.preparation) {
    const prep = filters.preparation;
    if (prep.maxReadyTime) params.maxReadyTime = prep.maxReadyTime.toString();
    if (prep.minReadyTime) params.minReadyTime = prep.minReadyTime.toString();
    if (prep.maxIngredients) params.maxIngredients = prep.maxIngredients.toString();
    if (prep.equipment) params.equipment = prep.equipment.join(',');
  }

  // Nutrition filters
  if (filters.nutrition) {
    const nutr = filters.nutrition;
    if (nutr.minCalories) params.minCalories = nutr.minCalories.toString();
    if (nutr.maxCalories) params.maxCalories = nutr.maxCalories.toString();
    if (nutr.minProtein) params.minProtein = nutr.minProtein.toString();
    if (nutr.maxProtein) params.maxProtein = nutr.maxProtein.toString();
    if (nutr.minCarbs) params.minCarbs = nutr.minCarbs.toString();
    if (nutr.maxCarbs) params.maxCarbs = nutr.maxCarbs.toString();
    if (nutr.minFat) params.minFat = nutr.minFat.toString();
    if (nutr.maxFat) params.maxFat = nutr.maxFat.toString();
  }

  // Context filters
  if (filters.context) {
    const ctx = filters.context;
    if (ctx.mealTypes) params.type = ctx.mealTypes.join(',');
    if (ctx.maxPrice) params.maxPrice = ctx.maxPrice.toString();
  }

  // Style filters
  if (filters.style) {
    const style = filters.style;
    if (style.cuisines) params.cuisine = style.cuisines.join(',');
  }

  // Dietary filters
  if (filters.dietary) {
    const diet = filters.dietary;
    if (diet.diets) params.diet = diet.diets.join(',');
    if (diet.intolerances) params.intolerances = diet.intolerances.join(',');
  }

  // Sorting
  if (filters.sorting) {
    const sort = filters.sorting;
    if (sort.sort) params.sort = sort.sort;
    if (sort.sortDirection) params.sortDirection = sort.sortDirection;
  }

  return params;
}

/**
 * Create default recipe filters
 */
export function createDefaultRecipeFilters(): RecipeFilters {
  return {
    number: 12,
    offset: 0,
    sorting: {
      sort: 'popularity',
      sortDirection: 'desc'
    }
  };
}

/**
 * Merge filter objects with proper precedence
 */
export function mergeRecipeFilters(base: RecipeFilters, overrides: Partial<RecipeFilters>): RecipeFilters {
  return {
    ...base,
    ...overrides,
    preparation: { ...base.preparation, ...overrides.preparation },
    nutrition: { ...base.nutrition, ...overrides.nutrition },
    context: { ...base.context, ...overrides.context },
    style: { ...base.style, ...overrides.style },
    practical: { ...base.practical, ...overrides.practical },
    special: { ...base.special, ...overrides.special },
    dietary: { ...base.dietary, ...overrides.dietary },
    sorting: { ...base.sorting, ...overrides.sorting },
  };
}