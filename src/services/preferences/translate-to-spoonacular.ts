// src/services/preferences/translate-to-spoonacular.ts
import { DietaryPreferences } from "@/types/dietary";
import { DIET_EXCLUDES, EXCLUDE_SYNONYMS, GLUTEN_FREE_EXCLUDES, FODMAP_STRICT_EXCLUDES } from "./presets";

export interface SpoonacularQuery {
  diet?: string;
  intolerances?: string;
  includeIngredients?: string;
  excludeIngredients?: string;
  cuisine?: string;
  type?: string;
  query?: string;
  maxReadyTime?: number;
  maxIngredients?: number;
  minCalories?: number; maxCalories?: number;
  minProtein?: number; maxProtein?: number;
  minCarbs?: number;   maxCarbs?: number;
  number: number; offset: number; addRecipeInformation: true;
}

const norm = (arr?: string[]) => [...new Set((arr||[]).map(s=>s.trim().toLowerCase()).filter(Boolean))];

export function buildSpoonacularQuery(prefs: DietaryPreferences, opts: {
  query?: string;
  number?: number;
  offset?: number;
  maxReadyTime?: number;
  maxIngredients?: number;
} = {}): SpoonacularQuery {
  const number = opts.number ?? 30, offset = opts.offset ?? 0;
  const diet = prefs.diet !== "none" ? prefs.diet.replace("-", " ") : undefined;
  const intolerances = prefs.allergies.length ? prefs.allergies.join(",") : undefined;

  let excludes = new Set<string>(norm(prefs.excludeIngredients));
  DIET_EXCLUDES[prefs.diet].forEach(e=>excludes.add(e.toLowerCase()));
  if (prefs.presets.glutenFree) GLUTEN_FREE_EXCLUDES.forEach(e=>excludes.add(e));
  if (prefs.presets.lowFodmapStrict) FODMAP_STRICT_EXCLUDES.forEach(e=>excludes.add(e));
  [...excludes].forEach(x => (EXCLUDE_SYNONYMS[x]?.forEach(s=>excludes.add(s))));

  const cuisineInc = norm(prefs.cuisines.include);

  return {
    query: opts.query,
    diet,
    intolerances,
    excludeIngredients: [...excludes].join(",") || undefined,
    includeIngredients: norm(prefs.includeIngredients).join(",") || undefined,
    cuisine: cuisineInc.join(",") || undefined,
    maxReadyTime: opts.maxReadyTime,
    maxIngredients: opts.maxIngredients,
    ...(prefs.calorieWindow?.min ? { minCalories: prefs.calorieWindow.min } : {}),
    ...(prefs.calorieWindow?.max ? { maxCalories: prefs.calorieWindow.max } : {}),
    number, offset, addRecipeInformation: true
  };
}