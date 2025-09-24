// src/services/recipes/conflict-detector.ts

/**
 * Recipe conflict detection system for dietary preferences
 * Works with UnifiedMealItem format to detect dietary violations
 * Based on Diet-Allergies-Spec.md v1 - strict allergies, overridable diet conflicts
 */

import { UnifiedMealItem } from "@/types/unified-meal-item";
import { DietaryPreferences, DietaryCompatibility } from "@/types/dietary";
import {
  DIET_EXCLUDES,
  GLUTEN_FREE_EXCLUDES,
  FODMAP_STRICT_EXCLUDES,
  expandSynonyms,
  normalizeName
} from "@/services/preferences/presets";

export interface ConflictAnalysis {
  isCompatible: boolean;
  violations: {
    allergies: ConflictDetail[]; // Critical - never ignore
    diet: ConflictDetail[]; // Can be overridden with confirmation
    excludes: ConflictDetail[]; // Can be relaxed or overridden
    presets: ConflictDetail[]; // Based on gluten-free/FODMAP settings
  };
  warnings: string[];
  confidence: number; // 0-1 confidence in analysis
  overridable: boolean; // True if conflicts can be overridden (no allergy violations)
}

export interface ConflictDetail {
  ingredient: string;
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: 'ingredient' | 'recipe_title' | 'dietary_flag' | 'nutrition';
}

/**
 * Analyze a recipe/food item for dietary conflicts
 */
export function detectConflicts(
  item: UnifiedMealItem,
  preferences: DietaryPreferences
): ConflictAnalysis {
  const violations = {
    allergies: [] as ConflictDetail[],
    diet: [] as ConflictDetail[],
    excludes: [] as ConflictDetail[],
    presets: [] as ConflictDetail[]
  };

  const warnings: string[] = [];
  let confidence = 0.8; // Base confidence

  // Extract text sources for ingredient analysis
  const textSources = extractTextSources(item);

  // 1. Check allergies/intolerances (STRICT - never override)
  checkAllergyViolations(textSources, preferences, violations.allergies);

  // 2. Check diet violations (can be overridden)
  checkDietViolations(textSources, item, preferences, violations.diet);

  // 3. Check excluded ingredients (can be relaxed)
  checkExcludeViolations(textSources, preferences, violations.excludes);

  // 4. Check preset violations (gluten-free, FODMAP)
  checkPresetViolations(textSources, preferences, violations.presets);

  // 5. Check dietary flags from recipe data
  checkDietaryFlags(item, preferences, violations.diet, warnings);

  // 6. Adjust confidence based on data quality
  confidence = calculateConfidence(item, textSources, confidence);

  const totalViolations = Object.values(violations).flat().length;
  const isCompatible = totalViolations === 0;
  const overridable = violations.allergies.length === 0; // Can override if no allergies

  return {
    isCompatible,
    violations,
    warnings,
    confidence,
    overridable
  };
}

/**
 * Extract all text sources from a unified meal item for analysis
 */
function extractTextSources(item: UnifiedMealItem): {
  title: string;
  description: string;
  ingredients: string[];
  tags: string[];
} {
  const sources = {
    title: item.title?.toLowerCase() || '',
    description: item.description?.toLowerCase() || '',
    ingredients: [] as string[],
    tags: item.metadata?.tags?.map(t => t.toLowerCase()) || []
  };

  // Extract ingredients from description or other sources
  // This is a simplified approach - in production, you'd want more sophisticated parsing
  if (item.ingredients) {
    sources.ingredients = item.ingredients.split(',').map(ing => ing.trim().toLowerCase());
  }

  // Also check description for ingredients
  if (sources.description) {
    // Simple ingredient detection in description
    const commonIngredients = ['chicken', 'beef', 'pork', 'fish', 'cheese', 'milk', 'egg', 'mushroom', 'onion', 'garlic'];
    commonIngredients.forEach(ingredient => {
      if (sources.description.includes(ingredient)) {
        sources.ingredients.push(ingredient);
      }
    });
  }

  return sources;
}

/**
 * Check for allergy/intolerance violations (STRICT)
 */
function checkAllergyViolations(
  textSources: any,
  preferences: DietaryPreferences,
  violations: ConflictDetail[]
): void {
  preferences.allergies.forEach(allergy => {
    const allergyTerms = getAllergyTerms(allergy);

    allergyTerms.forEach(term => {
      if (textSources.title.includes(term)) {
        violations.push({
          ingredient: term,
          reason: `Contains ${allergy} (allergy)`,
          severity: 'critical',
          source: 'recipe_title'
        });
      }

      if (textSources.description.includes(term)) {
        violations.push({
          ingredient: term,
          reason: `Contains ${allergy} (allergy)`,
          severity: 'critical',
          source: 'ingredient'
        });
      }

      textSources.ingredients.forEach((ingredient: string) => {
        if (ingredient.includes(term)) {
          violations.push({
            ingredient: ingredient,
            reason: `Contains ${allergy} (allergy)`,
            severity: 'critical',
            source: 'ingredient'
          });
        }
      });
    });
  });
}

