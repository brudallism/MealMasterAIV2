// src/data/mock-data.ts
// Centralized mock data system with real USDA food nutrition data
// This file can be easily removed for production by setting ENABLE_MOCK_DATA to false

const ENABLE_MOCK_DATA = true;

// Real USDA food data with accurate nutrition information
export const MOCK_FOODS = {
  // Breakfast foods
  oatmeal: {
    id: 'usda_20033',
    name: 'Oats, rolled, old fashioned',
    per100g: {
      calories: 389,
      protein: 16.9,
      carbs: 66.3,
      fat: 6.9,
      fiber: 10.6,
      micronutrients: {
        1089: 4.7,   // Iron (mg)
        1090: 177,   // Magnesium (mg)
        1092: 429,   // Potassium (mg)
        1095: 3.97,  // Zinc (mg)
        1177: 56,    // Folate (µg)
        1093: 2,     // Sodium (mg) - minimize
        1257: 0,     // Trans fats (g) - minimize
        1235: 0,     // Added sugars (g) - minimize
      }
    }
  },
  banana: {
    id: 'usda_09040',
    name: 'Bananas, raw',
    per100g: {
      calories: 89,
      protein: 1.1,
      carbs: 22.8,
      fat: 0.3,
      fiber: 2.6,
      micronutrients: {
        1089: 0.26,  // Iron (mg)
        1090: 27,    // Magnesium (mg)
        1092: 358,   // Potassium (mg)
        1095: 0.15,  // Zinc (mg)
        1162: 8.7,   // Vitamin C (mg)
        1177: 20,    // Folate (µg)
        1093: 1,     // Sodium (mg) - minimize
        1257: 0,     // Trans fats (g) - minimize
        1235: 0,     // Added sugars (g) - minimize
      }
    }
  },

  // Lunch foods
  chickenBreast: {
    id: 'usda_05062',
    name: 'Chicken, broilers or fryers, breast, meat only, cooked, roasted',
    per100g: {
      calories: 165,
      protein: 31.0,
      carbs: 0,
      fat: 3.6,
      fiber: 0,
      micronutrients: {
        1089: 0.9,   // Iron (mg)
        1090: 29,    // Magnesium (mg)
        1092: 256,   // Potassium (mg)
        1095: 1.0,   // Zinc (mg)
        1178: 0.3,   // Vitamin B-12 (µg)
        1093: 74,    // Sodium (mg) - minimize
        1257: 0.02,  // Trans fats (g) - minimize
        1235: 0,     // Added sugars (g) - minimize
      }
    }
  },
  brownRice: {
    id: 'usda_20037',
    name: 'Rice, brown, long-grain, cooked',
    per100g: {
      calories: 111,
      protein: 2.6,
      carbs: 22.0,
      fat: 0.9,
      fiber: 1.8,
      micronutrients: {
        1089: 0.4,   // Iron (mg)
        1090: 43,    // Magnesium (mg)
        1092: 43,    // Potassium (mg)
        1095: 0.6,   // Zinc (mg)
        1177: 7,     // Folate (µg)
        1093: 5,     // Sodium (mg) - minimize
        1257: 0,     // Trans fats (g) - minimize
        1235: 0,     // Added sugars (g) - minimize
      }
    }
  },
  broccoli: {
    id: 'usda_11090',
    name: 'Broccoli, cooked, boiled, drained, without salt',
    per100g: {
      calories: 35,
      protein: 2.4,
      carbs: 7.2,
      fat: 0.4,
      fiber: 3.3,
      micronutrients: {
        1087: 40,    // Calcium (mg)
        1089: 0.67,  // Iron (mg)
        1090: 21,    // Magnesium (mg)
        1092: 293,   // Potassium (mg)
        1095: 0.45,  // Zinc (mg)
        1106: 77,    // Vitamin A (µg)
        1162: 64.9,  // Vitamin C (mg)
        1177: 168,   // Folate (µg)
        1185: 141.8, // Vitamin K (µg)
        1093: 41,    // Sodium (mg) - minimize
        1257: 0,     // Trans fats (g) - minimize
        1235: 0,     // Added sugars (g) - minimize
      }
    }
  },

  // Dinner foods
  salmon: {
    id: 'usda_15076',
    name: 'Fish, salmon, Atlantic, farmed, cooked, dry heat',
    per100g: {
      calories: 206,
      protein: 22.1,
      carbs: 0,
      fat: 12.4,
      fiber: 0,
      micronutrients: {
        1087: 9,     // Calcium (mg)
        1089: 0.34,  // Iron (mg)
        1090: 30,    // Magnesium (mg)
        1092: 384,   // Potassium (mg)
        1095: 0.64,  // Zinc (mg)
        1106: 13,    // Vitamin A (µg)
        1114: 11.9,  // Vitamin D (µg)
        1178: 2.8,   // Vitamin B-12 (µg)
        1093: 61,    // Sodium (mg) - minimize
        1257: 0.04,  // Trans fats (g) - minimize
        1235: 0,     // Added sugars (g) - minimize
      }
    }
  },
  sweetPotato: {
    id: 'usda_11507',
    name: 'Sweet potato, cooked, baked in skin, without salt',
    per100g: {
      calories: 90,
      protein: 2.0,
      carbs: 20.7,
      fat: 0.2,
      fiber: 3.3,
      micronutrients: {
        1087: 38,    // Calcium (mg)
        1089: 0.69,  // Iron (mg)
        1090: 27,    // Magnesium (mg)
        1092: 475,   // Potassium (mg)
        1095: 0.32,  // Zinc (mg)
        1106: 961,   // Vitamin A (µg)
        1162: 19.6,  // Vitamin C (mg)
        1177: 6,     // Folate (µg)
        1093: 7,     // Sodium (mg) - minimize
        1257: 0,     // Trans fats (g) - minimize
        1235: 0,     // Added sugars (g) - minimize
      }
    }
  },

  // Snack foods
  almonds: {
    id: 'usda_12061',
    name: 'Nuts, almonds',
    per100g: {
      calories: 579,
      protein: 21.2,
      carbs: 21.6,
      fat: 49.9,
      fiber: 12.5,
      micronutrients: {
        1087: 269,   // Calcium (mg)
        1089: 3.71,  // Iron (mg)
        1090: 270,   // Magnesium (mg)
        1092: 733,   // Potassium (mg)
        1095: 3.12,  // Zinc (mg)
        1106: 1,     // Vitamin A (µg)
        1177: 44,    // Folate (µg)
        1093: 1,     // Sodium (mg) - minimize
        1257: 0.02,  // Trans fats (g) - minimize
        1235: 4.35,  // Added sugars (g) - minimize
      }
    }
  },
  greekYogurt: {
    id: 'usda_01256',
    name: 'Yogurt, Greek, plain, nonfat',
    per100g: {
      calories: 59,
      protein: 10.2,
      carbs: 3.6,
      fat: 0.4,
      fiber: 0,
      micronutrients: {
        1087: 110,   // Calcium (mg)
        1089: 0.04,  // Iron (mg)
        1090: 11,    // Magnesium (mg)
        1092: 141,   // Potassium (mg)
        1095: 0.52,  // Zinc (mg)
        1178: 0.75,  // Vitamin B-12 (µg)
        1177: 7,     // Folate (µg)
        1093: 36,    // Sodium (mg) - minimize
        1257: 0.01,  // Trans fats (g) - minimize
        1235: 0,     // Added sugars (g) - minimize
      }
    }
  }
};

