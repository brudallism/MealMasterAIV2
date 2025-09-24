// src/services/macros/food-density-manager.ts
// Food-density aware unit conversion system

export interface FoodDensityEntry {
  fdcId?: string;           // USDA food ID if available
  category: string;         // Food category for fallback matching
  densityG_per_cup: number; // Primary conversion factor
  densityG_per_tbsp: number;
  densityG_per_tsp: number;
  confidence: number;       // 0.0-1.0 reliability score
  source: 'usda' | 'generic' | 'estimated';
}

export interface ConversionResult {
  grams: number;
  confidence: number;
  method: 'exact_match' | 'category_match' | 'generic_fallback' | 'weight_based';
}

// Generic density database for common food categories
const GENERIC_DENSITIES: Record<string, FoodDensityEntry> = {
  // Liquids
  'liquid': {
    category: 'liquid',
    densityG_per_cup: 240,
    densityG_per_tbsp: 15,
    densityG_per_tsp: 5,
    confidence: 0.95,
    source: 'generic'
  },
  'milk': {
    category: 'milk',
    densityG_per_cup: 245,
    densityG_per_tbsp: 15.3,
    densityG_per_tsp: 5.1,
    confidence: 0.9,
    source: 'generic'
  },
  'oil': {
    category: 'oil',
    densityG_per_cup: 218,
    densityG_per_tbsp: 13.6,
    densityG_per_tsp: 4.5,
    confidence: 0.9,
    source: 'generic'
  },

  // Dry goods
  'flour': {
    category: 'flour',
    densityG_per_cup: 120,
    densityG_per_tbsp: 7.5,
    densityG_per_tsp: 2.5,
    confidence: 0.8,
    source: 'generic'
  },
  'sugar': {
    category: 'sugar',
    densityG_per_cup: 200,
    densityG_per_tbsp: 12.5,
    densityG_per_tsp: 4.2,
    confidence: 0.9,
    source: 'generic'
  },
  'rice_raw': {
    category: 'rice_raw',
    densityG_per_cup: 195,
    densityG_per_tbsp: 12.2,
    densityG_per_tsp: 4.1,
    confidence: 0.85,
    source: 'generic'
  },
  'rice_cooked': {
    category: 'rice_cooked',
    densityG_per_cup: 195,
    densityG_per_tbsp: 12.2,
    densityG_per_tsp: 4.1,
    confidence: 0.8,
    source: 'generic'
  },

  // Vegetables
  'leafy_greens': {
    category: 'leafy_greens',
    densityG_per_cup: 30,
    densityG_per_tbsp: 1.9,
    densityG_per_tsp: 0.6,
    confidence: 0.7,
    source: 'generic'
  },
  'chopped_vegetables': {
    category: 'chopped_vegetables',
    densityG_per_cup: 120,
    densityG_per_tbsp: 7.5,
    densityG_per_tsp: 2.5,
    confidence: 0.7,
    source: 'generic'
  },

  // Proteins
  'ground_meat': {
    category: 'ground_meat',
    densityG_per_cup: 225,
    densityG_per_tbsp: 14,
    densityG_per_tsp: 4.7,
    confidence: 0.8,
    source: 'generic'
  },
  'chopped_meat': {
    category: 'chopped_meat',
    densityG_per_cup: 140,
    densityG_per_tbsp: 8.8,
    densityG_per_tsp: 2.9,
    confidence: 0.75,
    source: 'generic'
  },

  // Nuts and seeds
  'nuts': {
    category: 'nuts',
    densityG_per_cup: 140,
    densityG_per_tbsp: 8.8,
    densityG_per_tsp: 2.9,
    confidence: 0.8,
    source: 'generic'
  },

  // Grains
  'oats_dry': {
    category: 'oats_dry',
    densityG_per_cup: 80,
    densityG_per_tbsp: 5,
    densityG_per_tsp: 1.7,
    confidence: 0.85,
    source: 'generic'
  },
  'pasta_dry': {
    category: 'pasta_dry',
    densityG_per_cup: 115,
    densityG_per_tbsp: 7.2,
    densityG_per_tsp: 2.4,
    confidence: 0.8,
    source: 'generic'
  }
};

// USDA-specific densities (higher confidence)
const USDA_DENSITIES: Record<string, FoodDensityEntry> = {
  // Will be populated from USDA data when available
  '168462': { // All-purpose flour
    fdcId: '168462',
    category: 'flour',
    densityG_per_cup: 125,
    densityG_per_tbsp: 7.8,
    densityG_per_tsp: 2.6,
    confidence: 0.95,
    source: 'usda'
  },
  '169414': { // White sugar, granulated
    fdcId: '169414',
    category: 'sugar',
    densityG_per_cup: 200,
    densityG_per_tbsp: 12.5,
    densityG_per_tsp: 4.2,
    confidence: 0.95,
    source: 'usda'
  }
};

