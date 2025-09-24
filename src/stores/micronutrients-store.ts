// src/stores/micronutrients-store.ts
// Comprehensive micronutrient tracking store with V2.0 engine integration

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { computeMicros, type MicronutrientProfile, type PrimaryGoal, type Modifier, type MicronutrientRow } from '../services/micros/engine';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface MicronutrientRegistryItem {
  id: number; // USDA FDC nutrient ID
  name: string;
  unit: 'g' | 'mg' | 'µg' | 'kcal' | 'IU' | string;
  category: 'vitamin' | 'mineral' | 'macro_other' | 'special' | 'amino_acid' | 'fatty_acid';
  minimizeFlag: boolean; // True for nutrients to minimize (trans fats, sodium)
}

export interface MicronutrientCalculationResult {
  nutrients: MicronutrientRow[];
  coverage: {
    tracked: number;
    available: number;
    percentage: number;
  };
  lastCalculated: string;
  profileSnapshot: {
    sex: 'male' | 'female' | 'other';
    age_years: number;
    life_stage: string;
    kcal_target: number;
    primary_goal: PrimaryGoal;
    modifiers: Modifier[];
  };
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

  // Calculation results from V2.0 engine
  calculationResult: MicronutrientCalculationResult | null;
  needsRecalculation: boolean;
  recomputePolicy: {
    lastProfileHash: string | null;
    lastGoalHash: string | null;
  };

  // Onboarding and user customization tracking
  hasSeenOnboarding: boolean; // For future onboarding flow
  userHasCustomized: boolean; // Distinguishes auto-applied vs user-chosen

  // UI state
  ui: {
    lastAppliedPreset: string | null;
    isLoading: boolean;
    error: string | null;
    showCoverage: boolean; // Show "—" for missing data and % coverage
  };
}

// Store actions interface
interface MicronutrientsActions {
  // Initialization
  initialize: () => void;

  // V2.0 Engine Integration
  calculateMicronutrients: (profile: MicronutrientProfile, kcalTarget: number, primaryGoal: PrimaryGoal, modifiers?: Modifier[]) => Promise<void>;
  checkRecomputePolicy: (profile: MicronutrientProfile, primaryGoal: PrimaryGoal, modifiers?: Modifier[]) => boolean;
  forceRecalculation: () => void;

  // Selection management
  toggleSelect: (id: number) => void;
  reorderSelected: (fromIndex: number, toIndex: number) => void;

  // Preset management
  applyPreset: (presetKey: string, enabled: boolean) => void;

  // Selectors (computed)
  getOrderedDisplayList: () => MicronutrientDisplayEntry[];
  getUncheckedBuiltins: () => MicronutrientDisplayEntry[];
  getCalculatedNutrients: () => MicronutrientRow[];
  getCoverageMetrics: () => { tracked: number; available: number; percentage: number } | null;
  getHighlightedNutrients: () => MicronutrientRow[];
  getMinimizeNutrients: () => MicronutrientRow[];

  // UI actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleCoverageView: () => void;
}

type MicronutrientsStore = MicronutrientsState & MicronutrientsActions;

// ============================================================================
// REGISTRY SEED DATA - MOVED OUTSIDE STORE FOR STABILITY
// ============================================================================