// Helper function to get nutrition for a specific gram amount
function calculateNutrition(foodKey: keyof typeof MOCK_FOODS, grams: number) {
  const food = MOCK_FOODS[foodKey];
  const multiplier = grams / 100;

  return {
    calories: Math.round(food.per100g.calories * multiplier),
    protein: Math.round(food.per100g.protein * multiplier * 100) / 100,
    carbs: Math.round(food.per100g.carbs * multiplier * 100) / 100,
    fat: Math.round(food.per100g.fat * multiplier * 100) / 100,
    fiber: Math.round(food.per100g.fiber * multiplier * 100) / 100,
    micronutrients: Object.entries(food.per100g.micronutrients).reduce((acc, [key, value]) => {
      acc[parseInt(key)] = Math.round(value * multiplier * 100) / 100;
      return acc;
    }, {} as Record<number, number>)
  };
}

// Helper function to get date string relative to today
function getRelativeDateString(daysOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper function to get time string for meals
function getMealTime(daysOffset: number, mealType: string): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);

  // Set different times for different meal types
  switch (mealType) {
    case 'breakfast':
      date.setHours(8, 30, 0, 0);
      break;
    case 'lunch':
      date.setHours(12, 45, 0, 0);
      break;
    case 'dinner':
      date.setHours(19, 15, 0, 0);
      break;
    case 'snack':
      date.setHours(15, 30, 0, 0);
      break;
    default:
      date.setHours(12, 0, 0, 0);
  }

  return date.toISOString();
}

