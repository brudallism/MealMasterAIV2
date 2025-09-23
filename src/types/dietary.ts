// src/types/dietary.ts
export type DietType =
  | "vegan" | "vegetarian" | "pescatarian"
  | "ketogenic" | "paleo" | "primal"
  | "low-fodmap" | "whole30" | "none";

export type Intolerance =
  | "dairy" | "egg" | "gluten" | "grain" | "peanut" | "seafood"
  | "sesame" | "shellfish" | "soy" | "sulfite" | "tree nut" | "wheat";

export interface DietaryPreferences {
  version: 1;
  diet: DietType;
  allergies: Intolerance[]; // strict
  excludeIngredients: string[]; // soft
  includeIngredients: string[]; // optional likes
  cuisines: { include: string[]; exclude: string[] };
  calorieWindow?: { min?: number; max?: number };
  presets: { glutenFree: boolean; lowFodmapStrict: boolean };
  dietImpliedExclusions: string[]; // auto-managed, user-editable
  updatedAt: string; // ISO
}