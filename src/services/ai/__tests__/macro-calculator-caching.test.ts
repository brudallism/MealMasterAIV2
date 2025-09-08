// Macro Calculator AI - Caching System Tests
// Performance Optimization with <2s Response Time Validation

import { macroCalculatorAI, CalculationRequest, MealData } from '../macro-calculator-ai';

describe('Macro Calculator AI - Caching System Tests', () => {
  
  const createMockRequest = (
    triggerType: 'meal_logged' | 'goal_changed' | 'progress_query',
    userId: string = 'cache-test-user',
    meals: MealData[] = []
  ): CalculationRequest => ({
    trigger_type: triggerType,
    user_id: userId,
    user_context: {
      daily_goals: {
        daily_calorie_goal: 2000,
        protein_goal: 150,
        carb_goal: 200,
        fat_goal: 70
      },
      todays_meals: meals
    }
  });

  const createMockMeal = (id: string, calories: number = 300): MealData => ({
    id,
    calories,
    protein: 25,
    carbs: 30,
    fat: 10,
    fiber: 5,
    logged_at: new Date(),
    confidence: 0.9
  });

  beforeEach(() => {
    // Clear cache and performance logs before each test
    (macroCalculatorAI as any).cache.clear();
    (macroCalculatorAI as any).performanceLogs = [];
    (macroCalculatorAI as any).conversationWindows.clear();
  });

  describe('Cache Key Generation', () => {
    
    it('should generate consistent cache keys for identical requests', () => {
      const request1 = createMockRequest('progress_query', 'user123', [createMockMeal('meal1')]);
      const request2 = createMockRequest('progress_query', 'user123', [createMockMeal('meal1')]);
      
      const key1 = (macroCalculatorAI as any).generateCacheKey(request1);
      const key2 = (macroCalculatorAI as any).generateCacheKey(request2);
      
      expect(key1).toBe(key2);
      expect(key1).toContain('progress_query');
      expect(key1).toContain('user123');
    });
    
    it('should generate different cache keys for different users', () => {
      const request1 = createMockRequest('progress_query', 'user1');
      const request2 = createMockRequest('progress_query', 'user2');
      
      const key1 = (macroCalculatorAI as any).generateCacheKey(request1);
      const key2 = (macroCalculatorAI as any).generateCacheKey(request2);
      
      expect(key1).not.toBe(key2);
    });
    
    it('should generate different cache keys for different trigger types', () => {
      const request1 = createMockRequest('progress_query', 'user1');
      const request2 = createMockRequest('meal_logged', 'user1');
      
      const key1 = (macroCalculatorAI as any).generateCacheKey(request1);
      const key2 = (macroCalculatorAI as any).generateCacheKey(request2);
      
      expect(key1).not.toBe(key2);
    });
    
    it('should generate order-independent hash for meals', () => {
      const meal1 = createMockMeal('meal1', 300);
      const meal2 = createMockMeal('meal2', 400);
      
      const request1 = createMockRequest('progress_query', 'user1', [meal1, meal2]);
      const request2 = createMockRequest('progress_query', 'user1', [meal2, meal1]); // Different order
      
      const key1 = (macroCalculatorAI as any).generateCacheKey(request1);
      const key2 = (macroCalculatorAI as any).generateCacheKey(request2);
      
      expect(key1).toBe(key2); // Should be identical despite meal order difference
    });
  });

  describe('Cache Hit/Miss Behavior', () => {
    
    it('should return cached result on second identical request', async () => {
      const request = createMockRequest('progress_query', 'cache-user', [createMockMeal('meal1')]);
      
      // First request - should compute and cache
      const response1 = await macroCalculatorAI.processCalculationRequest(request);
      expect(response1.system_metadata.cache_status).toBe('computed');
      
      // Second identical request - should hit cache
      const response2 = await macroCalculatorAI.processCalculationRequest(request);
      expect(response2.system_metadata.cache_status).toBe('cache_hit');
      expect(response2.system_metadata.calculation_time_ms).toBe(0); // Instant from cache
      
      // Results should be identical
      expect(response2.calculation_results.daily_totals).toEqual(response1.calculation_results.daily_totals);
      expect(response2.calculation_results.goal_progress).toEqual(response1.calculation_results.goal_progress);
    });
    
    it('should miss cache for different requests', async () => {
      const request1 = createMockRequest('progress_query', 'user1', [createMockMeal('meal1')]);
      const request2 = createMockRequest('progress_query', 'user1', [createMockMeal('meal2')]); // Different meal
      
      await macroCalculatorAI.processCalculationRequest(request1);
      const response2 = await macroCalculatorAI.processCalculationRequest(request2);
      
      expect(response2.system_metadata.cache_status).toBe('computed'); // Cache miss
    });
  });

  describe('Cache TTL and Expiration', () => {
    
    it('should respect different TTL values for different request types', async () => {
      const mealLoggedRequest = createMockRequest('meal_logged', 'ttl-user');
      const goalChangedRequest = createMockRequest('goal_changed', 'ttl-user');
      const progressQueryRequest = createMockRequest('progress_query', 'ttl-user');
      
      await macroCalculatorAI.processCalculationRequest(mealLoggedRequest);
      await macroCalculatorAI.processCalculationRequest(goalChangedRequest);
      await macroCalculatorAI.processCalculationRequest(progressQueryRequest);
      
      const cache = (macroCalculatorAI as any).cache as Map<string, any>;
      const entries = Array.from(cache.values());
      
      // Find entries by inspecting cache keys or data
      const mealLoggedEntry = entries.find((entry: any) => entry.key.includes('meal_logged'));
      const goalChangedEntry = entries.find((entry: any) => entry.key.includes('goal_changed'));
      const progressQueryEntry = entries.find((entry: any) => entry.key.includes('progress_query'));
      
      expect(mealLoggedEntry!.ttl_minutes).toBe(3);  // Shorter TTL for frequent updates
      expect(goalChangedEntry!.ttl_minutes).toBe(60); // Longer TTL for infrequent changes
      expect(progressQueryEntry!.ttl_minutes).toBe(5); // Medium TTL for queries
    });
    
    it('should clean up expired cache entries', async () => {
      const request = createMockRequest('progress_query', 'cleanup-user');
      
      // Process request to create cache entry
      await macroCalculatorAI.processCalculationRequest(request);
      
      const cache = (macroCalculatorAI as any).cache;
      expect(cache.size).toBe(1);
      
      // Manually set timestamp to simulate expiration
      const entry = cache.values().next().value;
      entry.timestamp = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
      entry.ttl_minutes = 5; // 5 minute TTL, so this is expired
      
      // Trigger cleanup by making another request
      await macroCalculatorAI.processCalculationRequest(createMockRequest('progress_query', 'new-user'));
      
      // Original expired entry should be cleaned up, new entry should exist
      expect(cache.size).toBe(1);
      const remainingEntry = cache.values().next().value;
      expect(remainingEntry.user_id).toBe('new-user');
    });
  });

  describe('Cache Invalidation', () => {
    
    it('should invalidate cache entries based on triggers', async () => {
      const request = createMockRequest('meal_logged', 'invalidation-user');
      
      // Create cache entry
      await macroCalculatorAI.processCalculationRequest(request);
      expect((macroCalculatorAI as any).cache.size).toBe(1);
      
      // Invalidate based on trigger
      const invalidatedCount = macroCalculatorAI.invalidateCache('invalidation-user', 'meal_updated');
      
      expect(invalidatedCount).toBe(1);
      expect((macroCalculatorAI as any).cache.size).toBe(0);
    });
    
    it('should only invalidate entries matching user and trigger', async () => {
      const user1Request = createMockRequest('meal_logged', 'user1');
      const user2Request = createMockRequest('goal_changed', 'user2');
      
      await macroCalculatorAI.processCalculationRequest(user1Request);
      await macroCalculatorAI.processCalculationRequest(user2Request);
      
      expect((macroCalculatorAI as any).cache.size).toBe(2);
      
      // Invalidate only user1's meal-related cache
      const invalidatedCount = macroCalculatorAI.invalidateCache('user1', 'meal_updated');
      
      expect(invalidatedCount).toBe(1);
      expect((macroCalculatorAI as any).cache.size).toBe(1); // user2's cache should remain
    });
  });

  describe('Performance Optimization', () => {
    
    it('should significantly improve response time on cache hits', async () => {
      const request = createMockRequest('progress_query', 'perf-user', [
        createMockMeal('meal1', 400),
        createMockMeal('meal2', 500),
        createMockMeal('meal3', 600)
      ]);
      
      // First request - compute (slower)
      const start1 = Date.now();
      const response1 = await macroCalculatorAI.processCalculationRequest(request);
      const duration1 = Date.now() - start1;
      
      // Second request - cache hit (much faster)
      const start2 = Date.now();
      const response2 = await macroCalculatorAI.processCalculationRequest(request);
      const duration2 = Date.now() - start2;
      
      // First response could be computed or cache_hit (if cache already populated)
      expect(['computed', 'cache_hit']).toContain(response1.system_metadata.cache_status);
      expect(response2.system_metadata.cache_status).toBe('cache_hit');
      
      // Cache hit should be significantly faster (or both very fast in test environment)
      if (duration1 > 0) {
        expect(duration2).toBeLessThanOrEqual(duration1); // Cache should not be slower
      }
      expect(duration2).toBeLessThan(20); // Should be very fast
    });
    
    it('should meet <2s performance SLA even without cache', async () => {
      const largeRequest = createMockRequest('progress_query', 'sla-user', 
        Array.from({ length: 10 }, (_, i) => createMockMeal(`meal-${i}`, 300 + i * 50))
      );
      
      const startTime = Date.now();
      const response = await macroCalculatorAI.processCalculationRequest(largeRequest);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(2000); // Must meet 2s SLA
      expect(response.system_metadata.calculation_time_ms).toBeLessThan(2000);
    });
  });

  describe('Cache Statistics and Monitoring', () => {
    
    it('should provide accurate cache statistics', async () => {
      // Create cache entries for multiple users
      await macroCalculatorAI.processCalculationRequest(createMockRequest('progress_query', 'stats-user1'));
      await macroCalculatorAI.processCalculationRequest(createMockRequest('meal_logged', 'stats-user1'));
      await macroCalculatorAI.processCalculationRequest(createMockRequest('progress_query', 'stats-user2'));
      
      const stats = macroCalculatorAI.getCacheStats();
      
      expect(stats.totalEntries).toBe(3);
      expect(stats.userCounts.get('stats-user1')).toBe(2);
      expect(stats.userCounts.get('stats-user2')).toBe(1);
      expect(stats.averageAgeMinutes).toBeGreaterThanOrEqual(0);
    });
    
    it('should calculate hit rate correctly', async () => {
      const request = createMockRequest('progress_query', 'hitrate-user');
      
      // First request - miss
      await macroCalculatorAI.processCalculationRequest(request);
      
      // Second request - hit
      await macroCalculatorAI.processCalculationRequest(request);
      
      // Third request - hit
      await macroCalculatorAI.processCalculationRequest(request);
      
      const stats = macroCalculatorAI.getCacheStats();
      
      // Should show 2 hits out of 3 total requests = 66.7% hit rate
      expect(stats.hitRate).toBeCloseTo(0.67, 1);
    });
  });

  describe('Memory Management', () => {
    
    it('should limit cache size to prevent memory issues', async () => {
      // Create more than 100 cache entries (the limit)
      const requests = Array.from({ length: 105 }, (_, i) => 
        createMockRequest('progress_query', `user-${i}`, [createMockMeal(`meal-${i}`)])
      );
      
      // Process all requests
      for (const request of requests) {
        await macroCalculatorAI.processCalculationRequest(request);
      }
      
      const cache = (macroCalculatorAI as any).cache;
      
      // Cache should be limited to 100 entries
      expect(cache.size).toBeLessThanOrEqual(100);
    });
    
    it('should keep most recent entries when cleaning up cache', async () => {
      // Create several cache entries
      const oldRequest = createMockRequest('progress_query', 'old-user');
      const newRequest = createMockRequest('progress_query', 'new-user');
      
      await macroCalculatorAI.processCalculationRequest(oldRequest);
      
      // Wait a small amount to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await macroCalculatorAI.processCalculationRequest(newRequest);
      
      const cache = (macroCalculatorAI as any).cache;
      
      // Manually trigger cleanup by setting old entry to expired
      const entries = Array.from(cache.entries()) as Array<[string, any]>;
      const entryPair = entries.find(([key, entry]) => key.includes('old-user'))!;
      const [oldKey, oldEntry] = entryPair;
      oldEntry.timestamp = new Date(Date.now() - 10 * 60 * 1000);
      oldEntry.ttl_minutes = 5;
      
      // Trigger cleanup
      (macroCalculatorAI as any).cleanupExpiredCache();
      
      // Old entry should be removed, new entry should remain
      expect(cache.has(oldKey)).toBe(false);
      expect(cache.size).toBe(1);
      expect(Array.from(cache.keys())[0]).toContain('new-user');
    });
  });
});