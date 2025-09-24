// src/stores/unified-favorites-store.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  UnifiedMealItem,
  UnifiedFavoriteItem,
  isRecipeItem,
  isFoodItem
} from '@/types/unified-meal-item';

/**
 * Unified favorites store that can handle both USDA foods and Spoonacular recipes
 * with consistent string-based IDs and proper data structure management
 */
interface UnifiedFavoritesState {
  // Unified favorites storage (replaces separate starred foods and recipe favorites)
  favorites: UnifiedFavoriteItem[];

  // Actions
  addToFavorites: (item: UnifiedMealItem, category?: 'favorite' | 'starred', notes?: string) => Promise<void>;
  removeFromFavorites: (id: string) => Promise<void>;
  isFavorite: (id: string) => boolean;
  getFavoriteById: (id: string) => UnifiedFavoriteItem | null;
  getFavoritesByType: (type: 'recipe' | 'food') => UnifiedFavoriteItem[];
  getFavoritesBySource: (source: 'usda' | 'spoonacular') => UnifiedFavoriteItem[];
  clearAllFavorites: () => Promise<void>;

  // Migration helpers (for backward compatibility)
  migrateLegacyFavorites: (legacyStarredFoods: any[], legacyRecipeFavorites: any[]) => Promise<void>;

  // Utility functions
  getStarredFoodsMap: () => Map<string, boolean>;
  getStarredRecipesMap: () => Map<string, boolean>;
}

