// src/stores/meal-store.ts
import { create } from 'zustand';

// V0.1 Core Meal Data Types
export interface Meal {
  id: string;
  food_name: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number; // Optional fiber field
  quantity_grams: number;
  logged_at: string;
  
  // V0.2+ AI Integration Fields (Expansion Hooks)
  ai_confidence?: number;
  user_confirmed?: boolean;
  recognition_source?: 'user_input' | 'food_recognition_ai' | 'manual_entry';
  validation_status?: 'pending' | 'validated' | 'needs_review';
  workflow_id?: string; // Links to AI workflow that created this meal
}

export interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

// V0.2+ Workflow Integration Types (Future)
interface MealWorkflow {
  id: string;
  type: 'food_recognition' | 'manual_entry' | 'quick_add';
  status: 'in_progress' | 'completed' | 'failed' | 'needs_user_input';
  userInput: string;
  currentStep: string;
  recognitionResults?: any[];
  selectedFood?: any;
  portionEstimate?: number;
  pendingMeal?: Partial<Meal>;
}

interface MealState {
  // V0.1 Core State
  allMeals: Meal[]; // Store all meals
  todaysMeals: Meal[]; // Computed meals for selected date
  dailyTotals: DailyTotals;
  isLoading: boolean;
  selectedDate: string; // YYYY-MM-DD format
  
  // V0.2+ AI Workflow State (Expansion Hooks)
  activeWorkflows: Record<string, MealWorkflow>;
  pendingValidations: Meal[];
  aiSuggestions: any[];
  
  // V0.1 Core Actions
  addMeal: (meal: Meal) => void;
  updateMeal: (mealId: string, updates: Partial<Meal>) => void;
  removeMeal: (mealId: string) => void;
  setMeals: (meals: Meal[]) => void;
  calculateTotals: () => void;
  setLoading: (loading: boolean) => void;
  setSelectedDate: (date: string) => void;
  
  // V0.2+ AI Workflow Actions (Future Implementation Hooks)
  startFoodRecognitionWorkflow: (userInput: string) => string; // Returns workflow ID
  updateWorkflowStep: (workflowId: string, step: string, data?: any) => void;
  completeWorkflow: (workflowId: string, meal: Meal) => void;
  cancelWorkflow: (workflowId: string) => void;
  confirmAIMeal: (mealId: string) => void;
  requestMealValidation: (mealId: string) => void;
  addAISuggestion: (suggestion: any) => void;
  clearSuggestions: () => void;

  // Date filtering
  getMealsForDate: (date: string) => Meal[];
  refreshSelectedDateMeals: () => void;
}

// Helper function to get local date in YYYY-MM-DD format
function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper function to filter meals by date
function filterMealsByDate(meals: Meal[], targetDate: string): Meal[] {
  return meals.filter(meal => {
    const mealDate = getLocalDateString(new Date(meal.logged_at));
    return mealDate === targetDate;
  });
}

