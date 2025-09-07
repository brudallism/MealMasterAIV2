// src/services/cache/food-cache-manager.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../database/supabase';

export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface CacheEntry {
  foodKey: string;
  nutritionData: NutritionData;
  dataSource: 'spoonacular' | 'usda' | 'gpt_generated';
  confidence: number;
  createdAt: Date;
  lastUsed: Date;
  usageCount: number;
}

export interface UserCacheEntry extends CacheEntry {
  userId: string;
  frequencyScore: number;
  retentionPriority: 'high' | 'medium' | 'low';
}

export interface GlobalCacheEntry extends CacheEntry {
  globalRequestCount: number;
  popularityTier: 'permanent' | 'high' | 'medium' | 'low';
  userCorrectionCount: number;
  needsReview: boolean;
}

export class FoodCacheManager {
  private readonly USER_CACHE_PREFIX = 'user_food_cache_';
  private readonly GLOBAL_CACHE_PREFIX = 'global_food_cache_';
  private readonly MAX_USER_ENTRIES = 50;
  private readonly MAX_GLOBAL_ENTRIES = 1000;

  // Generate consistent cache key from food description
  generateCacheKey(foodDescription: string): string {
    // Normalize the description for consistent caching
    return foodDescription
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 50); // Limit length
  }

  // ===================
  // TIER 1: USER CACHE
  // ===================
  
  async getUserCache(userId: string): Promise<UserCacheEntry[]> {
    try {
      const cacheKey = `${this.USER_CACHE_PREFIX}${userId}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      
      if (!cached) return [];
      
      const entries: UserCacheEntry[] = JSON.parse(cached);
      // Convert date strings back to Date objects
      return entries.map(entry => ({
        ...entry,
        createdAt: new Date(entry.createdAt),
        lastUsed: new Date(entry.lastUsed)
      }));
    } catch (error) {
      console.error('[FoodCacheManager] Error loading user cache:', error);
      return [];
    }
  }

  async getUserCacheEntry(userId: string, foodKey: string): Promise<UserCacheEntry | null> {
    const userCache = await this.getUserCache(userId);
    return userCache.find(entry => entry.foodKey === foodKey) || null;
  }

  async addToUserCache(
    userId: string, 
    foodKey: string, 
    nutritionData: NutritionData, 
    dataSource: 'spoonacular' | 'usda' | 'gpt_generated',
    confidence: number
  ): Promise<void> {
    try {
      let userCache = await this.getUserCache(userId);
      
      // Check if entry already exists
      const existingIndex = userCache.findIndex(entry => entry.foodKey === foodKey);
      
      if (existingIndex >= 0) {
        // Update existing entry
        userCache[existingIndex] = {
          ...userCache[existingIndex],
          lastUsed: new Date(),
          usageCount: userCache[existingIndex].usageCount + 1,
          frequencyScore: this.calculateFrequencyScore(userCache[existingIndex]),
          retentionPriority: this.calculateRetentionPriority(userCache[existingIndex])
        };
      } else {
        // Add new entry
        const newEntry: UserCacheEntry = {
          userId,
          foodKey,
          nutritionData,
          dataSource,
          confidence,
          createdAt: new Date(),
          lastUsed: new Date(),
          usageCount: 1,
          frequencyScore: 1,
          retentionPriority: 'low'
        };
        
        userCache.push(newEntry);
        
        // Evict old entries if cache is full
        if (userCache.length > this.MAX_USER_ENTRIES) {
          userCache = this.evictUserCacheEntries(userCache);
        }
      }
      
      // Save updated cache
      const cacheKey = `${this.USER_CACHE_PREFIX}${userId}`;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(userCache));
      
      console.log(`[FoodCacheManager] Added to user cache: ${foodKey} (${userCache.length}/${this.MAX_USER_ENTRIES} entries)`);
      
    } catch (error) {
      console.error('[FoodCacheManager] Error adding to user cache:', error);
    }
  }

  private evictUserCacheEntries(entries: UserCacheEntry[]): UserCacheEntry[] {
    // Smart eviction: remove foods not used in 7+ days AND low frequency
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    
    // Separate entries by retention priority
    const highPriority = entries.filter(e => e.retentionPriority === 'high');
    const mediumPriority = entries.filter(e => e.retentionPriority === 'medium');
    const lowPriority = entries.filter(e => e.retentionPriority === 'low');
    
    // First, remove old low-priority entries
    const recentLowPriority = lowPriority.filter(entry => {
      const daysSinceUse = (now - entry.lastUsed.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceUse <= 7;
    });
    
    let remainingEntries = [...highPriority, ...mediumPriority, ...recentLowPriority];
    
    // If still too many, remove oldest medium priority
    if (remainingEntries.length > this.MAX_USER_ENTRIES) {
      const sortedMedium = mediumPriority.sort((a, b) => a.lastUsed.getTime() - b.lastUsed.getTime());
      const keepMedium = sortedMedium.slice(-(this.MAX_USER_ENTRIES - highPriority.length - recentLowPriority.length));
      remainingEntries = [...highPriority, ...keepMedium, ...recentLowPriority];
    }
    
    // Final limit enforcement
    if (remainingEntries.length > this.MAX_USER_ENTRIES) {
      remainingEntries.sort((a, b) => b.frequencyScore - a.frequencyScore);
      remainingEntries = remainingEntries.slice(0, this.MAX_USER_ENTRIES);
    }
    
    console.log(`[FoodCacheManager] Evicted ${entries.length - remainingEntries.length} user cache entries`);
    return remainingEntries;
  }

  private calculateFrequencyScore(entry: UserCacheEntry): number {
    const weeksSinceCreated = Math.max(1, (Date.now() - entry.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 7));
    return entry.usageCount / weeksSinceCreated;
  }

  private calculateRetentionPriority(entry: UserCacheEntry): 'high' | 'medium' | 'low' {
    const frequencyScore = this.calculateFrequencyScore(entry);
    
    if (frequencyScore >= 3) return 'high';    // 3+ times per week = keep indefinitely
    if (frequencyScore >= 1) return 'medium';  // 1-2 times per week = extend to 30 days
    return 'low';                              // <1 time per week = 7 day expiration
  }

  // ===================
  // TIER 2: GLOBAL CACHE
  // ===================

  async getGlobalCacheEntry(foodKey: string): Promise<GlobalCacheEntry | null> {
    try {
      const cacheKey = `${this.GLOBAL_CACHE_PREFIX}${foodKey}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      
      if (!cached) return null;
      
      const entry: GlobalCacheEntry = JSON.parse(cached);
      // Convert date strings back to Date objects
      return {
        ...entry,
        createdAt: new Date(entry.createdAt),
        lastUsed: new Date(entry.lastUsed)
      };
    } catch (error) {
      console.error('[FoodCacheManager] Error loading global cache entry:', error);
      return null;
    }
  }

  async addToGlobalCache(
    foodKey: string,
    nutritionData: NutritionData,
    dataSource: 'spoonacular' | 'usda' | 'gpt_generated',
    confidence: number
  ): Promise<void> {
    try {
      const existingEntry = await this.getGlobalCacheEntry(foodKey);
      
      let entry: GlobalCacheEntry;
      
      if (existingEntry) {
        // Update existing entry
        entry = {
          ...existingEntry,
          lastUsed: new Date(),
          globalRequestCount: existingEntry.globalRequestCount + 1,
          popularityTier: this.calculatePopularityTier(existingEntry.globalRequestCount + 1)
        };
      } else {
        // Create new entry
        entry = {
          foodKey,
          nutritionData,
          dataSource,
          confidence,
          createdAt: new Date(),
          lastUsed: new Date(),
          usageCount: 1,
          globalRequestCount: 1,
          popularityTier: 'low',
          userCorrectionCount: 0,
          needsReview: false
        };
      }
      
      const cacheKey = `${this.GLOBAL_CACHE_PREFIX}${foodKey}`;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));
      
      console.log(`[FoodCacheManager] Added to global cache: ${foodKey} (requests: ${entry.globalRequestCount})`);
      
    } catch (error) {
      console.error('[FoodCacheManager] Error adding to global cache:', error);
    }
  }

  private calculatePopularityTier(requestCount: number): 'permanent' | 'high' | 'medium' | 'low' {
    if (requestCount >= 100) return 'permanent'; // Very popular foods
    if (requestCount >= 20) return 'high';       // Popular foods
    if (requestCount >= 5) return 'medium';      // Moderately popular
    return 'low';                                // Infrequently requested
  }

  // ===================
  // TIER 3: DATABASE CACHE
  // ===================

  async getDatabaseCacheEntry(foodKey: string): Promise<CacheEntry | null> {
    try {
      const { data, error } = await supabase
        .from('food_recognition_cache')
        .select('*')
        .eq('food_key', foodKey)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error('[FoodCacheManager] Database cache error:', error);
        return null;
      }
      
      if (!data) return null;
      
      return {
        foodKey: data.food_key,
        nutritionData: {
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat,
          fiber: data.fiber,
          sugar: data.sugar,
          sodium: data.sodium
        },
        dataSource: data.data_source,
        confidence: data.confidence,
        createdAt: new Date(data.created_at),
        lastUsed: new Date(data.last_used),
        usageCount: data.usage_count
      };
      
    } catch (error) {
      console.error('[FoodCacheManager] Database cache lookup error:', error);
      return null;
    }
  }

  async addToDatabaseCache(
    foodKey: string,
    nutritionData: NutritionData,
    dataSource: 'spoonacular' | 'usda' | 'gpt_generated',
    confidence: number
  ): Promise<void> {
    try {
      const now = new Date().toISOString();
      
      const { error } = await supabase
        .from('food_recognition_cache')
        .upsert({
          food_key: foodKey,
          calories: nutritionData.calories,
          protein: nutritionData.protein,
          carbs: nutritionData.carbs,
          fat: nutritionData.fat,
          fiber: nutritionData.fiber || 0,
          sugar: nutritionData.sugar || 0,
          sodium: nutritionData.sodium || 0,
          data_source: dataSource,
          confidence: confidence,
          created_at: now,
          last_used: now,
          usage_count: 1
        }, {
          onConflict: 'food_key'
        });
      
      if (error) {
        console.error('[FoodCacheManager] Database cache insert error:', error);
      } else {
        console.log(`[FoodCacheManager] Added to database cache: ${foodKey}`);
      }
      
    } catch (error) {
      console.error('[FoodCacheManager] Database cache error:', error);
    }
  }

  // ===================
  // UNIFIED CACHE LOOKUP
  // ===================

  async getCachedFood(userId: string, foodKey: string): Promise<{
    found: boolean;
    data?: NutritionData;
    source: 'user_cache' | 'global_cache' | 'database_cache' | 'none';
    confidence?: number;
    processingTime: number;
  }> {
    const startTime = Date.now();
    
    try {
      // Tier 1: User Cache (fastest - ~1ms)
      const userEntry = await this.getUserCacheEntry(userId, foodKey);
      if (userEntry) {
        // Update usage stats
        await this.addToUserCache(userId, foodKey, userEntry.nutritionData, userEntry.dataSource, userEntry.confidence);
        
        return {
          found: true,
          data: userEntry.nutritionData,
          source: 'user_cache',
          confidence: userEntry.confidence,
          processingTime: Date.now() - startTime
        };
      }
      
      // Tier 2: Global Cache (medium - ~5ms)
      const globalEntry = await this.getGlobalCacheEntry(foodKey);
      if (globalEntry) {
        // Add to user cache for future speed
        await this.addToUserCache(userId, foodKey, globalEntry.nutritionData, globalEntry.dataSource, globalEntry.confidence);
        // Update global cache usage
        await this.addToGlobalCache(foodKey, globalEntry.nutritionData, globalEntry.dataSource, globalEntry.confidence);
        
        return {
          found: true,
          data: globalEntry.nutritionData,
          source: 'global_cache',
          confidence: globalEntry.confidence,
          processingTime: Date.now() - startTime
        };
      }
      
      // Tier 3: Database Cache (slower - ~50ms)
      const dbEntry = await this.getDatabaseCacheEntry(foodKey);
      if (dbEntry) {
        // Add to both local caches for future speed
        await this.addToUserCache(userId, foodKey, dbEntry.nutritionData, dbEntry.dataSource, dbEntry.confidence);
        await this.addToGlobalCache(foodKey, dbEntry.nutritionData, dbEntry.dataSource, dbEntry.confidence);
        
        return {
          found: true,
          data: dbEntry.nutritionData,
          source: 'database_cache',
          confidence: dbEntry.confidence,
          processingTime: Date.now() - startTime
        };
      }
      
      // No cache hit
      return {
        found: false,
        source: 'none',
        processingTime: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('[FoodCacheManager] Cache lookup error:', error);
      return {
        found: false,
        source: 'none',
        processingTime: Date.now() - startTime
      };
    }
  }

  // ===================
  // CACHE POPULATION
  // ===================

  async cacheFood(
    userId: string,
    foodKey: string,
    nutritionData: NutritionData,
    dataSource: 'spoonacular' | 'usda' | 'gpt_generated',
    confidence: number
  ): Promise<void> {
    // Add to all cache tiers for maximum performance
    await Promise.all([
      this.addToUserCache(userId, foodKey, nutritionData, dataSource, confidence),
      this.addToGlobalCache(foodKey, nutritionData, dataSource, confidence),
      this.addToDatabaseCache(foodKey, nutritionData, dataSource, confidence)
    ]);
    
    console.log(`[FoodCacheManager] Cached food across all tiers: ${foodKey}`);
  }

  // ===================
  // CACHE MANAGEMENT
  // ===================

  async clearAllCaches(userId: string): Promise<void> {
    try {
      console.log(`[FoodCacheManager] Clearing all cache tiers for testing...`);
      
      // Clear user cache
      const userCacheKey = `${this.USER_CACHE_PREFIX}${userId}`;
      await AsyncStorage.removeItem(userCacheKey);
      
      // Clear global cache (all entries)
      const globalKeys = await AsyncStorage.getAllKeys();
      const globalCacheKeys = globalKeys.filter(key => key.startsWith(this.GLOBAL_CACHE_PREFIX));
      await AsyncStorage.multiRemove(globalCacheKeys);
      
      // Clear database cache (test entries only - preserve real data)
      await supabase
        .from('food_recognition_cache')
        .delete()
        .like('food_key', '%test%');
        
      console.log(`[FoodCacheManager] All caches cleared for fresh testing`);
      
    } catch (error) {
      console.error('[FoodCacheManager] Error clearing caches:', error);
    }
  }

  async clearTestCaches(): Promise<void> {
    try {
      // Generate actual cache keys used by the system
      const testFoods = ['1 medium apple', '6 oz salmon fillet'];
      const testKeys = testFoods.map(food => this.generateCacheKey(food));
      testKeys.push('database_test_key'); // Add the database test key
      
      console.log(`[FoodCacheManager] Clearing cache keys: ${testKeys.join(', ')}`);
      
      // Clear user caches completely (since they contain arrays)
      const allKeys = await AsyncStorage.getAllKeys();
      const userCacheKeys = allKeys.filter(key => key.startsWith(this.USER_CACHE_PREFIX));
      
      for (const userCacheKey of userCacheKeys) {
        const userId = userCacheKey.replace(this.USER_CACHE_PREFIX, '');
        let userCache = await this.getUserCache(userId);
        
        // Remove test entries from user cache
        const originalLength = userCache.length;
        userCache = userCache.filter(entry => !testKeys.includes(entry.foodKey));
        
        if (userCache.length !== originalLength) {
          await AsyncStorage.setItem(userCacheKey, JSON.stringify(userCache));
          console.log(`[FoodCacheManager] Cleaned user cache for ${userId}: ${originalLength - userCache.length} entries removed`);
        }
      }
      
      // Clear global cache entries
      const globalCacheKeys = allKeys.filter(key => 
        key.startsWith(this.GLOBAL_CACHE_PREFIX) && 
        testKeys.some(testKey => key.includes(testKey))
      );
      
      if (globalCacheKeys.length > 0) {
        await AsyncStorage.multiRemove(globalCacheKeys);
        console.log(`[FoodCacheManager] Removed ${globalCacheKeys.length} global cache entries`);
      }
      
      // Clear from database
      let deletedCount = 0;
      for (const testKey of testKeys) {
        const { count } = await supabase
          .from('food_recognition_cache')
          .delete({ count: 'exact' })
          .eq('food_key', testKey);
        deletedCount += count || 0;
      }
      
      console.log(`[FoodCacheManager] Removed ${deletedCount} database cache entries`);
      console.log(`[FoodCacheManager] Test caches cleared successfully`);
      
    } catch (error) {
      console.error('[FoodCacheManager] Error clearing test caches:', error);
    }
  }

  // ===================
  // CACHE ANALYTICS
  // ===================

  async getCacheStats(userId: string): Promise<{
    userCacheSize: number;
    userCacheHitRate: number;
    globalCacheEstimatedSize: number;
    averageProcessingTime: number;
  }> {
    try {
      const userCache = await this.getUserCache(userId);
      
      // Calculate hit rate based on usage frequency
      const totalUsage = userCache.reduce((sum, entry) => sum + entry.usageCount, 0);
      const hitRate = totalUsage > 0 ? (totalUsage - userCache.length) / totalUsage : 0;
      
      return {
        userCacheSize: userCache.length,
        userCacheHitRate: hitRate,
        globalCacheEstimatedSize: 0, // Would need global counter for this
        averageProcessingTime: 50 // Estimated average including all tiers
      };
      
    } catch (error) {
      console.error('[FoodCacheManager] Error getting cache stats:', error);
      return {
        userCacheSize: 0,
        userCacheHitRate: 0,
        globalCacheEstimatedSize: 0,
        averageProcessingTime: 0
      };
    }
  }
}

export const foodCacheManager = new FoodCacheManager();