// V2.0 Comprehensive micronutrient registry - dynamically populated from engine
const createMicronutrientRegistry = (): Record<number, MicronutrientRegistryItem> => {
  // Core minimization nutrients based on engine minimize flags
  const minimizeNutrients = new Set([1257, 1093, 1235, 1258, 1253]); // Trans fat, Sodium, Added sugars, Sat fat, Cholesterol

  // Categorize nutrients by USDA FDC ID ranges and known classifications
  const categorizeNutrient = (id: number, name: string): MicronutrientRegistryItem['category'] => {
    if ([208, 203, 205, 204, 291].includes(id)) return 'macro_other';
    if (id >= 1087 && id <= 1103) return 'mineral';
    if (id >= 1106 && id <= 1185) return 'vitamin';
    if ([1257, 1258, 1235, 1253].includes(id)) return 'macro_other';
    if ([1404, 1269].includes(id)) return 'fatty_acid';
    if ([1210, 1211, 1212].includes(id)) return 'amino_acid';
    if ([1180, 1181].includes(id)) return 'special';
    return 'special';
  };

  const registry: Record<number, MicronutrientRegistryItem> = {};

  // Generate comprehensive registry from our V2.0 engine data
  // This would normally be populated from the RDA table, but for now we'll use known nutrients
  const knownNutrients = [
    // Macros
    { id: 208, name: 'Calories', unit: 'kcal' },
    { id: 203, name: 'Protein', unit: 'g' },
    { id: 205, name: 'Carbohydrates', unit: 'g' },
    { id: 204, name: 'Total Fat', unit: 'g' },
    { id: 291, name: 'Fiber', unit: 'g' },
    { id: 1235, name: 'Added Sugars', unit: 'g' },
    { id: 1257, name: 'Trans Fatty Acids', unit: 'g' },
    { id: 1258, name: 'Saturated Fat', unit: 'g' },
    { id: 1253, name: 'Cholesterol', unit: 'mg' },

    // Minerals
    { id: 1087, name: 'Calcium', unit: 'mg' },
    { id: 1089, name: 'Iron', unit: 'mg' },
    { id: 1090, name: 'Magnesium', unit: 'mg' },
    { id: 1091, name: 'Phosphorus', unit: 'mg' },
    { id: 1092, name: 'Potassium', unit: 'mg' },
    { id: 1093, name: 'Sodium', unit: 'mg' },
    { id: 1095, name: 'Zinc', unit: 'mg' },
    { id: 1096, name: 'Chromium', unit: 'µg' },
    { id: 1098, name: 'Copper', unit: 'mg' },
    { id: 1099, name: 'Fluoride', unit: 'mg' },
    { id: 1100, name: 'Iodine', unit: 'µg' },
    { id: 1101, name: 'Manganese', unit: 'mg' },
    { id: 1102, name: 'Molybdenum', unit: 'µg' },
    { id: 1103, name: 'Selenium', unit: 'µg' },

    // Vitamins
    { id: 1106, name: 'Vitamin A', unit: 'µg' },
    { id: 1109, name: 'Vitamin E', unit: 'mg' },
    { id: 1114, name: 'Vitamin D', unit: 'µg' },
    { id: 1162, name: 'Vitamin C', unit: 'mg' },
    { id: 1165, name: 'Thiamin (B1)', unit: 'mg' },
    { id: 1166, name: 'Riboflavin (B2)', unit: 'mg' },
    { id: 1167, name: 'Niacin (B3)', unit: 'mg' },
    { id: 1170, name: 'Pantothenic Acid (B5)', unit: 'mg' },
    { id: 1175, name: 'Vitamin B6', unit: 'mg' },
    { id: 1176, name: 'Biotin (B7)', unit: 'µg' },
    { id: 1177, name: 'Folate', unit: 'µg' },
    { id: 1178, name: 'Vitamin B12', unit: 'µg' },
    { id: 1180, name: 'Choline', unit: 'mg' },
    { id: 1181, name: 'Betaine', unit: 'mg' },
    { id: 1185, name: 'Vitamin K', unit: 'µg' },

    // Fatty Acids
    { id: 1269, name: 'Linoleic Acid', unit: 'g' },
    { id: 1404, name: 'Alpha-Linolenic Acid', unit: 'g' },

    // Amino Acids
    { id: 1210, name: 'Tryptophan', unit: 'mg' },
    { id: 1211, name: 'Threonine', unit: 'mg' },
    { id: 1212, name: 'Methionine', unit: 'mg' },
  ];

  knownNutrients.forEach(nutrient => {
    registry[nutrient.id] = {
      id: nutrient.id,
      name: nutrient.name,
      unit: nutrient.unit,
      category: categorizeNutrient(nutrient.id, nutrient.name),
      minimizeFlag: minimizeNutrients.has(nutrient.id),
    };
  });

  return registry;
};

const MICRONUTRIENT_REGISTRY = createMicronutrientRegistry();

// ============================================================================
// PRESET DEFINITIONS
// ============================================================================

