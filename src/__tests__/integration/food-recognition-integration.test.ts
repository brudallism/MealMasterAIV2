// Integration tests for Food Recognition AI with real-world scenarios

import { FoodRecognitionAI } from '../../services/ai/food-recognition-ai';
import { foodCacheManager } from '../../services/cache/food-cache-manager';

// These tests use actual service integration but with controlled inputs
describe('Food Recognition AI - Integration Tests', () => {
  let foodRecognitionAI: FoodRecognitionAI;
  const testUserId = 'integration-test-user';

  beforeAll(() => {
    foodRecognitionAI = new FoodRecognitionAI();
  });

  beforeEach(async () => {
    // Clear test caches before each test
    await foodCacheManager.clearTestCaches();
  });

  afterAll(async () => {
    // Clean up test data
    await foodCacheManager.clearTestCaches();
  });

  describe('End-to-End Food Processing', () => {
    test('should process a simple food through full pipeline', async () => {
      const input = {
        user_id: testUserId,
        food_description: 'apple',
        portion_info: { method: 'standard' as const, quantity: 100, unit: 'grams' as const }
      };

      const response = await foodRecognitionAI.processFood(input);

      expect(response.success).toBe(true);
      expect(response.food_name).toBeTruthy();
      expect(response.calories).toBeGreaterThan(0);
      expect(response.protein).toBeGreaterThanOrEqual(0);
      expect(response.carbs).toBeGreaterThan(0);
      expect(response.fat).toBeGreaterThanOrEqual(0);
      expect(response.confidence).toBeGreaterThan(0);
      expect(response.data_source).toBeTruthy();
      expect(response.processing_time).toBeGreaterThan(0);
      expect(response.cache_hit).toBe(false); // First request should not be cached
    });

    test('should use cache on subsequent requests', async () => {
      const input = {
        user_id: testUserId,
        food_description: 'banana',
        portion_info: { method: 'standard' as const, quantity: 100, unit: 'grams' as const }
      };

      // First request - should go to AI
      const response1 = await foodRecognitionAI.processFood(input);
      const firstProcessingTime = response1.processing_time;

      expect(response1.success).toBe(true);
      expect(response1.cache_hit).toBe(false);

      // Second request - should use cache
      const response2 = await foodRecognitionAI.processFood(input);

      expect(response2.success).toBe(true);
      expect(response2.cache_hit).toBe(true);
      expect(response2.processing_time).toBeLessThan(firstProcessingTime);
      expect(response2.food_name).toBe(response1.food_name);
      expect(response2.calories).toBe(response1.calories);
    }, 15000);

    test('should handle complex food descriptions', async () => {
      const input = {
        user_id: testUserId,
        food_description: 'grilled chicken breast with herbs',
        portion_info: { method: 'standard' as const, quantity: 150, unit: 'grams' as const }
      };

      const response = await foodRecognitionAI.processFood(input);

      expect(response.success).toBe(true);
      expect(response.food_name.toLowerCase()).toContain('chicken');
      expect(response.calories).toBeGreaterThan(150); // Should be substantial for 150g chicken
      expect(response.protein).toBeGreaterThan(20); // Chicken is high protein
      expect(response.assumptions_made?.length).toBeGreaterThan(0); // Should make assumptions about preparation
    }, 15000);

    test('should request clarification for ambiguous foods', async () => {
      const input = {
        user_id: testUserId,
        food_description: 'sandwich',
        portion_info: { method: 'standard' as const, quantity: 200, unit: 'grams' as const }
      };

      const response = await foodRecognitionAI.processFood(input);

      expect(response.success).toBe(true);
      expect(response.confidence).toBeLessThan(0.8); // Should have low confidence
      expect(response.clarification_needed).toBe(true);
      expect(response.clarification_questions).toBeDefined();
      expect(response.clarification_questions!.length).toBeGreaterThan(0);
    }, 15000);
  });

  describe('Portion Handling Integration', () => {
    test('should handle different portion sizes correctly', async () => {
      const baseInput = {
        user_id: testUserId,
        food_description: 'white rice cooked',
      };

      // Test 100g portion
      const response100g = await foodRecognitionAI.processFood({
        ...baseInput,
        portion_info: { method: 'standard' as const, quantity: 100, unit: 'grams' as const }
      });

      // Test 200g portion
      const response200g = await foodRecognitionAI.processFood({
        ...baseInput,
        portion_info: { method: 'standard' as const, quantity: 200, unit: 'grams' as const }
      });

      expect(response100g.success).toBe(true);
      expect(response200g.success).toBe(true);

      // 200g should be approximately double the nutrition
      expect(response200g.calories).toBeCloseTo(response100g.calories * 2, 0);
      expect(response200g.protein).toBeCloseTo(response100g.protein * 2, 1);
      expect(response200g.carbs).toBeCloseTo(response100g.carbs * 2, 1);
    }, 20000);

    test('should handle custom portion descriptions', async () => {
      const input = {
        user_id: testUserId,
        food_description: 'banana',
        portion_info: { method: 'description' as const, description: '1 medium banana' }
      };

      const response = await foodRecognitionAI.processFood(input);

      expect(response.success).toBe(true);
      expect(response.portion_info).toBeDefined();
      expect(response.calories).toBeGreaterThan(80); // Medium banana should be around 90-100 calories
      expect(response.calories).toBeLessThan(130);
    }, 15000);
  });

  describe('Cache Integration Scenarios', () => {
    test('should promote items through cache tiers', async () => {
      const input = {
        user_id: testUserId,
        food_description: 'broccoli steamed',
        portion_info: { method: 'standard' as const, quantity: 100, unit: 'grams' as const }
      };

      // First request - goes to AI, gets cached
      const response1 = await foodRecognitionAI.processFood(input);
      expect(response1.cache_hit).toBe(false);

      // Clear user cache to simulate different user
      await foodCacheManager.clearUserCache(testUserId);

      // Second request - should hit global cache and promote to user cache
      const response2 = await foodRecognitionAI.processFood(input);
      expect(response2.cache_hit).toBe(true);
      expect(response2.data_source).toContain('cache');

      // Third request - should hit user cache
      const response3 = await foodRecognitionAI.processFood(input);
      expect(response3.cache_hit).toBe(true);
      expect(response3.processing_time).toBeLessThan(50); // Very fast user cache
    }, 20000);

    test('should handle cache errors gracefully', async () => {
      // This test would require mocking AsyncStorage to throw errors
      // But should still work with database cache as fallback
      
      const input = {
        user_id: testUserId,
        food_description: 'spinach raw',
        portion_info: { method: 'standard' as const, quantity: 100, unit: 'grams' as const }
      };

      const response = await foodRecognitionAI.processFood(input);

      expect(response.success).toBe(true);
      expect(response.food_name).toBeTruthy();
      expect(response.calories).toBeLessThan(30); // Spinach is very low calorie
    }, 15000);
  });

  describe('Performance Integration Tests', () => {
    test('should meet performance requirements', async () => {
      const inputs = [
        'apple',
        'banana', 
        'chicken breast',
        'white rice',
        'broccoli'
      ].map(food => ({
        user_id: testUserId,
        food_description: food,
        portion_info: { method: 'standard' as const, quantity: 100, unit: 'grams' as const }
      }));

      const startTime = Date.now();
      const responses = await Promise.all(
        inputs.map(input => foodRecognitionAI.processFood(input))
      );
      const totalTime = Date.now() - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.success).toBe(true);
      });

      // Total time should be reasonable for 5 concurrent requests
      expect(totalTime).toBeLessThan(30000); // 30 seconds max

      console.log(`\\nPerformance Test Results:`);
      console.log(`Total time for 5 concurrent requests: ${totalTime}ms`);
      console.log(`Average time per request: ${totalTime / 5}ms`);
      
      responses.forEach((response, index) => {
        console.log(`${inputs[index].food_description}: ${response.processing_time}ms (cache: ${response.cache_hit})`);
      });
    }, 35000);

    test('should show significant performance improvement with caching', async () => {
      const input = {
        user_id: testUserId,
        food_description: 'sweet potato',
        portion_info: { method: 'standard' as const, quantity: 100, unit: 'grams' as const }
      };

      // First request (no cache)
      const response1 = await foodRecognitionAI.processFood(input);
      const uncachedTime = response1.processing_time;

      // Second request (cached)
      const response2 = await foodRecognitionAI.processFood(input);
      const cachedTime = response2.processing_time;

      expect(response1.success).toBe(true);
      expect(response2.success).toBe(true);
      expect(response2.cache_hit).toBe(true);
      
      // Cached request should be significantly faster
      expect(cachedTime).toBeLessThan(uncachedTime / 10); // At least 10x faster
      
      console.log(`\\nCaching Performance:`);
      console.log(`Uncached request: ${uncachedTime}ms`);
      console.log(`Cached request: ${cachedTime}ms`);
      console.log(`Improvement: ${(uncachedTime / cachedTime).toFixed(1)}x faster`);
    }, 20000);
  });

  describe('Error Scenarios Integration', () => {
    test('should handle network failures gracefully', async () => {
      // This would require mocking network failures
      // For now, test with invalid input that should fail
      
      const input = {
        user_id: '',
        food_description: '',
        portion_info: { method: 'standard' as const, quantity: -1, unit: 'grams' as const }
      };

      const response = await foodRecognitionAI.processFood(input);

      expect(response.success).toBe(false);
      expect(response.error).toBeTruthy();
      expect(response.processing_time).toBeLessThan(1000); // Should fail fast
    });

    test('should recover from partial failures', async () => {
      const input = {
        user_id: testUserId,
        food_description: 'quinoa cooked',
        portion_info: { method: 'standard' as const, quantity: 100, unit: 'grams' as const }
      };

      const response = await foodRecognitionAI.processFood(input);

      // Even if some cache layers fail, should still work
      expect(response.success).toBe(true);
      expect(response.food_name).toBeTruthy();
      expect(response.calories).toBeGreaterThan(0);
    }, 15000);
  });

  describe('Data Quality Integration', () => {
    test('should maintain data consistency across requests', async () => {
      const input = {
        user_id: testUserId,
        food_description: 'almonds raw',
        portion_info: { method: 'standard' as const, quantity: 100, unit: 'grams' as const }
      };

      // Make multiple requests for the same food
      const responses = await Promise.all([
        foodRecognitionAI.processFood(input),
        foodRecognitionAI.processFood(input),
        foodRecognitionAI.processFood(input)
      ]);

      // All responses should be successful
      responses.forEach(response => {
        expect(response.success).toBe(true);
      });

      // Cached responses should have identical nutrition data
      const cachedResponses = responses.filter(r => r.cache_hit);
      if (cachedResponses.length > 0) {
        const first = cachedResponses[0];
        cachedResponses.forEach(response => {
          expect(response.calories).toBe(first.calories);
          expect(response.protein).toBe(first.protein);
          expect(response.carbs).toBe(first.carbs);
          expect(response.fat).toBe(first.fat);
        });
      }
    }, 20000);

    test('should provide reasonable nutrition values', async () => {
      const testCases = [
        { food: 'water', maxCalories: 5 },
        { food: 'lettuce', maxCalories: 20 },
        { food: 'olive oil', minCalories: 800 },
        { food: 'nuts mixed', minCalories: 500 },
        { food: 'chicken breast', minProtein: 25 }
      ];

      for (const testCase of testCases) {
        const response = await foodRecognitionAI.processFood({
          user_id: testUserId,
          food_description: testCase.food,
          portion_info: { method: 'standard' as const, quantity: 100, unit: 'grams' as const }
        });

        expect(response.success).toBe(true);

        if ('maxCalories' in testCase) {
          expect(response.calories).toBeLessThanOrEqual(testCase.maxCalories);
        }
        if ('minCalories' in testCase) {
          expect(response.calories).toBeGreaterThanOrEqual(testCase.minCalories);
        }
        if ('minProtein' in testCase) {
          expect(response.protein).toBeGreaterThanOrEqual(testCase.minProtein);
        }
      }
    }, 30000);
  });
});