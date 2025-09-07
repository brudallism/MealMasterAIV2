// Unit tests for Food Recognition AI core functionality

import { FoodRecognitionAI } from '../../services/ai/food-recognition-ai';
import { MOCK_FOOD_RESPONSES, MOCK_ERROR_RESPONSES } from '../__fixtures__/mock-responses';

// Mock dependencies
jest.mock('../../services/cache/food-cache-manager');
jest.mock('../../services/ai/openai-client');
jest.mock('../../services/ai/user-facing-ai');

import { foodCacheManager } from '../../services/cache/food-cache-manager';
import { openAIClient } from '../../services/ai/openai-client';

describe('FoodRecognitionAI Unit Tests', () => {
  let foodRecognitionAI: FoodRecognitionAI;

  beforeEach(() => {
    foodRecognitionAI = new FoodRecognitionAI();
    jest.clearAllMocks();
  });

  describe('Input Validation', () => {
    test('should reject empty food description', async () => {
      const input = {
        user_id: 'test-user',
        food_description: '',
        portion_info: { method: 'standard' as const, quantity: 100, unit: 'grams' as const }
      };

      const response = await foodRecognitionAI.processFood(input);

      expect(response.success).toBe(false);
      expect(response.error).toContain('Food description cannot be empty');
    });

    test('should reject invalid user_id', async () => {
      const input = {
        user_id: '',
        food_description: 'apple',
        portion_info: { method: 'standard' as const, quantity: 100, unit: 'grams' as const }
      };

      const response = await foodRecognitionAI.processFood(input);

      expect(response.success).toBe(false);
      expect(response.error).toContain('User ID is required');
    });

    test('should reject invalid portion quantity', async () => {
      const input = {
        user_id: 'test-user',
        food_description: 'apple',
        portion_info: { method: 'standard' as const, quantity: -1, unit: 'grams' as const }
      };

      const response = await foodRecognitionAI.processFood(input);

      expect(response.success).toBe(false);
      expect(response.error).toContain('Portion quantity must be positive');
    });

    test('should accept valid input', async () => {
      // Mock cache miss and successful GPT response
      (foodCacheManager.getCachedFood as jest.Mock).mockResolvedValue(null);
      (openAIClient.createChatCompletion as jest.Mock).mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(MOCK_FOOD_RESPONSES.apple) } }]
      });

      const input = {
        user_id: 'test-user',
        food_description: 'apple',
        portion_info: { method: 'standard' as const, quantity: 100, unit: 'grams' as const }
      };

      const response = await foodRecognitionAI.processFood(input);

      expect(response.success).toBe(true);
      expect(response.food_name).toBe('apple');
    });
  });

  describe('Cache Integration', () => {
    test('should return cached result when available', async () => {
      const cachedResponse = { ...MOCK_FOOD_RESPONSES.apple, cache_hit: true, processing_time: 25 };
      (foodCacheManager.getCachedFood as jest.Mock).mockResolvedValue(cachedResponse);

      const input = {
        user_id: 'test-user',
        food_description: 'apple',
        portion_info: { method: 'standard' as const, quantity: 100, unit: 'grams' as const }
      };

      const response = await foodRecognitionAI.processFood(input);

      expect(response.cache_hit).toBe(true);
      expect(response.processing_time).toBeLessThan(100);
      expect(openAIClient.createChatCompletion).not.toHaveBeenCalled();
    });

    test('should fall back to GPT when cache miss', async () => {
      (foodCacheManager.getCachedFood as jest.Mock).mockResolvedValue(null);
      (openAIClient.createChatCompletion as jest.Mock).mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(MOCK_FOOD_RESPONSES.banana) } }]
      });
      (foodCacheManager.cacheFood as jest.Mock).mockResolvedValue(true);

      const input = {
        user_id: 'test-user',
        food_description: 'banana',
        portion_info: { method: 'standard' as const, quantity: 100, unit: 'grams' as const }
      };

      const response = await foodRecognitionAI.processFood(input);

      expect(response.cache_hit).toBe(false);
      expect(response.success).toBe(true);
      expect(openAIClient.createChatCompletion).toHaveBeenCalled();
      expect(foodCacheManager.cacheFood).toHaveBeenCalled();
    });
  });

  describe('Confidence Scoring', () => {
    test('should assign high confidence to simple foods', async () => {
      (foodCacheManager.getCachedFood as jest.Mock).mockResolvedValue(null);
      (openAIClient.createChatCompletion as jest.Mock).mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(MOCK_FOOD_RESPONSES.apple) } }]
      });

      const input = {
        user_id: 'test-user',
        food_description: 'apple',
        portion_info: { method: 'standard' as const, quantity: 100, unit: 'grams' as const }
      };

      const response = await foodRecognitionAI.processFood(input);

      expect(response.confidence).toBeGreaterThan(0.9);
    });

    test('should assign lower confidence to complex foods', async () => {
      (foodCacheManager.getCachedFood as jest.Mock).mockResolvedValue(null);
      (openAIClient.createChatCompletion as jest.Mock).mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(MOCK_FOOD_RESPONSES['caesar salad with grilled chicken']) } }]
      });

      const input = {
        user_id: 'test-user',
        food_description: 'caesar salad with grilled chicken',
        portion_info: { method: 'standard' as const, quantity: 100, unit: 'grams' as const }
      };

      const response = await foodRecognitionAI.processFood(input);

      expect(response.confidence).toBeLessThan(0.8);
    });

    test('should flag foods needing clarification', async () => {
      (foodCacheManager.getCachedFood as jest.Mock).mockResolvedValue(null);
      (openAIClient.createChatCompletion as jest.Mock).mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(MOCK_FOOD_RESPONSES['turkey sandwich']) } }]
      });

      const input = {
        user_id: 'test-user',
        food_description: 'turkey sandwich',
        portion_info: { method: 'standard' as const, quantity: 100, unit: 'grams' as const }
      };

      const response = await foodRecognitionAI.processFood(input);

      expect(response.clarification_needed).toBe(true);
      expect(response.clarification_questions).toBeDefined();
      expect(response.clarification_questions!.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle GPT API errors gracefully', async () => {
      (foodCacheManager.getCachedFood as jest.Mock).mockResolvedValue(null);
      (openAIClient.createChatCompletion as jest.Mock).mockRejectedValue(new Error('API Error'));

      const input = {
        user_id: 'test-user',
        food_description: 'apple',
        portion_info: { method: 'standard' as const, quantity: 100, unit: 'grams' as const }
      };

      const response = await foodRecognitionAI.processFood(input);

      expect(response.success).toBe(false);
      expect(response.error).toContain('Failed to process food');
    });

    test('should handle malformed GPT responses', async () => {
      (foodCacheManager.getCachedFood as jest.Mock).mockResolvedValue(null);
      (openAIClient.createChatCompletion as jest.Mock).mockResolvedValue({
        choices: [{ message: { content: 'invalid json' } }]
      });

      const input = {
        user_id: 'test-user',
        food_description: 'apple',
        portion_info: { method: 'standard' as const, quantity: 100, unit: 'grams' as const }
      };

      const response = await foodRecognitionAI.processFood(input);

      expect(response.success).toBe(false);
      expect(response.error).toContain('Invalid response format');
    });

    test('should handle cache errors gracefully', async () => {
      (foodCacheManager.getCachedFood as jest.Mock).mockRejectedValue(new Error('Cache error'));
      (openAIClient.createChatCompletion as jest.Mock).mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(MOCK_FOOD_RESPONSES.apple) } }]
      });

      const input = {
        user_id: 'test-user',
        food_description: 'apple',
        portion_info: { method: 'standard' as const, quantity: 100, unit: 'grams' as const }
      };

      const response = await foodRecognitionAI.processFood(input);

      expect(response.success).toBe(true); // Should still work without cache
      expect(response.cache_hit).toBe(false);
    });
  });

  describe('Portion Scaling', () => {
    test('should correctly scale nutrition for different portions', async () => {
      (foodCacheManager.getCachedFood as jest.Mock).mockResolvedValue(null);
      (openAIClient.createChatCompletion as jest.Mock).mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(MOCK_FOOD_RESPONSES.apple) } }]
      });

      const input = {
        user_id: 'test-user',
        food_description: 'apple',
        portion_info: { method: 'standard' as const, quantity: 200, unit: 'grams' as const }
      };

      const response = await foodRecognitionAI.processFood(input);

      expect(response.success).toBe(true);
      // Should be double the nutrition for 200g vs 100g
      expect(response.calories).toBeCloseTo(MOCK_FOOD_RESPONSES.apple.calories * 2, 1);
      expect(response.protein).toBeCloseTo(MOCK_FOOD_RESPONSES.apple.protein * 2, 1);
    });

    test('should handle custom portion descriptions', async () => {
      (foodCacheManager.getCachedFood as jest.Mock).mockResolvedValue(null);
      (openAIClient.createChatCompletion as jest.Mock).mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(MOCK_FOOD_RESPONSES.apple) } }]
      });

      const input = {
        user_id: 'test-user',
        food_description: 'apple',
        portion_info: { method: 'description' as const, description: '1 large apple' }
      };

      const response = await foodRecognitionAI.processFood(input);

      expect(response.success).toBe(true);
      expect(response.portion_info).toBeDefined();
    });
  });

  describe('Performance Metrics', () => {
    test('should track processing time', async () => {
      (foodCacheManager.getCachedFood as jest.Mock).mockResolvedValue(null);
      (openAIClient.createChatCompletion as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          choices: [{ message: { content: JSON.stringify(MOCK_FOOD_RESPONSES.apple) } }]
        }), 100))
      );

      const input = {
        user_id: 'test-user',
        food_description: 'apple',
        portion_info: { method: 'standard' as const, quantity: 100, unit: 'grams' as const }
      };

      const response = await foodRecognitionAI.processFood(input);

      expect(response.processing_time).toBeGreaterThan(90); // Should take at least 100ms
      expect(response.processing_time).toBeLessThan(1000); // But not too long
    });

    test('should track data source', async () => {
      (foodCacheManager.getCachedFood as jest.Mock).mockResolvedValue(null);
      (openAIClient.createChatCompletion as jest.Mock).mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(MOCK_FOOD_RESPONSES.apple) } }]
      });

      const input = {
        user_id: 'test-user',
        food_description: 'apple',
        portion_info: { method: 'standard' as const, quantity: 100, unit: 'grams' as const }
      };

      const response = await foodRecognitionAI.processFood(input);

      expect(response.data_source).toBe('gpt_generated');
    });
  });
});