export const useMealStore = create<MealState>((set, get) => ({
  // V0.1 Core State
  allMeals: [],
  todaysMeals: [],
  dailyTotals: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  isLoading: false,
  selectedDate: getLocalDateString(),
  
  // V0.2+ AI Workflow State (Initialize Empty)
  activeWorkflows: {},
  pendingValidations: [],
  aiSuggestions: [],
  
  // V0.1 Core Actions
  addMeal: (meal: Meal) => {
    set((state) => {
      const newAllMeals = [...state.allMeals, meal];
      const selectedDateMeals = filterMealsByDate(newAllMeals, state.selectedDate);
      const newTotals = calculateDailyTotals(selectedDateMeals);
      return {
        allMeals: newAllMeals,
        todaysMeals: selectedDateMeals,
        dailyTotals: newTotals
      };
    });
  },
  
  updateMeal: (mealId: string, updates: Partial<Meal>) => {
    set((state) => {
      const newAllMeals = state.allMeals.map(meal =>
        meal.id === mealId ? { ...meal, ...updates } : meal
      );
      const selectedDateMeals = filterMealsByDate(newAllMeals, state.selectedDate);
      const newTotals = calculateDailyTotals(selectedDateMeals);
      return {
        allMeals: newAllMeals,
        todaysMeals: selectedDateMeals,
        dailyTotals: newTotals
      };
    });
  },
  
  removeMeal: (mealId: string) => {
    set((state) => {
      const newAllMeals = state.allMeals.filter(meal => meal.id !== mealId);
      const selectedDateMeals = filterMealsByDate(newAllMeals, state.selectedDate);
      const newTotals = calculateDailyTotals(selectedDateMeals);
      return {
        allMeals: newAllMeals,
        todaysMeals: selectedDateMeals,
        dailyTotals: newTotals
      };
    });
  },
  
  setMeals: (meals: Meal[]) => {
    set((state) => {
      const selectedDateMeals = filterMealsByDate(meals, state.selectedDate);
      const newTotals = calculateDailyTotals(selectedDateMeals);
      return {
        allMeals: meals,
        todaysMeals: selectedDateMeals,
        dailyTotals: newTotals
      };
    });
  },
  
  calculateTotals: () => {
    set((state) => ({
      dailyTotals: calculateDailyTotals(state.todaysMeals)
    }));
  },
  
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  
  setSelectedDate: (date: string) => {
    set((state) => {
      const selectedDateMeals = filterMealsByDate(state.allMeals, date);
      const newTotals = calculateDailyTotals(selectedDateMeals);
      return {
        selectedDate: date,
        todaysMeals: selectedDateMeals,
        dailyTotals: newTotals
      };
    });
  },
  
  // V0.2+ AI Workflow Actions (Future Implementation)
  startFoodRecognitionWorkflow: (userInput: string) => {
    const workflowId = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newWorkflow: MealWorkflow = {
      id: workflowId,
      type: 'food_recognition',
      status: 'in_progress',
      userInput,
      currentStep: 'parsing_input'
    };
    
    set((state) => ({
      activeWorkflows: {
        ...state.activeWorkflows,
        [workflowId]: newWorkflow
      }
    }));
    
    return workflowId;
  },
  
  updateWorkflowStep: (workflowId: string, step: string, data?: any) => {
    set((state) => ({
      activeWorkflows: {
        ...state.activeWorkflows,
        [workflowId]: {
          ...state.activeWorkflows[workflowId],
          currentStep: step,
          ...data
        }
      }
    }));
  },
  
  completeWorkflow: (workflowId: string, meal: Meal) => {
    // Add the meal and cleanup workflow
    get().addMeal(meal);
    
    set((state) => {
      const { [workflowId]: removed, ...remainingWorkflows } = state.activeWorkflows;
      return {
        activeWorkflows: remainingWorkflows
      };
    });
  },
  
  cancelWorkflow: (workflowId: string) => {
    set((state) => {
      const { [workflowId]: removed, ...remainingWorkflows } = state.activeWorkflows;
      return {
        activeWorkflows: remainingWorkflows
      };
    });
  },
  
  confirmAIMeal: (mealId: string) => {
    get().updateMeal(mealId, { 
      user_confirmed: true,
      validation_status: 'validated'
    });
  },
  
  requestMealValidation: (mealId: string) => {
    const meal = get().todaysMeals.find(m => m.id === mealId);
    if (meal) {
      set((state) => ({
        pendingValidations: [...state.pendingValidations, meal]
      }));
      
      get().updateMeal(mealId, { validation_status: 'pending' });
    }
  },
  
  addAISuggestion: (suggestion: any) => {
    set((state) => ({
      aiSuggestions: [...state.aiSuggestions, suggestion]
    }));
  },
  
  clearSuggestions: () => set({ aiSuggestions: [] }),

  // Date filtering functions
  getMealsForDate: (date: string) => {
    const state = get();
    return filterMealsByDate(state.allMeals, date);
  },

  refreshSelectedDateMeals: () => {
    const state = get();
    const selectedDateMeals = filterMealsByDate(state.allMeals, state.selectedDate);
    const newTotals = calculateDailyTotals(selectedDateMeals);
    set({
      todaysMeals: selectedDateMeals,
      dailyTotals: newTotals
    });
  },
}));

// Helper function for calculating daily totals
function calculateDailyTotals(meals: Meal[]): DailyTotals {
  return meals.reduce(
    (totals, meal) => ({
      calories: totals.calories + meal.calories,
      protein: totals.protein + meal.protein,
      carbs: totals.carbs + meal.carbs,
      fat: totals.fat + meal.fat,
      fiber: totals.fiber + (meal.fiber || 0) // Handle missing fiber field gracefully
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
}

// V0.1 Helper: Simple meal management (maintains current API)
export const useSimpleMeals = () => {
  const store = useMealStore();
  
  return {
    todaysMeals: store.todaysMeals,
    dailyTotals: store.dailyTotals,
    isLoading: store.isLoading,
    addMeal: store.addMeal,
    updateMeal: store.updateMeal,
    removeMeal: store.removeMeal,
    setLoading: store.setLoading
  };
};

// V0.2+ Helper: AI workflow management (Future)
export const useMealWorkflows = () => {
  const store = useMealStore();
  
  return {
    activeWorkflows: store.activeWorkflows,
    pendingValidations: store.pendingValidations,
    aiSuggestions: store.aiSuggestions,
    startFoodRecognitionWorkflow: store.startFoodRecognitionWorkflow,
    updateWorkflowStep: store.updateWorkflowStep,
    completeWorkflow: store.completeWorkflow,
    cancelWorkflow: store.cancelWorkflow,
    confirmAIMeal: store.confirmAIMeal,
    requestMealValidation: store.requestMealValidation
  };
};