export class FoodDensityManager {
  private usdaDensities: Map<string, FoodDensityEntry>;
  private genericDensities: Map<string, FoodDensityEntry>;

  constructor() {
    this.usdaDensities = new Map(Object.entries(USDA_DENSITIES));
    this.genericDensities = new Map(Object.entries(GENERIC_DENSITIES));
  }

  /**
   * Convert volume/count units to grams using food-specific density
   */
  convertToGrams(
    quantity: number,
    unit: string,
    foodId?: string,
    foodName?: string,
    category?: string
  ): ConversionResult {
    // Weight-based units - direct conversion
    if (this.isWeightUnit(unit)) {
      return this.convertWeightToGrams(quantity, unit);
    }

    // Volume-based units - needs density lookup
    if (this.isVolumeUnit(unit)) {
      return this.convertVolumeToGrams(quantity, unit, foodId, foodName, category);
    }

    // Count-based units - approximate conversion
    if (this.isCountUnit(unit)) {
      return this.convertCountToGrams(quantity, unit, foodName, category);
    }

    // Fallback - treat as serving (100g)
    return {
      grams: quantity * 100,
      confidence: 0.3,
      method: 'generic_fallback'
    };
  }

  private isWeightUnit(unit: string): boolean {
    const weightUnits = ['g', 'gram', 'grams', 'kg', 'kilogram', 'kilograms', 'oz', 'ounce', 'ounces', 'lb', 'pound', 'pounds'];
    return weightUnits.includes(unit.toLowerCase());
  }

  private isVolumeUnit(unit: string): boolean {
    const volumeUnits = ['cup', 'cups', 'tbsp', 'tablespoon', 'tablespoons', 'tsp', 'teaspoon', 'teaspoons', 'ml', 'milliliter', 'milliliters', 'l', 'liter', 'liters', 'fl oz', 'fluid ounce', 'fluid ounces'];
    return volumeUnits.includes(unit.toLowerCase());
  }

  private isCountUnit(unit: string): boolean {
    const countUnits = ['piece', 'pieces', 'item', 'items', 'slice', 'slices', 'serving', 'servings'];
    return countUnits.includes(unit.toLowerCase());
  }

  private convertWeightToGrams(quantity: number, unit: string): ConversionResult {
    const unitLower = unit.toLowerCase();
    let grams: number;

    switch (unitLower) {
      case 'g':
      case 'gram':
      case 'grams':
        grams = quantity;
        break;
      case 'kg':
      case 'kilogram':
      case 'kilograms':
        grams = quantity * 1000;
        break;
      case 'oz':
      case 'ounce':
      case 'ounces':
        grams = quantity * 28.35;
        break;
      case 'lb':
      case 'pound':
      case 'pounds':
        grams = quantity * 453.59;
        break;
      default:
        grams = quantity; // Assume grams
    }

    return {
      grams,
      confidence: 1.0,
      method: 'weight_based'
    };
  }

  private convertVolumeToGrams(
    quantity: number,
    unit: string,
    foodId?: string,
    foodName?: string,
    category?: string
  ): ConversionResult {
    // Try exact USDA match first
    if (foodId && this.usdaDensities.has(foodId)) {
      const density = this.usdaDensities.get(foodId)!;
      const grams = this.applyVolumeDensity(quantity, unit, density);
      return {
        grams,
        confidence: density.confidence,
        method: 'exact_match'
      };
    }

    // Try category match
    const densityEntry = this.findBestDensityMatch(foodName, category);
    if (densityEntry) {
      const grams = this.applyVolumeDensity(quantity, unit, densityEntry);
      return {
        grams,
        confidence: densityEntry.confidence * 0.8, // Reduce confidence for category match
        method: 'category_match'
      };
    }

    // Generic fallback - assume water density
    const waterDensity = this.genericDensities.get('liquid')!;
    const grams = this.applyVolumeDensity(quantity, unit, waterDensity);
    return {
      grams,
      confidence: 0.4,
      method: 'generic_fallback'
    };
  }

