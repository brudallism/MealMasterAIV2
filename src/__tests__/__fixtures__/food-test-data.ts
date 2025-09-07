// Test data fixtures for food recognition accuracy validation

export interface FoodTestCase {
  id: string;
  input: string;
  expectedFoodName: string;
  expectedCaloriesRange: [number, number]; // [min, max] per 100g
  expectedProteinRange: [number, number];
  expectedCarbsRange: [number, number];
  expectedFatRange: [number, number];
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
}

export const BASIC_FOOD_TEST_CASES: FoodTestCase[] = [
  {
    id: 'basic-001',
    input: 'apple',
    expectedFoodName: 'apple',
    expectedCaloriesRange: [50, 60],
    expectedProteinRange: [0.2, 0.4],
    expectedCarbsRange: [12, 16],
    expectedFatRange: [0.1, 0.3],
    category: 'fruits',
    difficulty: 'easy',
    description: 'Basic fruit - should be highly accurate'
  },
  {
    id: 'basic-002',
    input: 'banana',
    expectedFoodName: 'banana',
    expectedCaloriesRange: [85, 95],
    expectedProteinRange: [1.0, 1.5],
    expectedCarbsRange: [20, 25],
    expectedFatRange: [0.2, 0.4],
    category: 'fruits',
    difficulty: 'easy',
    description: 'Common fruit with consistent nutrition'
  },
  {
    id: 'basic-003',
    input: 'chicken breast',
    expectedFoodName: 'chicken breast',
    expectedCaloriesRange: [160, 180],
    expectedProteinRange: [28, 32],
    expectedCarbsRange: [0, 1],
    expectedFatRange: [3, 5],
    category: 'protein',
    difficulty: 'easy',
    description: 'Lean protein - well-defined nutrition'
  },
  {
    id: 'basic-004',
    input: 'white rice cooked',
    expectedFoodName: 'white rice',
    expectedCaloriesRange: [125, 135],
    expectedProteinRange: [2.5, 3.5],
    expectedCarbsRange: [26, 30],
    expectedFatRange: [0.2, 0.4],
    category: 'grains',
    difficulty: 'easy',
    description: 'Common carbohydrate source'
  },
  {
    id: 'basic-005',
    input: 'broccoli steamed',
    expectedFoodName: 'broccoli',
    expectedCaloriesRange: [25, 35],
    expectedProteinRange: [2.5, 3.5],
    expectedCarbsRange: [5, 8],
    expectedFatRange: [0.3, 0.5],
    category: 'vegetables',
    difficulty: 'easy',
    description: 'Low-calorie vegetable'
  }
];

export const COMPLEX_FOOD_TEST_CASES: FoodTestCase[] = [
  {
    id: 'complex-001',
    input: 'grilled salmon with lemon',
    expectedFoodName: 'salmon',
    expectedCaloriesRange: [180, 220],
    expectedProteinRange: [22, 28],
    expectedCarbsRange: [0, 2],
    expectedFatRange: [10, 15],
    category: 'protein',
    difficulty: 'medium',
    description: 'Prepared fish with modifier - should extract base food'
  },
  {
    id: 'complex-002',
    input: 'caesar salad with grilled chicken',
    expectedFoodName: 'caesar salad',
    expectedCaloriesRange: [180, 250],
    expectedProteinRange: [15, 25],
    expectedCarbsRange: [8, 15],
    expectedFatRange: [12, 20],
    category: 'mixed',
    difficulty: 'hard',
    description: 'Complex dish with multiple components'
  },
  {
    id: 'complex-003',
    input: 'homemade chocolate chip cookies',
    expectedFoodName: 'chocolate chip cookies',
    expectedCaloriesRange: [450, 550],
    expectedProteinRange: [5, 8],
    expectedCarbsRange: [60, 75],
    expectedFatRange: [18, 25],
    category: 'dessert',
    difficulty: 'medium',
    description: 'Baked goods with variable recipes'
  },
  {
    id: 'complex-004',
    input: 'vegetable stir fry with brown rice',
    expectedFoodName: 'vegetable stir fry',
    expectedCaloriesRange: [120, 180],
    expectedProteinRange: [4, 8],
    expectedCarbsRange: [20, 30],
    expectedFatRange: [4, 8],
    category: 'mixed',
    difficulty: 'hard',
    description: 'Multi-ingredient dish with cooking method'
  },
  {
    id: 'complex-005',
    input: 'avocado toast on whole grain bread',
    expectedFoodName: 'avocado toast',
    expectedCaloriesRange: [250, 350],
    expectedProteinRange: [8, 12],
    expectedCarbsRange: [25, 35],
    expectedFatRange: [15, 25],
    category: 'mixed',
    difficulty: 'medium',
    description: 'Modern dish with specific bread type'
  }
];

