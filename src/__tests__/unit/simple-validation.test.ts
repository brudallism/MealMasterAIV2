// Simple validation test to verify test framework setup

import { TestHelpers } from '../__helpers__/test-utils';

describe('Test Framework Validation', () => {
  test('should pass basic assertion', () => {
    expect(1 + 1).toBe(2);
  });

  test('should handle async operations', async () => {
    const result = await TestHelpers.waitFor(100);
    expect(result).toBeUndefined();
  });

  test('should validate test user ID generation', () => {
    const userId1 = TestHelpers.generateTestUserId();
    const userId2 = TestHelpers.generateTestUserId();
    
    expect(userId1).toMatch(/^test-user-\d+-[a-z0-9]+$/);
    expect(userId2).toMatch(/^test-user-\d+-[a-z0-9]+$/);
    expect(userId1).not.toBe(userId2);
  });

  test('should validate nutrition data', () => {
    const validResponse = TestHelpers.createMockResponse({
      calories: 100,
      protein: 5,
      carbs: 20,
      fat: 2
    });

    const errors = TestHelpers.validateNutritionData(validResponse);
    expect(errors).toHaveLength(0);

    const invalidResponse = TestHelpers.createMockResponse({
      calories: -50,
      protein: 150,
      carbs: -10,
      fat: 2
    });

    const invalidErrors = TestHelpers.validateNutritionData(invalidResponse);
    expect(invalidErrors.length).toBeGreaterThan(0);
  });

  test('should calculate percentage differences correctly', () => {
    expect(TestHelpers.isWithinPercentage(100, 100, 10)).toBe(true);
    expect(TestHelpers.isWithinPercentage(95, 100, 10)).toBe(true);
    expect(TestHelpers.isWithinPercentage(105, 100, 10)).toBe(true);
    expect(TestHelpers.isWithinPercentage(85, 100, 10)).toBe(false);
    expect(TestHelpers.isWithinPercentage(115, 100, 10)).toBe(false);
  });

  test('should measure execution time', async () => {
    const { result, time } = await TestHelpers.measureExecutionTime(async () => {
      await TestHelpers.waitFor(100);
      return 'completed';
    });

    expect(result).toBe('completed');
    expect(time).toBeGreaterThan(90);
    expect(time).toBeLessThan(150);
  });

  test('should format nutrition summaries', () => {
    const response = TestHelpers.createMockResponse({
      food_name: 'apple',
      calories: 52,
      protein: 0.3,
      carbs: 14,
      fat: 0.2,
      confidence: 0.95
    });

    const summary = TestHelpers.formatNutritionSummary(response);
    expect(summary).toContain('apple');
    expect(summary).toContain('52cal');
    expect(summary).toContain('0.3g protein');
    expect(summary).toContain('0.95 confidence');
  });

  test('should handle retry operations', async () => {
    let attempts = 0;
    
    const operation = async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Not ready yet');
      }
      return 'success';
    };

    const result = await TestHelpers.retryOperation(operation, 5, 10);
    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });

  test('should validate calorie consistency', () => {
    const consistentResponse = TestHelpers.createMockResponse({
      calories: 100,
      protein: 5,  // 5 * 4 = 20 calories
      carbs: 15,   // 15 * 4 = 60 calories  
      fat: 2       // 2 * 9 = 18 calories
      // Total: 20 + 60 + 18 = 98 calories (within 15% of 100)
    });

    expect(TestHelpers.validateCalorieConsistency(consistentResponse)).toBe(true);

    const inconsistentResponse = TestHelpers.createMockResponse({
      calories: 100,
      protein: 20,  // 20 * 4 = 80 calories
      carbs: 20,    // 20 * 4 = 80 calories  
      fat: 10       // 10 * 9 = 90 calories
      // Total: 250 calories (way more than 100)
    });

    expect(TestHelpers.validateCalorieConsistency(inconsistentResponse)).toBe(false);
  });
});

describe('Mock Data Validation', () => {
  test('should have valid mock food responses structure', () => {
    const mockResponse = TestHelpers.createMockResponse({
      food_name: 'test food',
      success: true
    });

    expect(mockResponse.success).toBe(true);
    expect(mockResponse.food_name).toBe('test food');
    expect(mockResponse.calories).toBeDefined();
    expect(mockResponse.protein).toBeDefined();
    expect(mockResponse.carbs).toBeDefined();
    expect(mockResponse.fat).toBeDefined();
    expect(mockResponse.confidence).toBeDefined();
    expect(mockResponse.data_source).toBeDefined();
    expect(mockResponse.processing_time).toBeDefined();
    expect(mockResponse.cache_hit).toBeDefined();
    expect(mockResponse.accuracy_warnings).toBeDefined();
    expect(mockResponse.assumptions_made).toBeDefined();
  });

  test('should allow override of mock properties', () => {
    const customMock = TestHelpers.createMockResponse({
      calories: 999,
      confidence: 0.42,
      cache_hit: true,
      data_source: 'custom'
    });

    expect(customMock.calories).toBe(999);
    expect(customMock.confidence).toBe(0.42);
    expect(customMock.cache_hit).toBe(true);
    expect(customMock.data_source).toBe('custom');
  });
});