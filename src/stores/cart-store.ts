// src/stores/cart-store.ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem, MealItem, FoodLookupResult } from '../services/api/types';

interface CartState {
  // Cart items
  items: CartItem[];

  // Cart metadata
  isVisible: boolean;
  lastUpdated: string | null;

  // Actions
  addToCart: (food: MealItem | FoodLookupResult, quantity: number, unit: string) => void;
  removeFromCart: (foodId: string) => void;
  updateQuantity: (foodId: string, quantity: number) => void;
  updateUnit: (foodId: string, unit: string) => void;
  clearCart: () => Promise<void>;

  // Cart visibility
  showCart: () => void;
  hideCart: () => void;
  toggleCart: () => void;

  // Computed values
  itemCount: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;

  // Utilities
  saveCart: () => Promise<void>;
  loadCart: () => Promise<void>;
  isInCart: (foodId: string) => boolean;
  getCartItem: (foodId: string) => CartItem | undefined;

  // Meal creation
  createMealFromCart: (mealName?: string) => Promise<{ success: boolean; mealId?: string; error?: string }>;
}

const STORAGE_KEY = '@mealmaster_cart';

// Helper function to convert FoodLookupResult to MealItem
const convertFoodLookupToMealItem = (food: FoodLookupResult): MealItem => {
  return {
    id: food.id,
    name: food.name,
    calories: food.nutrition.per100g.calories || 0,
    protein: food.nutrition.per100g.protein || 0,
    carbs: food.nutrition.per100g.carbs || 0,
    fat: food.nutrition.per100g.fat || 0,
    fiber: food.nutrition.per100g.fiber || 0,
    serving_size: food.nutrition.servingSize || '100g',
    source: food.source.api,
    category: food.category || 'ingredient',
    confidence: food.metadata.confidence || 1,
  };
};

// Helper function to calculate nutrition for a specific quantity and unit
const calculateNutritionForQuantity = (food: MealItem, quantity: number, unit: string) => {
  // For now, we'll use a simple conversion assuming the base nutrition is per 100g
  // In a real app, you'd want more sophisticated unit conversions
  let conversionFactor = quantity;

  // Basic unit conversions (expand this as needed)
  if (unit === '100g' || unit === 'per 100g') {
    conversionFactor = quantity;
  } else if (unit === 'g' || unit === 'grams') {
    conversionFactor = quantity / 100;
  } else if (unit === 'serving' || unit === 'servings') {
    // Assume 1 serving = 100g for now
    conversionFactor = quantity;
  } else if (unit === 'cup' || unit === 'cups') {
    // Assume 1 cup = 240g for now
    conversionFactor = (quantity * 240) / 100;
  } else if (unit === 'oz' || unit === 'ounces') {
    // 1 oz = 28.35g
    conversionFactor = (quantity * 28.35) / 100;
  }

  return {
    calories: (food.calories || 0) * conversionFactor,
    protein: (food.protein || 0) * conversionFactor,
    carbs: (food.carbs || 0) * conversionFactor,
    fat: (food.fat || 0) * conversionFactor,
    fiber: (food.fiber || 0) * conversionFactor,
  };
};

