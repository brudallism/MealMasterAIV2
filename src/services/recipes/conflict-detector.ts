// src/services/recipes/conflict-detector.ts
import { Recipe } from '@/types/recipe';
import { DietaryPreferences } from '@/types/dietary';
import { DIET_EXCLUDES } from '@/services/preferences/presets';

export interface RecipeConflicts {
  allergies: string[];
  excludedIngredients: string[];
  dietConflicts: string[];
  hasConflicts: boolean;
  canOverride: boolean; // false if allergies present
}

/**
 * Detects conflicts between a recipe and user's dietary preferences
 */
export function detectRecipeConflicts(
  recipe: Recipe,
  preferences: DietaryPreferences
): RecipeConflicts {
  const conflicts: RecipeConflicts = {
    allergies: [],
    excludedIngredients: [],
    dietConflicts: [],
    hasConflicts: false,
    canOverride: true,
  };

  // Get recipe ingredients (normalized to lowercase)
  const recipeIngredients = recipe.extendedIngredients?.map(ing =>
    ing.name.toLowerCase().trim()
  ) || [];

  // Check for allergy conflicts (these cannot be overridden)
  preferences.allergies.forEach(allergy => {
    const allergyTerms = getAllergyTerms(allergy);
    const foundAllergens = recipeIngredients.filter(ingredient =>
      allergyTerms.some(term => ingredient.includes(term))
    );

    if (foundAllergens.length > 0) {
      conflicts.allergies.push(allergy);
      conflicts.canOverride = false;
    }
  });

  // Check for excluded ingredient conflicts (can be overridden)
  preferences.excludeIngredients.forEach(excluded => {
    const normalizedExcluded = excluded.toLowerCase().trim();
    const foundExclusions = recipeIngredients.filter(ingredient =>
      ingredient.includes(normalizedExcluded) ||
      normalizedExcluded.includes(ingredient)
    );

    if (foundExclusions.length > 0) {
      conflicts.excludedIngredients.push(excluded);
    }
  });

  // Check for diet-specific conflicts
  if (preferences.diet !== 'none') {
    const dietExclusions = DIET_EXCLUDES[preferences.diet] || [];
    dietExclusions.forEach(dietExclusion => {
      const foundDietConflicts = recipeIngredients.filter(ingredient =>
        ingredient.includes(dietExclusion.toLowerCase())
      );

      if (foundDietConflicts.length > 0) {
        conflicts.dietConflicts.push(`${preferences.diet} diet excludes ${dietExclusion}`);
      }
    });
  }

  // Set overall conflict status
  conflicts.hasConflicts =
    conflicts.allergies.length > 0 ||
    conflicts.excludedIngredients.length > 0 ||
    conflicts.dietConflicts.length > 0;

  return conflicts;
}

/**
 * Get all terms that might indicate an allergen in ingredient lists
 */
function getAllergyTerms(allergy: string): string[] {
  const allergyMap: Record<string, string[]> = {
    dairy: ['milk', 'dairy', 'cheese', 'butter', 'cream', 'yogurt', 'whey', 'casein', 'lactose'],
    egg: ['egg', 'eggs', 'albumin', 'mayonnaise'],
    gluten: ['wheat', 'gluten', 'flour', 'bread', 'pasta', 'barley', 'rye', 'oats'],
    grain: ['wheat', 'rice', 'barley', 'oats', 'quinoa', 'corn', 'grain'],
    peanut: ['peanut', 'peanuts', 'groundnut'],
    seafood: ['fish', 'salmon', 'tuna', 'cod', 'seafood', 'shellfish'],
    sesame: ['sesame', 'tahini'],
    shellfish: ['shrimp', 'crab', 'lobster', 'shellfish', 'prawns'],
    soy: ['soy', 'soya', 'tofu', 'tempeh', 'miso', 'edamame'],
    sulfite: ['sulfite', 'sulfur dioxide', 'wine'],
    'tree nut': ['almond', 'walnut', 'cashew', 'pecan', 'hazelnut', 'pistachio', 'macadamia', 'brazil nut'],
    wheat: ['wheat', 'flour', 'bread', 'pasta', 'couscous'],
  };

  return allergyMap[allergy] || [allergy];
}

/**
 * Check if a recipe should show override warning
 */
export function shouldShowOverrideWarning(
  recipe: Recipe,
  preferences: DietaryPreferences
): boolean {
  const conflicts = detectRecipeConflicts(recipe, preferences);
  return conflicts.hasConflicts;
}

/**
 * Generate a user-friendly conflict summary
 */
export function getConflictSummary(conflicts: RecipeConflicts): string {
  const parts: string[] = [];

  if (conflicts.allergies.length > 0) {
    parts.push(`${conflicts.allergies.length} allergy conflict${conflicts.allergies.length > 1 ? 's' : ''}`);
  }

  if (conflicts.excludedIngredients.length > 0) {
    parts.push(`${conflicts.excludedIngredients.length} excluded ingredient${conflicts.excludedIngredients.length > 1 ? 's' : ''}`);
  }

  if (conflicts.dietConflicts.length > 0) {
    parts.push(`${conflicts.dietConflicts.length} diet conflict${conflicts.dietConflicts.length > 1 ? 's' : ''}`);
  }

  if (parts.length === 0) return 'No conflicts';
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;

  return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
}