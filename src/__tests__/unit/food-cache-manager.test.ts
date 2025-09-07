// Unit tests for Food Cache Manager

import { foodCacheManager } from '../../services/cache/food-cache-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../services/database/supabase';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../services/database/supabase');

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('FoodCacheManager Unit Tests', () => {
  const testUserId = 'test-user-123';
  const testFoodKey = 'apple_fresh_100g';
  
  const testFoodData = {
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
    data_source: 'gpt_generated' as const,
    processing_time: 1200,
    cache_hit: false,
    accuracy_warnings: [],
    assumptions_made: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup AsyncStorage mocks
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    mockAsyncStorage.removeItem.mockResolvedValue();
    mockAsyncStorage.getAllKeys.mockResolvedValue([]);
    
    // Setup Supabase mocks
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
    } as any);
  });

  describe('Cache Key Generation', () => {
    test('should generate consistent cache keys', () => {
      const key1 = (foodCacheManager as any).generateCacheKey(testUserId, 'apple');
      const key2 = (foodCacheManager as any).generateCacheKey(testUserId, 'apple');
      
      expect(key1).toBe(key2);
      expect(key1).toContain('apple');
    });

    test('should generate different keys for different inputs', () => {
      const key1 = (foodCacheManager as any).generateCacheKey(testUserId, 'apple');
      const key2 = (foodCacheManager as any).generateCacheKey(testUserId, 'banana');
      
      expect(key1).not.toBe(key2);
    });

    test('should normalize food descriptions', () => {
      const key1 = (foodCacheManager as any).generateCacheKey(testUserId, 'Apple');
      const key2 = (foodCacheManager as any).generateCacheKey(testUserId, 'apple');
      const key3 = (foodCacheManager as any).generateCacheKey(testUserId, 'APPLE');
      
      expect(key1).toBe(key2);
      expect(key2).toBe(key3);
    });
  });

  describe('User Cache (Tier 1)', () => {
    test('should store and retrieve from user cache', async () => {
      const cacheData = JSON.stringify({
        [testFoodKey]: {
          ...testFoodData,
          timestamp: Date.now(),
          access_count: 1
        }
      });
      
      mockAsyncStorage.getItem.mockResolvedValueOnce(cacheData);

      const result = await foodCacheManager.getCachedFood(testUserId, testFoodKey);
      
      expect(result).toBeTruthy();
      expect(result!.food_name).toBe('apple');
      expect(result!.data_source).toBe('user_cache');
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith(`food_cache_user_${testUserId}`);
    });

    test('should handle user cache misses', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);

      const result = await foodCacheManager.getCachedFood(testUserId, testFoodKey);
      
      expect(result).toBeNull();
    });

    test('should update access count on cache hit', async () => {
      const initialData = {
        [testFoodKey]: {
          ...testFoodData,
          timestamp: Date.now(),
          access_count: 1
        }
      };
      
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(initialData));

      await foodCacheManager.getCachedFood(testUserId, testFoodKey);
      
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
      
      // Check that access_count was incremented
      const setItemCall = mockAsyncStorage.setItem.mock.calls[0];
      const updatedData = JSON.parse(setItemCall[1]);
      expect(updatedData[testFoodKey].access_count).toBe(2);
    });
  });

  describe('Global Cache (Tier 2)', () => {
    test('should fall back to global cache when user cache misses', async () => {
      // User cache miss
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);
      
      // Global cache hit
      const globalCacheData = JSON.stringify({
        [testFoodKey]: {
          ...testFoodData,
          timestamp: Date.now(),
          access_count: 5,
          user_count: 3
        }
      });
      mockAsyncStorage.getItem.mockResolvedValueOnce(globalCacheData);

      const result = await foodCacheManager.getCachedFood(testUserId, testFoodKey);
      
      expect(result).toBeTruthy();
      expect(result!.data_source).toBe('global_cache');
      expect(mockAsyncStorage.getItem).toHaveBeenCalledTimes(2);
    });

    test('should promote global cache hits to user cache', async () => {
      // User cache miss
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);
      
      // Global cache hit
      const globalCacheData = JSON.stringify({
        [testFoodKey]: {
          ...testFoodData,
          timestamp: Date.now(),
          access_count: 5,
          user_count: 3
        }
      });
      mockAsyncStorage.getItem.mockResolvedValueOnce(globalCacheData);

      await foodCacheManager.getCachedFood(testUserId, testFoodKey);
      
      // Should set user cache with promoted item
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        `food_cache_user_${testUserId}`,
        expect.stringContaining(testFoodKey)
      );
    });
  });

  describe('Database Cache (Tier 3)', () => {
    test('should fall back to database cache when memory caches miss', async () => {
      // User cache miss
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);
      // Global cache miss
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);
      
      // Database cache hit
      const dbResult = {
        data: [{
          food_key: testFoodKey,
          calories: testFoodData.calories,
          protein: testFoodData.protein,
          carbs: testFoodData.carbs,
          fat: testFoodData.fat,
          fiber: testFoodData.fiber,
          sugar: testFoodData.sugar,
          sodium: testFoodData.sodium,
          data_source: 'gpt_generated',
          confidence: testFoodData.confidence,
          usage_count: 10,
          created_at: new Date().toISOString(),
          last_used: new Date().toISOString()
        }],
        error: null
      };
      
      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(dbResult)
      };
      mockSupabase.from.mockReturnValue(mockFrom as any);

      const result = await foodCacheManager.getCachedFood(testUserId, testFoodKey);
      
      expect(result).toBeTruthy();
      expect(result!.data_source).toBe('database_cache');
      expect(mockSupabase.from).toHaveBeenCalledWith('food_recognition_cache');
    });

    test('should update database usage stats on cache hit', async () => {
      // Memory cache miss, database hit
      mockAsyncStorage.getItem.mockResolvedValue(null);
      
      const dbResult = {
        data: [{ food_key: testFoodKey, calories: 52, protein: 0.3 }],
        error: null
      };
      
      const mockSelect = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), limit: jest.fn().mockResolvedValue(dbResult) };
      const mockUpdate = { update: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ error: null }) };
      
      mockSupabase.from
        .mockReturnValueOnce(mockSelect as any)  // For select query
        .mockReturnValueOnce(mockUpdate as any); // For update query

      await foodCacheManager.getCachedFood(testUserId, testFoodKey);
      
      expect(mockUpdate.update).toHaveBeenCalledWith({
        usage_count: expect.any(Number),
        last_used: expect.any(String)
      });
    });
  });

  describe('Cache Storage', () => {
    test('should store food data in all cache tiers', async () => {
      // Mock successful database insert
      const mockInsert = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ data: [testFoodData], error: null })
      };
      mockSupabase.from.mockReturnValue(mockInsert as any);

      const success = await foodCacheManager.cacheFood(testUserId, testFoodKey, testFoodData);
      
      expect(success).toBe(true);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledTimes(2); // User + Global cache
      expect(mockSupabase.from).toHaveBeenCalledWith('food_recognition_cache');
    });

    test('should handle cache storage errors gracefully', async () => {
      // Mock AsyncStorage error
      mockAsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage full'));
      
      // Should still attempt database storage
      const mockInsert = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ data: [testFoodData], error: null })
      };
      mockSupabase.from.mockReturnValue(mockInsert as any);

      const success = await foodCacheManager.cacheFood(testUserId, testFoodKey, testFoodData);
      
      expect(success).toBe(true); // Should succeed even with AsyncStorage error
    });
  });

  describe('Cache Eviction', () => {
    test('should evict least recently used items when cache is full', async () => {
      // Create a cache at capacity
      const fullCache: any = {};
      for (let i = 0; i < 50; i++) { // User cache limit
        fullCache[`item_${i}`] = {
          ...testFoodData,
          timestamp: Date.now() - (i * 1000), // Older items have smaller timestamps
          access_count: 1
        };
      }
      
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(fullCache));

      await foodCacheManager.cacheFood(testUserId, 'new_item', testFoodData);
      
      // Should have removed oldest item and added new one
      const setItemCall = mockAsyncStorage.setItem.mock.calls.find(call => 
        call[0] === `food_cache_user_${testUserId}`
      );
      expect(setItemCall).toBeTruthy();
      
      const updatedCache = JSON.parse(setItemCall![1]);
      expect(Object.keys(updatedCache)).toHaveLength(50); // Still at capacity
      expect(updatedCache['new_item']).toBeTruthy(); // New item added
      expect(updatedCache['item_49']).toBeFalsy(); // Oldest item removed
    });
  });

  describe('Cache Statistics', () => {
    test('should return accurate cache statistics', async () => {
      const userCache = { item1: { timestamp: Date.now(), access_count: 2 } };
      const globalCache = { item1: {}, item2: {}, item3: {} };
      
      mockAsyncStorage.getItem
        .mockResolvedValueOnce(JSON.stringify(userCache))
        .mockResolvedValueOnce(JSON.stringify(globalCache));
      
      // Mock database stats
      const mockCount = { count: 150, error: null };
      const mockSelect = {
        select: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
      };
      
      mockSupabase.from
        .mockReturnValueOnce({ select: jest.fn().mockReturnValue({ count: jest.fn().mockResolvedValue(mockCount) }) } as any)
        .mockReturnValueOnce({ select: jest.fn().mockResolvedValue({ data: [{ data_source: 'gpt_generated' }] }) } as any);

      const stats = await foodCacheManager.getCacheStats(testUserId);
      
      expect(stats.user_cache.total_items).toBe(1);
      expect(stats.global_cache.total_items).toBe(3);
      expect(stats.database_cache.total_items).toBe(150);
    });
  });

  describe('Error Handling', () => {
    test('should handle AsyncStorage errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const result = await foodCacheManager.getCachedFood(testUserId, testFoodKey);
      
      expect(result).toBeNull(); // Should return null instead of throwing
    });

    test('should handle database errors gracefully', async () => {
      // Memory cache miss
      mockAsyncStorage.getItem.mockResolvedValue(null);
      
      // Database error
      const mockSelect = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: null, error: new Error('DB Error') })
      };
      mockSupabase.from.mockReturnValue(mockSelect as any);

      const result = await foodCacheManager.getCachedFood(testUserId, testFoodKey);
      
      expect(result).toBeNull();
    });
  });
});