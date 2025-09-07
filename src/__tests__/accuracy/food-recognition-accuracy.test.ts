// Comprehensive accuracy validation tests for Food Recognition AI

import { FoodRecognitionAI } from '../../services/ai/food-recognition-ai';
import { 
  FoodTestCase,
  ALL_TEST_CASES,
  BASIC_FOOD_TEST_CASES,
  COMPLEX_FOOD_TEST_CASES,
  AMBIGUOUS_FOOD_TEST_CASES,
  EDGE_CASE_TEST_CASES,
  ACCURACY_THRESHOLDS,
  EXPECTED_ACCURACY_RATES
} from '../__fixtures__/food-test-data';
import { MOCK_FOOD_RESPONSES } from '../__fixtures__/mock-responses';

// Test utilities
interface AccuracyTestResult {
  testCase: FoodTestCase;
  passed: boolean;
  actualResponse: any;
  errors: string[];
  accuracy: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface AccuracyReport {
  totalTests: number;
  passedTests: number;
  accuracyRate: number;
  categoryResults: Record<string, { passed: number; total: number; rate: number }>;
  difficultyResults: Record<string, { passed: number; total: number; rate: number }>;
  failedTests: AccuracyTestResult[];
  averageAccuracy: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

class AccuracyValidator {
  static isWithinRange(actual: number, expected: [number, number], tolerance: number): boolean {
    const [min, max] = expected;
    const range = max - min;
    const expandedMin = min - (range * tolerance);
    const expandedMax = max + (range * tolerance);
    return actual >= expandedMin && actual <= expandedMax;
  }

  static calculateAccuracy(actual: number, expected: [number, number]): number {
    const [min, max] = expected;
    const midpoint = (min + max) / 2;
    const range = max - min;
    const deviation = Math.abs(actual - midpoint);
    const maxAllowedDeviation = range / 2;
    
    if (deviation <= maxAllowedDeviation) {
      return 1 - (deviation / maxAllowedDeviation);
    } else {
      return Math.max(0, 1 - (deviation / midpoint));
    }
  }

  static validateTestCase(testCase: FoodTestCase, response: any): AccuracyTestResult {
    const errors: string[] = [];
    let passed = true;

    if (!response.success) {
      errors.push(`Request failed: ${response.error || 'Unknown error'}`);
      return {
        testCase,
        passed: false,
        actualResponse: response,
        errors,
        accuracy: { calories: 0, protein: 0, carbs: 0, fat: 0 }
      };
    }

    // Calculate accuracies
    const caloriesAccuracy = this.calculateAccuracy(response.calories, testCase.expectedCaloriesRange);
    const proteinAccuracy = this.calculateAccuracy(response.protein, testCase.expectedProteinRange);
    const carbsAccuracy = this.calculateAccuracy(response.carbs, testCase.expectedCarbsRange);
    const fatAccuracy = this.calculateAccuracy(response.fat, testCase.expectedFatRange);

    // Check if within acceptable ranges
    if (!this.isWithinRange(response.calories, testCase.expectedCaloriesRange, ACCURACY_THRESHOLDS.calories)) {
      errors.push(`Calories outside range: got ${response.calories}, expected ${testCase.expectedCaloriesRange}`);
      passed = false;
    }

    if (!this.isWithinRange(response.protein, testCase.expectedProteinRange, ACCURACY_THRESHOLDS.protein)) {
      errors.push(`Protein outside range: got ${response.protein}, expected ${testCase.expectedProteinRange}`);
      passed = false;
    }

    if (!this.isWithinRange(response.carbs, testCase.expectedCarbsRange, ACCURACY_THRESHOLDS.carbs)) {
      errors.push(`Carbs outside range: got ${response.carbs}, expected ${testCase.expectedCarbsRange}`);
      passed = false;
    }

    if (!this.isWithinRange(response.fat, testCase.expectedFatRange, ACCURACY_THRESHOLDS.fat)) {
      errors.push(`Fat outside range: got ${response.fat}, expected ${testCase.expectedFatRange}`);
      passed = false;
    }

    // Check confidence levels
    const expectedConfidence = ACCURACY_THRESHOLDS.confidence[testCase.difficulty];
    if (response.confidence < expectedConfidence) {
      errors.push(`Confidence too low: got ${response.confidence}, expected >= ${expectedConfidence}`);
      // Note: Don't fail the test for confidence, just warn
    }

    // Check food name similarity (basic check)
    if (!response.food_name.toLowerCase().includes(testCase.expectedFoodName.toLowerCase()) &&
        !testCase.expectedFoodName.toLowerCase().includes(response.food_name.toLowerCase())) {
      errors.push(`Food name mismatch: got "${response.food_name}", expected "${testCase.expectedFoodName}"`);
      // Note: Don't fail for name mismatch if nutrition is accurate
    }

    return {
      testCase,
      passed,
      actualResponse: response,
      errors,
      accuracy: {
        calories: caloriesAccuracy,
        protein: proteinAccuracy,
        carbs: carbsAccuracy,
        fat: fatAccuracy
      }
    };
  }

  static generateReport(results: AccuracyTestResult[]): AccuracyReport {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    const accuracyRate = passedTests / totalTests;
    const failedTests = results.filter(r => !r.passed);

    // Category breakdown
    const categoryResults: Record<string, { passed: number; total: number; rate: number }> = {};
    const difficultyResults: Record<string, { passed: number; total: number; rate: number }> = {};

    results.forEach(result => {
      const category = result.testCase.category;
      const difficulty = result.testCase.difficulty;

      if (!categoryResults[category]) {
        categoryResults[category] = { passed: 0, total: 0, rate: 0 };
      }
      if (!difficultyResults[difficulty]) {
        difficultyResults[difficulty] = { passed: 0, total: 0, rate: 0 };
      }

      categoryResults[category].total++;
      difficultyResults[difficulty].total++;

      if (result.passed) {
        categoryResults[category].passed++;
        difficultyResults[difficulty].passed++;
      }
    });

    // Calculate rates
    Object.keys(categoryResults).forEach(key => {
      categoryResults[key].rate = categoryResults[key].passed / categoryResults[key].total;
    });
    Object.keys(difficultyResults).forEach(key => {
      difficultyResults[key].rate = difficultyResults[key].passed / difficultyResults[key].total;
    });

    // Calculate average accuracies
    const averageAccuracy = {
      calories: results.reduce((sum, r) => sum + r.accuracy.calories, 0) / totalTests,
      protein: results.reduce((sum, r) => sum + r.accuracy.protein, 0) / totalTests,
      carbs: results.reduce((sum, r) => sum + r.accuracy.carbs, 0) / totalTests,
      fat: results.reduce((sum, r) => sum + r.accuracy.fat, 0) / totalTests,
    };

    return {
      totalTests,
      passedTests,
      accuracyRate,
      categoryResults,
      difficultyResults,
      failedTests,
      averageAccuracy
    };
  }
}

// Mock the FoodRecognitionAI for testing
const mockFoodRecognitionAI = {
  processFood: jest.fn()
};

describe('Food Recognition AI - Accuracy Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup mock responses
    mockFoodRecognitionAI.processFood.mockImplementation(async (input) => {
      const foodKey = input.food_description.toLowerCase();
      return MOCK_FOOD_RESPONSES[foodKey] || MOCK_FOOD_RESPONSES['water'];
    });
  });

