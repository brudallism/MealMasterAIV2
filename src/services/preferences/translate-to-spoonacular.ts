// src/services/preferences/translate-to-spoonacular.ts

/**
 * Translator service that converts DietaryPreferences to Spoonacular API parameters
 * Based on Diet-Allergies-Spec.md v1 - comprehensive preference translation
 */

import { DietaryPreferences } from "@/types/dietary";
import {
  DIET_EXCLUDES,
  EXCLUDE_SYNONYMS,
  GLUTEN_FREE_EXCLUDES,
  FODMAP_STRICT_EXCLUDES,
  expandSynonyms,
  normalizeName
} from "./presets";

export interface SpoonacularQuery {
  diet?: string;
  intolerances?: string;
  includeIngredients?: string;
  excludeIngredients?: string;
  cuisine?: string;
  type?: string;
  maxReadyTime?: number;
  minCalories?: number;
  maxCalories?: number;
  minProtein?: number;
  maxProtein?: number;
  minCarbs?: number;
  maxCarbs?: number;
  number: number;
  offset: number;
  addRecipeInformation: true;
  addRecipeNutrition?: boolean;
  addRecipeInstructions?: boolean;
}

/**
 * Normalize array values - trim, lowercase, dedupe, filter empty
 */
const norm = (arr?: string[]) => [
  ...new Set((arr || []).map(s => s.trim().toLowerCase()).filter(Boolean))
];

/**
 * Build comprehensive Spoonacular query from dietary preferences
 * Follows the exact logic from the specification
 */
export function buildSpoonacularQuery(
  prefs: DietaryPreferences,
  opts: {
    number?: number;
    offset?: number;
    includeNutrition?: boolean;
    includeInstructions?: boolean;
  } = {}
): SpoonacularQuery {
  const number = opts.number ?? 30;
  const offset = opts.offset ?? 0;

  // 1. Convert diet to Spoonacular format
  const diet = prefs.diet !== "none" ? prefs.diet.replace("-", " ") : undefined;

  // 2. Convert allergies/intolerances to comma-separated string
  const intolerances = prefs.allergies.length ? prefs.allergies.join(",") : undefined;

  // 3. Build comprehensive excludes list
  let excludes = new Set<string>(norm(prefs.excludeIngredients));

  // Add diet-implied exclusions
  const dietExcludes = DIET_EXCLUDES[prefs.diet] || [];
  dietExcludes.forEach(exclude => excludes.add(normalizeName(exclude)));

  // Add user-managed diet exclusions
  prefs.dietImpliedExclusions.forEach(exclude => excludes.add(normalizeName(exclude)));

  // Add preset exclusions
  if (prefs.presets.glutenFree) {
    GLUTEN_FREE_EXCLUDES.forEach(exclude => excludes.add(normalizeName(exclude)));
  }

  if (prefs.presets.lowFodmapStrict) {
    FODMAP_STRICT_EXCLUDES.forEach(exclude => excludes.add(normalizeName(exclude)));
  }

  // Expand synonyms for all excludes
  const expandedExcludes = new Set<string>();
  [...excludes].forEach(exclude => {
    const synonyms = expandSynonyms(exclude);
    synonyms.forEach(synonym => expandedExcludes.add(synonym));
  });

  // 4. Handle includes (optional preferences)
  const includeIngredients = norm(prefs.includeIngredients).join(",") || undefined;

  // 5. Handle cuisines (only include, exclude handled by filtering results)
  const cuisineInc = norm(prefs.cuisines.include);
  const cuisine = cuisineInc.join(",") || undefined;

  // 6. Build base query
  const query: SpoonacularQuery = {
    diet,
    intolerances,
    excludeIngredients: [...expandedExcludes].join(",") || undefined,
    includeIngredients,
    cuisine,
    maxReadyTime: prefs.maxReadyTime || undefined,
    number,
    offset,
    addRecipeInformation: true,
    addRecipeNutrition: opts.includeNutrition ?? true,
    addRecipeInstructions: opts.includeInstructions ?? false
  };

  // 7. Add calorie constraints if specified
  if (prefs.calorieWindow?.min) {
    query.minCalories = prefs.calorieWindow.min;
  }

  if (prefs.calorieWindow?.max) {
    query.maxCalories = prefs.calorieWindow.max;
  }

  return query;
}

/**
 * Build query parameters object for URL construction
 * Filters out undefined/null values and converts to strings
 */
export function buildQueryParams(query: SpoonacularQuery): Record<string, string> {
  const params: Record<string, string> = {};

  Object.entries(query).forEach(([key, value]) => {
    if (value != null && value !== "" && value !== undefined) {
      params[key] = String(value);
    }
  });

  return params;
}

/**
 * Create a normalized cache key for query caching
 * Provides stable, deterministic keys for React Query and local caching
 */