const HEALTH_PRESETS: Record<string, number[]> = {
  'Essential Nutrients': [
    // Minimize flags first
    1235, // Added Sugars
    1093, // Sodium
    1257, // Trans Fat
    // Key minerals
    1087, // Calcium
    1089, // Iron
    1090, // Magnesium
    1092, // Potassium
    1095, // Zinc
    // Key vitamins
    1106, // Vitamin A
    1162, // Vitamin C
    1114, // Vitamin D
    1185, // Vitamin K
    1178, // Vitamin B12
    1177, // Folate
  ],
  'Heart Health': [
    1093, // Sodium (minimize)
    1092, // Potassium
    1257, // Trans Fat (minimize)
    1258, // Saturated Fat (minimize)
    1253, // Cholesterol (minimize)
    1090, // Magnesium
    291,  // Fiber
    1269, // Linoleic Acid
    1404, // Alpha-Linolenic Acid
  ],
  'Bone Health': [
    1087, // Calcium
    1114, // Vitamin D
    1090, // Magnesium
    1091, // Phosphorus
    1185, // Vitamin K
  ],
  'Immune Support': [
    1162, // Vitamin C
    1095, // Zinc
    1106, // Vitamin A
    1114, // Vitamin D
    1103, // Selenium
    1089, // Iron
  ],
  'Energy & B-Complex': [
    1165, // Thiamin (B1)
    1166, // Riboflavin (B2)
    1167, // Niacin (B3)
    1170, // Pantothenic Acid (B5)
    1175, // Vitamin B6
    1177, // Folate
    1178, // Vitamin B12
    1176, // Biotin (B7)
    1089, // Iron
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
      calculationResult: null,
      needsRecalculation: true,
      recomputePolicy: {
        lastProfileHash: null,
        lastGoalHash: null,
      },
      hasSeenOnboarding: false, // For future onboarding flow
      userHasCustomized: false, // Track if user has made any customizations
      ui: {
        lastAppliedPreset: null,
        isLoading: false,
        error: null,
        showCoverage: true, // Default to showing coverage metrics
      },

      // ==================== ACTIONS ====================

      initialize: () => {
        try {
          const { selectedIds, isInitialized } = get();

          // Only initialize once
          if (isInitialized) return;

          // If no selection exists, apply default preset
          if (selectedIds.length === 0) {
            const defaultIds = HEALTH_PRESETS['Essential Nutrients'] || [];
            set({
              selectedIds: defaultIds,
              isInitialized: true,
              ui: { ...get().ui, lastAppliedPreset: 'Essential Nutrients' },
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

      // ==================== V2.0 ENGINE INTEGRATION ====================

      calculateMicronutrients: async (profile: MicronutrientProfile, kcalTarget: number, primaryGoal: PrimaryGoal, modifiers: Modifier[] = []) => {
        try {
          set({ ui: { ...get().ui, isLoading: true, error: null } });

          console.group('🧪 Store: Calculating Micronutrients');
          console.log('Profile:', profile);
          console.log('Goal:', primaryGoal, 'Modifiers:', modifiers);

          const nutrients = computeMicros(profile, kcalTarget, primaryGoal, modifiers);

          // Calculate coverage metrics
          const availableNutrients = Object.keys(MICRONUTRIENT_REGISTRY).length;
          const trackedNutrients = nutrients.length;
          const coverage = {
            tracked: trackedNutrients,
            available: availableNutrients,
            percentage: Math.round((trackedNutrients / availableNutrients) * 100),
          };

          // Create profile hash for recompute policy
          const profileHash = JSON.stringify({
            sex: profile.sex,
            age: profile.age_years,
            life_stage: profile.life_stage,
          });
          const goalHash = JSON.stringify({ primaryGoal, modifiers });

          const result: MicronutrientCalculationResult = {
            nutrients,
            coverage,
            lastCalculated: new Date().toISOString(),
            profileSnapshot: {
              sex: profile.sex,
              age_years: profile.age_years,
              life_stage: profile.life_stage,
              kcal_target: kcalTarget,
              primary_goal: primaryGoal,
              modifiers,
            },
          };

          console.log('Calculation complete:', {
            nutrientsCount: nutrients.length,
            coverage: `${coverage.tracked}/${coverage.available} (${coverage.percentage}%)`,
          });
          console.groupEnd();

          set({
            calculationResult: result,
            needsRecalculation: false,
            recomputePolicy: {
              lastProfileHash: profileHash,
              lastGoalHash: goalHash,
            },
            ui: { ...get().ui, isLoading: false },
          });
        } catch (error) {
          console.error('Failed to calculate micronutrients:', error);
          set({
            ui: { ...get().ui, isLoading: false, error: 'Calculation failed' },
          });
        }
      },

      checkRecomputePolicy: (profile: MicronutrientProfile, primaryGoal: PrimaryGoal, modifiers: Modifier[] = []) => {
        const state = get();

        // Always recalculate if no previous calculation
        if (!state.calculationResult || state.needsRecalculation) {
          return true;
        }

        // Create current hashes
        const currentProfileHash = JSON.stringify({
          sex: profile.sex,
          age: profile.age_years,
          life_stage: profile.life_stage,
        });
        const currentGoalHash = JSON.stringify({ primaryGoal, modifiers });

        // Check for policy changes (profile or goal changes)
        if (state.recomputePolicy.lastProfileHash !== currentProfileHash ||
            state.recomputePolicy.lastGoalHash !== currentGoalHash) {
          console.log('Recompute needed: Profile or goal changed');
          return true;
        }

        // Check age (calculation older than 24 hours as safety)
        const lastCalculated = new Date(state.calculationResult.lastCalculated);
        const hoursAgo = (Date.now() - lastCalculated.getTime()) / (1000 * 60 * 60);
        if (hoursAgo > 24) {
          console.log('Recompute needed: Calculation older than 24 hours');
          return true;
        }

        return false;
      },

      forceRecalculation: () => {
        set({ needsRecalculation: true });
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

      getCalculatedNutrients: () => {
        const state = get();
        return state.calculationResult?.nutrients || [];
      },

      getCoverageMetrics: () => {
        const state = get();
        return state.calculationResult?.coverage || null;
      },

      getHighlightedNutrients: () => {
        const state = get();
        if (!state.calculationResult) return [];
        return state.calculationResult.nutrients.filter(n => n.flags.highlight);
      },

      getMinimizeNutrients: () => {
        const state = get();
        if (!state.calculationResult) return [];
        return state.calculationResult.nutrients.filter(n => n.flags.minimize);
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

      toggleCoverageView: () => {
        set((state) => ({
          ui: { ...state.ui, showCoverage: !state.ui.showCoverage },
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
        calculationResult: state.calculationResult, // Persist calculation results
        recomputePolicy: state.recomputePolicy, // Persist recompute policy state
        ui: {
          lastAppliedPreset: state.ui.lastAppliedPreset,
          showCoverage: state.ui.showCoverage,
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