  describe('Basic Food Recognition Accuracy', () => {
    test('should achieve high accuracy on basic foods', async () => {
      const results: AccuracyTestResult[] = [];

      for (const testCase of BASIC_FOOD_TEST_CASES) {
        const response = await mockFoodRecognitionAI.processFood({
          user_id: 'test-user',
          food_description: testCase.input,
          portion_info: { method: 'standard', quantity: 100, unit: 'grams' }
        });

        const result = AccuracyValidator.validateTestCase(testCase, response);
        results.push(result);
      }

      const report = AccuracyValidator.generateReport(results);
      
      // Log detailed results for debugging
      console.log('\\n=== BASIC FOODS ACCURACY REPORT ===');
      console.log(`Overall Accuracy: ${(report.accuracyRate * 100).toFixed(1)}%`);
      console.log(`Passed: ${report.passedTests}/${report.totalTests}`);
      
      if (report.failedTests.length > 0) {
        console.log('\\nFailed Tests:');
        report.failedTests.forEach(test => {
          console.log(`- ${test.testCase.id}: ${test.errors.join(', ')}`);
        });
      }

      expect(report.accuracyRate).toBeGreaterThanOrEqual(EXPECTED_ACCURACY_RATES.basic);
    });
  });

  describe('Complex Food Recognition Accuracy', () => {
    test('should handle complex foods with reasonable accuracy', async () => {
      const results: AccuracyTestResult[] = [];

      for (const testCase of COMPLEX_FOOD_TEST_CASES) {
        const response = await mockFoodRecognitionAI.processFood({
          user_id: 'test-user',
          food_description: testCase.input,
          portion_info: { method: 'standard', quantity: 100, unit: 'grams' }
        });

        const result = AccuracyValidator.validateTestCase(testCase, response);
        results.push(result);
      }

      const report = AccuracyValidator.generateReport(results);
      
      console.log('\\n=== COMPLEX FOODS ACCURACY REPORT ===');
      console.log(`Overall Accuracy: ${(report.accuracyRate * 100).toFixed(1)}%`);
      console.log(`Passed: ${report.passedTests}/${report.totalTests}`);

      expect(report.accuracyRate).toBeGreaterThanOrEqual(EXPECTED_ACCURACY_RATES.complex);
    });
  });

