// src/stores/micronutrients-store.ts
// Fixed micronutrient tracking store with robust initialization

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface MicronutrientRegistryItem {
  id: number; // USDA FDC nutrient ID
  name: string;
  unit: 'g' | 'mg' | 'µg' | 'kcal' | 'IU' | string;
  category: 'vitamin' | 'mineral' | 'macro_other' | 'special' | 'amino_acid';
  minimizeFlag: boolean; // True for nutrients to minimize (trans fats, sodium)
}

export interface MicronutrientDisplayEntry {
  id: number;
  name: string;
  unit: string;
  minimizeFlag: boolean;
  kind: 'builtin';
}

// Store state interface
interface MicronutrientsState {
  // Core data - keep simple for reliable persistence
  selectedIds: number[]; // ORDERED array - only built-in IDs
  isInitialized: boolean; // Add initialization flag

  // Onboarding and user customization tracking
  hasSeenOnboarding: boolean; // For future onboarding flow
  userHasCustomized: boolean; // Distinguishes auto-applied vs user-chosen

  // UI state
  ui: {
    lastAppliedPreset: string | null;
    isLoading: boolean;
    error: string | null;
  };
}

// Store actions interface
interface MicronutrientsActions {
  // Initialization
  initialize: () => void;

  // Selection management
  toggleSelect: (id: number) => void;
  reorderSelected: (fromIndex: number, toIndex: number) => void;

  // Preset management
  applyPreset: (presetKey: string, enabled: boolean) => void;

  // Selectors (computed)
  getOrderedDisplayList: () => MicronutrientDisplayEntry[];
  getUncheckedBuiltins: () => MicronutrientDisplayEntry[];

