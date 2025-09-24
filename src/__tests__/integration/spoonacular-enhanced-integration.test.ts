// src/__tests__/integration/spoonacular-enhanced-integration.test.ts

/**
 * Integration test for enhanced Spoonacular API with comprehensive nutrition mapping
 * Validates complete data extraction and micronutrient mapping
 */

import { UnifiedMealItem } from '@/types/unified-meal-item';
import { Recipe } from '@/types/recipe';
import { createDietaryPreferences } from '@/types/dietary';

// Mock the spoonacular client
jest.mock('@/services/api/spoonacular-client', () => ({
  spoonacularClient: {
    searchRecipes: jest.fn(),
    getRecipeById: jest.fn(),
  }
}));

import { unifiedSearchService } from '@/services/unified-search-service';
import { spoonacularTransformer } from '@/services/transformers/spoonacular-transformer';
import { mapSpoonacularNutrients } from '@/services/nutrition/spoonacular-nutrient-mapper';

describe('Enhanced Spoonacular Integration', () => {

  describe('Comprehensive nutrition mapping', () => {
    it('should map Spoonacular nutrients to USDA FDC IDs correctly', () => {
      const mockSpoonacularNutrients = [
        { name: 'Calories', amount: 350, unit: 'kcal' },
        { name: 'Protein', amount: 25, unit: 'g' },
        { name: 'Fat', amount: 15, unit: 'g' },
        { name: 'Carbohydrates', amount: 30, unit: 'g' },
        { name: 'Fiber', amount: 5, unit: 'g' },
        { name: 'Sodium', amount: 800, unit: 'mg' },
        { name: 'Calcium', amount: 200, unit: 'mg' },
        { name: 'Iron', amount: 3.5, unit: 'mg' },
        { name: 'Vitamin C', amount: 15, unit: 'mg' },
        { name: 'Vitamin A', amount: 500, unit: 'IU' },
        { name: 'Potassium', amount: 400, unit: 'mg' },
      ];

      const mappedNutrients = mapSpoonacularNutrients(mockSpoonacularNutrients);

      // Check that core nutrients are mapped to correct USDA IDs
      expect(mappedNutrients[208]).toBe(350); // Calories
      expect(mappedNutrients[203]).toBe(25);  // Protein
      expect(mappedNutrients[204]).toBe(15);  // Fat
      expect(mappedNutrients[205]).toBe(30);  // Carbs
      expect(mappedNutrients[291]).toBe(5);   // Fiber
      expect(mappedNutrients[1093]).toBe(800); // Sodium
      expect(mappedNutrients[1087]).toBe(200); // Calcium
      expect(mappedNutrients[1089]).toBe(3.5); // Iron
      expect(mappedNutrients[1162]).toBe(15);  // Vitamin C
      expect(mappedNutrients[1092]).toBe(400); // Potassium

      // Vitamin A should be converted from IU to µg RAE
      expect(mappedNutrients[1106]).toBeCloseTo(150, 0); // 500 IU ≈ 150 µg RAE
    });

    it('should handle unit conversions correctly', () => {
      const mockNutrients = [
        { name: 'Vitamin D', amount: 80, unit: 'IU' }, // Should convert to µg
        { name: 'Magnesium', amount: 0.1, unit: 'g' }, // Should convert to mg
        { name: 'Zinc', amount: 8000, unit: 'µg' }, // Should convert to mg
      ];

      const mappedNutrients = mapSpoonacularNutrients(mockNutrients);

      expect(mappedNutrients[1114]).toBeCloseTo(2, 0); // Vitamin D: 80 IU ≈ 2 µg
      expect(mappedNutrients[1090]).toBe(100); // Magnesium: 0.1g = 100mg
      expect(mappedNutrients[1095]).toBe(8); // Zinc: 8000µg = 8mg
    });
  });

  describe('Enhanced recipe transformation', () => {
    it('should transform recipe with full nutrition data', () => {
      const mockRecipe: Recipe = {
        id: 654959,
        title: 'Pasta With Tuna and Capers',
        image: 'https://spoonacular.com/recipeImages/654959-556x370.jpg',
        readyInMinutes: 25,
        servings: 4,
        healthScore: 74,
        spoonacularScore: 92,
        vegan: false,
        vegetarian: false,
        glutenFree: false,
        dairyFree: true,
        nutrition: {
          per_serving: {
            calories: 420,
            protein: 28,
            carbs: 45,
            fat: 12,
            fiber: 3,
            sugar: 5,
            sodium: 680,
          },
          nutrients: [
            { name: 'Calories', amount: 420, unit: 'kcal' },
            { name: 'Protein', amount: 28, unit: 'g' },
            { name: 'Fat', amount: 12, unit: 'g' },
            { name: 'Carbohydrates', amount: 45, unit: 'g' },
            { name: 'Fiber', amount: 3, unit: 'g' },
            { name: 'Sodium', amount: 680, unit: 'mg' },
            { name: 'Iron', amount: 2.8, unit: 'mg' },
            { name: 'Calcium', amount: 85, unit: 'mg' },
            { name: 'Vitamin C', amount: 12, unit: 'mg' },
            { name: 'Potassium', amount: 320, unit: 'mg' },
          ]
        },
        dishTypes: ['lunch', 'main course', 'main dish', 'dinner'],
        cuisines: ['Mediterranean'],
        extendedIngredients: [
          {
            id: 11026,
            name: 'pasta',
            original: '12 oz pasta',
            amount: 12,
            unit: 'oz',
            image: 'pasta.jpg'
          }
        ]
      };

      const unifiedItem = spoonacularTransformer.transform(mockRecipe);

      // Check basic transformation
      expect(unifiedItem.id).toBe('654959');
      expect(unifiedItem.source).toBe('spoonacular');
      expect(unifiedItem.originalId).toBe(654959);
      expect(unifiedItem.title).toBe('Pasta With Tuna and Capers');
      expect(unifiedItem.type).toBe('recipe');

      // Check nutrition data
      expect(unifiedItem.nutrition?.per_serving.calories).toBe(420);
      expect(unifiedItem.nutrition?.per_serving.protein).toBe(28);
      expect(unifiedItem.nutrition?.per_serving.carbs).toBe(45);
      expect(unifiedItem.nutrition?.per_serving.fat).toBe(12);
      expect(unifiedItem.nutrition?.per_serving.fiber).toBe(3);

      // Check micronutrients mapping
      expect(unifiedItem.nutrition?.micronutrients).toBeDefined();
      expect(unifiedItem.nutrition?.micronutrients?.[1089]).toBe(2.8); // Iron
      expect(unifiedItem.nutrition?.micronutrients?.[1087]).toBe(85);  // Calcium
      expect(unifiedItem.nutrition?.micronutrients?.[1162]).toBe(12);  // Vitamin C
      expect(unifiedItem.nutrition?.micronutrients?.[1092]).toBe(320); // Potassium

      // Check dietary info
      expect(unifiedItem.dietary?.isVegan).toBe(false);
      expect(unifiedItem.dietary?.isVegetarian).toBe(false);
      expect(unifiedItem.dietary?.isGlutenFree).toBe(false);
      expect(unifiedItem.dietary?.isDairyFree).toBe(true);

      // Check metadata
      expect(unifiedItem.metadata?.searchRelevance).toBe(92);
      expect(unifiedItem.metadata?.tags).toContain('spoonacular');
      expect(unifiedItem.metadata?.tags).toContain('mediterranean');
    });

    it('should handle simplified nutrition format from search results', () => {
      const mockRecipe: Recipe = {
        id: 123456,
        title: 'Simple Recipe',
        nutrition: {
          per_serving: {
            calories: 250,
            protein: 15,
            carbs: 20,
            fat: 8,
            fiber: 4,
          }
        }
      };

      const unifiedItem = spoonacularTransformer.transform(mockRecipe);

      expect(unifiedItem.nutrition?.per_serving.calories).toBe(250);
      expect(unifiedItem.nutrition?.per_serving.protein).toBe(15);
      expect(unifiedItem.nutrition?.micronutrients).toBeUndefined(); // No detailed nutrients
    });
  });

  describe('Recipe search integration', () => {
    it('should search recipes through unified service with enhanced filters', async () => {
      const mockRecipeSearchFunction = async (query: string) => {
        return {
          total: 1,
          items: [{
            id: 'spoonacular_654959',
            source: 'spoonacular' as const,
            originalId: 654959,
            title: 'Pasta With Tuna',
            type: 'recipe' as const,
            readyInMinutes: 25,
            servings: 4,
            healthScore: 74,
            nutrition: {
              per_serving: {
                calories: 420,
                protein: 28,
                carbs: 45,
                fat: 12,
                fiber: 3,
              },
              micronutrients: {
                1089: 2.8, // Iron
                1087: 85,  // Calcium
                1162: 12,  // Vitamin C
              }
            },
            dietary: {
              isVegan: false,
              isVegetarian: false,
              isGlutenFree: false,
              isDairyFree: true,
            },
            metadata: {
              searchRelevance: 92,
              tags: ['spoonacular', 'mediterranean']
            }
          }],
          source: 'spoonacular' as const,
          query: query,
          filters: {}
        };
      };

      const dietaryPrefs = createDietaryPreferences({
        maxCalories: 500,
        isDairyFree: true
      });

      // Mock the spoonacular client for this test
      const mockSpoonacularClient = require('@/services/api/spoonacular-client').spoonacularClient;
      mockSpoonacularClient.searchRecipes.mockResolvedValue([
        {
          id: 654959,
          title: 'Pasta With Tuna',
          readyInMinutes: 25,
          servings: 4,
          healthScore: 74,
          spoonacularScore: 92,
          dairyFree: true,
          nutrition: {
            per_serving: {
              calories: 420,
              protein: 28,
              carbs: 45,
              fat: 12,
              fiber: 3,
            }
          }
        }
      ]);

      const result = await unifiedSearchService.searchRecipes(
        'pasta',
        dietaryPrefs,
        { number: 12, offset: 0 }
      );

      expect(result).toBeDefined();
      expect(result.source).toBe('spoonacular');
      expect(result.query).toBe('pasta');
      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);

      const recipe = result.items[0];
      expect(recipe.id).toBe('654959');
      expect(recipe.type).toBe('recipe');
      expect(recipe.dietary?.isDairyFree).toBe(true);
    });
  });

  describe('Data consistency validation', () => {
    it('should maintain string IDs throughout recipe processing', () => {
      const mockRecipe: Recipe = {
        id: 999888,
        title: 'Test Recipe'
      };

      const unifiedItem = spoonacularTransformer.transform(mockRecipe);

      // Critical: ID should be string to prevent React hooks violations
      expect(typeof unifiedItem.id).toBe('string');
      expect(unifiedItem.id).toBe('999888');
      expect(unifiedItem.originalId).toBe(999888); // Preserve original number
    });

    it('should provide complete data for FoodDetailModal', () => {
      const mockRecipe: Recipe = {
        id: 555444,
        title: 'Complete Recipe',
        readyInMinutes: 30,
        servings: 6,
        healthScore: 85,
        nutrition: {
          per_serving: {
            calories: 300,
            protein: 20,
            carbs: 25,
            fat: 10,
            fiber: 5,
            sodium: 400,
          },
          nutrients: [
            { name: 'Iron', amount: 3.2, unit: 'mg' },
            { name: 'Calcium', amount: 120, unit: 'mg' },
          ]
        }
      };

      const unifiedItem = spoonacularTransformer.transform(mockRecipe);

      // Should have all required properties for modal display
      expect(unifiedItem.id).toBeDefined();
      expect(unifiedItem.title).toBeDefined();
      expect(unifiedItem.nutrition?.per_serving).toBeDefined();
      expect(unifiedItem.readyInMinutes).toBe(30);
      expect(unifiedItem.servings).toBe(6);
      expect(unifiedItem.healthScore).toBe(85);

      // Should have micronutrients for detailed nutrition display
      expect(unifiedItem.nutrition?.micronutrients?.[1089]).toBe(3.2); // Iron
      expect(unifiedItem.nutrition?.micronutrients?.[1087]).toBe(120); // Calcium
    });
  });
});