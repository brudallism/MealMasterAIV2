// src/services/transformers/usda-transformer.ts

import { FoodLookupResult } from '@/services/api/types';
import {
  UnifiedMealItem,
  UnifiedNutrition,
  UnifiedItemType
} from '@/types/unified-meal-item';
import { AbstractTransformer } from './base-transformer';

/**
 * Transforms USDA FoodLookupResult objects into unified MealItem format
 * Maintains consistency with the existing USDA data structure while providing unified interface
 */
export class USDATransformer extends AbstractTransformer<FoodLookupResult> {

  /**
   * Transform a single USDA FoodLookupResult to UnifiedMealItem
   */
  transform(food: FoodLookupResult): UnifiedMealItem {
    // Validate required data
    if (!food || !food.id) {
      throw new Error('Invalid USDA food data: missing required ID');
    }

    return {
      // ID is already string in USDA, maintain consistency
      id: food.id,
      source: 'usda',
      originalId: food.id,

      // Core properties
      title: this.safeString(food.name, 'Unknown Food Item'),
      type: this.determineItemType(food),

      // Display information
      image: food.metadata?.foodIcon,
      description: this.extractDescription(food),

      // Food-specific properties
      brandOwner: food.brand,

      // Nutrition (convert to unified format)
      nutrition: this.transformNutrition(food.nutrition),

      // Dietary information (extracted from food data)
      dietary: this.extractDietaryInfo(food),

      // Additional metadata
      metadata: {
        searchRelevance: this.safeNumber(food.metadata?.confidence, 0),
        lastUpdated: food.source?.lastUpdated || new Date().toISOString(),
        tags: this.extractFoodTags(food),
      },
    };
  }


  /**
   * Determine the unified item type based on USDA category and data type
   */
  private determineItemType(food: FoodLookupResult): UnifiedItemType {
    const category = food.category?.toLowerCase() || '';
    const dataType = food.source?.dataType?.toLowerCase() || '';

    // Prioritize dataType over brand presence for better classification
    if (dataType.includes('foundation') || category.includes('foundation')) {
      return 'ingredient';
    } else if (dataType.includes('sr legacy') || category.includes('sr legacy')) {
      return 'ingredient';
    } else if (category.includes('branded') || food.brand) {
      return 'product';
    } else {
      return 'food';
    }
  }

  /**
   * Extract description from available food information
   */
  private extractDescription(food: FoodLookupResult): string | undefined {
    const parts: string[] = [];

    if (food.brand) {
      parts.push(`Brand: ${food.brand}`);
    }

    if (food.category && food.category !== 'Unknown') {
      parts.push(`Category: ${food.category}`);
    }

    if (food.nutrition?.servingSize) {
      parts.push(`Serving: ${food.nutrition.servingSize}`);
    }

    return parts.length > 0 ? parts.join(' • ') : undefined;
  }

  /**
   * Transform USDA nutrition to unified format
   */
  private transformNutrition(nutrition?: any): UnifiedNutrition | undefined {
    if (!nutrition?.per100g) return undefined;

    // Convert per100g to per_serving format for consistency
    const per100g = nutrition.per100g;

    return {
      per_serving: {
        calories: per100g.calories || 0,
        protein: per100g.protein || 0,
        carbs: per100g.carbs || 0,
        fat: per100g.fat || 0,
        fiber: per100g.fiber || 0,
        // Extract additional nutrients if available
        sugar: this.extractMicronutrient(nutrition.micronutrients, 'sugar'),
        sodium: this.extractMicronutrient(nutrition.micronutrients, 'sodium'),
      },
      // USDA doesn't typically have total recipe data
      total_recipe: undefined,
    };
  }

  /**
   * Extract specific micronutrient value
   */
  private extractMicronutrient(micronutrients?: Record<number, any>, nutrientName?: string): number | undefined {
    if (!micronutrients || !nutrientName) return undefined;

    // This would need to be mapped to specific USDA nutrient IDs
    // For now, return undefined as this requires USDA-specific nutrient ID mapping
    return undefined;
  }