export const AMBIGUOUS_FOOD_TEST_CASES: FoodTestCase[] = [
  {
    id: 'ambiguous-001',
    input: 'turkey sandwich',
    expectedFoodName: 'turkey sandwich',
    expectedCaloriesRange: [250, 400],
    expectedProteinRange: [15, 25],
    expectedCarbsRange: [25, 40],
    expectedFatRange: [8, 18],
    category: 'mixed',
    difficulty: 'hard',
    description: 'Sandwich without specific details - wide variance expected'
  },
  {
    id: 'ambiguous-002',
    input: 'pasta with sauce',
    expectedFoodName: 'pasta',
    expectedCaloriesRange: [150, 300],
    expectedProteinRange: [5, 12],
    expectedCarbsRange: [25, 45],
    expectedFatRange: [2, 15],
    category: 'mixed',
    difficulty: 'hard',
    description: 'Vague description requiring clarification'
  },
  {
    id: 'ambiguous-003',
    input: 'smoothie',
    expectedFoodName: 'smoothie',
    expectedCaloriesRange: [100, 300],
    expectedProteinRange: [2, 10],
    expectedCarbsRange: [20, 50],
    expectedFatRange: [1, 8],
    category: 'beverages',
    difficulty: 'hard',
    description: 'Generic term with many possible ingredients'
  },
  {
    id: 'ambiguous-004',
    input: 'pizza slice',
    expectedFoodName: 'pizza',
    expectedCaloriesRange: [220, 350],
    expectedProteinRange: [8, 15],
    expectedCarbsRange: [25, 35],
    expectedFatRange: [8, 18],
    category: 'mixed',
    difficulty: 'hard',
    description: 'Highly variable dish depending on toppings'
  },
  {
    id: 'ambiguous-005',
    input: 'homemade soup',
    expectedFoodName: 'soup',
    expectedCaloriesRange: [50, 200],
    expectedProteinRange: [2, 12],
    expectedCarbsRange: [5, 25],
    expectedFatRange: [1, 10],
    category: 'mixed',
    difficulty: 'hard',
    description: 'Very generic description requiring clarification'
  }
];

export const EDGE_CASE_TEST_CASES: FoodTestCase[] = [
  {
    id: 'edge-001',
    input: 'diet coke zero sugar',
    expectedFoodName: 'diet coke',
    expectedCaloriesRange: [0, 2],
    expectedProteinRange: [0, 0.1],
    expectedCarbsRange: [0, 0.5],
    expectedFatRange: [0, 0.1],
    category: 'beverages',
    difficulty: 'medium',
    description: 'Zero-calorie beverage'
  },
  {
    id: 'edge-002',
    input: 'water',
    expectedFoodName: 'water',
    expectedCaloriesRange: [0, 0],
    expectedProteinRange: [0, 0],
    expectedCarbsRange: [0, 0],
    expectedFatRange: [0, 0],
    category: 'beverages',
    difficulty: 'easy',
    description: 'No nutritional value'
  },
  {
    id: 'edge-003',
    input: 'pure coconut oil',
    expectedFoodName: 'coconut oil',
    expectedCaloriesRange: [860, 900],
    expectedProteinRange: [0, 0.1],
    expectedCarbsRange: [0, 0.1],
    expectedFatRange: [95, 100],
    category: 'fats',
    difficulty: 'medium',
    description: 'Pure fat source'
  },
  {
    id: 'edge-004',
    input: 'raw spinach leaves',
    expectedFoodName: 'spinach',
    expectedCaloriesRange: [20, 25],
    expectedProteinRange: [2.5, 3.5],
    expectedCarbsRange: [3, 4],
    expectedFatRange: [0.3, 0.5],
    category: 'vegetables',
    difficulty: 'easy',
    description: 'Very low calorie vegetable'
  },
  {
    id: 'edge-005',
    input: 'almonds roasted unsalted',
    expectedFoodName: 'almonds',
    expectedCaloriesRange: [570, 590],
    expectedProteinRange: [20, 22],
    expectedCarbsRange: [20, 25],
    expectedFatRange: [48, 52],
    category: 'nuts',
    difficulty: 'medium',
    description: 'High-calorie nuts with preparation details'
  }
];

export const ALL_TEST_CASES = [
  ...BASIC_FOOD_TEST_CASES,
  ...COMPLEX_FOOD_TEST_CASES,
  ...AMBIGUOUS_FOOD_TEST_CASES,
  ...EDGE_CASE_TEST_CASES
];

export const ACCURACY_THRESHOLDS = {
  calories: 0.25, // 25% tolerance
  protein: 0.30,  // 30% tolerance
  carbs: 0.30,    // 30% tolerance
  fat: 0.35,      // 35% tolerance
  confidence: {
    easy: 0.85,    // Easy foods should have high confidence
    medium: 0.75,  // Medium difficulty foods
    hard: 0.65     // Hard foods may have lower confidence
  }
};

export const EXPECTED_ACCURACY_RATES = {
  overall: 0.80,     // 80% of all tests should pass
  easy: 0.95,        // 95% of easy tests should pass
  medium: 0.85,      // 85% of medium tests should pass
  hard: 0.70,        // 70% of hard tests should pass
  basic: 0.95,       // 95% of basic foods should pass
  complex: 0.80,     // 80% of complex foods should pass
  ambiguous: 0.65,   // 65% of ambiguous foods should pass
  edge: 0.85         // 85% of edge cases should pass
};