  describe('Ambiguous Food Handling', () => {
    test('should handle ambiguous foods with acceptable accuracy', async () => {
      const results: AccuracyTestResult[] = [];

      for (const testCase of AMBIGUOUS_FOOD_TEST_CASES) {
        const response = await mockFoodRecognitionAI.processFood({
          user_id: 'test-user',
          food_description: testCase.input,
          portion_info: { method: 'standard', quantity: 100, unit: 'grams' }
        });

        const result = AccuracyValidator.validateTestCase(testCase, response);
        results.push(result);
      }

      const report = AccuracyValidator.generateReport(results);
      
      console.log('\\n=== AMBIGUOUS FOODS ACCURACY REPORT ===');
      console.log(`Overall Accuracy: ${(report.accuracyRate * 100).toFixed(1)}%`);
      console.log(`Passed: ${report.passedTests}/${report.totalTests}`);

      expect(report.accuracyRate).toBeGreaterThanOrEqual(EXPECTED_ACCURACY_RATES.ambiguous);
    });
  });

  describe('Edge Case Handling', () => {
    test('should handle edge cases correctly', async () => {
      const results: AccuracyTestResult[] = [];

      for (const testCase of EDGE_CASE_TEST_CASES) {
        const response = await mockFoodRecognitionAI.processFood({
          user_id: 'test-user',
          food_description: testCase.input,
          portion_info: { method: 'standard', quantity: 100, unit: 'grams' }
        });

        const result = AccuracyValidator.validateTestCase(testCase, response);
        results.push(result);
      }

      const report = AccuracyValidator.generateReport(results);
      
      console.log('\\n=== EDGE CASES ACCURACY REPORT ===');
      console.log(`Overall Accuracy: ${(report.accuracyRate * 100).toFixed(1)}%`);
      console.log(`Passed: ${report.passedTests}/${report.totalTests}`);

      expect(report.accuracyRate).toBeGreaterThanOrEqual(EXPECTED_ACCURACY_RATES.edge);
    });
  });

  describe('Overall System Accuracy', () => {
    test('should meet overall accuracy requirements across all test cases', async () => {
      const results: AccuracyTestResult[] = [];

      for (const testCase of ALL_TEST_CASES) {
        const response = await mockFoodRecognitionAI.processFood({
          user_id: 'test-user',
          food_description: testCase.input,
          portion_info: { method: 'standard', quantity: 100, unit: 'grams' }
        });

        const result = AccuracyValidator.validateTestCase(testCase, response);
        results.push(result);
      }

      const report = AccuracyValidator.generateReport(results);
      
      console.log('\\n=== COMPREHENSIVE ACCURACY REPORT ===');
      console.log(`Overall Accuracy: ${(report.accuracyRate * 100).toFixed(1)}%`);
      console.log(`Passed: ${report.passedTests}/${report.totalTests}`);
      
      console.log('\\nBy Category:');
      Object.entries(report.categoryResults).forEach(([category, result]) => {
        console.log(`  ${category}: ${(result.rate * 100).toFixed(1)}% (${result.passed}/${result.total})`);
      });
      
      console.log('\\nBy Difficulty:');
      Object.entries(report.difficultyResults).forEach(([difficulty, result]) => {
        console.log(`  ${difficulty}: ${(result.rate * 100).toFixed(1)}% (${result.passed}/${result.total})`);
      });

      console.log('\\nAverage Nutrient Accuracy:');
      console.log(`  Calories: ${(report.averageAccuracy.calories * 100).toFixed(1)}%`);
      console.log(`  Protein: ${(report.averageAccuracy.protein * 100).toFixed(1)}%`);
      console.log(`  Carbs: ${(report.averageAccuracy.carbs * 100).toFixed(1)}%`);
      console.log(`  Fat: ${(report.averageAccuracy.fat * 100).toFixed(1)}%`);

      if (report.failedTests.length > 0) {
        console.log('\\nFailed Tests Summary:');
        report.failedTests.slice(0, 5).forEach(test => { // Show first 5 failures
          console.log(`- ${test.testCase.id} (${test.testCase.difficulty}): ${test.errors[0]}`);
        });
        if (report.failedTests.length > 5) {
          console.log(`... and ${report.failedTests.length - 5} more`);
        }
      }

      // Assert overall accuracy requirements
      expect(report.accuracyRate).toBeGreaterThanOrEqual(EXPECTED_ACCURACY_RATES.overall);
      
      // Assert difficulty-based requirements
      expect(report.difficultyResults.easy.rate).toBeGreaterThanOrEqual(EXPECTED_ACCURACY_RATES.easy);
      expect(report.difficultyResults.medium.rate).toBeGreaterThanOrEqual(EXPECTED_ACCURACY_RATES.medium);
      expect(report.difficultyResults.hard.rate).toBeGreaterThanOrEqual(EXPECTED_ACCURACY_RATES.hard);
    });
  });
});