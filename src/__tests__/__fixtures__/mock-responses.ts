// Mock responses for testing AI services

import { FoodRecognitionResponse } from '../../services/ai/food-recognition-ai';

export const MOCK_GPT_RESPONSES = {
  apple: {
    choices: [{
      message: {
        content: JSON.stringify({
          food_name: "apple",
          calories: 52,
          protein: 0.3,
          carbs: 14,
          fat: 0.2,
          fiber: 2.4,
          sugar: 10.4,
          sodium: 1
        })
      }
    }]
  },
  banana: {
    choices: [{
      message: {
        content: JSON.stringify({
          food_name: "banana",
          calories: 89,
          protein: 1.1,
          carbs: 23,
          fat: 0.3,
          fiber: 2.6,
          sugar: 12.2,
          sodium: 1
        })
      }
    }]
  },
  chickenBreast: {
    choices: [{
      message: {
        content: JSON.stringify({
          food_name: "chicken breast",
          calories: 165,
          protein: 31,
          carbs: 0,
          fat: 3.6,
          fiber: 0,
          sugar: 0,
          sodium: 74
        })
      }
    }]
  }
};

export const MOCK_FOOD_RESPONSES: Record<string, FoodRecognitionResponse> = {
  'apple': {
    success: true,
    food_name: 'apple',
    calories: 52,
    protein: 0.3,
    carbs: 14,
    fat: 0.2,
    fiber: 2.4,
    sugar: 10.4,
    sodium: 1,
    confidence: 0.95,
    data_source: 'gpt_generated',
    processing_time: 1200,
    cache_hit: false,
    accuracy_warnings: [],
    assumptions_made: []
  },
  'banana': {
    success: true,
    food_name: 'banana',
    calories: 89,
    protein: 1.1,
    carbs: 23,
    fat: 0.3,
    fiber: 2.6,
    sugar: 12.2,
    sodium: 1,
    confidence: 0.93,
    data_source: 'gpt_generated',
    processing_time: 1150,
    cache_hit: false,
    accuracy_warnings: [],
    assumptions_made: []
  },
  'chicken breast': {
    success: true,
    food_name: 'chicken breast',
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    fiber: 0,
    sugar: 0,
    sodium: 74,
    confidence: 0.98,
    data_source: 'gpt_generated',
    processing_time: 1300,
    cache_hit: false,
    accuracy_warnings: [],
    assumptions_made: []
  },
  'white rice cooked': {
    success: true,
    food_name: 'white rice',
    calories: 130,
    protein: 2.7,
    carbs: 28,
    fat: 0.3,
    fiber: 0.4,
    sugar: 0.1,
    sodium: 1,
    confidence: 0.90,
    data_source: 'gpt_generated',
    processing_time: 1100,
    cache_hit: false,
    accuracy_warnings: ['Cooking method may affect nutrition'],
    assumptions_made: ['Assumed plain cooked rice without added ingredients']
  },
  'broccoli steamed': {
    success: true,
    food_name: 'broccoli',
    calories: 28,
    protein: 3,
    carbs: 6,
    fat: 0.4,
    fiber: 2.3,
    sugar: 1.5,
    sodium: 41,
    confidence: 0.92,
    data_source: 'gpt_generated',
    processing_time: 1050,
    cache_hit: false,
    accuracy_warnings: [],
    assumptions_made: ['Steamed preparation method']
  },
  'grilled salmon with lemon': {
    success: true,
    food_name: 'salmon',
    calories: 206,
    protein: 25,
    carbs: 0,
    fat: 11,
    fiber: 0,
    sugar: 0,
    sodium: 53,
    confidence: 0.85,
    data_source: 'gpt_generated',
    processing_time: 1400,
    cache_hit: false,
    accuracy_warnings: ['Preparation method may affect nutrition'],
    assumptions_made: ['Grilled preparation', 'Lemon seasoning adds minimal calories']
  },
  'caesar salad with grilled chicken': {
    success: true,
    food_name: 'caesar salad',
    calories: 220,
    protein: 20,
    carbs: 12,
    fat: 15,
    fiber: 3,
    sugar: 4,
    sodium: 450,
    confidence: 0.70,
    data_source: 'gpt_generated',
    processing_time: 1800,
    cache_hit: false,
    accuracy_warnings: ['Mixed dish with variable ingredients'],
    assumptions_made: [
      'Standard caesar dressing',
      'Romaine lettuce base',
      '4oz grilled chicken breast',
      'Parmesan cheese and croutons included'
    ]
  },
  'turkey sandwich': {
    success: true,
    food_name: 'turkey sandwich',
    calories: 320,
    protein: 18,
    carbs: 32,
    fat: 12,
    fiber: 2,
    sugar: 3,
    sodium: 650,
    confidence: 0.60,
    data_source: 'gpt_generated',
    processing_time: 2000,
    cache_hit: false,
    accuracy_warnings: ['Highly variable dish'],
    assumptions_made: [
      '2 slices whole wheat bread',
      '3oz sliced turkey',
      'Lettuce, tomato',
      '1 tbsp mayo'
    ],
    clarification_needed: true,
    clarification_questions: [
      'What type of bread?',
      'What condiments?',
      'Any cheese or vegetables?'
    ]
  },
  'water': {
    success: true,
    food_name: 'water',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    confidence: 1.0,
    data_source: 'gpt_generated',
    processing_time: 500,
    cache_hit: false,
    accuracy_warnings: [],
    assumptions_made: []
  }
};

export const MOCK_CACHE_RESPONSES = {
  cached_apple: {
    ...MOCK_FOOD_RESPONSES['apple'],
    cache_hit: true,
    processing_time: 25,
    data_source: 'user_cache'
  },
  cached_banana: {
    ...MOCK_FOOD_RESPONSES['banana'],
    cache_hit: true,
    processing_time: 30,
    data_source: 'global_cache'
  }
};

export const MOCK_ERROR_RESPONSES = {
  network_error: {
    success: false,
    error: 'Network request failed',
    food_name: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    confidence: 0,
    data_source: 'error',
    processing_time: 5000,
    cache_hit: false,
    accuracy_warnings: [],
    assumptions_made: []
  },
  invalid_food: {
    success: false,
    error: 'Unable to recognize food item',
    food_name: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    confidence: 0,
    data_source: 'error',
    processing_time: 1500,
    cache_hit: false,
    accuracy_warnings: [],
    assumptions_made: []
  }
};