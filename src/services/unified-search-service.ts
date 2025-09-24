// src/services/unified-search-service.ts

import { FoodLookupResult, SearchResults } from '@/services/api/types';
import { Recipe } from '@/types/recipe';
import { spoonacularClient } from '@/services/api/spoonacular-client';
import { spoonacularTransformer } from '@/services/transformers/spoonacular-transformer';
import { usdaTransformer } from '@/services/transformers/usda-transformer';
import {
  UnifiedMealItem,
  UnifiedSearchResult,
  APISource
} from '@/types/unified-meal-item';
import { DietaryPreferences } from '@/types/dietary';
import { RecipeFilters, convertFiltersToSpoonacularParams } from '@/types/recipe-filters';

/**
 * Unified search service that coordinates between USDA and Spoonacular APIs
 * and transforms all results into a consistent UnifiedMealItem format
 */
export class UnifiedSearchService {

  /**
   * Search for foods using USDA API and transform to unified format
   * @param query Search query
   * @param existingSearchFunction The current USDA search function from SearchScreen
   */
  async searchFoods(
    query: string,
    existingSearchFunction?: (query: string) => Promise<SearchResults | null>
  ): Promise<UnifiedSearchResult> {
    try {
      console.log('[UnifiedSearch] Searching foods via USDA:', query);

      if (!existingSearchFunction) {
        console.warn('[UnifiedSearch] No USDA search function provided');
        return {
          total: 0,
          items: [],
          source: 'usda',
          query,
        };
      }

      const usdaResults = await existingSearchFunction(query);

      if (!usdaResults) {
        return {
          total: 0,
          items: [],
          source: 'usda',
          query,
        };
      }

      // Transform all USDA results to unified format
      const allFoodItems: FoodLookupResult[] = [
        ...usdaResults.ingredients,
        ...usdaResults.products,
        ...usdaResults.recipes, // USDA recipes (different from Spoonacular)
      ];

      const unifiedItems = usdaTransformer.transformBatch(allFoodItems);

      console.log('[UnifiedSearch] USDA results transformed:', {
        original: usdaResults.total,
        unified: unifiedItems.length,
      });

      return {
        total: unifiedItems.length,
        items: unifiedItems,
        source: 'usda',
        query,
      };

    } catch (error) {
      console.error('[UnifiedSearch] Food search error:', error);
      return {
        total: 0,
        items: [],
        source: 'usda',
        query,
      };
    }
  }

  /**
   * Search for recipes using Spoonacular API with comprehensive filters
   * @param query Search query
   * @param dietaryPreferences User's dietary preferences
   * @param options Search options (filters, pagination)
   * @param customFilters Optional comprehensive recipe filters
   */
  async searchRecipes(
    query: string,
    dietaryPreferences: DietaryPreferences,
    options: {
      number?: number;
      offset?: number;
      maxReadyTime?: number;
      maxIngredients?: number;
    } = {},
    customFilters?: RecipeFilters
  ): Promise<UnifiedSearchResult> {
    try {
      console.log('[UnifiedSearch] Searching recipes via Spoonacular:', query, options, customFilters);

      // Merge dietary preferences with custom filters if provided
      const searchOptions: any = {
        query,
        number: options.number || 12,
        offset: options.offset || 0,
        maxReadyTime: options.maxReadyTime,
        maxIngredients: options.maxIngredients,
      };

      // Apply comprehensive filters if provided
      if (customFilters) {
        const filterParams = convertFiltersToSpoonacularParams(customFilters);
        Object.assign(searchOptions, filterParams);

        // Extract additional filter options for the client
        if (customFilters.preparation) {
          const prep = customFilters.preparation;
          if (prep.minReadyTime) searchOptions.minReadyTime = prep.minReadyTime;
          if (prep.maxPrepTime) searchOptions.maxPrepTime = prep.maxPrepTime;
          if (prep.minIngredients) searchOptions.minIngredients = prep.minIngredients;
          if (prep.equipment) searchOptions.equipment = prep.equipment.join(',');
          if (prep.excludeEquipment) searchOptions.excludeEquipment = prep.excludeEquipment.join(',');
        }

        if (customFilters.nutrition) {
          const nutr = customFilters.nutrition;
          if (nutr.minCalories) searchOptions.minCalories = nutr.minCalories;
          if (nutr.maxCalories) searchOptions.maxCalories = nutr.maxCalories;
          if (nutr.minProtein) searchOptions.minProtein = nutr.minProtein;
          if (nutr.maxProtein) searchOptions.maxProtein = nutr.maxProtein;
          if (nutr.minCarbs) searchOptions.minCarbs = nutr.minCarbs;
          if (nutr.maxCarbs) searchOptions.maxCarbs = nutr.maxCarbs;
          if (nutr.minFat) searchOptions.minFat = nutr.minFat;
          if (nutr.maxFat) searchOptions.maxFat = nutr.maxFat;
          if (nutr.minFiber) searchOptions.minFiber = nutr.minFiber;
        }

        if (customFilters.context) {
          const ctx = customFilters.context;
          if (ctx.mealTypes) searchOptions.type = ctx.mealTypes.join(',');
          if (ctx.maxPrice) searchOptions.maxPrice = ctx.maxPrice;
          if (ctx.minPrice) searchOptions.minPrice = ctx.minPrice;
        }

        if (customFilters.style) {
          const style = customFilters.style;
          if (style.cuisines) searchOptions.cuisine = style.cuisines.join(',');
        }

        if (customFilters.dietary) {
          const diet = customFilters.dietary;
          if (diet.diets) searchOptions.diet = diet.diets.join(',');
          if (diet.intolerances) searchOptions.intolerances = diet.intolerances.join(',');
        }

        if (customFilters.sorting) {
          const sort = customFilters.sorting;
          if (sort.sort) searchOptions.sort = sort.sort;
          if (sort.sortDirection) searchOptions.sortDirection = sort.sortDirection;
        }

        // Add recipe instructions if needed for detailed recipes
        if (customFilters.practical?.makeAhead || customFilters.special?.comfortFood) {
          searchOptions.addRecipeInstructions = true;
        }
      }

      const spoonacularResults = await spoonacularClient.searchRecipes(
        dietaryPreferences,
        searchOptions
      );

      // Transform all Spoonacular results to unified format
      const unifiedItems = spoonacularTransformer.transformBatch(spoonacularResults);

      console.log('[UnifiedSearch] Spoonacular results transformed:', {
        original: spoonacularResults.length,
        unified: unifiedItems.length,
      });

      return {
        total: unifiedItems.length,
        items: unifiedItems,
        source: 'spoonacular',
        query,
        filters: {
          maxReadyTime: options.maxReadyTime,
          maxIngredients: options.maxIngredients,
          dietaryPreferences,
          customFilters,
          appliedFilters: customFilters ? searchOptions : undefined,
        },
      };

    } catch (error) {
      console.error('[UnifiedSearch] Recipe search error:', error);
      return {
        total: 0,
        items: [],
        source: 'spoonacular',
        query,
      };
    }
  }

