// src/stores/search-store.ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SearchResults, SearchHistoryItem, RecentFood, StarredFood, MealItem } from '../services/api/types';

interface SearchState {
  // Current search state
  currentQuery: string;
  searchResults: SearchResults | null;
  isSearching: boolean;
  searchError: string | null;

  // Search history
  searchHistory: SearchHistoryItem[];

  // Recent foods cache
  recentFoods: RecentFood[];

  // Starred/favorited foods
  starredFoods: StarredFood[];

  // Actions
  setCurrentQuery: (query: string) => void;
  setSearchResults: (results: SearchResults | null) => void;
  setIsSearching: (searching: boolean) => void;
  setSearchError: (error: string | null) => void;

  // Search history actions
  addToSearchHistory: (query: string, resultCount: number) => Promise<void>;
  clearSearchHistory: () => Promise<void>;
  getSearchHistory: () => SearchHistoryItem[];

  // Recent foods actions
  addRecentFood: (food: MealItem) => Promise<void>;
  getRecentFoods: (limit?: number) => RecentFood[];
  clearRecentFoods: () => Promise<void>;

  // Starred foods actions
  toggleStarred: (food: MealItem, category?: string) => Promise<void>;
  isStarred: (foodId: string) => boolean;
  getStarredByCategory: (category?: string) => StarredFood[];
  clearStarredFoods: () => Promise<void>;

  // Initialization
  loadFromStorage: () => Promise<void>;
}

const STORAGE_KEYS = {
  SEARCH_HISTORY: '@mealmaster_search_history',
  RECENT_FOODS: '@mealmaster_recent_foods',
  STARRED_FOODS: '@mealmaster_starred_foods',
};

export const useSearchStore = create<SearchState>((set, get) => ({
  // Initial state
  currentQuery: '',
  searchResults: null,
  isSearching: false,
  searchError: null,
  searchHistory: [],
  recentFoods: [],
  starredFoods: [],

  // Basic state setters
  setCurrentQuery: (query: string) => set({ currentQuery: query }),
  setSearchResults: (results: SearchResults | null) => set({ searchResults: results }),
  setIsSearching: (searching: boolean) => set({ isSearching: searching }),
  setSearchError: (error: string | null) => set({ searchError: error }),

  // Search history management
  addToSearchHistory: async (query: string, resultCount: number) => {
    const state = get();
    const trimmedQuery = query.trim();

    if (!trimmedQuery) return;

    // Remove existing entry for this query if it exists
    const filteredHistory = state.searchHistory.filter(item => item.query !== trimmedQuery);

    // Add new entry at the beginning
    const newHistory = [
      {
        query: trimmedQuery,
        timestamp: new Date().toISOString(),
        resultCount,
      },
      ...filteredHistory,
    ].slice(0, 50); // Keep only last 50 searches

    set({ searchHistory: newHistory });

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  },

  clearSearchHistory: async () => {
    set({ searchHistory: [] });
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SEARCH_HISTORY);
    } catch (error) {
      console.error('Failed to clear search history:', error);
    }
  },

  getSearchHistory: () => {
    return get().searchHistory.slice(0, 10); // Return last 10 searches
  },

  // Recent foods management
  addRecentFood: async (food: MealItem) => {
    const state = get();
    const now = new Date().toISOString();

    // Remove existing entry for this food if it exists
    const filteredRecent = state.recentFoods.filter(item => item.food.id !== food.id);

    // Find existing entry to preserve access count
    const existingEntry = state.recentFoods.find(item => item.food.id === food.id);
    const accessCount = existingEntry ? existingEntry.accessCount + 1 : 1;

    // Add new entry at the beginning
    const newRecent = [
      {
        food,
        lastAccessed: now,
        accessCount,
      },
      ...filteredRecent,
    ].slice(0, 100); // Keep only last 100 recent foods

    set({ recentFoods: newRecent });

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.RECENT_FOODS, JSON.stringify(newRecent));
    } catch (error) {
      console.error('Failed to save recent foods:', error);
    }
  },

  getRecentFoods: (limit = 20) => {
    return get().recentFoods.slice(0, limit);
  },

  clearRecentFoods: async () => {
    set({ recentFoods: [] });
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.RECENT_FOODS);
    } catch (error) {
      console.error('Failed to clear recent foods:', error);
    }
  },

  // Starred foods management
  toggleStarred: async (food: MealItem, category = 'favorite') => {
    const state = get();
    const isCurrentlyStarred = state.starredFoods.some(item => item.food.id === food.id);

    let newStarred: StarredFood[];

    if (isCurrentlyStarred) {
      // Remove from starred
      newStarred = state.starredFoods.filter(item => item.food.id !== food.id);
    } else {
      // Add to starred
      newStarred = [
        {
          food,
          category,
          starredAt: new Date().toISOString(),
        },
        ...state.starredFoods,
      ];
    }

    set({ starredFoods: newStarred });

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.STARRED_FOODS, JSON.stringify(newStarred));
    } catch (error) {
      console.error('Failed to save starred foods:', error);
    }
  },

  isStarred: (foodId: string) => {
    return get().starredFoods.some(item => item.food.id === foodId);
  },

  getStarredByCategory: (category?: string) => {
    const starred = get().starredFoods;
    if (!category) return starred;
    return starred.filter(item => item.category === category);
  },

  clearStarredFoods: async () => {
    set({ starredFoods: [] });
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.STARRED_FOODS);
    } catch (error) {
      console.error('Failed to clear starred foods:', error);
    }
  },

  // Load data from AsyncStorage on app start
  loadFromStorage: async () => {
    try {
      const [searchHistoryJson, recentFoodsJson, starredFoodsJson] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY),
        AsyncStorage.getItem(STORAGE_KEYS.RECENT_FOODS),
        AsyncStorage.getItem(STORAGE_KEYS.STARRED_FOODS),
      ]);

      const updates: Partial<SearchState> = {};

      if (searchHistoryJson) {
        try {
          updates.searchHistory = JSON.parse(searchHistoryJson);
        } catch (error) {
          console.error('Failed to parse search history:', error);
          updates.searchHistory = [];
        }
      }

      if (recentFoodsJson) {
        try {
          updates.recentFoods = JSON.parse(recentFoodsJson);
        } catch (error) {
          console.error('Failed to parse recent foods:', error);
          updates.recentFoods = [];
        }
      }

      if (starredFoodsJson) {
        try {
          updates.starredFoods = JSON.parse(starredFoodsJson);
        } catch (error) {
          console.error('Failed to parse starred foods:', error);
          updates.starredFoods = [];
        }
      }

      if (Object.keys(updates).length > 0) {
        set(updates);
      }
    } catch (error) {
      console.error('Failed to load search store data from storage:', error);
    }
  },
}));

// Initialize store on module load
useSearchStore.getState().loadFromStorage();