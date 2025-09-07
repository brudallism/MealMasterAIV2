// Test utilities and helpers for Food Recognition AI tests

import { FoodRecognitionResponse } from '../../services/ai/food-recognition-ai';

export interface TestConfig {
  enableRealAPI?: boolean;
  timeout?: number;
  verboseLogging?: boolean;
}

export class TestHelpers {
  static async waitFor(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static generateTestUserId(): string {
    return `test-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  static validateNutritionData(response: FoodRecognitionResponse): string[] {
    const errors: string[] = [];

    if (response.calories < 0) errors.push('Calories cannot be negative');
    if (response.protein < 0) errors.push('Protein cannot be negative');
    if (response.carbs < 0) errors.push('Carbs cannot be negative');
    if (response.fat < 0) errors.push('Fat cannot be negative');
    
    if (response.calories > 1000) errors.push('Calories seem unreasonably high for 100g');
    if (response.protein > 100) errors.push('Protein cannot exceed 100g per 100g food');
    if (response.carbs > 100) errors.push('Carbs cannot exceed 100g per 100g food');
    if (response.fat > 100) errors.push('Fat cannot exceed 100g per 100g food');

    if (response.confidence < 0 || response.confidence > 1) {
      errors.push('Confidence must be between 0 and 1');
    }

    return errors;
  }

  static calculateCaloriesFromMacros(protein: number, carbs: number, fat: number): number {
    return (protein * 4) + (carbs * 4) + (fat * 9);
  }

  static validateCalorieConsistency(response: FoodRecognitionResponse, tolerance = 0.15): boolean {
    const calculatedCalories = this.calculateCaloriesFromMacros(
      response.protein,
      response.carbs,
      response.fat
    );
    
    const difference = Math.abs(response.calories - calculatedCalories);
    const percentDifference = difference / response.calories;
    
    return percentDifference <= tolerance;
  }

  static formatNutritionSummary(response: FoodRecognitionResponse): string {
    return `${response.food_name}: ${response.calories}cal, ${response.protein}g protein, ${response.carbs}g carbs, ${response.fat}g fat (${response.confidence.toFixed(2)} confidence)`;
  }

  static async measureExecutionTime<T>(fn: () => Promise<T>): Promise<{ result: T; time: number }> {
    const start = Date.now();
    const result = await fn();
    const time = Date.now() - start;
    return { result, time };
  }

  static groupTestResults<T extends { testCase: { category: string; difficulty: string } }>(
    results: T[]
  ): {
    byCategory: Record<string, T[]>;
    byDifficulty: Record<string, T[]>;
  } {
    const byCategory: Record<string, T[]> = {};
    const byDifficulty: Record<string, T[]> = {};

    results.forEach(result => {
      const category = result.testCase.category;
      const difficulty = result.testCase.difficulty;

      if (!byCategory[category]) byCategory[category] = [];
      if (!byDifficulty[difficulty]) byDifficulty[difficulty] = [];

      byCategory[category].push(result);
      byDifficulty[difficulty].push(result);
    });

    return { byCategory, byDifficulty };
  }

  static logTestSummary(
    testName: string,
    passed: number,
    total: number,
    averageTime?: number
  ): void {
    const rate = ((passed / total) * 100).toFixed(1);
    const timeStr = averageTime ? ` (avg ${averageTime.toFixed(0)}ms)` : '';
    
    console.log(`\\n${testName}: ${passed}/${total} passed (${rate}%)${timeStr}`);
  }

  static createMockResponse(overrides: Partial<FoodRecognitionResponse>): FoodRecognitionResponse {
    return {
      success: true,
      food_name: 'mock-food',
      calories: 100,
      protein: 5,
      carbs: 20,
      fat: 2,
      fiber: 3,
      sugar: 5,
      sodium: 10,
      confidence: 0.85,
      data_source: 'mock',
      processing_time: 1000,
      cache_hit: false,
      accuracy_warnings: [],
      assumptions_made: [],
      ...overrides
    };
  }

  static isWithinPercentage(actual: number, expected: number, percentage: number): boolean {
    const difference = Math.abs(actual - expected);
    const tolerance = expected * (percentage / 100);
    return difference <= tolerance;
  }

  static roundToDecimals(value: number, decimals: number): number {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  static async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) throw error;
        
        console.log(`Attempt ${attempt} failed, retrying in ${delayMs}ms...`);
        await this.waitFor(delayMs);
      }
    }
    
    throw new Error('Max retries exceeded');
  }
}

export const TEST_CONFIG: TestConfig = {
  enableRealAPI: process.env.TEST_REAL_API === 'true',
  timeout: 15000,
  verboseLogging: process.env.VERBOSE === 'true'
};

// Custom matchers for Jest
export const customMatchers = {
  toBeValidNutritionResponse(response: FoodRecognitionResponse) {
    const errors = TestHelpers.validateNutritionData(response);
    
    return {
      pass: errors.length === 0,
      message: () => errors.length === 0 
        ? `Expected response to be invalid but it was valid`
        : `Expected valid nutrition response but found errors: ${errors.join(', ')}`
    };
  },

  toHaveConsistentCalories(response: FoodRecognitionResponse, tolerance = 0.15) {
    const isConsistent = TestHelpers.validateCalorieConsistency(response, tolerance);
    const calculated = TestHelpers.calculateCaloriesFromMacros(
      response.protein, response.carbs, response.fat
    );
    
    return {
      pass: isConsistent,
      message: () => isConsistent
        ? `Expected calories to be inconsistent but they were consistent`
        : `Expected consistent calories: got ${response.calories}, calculated ${calculated.toFixed(1)} from macros`
    };
  },

  toBeWithinPercentageOf(actual: number, expected: number, percentage: number) {
    const isWithin = TestHelpers.isWithinPercentage(actual, expected, percentage);
    const difference = Math.abs(actual - expected);
    const percentDiff = ((difference / expected) * 100).toFixed(1);
    
    return {
      pass: isWithin,
      message: () => isWithin
        ? `Expected ${actual} to not be within ${percentage}% of ${expected}`
        : `Expected ${actual} to be within ${percentage}% of ${expected} (was ${percentDiff}% off)`
    };
  }
};

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidNutritionResponse(): R;
      toHaveConsistentCalories(tolerance?: number): R;
      toBeWithinPercentageOf(expected: number, percentage: number): R;
    }
  }
}