/**
 * Check for diet-based violations (can be overridden)
 */
function checkDietViolations(
  textSources: any,
  item: UnifiedMealItem,
  preferences: DietaryPreferences,
  violations: ConflictDetail[]
): void {
  if (preferences.diet === 'none') return;

  const dietExcludes = DIET_EXCLUDES[preferences.diet] || [];
  const userExcludes = preferences.dietImpliedExclusions || [];
  const allExcludes = [...dietExcludes, ...userExcludes];

  allExcludes.forEach(exclude => {
    const normalizedExclude = normalizeName(exclude);
    const synonyms = expandSynonyms(normalizedExclude);

    synonyms.forEach(synonym => {
      if (textSources.title.includes(synonym)) {
        violations.push({
          ingredient: synonym,
          reason: `Conflicts with ${preferences.diet} diet`,
          severity: 'medium',
          source: 'recipe_title'
        });
      }

      textSources.ingredients.forEach((ingredient: string) => {
        if (ingredient.includes(synonym)) {
          violations.push({
            ingredient: ingredient,
            reason: `Conflicts with ${preferences.diet} diet`,
            severity: 'medium',
            source: 'ingredient'
          });
        }
      });
    });
  });
}

/**
 * Check for user-excluded ingredient violations (can be relaxed)
 */
function checkExcludeViolations(
  textSources: any,
  preferences: DietaryPreferences,
  violations: ConflictDetail[]
): void {
  preferences.excludeIngredients.forEach(exclude => {
    const normalizedExclude = normalizeName(exclude);
    const synonyms = expandSynonyms(normalizedExclude);
    let foundMatch: { ingredient: string; source: string } | null = null;

    // Check title first
    for (const synonym of synonyms) {
      if (textSources.title.includes(synonym)) {
        foundMatch = { ingredient: synonym, source: 'recipe_title' };
        break;
      }
    }

    // If not found in title, check ingredients
    if (!foundMatch) {
      for (const synonym of synonyms) {
        for (const ingredient of textSources.ingredients) {
          if (ingredient.includes(synonym)) {
            foundMatch = { ingredient: ingredient, source: 'ingredient' };
            break;
          }
        }
        if (foundMatch) break;
      }
    }

    // Add violation if found
    if (foundMatch) {
      violations.push({
        ingredient: foundMatch.ingredient,
        reason: `Contains excluded ingredient: ${exclude}`,
        severity: 'low',
        source: foundMatch.source as any
      });
    }
  });
}

/**
 * Check for preset-based violations (gluten-free, FODMAP)
 */
function checkPresetViolations(
  textSources: any,
  preferences: DietaryPreferences,
  violations: ConflictDetail[]
): void {
  // Check gluten-free preset
  if (preferences.presets.glutenFree) {
    GLUTEN_FREE_EXCLUDES.forEach(exclude => {
      const synonyms = expandSynonyms(exclude);

      synonyms.forEach(synonym => {
        if (textSources.title.includes(synonym) ||
            textSources.ingredients.some((ing: string) => ing.includes(synonym))) {
          violations.push({
            ingredient: synonym,
            reason: `Contains gluten (gluten-free preset enabled)`,
            severity: 'high',
            source: 'ingredient'
          });
        }
      });
    });
  }

  // Check low-FODMAP strict preset
  if (preferences.presets.lowFodmapStrict) {
    FODMAP_STRICT_EXCLUDES.forEach(exclude => {
      const synonyms = expandSynonyms(exclude);

      synonyms.forEach(synonym => {
        if (textSources.title.includes(synonym) ||
            textSources.ingredients.some((ing: string) => ing.includes(synonym))) {
          violations.push({
            ingredient: synonym,
            reason: `High FODMAP ingredient (strict low-FODMAP preset)`,
            severity: 'medium',
            source: 'ingredient'
          });
        }
      });
    });
  }
}

/**
 * Check dietary flags from recipe metadata
 */
