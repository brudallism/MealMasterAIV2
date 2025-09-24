// src/services/preferences/presets.ts

/**
 * Diet exclusions, presets, and synonym mappings for dietary preferences
 * Based on Diet-Allergies-Spec.md v1 - comprehensive ingredient management
 */

export const DIET_EXCLUDES: Record<string, string[]> = {
  "vegan": ["gelatin","whey","casein","lactose","egg","meat","fish","shellfish","honey"],
  "vegetarian": ["gelatin","meat","fish","shellfish"],
  "pescatarian": ["beef","pork","chicken","lamb"],
  "ketogenic": ["sugar","corn syrup","wheat flour","white rice","maple syrup"],
  "paleo": ["legumes","peanuts","beans","grains","wheat","rice","dairy"],
  "primal": ["legumes","peanuts","beans","grains","wheat","rice"],
  "low-fodmap": [], // rely on diet param + optional strict preset
  "whole30": ["added sugar","alcohol","grains","legumes","dairy"],
  "none": []
};

export const GLUTEN_FREE_EXCLUDES = ["barley","rye","farro","spelt"];

export const FODMAP_STRICT_EXCLUDES = [
  "onion","garlic","wheat flour","honey","agave","apples","pears",
  "cauliflower","kidney beans"
];

export const EXCLUDE_SYNONYMS: Record<string, string[]> = {
  "cilantro": ["coriander leaf"],
  "scallion": ["green onion","spring onion"],
  "chickpea": ["garbanzo"],
  "bell pepper": ["capsicum"],
  "zucchini": ["courgette"],
  // Additional common synonyms
  "eggplant": ["aubergine"],
  "shrimp": ["prawns"],
  "lima bean": ["butter bean"],
  "snap pea": ["sugar snap pea"],
  "snow pea": ["mangetout"],
  "corn": ["maize"],
  "sweet potato": ["yam"], // Note: technically different but often confused
  "arugula": ["rocket"],
  "endive": ["chicory"],
  "bok choy": ["pak choi"],
  "chinese cabbage": ["napa cabbage"],
};

export const COMMON_EXCLUDES_20 = [
  "onion","garlic","cilantro","mushrooms","olives","capers",
  "bell pepper","tomato","eggplant","zucchini","celery","cucumber",
  "broccoli","cauliflower","brussels sprouts","spinach","kale",
  "avocado","coconut","blue cheese"
];

// Additional preset configurations
export interface DietPreset {
  name: string;
  displayName: string;
  description: string;
  excludes: string[];
  implications: string[];
}

export const DIET_PRESETS: Record<string, DietPreset> = {
  "vegan": {
    name: "vegan",
    displayName: "Vegan",
    description: "No animal products",
    excludes: DIET_EXCLUDES.vegan,
    implications: ["Automatically excludes all animal-derived ingredients"]
  },
  "vegetarian": {
    name: "vegetarian",
    displayName: "Vegetarian",
    description: "No meat, poultry, or fish",
    excludes: DIET_EXCLUDES.vegetarian,
    implications: ["Allows dairy and eggs"]
  },
  "pescatarian": {
    name: "pescatarian",
    displayName: "Pescatarian",
    description: "No meat or poultry, fish allowed",
    excludes: DIET_EXCLUDES.pescatarian,
    implications: ["Allows fish, dairy, and eggs"]
  },
  "ketogenic": {
    name: "ketogenic",
    displayName: "Ketogenic",
    description: "Very low carb, high fat",
    excludes: DIET_EXCLUDES.ketogenic,
    implications: ["Limits carbohydrates to under 20g per day"]
  },
  "paleo": {
    name: "paleo",
    displayName: "Paleo",
    description: "Whole foods, no processed",
    excludes: DIET_EXCLUDES.paleo,
    implications: ["Excludes grains, legumes, and dairy"]
  },
  "primal": {
    name: "primal",
    displayName: "Primal",
    description: "Similar to paleo with some dairy",
    excludes: DIET_EXCLUDES.primal,
    implications: ["Like paleo but allows some dairy products"]
  },
  "low-fodmap": {
    name: "low-fodmap",
    displayName: "Low FODMAP",
    description: "Reduces fermentable carbs",
    excludes: DIET_EXCLUDES["low-fodmap"],
    implications: ["Helps with digestive sensitivities"]
  },
  "whole30": {
    name: "whole30",
    displayName: "Whole30",
    description: "30-day elimination diet",
    excludes: DIET_EXCLUDES.whole30,
    implications: ["Eliminates sugar, alcohol, grains, legumes, and dairy"]
  },
  "none": {
    name: "none",
    displayName: "No Restrictions",
    description: "No dietary restrictions",
    excludes: [],
    implications: []
  }
};