  private applyVolumeDensity(quantity: number, unit: string, density: FoodDensityEntry): number {
    const unitLower = unit.toLowerCase();

    switch (unitLower) {
      case 'cup':
      case 'cups':
        return quantity * density.densityG_per_cup;
      case 'tbsp':
      case 'tablespoon':
      case 'tablespoons':
        return quantity * density.densityG_per_tbsp;
      case 'tsp':
      case 'teaspoon':
      case 'teaspoons':
        return quantity * density.densityG_per_tsp;
      case 'ml':
      case 'milliliter':
      case 'milliliters':
        // Assume liquid density (1g/ml) modified by food density ratio
        return quantity * (density.densityG_per_cup / 240);
      case 'l':
      case 'liter':
      case 'liters':
        return quantity * 1000 * (density.densityG_per_cup / 240);
      case 'fl oz':
      case 'fluid ounce':
      case 'fluid ounces':
        // 1 fl oz = ~30ml
        return quantity * 30 * (density.densityG_per_cup / 240);
      default:
        return quantity * density.densityG_per_cup; // Default to cup
    }
  }

  private convertCountToGrams(
    quantity: number,
    unit: string,
    foodName?: string,
    category?: string
  ): ConversionResult {
    // Very approximate conversions for count-based units
    // This would be improved with a database of typical serving sizes
    const unitLower = unit.toLowerCase();
    let gramsPerUnit: number;

    switch (unitLower) {
      case 'slice':
      case 'slices':
        gramsPerUnit = this.estimateSliceWeight(foodName, category);
        break;
      case 'piece':
      case 'pieces':
      case 'item':
      case 'items':
        gramsPerUnit = this.estimatePieceWeight(foodName, category);
        break;
      case 'serving':
      case 'servings':
        gramsPerUnit = 100; // Standard serving assumption
        break;
      default:
        gramsPerUnit = 100; // Generic serving
    }

    return {
      grams: quantity * gramsPerUnit,
      confidence: 0.6,
      method: 'generic_fallback'
    };
  }

  private estimateSliceWeight(foodName?: string, category?: string): number {
    const name = (foodName || '').toLowerCase();

    if (name.includes('bread')) return 30;
    if (name.includes('pizza')) return 120;
    if (name.includes('cake')) return 80;
    if (name.includes('cheese')) return 25;
    if (name.includes('apple')) return 20;

    return 50; // Default slice weight
  }

  private estimatePieceWeight(foodName?: string, category?: string): number {
    const name = (foodName || '').toLowerCase();

    if (name.includes('cookie')) return 15;
    if (name.includes('banana')) return 120;
    if (name.includes('apple')) return 180;
    if (name.includes('orange')) return 160;
    if (name.includes('egg')) return 50;

    return 100; // Default piece weight
  }

  private findBestDensityMatch(foodName?: string, category?: string): FoodDensityEntry | null {
    if (!foodName && !category) return null;

    const searchTerms = [
      category?.toLowerCase(),
      ...(foodName?.toLowerCase().split(' ') || [])
    ].filter(Boolean);

    // Try to find the best category match
    for (const term of searchTerms) {
      // Direct category match
      if (this.genericDensities.has(term)) {
        return this.genericDensities.get(term)!;
      }

      // Partial matches
      for (const [key, density] of this.genericDensities.entries()) {
        if (key.includes(term) || term.includes(key.split('_')[0])) {
          return density;
        }
      }
    }

    return null;
  }

  /**
   * Add or update a USDA-specific density entry
   */
  addUSDADensity(fdcId: string, density: Omit<FoodDensityEntry, 'fdcId' | 'source'>): void {
    this.usdaDensities.set(fdcId, {
      ...density,
      fdcId,
      source: 'usda'
    });
  }

  /**
   * Get conversion confidence for a specific food and unit combination
   */
  getConversionConfidence(unit: string, foodId?: string, category?: string): number {
    if (this.isWeightUnit(unit)) return 1.0;

    if (foodId && this.usdaDensities.has(foodId)) {
      return this.usdaDensities.get(foodId)!.confidence;
    }

    const densityEntry = this.findBestDensityMatch('', category);
    return densityEntry ? densityEntry.confidence * 0.8 : 0.4;
  }

  /**
   * Get all supported units
   */
  getSupportedUnits(): string[] {
    return [
      // Weight units
      'g', 'grams', 'kg', 'kilograms', 'oz', 'ounces', 'lb', 'pounds',
      // Volume units
      'cup', 'cups', 'tbsp', 'tablespoons', 'tsp', 'teaspoons',
      'ml', 'milliliters', 'l', 'liters', 'fl oz', 'fluid ounces',
      // Count units
      'piece', 'pieces', 'slice', 'slices', 'serving', 'servings', 'item', 'items'
    ];
  }
}

// Export singleton instance
export const foodDensityManager = new FoodDensityManager();