export const useUnifiedFavoritesStore = create<UnifiedFavoritesState>()(
  persist(
    (set, get) => ({
      // Initial state
      favorites: [],

      // Add item to favorites
      addToFavorites: async (item: UnifiedMealItem, category = 'favorite', notes) => {
        const { favorites } = get();

        // Check if already favorited
        const existingIndex = favorites.findIndex(fav => fav.id === item.id);
        if (existingIndex !== -1) {
          console.log('[UnifiedFavorites] Item already favorited:', item.id);
          return;
        }

        // Determine type for legacy compatibility
        const type = isRecipeItem(item) ? 'recipe' : 'food';

        // Create unified favorite item
        const favoriteItem: UnifiedFavoriteItem = {
          id: item.id,
          type,
          item,
          addedAt: new Date().toISOString(),
          category,
          notes,
        };

        set({
          favorites: [...favorites, favoriteItem],
        });

        console.log('[UnifiedFavorites] Added to favorites:', {
          id: item.id,
          title: item.title,
          type,
          source: item.source,
        });
      },

      // Remove item from favorites
      removeFromFavorites: async (id: string) => {
        const { favorites } = get();

        const filteredFavorites = favorites.filter(fav => fav.id !== id);

        if (filteredFavorites.length === favorites.length) {
          console.log('[UnifiedFavorites] Item not found in favorites:', id);
          return;
        }

        set({
          favorites: filteredFavorites,
        });

        console.log('[UnifiedFavorites] Removed from favorites:', id);
      },

      // Check if item is favorited
      isFavorite: (id: string): boolean => {
        const { favorites } = get();
        return favorites.some(fav => fav.id === id);
      },

      // Get favorite item by ID
      getFavoriteById: (id: string): UnifiedFavoriteItem | null => {
        const { favorites } = get();
        return favorites.find(fav => fav.id === id) || null;
      },

      // Get favorites by type (recipe or food)
      getFavoritesByType: (type: 'recipe' | 'food'): UnifiedFavoriteItem[] => {
        const { favorites } = get();
        return favorites.filter(fav => fav.type === type);
      },

      // Get favorites by source API
      getFavoritesBySource: (source: 'usda' | 'spoonacular'): UnifiedFavoriteItem[] => {
        const { favorites } = get();
        return favorites.filter(fav => fav.item.source === source);
      },

      // Clear all favorites
      clearAllFavorites: async () => {
        set({ favorites: [] });
        console.log('[UnifiedFavorites] All favorites cleared');
      },

      // Migration helper for legacy data
      migrateLegacyFavorites: async (legacyStarredFoods: any[] = [], legacyRecipeFavorites: any[] = []) => {
        const { favorites, addToFavorites } = get();

        console.log('[UnifiedFavorites] Migrating legacy favorites:', {
          existingCount: favorites.length,
          legacyFoodsCount: legacyStarredFoods.length,
          legacyRecipesCount: legacyRecipeFavorites.length,
        });

        // Don't migrate if we already have unified favorites
        if (favorites.length > 0) {
          console.log('[UnifiedFavorites] Skipping migration - unified favorites already exist');
          return;
        }

        // Migrate legacy starred foods (USDA)
        for (const starredFood of legacyStarredFoods) {
          try {
            // Convert legacy starred food to unified format
            if (starredFood.food && starredFood.food.id) {
              const unifiedItem: UnifiedMealItem = {
                id: starredFood.food.id,
                source: 'usda',
                originalId: starredFood.food.id,
                title: starredFood.food.name || 'Unknown Food',
                type: 'food',
                image: starredFood.food.metadata?.foodIcon,
                brandOwner: starredFood.food.brand,
                nutrition: starredFood.food.nutrition ? {
                  per_serving: {
                    calories: starredFood.food.nutrition.per100g?.calories || 0,
                    protein: starredFood.food.nutrition.per100g?.protein || 0,
                    carbs: starredFood.food.nutrition.per100g?.carbs || 0,
                    fat: starredFood.food.nutrition.per100g?.fat || 0,
                    fiber: starredFood.food.nutrition.per100g?.fiber || 0,
                  },
                } : undefined,
                dietary: {
                  diets: [],
                  allergens: [],
                  isVegan: false,
                  isVegetarian: false,
                  isGlutenFree: false,
                  isDairyFree: false,
                },
                metadata: {
                  searchRelevance: starredFood.food.metadata?.confidence || 0,
                  lastUpdated: new Date().toISOString(),
                  tags: ['migrated', 'usda'],
                },
              };

              await addToFavorites(unifiedItem, 'starred');
            }
          } catch (error) {
            console.error('[UnifiedFavorites] Error migrating starred food:', error);
          }
        }

        // Migrate legacy recipe favorites (Spoonacular)
        for (const recipeFavorite of legacyRecipeFavorites) {
          try {
            // Convert legacy recipe favorite to unified format
            if (recipeFavorite.id) {
              const unifiedItem: UnifiedMealItem = {
                id: recipeFavorite.id.toString(),
                source: 'spoonacular',
                originalId: recipeFavorite.id,
                title: recipeFavorite.title || 'Unknown Recipe',
                type: 'recipe',
                image: recipeFavorite.image,
                readyInMinutes: recipeFavorite.readyInMinutes || 0,
                servings: recipeFavorite.servings || 1,
                healthScore: recipeFavorite.healthScore,
                nutrition: recipeFavorite.nutrition,
                dietary: {
                  diets: recipeFavorite.diets || [],
                  allergens: [],
                  isVegan: recipeFavorite.vegan || false,
                  isVegetarian: recipeFavorite.vegetarian || false,
                  isGlutenFree: recipeFavorite.glutenFree || false,
                  isDairyFree: recipeFavorite.dairyFree || false,
                },
                metadata: {
                  searchRelevance: recipeFavorite.spoonacularScore || 0,
                  popularity: recipeFavorite.aggregateLikes || 0,
                  lastUpdated: new Date().toISOString(),
                  tags: ['migrated', 'spoonacular'],
                },
              };

              await addToFavorites(unifiedItem, 'favorite');
            }
          } catch (error) {
            console.error('[UnifiedFavorites] Error migrating recipe favorite:', error);
          }
        }

        console.log('[UnifiedFavorites] Migration completed:', {
          totalFavorites: get().favorites.length,
        });
      },

      // Utility: Get starred foods map for component compatibility
      getStarredFoodsMap: (): Map<string, boolean> => {
        const { favorites } = get();
        const map = new Map<string, boolean>();

        favorites
          .filter(fav => fav.type === 'food')
          .forEach(fav => {
            map.set(fav.id, true);
          });

        return map;
      },

      // Utility: Get starred recipes map for component compatibility
      getStarredRecipesMap: (): Map<string, boolean> => {
        const { favorites } = get();
        const map = new Map<string, boolean>();

        favorites
          .filter(fav => fav.type === 'recipe')
          .forEach(fav => {
            map.set(fav.id, true);
          });

        return map;
      },
    }),
    {
      name: 'unified-favorites-storage',
      version: 1,
    }
  )
);