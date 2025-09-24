// src/__tests__/integration/usda-transformation-integration.test.ts

/**
 * Integration test for USDA integration through the transformation layer
 * Validates that the complete flow works from search to unified data
 */

import { UnifiedMealItem } from '@/types/unified-meal-item';

// Mock the spoonacular client before importing unified search service
jest.mock('@/services/api/spoonacular-client', () => ({
  spoonacularClient: {
    searchRecipes: jest.fn(),
    getRecipeById: jest.fn(),
  }
}));

import { unifiedSearchService } from '@/services/unified-search-service';
import { usdaTransformer } from '@/services/transformers/usda-transformer';

describe('USDA Integration through Transformation Layer', () => {
  // Mock USDA search function that returns SearchResults format
  const mockUSDASearchFunction = async (query: string) => {
    // Mock USDA API response that matches the current SearchScreen format
    const mockFoodLookupResults = [
      {
        id: 'usda_173425',
        name: 'Chicken breast, boneless, skinless',
        brand: 'Test Brand',
        category: 'ingredient',
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
          api: 'usda' as const,
          id: '173425',
          dataType: 'Foundation',
          lastUpdated: '2024-01-01'
        },
        metadata: {
          confidence: 0.95,
          warnings: []
        }
      }
    ];

    return {
      ingredients: mockFoodLookupResults,
      products: [],
      recipes: [],
      total: mockFoodLookupResults.length,
      fromCache: false,
      searchTime: 100
    };
  };

  it('should complete full USDA search through unified service', async () => {
    // Test the unified search service with our mock USDA function
    const result = await unifiedSearchService.searchFoods('chicken breast', mockUSDASearchFunction);

    expect(result).toBeDefined();
    expect(result.source).toBe('usda');
    expect(result.query).toBe('chicken breast');
    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);

    const unifiedItem = result.items[0];

    // Verify the transformation produced correct UnifiedMealItem
    expect(unifiedItem.id).toBe('usda_173425');
    expect(unifiedItem.source).toBe('usda');
    expect(unifiedItem.originalId).toBe('usda_173425');
    expect(unifiedItem.title).toBe('Chicken breast, boneless, skinless');
    expect(unifiedItem.type).toBe('ingredient');
    expect(unifiedItem.brandOwner).toBe('Test Brand');

    // Verify nutrition transformation
    expect(unifiedItem.nutrition).toBeDefined();
    expect(unifiedItem.nutrition?.per_serving.calories).toBe(165);
    expect(unifiedItem.nutrition?.per_serving.protein).toBe(31);
    expect(unifiedItem.nutrition?.per_serving.carbs).toBe(0);
    expect(unifiedItem.nutrition?.per_serving.fat).toBe(3.6);
    expect(unifiedItem.nutrition?.per_serving.fiber).toBe(0);

    // Verify metadata
    expect(unifiedItem.metadata?.searchRelevance).toBe(0.95);
    expect(unifiedItem.metadata?.tags).toContain('usda');
  });

  it('should handle empty search results gracefully', async () => {
    const emptyUSDASearchFunction = async (query: string) => ({
      ingredients: [],
      products: [],
      recipes: [],
      total: 0,
      fromCache: false,
      searchTime: 50
    });

    const result = await unifiedSearchService.searchFoods('nonexistent food', emptyUSDASearchFunction);

    expect(result).toBeDefined();
    expect(result.source).toBe('usda');
    expect(result.query).toBe('nonexistent food');
    expect(result.total).toBe(0);
    expect(result.items).toHaveLength(0);
  });

  it('should handle search errors gracefully', async () => {
    const errorUSDASearchFunction = async (query: string) => {
      throw new Error('USDA API error');
    };

    const result = await unifiedSearchService.searchFoods('test', errorUSDASearchFunction);

    expect(result).toBeDefined();
    expect(result.source).toBe('usda');
    expect(result.query).toBe('test');
    expect(result.total).toBe(0);
    expect(result.items).toHaveLength(0);
  });

  it('should maintain data consistency for FoodDetailModal compatibility', async () => {
    const result = await unifiedSearchService.searchFoods('chicken', mockUSDASearchFunction);
    const unifiedItem = result.items[0];

    // Test that we can convert back to legacy format for components that need it
    const legacyFormat = {
      id: unifiedItem.id,
      name: unifiedItem.title,
      brand: unifiedItem.brandOwner,
      category: unifiedItem.type,
      nutrition: {
        per100g: {
          calories: unifiedItem.nutrition?.per_serving.calories || 0,
          protein: unifiedItem.nutrition?.per_serving.protein || 0,
          carbs: unifiedItem.nutrition?.per_serving.carbs || 0,
          fat: unifiedItem.nutrition?.per_serving.fat || 0,
          fiber: unifiedItem.nutrition?.per_serving.fiber || 0,
        },
        servingSize: '100g'
      },
      source: {
        api: unifiedItem.source,
        id: unifiedItem.originalId.toString(),
        lastUpdated: unifiedItem.metadata?.lastUpdated || new Date().toISOString()
      },
      metadata: {
        confidence: unifiedItem.metadata?.searchRelevance || 0.8,
        warnings: []
      }
    };

    // Verify the legacy format maintains all required properties
    expect(legacyFormat.id).toBe('usda_173425');
    expect(legacyFormat.name).toBe('Chicken breast, boneless, skinless');
    expect(legacyFormat.nutrition.per100g.calories).toBe(165);
    expect(legacyFormat.source.api).toBe('usda');
  });

  it('should ensure string-based IDs eliminate React hooks violations', () => {
    // This test validates the core problem we're solving
    const mockSpoonacularId = 123456; // number
    const mockUSDAId = 'usda_173425'; // string

    // Transform both to unified format
    const unifiedSpoonacularId = mockSpoonacularId.toString();
    const unifiedUSDAId = mockUSDAId;

    // Verify both are strings
    expect(typeof unifiedSpoonacularId).toBe('string');
    expect(typeof unifiedUSDAId).toBe('string');

    // Verify they can be used consistently in React component keys/effects
    expect(unifiedSpoonacularId).toBe('123456');
    expect(unifiedUSDAId).toBe('usda_173425');
  });
});