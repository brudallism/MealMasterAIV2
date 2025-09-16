// src/stores/meal-store.ts
import { create } from 'zustand';

// Import CartItem type from cart-store
import type { CartItem } from './cart-store';

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
  eaten?: boolean; // Track if meal was actually eaten

  // Enhanced architecture for ingredients storage
  original_ingredients?: CartItem[]; // Store individual ingredients for copy/recipe features

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
  micronutrients: {
    vitamin_c: number;
    vitamin_d: number;
    vitamin_b12: number;
    folate: number;
    iron: number;
    calcium: number;
    magnesium: number;
    potassium: number;
    zinc: number;
    omega_3: number;
    vitamin_a: number;
    vitamin_k: number;
  };
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
  todaysMeals: Meal[]; // Meals for currently selected date
  allMeals: Record<string, Meal[]>; // All meals organized by date (YYYY-MM-DD)
  dailyTotals: DailyTotals;
  projectedTotals: DailyTotals; // For future dates with planned meals
  isLoading: boolean;
  selectedDate: string; // YYYY-MM-DD format
  isInitialized: boolean; // Track if mock data has been initialized

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

  // Calendar-specific actions
  getMealsForDate: (date: string) => Meal[];
  addMealToDate: (meal: Meal, date: string) => void;
  getTotalsForDate: (date: string, includeProjected?: boolean) => DailyTotals;
  initializeMockData: () => void;
  
  // V0.2+ AI Workflow Actions (Future Implementation Hooks)
  startFoodRecognitionWorkflow: (userInput: string) => string; // Returns workflow ID
  updateWorkflowStep: (workflowId: string, step: string, data?: any) => void;
  completeWorkflow: (workflowId: string, meal: Meal) => void;
  cancelWorkflow: (workflowId: string) => void;
  confirmAIMeal: (mealId: string) => void;
  requestMealValidation: (mealId: string) => void;
  addAISuggestion: (suggestion: any) => void;
  clearSuggestions: () => void;
}