  // UI actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

type MicronutrientsStore = MicronutrientsState & MicronutrientsActions;

// ============================================================================
// REGISTRY SEED DATA - MOVED OUTSIDE STORE FOR STABILITY
// ============================================================================

const MICRONUTRIENT_REGISTRY: Record<number, MicronutrientRegistryItem> = {
  // Trans fats (minimize)
  1257: {
    id: 1257,
    name: 'Trans Fatty Acids',
    unit: 'g',
    category: 'macro_other',
    minimizeFlag: true,
  },

  // Sodium (minimize)
  1093: {
    id: 1093,
    name: 'Sodium',
    unit: 'mg',
    category: 'mineral',
    minimizeFlag: true,
  },

  // Added Sugars (minimize)
  1235: {
    id: 1235,
    name: 'Added Sugars',
    unit: 'g',
    category: 'special',
    minimizeFlag: true,
  },

  // Beneficial minerals
  1087: {
    id: 1087,
    name: 'Calcium',
    unit: 'mg',
    category: 'mineral',
    minimizeFlag: false,
  },
  1089: {
    id: 1089,
    name: 'Iron',
    unit: 'mg',
    category: 'mineral',
    minimizeFlag: false,
  },
  1090: {
    id: 1090,
    name: 'Magnesium',
    unit: 'mg',
    category: 'mineral',
    minimizeFlag: false,
  },
  1092: {
    id: 1092,
    name: 'Potassium',
    unit: 'mg',
    category: 'mineral',
    minimizeFlag: false,
  },
  1095: {
    id: 1095,
    name: 'Zinc',
    unit: 'mg',
    category: 'mineral',
    minimizeFlag: false,
  },

  // Vitamins
  1106: {
    id: 1106,
    name: 'Vitamin A (RAE)',
    unit: 'µg',
    category: 'vitamin',
    minimizeFlag: false,
  },
  1162: {
    id: 1162,
    name: 'Vitamin C',
    unit: 'mg',
    category: 'vitamin',
    minimizeFlag: false,
  },
  1114: {
    id: 1114,
    name: 'Vitamin D',
    unit: 'µg',
    category: 'vitamin',
    minimizeFlag: false,
  },
  1178: {
    id: 1178,
    name: 'Vitamin B-12',
    unit: 'µg',
    category: 'vitamin',
    minimizeFlag: false,
  },
  1177: {
    id: 1177,
    name: 'Folate (Total)',
    unit: 'µg',
    category: 'vitamin',
    minimizeFlag: false,
  },
  1185: {
    id: 1185,
    name: 'Vitamin K',
    unit: 'µg',
    category: 'vitamin',
    minimizeFlag: false,
  },
};

// ============================================================================
// PRESET DEFINITIONS
// ============================================================================

const HEALTH_PRESETS: Record<string, number[]> = {
  'Default': [
    1235, // Added Sugars
    1093, // Sodium
    1087, // Calcium
    1090, // Magnesium
    1092, // Potassium
    1095, // Zinc
    1106, // Vitamin A
    1162, // Vitamin C
    1114, // Vitamin D
    1185, // Vitamin K
  ],
  'Heart Health': [
    1093, // Sodium
    1092, // Potassium
  ],
  'Bone Health': [
    1087, // Calcium
    1114, // Vitamin D
    1090, // Magnesium
  ],
  'Immune Support': [
    1162, // Vitamin C
    1095, // Zinc
    1106, // Vitamin A
  ],
};

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useMicronutrientsStore = create<MicronutrientsStore>()(
  persist(
    (set, get) => ({
      // ==================== STATE ====================
      selectedIds: [], // Start with empty selection
      isInitialized: false,
      hasSeenOnboarding: false, // For future onboarding flow
      userHasCustomized: false, // Track if user has made any customizations
      ui: {
        lastAppliedPreset: null,
        isLoading: false,
        error: null,
      },

      // ==================== ACTIONS ====================

      initialize: () => {
        try {
          const { selectedIds, isInitialized } = get();

          // Only initialize once
          if (isInitialized) return;

          // If no selection exists, apply default preset
          if (selectedIds.length === 0) {
            const defaultIds = HEALTH_PRESETS['Default'] || [];
            set({
              selectedIds: defaultIds,
              isInitialized: true,
              ui: { ...get().ui, lastAppliedPreset: 'Default' },
            });
          } else {
            set({ isInitialized: true });
          }
        } catch (error) {
          console.error('Failed to initialize micronutrients store:', error);
          set({
            isInitialized: true,
            ui: { ...get().ui, error: 'Failed to initialize store' },
          });
        }
      },

      toggleSelect: (id: number) => {
        try {
          const { selectedIds } = get();
          const isSelected = selectedIds.includes(id);

          if (isSelected) {
            // Remove from selection
            set({
              selectedIds: selectedIds.filter(selectedId => selectedId !== id),
              userHasCustomized: true, // Mark as user-customized
            });
          } else {
            // Add to TOP of selection (as specified)
            // Enforce 24-item limit
            const newSelectedIds = [id, ...selectedIds];
            if (newSelectedIds.length > 24) {
              console.warn('Maximum 24 micronutrients can be selected');
              return;
            }

            set({
              selectedIds: newSelectedIds,
              userHasCustomized: true, // Mark as user-customized
            });
          }
        } catch (error) {
          console.error('Failed to toggle micronutrient selection:', error);
          set((state) => ({
            ui: { ...state.ui, error: 'Failed to update selection' },
          }));
        }
      },

      reorderSelected: (fromIndex: number, toIndex: number) => {
        try {
          const { selectedIds } = get();
          const newSelectedIds = [...selectedIds];
          const [movedItem] = newSelectedIds.splice(fromIndex, 1);
          newSelectedIds.splice(toIndex, 0, movedItem);

          set({
            selectedIds: newSelectedIds,
            userHasCustomized: true, // Mark as user-customized
          });
        } catch (error) {
          console.error('Failed to reorder micronutrients:', error);
          set((state) => ({
            ui: { ...state.ui, error: 'Failed to reorder selection' },
          }));
        }
      },

      applyPreset: (presetKey: string, enabled: boolean) => {
        try {
          const { selectedIds } = get();
          const presetIds = HEALTH_PRESETS[presetKey];

          if (!presetIds) {
            console.warn(`Preset '${presetKey}' not found`);
            return;
          }

          if (enabled) {
            // MERGE: Add preset items to TOP without duplicates
            const newIds = [...presetIds];
            const existingIds = selectedIds.filter(id => !presetIds.includes(id));
            const mergedIds = [...newIds, ...existingIds];

            // Enforce 24-item limit
            if (mergedIds.length > 24) {
              console.warn('Adding preset would exceed 24-item limit');
              return;
            }

            set({
              selectedIds: mergedIds,
              ui: { ...get().ui, lastAppliedPreset: presetKey },
            });
          } else {
            // REMOVE: Remove all preset items from selection
            const filteredIds = selectedIds.filter(id => !presetIds.includes(id));
            set({
              selectedIds: filteredIds,
              ui: { ...get().ui, lastAppliedPreset: null },
            });
          }
        } catch (error) {
          console.error('Failed to apply preset:', error);
          set((state) => ({
            ui: { ...state.ui, error: 'Failed to apply preset' },
          }));
        }
      },

      // ==================== SELECTORS ====================

      getOrderedDisplayList: (): MicronutrientDisplayEntry[] => {
        try {
          const { selectedIds } = get();

          return selectedIds
            .map(id => {
              const item = MICRONUTRIENT_REGISTRY[id];
              if (!item) {
                console.warn(`Registry item not found for ID: ${id}`);
                return null;
              }

              return {
                id: item.id,
                name: item.name,
                unit: item.unit,
                minimizeFlag: item.minimizeFlag,
                kind: 'builtin' as const,
              };
            })
            .filter(Boolean) as MicronutrientDisplayEntry[];
        } catch (error) {
          console.error('Failed to get ordered display list:', error);
          return [];
        }
      },

      getUncheckedBuiltins: (): MicronutrientDisplayEntry[] => {
        try {
          const { selectedIds } = get();

          return Object.values(MICRONUTRIENT_REGISTRY)
            .filter(item => !selectedIds.includes(item.id))
            .map(item => ({
              id: item.id,
              name: item.name,
              unit: item.unit,
              minimizeFlag: item.minimizeFlag,
              kind: 'builtin' as const,
            }))
            .sort((a, b) => a.name.localeCompare(b.name)); // Alphabetical for unchecked
        } catch (error) {
          console.error('Failed to get unchecked builtins:', error);
          return [];
        }
      },

      // ==================== UI ACTIONS ====================

      setLoading: (loading: boolean) => {
        set((state) => ({
          ui: { ...state.ui, isLoading: loading },
        }));
      },

      setError: (error: string | null) => {
        set((state) => ({
          ui: { ...state.ui, error },
        }));
      },
    }),
    {
      name: 'micronutrients-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist essential data to avoid serialization issues
      partialize: (state) => ({
        selectedIds: state.selectedIds,
        isInitialized: state.isInitialized,
        hasSeenOnboarding: state.hasSeenOnboarding,
        userHasCustomized: state.userHasCustomized,
        ui: {
          lastAppliedPreset: state.ui.lastAppliedPreset,
        },
      }),
      // Add error handling for persistence
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Failed to rehydrate micronutrients store:', error);
        } else if (state) {
          console.log('Micronutrients store rehydrated successfully');
          // Trigger initialization after rehydration
          state.initialize();
        }
      },
    }
  )
);

// ============================================================================
// UTILITY FUNCTIONS & EXPORTS
// ============================================================================

// Helper function to get registry item by ID (no store dependency)
export const getMicronutrientById = (id: number): MicronutrientRegistryItem | null => {
  return MICRONUTRIENT_REGISTRY[id] || null;
};

// Helper function to check if ID exists in registry (no store dependency)
export const isMicronutrientRegistered = (id: number): boolean => {
  return id in MICRONUTRIENT_REGISTRY;
};

// Get all available micronutrients (no store dependency)
export const getAllMicronutrients = (): MicronutrientRegistryItem[] => {
  return Object.values(MICRONUTRIENT_REGISTRY);
};

// Get available presets (no store dependency)
export const getAvailablePresets = (): Record<string, number[]> => {
  return HEALTH_PRESETS;
};

// Export types for external use
export type {
  MicronutrientsState,
  MicronutrientsActions,
  MicronutrientsStore,
};