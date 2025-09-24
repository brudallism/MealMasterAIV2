// src/services/transformers/spoonacular-transformer.ts

import { Recipe } from '@/types/recipe';
import {
  UnifiedMealItem,
  UnifiedNutrition,
  UnifiedItemType
} from '@/types/unified-meal-item';
import { AbstractTransformer } from './base-transformer';
import { mapSpoonacularNutrients } from '@/services/nutrition/spoonacular-nutrient-mapper';

/**
 * Transforms Spoonacular Recipe objects into unified MealItem format
 * Resolves the data structure mismatch between Recipe (id: number) and MealItem (id: string)
 */
export class SpoonacularTransformer extends AbstractTransformer<Recipe> {

  /**
   * Transform a single Spoonacular Recipe to UnifiedMealItem
   */
  transform(recipe: Recipe): UnifiedMealItem {
    // Validate required data
    if (!recipe || !recipe.id) {
      throw new Error('Invalid Spoonacular recipe data: missing required ID');
    }

    return {
      // Standardized ID handling - convert number to string (CRITICAL FIX)
      id: recipe.id.toString(),
      source: 'spoonacular',
      originalId: recipe.id,

      // Core properties
      title: this.safeString(recipe.title, 'Untitled Recipe'),
      type: 'recipe' as UnifiedItemType,

      // Display information
      image: recipe.image,
      description: this.extractDescription(recipe),

      // Recipe-specific properties
      readyInMinutes: this.safeNumber(recipe.readyInMinutes, 0),
      servings: this.safeNumber(recipe.servings, 1),
      healthScore: recipe.healthScore,
      spoonacularScore: recipe.spoonacularScore,

      // Nutrition (convert to unified format)
      nutrition: this.transformNutrition(recipe.nutrition),

      // Dietary information (unified format)
      dietary: this.extractDietaryInfo(recipe),

      // Additional metadata
      metadata: {
        searchRelevance: this.safeNumber(recipe.spoonacularScore, 0),
        popularity: this.safeNumber(recipe.aggregateLikes, 0),
        lastUpdated: new Date().toISOString(),
        tags: this.extractRecipeTags(recipe),
      },
    };
  }


