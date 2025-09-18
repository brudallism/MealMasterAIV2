// src/stores/search-store.ts
import { create } from 'zustand';
import { FoodLookupResult } from '../services/api/types';

interface SearchHistory {
  query: string;
  timestamp: number;
}

interface SearchState {
  // Current search state
  currentQuery: string;
  searchResults: FoodLookupResult[];
  isSearching: boolean;
  searchError: string | null;

  // History and favorites
  searchHistory: SearchHistory[];
  recentFoods: FoodLookupResult[];
  starredFoods: FoodLookupResult[];

  // Actions
  setCurrentQuery: (query: string) => void;
  setSearchResults: (results: FoodLookupResult[]) => void;
  setIsSearching: (isSearching: boolean) => void;
  setSearchError: (error: string | null) => void;

  // History management
  addToSearchHistory: (query: string) => void;
  addRecentFood: (food: FoodLookupResult) => void;
  getRecentFoods: () => FoodLookupResult[];

  // Favorites management
  addStarredFood: (food: FoodLookupResult) => void;
  removeStarredFood: (fdcId: number) => void;
  isStarredFood: (fdcId: number) => boolean;
  getStarredByCategory: (category?: string) => FoodLookupResult[];

  // Clear functions
  clearSearchResults: () => void;
  clearSearchHistory: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  // Initial state
  currentQuery: '',
  searchResults: [],
  isSearching: false,
  searchError: null,
  searchHistory: [],
  recentFoods: [],
  starredFoods: [],

  // Basic search actions
  setCurrentQuery: (query: string) => set({ currentQuery: query }),

  setSearchResults: (results: FoodLookupResult[]) => set({
    searchResults: results,
    searchError: null
  }),

  setIsSearching: (isSearching: boolean) => set({ isSearching }),

  setSearchError: (error: string | null) => set({
    searchError: error,
    isSearching: false
  }),

  // History management
  addToSearchHistory: (query: string) => set((state) => {
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery) return state;

    // Remove existing entry if present
    const filteredHistory = state.searchHistory.filter(
      item => item.query.toLowerCase() !== trimmedQuery
    );

    // Add to beginning and limit to 10 items
    const newHistory = [
      { query: trimmedQuery, timestamp: Date.now() },
      ...filteredHistory
    ].slice(0, 10);

    return { searchHistory: newHistory };
  }),

  addRecentFood: (food: FoodLookupResult) => set((state) => {
    // Remove existing entry if present
    const filteredRecent = state.recentFoods.filter(
      item => item.fdcId !== food.fdcId
    );

    // Add to beginning and limit to 20 items
    const newRecent = [food, ...filteredRecent].slice(0, 20);

    return { recentFoods: newRecent };
  }),

  getRecentFoods: () => get().recentFoods,

  // Favorites management
  addStarredFood: (food: FoodLookupResult) => set((state) => {
    if (state.starredFoods.some(item => item.fdcId === food.fdcId)) {
      return state; // Already starred
    }
    return { starredFoods: [...state.starredFoods, food] };
  }),

  removeStarredFood: (fdcId: number) => set((state) => ({
    starredFoods: state.starredFoods.filter(item => item.fdcId !== fdcId)
  })),

  isStarredFood: (fdcId: number) => {
    return get().starredFoods.some(item => item.fdcId === fdcId);
  },

  getStarredByCategory: (category?: string) => {
    const starred = get().starredFoods;
    if (!category) return starred;

    return starred.filter(food =>
      food.foodCategory?.toLowerCase().includes(category.toLowerCase())
    );
  },

  // Clear functions
  clearSearchResults: () => set({
    searchResults: [],
    searchError: null,
    currentQuery: ''
  }),

  clearSearchHistory: () => set({ searchHistory: [] })
}));