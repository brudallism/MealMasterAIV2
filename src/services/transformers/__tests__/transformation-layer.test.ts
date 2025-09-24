// src/services/transformers/__tests__/transformation-layer.test.ts

/**
 * Test suite for the unified transformation layer
 * Validates that USDA and Spoonacular data transforms correctly to UnifiedMealItem format
 */

import { usdaTransformer } from '../usda-transformer';
import { spoonacularTransformer } from '../spoonacular-transformer';
import { FoodLookupResult } from '@/services/api/types';
import { Recipe } from '@/types/recipe';
import { UnifiedMealItem } from '@/types/unified-meal-item';

describe('Transformation Layer', () => {
  describe('USDA Transformer', () => {
    const mockUSDAFood: FoodLookupResult = {
      id: '173425',
      name: 'Chicken breast, boneless, skinless',
      brand: 'Test Brand',
      category: 'Poultry Products',
      nutrition: {
        per100g: {
          calories: 165,
          protein: 31,
          carbs: 0,
          fat: 3.6,
          fiber: 0
        },
        servingSize: '100g'
      },
      source: {
        api: 'usda',
        id: '173425',
        dataType: 'Foundation',
        lastUpdated: '2024-01-01'
      },
      metadata: {
        confidence: 0.95,
        warnings: [],
        foodIcon: 'chicken.png'
      }
    };

    it('should transform USDA food to UnifiedMealItem', () => {
      const result = usdaTransformer.transform(mockUSDAFood);

      expect(result).toBeDefined();
      expect(result.id).toBe('173425');
      expect(result.source).toBe('usda');
      expect(result.originalId).toBe('173425');
      expect(result.title).toBe('Chicken breast, boneless, skinless');
      expect(result.type).toBe('ingredient');
      expect(result.brandOwner).toBe('Test Brand');
    });

    it('should handle nutrition transformation correctly', () => {
      const result = usdaTransformer.transform(mockUSDAFood);

      expect(result.nutrition).toBeDefined();
      expect(result.nutrition?.per_serving.calories).toBe(165);
      expect(result.nutrition?.per_serving.protein).toBe(31);
      expect(result.nutrition?.per_serving.carbs).toBe(0);
      expect(result.nutrition?.per_serving.fat).toBe(3.6);
      expect(result.nutrition?.per_serving.fiber).toBe(0);
    });

    it('should handle missing data gracefully', () => {
      const incompleteFood: FoodLookupResult = {
        id: '123',
        name: '',
        category: '',
        nutrition: {
          per100g: {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0
          },
          servingSize: '100g'
        },
        source: {
          api: 'usda',
          id: '123',
          lastUpdated: '2024-01-01'
        },
        metadata: {
          confidence: 0,
          warnings: []
        }
      };

      const result = usdaTransformer.transform(incompleteFood);

      expect(result.id).toBe('123');
      expect(result.title).toBe('Unknown Food Item'); // Fallback
      expect(result.type).toBe('food'); // Default
    });

    it('should generate consistent tags', () => {
      const result = usdaTransformer.transform(mockUSDAFood);

      expect(result.metadata?.tags).toBeDefined();
      expect(result.metadata?.tags).toContain('usda');
      expect(result.metadata?.tags).toContain('poultry-products');
      expect(result.metadata?.tags).toContain('branded');
      expect(result.metadata?.tags).toContain('high-confidence');
    });
  });

  describe('Spoonacular Transformer', () => {
    const mockSpoonacularRecipe: Recipe = {
      id: 123456,
      title: 'Grilled Chicken Salad',
      image: 'https://example.com/recipe.jpg',
      readyInMinutes: 30,
      servings: 4,
      summary: 'A healthy <b>grilled chicken</b> salad with fresh vegetables.',
      vegan: false,
      vegetarian: false,
      glutenFree: true,
      dairyFree: false,
      diets: ['gluten free'],
      dishTypes: ['salad', 'lunch'],
      cuisines: ['American'],
      healthScore: 85,
      spoonacularScore: 92,
      aggregateLikes: 156,
      veryHealthy: true,
      nutrition: {
        per_serving: {
          calories: 280,
          protein: 35,
          carbs: 12,
          fat: 8,
          fiber: 4,
          sugar: 6,
          sodium: 320
        }
      }
    };

    it('should transform Spoonacular recipe to UnifiedMealItem', () => {
      const result = spoonacularTransformer.transform(mockSpoonacularRecipe);

      expect(result).toBeDefined();
      expect(result.id).toBe('123456'); // Number converted to string
      expect(result.source).toBe('spoonacular');
      expect(result.originalId).toBe(123456); // Original preserved
      expect(result.title).toBe('Grilled Chicken Salad');
      expect(result.type).toBe('recipe');
      expect(result.readyInMinutes).toBe(30);
      expect(result.servings).toBe(4);
    });

    it('should handle nutrition transformation correctly', () => {
      const result = spoonacularTransformer.transform(mockSpoonacularRecipe);

      expect(result.nutrition).toBeDefined();
      expect(result.nutrition?.per_serving.calories).toBe(280);
      expect(result.nutrition?.per_serving.protein).toBe(35);
      expect(result.nutrition?.per_serving.sugar).toBe(6);
      expect(result.nutrition?.per_serving.sodium).toBe(320);
    });

    it('should extract dietary information correctly', () => {
      const result = spoonacularTransformer.transform(mockSpoonacularRecipe);

      expect(result.dietary).toBeDefined();
      expect(result.dietary?.isGlutenFree).toBe(true);
      expect(result.dietary?.isVegan).toBe(false);
      expect(result.dietary?.isVegetarian).toBe(false);
      expect(result.dietary?.isDairyFree).toBe(false);
      expect(result.dietary?.diets).toContain('gluten-free');
    });

    it('should clean HTML from description', () => {
      const result = spoonacularTransformer.transform(mockSpoonacularRecipe);

      expect(result.description).toBe('A healthy grilled chicken salad with fresh vegetables.');
      expect(result.description).not.toContain('<b>');
      expect(result.description).not.toContain('</b>');
    });

    it('should generate appropriate tags', () => {
      const result = spoonacularTransformer.transform(mockSpoonacularRecipe);

      expect(result.metadata?.tags).toBeDefined();
      expect(result.metadata?.tags).toContain('spoonacular');
      expect(result.metadata?.tags).toContain('salad');
      expect(result.metadata?.tags).toContain('lunch');
      expect(result.metadata?.tags).toContain('american');
      expect(result.metadata?.tags).toContain('healthy');
    });
  });

  describe('Transformation Consistency', () => {
    it('should ensure all unified items have consistent ID format', () => {
      const usdaFood: FoodLookupResult = {
        id: '12345',
        name: 'Test Food',
        category: 'Test',
        nutrition: {
          per100g: { calories: 100, protein: 10, carbs: 10, fat: 5, fiber: 2 },
          servingSize: '100g'
        },
        source: { api: 'usda', id: '12345', lastUpdated: '2024-01-01' },
        metadata: { confidence: 0.8, warnings: [] }
      };

      const spoonacularRecipe: Recipe = {
        id: 67890,
        title: 'Test Recipe'
      };

      const usdaResult = usdaTransformer.transform(usdaFood);
      const spoonacularResult = spoonacularTransformer.transform(spoonacularRecipe);

      expect(typeof usdaResult.id).toBe('string');
      expect(typeof spoonacularResult.id).toBe('string');
      expect(usdaResult.id).toBe('12345');
      expect(spoonacularResult.id).toBe('67890');
    });

    it('should ensure all unified items have required fields', () => {
      const usdaFood: FoodLookupResult = {
        id: '11111',
        name: 'Apple',
        category: 'Fruits',
        nutrition: {
          per100g: { calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4 },
          servingSize: '100g'
        },
        source: { api: 'usda', id: '11111', lastUpdated: '2024-01-01' },
        metadata: { confidence: 0.9, warnings: [] }
      };

      const result = usdaTransformer.transform(usdaFood);

      // Check required UnifiedMealItem fields
      expect(result.id).toBeDefined();
      expect(result.source).toBeDefined();
      expect(result.originalId).toBeDefined();
      expect(result.title).toBeDefined();
      expect(result.type).toBeDefined();
      expect(result.metadata).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid USDA data', () => {
      expect(() => {
        usdaTransformer.transform(null as any);
      }).toThrow('Invalid USDA food data: missing required ID');

      expect(() => {
        usdaTransformer.transform({} as any);
      }).toThrow('Invalid USDA food data: missing required ID');
    });

    it('should throw error for invalid Spoonacular data', () => {
      expect(() => {
        spoonacularTransformer.transform(null as any);
      }).toThrow('Invalid Spoonacular recipe data: missing required ID');

      expect(() => {
        spoonacularTransformer.transform({} as any);
      }).toThrow('Invalid Spoonacular recipe data: missing required ID');
    });
  });
});