export const useCart = create<CartState>((set, get) => ({
  // Initial state
  items: [],
  isVisible: false,
  lastUpdated: null,
  itemCount: 0,
  totalCalories: 0,
  totalProtein: 0,
  totalCarbs: 0,
  totalFat: 0,
  totalFiber: 0,

  // Cart management actions
  addToCart: (food: MealItem | FoodLookupResult, quantity: number, unit: string) => {
    const state = get();

    // Convert FoodLookupResult to MealItem if needed
    const mealItem: MealItem = 'nutrition' in food ? convertFoodLookupToMealItem(food) : food;

    const existingItemIndex = state.items.findIndex(item => item.food.id === mealItem.id);
    const now = new Date().toISOString();

    let newItems: CartItem[];

    if (existingItemIndex >= 0) {
      // Update existing item
      newItems = [...state.items];
      newItems[existingItemIndex] = {
        ...newItems[existingItemIndex],
        quantity,
        unit,
        addedAt: now,
      };
    } else {
      // Add new item
      const newItem: CartItem = {
        food: mealItem,
        quantity,
        unit,
        addedAt: now,
      };
      newItems = [...state.items, newItem];
    }

    // Calculate totals
    const totals = newItems.reduce(
      (acc, item) => {
        const nutrition = calculateNutritionForQuantity(item.food, item.quantity, item.unit);
        return {
          calories: acc.calories + nutrition.calories,
          protein: acc.protein + nutrition.protein,
          carbs: acc.carbs + nutrition.carbs,
          fat: acc.fat + nutrition.fat,
          fiber: acc.fiber + nutrition.fiber,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );

    set({
      items: newItems,
      lastUpdated: now,
      itemCount: newItems.length,
      totalCalories: totals.calories,
      totalProtein: totals.protein,
      totalCarbs: totals.carbs,
      totalFat: totals.fat,
      totalFiber: totals.fiber,
    });

    // Auto-save to storage
    get().saveCart();
  },

  removeFromCart: (foodId: string) => {
    const state = get();
    const newItems = state.items.filter(item => item.food.id !== foodId);
    const now = new Date().toISOString();

    // Recalculate totals
    const totals = newItems.reduce(
      (acc, item) => {
        const nutrition = calculateNutritionForQuantity(item.food, item.quantity, item.unit);
        return {
          calories: acc.calories + nutrition.calories,
          protein: acc.protein + nutrition.protein,
          carbs: acc.carbs + nutrition.carbs,
          fat: acc.fat + nutrition.fat,
          fiber: acc.fiber + nutrition.fiber,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );

    set({
      items: newItems,
      lastUpdated: now,
      itemCount: newItems.length,
      totalCalories: totals.calories,
      totalProtein: totals.protein,
      totalCarbs: totals.carbs,
      totalFat: totals.fat,
      totalFiber: totals.fiber,
    });

    // Auto-save to storage
    get().saveCart();
  },

  updateQuantity: (foodId: string, quantity: number) => {
    const state = get();
    const itemIndex = state.items.findIndex(item => item.food.id === foodId);

    if (itemIndex >= 0) {
      const newItems = [...state.items];
      newItems[itemIndex] = {
        ...newItems[itemIndex],
        quantity,
        addedAt: new Date().toISOString(),
      };

      // Recalculate totals
      const totals = newItems.reduce(
        (acc, item) => {
          const nutrition = calculateNutritionForQuantity(item.food, item.quantity, item.unit);
          return {
            calories: acc.calories + nutrition.calories,
            protein: acc.protein + nutrition.protein,
            carbs: acc.carbs + nutrition.carbs,
            fat: acc.fat + nutrition.fat,
            fiber: acc.fiber + nutrition.fiber,
          };
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
      );

      set({
        items: newItems,
        lastUpdated: new Date().toISOString(),
        totalCalories: totals.calories,
        totalProtein: totals.protein,
        totalCarbs: totals.carbs,
        totalFat: totals.fat,
        totalFiber: totals.fiber,
      });

      // Auto-save to storage
      get().saveCart();
    }
  },

  updateUnit: (foodId: string, unit: string) => {
    const state = get();
    const itemIndex = state.items.findIndex(item => item.food.id === foodId);

    if (itemIndex >= 0) {
      const newItems = [...state.items];
      newItems[itemIndex] = {
        ...newItems[itemIndex],
        unit,
        addedAt: new Date().toISOString(),
      };

      // Recalculate totals
      const totals = newItems.reduce(
        (acc, item) => {
          const nutrition = calculateNutritionForQuantity(item.food, item.quantity, item.unit);
          return {
            calories: acc.calories + nutrition.calories,
            protein: acc.protein + nutrition.protein,
            carbs: acc.carbs + nutrition.carbs,
            fat: acc.fat + nutrition.fat,
            fiber: acc.fiber + nutrition.fiber,
          };
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
      );

      set({
        items: newItems,
        lastUpdated: new Date().toISOString(),
        totalCalories: totals.calories,
        totalProtein: totals.protein,
        totalCarbs: totals.carbs,
        totalFat: totals.fat,
        totalFiber: totals.fiber,
      });

      // Auto-save to storage
      get().saveCart();
    }
  },

  clearCart: async () => {
    set({
      items: [],
      lastUpdated: new Date().toISOString(),
      itemCount: 0,
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalFiber: 0,
    });

    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear cart from storage:', error);
    }
  },

  // Cart visibility
  showCart: () => set({ isVisible: true }),
  hideCart: () => set({ isVisible: false }),
  toggleCart: () => set(state => ({ isVisible: !state.isVisible })),

  // Utilities
  saveCart: async () => {
    const state = get();
    try {
      const cartData = {
        items: state.items,
        lastUpdated: state.lastUpdated,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cartData));
    } catch (error) {
      console.error('Failed to save cart to storage:', error);
    }
  },

  loadCart: async () => {
    try {
      const cartJson = await AsyncStorage.getItem(STORAGE_KEY);
      if (cartJson) {
        const cartData = JSON.parse(cartJson);
        const items = cartData.items || [];

        // Recalculate totals
        const totals = items.reduce(
          (acc: any, item: CartItem) => {
            const nutrition = calculateNutritionForQuantity(item.food, item.quantity, item.unit);
            return {
              calories: acc.calories + nutrition.calories,
              protein: acc.protein + nutrition.protein,
              carbs: acc.carbs + nutrition.carbs,
              fat: acc.fat + nutrition.fat,
              fiber: acc.fiber + nutrition.fiber,
            };
          },
          { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
        );

        set({
          items,
          lastUpdated: cartData.lastUpdated,
          itemCount: items.length,
          totalCalories: totals.calories,
          totalProtein: totals.protein,
          totalCarbs: totals.carbs,
          totalFat: totals.fat,
          totalFiber: totals.fiber,
        });
      }
    } catch (error) {
      console.error('Failed to load cart from storage:', error);
    }
  },

  isInCart: (foodId: string) => {
    return get().items.some(item => item.food.id === foodId);
  },

  getCartItem: (foodId: string) => {
    return get().items.find(item => item.food.id === foodId);
  },

  // Meal creation from cart
  createMealFromCart: async (mealName = 'Custom Meal') => {
    const state = get();

    if (state.items.length === 0) {
      return { success: false, error: 'Cart is empty' };
    }

    try {
      // Import meal store dynamically to avoid circular dependencies
      const { useMealStore } = await import('./meal-store');
      const mealStore = useMealStore.getState();

      const mealId = `meal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Use local timestamp to ensure proper date filtering
      const now = new Date();
      const localTimestamp = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString();

      // Determine meal type based on time of day or use the meal name
      let mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' = 'snack';
      const hour = new Date().getHours();

      if (mealName.toLowerCase().includes('breakfast') || (hour >= 6 && hour < 11)) {
        mealType = 'breakfast';
      } else if (mealName.toLowerCase().includes('lunch') || (hour >= 11 && hour < 16)) {
        mealType = 'lunch';
      } else if (mealName.toLowerCase().includes('dinner') || (hour >= 16 && hour < 22)) {
        mealType = 'dinner';
      }

      // Create a combined meal from all cart items
      const combinedMeal = {
        id: mealId,
        food_name: mealName,
        meal_type: mealType,
        calories: Math.round(state.totalCalories),
        protein: Math.round(state.totalProtein * 10) / 10, // Round to 1 decimal
        carbs: Math.round(state.totalCarbs * 10) / 10,
        fat: Math.round(state.totalFat * 10) / 10,
        fiber: Math.round(state.totalFiber * 10) / 10,
        quantity_grams: state.items.reduce((total, item) => {
          // Convert quantities to grams (rough estimation)
          let gramsEstimate = item.quantity;
          if (item.unit === 'cup' || item.unit === 'cups') {
            gramsEstimate = item.quantity * 240;
          } else if (item.unit === 'oz' || item.unit === 'ounces') {
            gramsEstimate = item.quantity * 28.35;
          } else if (item.unit === 'g' || item.unit === 'grams') {
            gramsEstimate = item.quantity;
          } else {
            gramsEstimate = item.quantity * 100; // Default to 100g per serving
          }
          return total + gramsEstimate;
        }, 0),
        logged_at: localTimestamp,
        recognition_source: 'manual_entry' as const,
        user_confirmed: true,
        validation_status: 'validated' as const,
      };

      console.log('Creating meal from cart:', {
        mealId,
        mealName,
        items: state.items.length,
        totalCalories: state.totalCalories,
        totalProtein: state.totalProtein,
        totalCarbs: state.totalCarbs,
        totalFat: state.totalFat,
        combinedMeal,
      });

      // Add the meal to the meal store
      mealStore.addMeal(combinedMeal);

      // Clear cart after creating meal
      await get().clearCart();

      return { success: true, mealId };
    } catch (error) {
      console.error('Failed to create meal from cart:', error);
      return { success: false, error: 'Failed to create meal' };
    }
  },
}));

// Initialize cart on module load
useCart.getState().loadCart();