  /**
   * Extract description from recipe summary, removing HTML tags
   */
  private extractDescription(recipe: Recipe): string | undefined {
    if (!recipe.summary) return undefined;

    // Remove HTML tags and decode entities
    return recipe.summary
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&[^;]+;/g, ' ') // Remove HTML entities
      .trim()
      .substring(0, 200) + (recipe.summary.length > 200 ? '...' : '');
  }

  /**
   * Transform Spoonacular nutrition to unified format
   */
  private transformNutrition(nutrition?: any): UnifiedNutrition | undefined {
    if (!nutrition) {
      return undefined;
    }

    // Handle both simplified and full Spoonacular nutrition formats
    let macros;
    let micronutrients: Record<number, number> = {};

    if (nutrition.per_serving) {
      // Simplified format (from search results)
      macros = {
        calories: nutrition.per_serving.calories || 0,
        protein: nutrition.per_serving.protein || 0,
        carbs: nutrition.per_serving.carbs || 0,
        fat: nutrition.per_serving.fat || 0,
        fiber: nutrition.per_serving.fiber || 0,
        sugar: nutrition.per_serving.sugar,
        sodium: nutrition.per_serving.sodium,
      };

      // If nutrients array is also available, extract micronutrients
      if (nutrition.nutrients) {
        micronutrients = mapSpoonacularNutrients(nutrition.nutrients);
      }
    } else if (nutrition.nutrients) {
      // Full Spoonacular format (from detailed recipe data)
      macros = this.extractMacrosFromNutrients(nutrition.nutrients);
      micronutrients = mapSpoonacularNutrients(nutrition.nutrients);
    } else {
      return undefined;
    }

    return {
      per_serving: macros,
      total_recipe: nutrition.total_recipe ? {
        calories: nutrition.total_recipe.calories || 0,
        protein: nutrition.total_recipe.protein || 0,
        carbs: nutrition.total_recipe.carbs || 0,
        fat: nutrition.total_recipe.fat || 0,
        fiber: nutrition.total_recipe.fiber || 0,
      } : undefined,
      micronutrients: Object.keys(micronutrients).length > 0 ? micronutrients : undefined,
    };
  }

  /**
   * Extract macro nutrients from Spoonacular nutrients array
   */
  private extractMacrosFromNutrients(nutrients: any[]): any {
    const macros = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: undefined as number | undefined,
      sodium: undefined as number | undefined,
    };

    for (const nutrient of nutrients) {
      const name = nutrient.name.toLowerCase();
      const amount = nutrient.amount || 0;

      if (name.includes('calories') || name.includes('energy')) {
        macros.calories = amount;
      } else if (name.includes('protein')) {
        macros.protein = amount;
      } else if (name.includes('carbohydrates') || name === 'carbs') {
        macros.carbs = amount;
      } else if (name === 'fat' || name.includes('total fat')) {
        macros.fat = amount;
      } else if (name.includes('fiber')) {
        macros.fiber = amount;
      } else if (name.includes('sugar') && !name.includes('added')) {
        macros.sugar = amount;
      } else if (name.includes('sodium')) {
        macros.sodium = amount;
      }
    }

    return macros;
  }

  /**
   * Extract and normalize dietary information
   */
  private extractDietaryInfo(recipe: Recipe) {
    const diets: string[] = [];
    const allergens: string[] = [];

    // Extract diet information from recipe properties
    if (recipe.vegan) diets.push('vegan');
    if (recipe.vegetarian) diets.push('vegetarian');
    if (recipe.glutenFree) diets.push('gluten-free');
    if (recipe.dairyFree) diets.push('dairy-free');
    if (recipe.ketogenic) diets.push('ketogenic');
    if (recipe.lowFodmap) diets.push('low-fodmap');
    if (recipe.whole30) diets.push('whole30');

    // Add diets from the diets array
    if (recipe.diets && Array.isArray(recipe.diets)) {
      diets.push(...recipe.diets.map(diet => diet.toLowerCase()));
    }

    // Extract potential allergens (inverse of dietary flags)
    if (!recipe.glutenFree) allergens.push('gluten');
    if (!recipe.dairyFree) allergens.push('dairy');

    return {
      diets: [...new Set(diets)], // Remove duplicates
      allergens: [...new Set(allergens)],
      isVegan: recipe.vegan || false,
      isVegetarian: recipe.vegetarian || false,
      isGlutenFree: recipe.glutenFree || false,
      isDairyFree: recipe.dairyFree || false,
    };
  }

  /**
   * Extract tags from various recipe properties using base class utilities
   */
  private extractRecipeTags(recipe: Recipe): string[] {
    const sources: (string | string[])[] = [
      'spoonacular', // Source identifier
    ];

    // Add dish types, cuisines, occasions
    sources.push(
      this.safeArray(recipe.dishTypes),
      this.safeArray(recipe.cuisines),
      this.safeArray(recipe.occasions)
    );

    // Add timing-based tags
    const readyTime = this.safeNumber(recipe.readyInMinutes, 0);
    if (readyTime > 0) {
      if (readyTime <= 15) {
        sources.push('quick');
      } else if (readyTime <= 30) {
        sources.push('fast');
      }
    }

    // Add health and popularity indicators
    const healthTags: string[] = [];
    if (recipe.veryHealthy) healthTags.push('healthy');
    if (recipe.cheap) healthTags.push('budget-friendly');
    if (recipe.veryPopular) healthTags.push('popular');

    if (healthTags.length > 0) {
      sources.push(healthTags);
    }

    return this.extractTags(...sources);
  }
}

// Export a singleton instance for use throughout the app
export const spoonacularTransformer = new SpoonacularTransformer();