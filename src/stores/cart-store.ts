// src/stores/cart-store.ts
import { create } from 'zustand';
import { FoodLookupResult, BasketItem, NutrientInfo } from '../services/api/types';

interface CartState {
  // Cart items
  items: BasketItem[];

  // Meal context
  currentMealName: string;
  currentMealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | '';

  // Actions
  addToCart: (food: FoodLookupResult, quantity?: number, unit?: string) => void;
  removeFromCart: (fdcId: number) => void;
  updateQuantity: (fdcId: number, quantity: number) => void;
  updateUnit: (fdcId: number, unit: string) => void;
  updateNotes: (fdcId: number, notes: string) => void;
  clearCart: () => void;

  // Meal management
  setMealName: (name: string) => void;
  setMealType: (type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | '') => void;

  // Computed values
  itemCount: number;
  totalNutrition: NutrientInfo;

  // Helper functions
  getItemById: (fdcId: number) => BasketItem | undefined;
  isInCart: (fdcId: number) => boolean;
}

// Helper function to calculate basic nutrition from food
const calculateNutrition = (food: FoodLookupResult, quantity: number = 1): NutrientInfo => {
  const defaultNutrition: NutrientInfo = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0
  };

  if (!food.foodNutrients || !Array.isArray(food.foodNutrients)) {
    return defaultNutrition;
  }

  // Find nutrients by number (USDA standard nutrient IDs)
  const findNutrient = (nutrientNumber: string) => {
    return food.foodNutrients.find(n => n.nutrientNumber === nutrientNumber);
  };

  const calories = findNutrient('208'); // Energy
  const protein = findNutrient('203'); // Protein
  const carbs = findNutrient('205'); // Carbohydrate
  const fat = findNutrient('204'); // Total lipid (fat)
  const fiber = findNutrient('291'); // Fiber
  const sugar = findNutrient('269'); // Sugars, total
  const sodium = findNutrient('307'); // Sodium

  return {
    calories: (calories?.value || 0) * quantity,
    protein: (protein?.value || 0) * quantity,
    carbs: (carbs?.value || 0) * quantity,
    fat: (fat?.value || 0) * quantity,
    fiber: (fiber?.value || 0) * quantity,
    sugar: (sugar?.value || 0) * quantity,
    sodium: (sodium?.value || 0) * quantity
  };
};

export const useCartStore = create<CartState>((set, get) => ({
  // Initial state
  items: [],
  currentMealName: '',
  currentMealType: '',
  itemCount: 0,
  totalNutrition: {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0
  },

  // Cart actions
  addToCart: (food: FoodLookupResult, quantity = 1, unit = 'serving') => {
    set((state) => {
      const existingItem = state.items.find(item => item.food.fdcId === food.fdcId);

      if (existingItem) {
        // Update existing item quantity
        const updatedItems = state.items.map(item =>
          item.food.fdcId === food.fdcId
            ? {
                ...item,
                quantity: item.quantity + quantity,
                nutrition: calculateNutrition(food, item.quantity + quantity)
              }
            : item
        );

        return {
          items: updatedItems,
          itemCount: updatedItems.length,
          totalNutrition: calculateTotalNutrition(updatedItems)
        };
      } else {
        // Add new item
        const newItem: BasketItem = {
          food,
          quantity,
          unit,
          nutrition: calculateNutrition(food, quantity)
        };

        const updatedItems = [...state.items, newItem];

        return {
          items: updatedItems,
          itemCount: updatedItems.length,
          totalNutrition: calculateTotalNutrition(updatedItems)
        };
      }
    });
  },

  removeFromCart: (fdcId: number) => {
    set((state) => {
      const updatedItems = state.items.filter(item => item.food.fdcId !== fdcId);
      return {
        items: updatedItems,
        itemCount: updatedItems.length,
        totalNutrition: calculateTotalNutrition(updatedItems)
      };
    });
  },

  updateQuantity: (fdcId: number, quantity: number) => {
    set((state) => {
      const updatedItems = state.items.map(item =>
        item.food.fdcId === fdcId
          ? {
              ...item,
              quantity,
              nutrition: calculateNutrition(item.food, quantity)
            }
          : item
      );

      return {
        items: updatedItems,
        totalNutrition: calculateTotalNutrition(updatedItems)
      };
    });
  },

  updateUnit: (fdcId: number, unit: string) => {
    set((state) => ({
      items: state.items.map(item =>
        item.food.fdcId === fdcId ? { ...item, unit } : item
      )
    }));
  },

  updateNotes: (fdcId: number, notes: string) => {
    set((state) => ({
      items: state.items.map(item =>
        item.food.fdcId === fdcId ? { ...item, notes } : item
      )
    }));
  },

  clearCart: () => {
    set({
      items: [],
      itemCount: 0,
      totalNutrition: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0
      }
    });
  },

  // Meal management
  setMealName: (name: string) => set({ currentMealName: name }),

  setMealType: (type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | '') =>
    set({ currentMealType: type }),

  // Helper functions
  getItemById: (fdcId: number) => {
    return get().items.find(item => item.food.fdcId === fdcId);
  },

  isInCart: (fdcId: number) => {
    return get().items.some(item => item.food.fdcId === fdcId);
  }
}));

// Helper function to calculate total nutrition from all cart items
const calculateTotalNutrition = (items: BasketItem[]): NutrientInfo => {
  return items.reduce((total, item) => ({
    calories: total.calories + item.nutrition.calories,
    protein: total.protein + item.nutrition.protein,
    carbs: total.carbs + item.nutrition.carbs,
    fat: total.fat + item.nutrition.fat,
    fiber: (total.fiber || 0) + (item.nutrition.fiber || 0),
    sugar: (total.sugar || 0) + (item.nutrition.sugar || 0),
    sodium: (total.sodium || 0) + (item.nutrition.sodium || 0)
  }), {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0
  });
};

// Export a hook for easier use
export const useCart = () => {
  const store = useCartStore();

  return {
    items: store.items,
    itemCount: store.itemCount,
    totalNutrition: store.totalNutrition,
    currentMealName: store.currentMealName,
    currentMealType: store.currentMealType,
    addToCart: store.addToCart,
    removeFromCart: store.removeFromCart,
    updateQuantity: store.updateQuantity,
    updateUnit: store.updateUnit,
    updateNotes: store.updateNotes,
    clearCart: store.clearCart,
    setMealName: store.setMealName,
    setMealType: store.setMealType,
    getItemById: store.getItemById,
    isInCart: store.isInCart
  };
};