// src/services/nutrition/spoonacular-nutrient-mapper.ts

/**
 * Maps Spoonacular nutrient names to USDA FDC nutrient IDs
 * This ensures consistent micronutrient display regardless of data source
 */

import { SpoonacularNutrient } from '@/types/recipe';

// Mapping from Spoonacular nutrient names to USDA FDC nutrient IDs
const SPOONACULAR_TO_USDA_MAPPING: Record<string, number> = {
  // Core macros (handled separately but included for completeness)
  'Calories': 208,
  'Fat': 204,
  'Saturated Fat': 606,
  'Carbohydrates': 205,
  'Fiber': 291,
  'Sugar': 269,
  'Protein': 203,

  // Minimize targets
  'Trans Fat': 1257,
  'Sodium': 1093,
  'Added Sugar': 1235,

  // Key minerals (from micronutrients store)
  'Calcium': 1087,
  'Iron': 1089,
  'Magnesium': 1090,
  'Potassium': 1092,
  'Zinc': 1095,

  // Key vitamins (from micronutrients store)
  'Vitamin A': 1106, // RAE
  'Vitamin C': 1162,
  'Vitamin D': 1114,
  'Vitamin B12': 1178,
  'Folate': 1177,
  'Vitamin K': 1185,

  // Additional vitamins
  'Vitamin E': 1109,
  'Thiamin': 1165,
  'Riboflavin': 1166,
  'Niacin': 1167,
  'Vitamin B6': 1175,
  'Pantothenic Acid': 1170,
  'Biotin': 1176,
  'Choline': 1194,

  // Additional minerals
  'Phosphorus': 1091,
  'Iodine': 1100,
  'Manganese': 1101,
  'Selenium': 1103,
  'Copper': 1098,
  'Chromium': 1096,
  'Molybdenum': 1102,

  // Fatty acids
  'Monounsaturated Fat': 645,
  'Polyunsaturated Fat': 646,
  'Omega-3 Fatty Acids': 851,
  'Omega-6 Fatty Acids': 855,

  // Other nutrients
  'Cholesterol': 601,
  'Caffeine': 1057,
  'Alcohol': 221,
};

// Alternative name mappings for Spoonacular variations
const ALTERNATIVE_NAME_MAPPINGS: Record<string, number> = {
  'Vitamin A (RAE)': 1106,
  'Vitamin A, RAE': 1106,
  'Retinol Activity Equivalent': 1106,
  'Vitamin B-12': 1178,
  'Cobalamin': 1178,
  'Folate, total': 1177,
  'Folic Acid': 1177,
  'Vitamin B-6': 1175,
  'Pyridoxine': 1175,
  'Vitamin B-1': 1165,
  'Vitamin B-2': 1166,
  'Vitamin B-3': 1167,
  'Nicotinic Acid': 1167,
  'Vitamin B-5': 1170,
  'Alpha Tocopherol': 1109,
  'Phylloquinone': 1185,
  'Ascorbic Acid': 1162,
  'Cholecalciferol': 1114,
  'Trans Fatty Acids': 1257,
  'Added Sugars': 1235,
};

/**
 * Convert Spoonacular nutrients to USDA FDC ID-based micronutrient map
 */
export function mapSpoonacularNutrients(
  spoonacularNutrients: SpoonacularNutrient[]
): Record<number, number> {
  const micronutrients: Record<number, number> = {};

  for (const nutrient of spoonacularNutrients) {
    const usdaId = findUSDAId(nutrient.name);

    if (usdaId && nutrient.amount > 0) {
      // Convert units if necessary and store
      const normalizedAmount = normalizeNutrientAmount(nutrient, usdaId);
      micronutrients[usdaId] = normalizedAmount;
    }
  }

  return micronutrients;
}

/**
 * Find USDA FDC ID for a Spoonacular nutrient name
 */