  /**
   * Combined search that can search both foods and recipes simultaneously
   * @param query Search query
   * @param searchModes Which types to search for
   * @param dietaryPreferences User's dietary preferences
   * @param options Search options
   */
  async searchAll(
    query: string,
    searchModes: { foods: boolean; recipes: boolean },
    dietaryPreferences: DietaryPreferences,
    existingSearchFunction: (query: string) => Promise<SearchResults | null>,
    options: {
      number?: number;
      offset?: number;
      maxReadyTime?: number;
      maxIngredients?: number;
    } = {}
  ): Promise<{
    foods?: UnifiedSearchResult;
    recipes?: UnifiedSearchResult;
    combined: UnifiedSearchResult;
  }> {
    const results: {
      foods?: UnifiedSearchResult;
      recipes?: UnifiedSearchResult;
      combined: UnifiedSearchResult;
    } = {
      combined: {
        total: 0,
        items: [],
        source: 'mixed',
        query,
      },
    };

    const promises: Promise<void>[] = [];

    // Search foods if requested
    if (searchModes.foods) {
      promises.push(
        this.searchFoods(query, existingSearchFunction).then(foodResults => {
          results.foods = foodResults;
        })
      );
    }

    // Search recipes if requested
    if (searchModes.recipes) {
      promises.push(
        this.searchRecipes(query, dietaryPreferences, options).then(recipeResults => {
          results.recipes = recipeResults;
        })
      );
    }

    // Wait for all searches to complete
    await Promise.all(promises);

    // Combine results
    const combinedItems: UnifiedMealItem[] = [];
    let combinedTotal = 0;

    if (results.foods) {
      combinedItems.push(...results.foods.items);
      combinedTotal += results.foods.total;
    }

    if (results.recipes) {
      combinedItems.push(...results.recipes.items);
      combinedTotal += results.recipes.total;
    }

    results.combined = {
      total: combinedTotal,
      items: combinedItems,
      source: 'mixed',
      query,
      filters: options,
    };

    console.log('[UnifiedSearch] Combined search results:', {
      foodsTotal: results.foods?.total || 0,
      recipesTotal: results.recipes?.total || 0,
      combinedTotal: results.combined.total,
    });

    return results;
  }

  /**
   * Get a unified item by ID (works for both USDA and Spoonacular)
   * @param id The unified ID (string format)
   * @param source The API source
   */
  async getItemById(id: string, source: APISource): Promise<UnifiedMealItem | null> {
    try {
      if (source === 'spoonacular') {
        console.log('[UnifiedSearch] Getting Spoonacular recipe by ID:', id);

        const recipe = await spoonacularClient.getRecipeById(Number(id));
        if (!recipe) {
          return null;
        }

        return spoonacularTransformer.transform(recipe);

      } else if (source === 'usda') {
        console.log('[UnifiedSearch] Getting USDA food by ID:', id);

        // For USDA, we would need to implement a getFoodDetails method
        // For now, this is not implemented as the existing system doesn't use this pattern
        console.warn('[UnifiedSearch] USDA getItemById not yet implemented');
        return null;
      }

      return null;
    } catch (error) {
      console.error('[UnifiedSearch] Error getting item by ID:', error);
      return null;
    }
  }

  /**
   * Convert a legacy MealItem to UnifiedMealItem format
   * This helps with backward compatibility during migration
   */
  convertLegacyMealItem(legacyItem: any): UnifiedMealItem {
    // Check if it's already a UnifiedMealItem
    if (legacyItem.source && legacyItem.originalId) {
      return legacyItem as UnifiedMealItem;
    }

    // Convert from legacy format
    if (legacyItem.food) {
      // Legacy starred food format
      return usdaTransformer.transform(legacyItem.food);
    } else if (legacyItem.id && typeof legacyItem.id === 'number') {
      // Looks like a Spoonacular recipe
      return spoonacularTransformer.transform(legacyItem as Recipe);
    } else {
      // Fallback - treat as USDA food
      return usdaTransformer.transform(legacyItem as FoodLookupResult);
    }
  }
}

// Export a singleton instance for use throughout the app
export const unifiedSearchService = new UnifiedSearchService();