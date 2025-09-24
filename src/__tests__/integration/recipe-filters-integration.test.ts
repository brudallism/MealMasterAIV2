// src/__tests__/integration/recipe-filters-integration.test.ts

/**
 * Integration test for comprehensive recipe filtering system
 * Validates that all filter types work correctly with Spoonacular API
 */

import { createDietaryPreferences } from '@/types/dietary';
import {
  RecipeFilters,
  createDefaultRecipeFilters,
  mergeRecipeFilters,
  convertFiltersToSpoonacularParams
} from '@/types/recipe-filters';

// Mock the spoonacular client
jest.mock('@/services/api/spoonacular-client', () => ({
  spoonacularClient: {
    searchRecipes: jest.fn(),
  }
}));

import { unifiedSearchService } from '@/services/unified-search-service';

describe('Comprehensive Recipe Filtering Integration', () => {

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Filter conversion and merging', () => {
    it('should convert comprehensive filters to Spoonacular parameters correctly', () => {
      const filters: RecipeFilters = {
        query: 'pasta',
        number: 20,
        preparation: {
          maxReadyTime: 30,
          minReadyTime: 10,
          maxIngredients: 10,
          equipment: ['oven', 'grill']
        },
        nutrition: {
          maxCalories: 500,
          minProtein: 20,
          maxCarbs: 60,
          minFiber: 5
        },
        context: {
          mealTypes: ['dinner', 'lunch'],
          budgetLevel: 'budget',
          maxPrice: 5.00
        },
        style: {
          cuisines: ['italian', 'mediterranean'],
          flavorProfiles: ['savory', 'fresh']
        },
        dietary: {
          diets: ['vegetarian'],
          intolerances: ['dairy', 'gluten']
        },
        sorting: {
          sort: 'healthiness',
          sortDirection: 'desc'
        }
      };

      const params = convertFiltersToSpoonacularParams(filters);

      expect(params.query).toBe('pasta');
      expect(params.number).toBe('20');
      expect(params.maxReadyTime).toBe('30');
      expect(params.maxCalories).toBe('500');
      expect(params.minProtein).toBe('20');
      expect(params.type).toBe('dinner,lunch');
      expect(params.cuisine).toBe('italian,mediterranean');
      expect(params.diet).toBe('vegetarian');
      expect(params.intolerances).toBe('dairy,gluten');
      expect(params.sort).toBe('healthiness');
      expect(params.sortDirection).toBe('desc');
    });

    it('should merge filters correctly with proper precedence', () => {
      const baseFilters = createDefaultRecipeFilters();
      const overrides: Partial<RecipeFilters> = {
        number: 24,
        nutrition: {
          maxCalories: 400,
          minProtein: 15
        },
        style: {
          cuisines: ['asian']
        }
      };

      const merged = mergeRecipeFilters(baseFilters, overrides);

      expect(merged.number).toBe(24); // Override applied
      expect(merged.nutrition?.maxCalories).toBe(400);
      expect(merged.nutrition?.minProtein).toBe(15);
      expect(merged.style?.cuisines).toEqual(['asian']);
      expect(merged.sorting?.sort).toBe('popularity'); // Base preserved
    });
  });

  describe('Filtered recipe search integration', () => {
    it('should search with comprehensive filters applied', async () => {
      const mockSpoonacularClient = require('@/services/api/spoonacular-client').spoonacularClient;

      // Mock successful API response
      mockSpoonacularClient.searchRecipes.mockResolvedValue([
        {
          id: 715538,
          title: 'What to make for dinner tonight?? Bruschetta!',
          readyInMinutes: 45,
          servings: 2,
          healthScore: 83,
          cuisines: ['Mediterranean'],
          dishTypes: ['antipasti', 'starter', 'snack', 'appetizer', 'antipasto', 'hor d\'oeuvre'],
          dairyFree: true,
          glutenFree: false,
          vegetarian: true,
          nutrition: {
            per_serving: {
              calories: 239,
              protein: 8,
              carbs: 33,
              fat: 9,
              fiber: 4
            }
          }
        }
      ]);

      const dietaryPrefs = createDietaryPreferences({
        isVegetarian: true,
        isDairyFree: true
      });

      const comprehensiveFilters: RecipeFilters = {
        preparation: {
          maxReadyTime: 60,
          minReadyTime: 20
        },
        nutrition: {
          maxCalories: 300,
          minProtein: 5,
          minFiber: 3
        },
        context: {
          mealTypes: ['snack', 'appetizer']
        },
        style: {
          cuisines: ['mediterranean', 'italian']
        },
        dietary: {
          vegetarian: true,
          dairyFree: true
        },
        sorting: {
          sort: 'healthiness',
          sortDirection: 'desc'
        }
      };

      const result = await unifiedSearchService.searchRecipes(
        'bruschetta',
        dietaryPrefs,
        { number: 12, offset: 0 },
        comprehensiveFilters
      );

      // Verify the search was called with enhanced options
      expect(mockSpoonacularClient.searchRecipes).toHaveBeenCalledWith(
        dietaryPrefs,
        expect.objectContaining({
          query: 'bruschetta',
          number: 12,
          offset: 0,
          maxReadyTime: '60', // Numbers are converted to strings
          minReadyTime: 20,
          maxCalories: 300,
          minProtein: 5,
          minFiber: 3,
          type: 'snack,appetizer',
          cuisine: 'mediterranean,italian',
          sort: 'healthiness',
          sortDirection: 'desc'
        })
      );

      // Verify results
      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.source).toBe('spoonacular');
      expect(result.filters?.customFilters).toBeDefined();

      const recipe = result.items[0];
      expect(recipe.id).toBe('715538');
      expect(recipe.readyInMinutes).toBe(45);
      expect(recipe.dietary?.isVegetarian).toBe(true);
      expect(recipe.dietary?.isDairyFree).toBe(true);
    });

    it('should handle complex nutritional filters', async () => {
      const mockSpoonacularClient = require('@/services/api/spoonacular-client').spoonacularClient;

      mockSpoonacularClient.searchRecipes.mockResolvedValue([
        {
          id: 782585,
          title: 'Cannellini Bean and Asparagus Salad with Mushrooms',
          readyInMinutes: 20,
          servings: 4,
          healthScore: 95,
          vegan: true,
          glutenFree: true,
          nutrition: {
            per_serving: {
              calories: 180,
              protein: 12,
              carbs: 25,
              fat: 4,
              fiber: 8
            }
          }
        }
      ]);

      const highProteinLowCalorieFilters: RecipeFilters = {
        preparation: {
          maxReadyTime: 30 // Quick meals only
        },
        nutrition: {
          maxCalories: 250, // Low calorie
          minProtein: 10,   // High protein
          maxFat: 10,       // Low fat
          minFiber: 5       // High fiber
        },
        context: {
          mealTypes: ['lunch', 'dinner']
        },
        dietary: {
          vegan: true,
          glutenFree: true
        },
        special: {
          lightMeals: true,
          freshSeasonal: true
        },
        sorting: {
          sort: 'healthiness',
          sortDirection: 'desc'
        }
      };

      const result = await unifiedSearchService.searchRecipes(
        'healthy salad',
        createDietaryPreferences(),
        { number: 8 },
        highProteinLowCalorieFilters
      );

      expect(mockSpoonacularClient.searchRecipes).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          maxCalories: 250,
          minProtein: 10,
          maxFat: 10,
          minFiber: 5,
          maxReadyTime: '30', // String conversion
          type: 'lunch,dinner',
          sort: 'healthiness'
        })
      );

      expect(result.items[0].nutrition?.per_serving.calories).toBe(180);
      expect(result.items[0].nutrition?.per_serving.protein).toBe(12);
      expect(result.items[0].nutrition?.per_serving.fiber).toBe(8);
    });

    it('should handle equipment and practical filters', async () => {
      const mockSpoonacularClient = require('@/services/api/spoonacular-client').spoonacularClient;

      mockSpoonacularClient.searchRecipes.mockResolvedValue([
        {
          id: 663559,
          title: 'Slow Cooker Beef Stew',
          readyInMinutes: 480, // 8 hours
          servings: 6,
          cheap: true,
          nutrition: {
            per_serving: {
              calories: 320,
              protein: 28,
              carbs: 20,
              fat: 12,
              fiber: 3
            }
          }
        }
      ]);

      const practicalFilters: RecipeFilters = {
        preparation: {
          maxIngredients: 8,
          equipment: ['slow-cooker'],
          complexity: 2 // Easy
        },
        context: {
          budgetLevel: 'budget',
          mealTypes: ['dinner']
        },
        practical: {
          onePot: true,
          batchFriendly: true,
          makeAhead: true,
          minimalCleanup: true
        },
        special: {
          comfortFood: true
        }
      };

      const result = await unifiedSearchService.searchRecipes(
        'slow cooker',
        createDietaryPreferences(),
        { number: 6 },
        practicalFilters
      );

      expect(mockSpoonacularClient.searchRecipes).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          maxIngredients: '8', // String conversion
          equipment: 'slow-cooker',
          type: 'dinner',
          addRecipeInstructions: true // Should be true for comfort food
        })
      );

      expect(result.items[0].readyInMinutes).toBe(480);
    });
  });

  describe('Filter validation and edge cases', () => {
    it('should handle empty or undefined filters gracefully', async () => {
      const mockSpoonacularClient = require('@/services/api/spoonacular-client').spoonacularClient;
      mockSpoonacularClient.searchRecipes.mockResolvedValue([]);

      const result = await unifiedSearchService.searchRecipes(
        'chicken',
        createDietaryPreferences(),
        { number: 12 },
        undefined // No custom filters
      );

      expect(result.total).toBe(0);
      expect(result.items).toHaveLength(0);
      expect(result.filters?.customFilters).toBeUndefined();
    });

    it('should handle conflicting dietary preferences', async () => {
      const mockSpoonacularClient = require('@/services/api/spoonacular-client').spoonacularClient;
      mockSpoonacularClient.searchRecipes.mockResolvedValue([]);

      const conflictingFilters: RecipeFilters = {
        dietary: {
          vegan: true,
          diets: ['vegan'],
          intolerances: ['dairy', 'eggs'] // Should align with vegan
        },
        nutrition: {
          minProtein: 50 // Very high protein (challenging for vegan)
        }
      };

      const result = await unifiedSearchService.searchRecipes(
        'high protein',
        createDietaryPreferences({ isVegan: true }),
        { number: 10 },
        conflictingFilters
      );

      // Should still execute search even with challenging constraints
      expect(mockSpoonacularClient.searchRecipes).toHaveBeenCalled();
      expect(result.total).toBe(0); // Likely no results for conflicting criteria
    });
  });
});