// Generate mock meal data for 4 days (day before yesterday, yesterday, today, tomorrow)
export function generateMockMealData() {
  if (!ENABLE_MOCK_DATA) return [];

  const meals = [];

  // Day before yesterday - partial day
  const dayBeforeYesterday = -2;
  const dayBeforeYesterdayDate = getRelativeDateString(dayBeforeYesterday);

  // Breakfast: Oatmeal with banana
  const oatmealNutrition = calculateNutrition('oatmeal', 50);
  const bananaNutrition = calculateNutrition('banana', 120);
  meals.push({
    id: `meal_${Date.now()}_001`,
    food_name: 'Oatmeal with Banana',
    meal_type: 'breakfast' as const,
    calories: oatmealNutrition.calories + bananaNutrition.calories,
    protein: oatmealNutrition.protein + bananaNutrition.protein,
    carbs: oatmealNutrition.carbs + bananaNutrition.carbs,
    fat: oatmealNutrition.fat + bananaNutrition.fat,
    fiber: oatmealNutrition.fiber + bananaNutrition.fiber,
    quantity_grams: 170,
    logged_at: getMealTime(dayBeforeYesterday, 'breakfast'),
    micronutrients: Object.keys({...oatmealNutrition.micronutrients, ...bananaNutrition.micronutrients}).reduce((acc, key) => {
      const numKey = parseInt(key);
      acc[numKey] = (oatmealNutrition.micronutrients[numKey] || 0) + (bananaNutrition.micronutrients[numKey] || 0);
      return acc;
    }, {} as Record<number, number>)
  });

  // Yesterday - complete day
  const yesterday = -1;
  const yesterdayDate = getRelativeDateString(yesterday);

  // Breakfast: Greek yogurt with almonds
  const yogurtNutrition = calculateNutrition('greekYogurt', 150);
  const almondsNutrition = calculateNutrition('almonds', 30);
  meals.push({
    id: `meal_${Date.now()}_002`,
    food_name: 'Greek Yogurt with Almonds',
    meal_type: 'breakfast' as const,
    calories: yogurtNutrition.calories + almondsNutrition.calories,
    protein: yogurtNutrition.protein + almondsNutrition.protein,
    carbs: yogurtNutrition.carbs + almondsNutrition.carbs,
    fat: yogurtNutrition.fat + almondsNutrition.fat,
    fiber: yogurtNutrition.fiber + almondsNutrition.fiber,
    quantity_grams: 180,
    logged_at: getMealTime(yesterday, 'breakfast'),
    micronutrients: Object.keys({...yogurtNutrition.micronutrients, ...almondsNutrition.micronutrients}).reduce((acc, key) => {
      const numKey = parseInt(key);
      acc[numKey] = (yogurtNutrition.micronutrients[numKey] || 0) + (almondsNutrition.micronutrients[numKey] || 0);
      return acc;
    }, {} as Record<number, number>)
  });

  // Lunch: Chicken with brown rice and broccoli
  const chickenNutrition = calculateNutrition('chickenBreast', 150);
  const riceNutrition = calculateNutrition('brownRice', 100);
  const broccoliNutrition = calculateNutrition('broccoli', 80);
  meals.push({
    id: `meal_${Date.now()}_003`,
    food_name: 'Chicken Breast with Brown Rice and Broccoli',
    meal_type: 'lunch' as const,
    calories: chickenNutrition.calories + riceNutrition.calories + broccoliNutrition.calories,
    protein: chickenNutrition.protein + riceNutrition.protein + broccoliNutrition.protein,
    carbs: chickenNutrition.carbs + riceNutrition.carbs + broccoliNutrition.carbs,
    fat: chickenNutrition.fat + riceNutrition.fat + broccoliNutrition.fat,
    fiber: chickenNutrition.fiber + riceNutrition.fiber + broccoliNutrition.fiber,
    quantity_grams: 330,
    logged_at: getMealTime(yesterday, 'lunch'),
    micronutrients: Object.keys({...chickenNutrition.micronutrients, ...riceNutrition.micronutrients, ...broccoliNutrition.micronutrients}).reduce((acc, key) => {
      const numKey = parseInt(key);
      acc[numKey] = (chickenNutrition.micronutrients[numKey] || 0) + (riceNutrition.micronutrients[numKey] || 0) + (broccoliNutrition.micronutrients[numKey] || 0);
      return acc;
    }, {} as Record<number, number>)
  });

  // Dinner: Salmon with sweet potato
  const salmonNutrition = calculateNutrition('salmon', 120);
  const sweetPotatoNutrition = calculateNutrition('sweetPotato', 150);
  meals.push({
    id: `meal_${Date.now()}_004`,
    food_name: 'Salmon with Sweet Potato',
    meal_type: 'dinner' as const,
    calories: salmonNutrition.calories + sweetPotatoNutrition.calories,
    protein: salmonNutrition.protein + sweetPotatoNutrition.protein,
    carbs: salmonNutrition.carbs + sweetPotatoNutrition.carbs,
    fat: salmonNutrition.fat + sweetPotatoNutrition.fat,
    fiber: salmonNutrition.fiber + sweetPotatoNutrition.fiber,
    quantity_grams: 270,
    logged_at: getMealTime(yesterday, 'dinner'),
    micronutrients: Object.keys({...salmonNutrition.micronutrients, ...sweetPotatoNutrition.micronutrients}).reduce((acc, key) => {
      const numKey = parseInt(key);
      acc[numKey] = (salmonNutrition.micronutrients[numKey] || 0) + (sweetPotatoNutrition.micronutrients[numKey] || 0);
      return acc;
    }, {} as Record<number, number>)
  });

  // Today - partial day (morning meals only)
  const today = 0;
  const todayDate = getRelativeDateString(today);

  // Breakfast: Oatmeal with banana (same as day before yesterday)
  const todayOatmealNutrition = calculateNutrition('oatmeal', 60);
  const todayBananaNutrition = calculateNutrition('banana', 100);
  meals.push({
    id: `meal_${Date.now()}_005`,
    food_name: 'Oatmeal with Banana',
    meal_type: 'breakfast' as const,
    calories: todayOatmealNutrition.calories + todayBananaNutrition.calories,
    protein: todayOatmealNutrition.protein + todayBananaNutrition.protein,
    carbs: todayOatmealNutrition.carbs + todayBananaNutrition.carbs,
    fat: todayOatmealNutrition.fat + todayBananaNutrition.fat,
    fiber: todayOatmealNutrition.fiber + todayBananaNutrition.fiber,
    quantity_grams: 160,
    logged_at: getMealTime(today, 'breakfast'),
    micronutrients: Object.keys({...todayOatmealNutrition.micronutrients, ...todayBananaNutrition.micronutrients}).reduce((acc, key) => {
      const numKey = parseInt(key);
      acc[numKey] = (todayOatmealNutrition.micronutrients[numKey] || 0) + (todayBananaNutrition.micronutrients[numKey] || 0);
      return acc;
    }, {} as Record<number, number>)
  });

  // Tomorrow - empty day (for testing)
  // No meals for tomorrow

  return meals;
}

// Generate mock user profile with specified macro goals
export function generateMockUserProfile() {
  if (!ENABLE_MOCK_DATA) return null;

  return {
    name: 'John Doe',
    age: 30,
    weight: 75, // kg
    height: 175, // cm
    goals: {
      daily_calorie_goal: 2400,
      protein_goal: 180,
      carb_goal: 180,
      fat_goal: 85,
      fiber_goal: 65
    }
  };
}

// Function to disable mock data for production
export function disableMockData() {
  // In production, you would set ENABLE_MOCK_DATA to false
  // or simply not import this module
  console.log('Mock data disabled for production build');
}

export { ENABLE_MOCK_DATA };