function checkDietaryFlags(
  item: UnifiedMealItem,
  preferences: DietaryPreferences,
  violations: ConflictDetail[],
  warnings: string[]
): void {
  const dietary = item.dietary;
  if (!dietary) return;

  // Check vegan conflicts
  if (preferences.diet === 'vegan' && !dietary.isVegan) {
    if (dietary.isVegetarian === false) {
      violations.push({
        ingredient: 'recipe',
        reason: 'Recipe contains animal products (not vegan)',
        severity: 'medium',
        source: 'dietary_flag'
      });
    } else {
      warnings.push('Recipe may contain dairy or eggs (not marked as vegan)');
    }
  }

  // Check vegetarian conflicts
  if (preferences.diet === 'vegetarian' && dietary.isVegetarian === false) {
    violations.push({
      ingredient: 'recipe',
      reason: 'Recipe contains meat or fish',
      severity: 'medium',
      source: 'dietary_flag'
    });
  }

  // Check gluten-free conflicts
  if (preferences.presets.glutenFree && dietary.isGlutenFree === false) {
    violations.push({
      ingredient: 'recipe',
      reason: 'Recipe contains gluten',
      severity: 'high',
      source: 'dietary_flag'
    });
  }

  // Check dairy-free conflicts
  if (preferences.allergies.includes('dairy') && dietary.isDairyFree === false) {
    violations.push({
      ingredient: 'recipe',
      reason: 'Recipe contains dairy (allergy)',
      severity: 'critical',
      source: 'dietary_flag'
    });
  }
}

/**
 * Calculate confidence in conflict analysis
 */
function calculateConfidence(
  item: UnifiedMealItem,
  textSources: any,
  baseConfidence: number
): number {
  let confidence = baseConfidence;

  // Higher confidence if we have detailed ingredient information
  if (textSources.ingredients.length > 0) {
    confidence += 0.1;
  }

  // Higher confidence if we have dietary flags
  if (item.dietary) {
    confidence += 0.1;
  }

  // Lower confidence for generic descriptions
  if (textSources.description.length < 50) {
    confidence -= 0.1;
  }

  // Lower confidence if no detailed data
  if (textSources.ingredients.length === 0 && !item.dietary) {
    confidence -= 0.2;
  }

  return Math.max(0.3, Math.min(1.0, confidence));
}

/**
 * Get allergy-specific terms for detection
 */
function getAllergyTerms(allergy: string): string[] {
  const allergyTermMap: Record<string, string[]> = {
    'dairy': ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'lactose', 'whey', 'casein'],
    'egg': ['egg', 'eggs', 'albumin', 'lecithin'],
    'gluten': ['wheat', 'barley', 'rye', 'gluten', 'flour'],
    'grain': ['wheat', 'rice', 'oats', 'barley', 'rye', 'quinoa', 'corn'],
    'peanut': ['peanut', 'peanuts', 'groundnut'],
    'seafood': ['fish', 'salmon', 'tuna', 'cod', 'crab', 'lobster', 'shrimp'],
    'sesame': ['sesame', 'tahini'],
    'shellfish': ['crab', 'lobster', 'shrimp', 'prawns', 'scallops', 'mussels'],
    'soy': ['soy', 'soya', 'tofu', 'tempeh', 'miso'],
    'sulfite': ['sulfite', 'sulfur dioxide', 'wine'],
    'tree nut': ['almond', 'walnut', 'cashew', 'pecan', 'hazelnut', 'pistachio'],
    'wheat': ['wheat', 'flour', 'bread', 'pasta']
  };

  return allergyTermMap[allergy] || [allergy];
}

/**
 * Generate user-friendly conflict summary
 */
export function generateConflictSummary(analysis: ConflictAnalysis): string {
  const { violations } = analysis;
  const totalViolations = Object.values(violations).flat().length;

  if (totalViolations === 0) {
    return "This recipe appears compatible with your dietary preferences.";
  }

  const parts: string[] = [];

  if (violations.allergies.length > 0) {
    parts.push(`⚠️ ALLERGY ALERT: Contains ${violations.allergies.length} allergen(s)`);
  }

  if (violations.diet.length > 0) {
    parts.push(`🍽️ Diet conflict: ${violations.diet.length} violation(s)`);
  }

  if (violations.excludes.length > 0) {
    parts.push(`🚫 Contains ${violations.excludes.length} excluded ingredient(s)`);
  }

  if (violations.presets.length > 0) {
    parts.push(`⚙️ Preset conflict: ${violations.presets.length} violation(s)`);
  }

  return parts.join(' • ');
}

/**
 * Check if conflicts can be overridden (no allergies)
 */
export function canOverrideConflicts(analysis: ConflictAnalysis): boolean {
  return analysis.violations.allergies.length === 0;
}

/**
 * Get override confirmation message
 */
export function getOverrideMessage(analysis: ConflictAnalysis): string {
  if (!canOverrideConflicts(analysis)) {
    return "This recipe contains allergens and cannot be overridden.";
  }

  const nonAllergyViolations = [
    ...analysis.violations.diet,
    ...analysis.violations.excludes,
    ...analysis.violations.presets
  ];

  if (nonAllergyViolations.length === 0) {
    return "This recipe is compatible with your preferences.";
  }

  return `This recipe conflicts with your dietary preferences but contains no allergens. Would you like to add it anyway? It will be automatically added to your favorites.`;
}