function findUSDAId(spoonacularName: string): number | null {
  // Try direct mapping first
  let usdaId = SPOONACULAR_TO_USDA_MAPPING[spoonacularName];

  if (usdaId) {
    return usdaId;
  }

  // Try alternative name mappings
  usdaId = ALTERNATIVE_NAME_MAPPINGS[spoonacularName];

  if (usdaId) {
    return usdaId;
  }

  // Try fuzzy matching for common variations
  const normalizedName = spoonacularName.toLowerCase().trim();

  // Check for partial matches
  for (const [key, value] of Object.entries(SPOONACULAR_TO_USDA_MAPPING)) {
    if (normalizedName.includes(key.toLowerCase()) || key.toLowerCase().includes(normalizedName)) {
      return value;
    }
  }

  // Check alternative mappings with fuzzy matching
  for (const [key, value] of Object.entries(ALTERNATIVE_NAME_MAPPINGS)) {
    if (normalizedName.includes(key.toLowerCase()) || key.toLowerCase().includes(normalizedName)) {
      return value;
    }
  }

  // Log unmapped nutrients for future enhancement
  console.log(`[SpoonacularMapper] Unmapped nutrient: "${spoonacularName}"`);

  return null;
}

/**
 * Normalize nutrient amounts to standard units used by USDA
 */
function normalizeNutrientAmount(nutrient: SpoonacularNutrient, usdaId: number): number {
  let amount = nutrient.amount;
  const unit = nutrient.unit.toLowerCase();

  // Handle unit conversions based on USDA standard units
  switch (usdaId) {
    // Calories (kcal)
    case 208:
      if (unit === 'cal' || unit === 'calories') {
        amount = amount; // Already in kcal
      }
      break;

    // Vitamins typically in µg
    case 1106: // Vitamin A
    case 1114: // Vitamin D
    case 1178: // Vitamin B12
    case 1177: // Folate
    case 1185: // Vitamin K
      if (unit === 'mg') {
        amount = amount * 1000; // Convert mg to µg
      } else if (unit === 'iu') {
        // IU to µg conversion varies by vitamin - use approximations
        if (usdaId === 1114) { // Vitamin D: 1 µg = 40 IU
          amount = amount / 40;
        } else if (usdaId === 1106) { // Vitamin A: 1 µg RAE = 3.33 IU
          amount = amount / 3.33;
        }
      }
      break;

    // Vitamins typically in mg
    case 1162: // Vitamin C
    case 1109: // Vitamin E
    case 1165: // Thiamin
    case 1166: // Riboflavin
    case 1167: // Niacin
    case 1175: // Vitamin B6
    case 1170: // Pantothenic Acid
      if (unit === 'µg' || unit === 'mcg') {
        amount = amount / 1000; // Convert µg to mg
      }
      break;

    // Minerals typically in mg
    case 1087: // Calcium
    case 1089: // Iron
    case 1090: // Magnesium
    case 1092: // Potassium
    case 1093: // Sodium
    case 1095: // Zinc
    case 1091: // Phosphorus
      if (unit === 'g') {
        amount = amount * 1000; // Convert g to mg
      } else if (unit === 'µg' || unit === 'mcg') {
        amount = amount / 1000; // Convert µg to mg
      }
      break;

    // Macros typically in g
    case 203: // Protein
    case 204: // Fat
    case 205: // Carbs
    case 291: // Fiber
    case 269: // Sugar
      if (unit === 'mg') {
        amount = amount / 1000; // Convert mg to g
      }
      break;

    default:
      // Keep original amount for unmapped nutrients
      break;
  }

  return Math.round(amount * 100) / 100; // Round to 2 decimal places
}

/**
 * Get the expected unit for a USDA nutrient ID
 */
export function getExpectedUnit(usdaId: number): string {
  const vitaminsMicrograms = [1106, 1114, 1178, 1177, 1185, 1176]; // Vitamin A, D, B12, Folate, K, Biotin
  const vitaminsMilligrams = [1162, 1109, 1165, 1166, 1167, 1175, 1170]; // C, E, B1, B2, B3, B6, B5
  const mineralsMg = [1087, 1089, 1090, 1092, 1093, 1095, 1091]; // Ca, Fe, Mg, K, Na, Zn, P
  const macrosGrams = [203, 204, 205, 291, 269, 1257]; // Protein, Fat, Carbs, Fiber, Sugar, Trans fat

  if (usdaId === 208) return 'kcal'; // Calories
  if (vitaminsMicrograms.includes(usdaId)) return 'µg';
  if (vitaminsMilligrams.includes(usdaId)) return 'mg';
  if (mineralsMg.includes(usdaId)) return 'mg';
  if (macrosGrams.includes(usdaId)) return 'g';

  return 'unknown';
}

/**
 * Export mapping for debugging and testing
 */
export const NUTRIENT_MAPPINGS = {
  SPOONACULAR_TO_USDA_MAPPING,
  ALTERNATIVE_NAME_MAPPINGS,
};