  /**
   * Extract dietary information from USDA food data
   */
  private extractDietaryInfo(food: FoodLookupResult) {
    const diets: string[] = [];
    const allergens: string[] = [];

    // USDA doesn't provide direct dietary flags, so we infer from name/category
    const foodName = food.name?.toLowerCase() || '';
    const category = food.category?.toLowerCase() || '';

    // Infer dietary properties from food name and category
    if (this.isVeganFriendly(foodName, category)) {
      diets.push('vegan');
    }

    if (this.isVegetarianFriendly(foodName, category)) {
      diets.push('vegetarian');
    }

    // Check for common allergens in the name
    if (this.containsAllergen(foodName, 'gluten')) {
      allergens.push('gluten');
    }

    if (this.containsAllergen(foodName, 'dairy')) {
      allergens.push('dairy');
    }

    if (this.containsAllergen(foodName, 'nuts')) {
      allergens.push('tree nuts');
    }

    return {
      diets: [...new Set(diets)],
      allergens: [...new Set(allergens)],
      isVegan: diets.includes('vegan'),
      isVegetarian: diets.includes('vegetarian'),
      isGlutenFree: !allergens.includes('gluten'),
      isDairyFree: !allergens.includes('dairy'),
    };
  }

  /**
   * Check if food is likely vegan-friendly
   */
  private isVeganFriendly(name: string, category: string): boolean {
    const nonVeganTerms = ['meat', 'chicken', 'beef', 'pork', 'fish', 'dairy', 'milk', 'cheese', 'egg', 'butter', 'cream'];
    const veganTerms = ['vegetable', 'fruit', 'grain', 'legume', 'nut', 'seed'];

    const hasNonVegan = nonVeganTerms.some(term => name.includes(term) || category.includes(term));
    const hasVegan = veganTerms.some(term => name.includes(term) || category.includes(term));

    return hasVegan && !hasNonVegan;
  }

  /**
   * Check if food is likely vegetarian-friendly
   */
  private isVegetarianFriendly(name: string, category: string): boolean {
    const nonVegetarianTerms = ['meat', 'chicken', 'beef', 'pork', 'fish', 'seafood'];

    return !nonVegetarianTerms.some(term => name.includes(term) || category.includes(term));
  }

  /**
   * Check if food contains specific allergen
   */
  private containsAllergen(name: string, allergen: string): boolean {
    const allergenTerms: Record<string, string[]> = {
      gluten: ['wheat', 'barley', 'rye', 'oats', 'bread', 'pasta', 'flour'],
      dairy: ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'dairy'],
      nuts: ['almond', 'walnut', 'cashew', 'pecan', 'hazelnut', 'pistachio', 'macadamia'],
      soy: ['soy', 'soya', 'tofu', 'tempeh'],
      egg: ['egg', 'albumin'],
    };

    const terms = allergenTerms[allergen] || [];
    return terms.some(term => name.includes(term));
  }

  /**
   * Extract tags from food properties using base class utilities
   */
  private extractFoodTags(food: FoodLookupResult): string[] {
    const sources: (string | string[])[] = [
      'usda', // Source identifier
    ];

    // Add category as tag
    if (food.category && food.category !== 'Unknown') {
      sources.push(food.category);
    }

    // Add brand indicator
    if (food.brand) {
      sources.push('branded');
    }

    // Add confidence level as tag
    const confidence = this.safeNumber(food.metadata?.confidence, 0);
    if (confidence > 0.8) {
      sources.push('high-confidence');
    } else if (confidence > 0.6) {
      sources.push('medium-confidence');
    } else {
      sources.push('low-confidence');
    }

    return this.extractTags(...sources);
  }
}

// Export a singleton instance for use throughout the app
export const usdaTransformer = new USDATransformer();