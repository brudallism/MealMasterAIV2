// src/stores/overrides-store.ts
import { create } from 'zustand';

interface RecipeOverride {
  recipeId: number;
  timestamp: string;
  reason: 'diet' | 'exclusion' | 'cuisine' | 'time' | 'calories';
  originalConflict: string;
}

interface OverridesState {
  sessionOverrides: RecipeOverride[];

  // Actions
  addOverride: (recipeId: number, reason: RecipeOverride['reason'], conflict: string) => void;
  hasOverride: (recipeId: number) => boolean;
  getOverride: (recipeId: number) => RecipeOverride | undefined;
  clearOverrides: () => void;
  removeOverride: (recipeId: number) => void;
}

export const useOverridesStore = create<OverridesState>((set, get) => ({
  sessionOverrides: [],

  addOverride: (recipeId: number, reason: RecipeOverride['reason'], conflict: string) => {
    set((state) => ({
      sessionOverrides: [
        ...state.sessionOverrides.filter(o => o.recipeId !== recipeId), // Remove existing override
        {
          recipeId,
          timestamp: new Date().toISOString(),
          reason,
          originalConflict: conflict
        }
      ]
    }));
  },

  hasOverride: (recipeId: number) => {
    const state = get();
    return state.sessionOverrides.some(o => o.recipeId === recipeId);
  },

  getOverride: (recipeId: number) => {
    const state = get();
    return state.sessionOverrides.find(o => o.recipeId === recipeId);
  },

  clearOverrides: () => set({ sessionOverrides: [] }),

  removeOverride: (recipeId: number) => {
    set((state) => ({
      sessionOverrides: state.sessionOverrides.filter(o => o.recipeId !== recipeId)
    }));
  }
}));