export function createQueryCacheKey(prefs: DietaryPreferences, opts?: any): string {
  // Extract stable parts for cache key
  const keyParts = [
    prefs.diet,
    prefs.allergies.sort().join(","),
    norm(prefs.excludeIngredients).sort().join(","),
    norm(prefs.includeIngredients).sort().join(","),
    norm(prefs.cuisines.include).sort().join(","),
    norm(prefs.cuisines.exclude).sort().join(","),
    prefs.maxReadyTime || "",
    prefs.maxIngredients || "",
    JSON.stringify(prefs.calorieWindow || {}),
    JSON.stringify(prefs.presets),
    opts?.number || 30,
    opts?.offset || 0
  ];

  // Create hash-like key
  return keyParts.filter(Boolean).join("|");
}

/**
 * Validate dietary preferences before translation
 * Returns validation errors that should be fixed before querying
 */
export function validatePreferencesForQuery(prefs: DietaryPreferences): string[] {
  const errors: string[] = [];

  // Check for obviously conflicting settings
  if (prefs.diet === "vegan" && prefs.includeIngredients.some(ing =>
    ["cheese", "milk", "butter", "egg", "meat", "fish"].includes(ing.toLowerCase())
  )) {
    errors.push("Vegan diet conflicts with included animal products");
  }

  if (prefs.diet === "ketogenic" && prefs.calorieWindow?.min && prefs.calorieWindow.min < 1200) {
    errors.push("Ketogenic diet typically requires higher calorie intake");
  }

  // Check for too restrictive settings that may yield no results
  if (prefs.allergies.length > 5) {
    errors.push("Too many allergies may severely limit recipe results");
  }

  if (prefs.excludeIngredients.length > 15) {
    errors.push("Too many excluded ingredients may severely limit recipe results");
  }

  if (prefs.maxReadyTime && prefs.maxReadyTime < 10) {
    errors.push("Very short cooking time may severely limit recipe results");
  }

  return errors;
}

/**
 * Get relaxation suggestions for zero-results scenarios
 * Follows the spec's relaxation order: time → cuisine → excludes → calories → diet
 */
export function getRelaxationSuggestions(prefs: DietaryPreferences): Array<{
  step: string;
  description: string;
  action: string;
  newPrefs: Partial<DietaryPreferences>;
}> {
  const suggestions = [];

  // 1. Time relaxation
  if (prefs.maxReadyTime && prefs.maxReadyTime < 60) {
    suggestions.push({
      step: "time",
      description: "Increase cooking time",
      action: `Allow up to ${prefs.maxReadyTime + 15} minutes`,
      newPrefs: { maxReadyTime: prefs.maxReadyTime + 15 }
    });
  }

  // 2. Cuisine relaxation
  if (prefs.cuisines.include.length > 0) {
    suggestions.push({
      step: "cuisine",
      description: "Expand cuisine options",
      action: "Include all cuisines",
      newPrefs: { cuisines: { include: [], exclude: prefs.cuisines.exclude } }
    });
  }

  // 3. Non-allergy excludes relaxation
  if (prefs.excludeIngredients.length > 0) {
    suggestions.push({
      step: "excludes",
      description: "Temporarily allow some excluded ingredients",
      action: "Allow most common excluded ingredients",
      newPrefs: {
        excludeIngredients: prefs.excludeIngredients.filter(exclude =>
          !["onion", "garlic", "mushrooms", "tomato"].includes(exclude.toLowerCase())
        )
      }
    });
  }

  // 4. Calories relaxation
  if (prefs.calorieWindow?.max) {
    suggestions.push({
      step: "calories",
      description: "Widen calorie range",
      action: `Allow up to ${Math.floor((prefs.calorieWindow.max || 0) * 1.15)} calories`,
      newPrefs: {
        calorieWindow: {
          ...prefs.calorieWindow,
          max: Math.floor((prefs.calorieWindow.max || 0) * 1.15)
        }
      }
    });
  }

  // 5. Diet relaxation (but keep allergies)
  if (prefs.diet !== "none") {
    suggestions.push({
      step: "diet",
      description: "Temporarily ignore diet restrictions",
      action: "Show all recipes (keeping allergies)",
      newPrefs: { diet: "none" as const }
    });
  }

  return suggestions;
}

/**
 * Apply relaxation step to preferences
 */
export function applyRelaxation(
  prefs: DietaryPreferences,
  relaxationStep: string
): DietaryPreferences {
  const suggestions = getRelaxationSuggestions(prefs);
  const suggestion = suggestions.find(s => s.step === relaxationStep);

  if (!suggestion) {
    return prefs;
  }

  return {
    ...prefs,
    ...suggestion.newPrefs,
    updatedAt: new Date().toISOString()
  };
}