export const useMealStore = create<MealState>((set, get) => ({
  // V0.1 Core State
  todaysMeals: [],
  allMeals: {}, // Initialize empty meals storage
  dailyTotals: {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    micronutrients: {
      vitamin_c: 0,
      vitamin_d: 0,
      vitamin_b12: 0,
      folate: 0,
      iron: 0,
      calcium: 0,
      magnesium: 0,
      potassium: 0,
      zinc: 0,
      omega_3: 0,
      vitamin_a: 0,
      vitamin_k: 0,
    }
  },
  projectedTotals: {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    micronutrients: {
      vitamin_c: 0,
      vitamin_d: 0,
      vitamin_b12: 0,
      folate: 0,
      iron: 0,
      calcium: 0,
      magnesium: 0,
      potassium: 0,
      zinc: 0,
      omega_3: 0,
      vitamin_a: 0,
      vitamin_k: 0,
    }
  },
  isLoading: false,
  selectedDate: (() => {
    const today = new Date();
    return today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');
  })(),
  isInitialized: false,

  // V0.2+ AI Workflow State (Initialize Empty)
  activeWorkflows: {},
  pendingValidations: [],
  aiSuggestions: [],
  
  // V0.1 Core Actions
  addMeal: (meal: Meal) => {
    const { selectedDate } = get();
    get().addMealToDate(meal, selectedDate);
  },

  updateMeal: (mealId: string, updates: Partial<Meal>) => {
    set((state) => {
      const currentDate = state.selectedDate;
      const updatedAllMeals = { ...state.allMeals };

      // Update in all meals storage
      if (updatedAllMeals[currentDate]) {
        updatedAllMeals[currentDate] = updatedAllMeals[currentDate].map(meal =>
          meal.id === mealId ? { ...meal, ...updates } : meal
        );
      }

      // Update current day's meals
      const newTodaysMeals = state.todaysMeals.map(meal =>
        meal.id === mealId ? { ...meal, ...updates } : meal
      );

      const newTotals = get().getTotalsForDate(currentDate);

      return {
        allMeals: updatedAllMeals,
        todaysMeals: newTodaysMeals,
        dailyTotals: newTotals
      };
    });
  },

  removeMeal: (mealId: string) => {
    set((state) => {
      const currentDate = state.selectedDate;
      const updatedAllMeals = { ...state.allMeals };

      // Remove from all meals storage
      if (updatedAllMeals[currentDate]) {
        updatedAllMeals[currentDate] = updatedAllMeals[currentDate].filter(meal => meal.id !== mealId);
      }

      // Remove from current day's meals
      const newTodaysMeals = state.todaysMeals.filter(meal => meal.id !== mealId);
      const newTotals = calculateDailyTotals(newTodaysMeals);

      return {
        allMeals: updatedAllMeals,
        todaysMeals: newTodaysMeals,
        dailyTotals: newTotals
      };
    });
  },

  setMeals: (meals: Meal[]) => {
    const { selectedDate } = get();
    set((state) => {
      const updatedAllMeals = { ...state.allMeals };
      updatedAllMeals[selectedDate] = meals;

      const newTotals = calculateDailyTotals(meals);
      return {
        allMeals: updatedAllMeals,
        todaysMeals: meals,
        dailyTotals: newTotals
      };
    });
  },

  calculateTotals: () => {
    const { selectedDate } = get();
    const totals = get().getTotalsForDate(selectedDate);
    set({ dailyTotals: totals });
  },

  setLoading: (loading: boolean) => set({ isLoading: loading }),

  setSelectedDate: (date: string) => {
    const mealsForDate = get().getMealsForDate(date);
    const totalsForDate = get().getTotalsForDate(date);
    set({
      selectedDate: date,
      todaysMeals: mealsForDate,
      dailyTotals: totalsForDate
    });
  },

  // Calendar-specific actions
  getMealsForDate: (date: string) => {
    const { allMeals } = get();
    return allMeals[date] || [];
  },

  addMealToDate: (meal: Meal, date: string) => {
    set((state) => {
      const updatedAllMeals = { ...state.allMeals };
      if (!updatedAllMeals[date]) {
        updatedAllMeals[date] = [];
      }
      updatedAllMeals[date] = [...updatedAllMeals[date], meal];

      // Update current view if this is the selected date
      const isSelectedDate = date === state.selectedDate;
      const newTodaysMeals = isSelectedDate ? updatedAllMeals[date] : state.todaysMeals;
      const newTotals = isSelectedDate ? calculateDailyTotals(newTodaysMeals) : state.dailyTotals;

      return {
        allMeals: updatedAllMeals,
        todaysMeals: newTodaysMeals,
        dailyTotals: newTotals
      };
    });
  },

  getTotalsForDate: (date: string, includeProjected: boolean = false) => {
    const mealsForDate = get().getMealsForDate(date);
    const today = new Date().toISOString().split('T')[0];
    const isFutureDate = date > today;

    if (isFutureDate && includeProjected) {
      // For future dates, include all planned meals (both eaten and not eaten)
      return calculateDailyTotals(mealsForDate, true);
    } else {
      // For past/current dates, only include eaten meals
      return calculateDailyTotals(mealsForDate, false);
    }
  },

  initializeMockData: () => {
    const state = get();
    // Only initialize if not already done
    if (state.isInitialized) return;

    const today = new Date();
    const mockMeals: Record<string, Meal[]> = {};

    // Generate mock data for 7 days (3 past, today, 3 future)
    for (let i = -3; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      // Use timezone-safe date formatting
      const dateString = date.getFullYear() + '-' +
        String(date.getMonth() + 1).padStart(2, '0') + '-' +
        String(date.getDate()).padStart(2, '0');

      const isFutureDate = i > 0;
      const isToday = i === 0;

      // Create realistic meals for each day
      const dayMeals: Meal[] = [
        {
          id: `${dateString}_breakfast`,
          food_name: `${isToday ? 'Oatmeal with berries' : i < 0 ? 'Greek yogurt parfait' : 'Planned smoothie bowl'}`,
          meal_type: 'breakfast',
          calories: 320 + (i * 20),
          protein: 12 + (i * 2),
          carbs: 45 + (i * 3),
          fat: 8 + (i * 1),
          fiber: 6,
          quantity_grams: 250,
          logged_at: new Date(date.setHours(8, 30)).toISOString(),
          eaten: !isFutureDate, // Past and today are eaten, future are planned
          recognition_source: 'manual_entry',
        },
        {
          id: `${dateString}_lunch`,
          food_name: `${isToday ? 'Grilled chicken salad' : i < 0 ? 'Turkey sandwich' : 'Planned Buddha bowl'}`,
          meal_type: 'lunch',
          calories: 420 + (i * 25),
          protein: 28 + (i * 3),
          carbs: 35 + (i * 2),
          fat: 18 + (i * 2),
          fiber: 8,
          quantity_grams: 300,
          logged_at: new Date(date.setHours(12, 45)).toISOString(),
          eaten: !isFutureDate,
          recognition_source: 'manual_entry',
        },
        {
          id: `${dateString}_dinner`,
          food_name: `${isToday ? 'Salmon with quinoa' : i < 0 ? 'Pasta with vegetables' : 'Planned stir-fry'}`,
          meal_type: 'dinner',
          calories: 550 + (i * 30),
          protein: 35 + (i * 4),
          carbs: 40 + (i * 3),
          fat: 22 + (i * 2),
          fiber: 7,
          quantity_grams: 350,
          logged_at: new Date(date.setHours(19, 15)).toISOString(),
          eaten: !isFutureDate,
          recognition_source: 'manual_entry',
        },
      ];

      // Add a snack for some days
      if (i % 2 === 0) {
        dayMeals.push({
          id: `${dateString}_snack`,
          food_name: `${isToday ? 'Apple with almond butter' : i < 0 ? 'Mixed nuts' : 'Planned protein bar'}`,
          meal_type: 'snack',
          calories: 180 + (i * 10),
          protein: 6 + (i * 1),
          carbs: 15 + (i * 1),
          fat: 12 + (i * 1),
          fiber: 4,
          quantity_grams: 80,
          logged_at: new Date(date.setHours(15, 30)).toISOString(),
          eaten: !isFutureDate,
          recognition_source: 'manual_entry',
        });
      }

      mockMeals[dateString] = dayMeals;
    }

    // Update store with mock data and mark as initialized
    const currentSelectedDate = get().selectedDate;
    set({
      allMeals: mockMeals,
      todaysMeals: mockMeals[currentSelectedDate] || [],
      dailyTotals: calculateDailyTotals(mockMeals[currentSelectedDate] || []),
      isInitialized: true
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
  
  clearSuggestions: () => set({ aiSuggestions: [] })
}));

// Helper function for calculating daily totals
function calculateDailyTotals(meals: Meal[], includeProjected: boolean = false): DailyTotals {
  // For projected totals, include all meals; otherwise only eaten meals
  const relevantMeals = includeProjected ? meals : meals.filter(meal => meal.eaten === true);

  return relevantMeals.reduce(
    (totals, meal) => ({
      calories: totals.calories + meal.calories,
      protein: totals.protein + meal.protein,
      carbs: totals.carbs + meal.carbs,
      fat: totals.fat + meal.fat,
      fiber: totals.fiber + (meal.fiber || 0), // Handle missing fiber field gracefully
      micronutrients: {
        // For now, return mock/demo data since we don't have micronutrient tracking in meals yet
        // In future versions, this would aggregate from meal micronutrient data
        vitamin_c: totals.micronutrients.vitamin_c + (meal.calories * 0.03), // ~3% of calories as vitamin C mock
        vitamin_d: totals.micronutrients.vitamin_d + (meal.calories * 0.15), // Mock vitamin D based on calories
        vitamin_b12: totals.micronutrients.vitamin_b12 + (meal.protein * 0.02), // Mock B12 based on protein
        folate: totals.micronutrients.folate + (meal.calories * 0.08), // Mock folate
        iron: totals.micronutrients.iron + (meal.protein * 0.1), // Mock iron based on protein
        calcium: totals.micronutrients.calcium + (meal.calories * 0.2), // Mock calcium
        magnesium: totals.micronutrients.magnesium + (meal.calories * 0.06), // Mock magnesium
        potassium: totals.micronutrients.potassium + (meal.calories * 0.8), // Mock potassium
        zinc: totals.micronutrients.zinc + (meal.protein * 0.08), // Mock zinc based on protein
        omega_3: totals.micronutrients.omega_3 + (meal.fat * 2), // Mock omega-3 based on fat
        vitamin_a: totals.micronutrients.vitamin_a + (meal.calories * 0.2), // Mock vitamin A
        vitamin_k: totals.micronutrients.vitamin_k + (meal.calories * 0.03), // Mock vitamin K
      }
    }),
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      micronutrients: {
        vitamin_c: 0,
        vitamin_d: 0,
        vitamin_b12: 0,
        folate: 0,
        iron: 0,
        calcium: 0,
        magnesium: 0,
        potassium: 0,
        zinc: 0,
        omega_3: 0,
        vitamin_a: 0,
        vitamin_k: 0,
      }
    }
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