// Intolerance/Allergy presets
export interface IntolerancePreset {
  name: string;
  displayName: string;
  description: string;
  spoonacularName: string; // For API compatibility
  severity: 'mild' | 'moderate' | 'severe';
}

export const INTOLERANCE_PRESETS: Record<string, IntolerancePreset> = {
  "dairy": {
    name: "dairy",
    displayName: "Dairy",
    description: "Lactose intolerance or dairy allergy",
    spoonacularName: "dairy",
    severity: "severe"
  },
  "egg": {
    name: "egg",
    displayName: "Eggs",
    description: "Egg allergy",
    spoonacularName: "egg",
    severity: "severe"
  },
  "gluten": {
    name: "gluten",
    displayName: "Gluten",
    description: "Gluten intolerance or celiac disease",
    spoonacularName: "gluten",
    severity: "severe"
  },
  "grain": {
    name: "grain",
    displayName: "Grains",
    description: "All grains",
    spoonacularName: "grain",
    severity: "moderate"
  },
  "peanut": {
    name: "peanut",
    displayName: "Peanuts",
    description: "Peanut allergy",
    spoonacularName: "peanut",
    severity: "severe"
  },
  "seafood": {
    name: "seafood",
    displayName: "Seafood",
    description: "Fish and seafood allergy",
    spoonacularName: "seafood",
    severity: "severe"
  },
  "sesame": {
    name: "sesame",
    displayName: "Sesame",
    description: "Sesame allergy",
    spoonacularName: "sesame",
    severity: "severe"
  },
  "shellfish": {
    name: "shellfish",
    displayName: "Shellfish",
    description: "Shellfish allergy",
    spoonacularName: "shellfish",
    severity: "severe"
  },
  "soy": {
    name: "soy",
    displayName: "Soy",
    description: "Soy allergy or intolerance",
    spoonacularName: "soy",
    severity: "moderate"
  },
  "sulfite": {
    name: "sulfite",
    displayName: "Sulfites",
    description: "Sulfite sensitivity",
    spoonacularName: "sulfite",
    severity: "mild"
  },
  "tree nut": {
    name: "tree nut",
    displayName: "Tree Nuts",
    description: "Tree nut allergy",
    spoonacularName: "tree nut",
    severity: "severe"
  },
  "wheat": {
    name: "wheat",
    displayName: "Wheat",
    description: "Wheat allergy (broader than gluten)",
    spoonacularName: "wheat",
    severity: "severe"
  }
};

// Popular cuisine types for filtering
export const POPULAR_CUISINES = [
  "African", "American", "British", "Cajun", "Caribbean", "Chinese",
  "Eastern European", "European", "French", "German", "Greek", "Indian",
  "Irish", "Italian", "Japanese", "Jewish", "Korean", "Latin American",
  "Mediterranean", "Mexican", "Middle Eastern", "Nordic", "Southern",
  "Spanish", "Thai", "Vietnamese"
];

// Utility functions
export function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

export function expandSynonyms(ingredient: string): string[] {
  const normalized = normalizeName(ingredient);
  const synonyms = EXCLUDE_SYNONYMS[normalized] || [];
  return [normalized, ...synonyms.map(normalizeName)];
}

export function getAllExcludesForDiet(dietType: string, includeImplied: boolean = true): string[] {
  const directExcludes = DIET_EXCLUDES[dietType] || [];

  if (!includeImplied) {
    return directExcludes;
  }

  // Expand with synonyms
  const allExcludes = new Set<string>();

  directExcludes.forEach(exclude => {
    const expanded = expandSynonyms(exclude);
    expanded.forEach(item => allExcludes.add(item));
  });

  return Array.from(allExcludes).sort();
}

export function getPresetExcludes(glutenFree: boolean, lowFodmapStrict: boolean): string[] {
  const excludes = new Set<string>();

  if (glutenFree) {
    GLUTEN_FREE_EXCLUDES.forEach(item => {
      const expanded = expandSynonyms(item);
      expanded.forEach(expandedItem => excludes.add(expandedItem));
    });
  }

  if (lowFodmapStrict) {
    FODMAP_STRICT_EXCLUDES.forEach(item => {
      const expanded = expandSynonyms(item);
      expanded.forEach(expandedItem => excludes.add(expandedItem));
    });
  }

  return Array.from(excludes).sort();
}

// Validation helpers
export function isValidDiet(diet: string): boolean {
  return diet in DIET_PRESETS;
}

export function isValidIntolerance(intolerance: string): boolean {
  return intolerance in INTOLERANCE_PRESETS;
}

export function isValidCuisine(cuisine: string): boolean {
  return POPULAR_CUISINES.some(c =>
    c.toLowerCase() === cuisine.toLowerCase()
  );
}